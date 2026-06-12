/**
 * Product Relevance Scoring — pure, dependency-free module.
 *
 * Determines whether a search result genuinely matches the OCR-identified product
 * by distinguishing high-signal "distinctive" tokens (product name words) from
 * low-signal "brand" tokens (parent company names, generic words).
 */

// ─── Configuration ───────────────────────────────────────────────────────────

export interface RelevanceConfig {
  /** Minimum score (0–1) to auto-accept a result. Default 0.4 */
  threshold: number;
  /** Minimum number of distinctive (non-brand) tokens that must overlap. Default 1 */
  minDistinctiveOverlap: number;
  /** Known brand/parent-company tokens (lowercase, no accents). Matches are low-signal. */
  brandTokens: Set<string>;
  /** Generic words that carry no product identity (lowercase, no accents). */
  stopWords: Set<string>;
  /**
   * Variant-defining tokens (lowercase, no accents): flavor/diet/format words
   * like "zero", "diet", "light". These distinguish "Coca-Cola Zero" from
   * "Coca-Cola" — a result missing the query's variant is the WRONG product,
   * so variant mismatches are penalized instead of ignored.
   */
  variantTokens: Set<string>;
}

export const DEFAULT_BRAND_TOKENS = new Set([
  'unilever', 'nestle', 'mondelez', 'pepsico', 'cocacola', 'coca-cola',
  'kraft', 'heinz', 'danone', 'mars', 'kelloggs', 'kellogg', 'general',
  'mills', 'procter', 'gamble', 'pg', 'johnson', 'colgate', 'palmolive',
  'ferrero', 'lindt', 'cadbury', 'reckitt', 'henkel', 'loreal', 'beiersdorf',
  'campbells', 'conagra', 'smuckers', 'tyson', 'hormel', 'delhaize',
  'aldi', 'lidl', 'tesco', 'woolworths', 'coles', 'asda', 'sainsburys',
  'morrisons', 'waitrose', 'carrefour', 'auchan', 'leclerc', 'intermarche',
]);

export const DEFAULT_STOP_WORDS = new Set([
  'the', 'and', 'or', 'with', 'new', 'special',
  'edition', 'limited', 'flavour', 'flavor', 'style', 'type', 'range',
  'product', 'food', 'drink', 'beverage', 'snack', 'organic', 'natural',
]);

/**
 * Variant-defining words. Previously these were stop words, which made
 * "Coca-Cola Zero" indistinguishable from "Coca-Cola" — the #1 source of
 * wrong-flavor matches. They now carry weight and trigger a heavy penalty
 * when the query's variant family is entirely absent from the result.
 */
export const DEFAULT_VARIANT_TOKENS = new Set([
  'zero', 'diet', 'light', 'lite', 'max', 'sugar', 'free',
  'original', 'classic', 'salt', 'salted', 'unsalted', 'fat',
  'sweetened', 'unsweetened', 'decaf', 'decaffeinated', 'caffeine',
  'mini', 'spicy', 'hot', 'mild',
]);

/** Aliases so equivalent variant spellings count as the same family. */
const VARIANT_ALIASES: Record<string, string> = {
  lite: 'light',
  decaffeinated: 'decaf',
  salted: 'salt',
};

const canonVariant = (t: string): string => VARIANT_ALIASES[t] ?? t;

export const DEFAULT_CONFIG: RelevanceConfig = {
  threshold: 0.4,
  minDistinctiveOverlap: 1,
  brandTokens: DEFAULT_BRAND_TOKENS,
  stopWords: DEFAULT_STOP_WORDS,
  variantTokens: DEFAULT_VARIANT_TOKENS,
};

// ─── Normalization ───────────────────────────────────────────────────────────

/** Strip accents/diacritics, lowercase, collapse whitespace. Language-agnostic. */
export const normalize = (s: string): string =>
  s.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Tokenize a normalized string into words >= 2 chars */
export const tokenize = (s: string): string[] =>
  normalize(s).split(/[\s\-]+/).filter(w => w.length >= 2);

// ─── Token Classification ────────────────────────────────────────────────────

export type TokenClass = 'brand' | 'stop' | 'variant' | 'distinctive';

export const classifyToken = (token: string, config: RelevanceConfig): TokenClass => {
  const t = normalize(token);
  if (config.brandTokens.has(t)) return 'brand';
  if (config.stopWords.has(t)) return 'stop';
  if (config.variantTokens.has(t)) return 'variant';
  return 'distinctive';
};

