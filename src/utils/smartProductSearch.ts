/**
 * Smart product search — the same pipeline the scan flow uses, packaged for
 * any caller (Compare page, manual search box, etc.).
 *
 * Pipeline:
 *   1. AI typo / formatting fix (with 3s timeout fallback).
 *   2. Pull a pool of OpenFoodFacts candidates (default 12).
 *   3. Filter by word-containment so unrelated products are dropped.
 *   4. Score the survivors with productRelevance.pickBestMatch.
 *   5. Prefer ties by eco-data completeness so the chosen product is usable.
 */

import { getBackendUrl } from '@/config/backend';
import { searchProducts as searchOff, imageQualityTier, lookupBarcode } from '@/services/openfoodfacts';
import type { OpenFoodFactsResult } from '@/services/openfoodfacts/types';
import { pickBestMatch } from './productRelevance';
import { extractBarcode } from './gs1';

export interface SmartSearchResult {
  product: OpenFoodFactsResult | null;
  /** Confidence 0-1 from the relevance scorer. */
  confidence: number;
  /** Query the backend AI returned (may equal the original). */
  cleanedQuery: string;
  /** True when no candidate cleared the strict relevance gate. */
  noMatch: boolean;
}

const NO_MATCH = (cleanedQuery: string): SmartSearchResult => ({
  product: null, confidence: 0, cleanedQuery, noMatch: true,
});

/** Ask OpenAI to spell-check and format a user-typed product query. */
async function fixProductQuery(raw: string): Promise<string> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/openai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: 'fix-product-query', userMessage: raw }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return raw;
    const data = await res.json();
    const fixed = typeof data?.content === 'string' ? data.content.trim() : '';
    return fixed || raw;
  } catch {
    return raw;
  }
}

/**
 * Ask OpenAI for a product's retail barcode from typed text — the text-search
 * analogue of reading a barcode off a scanned photo. Returns a normalized
 * EAN/UPC, or null when the model isn't confident (it's told to answer NONE).
 * The caller MUST still validate the barcode against OFF; the model can return
 * a plausible-but-wrong number, so an unverified barcode is never trusted.
 */
export async function barcodeFromText(raw: string): Promise<string | null> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/openai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: 'product-barcode', userMessage: raw }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = typeof data?.content === 'string' ? data.content.trim() : '';
    if (!content || /none/i.test(content)) return null;
    // Reuse the scanner's GS1 parser so digits / GTIN forms are normalized.
    const direct = extractBarcode(content);
    if (direct) return direct;
    // Tolerate a number wrapped in stray text ("Barcode: 3017620422003").
    const digits = content.match(/\b\d{8,14}\b/);
    return digits ? extractBarcode(digits[0]) : null;
  } catch {
    return null;
  }
}

/**
 * For multi-word queries, the first word (brand/most-specific) must match OR
 * at least 2 words must match. For short queries, any single word suffices.
 * Word-boundary matching prevents "Ben" from matching "jben" yogurt.
 */
function containsAnyWord(query: string, text: string): boolean {
  const qWords = query
    .toLowerCase()
    .split(/[\s\-_,/&().]+/)
    .filter((w) => w.length >= 3);
  if (qWords.length === 0) return true;
  const lowered = text.toLowerCase();
  const matches = (w: string) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(lowered);
  const matchCount = qWords.filter(matches).length;
  if (qWords.length >= 3) {
    // Require first word (brand) OR at least 2 words — prevents "caramel" alone
    // from qualifying an unrelated caramel drink for "Rebo Kuaci Salted Caramel".
    return matches(qWords[0]) || matchCount >= 2;
  }
  return matchCount >= 1;
}

