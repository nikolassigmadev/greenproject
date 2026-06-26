import { getBackendUrl } from '@/config/backend';
import type {
  OpenFoodFactsResponse,
  OpenFoodFactsSearchResponse,
  OpenFoodFactsProduct,
  OpenFoodFactsResult,
} from './types';

import { validateAndCleanBarcode, getAlternativeFormats } from '../../utils/barcodeValidator';
import { ocrSearchLogger } from '../../utils/ocrSearchLogger';
import { getProductOverride } from '../../data/productOverrides';
import { getPinnedBarcodes } from '../../data/brandSearchPins';

const OFF_API_BASE = 'https://world.openfoodfacts.org';
// OFF's modern Elasticsearch-backed search engine ("Search-a-licious").
// Phrase-boosted relevance ranking — far more accurate for flavor/variant
// queries than the legacy cgi/search.pl, which is also frequently down.
const OFF_SEARCH_BASE = 'https://search.openfoodfacts.org';

const joinIfArray = (v: unknown): string | undefined =>
  Array.isArray(v) ? v.join(', ') : (v as string | undefined);

/**
 * Convert a Search-a-licious hit to the classic API product shape.
 * Search-a-licious returns `brands` (and a few sibling fields) as arrays
 * where the classic API returns comma-separated strings.
 */
const fromSaliciousHit = (hit: Record<string, unknown>): OpenFoodFactsProduct => ({
  ...(hit as unknown as OpenFoodFactsProduct),
  brands: joinIfArray(hit.brands),
  labels: joinIfArray(hit.labels),
  categories: joinIfArray(hit.categories),
  origins: joinIfArray(hit.origins),
});

/**
 * At least one significant query word (≥3 chars) must appear as a whole word
 * in the product's name or brand. Guards against unrelated results leaking in
 * when filters are relaxed.
 */
const isRelevantToQuery = (query: string, p: OpenFoodFactsResult): boolean => {
  const queryWords = query
    .toLowerCase()
    .split(/[\s\-_,/&().]+/)
    .filter((w) => w.length >= 3)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (queryWords.length === 0) return true;
  const haystack = [p.productName, p.brand].filter(Boolean).join(' ').toLowerCase();
  const matchCount = queryWords.filter((qw) => new RegExp(`\\b${qw}\\b`, 'i').test(haystack)).length;
  // For multi-word queries, require the first word (brand/most-specific) OR
  // at least 2 words to match. Prevents "caramel" alone from qualifying an
  // unrelated caramel drink for a "Rebo Kuaci Salted Caramel" query.
  if (queryWords.length >= 3) {
    const firstWordMatches = new RegExp(`\\b${queryWords[0]}\\b`, 'i').test(haystack);
    return firstWordMatches || matchCount >= 2;
  }
  return matchCount >= 1;
};

// ---------------------------------------------------------------------------
// Simple in-memory cache with TTL (5 minutes) to avoid duplicate API calls
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function cacheGet<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return undefined;
  }
  return entry.data as T;
}

function cacheSet<T>(key: string, data: T): void {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
}

// Countries we care about — Europe, North America, Oceania, and Indonesia.
// Matched against OpenFoodFacts `countries_tags` which use "en:" prefix.
const ALLOWED_COUNTRY_TAGS = new Set([
  // North America
  "en:united-states", "en:canada", "en:mexico",
  // Europe
  "en:france", "en:germany", "en:united-kingdom", "en:spain", "en:italy",
  "en:belgium", "en:switzerland", "en:netherlands", "en:portugal", "en:sweden",
  "en:austria", "en:poland", "en:denmark", "en:norway", "en:finland",
  "en:ireland", "en:greece", "en:czech-republic", "en:romania", "en:hungary",
  "en:croatia", "en:slovakia", "en:slovenia", "en:bulgaria", "en:luxembourg",
  "en:estonia", "en:latvia", "en:lithuania", "en:cyprus", "en:malta",
  "en:iceland", "en:liechtenstein",
  // Oceania
  "en:australia", "en:new-zealand",
  // Indonesia
  "en:indonesia",
]);

// Eco-score grades we accept. OFF returns "unknown" / "not-applicable"
// for unscored products; normalizeProduct() already strips those to null.
const VALID_ECOSCORE_GRADES = new Set(['a', 'b', 'c', 'd', 'e']);

/** True when the product has a real eco-score (A–E), not unknown/missing. */
const hasEcoscore = (product: OpenFoodFactsResult): boolean => {
  const g = product.ecoscoreGrade?.toLowerCase();
  return !!g && VALID_ECOSCORE_GRADES.has(g);
};

/**
 * True when the product has a community-selected front photo.
 *
 * OFF's `states_tags` is the source of truth for image curation. When
 * `en:front-photo-selected` is set, a contributor has chosen a clean
 * front-of-package shot from the uploaded images. These are far more
 * likely to be studio-style product photos without hands, fingers, or
 * busy backgrounds than the raw `image_url` fallback.
 *
 * We also require `image_front_url` to exist, since the curated state
 * occasionally lingers after the image is removed.
 */
export const hasCleanFrontImage = (product: OpenFoodFactsResult): boolean => {
  if (!product.imageUrl) return false;
  const raw = product.rawProduct;
  if (!raw) return false;
  if (!raw.image_front_url) return false;
  const states = raw.states_tags;
  if (!states || states.length === 0) return false;
  return states.some(
    (s) =>
      s.toLowerCase() === 'en:front-photo-selected' ||
      s.toLowerCase() === 'en:photos-validated',
  );
};

