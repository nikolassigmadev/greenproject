// ── Postgres scan store ──
// Records each AI product analysis (full OpenAI response + metadata) to Postgres.
// Works against any Postgres connection string — Supabase, Neon, Railway, Aiven —
// via the single DATABASE_URL env var. No lock-in to any one provider.
//
// Loaded defensively, exactly like the SQLite analytics DB in server.js: if
// DATABASE_URL is unset or the database is unreachable, logging is disabled and
// the rest of the server keeps running. Inserts are fire-and-forget — they never
// block the HTTP response and never throw into the request handler.
//
// Set up: create a Postgres DB (e.g. a Supabase project), copy its connection
// string into DATABASE_URL, and restart the server. The table is created
// automatically on startup; db/schema.sql mirrors it for manual setup.

import pkg from 'pg';

const { Pool } = pkg;

let pool = null;
let ready = false;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS ai_scans (
  id              BIGSERIAL PRIMARY KEY,
  user_id         TEXT,
  source          TEXT,
  product_name    TEXT,
  brand           TEXT,
  barcode         TEXT,
  eco_grade       TEXT,
  country         TEXT,
  city            TEXT,
  off_url         TEXT,
  openai_response TEXT,
  full_openai_response TEXT,      -- the COMPLETE raw OpenAI response, before it's trimmed to a brand+product OFF search
  bought          TEXT,
  priorities      JSONB,         -- snapshot of the user's concern weights at scan time (3-level scale: Low=25 / Medium=50 / Critical=100)
  category        TEXT,          -- swap-catalog category (e.g. "chocolate")
  verdict         TEXT,          -- BUY | CONSIDER | CAUTION | AVOID | UNKNOWN shown to the user
  primary_concern TEXT,          -- labor | boycott | animal_welfare | eco (worst concern), or null
  swap_available  BOOLEAN,       -- was a region-available ethical alternative on offer? null = N/A
  image           TEXT,          -- the photo the user scanned, as compressed JPEG base64 (no data: prefix)
  resolved        BOOLEAN NOT NULL DEFAULT true,  -- false = scan failed to resolve to a product (debug these)
  scan_event_id   TEXT,          -- UUID joining the exposure row to its conversion row
  verdict_base    TEXT,          -- the verdict at DEFAULT (neutral) priorities, to compare against verdict
  swap_gap_reason TEXT,          -- when swap_available is false, WHY nothing qualified
  swap_shown      BOOLEAN,       -- did the swap section actually render picks? (conversion rows only)
  swap_clicked    BOOLEAN,       -- did the user tap one? (conversion rows only)
  dwell_ms        INTEGER,       -- ms between page open and the buy/skip press (conversion rows only)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Idempotent upgrades for tables created before these columns existed.
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS barcode         TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS eco_grade       TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS country         TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS city            TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS off_url         TEXT;
-- Raw string OpenAI identified the product as, e.g. "Cadbury Dairy Milk Caramel".
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS openai_response TEXT;
-- The COMPLETE raw OpenAI response (e.g. "Product: ... Brand: ... Barcode: ..."),
-- captured before it's trimmed to the brand+product query sent to Open Food Facts.
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS full_openai_response TEXT;
-- Did the user buy the product or skip it? 'YES' (bought) / 'NO' (skipped) / null.
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS bought          TEXT;
-- Personalisation + the signals that power the unmet-demand heatmap.
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS priorities      JSONB;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS category        TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS verdict         TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS primary_concern TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS swap_available  BOOLEAN;
-- The scanned photo itself, stored inline as compressed JPEG base64.
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS image           TEXT;
-- Did the scan resolve to a product? false rows are the misses worth debugging.
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS resolved        BOOLEAN NOT NULL DEFAULT true;
-- ── Exposure → conversion instrumentation ──
-- One product-page view mints a UUID (client-side, sessionStorage) and stamps it
-- on BOTH the row written when the page opens and the row written when the user
-- presses Buy/Skip. Turns exposure→conversion from a fuzzy time-window match on
-- (user_id, barcode) into an exact join.
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS scan_event_id   TEXT;
-- The verdict the SAME product would have received at DEFAULT (all-Medium)
-- priorities. Comparing it to verdict makes "personalisation changes what we
-- tell people" a measurable claim instead of an assertion.
-- NOTE: this whole block is a JS template literal — no backticks in comments.
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS verdict_base    TEXT;
-- When swap_available is false, WHY: no_candidate_in_catalog | wrong_concern |
-- failed_clean | not_sold_here. Separates a genuine market gap from a thin catalog.
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS swap_gap_reason TEXT;
-- Availability != rendering != tapping. Set on conversion and swap_click rows.
-- On exposure rows the swap section hasn't resolved yet, so these stay NULL
-- rather than claiming a false.
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS swap_shown      BOOLEAN;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS swap_clicked    BOOLEAN;
-- Milliseconds from page open to the buy/skip press, clamped at 10 min so an
-- abandoned tab can't poison the average. Conversion rows only.
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS dwell_ms        INTEGER;
-- Drop columns we no longer store.
ALTER TABLE ai_scans DROP COLUMN IF EXISTS carbon_footprint_100g;
ALTER TABLE ai_scans DROP COLUMN IF EXISTS image_hash;
ALTER TABLE ai_scans DROP COLUMN IF EXISTS image_url;
ALTER TABLE ai_scans DROP COLUMN IF EXISTS model;
ALTER TABLE ai_scans DROP COLUMN IF EXISTS query;
ALTER TABLE ai_scans DROP COLUMN IF EXISTS ocr_text;
CREATE INDEX IF NOT EXISTS idx_ai_scans_created_at ON ai_scans (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_scans_user_id    ON ai_scans (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_scans_product    ON ai_scans (lower(product_name));
CREATE INDEX IF NOT EXISTS idx_ai_scans_barcode    ON ai_scans (barcode);
-- The exposure→conversion join. Partial: only a minority of rows carry an id,
-- and NULLs are never joined on.
CREATE INDEX IF NOT EXISTS idx_ai_scans_event
  ON ai_scans (scan_event_id)
  WHERE scan_event_id IS NOT NULL;
-- Speeds up the unmet-demand heatmap (filters/groups on these).
CREATE INDEX IF NOT EXISTS idx_ai_scans_demand
  ON ai_scans (country, category, primary_concern)
  WHERE primary_concern IS NOT NULL AND swap_available IS NOT TRUE;

-- ── Live heatmap of unmet ethical demand ──
-- One row per place × category × concern where shoppers met an ethically
-- flagged product and we had NO region-available alternative to offer them.
-- demand_signals = every such encounter; rejected = the subset the shopper
-- actually skipped (acute unmet demand — they wanted out and had nowhere to go).
CREATE OR REPLACE VIEW unmet_ethical_demand AS
SELECT
  country,
  city,
  category,
  primary_concern,
  count(*)                                AS demand_signals,
  count(*) FILTER (WHERE bought = 'NO')   AS rejected,
  count(DISTINCT user_id)                 AS distinct_users,
  max(created_at)                         AS last_seen
FROM ai_scans
WHERE category IS NOT NULL
  AND primary_concern IS NOT NULL    -- the product carried an ethical concern
  AND swap_available IS NOT TRUE     -- ...and we couldn't offer a real alternative
GROUP BY country, city, category, primary_concern
ORDER BY rejected DESC, demand_signals DESC;

CREATE TABLE IF NOT EXISTS community_flags (
  id                 TEXT PRIMARY KEY,
  status             TEXT NOT NULL DEFAULT 'pending_review',
  brand_name         TEXT NOT NULL,
  category           TEXT,
  severity           TEXT,
  summary            TEXT,
  sources            JSONB,
  submitter_email    TEXT,
  meets_sourcing_bar BOOLEAN,
  ip_hash            TEXT,
  moderator_note     TEXT,
  submitted_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  moderated_at       TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_community_flags_status ON community_flags (status);
CREATE INDEX IF NOT EXISTS idx_community_flags_brand  ON community_flags (lower(brand_name));

-- ── Enum constraints ──
-- The app already filters these through oneOf() before insert. That guards the
-- one path we control; it does not guard a hand-written UPDATE in the Supabase
-- console, a future second writer, or a refactor that forgets the sanitiser.
-- The database is the only place a rule can be enforced for everyone.
--
-- Two deliberate choices:
--  * NOT VALID — enforced on every INSERT and UPDATE from here on, but existing
--    rows are not re-scanned. This blob runs on every server start, so a
--    constraint that could fail on legacy data would take scan logging down at
--    boot. Once you have checked the old rows, promote a constraint with:
--      ALTER TABLE ai_scans VALIDATE CONSTRAINT ai_scans_verdict_chk;
--  * No IS NULL clauses — a CHECK passes on NULL by definition, and NULL is how
--    this schema spells "not applicable" throughout.
--
-- Postgres has no ADD CONSTRAINT IF NOT EXISTS, so the DO block below checks
-- pg_constraint first. That keeps the schema self-applying and idempotent.
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT * FROM (VALUES
      ('ai_scans', 'ai_scans_verdict_chk',
       'verdict IN (''BUY'',''CONSIDER'',''CAUTION'',''AVOID'',''UNKNOWN'')'),
      ('ai_scans', 'ai_scans_verdict_base_chk',
       'verdict_base IN (''BUY'',''CONSIDER'',''CAUTION'',''AVOID'',''UNKNOWN'')'),
      ('ai_scans', 'ai_scans_primary_concern_chk',
       'primary_concern IN (''labor'',''boycott'',''animal_welfare'',''eco'')'),
      ('ai_scans', 'ai_scans_bought_chk',
       'bought IN (''YES'',''NO'')'),
      ('ai_scans', 'ai_scans_source_chk',
       'source IN (''scan'',''decision'',''swap_click'',''chatgpt/analyze-product'')'),
      ('ai_scans', 'ai_scans_swap_gap_reason_chk',
       'swap_gap_reason IN (''no_candidate_in_catalog'',''wrong_concern'',''failed_clean'',''not_sold_here'')'),
      ('ai_scans', 'ai_scans_dwell_ms_chk',
       'dwell_ms >= 0 AND dwell_ms <= 600000'),
      ('community_flags', 'community_flags_status_chk',
       'status IN (''pending_review'',''approved'',''rejected'')'),
      ('community_flags', 'community_flags_severity_chk',
       'severity IN (''critical'',''high'',''medium'',''low'')')
    ) AS t(tbl, name, expr)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
       WHERE conname = c.name AND conrelid = c.tbl::regclass
    ) THEN
      BEGIN
        EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I CHECK (%s) NOT VALID', c.tbl, c.name, c.expr);
      EXCEPTION
        WHEN duplicate_object THEN NULL;  -- lost a race with another booting instance
      END;
    END IF;
  END LOOP;
END $$;
`;

/**
 * Connect (lazily) and ensure the table/indexes exist. Call once at startup.
 * Safe to call when DATABASE_URL is missing — it just stays disabled.
 */
export async function initScanStore() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn('scanStore: DATABASE_URL not set — Postgres scan logging disabled');
    return;
  }
  try {
    // Hosted Postgres (Supabase/Neon/Railway) requires TLS. Local dev does not.
    // Override with DATABASE_SSL=false if you run a local server without TLS.
    const isLocal = /@(localhost|127\.0\.0\.1)/.test(url);
    const useSsl = !isLocal && process.env.DATABASE_SSL !== 'false';
    pool = new Pool({
      connectionString: url,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000,
    });
    // Surface (don't crash on) background connection drops.
    pool.on('error', (e) => console.error('scanStore: pool error —', e.message));
    await pool.query(SCHEMA);
    ready = true;
    console.log('scanStore: Postgres scan logging ready');
  } catch (e) {
    console.warn('scanStore: init failed — Postgres scan logging disabled:', e.message);
    ready = false;
    pool = null;
  }
}

export function scanStoreReady() {
  return ready;
}

function clip(s, n) {
  if (typeof s !== 'string') return null;
  // Collapse any whitespace/control runs to single spaces, trim, then cap length.
  const cleaned = s.replace(/\s+/g, ' ').trim().slice(0, n);
  return cleaned || null;
}

// Like clip(), but keeps newlines so a full multi-line model response stays
// legible. Collapses runs of spaces/tabs, caps blank-line runs, trims, then
// caps length. Used for full_openai_response where we want the raw text intact.
function clipRaw(s, n) {
  if (typeof s !== 'string') return null;
  const cleaned = s
    .replace(/\r\n?/g, '\n')      // normalise CRLF → LF
    .replace(/[^\S\n]+/g, ' ')    // collapse spaces/tabs, keep newlines
    .replace(/\n{3,}/g, '\n\n')   // cap long blank-line runs
    .trim()
    .slice(0, n);
  return cleaned || null;
}

// One of a fixed set, else null. Keeps junk out of the heatmap dimensions.
function oneOf(s, allowed) {
  const v = clip(s, 32);
  return v && allowed.has(v) ? v : null;
}

const VERDICTS = new Set(['BUY', 'CONSIDER', 'CAUTION', 'AVOID', 'UNKNOWN']);
const CONCERNS = new Set(['labor', 'boycott', 'animal_welfare', 'eco']);
// Why no alternative qualified — mirrors SwapGapReason in src/services/swaps.
const SWAP_GAP_REASONS = new Set([
  'no_candidate_in_catalog', 'wrong_concern', 'failed_clean', 'not_sold_here',
]);
const PRIORITY_KEYS = ['environment', 'laborRights', 'animalWelfare', 'nutrition'];

// Exported for src/test/scanTelemetry.test.ts — it's a pure sanitiser, and the
// rejection rules are worth pinning down.
//
// Accept a scanned photo as base64. Strips any `data:image/...;base64,` prefix,
// caps length, and — importantly — checks the bytes are actually a JPEG.
//
// A length check alone accepts any base64-ish blob of the right size: a text
// file, a JSON payload, someone else's binary. This column is read back by the
// miss-corpus tooling and rendered in the admin view, so "it was the right
// length" is not a strong enough claim about what's in it.
//
// Returns clean base64 (no prefix) or null. Every capture path in the client
// (BarcodeScannerOverlay, ShelfScan, the OCR pipeline) encodes image/jpeg, so
// anything that isn't one is a bug or an abuse.
export function imageData(s) {
  if (typeof s !== 'string') return null;
  // Strip the data: prefix, then any whitespace — MIME base64 is line-wrapped
  // at 76 chars and we'd rather accept that than reject a valid photo.
  const b64 = (s.includes(',') ? s.slice(s.indexOf(',') + 1) : s).replace(/\s+/g, '');
  // ~3M base64 chars ≈ 2.25MB decoded — generous ceiling for a 512px JPEG.
  if (!b64 || b64.length > 3_000_000) return null;
  // Reject anything that isn't valid base64 before asking Buffer to decode it;
  // Buffer.from is famously lenient and silently drops characters it dislikes.
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) return null;
  // JPEG SOI + first marker: FF D8 FF. Only the first 4 base64 chars are needed
  // to recover the first 3 bytes, so this stays O(1) on a multi-megabyte string.
  let head;
  try {
    head = Buffer.from(b64.slice(0, 4), 'base64');
  } catch {
    return null;
  }
  if (head.length < 3 || head[0] !== 0xff || head[1] !== 0xd8 || head[2] !== 0xff) return null;
  return b64;
}

// A finite, non-negative number within range, else null.
function num(v, max) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
}

// A real boolean or null — never a truthy string. Keeps "false" out of a
// BOOLEAN column as `true`.
function bool(v) {
  return typeof v === 'boolean' ? v : null;
}

// Accept only a plain {key: 0-100} priorities object; return a JSON string for
// the ::jsonb cast, or null. Never stores free-text — no PII can leak in here.
function priorityJson(p) {
  if (!p || typeof p !== 'object') return null;
  const out = {};
  for (const k of PRIORITY_KEYS) {
    const n = num(p[k], 100);
    if (n !== null) out[k] = Math.round(n);
  }
  return Object.keys(out).length ? JSON.stringify(out) : null;
}

/**
 * Fire-and-forget insert of one AI analysis. Never awaited by the caller; any
 * failure is logged and swallowed so a DB hiccup never breaks a scan.
 *
 * @param {object} rec
 * @param {string} [rec.userId]      stable anon/device id (acts as user_id)
 * @param {string} [rec.source]      which endpoint produced this row
 * @param {string} [rec.productName] resolved product name
 * @param {string} [rec.brand]       resolved brand
 * @param {string} [rec.barcode]     product barcode, when scanned
 * @param {string} [rec.ecoGrade]    eco grade (A-E), when known
 * @param {string} [rec.country]     user's set region country (code), from the app
 * @param {string} [rec.city]        user's set region city, from the app
 * @param {string} [rec.openaiResponse] raw product string OpenAI identified (brand + product)
 * @param {string} [rec.fullOpenaiResponse] the COMPLETE raw OpenAI response, before trimming to the OFF search
 * @param {string} [rec.bought]        'YES' if the user bought it, 'NO' if skipped, else null
 * @param {object} [rec.priorities]    the user's concern weights {environment,laborRights,animalWelfare,nutrition}
 * @param {string} [rec.category]      swap-catalog category, e.g. "chocolate"
 * @param {string} [rec.verdict]       BUY|CONSIDER|CAUTION|AVOID|UNKNOWN shown to the user
 * @param {string} [rec.primaryConcern] worst concern: labor|boycott|animal_welfare|eco, or null
 * @param {boolean} [rec.swapAvailable] was a region-available ethical alternative on offer?
 * @param {string} [rec.image]        the scanned photo as compressed JPEG base64 (no data: prefix)
 * @param {boolean} [rec.resolved]    false if the scan never resolved to a product (default true)
 * @param {string} [rec.scanEventId]  UUID joining this row to the other row from the same page view
 * @param {string} [rec.verdictBase]  the verdict at DEFAULT priorities (personalisation baseline)
 * @param {string} [rec.swapGapReason] why nothing qualified: no_candidate_in_catalog|wrong_concern|failed_clean|not_sold_here
 * @param {boolean} [rec.swapShown]   did the swap section render picks? (conversion rows only)
 * @param {boolean} [rec.swapClicked] did the user tap one? (conversion rows only)
 * @param {number} [rec.dwellMs]      ms from page open to the buy/skip press (conversion rows only)
 */
export function logScan(rec = {}) {
  if (!ready || !pool) return;
  try {
    const barcode = clip(rec.barcode, 64);
    const offUrl = barcode ? `https://world.openfoodfacts.org/product/${barcode}` : null;
    const bought = rec.bought === 'YES' || rec.bought === 'NO' ? rec.bought : null;
    const swapAvailable = bool(rec.swapAvailable);
    const values = [
      clip(rec.userId, 64),
      clip(rec.source, 64),
      clip(rec.productName, 300),
      clip(rec.brand, 200),
      barcode,
      clip(rec.ecoGrade, 4),
      clip(rec.country, 64),
      clip(rec.city, 120),
      offUrl,
      clip(rec.openaiResponse, 500),
      clipRaw(rec.fullOpenaiResponse, 20000),
      bought,
      priorityJson(rec.priorities),
      clip(rec.category, 64),
      oneOf(rec.verdict, VERDICTS),
      oneOf(rec.primaryConcern, CONCERNS),
      swapAvailable,
      imageData(rec.image),
      rec.resolved === false ? false : true,
      clip(rec.scanEventId, 64),
      oneOf(rec.verdictBase, VERDICTS),
      oneOf(rec.swapGapReason, SWAP_GAP_REASONS),
      bool(rec.swapShown),
      bool(rec.swapClicked),
      num(rec.dwellMs, 600000),
    ];
    pool
      .query(
        `INSERT INTO ai_scans
           (user_id, source, product_name, brand, barcode,
            eco_grade, country, city, off_url, openai_response,
            full_openai_response, bought,
            priorities, category, verdict,
            primary_concern, swap_available, image, resolved,
            scan_event_id, verdict_base, swap_gap_reason,
            swap_shown, swap_clicked, dwell_ms)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
                 $11,$12,
                 $13::jsonb,$14,$15,$16,$17,$18,$19,
                 $20,$21,$22,$23,$24,$25)`,
        values,
      )
      .catch((e) => console.error('scanStore: insert failed —', e.message));
  } catch (e) {
    console.error('scanStore: logScan error —', e.message);
  }
}

/**
 * Insert one user-submitted community flag into Postgres. Fire-and-forget; the
 * JSONL file remains the on-disk backup. Idempotent on id.
 *
 * @param {object} record the same record written to community-flags.jsonl
 */
export function logCommunityFlag(record = {}) {
  if (!ready || !pool) return;
  try {
    const sub = record.submission || {};
    pool
      .query(
        `INSERT INTO community_flags
           (id, status, brand_name, category, severity, summary, sources,
            submitter_email, meets_sourcing_bar, ip_hash, submitted_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11)
         ON CONFLICT (id) DO NOTHING`,
        [
          clip(record.id, 64),
          clip(record.status, 32) || 'pending_review',
          clip(sub.brandName, 80),
          clip(sub.category, 64),
          clip(sub.severity, 32),
          clip(sub.summary, 300),
          sub.sources != null ? JSON.stringify(sub.sources) : null,
          clip(sub.submitterEmail, 200),
          typeof record.meetsSourcingBar === 'boolean' ? record.meetsSourcingBar : null,
          clip(record.ipHash, 128),
          record.submittedAt || new Date().toISOString(),
        ],
      )
      .catch((e) => console.error('scanStore: community flag insert failed —', e.message));
  } catch (e) {
    console.error('scanStore: logCommunityFlag error —', e.message);
  }
}

/**
 * Reflect a moderation decision (approve/reject) onto the Postgres row so the
 * DB stays in sync with the JSONL. Fire-and-forget.
 */
export function updateCommunityFlagStatus(id, status, note) {
  if (!ready || !pool) return;
  try {
    pool
      .query(
        `UPDATE community_flags
            SET status = $2, moderator_note = $3, moderated_at = now()
          WHERE id = $1`,
        [clip(id, 64), clip(status, 32), note != null ? clip(note, 500) : null],
      )
      .catch((e) => console.error('scanStore: community flag update failed —', e.message));
  } catch (e) {
    console.error('scanStore: updateCommunityFlagStatus error —', e.message);
  }
}
