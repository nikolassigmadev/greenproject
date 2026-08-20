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

/** Minimal product stub. Only the fields the resolver reads are populated. */
function stub(over: Partial<OpenFoodFactsResult> & { labels_tags?: string[] } = {}): OpenFoodFactsResult {
  const { labels_tags, ...rest } = over;
  return {
    found: true,
    barcode: '0000000000000',
    productName: 'Test product',
    brand: null,
    ecoscoreGrade: null, ecoscoreScore: null,
    nutriscoreGrade: null, nutriscoreScore: null, novaGroup: null,
    carbonFootprint100g: null, carbonFootprintProduct: null, carbonFootprintServing: null,
    labels: [], categories: [], origins: null, ingredientsText: null,
    imageUrl: null, ecoscoreData: null,
    rawProduct: (labels_tags ? { labels_tags } : {}) as never,
    ...rest,
  } as OpenFoodFactsResult;
}

const origins = (p: OpenFoodFactsResult) =>
  resolveSupplyChain(p, null).nodes.filter((n) => n.kind === 'origin');

// ── Rung A2: regulated on-pack labels ────────────────────────────────────────
//
// Not gated behind the live-network flag below: these are pure resolver tests
// and they have to run in the default suite, or they protect nothing.
describe('rung A2 — origin-bearing labels', () => {
  it('places a made-in label at that country', () => {
    const nodes = origins(stub({ labels_tags: ['en:made-in-italy'] }));
    expect(nodes).toHaveLength(1);
    expect(nodes[0].tier).toBe('declared');
    expect(nodes[0].label).toBe('Italy');
    expect(nodes[0].lon).toBeTypeOf('number');
    expect(nodes[0].lat).toBeTypeOf('number');
    // The copy must not let a manufacturing mark read as an ingredient origin.
    expect(nodes[0].basis).toContain('country of manufacture');
  });

  it('gives EU Agriculture a node with null coordinates and NO edge', () => {
    // The mark proves the ingredients were farmed inside the EU and no more:
    // Reg. (EU) 2018/848 does not require the member state to be named. So
    // there is nothing to place, and INVARIANTS §6 forbids inventing a point
    // to make it drawable.
    const graph = resolveSupplyChain(stub({ labels_tags: ['en:eu-agriculture'] }), null);
    const nodes = graph.nodes.filter((n) => n.kind === 'origin');
    expect(nodes).toHaveLength(1);
    expect(nodes[0].tier).toBe('declared');
    expect(nodes[0].lon).toBeNull();
    expect(nodes[0].lat).toBeNull();
    // §3 and §5: an unplaced node never gets a line.
    const touched = graph.edges.filter((e) => e.from === nodes[0].id || e.to === nodes[0].id);
    expect(touched).toEqual([]);
  });

  it('lets the origins field, not a made-in label, set bestTier', () => {
    // Both are `declared`, so bestTier is 'declared' either way — the point is
    // WHICH claim leads. An origins entry is a statement about the INGREDIENTS;
    // a made-in mark is about MANUFACTURE. The stronger claim must come first.
    const graph = resolveSupplyChain(
      stub({ origins: 'Ghana', labels_tags: ['en:made-in-italy'] }),
      null,
    );
    const nodes = graph.nodes.filter((n) => n.kind === 'origin');
    expect(graph.bestTier).toBe('declared');
    expect(nodes[0].label).toBe('Ghana');
    expect(nodes[0].basis).toContain('label declares an origin');
  });

  it('never exceeds the 5-origin cap however many labels match', () => {
    const nodes = origins(stub({
      labels_tags: [
        'en:made-in-france', 'en:made-in-italy', 'en:made-in-germany',
        'en:made-in-spain', 'en:made-in-belgium', 'en:made-in-switzerland',
        'en:eu-agriculture',
      ],
    }));
    expect(nodes.length).toBeLessThanOrEqual(5);
    expect(nodes).toHaveLength(5);
  });

  it('reads humanized labels when rawProduct.labels_tags is absent', () => {
    // Some paths deliver the product without rawProduct. humanizeTag() turns
    // 'en:made-in-france' into 'made in france', which reverses cleanly, so
    // those products must still resolve rather than silently losing labels.
    const nodes = origins(stub({ labels: ['Organic', 'made in france'] }));
    expect(nodes).toHaveLength(1);
    expect(nodes[0].label).toBe('France');
  });

  it('ignores labels that carry no origin claim', () => {
    expect(origins(stub({ labels_tags: ['en:organic', 'en:fair-trade', 'en:vegan'] })))
      .toEqual([]);
  });

  it('scores a PDO above a made-in mark', () => {
    // A PDO ties production to a defined area by law; a made-in mark states
    // where manufacturing happened. Different claims, different confidence.
    const pdo = origins(stub({ labels_tags: ['en:pdo'] }))[0];
    const made = origins(stub({ labels_tags: ['en:made-in-france'] }))[0];
    expect(pdo.confidence).toBeGreaterThan(made.confidence);
    expect(pdo.sources.some((x) => x.label.includes('1151/2012'))).toBe(true);
  });

  it('cites the organic regulation on an EU/non-EU agriculture claim', () => {
    const n = origins(stub({ labels_tags: ['en:non-eu-agriculture'] }))[0];
    expect(n.sources.some((x) => x.label.includes('2018/848'))).toBe(true);
  });
});

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

