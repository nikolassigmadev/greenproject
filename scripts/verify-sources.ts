#!/usr/bin/env npx tsx
/**
 * Audits every citation the app renders as evidence.
 *
 * Two different failures, and the second is the serious one:
 *
 *  1. Dead links. A source that 404s can't be checked by anyone.
 *  2. Homepages. `hrw.org/`, `danwatch.dk/en/`, `fairlabor.org/`, `ran.org/`
 *     are cited next to a specific allegation. An organisation's front page
 *     cannot verify a specific claim — it can only signal that a real
 *     organisation exists. A reader who clicks through to check us finds
 *     nothing, which is worse than citing nothing at all, because the citation
 *     implied there was something to find.
 *
 * Covers src/data/brandFlags.v2.ts (FlagSource.url), src/utils/laborCheck.ts
 * (allegation.sourceUrl) and src/data/commoditySupplyChains.ts (sourceUrl).
 *
 * Usage:
 *   npx tsx scripts/verify-sources.ts              # full audit, live requests
 *   npx tsx scripts/verify-sources.ts --offline    # shape checks only, no network
 *   npx tsx scripts/verify-sources.ts --csv out.csv
 *
 * Exit codes:
 *   0  no homepage citations (dead links are reported but don't fail)
 *   1  at least one homepage-shaped citation — the failure worth blocking on
 *
 * CI runs it with --offline: the homepage check is deterministic and is the one
 * that must never regress, while liveness depends on other people's servers and
 * would make the build flaky for reasons that aren't our fault.
 */

import { writeFileSync } from 'node:fs';
import { brandFlagsV2 } from '../src/data/brandFlags.v2';
import { LABOR_DATABASE } from '../src/utils/laborCheck';
import { ALL_COMMODITY_COMPANIES } from '../src/data/commoditySupplyChains';

interface Citation {
  dataset: string;
  owner: string;   // brand / company the citation is attached to
  claim: string;   // what it is cited for
  publisher: string;
  url: string;
}

// ── Collect ──────────────────────────────────────────────────────────────────

const citations: Citation[] = [];

for (const flag of brandFlagsV2) {
  for (const s of flag.sources) {
    citations.push({
      dataset: 'brandFlags.v2',
      owner: flag.brandName,
      claim: `${flag.category} (${flag.claimType})`,
      publisher: s.publisher,
      url: s.url,
    });
  }
}

for (const record of LABOR_DATABASE) {
  for (const a of record.allegations) {
    citations.push({
      dataset: 'laborCheck',
      owner: record.parentCompany,
      claim: a.issue,
      publisher: a.source,
      url: a.sourceUrl,
    });
  }
}

for (const link of ALL_COMMODITY_COMPANIES) {
  if (!link.sourceUrl) continue;
  citations.push({
    dataset: 'commoditySupplyChains',
    owner: link.company,
    claim: `${link.commodity} — ${link.dataQuality}`,
    publisher: link.role,
    url: link.sourceUrl,
  });
}

// ── Homepage detection ───────────────────────────────────────────────────────

/**
 * Is this URL a front page rather than a document?
 *
 * Deliberately strict about what counts as a real permalink: a path has to
 * carry something identifying. `/en/`, `/news/`, `/reports/` are section
 * indexes — they change every week and won't contain the cited claim a year
 * from now, so they're treated the same as a bare domain.
 */
const SECTION_ONLY = new Set([
  'en', 'news', 'reports', 'report', 'research', 'about', 'home', 'index',
  'latest', 'press', 'media', 'publications', 'resources', 'campaigns', 'tags',
]);

function isHomepage(raw: string): { homepage: boolean; why: string } {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return { homepage: true, why: 'unparseable URL' };
  }
  const segments = u.pathname.split('/').filter(Boolean);
  if (segments.length === 0 && !u.search) return { homepage: true, why: 'bare domain' };
  if (segments.every((s) => SECTION_ONLY.has(s.toLowerCase())) && !u.search) {
    return { homepage: true, why: `section index (/${segments.join('/')})` };
  }
  return { homepage: false, why: '' };
}

// ── Liveness ─────────────────────────────────────────────────────────────────