/**
 * Image quality tier, highest is best. Used to break ranking ties so we never
 * show an "ugly" photo (a barcode/nutrition-panel shot, or a raw upload) when a
 * proper front-of-pack image exists for an equally-relevant product.
 *   3 — curated + validated front photo (`hasCleanFrontImage`)
 *   2 — a selected front image exists, but not contributor-validated
 *   1 — only a generic `image_url` (often not a clean front-of-pack shot)
 *   0 — no image at all
 */
export const imageQualityTier = (p: OpenFoodFactsResult): number => {
  if (hasCleanFrontImage(p)) return 3;
  if (p.rawProduct?.image_front_url) return 2;
  return p.imageUrl ? 1 : 0;
};

/**
 * Data-completeness score for a product, weighted toward the fields we actually
 * render (eco-score, carbon, nutrition). Higher = more useful to the shopper.
 * Pure/in-memory — used only to rank an already-fetched candidate set, so it
 * adds no network cost.
 */
export const scoreDataCompleteness = (p: OpenFoodFactsResult): number => {
  let s = 0;
  if (p.ecoscoreGrade) s += 20;
  if (p.ecoscoreScore !== null) s += 8;
  if (p.ecoscoreData?.agribalyse?.co2_total != null) s += 20;
  else if (p.carbonFootprint100g !== null) s += 12;
  if (p.nutriscoreGrade) s += 10;
  if (p.novaGroup !== null) s += 6;
  if (p.ingredientsText) s += 6;
  if (p.categories.length > 0) s += 4;
  if (p.labels.length > 0) s += 4;
  if (p.brand) s += 4;
  if (p.productName) s += 2;
  return s;
};

/**
 * Rank an already-fetched candidate list so the best product surfaces first,
 * WITHOUT any extra network calls. Ordering, in priority:
 *   1. Relevance to the query (coarse buckets — keeps the right product first)
 *   2. Image quality   — avoids ugly/partial photos
 *   3. Data completeness — avoids near-empty entries when a rich one matches
 *   4. Original order (stable) — preserves the backend's popularity ranking
 *
 * Relevance is bucketed (not compared at full precision) so that two genuinely
 * matching products are treated as equally relevant and then separated by
 * quality, instead of an arbitrary float difference deciding the winner.
 */
export const rankByQuality = (
  query: string,
  products: OpenFoodFactsResult[],
): OpenFoodFactsResult[] => {
  const qWords = query
    .toLowerCase()
    .split(/[\s\-_,/&().]+/)
    .filter((w) => w.length >= 3)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  const relevanceBucket = (p: OpenFoodFactsResult): number => {
    if (qWords.length === 0) return 0;
    const hay = [p.productName, p.brand].filter(Boolean).join(' ').toLowerCase();
    // Positional weighting: first words (brand/product name) outweigh trailing descriptors.
    // "Rebo Kuaci Salted Caramel" → matching "Rebo"+"Kuaci" scores higher than "Salted"+"Caramel".
    let weightedMatch = 0;
    let totalWeight = 0;
    qWords.forEach((w, idx) => {
      const weight = Math.max(1, qWords.length - idx);
      totalWeight += weight;
      if (new RegExp(`\\b${w}\\b`, 'i').test(hay)) weightedMatch += weight;
    });
    return Math.round((weightedMatch / totalWeight) * 4); // 0–4 coarse buckets
  };

  return products
    .map((p, i) => ({
      p,
      i,
      rel: relevanceBucket(p),
      img: imageQualityTier(p),
      data: scoreDataCompleteness(p),
    }))
    .sort(
      (a, b) =>
        b.rel - a.rel || b.img - a.img || b.data - a.data || a.i - b.i,
    )
    .map((d) => d.p);
};

/**
 * Returns true if the product is sold in an allowed region
 * (Europe, North America, or Indonesia). If no country data
 * is available, the product is kept to avoid false negatives.
 */
const isAllowedRegion = (product: OpenFoodFactsResult): boolean => {
  const raw = product.rawProduct;
  if (!raw) return true;

  const tags = raw.countries_tags;
  // No country data → keep the product
  if (!tags || tags.length === 0) return true;

  return tags.some(tag => ALLOWED_COUNTRY_TAGS.has(tag.toLowerCase()));
};

const emptyResult = (barcode: string, error?: string): OpenFoodFactsResult => ({
  found: false,
  barcode,
  productName: null,
  brand: null,
  ecoscoreGrade: null,
  ecoscoreScore: null,
  nutriscoreGrade: null,
  nutriscoreScore: null,
  novaGroup: null,
  carbonFootprint100g: null,
  carbonFootprintProduct: null,
  carbonFootprintServing: null,
  labels: [],
  categories: [],
  origins: null,
  ingredientsText: null,
  imageUrl: null,
  ecoscoreData: null,
  rawProduct: null,
  error,
});

/** Returns true if the string is mostly non-Latin (Arabic, CJK, Cyrillic, etc.) */
const isNonLatin = (s: string): boolean => {
  const latinChars = s.replace(/[^a-zA-Z]/g, '').length;
  const totalChars = s.replace(/[\s\d\-_.,!?()]/g, '').length;
  return totalChars > 0 && latinChars / totalChars < 0.5;
};

