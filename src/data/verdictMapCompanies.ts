// Companies for the global supply-chain map — every company in the app's
// verdict-affecting datasets (verified brand flags, labour allegations, the
// boycott list, animal-welfare flags, verified-ethics leaders) that is NOT
// already on the chocolate sourcing map, plotted at its HQ.
//
// Only the identity + location half is authored here; the ethics half
// (summary, sources, score, tier) is derived at call time from the same
// datasets the scanner uses, so a pin can never disagree with a scan verdict.
// The score is the app's own personalizedScore at default priorities.

import { DEFAULT_PRIORITIES } from "@/utils/userPreferences";
import { personalizedScore } from "@/utils/personalizedScore";
import { getVerifiedFlagsForBrand } from "@/services/brandFlags";
import { findLaborAllegations, getLaborAllegationCount } from "@/utils/laborCheck";
import { checkAnimalWelfareFlag } from "@/utils/animalWelfareFlags";
import { checkBoycott } from "@/data/boycottBrands";
import { findVerifiedEthics } from "@/utils/verifiedEthics";

/** Entry shape the sourcing map's `goodscan-companies` message expects. */
export interface MapCompany {
  id: string;
  name: string;
  owner: string;
  hq: string;
  lon: number;
  lat: number;
  category: string;
  verdict: "leader" | "better" | "caution" | "avoid";
  score: number;
  sourcing: string;
  summary: string;
  products: string[];
  /** Structured citations rendered directly by the map (replaces SOURCES_OF). */
  sources: { label: string; url?: string }[];
}

interface CompanySeed {
  id: string;
  name: string;
  owner: string;
  hq: string;
  lon: number;
  lat: number;
  category: string;
  products: string[];
  /** One-line supply-chain exposure, shown in the detail facts. */
  supply: string;
}

