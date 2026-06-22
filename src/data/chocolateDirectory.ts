// The Chocolate Brand Directory
// ---------------------------------------------------------------------------
// A near-comprehensive ethics scan of the chocolate market: ~70 chocolate
// makers, cocoa traders/processors, retailers and ethical/craft leaders.
//
// The backbone is the 2025 Chocolate Scorecard (Be Slavery Free / Mighty
// Earth, 81 companies), cross-referenced with the Food Empowerment Project
// list, Green America, and the lawsuit / investigation record.
//
// Verdicts blend third-party scorecard performance with the sourcing model and
// the public accusation record. They are a consumer-guidance synthesis, not a
// legal finding. "Sourcing" is where cocoa is bought; brands rarely own farms.

export type ChocolateVerdict = "avoid" | "caution" | "better" | "leader";

export type ChocolateTier =
  | "manufacturer" // Major mass-market manufacturers
  | "trader" // Cocoa traders, grinders & processors
  | "retailer" // Retailers & supermarket own-brands
  | "leader"; // Ethical & craft leaders ("buy these")

export interface ChocolateEntry {
  /** Stable slug, e.g. "hershey". */
  id: string;
  /** Brand / company as it appears on the shelf or in the trade. */
  name: string;
  /** Owner & HQ. */
  owner: string;
  /** Where cocoa is sourced. */
  sourcing: string;
  /** Consumer-guidance verdict. */
  verdict: ChocolateVerdict;
  /** Why / notes — the reasoning behind the verdict. */
  note: string;
  /** Which section of the directory this belongs to. */
  tier: ChocolateTier;
  /**
   * Alternative names a scanned product might carry — sub-brands, owned labels
   * or spelling variants — so a lookup can trace a product back to its parent.
   */
  aliases?: string[];
}

// ── Verdict legend (how to read the verdicts) ────────────────────────────────

export interface VerdictMeta {
  key: ChocolateVerdict;
  label: string;
  /** One-line gloss shown in the legend. */
  blurb: string;
  /** Rank for sorting: lower is "buy these". */
  rank: number;
}

export const VERDICT_META: Record<ChocolateVerdict, VerdictMeta> = {
  leader: {
    key: "leader",
    label: "Leader",
    blurb:
      "Best-in-class traceability, living-income pricing, farmer ownership, or sourcing outside high-risk regions. The brands most defensible to buy.",
    rank: 0,
  },
  better: {
    key: "better",
    label: "Better",
    blurb:
      "Above-average practices: a 'Good Egg', strong pesticide/organic score, own-farm or traceable model — but with some remaining caveats or limited scale.",
    rank: 1,
  },
  caution: {
    key: "caution",
    label: "Caution",
    blurb:
      "A large conventional buyer that is engaging (programs, scorecard participation, some progress) but still sources mostly bulk West-African cocoa with limited farm-level traceability. The bulk of the mass market sits here.",
    rank: 2,
  },
  avoid: {
    key: "avoid",
    label: "Avoid",
    blurb:
      "Bulk West-African sourcing with serious unresolved issues, a poor/last-place scorecard result, or a non-response to transparency surveys. Highest risk of child labor / forced labor in the chain.",
    rank: 3,
  },
};

export const IMPORTANT_NUANCE =
  "No mass-market bar built on West-African cocoa can be guaranteed child-labor-free — the beans are pooled through a few giant traders (Barry Callebaut, Cargill, Olam, ECOM). A CAUTION rating is not an accusation against a specific bar; it reflects structural supply-chain risk. Conversely, a LEADER rating reflects a credible model, not perfection — even Tony's Chocolonely reports child-labor cases it finds and remediates.";

export const BOTTOM_LINE =
  "If you want a simple rule: the deeper green a company is here, the more its claims are backed by traceability or farmer ownership. The whole AVOID/CAUTION mass market shares one root problem — bulk West-African cocoa pooled through a few traders — so switching to any LEADER brand does more than agonizing between two CAUTION bars.";

