/**
 * PHASE 0 — the number everything else depends on.
 *
 * For a realistic basket of products, what share get at least one SOURCED
 * signal? Not a score, not a Nutri-Score, not an eco grade — a signal backed by
 * something we could show a lawyer.
 *
 * Deliberately separate from verdictPageAudit.test.ts, which hunts for
 * contradictions and writes its own report. Two harnesses, two questions;
 * merging them would make both harder to read and would put a 214-finding
 * contradiction report in the way of a single percentage.
 *
 * The signals, in the order the plan lists them:
 *   findLaborAllegations       brand → documented labour allegations
 *   getVerifiedFlagsForBrand   brand → verified BrandFlagV2 (tiered sources)
 *   checkBoycott               brand → active boycott call
 *   checkAnimalWelfareFlag     brand → animal welfare record
 *   findIngredientFlagsInText  ingredients → ingredient-level concern
 *   findChocolateEntry         brand → Chocolate Scorecard entry
 *   detectCommodities          ingredients → commodity-level risk (TVPRA shape)
 *
 * The last one is the commodity layer the plan calls Phase 1. It already
 * exists, so this harness measures it rather than assuming it away.
 *
 * Corpus: live Open Food Facts, sampled across 20 categories. Not a full dump —
 * see docs/sourced-signal-coverage.md for why, and what changes if you use one.
 *
 *   SIGNAL_COVERAGE=1 npx vitest run src/test/sourcedSignalCoverage.test.ts --testTimeout=900000
 */

import { describe, it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { findLaborAllegations } from '@/utils/laborCheck';
import { getVerifiedFlagsForBrand } from '@/services/brandFlags';
import { checkBoycott } from '@/data/boycottBrands';
import { checkAnimalWelfareFlag } from '@/utils/animalWelfareFlags';
import { findIngredientFlagsInText } from '@/services/ingredientFlags';
import { findChocolateEntry } from '@/data/chocolateDirectory';
import { detectCommodities } from '@/data/supplyChain/commodityOrigins';
import { findParentCompany } from '@/data/parentCompanies';

const ENABLED = process.env.SIGNAL_COVERAGE === '1';

const CATEGORIES = [
  'chocolates', 'coffees', 'teas', 'breakfast-cereals', 'biscuits',
  'snacks', 'sodas', 'yogurts', 'breads', 'pastas',
  'rices', 'sauces', 'cheeses', 'crisps', 'ice-creams',
  'waters', 'juices', 'candies', 'spreads', 'canned-fish',
];
const PER_CATEGORY = 15;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Prod { barcode: string; name: string; brand: string; ingredients: string; cats: string[]; cat: string }

async function fetchCategory(cat: string, attempt = 0): Promise<Prod[]> {
  const url = `https://world.openfoodfacts.org/api/v2/search?categories_tags_en=${encodeURIComponent(cat)}` +
    `&fields=code,product_name,brands,ingredients_text,categories_tags&page_size=${PER_CATEGORY}&json=1`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'GoodScan-signal-coverage/1.0' } });
    if (r.status === 503 && attempt < 3) { await sleep(8000 * (attempt + 1)); return fetchCategory(cat, attempt + 1); }
    if (!r.ok) { console.warn(`[coverage] ${cat}: HTTP ${r.status}`); return []; }
    const j = (await r.json()) as { products?: Record<string, unknown>[] };
    return (j.products ?? []).map((p) => ({
      barcode: String(p.code ?? ''),
      name: (p.product_name as string) || '',
      brand: (p.brands as string) || '',
      ingredients: (p.ingredients_text as string) || '',
      cats: (p.categories_tags as string[]) ?? [],
      cat,
    })).filter((p) => p.barcode);
  } catch { return []; }
}

/** Which sourced signals fire for one product. Pure — no network, no state. */
function signalsFor(p: Prod): string[] {
  const hits: string[] = [];
  if (findLaborAllegations(p.brand, p.name)) hits.push('labour');
  if (getVerifiedFlagsForBrand(p.brand).length) hits.push('brandFlag');
  if (checkBoycott(p.brand)) hits.push('boycott');
  if (checkAnimalWelfareFlag(p.brand).isFlagged) hits.push('animalWelfare');
  if (findIngredientFlagsInText(p.ingredients).length) hits.push('ingredient');
  if (findChocolateEntry(p.brand, p.name)) hits.push('chocolate');
  if (detectCommodities(p.ingredients, p.name, p.cats).length) hits.push('commodity');

  // Parent-company inheritance. Widens the KEY, never the claim: we re-run the
  // same brand lookups against the parent name, so this can only fire where we
  // already hold something on the parent. If we know nothing about Nestlé,
  // resolving KitKat to Nestlé still yields nothing.
  const parent = findParentCompany(p.brand);
  if (parent && (
    findLaborAllegations(parent, null) ||
    getVerifiedFlagsForBrand(parent).length ||
    checkBoycott(parent) ||
    checkAnimalWelfareFlag(parent).isFlagged
  )) hits.push('parent');

  return hits;
}

