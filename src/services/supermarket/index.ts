// "What should I buy, here, in this shop?"
//
// Joins things the app already had separately:
//   - the curated ethical catalogue + live OFF resolution (services/swaps)
//   - whether a given chain is likely to carry it        (services/retailers)
//   - what "better" is measured against                  (services/baseline)
//   - how good a product is for THIS user                (personalizedScore)
//
// Two search paths, because a shopper types what they want, not what our
// catalogue happens to cover:
//
//   CATALOGUE  the query maps to one of our vetted categories (chocolate,
//              coffee, eggs…). We recommend hand-checked ethical brands.
//   SEARCH     anything else — "oat milk", "peanut butter", "pasta sauce".
//              We search Open Food Facts and rank real results by the same
//              scoring the rest of the app uses.
//
// The second path is weaker and says so: those are the best options we could
// find and score, not brands anyone has vetted.

import type { OpenFoodFactsResult } from '@/services/openfoodfacts/types';
import type { Retailer } from '@/data/retailers';
import type { UserRegion } from '@/utils/userRegion';
import type { UserPriorities } from '@/utils/userPreferences';
import { DEFAULT_PRIORITIES } from '@/utils/userPreferences';
import { searchProducts } from '@/services/openfoodfacts';
import {
  getCategoryRecommendations, detectCategoryFromText,
  type SwapSuggestion, type SwapCategoryKey,
} from '@/services/swaps';
import type { CertificationType } from '@/utils/verifiedEthics';
import { findVerifiedEthics } from '@/utils/verifiedEthics';
import { personalizedScore } from '@/utils/personalizedScore';
import { findLaborAllegations } from '@/utils/laborCheck';
import { checkBoycott } from '@/data/boycottBrands';
import { checkAnimalWelfareFlag } from '@/utils/animalWelfareFlags';
import {
  assessAvailability, CONFIDENCE_RANK, type RetailerAvailability,
} from '@/services/retailers';
import {
  getCategoryBaseline, compareToBaseline,
  type CategoryBaseline, type BaselineComparison,
} from '@/services/baseline';
import { primeRemoteCounts } from '@/utils/storeSightings';
import { isFullCoverageMarket } from '@/data/ethicalAlternatives';

/** Which of the user's priorities a reason speaks to, so it can be ranked. */
export type ReasonPillar = 'labour' | 'environment' | 'animal' | 'nutrition' | 'other';

/** One line of the plain-English breakdown. No jargon, no numbers on their own. */
export interface PlainReason {
  tone: 'good' | 'bad' | 'neutral';
  text: string;
  pillar: ReasonPillar;
}

/**
 * Order reasons by what this shopper actually said they care about.
 *
 * Someone who set labour rights to Critical and environment to Low should read
 * the labour line first — the card only shows three before "More", so the
 * ordering decides what most people ever see. Bad news outranks good within a
 * pillar: a problem they care about is the single most useful thing to surface.
 */
export function orderReasonsByPriority(
  reasons: PlainReason[],
  priorities: UserPriorities,
): PlainReason[] {
  const weight: Record<ReasonPillar, number> = {
    labour: priorities.laborRights,
    environment: priorities.environment,
    animal: priorities.animalWelfare,
    nutrition: priorities.nutrition,
    other: 40, // certifications and the like — mid-table, never top
  };
  const toneRank = { bad: 2, good: 1, neutral: 0 };
  return [...reasons].sort((a, b) => {
    const w = weight[b.pillar] - weight[a.pillar];
    if (w !== 0) return w;
    return toneRank[b.tone] - toneRank[a.tone];
  });
}

/** The priorities a shopper has actually dialled up, strongest first. */
export function activePriorityLabels(priorities: UserPriorities): string[] {
  return (
    [
      ['Labour rights', priorities.laborRights],
      ['Environment', priorities.environment],
      ['Animal welfare', priorities.animalWelfare],
      ['Nutrition', priorities.nutrition],
    ] as const
  )
    .filter(([, v]) => v > 62)          // "Critical" on the 3-level scale
    .sort((a, b) => b[1] - a[1])
    .map(([label]) => label);
}