export const TIER_META: Record<ChocolateTier, { title: string; blurb: string }> = {
  manufacturer: {
    title: "Major Mass-Market Manufacturers",
    blurb:
      "The companies behind most chocolate on the shelf. Sub-brands they own are listed so you can trace a product back to its parent.",
  },
  trader: {
    title: "Cocoa Traders, Grinders & Processors",
    blurb:
      "The B2B layer that actually buys beans from farmers and supplies the brands above. This is where farm-level liability concentrates.",
  },
  retailer: {
    title: "Retailers & Supermarket Own-Brands",
    blurb:
      "Supermarkets and chains carry huge private-label chocolate volumes. Mighty Earth's 2025 review found most retailers still lag; a few European grocers lead.",
  },
  leader: {
    title: "Ethical & Craft Leaders (the 'buy these' tier)",
    blurb:
      "Smaller makers competing on supply-chain integrity: traceable, often farmer-owned or made in origin, sourcing outside or with full visibility into high-risk regions.",
  },
};

// ── 1. Major mass-market manufacturers ───────────────────────────────────────

const MANUFACTURERS: ChocolateEntry[] = [
  {
    id: "hershey",
    name: "Hershey",
    owner: "The Hershey Co. / Hershey, PA, USA",
    sourcing: "Côte d'Ivoire, Ghana via Barry Callebaut, Cargill, Olam",
    verdict: "caution",
    note: "Cocoa For Good program; but greenwashing & heavy-metal suits, ~68% visibility, named in forced-labor suit. Owns Reese's, Kisses, Kit Kat (US), Lily's, Heath.",
    tier: "manufacturer",
    aliases: ["Reese's", "Hershey's", "Kisses", "Lily's", "Heath", "Almond Joy", "Mounds", "Jolly Rancher"],
  },
  {
    id: "mars",
    name: "Mars",
    owner: "Mars Inc. (private) / McLean, VA, USA",
    sourcing: "~14 countries incl. W. Africa, Indonesia, L. America",
    verdict: "caution",
    note: "Among better big-six on traceability & women (2025 Scorecard); still bulk W. Africa, Harkin-Engel misses. Owns M&M's, Snickers, Dove, Twix, Bounty.",
    tier: "manufacturer",
    aliases: ["M&M's", "Snickers", "Twix", "Dove", "Bounty", "Milky Way", "Galaxy", "Maltesers"],
  },
  {
    id: "mondelez",
    name: "Mondelez",
    owner: "Mondelez Intl / Chicago, IL, USA",
    sourcing: "Ghana, Côte d'Ivoire, Indonesia, DR, Brazil (Cocoa Life)",
    verdict: "avoid",
    note: "2025 Scorecard 'Bad Egg' — did not respond; 2024 Channel 4 child-labor doc; greenwashing suit. Owns Cadbury, Oreo, Toblerone, Milka, Green & Black's.",
    tier: "manufacturer",
    aliases: ["Cadbury", "Oreo", "Toblerone", "Milka", "Green & Black's", "Côte d'Or", "Chips Ahoy"],
  },
  {
    id: "nestle",
    name: "Nestlé",
    owner: "Nestlé S.A. / Vevey, Switzerland",
    sourcing: "W. Africa & others via Nestlé Cocoa Plan",
    verdict: "caution",
    note: "Scorecard praised Cocoa Plan & child-labor work; but SCOTUS slavery case history. Owns KitKat (global), Crunch (now Ferrero in US), Aero, Smarties.",
    tier: "manufacturer",
    aliases: ["KitKat", "Aero", "Smarties", "Quality Street", "Toll House"],
  },
  {
    id: "ferrero",
    name: "Ferrero",
    owner: "Ferrero Group / Luxembourg & Alba, Italy",
    sourcing: "W. Africa & others; Ferrero Farming Values",
    verdict: "caution",
    note: "Green-bean on deforestation; still large bulk buyer. Owns Nutella, Kinder, Ferrero Rocher, Tic Tac, and ex-Nestlé US candy (Butterfinger, Crunch, Baby Ruth).",
    tier: "manufacturer",
    aliases: ["Nutella", "Kinder", "Ferrero Rocher", "Raffaello", "Tic Tac", "Butterfinger", "Crunch", "Baby Ruth"],
  },
  {
    id: "lindt",
    name: "Lindt & Sprüngli",
    owner: "Lindt / Kilchberg, Switzerland",
    sourcing: "Ghana (~80k farmers) via ECOM; Ecuador etc.",
    verdict: "caution",
    note: "Green-bean deforestation, own Farming Program; but 2024 Swiss child-labor doc; Ghirardelli named in heavy-metal tests. Owns Lindt, Ghirardelli, Russell Stover, Whitman's.",
    tier: "manufacturer",
    aliases: ["Lindt", "Lindor", "Ghirardelli", "Russell Stover", "Whitman's"],
  },
  {
    id: "ritter-sport",
    name: "Ritter Sport",
    owner: "Alfred Ritter GmbH / Waldenbuch, Germany",
    sourcing: "Owns a farm in Nicaragua (Cacao Nica) + W. Africa",
    verdict: "better",
    note: "Green egg for pesticides; partial own-estate cocoa & long-term sourcing. Still buys some bulk W. African cocoa.",
    tier: "manufacturer",
  },
  {
    id: "valrhona",
    name: "Valrhona",
    owner: "Valrhona (Savencia) / Tain-l'Hermitage, France",
    sourcing: "Direct, traceable single-origin (L. America, etc.)",
    verdict: "better",
    note: "Premium B2B/pastry brand; relatively strong score (19); emphasizes traceable partner plantations.",
    tier: "manufacturer",
  },
  {
    id: "general-mills",
    name: "General Mills",
    owner: "General Mills / Minneapolis, MN, USA",
    sourcing: "Bulk via traders",
    verdict: "caution",
    note: "Assessed on 2025 Scorecard; conventional buyer (e.g. Häagen-Dazs US, baking chips).",
    tier: "manufacturer",
    aliases: ["Häagen-Dazs"],
  },
  {
    id: "kellanova",
    name: "Kellanova",
    owner: "Kellanova (ex-Kellogg) / Chicago, USA",
    sourcing: "Bulk via traders",
    verdict: "caution",
    note: "Assessed; conventional buyer (now part of Mars).",
    tier: "manufacturer",
  },
  {
    id: "unilever",
    name: "Unilever",
    owner: "Unilever / London, UK",
    sourcing: "Bulk via traders",
    verdict: "caution",
    note: "Assessed; ice-cream chocolate (Magnum, Ben & Jerry's uses fairtrade).",
    tier: "manufacturer",
    aliases: ["Magnum"],
  },
  {
    id: "storck",
    name: "Storck",
    owner: "August Storck KG / Berlin, Germany",
    sourcing: "Bulk via traders",
    verdict: "caution",
    note: "Assessed; owns Werther's, Toffifee, Merci, Riesen, Knoppers.",
    tier: "manufacturer",
    aliases: ["Werther's Original", "Toffifee", "Merci", "Riesen", "Knoppers"],
  },
  {
    id: "godiva",
    name: "Godiva",
    owner: "Pladis / Yıldız Holding, Turkey",
    sourcing: "Bulk via traders",
    verdict: "caution",
    note: "Premium-priced but conventional sourcing; limited public traceability.",
    tier: "manufacturer",
  },
  {
    id: "fazer",
    name: "Fazer",
    owner: "Fazer Group / Helsinki, Finland",
    sourcing: "W. Africa; cocoa programme",
    verdict: "caution",
    note: "Assessed; Nordic maker engaging on sustainability.",
    tier: "manufacturer",
  },
  {
    id: "whittakers",
    name: "Whittaker's",
    owner: "J.H. Whittaker & Sons / Porirua, New Zealand",
    sourcing: "Traceable; Rainforest Alliance + own programs",
    verdict: "better",
    note: "'Good Egg' two years running; strong traceability for a mid-size maker.",
    tier: "manufacturer",
  },
  {
    id: "meiji",
    name: "Meiji",
    owner: "Meiji Holdings / Tokyo, Japan",
    sourcing: "W. Africa, Venezuela, etc.",
    verdict: "caution",
    note: "Assessed; large Japanese maker, improving disclosure.",
    tier: "manufacturer",
  },
  {
    id: "morinaga-lotte-glico",
    name: "Morinaga / Lotte / Glico",
    owner: "Japan & South Korea",
    sourcing: "Bulk via traders incl. Asian grinders",
    verdict: "caution",
    note: "Assessed Asian majors; participation up, traceability limited.",
    tier: "manufacturer",
    aliases: ["Morinaga", "Lotte", "Glico"],
  },
  {
    id: "orkla-migros-stollwerck-kruger",
    name: "Orkla / Migros / Stollwerck / Krüger",
    owner: "Europe",
    sourcing: "Bulk via traders",
    verdict: "caution",
    note: "Assessed European makers & private-label producers; mid-pack.",
    tier: "manufacturer",
    aliases: ["Orkla", "Stollwerck", "Krüger"],
  },
  {
    id: "cemoi",
    name: "Cémoi",
    owner: "Cémoi / France",
    sourcing: "W. Africa; own programs",
    verdict: "caution",
    note: "French maker & processor; engaging but conventional.",
    tier: "manufacturer",
  },
];