/** Pick the best available English product name */
const pickEnglishName = (p: OpenFoodFactsProduct): string | null => {
  const candidates = [
    p.product_name_en,
    p.abbreviated_product_name,
    p.generic_name_en,
    p.product_name,
    p.generic_name,
  ];
  // First pass: pick the first candidate that has Latin characters
  for (const c of candidates) {
    if (c && c.trim() && !isNonLatin(c)) return c.trim();
  }
  // If everything is non-Latin, use brand as fallback
  if (p.brands && !isNonLatin(p.brands)) return p.brands.trim();
  // Last resort: return whatever product_name we have
  return p.product_name?.trim() || null;
};

const normalizeProduct = (p: OpenFoodFactsProduct): OpenFoodFactsResult => {
  const carbonFootprint100g =
    p.nutriments?.['carbon-footprint-from-known-ingredients_100g'] ?? null;
  const carbonFootprintProduct =
    p.nutriments?.['carbon-footprint-from-known-ingredients_product'] ?? null;
  const carbonFootprintServing =
    p.nutriments?.['carbon-footprint-from-known-ingredients_serving'] ?? null;

  const labels = p.labels_tags
    ? p.labels_tags.map((l) => l.replace(/^en:/, '').replace(/-/g, ' '))
    : p.labels
      ? p.labels.split(',').map((l) => l.trim())
      : [];

  const categories = p.categories_tags
    ? p.categories_tags.map((c) => c.replace(/^en:/, '').replace(/-/g, ' '))
    : p.categories
      ? p.categories.split(',').map((c) => c.trim())
      : [];

  return {
    found: true,
    barcode: p.code,
    productName: pickEnglishName(p),
    brand: p.brands || null,
    ecoscoreGrade:
      p.ecoscore_grade && p.ecoscore_grade !== 'unknown' && p.ecoscore_grade !== 'not-applicable'
        ? p.ecoscore_grade
        : null,
    // OFF's ecoscore_score includes production bonuses (recyclable packaging,
    // organic labels, …) that can push it above 100 — and penalties can push it
    // below 0. Clamp to the displayed 0–100 scale so the score ring/bars don't
    // render impossible values like "101 / 100".
    ecoscoreScore:
      typeof p.ecoscore_score === 'number'
        ? Math.max(0, Math.min(100, Math.round(p.ecoscore_score)))
        : null,
    nutriscoreGrade: p.nutriscore_grade || null,
    nutriscoreScore: typeof p.nutriscore_score === 'number' ? p.nutriscore_score : null,
    novaGroup: typeof p.nova_group === 'number' ? p.nova_group : null,
    carbonFootprint100g: typeof carbonFootprint100g === 'number' ? carbonFootprint100g : null,
    carbonFootprintProduct: typeof carbonFootprintProduct === 'number' ? carbonFootprintProduct : null,
    carbonFootprintServing: typeof carbonFootprintServing === 'number' ? carbonFootprintServing : null,
    labels,
    categories,
    origins: p.origins || null,
    ingredientsText: p.ingredients_text_en || p.ingredients_text || null,
    imageUrl: p.image_front_url || p.image_url || null,
    ecoscoreData: p.ecoscore_data || null,
    rawProduct: p,
  };
};

export const isValidBarcode = (code: string): boolean => {
  const cleaned = code.replace(/\s+/g, '').trim();
  return /^\d{8,14}$/.test(cleaned);
};

export const lookupBarcode = async (barcode: string): Promise<OpenFoodFactsResult> => {
  // Validate and clean the barcode
  const validation = validateAndCleanBarcode(barcode);
  const cleaned = validation.cleaned;

  // Log barcode validation
  ocrSearchLogger.logBarcodeValidation(barcode, cleaned, validation.isValid, validation.format);

  if (!validation.isValid) {
    console.warn(`❌ Barcode validation failed: "${barcode}" is not a valid format (${validation.format})`);
    return emptyResult(
      cleaned,
      `Invalid barcode format. Got: ${validation.format}. Expected 8-14 digits.`
    );
  }

  console.log(`✅ Barcode validated: "${barcode}" → "${cleaned}" (${validation.format})`);

  // Check local override map before hitting the network
  const override = getProductOverride(cleaned);
  if (override) {
    console.log(`📋 Using local override for barcode: ${cleaned}`);
    return override;
  }

  // Try primary barcode first
  const result = await lookupBarcodeInternal(cleaned);
  if (result.found) {
    ocrSearchLogger.logBarcodeSearch(cleaned, true, result.productName || undefined);
    return result;
  }

  // If primary timed out (network issue), skip alternatives to avoid long waits
  const isTimeout = result.error?.includes('timed out') || result.error?.includes('abort');
  if (isTimeout) {
    console.warn(`⏱️ Primary lookup timed out, skipping alternatives for: ${barcode}`);
    ocrSearchLogger.logBarcodeSearch(cleaned, false);
    return emptyResult(cleaned, `Network timeout looking up barcode ${cleaned}`);
  }

  // If primary lookup failed but network works, try alternative formats
  console.warn(`🔄 Primary barcode lookup failed, trying alternatives...`);
  const alternatives = getAlternativeFormats(barcode);

  for (const alt of alternatives) {
    console.log(`   Trying alternative format: ${alt}`);
    const altResult = await lookupBarcodeInternal(alt);
    if (altResult.found) {
      console.log(`✅ Found product using alternative barcode: ${alt}`);
      ocrSearchLogger.logBarcodeSearch(alt, true, altResult.productName || undefined);
      return altResult;
    }
  }

  // All attempts failed
  console.warn(`❌ All barcode lookup attempts failed for: ${barcode}`);
  ocrSearchLogger.logBarcodeSearch(cleaned, false);
  return emptyResult(
    cleaned,
    `Product not found on OpenFoodFacts. Tried: ${[cleaned, ...alternatives].join(', ')}`
  );
};

