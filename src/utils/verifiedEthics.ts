// Verified Ethics database — brands with strong, verified ethical practices
// Data sourced from Ethical Food Companies Reference (May 2026)

export type CertificationType =
  | 'b_corp'
  | 'fair_trade'
  | 'organic'
  | 'rainforest_alliance'
  | 'msc'
  | 'asc'
  | 'certified_humane'
  | 'animal_welfare_approved'
  | 'gap_rated'
  | 'regenerative_organic'
  | 'climate_neutral'
  | 'worker_coop'
  | 'direct_trade';

export interface EthicsHighlight {
  label: string;
  detail: string;
  source: string;
  sourceUrl: string;
  certification?: CertificationType;
}

interface VerifiedEthicsBrand {
  brandPattern: RegExp;
  brandName: string;
  category: 'chocolate' | 'coffee_tea' | 'packaged_grocery' | 'eggs_dairy_meat' | 'seafood';
  highlights: EthicsHighlight[];
}

// ── Certification badge config ──────────────────────────────────────────────

export const CERTIFICATION_BADGES: Record<CertificationType, {
  label: string;
  shortLabel: string;
  color: string;
  bg: string;
  icon: string; // emoji fallback
}> = {
  b_corp:                  { label: "Certified B Corp",            shortLabel: "B Corp",           color: "#1B3A2D", bg: "#D4EDDA", icon: "B" },
  fair_trade:              { label: "Fair Trade Certified",        shortLabel: "Fair Trade",       color: "#1B5E20", bg: "#C8E6C9", icon: "FT" },
  organic:                 { label: "USDA Organic",                shortLabel: "Organic",          color: "#33691E", bg: "#DCEDC8", icon: "O" },
  rainforest_alliance:     { label: "Rainforest Alliance",         shortLabel: "RA",               color: "#1B5E20", bg: "#C8E6C9", icon: "RA" },
  msc:                     { label: "MSC Certified",               shortLabel: "MSC",              color: "#0D47A1", bg: "#BBDEFB", icon: "MSC" },
  asc:                     { label: "ASC Certified",               shortLabel: "ASC",              color: "#00695C", bg: "#B2DFDB", icon: "ASC" },
  certified_humane:        { label: "Certified Humane",            shortLabel: "Humane",           color: "#4E342E", bg: "#D7CCC8", icon: "CH" },
  animal_welfare_approved: { label: "Animal Welfare Approved",     shortLabel: "AWA",              color: "#BF360C", bg: "#FFCCBC", icon: "AWA" },
  gap_rated:               { label: "GAP Rated (Step 4+)",         shortLabel: "GAP 4+",           color: "#E65100", bg: "#FFE0B2", icon: "GAP" },
  regenerative_organic:    { label: "Regenerative Organic Cert.",   shortLabel: "ROC",              color: "#2E7D32", bg: "#A5D6A7", icon: "ROC" },
  climate_neutral:         { label: "Climate Neutral",             shortLabel: "Climate",          color: "#0277BD", bg: "#B3E5FC", icon: "CN" },
  worker_coop:             { label: "Worker Co-op",                shortLabel: "Co-op",            color: "#6A1B9A", bg: "#E1BEE7", icon: "WC" },
  direct_trade:            { label: "Direct Trade",                shortLabel: "DT",               color: "#4E342E", bg: "#EFEBE9", icon: "DT" },
};

// ── Source URLs from PDF numbered source key ────────────────────────────────

