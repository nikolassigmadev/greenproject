// Curated ethical alternatives catalog.
//
// This is the "make sense" half of the swap engine. Instead of returning a
// random Open Food Facts product that merely has a better eco-score, we map a
// scanned product's CATEGORY + its worst CONCERN to a hand-picked list of
// brands that are genuinely better on that exact axis — e.g. a Kit Kat (cocoa
// child-labour) routes to Tony's Chocolonely / Feastables / Alter Eco, which
// are recognised for slavery-free, fully-traceable cocoa.
//
// Each candidate is resolved to a live OFF product at runtime (for image,
// eco-score, CO2 and regional availability). The static fields here are the
// fallback so a suggestion is always meaningful even if OFF lookup fails.

import type { CertificationType } from "@/utils/verifiedEthics";

/** The concerns a swap can address, matching the engine's diagnosis. */
export type ConcernType = "labor" | "boycott" | "animal_welfare" | "eco";

/** Catalog category keys. OFF categories are mapped onto these. */
export type SwapCategoryKey =
  | "chocolate"
  | "coffee"
  | "tea"
  | "soft_drinks"
  | "cereal"
  | "snacks"
  | "ice_cream"
  | "eggs"
  | "dairy"
  | "seafood"
  | "bananas";

export interface AltCandidate {
  brand: string;
  /** Representative product to search for / display. */
  productName: string;
  /** Free-text query used to resolve a live OFF product. */
  searchQuery: string;
  /** Canonical OFF barcodes to try first (priority order), if known. */
  barcodes?: string[];
  certifications: CertificationType[];
  /** Short, scannable reasons this is a better pick. */
  strengths: string[];
  /** Which concerns this alternative meaningfully addresses. */
  addresses: ConcernType[];
  /** Fallback eco-grade when OFF has none (rough, conservative). */
  fallbackEcoGrade?: "a" | "b" | "c" | "d" | "e";
}

export interface CategoryLabel {
  key: SwapCategoryKey;
  label: string;
}

export const CATEGORY_LABELS: Record<SwapCategoryKey, string> = {
  chocolate: "Chocolate",
  coffee: "Coffee",
  tea: "Tea",
  soft_drinks: "Soft drinks",
  cereal: "Cereal",
  snacks: "Snacks",
  ice_cream: "Ice cream",
  eggs: "Eggs",
  dairy: "Dairy",
  seafood: "Seafood",
  bananas: "Bananas & fruit",
};

// ── Catalog ──────────────────────────────────────────────────────────────────

