-- ai_scans — full AI product-analysis log (Postgres / Supabase).
--
-- The server (db/scanStore.js) creates this automatically on startup when
-- DATABASE_URL is set. This file mirrors that schema so you can also apply it
-- by hand — e.g. paste it into the Supabase SQL editor.
--
-- Note: this is the RICH log (full OpenAI response per scan). It is separate
-- from the lightweight SQLite "most-scanned" counter in data/scans.db.

CREATE TABLE IF NOT EXISTS ai_scans (
  id              BIGSERIAL PRIMARY KEY,
  user_id         TEXT,          -- stable anon/device id from the client
  source          TEXT,          -- which endpoint produced the row
  product_name    TEXT,          -- resolved product name
  brand           TEXT,          -- resolved brand
  barcode         TEXT,          -- product barcode, when scanned
  eco_grade       TEXT,          -- eco grade A-E, when known
  country         TEXT,          -- user's set region country code (from the app)
  city            TEXT,          -- user's set region city (from the app)
  off_url         TEXT,          -- Open Food Facts product page URL (from barcode)
  openai_response TEXT,          -- raw string OpenAI identified the product as (trimmed brand+product)
  full_openai_response TEXT,     -- the COMPLETE raw OpenAI response, before it's trimmed to the OFF search
  bought          TEXT,          -- 'YES' bought / 'NO' skipped / null (no decision)
  carbon_footprint_100g REAL,    -- CO2e grams per 100g, from Open Food Facts
  priorities      JSONB,         -- user's concern weights at scan time {environment,laborRights,animalWelfare,nutrition}; each 0-100 on a 3-level scale (Low=25 / Medium=50 / Critical=100)
  category        TEXT,          -- swap-catalog category, e.g. "chocolate"
  verdict         TEXT,          -- BUY | CONSIDER | CAUTION | AVOID | UNKNOWN shown to the user
  primary_concern TEXT,          -- labor | boycott | animal_welfare | eco (worst concern), or null
  swap_available  BOOLEAN,       -- was a region-available ethical alternative on offer? null = N/A
  image           TEXT,          -- the scanned photo, as compressed JPEG base64 (no data: prefix)
  resolved        BOOLEAN NOT NULL DEFAULT true,  -- false = scan failed to resolve to a product
  scan_event_id   TEXT,          -- UUID shared by the exposure row and the conversion row of one page view
  verdict_base    TEXT,          -- the verdict at DEFAULT (all-Medium) priorities; compare against `verdict`
  swap_gap_reason TEXT,          -- no_candidate_in_catalog | wrong_concern | failed_clean | not_sold_here
  swap_shown      BOOLEAN,       -- did the swap section actually render picks? (conversion rows only)
  swap_clicked    BOOLEAN,       -- did the user tap one? (conversion rows only)
  dwell_ms        INTEGER,       -- ms from page open to the buy/skip press, clamped at 600000
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- If your table predates these columns, add them idempotently:
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS openai_response TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS full_openai_response TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS bought          TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS carbon_footprint_100g REAL;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS priorities      JSONB;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS category        TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS verdict         TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS primary_concern TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS swap_available  BOOLEAN;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS image           TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS resolved        BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS scan_event_id   TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS verdict_base    TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS swap_gap_reason TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS swap_shown      BOOLEAN;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS swap_clicked    BOOLEAN;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS dwell_ms        INTEGER;

CREATE INDEX IF NOT EXISTS idx_ai_scans_created_at ON ai_scans (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_scans_user_id    ON ai_scans (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_scans_product    ON ai_scans (lower(product_name));
CREATE INDEX IF NOT EXISTS idx_ai_scans_event
  ON ai_scans (scan_event_id)
  WHERE scan_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_scans_demand
  ON ai_scans (country, category, primary_concern)
  WHERE primary_concern IS NOT NULL AND swap_available IS NOT TRUE;

-- ── Live heatmap of unmet ethical demand ──
-- One row per place × category × concern where shoppers met an ethically
-- flagged product and we had NO region-available alternative to offer them.
-- demand_signals = every such encounter; rejected = the subset actually skipped.
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
  AND primary_concern IS NOT NULL
  AND swap_available IS NOT TRUE
GROUP BY country, city, category, primary_concern
ORDER BY rejected DESC, demand_signals DESC;

-- community_flags — user-submitted brand flags (POST /api/community-flags).
-- Mirrors data/community-flags.jsonl; the server inserts here too and reflects
-- approve/reject moderation onto the row.
CREATE TABLE IF NOT EXISTS community_flags (
  id                 TEXT PRIMARY KEY,    -- generated cf_ id
  status             TEXT NOT NULL DEFAULT 'pending_review', -- pending_review|approved|rejected
  brand_name         TEXT NOT NULL,
  category           TEXT,
  severity           TEXT,
  summary            TEXT,
  sources            JSONB,               -- [{url,title,publisher,tier}]
  submitter_email    TEXT,
  meets_sourcing_bar BOOLEAN,
  ip_hash            TEXT,                -- hashed, not raw IP
  moderator_note     TEXT,
  submitted_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  moderated_at       TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_community_flags_status ON community_flags (status);
CREATE INDEX IF NOT EXISTS idx_community_flags_brand  ON community_flags (lower(brand_name));

-- ── Enum constraints ──
-- The app filters these through oneOf() before insert, which guards the one
-- write path we control. It does not guard a hand-written UPDATE in the
-- Supabase console, a second writer, or a refactor that forgets the sanitiser.
--
-- NOT VALID: enforced on every INSERT/UPDATE from here on, but existing rows
-- are not re-scanned. db/scanStore.js runs this blob on every server start, so
-- a constraint that could fail on legacy data would take scan logging down at
-- boot. Once you have checked the old rows, promote one with:
--   ALTER TABLE ai_scans VALIDATE CONSTRAINT ai_scans_verdict_chk;
--
-- No IS NULL clauses are needed: a CHECK passes on NULL by definition, and NULL
-- is how this schema spells "not applicable" throughout.
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
        WHEN duplicate_object THEN NULL;
      END;
    END IF;
  END LOOP;
END $$;

-- Example queries -----------------------------------------------------------
-- All scans for a product:
--   SELECT * FROM ai_scans WHERE lower(product_name) = lower('Nutella') ORDER BY created_at DESC;
-- A user's scan history:
--   SELECT product_name, created_at FROM ai_scans WHERE user_id = $1 ORDER BY created_at DESC;
-- Most-scanned products:
--   SELECT product_name, count(*) FROM ai_scans GROUP BY product_name ORDER BY 2 DESC LIMIT 50;
-- Top unmet-demand gaps (where to source/stock an ethical alternative next):
--   SELECT * FROM unmet_ethical_demand LIMIT 50;
-- Same, narrowed to one market:
--   SELECT * FROM unmet_ethical_demand WHERE country = 'GB' LIMIT 50;
-- Pending community flags:
--   SELECT id, brand_name, category, severity, summary FROM community_flags WHERE status='pending_review' ORDER BY submitted_at DESC;