export interface ShelfPick {
  key: string;
  brand: string;
  productName: string;
  barcode: string | null;
  imageUrl: string | null;
  certifications: CertificationType[];
  product: OpenFoodFactsResult | null;
  /** 0-100 for this user's priorities, or null when we know too little. */
  score: number | null;
  verdict: string;
  /** The breakdown, already turned into sentences. */
  reasons: PlainReason[];
  availability: RetailerAvailability;
  comparison: BaselineComparison | null;
  /** True when this came from our vetted catalogue rather than a raw search. */
  vetted: boolean;
}

export type ShelfSource = 'catalogue' | 'search';

export interface ShelfResult {
  categoryKey: SwapCategoryKey | null;
  source: ShelfSource;
  query: string;
  retailer: Retailer;
  baseline: CategoryBaseline | null;
  picks: ShelfPick[];
  /** We understood the request but found nothing to show. */
  empty: boolean;
}

export interface ShelfSearchOptions {
  region?: UserRegion | null;
  priorities?: UserPriorities;
  limit?: number;
}

// ── Plain-English breakdown ──────────────────────────────────────────────────

/**
 * Turn the data we hold into sentences a shopper can act on.
 *
 * The rule here: never show a bare number. "3.28 kg CO2e per kg" is not an
 * insight, it's a unit — most people cannot tell whether that is good. Every
 * line has to say which direction it points and, where it matters, against what.
 */
export function buildReasons(
  product: OpenFoodFactsResult | null,
  brand: string,
  productName: string,
  certifications: CertificationType[],
  comparison: BaselineComparison | null,
  /**
   * Hand-written reasons from the catalogue entry. These are the actual point
   * of a curated pick — Krakakoa is here because it buys direct from Sumatran
   * and Balinese farmers, and a card that omits that while showing its
   * Eco-Score is answering a question nobody asked.
   */
  strengths: string[] = [],
): PlainReason[] {
  const out: PlainReason[] = [];

  for (const s of strengths.slice(0, 2)) {
    out.push({ tone: 'good', text: s, pillar: 'labour' });
  }

  // Labour / boycott / welfare — the concerns the app exists for, first.
  const labour = findLaborAllegations(brand, productName);
  if (labour) {
    const n = labour.allegations.length;
    out.push({
      tone: 'bad',
      text: `${n} labour ${n === 1 ? 'concern' : 'concerns'} reported against ${labour.parentCompany}`,
      pillar: 'labour',
    });
  }
  const boycott = checkBoycott(brand);
  if (boycott) {
    out.push({ tone: 'bad', text: `${boycott.parent} is on a consumer boycott list`, pillar: 'labour' });
  }
  const welfare = checkAnimalWelfareFlag(brand);
  if (welfare.isFlagged && (welfare.severity === 'critical' || welfare.severity === 'high')) {
    out.push({ tone: 'bad', text: 'Animal-welfare concerns reported for this company', pillar: 'animal' });
  }
  if (!labour && !boycott) {
    // Phrasing matters. "No flags on this brand" reads as a clean bill of
    // health; for a brand we hold no record of at all, the truthful statement is
    // that we have not looked into it, not that it passed.
    const researched =
      strengths.length > 0 ||
      findVerifiedEthics(brand, productName) !== null ||
      checkAnimalWelfareFlag(brand).isFlagged ||
      certifications.length > 0;
    out.push(
      researched
        ? { tone: 'good', text: 'No labour or boycott flags on this brand', pillar: 'labour' }
        : { tone: 'neutral', text: 'This brand isn’t in our flag database — we have no record either way', pillar: 'labour' },
    );
  }

  // Certifications, spelled out rather than shown as badges only.
  if (certifications.length > 0) {
    const ethics = findVerifiedEthics(brand, productName);
    out.push({
      tone: 'good',
      text: ethics
        ? `Independently certified — ${certifications.length} ${certifications.length === 1 ? 'scheme' : 'schemes'}`
        : `Carries ${certifications.length} ethical ${certifications.length === 1 ? 'certification' : 'certifications'}`,
      pillar: 'other',
    });
  }

  // Carbon, always relative to something the user can picture.
  const cat = comparison?.baseline.categoryLabel ?? 'products like this';
  if (comparison && comparison.co2SavedKg != null) {
    if (comparison.co2SavedKg > 0) {
      out.push({
        tone: 'good',
        text: comparison.co2PercentBetter
          ? `Lower carbon than most ${cat} — about ${comparison.co2PercentBetter}% below average`
          : `Lower carbon than most ${cat}`,
        pillar: 'environment',
      });
    } else if (comparison.co2SavedKg < 0) {
      out.push({ tone: 'bad', text: `Higher carbon than the average ${cat}`, pillar: 'environment' });
    } else {
      out.push({ tone: 'neutral', text: `About average carbon for ${cat}`, pillar: 'environment' });
    }
  } else if (product) {
    out.push({ tone: 'neutral', text: 'No carbon data published for this one', pillar: 'environment' });
  }

  // Eco-score, only when it adds something the carbon line didn't.
  const grade = product?.ecoscoreGrade?.toLowerCase();
  if (grade === 'a' || grade === 'a-plus' || grade === 'b') {
    out.push({ tone: 'good', text: `Strong environmental rating (Eco-Score ${grade.toUpperCase()})`, pillar: 'environment' });
  } else if (grade === 'e' || grade === 'd') {
    out.push({ tone: 'bad', text: `Weak environmental rating (Eco-Score ${grade.toUpperCase()})`, pillar: 'environment' });
  }

  return out;
}

