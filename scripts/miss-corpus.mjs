#!/usr/bin/env node
// Ranks the scans that never resolved to a product.
//
// ai_scans.resolved = false is the record of every time someone pointed the
// camera at something and got nothing back. Those rows have been accumulating
// with nobody reading them, which means the single best list of what to add to
// the bundled data — ordered by how many real people hit it — exists and has
// never been looked at.
//
// Ranked by frequency x distinct users, not frequency alone: one person
// rescanning the same failing jar twenty times is a bug report, not a coverage
// gap. Something twenty different people hit once is the gap.
//
// Pure read. No writes, no deletes, no schema changes.
//
// Usage:
//   node scripts/miss-corpus.mjs                 # top 40, last 90 days
//   node scripts/miss-corpus.mjs --limit 100 --days 30
//   node scripts/miss-corpus.mjs --csv > misses.csv

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
const LIMIT = Math.min(Math.max(parseInt(arg('limit', '40'), 10) || 40, 1), 500);
const DAYS = Math.min(Math.max(parseInt(arg('days', '90'), 10) || 90, 1), 3650);
const CSV = process.argv.includes('--csv');

await initScanStore();
if (!scanStoreReady()) {
  console.error('miss-corpus: Postgres unavailable — set DATABASE_URL.');
  process.exit(1);
}

// Cluster key: the text we have for the miss, lowercased with punctuation and
// pack sizes stripped, so "Indomie Goreng 85g" and "indomie goreng" land in the
// same bucket. Deliberately crude — this is a ranking aid, not a taxonomy, and
// a clever normaliser would merge things that shouldn't be merged.
const SQL = `
  WITH misses AS (
    SELECT
      lower(
        regexp_replace(
          regexp_replace(
            coalesce(nullif(trim(openai_response), ''), product_name, ''),
            '\\m[0-9]+\\s*(g|kg|ml|l|oz|lb|pcs?|pack)\\M', ' ', 'gi'
          ),
          '[^a-z0-9 ]+', ' ', 'gi'
        )
      )                                              AS cleaned,
      lower(coalesce(nullif(trim(brand), ''), ''))   AS brand_token,
      user_id,
      country,
      created_at,
      image IS NOT NULL                              AS had_image
    FROM ai_scans
    WHERE resolved = false
      AND created_at > now() - ($1 || ' days')::interval
  )
  SELECT
    btrim(regexp_replace(cleaned, '\\s+', ' ', 'g')) AS cleaned,
    brand_token,
    count(*)::int                                    AS hits,
    count(DISTINCT user_id)::int                     AS users,
    count(*) FILTER (WHERE had_image)::int           AS with_photo,
    array_agg(DISTINCT country) FILTER (WHERE country IS NOT NULL) AS countries,
    max(created_at)                                  AS last_seen
  FROM misses
  WHERE btrim(cleaned) <> ''
  GROUP BY 1, 2
  ORDER BY (count(*) * count(DISTINCT user_id)) DESC, count(*) DESC
  LIMIT $2
`;

const { rows } = await queryScanStore(SQL, [String(DAYS), LIMIT]);

const totals = (
  await queryScanStore(
    `SELECT count(*) FILTER (WHERE resolved = false)::int AS misses,
            count(*)::int                                 AS total,
            count(DISTINCT user_id) FILTER (WHERE resolved = false)::int AS affected_users
       FROM ai_scans
      WHERE created_at > now() - ($1 || ' days')::interval`,
    [String(DAYS)],
  )
).rows[0];

if (CSV) {
  console.log('rank,score,hits,users,with_photo,brand,cleaned,countries,last_seen');
  rows.forEach((r, i) => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    console.log(
      [
        i + 1, r.hits * r.users, r.hits, r.users, r.with_photo,
        esc(r.brand_token), esc(r.cleaned), esc((r.countries || []).join(' ')),
        r.last_seen?.toISOString?.() ?? r.last_seen,
      ].join(','),
    );
  });
  await closeScanStore();
  process.exit(0);
}

const pct = totals.total ? ((totals.misses / totals.total) * 100).toFixed(1) : '0.0';
console.log(`\nLast ${DAYS} days: ${totals.misses} unresolved of ${totals.total} scans (${pct}%), across ${totals.affected_users} device(s).`);

if (rows.length === 0) {
  console.log('\nNo unresolved scans in that window.\n');
  await closeScanStore();
  process.exit(0);
}

console.log(`\nTop ${rows.length} coverage gaps — ranked by hits x distinct users:\n`);
console.log('  #  score  hits users  photo  what the scan read');
console.log('  ─  ─────  ──── ─────  ─────  ──────────────────');
rows.forEach((r, i) => {
  const label = r.brand_token ? `${r.brand_token} — ${r.cleaned}` : r.cleaned;
  console.log(
    `  ${String(i + 1).padStart(2)}  ${String(r.hits * r.users).padStart(5)}  ` +
      `${String(r.hits).padStart(4)} ${String(r.users).padStart(5)}  ` +
      `${String(r.with_photo).padStart(5)}  ${label.slice(0, 60)}` +
      `${r.countries?.length ? `  [${r.countries.join(',')}]` : ''}`,
  );
});

console.log(
  '\nHigh users relative to hits = a real gap in the bundled data.\n' +
    'High hits with users = 1 = one device retrying; look at the photo before adding anything.\n' +
    'Photos for these rows are exempt from the retention job while they stay unresolved.\n',
);

await closeScanStore();