describe('sourced signal coverage', () => {
  it.skipIf(!ENABLED)('measures the share of products with a sourced signal', async () => {
    const batches: Prod[][] = [];
    for (const cat of CATEGORIES) { batches.push(await fetchCategory(cat)); await sleep(4000); }
    const products = batches.flat();
    // A truncated corpus makes the percentage a fiction, and a fiction that
    // looks like a measurement is worse than no measurement.
    expect(products.length).toBeGreaterThan(150);

    let covered = 0;
    const bySignal = new Map<string, number>();
    const byCategory = new Map<string, { total: number; covered: number }>();
    // Coverage counting ONLY the brand-researched signals, i.e. what we'd have
    // without the commodity/ingredient layer. The gap between this and the
    // headline is the layer's actual contribution.
    let brandOnly = 0;
    // Products the parent map rescues single-handedly — the honest measure of
    // what Phase 2 bought, as opposed to what it duplicated.
    let parentOnly = 0;
    const uncovered: string[] = [];

    for (const p of products) {
      const hits = signalsFor(p);
      const rec = byCategory.get(p.cat) ?? { total: 0, covered: 0 };
      rec.total++;
      if (hits.length) { covered++; rec.covered++; } else {
        uncovered.push(`${p.cat} | ${p.brand || '?'} | ${p.name}`);
      }
      if (hits.some((h) => h !== 'commodity' && h !== 'ingredient' && h !== 'parent')) brandOnly++;
      if (hits.length === 1 && hits[0] === 'parent') parentOnly++;
      hits.forEach((h) => bySignal.set(h, (bySignal.get(h) ?? 0) + 1));
      byCategory.set(p.cat, rec);
    }

    const pct = (n: number) => ((n / products.length) * 100).toFixed(1);
    const catRows = [...byCategory.entries()]
      .map(([c, r]) => ({ c, ...r, p: r.total ? (r.covered / r.total) * 100 : 0 }))
      .sort((a, b) => b.p - a.p);

    const md = `# Sourced signal coverage (Phase 0)

**Measured ${new Date().toISOString().slice(0, 10)} — ${products.length} live Open Food Facts
products across ${CATEGORIES.length} categories.**

A product counts as covered if **at least one** signal fires that is backed by a
citable source. An eco grade or a Nutri-Score is not a sourced signal and does
not count here.

## The number

| Metric | Value |
| --- | --- |
| **Products with ≥1 sourced signal** | **${covered} / ${products.length} — ${pct(covered)}%** |
| Covered by brand research alone | ${brandOnly} — ${pct(brandOnly)}% |
| Lift from the commodity/ingredient layer | +${pct(covered - brandOnly)} points |
| Products rescued ONLY by the parent map | ${parentOnly} — ${pct(parentOnly)}% |

The second and third rows are the important ones. Brand-by-brand research alone
covers ${pct(brandOnly)}% of what people actually scan. The commodity and
ingredient layer — which needs no per-brand research at all — more than
${(covered / Math.max(brandOnly, 1)).toFixed(1)}×s that, and it does so with
statements about goods rather than accusations about companies.

## Which signal is doing the work

| Signal | Products hit | Share |
| --- | --- | --- |
${[...bySignal.entries()].sort((a, b) => b[1] - a[1])
  .map(([s, n]) => `| ${s} | ${n} | ${pct(n)}% |`).join('\n')}

## By category — where to spend the next four days

| Category | Sampled | Covered | Coverage |
| --- | --- | --- | --- |
${catRows.map((r) => `| ${r.c} | ${r.total} | ${r.covered} | ${r.p.toFixed(0)}% |`).join('\n')}

Work strictly down this table. The categories at the bottom are where research
buys coverage; the ones at the top are already done and further work there buys
nothing.

## Uncovered products (first 40)

${uncovered.slice(0, 40).map((u) => `- ${u}`).join('\n')}

## Honest limits of this measurement

**The corpus is a live API sample, not a dump.** Open Food Facts publishes full
exports under ODbL, and a dump would be the better corpus — but it is 7.7 GB and
ordered France-first, so a naive read of the head returns a French sample and a
confidently wrong number. If you want dump-based figures, stream it with column
pruning (\`scripts/research/off-coverage/coverage.py\` already does this) rather
than \`LIMIT\`-ing it.

**Scan frequency is not weighted.** Every product counts once. Real coverage
should be weighted by what people actually scan — once \`ai_scans\` has beta
traffic, that distribution replaces this one and the number will move, probably
upward, because people scan branded goods more than obscure ones.

**Coverage is not correctness.** This counts whether a signal fires, not whether
it is right. The contradiction hunt in \`verdictPageAudit.test.ts\` is the other
half, and neither substitutes for the other.

## Launch threshold

Set the bar before reading the number, or you will rationalise whatever you got:

- **≥60% of scanned products showing a sourced signal** — a judgement call about
  whether the app is useful enough to ship.
- **100% of high/critical flags carrying a live tier-1 or tier-2 URL** — not a
  judgement call. See [source-link-check.md](source-link-check.md).
`;

    writeFileSync('docs/sourced-signal-coverage.md', md);
    console.log(`\n[coverage] ${covered}/${products.length} products have a sourced signal (${pct(covered)}%)`);
    console.log(`[coverage] brand research alone: ${pct(brandOnly)}% — commodity layer adds ${pct(covered - brandOnly)} points`);
    console.log('[coverage] → docs/sourced-signal-coverage.md');
  }, 900_000);
});
