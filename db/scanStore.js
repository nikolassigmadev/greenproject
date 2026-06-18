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
import crypto from 'crypto';

const { Pool } = pkg;

let pool = null;
let ready = false;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS ai_scans (
  id              BIGSERIAL PRIMARY KEY,
  user_id         TEXT,
  source          TEXT,
  query           TEXT,
  ocr_text        TEXT,
  product_name    TEXT,
  brand           TEXT,
  barcode         TEXT,
  eco_grade       TEXT,
  image_hash      TEXT,
  image_url       TEXT,
  openai_response JSONB,
  model           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Idempotent upgrades for tables created before these columns existed.
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS barcode   TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS eco_grade TEXT;
CREATE INDEX IF NOT EXISTS idx_ai_scans_created_at ON ai_scans (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_scans_user_id    ON ai_scans (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_scans_product    ON ai_scans (lower(product_name));
CREATE INDEX IF NOT EXISTS idx_ai_scans_barcode    ON ai_scans (barcode);
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
 * @param {string} [rec.query]       raw text the user searched
 * @param {string} [rec.ocrText]     OCR text, when a separate OCR step ran
 * @param {string} [rec.productName] resolved product name
 * @param {string} [rec.brand]       resolved brand
 * @param {string} [rec.barcode]     product barcode, when scanned
 * @param {string} [rec.ecoGrade]    eco grade (A-E), when known
 * @param {string} [rec.imageBase64] raw image; hashed (not stored) for dedupe
 * @param {string} [rec.imageUrl]    URL of a stored image, if any
 * @param {object} [rec.response]    full OpenAI response JSON
 * @param {string} [rec.model]       model id used
 */
export function logScan(rec = {}) {
  if (!ready || !pool) return;
  try {
    const imageHash = rec.imageBase64
      ? crypto.createHash('sha256').update(String(rec.imageBase64)).digest('hex')
      : null;
    const values = [
      clip(rec.userId, 64),
      clip(rec.source, 64),
      clip(rec.query, 2000),
      clip(rec.ocrText, 8000),
      clip(rec.productName, 300),
      clip(rec.brand, 200),
      clip(rec.barcode, 64),
      clip(rec.ecoGrade, 4),
      imageHash,
      clip(rec.imageUrl, 1000),
      rec.response != null ? JSON.stringify(rec.response) : null,
      clip(rec.model, 64),
    ];
    pool
      .query(
        `INSERT INTO ai_scans
           (user_id, source, query, ocr_text, product_name, brand, barcode,
            eco_grade, image_hash, image_url, openai_response, model)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12)`,
        values,
      )
      .catch((e) => console.error('scanStore: insert failed —', e.message));
  } catch (e) {
    console.error('scanStore: logScan error —', e.message);
  }
}