// ── 2. Cocoa traders, grinders & processors ──────────────────────────────────

const TRADERS: ChocolateEntry[] = [
  {
    id: "barry-callebaut",
    name: "Barry Callebaut",
    owner: "Barry Callebaut / Zurich, Switzerland",
    sourcing: "Côte d'Ivoire, Ghana, Cameroon (direct + bulk)",
    verdict: "caution",
    note: "World's largest processor; disclosed direct suppliers, but found buying from illegal-deforestation areas; named in Brazil case. Makes for most brands incl. Tony's.",
    tier: "trader",
  },
  {
    id: "cargill",
    name: "Cargill",
    owner: "Cargill (private) / Minnetonka, MN, USA",
    sourcing: "W. Africa, Brazil, Indonesia",
    verdict: "avoid",
    note: "Brazilian Labour Court found it liable for child & forced labor (2021); co-defendant in US cocoa suits; illegal-area sourcing.",
    tier: "trader",
  },
  {
    id: "olam",
    name: "Olam (ofi)",
    owner: "Olam Food Ingredients / Singapore",
    sourcing: "W. Africa, Nigeria, Indonesia",
    verdict: "caution",
    note: "Co-defendant in forced-child-labor suit; named in Brazil case & illegal-area sourcing; large 'AtSource' program.",
    tier: "trader",
  },
  {
    id: "ecom",
    name: "ECOM Agroindustrial",
    owner: "ECOM / Pully, Switzerland",
    sourcing: "Ghana, L. America",
    verdict: "caution",
    note: "Runs Lindt's Ghana farming program; major trader with limited public farm transparency.",
    tier: "trader",
  },
  {
    id: "touton-sucden",
    name: "Touton / Sucden",
    owner: "France",
    sourcing: "W. Africa, L. America",
    verdict: "caution",
    note: "Large French traders; assessed; conventional bulk sourcing.",
    tier: "trader",
    aliases: ["Touton", "Sucden"],
  },
  {
    id: "guan-chong-jb-foods",
    name: "Guan Chong / JB Foods",
    owner: "Malaysia",
    sourcing: "W. Africa, Indonesia",
    verdict: "caution",
    note: "Major Asian grinders; assessed; traceability developing.",
    tier: "trader",
    aliases: ["Guan Chong", "JB Foods"],
  },
  {
    id: "fuji-oil-daito-cacao",
    name: "Fuji Oil / Daito Cacao",
    owner: "Japan",
    sourcing: "W. Africa, Asia",
    verdict: "caution",
    note: "Japanese processors; assessed.",
    tier: "trader",
    aliases: ["Fuji Oil", "Daito Cacao"],
  },
  {
    id: "chocolats-halba",
    name: "Chocolats Halba",
    owner: "Coop (Switzerland) / Wallisellen",
    sourcing: "Direct, agroforestry projects",
    verdict: "better",
    note: "Green egg for pesticides; Coop-owned processor with notable sustainability programs.",
    tier: "trader",
  },
  {
    id: "puratos",
    name: "Puratos",
    owner: "Puratos / Belgium",
    sourcing: "Direct 'Cacao-Trace' program",
    verdict: "better",
    note: "B2B; Cacao-Trace pays farmers a quality premium & chocolate bonus; relatively strong model.",
    tier: "trader",
  },
];

