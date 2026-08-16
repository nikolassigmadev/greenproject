// Supermarket chains, per market.
//
// READ THIS BEFORE ADDING ANYTHING HERE.
//
// This file models CHAINS, never branches, and it never claims stock. There is
// no legal, free source of live per-branch supermarket inventory: Open Food
// Facts carries a crowd-sourced `stores` tag, but it records "somebody once saw
// this product at a shop called roughly this" — no branch, no date, no stock
// status, and no consistent spelling (we see `Carrefour`, `carrefour-fr` and
// `Ah` for Albert Heijn in the same dataset). Scraping the retailers directly
// would breach their terms and, in the UK/EU, their database rights.
//
// So the strongest honest claim this feature can make is "this is usually
// stocked at this chain", and every piece of the UI is built to say exactly
// that and nothing stronger. See AvailabilityConfidence in
// src/services/retailers.
//
// Two hard rules, enforced by src/test/retailerIntegrity.test.ts:
//   1. A retailer NEVER carries an ethical flag, score or verdict. Flags belong
//      to the brand that makes a product. "Tesco stocks a flagged product" is a
//      fact about a product; "Tesco is unethical" is a claim about a company we
//      have no sourcing for, and is the fastest route to a defamation letter.
//   2. Chain names are used nominatively — to identify the shop the user is
//      standing in. No logos, no brand colours, no implication of any
//      partnership, endorsement or affiliation.

export type RetailerKind =
  | 'supermarket'      // full-size grocery
  | 'hypermarket'      // large format, non-food too
  | 'convenience'      // small format / corner shop
  | 'discounter'       // limited-range discount
  | 'organic';         // health / organic specialist

export interface Retailer {
  /** Stable slug, used in URLs and stored preferences. */
  id: string;
  /** Display name, spelled as the shopper would see it above the door. */
  name: string;
  /** ISO 3166-1 alpha-2 markets this chain trades in. */
  countries: string[];
  kind: RetailerKind;
  /**
   * Lowercased spellings seen in Open Food Facts `stores_tags` for this chain.
   * OFF store tags are free text, so this is a normalisation table, not a key.
   * Always include the plain name; add country-suffixed and abbreviated forms
   * actually observed in the data.
   */
  offAliases: string[];
  /**
   * Chains that reliably carry a meaningful own-label organic / fair-trade
   * range. Used ONLY to set expectations before a search runs — never as a
   * score, and never shown as a rating of the retailer.
   */
  hasEthicalOwnLabel?: boolean;
  /**
   * Roughly what share of the shelf is the chain's OWN brand.
   *
   * This matters more than anything else in the file. Trader Joe's is ~80%
   * private label: it does not stock Alter Eco or Divine, it stocks Trader
   * Joe's chocolate. Listing national brands under a Trader Joe's header is
   * simply wrong, and no per-row availability caveat rescues it — the shopper
   * reads the header.
   *
   * Open Food Facts has almost nothing on own-brand products (they're
   * regional, they change constantly, and contributors don't scan them), so for
   * a high-private-label chain the honest answer is usually "we can't help you
   * much here" — and the UI now says that instead of filling the space.
   */
  privateLabelShare?: 'high' | 'medium' | 'low';
}

