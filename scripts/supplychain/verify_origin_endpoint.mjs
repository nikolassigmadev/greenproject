/**
 * Verify the precomputed-origin lookup against a REAL Postgres.
 *
 * The acceptance criterion is "GET /api/origin/:barcode responds in under
 * 50 ms". That is a claim about a database query, so it is checked against a
 * real Postgres rather than a mock: PGlite is the actual Postgres engine
 * compiled to WASM, so the planner, the index and the types are the real ones.
 *
 * Not part of the default test suite, and PGlite is deliberately NOT a
 * dependency: it is ~25 MB and this is a one-off performance check, not
 * something every `vitest run` should pay for.
 *
 *   npm install --no-save @electric-sql/pglite
 *   node scripts/supplychain/verify_origin_endpoint.mjs
 *
 * Measured 2026-08-20 on a 50,000-row table:
 *   plan  Index Scan using origin_index_pkey (3 shared buffer hits)
 *   p50   0.264 ms      p95 0.289 ms      p99 0.580 ms      max 0.898 ms
 * The HTTP handler itself adds ~2.7 ms, so the budget holds with wide margin.
 */

import { PGlite } from '@electric-sql/pglite';

const ROWS = Number(process.env.ROWS || 50000);
const LOOKUPS = Number(process.env.LOOKUPS || 300);
const BUDGET_MS = 50;

// The exact DDL shipped in db/originIndex.js. If these drift, this check stops
// describing the thing that runs in production.
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

const SQL = `SELECT code, market, brand, best_tier, commodities, claims, n_claims, built_at
               FROM origin_index WHERE code = $1 LIMIT 1`;

const db = new PGlite();
await db.exec(SCHEMA);
console.log('schema: applied cleanly');

const claims = JSON.stringify([{
  rung: 'A1', tier: 'declared', confidence: 0.9, value: 'en:france',
  basis: "Open Food Facts records a declared origin of 'france'.",
}]);

await db.exec('BEGIN');
for (let i = 0; i < ROWS; i++) {
  await db.query(
    `INSERT INTO origin_index (code,market,brand,best_tier,commodities,claims,n_claims)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [String(3000000000000 + i), 'EU', `Brand${i % 500}`, 'declared', 'cocoa', claims, 1],
  );
}
await db.exec('COMMIT');
console.log(`rows loaded: ${ROWS}`);

// The plan matters as much as the timing: a sequential scan that happens to be
// fast on 50k rows would not stay fast on 5M.
const plan = await db.query(`EXPLAIN ANALYZE ${SQL}`, ['3000000025000']);
const planText = plan.rows.map((r) => Object.values(r)[0]).join('\n');
console.log('--- query plan ---');
console.log(planText.split('\n').map((l) => '  ' + l).join('\n'));
if (!/Index Scan using origin_index_pkey/.test(planText)) {
  console.error('FAIL: lookup is not using the primary-key index');
  process.exit(1);
}

const times = [];
for (let i = 0; i < LOOKUPS; i++) {
  const code = String(3000000000000 + Math.floor(Math.random() * ROWS));
  const t0 = performance.now();
  const res = await db.query(SQL, [code]);
  times.push(performance.now() - t0);
  if (res.rows.length !== 1) {
    console.error(`FAIL: lookup missed for ${code}`);
    process.exit(1);
  }
}
times.sort((a, b) => a - b);
const at = (p) => times[Math.floor(times.length * p)].toFixed(3);
const max = times[times.length - 1];
console.log(`--- latency over ${LOOKUPS} keyed lookups (${ROWS}-row table) ---`);
console.log(`  p50 ${at(0.5)} ms   p95 ${at(0.95)} ms   p99 ${at(0.99)} ms   max ${max.toFixed(3)} ms`);

await db.close();
if (max >= BUDGET_MS) {
  console.error(`FAIL: slowest lookup ${max.toFixed(3)} ms exceeds the ${BUDGET_MS} ms budget`);
  process.exit(1);
}
console.log(`PASS: every lookup under ${BUDGET_MS} ms`);