/** Split tokens into { brand, distinctive, variant } sets (stop words excluded from all) */
export const classifyTokens = (tokens: string[], config: RelevanceConfig) => {
  const brand: string[] = [];
  const distinctive: string[] = [];
  const variant: string[] = [];
  for (const t of tokens) {
    const cls = classifyToken(t, config);
    if (cls === 'brand') brand.push(t);
    else if (cls === 'variant') variant.push(t);
    else if (cls === 'distinctive') distinctive.push(t);
  }
  return { brand, distinctive, variant };
};

// ─── Fuzzy Matching ──────────────────────────────────────────────────────────

/** Levenshtein distance */
const levenshtein = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) matrix[i] = [i];
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
};

/** Does `needle` fuzzy-match any token in `haystack`? Allows ~25% edit distance. */
const fuzzyMatch = (needle: string, haystack: string[]): boolean => {
  const maxDist = needle.length <= 4 ? 1 : 2;
  return haystack.some(h => {
    // Exact substring: only if the shorter string is at least 4 chars
    // (prevents "mi" matching inside "marmite")
    const shorter = Math.min(h.length, needle.length);
    if (shorter >= 4 && (h.includes(needle) || needle.includes(h))) return true;
    // Exact match
    if (h === needle) return true;
    // Edit distance
    if (Math.abs(h.length - needle.length) > maxDist) return false;
    return levenshtein(needle, h) <= maxDist;
  });
};

// ─── Scoring ─────────────────────────────────────────────────────────────────

export interface RelevanceScore {
  /** Overall score 0–1 */
  score: number;
  /** Number of distinctive query tokens that matched the result */
  distinctiveOverlap: number;
  /** Total distinctive tokens in the query */
  distinctiveTotal: number;
  /** Number of brand tokens that matched */
  brandOverlap: number;
  /** Number of variant tokens (zero/diet/light/…) in the query that matched */
  variantOverlap: number;
  /** Total variant tokens in the query */
  variantTotal: number;
  /** Whether only brand tokens matched (no distinctive overlap) */
  brandOnlyMatch: boolean;
  /** Whether the result passes the configured threshold + distinctive overlap */
  passes: boolean;
}

/**
 * Score how relevant a product result is to the original OCR query.
 *
 * @param ocrQuery - The original full OCR text (e.g. "Unilever Marmite Yeast Extract")
 * @param resultText - The product name + brand from the search result
 * @param config - Scoring configuration (thresholds, brand list, etc.)
 */
export const scoreRelevance = (
  ocrQuery: string,
  resultText: string,
  config: RelevanceConfig = DEFAULT_CONFIG,
): RelevanceScore => {
  const queryTokens = tokenize(ocrQuery);
  const resultTokens = tokenize(resultText);

  if (queryTokens.length === 0 || resultTokens.length === 0) {
    return { score: 0, distinctiveOverlap: 0, distinctiveTotal: 0, brandOverlap: 0, variantOverlap: 0, variantTotal: 0, brandOnlyMatch: false, passes: false };
  }

  const { brand: queryBrand, distinctive: queryDistinctive, variant: queryVariant } =
    classifyTokens(queryTokens, config);

  // Count overlaps (fuzzy)
  let distinctiveOverlap = 0;
  for (const dt of queryDistinctive) {
    if (fuzzyMatch(dt, resultTokens)) distinctiveOverlap++;
  }

  let brandOverlap = 0;
  for (const bt of queryBrand) {
    if (fuzzyMatch(bt, resultTokens)) brandOverlap++;
  }

  // Variant overlap: alias-aware ("lite" ≡ "light"), then fuzzy as backup.
  const resultVariantCanon = new Set(
    resultTokens.filter((t) => config.variantTokens.has(t)).map(canonVariant),
  );
  const queryVariantCanon = new Set(queryVariant.map(canonVariant));
  let variantOverlap = 0;
  for (const vt of queryVariant) {
    if (resultVariantCanon.has(canonVariant(vt)) || fuzzyMatch(vt, resultTokens)) variantOverlap++;
  }

  // Variant tokens the RESULT has that the query never asked for
  // (e.g. query "Coca-Cola" but result "Coca-Cola Zero").
  let extraVariants = 0;
  for (const rv of resultVariantCanon) {
    if (!queryVariantCanon.has(rv)) extraVariants++;
  }

  // Score: distinctive 3x, variant 2x, brand 1x
  const distinctiveWeight = 3;
  const variantWeight = 2;
  const brandWeight = 1;
  const totalWeight =
    queryDistinctive.length * distinctiveWeight +
    queryVariant.length * variantWeight +
    queryBrand.length * brandWeight;
  const matchedWeight =
    distinctiveOverlap * distinctiveWeight +
    variantOverlap * variantWeight +
    brandOverlap * brandWeight;
  let score = totalWeight > 0 ? matchedWeight / totalWeight : 0;

  // Variant-family rule: the query names a variant ("Zero", "Diet", …) but the
  // result matches NONE of them → almost certainly the wrong flavor/version.
  // One matching variant satisfies the family ("Zero Sugar" matches "Zero").
  if (queryVariant.length > 0 && variantOverlap === 0) {
    score *= 0.4;
  }
  // Mild penalty per unrequested variant in the result, so plain "Coca-Cola"
  // outranks "Coca-Cola Zero" when the user didn't ask for a variant.
  if (extraVariants > 0) {
    score *= Math.pow(0.85, extraVariants);
  }

  const brandOnlyMatch = distinctiveOverlap === 0 && brandOverlap > 0;
  const passes = score >= config.threshold
    && distinctiveOverlap >= config.minDistinctiveOverlap
    && !brandOnlyMatch;

  return {
    score,
    distinctiveOverlap,
    distinctiveTotal: queryDistinctive.length,
    brandOverlap,
    variantOverlap,
    variantTotal: queryVariant.length,
    brandOnlyMatch,
    passes,
  };
};

