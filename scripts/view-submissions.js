#!/usr/bin/env node
/**
 * Owner-only viewer for user-submitted brand flags (data/community-flags.jsonl).
 *
 * Like the scan data, submissions are write-only over the web (users POST them)
 * and there is NO HTTP endpoint to read them back. This script reads the file
 * directly off the server's filesystem, so only you can see submissions. The
 * data/ directory is gitignored, so it never ships to users.
 *
 * Usage (from the project root, on the server):
 *   node scripts/view-submissions.js                 # newest first
 *   node scripts/view-submissions.js nestle          # filter by brand / summary
 *   node scripts/view-submissions.js --limit 100
 *   node scripts/view-submissions.js --json          # raw records (for piping)
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, '..', 'data', 'community-flags.jsonl');

if (!existsSync(FILE)) {
  console.error(`No submissions file yet at ${FILE}.`);
  console.error('It is created the first time a user submits a flag against a running server.');
  process.exit(1);
}

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const limIdx = args.indexOf('--limit');
const limit = limIdx >= 0 ? Math.max(1, parseInt(args[limIdx + 1], 10) || 50) : 50;
const q = args
  .filter((a, i) => !a.startsWith('--') && !(limIdx >= 0 && i === limIdx + 1))
  .join(' ')
  .trim()
  .toLowerCase();

const records = readFileSync(FILE, 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => { try { return JSON.parse(l); } catch { return null; } })
  .filter(Boolean)
  .filter((r) => {
    if (!q) return true;
    const sub = r.submission || {};
    return [sub.brandName, sub.summary, sub.category].join(' ').toLowerCase().includes(q);
  })
  .sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''))
  .slice(0, limit);

if (asJson) {
  console.log(JSON.stringify(records, null, 2));
} else {
  console.log(`\n  GoodScan — user submissions${q ? ` matching "${q}"` : ''}`);
  console.log(`  ${records.length} shown\n`);
  if (records.length === 0) {
    console.log('  (nothing recorded yet)\n');
  } else {
    for (const r of records) {
      const s = r.submission || {};
      const bar = r.meetsSourcingBar ? '✓ meets bar' : '· below bar';
      const when = (r.submittedAt || '').slice(0, 16).replace('T', ' ');
      console.log(`  ${s.brandName || 'unknown'}  [${s.severity || '?'} · ${s.category || '?'}]  ${bar}  ${when}  (${r.status || 'pending'})`);
      if (s.summary) console.log(`    "${s.summary}"`);
      for (const src of s.sources || []) console.log(`    └ ${src.tier}: ${src.publisher} — ${src.url}`);
      console.log('');
    }
  }
}