/**
 * Do we actually know enough about this product to call it good?
 *
 * personalizedScore treats "no labour allegations" as a strong positive, which
 * is right for a brand we've researched and wrong for one we've simply never
 * heard of. Every Indonesian coffee came back at 90/100 "Good pick" on an empty
 * record: no eco grade, no Nutri-Score, no entry in any of our flag datasets.
 * That is absence of evidence being rendered as evidence of good — the same
 * mistake this codebase spent a whole audit branch removing elsewhere.
 *
 * Needs at least one real signal: an environmental grade, a nutrition grade, or
 * the brand appearing in a dataset we maintain.
 */
function hasEnoughData(product: OpenFoodFactsResult | null, brand: string, productName: string): boolean {
  if (product?.ecoscoreGrade && product.ecoscoreGrade !== 'unknown') return true;
  if (product?.nutriscoreGrade && product.nutriscoreGrade !== 'unknown') return true;
  if (typeof product?.ecoscoreScore === 'number') return true;
  // Anything we hold a view on — a flag, a boycott listing, a certification —
  // counts as a signal, good or bad.
  if (findLaborAllegations(brand, productName)) return true;
  if (checkBoycott(brand)) return true;
  if (checkAnimalWelfareFlag(brand).isFlagged) return true;
  if (findVerifiedEthics(brand, productName)) return true;
  return false;
}

function scoreOf(
  product: OpenFoodFactsResult | null,
  brand: string,
  productName: string,
  priorities: UserPriorities,
) {
  const scored = personalizedScore(
    {
      brand,
      productName,
      ecoGrade: product?.ecoscoreGrade ?? null,
      ecoScore: product?.ecoscoreScore ?? null,
      nutriGrade: product?.nutriscoreGrade ?? null,
      laborAllegations: findLaborAllegations(brand, productName)?.allegations.length ?? 0,
    },
    priorities,
  );
  if (hasEnoughData(product, brand, productName)) return scored;
  // Keep the number for ranking — a clean record still beats a flagged one —
  // but never present it as a recommendation.
  return { ...scored, verdict: 'UNKNOWN' as typeof scored.verdict };
}

// ── Search ───────────────────────────────────────────────────────────────────

