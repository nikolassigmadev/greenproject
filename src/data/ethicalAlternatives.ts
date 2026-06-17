// Curated ethical alternatives catalog.
//
// This is the "make sense" half of the swap engine. Instead of returning a
// random Open Food Facts product that merely has a better eco-score, we map a
// scanned product's CATEGORY + its worst CONCERN to a hand-picked list of
// brands that are genuinely better on that exact axis — e.g. a Kit Kat (cocoa
// child-labour) routes to Tony's Chocolonely / Feastables / Alter Eco.
//
// Each candidate carries the MARKETS it's realistically sold in, so the engine
// only suggests things the user can actually buy in their country. Candidates
// are then resolved to a live OFF product (image, eco-score, CO2, regional
// availability); the static fields here are the fallback when OFF lookup fails.

import type { CertificationType } from "@/utils/verifiedEthics";

/** The concerns a swap can address, matching the engine's diagnosis. */
export type ConcernType = "labor" | "boycott" | "animal_welfare" | "eco";

/** Catalog category keys. OFF categories are mapped onto these. */
export type SwapCategoryKey =
  | "chocolate"
  | "candy"
  | "chips"
  | "cookies"
  | "spreads"
  | "snack_bars"
  | "cereal"
  | "coffee"
  | "tea"
  | "soft_drinks"
  | "milk"
  | "yogurt"
  | "cheese"
  | "ice_cream"
  | "eggs"
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
  /**
   * ISO 3166-1 alpha-2 markets where this brand is realistically sold.
   * Omit to mean "assume broadly available everywhere we operate".
   */
  markets?: string[];
  /** Fallback eco-grade when OFF has none (rough, conservative). */
  fallbackEcoGrade?: "a" | "b" | "c" | "d" | "e";
  /** True for hand-added entries from customSwaps.json (ranked first). */
  custom?: boolean;
  /**
   * Whether we can assume the brand is sold in any market when `markets` is
   * unset. Curated catalog brands default to true (their omission means
   * "global"); brands pulled from the verified-ethics list set this false, so
   * we only claim local availability when Open Food Facts confirms it.
   */
  assumeAvailable?: boolean;
}

export const CATEGORY_LABELS: Record<SwapCategoryKey, string> = {
  chocolate: "chocolate",
  candy: "candy",
  chips: "crisps & chips",
  cookies: "biscuits & cookies",
  spreads: "spreads",
  snack_bars: "snack bars",
  cereal: "cereal",
  coffee: "coffee",
  tea: "tea",
  soft_drinks: "soft drinks",
  milk: "milk",
  yogurt: "yogurt",
  cheese: "cheese",
  ice_cream: "ice cream",
  eggs: "eggs",
  seafood: "seafood",
  bananas: "bananas",
};

// ── Reusable market sets ─────────────────────────────────────────────────────
const ANGLO = ["US", "CA", "GB", "IE", "AU", "NZ"];
const US_CA = ["US", "CA"];
const UK = ["GB", "IE"];
const EU = ["FR", "DE", "ES", "IT", "NL", "BE", "CH", "AT", "PT", "SE", "NO", "DK", "FI", "PL"];
const UK_EU = [...UK, ...EU];
const BROAD = [...ANGLO, ...EU];
// `markets` omitted entirely = treated as available everywhere (truly global brands).

// ── Catalog ──────────────────────────────────────────────────────────────────

