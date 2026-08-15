#!/usr/bin/env node
// Applies the real SCHEMA blob from db/scanStore.js to a throwaway in-process
// Postgres and checks that it does what it claims.
//
// Why this exists: scanStore.js runs that blob on EVERY server start. A syntax
// error, or a constraint that legacy rows violate, doesn't fail a test — it
// takes scan logging down at boot in production, silently, because init failure
// is caught and logged as a warning. This script is the only thing standing
// between "the DDL looks fine" and knowing it is.
//
// Run:  node scripts/verify-schema.mjs
// Needs: npm i -D @electric-sql/pglite   (WASM Postgres, no server, no Docker)
//
// It never touches DATABASE_URL. The database it creates lives in memory and
// disappears when the process exits.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

let PGlite;
try {
  ({ PGlite } = await import('@electric-sql/pglite'));
} catch {
  console.error(
    'verify-schema: @electric-sql/pglite is not installed.\n' +
      '  npm i -D @electric-sql/pglite\n' +
      'Skipping (exit 0) so this never blocks a build that did not ask for it.',
  );
  process.exit(0);
}

const src = readFileSync(join(ROOT, 'db/scanStore.js'), 'utf8');
const match = src.match(/const SCHEMA = `([\s\S]*?)`;\n/);
if (!match) {
  console.error('verify-schema: could not find the SCHEMA template literal in db/scanStore.js');
  process.exit(1);
}
const SCHEMA = match[1];

const db = new PGlite();
let failures = 0;

function check(ok, label, detail = '') {
  if (!ok) failures++;
  console.log(`  ${ok ? '✓' : '✗'} ${label}${ok || !detail ? '' : ` — ${detail}`}`);
}

// ── 1. It applies, twice ─────────────────────────────────────────────────────
console.log('\nschema application');
for (const label of ['first apply (fresh database)', 'second apply (idempotency)']) {
  try {
    await db.exec(SCHEMA);
    check(true, label);
  } catch (e) {
    check(false, label, e.message);
    console.error('\nverify-schema: the blob does not apply. Fix this before deploying.');
    process.exit(1);
  }
}

// ── 2. It produced what it promised ──────────────────────────────────────────
console.log('\nstructure');
const cols = (
  await db.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'ai_scans'`)
).rows.map((r) => r.column_name);

for (const c of [
  'scan_event_id', 'verdict_base', 'swap_gap_reason',
  'swap_shown', 'swap_clicked', 'dwell_ms', 'swap_taken',
]) {
  check(cols.includes(c), `ai_scans.${c} exists`);
}
for (const c of ['carbon_footprint_100g', 'image_hash', 'image_url', 'model', 'query', 'ocr_text']) {
  check(!cols.includes(c), `retired column ${c} is gone`);
}

const indexes = (await db.query(`SELECT indexname FROM pg_indexes WHERE tablename = 'ai_scans'`)).rows.map(
  (r) => r.indexname,
);
check(indexes.includes('idx_ai_scans_event'), 'idx_ai_scans_event exists');
check(indexes.includes('idx_ai_scans_demand'), 'idx_ai_scans_demand exists');

await db.query('SELECT count(*) FROM unmet_ethical_demand');
check(true, 'unmet_ethical_demand view still builds on the widened table');

// ── 3. The constraints actually bite ─────────────────────────────────────────
// A constraint that exists but doesn't reject anything is worse than none: it
// looks like a guarantee in the schema and provides none.
console.log('\nconstraint enforcement');
const cases = [
  ['bogus verdict', `INSERT INTO ai_scans (verdict) VALUES ('DEFINITELY_BUY')`, 'reject'],
  ['real verdict', `INSERT INTO ai_scans (verdict) VALUES ('AVOID')`, 'accept'],
  ['NULL verdict (means "not applicable")', `INSERT INTO ai_scans (verdict) VALUES (NULL)`, 'accept'],
  ['bogus verdict_base', `INSERT INTO ai_scans (verdict_base) VALUES ('MAYBE')`, 'reject'],
  ['bogus primary_concern', `INSERT INTO ai_scans (primary_concern) VALUES ('vibes')`, 'reject'],
  ['real primary_concern', `INSERT INTO ai_scans (primary_concern) VALUES ('animal_welfare')`, 'accept'],
  ['bogus bought', `INSERT INTO ai_scans (bought) VALUES ('MAYBE')`, 'reject'],
  ['bogus source', `INSERT INTO ai_scans (source) VALUES ('../../etc/passwd')`, 'reject'],
  ['swap_click source', `INSERT INTO ai_scans (source) VALUES ('swap_click')`, 'accept'],
  ['server-side source', `INSERT INTO ai_scans (source) VALUES ('chatgpt/analyze-product')`, 'accept'],
  ['bogus swap_gap_reason', `INSERT INTO ai_scans (swap_gap_reason) VALUES ('because')`, 'reject'],
  ['real swap_gap_reason', `INSERT INTO ai_scans (swap_gap_reason) VALUES ('not_sold_here')`, 'accept'],
  ['negative dwell', `INSERT INTO ai_scans (dwell_ms) VALUES (-1)`, 'reject'],
  ['dwell past the 10-minute clamp', `INSERT INTO ai_scans (dwell_ms) VALUES (600001)`, 'reject'],
  ['in-range dwell', `INSERT INTO ai_scans (dwell_ms) VALUES (4200)`, 'accept'],
  ['swap_outcome source', `INSERT INTO ai_scans (source) VALUES ('swap_outcome')`, 'accept'],
  ['bogus swap_taken', `INSERT INTO ai_scans (swap_taken) VALUES ('kind of')`, 'reject'],
  ['real swap_taken', `INSERT INTO ai_scans (swap_taken) VALUES ('bought_anyway')`, 'accept'],
  ['bogus flag status', `INSERT INTO community_flags (id, status, brand_name) VALUES ('a','whatever','B')`, 'reject'],
  ['real flag status', `INSERT INTO community_flags (id, status, brand_name) VALUES ('b','approved','B')`, 'accept'],
  ['bogus severity', `INSERT INTO community_flags (id, severity, brand_name) VALUES ('c','apocalyptic','B')`, 'reject'],
];

for (const [label, sql, expectation] of cases) {
  let rejected = false;
  try {
    await db.query(sql);
  } catch {
    rejected = true;
  }
  const ok = rejected === (expectation === 'reject');
  check(ok, `${expectation}s ${label}`, rejected ? 'it was rejected' : 'it was accepted');
}

console.log(
  failures === 0
    ? '\nverify-schema: OK — the blob applies idempotently and every constraint enforces.\n'
    : `\nverify-schema: ${failures} check(s) FAILED.\n`,
);
process.exit(failures === 0 ? 0 : 1);