export async function searchShelf(
  query: string,
  retailer: Retailer,
  opts: ShelfSearchOptions = {},
): Promise<ShelfResult> {
  const region = opts.region ?? null;
  const priorities = opts.priorities ?? DEFAULT_PRIORITIES;
  const limit = opts.limit ?? 6;
  const countryCode = region?.countryCode ?? null;
  const categoryKey = detectCategoryFromText(query);

  // Baseline FIRST, then products — deliberately sequential.
  //
  // These look independent and were originally run with Promise.all. In
  // practice the product lookups fan out to dozens of concurrent Open Food
  // Facts calls and the baseline browse loses that race: it came back empty
  // every time, got cached as "no data", and every impact number silently
  // disappeared. The baseline is cached for a week, so a warm run costs nothing.
  const baseline = categoryKey
    ? await getCategoryBaseline(categoryKey, countryCode).catch(() => null)
    : null;

  let picks = categoryKey
    ? await cataloguePicks(categoryKey, retailer, region, priorities, limit, baseline)
    : await searchPicks(query, retailer, region, priorities, limit);

  // The vetted catalogue can legitimately have nothing for a market — Indonesia
  // has no certified instant coffee we could verify, so the strict market gate
  // correctly returns nothing rather than offering a Colorado roaster at
  // Indomaret. But an empty screen is a dead end for someone standing in the
  // aisle. Fall through to a live product search: those aren't recommendations,
  // they're real things on real Indonesian shelves scored on what we know, and
  // the UI labels them as a search rather than a vetted pick.
  let source: ShelfSource = categoryKey ? 'catalogue' : 'search';
  if (picks.length === 0 && categoryKey) {
    picks = await searchPicks(query, retailer, region, priorities, limit);
    source = 'search';
  }

  // One request for community sighting counts across the whole result set.
  await primeRemoteCounts(
    picks.map((p) => p.barcode).filter((b): b is string => !!b),
    retailer.id,
  ).catch(() => undefined);

  picks.sort(byAvailabilityThenEthics);

  return {
    categoryKey,
    source,
    query,
    retailer,
    baseline,
    picks: picks.slice(0, limit),
    empty: picks.length === 0,
  };
}

/**
 * Ordering: availability first, ethics breaks every tie.
 *
 * A perfect product the shop doesn't stock is not a useful answer to "what
 * should I buy here" — but the reverse ordering would let a weak pick win on a
 * shelf tag alone, so score decides within each availability band.
 */
function byAvailabilityThenEthics(a: ShelfPick, b: ShelfPick): number {
  const av = CONFIDENCE_RANK[b.availability.confidence] - CONFIDENCE_RANK[a.availability.confidence];
  if (av !== 0) return av;
  if (a.vetted !== b.vetted) return a.vetted ? -1 : 1;
  return (b.score ?? -1) - (a.score ?? -1);
}

/** Curated ethical brands for a category we actually vet. */
async function cataloguePicks(
  categoryKey: SwapCategoryKey,
  retailer: Retailer,
  region: UserRegion | null,
  priorities: UserPriorities,
  limit: number,
  baseline: CategoryBaseline | null,
): Promise<ShelfPick[]> {
  const suggestions: SwapSuggestion[] = await getCategoryRecommendations(categoryKey, {
    region, priorities, limit: limit + 4,
  });

  return suggestions.map((s) => {
    const scored = scoreOf(s.product, s.brand, s.productName, priorities);
    const comparison =
      baseline && s.product && !baseline.tooSmall ? compareToBaseline(s.product, baseline) : null;
    return {
      key: s.barcode ?? s.brand,
      brand: s.brand,
      productName: s.productName,
      barcode: s.barcode,
      imageUrl: s.imageUrl,
      certifications: s.certifications,
      product: s.product,
      score: scored.score,
      verdict: scored.verdict,
      reasons: orderReasonsByPriority(
        buildReasons(s.product, s.brand, s.productName, s.certifications, comparison, s.strengths),
        priorities,
      ),
      availability: assessAvailability(s.product, retailer, {
        barcode: s.barcode,
        soldInMarket: s.regionAvailable || s.inMarket,
      }),
      comparison,
      vetted: true,
    };
  });
}

/**
 * Anything the catalogue doesn't cover. Searches Open Food Facts and ranks real
 * results with the same scoring the product pages use.
 *
 * These are NOT vetted recommendations — they're the best-scoring things we
 * could find for what the user typed. The UI labels them accordingly.
 */