/**
 * Measured A2 lift on EU products.
 *
 * Task 3's acceptance is "coverage measurably rises", and the only way to show
 * that honestly is to run the SHIPPED resolver over real products and count.
 * Both numbers come from one run rather than from a before/after pair, because
 * a toggle risks measuring two different builds: A2 nodes are identifiable by
 * their `origin:label:` id prefix, so A1-only coverage is just "products with
 * an origin node that is not one of those".
 *
 * Live network, skipped by default. Run with:
 *   SUPPLY_CHAIN_COVERAGE=1 npx vitest run src/test/supplyChainCoverage.test.ts
 */
describe('rung A2 lift (live)', () => {
  it.skipIf(!ENABLED)('measures EU coverage before and after A2', async () => {
    const EU = ['france', 'italy', 'germany', 'spain', 'belgium', 'netherlands', 'poland'];
    const products: OpenFoodFactsResult[] = [];

    for (const country of EU) {
      for (let page = 1; page <= 2; page++) {
        const url =
          `https://world.openfoodfacts.org/api/v2/search?countries_tags_en=${country}` +
          `&fields=code,product_name,brands,origins,labels_tags,categories_tags,ingredients_text` +
          `&page_size=100&page=${page}&json=1`;
        try {
          const r = await fetch(url, { headers: { 'User-Agent': 'GoodScan-a2-harness/1.0' } });
          if (!r.ok) { await sleep(6000); continue; }
          const j = (await r.json()) as { products?: Record<string, unknown>[] };
          for (const p of j.products ?? []) {
            products.push({
              found: true,
              barcode: String(p.code ?? ''),
              productName: (p.product_name as string) || null,
              brand: (p.brands as string) || null,
              ecoscoreGrade: null, ecoscoreScore: null,
              nutriscoreGrade: null, nutriscoreScore: null, novaGroup: null,
              carbonFootprint100g: null, carbonFootprintProduct: null, carbonFootprintServing: null,
              labels: [], categories: (p.categories_tags as string[]) ?? [],
              origins: (p.origins as string) || null,
              ingredientsText: (p.ingredients_text as string) || null,
              imageUrl: null, ecoscoreData: null,
              rawProduct: p as never,
            } as OpenFoodFactsResult);
          }
        } catch { /* a dropped page shrinks the sample; the guard below catches it */ }
        await sleep(4000);
      }
    }

    // Guard the denominator: a truncated sample turns the percentage into a
    // fiction, and a fiction that looks like a measurement is worse than none.
    expect(products.length).toBeGreaterThan(500);

    let a1 = 0, both = 0, a2Only = 0;
    for (const p of products) {
      const nodes = resolveSupplyChain(p, null).nodes.filter((n) => n.kind === 'origin');
      const fromA2 = nodes.filter((n) => n.id.startsWith('origin:label:'));
      const fromA1 = nodes.filter((n) => !n.id.startsWith('origin:label:'));
      if (fromA1.length) a1++;
      if (nodes.length) both++;
      if (!fromA1.length && fromA2.length) a2Only++;
    }

    const pct = (n: number) => ((n / products.length) * 100).toFixed(1);
    const report = [
      '',
      `[A2 lift] sample: ${products.length} EU products`,
      `[A2 lift] BEFORE (rung A1 only): ${a1} (${pct(a1)}%)`,
      `[A2 lift] AFTER  (A1 + A2):      ${both} (${pct(both)}%)`,
      `[A2 lift] products covered ONLY because of A2: ${a2Only} (${pct(a2Only)}%)`,
      '',
    ].join('\n');
    console.log(report);
    writeFileSync('docs/a2-lift-measured.txt', report.trimStart());

    // The whole point of the rung. If this does not hold, A2 is not earning
    // its place and should be removed rather than kept for the look of it.
    expect(both).toBeGreaterThan(a1);
  }, 600_000);
});

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