export const ETHICAL_ALTERNATIVES: Record<SwapCategoryKey, AltCandidate[]> = {
  chocolate: [
    { brand: "Tony's Chocolonely", productName: "Tony's Chocolonely Milk Chocolate", searchQuery: "Tony's Chocolonely milk chocolate", certifications: ["fair_trade"], strengths: ["Slavery-free, fully traceable cocoa", "Pays above the Fairtrade premium"], addresses: ["labor", "boycott"], markets: BROAD, fallbackEcoGrade: "c" },
    { brand: "Feastables", productName: "Feastables Milk Chocolate", searchQuery: "Feastables chocolate bar", certifications: ["fair_trade"], strengths: ["100% Fairtrade cocoa", "Widely stocked"], addresses: ["labor"], markets: ANGLO, fallbackEcoGrade: "c" },
    { brand: "Alter Eco", productName: "Alter Eco Dark Chocolate", searchQuery: "Alter Eco dark chocolate", certifications: ["b_corp", "fair_trade", "organic"], strengths: ["B Corp + Fairtrade", "Regenerative, carbon-neutral cocoa"], addresses: ["labor", "eco"], markets: ["US", "CA", "AU", "GB"], fallbackEcoGrade: "b" },
    { brand: "Divine Chocolate", productName: "Divine Milk Chocolate", searchQuery: "Divine chocolate", certifications: ["fair_trade"], strengths: ["Co-owned by Ghanaian cocoa farmers", "Fairtrade certified"], addresses: ["labor"], markets: ["GB", "IE", "US"], fallbackEcoGrade: "c" },
    { brand: "Equal Exchange", productName: "Equal Exchange Organic Chocolate", searchQuery: "Equal Exchange organic chocolate", certifications: ["fair_trade", "organic", "worker_coop"], strengths: ["Worker co-op owned", "Audited fair-trade supply chain"], addresses: ["labor", "eco"], markets: US_CA, fallbackEcoGrade: "b" },
    { brand: "Green & Black's", productName: "Green & Black's Organic", searchQuery: "Green & Black's organic chocolate", certifications: ["fair_trade", "organic"], strengths: ["Organic", "Fairtrade Maya Gold line"], addresses: ["labor", "eco"], markets: [...UK, ...EU, "AU"], fallbackEcoGrade: "c" },
  ],

  candy: [
    { brand: "YumEarth", productName: "YumEarth Organic Gummies", searchQuery: "YumEarth organic", certifications: ["fair_trade", "organic"], strengths: ["Organic, allergy-friendly", "No artificial dyes"], addresses: ["labor", "eco"], markets: ANGLO, fallbackEcoGrade: "c" },
    { brand: "Candy Kittens", productName: "Candy Kittens Gourmet Sweets", searchQuery: "Candy Kittens", certifications: [], strengths: ["Palm-oil free, vegan", "Plastic-neutral certified"], addresses: ["eco", "animal_welfare"], markets: UK, fallbackEcoGrade: "c" },
    { brand: "Goody Good Stuff", productName: "Goody Good Stuff Gummies", searchQuery: "Goody Good Stuff", certifications: [], strengths: ["Gelatin-free, vegetarian", "Natural colours & flavours"], addresses: ["animal_welfare", "eco"], markets: UK_EU, fallbackEcoGrade: "c" },
    { brand: "Surf Sweets", productName: "Surf Sweets Organic Gummies", searchQuery: "Surf Sweets organic", certifications: ["organic"], strengths: ["USDA organic", "No high-fructose corn syrup"], addresses: ["eco", "labor"], markets: US_CA, fallbackEcoGrade: "c" },
    { brand: "Biona Organic", productName: "Biona Organic Sweets", searchQuery: "Biona organic sweets", certifications: ["organic"], strengths: ["Certified organic", "Vegan options"], addresses: ["eco"], markets: UK_EU, fallbackEcoGrade: "b" },
  ],

  chips: [
    { brand: "LesserEvil", productName: "LesserEvil Organic Popcorn & Puffs", searchQuery: "LesserEvil organic", certifications: ["b_corp", "organic"], strengths: ["B Corp", "Organic, coconut-oil cooked"], addresses: ["labor", "eco"], markets: US_CA, fallbackEcoGrade: "b" },
    { brand: "Late July", productName: "Late July Organic Tortilla Chips", searchQuery: "Late July organic tortilla", certifications: ["fair_trade", "organic"], strengths: ["Organic & non-GMO", "Fair-trade corn"], addresses: ["labor", "eco"], markets: US_CA, fallbackEcoGrade: "b" },
    { brand: "Two Farmers", productName: "Two Farmers Crisps", searchQuery: "Two Farmers crisps", certifications: [], strengths: ["Home-compostable packaging", "British-grown, single farm"], addresses: ["eco"], markets: UK, fallbackEcoGrade: "b" },
    { brand: "Siete", productName: "Siete Grain-Free Chips", searchQuery: "Siete chips", certifications: [], strengths: ["Avocado-oil cooked", "Family-owned, no palm oil"], addresses: ["labor", "eco"], markets: US_CA, fallbackEcoGrade: "c" },
    { brand: "Pipers Crisps", productName: "Pipers Crisps", searchQuery: "Pipers crisps", certifications: [], strengths: ["Single-source British potatoes", "Sunflower oil, no palm"], addresses: ["labor", "eco"], markets: UK_EU, fallbackEcoGrade: "c" },
  ],

  cookies: [
    { brand: "Late July", productName: "Late July Organic Sandwich Cookies", searchQuery: "Late July sandwich cookies", certifications: ["fair_trade", "organic"], strengths: ["Organic, Fairtrade cocoa & sugar", "Non-GMO"], addresses: ["labor", "eco"], markets: US_CA, fallbackEcoGrade: "c" },
    { brand: "Doves Farm", productName: "Doves Farm Organic Biscuits", searchQuery: "Doves Farm organic", certifications: ["organic"], strengths: ["Certified organic", "Free-from range"], addresses: ["eco"], markets: UK_EU, fallbackEcoGrade: "b" },
    { brand: "Biona Organic", productName: "Biona Organic Cookies", searchQuery: "Biona organic biscuits", certifications: ["organic"], strengths: ["Organic, palm-oil free", "Vegan options"], addresses: ["labor", "eco"], markets: UK_EU, fallbackEcoGrade: "b" },
    { brand: "Nature's Path", productName: "Nature's Path Organic Cookies", searchQuery: "Nature's Path cookies", certifications: ["b_corp", "organic"], strengths: ["B Corp", "Organic, non-GMO"], addresses: ["labor", "eco"], markets: [...ANGLO], fallbackEcoGrade: "b" },
  ],

  spreads: [
    { brand: "Nocciolata", productName: "Rigoni Nocciolata Organic Hazelnut Spread", searchQuery: "Nocciolata organic hazelnut", certifications: ["fair_trade", "organic"], strengths: ["Organic, Fairtrade cocoa", "Palm-oil free Nutella alternative"], addresses: ["labor", "eco"], markets: [...UK, ...EU, "US"], fallbackEcoGrade: "c" },
    { brand: "Pip & Nut", productName: "Pip & Nut Nut Butter", searchQuery: "Pip & Nut", certifications: [], strengths: ["Palm-oil free", "Plastic-neutral, sustainable sourcing"], addresses: ["labor", "eco"], markets: UK, fallbackEcoGrade: "b" },
    { brand: "Once Again", productName: "Once Again Nut Butter", searchQuery: "Once Again nut butter", certifications: ["fair_trade", "organic", "worker_coop"], strengths: ["Worker-owned co-op", "Fairtrade & organic"], addresses: ["labor", "eco"], markets: US_CA, fallbackEcoGrade: "b" },
    { brand: "Whole Earth", productName: "Whole Earth Peanut Butter", searchQuery: "Whole Earth peanut butter", certifications: ["organic"], strengths: ["Organic, palm-oil free", "No added sugar"], addresses: ["eco"], markets: UK_EU, fallbackEcoGrade: "b" },
  ],

  snack_bars: [
    { brand: "Clif Bar", productName: "Clif Bar Energy Bar", searchQuery: "Clif Bar", certifications: ["fair_trade", "organic"], strengths: ["Organic, Fairtrade ingredients", "Climate-action commitments"], addresses: ["labor", "eco"], markets: [...ANGLO], fallbackEcoGrade: "c" },
    { brand: "Nakd", productName: "Nakd Fruit & Nut Bar", searchQuery: "Nakd bar", certifications: [], strengths: ["Whole-food, no refined sugar", "Low-footprint ingredients"], addresses: ["eco"], markets: UK_EU, fallbackEcoGrade: "b" },
    { brand: "Eat Natural", productName: "Eat Natural Bar", searchQuery: "Eat Natural bar", certifications: ["fair_trade"], strengths: ["Fairtrade dark chocolate range", "Simple whole ingredients"], addresses: ["labor"], markets: UK_EU, fallbackEcoGrade: "c" },
    { brand: "88 Acres", productName: "88 Acres Seed Bar", searchQuery: "88 Acres bar", certifications: [], strengths: ["Allergen-friendly, own bakery", "Carbon-neutral facility"], addresses: ["eco", "labor"], markets: US_CA, fallbackEcoGrade: "b" },
  ],

  cereal: [
    { brand: "Nature's Path", productName: "Nature's Path Organic Cereal", searchQuery: "Nature's Path organic cereal", certifications: ["b_corp", "organic"], strengths: ["B Corp", "Organic, non-GMO grains"], addresses: ["labor", "eco"], markets: [...ANGLO], fallbackEcoGrade: "b" },
    { brand: "Purely Elizabeth", productName: "Purely Elizabeth Granola", searchQuery: "Purely Elizabeth granola", certifications: ["b_corp", "organic"], strengths: ["B Corp", "Organic ancient grains"], addresses: ["labor", "eco"], markets: US_CA, fallbackEcoGrade: "b" },
    { brand: "Alara", productName: "Alara Organic Muesli", searchQuery: "Alara organic muesli", certifications: ["organic"], strengths: ["Zero-waste, organic", "Carbon-neutral London mill"], addresses: ["eco"], markets: UK_EU, fallbackEcoGrade: "a" },
    { brand: "Doves Farm", productName: "Doves Farm Organic Cereal", searchQuery: "Doves Farm organic cereal", certifications: ["organic"], strengths: ["Certified organic", "Free-from range"], addresses: ["eco"], markets: UK_EU, fallbackEcoGrade: "b" },
  ],

  coffee: [
    { brand: "Cafédirect", productName: "Cafédirect Fairtrade Coffee", searchQuery: "Cafedirect fairtrade coffee", certifications: ["fair_trade"], strengths: ["Fairtrade pioneer", "Reinvests profits into grower co-ops"], addresses: ["labor"], markets: UK, fallbackEcoGrade: "c" },
    { brand: "Grumpy Mule", productName: "Grumpy Mule Fairtrade Coffee", searchQuery: "Grumpy Mule coffee", certifications: ["fair_trade", "organic"], strengths: ["Fairtrade & organic", "Direct grower relationships"], addresses: ["labor"], markets: UK_EU, fallbackEcoGrade: "c" },
    { brand: "Grounds for Change", productName: "Grounds for Change Organic Coffee", searchQuery: "Grounds for Change coffee", certifications: ["fair_trade", "organic", "climate_neutral"], strengths: ["Organic + Fairtrade", "Carbon-free roasting"], addresses: ["labor", "eco"], markets: US_CA, fallbackEcoGrade: "b" },
    { brand: "Equal Exchange", productName: "Equal Exchange Organic Coffee", searchQuery: "Equal Exchange organic coffee", certifications: ["fair_trade", "organic", "worker_coop"], strengths: ["Worker co-op owned", "Direct relationships with farmer co-ops"], addresses: ["labor", "eco"], markets: US_CA, fallbackEcoGrade: "b" },
  ],

  tea: [
    { brand: "Clipper Teas", productName: "Clipper Organic Fairtrade Tea", searchQuery: "Clipper organic fairtrade tea", certifications: ["fair_trade", "organic"], strengths: ["Fairtrade + organic", "Unbleached, plastic-free bags"], addresses: ["labor", "eco"], markets: UK_EU, fallbackEcoGrade: "b" },
    { brand: "Pukka Herbs", productName: "Pukka Organic Tea", searchQuery: "Pukka organic tea", certifications: ["fair_trade", "organic", "b_corp"], strengths: ["B Corp", "Fair for Life certified herbs"], addresses: ["labor", "eco"], markets: BROAD, fallbackEcoGrade: "b" },
    { brand: "Numi Organic Tea", productName: "Numi Organic Tea", searchQuery: "Numi organic tea", certifications: ["organic", "fair_trade"], strengths: ["Certified organic", "Fairtrade blends, plastic-free"], addresses: ["labor", "eco"], markets: [...ANGLO], fallbackEcoGrade: "b" },
  ],

  soft_drinks: [
    { brand: "Karma Drinks", productName: "Karma Cola Fairtrade", searchQuery: "Karma Cola fairtrade", certifications: ["fair_trade", "organic"], strengths: ["Fairtrade cola nuts", "Funds grower communities"], addresses: ["labor", "boycott"], markets: UK_EU, fallbackEcoGrade: "c" },
    { brand: "Lemonaid", productName: "Lemonaid Fairtrade Soft Drink", searchQuery: "Lemonaid fairtrade", certifications: ["fair_trade", "organic"], strengths: ["Fairtrade sourced", "Profits fund social projects"], addresses: ["labor", "boycott"], markets: UK_EU, fallbackEcoGrade: "c" },
    { brand: "OLIPOP", productName: "OLIPOP Prebiotic Soda", searchQuery: "Olipop prebiotic soda", certifications: ["b_corp"], strengths: ["B Corp", "Low-sugar, function-first"], addresses: ["boycott", "eco"], markets: US_CA, fallbackEcoGrade: "c" },
  ],

  milk: [
    { brand: "Oatly", productName: "Oatly Oat Drink", searchQuery: "Oatly oat drink", certifications: [], strengths: ["Plant-based — no animal-welfare footprint", "Far lower CO₂ than dairy"], addresses: ["animal_welfare", "eco"], fallbackEcoGrade: "a" },
    { brand: "Minor Figures", productName: "Minor Figures Oat Milk", searchQuery: "Minor Figures oat", certifications: ["b_corp"], strengths: ["B Corp, carbon-neutral", "Plant-based"], addresses: ["animal_welfare", "eco"], markets: [...UK, ...EU, "US"], fallbackEcoGrade: "a" },
    { brand: "Organic Valley", productName: "Organic Valley Milk", searchQuery: "Organic Valley milk", certifications: ["organic"], strengths: ["Farmer co-op owned", "Organic, pasture-raised"], addresses: ["animal_welfare", "labor"], markets: US_CA, fallbackEcoGrade: "c" },
    { brand: "Rude Health", productName: "Rude Health Oat Drink", searchQuery: "Rude Health oat drink", certifications: ["organic"], strengths: ["Organic plant milks", "No gums or oils"], addresses: ["animal_welfare", "eco"], markets: UK_EU, fallbackEcoGrade: "a" },
  ],

  yogurt: [
    { brand: "Stonyfield Organic", productName: "Stonyfield Organic Yogurt", searchQuery: "Stonyfield organic yogurt", certifications: ["b_corp", "organic"], strengths: ["B Corp", "Organic dairy, no synthetic inputs"], addresses: ["animal_welfare", "eco"], markets: US_CA, fallbackEcoGrade: "c" },
    { brand: "The Coconut Collaborative", productName: "Coconut Collaborative Dairy-Free Yogurt", searchQuery: "Coconut Collaborative", certifications: [], strengths: ["Dairy-free", "No animal-welfare footprint"], addresses: ["animal_welfare", "eco"], markets: UK_EU, fallbackEcoGrade: "b" },
    { brand: "Alpro", productName: "Alpro Plant Yogurt", searchQuery: "Alpro yogurt", certifications: [], strengths: ["Plant-based", "Lower-carbon than dairy"], addresses: ["animal_welfare", "eco"], markets: UK_EU, fallbackEcoGrade: "b" },
    { brand: "Brown Cow", productName: "Brown Cow Cream Top Yogurt", searchQuery: "Brown Cow yogurt", certifications: ["organic"], strengths: ["Organic options", "No artificial growth hormones"], addresses: ["animal_welfare"], markets: US_CA, fallbackEcoGrade: "c" },
  ],

  cheese: [
    { brand: "Cabot Creamery", productName: "Cabot Creamery Cheese", searchQuery: "Cabot Creamery cheese", certifications: ["b_corp", "worker_coop"], strengths: ["Farmer co-op owned", "B Corp"], addresses: ["labor", "animal_welfare"], markets: US_CA, fallbackEcoGrade: "c" },
    { brand: "Organic Valley", productName: "Organic Valley Cheese", searchQuery: "Organic Valley cheese", certifications: ["organic"], strengths: ["Farmer co-op owned", "Organic, pasture-raised"], addresses: ["animal_welfare", "labor"], markets: US_CA, fallbackEcoGrade: "c" },
    { brand: "Violife", productName: "Violife Vegan Cheese", searchQuery: "Violife vegan cheese", certifications: [], strengths: ["Plant-based", "No animal-welfare footprint"], addresses: ["animal_welfare", "eco"], fallbackEcoGrade: "b" },
    { brand: "Bute Island Sheese", productName: "Bute Island Sheese", searchQuery: "Bute Island Sheese", certifications: [], strengths: ["Dairy-free, Scottish-made", "Lower-carbon than dairy"], addresses: ["animal_welfare", "eco"], markets: UK_EU, fallbackEcoGrade: "b" },
  ],

  ice_cream: [
    { brand: "Ben & Jerry's", productName: "Ben & Jerry's Fairtrade Ice Cream", searchQuery: "Ben & Jerry's", certifications: ["b_corp", "fair_trade"], strengths: ["B Corp", "Fairtrade cocoa, sugar & vanilla"], addresses: ["labor"], markets: BROAD, fallbackEcoGrade: "d" },
    { brand: "Booja-Booja", productName: "Booja-Booja Organic Ice Cream", searchQuery: "Booja-Booja", certifications: ["organic"], strengths: ["Organic, dairy-free", "No animal-welfare footprint"], addresses: ["animal_welfare", "eco"], markets: UK_EU, fallbackEcoGrade: "c" },
    { brand: "Jeni's", productName: "Jeni's Splendid Ice Creams", searchQuery: "Jeni's ice cream", certifications: ["b_corp", "direct_trade"], strengths: ["B Corp", "Direct-trade ingredients"], addresses: ["labor"], markets: US_CA, fallbackEcoGrade: "d" },
    { brand: "Northern Bloc", productName: "Northern Bloc Ice Cream", searchQuery: "Northern Bloc ice cream", certifications: [], strengths: ["Carbon-neutral, plastic-free", "Natural ingredients"], addresses: ["eco"], markets: UK, fallbackEcoGrade: "c" },
  ],

  eggs: [
    { brand: "Vital Farms", productName: "Vital Farms Pasture-Raised Eggs", searchQuery: "Vital Farms eggs", certifications: ["certified_humane"], strengths: ["Certified Humane, pasture-raised", "Farm-level transparency"], addresses: ["animal_welfare"], markets: US_CA, fallbackEcoGrade: "b" },
    { brand: "Pete & Gerry's", productName: "Pete & Gerry's Organic Eggs", searchQuery: "Pete and Gerry's organic eggs", certifications: ["b_corp", "certified_humane", "organic"], strengths: ["B Corp + Certified Humane", "Small family-farm network"], addresses: ["animal_welfare", "labor"], markets: US_CA, fallbackEcoGrade: "b" },
    { brand: "Clarence Court", productName: "Clarence Court Free-Range Eggs", searchQuery: "Clarence Court eggs", certifications: [], strengths: ["Free-range, higher-welfare breeds", "RSPCA-aligned"], addresses: ["animal_welfare"], markets: UK, fallbackEcoGrade: "b" },
    { brand: "The Happy Egg Co", productName: "Happy Egg Free-Range Eggs", searchQuery: "Happy Egg free range", certifications: [], strengths: ["Free-range", "Higher welfare standards"], addresses: ["animal_welfare"], markets: UK, fallbackEcoGrade: "b" },
  ],

  seafood: [
    { brand: "Wild Planet", productName: "Wild Planet Sustainable Tuna", searchQuery: "Wild Planet tuna", certifications: ["msc"], strengths: ["Pole-and-line caught", "MSC-aligned sourcing"], addresses: ["labor", "eco"], markets: [...ANGLO], fallbackEcoGrade: "b" },
    { brand: "Fish 4 Ever", productName: "Fish 4 Ever Sustainable Fish", searchQuery: "Fish 4 Ever", certifications: ["msc", "organic"], strengths: ["MSC certified", "Traceable, small-scale fisheries"], addresses: ["labor", "eco"], markets: UK_EU, fallbackEcoGrade: "b" },
    { brand: "Ocean Naturals", productName: "Ocean Naturals Tuna", searchQuery: "Ocean Naturals tuna", certifications: ["msc"], strengths: ["Traceable, sustainably caught", "Supports fishery improvement"], addresses: ["labor", "eco"], markets: US_CA, fallbackEcoGrade: "b" },
  ],

  bananas: [
    { brand: "Equal Exchange", productName: "Equal Exchange Fairtrade Bananas", searchQuery: "Equal Exchange bananas", certifications: ["fair_trade", "organic", "worker_coop"], strengths: ["Fairtrade + organic", "Small-farmer co-ops"], addresses: ["labor", "eco"], markets: US_CA, fallbackEcoGrade: "b" },
    { brand: "Organics Unlimited", productName: "Organics Unlimited GROW Bananas", searchQuery: "Organics Unlimited bananas", certifications: ["fair_trade", "organic"], strengths: ["Fairtrade", "Funds worker-community programs"], addresses: ["labor"], markets: US_CA, fallbackEcoGrade: "b" },
    { brand: "Fairtrade Bananas", productName: "Fairtrade Organic Bananas", searchQuery: "fairtrade organic bananas", certifications: ["fair_trade", "organic"], strengths: ["Fairtrade certified", "Guaranteed minimum grower price"], addresses: ["labor", "eco"], markets: UK_EU, fallbackEcoGrade: "b" },
  ],
};

