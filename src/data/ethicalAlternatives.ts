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
  | "chicken"
  | "bananas"
  | "beef"
  | "sugar"
  | "palm_oil"
  | "soy";

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
  chicken: "chicken & poultry",
  bananas: "bananas",
  beef: "beef",
  sugar: "sugar",
  palm_oil: "palm oil products",
  soy: "soy products",
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
    { brand: "Alter Eco", productName: "Alter Eco Dark Chocolate", searchQuery: "Alter Eco dark chocolate", certifications: ["b_corp", "fair_trade", "organic"], strengths: ["B Corp + Fairtrade", "Regenerative, carbon-neutral cocoa", "Dark, dairy-free — no dairy-welfare footprint"], addresses: ["labor", "eco", "animal_welfare"], markets: ["US", "CA", "AU", "GB"], fallbackEcoGrade: "b" },
    { brand: "Divine Chocolate", productName: "Divine Milk Chocolate", searchQuery: "Divine chocolate", certifications: ["fair_trade"], strengths: ["Co-owned by Ghanaian cocoa farmers", "Fairtrade certified"], addresses: ["labor"], markets: ["GB", "IE", "US"], fallbackEcoGrade: "c" },
    { brand: "Equal Exchange", productName: "Equal Exchange Organic Chocolate", searchQuery: "Equal Exchange organic chocolate", certifications: ["fair_trade", "organic", "worker_coop"], strengths: ["Worker co-op owned", "Audited fair-trade supply chain", "Vegan dark range — no dairy-welfare footprint"], addresses: ["labor", "eco", "animal_welfare"], markets: US_CA, fallbackEcoGrade: "b" },
    { brand: "Green & Black's", productName: "Green & Black's Organic", searchQuery: "Green & Black's organic chocolate", certifications: ["fair_trade", "organic"], strengths: ["Organic", "Fairtrade Maya Gold line"], addresses: ["labor", "eco"], markets: [...UK, ...EU, "AU"], fallbackEcoGrade: "c" },
    { brand: "Beyond Good", productName: "Beyond Good Chocolate", searchQuery: "Beyond Good chocolate", certifications: ["direct_trade"], strengths: ["Direct relationship — farmers earn ~6x industry standard", "2025 'Good Egg' award from Chocolate Scorecard"], addresses: ["labor"], markets: US_CA, fallbackEcoGrade: "c" },
    { brand: "Fairafric", productName: "Fairafric Chocolate", searchQuery: "Fairafric chocolate", certifications: ["fair_trade", "organic"], strengths: ["Bean-to-bar made IN Ghana", "Keeps manufacturing jobs in the producing country"], addresses: ["labor"], markets: UK_EU, fallbackEcoGrade: "c" },
    { brand: "Theo Chocolate", productName: "Theo Organic Fair Trade Chocolate", searchQuery: "Theo chocolate organic", certifications: ["fair_trade", "organic"], strengths: ["Transparency-focused bean-to-bar maker", "Fairtrade & organic", "Vegan dark bars — no dairy-welfare footprint"], addresses: ["labor", "eco", "animal_welfare"], markets: US_CA, fallbackEcoGrade: "c" },
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
    { brand: "Biona Organic", productName: "Biona Organic Cookies", searchQuery: "Biona organic biscuits", certifications: ["organic"], strengths: ["Organic, palm-oil free", "Vegan options — no animal-welfare footprint"], addresses: ["labor", "eco", "animal_welfare"], markets: UK_EU, fallbackEcoGrade: "b" },
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
    { brand: "Nakd", productName: "Nakd Fruit & Nut Bar", searchQuery: "Nakd bar", certifications: [], strengths: ["Whole-food, no refined sugar", "Low-footprint ingredients", "Vegan — no animal-welfare footprint"], addresses: ["eco", "animal_welfare"], markets: UK_EU, fallbackEcoGrade: "b" },
    { brand: "Eat Natural", productName: "Eat Natural Bar", searchQuery: "Eat Natural bar", certifications: ["fair_trade"], strengths: ["Fairtrade dark chocolate range", "Simple whole ingredients"], addresses: ["labor"], markets: UK_EU, fallbackEcoGrade: "c" },
    { brand: "88 Acres", productName: "88 Acres Seed Bar", searchQuery: "88 Acres bar", certifications: [], strengths: ["Allergen-friendly, own bakery", "Carbon-neutral facility", "Vegan seed bars — no animal-welfare footprint"], addresses: ["eco", "labor", "animal_welfare"], markets: US_CA, fallbackEcoGrade: "b" },
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
    { brand: "Birds & Beans", productName: "Birds & Beans Smithsonian Bird Friendly Coffee", searchQuery: "Birds Beans bird friendly coffee", certifications: ["organic"], strengths: ["Smithsonian Bird Friendly certified", "Shade-grown, pesticide-free, protects bird habitat"], addresses: ["eco", "labor"], markets: US_CA, fallbackEcoGrade: "b" },
    { brand: "Counter Culture", productName: "Counter Culture Coffee", searchQuery: "Counter Culture coffee", certifications: ["fair_trade", "organic"], strengths: ["Direct-trade specialty roaster", "Published sourcing & prices paid"], addresses: ["labor"], markets: US_CA, fallbackEcoGrade: "c" },
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
    { brand: "Stonyfield Organic", productName: "Stonyfield Organic Yogurt", searchQuery: "Stonyfield organic yogurt", certifications: ["b_corp", "organic"], strengths: ["B Corp — audited labour & sourcing standards", "Organic dairy, no synthetic inputs"], addresses: ["animal_welfare", "eco", "labor"], markets: US_CA, fallbackEcoGrade: "c" },
    { brand: "Organic Valley", productName: "Organic Valley Grassmilk Yogurt", searchQuery: "Organic Valley yogurt", certifications: ["organic"], strengths: ["Farmer co-op owned — fair farmer pay", "Organic, pasture-raised"], addresses: ["animal_welfare", "labor", "eco"], markets: US_CA, fallbackEcoGrade: "c" },
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
    { brand: "Loué", productName: "Loué Œufs Plein Air Label Rouge", searchQuery: "Loué oeufs plein air", certifications: [], strengths: ["Label Rouge free-range — audited higher welfare", "Slower-growing hens, outdoor access"], addresses: ["animal_welfare"], markets: ["FR", "BE", "CH"], fallbackEcoGrade: "b" },
    { brand: "Kipster", productName: "Kipster Carbon-Neutral Eggs", searchQuery: "Kipster eggs", certifications: [], strengths: ["World's first carbon-neutral egg farm", "Higher welfare, no male-chick culling"], addresses: ["animal_welfare", "eco"], markets: ["NL", "BE", "DE"], fallbackEcoGrade: "a" },
  ],

  seafood: [
    { brand: "Wild Planet", productName: "Wild Planet Sustainable Tuna", searchQuery: "Wild Planet tuna", certifications: ["msc"], strengths: ["Pole-and-line caught", "MSC-aligned sourcing"], addresses: ["labor", "eco"], markets: [...ANGLO], fallbackEcoGrade: "b" },
    { brand: "Safe Catch", productName: "Safe Catch Wild Tuna", searchQuery: "Safe Catch tuna", certifications: [], strengths: ["Pole-&-line / troll albacore", "Tests every fish for mercury"], addresses: ["labor", "eco"], markets: US_CA, fallbackEcoGrade: "b" },
    { brand: "Fish 4 Ever", productName: "Fish 4 Ever Sustainable Fish", searchQuery: "Fish 4 Ever", certifications: ["msc", "organic"], strengths: ["MSC certified", "Traceable, small-scale fisheries"], addresses: ["labor", "eco"], markets: UK_EU, fallbackEcoGrade: "b" },
    { brand: "Patagonia Provisions", productName: "Patagonia Provisions Seafood", searchQuery: "Patagonia Provisions seafood", certifications: [], strengths: ["Mission-driven, selective gear", "Responsible sourcing tied to ocean health"], addresses: ["eco", "labor"], markets: US_CA, fallbackEcoGrade: "b" },
    { brand: "Ocean Naturals", productName: "Ocean Naturals Tuna", searchQuery: "Ocean Naturals tuna", certifications: ["msc"], strengths: ["Traceable, sustainably caught", "Supports fishery improvement"], addresses: ["labor", "eco"], markets: US_CA, fallbackEcoGrade: "b" },
  ],

  chicken: [
    // Plant-based substitutes — biggest welfare + carbon win over factory poultry
    { brand: "Quorn", productName: "Quorn Meat-Free Pieces", searchQuery: "Quorn pieces", certifications: ["climate_neutral"], strengths: ["Mycoprotein — no factory-farmed birds", "Carbon Trust footprint-certified, far lower GHG"], addresses: ["animal_welfare", "eco"], markets: [...UK, ...EU, "US", "CA", "AU"], fallbackEcoGrade: "b" },
    { brand: "Tofurky", productName: "Tofurky Plant-Based Chick'n", searchQuery: "Tofurky chick'n", certifications: ["b_corp", "organic"], strengths: ["B Corp, plant-based", "No animal-welfare footprint"], addresses: ["animal_welfare", "eco"], markets: ANGLO, fallbackEcoGrade: "b" },
    { brand: "Gardein", productName: "Gardein Chick'n Strips", searchQuery: "Gardein chicken", certifications: [], strengths: ["Plant-based chicken alternative", "~75% less GHG than poultry"], addresses: ["animal_welfare", "eco"], markets: US_CA, fallbackEcoGrade: "b" },
    { brand: "The Vegetarian Butcher", productName: "The Vegetarian Butcher Chicken Pieces", searchQuery: "Vegetarian Butcher chicken", certifications: [], strengths: ["Plant-based poultry", "Widely stocked in UK & EU"], addresses: ["animal_welfare", "eco"], markets: UK_EU, fallbackEcoGrade: "b" },
    { brand: "Impossible Foods", productName: "Impossible Chicken Nuggets", searchQuery: "Impossible chicken nuggets", certifications: [], strengths: ["Plant-based nuggets", "No factory-farmed birds"], addresses: ["animal_welfare", "eco"], markets: [...ANGLO], fallbackEcoGrade: "b" },
    // Higher-welfare real poultry
    { brand: "Bell & Evans", productName: "Bell & Evans Organic Chicken", searchQuery: "Bell Evans organic chicken", certifications: ["organic", "certified_humane"], strengths: ["Air-chilled, organic, no antibiotics", "Higher-welfare US poultry standard"], addresses: ["animal_welfare"], markets: ["US"], fallbackEcoGrade: "d" },
    { brand: "Mary's", productName: "Mary's Free-Range Air-Chilled Chicken", searchQuery: "Mary's free range chicken", certifications: ["certified_humane"], strengths: ["GAP-rated free-range / pasture-raised lines", "No antibiotics, family farms"], addresses: ["animal_welfare"], markets: ["US"], fallbackEcoGrade: "d" },
    { brand: "Sutton Hoo", productName: "Sutton Hoo Free-Range Chicken", searchQuery: "Sutton Hoo chicken", certifications: [], strengths: ["RSPCA-aligned free-range", "Slower-growing higher-welfare breeds"], addresses: ["animal_welfare"], markets: UK, fallbackEcoGrade: "d" },
  ],

  bananas: [
    { brand: "Equal Exchange", productName: "Equal Exchange Fairtrade Bananas", searchQuery: "Equal Exchange bananas", certifications: ["fair_trade", "organic", "worker_coop"], strengths: ["Fairtrade + organic", "Small-farmer co-ops"], addresses: ["labor", "eco"], markets: US_CA, fallbackEcoGrade: "b" },
    { brand: "Organics Unlimited", productName: "Organics Unlimited GROW Bananas", searchQuery: "Organics Unlimited bananas", certifications: ["fair_trade", "organic"], strengths: ["Fairtrade", "Funds worker-community programs"], addresses: ["labor"], markets: US_CA, fallbackEcoGrade: "b" },
    { brand: "Fairtrade Bananas", productName: "Fairtrade Organic Bananas", searchQuery: "fairtrade organic bananas", certifications: ["fair_trade", "organic"], strengths: ["Fairtrade certified", "Guaranteed minimum grower price"], addresses: ["labor", "eco"], markets: UK_EU, fallbackEcoGrade: "b" },
  ],

  beef: [
    // Ethical real-beef brands
    { brand: "White Oak Pastures", productName: "White Oak Pastures Grass-Fed Beef", searchQuery: "White Oak Pastures beef", certifications: ["organic", "certified_humane"], strengths: ["Regenerative farm, 100% grass-fed", "2018 LCA found carbon-negative claim"], addresses: ["animal_welfare", "eco"], markets: ["US"], fallbackEcoGrade: "c" },
    { brand: "Niman Ranch", productName: "Niman Ranch Beef", searchQuery: "Niman Ranch beef", certifications: ["certified_humane"], strengths: ["Network of 600+ independent US family farms paid fair, guaranteed prices", "Certified Humane; no antibiotics or added hormones"], addresses: ["animal_welfare", "labor"], markets: ["US"], fallbackEcoGrade: "c" },
    { brand: "Thousand Hills", productName: "Thousand Hills Lifetime Grazed Beef", searchQuery: "Thousand Hills beef", certifications: [], strengths: ["100% grass-fed/finished, no grain ever", "Network of family farms, Land to Market EOV"], addresses: ["animal_welfare", "eco"], markets: ["US"], fallbackEcoGrade: "c" },
    { brand: "Force of Nature", productName: "Force of Nature Regenerative Beef", searchQuery: "Force of Nature beef", certifications: [], strengths: ["100% grass-fed, regenerative, multi-species", "Some products carry Land to Market seal"], addresses: ["animal_welfare", "eco"], markets: ["US"], fallbackEcoGrade: "c" },
    { brand: "Pasture for Life", productName: "Pasture for Life Certified Beef", searchQuery: "Pasture for Life beef", certifications: [], strengths: ["Only UK mark for 100% pasture-fed, grain-free", "Defra 'grass-fed' only needs 51% grass — this is 100%"], addresses: ["animal_welfare", "eco"], markets: UK, fallbackEcoGrade: "c" },
    // Lower-impact substitutes
    { brand: "Meati", productName: "Meati Mycelium Steak", searchQuery: "Meati steak", certifications: [], strengths: ["Minimally processed whole-cut mycelium", "Far lower land/GHG than beef"], addresses: ["eco", "animal_welfare"], markets: ["US"], fallbackEcoGrade: "b" },
    { brand: "Beyond Meat", productName: "Beyond Burger", searchQuery: "Beyond Burger", certifications: [], strengths: ["~90% less GHG & land than a beef burger", "Widely available transition product"], addresses: ["eco", "animal_welfare"], markets: BROAD, fallbackEcoGrade: "b" },
    { brand: "Impossible Foods", productName: "Impossible Burger", searchQuery: "Impossible Burger", certifications: [], strengths: ["~90% less GHG & land than beef", "Heme-based flavour, widely stocked"], addresses: ["eco", "animal_welfare"], markets: [...ANGLO], fallbackEcoGrade: "b" },
  ],

  sugar: [
    // Ethical sugar brands
    { brand: "Wholesome Sweeteners", productName: "Wholesome Organic Fairtrade Sugar", searchQuery: "Wholesome Sweeteners organic sugar", certifications: ["fair_trade", "organic"], strengths: ["Pioneered Fairtrade sugar in the US (2005)", ">$9M paid in social premiums to farmer co-ops"], addresses: ["labor", "eco"], markets: ["US", "CA"], fallbackEcoGrade: "c" },
    { brand: "Equal Exchange", productName: "Equal Exchange Fairtrade Sugar", searchQuery: "Equal Exchange sugar", certifications: ["fair_trade", "worker_coop"], strengths: ["Worker- & farmer-co-op sugar", "Guaranteed minimum price + premium"], addresses: ["labor"], markets: ["US", "CA"], fallbackEcoGrade: "c" },
    { brand: "Tate & Lyle Sugars Fairtrade", productName: "Tate & Lyle Fairtrade Sugar", searchQuery: "Tate Lyle Fairtrade sugar", certifications: ["fair_trade"], strengths: ["First UK brand to make whole range Fairtrade"], addresses: ["labor"], markets: UK, fallbackEcoGrade: "c" },
    { brand: "Billington's", productName: "Billington's Unrefined Cane Sugar", searchQuery: "Billington's sugar", certifications: ["fair_trade"], strengths: ["Unrefined cane sugars", "Some Fairtrade lines"], addresses: ["labor"], markets: UK, fallbackEcoGrade: "c" },
    // Lower-impact sweetener substitutes
    { brand: "Date Lady", productName: "Date Lady Organic Date Syrup", searchQuery: "Date Lady date syrup", certifications: ["organic"], strengths: ["Whole dried dates — retains fiber & minerals", "Minimal processing"], addresses: ["eco"], markets: ["US", "CA"], fallbackEcoGrade: "b" },
    { brand: "Coombs Family Farms", productName: "Coombs Family Farms Pure Maple Syrup", searchQuery: "Coombs maple syrup organic", certifications: ["organic"], strengths: ["Tapped from standing forests, no land conversion", "Supports intact woodland"], addresses: ["eco"], markets: ["US", "CA"], fallbackEcoGrade: "b" },
  ],

  palm_oil: [
    // Gold-standard responsible palm brands
    { brand: "Dr. Bronner's", productName: "Dr. Bronner's Organic Soap", searchQuery: "Dr. Bronner's organic soap", certifications: ["fair_trade", "organic"], strengths: ["World's first certified organic + fair trade palm operation", "No deforestation; regenerative; employs 200+ (mostly women)"], addresses: ["labor", "eco"], markets: BROAD, fallbackEcoGrade: "b" },
    { brand: "Daabon", productName: "Daabon Organic Palm Oil", searchQuery: "Daabon organic palm oil", certifications: ["fair_trade", "organic"], strengths: ["Regenerative Organic Certified GOLD", "POIG founder; deforestation-free Colombian palm"], addresses: ["labor", "eco"], markets: BROAD, fallbackEcoGrade: "c" },
  ],

  soy: [
    // Deforestation-free & ethical soy
    { brand: "Hodo", productName: "Hodo Organic Tofu", searchQuery: "Hodo organic tofu", certifications: ["organic"], strengths: ["Organic North-American soybeans", "Avoids Amazon/Cerrado supply chain"], addresses: ["eco"], markets: ["US", "CA"], fallbackEcoGrade: "a" },
    { brand: "Clearspring", productName: "Clearspring Organic Tofu", searchQuery: "Clearspring organic tofu", certifications: ["organic"], strengths: ["Organic, verified bean origin", "Japanese-style quality"], addresses: ["eco"], markets: UK_EU, fallbackEcoGrade: "a" },
    { brand: "The Tofoo Co", productName: "The Tofoo Co Organic Tofu", searchQuery: "Tofoo organic tofu", certifications: ["organic"], strengths: ["Organic, UK-made", "Non-GMO, European soybeans"], addresses: ["eco"], markets: UK, fallbackEcoGrade: "a" },
    { brand: "Big Mountain Foods", productName: "Big Mountain Organic Tofu", searchQuery: "Big Mountain tofu", certifications: ["organic"], strengths: ["Organic, Canadian-grown soy", "Avoids deforestation-risk supply chains"], addresses: ["eco"], markets: ["US", "CA"], fallbackEcoGrade: "a" },
  ],
};

