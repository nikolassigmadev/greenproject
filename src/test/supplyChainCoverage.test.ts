/**
 * Supply-chain map coverage harness.
 *
 * Answers one question with a real number: for what share of real products does
 * the map under the verdict actually show an origin?
 *
 * Fetches live products from Open Food Facts across a spread of categories,
 * runs the real resolver over each, and reports coverage. Run it before and
 * after a change to the resolver to see whether coverage moved — the whole
 * point is that "it feels like more products have data now" is not evidence.
 *
 * Live network, so it is skipped by default. Run with:
 *   SUPPLY_CHAIN_COVERAGE=1 npx vitest run src/test/supplyChainCoverage.test.ts
 */

import { describe, it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolveSupplyChain } from '@/services/supplyChain/resolve';
import type { OpenFoodFactsResult } from '@/services/openfoodfacts/types';

const ENABLED = process.env.SUPPLY_CHAIN_COVERAGE === '1';

// A spread of what people actually scan, not a cocoa-only sample that would
// flatter the resolver. Includes categories with no plausible tracked
// commodity (water, salt) because those are part of an honest denominator.
const CATEGORIES = [
  'chocolates', 'coffees', 'teas', 'breakfast-cereals', 'biscuits',
  'snacks', 'sodas', 'yogurts', 'breads', 'pastas',
  'rices', 'sauces', 'cheeses', 'crisps', 'ice-creams',
  'waters', 'juices', 'candies', 'spreads', 'canned-fish',
];

const PER_CATEGORY = 15;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Open Food Facts rate-limits search hard — firing all 20 categories in
 * parallel returned 503 for 19 of them and a silent 15-product sample, which
 * would have produced a confident and completely fictional coverage number.
 * So: sequential, spaced, and retried.
 */
async function fetchCategory(cat: string, attempt = 0): Promise<OpenFoodFactsResult[]> {
  const url =
    `https://world.openfoodfacts.org/api/v2/search?categories_tags_en=${encodeURIComponent(cat)}` +
    `&fields=code,product_name,brands,origins,ingredients_text,categories_tags,labels_tags` +
    `&page_size=${PER_CATEGORY}&json=1`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'GoodScan-coverage-harness/1.0' } });
    if (r.status === 503 && attempt < 3) {
      await sleep(8000 * (attempt + 1));
      return fetchCategory(cat, attempt + 1);
    }
    if (!r.ok) { console.warn(`[coverage] ${cat}: HTTP ${r.status}, skipped`); return []; }
    const j = (await r.json()) as { products?: Record<string, unknown>[] };
    return (j.products ?? []).map((p) => ({
      found: true,
      barcode: String(p.code ?? ''),
      productName: (p.product_name as string) || null,
      brand: (p.brands as string) || null,
      ecoscoreGrade: null, ecoscoreScore: null,
      nutriscoreGrade: null, nutriscoreScore: null, novaGroup: null,
      carbonFootprint100g: null, carbonFootprintProduct: null, carbonFootprintServing: null,
      labels: (p.labels_tags as string[]) ?? [],
      categories: (p.categories_tags as string[]) ?? [],
      origins: (p.origins as string) || null,
      ingredientsText: (p.ingredients_text as string) || null,
      imageUrl: null, ecoscoreData: null,
      rawProduct: p as never,
    })) as OpenFoodFactsResult[];
  } catch {
    return [];
  }
}

describe('supply-chain map coverage', () => {
  it.skipIf(!ENABLED)('measures how many real products get an origin', async () => {
    const batches: OpenFoodFactsResult[][] = [];
    for (const cat of CATEGORIES) {
      batches.push(await fetchCategory(cat));
      await sleep(4000); // stay under OFF's search rate limit
    }
    const products = batches.flat().filter((p) => p.barcode);
    // Guard the denominator: a truncated sample makes the percentage a
    // fiction, and a fiction that looks like a measurement is worse than none.
    expect(products.length).toBeGreaterThan(150);

    let withOrigin = 0;
    let withIngredients = 0;
    const byCategory = new Map<string, { total: number; covered: number }>();
    const misses: string[] = [];

    products.forEach((p, i) => {
      const cat = CATEGORIES[Math.floor(i / PER_CATEGORY)] ?? 'unknown';
      const chain = resolveSupplyChain(p, null);
      const origins = chain.nodes.filter((n) => n.kind === 'origin');
      if (p.ingredientsText) withIngredients++;

      const rec = byCategory.get(cat) ?? { total: 0, covered: 0 };
      rec.total++;
      if (origins.length > 0) { rec.covered++; withOrigin++; }
      else misses.push(`${cat} | ${p.brand ?? '?'} | ${p.productName ?? '?'}`);
      byCategory.set(cat, rec);
    });

    const pct = (n: number) => `${((n / products.length) * 100).toFixed(1)}%`;
    const lines = [
      '# Supply-chain map coverage',
      '',
      `Sampled ${products.length} live Open Food Facts products across ${CATEGORIES.length} categories.`,
      '',
      `- Products showing at least one ORIGIN: ${withOrigin} (${pct(withOrigin)})`,
      `- Products with an ingredients list at all: ${withIngredients} (${pct(withIngredients)})`,
      '',
      '## By category',
      '',
      '| Category | Sampled | With origin | Coverage |',
      '| --- | --- | --- | --- |',
      ...[...byCategory.entries()].map(([c, r]) =>
        `| ${c} | ${r.total} | ${r.covered} | ${r.total ? ((r.covered / r.total) * 100).toFixed(0) : 0}% |`),
      '',
      '## Misses (first 60)',
      '',
      ...misses.slice(0, 60).map((m) => `- ${m}`),
    ];
    writeFileSync('docs/supply-chain-coverage.md', lines.join('\n') + '\n');

    console.log(`\n[coverage] ${withOrigin}/${products.length} products show an origin (${pct(withOrigin)})`);
    console.log(`[coverage] ${withIngredients}/${products.length} have ingredients text (${pct(withIngredients)})`);
    console.log('[coverage] → docs/supply-chain-coverage.md');
  }, 600_000);
});