export const RETAILERS: Retailer[] = [
  // ── United Kingdom & Ireland ──────────────────────────────────────────────
  { id: 'tesco', name: 'Tesco', countries: ['GB', 'IE'], kind: 'supermarket', offAliases: ['tesco', 'tescos', 'tesco-uk', 'tesco express', 'tesco extra'], hasEthicalOwnLabel: true, privateLabelShare: 'medium' },
  { id: 'sainsburys', name: "Sainsbury's", countries: ['GB'], kind: 'supermarket', offAliases: ["sainsbury's", 'sainsburys', 'sainsbury', 'sainsburys-uk'], hasEthicalOwnLabel: true, privateLabelShare: 'medium' },
  { id: 'waitrose', name: 'Waitrose', countries: ['GB'], kind: 'supermarket', offAliases: ['waitrose', 'waitrose & partners', 'waitrose-uk'], hasEthicalOwnLabel: true, privateLabelShare: 'medium' },
  { id: 'coop-uk', name: 'Co-op', countries: ['GB'], kind: 'convenience', offAliases: ['co-op', 'coop', 'the co-operative', 'co-operative'], hasEthicalOwnLabel: true, privateLabelShare: 'medium' },
  { id: 'marks-spencer', name: 'Marks & Spencer', countries: ['GB', 'IE'], kind: 'supermarket', offAliases: ['marks & spencer', 'marks and spencer', 'm&s', 'ms'], hasEthicalOwnLabel: true, privateLabelShare: 'high' },
  { id: 'asda', name: 'Asda', countries: ['GB'], kind: 'supermarket', offAliases: ['asda', 'asda-uk'], privateLabelShare: 'medium' },
  { id: 'morrisons', name: 'Morrisons', countries: ['GB'], kind: 'supermarket', offAliases: ['morrisons', 'morrison', 'wm morrison'], privateLabelShare: 'medium' },
  { id: 'aldi-uk', name: 'Aldi', countries: ['GB', 'IE'], kind: 'discounter', offAliases: ['aldi', 'aldi-uk'], privateLabelShare: 'high' },
  { id: 'lidl-uk', name: 'Lidl', countries: ['GB', 'IE'], kind: 'discounter', offAliases: ['lidl', 'lidl-uk'], privateLabelShare: 'high' },
  { id: 'dunnes', name: 'Dunnes Stores', countries: ['IE'], kind: 'supermarket', offAliases: ['dunnes', 'dunnes stores'] },
  { id: 'supervalu', name: 'SuperValu', countries: ['IE'], kind: 'supermarket', offAliases: ['supervalu', 'super valu'] },

  // ── Indonesia (incl. Bali) ────────────────────────────────────────────────
  // Convenience chains dominate day-to-day shopping here; the Western-style
  // supermarkets are where imported ethical ranges actually turn up.
  { id: 'indomaret', name: 'Indomaret', countries: ['ID'], kind: 'convenience', offAliases: ['indomaret'] },
  { id: 'alfamart', name: 'Alfamart', countries: ['ID'], kind: 'convenience', offAliases: ['alfamart', 'alfa mart'] },
  { id: 'hypermart', name: 'Hypermart', countries: ['ID'], kind: 'hypermarket', offAliases: ['hypermart'] },
  { id: 'superindo', name: 'Super Indo', countries: ['ID'], kind: 'supermarket', offAliases: ['super indo', 'superindo'] },
  { id: 'ranch-market', name: 'Ranch Market', countries: ['ID'], kind: 'supermarket', offAliases: ['ranch market', 'ranchmarket'], hasEthicalOwnLabel: true },
  { id: 'grand-lucky', name: 'Grand Lucky', countries: ['ID'], kind: 'supermarket', offAliases: ['grand lucky', 'lucky supermarket'] },
  { id: 'pepito', name: 'Pepito Market', countries: ['ID'], kind: 'supermarket', offAliases: ['pepito', 'pepito market', 'pepito express'] },
  { id: 'bintang', name: 'Bintang Supermarket', countries: ['ID'], kind: 'supermarket', offAliases: ['bintang', 'bintang supermarket'] },
  { id: 'coco-bali', name: 'Coco Supermarket', countries: ['ID'], kind: 'supermarket', offAliases: ['coco', 'coco supermarket', 'coco mart'] },
  { id: 'tiara-dewata', name: 'Tiara Dewata', countries: ['ID'], kind: 'supermarket', offAliases: ['tiara dewata', 'tiara'] },

  // ── United States & Canada ────────────────────────────────────────────────
  { id: 'walmart', name: 'Walmart', countries: ['US', 'CA'], kind: 'hypermarket', offAliases: ['walmart', 'wal-mart', 'walmart-us'] },
  { id: 'target', name: 'Target', countries: ['US'], kind: 'hypermarket', offAliases: ['target'] },
  { id: 'kroger', name: 'Kroger', countries: ['US'], kind: 'supermarket', offAliases: ['kroger'] },
  { id: 'whole-foods', name: 'Whole Foods Market', countries: ['US', 'CA', 'GB'], kind: 'organic', offAliases: ['whole foods', 'whole foods market', 'wholefoods'], hasEthicalOwnLabel: true, privateLabelShare: 'medium' },
  { id: 'trader-joes', name: "Trader Joe's", countries: ['US'], kind: 'supermarket', offAliases: ["trader joe's", 'trader joes', 'traderjoes'], privateLabelShare: 'high' },
  { id: 'safeway', name: 'Safeway', countries: ['US', 'CA'], kind: 'supermarket', offAliases: ['safeway'] },
  { id: 'publix', name: 'Publix', countries: ['US'], kind: 'supermarket', offAliases: ['publix'] },
  { id: 'costco', name: 'Costco', countries: ['US', 'CA', 'GB', 'AU'], kind: 'hypermarket', offAliases: ['costco'], privateLabelShare: 'high' },
  { id: 'loblaws', name: 'Loblaws', countries: ['CA'], kind: 'supermarket', offAliases: ['loblaws', 'loblaw'], privateLabelShare: 'medium' },
  { id: 'sobeys', name: 'Sobeys', countries: ['CA'], kind: 'supermarket', offAliases: ['sobeys'] },

  // ── France, Belgium ───────────────────────────────────────────────────────
  { id: 'carrefour', name: 'Carrefour', countries: ['FR', 'BE', 'ES', 'IT', 'PL'], kind: 'hypermarket', offAliases: ['carrefour', 'carrefour-fr', 'carrefour market', 'carrefour city', 'carrefour contact'] },
  { id: 'leclerc', name: 'E.Leclerc', countries: ['FR'], kind: 'hypermarket', offAliases: ['leclerc', 'e.leclerc', 'e-leclerc'] },
  { id: 'intermarche', name: 'Intermarché', countries: ['FR', 'BE'], kind: 'supermarket', offAliases: ['intermarche', 'intermarché'] },
  { id: 'auchan', name: 'Auchan', countries: ['FR', 'ES', 'PL'], kind: 'hypermarket', offAliases: ['auchan'] },
  { id: 'monoprix', name: 'Monoprix', countries: ['FR'], kind: 'supermarket', offAliases: ['monoprix'], hasEthicalOwnLabel: true, privateLabelShare: 'medium' },
  { id: 'franprix', name: 'Franprix', countries: ['FR'], kind: 'convenience', offAliases: ['franprix'] },
  { id: 'magasins-u', name: 'Super U', countries: ['FR'], kind: 'supermarket', offAliases: ['magasins-u', 'super u', 'hyper u', 'u express'] },
  { id: 'delhaize', name: 'Delhaize', countries: ['BE'], kind: 'supermarket', offAliases: ['delhaize'], hasEthicalOwnLabel: true, privateLabelShare: 'medium' },
  { id: 'colruyt', name: 'Colruyt', countries: ['BE'], kind: 'discounter', offAliases: ['colruyt'], privateLabelShare: 'high' },

  // ── Germany, Austria, Switzerland ─────────────────────────────────────────
  { id: 'rewe', name: 'REWE', countries: ['DE'], kind: 'supermarket', offAliases: ['rewe'], hasEthicalOwnLabel: true, privateLabelShare: 'medium' },
  { id: 'edeka', name: 'EDEKA', countries: ['DE'], kind: 'supermarket', offAliases: ['edeka'] },
  { id: 'aldi-de', name: 'ALDI', countries: ['DE', 'AT', 'NL', 'BE'], kind: 'discounter', offAliases: ['aldi', 'aldi sud', 'aldi süd', 'aldi nord'], privateLabelShare: 'high' },
  { id: 'lidl-de', name: 'Lidl', countries: ['DE', 'AT', 'NL', 'BE', 'FR', 'ES', 'IT', 'PL', 'PT', 'SE', 'FI', 'DK'], kind: 'discounter', offAliases: ['lidl'], privateLabelShare: 'high' },
  { id: 'dm', name: 'dm-drogerie markt', countries: ['DE', 'AT'], kind: 'organic', offAliases: ['dm', 'dm-drogerie markt', 'dm drogerie'], hasEthicalOwnLabel: true, privateLabelShare: 'high' },
  { id: 'spar-at', name: 'SPAR', countries: ['AT', 'IT', 'NL', 'ES'], kind: 'supermarket', offAliases: ['spar', 'interspar', 'eurospar'] },
  { id: 'billa', name: 'BILLA', countries: ['AT'], kind: 'supermarket', offAliases: ['billa'] },
  { id: 'migros', name: 'Migros', countries: ['CH'], kind: 'supermarket', offAliases: ['migros'], hasEthicalOwnLabel: true, privateLabelShare: 'medium' },
  { id: 'coop-ch', name: 'Coop', countries: ['CH'], kind: 'supermarket', offAliases: ['coop', 'coop-ch'], hasEthicalOwnLabel: true, privateLabelShare: 'medium' },

  // ── Netherlands ───────────────────────────────────────────────────────────
  { id: 'albert-heijn', name: 'Albert Heijn', countries: ['NL', 'BE'], kind: 'supermarket', offAliases: ['albert heijn', 'ah', 'albert-heijn'], hasEthicalOwnLabel: true, privateLabelShare: 'medium' },
  { id: 'jumbo', name: 'Jumbo', countries: ['NL', 'BE'], kind: 'supermarket', offAliases: ['jumbo'] },
  { id: 'ekoplaza', name: 'Ekoplaza', countries: ['NL'], kind: 'organic', offAliases: ['ekoplaza'], hasEthicalOwnLabel: true, privateLabelShare: 'high' },

  // ── Iberia & Italy ────────────────────────────────────────────────────────
  { id: 'mercadona', name: 'Mercadona', countries: ['ES'], kind: 'supermarket', offAliases: ['mercadona'], privateLabelShare: 'medium' },
  { id: 'el-corte-ingles', name: 'El Corte Inglés', countries: ['ES'], kind: 'supermarket', offAliases: ['el corte ingles', 'el corte inglés', 'hipercor'] },
  { id: 'continente', name: 'Continente', countries: ['PT'], kind: 'hypermarket', offAliases: ['continente'], privateLabelShare: 'medium' },
  { id: 'pingo-doce', name: 'Pingo Doce', countries: ['PT'], kind: 'supermarket', offAliases: ['pingo doce'], privateLabelShare: 'medium' },
  { id: 'esselunga', name: 'Esselunga', countries: ['IT'], kind: 'supermarket', offAliases: ['esselunga'] },
  { id: 'conad', name: 'Conad', countries: ['IT'], kind: 'supermarket', offAliases: ['conad'] },
  { id: 'coop-it', name: 'Coop Italia', countries: ['IT'], kind: 'supermarket', offAliases: ['coop', 'coop italia', 'coop-it'], hasEthicalOwnLabel: true, privateLabelShare: 'medium' },

  // ── Nordics & Poland ──────────────────────────────────────────────────────
  { id: 'ica', name: 'ICA', countries: ['SE'], kind: 'supermarket', offAliases: ['ica'], privateLabelShare: 'medium' },
  { id: 'coop-se', name: 'Coop', countries: ['SE', 'NO', 'DK'], kind: 'supermarket', offAliases: ['coop', 'coop-se'], hasEthicalOwnLabel: true, privateLabelShare: 'medium' },
  { id: 'rema-1000', name: 'REMA 1000', countries: ['NO', 'DK'], kind: 'discounter', offAliases: ['rema 1000', 'rema1000'], privateLabelShare: 'high' },
  { id: 'netto', name: 'Netto', countries: ['DK', 'DE', 'PL'], kind: 'discounter', offAliases: ['netto'], privateLabelShare: 'high' },
  { id: 's-market', name: 'S-market', countries: ['FI'], kind: 'supermarket', offAliases: ['s-market', 'smarket', 'prisma'] },
  { id: 'k-market', name: 'K-Market', countries: ['FI'], kind: 'supermarket', offAliases: ['k-market', 'kmarket', 'k-citymarket'] },
  { id: 'biedronka', name: 'Biedronka', countries: ['PL'], kind: 'discounter', offAliases: ['biedronka'], privateLabelShare: 'high' },
  { id: 'zabka', name: 'Żabka', countries: ['PL'], kind: 'convenience', offAliases: ['zabka', 'żabka'] },

  // ── Australia & New Zealand ───────────────────────────────────────────────
  { id: 'woolworths-au', name: 'Woolworths', countries: ['AU'], kind: 'supermarket', offAliases: ['woolworths', 'woolies'], privateLabelShare: 'medium' },
  { id: 'coles', name: 'Coles', countries: ['AU'], kind: 'supermarket', offAliases: ['coles'], privateLabelShare: 'medium' },
  { id: 'iga-au', name: 'IGA', countries: ['AU'], kind: 'supermarket', offAliases: ['iga'] },
  { id: 'countdown', name: 'Woolworths NZ', countries: ['NZ'], kind: 'supermarket', offAliases: ['countdown', 'woolworths nz'], privateLabelShare: 'medium' },
  { id: 'new-world', name: 'New World', countries: ['NZ'], kind: 'supermarket', offAliases: ['new world'] },
  { id: 'paknsave', name: "Pak'nSave", countries: ['NZ'], kind: 'discounter', offAliases: ["pak'nsave", 'paknsave', 'pak n save'], privateLabelShare: 'high' },
];