/** Sort tiebreaker: how much eco/nutrition data does this product have? */
function dataRichness(r: OpenFoodFactsResult): number {
  let s = 0;
  if (r.ecoscoreGrade) s += 20;
  if (r.nutriscoreGrade) s += 10;
  if (r.novaGroup != null) s += 5;
  if (r.ecoscoreData?.agribalyse?.co2_total != null) s += 25;
  // Reward image *quality* (curated front photo > raw upload), not mere presence,
  // so an equally-relevant product with a clean front-of-pack shot wins.
  s += imageQualityTier(r) * 4;
  if (r.brand) s += 10;
  return s;
}

/** Strictest data tier — fully comparable across every metric we render. */
function hasFullCompareData(r: OpenFoodFactsResult): boolean {
  return !!r.ecoscoreGrade
    && r.ecoscoreData?.agribalyse?.co2_total != null
    && !!r.nutriscoreGrade
    && r.novaGroup != null;
}

/** Mid tier — at least eco grade + CO2 so we can run an Eco/CO2 comparison. */
function hasEcoData(r: OpenFoodFactsResult): boolean {
  return !!r.ecoscoreGrade && r.ecoscoreData?.agribalyse?.co2_total != null;
}

/** Pick the strictest tier that still has at least one survivor — graceful fallback. */
function applyDataFloor(candidates: OpenFoodFactsResult[]): OpenFoodFactsResult[] {
  // Tier 1: full data (eco + CO2 + nutri + nova) — gold standard.
  const full = candidates.filter(hasFullCompareData);
  if (full.length > 0) return full;
  // Tier 2: at least eco + CO2 — the metrics Compare actually renders.
  const eco = candidates.filter(hasEcoData);
  if (eco.length > 0) return eco;
  // Tier 3: any product with an eco grade — still has SOME comparable metric.
  const anyEco = candidates.filter((c) => !!c.ecoscoreGrade);
  if (anyEco.length > 0) return anyEco;
  // Tier 4: any product with a nutri grade — last comparable metric.
  const anyNutri = candidates.filter((c) => !!c.nutriscoreGrade);
  if (anyNutri.length > 0) return anyNutri;
  // No comparable data at all — return the richest by total field count so the
  // user at least sees the right brand instead of "no match".
  return [...candidates].sort((a, b) => dataRichness(b) - dataRichness(a));
}

export interface SmartSearchOptions {
  /** How many OFF candidates to pull before filtering. Default 12. */
  poolSize?: number;
  /** Skip the AI typo-fix step (use raw query directly). Default false. */
  skipAiFix?: boolean;
  /**
   * Also ask OpenAI for the product's barcode from the typed text (the analogue
   * of reading a barcode off a scanned photo). When it returns one that resolves
   * to a real product in OFF, that exact match wins over the text-search result.
   * Default false. Used by the manual search box.
   */
  aiBarcode?: boolean;
}

/** Brand-shape check: does the candidate's primary brand line up with the query? */
function isBrandHit(query: string, brand: string | null | undefined): boolean {
  if (!brand) return false;
  // OFF brand strings can be comma-separated parent chains.
  // Match the *primary* (first) brand only — that's the one shoppers see.
  const primary = brand.split(/[,;|/]/)[0].trim().toLowerCase();
  const q = query.toLowerCase().trim();
  if (!primary || !q) return false;
  if (primary === q) return true;
  if (primary.startsWith(q)) return true;
  if (q.startsWith(primary) && primary.length >= 4) return true;
  // Hyphen / space agnostic: "coca-cola" vs "coca cola"
  const stripped = (s: string) => s.replace(/[\s\-]+/g, '');
  return stripped(primary) === stripped(q);
}

/**
 * Canonicality boost — how "iconic" is this product for the given query?
 * Strong positive for "Oreo / Oreo", strong negative for "Oreo / Oreo O's Cereal"
 * when the user just typed "Oreo".
 */