// ── 3. Retailers & supermarket own-brands ────────────────────────────────────

const RETAILERS: ChocolateEntry[] = [
  {
    id: "starbucks",
    name: "Starbucks",
    owner: "Starbucks / Seattle, WA, USA",
    sourcing: "Bulk via traders",
    verdict: "avoid",
    note: "Scored poorly across the board on the 2025 Scorecard incl. traceability; repeatedly challenged by Mighty Earth.",
    tier: "retailer",
  },
  {
    id: "aldi",
    name: "Aldi (Nord & Süd)",
    owner: "Aldi / Germany",
    sourcing: "Own-label via traders; cocoa programs",
    verdict: "caution",
    note: "Among more engaged discounters on cocoa; still bulk-sourced private label.",
    tier: "retailer",
  },
  {
    id: "lidl",
    name: "Lidl",
    owner: "Schwarz Group / Germany",
    sourcing: "Own-label; Way to Go program",
    verdict: "caution",
    note: "Relatively proactive discounter; conventional volumes.",
    tier: "retailer",
  },
  {
    id: "uk-grocers",
    name: "M&S / Waitrose / Sainsbury's / Tesco",
    owner: "UK grocers",
    sourcing: "Own-label; mostly certified",
    verdict: "caution",
    note: "UK grocers tend to use certification; M&S & Waitrose usually rate better than peers.",
    tier: "retailer",
    aliases: ["M&S", "Marks & Spencer", "Waitrose", "Sainsbury's", "Tesco"],
  },
  {
    id: "us-big-box",
    name: "Costco / Walmart / Target / Kroger / Albertsons",
    owner: "US big-box & grocery",
    sourcing: "Own-label (e.g. Kirkland) via traders",
    verdict: "caution",
    note: "Assessed; large private-label buyers with limited public cocoa traceability.",
    tier: "retailer",
    aliases: ["Costco", "Kirkland", "Walmart", "Target", "Kroger", "Albertsons"],
  },
  {
    id: "whole-foods",
    name: "Whole Foods (Amazon)",
    owner: "Amazon / Austin, TX, USA",
    sourcing: "365 own-label; some fairtrade",
    verdict: "caution",
    note: "Carries many ethical brands but own-label sourcing is conventional.",
    tier: "retailer",
    aliases: ["365", "Whole Foods Market"],
  },
  {
    id: "cvs-walgreens",
    name: "CVS / Walgreens",
    owner: "US pharmacy chains",
    sourcing: "Own-label seasonal chocolate",
    verdict: "caution",
    note: "Assessed; seasonal private label, low transparency.",
    tier: "retailer",
    aliases: ["CVS", "Walgreens"],
  },
  {
    id: "eu-grocers",
    name: "Carrefour / Ahold Delhaize / REWE / Edeka / Colruyt",
    owner: "EU grocers",
    sourcing: "Own-label via traders",
    verdict: "caution",
    note: "Assessed; mixed engagement, mostly certification-reliant.",
    tier: "retailer",
    aliases: ["Carrefour", "Ahold Delhaize", "REWE", "Edeka", "Colruyt"],
  },
  {
    id: "au-nz-grocers",
    name: "Coles / Woolworths / Whittaker retailers (AU/NZ)",
    owner: "Australia / NZ",
    sourcing: "Own-label",
    verdict: "caution",
    note: "Assessed; improving but conventional own-label.",
    tier: "retailer",
    aliases: ["Coles", "Woolworths"],
  },
  {
    id: "migros-coop-ch",
    name: "Migros / Coop (Switzerland)",
    owner: "Switzerland",
    sourcing: "Own-label; Halba processor (Coop)",
    verdict: "better",
    note: "Swiss co-ops with stronger-than-average own-brand cocoa programs (esp. Coop via Halba).",
    tier: "retailer",
  },
];

