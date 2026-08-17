// Where the world's supply of a commodity actually grows.
//
// This is the table that lets the map say something about a biscuit. Before it,
// an origin appeared only when the product declared one, when the brand was in
// the chocolate directory, or when we had documented that specific company's
// sourcing — which covered 24% of real products. The other 76% showed nothing,
// while 99% of them carried a full ingredients list we were ignoring.
//
// WHAT THIS IS, EXACTLY. "This product contains palm oil, and Indonesia and
// Malaysia grow about 83% of the world's palm oil." That is a true statement
// about a commodity and a fact about this product's ingredients. It is NOT a
// claim that this jar's palm oil came from Indonesia — nobody has disclosed
// that, and the basis text says so in those words.
//
// This is the `inferred` tier exactly as types.ts already defined it: "where
// this commodity, sold in this market, typically comes from." It ranks BELOW a
// declared origin and below documented company sourcing, and it only fills
// space those leave empty.
//
// SHARES are approximate shares of world production, rounded, from FAOSTAT
// (cocoa cross-checked against ICCO). They are here to justify naming a region
// at all — a commodity grown evenly everywhere gets no entry, because "wheat
// comes from everywhere" is not a finding. Anything under ~5% is dropped
// rather than listed for completeness.

import type { SourceRef } from '@/services/supplyChain/types';
import { FAOSTAT_PRODUCTION, ICCO_STATISTICS } from './sources';

export interface CommodityOrigin {
  /** Key into ORIGIN_POINTS. */
  originKey: string;
  /** Approximate share of world production, percent. */
  sharePct: number;
}

export interface CommodityProfile {
  /** Must match the keys used by the TVPRA table in resolve.ts. */
  commodity: string;
  label: string;
  /**
   * Text match. Open Food Facts is multilingual and heavily French, so the
   * common European spellings are included.
   *
   * Two traps, both found by testing rather than by reading:
   *
   * 1. `\b` IS ASCII-ONLY IN JAVASCRIPT. "é" is not a word character, so
   *    /th(é|e)\b/ never matches "Thé vert" — the boundary needs a word char
   *    before it and "é" isn't one. That one bug silently cost us every French
   *    tea and coffee product. Accented forms use (?![a-z\u00C0-\u024F]) instead.
   *
   * 2. Flavourings are not ingredients. "vanillin" is usually synthetic and
   *    has nothing to do with Madagascar; "banana flavouring" contains no
   *    banana. Patterns are written to exclude them.
   */
  pattern: RegExp;
  origins: CommodityOrigin[];
  source: SourceRef;
}

