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
  openai_response TEXT,          -- raw string OpenAI identified the product as
  bought          TEXT,          -- 'YES' bought / 'NO' skipped / null (no decision)
  carbon_footprint_100g REAL,    -- CO2e grams per 100g, from Open Food Facts
  priorities      JSONB,         -- user's concern weights at scan time {environment,laborRights,animalWelfare,nutrition}; each 0-100 on a 3-level scale (Low=25 / Medium=50 / Critical=100)
  category        TEXT,          -- swap-catalog category, e.g. "chocolate"
  verdict         TEXT,          -- BUY | CONSIDER | CAUTION | AVOID | UNKNOWN shown to the user
  primary_concern TEXT,          -- labor | boycott | animal_welfare | eco (worst concern), or null
  swap_available  BOOLEAN,       -- was a region-available ethical alternative on offer? null = N/A
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- If your table predates these columns, add them idempotently:
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS openai_response TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS bought          TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS carbon_footprint_100g REAL;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS priorities      JSONB;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS category        TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS verdict         TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS primary_concern TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS swap_available  BOOLEAN;

CREATE INDEX IF NOT EXISTS idx_ai_scans_created_at ON ai_scans (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_scans_user_id    ON ai_scans (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_scans_product    ON ai_scans (lower(product_name));
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