// ── 4. Ethical & craft leaders (the 'buy these' tier) ────────────────────────

const LEADERS: ChocolateEntry[] = [
  {
    id: "tonys-chocolonely",
    name: "Tony's Chocolonely",
    owner: "Tony's / Amsterdam, Netherlands",
    sourcing: "Direct co-ops, Ghana & Côte d'Ivoire; living-income price",
    verdict: "leader",
    note: "Topped the 2025 Scorecard; open-chain model; transparently reports & remediates child-labor cases.",
    tier: "leader",
  },
  {
    id: "beyond-good",
    name: "Beyond Good",
    owner: "Beyond Good / Brooklyn, NY + Madagascar",
    sourcing: "Direct: Madagascar & Uganda; made in origin",
    verdict: "leader",
    note: "2025 'Good Egg' (small companies); farmers earn ~5-6x W. African norm; full traceability.",
    tier: "leader",
  },
  {
    id: "divine-chocolate",
    name: "Divine Chocolate",
    owner: "Divine / London & Washington DC",
    sourcing: "Ghana via farmer-owned Kuapa Kokoo co-op",
    verdict: "leader",
    note: "Co-owned by its cocoa farmers (profit share + board seats); Fairtrade.",
    tier: "leader",
  },
  {
    id: "equal-exchange",
    name: "Equal Exchange",
    owner: "Equal Exchange (co-op) / West Bridgewater, MA",
    sourcing: "40+ smallholder co-ops (Peru, Ecuador, DR, Panama)",
    verdict: "leader",
    note: "Worker-owned; strict fair-trade; sources outside high-risk W. Africa.",
    tier: "leader",
  },
  {
    id: "taza-chocolate",
    name: "Taza Chocolate",
    owner: "Taza / Somerville, MA, USA",
    sourcing: "Direct Trade: DR, Haiti, Belize, Bolivia, Peru",
    verdict: "leader",
    note: "Publishes annual Transparency Reports of exact prices paid; certified Direct Trade.",
    tier: "leader",
  },
  {
    id: "theo-chocolate",
    name: "Theo Chocolate",
    owner: "Theo / Seattle, WA, USA",
    sourcing: "Direct, incl. DR Congo; fixed base price",
    verdict: "better",
    note: "First US Fair Trade bean-to-bar factory; organic; ~40 farmer orgs.",
    tier: "leader",
  },
  {
    id: "alter-eco",
    name: "Alter Eco",
    owner: "Alter Eco / San Francisco, CA, USA",
    sourcing: "Ecuador, Peru, DR co-ops; regenerative",
    verdict: "better",
    note: "2025 'Good Egg'; organic + fair trade moving to regenerative agroforestry.",
    tier: "leader",
  },
  {
    id: "pacari",
    name: "Pacari",
    owner: "Pacari / Quito, Ecuador",
    sourcing: "Single-origin Ecuador; family-owned",
    verdict: "better",
    note: "Farm-to-bar, organic, made in origin; FEP-recommended.",
    tier: "leader",
  },
  {
    id: "original-beans",
    name: "Original Beans",
    owner: "Original Beans / Amsterdam, Netherlands",
    sourcing: "Single-origin DR Congo, Peru, Bolivia",
    verdict: "better",
    note: "Best-for-organic on Scorecard; reforestation ('one bar, one tree').",
    tier: "leader",
  },
  {
    id: "chocolatemakers",
    name: "Chocolatemakers",
    owner: "Chocolatemakers / Amsterdam, NL",
    sourcing: "Congo, DR; sail-shipped cocoa",
    verdict: "better",
    note: "100% organic; among Scorecard's top for organic sourcing.",
    tier: "leader",
  },
  {
    id: "malmo-chokladfabrik",
    name: "Malmö Chokladfabrik",
    owner: "Malmö / Sweden",
    sourcing: "Single-origin, organic",
    verdict: "better",
    note: "Scorecard standout for 100% organic cocoa.",
    tier: "leader",
  },
  {
    id: "bennetto",
    name: "Bennetto",
    owner: "Bennetto / New Zealand",
    sourcing: "Fairtrade + organic, L. America",
    verdict: "better",
    note: "Scorecard standout for 100% organic cocoa; Fairtrade.",
    tier: "leader",
  },
  {
    id: "choba-choba",
    name: "Choba Choba",
    owner: "Choba Choba / Switzerland & Peru",
    sourcing: "Farmer-owned, single-origin Peru",
    verdict: "better",
    note: "Cocoa farmers are co-owners of the brand; Amazon Peru sourcing.",
    tier: "leader",
  },
  {
    id: "dandelion",
    name: "Dandelion",
    owner: "Dandelion / San Francisco, CA, USA",
    sourcing: "Single-farm direct trade",
    verdict: "better",
    note: "Craft bean-to-bar; published sourcing, two-ingredient bars.",
    tier: "leader",
  },
  {
    id: "lagustas-luscious",
    name: "Lagusta's Luscious",
    owner: "Lagusta's / New Paltz, NY, USA",
    sourcing: "Fair-trade / traceable, vegan",
    verdict: "better",
    note: "FEP-recommended; small-batch vegan, low-plastic packaging.",
    tier: "leader",
  },
  {
    id: "endangered-species",
    name: "Endangered Species",
    owner: "Endangered Species / Indianapolis, USA",
    sourcing: "Trade-certified; gives back to conservation",
    verdict: "better",
    note: "Fair-trade-certified mass-availability brand; donates % of profits.",
    tier: "leader",
  },
];