export const ETHICAL_ALTERNATIVES: Record<SwapCategoryKey, AltCandidate[]> = {
  chocolate: [
    {
      brand: "Tony's Chocolonely",
      productName: "Tony's Chocolonely Milk Chocolate",
      searchQuery: "Tony's Chocolonely milk chocolate",
      certifications: ["fair_trade"],
      strengths: ["Slavery-free, fully traceable cocoa", "Pays above the Fairtrade premium"],
      addresses: ["labor", "boycott"],
      fallbackEcoGrade: "c",
    },
    {
      brand: "Feastables",
      productName: "Feastables Milk Chocolate",
      searchQuery: "Feastables chocolate bar",
      certifications: ["fair_trade"],
      strengths: ["100% Fairtrade cocoa", "Widely stocked in the US & UK"],
      addresses: ["labor"],
      fallbackEcoGrade: "c",
    },
    {
      brand: "Alter Eco",
      productName: "Alter Eco Dark Chocolate",
      searchQuery: "Alter Eco dark chocolate",
      certifications: ["b_corp", "fair_trade", "organic"],
      strengths: ["B Corp + Fairtrade", "Regenerative, carbon-neutral cocoa"],
      addresses: ["labor", "eco"],
      fallbackEcoGrade: "b",
    },
    {
      brand: "Divine Chocolate",
      productName: "Divine Milk Chocolate",
      searchQuery: "Divine chocolate",
      certifications: ["fair_trade"],
      strengths: ["Co-owned by Ghanaian cocoa farmers", "Fairtrade certified"],
      addresses: ["labor"],
      fallbackEcoGrade: "c",
    },
    {
      brand: "Equal Exchange",
      productName: "Equal Exchange Organic Chocolate",
      searchQuery: "Equal Exchange organic chocolate",
      certifications: ["fair_trade", "organic", "worker_coop"],
      strengths: ["Worker co-op owned", "Audited fair-trade supply chain"],
      addresses: ["labor", "eco"],
      fallbackEcoGrade: "b",
    },
  ],

  coffee: [
    {
      brand: "Cafédirect",
      productName: "Cafédirect Fairtrade Coffee",
      searchQuery: "Cafedirect fairtrade coffee",
      certifications: ["fair_trade"],
      strengths: ["Fairtrade pioneer", "Reinvests profits into grower co-ops"],
      addresses: ["labor"],
      fallbackEcoGrade: "c",
    },
    {
      brand: "Grounds for Change",
      productName: "Grounds for Change Organic Coffee",
      searchQuery: "Grounds for Change coffee",
      certifications: ["fair_trade", "organic", "climate_neutral"],
      strengths: ["Organic + Fairtrade", "Carbon-free roasting"],
      addresses: ["labor", "eco"],
      fallbackEcoGrade: "b",
    },
    {
      brand: "Ethical Bean",
      productName: "Ethical Bean Fairtrade Coffee",
      searchQuery: "Ethical Bean coffee",
      certifications: ["fair_trade", "organic"],
      strengths: ["Fairtrade since day one", "Full bean traceability"],
      addresses: ["labor"],
      fallbackEcoGrade: "c",
    },
    {
      brand: "Equal Exchange",
      productName: "Equal Exchange Organic Coffee",
      searchQuery: "Equal Exchange organic coffee",
      certifications: ["fair_trade", "organic", "worker_coop"],
      strengths: ["Worker co-op owned", "Direct relationships with farmer co-ops"],
      addresses: ["labor", "eco"],
      fallbackEcoGrade: "b",
    },
  ],

  tea: [
    {
      brand: "Clipper Teas",
      productName: "Clipper Organic Fairtrade Tea",
      searchQuery: "Clipper organic fairtrade tea",
      certifications: ["fair_trade", "organic"],
      strengths: ["Fairtrade + organic", "Unbleached, plastic-free bags"],
      addresses: ["labor", "eco"],
      fallbackEcoGrade: "b",
    },
    {
      brand: "Numi Organic Tea",
      productName: "Numi Organic Tea",
      searchQuery: "Numi organic tea",
      certifications: ["organic", "fair_trade"],
      strengths: ["Certified organic", "Fairtrade blends, plastic-free"],
      addresses: ["labor", "eco"],
      fallbackEcoGrade: "b",
    },
    {
      brand: "Pukka Herbs",
      productName: "Pukka Organic Tea",
      searchQuery: "Pukka organic tea",
      certifications: ["fair_trade", "organic", "b_corp"],
      strengths: ["B Corp", "Fair for Life certified herbs"],
      addresses: ["labor", "eco"],
      fallbackEcoGrade: "b",
    },
  ],

  soft_drinks: [
    {
      brand: "Karma Drinks",
      productName: "Karma Cola Fairtrade",
      searchQuery: "Karma Cola fairtrade",
      certifications: ["fair_trade", "organic"],
      strengths: ["Fairtrade cola nuts from Sierra Leone", "Funds grower communities"],
      addresses: ["labor", "boycott"],
      fallbackEcoGrade: "c",
    },
    {
      brand: "OLIPOP",
      productName: "OLIPOP Prebiotic Soda",
      searchQuery: "Olipop prebiotic soda",
      certifications: ["b_corp"],
      strengths: ["B Corp", "Low-sugar, function-first"],
      addresses: ["boycott", "eco"],
      fallbackEcoGrade: "c",
    },
    {
      brand: "Lemonaid",
      productName: "Lemonaid Fairtrade Soft Drink",
      searchQuery: "Lemonaid fairtrade",
      certifications: ["fair_trade", "organic"],
      strengths: ["Fairtrade sourced", "Profits fund social projects"],
      addresses: ["labor", "boycott"],
      fallbackEcoGrade: "c",
    },
  ],

  cereal: [
    {
      brand: "Nature's Path",
      productName: "Nature's Path Organic Cereal",
      searchQuery: "Nature's Path organic cereal",
      certifications: ["b_corp", "organic"],
      strengths: ["B Corp", "Organic, non-GMO grains"],
      addresses: ["labor", "eco"],
      fallbackEcoGrade: "b",
    },
    {
      brand: "Purely Elizabeth",
      productName: "Purely Elizabeth Granola",
      searchQuery: "Purely Elizabeth granola",
      certifications: ["b_corp", "organic"],
      strengths: ["B Corp", "Organic ancient grains"],
      addresses: ["labor", "eco"],
      fallbackEcoGrade: "b",
    },
    {
      brand: "Alara",
      productName: "Alara Organic Muesli",
      searchQuery: "Alara organic muesli",
      certifications: ["organic"],
      strengths: ["Zero-waste, organic", "Carbon-neutral London mill"],
      addresses: ["eco"],
      fallbackEcoGrade: "a",
    },
  ],

  snacks: [
    {
      brand: "Alter Eco",
      productName: "Alter Eco Organic Snacks",
      searchQuery: "Alter Eco organic",
      certifications: ["b_corp", "fair_trade", "organic"],
      strengths: ["B Corp + Fairtrade", "Plastic-free, regenerative"],
      addresses: ["labor", "eco"],
      fallbackEcoGrade: "b",
    },
    {
      brand: "Made in Nature",
      productName: "Made in Nature Organic Snacks",
      searchQuery: "Made in Nature organic",
      certifications: ["organic"],
      strengths: ["Organic, non-GMO", "Fruit & nut whole-food snacks"],
      addresses: ["eco"],
      fallbackEcoGrade: "b",
    },
    {
      brand: "That's it",
      productName: "That's it Fruit Bars",
      searchQuery: "That's it fruit bar",
      certifications: ["b_corp"],
      strengths: ["B Corp", "Two-ingredient, low-footprint"],
      addresses: ["eco"],
      fallbackEcoGrade: "a",
    },
  ],

  ice_cream: [
    {
      brand: "Ben & Jerry's",
      productName: "Ben & Jerry's Fairtrade Ice Cream",
      searchQuery: "Ben & Jerry's",
      certifications: ["b_corp", "fair_trade"],
      strengths: ["B Corp", "Fairtrade cocoa, sugar & vanilla"],
      addresses: ["labor"],
      fallbackEcoGrade: "d",
    },
    {
      brand: "Booja-Booja",
      productName: "Booja-Booja Organic Ice Cream",
      searchQuery: "Booja-Booja",
      certifications: ["organic"],
      strengths: ["Organic, dairy-free", "No animal-welfare footprint"],
      addresses: ["animal_welfare", "eco"],
      fallbackEcoGrade: "c",
    },
    {
      brand: "Jeni's",
      productName: "Jeni's Splendid Ice Creams",
      searchQuery: "Jeni's ice cream",
      certifications: ["b_corp", "direct_trade"],
      strengths: ["B Corp", "Direct-trade ingredients"],
      addresses: ["labor"],
      fallbackEcoGrade: "d",
    },
  ],

  eggs: [
    {
      brand: "Vital Farms",
      productName: "Vital Farms Pasture-Raised Eggs",
      searchQuery: "Vital Farms eggs",
      certifications: ["certified_humane"],
      strengths: ["Certified Humane, pasture-raised", "Farm-level transparency"],
      addresses: ["animal_welfare"],
      fallbackEcoGrade: "b",
    },
    {
      brand: "Pete & Gerry's",
      productName: "Pete & Gerry's Organic Eggs",
      searchQuery: "Pete and Gerry's organic eggs",
      certifications: ["b_corp", "certified_humane", "organic"],
      strengths: ["B Corp + Certified Humane", "Small family-farm network"],
      addresses: ["animal_welfare", "labor"],
      fallbackEcoGrade: "b",
    },
  ],

  dairy: [
    {
      brand: "Stonyfield Organic",
      productName: "Stonyfield Organic Yogurt",
      searchQuery: "Stonyfield organic yogurt",
      certifications: ["b_corp", "organic"],
      strengths: ["B Corp", "Organic dairy, no synthetic inputs"],
      addresses: ["animal_welfare", "eco"],
      fallbackEcoGrade: "c",
    },
    {
      brand: "Cabot Creamery",
      productName: "Cabot Creamery Cheese",
      searchQuery: "Cabot Creamery cheese",
      certifications: ["b_corp", "worker_coop"],
      strengths: ["Farmer co-op owned", "B Corp"],
      addresses: ["labor", "animal_welfare"],
      fallbackEcoGrade: "c",
    },
    {
      brand: "Oatly",
      productName: "Oatly Oat Drink",
      searchQuery: "Oatly oat drink",
      certifications: [],
      strengths: ["Plant-based — no animal-welfare footprint", "Far lower CO₂ than dairy"],
      addresses: ["animal_welfare", "eco"],
      fallbackEcoGrade: "a",
    },
  ],

  seafood: [
    {
      brand: "Wild Planet",
      productName: "Wild Planet Sustainable Tuna",
      searchQuery: "Wild Planet tuna",
      certifications: ["msc"],
      strengths: ["Pole-and-line caught", "MSC-aligned sourcing"],
      addresses: ["labor", "eco"],
      fallbackEcoGrade: "b",
    },
    {
      brand: "Fish 4 Ever",
      productName: "Fish 4 Ever Sustainable Fish",
      searchQuery: "Fish 4 Ever",
      certifications: ["msc", "organic"],
      strengths: ["MSC certified", "Traceable, small-scale fisheries"],
      addresses: ["labor", "eco"],
      fallbackEcoGrade: "b",
    },
  ],

  bananas: [
    {
      brand: "Equal Exchange",
      productName: "Equal Exchange Fairtrade Bananas",
      searchQuery: "Equal Exchange bananas",
      certifications: ["fair_trade", "organic", "worker_coop"],
      strengths: ["Fairtrade + organic", "Small-farmer co-ops"],
      addresses: ["labor", "eco"],
      fallbackEcoGrade: "b",
    },
    {
      brand: "Organics Unlimited",
      productName: "Organics Unlimited GROW Bananas",
      searchQuery: "Organics Unlimited bananas",
      certifications: ["fair_trade", "organic"],
      strengths: ["Fairtrade", "Funds worker-community programs"],
      addresses: ["labor"],
      fallbackEcoGrade: "b",
    },
  ],
};

