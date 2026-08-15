// Live end-to-end check of the supermarket shelf search.
//
// Skipped unless RUN_LIVE=1, because it hits Open Food Facts. Run it before
// shipping changes to the shelf engine — the unit tests can prove the ordering
// logic, but only this can tell you whether real products come back at all.
//
//   RUN_LIVE=1 npx vitest run src/test/supermarketLive.test.ts

import { describe, it, expect } from 'vitest';
import { searchShelf, buildReasons } from "@/services/supermarket";
import { getRetailerById } from '@/data/retailers';
import { getCategoryBaseline, MIN_SAMPLE } from '@/services/baseline';

const LIVE = process.env.RUN_LIVE === '1';
const d = LIVE ? describe : describe.skip;

d('supermarket shelf search (live)', () => {
  it('returns ranked chocolate picks for Tesco in the UK', async () => {
    const tesco = getRetailerById('tesco')!;
    const res = await searchShelf('chocolate', tesco, {
      region: { countryCode: 'GB', country: 'United Kingdom', setAt: Date.now() },
      limit: 6,
    });

    expect(res.categoryKey).toBe('chocolate');
    expect(res.picks.length).toBeGreaterThan(0);

    for (const p of res.picks) {
      // Every pick must carry an availability verdict we can defend.
      expect(['confirmed_here', 'seen_at_chain', 'sold_in_market', 'unknown'])
        .toContain(p.availability.confidence);
      // And must never claim stock.
      expect(p.availability.label.toLowerCase()).not.toContain('in stock');
      expect(p.availability.explain.length).toBeGreaterThan(10);
    }

    // Availability must be non-increasing down the list.
    const rank = { confirmed_here: 3, seen_at_chain: 2, sold_in_market: 1, unknown: 0 };
    const seq = res.picks.map((p) => rank[p.availability.confidence]);
    expect([...seq].sort((a, b) => b - a)).toEqual(seq);

    console.log(`\nTesco GB / chocolate — ${res.picks.length} picks`);
    for (const p of res.picks) {
      console.log(
        `  ${p.brand.padEnd(24)} ${p.availability.confidence.padEnd(15)}` +
        ` verdict=${p.verdict.padEnd(9)} score=${p.score ?? '—'}` +
        ` saved=${p.comparison?.co2SavedKg ?? '—'}` +
        ` | ${p.reasons[0]?.text ?? ''}`,
      );
    }
  }, 90_000);

  it('builds a category baseline with a real sample size', async () => {
    const b = await getCategoryBaseline('chocolate', 'GB', { force: true });
    console.log(
      `\nbaseline: ${b.sampleSize} products, ` +
      `meanCo2=${b.meanCo2Kg?.toFixed(2) ?? '—'} (n=${b.co2SampleSize}), ` +
      `meanEco=${b.meanEcoScore?.toFixed(1) ?? '—'} (n=${b.ecoSampleSize}), ` +
      `flagged=${b.flaggedShare != null ? Math.round(b.flaggedShare * 100) + '%' : '—'}`,
    );
    expect(b.categoryKey).toBe('chocolate');
    // Whatever it found, it must be honest about whether that is enough.
    expect(b.tooSmall).toBe(b.sampleSize < MIN_SAMPLE);
    if (!b.tooSmall) expect(b.sampleSize).toBeGreaterThanOrEqual(MIN_SAMPLE);
  }, 90_000);

  it('routes an uncovered product to the search path', async () => {
    // The point of the search path: a shopper types what they want, not what
    // our vetted list happens to include. "oat milk" and "peanut butter" DO map
    // to catalogue categories (milk, spreads); "olive oil" genuinely doesn't.
    //
    // Note this exercise needs the backend proxy — searchProducts() goes via
    // /api/openfoodfacts/search, unlike browseProducts which reaches OFF
    // directly. With no server running the picks come back empty, which is a
    // legitimate degradation and not a failure of routing, so the routing is
    // what's asserted here and the results are verified in the browser.
    const tesco = getRetailerById('tesco')!;
    const res = await searchShelf('olive oil', tesco, {
      region: { countryCode: 'GB', country: 'United Kingdom', setAt: Date.now() },
      limit: 5,
    });
    expect(res.source).toBe('search');
    expect(res.categoryKey).toBeNull();
    console.log(`\nTesco GB / "olive oil" (search path) — ${res.picks.length} picks`);
    for (const p of res.picks) {
      // Search results are explicitly NOT vetted, and must say so.
      expect(p.vetted).toBe(false);
      // Every pick still gets a readable breakdown, never a bare number.
      expect(p.reasons.length).toBeGreaterThan(0);
      for (const r of p.reasons) expect(r.text.length).toBeGreaterThan(5);
      console.log(`  ${p.brand.padEnd(22)} ${p.verdict.padEnd(9)} ${p.reasons[0].text}`);
    }
  }, 90_000);

  it('writes a plain-English breakdown with no bare numbers', () => {
    // The readability rule, checked directly: every reason has to be a sentence
    // that says which direction it points. "3.28" is a unit, not an insight.
    const reasons = buildReasons(null, 'Nestlé', 'KitKat', [], null);
    expect(reasons.length).toBeGreaterThan(0);
    for (const r of reasons) {
      expect(['good', 'bad', 'neutral']).toContain(r.tone);
      expect(r.text).toMatch(/[a-z]{4}/i);        // actual words
      expect(r.text).not.toMatch(/^\s*[\d.]+\s*$/); // never a lone figure
    }
    // A flagged brand must produce a 'bad' line rather than silently passing.
    expect(reasons.some((r) => r.tone === 'bad')).toBe(true);
  });

  it('finds picks for an Indonesian chain', async () => {
    const pepito = getRetailerById('pepito')!;
    const res = await searchShelf('chocolate', pepito, {
      region: { countryCode: 'ID', country: 'Indonesia', setAt: Date.now() },
      limit: 6,
    });
    console.log(`\nPepito ID / chocolate — ${res.picks.length} picks, baseline n=${res.baseline?.sampleSize ?? 0}`);
    // Coverage in Indonesia is thin; the point is that it degrades honestly
    // rather than fabricating availability.
    for (const p of res.picks) {
      expect(p.availability.label.toLowerCase()).not.toContain('in stock');
    }
  }, 90_000);
});