export const CHOCOLATE_DIRECTORY: ChocolateEntry[] = [
  ...MANUFACTURERS,
  ...TRADERS,
  ...RETAILERS,
  ...LEADERS,
];

// ── Quick parent-company index (trace any product) ───────────────────────────

export interface ParentIndexRow {
  parent: string;
  brands: string[];
}

export const PARENT_INDEX: ParentIndexRow[] = [
  { parent: "Hershey", brands: ["Reese's", "Kisses", "Kit Kat (US)", "Hershey's", "Heath", "Almond Joy", "Mounds", "Jolly Rancher"] },
  { parent: "Mars", brands: ["M&M's", "Snickers", "Twix", "Dove", "Bounty", "Milky Way", "Galaxy", "Maltesers", "Kellanova snacks"] },
  { parent: "Mondelez", brands: ["Cadbury", "Oreo", "Toblerone", "Milka", "Green & Black's", "Côte d'Or", "Chips Ahoy"] },
  { parent: "Nestlé", brands: ["KitKat (global)", "Aero", "Smarties", "Quality Street", "Toll House (US baking)"] },
  { parent: "Ferrero", brands: ["Nutella", "Kinder", "Ferrero Rocher", "Raffaello", "Tic Tac", "Butterfinger", "Crunch", "Baby Ruth (US)"] },
  { parent: "Lindt & Sprüngli", brands: ["Lindt", "Lindor", "Ghirardelli", "Russell Stover", "Whitman's"] },
  { parent: "Storck", brands: ["Werther's Original", "Toffifee", "Merci", "Riesen", "Knoppers"] },
];

