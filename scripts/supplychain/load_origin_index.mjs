/**
 * Load origin_index.csv into Postgres.
 *
 * Run after build_origin_index.py. Idempotent — re-running upserts by barcode,
 * so a nightly rebuild is safe to repeat and a failed run can just be re-run.
 *
 *   node scripts/supplychain/load_origin_index.mjs /path/to/origin_index.csv
 *   node scripts/supplychain/load_origin_index.mjs origin_index.csv --limit 50000
 *
 * Storage note: the full index is on the order of a million rows and the
 * `claims` JSONB dominates its size. Supabase's free tier caps at 500 MB, so
 * check `--dry-run` output against your plan before a full load.
 */

import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import dotenv from 'dotenv';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
dotenv.config({ path: join(ROOT, '.env.local') });
dotenv.config({ path: join(ROOT, '.env') });

const { initOriginIndex, originIndexReady, upsertOriginRecords, closeOriginIndex } =
  await import('../../db/originIndex.js');

const file = process.argv[2];
if (!file) {
  console.error('usage: node load_origin_index.mjs <origin_index.csv> [--limit N] [--dry-run]');
  process.exit(1);
}
const li = process.argv.indexOf('--limit');
const LIMIT = li !== -1 ? parseInt(process.argv[li + 1], 10) : Infinity;
const si = process.argv.indexOf('--skip');
const SKIP = si !== -1 ? parseInt(process.argv[si + 1], 10) : 0;
const DRY = process.argv.includes('--dry-run');

/** Minimal RFC-4180 CSV line parser — the `claims` column is quoted JSON. */
function parseLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false;
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

await initOriginIndex();
if (!DRY && !originIndexReady()) {
  console.error('Postgres is not reachable — nothing loaded.');
  process.exit(1);
}

const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
let header = null;
let batch = [];
let total = 0;
let skipped = 0;
let bytes = 0;
const BATCH = 2000;
const started = Date.now();

async function flush() {
  if (!batch.length) return;
  // Defence in depth: Postgres rejects an entire INSERT with SQLSTATE 21000 if
  // two rows in it share the conflict key, and Open Food Facts really does
  // contain duplicate barcodes. The builder dedups too; this makes sure one
  // upstream duplicate can never kill a long load again. Last row wins.
  if (batch.length > 1) {
    const byCode = new Map();
    for (const r of batch) byCode.set(r.code, r);
    if (byCode.size !== batch.length) batch = [...byCode.values()];
  }
  // Retry a batch rather than losing the run to one dropped connection. The
  // upsert is idempotent on `code`, so re-sending a batch is always safe.
  if (!DRY) {
    for (let attempt = 0; ; attempt++) {
      try {
        await upsertOriginRecords(batch);
        break;
      } catch (e) {
        if (attempt >= 4) throw e;
        process.stdout.write(`\n  retry ${attempt + 1} after: ${e.message}\n`);
        await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
      }
    }
  }
  total += batch.length;
  batch = [];
  const secs = (Date.now() - started) / 1000;
  process.stdout.write(
    `\r  ${total.toLocaleString()} rows  ${(total / secs).toFixed(0)}/s  ` +
    `${(bytes / 1e6).toFixed(0)} MB read   `,
  );
}

for await (const line of rl) {
  if (!line) continue;
  bytes += line.length + 1;
  if (!header) { header = parseLine(line); continue; }
  // --skip resumes a run that died partway. Rows are emitted in a stable order,
  // so skipping N data lines picks up exactly where the last run stopped.
  if (skipped < SKIP) { skipped++; continue; }
  if (total + batch.length >= LIMIT) break;
  const f = parseLine(line);
  const row = Object.fromEntries(header.map((h, i) => [h, f[i]]));
  if (!row.code) continue;
  batch.push({
    code: row.code,
    market: row.market || null,
    brand: row.brand || null,
    best_tier: row.best_tier || 'unknown',
    commodities: row.commodities || null,
    claims: row.claims || '[]',
    n_claims: parseInt(row.n_claims, 10) || 0,
  });
  if (batch.length >= BATCH) await flush();
}
await flush();

console.log(
  `\n${DRY ? '[dry run] would load' : 'loaded'} ${total.toLocaleString()} rows ` +
  `in ${((Date.now() - started) / 1000).toFixed(0)}s ` +
  `(~${(bytes / 1e6).toFixed(0)} MB of CSV)`,
);
await closeOriginIndex();
