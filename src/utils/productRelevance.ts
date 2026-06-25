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
  /**
   * Broad category nouns (chocolate, milk, drink…). They score normally, but a
   * match resting only on these with a weak (parent-conglomerate) brand anchor is
   * rejected, since it can't pin down a specific product.
   */
  genericTokens: Set<string>;
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

/**
 * Broad product-category nouns. Real words, but they identify a *category*, not a
 * specific product ("chocolate", "milk", "drink"). They count toward scoring, but
 * a match that rests ONLY on these — with a weak brand anchor (a parent
 * conglomerate like Nestlé, or none) — is unreliable: that is exactly how a
 * "Nestlé Chocolate Drink" scan drifts onto a Nestlé chocolate *bar*. When the
 * brand anchor is weak we additionally require a NON-generic distinctive token.
 */
export const DEFAULT_GENERIC_TOKENS = new Set([
  'chocolate', 'choco', 'cocoa', 'milk', 'drink', 'beverage', 'water', 'juice',
  'tea', 'coffee', 'cream', 'bar', 'bars', 'cookie', 'cookies', 'biscuit',
  'biscuits', 'candy', 'sweets', 'sauce', 'soup', 'bread', 'cheese', 'yogurt',
  'yoghurt', 'snack', 'snacks', 'chips', 'crisps', 'cereal', 'cereals', 'spread',
  'butter', 'oil', 'flour', 'sugar', 'rice', 'pasta', 'soda', 'cola', 'powder',
  'mix', 'dessert', 'wafer', 'gum', 'bonbon', 'bonbons',
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
  genericTokens: DEFAULT_GENERIC_TOKENS,
};

// ─── Normalization ───────────────────────────────────────────────────────────

/**
 * Strip accents/diacritics, lowercase, collapse whitespace. Language-agnostic.
 * Apostrophes are REMOVED (not space-split) so a possessive brand normalizes the
 * same way OFF indexes it: "Harry's" \u2192 "harrys" (matching OFF's "Harrys"),
 * "Ben & Jerry's" \u2192 "ben jerrys". Otherwise "harry" (from the OCR apostrophe
 * form) never exact-matches OFF's "harrys" and the brand anchor misfires.
 */
export const normalize = (s: string): string =>
  s.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['\u2019\u2018`\u00b4]/g, '')
    .replace(/[^a-z0-9\s\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Tokenize a normalized string into words >= 2 chars */
export const tokenize = (s: string): string[] =>
  normalize(s).split(/[\s\-]+/).filter(w => w.length >= 2);

/**
 * Does this brand string carry a usable Latin anchor token (>= 3 Latin letters)?
 *
 * Scans identify *branded* products, so the matcher needs a brand to verify a
 * result against. A blank brand, or one written only in a non-Latin script
 * (e.g. Arabic "جولد"), gives the matcher nothing to anchor on — a product-only
 * search then drifts to a DIFFERENT company's same-category product
 * (blank brand + "Protein Bar Peanut Caramel" → another brand's peanut-caramel
 * bar; "Tea" → a random iced tea). Callers should refuse to auto-match and
 * prompt manual entry when this returns false. Accented Latin brands
 * (Gerblé, Häagen-Dazs, Côte d'Or) still pass — diacritics are stripped first.
 */
//
// The anchor needs >= 3 Latin letters, but \u2014 crucially \u2014 they need NOT be
// consecutive. A stylized brand like "M&M's" (letters m, m, s split by "&" and
// "'") is real and perfectly searchable, yet the old 3-CONSECUTIVE-letters rule
// rejected it, forcing a wrongful "couldn't find it". Counting total letters
// fixes that while still failing 1-2 letter fragments ("V8", "A1", "OK"), pure
// symbols, and non-Latin scripts ("\u062c\u0648\u0644\u062f"). It is strictly more permissive than
// the old rule, so no brand that previously matched stops matching.
export const hasUsableBrandAnchor = (brand: string | null | undefined): boolean =>
  !!brand && (brand.normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/[a-z]/gi) || []).length >= 3;

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
  expectedBrand?: string | null,
): MatchResult<T> => {
  const noMatch: MatchResult<T> = {
    product: null, confidence: 0, matchedQuery: null,
    passedRelevanceGate: false, brandOnlyFallback: false, relevanceDetails: null,
  };

  if (candidates.length === 0) return noMatch;

  // Brand gate — this app identifies *products*, not loose text. When the OCR
  // pass named a brand, a genuine match must carry that brand. Without this a
  // brand-stripped query ("Popcorn Oreo") can land on a *different* company's
  // product that merely shares the generic product words.
  //
  // The anchor uses the brand's STRONG tokens only: >= 4 chars AND not a generic
  // parent-company name (Nestlé, Unilever…). Two failure modes this guards against,
  // both pulled from the real ai_scans log:
  //   • short shared tokens — "Cookie Pop" must not anchor on "pop" matching
  //     "Movies pop" (→ wrong-brand "POPCORN CARAMEL").
  //   • parent-company tokens — those are shared across many sibling products, so
  //     they never carry product identity on their own.
  // When a brand has no strong token (only short/parent words), ALL of its tokens
  // must be present, so one common short word can't anchor an unrelated product.
  const allBrandTokens = expectedBrand
    ? tokenize(expectedBrand).filter(t => t.length >= 3 && classifyToken(t, config) !== 'stop')
    : [];
  const strongBrandTokens = allBrandTokens.filter(
    t => t.length >= 4 && !config.brandTokens.has(normalize(t)),
  );
  const carriesBrand = (c: T): boolean => {
    if (allBrandTokens.length === 0) return true; // no brand known → no constraint
    const resultTokens = tokenize([c.productName, c.brand].filter(Boolean).join(' '));
    if (strongBrandTokens.length > 0) {
      return strongBrandTokens.some(bt => fuzzyMatch(bt, resultTokens));
    }
    return allBrandTokens.every(bt => fuzzyMatch(bt, resultTokens));
  };

  // Parent-conglomerate weak-anchor rule. When the identified brand is ONLY a
  // parent company (Nestlé, Unilever…), the brand anchor is too broad to pin down
  // a product — hundreds of sibling products share it. In that case a match must
  // also carry a NON-generic distinctive product token. Otherwise "Nestlé
  // Chocolate Drink" (only generic words: "chocolate" + stopword "drink") drifts
  // onto an unrelated Nestlé chocolate *bar*. Brands with a real sub-brand token
  // (KitKat, Chocapic) are unaffected — their strong token already anchors them.
  const brandAnchorWeak =
    allBrandTokens.length > 0 &&
    allBrandTokens.every(t => config.brandTokens.has(normalize(t)));
  const queryNonGenericDistinctive = classifyTokens(tokenize(originalOcrQuery), config)
    .distinctive.filter(t => !config.genericTokens.has(t));
  const sharesNonGenericDistinctive = (c: T): boolean => {
    if (!brandAnchorWeak) return true; // strong/normal anchor → no extra constraint
    if (queryNonGenericDistinctive.length === 0) return false; // nothing specific to anchor on
    const resultTokens = tokenize([c.productName, c.brand].filter(Boolean).join(' '));
    return queryNonGenericDistinctive.some(t => fuzzyMatch(t, resultTokens));
  };

  const eligible = candidates.filter(c => carriesBrand(c) && sharesNonGenericDistinctive(c));

  // Exact-brand preference. A candidate whose strong brand token matches EXACTLY
  // (not merely fuzzily) is preferred over a fuzzy near-miss. This makes the real
  // "Harry's" bread win over "Harris", and French "Lune de Miel" win over Italian
  // "luna di miele" — the fuzzy bridge ("harry"≈"harris", "lune"≈"luna") only wins
  // when NO exact-brand product is available (preserving OCR-typo tolerance, e.g.
  // "Ligtel"→"Listel"). The right product exists on OFF, so we surface it.
  const exactBrand = (c: T): boolean => {
    if (strongBrandTokens.length === 0) return false;
    const resultTokens = new Set(tokenize([c.productName, c.brand].filter(Boolean).join(' ')));
    return strongBrandTokens.some(bt => resultTokens.has(bt));
  };

  const bestPassing = (pool: T[]): { product: T; score: RelevanceScore } | null => {
    let bp: T | null = null;
    let bs: RelevanceScore | null = null;
    for (const candidate of pool) {
      const resultText = [candidate.productName, candidate.brand].filter(Boolean).join(' ');
      const rel = scoreRelevance(originalOcrQuery, resultText, config);
      if (rel.passes && (!bs || rel.score > bs.score)) { bp = candidate; bs = rel; }
    }
    return bp && bs ? { product: bp, score: bs } : null;
  };

  const exactEligible = eligible.filter(exactBrand);
  const best = (exactEligible.length > 0 ? bestPassing(exactEligible) : null) ?? bestPassing(eligible);

  if (best) {
    return {
      product: best.product,
      confidence: best.score.score,
      matchedQuery,
      passedRelevanceGate: true,
      brandOnlyFallback: false,
      relevanceDetails: best.score,
    };
  }

  // No result passed the strict gate. Check if there's a brand-only match
  // (return it but mark as low-confidence, NOT auto-accepted).
  for (const candidate of eligible) {
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
