// "Compared to what?"
//
// An impact number without a stated baseline is marketing. "Saves 2.1kg of CO2"
// is meaningless until you say *against what* — the worst product in the aisle,
// the average one, or a hypothetical the number was reverse-engineered from.
//
// So every comparison this module produces carries its own baseline with it:
// what was averaged, over how many products, in which country, and when. The UI
// is built so that information travels with the number rather than living in a
// footnote.
//
// The baseline is the mean of the category as actually sold in the user's
// market, sampled from Open Food Facts. Anyone can reproduce it — that is the
// point of choosing it over a more flattering comparator.

import type { OpenFoodFactsResult } from '@/services/openfoodfacts/types';
import { browseProducts } from '@/services/openfoodfacts';
import { CATEGORY_LABELS, type SwapCategoryKey } from '@/data/ethicalAlternatives';
import { findCountry } from '@/utils/userRegion';
import { findLaborAllegations } from '@/utils/laborCheck';
import { checkBoycott } from '@/data/boycottBrands';
import { checkAnimalWelfareFlag } from '@/utils/animalWelfareFlags';

/**
 * Below this many products, the mean is noise and we say so instead of
 * publishing it. Twelve is already generous for a claim of this kind; it is set
 * here so the threshold is a decision on the record rather than an accident of
 * whatever the API returned.
 */
export const MIN_SAMPLE = 12;

/** Recompute weekly. Category averages move slowly; the API call is expensive. */
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/**
 * A baseline we failed to build gets a much shorter life. Caching a network
 * blip for a week means one bad moment silently disables every impact number in
 * the app until the following Tuesday — which is exactly what happened the
 * first time this ran end to end.
 */
const FAILED_TTL_MS = 10 * 60 * 1000;
const CACHE_KEY = 'goodscan-category-baselines';

export interface CategoryBaseline {
  categoryKey: SwapCategoryKey;
  categoryLabel: string;
  countryCode: string | null;
  countryName: string;
  /** Products in the sample. */
  sampleSize: number;
  /** Mean kg CO2e per kg. null when too few sampled products carry a figure. */
  meanCo2Kg: number | null;
  co2SampleSize: number;
  /** Mean Eco-Score, 0-100. */
  meanEcoScore: number | null;
  ecoSampleSize: number;
  /** Share (0-1) of sampled products whose brand carries an ethical flag. */
  flaggedShare: number | null;
  /** epoch ms */
  computedAt: number;
  /** True when the sample was too small to publish a comparison from. */
  tooSmall: boolean;
  /**
   * True when the country sample was too thin and this is the GLOBAL average
   * instead. Shown to the user in those words — a global mean is a real
   * comparison, just not the one they asked for, and a shopper in Bali being
   * quietly compared against European shelves would not know.
   */
  isGlobalFallback: boolean;
  /** The market originally asked for, when isGlobalFallback is true. */
  requestedCountryName?: string;
  /** The browse call failed outright — distinct from "few products exist". */
  fetchFailed: boolean;
}

/**
 * kg CO2e per kg of product.
 *
 * Uses Agribalyse co2_total, which is already in kg/kg.
 *
 * Worth knowing before quoting these numbers anywhere: Agribalyse figures are
 * frequently CATEGORY-level life-cycle estimates, not measurements of the
 * specific item. Three different organic dark chocolates from three different
 * countries come back with byte-identical values because they map to the same
 * Agribalyse reference product. So a comparison here is "this kind of thing
 * versus the average kind of thing in this category", which is a real and
 * defensible claim, and is not the same as having weighed anyone's supply
 * chain. The UI says "estimated" for that reason.
 *
 * Deliberately does NOT fall back to `carbonFootprint100g * 10` the way
 * SwapSuggestions does: that field is grams per 100g, so the multiplier yields
 * grams per kg and lands on a scale a thousand times off. It fires almost never
 * — the field is virtually unpopulated — which is why nobody has noticed, but
 * it is not something to reproduce inside a headline comparison.
 */
