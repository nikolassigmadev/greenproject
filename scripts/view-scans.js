#!/usr/bin/env node
/**
 * Local viewer for the scan-analytics database (data/scans.db).
 *
 * Two private ways to see scans (both gated to you only):
 *   1. scripts/pull-scans.sh — downloads the report over HTTPS using your admin
 *      password (works from your Mac, no SSH). Use this for the LIVE server.
 *   2. this script — reads a local data/scans.db file directly (handy for local
 *      testing, or after you SFTP the production DB down).
 * There is no in-app page and the data/ directory is gitignored, so the DB
 * never ships to users.
 *
 * Usage (run from the project root, on a machine that has the DB file):
 *   node scripts/view-scans.js                 # top 50 most-scanned products
 *   node scripts/view-scans.js coffee          # filter by name / brand / barcode
 *   node scripts/view-scans.js --limit 200     # show more rows
 *   node scripts/view-scans.js --csv > out.csv # export the visible list as CSV
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'data', 'scans.db');

if (!existsSync(DB_PATH)) {
  console.error(`No scan database yet at ${DB_PATH}.`);
  console.error('It is created automatically the first time a product is scanned against a running server.');
  process.exit(1);
}

const args = process.argv.slice(2);
const csv = args.includes('--csv');
const limIdx = args.indexOf('--limit');
const limit = limIdx >= 0 ? Math.max(1, parseInt(args[limIdx + 1], 10) || 50) : 50;
const q = args
  .filter((a, i) => !a.startsWith('--') && !(limIdx >= 0 && i === limIdx + 1))
  .join(' ')
  .trim();

const Database = require('better-sqlite3');
const db = new Database(DB_PATH, { readonly: true });

const totals = db
  .prepare("SELECT COUNT(*) totalScans, COUNT(DISTINCT COALESCE(NULLIF(barcode, ''), name)) uniqueProducts FROM scans")
  .get();

const where = q ? 'WHERE name LIKE @like OR brand LIKE @like OR barcode LIKE @like' : '';
const rows = db.prepare(`
  SELECT COALESCE(barcode, '') barcode, name, MAX(brand) brand,
         MAX(eco_grade) ecoGrade, COUNT(*) count, MAX(ts) lastSeen
  FROM scans
  ${where}
  GROUP BY COALESCE(NULLIF(barcode, ''), name)
  ORDER BY count DESC, lastSeen DESC
  LIMIT @limit
`).all(q ? { like: `%${q}%`, limit } : { limit });

if (csv) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  console.log('rank,name,brand,barcode,eco_grade,times_scanned,last_seen_iso');
  rows.forEach((r, i) =>
    console.log([i + 1, r.name, r.brand ?? '', r.barcode, r.ecoGrade ?? '', r.count, new Date(r.lastSeen).toISOString()].map(esc).join(',')),
  );
} else {
  console.log(`\n  GoodScan — scanned products${q ? ` matching "${q}"` : ''}`);
  console.log(`  ${totals.totalScans} total scans · ${totals.uniqueProducts} unique products\n`);
  if (rows.length === 0) {
    console.log('  (nothing recorded yet)\n');
  } else {
    rows.forEach((r, i) => {
      const rank = String(i + 1).padStart(3);
      const count = String(r.count).padStart(6);
      const label = (r.name + (r.brand ? ` — ${r.brand}` : '')).slice(0, 64);
      console.log(`  ${rank}.${count}×  ${label}`);
    });
    console.log('');
  }
}

db.close();