// ── Category detection ───────────────────────────────────────────────────────

// Keyword → category. First match wins; order matters (specific before broad).
const CATEGORY_KEYWORDS: { key: SwapCategoryKey; patterns: RegExp }[] = [
  { key: "ice_cream", patterns: /ice.?cream|gelato|frozen.?dessert|frozen.?yog/i },
  { key: "chocolate", patterns: /chocolat|cocoa|cacao|praline|truffle|candy.?bar|chocolate.?bar/i },
  { key: "coffee", patterns: /coffee|espresso|\bcafé\b|\bcafe\b|ground.?coffee|coffee.?bean/i },
  { key: "tea", patterns: /\btea\b|tea.?bag|chai|matcha|herbal.?infusion|rooibos/i },
  { key: "soft_drinks", patterns: /soda|cola\b|soft.?drink|carbonated|lemonade|energy.?drink|fizzy/i },
  { key: "cereal", patterns: /cereal|granola|muesli|breakfast.?cereal|porridge|oatmeal|cornflake/i },
  { key: "eggs", patterns: /\beggs?\b/i },
  { key: "dairy", patterns: /yog[hu]rt|\bmilk\b|\bcheese\b|butter|cream\b|dairy/i },
  { key: "seafood", patterns: /tuna|salmon|seafood|\bfish\b|sardine|mackerel|shrimp|prawn/i },
  { key: "bananas", patterns: /banana/i },
  { key: "snacks", patterns: /snack|crisps?|chips\b|biscuit|cookie|cracker|bar\b|popcorn|nuts?\b|dried.?fruit/i },
];

/**
 * Map an OFF product's categories + name to a catalog category, or null when we
 * have no curated list for it.
 */
export function detectSwapCategory(input: {
  categories?: string[];
  productName?: string | null;
  brand?: string | null;
}): SwapCategoryKey | null {
  const haystack = [
    ...(input.categories ?? []),
    input.productName ?? "",
    input.brand ?? "",
  ]
    .join(" ")
    .toLowerCase();
  if (!haystack.trim()) return null;
  for (const { key, patterns } of CATEGORY_KEYWORDS) {
    if (patterns.test(haystack)) return key;
  }
  return null;
}

export function getCandidates(category: SwapCategoryKey): AltCandidate[] {
  return ETHICAL_ALTERNATIVES[category] ?? [];
}
