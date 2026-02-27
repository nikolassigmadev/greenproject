// Brand-level labor and ethics flags from independent research.
// These overlay on top of OpenFoodFacts data which lacks labor information.
//
// HOW TO ADD A NEW FLAG:
//   1. Add the brand name (lowercase) as a key
//   2. Fill in the flag details — severity, allegation, and sources
//   3. The app will automatically match products by brand name
//
// Severity levels:
//   "critical"  — Documented forced labor, child labor, or slavery
//   "high"      — Serious allegations with credible evidence
//   "medium"    — Ongoing concerns or unresolved investigations

export interface BrandFlag {
  severity: "critical" | "high" | "medium";
  allegation: string;
  sources: string[];
}

// Helper to avoid repeating the same flag object for parent + sub-brands.
// Keys are lowercase brand names. When matching, the product brand
// is lowercased and checked with `includes` so "Nestlé S.A." matches "nestlé".

// ────────────────────────────────────────────
// Shared flag objects (parent companies)
// ────────────────────────────────────────────

const NESTLE_FLAG: BrandFlag = {
  severity: "critical",
  allegation:
    "Nestlé has faced multiple lawsuits alleging the use of child labor and forced labor in its cocoa supply chain in West Africa, including a U.S. Supreme Court case (Nestlé USA v. Doe, 2021). Also linked to child labor in coffee (Guatemala) and forced labor in palm oil (Malaysia).",
  sources: [
    "Nestlé USA, Inc. v. Doe (U.S. Supreme Court, 2021)",
    "U.S. Department of Labor — List of Goods Produced by Child Labor",
    "International Labour Rights Forum",
    "Amnesty International — palm oil report (2016)",
  ],
};

const MARS_FLAG: BrandFlag = {
  severity: "critical",
  allegation:
    "Mars was named defendant in child trafficking and forced labor lawsuits related to cocoa sourcing from Ivory Coast. Malian plaintiffs alleged they were trafficked as children to harvest cocoa for Mars.",
  sources: [
    "IRA Advocates — Coubaly et al. v. Nestlé, Cargill, Mars, et al.",
    "Washington Post — cocoa child labor investigation (2019)",
    "U.S. DOL TVPRA List — cocoa (Ivory Coast, Ghana)",
  ],
};

const HERSHEY_FLAG: BrandFlag = {
  severity: "critical",
  allegation:
    "Hershey was named defendant in child labor lawsuits regarding cocoa sourcing from West Africa. A Washington Post investigation found Hershey broke pledges to end child labor in chocolate.",
  sources: [
    "IRA Advocates — cocoa child labor lawsuit",
    "Washington Post — \"Hershey, Nestlé and Mars broke their pledges\" (2019)",
    "U.S. DOL TVPRA List — cocoa",
  ],
};

const MONDELEZ_FLAG: BrandFlag = {
  severity: "critical",
  allegation:
    "Mondelēz International (formerly Kraft Foods) was named defendant in cocoa child labor lawsuits. Malian plaintiffs alleged trafficking and forced child labor on Ivory Coast cocoa farms supplying the company.",
  sources: [
    "IRA Advocates — cocoa child labor lawsuit (2021)",
    "U.S. DOL TVPRA List — cocoa",
    "Oxfam — Behind the Brands scorecard",
  ],
};

const FERRERO_FLAG: BrandFlag = {
  severity: "critical",
  allegation:
    "BBC and Guardian investigations documented children as young as 11 picking hazelnuts in Turkey for Ferrero, the world's largest hazelnut buyer. Also linked to child labor in cocoa supply chain in West Africa.",
  sources: [
    "BBC investigation — Ferrero hazelnuts, Turkey",
    "The Guardian investigation — hazelnut child labor",
    "U.S. DOL TVPRA List — cocoa, hazelnuts",
  ],
};