export const COMMODITY_PROFILES: CommodityProfile[] = [
  {
    commodity: 'palm-oil',
    label: 'palm oil',
    pattern: /palm\s*(oil|fat|kernel)|huile de palme|graisse de palme|aceite de palma|palm(ö|oe)l|olio di palma|palmolie/i,
    origins: [
      { originKey: 'indonesiapalm', sharePct: 59 },
      { originKey: 'malaysia', sharePct: 24 },
    ],
    source: FAOSTAT_PRODUCTION,
  },
  {
    commodity: 'cocoa',
    label: 'cocoa',
    pattern: /cocoa|cacao|kakao/i,
    origins: [
      { originKey: 'civ', sharePct: 38 },
      { originKey: 'ghana', sharePct: 14 },
      { originKey: 'indonesia', sharePct: 10 },
    ],
    source: ICCO_STATISTICS,
  },
  {
    commodity: 'coffee',
    label: 'coffee',
    pattern: /\bcoffee\b|\bcaf[ée](?![a-z\u00C0-\u024F])|kaffee|\bcaff[èe](?![a-z\u00C0-\u024F])|koffie/i,
    origins: [
      { originKey: 'brazilcoffee', sharePct: 35 },
      { originKey: 'vietnam', sharePct: 17 },
      { originKey: 'colombia', sharePct: 8 },
    ],
    source: FAOSTAT_PRODUCTION,
  },
  {
    commodity: 'tea',
    label: 'tea',
    pattern: /\btea\b|\bth[ée](?![a-z\u00C0-\u024F])|\btee\b|\bthee\b/i,
    origins: [
      { originKey: 'china', sharePct: 48 },
      { originKey: 'india', sharePct: 20 },
      { originKey: 'kenya', sharePct: 8 },
    ],
    source: FAOSTAT_PRODUCTION,
  },
  {
    commodity: 'sugarcane',
    label: 'sugar',
    // Cane only. Beet sugar is largely European and carries none of the same
    // findings, so a product that says "beet sugar" must not land in Brazil.
    pattern: /cane sugar|sucre de canne|az(ú|u)car de ca(ñ|n)a|rohrzucker|molasses|m(é|e)lasse/i,
    origins: [
      { originKey: 'brazil', sharePct: 39 },
      { originKey: 'india', sharePct: 22 },
      { originKey: 'thailand', sharePct: 5 },
    ],
    source: FAOSTAT_PRODUCTION,
  },
  {
    commodity: 'vanilla',
    label: 'vanilla',
    // Excludes vanillin/vanilline — synthetic, and nothing to do with Madagascar.
    pattern: /vanill[ae](?![a-z\u00C0-\u024F])|vainilla(?![a-z\u00C0-\u024F])/i,
    origins: [
      { originKey: 'madagascar', sharePct: 40 },
      { originKey: 'indonesia', sharePct: 25 },
    ],
    source: FAOSTAT_PRODUCTION,
  },
  {
    commodity: 'rice',
    label: 'rice',
    pattern: /\brice\b|\briz\b|\barroz\b|\breis\b|\briso\b/i,
    origins: [
      { originKey: 'china', sharePct: 27 },
      { originKey: 'india', sharePct: 24 },
      { originKey: 'indonesia', sharePct: 7 },
    ],
    source: FAOSTAT_PRODUCTION,
  },
  {
    commodity: 'soy',
    label: 'soy',
    pattern: /\bsoy\b|soya|soja|sojabohnen/i,
    origins: [
      { originKey: 'brazil', sharePct: 40 },
      { originKey: 'usa', sharePct: 28 },
      { originKey: 'argentina', sharePct: 11 },
    ],
    source: FAOSTAT_PRODUCTION,
  },
  {
    commodity: 'hazelnut',
    label: 'hazelnuts',
    pattern: /hazelnut|noisette|avellana|haseln(ü|u)ss|nocciol/i,
    origins: [{ originKey: 'turkey', sharePct: 64 }],
    source: FAOSTAT_PRODUCTION,
  },
  {
    commodity: 'coconut',
    label: 'coconut',
    // \bcoco\b cannot match "cocoa" — the trailing "a" is a word character.
    pattern: /coconut|noix de coco|\bcoco\b|kokos|cocco\b/i,
    origins: [
      { originKey: 'indonesia', sharePct: 30 },
      { originKey: 'philippines', sharePct: 25 },
      { originKey: 'india', sharePct: 20 },
    ],
    source: FAOSTAT_PRODUCTION,
  },
  {
    commodity: 'cashew',
    label: 'cashews',
    pattern: /cashew|noix de cajou|anacard|marañ(ó|o)n/i,
    origins: [
      { originKey: 'civ', sharePct: 22 },
      { originKey: 'india', sharePct: 15 },
      { originKey: 'vietnam', sharePct: 12 },
    ],
    source: FAOSTAT_PRODUCTION,
  },
  {
    commodity: 'banana',
    label: 'bananas',
    // Not "banana flavouring", which contains no banana.
    pattern: /(?<!ar[ôo]me\s)(?<!flavou?r\s)\bbanan[ae]s?\b(?!\s*(flavou?r|aroma|ar[ôo]me))/i,
    origins: [
      { originKey: 'india', sharePct: 26 },
      { originKey: 'indonesia', sharePct: 8 },
      { originKey: 'ecuador', sharePct: 6 },
    ],
    source: FAOSTAT_PRODUCTION,
  },
  {
    commodity: 'pepper',
    label: 'black pepper',
    pattern: /black pepper|poivre noir|pimienta negra|schwarzer pfeffer/i,
    origins: [
      { originKey: 'vietnam', sharePct: 35 },
      { originKey: 'brazil', sharePct: 17 },
      { originKey: 'indonesia', sharePct: 12 },
    ],
    source: FAOSTAT_PRODUCTION,
  },
  {
    commodity: 'shrimp',
    label: 'shrimp',
    pattern: /shrimp|prawn|crevette|gamba|garnele/i,
    origins: [
      { originKey: 'ecuador', sharePct: 25 },
      { originKey: 'india', sharePct: 18 },
      { originKey: 'vietnam', sharePct: 12 },
    ],
    source: FAOSTAT_PRODUCTION,
  },
];

/** Where the commodity was found. Kept so the basis text can say so honestly. */
export type CommodityMatchSource = 'ingredients' | 'name' | 'category';

export interface CommodityMatch {
  profile: CommodityProfile;
  matchedIn: CommodityMatchSource;
}

/**
 * Which tracked commodities this product contains.
 *
 * Checks the ingredients list first, then the product name, then the category
 * tags. The fallbacks matter more than they look: a bag of coffee or a box of
 * tea very often has an EMPTY ingredients field in Open Food Facts, because the
 * name already says what it is. Ingredients-only matching missed most of the
 * tea and coffee in the sample — the two categories where origin is the whole
 * point.
 *
 * Category tags are checked last and are the weakest signal, since
 * "en:chocolate-biscuits" tells you the aisle rather than the recipe.
 *
 * Pure and synchronous, matching the resolver contract so the audit harness can
 * call it directly.
 */
export function detectCommodities(
  ingredientsText: string | null | undefined,
  productName?: string | null,
  categories?: string[] | null,
): CommodityMatch[] {
  const ing = (ingredientsText ?? '').trim();
  const name = (productName ?? '').trim();
  // Tags arrive as "en:chocolate-biscuits"; strip the prefix and the hyphens so
  // the same word-boundary patterns work against them.
  const catsRaw = (categories ?? []).join(' ').replace(/[a-z]{2}:/g, ' ').replace(/-/g, ' ');
  // Category tags are plural ("en:teas", "en:coffees") while the patterns are
  // written for the singular, and /\btea\b/ does not match "teas". Append a
  // singularised copy so either form matches, rather than bolting an optional
  // "s" onto fourteen separate regexes and getting it wrong on one of them.
  const cats = `${catsRaw} ${catsRaw.replace(/([a-z]{3,})s\b/gi, '$1')}`;

  const out: CommodityMatch[] = [];
  for (const profile of COMMODITY_PROFILES) {
    if (ing.length >= 3 && profile.pattern.test(ing)) {
      out.push({ profile, matchedIn: 'ingredients' });
    } else if (name.length >= 3 && profile.pattern.test(name)) {
      out.push({ profile, matchedIn: 'name' });
    } else if (cats.length >= 3 && profile.pattern.test(cats)) {
      out.push({ profile, matchedIn: 'category' });
    }
  }
  return out;
}