// ── Sources ──────────────────────────────────────────────────────────────────

export interface DirectorySource {
  label: string;
  url?: string;
}

export const SOURCES: DirectorySource[] = [
  { label: "Be Slavery Free — 2025 Chocolate Scorecard (81 companies)", url: "https://www.chocolatescorecard.com" },
  { label: "Mighty Earth — 'The scores are in, and this year's chocolate villain is…' (Apr 2025)", url: "https://www.mightyearth.org" },
  { label: "Business & Human Rights Resource Centre — 2025 Chocolate Scorecard company list & case files", url: "https://www.business-humanrights.org" },
  { label: "Food Empowerment Project — Chocolate List (recommended / not recommended)", url: "https://foodispower.org/chocolate-list" },
  { label: "Green America — Chocolate Scorecard & 'Good/Rotten Egg' awards", url: "https://www.greenamerica.org" },
  { label: "University of Wollongong — 2025 Scorecard rankings summary (Good Eggs: Beyond Good, Whittaker's, Alter Eco)", url: "https://www.uow.edu.au" },
  { label: "New Food Magazine; Confectionery Production; Sustainable Brands — Scorecard coverage" },
  { label: "Prior reports in this series: NORC/U. Chicago child-labor data; Nestlé v. Doe (SCOTUS); Coubaly v. Cargill; Consumer Reports heavy-metals; Cocoa Barometer; brand disclosures." },
];