/**
 * Internal barcode lookup (single attempt)
 */
const lookupBarcodeInternal = async (barcode: string): Promise<OpenFoodFactsResult> => {
  const cacheKey = `barcode:${barcode}`;
  const cached = cacheGet<OpenFoodFactsResult>(cacheKey);
  if (cached) {
    console.log(`📦 Using cached result for barcode: ${barcode}`);
    return cached;
  }

  // Try backend proxy first (handles CORS, User-Agent, retries server-side)
  const backendUrl = getBackendUrl();

  try {
    const startTime = Date.now();
    console.log(`   Trying backend proxy for barcode: ${barcode}`);
    const response = await fetch(`${backendUrl}/api/openfoodfacts/product/${barcode}`, {
      signal: AbortSignal.timeout(8000),
    });

    const duration = Date.now() - startTime;
    console.log(`   Backend proxy took ${duration}ms`);

    if (response.ok) {
      const data: OpenFoodFactsResponse = await response.json();
      if (data.status === 1 && data.product) {
        const result = normalizeProduct(data.product);
        cacheSet(cacheKey, result);
        console.log(`✅ Product found via proxy: ${result.productName} (${result.brand})`);
        return result;
      }
      if (data.status_verbose) {
        return emptyResult(barcode, data.status_verbose);
      }
    }
  } catch (proxyError) {
    const msg = proxyError instanceof Error ? proxyError.message : 'Unknown';
    console.warn(`   Backend proxy failed: ${msg}, trying direct API...`);
  }

  // Fallback: direct API call with field filtering to reduce response size
  const fields = 'code,product_name,product_name_en,generic_name,generic_name_en,abbreviated_product_name,brands,ecoscore_grade,ecoscore_score,ecoscore_data,nutriscore_grade,nutriscore_score,nova_group,nutriments,labels_tags,labels,categories_tags,categories,origins,ingredients_text,ingredients_text_en,image_front_url,image_url,countries_tags,states_tags';

  const endpoints = [
    `${OFF_API_BASE}/api/v2/product/${barcode}?fields=${fields}`,
    `${OFF_API_BASE}/api/v0/product/${barcode}.json?fields=${fields}`,
  ];

  for (const url of endpoints) {
    try {
      const startTime = Date.now();
      const response = await fetch(url, {
        signal: AbortSignal.timeout(6000),
      });

      const duration = Date.now() - startTime;
      console.log(`   ${url.includes('v2') ? 'v2' : 'v0'} direct call took ${duration}ms`);

      if (!response.ok) {
        console.warn(`   HTTP ${response.status}: ${response.statusText}`);
        continue;
      }

      const data: OpenFoodFactsResponse = await response.json();

      if (data.status !== 1 || !data.product) {
        console.warn(`   Status ${data.status}: ${data.status_verbose || 'Product not found'}`);
        return emptyResult(barcode, data.status_verbose || 'Product not found on OpenFoodFacts');
      }

      const result = normalizeProduct(data.product);
      cacheSet(cacheKey, result);

      console.log(`✅ Product found: ${result.productName} (${result.brand})`);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`   ${url.includes('v2') ? 'v2' : 'v0'} Error: ${errorMsg}`);
    }
  }

  // All endpoints failed
  return emptyResult(barcode, 'signal timed out');
};

/**
 * Generate an ordered list of search candidates from most specific to least.
 *
 * Strategy:
 *   1. Full query                          "Doritos Cool Ranch"
 *   2. Prefix shrink (drop rightmost word) "Doritos Cool"
 *   3. Suffix (drop brand/first word)      "Cool Ranch"
 *   4. First word alone (brand)            "Doritos"
 *
 * Deduplicates so short inputs don't produce redundant attempts.
 *
 * Examples:
 *   "Doritos Cool Ranch"         → ["Doritos Cool Ranch", "Doritos Cool", "Cool Ranch", "Doritos"]
 *   "Häagen-Dazs Vanilla Cream"  → ["Häagen-Dazs Vanilla Cream", "Häagen-Dazs Vanilla", "Vanilla Cream", "Häagen-Dazs"]
 *   "Coke"                       → ["Coke"]
 *   "Doritos Cool"               → ["Doritos Cool", "Doritos"]
 */
export function generateSearchVariations(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const words = trimmed.split(/\s+/).filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];

  const push = (v: string) => {
    const k = v.toLowerCase();
    if (!seen.has(k)) { seen.add(k); out.push(v); }
  };

  // 1. Full query
  push(trimmed);

  if (words.length <= 1) return out;

  // 2. Prefix shrink: drop one word from right each step
  for (let len = words.length - 1; len >= 2; len--) {
    push(words.slice(0, len).join(' '));
  }

  // 3. Suffix: drop brand (first word), keep product descriptor
  //    Only meaningful when 3+ words, else it duplicates the first-word entry
  if (words.length >= 3) {
    push(words.slice(1).join(' '));
  }

  // 4. First word alone (brand)
  push(words[0]);

  return out;
}