// ── Curated identity + HQ table ─────────────────────────────────────────────
// Chocolate-industry companies (Nestlé, Mars, Hershey, Mondelēz, Ferrero,
// Lindt, Godiva, Cargill, Barry Callebaut, Starbucks, Walmart, General Mills,
// Kellanova, Unilever, Tony's, Divine, Equal Exchange, Alter Eco …) are
// deliberately absent: the map already carries them with richer cocoa data.
const SEEDS: CompanySeed[] = [
  // ── Flagged food & beverage manufacturers ──
  { id: "cocacola", name: "The Coca-Cola Company", owner: "The Coca-Cola Company", hq: "Atlanta, GA, USA", lon: -84.39, lat: 33.75, category: "Beverages",
    products: ["Coca-Cola", "Sprite", "Fanta", "Minute Maid", "Dasani", "Powerade", "Costa Coffee"],
    supply: "Sugarcane from the Philippines, El Salvador & Brazil; global bottling network" },
  { id: "pepsico", name: "PepsiCo", owner: "PepsiCo, Inc.", hq: "Purchase, NY, USA", lon: -73.71, lat: 41.04, category: "Beverages & snacks",
    products: ["Pepsi", "Lay's", "Doritos", "Gatorade", "Tropicana", "Quaker", "SodaStream"],
    supply: "Palm oil from Indonesia; sugar & corn via global traders" },
  { id: "abf", name: "Associated British Foods", owner: "Associated British Foods plc", hq: "London, UK", lon: -0.1, lat: 51.51, category: "Manufacturer",
    products: ["Twinings", "Ovaltine", "Silver Spoon", "Primark"],
    supply: "Tea from Assam & East Africa; sugar; apparel via Primark" },
  { id: "tata", name: "Tetley", owner: "Tata Consumer Products", hq: "Mumbai, India", lon: 72.83, lat: 18.94, category: "Manufacturer",
    products: ["Tetley Tea", "Tata Tea", "Good Earth"],
    supply: "Tea estates in Assam & Sri Lanka" },
  { id: "smucker", name: "Folgers", owner: "The J.M. Smucker Company", hq: "Orrville, OH, USA", lon: -81.76, lat: 40.84, category: "Manufacturer",
    products: ["Folgers", "Café Bustelo", "Dunkin' (retail)", "Jif", "Smucker's"],
    supply: "Coffee from Brazil & Vietnam via bulk traders" },
  { id: "kraftheinz", name: "Kraft Heinz", owner: "The Kraft Heinz Company", hq: "Chicago, IL, USA", lon: -87.62, lat: 41.88, category: "Manufacturer",
    products: ["Kraft", "Heinz", "Oscar Mayer", "Philadelphia", "Maxwell House", "Capri Sun"],
    supply: "Coffee, sugar, palm oil & meat via global traders" },
  { id: "lavazza", name: "Lavazza", owner: "Luigi Lavazza S.p.A.", hq: "Turin, Italy", lon: 7.69, lat: 45.07, category: "Manufacturer",
    products: ["Lavazza", "Carte Noire", "Kicking Horse"],
    supply: "Coffee from Brazil, Vietnam & East Africa" },
  { id: "illy", name: "illycaffè", owner: "illycaffè S.p.A.", hq: "Trieste, Italy", lon: 13.77, lat: 45.65, category: "Manufacturer",
    products: ["illy espresso", "illy ready-to-drink"],
    supply: "Coffee from Brazil, Ethiopia & Central America" },
  { id: "asr", name: "ASR Group", owner: "ASR Group / Fanjul Corp.", hq: "West Palm Beach, FL, USA", lon: -80.05, lat: 26.71, category: "Trader / processor",
    products: ["Domino Sugar", "C&H", "Redpath", "Tate & Lyle Sugars"],
    supply: "Sugarcane from the Dominican Republic, Florida & Belize" },
  { id: "thaiunion", name: "Chicken of the Sea", owner: "Thai Union Group", hq: "Samut Sakhon, Thailand", lon: 100.27, lat: 13.55, category: "Manufacturer",
    products: ["Chicken of the Sea", "John West", "Petit Navire"],
    supply: "Tuna & shrimp from Thai and Pacific fleets" },
  { id: "bumblebee", name: "Bumble Bee Foods", owner: "Bumble Bee Foods, LLC (FCF)", hq: "San Diego, CA, USA", lon: -117.16, lat: 32.72, category: "Manufacturer",
    products: ["Bumble Bee", "Brunswick", "Snow's"],
    supply: "Tuna from Pacific distant-water fleets" },
  { id: "tyson", name: "Tyson Foods", owner: "Tyson Foods, Inc.", hq: "Springdale, AR, USA", lon: -94.13, lat: 36.19, category: "Meat processor",
    products: ["Tyson", "Jimmy Dean", "Hillshire Farm", "Ball Park"],
    supply: "US poultry, beef & pork plants; contract farms" },
  { id: "jbs", name: "JBS", owner: "JBS S.A.", hq: "São Paulo, Brazil", lon: -46.63, lat: -23.55, category: "Meat processor",
    products: ["Swift", "Seara", "Friboi", "Primo"],
    supply: "Beef, pork & poultry across Brazil and the US" },
  { id: "pilgrims", name: "Pilgrim's Pride", owner: "Pilgrim's Pride Corp. (JBS)", hq: "Greeley, CO, USA", lon: -104.71, lat: 40.42, category: "Meat processor",
    products: ["Pilgrim's", "Just Bare", "Gold'n Plump"],
    supply: "US & Mexico poultry plants; contract growers" },
  { id: "chiquita", name: "Chiquita", owner: "Chiquita Brands International", hq: "Fort Lauderdale, FL, USA", lon: -80.14, lat: 26.12, category: "Produce",
    products: ["Chiquita bananas", "Fresh Express"],
    supply: "Bananas from Ecuador, Guatemala, Honduras & Colombia" },
  { id: "dole", name: "Dole", owner: "Dole plc", hq: "Charlotte, NC, USA", lon: -80.84, lat: 35.23, category: "Produce",
    products: ["Dole bananas", "Dole pineapple", "Dole salads"],
    supply: "Bananas & pineapple from Latin America and the Philippines" },
  { id: "delmonte", name: "Del Monte", owner: "Del Monte Foods / Fresh Del Monte", hq: "Walnut Creek, CA, USA", lon: -122.06, lat: 37.9, category: "Produce",
    products: ["Del Monte canned fruit", "Fresh Del Monte produce"],
    supply: "Pineapple & bananas from Kenya, the Philippines & Latin America" },
  { id: "danone", name: "Danone", owner: "Danone S.A.", hq: "Paris, France", lon: 2.3, lat: 48.87, category: "Manufacturer",
    products: ["Activia", "Actimel", "Evian", "Alpro", "Silk", "Oikos"],
    supply: "Global dairy network; fruit & sugar via traders" },

  // ── Fast food & food service (animal-welfare / boycott flags) ──
  { id: "mcdonalds", name: "McDonald's", owner: "McDonald's Corporation", hq: "Chicago, IL, USA", lon: -87.64, lat: 41.87, category: "Fast food",
    products: ["Big Mac", "McNuggets", "McCafé"],
    supply: "Global beef, poultry & egg contracts" },
  { id: "yum", name: "Yum! Brands", owner: "Yum! Brands, Inc.", hq: "Louisville, KY, USA", lon: -85.76, lat: 38.25, category: "Fast food",
    products: ["KFC", "Pizza Hut", "Taco Bell", "Habit Burger"],
    supply: "Global poultry, beef & dairy contracts" },
  { id: "burgerking", name: "Burger King", owner: "Restaurant Brands International", hq: "Miami, FL, USA", lon: -80.19, lat: 25.76, category: "Fast food",
    products: ["Whopper", "BK chicken lines"],
    supply: "Global beef & poultry contracts" },
  { id: "subway", name: "Subway", owner: "Subway (Roark Capital)", hq: "Miami, FL, USA", lon: -80.23, lat: 25.79, category: "Fast food",
    products: ["Subway sandwiches"],
    supply: "Poultry, pork & produce contracts" },
  { id: "chickfila", name: "Chick-fil-A", owner: "Chick-fil-A, Inc.", hq: "Atlanta, GA, USA", lon: -84.41, lat: 33.73, category: "Fast food",
    products: ["Chick-fil-A chicken"],
    supply: "US broiler-chicken contracts" },
  { id: "dunkin", name: "Dunkin'", owner: "Inspire Brands", hq: "Canton, MA, USA", lon: -71.08, lat: 42.16, category: "Fast food",
    products: ["Dunkin' coffee & donuts", "Baskin-Robbins"],
    supply: "Coffee, eggs & dairy contracts" },
  { id: "dominos", name: "Domino's Pizza", owner: "Domino's Pizza, Inc.", hq: "Ann Arbor, MI, USA", lon: -83.74, lat: 42.28, category: "Fast food",
    products: ["Domino's pizza"],
    supply: "Pork, poultry, dairy & wheat contracts" },
  { id: "papajohns", name: "Papa John's", owner: "Papa John's International", hq: "Louisville, KY, USA", lon: -85.68, lat: 38.3, category: "Fast food",
    products: ["Papa John's pizza"],
    supply: "Pork, poultry, dairy & wheat contracts" },
  { id: "leclerc", name: "E.Leclerc", owner: "E.Leclerc", hq: "Ivry-sur-Seine, France", lon: 2.39, lat: 48.81, category: "Retailer",
    products: ["Marque Repère", "Eco+"],
    supply: "European private-label meat, dairy & egg lines" },

  // ── Boycott-list companies (BDS) ──
  { id: "carrefour", name: "Carrefour", owner: "Carrefour Group", hq: "Massy, France", lon: 2.27, lat: 48.73, category: "Retailer",
    products: ["Carrefour private label"],
    supply: "Global private-label sourcing network" },
  { id: "caterpillar", name: "Caterpillar", owner: "Caterpillar Inc.", hq: "Irving, TX, USA", lon: -96.95, lat: 32.86, category: "Consumer goods",
    products: ["CAT machinery", "CAT footwear & phones (licensed)"],
    supply: "Heavy machinery; licensed consumer goods" },
  { id: "inditex", name: "Inditex / Zara", owner: "Inditex", hq: "Arteixo, Spain", lon: -8.51, lat: 43.3, category: "Consumer goods",
    products: ["Zara", "Pull&Bear", "Bershka", "Massimo Dutti"],
    supply: "Fast-fashion apparel from Spain, Morocco, Türkiye & Asia" },
  { id: "loreal", name: "L'Oréal", owner: "L'Oréal Groupe", hq: "Clichy, France", lon: 2.31, lat: 48.9, category: "Consumer goods",
    products: ["L'Oréal Paris", "Garnier", "Maybelline", "NYX"],
    supply: "Global cosmetics ingredients incl. palm derivatives & mica" },
  { id: "puma", name: "Puma", owner: "Puma SE", hq: "Herzogenaurach, Germany", lon: 10.88, lat: 49.57, category: "Consumer goods",
    products: ["Puma footwear & apparel"],
    supply: "Footwear & apparel from Vietnam, China & Bangladesh" },
  { id: "strauss", name: "Strauss Group / Sabra", owner: "Strauss Group", hq: "Petah Tikva, Israel", lon: 34.89, lat: 32.09, category: "Manufacturer",
    products: ["Sabra hummus", "Elite", "Strauss dairy"],
    supply: "Dairy, snacks & dips for Israel and export markets" },
  { id: "ahava", name: "AHAVA", owner: "AHAVA Dead Sea Laboratories", hq: "Airport City, Israel", lon: 34.96, lat: 31.99, category: "Consumer goods",
    products: ["AHAVA skincare"],
    supply: "Dead Sea mineral cosmetics" },
  { id: "achva", name: "Achva", owner: "Achva", hq: "Arad, Israel", lon: 35.21, lat: 31.26, category: "Manufacturer",
    products: ["Achva halva & tahini"],
    supply: "Sesame products for Israel and export markets" },
  { id: "tara", name: "Tara", owner: "Tara Dairy", hq: "Tel Aviv, Israel", lon: 34.78, lat: 32.05, category: "Manufacturer",
    products: ["Tara dairy"],
    supply: "Israeli dairy network" },
  { id: "tempo", name: "Tempo Beverages", owner: "Tempo Beverages", hq: "Netanya, Israel", lon: 34.86, lat: 32.33, category: "Beverages",
    products: ["Goldstar", "Maccabee", "Nesher"],
    supply: "Brewing & soft drinks for Israel and export markets" },
  { id: "tnuva", name: "Tnuva", owner: "Tnuva (Bright Food)", hq: "Tel Aviv, Israel", lon: 34.79, lat: 32.07, category: "Manufacturer",
    products: ["Tnuva dairy"],
    supply: "Israeli dairy network" },

  // ── Verified-ethics leaders (they lift verdicts) ──
  { id: "feastables", name: "Feastables", owner: "Feastables (MrBeast)", hq: "Greenville, NC, USA", lon: -77.37, lat: 35.61, category: "Manufacturer",
    products: ["Feastables chocolate"],
    supply: "Fairtrade-terms cocoa, largely from West Africa" },
  { id: "consciouscoffees", name: "Conscious Coffees", owner: "Conscious Coffees", hq: "Boulder, CO, USA", lon: -105.27, lat: 40.01, category: "Coffee & tea",
    products: ["Conscious Coffees roasts"],
    supply: "Direct-trade co-op coffee from Latin America" },
  { id: "ethicalbean", name: "Ethical Bean", owner: "Ethical Bean (Kicking Horse)", hq: "Vancouver, Canada", lon: -123.1, lat: 49.26, category: "Coffee & tea",
    products: ["Ethical Bean coffee"],
    supply: "Fairtrade-organic coffee from Guatemala & Peru" },
  { id: "cafemam", name: "Cafe Mam", owner: "Cafe Mam", hq: "Eugene, OR, USA", lon: -123.09, lat: 44.05, category: "Coffee & tea",
    products: ["Cafe Mam coffee"],
    supply: "Indigenous co-op coffee from Chiapas, Mexico" },
  { id: "groundsforchange", name: "Grounds for Change", owner: "Grounds for Change", hq: "Poulsbo, WA, USA", lon: -122.65, lat: 47.74, category: "Coffee & tea",
    products: ["Grounds for Change coffee"],
    supply: "Fairtrade-organic co-op coffee, carbon-free roasting" },
  { id: "higherground", name: "Higher Ground Roasters", owner: "Higher Ground Roasters", hq: "Leeds, AL, USA", lon: -86.54, lat: 33.55, category: "Coffee & tea",
    products: ["Higher Ground coffee"],
    supply: "Fairtrade-organic co-op coffee" },
  { id: "cafedirect", name: "Cafedirect", owner: "Cafedirect plc", hq: "London, UK", lon: -0.07, lat: 51.52, category: "Coffee & tea",
    products: ["Cafedirect coffee & tea"],
    supply: "Fairtrade pioneer; grower co-ops hold equity" },
  { id: "blkandbold", name: "BLK & Bold", owner: "BLK & Bold", hq: "Des Moines, IA, USA", lon: -93.62, lat: 41.59, category: "Coffee & tea",
    products: ["BLK & Bold coffee & tea"],
    supply: "Specialty coffee; 5% of profits to youth programs" },
  { id: "numi", name: "Numi Organic Tea", owner: "Numi, Inc.", hq: "Oakland, CA, USA", lon: -122.27, lat: 37.8, category: "Coffee & tea",
    products: ["Numi teas"],
    supply: "Fair-trade organic tea gardens in Asia & Africa" },
  { id: "amys", name: "Amy's Kitchen", owner: "Amy's Kitchen", hq: "Petaluma, CA, USA", lon: -122.64, lat: 38.23, category: "Grocery & dairy",
    products: ["Amy's frozen meals", "Amy's soups"],
    supply: "Organic vegetables & grains, largely US-grown" },
  { id: "kingarthur", name: "King Arthur Baking", owner: "King Arthur Baking Company", hq: "Norwich, VT, USA", lon: -72.31, lat: 43.71, category: "Grocery & dairy",
    products: ["King Arthur flour & mixes"],
    supply: "US-grown wheat; employee-owned B Corp" },
  { id: "stonyfield", name: "Stonyfield Organic", owner: "Stonyfield (Lactalis)", hq: "Londonderry, NH, USA", lon: -71.37, lat: 42.87, category: "Grocery & dairy",
    products: ["Stonyfield yogurt"],
    supply: "Organic Northeast-US dairy farms" },
  { id: "miyokos", name: "Miyoko's Creamery", owner: "Miyoko's Creamery", hq: "Petaluma, CA, USA", lon: -122.6, lat: 38.25, category: "Grocery & dairy",
    products: ["Miyoko's plant butter & cheese"],
    supply: "Plant-based dairy; organic cashews & oats" },
  { id: "onceuponafarm", name: "Once Upon a Farm", owner: "Once Upon a Farm", hq: "Berkeley, CA, USA", lon: -122.27, lat: 37.87, category: "Grocery & dairy",
    products: ["Once Upon a Farm baby food"],
    supply: "Organic US produce; B Corp" },
  { id: "purelyelizabeth", name: "Purely Elizabeth", owner: "Purely Elizabeth", hq: "Boulder, CO, USA", lon: -105.25, lat: 40.02, category: "Grocery & dairy",
    products: ["Purely Elizabeth granola & oats"],
    supply: "Organic oats & ancient grains" },
  { id: "olipop", name: "OLIPOP / REBBL", owner: "OLIPOP PBC", hq: "Oakland, CA, USA", lon: -122.28, lat: 37.81, category: "Beverages",
    products: ["OLIPOP sodas", "REBBL elixirs"],
    supply: "Botanical ingredients; public benefit corporation" },
  { id: "cabot", name: "Cabot Creamery", owner: "Cabot (Agri-Mark co-op)", hq: "Cabot, VT, USA", lon: -72.31, lat: 44.41, category: "Grocery & dairy",
    products: ["Cabot cheddar & butter"],
    supply: "Farmer-owned New England dairy co-op; B Corp" },
  { id: "jenis", name: "Jeni's Splendid Ice Creams", owner: "Jeni's", hq: "Columbus, OH, USA", lon: -83.0, lat: 39.96, category: "Grocery & dairy",
    products: ["Jeni's ice cream"],
    supply: "Direct-trade vanilla & fair-trade cocoa; B Corp" },
  { id: "peteandgerrys", name: "Pete & Gerry's", owner: "Pete & Gerry's Organics", hq: "Monroe, NH, USA", lon: -72.01, lat: 44.28, category: "Grocery & dairy",
    products: ["Pete & Gerry's organic eggs"],
    supply: "Small family farms; Certified Humane free-range eggs" },
  { id: "vitalfarms", name: "Vital Farms", owner: "Vital Farms", hq: "Austin, TX, USA", lon: -97.74, lat: 30.27, category: "Grocery & dairy",
    products: ["Vital Farms pasture-raised eggs & butter"],
    supply: "Pasture-raised network of US family farms; B Corp" },
];

