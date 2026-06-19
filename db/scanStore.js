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
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Idempotent upgrades for tables created before these columns existed.
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS barcode   TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS eco_grade TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS country   TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS city      TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS off_url   TEXT;
-- Drop columns we no longer store.
ALTER TABLE ai_scans DROP COLUMN IF EXISTS image_hash;
ALTER TABLE ai_scans DROP COLUMN IF EXISTS image_url;
ALTER TABLE ai_scans DROP COLUMN IF EXISTS openai_response;
ALTER TABLE ai_scans DROP COLUMN IF EXISTS model;
ALTER TABLE ai_scans DROP COLUMN IF EXISTS query;
ALTER TABLE ai_scans DROP COLUMN IF EXISTS ocr_text;
CREATE INDEX IF NOT EXISTS idx_ai_scans_created_at ON ai_scans (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_scans_user_id    ON ai_scans (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_scans_product    ON ai_scans (lower(product_name));
CREATE INDEX IF NOT EXISTS idx_ai_scans_barcode    ON ai_scans (barcode);

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
 */
export function logScan(rec = {}) {
  if (!ready || !pool) return;
  try {
    const barcode = clip(rec.barcode, 64);
    const offUrl = barcode ? `https://world.openfoodfacts.org/product/${barcode}` : null;
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
    ];
    pool
      .query(
        `INSERT INTO ai_scans
           (user_id, source, product_name, brand, barcode,
            eco_grade, country, city, off_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
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