/**
 * Attempt a single query variant against the backend proxy, with a direct
 * OFF API fallback. Returns normalized results or [] if nothing found.
 * Results are cached per variant so repeated calls are free.
 */
const searchOneVariant = async (
  query: string,
  limit: number,
): Promise<OpenFoodFactsResult[]> => {
  const cacheKey = `search:${query.toLowerCase()}:${limit}`;
  const cached = cacheGet<OpenFoodFactsResult[]>(cacheKey);
  if (cached) return cached;

  try {
    const backendUrl = getBackendUrl();
    // Bound the wait so a hung backend/upstream can't stall the scan. The server
    // chains several OFF strategies (each ~7s max); 10s covers a realistic worst
    // case while still failing fast enough to fall back to the direct OFF API.
    const response = await fetch(`${backendUrl}/api/openfoodfacts/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit: Math.min(limit * 2, 20) }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: OpenFoodFactsSearchResponse = await response.json();

    if (!data.products || data.products.length === 0) {
      console.warn(`⚠️ Backend returned 0 results for "${query}", trying direct OFF API...`);
      const directResults = await searchProductsGlobal(query, limit);
      if (directResults.length > 0) cacheSet(cacheKey, directResults);
      return directResults;
    }

    const allNormalized = data.products.map(normalizeProduct);
    const regionalResults = allNormalized.filter(isAllowedRegion);
    // Only return products with an eco-score and a curated front photo.
    // Image curation matters because raw OFF uploads often include hand-held
    // shots; the `en:front-photo-selected` state filters those out.
    // rankByQuality then orders the survivors so the richest, best-imaged
    // product wins — never an arbitrary "first from the API" sparse entry.
    const qualifyingResults = regionalResults
      .filter(hasEcoscore)
      .filter(hasCleanFrontImage);
    let results = rankByQuality(query, qualifyingResults).slice(0, limit);

    ocrSearchLogger.logRegionalFiltering(allNormalized.length, regionalResults.length, false);

    // If the strict filters wiped out too many results, relax the image
    // requirement first (keep eco-score). We still keep the relevance guard
    // so unrelated brands don't leak in, and rank by quality so the fullest
    // record (and the cleanest available image) leads.
    if (results.length < Math.ceil(limit * 0.5)) {
      const padding = rankByQuality(
        query,
        regionalResults.filter(hasEcoscore).filter((r) => isRelevantToQuery(query, r)),
      ).filter((r) => !results.some((ur) => ur.barcode === r.barcode));
      results = [...results, ...padding].slice(0, limit);
    }

    // Last tier: drop the eco-score requirement entirely. Showing the RIGHT
    // product with missing eco data beats "product not found" — many genuine
    // OFF entries simply haven't been eco-scored yet. The relevance guard
    // still applies so we never surface unrelated products.
    if (results.length === 0) {
      results = rankByQuality(
        query,
        regionalResults.filter((r) => isRelevantToQuery(query, r)),
      ).slice(0, limit);
    }

    cacheSet(cacheKey, results);
    return results;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    ocrSearchLogger.logAPIError('/api/openfoodfacts/search', errorMsg);
    return searchProductsGlobal(query, limit);
  }
};

/**
 * Search OpenFoodFacts with automatic multi-variation fallback.
 *
 * Internally generates candidate queries via generateSearchVariations() and
 * tries each in order until one returns results. This means every caller —
 * manual search, OCR flow, shopping list — automatically
 * benefits from progressive query simplification without any extra logic.
 *
 * "Doritos Cool Ranch" → tries "Doritos Cool Ranch" → "Doritos Cool"
 *                      → "Cool Ranch" → "Doritos" (stops at first hit)
 */
export const searchProducts = async (
  query: string,
  limit: number = 3,
): Promise<OpenFoodFactsResult[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Canonical brand pins. A few iconic spreads (Marmite, Vegemite) share their
  // name with the generic ingredient "yeast extract", so the progressive
  // query-shrink below would strip the brand word and match unrelated products
  // ("yeast extract flatbreads"). For these we skip the text search entirely
  // and resolve the real jar by barcode, then prefer the live record that
  // actually carries an eco-score. See data/brandSearchPins.ts.
  const pinnedBarcodes = getPinnedBarcodes(trimmed);
  if (pinnedBarcodes.length > 0) {
    const resolved = (await Promise.all(pinnedBarcodes.map(lookupBarcode)))
      .filter((r) => r.found);
    if (resolved.length > 0) {
      const best = resolved.find(hasEcoscore) ?? resolved[0];
      console.log(`📌 [SEARCH] "${trimmed}" pinned to canonical product: ${best.productName} (${best.barcode})`);
      return [best];
    }
    // None of the pinned barcodes resolved (network/OFF hiccup) — fall through
    // to the normal text search rather than returning nothing.
    console.warn(`📌 [SEARCH] pinned barcodes for "${trimmed}" did not resolve; falling back to text search`);
  }

  const variations = generateSearchVariations(trimmed);
  console.log(`🔍 [SEARCH] "${trimmed}" → trying ${variations.length} variation(s): ${variations.join(' | ')}`);

  for (const variant of variations) {
    const results = await searchOneVariant(variant, limit);

    if (results.length > 0) {
      ocrSearchLogger.logTextSearch(variant, results.length, { regionFiltered: true });
      if (variant !== trimmed) {
        console.log(`   ✅ Hit on simplified query: "${variant}" (${results.length} results)`);
      }
      return results;
    }

    ocrSearchLogger.logTextSearch(variant, 0, { regionFiltered: false });
    if (variant !== variations[variations.length - 1]) {
      console.warn(`   ↪ No results for "${variant}", trying next variation...`);
    }
  }

  console.warn(`⚠️ No results found for any variation of "${trimmed}"`);
  return [];
};

/**
 * Search tuned for VISUAL (colour) matching rather than data richness.
 *
 * Unlike searchProducts/searchOneVariant, this does NOT require an eco-score —
 * it returns every image-bearing product for the query. That matters because
 * OFF eco-scores are sparse: for many brands the only eco-scored entry is an
 * off-type variant (e.g. M&M's *ice cream* is eco-scored while the actual M&M's
 * *candy* bags are not), so the normal eco-first ranking can drop the real
 * product from the candidate pool entirely. When the eco-ranked text match
 * fails to look like the user's photo, the scan flow widens to this pool so
 * colour matching can still surface the correct product.
 */
export const searchVisualCandidates = async (
  query: string,
  limit = 12,
): Promise<OpenFoodFactsResult[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const cacheKey = `visual:${trimmed.toLowerCase()}:${limit}`;
  const cached = cacheGet<OpenFoodFactsResult[]>(cacheKey);
  if (cached) return cached;

  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/openfoodfacts/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: trimmed, limit: 20 }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return [];

    const data: OpenFoodFactsSearchResponse = await response.json();
    if (!data.products?.length) return [];

    // Only image-bearing, in-region products — an entry with no cover can't be
    // colour-matched, so it's useless as a visual candidate.
    const candidates = data.products
      .map(normalizeProduct)
      .filter(isAllowedRegion)
      .filter((p) => !!p.imageUrl);

    const ranked = rankByQuality(trimmed, candidates).slice(0, limit);
    if (ranked.length > 0) cacheSet(cacheKey, ranked);
    return ranked;
  } catch {
    return [];
  }
};

export interface BrowseOptions {
  query?: string;
  category?: string;
  country?: string;
  page?: number;
  pageSize?: number;
}

export interface BrowseResult {
  products: OpenFoodFactsResult[];
  totalCount: number;
  page: number;
  pageCount: number;
}

// Search for greener alternatives in the same category with better eco-scores and lower CO2

/**
 * Search with automatic regional fallback
 * First tries region-filtered search, then expands globally if needed
 */
export const searchProductsWithRegionalFallback = async (
  query: string,
  limit: number = 3
): Promise<{ results: OpenFoodFactsResult[]; expandedRegion: boolean }> => {
  // First try with region filter
  const results = await searchProducts(query, limit);
  
  if (results.length > 0) {
    console.log(`✅ Found ${results.length} results within allowed regions`);
    return { results, expandedRegion: false };
  }

  // No results in allowed regions - expand to all regions
  console.warn(`⚠️ No results in allowed regions, expanding search globally...`);
  
  // Retry without region filter (search globally)
  const globalResults = await searchProductsGlobal(query, limit);
  
  if (globalResults.length > 0) {
    console.log(`✅ Found ${globalResults.length} global results after regional expansion`);
  }
  
  return { results: globalResults, expandedRegion: true };
};

/**
 * Global product search (no region filtering)
 */
const searchProductsGlobal = async (
  query: string,
  limit: number = 3
): Promise<OpenFoodFactsResult[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const cacheKey = `search:global:${trimmed.toLowerCase()}:${limit}`;
  const cached = cacheGet<OpenFoodFactsResult[]>(cacheKey);
  if (cached) {
    console.log(`📦 Using cached global search results`);
    return cached;
  }

  // Build progressively shorter query candidates to try.
  // We deliberately do NOT drop down to a single word — "Ben & Jerry's Phish Food"
  // shrunk to "Ben" returned Moroccan dairy (jben) under OFF's loose match. A
  // single token is too ambiguous; keep at least two distinctive words.
  const words = trimmed.split(/\s+/).filter(Boolean);
  const candidates: string[] = [trimmed];
  if (words.length > 3) candidates.push(words.slice(0, 3).join(' '));
  if (words.length > 2) candidates.push(words.slice(0, 2).join(' '));

  const searchFields = [
    'code', 'product_name', 'product_name_en', 'generic_name', 'generic_name_en', 'abbreviated_product_name', 'brands',
    'ecoscore_grade', 'ecoscore_score', 'ecoscore_data',
    'nutriscore_grade', 'nutriscore_score', 'nova_group',
    'nutriments', 'labels_tags', 'labels', 'categories_tags', 'categories',
    'origins', 'ingredients_text', 'ingredients_text_en',
    'image_front_url', 'image_url', 'countries_tags', 'states_tags',
  ].join(',');

  /**
   * Fetch raw products for one query string. This is the LAST-RESORT path
   * (the backend proxy already failed or returned nothing), so it talks to
   * OFF directly. cgi/search.pl goes first because it sends CORS headers and
   * works from the browser; Search-a-licious has no CORS so it only succeeds
   * in non-browser contexts (tests, native shells) — still worth a try.
   */
  const fetchRawProducts = async (candidate: string): Promise<OpenFoodFactsProduct[]> => {
    try {
      const params = new URLSearchParams({
        search_terms: candidate,
        search_simple: '1',
        action: 'process',
        json: '1',
        page_size: String(Math.min(limit * 3, 50)),
        sort_by: 'unique_scans_n',
        fields: searchFields,
      });
      const response = await fetch(`${OFF_API_BASE}/cgi/search.pl?${params}`, {
        signal: AbortSignal.timeout(8000),
      });
      // The legacy endpoint serves an HTML error page when overloaded
      if (response.ok && (response.headers.get('content-type') || '').includes('json')) {
        const data: OpenFoodFactsSearchResponse = await response.json();
        if (Array.isArray(data.products) && data.products.length > 0) return data.products;
      }
    } catch (error) {
      console.warn(`   Legacy search failed for "${candidate}": ${error instanceof Error ? error.message : error}`);
    }

    try {
      const params = new URLSearchParams({
        q: candidate,
        langs: 'en',
        page_size: String(Math.min(limit * 3, 50)),
        fields: searchFields,
      });
      const response = await fetch(`${OFF_SEARCH_BASE}/search?${params}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.hits) && data.hits.length > 0) {
          return data.hits.map(fromSaliciousHit);
        }
      }
    } catch (error) {
      console.warn(`   Search-a-licious failed for "${candidate}": ${error instanceof Error ? error.message : error}`);
    }
    return [];
  };

  for (const candidate of candidates) {
    const rawProducts = await fetchRawProducts(candidate);

    if (rawProducts.length === 0) {
      if (candidate !== candidates[candidates.length - 1]) {
        console.warn(`   No global results for "${candidate}", trying shorter query...`);
      }
      continue;
    }

    const normalized = rawProducts.map(normalizeProduct);
    // Tiered preference: eco-score + curated photo → eco-score only →
    // any result relevant to the query. The right product with missing eco
    // data beats "not found". Within the chosen tier, rankByQuality lifts the
    // fullest record with the cleanest image to the top.
    const strict = normalized.filter(hasEcoscore).filter(hasCleanFrontImage);
    const ecoOnly = strict.length > 0 ? strict : normalized.filter(hasEcoscore);
    const fallback = ecoOnly.length > 0
      ? ecoOnly
      : normalized.filter((r) => isRelevantToQuery(candidate, r));
    const results = rankByQuality(candidate, fallback).slice(0, limit);
    if (results.length === 0) continue;
    console.log(`   Got ${results.length} global results for "${candidate}" (region filter disabled)`);
    cacheSet(cacheKey, results);
    return results;
  }

  console.warn(`   No global results found for any variant of "${trimmed}"`);
  return [];
};