export function co2PerKg(p: OpenFoodFactsResult): number | null {
  const v = p.ecoscoreData?.agribalyse?.co2_total;
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
}

/** Does this product's brand carry any ethical flag we hold? */
export function isFlagged(p: OpenFoodFactsResult): boolean {
  const brand = p.brand ?? '';
  if (!brand) return false;
  if (findLaborAllegations(brand, p.productName)) return true;
  if (checkBoycott(brand)) return true;
  const w = checkAnimalWelfareFlag(brand);
  return w.isFlagged && (w.severity === 'critical' || w.severity === 'high');
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// ── Cache ────────────────────────────────────────────────────────────────────

function cacheKey(categoryKey: string, countryCode: string | null): string {
  return `${categoryKey}|${countryCode ?? 'WORLD'}`;
}

function readCache(): Record<string, CategoryBaseline> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCache(key: string, value: CategoryBaseline): void {
  try {
    const all = readCache();
    all[key] = value;
    localStorage.setItem(CACHE_KEY, JSON.stringify(all));
  } catch {
    // storage disabled — we just recompute next time
  }
}

// ── Compute ──────────────────────────────────────────────────────────────────

/**
 * Average the category as sold in this market.
 *
 * One OFF browse call, cached for a week. Returns a baseline even when the
 * sample is too small — flagged `tooSmall` — because "we looked and there
 * wasn't enough data" is a more useful answer than silence, and it stops the UI
 * from inventing a number.
 */
export async function getCategoryBaseline(
  categoryKey: SwapCategoryKey,
  countryCode: string | null,
  opts: { force?: boolean; allowGlobalFallback?: boolean } = {},
): Promise<CategoryBaseline> {
  const allowFallback = opts.allowGlobalFallback ?? true;
  const key = cacheKey(categoryKey, countryCode);

  if (!opts.force) {
    const cached = readCache()[key];
    const ttl = cached?.fetchFailed ? FAILED_TTL_MS : CACHE_TTL_MS;
    if (cached && Date.now() - cached.computedAt < ttl) return cached;
  }

  const baseline = await computeBaseline(categoryKey, countryCode);

  // A market with too little data is not a reason to show nothing. Fall back to
  // the global average and SAY that is what happened — Indonesian chocolate
  // returns ~4 products, which is a fact about Open Food Facts' contributor base
  // rather than about Indonesian shelves.
  // Attempt the fallback whenever the country baseline is unusable, INCLUDING
  // when its fetch failed. The global browse is a separate request that may
  // well succeed; refusing to try it because the country one failed just
  // converts a recoverable blip into a blank screen.
  if (allowFallback && (baseline.tooSmall || baseline.fetchFailed) && countryCode) {
    const global = await computeBaseline(categoryKey, null);
    if (!global.tooSmall) {
      const merged: CategoryBaseline = {
        ...global,
        isGlobalFallback: true,
        requestedCountryName: findCountry(countryCode)?.name ?? countryCode,
      };
      writeCache(key, merged);
      return merged;
    }
  }

  writeCache(key, baseline);
  return baseline;
}

async function computeBaseline(
  categoryKey: SwapCategoryKey,
  countryCode: string | null,
): Promise<CategoryBaseline> {
  const country = countryCode ? findCountry(countryCode) : null;
  const label = CATEGORY_LABELS[categoryKey] ?? categoryKey;

  // browseProducts signals a transient upstream problem by returning an EMPTY
  // list rather than throwing, so an outage is indistinguishable from "this
  // category genuinely has nothing" unless we look twice. A staple category
  // like chocolate coming back with zero products is not a real answer, and
  // caching it as one is what blanked every impact number the first time this
  // ran. One retry, then believe it.
  let products: OpenFoodFactsResult[] = [];
  let fetchFailed = false;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await browseProducts({
        category: categoryKey.replace(/_/g, ' '),
        country: country?.offTag ?? undefined,
        pageSize: 100,
      });
      products = res.products ?? [];
      fetchFailed = false;
      if (products.length > 0) break;
    } catch {
      fetchFailed = true;
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 600));
  }

  const co2 = products.map(co2PerKg).filter((v): v is number => v !== null);
  const eco = products
    .map((p) => p.ecoscoreScore)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

  return {
    categoryKey,
    categoryLabel: label,
    countryCode: countryCode ?? null,
    countryName: country?.name ?? 'all markets',
    sampleSize: products.length,
    meanCo2Kg: co2.length >= MIN_SAMPLE ? mean(co2) : null,
    co2SampleSize: co2.length,
    meanEcoScore: eco.length >= MIN_SAMPLE ? mean(eco) : null,
    ecoSampleSize: eco.length,
    flaggedShare: products.length >= MIN_SAMPLE
      ? products.filter(isFlagged).length / products.length
      : null,
    computedAt: Date.now(),
    tooSmall: products.length < MIN_SAMPLE,
    isGlobalFallback: false,
    fetchFailed,
  };
}