async function searchPicks(
  query: string,
  retailer: Retailer,
  region: UserRegion | null,
  priorities: UserPriorities,
  limit: number,
): Promise<ShelfPick[]> {
  const wide = Math.max(limit * 8, 40);
  // In a market with its own shopping vocabulary, search the local word too.
  // "coffee" in Denpasar returned Migros coffee yoghurt and a German own-brand,
  // because Indonesian products are called kopi — an English query simply cannot
  // see them. Both queries run and the results are merged.
  const altQuery = localQuery(query, region?.countryCode);
  // Both searches fail independently. Open Food Facts 503s intermittently under
  // load, and it does so per-query: "kopi" returned 200 while "coffee" returned
  // 503 in the same second. With only the local search guarded, one upstream
  // blip on the English term threw away the Indonesian results we had already
  // successfully fetched, and the shopper saw an empty screen.
  const [primary, secondary] = await Promise.all([
    searchProducts(query, wide).catch(() => [] as OpenFoodFactsResult[]),
    altQuery
      ? searchProducts(altQuery, wide).catch(() => [] as OpenFoodFactsResult[])
      : Promise.resolve([] as OpenFoodFactsResult[]),
  ]);
  const byCode = new Map<string, OpenFoodFactsResult>();
  // Local-language hits lead: in a market with its own vocabulary they're the
  // things actually on the shelf.
  for (const p of [...secondary, ...primary]) if (p.barcode) byCode.set(p.barcode, p);
  let results: OpenFoodFactsResult[] = [...byCode.values()];
  if (results.length === 0) return [];

  // Prefer products actually tagged as sold in this country.
  const local = results.filter((p) => isSoldInCountry(p, region));
  if (local.length > 0) {
    results = local;
  } else if (isFullCoverageMarket(region?.countryCode)) {
    // In a researched market, showing foreign products is worse than showing
    // none. Without this, "coffee" at Indomaret in Denpasar offered Ricoré and
    // a French chicory drink — technically coffee-adjacent, entirely absent from
    // any Indonesian shelf. The empty state says we found nothing and suggests a
    // simpler word, which is at least true.
    return [];
  }

  const seen = new Set<string>();
  const picks: ShelfPick[] = [];
  for (const p of results) {
    const brand = p.brand ?? '';
    const name = p.productName ?? query;
    // Open Food Facts search is generous: "instant noodles" came back with
    // Banania and a chocolate drink above actual noodles. Recommending those as
    // "what to buy here" is worse than returning fewer results, so anything
    // that doesn't actually match what was typed is dropped.
    // Relevant against the typed query OR its local-language equivalent —
    // otherwise the filter would throw away the very Indonesian products the
    // local search just went and found, because "Kopi Susu" contains no
    // "coffee".
    if (!isRelevant(query, p, brand, name) && !(altQuery && isRelevant(altQuery, p, brand, name))) {
      continue;
    }
    // One product per brand, so a single manufacturer can't fill the list.
    const brandKey = brand.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (brandKey && seen.has(brandKey)) continue;
    if (brandKey) seen.add(brandKey);

    const scored = scoreOf(p, brand, name, priorities);
    const certs = (findVerifiedEthics(brand, name)?.certifications ?? []) as CertificationType[];
    picks.push({
      key: p.barcode,
      brand: brand || 'Unknown brand',
      productName: name,
      barcode: p.barcode,
      imageUrl: p.imageUrl,
      certifications: certs,
      product: p,
      score: scored.score,
      verdict: scored.verdict,
      reasons: orderReasonsByPriority(buildReasons(p, brand, name, certs, null), priorities),
      availability: assessAvailability(p, retailer, {
        barcode: p.barcode,
        // A live OFF hit tells us nothing about the chain; only the country tag
        // is evidence, and assessAvailability reads store tags itself.
        soldInMarket: isSoldInCountry(p, region),
      }),
      comparison: null,
      vetted: false,
    });
  }

  // Best-scoring first; availability re-sorts afterwards.
  return picks.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}