/**
 * @deprecated — searchProducts now handles multi-variation fallback internally.
 * Kept for API compatibility; delegates directly.
 */
export const searchWithFallback = (
  query: string,
  limit: number = 3,
): Promise<OpenFoodFactsResult[]> => searchProducts(query, limit);

export const searchBetterAlternatives = async (
  result: OpenFoodFactsResult,
  limit: number = 3
): Promise<OpenFoodFactsResult[]> => {
  const grade = result.ecoscoreGrade?.toLowerCase();
  if (!grade || !['d', 'e'].includes(grade)) return [];

  // Use the first meaningful category (skip very generic ones)
  const category = result.categories.find(c => c.length > 3) || result.categories[0];
  if (!category) return [];

  const cacheKey = `alts:${result.barcode}:${category}:${limit}`;
  const cached = cacheGet<OpenFoodFactsResult[]>(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({
      action: 'process',
      json: '1',
      page_size: '30',
      sort_by: 'unique_scans_n',
      tagtype_0: 'categories',
      tag_contains_0: 'contains',
      tag_0: category,
      fields: [
        'code', 'product_name', 'product_name_en', 'generic_name', 'generic_name_en', 'abbreviated_product_name', 'brands',
        'ecoscore_grade', 'ecoscore_score', 'ecoscore_data',
        'nutriscore_grade', 'nutriscore_score', 'nova_group',
        'nutriments', 'labels_tags', 'labels', 'categories_tags', 'categories',
        'origins', 'ingredients_text', 'ingredients_text_en',
        'image_front_url', 'image_url', 'countries_tags', 'states_tags',
      ].join(','),
    });

    let rawProducts: OpenFoodFactsProduct[] = [];
    try {
      const response = await fetch(`${OFF_API_BASE}/cgi/search.pl?${params}`, {
        signal: AbortSignal.timeout(10000),
      });
      // The legacy endpoint serves an HTML error page when overloaded
      if (response.ok && (response.headers.get('content-type') || '').includes('json')) {
        const data: OpenFoodFactsSearchResponse = await response.json();
        if (Array.isArray(data.products)) rawProducts = data.products;
      }
    } catch {
      // Legacy endpoint down — fall through to the backend browse proxy below
    }

    if (rawProducts.length === 0) {
      // Backend proxy reaches Search-a-licious (browsers can't — no CORS)
      const browseResponse = await fetch(`${getBackendUrl()}/api/openfoodfacts/browse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, pageSize: 30 }),
        signal: AbortSignal.timeout(20000),
      });
      if (!browseResponse.ok) return [];
      const browseData = await browseResponse.json();
      if (!Array.isArray(browseData.products) || browseData.products.length === 0) return [];
      rawProducts = browseData.products;
    }

    const betterGrades = new Set(['a', 'b']);
    const candidates = rawProducts
      .filter(p => p.code !== result.barcode)
      .map(normalizeProduct)
      .filter(isAllowedRegion)
      .filter(p =>
        p.ecoscoreGrade && betterGrades.has(p.ecoscoreGrade.toLowerCase()) &&
        (p.ecoscoreData?.agribalyse?.co2_total != null || p.carbonFootprint100g != null)
      );

    if (candidates.length === 0) return [];

    // Prefer products with a curated front photo. If none have one, fall
    // back to the unfiltered list so the swap card still has something to
    // show — partial data beats none for "greener alternative" suggestions.
    const withCleanImage = candidates.filter(hasCleanFrontImage);
    const finalCandidates = withCleanImage.length > 0 ? withCleanImage : candidates;

    // Sort by CO2 total (ascending) - prefer lowest carbon footprint
    finalCandidates.sort((a, b) => {
      const aCO2 = a.ecoscoreData?.agribalyse?.co2_total ?? a.carbonFootprint100g ?? Infinity;
      const bCO2 = b.ecoscoreData?.agribalyse?.co2_total ?? b.carbonFootprint100g ?? Infinity;
      return aCO2 - bCO2;
    });

    const results = finalCandidates.slice(0, limit);
    cacheSet(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Error searching for alternatives:', error);
    return [];
  }
};

/**
 * Browse fallback via the backend proxy — used when the legacy cgi/search.pl
 * endpoint is down (which happens regularly). The proxy reaches OFF's modern
 * Search-a-licious engine, which browsers cannot call directly (no CORS).
 */
const browseProductsViaBackend = async (
  options: BrowseOptions,
): Promise<BrowseResult | null> => {
  const { query, category, country, page = 1, pageSize = 24 } = options;

  try {
    const response = await fetch(`${getBackendUrl()}/api/openfoodfacts/browse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, category, country, page, pageSize }),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) return null;

    const data = await response.json();
    if (!Array.isArray(data.products)) return null;

    const products = (data.products as OpenFoodFactsProduct[])
      .map(normalizeProduct)
      .filter(isAllowedRegion)
      .filter(hasEcoscore)
      .filter(hasCleanFrontImage);

    return {
      products,
      totalCount: data.count || products.length,
      page: data.page || page,
      pageCount: data.page_count || 0,
    };
  } catch (error) {
    console.warn('Backend browse failed:', error instanceof Error ? error.message : error);
    return null;
  }
};

