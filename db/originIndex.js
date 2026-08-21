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
      // 8s was not enough against a hosted pooler under load — the bulk load
      // could not reconnect after its first connection dropped, while a 15s
      // client connected fine at the same moment.
      connectionTimeoutMillis: 20000,
      // A hosted pooler can drop a connection without closing the socket. With
      // no timeout, `pg` then waits forever: the bulk load stalled at 289k rows
      // with 0% CPU and no error, which is the worst way for this to fail —
      // indistinguishable from slow progress. query_timeout makes it fail loudly.
      //
      // query_timeout ONLY. `statement_timeout` here is sent as a startup
      // parameter, and Supabase's transaction-mode pooler rejects it — every
      // connection then failed with "connection timeout" while a client without
      // it connected fine at the same moment. query_timeout is enforced by `pg`
      // client-side and never touches the wire.
      query_timeout: 120000,
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

/**
 * Bulk-load rows. Used by the nightly rebuild.
 *
 * MULTI-ROW inserts, not one statement per row. The index is on the order of a
 * million rows, and a round trip each would take hours against a hosted
 * Postgres — this is entirely network latency, not database work. One statement
 * carrying ~500 rows turns that into minutes.
 *
 * Postgres caps a statement at 65,535 bound parameters. At 7 columns per row
 * that is 9,362 rows; 500 keeps a wide margin and keeps each statement small
 * enough to retry cheaply.
 */
export async function upsertOriginRecords(records = [], { batchSize = 500 } = {}) {
  if (!ready || !pool) throw new Error('originIndex is not connected');
  if (!records.length) return 0;

  const COLS = 7;
  const client = await pool.connect();
  let written = 0;
  try {
    for (let i = 0; i < records.length; i += batchSize) {
      const chunk = records.slice(i, i + batchSize);
      const values = [];
      const params = [];
      chunk.forEach((r, n) => {
        const b = n * COLS;
        values.push(`($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},now())`);
        params.push(
          r.code, r.market, r.brand, r.best_tier, r.commodities,
          typeof r.claims === 'string' ? r.claims : JSON.stringify(r.claims),
          r.n_claims ?? 0,
        );
      });
      await client.query(
        `INSERT INTO origin_index
           (code, market, brand, best_tier, commodities, claims, n_claims, built_at)
         VALUES ${values.join(',')}
         ON CONFLICT (code) DO UPDATE SET
           market = EXCLUDED.market, brand = EXCLUDED.brand,
           best_tier = EXCLUDED.best_tier, commodities = EXCLUDED.commodities,
           claims = EXCLUDED.claims, n_claims = EXCLUDED.n_claims,
           built_at = now()`,
        params,
      );
      written += chunk.length;
    }
    return written;
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