const SRC = {
  1:  "https://fairtradecertified.org/blog/fair-trade-chocolate",
  2:  "https://greenamerica.org/end-child-labor-cocoa/chocolate-scorecard",
  3:  "https://slavefreechocolate.org/ethical-chocolate-companies",
  4:  "https://feastables.com/pages/ethicalsourcing",
  5:  "https://barandcocoa.com/pages/fair-trade-direct-trade-chocolate",
  6:  "https://thehonestconsumer.com/blog/fair-trade-chocolate-brands",
  7:  "https://cbc.ca",
  8:  "https://fairtrade.net/us-en/products/all-products/coffee.html",
  9:  "https://sustainablykindliving.com",
  10: "https://studyfinds.org/best-fair-trade-coffee",
  11: "https://inven.ai/company-lists/top-27-fair-trade-coffee-companies",
  12: "https://fnb.coffee/blog/fair-trade-coffee-brands",
  13: "https://coffeewana.com/5-best-fair-trade-coffee-beans-for-ethical-sourcing",
  14: "https://sustainablebaddie.com",
  15: "https://bcorporation.net/find-a-b-corp",
  16: "https://reqodata.com/en/certified-b-corp-food-and-beverage-brands",
  17: "https://aclymate.com/blog/myaclymate/7-b-corp-food-companies",
  18: "https://usca.bcorporation.net",
  19: "https://food52.com/story/25819-best-b-corp-food-brands",
  20: "https://drinkholistic.com/blogs/news",
  21: "https://countryandtownhouse.com/food-and-drink",
  22: "https://seafoodsource.com",
  23: "https://seachoice.org/tainted-tuna-certified-sustainable",
  24: "https://sustainablefisheries-uw.org/buy-sustainable-seafood-grocery-store",
  25: "https://leafscore.com/grocery/most-important-eco-friendly-seafood-certifications",
  26: "https://bluecart.com/blog/seafood-sustainability-standards",
  27: "https://fultonfishmarket.com/blogs/articles",
  29: "https://greenamerica.org/animal-concerns-labels",
  30: "https://aspca.org/shopwithyourheart",
  31: "https://awionline.org/content/making-better-food-choices",
  32: "https://humaneworld.org/en/how-decipher-food-labels",
  33: "https://foodwise.org/articles/decoding-animal-welfare-labels",
  34: "https://humaneitarian.org/what-is-humanely-raised-meat/humane-certifications",
  35: "https://americanhumane.org/what-we-do/certify-humane-treatment/farms",
} as const;

// ── Database ────────────────────────────────────────────────────────────────