const COCA_COLA_FLAG: BrandFlag = {
  severity: "high",
  allegation:
    "Human Rights Watch documented child labor on sugar plantations in El Salvador supplying Coca-Cola. NYT/Fuller Project investigation found child labor and debt bondage on Indian sugar cane farms in its supply chain.",
  sources: [
    "Human Rights Watch — El Salvador sugar (2004)",
    "NYT/Fuller Project — India sugar investigation",
    "U.S. DOL TVPRA List — sugar",
  ],
};

const PEPSICO_FLAG: BrandFlag = {
  severity: "high",
  allegation:
    "NYT/Fuller Project investigation linked PepsiCo's Indian sugar supply chain to child labor and debt bondage. Also flagged for sourcing palm oil from FGV, a supplier linked to forced labor in Malaysia.",
  sources: [
    "NYT/Fuller Project — India sugar investigation",
    "Rainforest Action Network — palm oil report",
    "U.S. DOL TVPRA List — sugar, palm oil",
  ],
};

const UNILEVER_FLAG: BrandFlag = {
  severity: "high",
  allegation:
    "Amnesty International traced palm oil from Wilmar (linked to child and forced labor in Indonesia) to Unilever products. BBC investigation also found degrading conditions on tea estates in Assam, India supplying Unilever brands.",
  sources: [
    "Amnesty International — \"The Great Palm Oil Scandal\" (2016)",
    "AP — palm oil investigation (2020)",
    "BBC — Assam tea estate investigation",
  ],
};

const FANJUL_FLAG: BrandFlag = {
  severity: "critical",
  allegation:
    "U.S. Customs and Border Protection banned sugar imports from Central Romana (Fanjul/ASR Group supplier) in 2022 over forced labor findings. Workers paid as little as $4/day, passports confiscated, housed without electricity or running water.",
  sources: [
    "U.S. CBP Withhold Release Order (2022)",
    "NPR — Dominican Republic sugar ban",
    "Corporate Accountability Lab",
  ],
};

const KELLOGG_FLAG: BrandFlag = {
  severity: "high",
  allegation:
    "Named by Amnesty International as one of nine companies profiting from child and forced labor in palm oil supply through Wilmar International in Indonesia.",
  sources: [
    "Amnesty International — palm oil report (2016)",
    "Oxfam — Behind the Brands scorecard",
  ],
};

const TYSON_FLAG: BrandFlag = {
  severity: "critical",
  allegation:
    "U.S. DOL investigation for employing minors at poultry plants. A sanitation subcontractor employed children as young as 13 to clean Tyson and other meatpacking plants across 8 states.",
  sources: [
    "U.S. DOL investigation (2024)",
    "Investigate Midwest — child labor in meatpacking",
    "DOL sanitation subcontractor fine (2022)",
  ],
};

const KRAFT_HEINZ_FLAG: BrandFlag = {
  severity: "medium",
  allegation:
    "Coffee brands sourced through supply chains with documented forced labor. Palm oil used in products sourced from suppliers with child labor allegations.",
  sources: [
    "U.S. DOL TVPRA List — coffee, palm oil",
    "Amnesty International — palm oil report (2016)",
  ],
};

const GENERAL_MILLS_FLAG: BrandFlag = {
  severity: "medium",
  allegation:
    "Uses palm oil and cocoa sourced from supply chains with documented child and forced labor. Scored poorly on labor rights in Oxfam's Behind the Brands campaign.",
  sources: [
    "Oxfam — Behind the Brands scorecard",
    "U.S. DOL TVPRA List — cocoa, palm oil, sugar",
  ],
};

const ABF_FLAG: BrandFlag = {
  severity: "medium",
  allegation:
    "Tied for last place in Oxfam Behind the Brands scorecard. Silver Spoon sugar sourced from supply chains involving child labor. Twinings tea estates linked to BBC Assam investigation.",
  sources: [
    "Oxfam — Behind the Brands scorecard",
    "BBC — Assam tea estate investigation",
    "U.S. DOL TVPRA List — sugar, tea",
  ],
};

