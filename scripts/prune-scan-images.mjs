#!/usr/bin/env node
// Drops scan photos we no longer have a reason to keep.
//
// Every camera scan stores the photo inline in ai_scans.image as base64. That
// earns its keep for a scan that FAILED — the photo is the only way to work out
// what the user was actually holding, and it feeds scripts/miss-corpus.mjs.
// For a scan that resolved fine, the photo is a picture of a product we already
// identified, held indefinitely, of someone's kitchen or someone's shopping.
//
// So: null the image where the scan resolved and the row is older than the
// retention window. Unresolved rows keep their photos for as long as they stay
// unresolved — that is exactly where they're useful.
//
// The row itself is never deleted; only the image is cleared. The analytics
// stay intact.
//
// Usage:
//   node scripts/prune-scan-images.mjs                # dry run (default)
//   node scripts/prune-scan-images.mjs --days 30 --apply
//   node scripts/prune-scan-images.mjs --apply --batch 200
//
// Run it by hand and read the count before putting it anywhere near a
// schedule. A retention job is the one kind of job where "it did more than I
// expected" is unrecoverable.

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import dotenv from 'dotenv';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: join(ROOT, '.env.local') });
dotenv.config({ path: join(ROOT, '.env') });

const { initScanStore, scanStoreReady, queryScanStore, closeScanStore } =
  await import('../db/scanStore.js');

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const DAYS = Math.min(Math.max(parseInt(arg('days', '30'), 10) || 30, 1), 3650);
const BATCH = Math.min(Math.max(parseInt(arg('batch', '500'), 10) || 500, 1), 5000);
const APPLY = process.argv.includes('--apply');

// One predicate, defined once, used by both the count and the update. Two
// copies of a delete condition is how a dry run stops describing the real one.
const WHERE = `
  image IS NOT NULL
  AND resolved = true
  AND created_at < now() - ($1 || ' days')::interval
`;

await initScanStore();
if (!scanStoreReady()) {
  console.error('prune-scan-images: Postgres unavailable — set DATABASE_URL. Nothing changed.');
  process.exit(1);
}

const survey = (
  await queryScanStore(
    `SELECT
       count(*) FILTER (WHERE image IS NOT NULL)::int                        AS images_held,
       count(*) FILTER (WHERE image IS NOT NULL AND resolved = false)::int   AS kept_unresolved,
       (SELECT count(*)::int FROM ai_scans WHERE ${WHERE})                   AS eligible,
       (SELECT coalesce(sum(length(image)), 0)::bigint FROM ai_scans WHERE ${WHERE}) AS bytes_b64
     FROM ai_scans`,
    [String(DAYS)],
  )
).rows[0];

const mb = (Number(survey.bytes_b64) * 0.75) / 1_048_576; // base64 -> bytes
console.log(`\nretention window: ${DAYS} days`);
console.log(`  ${survey.images_held} photo(s) currently stored`);
console.log(`  ${survey.kept_unresolved} kept regardless — the scan never resolved`);
console.log(`  ${survey.eligible} eligible to clear (~${mb.toFixed(1)} MB decoded)`);

if (survey.eligible === 0) {
  console.log('\nNothing to do.\n');
  await closeScanStore();
  process.exit(0);
}

// Show what's actually in scope before touching it.
const sample = await queryScanStore(
  `SELECT id, product_name, created_at FROM ai_scans WHERE ${WHERE} ORDER BY created_at LIMIT 5`,
  [String(DAYS)],
);
console.log('\n  oldest in scope:');
for (const r of sample.rows) {
  console.log(`    #${r.id}  ${r.created_at.toISOString().slice(0, 10)}  ${r.product_name ?? '(no name)'}`);
}

if (!APPLY) {
  console.log(`\nDry run. Re-run with --apply to clear ${survey.eligible} image(s).\n`);
  await closeScanStore();
  process.exit(0);
}

// Batched, so a large first run doesn't hold one long transaction open against
// a hosted database.
let cleared = 0;
for (;;) {
  const res = await queryScanStore(
    `UPDATE ai_scans SET image = NULL
      WHERE id IN (SELECT id FROM ai_scans WHERE ${WHERE} ORDER BY created_at LIMIT $2)`,
    [String(DAYS), BATCH],
  );
  if (res.rowCount === 0) break;
  cleared += res.rowCount;
  console.log(`  cleared ${cleared}/${survey.eligible}…`);
}

const after = (
  await queryScanStore(
    `SELECT count(*) FILTER (WHERE image IS NOT NULL)::int AS images_held,
            (SELECT count(*)::int FROM ai_scans WHERE ${WHERE}) AS still_eligible
       FROM ai_scans`,
    [String(DAYS)],
  )
).rows[0];

console.log(`\ncleared ${cleared} image(s).`);
console.log(`  ${after.images_held} photo(s) still stored, ${after.still_eligible} still eligible.`);
console.log('  (Postgres reclaims the space on the next autovacuum.)\n');

await closeScanStore();