async function check(url: string): Promise<{ status: number | string }> {
  // HEAD first (cheap), fall back to a ranged GET — plenty of publishers reject
  // HEAD outright and would otherwise look dead when they aren't.
  for (const method of ['HEAD', 'GET'] as const) {
    try {
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
        headers: {
          // Some publishers 403 an obviously scripted client.
          'User-Agent': 'Mozilla/5.0 (compatible; GoodScan-source-audit/1.0)',
          ...(method === 'GET' ? { Range: 'bytes=0-2048' } : {}),
        },
      });
      if (res.ok || res.status === 206) return { status: res.status };
      if (method === 'GET') return { status: res.status };
    } catch (e) {
      if (method === 'GET') return { status: (e as Error).name === 'TimeoutError' ? 'timeout' : 'network error' };
    }
  }
  return { status: 'unknown' };
}

// ── Run ──────────────────────────────────────────────────────────────────────

const OFFLINE = process.argv.includes('--offline');
const csvIdx = process.argv.indexOf('--csv');
const CSV_PATH = csvIdx !== -1 ? process.argv[csvIdx + 1] : null;

const unique = [...new Map(citations.map((c) => [c.url, c])).values()];
console.log(`\n${citations.length} citations across 3 datasets, ${unique.length} unique URLs.`);

type Row = Citation & { homepage: boolean; why: string; status: number | string };
const rows: Row[] = [];

const statusByUrl = new Map<string, number | string>();
if (!OFFLINE) {
  console.log('Checking liveness (unique URLs only)…\n');
  // Small concurrency — this hits other people's servers, and a citation audit
  // that reads as a burst of traffic is a bad way to introduce yourself.
  const queue = [...unique];
  const workers = Array.from({ length: 4 }, async () => {
    for (;;) {
      const c = queue.shift();
      if (!c) return;
      const { status } = await check(c.url);
      statusByUrl.set(c.url, status);
      const ok = typeof status === 'number' && status < 400;
      if (!ok) console.log(`  ${String(status).padEnd(14)} ${c.url}`);
    }
  });
  await Promise.all(workers);
}

for (const c of citations) {
  const { homepage, why } = isHomepage(c.url);
  rows.push({ ...c, homepage, why, status: statusByUrl.get(c.url) ?? (OFFLINE ? 'skipped' : 'unknown') });
}

const homepages = rows.filter((r) => r.homepage);
const dead = rows.filter((r) => typeof r.status === 'number' && r.status >= 400);
const unreachable = rows.filter((r) => typeof r.status === 'string' && r.status !== 'skipped');

console.log('\n─── needs a real permalink ───');
if (homepages.length === 0) {
  console.log('  none — every citation points at a specific document.');
} else {
  const byUrl = new Map<string, Row[]>();
  for (const r of homepages) byUrl.set(r.url, [...(byUrl.get(r.url) ?? []), r]);
  for (const [url, group] of byUrl) {
    console.log(`\n  ${url}`);
    console.log(`    ${group[0].why} — cited ${group.length}x`);
    for (const r of group.slice(0, 4)) {
      console.log(`      ${r.dataset}: ${r.owner} — ${r.claim}`);
    }
    if (group.length > 4) console.log(`      … and ${group.length - 4} more`);
  }
}

if (!OFFLINE) {
  console.log('\n─── unreachable ───');
  if (dead.length === 0 && unreachable.length === 0) {
    console.log('  none — every URL responded.');
  } else {
    for (const r of [...dead, ...unreachable]) {
      console.log(`  ${String(r.status).padEnd(14)} ${r.dataset}: ${r.owner} — ${r.url}`);
    }
    console.log(
      '\n  Read these carefully rather than bulk-replacing them. 403 usually means the\n' +
        '  publisher blocks scripted clients (NYT, OECD Watch) and the page is fine in a\n' +
        '  browser; 5xx is usually temporary. 404 is the one that needs action — either a\n' +
        '  new permalink or an Internet Archive snapshot of the document as cited.',
    );
  }
}

if (CSV_PATH) {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [
    'dataset,owner,claim,publisher,url,needs_permalink,reason,http_status',
    ...rows.map((r) =>
      [r.dataset, r.owner, r.claim, r.publisher, r.url, r.homepage ? 'YES' : 'no', r.why, r.status]
        .map(esc)
        .join(','),
    ),
  ].join('\n');
  writeFileSync(CSV_PATH, csv + '\n');
  console.log(`\nWrote ${rows.length} rows to ${CSV_PATH}`);
}

console.log(
  `\nsummary: ${homepages.length} citation(s) need a real permalink` +
    (OFFLINE ? '' : `, ${dead.length + unreachable.length} unreachable`) +
    '.\n',
);

// Only the homepage check gates. Liveness depends on other people's servers.
process.exit(homepages.length > 0 ? 1 : 0);