function canonicalityScore(
  query: string,
  productName: string | null,
  brand: string | null,
): number {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const q = norm(query);
  const p = norm(productName ?? '');
  const b = norm((brand ?? '').split(/[,;|/]/)[0]);

  if (!p) return -40;          // nameless product can't be canonical

  let score = 0;

  // Strong: product name IS the brand or query (e.g. brand=Oreo, name=Oreo)
  if (p === b) score += 100;
  if (p === q) score += 100;

  // Strong: product name starts with brand and adds <= 12 chars
  // (e.g. "Oreo Original", "Oreo Cookies"). Penalises "Oreo Birthday Cake Bites".
  if (b && p.startsWith(b)) {
    const extra = p.length - b.length;
    if (extra <= 2) score += 90;
    else if (extra <= 12) score += 60;
    else if (extra <= 24) score += 20;
  }
  if (q && q !== b && p.startsWith(q)) {
    const extra = p.length - q.length;
    if (extra <= 2) score += 90;
    else if (extra <= 12) score += 60;
  }

  // Variant penalty: query was bare brand, but product is a derivative line.
  const VARIANT_TOKENS = [
    'cereal', 'ice cream', 'icecream', 'bar', 'bars', 'cake', 'cake mix',
    'mix', 'shake', 'drink', 'spread', 'pudding', 'bites', 'thins',
    'crumbs', 'creme', 'cream cheese', 'cookies & cream', 'biscuit',
    'wafer', 'roll', 'rolls', 'pop', 'pops', 'mini',
  ];
  const queryMentionsVariant = VARIANT_TOKENS.some((v) => q.includes(v));
  if (!queryMentionsVariant) {
    for (const v of VARIANT_TOKENS) {
      if (p.includes(v)) {
        score -= 45;
        break;
      }
    }
  }

  // Heavy penalty when product name is suspiciously long (likely a niche SKU).
  if (p.length > 40) score -= 15;

  return score;
}

/** Heuristic: a 1-2 word query that doesn't look like a generic noun. */
function looksLikeBrandQuery(query: string): boolean {
  const words = query.trim().split(/\s+/);
  if (words.length > 2) return false;
  // Reject generic nouns ("chips", "soda", "yogurt") — those belong to products.
  const GENERIC = new Set([
    'chips', 'crisps', 'soda', 'yogurt', 'yoghurt', 'cola', 'water', 'beer',
    'wine', 'milk', 'bread', 'cheese', 'butter', 'rice', 'pasta', 'tea',
    'coffee', 'juice', 'cereal', 'cookies', 'biscuits', 'chocolate',
  ]);
  return !words.every((w) => GENERIC.has(w.toLowerCase()));
}