export const browseProducts = async (options: BrowseOptions = {}): Promise<BrowseResult> => {
  const { query, category, country, page = 1, pageSize = 24 } = options;

  const cacheKey = `browse:${query || ''}:${category || ''}:${country || ''}:${page}:${pageSize}`;
  const cached = cacheGet<BrowseResult>(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({
      action: 'process',
      json: '1',
      page: String(page),
      page_size: String(pageSize),
      sort_by: 'unique_scans_n',
      // Only fetch the fields we actually use — cuts response size dramatically
      fields: [
        'code', 'product_name', 'product_name_en', 'generic_name', 'generic_name_en', 'abbreviated_product_name', 'brands',
        'ecoscore_grade', 'ecoscore_score', 'ecoscore_data',
        'nutriscore_grade', 'nutriscore_score', 'nova_group',
        'nutriments', 'labels_tags', 'labels', 'categories_tags', 'categories',
        'origins', 'ingredients_text', 'ingredients_text_en',
        'image_front_url', 'image_url', 'countries_tags', 'states_tags',
      ].join(','),
    });

    if (query?.trim()) {
      params.set('search_terms', query.trim());
    }

    let tagIndex = 0;

    if (category) {
      params.set(`tagtype_${tagIndex}`, 'categories');
      params.set(`tag_contains_${tagIndex}`, 'contains');
      params.set(`tag_${tagIndex}`, category);
      tagIndex++;
    }

    if (country) {
      params.set(`tagtype_${tagIndex}`, 'countries');
      params.set(`tag_contains_${tagIndex}`, 'contains');
      params.set(`tag_${tagIndex}`, country);
      tagIndex++;
    }

    // Require a front image to exist (filters out incomplete entries)
    params.set(`tagtype_${tagIndex}`, 'states');
    params.set(`tag_contains_${tagIndex}`, 'contains');
    params.set(`tag_${tagIndex}`, 'en:front-photo-selected');

    const response = await fetch(`${OFF_API_BASE}/cgi/search.pl?${params}`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: OpenFoodFactsSearchResponse = await response.json();

    // Browse already enforces `en:front-photo-selected` server-side via the
    // states tag filter above. Layer the eco-score and image-quality checks
    // client-side so we never surface eco-blank cards in the database grid.
    const products = (data.products || [])
      .map(normalizeProduct)
      .filter(isAllowedRegion)
      .filter(hasEcoscore)
      .filter(hasCleanFrontImage);

    if (products.length === 0) {
      // Legacy endpoint returned nothing usable — try the modern engine
      const salicious = await browseProductsViaBackend(options);
      if (salicious && salicious.products.length > 0) {
        cacheSet(cacheKey, salicious);
        return salicious;
      }
    }

    const result: BrowseResult = {
      products,
      totalCount: data.count || 0,
      page: data.page || page,
      pageCount: data.page_count || 0,
    };
    cacheSet(cacheKey, result);
    return result;
  } catch (error) {
    console.error('OpenFoodFacts browse error:', error);
    // Legacy endpoint unreachable (it goes down regularly) — fall back to
    // the modern Search-a-licious engine before giving up.
    const salicious = await browseProductsViaBackend(options);
    if (salicious) {
      cacheSet(cacheKey, salicious);
      return salicious;
    }
    return { products: [], totalCount: 0, page: 1, pageCount: 0 };
  }
};