export const DIRECTORY_INTRO =
  "This directory rates roughly 100 chocolate makers, cocoa traders and major retailers — covering essentially every large product on the U.S. and global shelf, plus the leading ethical and craft brands. The backbone is the 2025 Chocolate Scorecard (Be Slavery Free / Mighty Earth, 81 companies), cross-referenced with the Food Empowerment Project list, Green America, and the lawsuit/investigation record.";

export const DIRECTORY_PREPARED = "Prepared June 22, 2026";

// ── Lookups ──────────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/['’`.]/g, "")
    .replace(/&/g, " and ")
    .replace(/\s+/g, " ")
    .trim();
}

// Pre-compute a normalized search index: each entry maps to its name + aliases.
interface IndexedEntry {
  entry: ChocolateEntry;
  needles: string[]; // normalized name + aliases, longest first
}

let SEARCH_INDEX: IndexedEntry[] | null = null;

function buildIndex(): IndexedEntry[] {
  return CHOCOLATE_DIRECTORY.map((entry) => {
    const raw = [entry.name, ...(entry.aliases ?? [])];
    const needles = [
      ...new Set(
        raw
          // split combined names like "Coles / Woolworths" into parts too
          .flatMap((n) => [n, ...n.split(/\s*\/\s*/)])
          .map(normalize)
          .filter((n) => n.length >= 3),
      ),
    ].sort((a, b) => b.length - a.length);
    return { entry, needles };
  });
}

/**
 * Match a scanned product's brand / name to a directory entry — by the brand
 * itself or by a sub-brand it owns (e.g. "Kit Kat" → Hershey/Nestlé, "Cadbury"
 * → Mondelez). Returns the best (longest-needle) match, or null.
 */
export function findChocolateEntry(
  brand: string | null | undefined,
  productName?: string | null | undefined,
): ChocolateEntry | null {
  const haystack = normalize(`${brand ?? ""} ${productName ?? ""}`);
  if (!haystack) return null;
  if (!SEARCH_INDEX) SEARCH_INDEX = buildIndex();

  let best: { entry: ChocolateEntry; len: number } | null = null;
  for (const { entry, needles } of SEARCH_INDEX) {
    for (const needle of needles) {
      // Whole-word-ish match: needle bounded by start/end or non-word chars.
      const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(needle)}([^a-z0-9]|$)`);
      if (re.test(haystack)) {
        if (!best || needle.length > best.len) best = { entry, len: needle.length };
        break;
      }
    }
  }
  return best?.entry ?? null;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** All entries with a given verdict. */
export function getEntriesByVerdict(verdict: ChocolateVerdict): ChocolateEntry[] {
  return CHOCOLATE_DIRECTORY.filter((e) => e.verdict === verdict);
}

/** All entries in a given tier/section. */
export function getEntriesByTier(tier: ChocolateTier): ChocolateEntry[] {
  return CHOCOLATE_DIRECTORY.filter((e) => e.tier === tier);
}

/**
 * The "buy these" tier: LEADER and BETTER makers, ranked leaders first. Used to
 * feed the swap engine when a CAUTION/AVOID chocolate is scanned.
 */
export function getChocolateLeaders(): ChocolateEntry[] {
  return CHOCOLATE_DIRECTORY.filter(
    (e) => (e.verdict === "leader" || e.verdict === "better") && e.tier === "leader",
  ).sort((a, b) => VERDICT_META[a.verdict].rank - VERDICT_META[b.verdict].rank);
}

export const DIRECTORY_STATS = {
  total: CHOCOLATE_DIRECTORY.length,
  leaders: CHOCOLATE_DIRECTORY.filter((e) => e.verdict === "leader").length,
  better: CHOCOLATE_DIRECTORY.filter((e) => e.verdict === "better").length,
  caution: CHOCOLATE_DIRECTORY.filter((e) => e.verdict === "caution").length,
  avoid: CHOCOLATE_DIRECTORY.filter((e) => e.verdict === "avoid").length,
};
