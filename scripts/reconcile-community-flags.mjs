#!/usr/bin/env node
// Reconciles data/community-flags.jsonl against the community_flags table.
//
// The server dual-writes every submission: JSONL first (synchronous, on disk),
// then Postgres (fire-and-forget). Anything that arrives while the database is
// unreachable — or before DATABASE_URL was ever set — exists only in the JSONL.
// Nothing has ever closed that gap, so the queryable copy is quietly incomplete
// and there is no way to tell by looking at it.
//
// The JSONL is the source of truth: it is written first, synchronously, and it
// is the copy that survives a database being recreated.
//
// Replay goes through insertCommunityFlag() — the exact function the live path
// uses — so the reconciliation can't drift from the real insert. It is already
// ON CONFLICT (id) DO NOTHING, so replaying is safe to repeat.
//
// Usage:
//   node scripts/reconcile-community-flags.mjs           # report only (default)
//   node scripts/reconcile-community-flags.mjs --apply   # insert missing rows
//   node scripts/reconcile-community-flags.mjs --apply --fix-status
//
// --fix-status also pushes moderation decisions from the JSONL onto rows that
// already exist. ON CONFLICT DO NOTHING can't do that by definition: a flag
// approved while the database was down stays pending_review in Postgres forever.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import dotenv from 'dotenv';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: join(ROOT, '.env.local') });
dotenv.config({ path: join(ROOT, '.env') });

const {
  initScanStore, scanStoreReady, insertCommunityFlag, listCommunityFlags,
  setCommunityFlagStatus, closeScanStore,
} = await import('../db/scanStore.js');

const APPLY = process.argv.includes('--apply');
const FIX_STATUS = process.argv.includes('--fix-status');
const JSONL = join(ROOT, 'data/community-flags.jsonl');

function readJsonl(path) {
  if (!existsSync(path)) return { records: [], malformed: 0 };
  const records = [];
  let malformed = 0;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t) continue;
    try {
      const r = JSON.parse(t);
      if (r && typeof r.id === 'string') records.push(r);
      else malformed++;
    } catch {
      malformed++;
    }
  }
  return { records, malformed };
}

const { records, malformed } = readJsonl(JSONL);
console.log(`\nJSONL   ${JSONL}`);
console.log(`        ${records.length} records${malformed ? `, ${malformed} unparseable line(s)` : ''}`);

// Duplicate ids in the JSONL itself would make the counts below lie.
const seen = new Map();
const dupes = [];
for (const r of records) {
  if (seen.has(r.id)) dupes.push(r.id);
  else seen.set(r.id, r);
}
if (dupes.length) console.log(`        ${dupes.length} duplicate id(s) in the file — last write wins: ${dupes.slice(0, 5).join(', ')}`);

await initScanStore();
if (!scanStoreReady()) {
  console.error(
    '\nPostgres unavailable — set DATABASE_URL (in .env.local or the environment).\n' +
      'Nothing was changed.',
  );
  process.exit(1);
}

const dbRows = await listCommunityFlags();
const dbById = new Map(dbRows.map((r) => [r.id, r]));
console.log(`Postgres ${dbRows.length} rows in community_flags\n`);

// ── Drift ────────────────────────────────────────────────────────────────────
const missingInDb = [...seen.values()].filter((r) => !dbById.has(r.id));
const missingInJsonl = dbRows.filter((r) => !seen.has(r.id));
const statusDrift = [...seen.values()]
  .filter((r) => dbById.has(r.id))
  .map((r) => ({ id: r.id, jsonl: r.status || 'pending_review', db: dbById.get(r.id).status }))
  .filter((d) => d.jsonl !== d.db);

console.log('drift');
console.log(`  ${missingInDb.length} in JSONL but not in Postgres   (the dual-write gap)`);
console.log(`  ${missingInJsonl.length} in Postgres but not in JSONL   (investigate — the JSONL is written first)`);
console.log(`  ${statusDrift.length} status mismatch(es)              (ON CONFLICT DO NOTHING can't fix these)`);

for (const r of missingInDb.slice(0, 20)) {
  console.log(`    + ${r.id}  ${r.submission?.brandName ?? '?'}  ${r.status ?? 'pending_review'}`);
}
if (missingInDb.length > 20) console.log(`    … and ${missingInDb.length - 20} more`);
for (const r of missingInJsonl.slice(0, 20)) {
  console.log(`    ? ${r.id}  ${r.brand_name}  ${r.status}  — only in Postgres`);
}
for (const d of statusDrift.slice(0, 20)) {
  console.log(`    ~ ${d.id}  JSONL=${d.jsonl}  Postgres=${d.db}`);
}

// ── Apply ────────────────────────────────────────────────────────────────────
if (!APPLY) {
  const todo = missingInDb.length + (FIX_STATUS ? statusDrift.length : 0);
  console.log(
    todo === 0
      ? '\nIn sync. Nothing to do.\n'
      : `\nDry run. Re-run with --apply${statusDrift.length && !FIX_STATUS ? ' --fix-status' : ''} to write ${todo} change(s).\n`,
  );
  await closeScanStore();
  process.exit(0);
}

let inserted = 0;
let alreadyThere = 0;
let failed = 0;
for (const r of missingInDb) {
  try {
    if (await insertCommunityFlag(r)) inserted++;
    else alreadyThere++;  // raced with a live submission
  } catch (e) {
    failed++;
    console.error(`    ! ${r.id}: ${e.message}`);
  }
}

let restatused = 0;
if (FIX_STATUS) {
  for (const d of statusDrift) {
    try {
      const rec = seen.get(d.id);
      if (await setCommunityFlagStatus(d.id, d.jsonl, rec?.moderatorNote ?? null)) restatused++;
    } catch (e) {
      failed++;
      console.error(`    ! ${d.id}: ${e.message}`);
    }
  }
}

console.log(`\napplied`);
console.log(`  ${inserted} inserted`);
if (alreadyThere) console.log(`  ${alreadyThere} already present (raced with a live submission)`);
if (FIX_STATUS) console.log(`  ${restatused} status(es) corrected`);
if (failed) console.log(`  ${failed} FAILED`);

// Confirm rather than assume.
const after = await listCommunityFlags();
console.log(`\nPostgres now holds ${after.length} rows (JSONL has ${seen.size} unique ids).`);
await closeScanStore();
process.exit(failed === 0 ? 0 : 1);
