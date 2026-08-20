// ── Precomputed origin index ──
//
// One keyed read at runtime. Every expensive join happened offline in
// scripts/supplychain/build_origin_index.py, so this endpoint touches no
// external API and stays fast and cheap.
//
// Loaded defensively, exactly like db/scanStore.js: if DATABASE_URL is unset or
// the table is missing or unreachable, the feature degrades to "no precomputed
// record" and the server keeps running. That degradation is safe by design —
// the resolver already produces a correct graph from the product record alone,
// and the index only ever ADDS evidence.
//
// Rebuild cadence: nightly. Open Food Facts refreshes its Parquet export twice
// a day.

import pkg from 'pg';

const { Pool } = pkg;

let pool = null;
let ready = false;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS origin_index (
  code         TEXT PRIMARY KEY,
  market       TEXT,
  brand        TEXT,
  best_tier    TEXT NOT NULL,
  commodities  TEXT,
  claims       JSONB NOT NULL,
  n_claims     INT  NOT NULL DEFAULT 0,
  built_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS origin_index_market_tier ON origin_index (market, best_tier);
CREATE INDEX IF NOT EXISTS origin_index_brand      ON origin_index (brand);
`;

const RECONNECT_DELAY_MS = 60_000;
let reconnectTimer = null;

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    initOriginIndex();
  }, RECONNECT_DELAY_MS);
  // Never be the reason the process refuses to exit.
  reconnectTimer.unref?.();
}

/**
 * Connect lazily and ensure the table exists. Safe to call with no
 * DATABASE_URL — it just stays disabled.
 */
export async function initOriginIndex() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn('originIndex: DATABASE_URL not set — precomputed origin lookup disabled');
    return;
  }
  try {
    const isLocal = /@(localhost|127\.0\.0\.1)/.test(url);
    const useSsl = !isLocal && process.env.DATABASE_SSL !== 'false';
    pool = new Pool({
      connectionString: url,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      max: 3,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000,
    });
    pool.on('error', (e) => console.error('originIndex: pool error —', e.message));
    await pool.query(SCHEMA);
    ready = true;
    console.log('originIndex: precomputed origin lookup ready');
  } catch (e) {
    console.warn(
      `originIndex: init failed — precomputed origin lookup disabled: ${e.message}` +
      ` (retrying in ${RECONNECT_DELAY_MS / 1000}s)`,
    );
    ready = false;
    pool = null;
    scheduleReconnect();
  }
}

export function originIndexReady() {
  return ready;
}

/**
 * Look up one barcode. Returns null when absent OR when the store is not
 * available — the caller cannot tell the difference and must not need to,
 * because "no precomputed record" is a normal, correct outcome for most
 * products.
 */
export async function getOriginRecord(barcode) {
  if (!ready || !pool) return null;
  const code = String(barcode || '').replace(/\D/g, '').slice(0, 20);
  if (!code) return null;
  try {
    const res = await pool.query(
      `SELECT code, market, brand, best_tier, commodities, claims, n_claims, built_at
         FROM origin_index
        WHERE code = $1
        LIMIT 1`,
      [code],
    );
    return res.rows[0] || null;
  } catch (e) {
    console.error('originIndex: query failed —', e.message);
    return null;
  }
}

/** Bulk-load rows from the generated CSV. Used by the nightly rebuild. */
export async function upsertOriginRecords(records = []) {
  if (!ready || !pool) throw new Error('originIndex is not connected');
  if (!records.length) return 0;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const r of records) {
      await client.query(
        `INSERT INTO origin_index (code, market, brand, best_tier, commodities, claims, n_claims, built_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7, now())
         ON CONFLICT (code) DO UPDATE SET
           market = EXCLUDED.market, brand = EXCLUDED.brand,
           best_tier = EXCLUDED.best_tier, commodities = EXCLUDED.commodities,
           claims = EXCLUDED.claims, n_claims = EXCLUDED.n_claims,
           built_at = now()`,
        [r.code, r.market, r.brand, r.best_tier, r.commodities,
         typeof r.claims === 'string' ? r.claims : JSON.stringify(r.claims),
         r.n_claims ?? 0],
      );
    }
    await client.query('COMMIT');
    return records.length;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function closeOriginIndex() {
  if (pool) {
    await pool.end();
    pool = null;
    ready = false;
  }
}