/**
 * The same request in the local shopping vocabulary.
 *
 * Open Food Facts stores products under the names printed on the pack, so an
 * Indonesian shelf is indexed in Indonesian. Searching "coffee" for a shopper in
 * Denpasar misses every Kapal Api and Luwak on the shelf and surfaces European
 * products instead. Only the words a shopper would actually type are mapped —
 * this is a shopping phrasebook, not a translation layer.
 */
const LOCAL_TERMS: Record<string, Record<string, string>> = {
  ID: {
    coffee: 'kopi', tea: 'teh', chocolate: 'cokelat', milk: 'susu',
    rice: 'beras', sugar: 'gula', water: 'air mineral', juice: 'jus',
    bread: 'roti', eggs: 'telur', chicken: 'ayam', fish: 'ikan',
    noodles: 'mie', 'instant noodles': 'mie instan', biscuits: 'biskuit',
    crisps: 'keripik', chips: 'keripik', snacks: 'camilan', oil: 'minyak goreng',
    soap: 'sabun', shampoo: 'sampo', 'soy sauce': 'kecap', salt: 'garam',
    flour: 'tepung', butter: 'mentega', cheese: 'keju', yoghurt: 'yogurt',
  },
};

/** The local-language equivalent of a query, when we have one. */
export function localQuery(query: string, countryCode: string | null | undefined): string | null {
  if (!countryCode) return null;
  const map = LOCAL_TERMS[countryCode.toUpperCase()];
  if (!map) return null;
  const q = query.trim().toLowerCase();
  if (map[q]) return map[q];
  // Fall back to translating any single mapped word inside a longer phrase.
  const words = q.split(/\s+/);
  const swapped = words.map((w) => map[w] ?? w);
  const changed = swapped.some((w, i) => w !== words[i]);
  return changed ? swapped.join(' ') : null;
}

/** Very short words carry no signal and match everything. */
const STOPWORDS = new Set(['the', 'and', 'for', 'with', 'of', 'a', 'an', 'in', 'my', 'some']);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

/**
 * Does this result plausibly answer what the shopper typed?
 *
 * Requires every meaningful word of the query to appear somewhere in the
 * product's name, brand or categories. Deliberately strict: a false positive
 * here is a recommendation to buy the wrong thing, while a false negative just
 * means one fewer option on a list that already has several.
 *
 * Singular/plural is handled by matching on stems, so "noodles" finds "noodle".
 */
export function isRelevant(
  query: string,
  p: OpenFoodFactsResult,
  brand: string,
  name: string,
): boolean {
  const want = tokens(query);
  if (want.length === 0) return true;
  const haystack = [
    name, brand,
    ...(Array.isArray(p.categories) ? p.categories : []),
  ]
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  return want.every((w) => {
    const stem = w.replace(/(ies|es|s)$/, '');
    return haystack.includes(w) || (stem.length > 2 && haystack.includes(stem));
  });
}

function isSoldInCountry(p: OpenFoodFactsResult, region: UserRegion | null): boolean {
  if (!region) return false;
  const tags = (p.rawProduct as unknown as Record<string, unknown> | null)?.countries_tags;
  if (!Array.isArray(tags)) return false;
  const needle = region.country.toLowerCase().replace(/\s+/g, '-');
  return tags.some((t) => typeof t === 'string' && t.toLowerCase().includes(needle));
}

/** Categories we hand-vet. Shown as shortcuts; anything else still searches. */
export const POPULAR_CATEGORIES: { key: SwapCategoryKey; label: string }[] = [
  { key: 'chocolate', label: 'Chocolate' },
  { key: 'coffee', label: 'Coffee' },
  { key: 'tea', label: 'Tea' },
  { key: 'spreads', label: 'Spreads' },
  { key: 'eggs', label: 'Eggs' },
  { key: 'seafood', label: 'Seafood' },
  { key: 'bananas', label: 'Bananas' },
  { key: 'sugar', label: 'Sugar' },
];

/** OpenFoodFacts data is ODbL — attribution is a licence condition, not a courtesy. */
export const OFF_ATTRIBUTION =
  'Product data from Open Food Facts, used under the Open Database Licence (ODbL).';
