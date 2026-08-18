// Filling eco gaps from a sibling entry, without lying about what was scanned.
//
// THE PROBLEM, measured. Open Food Facts holds one record per barcode, but the
// same physical product exists under many barcodes — regional packs, pack
// sizes, re-issues — and their completeness varies wildly. Brand "nutella" has
// 428 entries. The canonical jar barcode 3017620422003, the one most people
// actually scan, has ecoscore_grade "unknown". Meanwhile 3017620425035 and
// 80176800 — the same spread in different packs — both carry a grade.
//
// So a shopper scans the real product, gets the right identity, and is told we
// know nothing about its environmental impact, while the data sits one pack
// size away.
//
// THE RULE: SUPPLEMENT, NEVER SUBSTITUTE. We keep everything about the product
// they are holding — barcode, name, brand, image. We only fill fields that are
// MISSING, only from an entry that is very probably the same product, and we
// return provenance so the UI can say where the number came from. Swapping in a
// different product's record would be a lie about identity, which is a far
// worse failure than a missing grade.
//
// THE TRAP THIS GUARDS AGAINST. In that same brand listing, 8000500310427 is
// "Biscuits NUTELLA B-ready" — biscuits, not spread. Matching on brand alone
// would attribute a biscuit's eco-score to a jar of hazelnut spread. The name
// similarity gate below exists entirely for that case.

import type { OpenFoodFactsResult } from './types';

/** Fields we are willing to borrow. Deliberately short. */
export interface SiblingSupplement {
  ecoscoreGrade?: string;
  ecoscoreScore?: number;
  carbonFootprint100g?: number;
  ecoscoreData?: OpenFoodFactsResult['ecoscoreData'];
  /** Where the borrowed values came from — never hide this from the user. */
  sourceBarcode: string;
  sourceProductName: string;
  similarity: number;
}

/** Words that describe packaging rather than the product itself. */
const PACK_NOISE = new Set([
  'pack', 'packs', 'jar', 'jars', 'bottle', 'bottles', 'tub', 'box', 'bag',
  'g', 'kg', 'ml', 'l', 'cl', 'oz', 'x', 'net', 'weight', 'size', 'family',
  'value', 'multipack', 'twin', 'single', 'large', 'small', 'mini', 'maxi',
  'de', 'la', 'le', 'les', 'du', 'des', 'and', 'the', 'with', 'au', 'aux',
]);

/** "400g", "750ml", "1kg", "33cl", "6x" — size, not identity. */
const MEASURE = /^\d+[.,]?\d*(g|kg|mg|ml|l|cl|oz|lb|x)?$/;

function tokens(s: string): Set<string> {
  return new Set(
    s.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')  // fold accents
      .split(/[^a-z0-9]+/)
      .filter((w) =>
        w.length >= 3 &&
        !PACK_NOISE.has(w) &&
        // Pack sizes have to go, or "Nutella 400g" and "Nutella 750g" read as
        // different products — which is exactly the pair we most want to match.
        !MEASURE.test(w),
      ),
  );
}

/**
 * Containment, not Jaccard: shared tokens over the SHORTER name's tokens.
 *
 * Jaccard was the obvious choice and it is wrong here. Real entries for the
 * same product have very different name lengths — "Nutella" against "Nutella
 * pâte à tartiner aux noisettes" scores 0.33 under Jaccard and would be
 * rejected, even though it is plainly the same jar. Containment asks the
 * question that actually matters: is the shorter name wholly present in the
 * longer one?
 *
 * On its own containment is too permissive — "Nutella" is also wholly present
 * in "Biscuits NUTELLA B-ready" — which is why productFamily() below carries
 * the real weight. This is a supporting signal, not the gate.
 */
export function nameSimilarity(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  const [small, large] = ta.size <= tb.size ? [ta, tb] : [tb, ta];
  let shared = 0;
  small.forEach((t) => { if (large.has(t)) shared++; });
  return shared / small.size;
}

export const MIN_SIMILARITY = 0.6;

/**
 * Coarse product family from category tags.
 *
 * Tag equality cannot be used directly: Open Food Facts category tags are
 * multilingual even inside the `en:` namespace. Measured on three real Nutella
 * records —
 *   3017620422003  en:Produits à tartiner, en:Pâtes à tartiner   (French)
 *   3017620420702  en:chocolate-spreads, en:cocoa-and-hazelnuts-spreads
 *   8000500310427  en:biscuits, en:biscuits-cookies-shelf-stable
 * The first two are the same product in two languages; the third is not the
 * same product at all. Matching raw tags would reject the pair we want and
 * tell us nothing about the pair we must reject.
 *
 * So we reduce tags to a family using keywords in both languages, and require
 * families not to CONFLICT. Unknown family is not a conflict — it just means we
 * fall back to the name check rather than inventing certainty.
 */
