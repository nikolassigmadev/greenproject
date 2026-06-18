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
  query           TEXT,          -- raw text the user searched
  ocr_text        TEXT,          -- OCR text, when a separate OCR step ran
  product_name    TEXT,          -- resolved product name
  brand           TEXT,          -- resolved brand
  barcode         TEXT,          -- product barcode, when scanned
  eco_grade       TEXT,          -- eco grade A-E, when known
  country         TEXT,          -- user's set region country code (from the app)
  city            TEXT,          -- user's set region city (from the app)
  image_hash      TEXT,          -- sha256 of the submitted image (for dedupe)
  image_url       TEXT,          -- URL of a stored image, if any (reserved)
  openai_response JSONB,         -- full OpenAI response JSON
  model           TEXT,          -- model id used (e.g. gpt-4o-mini)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_scans_created_at ON ai_scans (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_scans_user_id    ON ai_scans (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_scans_product    ON ai_scans (lower(product_name));

-- Example queries -----------------------------------------------------------
-- All scans for a product:
--   SELECT * FROM ai_scans WHERE lower(product_name) = lower('Nutella') ORDER BY created_at DESC;
-- A user's scan history:
--   SELECT product_name, created_at FROM ai_scans WHERE user_id = $1 ORDER BY created_at DESC;
-- Most-scanned products:
--   SELECT product_name, count(*) FROM ai_scans GROUP BY product_name ORDER BY 2 DESC LIMIT 50;