export async function smartProductSearch(
  rawQuery: string,
  opts: SmartSearchOptions = {},
): Promise<SmartSearchResult> {
  const trimmed = rawQuery.trim();
  if (!trimmed) return NO_MATCH('');

  // Run the typo-fix and (optional) AI-barcode resolution together so the extra
  // OpenAI call doesn't add latency on top of the existing one.
  const [cleanedQuery, aiBarcode] = await Promise.all([
    opts.skipAiFix ? Promise.resolve(trimmed) : fixProductQuery(trimmed),
    opts.aiBarcode ? barcodeFromText(trimmed) : Promise.resolve(null),
  ]);

  // EXACT-BARCODE PATH (manual search): if OpenAI named a barcode AND it resolves
  // to a real product in OFF, trust that over fuzzy text search. The OFF lookup is
  // the safety gate — a hallucinated/unknown number simply falls through.
  if (aiBarcode) {
    const byBarcode = await lookupBarcode(aiBarcode);
    if (byBarcode.found) {
      return { product: byBarcode, confidence: 0.95, cleanedQuery, noMatch: false };
    }
  }

  // Pull a bigger pool — many OFF hits have no eco data, so we need headroom
  // to find ones that actually do.
  const pool = await searchOff(cleanedQuery, opts.poolSize ?? 30);
  if (pool.length === 0) return NO_MATCH(cleanedQuery);

  // BRAND-LED PATH:
  // For 1-2 word non-generic queries, treat the query as a brand. The brand
  // gate runs BEFORE the data floor — we must not pick a product from a
  // different brand just because the right brand has no eco data.
  if (looksLikeBrandQuery(trimmed)) {
    const brandHits = pool.filter((c) => isBrandHit(trimmed, c.brand));
    // OFF often stores the consumer-facing brand name in the product name rather
    // than the brand field (e.g. brand="Nabisco" but name="Oreo Original").
    // Fall back to product-name containment before giving up entirely.
    const hitsToRank = brandHits.length > 0
      ? brandHits
      : pool.filter((c) => containsAnyWord(trimmed, c.productName ?? ''));

    if (hitsToRank.length > 0) {
      // Score by:
      //   1. Canonicality — "Oreo" beats "Oreo O's Cereal" beats "Oreo Birthday Bites".
      //   2. Popularity band — top-3 vs top-10 vs rest (OFF orders by scans).
      //   3. Data richness — only as final tiebreak.
      // This intentionally LOWERS richness's influence: a barely-scored canonical
      // cookie beats a richly-scored niche variant, because canonical is what
      // the shopper actually meant.
      const ranked = hitsToRank
        .map((c, originalIndex) => ({
          c,
          originalIndex,
          canonical: canonicalityScore(trimmed, c.productName, c.brand),
          popBand: originalIndex < 3 ? 0 : originalIndex < 10 ? 1 : 2,
          richness: dataRichness(c),
        }))
        .sort((a, b) => {
          if (b.canonical !== a.canonical) return b.canonical - a.canonical;
          if (a.popBand !== b.popBand) return a.popBand - b.popBand;
          if (a.originalIndex !== b.originalIndex) return a.originalIndex - b.originalIndex;
          return b.richness - a.richness;
        });
      const winner = ranked[0].c;
      return { product: winner, confidence: 0.9, cleanedQuery, noMatch: false };
    }
    return NO_MATCH(cleanedQuery);
  }

  // PRODUCT-NAME PATH:
  // Multi-word descriptive queries (e.g. "lays chilli chips", "alpro oat milk")
  // run through the normal relevance + word-containment filter.
  const wordMatched = pool.filter((p) =>
    containsAnyWord(cleanedQuery, [p.productName, p.brand].filter(Boolean).join(' ')),
  );
  const relevantPool = wordMatched.length > 0 ? wordMatched : pool;
  const candidates = applyDataFloor(relevantPool);

  const match = pickBestMatch(candidates, trimmed, cleanedQuery);
  if (match.passedRelevanceGate && match.product) {
    const winner = pickRichestEquallyRelevant(candidates, match.product, trimmed);
    return {
      product: winner,
      confidence: match.confidence,
      cleanedQuery,
      noMatch: false,
    };
  }

  // No strong match. Refuse rather than return a misleading first result.
  return NO_MATCH(cleanedQuery);
}

/**
 * If multiple candidates pass the relevance gate with similar scores,
 * prefer the one whose name is most CANONICAL for the query — then richness.
 * "Oreo" stays Oreo, doesn't become "Oreo O's Cereal".
 */
function pickRichestEquallyRelevant(
  candidates: OpenFoodFactsResult[],
  defaultWinner: OpenFoodFactsResult,
  originalQuery: string,
): OpenFoodFactsResult {
  const scored = candidates
    .map((c) => {
      const m = pickBestMatch([c], originalQuery, originalQuery);
      return {
        product: c,
        score: m.passedRelevanceGate ? m.confidence : 0,
        canonical: canonicalityScore(originalQuery, c.productName, c.brand),
        richness: dataRichness(c),
      };
    })
    .filter((s) => s.score > 0);

  if (scored.length === 0) return defaultWinner;

  const top = Math.max(...scored.map((s) => s.score));
  const closeContenders = scored.filter((s) => s.score >= top - 0.08);

  if (closeContenders.length <= 1) return defaultWinner;

  closeContenders.sort((a, b) => {
    if (b.canonical !== a.canonical) return b.canonical - a.canonical;
    if (b.score !== a.score) return b.score - a.score;
    return b.richness - a.richness;
  });
  return closeContenders[0].product;
}