const FAMILY_KEYWORDS: [string, RegExp][] = [
  ['spread',    /tartiner|spread|pate-a|pâte|confiture|jam|marmelade|peanut-butter/i],
  ['biscuit',   /biscuit|cookie|biscoito|galleta|keks|wafer|gaufre/i],
  ['chocolate', /chocolate-bar|tablette|chocolats|candy-bar|confiserie/i],
  ['drink',     /beverage|boisson|soda|juice|jus\b|drink|water|\beau\b|coffee|caf[ée]|tea|th[ée]s?\b/i],
  ['dairy',     /yaourt|yogurt|yoghurt|fromage|cheese|milk|lait\b|cream|crème/i],
  ['icecream',  /ice-cream|glace|frozen-dessert|sorbet/i],
  ['cereal',    /cereal|c[ée]r[ée]ale|muesli|granola|porridge|flocons/i],
  ['snack',     /crisps|chips|crackers|snack|ap[ée]ritif|pop-corn/i],
  ['sauce',     /sauce|condiment|ketchup|mayonnaise|vinaigrette|moutarde/i],
  ['pasta',     /\bpasta\b|p[âa]tes-alimentaires|nouille|noodle|spaghetti|couscous|\brice\b|\briz\b/i],
  ['meat',      /viande|meat|charcuterie|poultry|volaille|poisson|fish|seafood/i],
];

export function productFamily(categories: string[] | null | undefined): string | null {
  if (!categories || categories.length === 0) return null;
  const hay = categories.join(' ').toLowerCase();
  for (const [family, re] of FAMILY_KEYWORDS) {
    if (re.test(hay)) return family;
  }
  return null;
}

/**
 * True when two products are definitely different KINDS of thing.
 *
 * Only a positive identification on both sides counts. An unknown family is an
 * absence of evidence, and treating it as a conflict would block most of the
 * legitimate matches this feature exists for.
 */
export function familiesConflict(
  a: string[] | null | undefined,
  b: string[] | null | undefined,
): boolean {
  const fa = productFamily(a);
  const fb = productFamily(b);
  if (!fa || !fb) return false;
  return fa !== fb;
}

const hasUsableEcoscore = (p: OpenFoodFactsResult): boolean => {
  const g = p.ecoscoreGrade?.toLowerCase();
  return !!g && g !== 'unknown' && g !== 'not-applicable';
};

/** True when the scanned record is missing the environmental data we lead with. */
export function needsSupplement(p: OpenFoodFactsResult): boolean {
  return !hasUsableEcoscore(p) && p.carbonFootprint100g === null;
}

/**
 * Pick the best sibling to borrow from, or null.
 *
 * Requires: same brand, a name similar enough to be the same product, and eco
 * data the scanned record lacks. Among qualifying siblings the most similar
 * wins — not the one with the best grade, because choosing by grade would let
 * us flatter or punish a product by picking convenient data.
 */
export function pickSibling(
  scanned: OpenFoodFactsResult,
  candidates: OpenFoodFactsResult[],
): SiblingSupplement | null {
  if (!needsSupplement(scanned) || !scanned.productName) return null;

  const scannedBrand = (scanned.brand ?? '').toLowerCase().split(',')[0].trim();
  if (!scannedBrand) return null;

  const scored = candidates
    .filter((c) => c.barcode !== scanned.barcode)
    .filter((c) => hasUsableEcoscore(c) || c.carbonFootprint100g !== null)
    .filter((c) => (c.brand ?? '').toLowerCase().includes(scannedBrand))
    // The gate that stops biscuits supplying data for a jar of spread.
    .filter((c) => !familiesConflict(scanned.categories, c.categories))
    .map((c) => ({ c, sim: nameSimilarity(scanned.productName!, c.productName ?? '') }))
    .filter((x) => x.sim >= MIN_SIMILARITY)
    .sort((a, b) => b.sim - a.sim);

  if (scored.length === 0) return null;
  const { c, sim } = scored[0];

  return {
    ...(hasUsableEcoscore(c) ? { ecoscoreGrade: c.ecoscoreGrade!, } : {}),
    ...(c.ecoscoreScore !== null ? { ecoscoreScore: c.ecoscoreScore } : {}),
    ...(c.carbonFootprint100g !== null ? { carbonFootprint100g: c.carbonFootprint100g } : {}),
    ...(c.ecoscoreData ? { ecoscoreData: c.ecoscoreData } : {}),
    sourceBarcode: c.barcode,
    sourceProductName: c.productName ?? '',
    similarity: Number(sim.toFixed(2)),
  };
}

/**
 * Apply a supplement, filling ONLY empty fields.
 *
 * Never overwrites a value the scanned record already has — a present value is
 * about the product in the shopper's hand and always beats a borrowed one.
 */
export function applySupplement(
  scanned: OpenFoodFactsResult,
  sup: SiblingSupplement,
): OpenFoodFactsResult & { supplementedFrom: SiblingSupplement } {
  return {
    ...scanned,
    ecoscoreGrade: hasUsableEcoscore(scanned) ? scanned.ecoscoreGrade : (sup.ecoscoreGrade ?? scanned.ecoscoreGrade),
    ecoscoreScore: scanned.ecoscoreScore ?? sup.ecoscoreScore ?? null,
    carbonFootprint100g: scanned.carbonFootprint100g ?? sup.carbonFootprint100g ?? null,
    ecoscoreData: scanned.ecoscoreData ?? sup.ecoscoreData ?? null,
    supplementedFrom: sup,
  };
}