// ── Category detection ───────────────────────────────────────────────────────

// Keyword → category. First match wins; order matters (specific before broad).
// Each pattern blends generic terms with iconic brand/product names so a scan
// resolves even when Open Food Facts' category tags are sparse (e.g. a "Kit
// Kat" whose only name is the brand still maps to chocolate).
// Order matters and is deliberately tiered:
//   1. Iconic chocolate BRANDS (Kit Kat, Twix…) — these are unambiguously
//      chocolate even though their category tags often say "wafers/biscuits".
//   2. Product FORMS that merely contain chocolate as an ingredient (spreads,
//      snack bars, cereal, cookies) — must win over the generic chocolate match.
//   3. Generic chocolate INGREDIENT (chocolat/cocoa/cacao) — last-resort for
//      anything still unclassified after the specific forms.
//   4. Everything else.
// Patterns blend English with common European-language terms (lait, sucre, thé,
// fromage, poulet…) because Open Food Facts is heavily French/EU-sourced.
const CATEGORY_KEYWORDS: { key: SwapCategoryKey; patterns: RegExp }[] = [
  { key: "ice_cream", patterns: /ice.?cream|gelato|frozen.?dessert|frozen.?yog|sorbet|glaces?\b|crèmes?\s*glacées?|magnum|cornetto|häagen|haagen|ben\s*&?\s*jerry/i },

  // Tier 1 — iconic chocolate brands (product-specific, never bare company names
  // like "Mars"/"Ferrero" which also make non-chocolate lines).
  { key: "chocolate", patterns: /kit\s*kat|twix|snickers|maltesers|toblerone|lindt|lindor|ferrero\s*rocher|raffaello|kinder|hershey|reese|wispa|dairy\s*milk|ritter\s*sport|godiva|ghirardelli|terry'?s\s*chocolate|cadbury|milka|\baero\b|galaxy\s*chocolate|bounty\b|milky\s*way|\bm\s*&\s*m|smarties|green\s*&?\s*black/i },

  // Tier 2 — product forms that contain chocolate as an ingredient.
  { key: "spreads", patterns: /nutella|hazelnut.?spread|chocolate.?spread|p[âa]te.?[àa].?tartiner|tartiner|peanut.?butter|nut.?butter|almond.?butter|cashew.?butter|pindakaas|beurre.?de.?cacahu|\bspreads?\b|\bjam\b|confiture|marmalade|preserve|\bjif\b|skippy|sun.?pat/i },
  { key: "snack_bars", patterns: /(?:granola|cereal|c[ée]r[ée]al|protein|prot[ée]in[ée]|energy|fruit|nut|muesli|snack|oat)\s*bars?\b|barres?\s*(?:de\s*)?c[ée]r[ée]ale|flapjack|clif\s*bar|kind\s*bar|nature\s*valley/i },
  // NB: deliberately no bare "cereal"/"céréales" — OFF tags many crisps/snacks
  // under "Cereals and potatoes", which would steal them from chips. Match
  // breakfast-cereal context + specific cereal foods/brands instead.
  { key: "cereal", patterns: /breakfast.?cereals?|granola|muesli|porridge|oatmeal|corn.?flakes?|flocons?\s*d'avoine|\boats\b|cheerios|weetabix|special\s*k|frosties|froot\s*loops|chocapic/i },
  { key: "cookies", patterns: /cookie|biscuit|shortbread|digestive|oreo|wafer|cracker|hobnob|mcvitie|chips\s*ahoy/i },

  // Tier 3 — generic chocolate ingredient.
  { key: "chocolate", patterns: /chocolat|cocoa|cacao|praline|truffle|ganache|gianduja/i },

  // Tier 4 — everything else.
  { key: "candy", patterns: /gumm|\bsweets?\b|\bcandy\b|bonbon|jelly.?bean|jellies|licorice|liquorice|marshmallow|lollipop|hard.?candy|sour.?candy|skittles|starburst|haribo|wine.?gum|fruit.?pastille|toffee|fudge|twizzler|airhead|trolli|sour\s*patch|nerds\b|tic\s*tac|mentos/i },
  { key: "chips", patterns: /crisps?|potato.?chip|tortilla.?chip|\bchips\b|nachos|pretzel|popcorn|puffs|corn.?chip|savou?ry.?snack|lay'?s|doritos|pringles|cheetos|ruffles|walkers\b|tostitos|fritos|takis|sun\s*chips/i },
  { key: "coffee", patterns: /coffee|espresso|\bcaf[ée]\b|ground.?coffee|coffee.?bean|nescaf|nespresso|folgers|maxwell\s*house|lavazza|\billy\b|starbucks/i },
  { key: "tea", patterns: /\bteas?\b|tea.?bag|thé|matcha|chai|rooibos|herbal.?infusion|\binfusion\b|lipton|tetley|twinings|pg\s*tips|yorkshire\s*tea/i },
  { key: "soft_drinks", patterns: /soda|cola\b|soft.?drink|carbonated|lemonade|energy.?drink|fizzy|coca.?cola|\bcoke\b|pepsi|sprite|fanta|mountain\s*dew|dr\s*pepper|7.?up|mirinda|schweppes|gatorade|powerade/i },
  { key: "yogurt", patterns: /yogh?urt|yoghourt|yaourt|skyr|kefir/i },
  { key: "cheese", patterns: /\bcheeses?\b|fromage|cheddar|mozzarella|parmesan|\bbrie\b|gouda|halloumi|\bfeta\b|camembert|emmental|comté|gruy[èe]re|roquefort|raclette|reblochon|munster|coulommiers|mimolette|\bch[èe]vre\b/i },
  { key: "milk", patterns: /oat.?milk|almond.?milk|soy.?milk|soya.?milk|plant.?milk|coconut.?milk|\bmilks?\b|oat.?drink|plant.?based.?drink|\blait\b|leche|milch|[ée]cr[ée]m[ée]|alpro|oatly/i },
  // NB: the œ ligature is a non-word char, so a naive \bœuf\b also matches
  // "bœuf" (beef). The lookbehind blocks that false hit; "oeufs"/"eggs" are safe.
  { key: "eggs", patterns: /\beggs?\b|\boeufs?\b|(?<![a-zà-ÿ])œufs?\b/i },
  { key: "seafood", patterns: /tuna|thon|salmon|saumon|seafood|\bfish\b|poisson|sardine|mackerel|maquereau|shrimp|crevette|prawn|anchov/i },
  { key: "chicken", patterns: /chicken|poultry|volaille|\bnuggets?\b|drumstick|rotisserie|chicken\s*breast|chicken\s*thigh|chicken\s*wing|chicken\s*tender|goujon|\bpoulet\b|\bpollo\b|turkey|\bdinde\b/i },
  { key: "bananas", patterns: /banana|banane/i },
  { key: "beef", patterns: /\bbeef\b|b(?:œuf|oeuf)|ground.?beef|steak|burger.?patt|beef.?jerky|beef.?mince|brisket|sirloin|ribeye|angus|viande.?h[aâ]ch[ée]e/i },
  { key: "sugar", patterns: /\bsugars?\b|\bsucre\b|cassonade|az[úu]car|zucker|cane.?sugar|brown.?sugar|icing.?sugar|golden.?syrup|demerara|muscovado|turbinado|molasses|treacle/i },
  { key: "palm_oil", patterns: /palm.?oil|palm.?fat|palm.?kernel|palmitate/i },
  { key: "soy", patterns: /\btofu\b|soy.?sauce|soy.?bean|soya|tempeh|edamame|miso(?!\.)/i },
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