const DANONE_FLAG: BrandFlag = {
  severity: "medium",
  allegation:
    "Scored among the lowest on Oxfam's Behind the Brands campaign for labor rights. Uses palm oil sourced from supply chains with forced labor concerns.",
  sources: [
    "Oxfam — Behind the Brands scorecard",
  ],
};

// ────────────────────────────────────────────
// Brand flags registry
// ────────────────────────────────────────────

export const brandFlags: Record<string, BrandFlag> = {
  // ── NESTLÉ & sub-brands ──
  "nestlé": NESTLE_FLAG,
  "nestle": NESTLE_FLAG,
  "nescafé": NESTLE_FLAG,
  "nescafe": NESTLE_FLAG,
  "nespresso": NESTLE_FLAG,
  "nesquik": NESTLE_FLAG,
  "maggi": NESTLE_FLAG,
  "stouffer": NESTLE_FLAG,
  "digiorno": NESTLE_FLAG,
  "toll house": NESTLE_FLAG,
  "coffee-mate": NESTLE_FLAG,
  "coffeemate": NESTLE_FLAG,
  "carnation": NESTLE_FLAG,
  "gerber": NESTLE_FLAG,
  "kitkat": NESTLE_FLAG,
  "kit kat": NESTLE_FLAG,
  "smarties": NESTLE_FLAG,
  "aero": NESTLE_FLAG,
  "perrier": NESTLE_FLAG,
  "s.pellegrino": NESTLE_FLAG,
  "san pellegrino": NESTLE_FLAG,
  "poland spring": NESTLE_FLAG,
  "purina": NESTLE_FLAG,
  "fancy feast": NESTLE_FLAG,
  "friskies": NESTLE_FLAG,

  // ── MARS & sub-brands ──
  "mars": MARS_FLAG,
  "m&m": MARS_FLAG,
  "snickers": MARS_FLAG,
  "twix": MARS_FLAG,
  "milky way": MARS_FLAG,
  "3 musketeers": MARS_FLAG,
  "dove chocolate": MARS_FLAG,
  "galaxy": MARS_FLAG,
  "skittles": MARS_FLAG,
  "starburst": MARS_FLAG,
  "extra gum": MARS_FLAG,
  "orbit": MARS_FLAG,
  "altoids": MARS_FLAG,
  "ben's original": MARS_FLAG,
  "uncle ben": MARS_FLAG,
  "dolmio": MARS_FLAG,
  "seeds of change": MARS_FLAG,
  "tasty bite": MARS_FLAG,
  "pedigree": MARS_FLAG,
  "whiskas": MARS_FLAG,

  // ── HERSHEY & sub-brands ──
  "hershey": HERSHEY_FLAG,
  "reese": HERSHEY_FLAG,
  "jolly rancher": HERSHEY_FLAG,
  "twizzler": HERSHEY_FLAG,
  "almond joy": HERSHEY_FLAG,
  "mounds": HERSHEY_FLAG,
  "york peppermint": HERSHEY_FLAG,
  "heath": HERSHEY_FLAG,
  "whoppers": HERSHEY_FLAG,
  "milk duds": HERSHEY_FLAG,
  "payday": HERSHEY_FLAG,
  "skinnypop": HERSHEY_FLAG,
  "pirate's booty": HERSHEY_FLAG,
  "brookside": HERSHEY_FLAG,

  // ── MONDELĒZ & sub-brands ──
  "mondelez": MONDELEZ_FLAG,
  "mondelēz": MONDELEZ_FLAG,
  "cadbury": MONDELEZ_FLAG,
  "oreo": MONDELEZ_FLAG,
  "toblerone": MONDELEZ_FLAG,
  "milka": MONDELEZ_FLAG,
  "chips ahoy": MONDELEZ_FLAG,
  "ritz": MONDELEZ_FLAG,
  "triscuit": MONDELEZ_FLAG,
  "wheat thins": MONDELEZ_FLAG,
  "belvita": MONDELEZ_FLAG,
  "sour patch": MONDELEZ_FLAG,
  "swedish fish": MONDELEZ_FLAG,
  "tang": MONDELEZ_FLAG,
  "halls": MONDELEZ_FLAG,
  "nabisco": MONDELEZ_FLAG,
  "clif bar": MONDELEZ_FLAG,
  "côte d'or": MONDELEZ_FLAG,
  "cote d'or": MONDELEZ_FLAG,
  "green & black": MONDELEZ_FLAG,
  "marabou": MONDELEZ_FLAG,
  "lu biscuit": MONDELEZ_FLAG,
  "tate's bake": MONDELEZ_FLAG,
  "prince biscuit": MONDELEZ_FLAG,

  // ── FERRERO & sub-brands ──
  "ferrero": FERRERO_FLAG,
  "nutella": FERRERO_FLAG,
  "kinder": FERRERO_FLAG,
  "tic tac": FERRERO_FLAG,
  "thorntons": FERRERO_FLAG,
  "butterfinger": FERRERO_FLAG,

  // ── LINDT & sub-brands ──
  "lindt": {
    severity: "high",
    allegation:
      "Swiss TV investigation (2024) documented child labor on Ghanaian cocoa farms supplying Lindt, despite the company's own prevention program. Lindt's own audits found 87 child workers during surprise visits in 2021.",
    sources: [
      "Swiss TV Rundschau investigation (2024)",
      "Lindt forced labour report (2023)",
    ],
  },
  "lindor": {
    severity: "high",
    allegation:
      "Lindor is a Lindt brand. Swiss TV investigation (2024) documented child labor on cocoa farms supplying Lindt in Ghana.",
    sources: [
      "Swiss TV Rundschau investigation (2024)",
    ],
  },
  "ghirardelli": {
    severity: "high",
    allegation:
      "Ghirardelli is owned by Lindt. Swiss TV investigation (2024) documented child labor on cocoa farms supplying the parent company.",
    sources: [
      "Swiss TV Rundschau investigation (2024)",
    ],
  },
  "russell stover": {
    severity: "high",
    allegation:
      "Russell Stover is owned by Lindt. Cocoa supply chain linked to child labor in Ghana.",
    sources: [
      "Swiss TV Rundschau investigation (2024)",
    ],
  },

  // ── COCA-COLA & sub-brands ──
  "coca-cola": COCA_COLA_FLAG,
  "coca cola": COCA_COLA_FLAG,
  "diet coke": COCA_COLA_FLAG,
  "coke zero": COCA_COLA_FLAG,
  "sprite": COCA_COLA_FLAG,
  "fanta": COCA_COLA_FLAG,
  "minute maid": COCA_COLA_FLAG,
  "simply orange": COCA_COLA_FLAG,
  "dasani": COCA_COLA_FLAG,
  "powerade": COCA_COLA_FLAG,
  "vitaminwater": COCA_COLA_FLAG,
  "smartwater": COCA_COLA_FLAG,
  "gold peak": COCA_COLA_FLAG,
  "fuze tea": COCA_COLA_FLAG,
  "fairlife": COCA_COLA_FLAG,
  "bodyarmor": COCA_COLA_FLAG,
  "costa coffee": COCA_COLA_FLAG,
  "topo chico": COCA_COLA_FLAG,

  // ── PEPSICO & sub-brands ──
  "pepsi": PEPSICO_FLAG,
  "pepsico": PEPSICO_FLAG,
  "mountain dew": PEPSICO_FLAG,
  "gatorade": PEPSICO_FLAG,
  "tropicana": PEPSICO_FLAG,
  "lay's": PEPSICO_FLAG,
  "lays": PEPSICO_FLAG,
  "doritos": PEPSICO_FLAG,
  "cheetos": PEPSICO_FLAG,
  "tostitos": PEPSICO_FLAG,
  "fritos": PEPSICO_FLAG,
  "ruffles": PEPSICO_FLAG,
  "quaker": PEPSICO_FLAG,
  "cap'n crunch": PEPSICO_FLAG,
  "aquafina": PEPSICO_FLAG,
  "sierra mist": PEPSICO_FLAG,
  "stacy's": PEPSICO_FLAG,
  "sunchips": PEPSICO_FLAG,
  "sabra": PEPSICO_FLAG,
  "life cereal": PEPSICO_FLAG,

  // ── STARBUCKS (packaged grocery products) ──
  "starbucks": {
    severity: "high",
    allegation:
      "Channel 4 investigation found child labor on all 5 Starbucks-linked coffee farms visited in Guatemala, with children as young as 8. Brazilian workers sued over forced labor at a certified supplier.",
    sources: [
      "Channel 4 Dispatches investigation",
      "Business & Human Rights Resource Centre — Brazil lawsuit (2024)",
    ],
  },

  // ── UNILEVER & sub-brands ──
  "unilever": UNILEVER_FLAG,
  "hellmann": UNILEVER_FLAG,
  "hellman": UNILEVER_FLAG,
  "best foods": UNILEVER_FLAG,
  "knorr": UNILEVER_FLAG,
  "ben & jerry": UNILEVER_FLAG,
  "ben and jerry": UNILEVER_FLAG,
  "breyers": UNILEVER_FLAG,
  "magnum": UNILEVER_FLAG,
  "good humor": UNILEVER_FLAG,
  "klondike": UNILEVER_FLAG,
  "popsicle": UNILEVER_FLAG,
  "marmite": UNILEVER_FLAG,
  "bovril": UNILEVER_FLAG,
  "colman's": UNILEVER_FLAG,
  "lipton": UNILEVER_FLAG,
  "pg tips": UNILEVER_FLAG,

  // ── TEA brands (independent from Unilever) ──
  "twinings": ABF_FLAG,
  "tetley": {
    severity: "high",
    allegation:
      "BBC investigation found degrading working conditions on Indian tea estates in Assam supplying Tetley. Workers lacked proper equipment, housing, and sanitation.",
    sources: [
      "BBC — Assam tea estate investigation",
      "Business & Human Rights Resource Centre",
    ],
  },

  // ── COFFEE brands ──
  "folgers": {
    severity: "medium",
    allegation:
      "Purchasing through supply chains linked to Brazilian plantations where workers were found in slavery-like conditions. DOL lists coffee from multiple countries as produced with child or forced labor.",
    sources: [
      "Danwatch investigation",
      "U.S. DOL TVPRA List — coffee",
    ],
  },
  "maxwell house": KRAFT_HEINZ_FLAG,
  "lavazza": {
    severity: "medium",
    allegation:
      "Cited in investigative reports regarding suppliers linked to farms with slavery-like working conditions in Brazil's coffee sector.",
    sources: [
      "Reporter Brasil investigation (2022)",
      "Danwatch",
    ],
  },
  "illy": {
    severity: "medium",
    allegation:
      "OECD complaints filed detailing slavery-like conditions on coffee farms supplying Illy. Company confirmed purchasing from cooperatives linked to plantations where authorities liberated workers.",
    sources: [
      "Danwatch investigation",
      "OECD complaint (2018)",
    ],
  },

  // ── SUGAR brands (Fanjul / ASR Group) ──
  "domino": FANJUL_FLAG,
  "c&h": FANJUL_FLAG,
  "florida crystals": FANJUL_FLAG,
  "redpath": FANJUL_FLAG,
  "tate & lyle": FANJUL_FLAG,

  // ── SEAFOOD ──
  "chicken of the sea": {
    severity: "critical",
    allegation:
      "Parent company Thai Union linked to forced labor and slavery on Thai fishing vessels. AP investigation found workers forced to work 18–20 hour days, held at sea for years, and not paid.",
    sources: [
      "Associated Press investigation (2015)",
      "Greenpeace — Thai Union report",
    ],
  },
  "bumble bee": {
    severity: "critical",
    allegation:
      "2025 lawsuit alleges Bumble Bee knew fishing vessels in its supply fleet used forced labor. Indonesian workers subjected to physical abuse, debt bondage, and deprivation.",
    sources: [
      "Federal lawsuit — San Diego (2025)",
      "Greenpeace report",
      "Global Labor Justice-ILRF",
    ],
  },

  // ── MEAT & POULTRY ──
  "tyson": TYSON_FLAG,
  "jimmy dean": TYSON_FLAG,
  "hillshire farm": TYSON_FLAG,
  "ball park": TYSON_FLAG,
  "aidells": TYSON_FLAG,
  "wright brand": TYSON_FLAG,
  "jbs": {
    severity: "high",
    allegation:
      "Children as young as 13 found cleaning JBS meatpacking plants via a sanitation subcontractor. Settled wage-fixing conspiracy lawsuit for $127M+.",
    sources: [
      "U.S. DOL sanitation subcontractor investigation (2022)",
      "Wage-fixing settlement (2024)",
    ],
  },
  "pilgrim's pride": {
    severity: "high",
    allegation:
      "Subsidiary of JBS. Children found cleaning meatpacking plants via sanitation subcontractor.",
    sources: [
      "U.S. DOL sanitation subcontractor investigation (2022)",
    ],
  },
  "just bare": {
    severity: "high",
    allegation:
      "Brand owned by Pilgrim's Pride (JBS). Parent company linked to child labor in meatpacking sanitation.",
    sources: [
      "U.S. DOL sanitation subcontractor investigation (2022)",
    ],
  },

  // ── FRUIT & PRODUCE ──
  "chiquita": {
    severity: "critical",
    allegation:
      "Human Rights Watch documented children as young as 8 working 12-hour days on banana plantations supplying Chiquita in Ecuador. Found guilty in 2024 of financing Colombian paramilitary groups.",
    sources: [
      "Human Rights Watch — Ecuador (2002)",
      "U.S. Federal Court ruling — Colombia (2024)",
      "Business & Human Rights Resource Centre",
    ],
  },
  "dole": {
    severity: "high",
    allegation:
      "Workers on Dole supply plantations in the Philippines reported harassment and intimidation. Child labor and pesticide exposure documented on supplier plantations in Ecuador.",
    sources: [
      "Human Rights Watch — Ecuador (2002)",
      "Business & Human Rights Resource Centre",
    ],
  },
  "del monte": {
    severity: "high",
    allegation:
      "Human Rights Watch found children working on banana plantations supplying Del Monte in Ecuador. Workers exposed to toxic pesticides and denied right to organize.",
    sources: [
      "Human Rights Watch — Ecuador (2002)",
    ],
  },

  // ── KELLOGG'S / KELLANOVA & sub-brands ──
  "kellogg": KELLOGG_FLAG,
  "frosted flakes": KELLOGG_FLAG,
  "froot loops": KELLOGG_FLAG,
  "rice krispies": KELLOGG_FLAG,
  "corn flakes": KELLOGG_FLAG,
  "special k": KELLOGG_FLAG,
  "nutri-grain": KELLOGG_FLAG,
  "apple jacks": KELLOGG_FLAG,
  "frosted mini": KELLOGG_FLAG,
  "pringles": KELLOGG_FLAG,
  "cheez-it": KELLOGG_FLAG,
  "pop-tarts": KELLOGG_FLAG,
  "eggo": KELLOGG_FLAG,

  // ── KRAFT HEINZ & sub-brands ──
  "kraft": KRAFT_HEINZ_FLAG,
  "heinz": KRAFT_HEINZ_FLAG,
  "oscar mayer": KRAFT_HEINZ_FLAG,
  "philadelphia": KRAFT_HEINZ_FLAG,
  "velveeta": KRAFT_HEINZ_FLAG,
  "jell-o": KRAFT_HEINZ_FLAG,
  "planters": KRAFT_HEINZ_FLAG,
  "lunchables": KRAFT_HEINZ_FLAG,
  "capri sun": KRAFT_HEINZ_FLAG,
  "kool-aid": KRAFT_HEINZ_FLAG,
  "ore-ida": KRAFT_HEINZ_FLAG,

  // ── GENERAL MILLS & sub-brands ──
  "general mills": GENERAL_MILLS_FLAG,
  "cheerios": GENERAL_MILLS_FLAG,
  "wheaties": GENERAL_MILLS_FLAG,
  "lucky charms": GENERAL_MILLS_FLAG,
  "cinnamon toast crunch": GENERAL_MILLS_FLAG,
  "nature valley": GENERAL_MILLS_FLAG,
  "yoplait": GENERAL_MILLS_FLAG,
  "betty crocker": GENERAL_MILLS_FLAG,
  "pillsbury": GENERAL_MILLS_FLAG,
  "häagen-dazs": GENERAL_MILLS_FLAG,
  "haagen-dazs": GENERAL_MILLS_FLAG,
  "old el paso": GENERAL_MILLS_FLAG,
  "progresso": GENERAL_MILLS_FLAG,
  "annie's": GENERAL_MILLS_FLAG,
  "larabar": GENERAL_MILLS_FLAG,
  "totino's": GENERAL_MILLS_FLAG,
  "cascadian farm": GENERAL_MILLS_FLAG,

  // ── DANONE & sub-brands ──
  "danone": DANONE_FLAG,
  "dannon": DANONE_FLAG,
  "activia": DANONE_FLAG,
  "oikos": DANONE_FLAG,
  "evian": DANONE_FLAG,
  "volvic": DANONE_FLAG,
  "aptamil": DANONE_FLAG,

  // ── ASSOCIATED BRITISH FOODS & sub-brands ──
  "ovaltine": ABF_FLAG,
  "kingsmill": ABF_FLAG,
  "patak's": ABF_FLAG,
  "blue dragon": ABF_FLAG,
  "jordans cereal": ABF_FLAG,
  "ryvita": ABF_FLAG,
  "silver spoon": ABF_FLAG,
  "billington": ABF_FLAG,

  // ── CARGILL (B2B but appears on some products) ──
  "cargill": {
    severity: "critical",
    allegation:
      "Named defendant in child trafficking lawsuits alongside Nestlé. Brazilian court found Cargill liable for child and forced labor in cocoa supply chain.",
    sources: [
      "IRA Advocates — cocoa child labor lawsuit",
      "Nestlé USA, Inc. v. Doe (Supreme Court, 2021)",
    ],
  },

  // ── BARRY CALLEBAUT (B2B ingredient supplier) ──
  "barry callebaut": {
    severity: "critical",
    allegation:
      "Named defendant in child trafficking and forced labor lawsuits. Supplies cocoa ingredients to most major chocolate brands. Directly implicated in West African cocoa child labor.",
    sources: [
      "IRA Advocates — cocoa child labor lawsuit",
      "U.S. DOL TVPRA List — cocoa",
    ],
  },

  // ── GODIVA ──
  "godiva": {
    severity: "medium",
    allegation:
      "Ranked last in Green America's Chocolate Scorecard for failing to address labor rights and sustainability in its cocoa supply chain.",
    sources: [
      "Green America — Chocolate Scorecard (2020)",
      "Business & Human Rights Resource Centre",
    ],
  },
};

/**
 * Look up a labor/ethics flag for a given brand string.
 * Returns the flag if found, or null if the brand has no flag.
 */
export function getBrandFlag(brand: string | null | undefined): BrandFlag | null {
  if (!brand) return null;
  const lower = brand.toLowerCase();
  for (const [key, flag] of Object.entries(brandFlags)) {
    if (lower.includes(key)) return flag;
  }
  return null;
}