// ── Compare ──────────────────────────────────────────────────────────────────

export interface BaselineComparison {
  baseline: CategoryBaseline;
  /** kg CO2e per kg saved against the category mean. Negative = worse. */
  co2SavedKg: number | null;
  /** Percent better than the mean, 0-100. Only when co2SavedKg > 0. */
  co2PercentBetter: number | null;
  /** Eco-Score points above the category mean. Negative = below it. */
  ecoScoreDelta: number | null;
  /** This pick carries no ethical flag while some share of the category does. */
  avoidsFlag: boolean;
  /**
   * One sentence naming the baseline. Always rendered with the number — this is
   * what stops the figure being a claim with no referent.
   */
  statement: string;
  /** True when we could not say anything defensible. */
  insufficientData: boolean;
}

export function compareToBaseline(
  product: OpenFoodFactsResult,
  baseline: CategoryBaseline,
): BaselineComparison {
  const productCo2 = co2PerKg(product);
  const co2SavedKg =
    productCo2 != null && baseline.meanCo2Kg != null
      ? Math.round((baseline.meanCo2Kg - productCo2) * 100) / 100
      : null;
  const co2PercentBetter =
    co2SavedKg != null && co2SavedKg > 0 && baseline.meanCo2Kg
      ? Math.round((co2SavedKg / baseline.meanCo2Kg) * 100)
      : null;

  const ecoScoreDelta =
    typeof product.ecoscoreScore === 'number' && baseline.meanEcoScore != null
      ? Math.round(product.ecoscoreScore - baseline.meanEcoScore)
      : null;

  const avoidsFlag = !isFlagged(product) && (baseline.flaggedShare ?? 0) > 0;

  const insufficientData = co2SavedKg == null && ecoScoreDelta == null && !avoidsFlag;

  const sampledOn = new Date(baseline.computedAt).toISOString().slice(0, 10);
  let statement: string;
  if (baseline.fetchFailed) {
    statement = `We couldn't reach Open Food Facts to build a ${baseline.categoryLabel} average, so there's nothing to compare against yet.`;
  } else if (baseline.tooSmall) {
    statement = `Not enough ${baseline.categoryLabel} data to compare against — we found ${baseline.sampleSize} products and need at least ${MIN_SAMPLE}.`;
  } else if (baseline.isGlobalFallback) {
    statement = `Compared with the global average ${baseline.categoryLabel}, not ${baseline.requestedCountryName} specifically — Open Food Facts doesn't hold enough ${baseline.requestedCountryName} products yet. ${baseline.sampleSize} products sampled on ${sampledOn}.`;
  } else {
    const where = baseline.countryCode ? `in ${baseline.countryName}` : 'globally';
    statement = `Compared with the average ${baseline.categoryLabel} sold ${where} — ${baseline.sampleSize} products sampled from Open Food Facts on ${sampledOn}.`;
  }

  return {
    baseline,
    co2SavedKg,
    co2PercentBetter,
    ecoScoreDelta,
    avoidsFlag,
    statement,
    insufficientData,
  };
}