// ── Category detection ───────────────────────────────────────────────────────

// Keyword → category. First match wins; order matters (specific before broad).
// Each pattern blends generic terms with iconic brand/product names so a scan
// resolves even when Open Food Facts' category tags are sparse (e.g. a "Kit
// Kat" whose only name is the brand still maps to chocolate).
const CATEGORY_KEYWORDS: { key: SwapCategoryKey; patterns: RegExp }[] = [
  { key: "ice_cream", patterns: /ice.?cream|gelato|frozen.?dessert|frozen.?yog|magnum|cornetto|häagen|haagen|ben\s*&?\s*jerry/i },
  { key: "chocolate", patterns: /chocolat|cocoa|cacao|praline|truffle|chocolate.?bar|kit\s*kat|snickers|twix|mars\s*bar|bounty\b|milky\s*way|toblerone|lindt|lindor|ferrero|kinder|hershey|reese|aero\b|wispa|galaxy\b|dairy\s*milk|smarties|\bm&m|cadbury|milka|ritter|godiva|ghirardelli/i },
  { key: "spreads", patterns: /nutella|hazelnut.?spread|chocolate.?spread|peanut.?butter|nut.?butter|almond.?butter|cashew.?butter|\bspread\b|\bjam\b|marmalade|preserve|\bjif\b|skippy|sun.?pat/i },
  { key: "snack_bars", patterns: /(?:granola|cereal|protein|energy|fruit|nut|muesli|snack)\s*bars?\b|flapjack|clif\s*bar|kind\s*bar|nature\s*valley/i },
  { key: "cookies", patterns: /cookie|biscuit|shortbread|digestive|oreo|wafer|cracker|hobnob|mcvitie|chips\s*ahoy/i },
  { key: "candy", patterns: /gumm|\bsweets?\b|\bcandy\b|jelly.?bean|jellies|licorice|liquorice|marshmallow|lollipop|hard.?candy|sour.?candy|skittles|starburst|haribo|wine.?gum|fruit.?pastille|toffee|fudge|twizzler|airhead|trolli|sour\s*patch|nerds\b/i },
  { key: "chips", patterns: /crisps?|potato.?chip|tortilla.?chip|\bchips\b|nachos|pretzel|popcorn|puffs|corn.?chip|savou?ry.?snack|lay'?s|doritos|pringles|cheetos|ruffles|walkers\b|tostitos|fritos|takis|sun\s*chips/i },
  { key: "coffee", patterns: /coffee|espresso|\bcafé\b|\bcafe\b|ground.?coffee|coffee.?bean|nescaf|nespresso|folgers|maxwell\s*house|lavazza|\billy\b|starbucks/i },
  { key: "tea", patterns: /\btea\b|tea.?bag|chai|matcha|herbal.?infusion|rooibos|lipton|tetley|twinings|pg\s*tips|yorkshire\s*tea/i },
  { key: "soft_drinks", patterns: /soda|cola\b|soft.?drink|carbonated|lemonade|energy.?drink|fizzy|coca.?cola|\bcoke\b|pepsi|sprite|fanta|mountain\s*dew|dr\s*pepper|7.?up|mirinda|schweppes|gatorade|powerade/i },
  { key: "yogurt", patterns: /yogh?urt|yoghourt|skyr|kefir/i },
  { key: "cheese", patterns: /\bcheese\b|cheddar|mozzarella|parmesan|\bbrie\b|gouda|halloumi/i },
  { key: "milk", patterns: /oat.?milk|almond.?milk|soy.?milk|soya.?milk|plant.?milk|coconut.?milk|\bmilk\b|oat.?drink|plant.?based.?drink|alpro|oatly/i },
  { key: "eggs", patterns: /\beggs?\b/i },
  { key: "cereal", patterns: /cereal|granola|muesli|breakfast.?cereal|porridge|oatmeal|cornflake|\boats\b|kellogg|cheerios|weetabix|special\s*k|frosties|froot\s*loops/i },
  { key: "seafood", patterns: /tuna|salmon|seafood|\bfish\b|sardine|mackerel|shrimp|prawn|anchov/i },
  { key: "bananas", patterns: /banana/i },
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

/** All valid category keys — used to validate hand-added customSwaps entries. */
export const SWAP_CATEGORY_KEYS = Object.keys(ETHICAL_ALTERNATIVES) as SwapCategoryKey[];

export function isSwapCategory(value: string): value is SwapCategoryKey {
  return (SWAP_CATEGORY_KEYS as string[]).includes(value);
}

export function getCandidates(category: SwapCategoryKey): AltCandidate[] {
  return ETHICAL_ALTERNATIVES[category] ?? [];
}

/** Is this candidate sold in the given country? Unknown markets = assume yes. */
export function isInMarket(candidate: AltCandidate, countryCode: string | null | undefined): boolean {
  if (!countryCode) return true;
  if (!candidate.markets || candidate.markets.length === 0) return true;
  return candidate.markets.includes(countryCode.toUpperCase());
}
