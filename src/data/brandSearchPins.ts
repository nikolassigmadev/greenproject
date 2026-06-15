/**
 * Canonical brand search pins.
 *
 * A handful of iconic products are short, single-word BRANDS whose product
 * name barely differs from the generic ingredient on the label — Marmite and
 * Vegemite are both literally sold as "yeast extract". When the user searches
 * for one of these, the OpenFoodFacts text search (`searchProducts`) runs its
 * progressive query-shrink (`generateSearchVariations`): if "Vegemite yeast
 * extract" returns nothing, it drops the brand word and searches the leftover
 * "yeast extract" — which matches unrelated products like "yeast extract
 * flavoured flatbreads". The shopper ends up on the wrong product entirely.
 *
 * To stop that, we PIN the canonical OpenFoodFacts barcode(s) for these
 * brands. When a query resolves to a pinned brand, `searchProducts`
 * short-circuits to a direct barcode lookup of the real jar instead of a
 * fuzzy text search. We pin the barcode only — never a frozen copy of the
 * eco/nutri data — so the live OpenFoodFacts record (eco-score, Nutri-Score,
 * carbon, image) is always fetched fresh through the normal lookup path.
 *
 * Each brand lists barcodes in priority order. They are all resolved and the
 * richest live record (one carrying an eco-score) is preferred, with later
 * entries acting as fallbacks in case a barcode is ever removed from OFF.
 *
 * Verified against the Open Food Facts database (world.openfoodfacts.org):
 *   - Marmite Yeast Extract 250g  → 50184453   (the classic red-lid jar)
 *   - Marmite Yeast Extract 125g  → 50184385   (smaller jar, fallback)
 *   - Vegemite 220g (Bega, AU)    → 9300650658912
 *   - Vegemite 220g (UK retail)   → 9352042000298  (Tesco/Sainsbury's import)
 */

export interface BrandPin {
  /** The brand token that, when present in a query, triggers the pin. */
  token: string;
  /** Canonical OFF barcodes in priority order (primary first, fallbacks after). */
  barcodes: string[];
}

export const BRAND_PINS: BrandPin[] = [
  {
    token: 'marmite',
    barcodes: ['50184453', '50184385'],
  },
  {
    token: 'vegemite',
    barcodes: ['9300650658912', '9352042000298', '93552806'],
  },
];

/**
 * Variant tokens that mark a DISTINCT product line, not the iconic spread.
 * If the query mentions one of these we deliberately do NOT pin, so searches
 * for "Marmite Truffle", "Marmite XO", "Vegemite cheese crackers" or the
 * "Marmite flatbreads" the user complained about fall through to normal
 * search instead of being forced onto the plain jar.
 */
const DISTINCT_VARIANT_TOKENS = new Set([
  'xo', 'truffle', 'gold', 'dynamite', 'peanut',
  'snackabouts', 'snackabout', 'chocolate',
  'crisp', 'crisps', 'cracker', 'crackers', 'rice',
  'flatbread', 'flatbreads', 'biscuit', 'biscuits',
  'cashew', 'shapes', 'bar', 'bars', 'chip', 'chips',
]);

/**
 * Filler tokens stripped before matching. These are the generic descriptors
 * that routinely ride along with the brand name on packaging or in OCR output
 * ("Marmite yeast extract spread 250g") without changing which product it is.
 */
const FILLER_TOKENS = new Set([
  'yeast', 'extract', 'spread', 'the', 'original', 'classic',
  'jar', 'paste', 'savoury', 'savory', 'vegetarian', 'vegan',
]);

const SIZE_TOKEN = /^\d+\s*(g|kg|ml|l|gram|grams|oz)?$/i;

const tokenize = (query: string): string[] =>
  query
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining accent marks
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);

/**
 * If `query` resolves to a pinned brand, return its canonical barcode list
 * (priority order). Otherwise return an empty array.
 *
 * A query pins when it contains a brand token (e.g. "vegemite") and carries no
 * tokens that distinguish a different product line — only the brand plus
 * generic filler / size tokens. Examples:
 *
 *   "Vegemite"                  → pins   (['9300650658912', ...])
 *   "Marmite yeast extract"     → pins
 *   "Marmite, yeast extract"    → pins
 *   "Vegemite - yeast extract"  → pins
 *   "yeast extract marmite 250g"→ pins
 *   "Marmite Truffle"           → no pin (distinct variant)
 *   "Vegemite cheese crackers"  → no pin (distinct variant)
 */
export const getPinnedBarcodes = (query: string): string[] => {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const pin = BRAND_PINS.find((p) => tokens.includes(p.token));
  if (!pin) return [];

  // Bail if the query names a distinct variant line.
  if (tokens.some((t) => DISTINCT_VARIANT_TOKENS.has(t))) return [];

  // Every remaining (non-brand) token must be generic filler or a size token,
  // otherwise the query is describing something more specific than the jar.
  const onlyFillerRemains = tokens.every(
    (t) => t === pin.token || FILLER_TOKENS.has(t) || SIZE_TOKEN.test(t),
  );
  if (!onlyFillerRemains) return [];

  return pin.barcodes;
};