const VERIFIED_ETHICS_DATABASE: VerifiedEthicsBrand[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. CHOCOLATE & COCOA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    brandPattern: /tony'?s?\s*chocolonely/i,
    brandName: "Tony's Chocolonely",
    category: "chocolate",
    highlights: [
      { label: "Fair Trade Certified", detail: "Brand built on traceable, slavery-free cocoa via its 'Open Chain' sourcing model. Pays above Fairtrade prices.", source: "Slave Free Chocolate", sourceUrl: SRC[3], certification: "fair_trade" },
      { label: "Mission-Driven", detail: "Mission-driven cocoa-labor leader; has acknowledged traces of child labor can still appear in West African supply chains it works to remediate.", source: "CBC", sourceUrl: SRC[7] },
    ],
  },
  {
    brandPattern: /equal\s*exchange/i,
    brandName: "Equal Exchange",
    category: "chocolate",
    highlights: [
      { label: "USDA Organic", detail: "Fully traceable; suppliers regularly audited against fair-trade standards; worker co-op owned; often pays above the fair-trade premium.", source: "Green America", sourceUrl: SRC[2], certification: "organic" },
      { label: "Worker Co-op", detail: "Small-farmer market-access pioneer. Co-op owned with democratic governance.", source: "The Honest Consumer", sourceUrl: SRC[6], certification: "worker_coop" },
      { label: "Fair Trade", detail: "Long-standing fair-trade pioneer with the same co-op model across chocolate and coffee.", source: "Fairtrade International", sourceUrl: SRC[8], certification: "fair_trade" },
    ],
  },
  {
    brandPattern: /alter\s*eco/i,
    brandName: "Alter Eco",
    category: "chocolate",
    highlights: [
      { label: "Certified B Corp", detail: "Whole-company certification scoring governance, environment, community and worker practices.", source: "ReqoData", sourceUrl: SRC[16], certification: "b_corp" },
      { label: "Fair Trade & Regenerative", detail: "Regenerative farming, climate-neutral, plastic-free packaging. Frequently cited benchmark ethical-snack brand.", source: "Holistic Spirits Co.", sourceUrl: SRC[20], certification: "fair_trade" },
    ],
  },
  {
    brandPattern: /divine\s*chocolate/i,
    brandName: "Divine Chocolate",
    category: "chocolate",
    highlights: [
      { label: "Fairtrade Certified", detail: "Co-owned in part by the Kuapa Kokoo farmer cooperative in Ghana. Farmer-ownership model is unusually transparent for cocoa.", source: "The Honest Consumer", sourceUrl: SRC[6], certification: "fair_trade" },
    ],
  },
  {
    brandPattern: /feastables/i,
    brandName: "Feastables",
    category: "chocolate",
    highlights: [
      { label: "Fair Trade Certified", detail: "Commits to sourcing 100% of cocoa on Fairtrade terms; one of the largest Fairtrade chocolate-bar brands in the US.", source: "Feastables", sourceUrl: SRC[4], certification: "fair_trade" },
    ],
  },
  // NB: Green & Black's was removed from the verified-ethics list. It is
  // Mondelēz-owned; the app carries a verified Mondelēz child-labour flag and
  // its chocolate directory rates Mondelēz "avoid", so a green badge here
  // contradicted the app's own data (and leaked into swap recommendations).

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. COFFEE & TEA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    brandPattern: /conscious\s*coffees?/i,
    brandName: "Conscious Coffees",
    category: "coffee_tea",
    highlights: [
      { label: "Certified B Corp", detail: "Founding member of Cooperative Coffees; pays beyond living wages. Direct importing from cooperatives.", source: "Sustainably Kind Living", sourceUrl: SRC[9], certification: "b_corp" },
      { label: "Organic & Fair Trade", detail: "Certified Organic and Fair Trade with long-term farmer relationships.", source: "Sustainable Baddie", sourceUrl: SRC[14], certification: "fair_trade" },
    ],
  },
  {
    brandPattern: /ethical\s*bean/i,
    brandName: "Ethical Bean",
    category: "coffee_tea",
    highlights: [
      { label: "Fairtrade Certified", detail: "Fairtrade certified since founding. Full bean traceability with TerraCycle recycling partnership.", source: "Sustainably Kind Living", sourceUrl: SRC[9], certification: "fair_trade" },
      { label: "Organic", detail: "Canadian roaster focused on supply-chain transparency.", source: "StudyFinds", sourceUrl: SRC[10], certification: "organic" },
    ],
  },
  {
    brandPattern: /caf[eé]\s*mam/i,
    brandName: "Cafe Mam",
    category: "coffee_tea",
    highlights: [
      { label: "Fair Trade Certified", detail: "Sources from Indigenous cooperatives; women-led farming focus.", source: "StudyFinds", sourceUrl: SRC[10], certification: "fair_trade" },
      { label: "Organic", detail: "Certified Organic with recyclable/compostable packaging.", source: "StudyFinds", sourceUrl: SRC[10], certification: "organic" },
    ],
  },
  {
    brandPattern: /grounds?\s*for\s*change/i,
    brandName: "Grounds for Change",
    category: "coffee_tea",
    highlights: [
      { label: "Organic & Fair Trade", detail: "Certified Organic and Fair Trade; carbon-free. Sources from global cooperatives.", source: "FNB Coffee", sourceUrl: SRC[12], certification: "fair_trade" },
      { label: "Climate Neutral", detail: "Carbon-free operations commitment.", source: "FNB Coffee", sourceUrl: SRC[12], certification: "climate_neutral" },
    ],
  },
  {
    brandPattern: /higher\s*ground\s*roasters?/i,
    brandName: "Higher Ground Roasters",
    category: "coffee_tea",
    highlights: [
      { label: "100% Organic & Fair Trade", detail: "100% certified Organic and Fair Trade beans; direct small-farm sourcing and community investment.", source: "StudyFinds", sourceUrl: SRC[10], certification: "fair_trade" },
      { label: "Community Support", detail: "Each blend supports a waterway-protection nonprofit.", source: "FNB Coffee", sourceUrl: SRC[12] },
    ],
  },
  {
    brandPattern: /caf[eé]direct/i,
    brandName: "Cafedirect",
    category: "coffee_tea",
    highlights: [
      { label: "Fairtrade Pioneer", detail: "Fairtrade pioneer; reinvests profits into grower programs. One of the original UK fair-trade coffee brands.", source: "Inven", sourceUrl: SRC[11], certification: "fair_trade" },
    ],
  },
  {
    brandPattern: /blk\s*&?\s*bold/i,
    brandName: "BLK & Bold",
    category: "coffee_tea",
    highlights: [
      { label: "Fair Trade Certified", detail: "Fair Trade certified beans (Honduras, Ethiopia); social enterprise donating 5% of profits to youth programs.", source: "Coffeewana", sourceUrl: SRC[13], certification: "fair_trade" },
      { label: "Social Enterprise", detail: "Black-owned US brand combining sourcing ethics with social mission.", source: "Coffeewana", sourceUrl: SRC[13] },
    ],
  },
  {
    brandPattern: /numi\s*(organic\s*)?tea/i,
    brandName: "Numi Organic Tea",
    category: "coffee_tea",
    highlights: [
      { label: "Certified Organic", detail: "Certified Organic; Fair Trade blends; plastic-free packaging.", source: "Holistic Spirits Co.", sourceUrl: SRC[20], certification: "organic" },
      { label: "Fair Trade", detail: "Listed among B Corp / fair-trade beverage leaders.", source: "Holistic Spirits Co.", sourceUrl: SRC[20], certification: "fair_trade" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. PACKAGED GROCERIES, DAIRY & SNACKS (B Corp–anchored)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    brandPattern: /amy'?s?\s*kitchen/i,
    brandName: "Amy's Kitchen",
    category: "packaged_grocery",
    highlights: [
      { label: "Certified B Corp", detail: "Certified B Corp; organic, family-owned packaged/frozen foods. #1 natural brand in several US categories.", source: "Aclymate", sourceUrl: SRC[17], certification: "b_corp" },
      { label: "Organic", detail: "Wide allergen-friendly range with organic ingredients.", source: "B Lab US/Canada", sourceUrl: SRC[18], certification: "organic" },
    ],
  },
  // NB: Ben & Jerry's was removed from the verified-ethics list. It is a
  // genuine B Corp, but it is Unilever-owned and boycott-listed by this app's
  // own data — the entry could never display (the red signals suppress it) and
  // it leaked into swap recommendations via verifiedEthicsSwaps.
  {
    brandPattern: /king\s*arthur\s*(baking|flour)?/i,
    brandName: "King Arthur Baking",
    category: "packaged_grocery",
    highlights: [
      { label: "Certified B Corp", detail: "Employee-owned. Flour and baking staples; long-standing ethical-business reputation.", source: "ReqoData", sourceUrl: SRC[16], certification: "b_corp" },
      { label: "Employee-Owned", detail: "100% employee-owned company with long-standing ethical-business reputation.", source: "Food52", sourceUrl: SRC[19] },
    ],
  },
  {
    brandPattern: /stonyfield/i,
    brandName: "Stonyfield Organic",
    category: "packaged_grocery",
    highlights: [
      { label: "Certified B Corp", detail: "Organic dairy pioneer. Certified B Corp with organic dairy products.", source: "ReqoData", sourceUrl: SRC[16], certification: "b_corp" },
      { label: "Organic", detail: "Fully organic dairy line.", source: "ReqoData", sourceUrl: SRC[16], certification: "organic" },
    ],
  },
  {
    brandPattern: /miyoko'?s?\s*(creamery)?/i,
    brandName: "Miyoko's Creamery",
    category: "packaged_grocery",
    highlights: [
      { label: "Certified B Corp", detail: "Plant-based dairy, removing animal-welfare risk entirely.", source: "ReqoData", sourceUrl: SRC[16], certification: "b_corp" },
    ],
  },
  {
    brandPattern: /danone|silk|horizon\s*organic/i,
    brandName: "Danone North America",
    category: "packaged_grocery",
    highlights: [
      { label: "Certified B Corp", detail: "One of the largest B Corps; brands include Silk, Horizon Organic. B Corp at conglomerate scale — scrutinize individual brand supply chains.", source: "ReqoData", sourceUrl: SRC[16], certification: "b_corp" },
    ],
  },
  {
    brandPattern: /once\s*upon\s*a\s*farm/i,
    brandName: "Once Upon a Farm",
    category: "packaged_grocery",
    highlights: [
      { label: "Certified B Corp", detail: "Cold-pressed organic baby/kids food. Certified B Corp with organic ingredients.", source: "ReqoData", sourceUrl: SRC[16], certification: "b_corp" },
      { label: "Organic", detail: "Organic ingredients throughout product line.", source: "ReqoData", sourceUrl: SRC[16], certification: "organic" },
    ],
  },
  {
    brandPattern: /purely\s*elizabeth/i,
    brandName: "Purely Elizabeth",
    category: "packaged_grocery",
    highlights: [
      { label: "Certified B Corp", detail: "Granola and oatmeal. Non-GMO; organic ancient grains.", source: "Aclymate", sourceUrl: SRC[17], certification: "b_corp" },
      { label: "Organic", detail: "Uses organic ancient grains.", source: "Aclymate", sourceUrl: SRC[17], certification: "organic" },
    ],
  },
  {
    brandPattern: /olipop|rebbl/i,
    brandName: "OLIPOP / REBBL",
    category: "packaged_grocery",
    highlights: [
      { label: "Certified B Corp", detail: "Function/wellness drink brands with B Corp status.", source: "ReqoData", sourceUrl: SRC[16], certification: "b_corp" },
    ],
  },
  {
    brandPattern: /cabot\s*(creamery)?/i,
    brandName: "Cabot Creamery",
    category: "packaged_grocery",
    highlights: [
      { label: "Certified B Corp", detail: "Farmer-cooperative owned dairy. Co-op ownership across New England / New York farms.", source: "ReqoData", sourceUrl: SRC[16], certification: "b_corp" },
      { label: "Farmer Co-op", detail: "Cooperative ownership model ensures farmer control.", source: "ReqoData", sourceUrl: SRC[16], certification: "worker_coop" },
    ],
  },
  {
    brandPattern: /jeni'?s?\s*(splendid\s*)?(ice\s*cream)?/i,
    brandName: "Jeni's Splendid Ice Creams",
    category: "packaged_grocery",
    highlights: [
      { label: "Certified B Corp", detail: "Direct-trade ingredient sourcing for some inputs.", source: "ReqoData", sourceUrl: SRC[16], certification: "b_corp" },
      { label: "Direct Trade", detail: "Sources key ingredients through direct trade relationships.", source: "ReqoData", sourceUrl: SRC[16], certification: "direct_trade" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. EGGS, DAIRY & MEAT — ANIMAL WELFARE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    brandPattern: /pete\s*&?\s*gerry'?s|nellie'?s?\s*(free\s*range)?|carol'?s?\s*(eggs)?/i,
    brandName: "Pete & Gerry's Organic Eggs",
    category: "eggs_dairy_meat",
    highlights: [
      { label: "Certified B Corp", detail: "First US Certified Humane egg producer (2003); 100% Certified Humane Free-Range; family-farm network.", source: "B Lab US/Canada", sourceUrl: SRC[18], certification: "b_corp" },
      { label: "Certified Humane", detail: "Also markets Nellie's Free Range and Carol's brands. Standout for combining welfare + B Corp.", source: "B Lab US/Canada", sourceUrl: SRC[18], certification: "certified_humane" },
    ],
  },
  {
    brandPattern: /vital\s*farms?/i,
    brandName: "Vital Farms",
    category: "eggs_dairy_meat",
    highlights: [
      { label: "Certified Humane", detail: "Pasture-raised eggs and dairy. Large pasture-raised brand; publishes farm-level transparency.", source: "Humane World", sourceUrl: SRC[32], certification: "certified_humane" },
      { label: "Pasture-Raised", detail: "Publishes farm-level transparency data.", source: "Foodwise", sourceUrl: SRC[33] },
    ],
  },
];

export interface VerifiedEthicsRecord {
  brandName: string;
  category: string;
  highlights: EthicsHighlight[];
  certifications: CertificationType[];
}

export function findVerifiedEthics(
  brand: string | null | undefined,
  productName: string | null | undefined,
): VerifiedEthicsRecord | null {
  const text = `${brand || ""} ${productName || ""}`.toLowerCase();
  for (const record of VERIFIED_ETHICS_DATABASE) {
    if (record.brandPattern.test(text)) {
      const certs = record.highlights
        .map(h => h.certification)
        .filter((c): c is CertificationType => !!c);
      const uniqueCerts = [...new Set(certs)];
      return {
        brandName: record.brandName,
        category: record.category,
        highlights: record.highlights,
        certifications: uniqueCerts,
      };
    }
  }
  return null;
}

/** Get the primary certification badge for rendering */
export function getPrimaryCertification(record: VerifiedEthicsRecord): CertificationType | null {
  // Priority order: b_corp > fair_trade > organic > certified_humane > rest
  const priority: CertificationType[] = [
    'b_corp', 'fair_trade', 'organic', 'certified_humane',
    'animal_welfare_approved', 'msc', 'asc', 'regenerative_organic',
    'climate_neutral', 'worker_coop', 'direct_trade', 'rainforest_alliance', 'gap_rated',
  ];
  for (const p of priority) {
    if (record.certifications.includes(p)) return p;
  }
  return record.certifications[0] ?? null;
}

/** Category display labels */
export const CATEGORY_LABELS: Record<string, string> = {
  chocolate: "Chocolate & Cocoa",
  coffee_tea: "Coffee & Tea",
  packaged_grocery: "Packaged Grocery",
  eggs_dairy_meat: "Eggs, Dairy & Meat",
  seafood: "Seafood",
};

// ── Swap-engine adapter ─────────────────────────────────────────────────────

export type VerifiedEthicsCategory = VerifiedEthicsBrand["category"];

export interface VerifiedEthicsBrandSummary {
  brandName: string;
  category: VerifiedEthicsCategory;
  certifications: CertificationType[];
  /** Short, scannable reasons drawn from the highlight labels. */
  strengths: string[];
}

/**
 * Flattened view of the verified-ethics database for the swap engine. Returns
 * every brand with its unique certifications and up to three short strengths.
 */
export function getVerifiedEthicsBrands(): VerifiedEthicsBrandSummary[] {
  return VERIFIED_ETHICS_DATABASE.map((r) => {
    const certifications = [
      ...new Set(r.highlights.map((h) => h.certification).filter((c): c is CertificationType => !!c)),
    ];
    const strengths = [...new Set(r.highlights.map((h) => h.label))].slice(0, 3);
    return { brandName: r.brandName, category: r.category, certifications, strengths };
  });
}