// ── Enrichment ───────────────────────────────────────────────────────────────

const BDS_SOURCE = { label: "BDS movement — consumer boycott list", url: "https://boycott-israel.org/boycott.html" };
const BBFAW_SOURCE = { label: "Business Benchmark on Farm Animal Welfare (BBFAW)", url: "https://www.bbfaw.com/" };

function tierFor(score: number, hasPositiveEthics: boolean): MapCompany["verdict"] {
  if (score >= 85 || (hasPositiveEthics && score >= 70)) return "leader";
  if (score >= 70) return "better";
  if (score >= 25) return "caution";
  return "avoid";
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…";
}

/**
 * Build the full injectable company list. Pure function over the app's
 * datasets — safe to call on every page mount.
 */
export function getVerdictMapCompanies(): MapCompany[] {
  return SEEDS.map((seed) => {
    const probe = `${seed.name} ${seed.owner}`;
    const flags = getVerifiedFlagsForBrand(seed.name).concat(getVerifiedFlagsForBrand(seed.owner))
      .filter((f, i, a) => a.findIndex((x) => x.id === f.id) === i);
    const allegations = findLaborAllegations(probe, null);
    const welfare = checkAnimalWelfareFlag(seed.name);
    const boycott = checkBoycott(seed.name) ?? checkBoycott(seed.owner);
    const ethics = findVerifiedEthics(seed.name, null);

    // Score with the app's own engine. Labour input mirrors the scanner
    // (laborCheck count), raised to the flag severity when the verified-flag
    // dataset knows more than the 9-company scoring DB.
    const severityWeight = flags.some((f) => f.severity === "critical") ? 2 : flags.length > 0 ? 1 : 0;
    const laborAllegations = Math.max(getLaborAllegationCount(probe, null), severityWeight);
    const ps = personalizedScore(
      { brand: seed.name, productName: null, laborAllegations },
      DEFAULT_PRIORITIES,
    );
    const score = ps.score ?? 50;

    // Summary: one line per live signal, strongest first.
    const parts: string[] = [];
    if (flags[0]) parts.push(flags[0].summary);
    else if (allegations?.allegations?.[0]) parts.push(allegations.allegations[0].details);
    if (welfare.isFlagged && welfare.company) {
      parts.push(`BBFAW Tier ${welfare.company.bbfawTier} on farm-animal welfare — ${welfare.company.concerns[0] ?? "systemic concerns"}.`);
    }
    if (boycott) parts.push(`On the BDS consumer boycott list: ${boycott.reason}.`);
    if (ethics?.highlights?.[0]) parts.push(ethics.highlights[0].detail);
    const summary = truncate(parts.join(" ") || seed.supply, 420);

    // Citations: flag sources are tier-graded, take the strongest two; then
    // allegation, welfare and ethics sources, capped at four total.
    const sources: MapCompany["sources"] = [];
    for (const f of flags) for (const s of f.sources.slice(0, 2)) {
      sources.push({ label: `${s.publisher} — ${s.title}`, url: s.url });
    }
    if (allegations?.allegations?.[0]) {
      const a = allegations.allegations[0];
      sources.push({ label: `${a.source} — ${a.issue} (${a.year})`, url: a.sourceUrl });
    }
    if (welfare.isFlagged) sources.push(BBFAW_SOURCE);
    if (boycott) sources.push(BDS_SOURCE);
    if (ethics?.highlights) for (const h of ethics.highlights.slice(0, 2)) {
      sources.push({ label: `${h.source} — ${h.label}`, url: h.sourceUrl });
    }

    return {
      id: `app-${seed.id}`,
      name: seed.name,
      owner: seed.owner,
      hq: seed.hq,
      lon: seed.lon,
      lat: seed.lat,
      category: seed.category,
      verdict: tierFor(score, !!ethics),
      score,
      sourcing: seed.supply,
      summary,
      products: seed.products,
      sources: sources.slice(0, 4).filter((s, i, a) => a.findIndex((x) => x.label === s.label) === i),
    };
  });
}