/** Chains trading in a market, largest formats first so the list reads sensibly. */
export function getRetailersForCountry(countryCode: string | null | undefined): Retailer[] {
  if (!countryCode) return [];
  const cc = countryCode.toUpperCase();
  const order: Record<RetailerKind, number> = {
    supermarket: 0, hypermarket: 1, discounter: 2, organic: 3, convenience: 4,
  };
  return RETAILERS
    .filter((r) => r.countries.includes(cc))
    .sort((a, b) => order[a.kind] - order[b.kind] || a.name.localeCompare(b.name));
}

export function getRetailerById(id: string | null | undefined): Retailer | null {
  if (!id) return null;
  return RETAILERS.find((r) => r.id === id) ?? null;
}

/**
 * Normalise one raw Open Food Facts store tag for comparison.
 * OFF tags arrive as free text with language prefixes, country suffixes and
 * punctuation ("en:Carrefour", "carrefour-fr", "Carrefour Market").
 */
export function normaliseStoreTag(tag: string): string {
  return tag
    .replace(/^[a-z]{2}:/i, '')          // strip an OFF language prefix
    .toLowerCase()
    // Fold accents to their base letter FIRST. Stripping them as "not a-z"
    // would turn "Coopérative" into "coop rative", inventing a word boundary
    // that then matches the alias "coop" and reports a French farming
    // cooperative as a Co-op grocery sighting.
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[._']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Does any of a product's OFF store tags refer to this chain?
 *
 * Matching is prefix-anchored on purpose. Substring matching would make
 * "Coop" match "Co-op Funeralcare" and "SPAR" match "Sparkling Water Co",
 * quietly inventing availability — the same class of bug that once made
 * "Philly Swirl" match illycaffè in the brand-flag matcher.
 */
export function storeTagsMatchRetailer(tags: string[] | null | undefined, retailer: Retailer): boolean {
  if (!tags || tags.length === 0) return false;
  const aliases = retailer.offAliases.map(normaliseStoreTag);
  return tags.some((raw) => {
    const t = normaliseStoreTag(raw);
    if (!t) return false;
    return aliases.some((a) => t === a || t.startsWith(`${a} `));
  });
}