// ─── Structured Match Result ─────────────────────────────────────────────────

export interface MatchResult<T> {
  /** The chosen product (or null if no match) */
  product: T | null;
  /** Confidence 0–1 */
  confidence: number;
  /** Which query variation produced this match */
  matchedQuery: string | null;
  /** Whether it passed the relevance gate */
  passedRelevanceGate: boolean;
  /** Whether only brand tokens overlapped (low confidence) */
  brandOnlyFallback: boolean;
  /** The full relevance score details */
  relevanceDetails: RelevanceScore | null;
}

/**
 * Pick the best matching product from a list of candidates.
 * Validates against the ORIGINAL OCR query (not the stripped variation).
 */
export const pickBestMatch = <T extends { productName: string | null; brand: string | null }>(
  candidates: T[],
  originalOcrQuery: string,
  matchedQuery: string,
  config: RelevanceConfig = DEFAULT_CONFIG,
): MatchResult<T> => {
  const noMatch: MatchResult<T> = {
    product: null, confidence: 0, matchedQuery: null,
    passedRelevanceGate: false, brandOnlyFallback: false, relevanceDetails: null,
  };

  if (candidates.length === 0) return noMatch;

  let bestProduct: T | null = null;
  let bestScore: RelevanceScore | null = null;

  for (const candidate of candidates) {
    const resultText = [candidate.productName, candidate.brand].filter(Boolean).join(' ');
    const rel = scoreRelevance(originalOcrQuery, resultText, config);

    if (rel.passes && (!bestScore || rel.score > bestScore.score)) {
      bestProduct = candidate;
      bestScore = rel;
    }
  }

  if (bestProduct && bestScore) {
    return {
      product: bestProduct,
      confidence: bestScore.score,
      matchedQuery,
      passedRelevanceGate: true,
      brandOnlyFallback: false,
      relevanceDetails: bestScore,
    };
  }

  // No result passed the strict gate. Check if there's a brand-only match
  // (return it but mark as low-confidence, NOT auto-accepted).
  for (const candidate of candidates) {
    const resultText = [candidate.productName, candidate.brand].filter(Boolean).join(' ');
    const rel = scoreRelevance(originalOcrQuery, resultText, config);
    if (rel.brandOnlyMatch) {
      return {
        product: candidate,
        confidence: rel.score,
        matchedQuery,
        passedRelevanceGate: false,
        brandOnlyFallback: true,
        relevanceDetails: rel,
      };
    }
  }

  return noMatch;
};

/**
 * Validate a barcode-resolved product against the original OCR text.
 * Returns true only if at least one distinctive token from the OCR query
 * appears in the resolved product's name/brand.
 */
export const validateBarcodeResult = <T extends { productName: string | null; brand: string | null }>(
  resolved: T,
  originalOcrQuery: string,
  config: RelevanceConfig = DEFAULT_CONFIG,
): { valid: boolean; relevance: RelevanceScore } => {
  const resultText = [resolved.productName, resolved.brand].filter(Boolean).join(' ');
  const rel = scoreRelevance(originalOcrQuery, resultText, config);
  return {
    valid: rel.passes,
    relevance: rel,
  };
};
