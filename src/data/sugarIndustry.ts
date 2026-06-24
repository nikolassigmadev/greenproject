/**
 * Sugar Industry Database — producer / refiner / origin level (US, EU & cane origins)
 *
 * Source: "Sugar Industry Players — Ethics & Sustainability Database" workbook
 * (compiled June 2026). Company records with ownership tracing, certifications,
 * documented accusations, severity ratings and consumer-brand mappings.
 *
 * HOW SEVERITY WORKS
 *  Severe — Forced labor, land grabbing, child bondage — documented by govt/NGO.
 *  High   — Serious environmental harm or major cartel fine, or ownership tie to Severe.
 *  Medium — Regulatory fine, major labor dispute, tax-avoidance allegation.
 *  Low    — Minor/contested concerns; financial stress; general sector risk.
 *  None   — No major documented violation found (NOT a clean-bill guarantee).
 *
 * Source standard: government/regulatory records, established NGOs, reputable
 * journalism. Each accusation carries a source URL. Social media/blogs excluded.
 */

export type SugarSeverity = 'Severe' | 'High' | 'Medium' | 'Low' | 'None';

export interface SugarCompany {
  id: string;
  company: string;
  parent: string;
  country: string;
  region: 'US' | 'EU' | 'Origin';
  productionVolume: string;
  certifications: string;
  accusations: string;
  sourceUrl: string | null;
  severity: SugarSeverity;
  notes: string;
  /** Consumer-facing brands shoppers would see on pack. */
  brands: string[];
}

// ---------------------------------------------------------------------------
// US Sugar
// ---------------------------------------------------------------------------

export const US_SUGAR_COMPANIES: SugarCompany[] = [
  {
    id: 'asr-group',
    company: 'ASR Group (American Sugar Refining)',
    parent: 'Florida Crystals Corp (Fanjul family) + Sugar Cane Growers Co-op of Florida',
    country: 'USA (West Palm Beach, FL)',
    region: 'US',
    productionVolume: "~6M t refined/yr; world's largest cane refiner",
    certifications: 'Bonsucro member; some site-level programs (verify per brand)',
    accusations: "Owner of Central Romana (Dominican Republic), hit with a US CBP forced-labor import ban 2022\u20132025. Brand portfolio tied to Florida Everglades pollution & cane-burning litigation via Florida Crystals.",
    sourceUrl: 'https://www.cbp.gov/newsroom/national-media-release/cbp-issues-withhold-release-order-central-romana-corporation',
    severity: 'High',
    notes: 'Fanjul family also part-owns Central Romana \u2014 links US retail sugar to a forced-labor finding.',
    brands: [
      'Domino', 'Domino Sugar', 'Domino Golden Sugar',
      'C&H', 'C&H Sugar', 'C&H Pure Cane Sugar',
      'Florida Crystals',
      'Redpath', 'Redpath Sugar',
      'Tate & Lyle', "Tate & Lyle's", "Lyle's", "Lyle's Golden Syrup",
      'Sidul',
      'Whitworths',
    ],
  },
  {
    id: 'florida-crystals',
    company: 'Florida Crystals Corp.',
    parent: 'FLO-SUN (Fanjul family)',
    country: 'USA (Florida)',
    region: 'US',
    productionVolume: 'Major FL cane producer; co-owns ASR Group',
    certifications: "'Florida Crystals' organic & carbon-neutral lines (company claims)",
    accusations: "Class actions over pre-harvest cane burning ('black snow', 2020 suit dismissed 2022); NEW 2024 greenwashing suit over 'Farming to Help Save the Planet' marketing while burning cane; Everglades phosphorus runoff.",
    sourceUrl: 'https://clarksonlawfirm.com/major-lawsuit-filed-against-one-of-floridas-largest-sugar-producers-for-greenwashing-and-harmful-farming-practices/',
    severity: 'High',
    notes: 'Environmental-justice concerns in low-income Glades communities; greenwashing claims actively litigated.',
    brands: ['Florida Crystals', 'Florida Crystals Organic'],
  },
  {
    id: 'us-sugar-corp',
    company: 'U.S. Sugar Corporation',
    parent: 'Privately held',
    country: 'USA (Clewiston, FL)',
    region: 'US',
    productionVolume: 'Largest US sugarcane producer; acquired Imperial Sugar (2022)',
    certifications: 'Limited public third-party sustainability certification',
    accusations: "Pre-harvest cane burning & Everglades-area environmental scrutiny. DOJ antitrust challenge to its $315M Imperial Sugar buy FAILED (3rd Cir. upheld merger, 2023). Imperial's Port Wentworth, GA refinery was site of 2008 dust explosion that killed 14 (under prior owner).",
    sourceUrl: 'https://news.bloomberglaw.com/antitrust/us-sugar-imperial-sugar-deal-beats-doj-appeal-at-third-circuit',
    severity: 'Medium',
    notes: 'Cane burning is the live environmental issue.',
    brands: ['Imperial', 'Imperial Sugar', 'Dixie Crystals'],
  },
  {
    id: 'american-crystal',
    company: 'American Crystal Sugar Company',
    parent: 'Grower cooperative (Red River Valley)',
    country: 'USA (Moorhead, MN)',
    region: 'US',
    productionVolume: 'Largest US beet sugar producer',
    certifications: 'SAI/sustainability programs (verify)',
    accusations: '2011\u20132013: locked out ~1,300 BCTGM union workers across 5 plants for ~20 months \u2014 one of the longest US lockouts; ended with concessionary contract.',
    sourceUrl: 'https://inthesetimes.com/article/for-union-members-crystal-sugar-lockout-outcome-anything-but-sweet',
    severity: 'Medium',
    notes: 'Labor-relations dispute (lockout), not a regulatory violation. Union ranks fell sharply afterward.',
    brands: ['Crystal Sugar', 'American Crystal Sugar'],
  },
  {
    id: 'amalgamated-sugar',
    company: 'Amalgamated Sugar Company',
    parent: 'Snake River Sugar Company (grower co-op)',
    country: 'USA (Boise, ID)',
    region: 'US',
    productionVolume: '2nd-largest US beet processor',
    certifications: 'Sustainability reporting via co-op (verify)',
    accusations: 'No major documented labor/environmental violations found.',
    sourceUrl: null,
    severity: 'None',
    notes: 'Operates ID/OR/WA. Co-op structure.',
    brands: ['White Satin', 'White Satin Sugar'],
  },
  {
    id: 'western-sugar',
    company: 'Western Sugar Cooperative',
    parent: 'Grower cooperative',
    country: 'USA (Denver, CO)',
    region: 'US',
    productionVolume: 'Major beet producer (CO/NE/WY/MT)',
    certifications: 'Co-op sustainability programs (verify)',
    accusations: 'No major documented violations found in this review.',
    sourceUrl: null,
    severity: 'None',
    notes: 'Periodic local air-quality complaints near plants (verify).',
    brands: ['GW', 'GW Sugar', 'Great Western', 'Great Western Sugar'],
  },
  {
    id: 'michigan-sugar',
    company: 'Michigan Sugar Company',
    parent: 'Grower cooperative',
    country: 'USA (Bay City, MI)',
    region: 'US',
    productionVolume: 'Major Midwest beet producer',
    certifications: 'Sustainability reporting (verify)',
    accusations: 'Periodic odor/wastewater complaints near plants; no major regulatory action found.',
    sourceUrl: null,
    severity: 'Low',
    notes: '~1,000 grower-owners.',
    brands: ['Pioneer', 'Pioneer Sugar', 'Big Chief', 'Big Chief Sugar'],
  },
  {
    id: 'ldc-sugar',
    company: 'Louis Dreyfus Company (LDC) \u2014 Sugar',
    parent: 'Louis Dreyfus Company B.V. (Akira Capital/Louis-Dreyfus family)',
    country: 'Netherlands/global trader (US ops)',
    region: 'US',
    productionVolume: 'Major global sugar trader/merchandiser',
    certifications: 'Bonsucro member',
    accusations: 'Sold its Brazilian cane assets (Biosev) to Ra\u00edzen (2021). General commodity-trader scrutiny on traceability; no specific recent violation found.',
    sourceUrl: null,
    severity: 'Low',
    notes: 'Included as a major trader linking origins to US/EU markets; not a primary producer now.',
    brands: [],
  },
];

// ---------------------------------------------------------------------------
// EU & UK Sugar
// ---------------------------------------------------------------------------

export const EU_SUGAR_COMPANIES: SugarCompany[] = [
  {
    id: 'sudzucker',
    company: 'S\u00fcdzucker AG',
    parent: 'SZVG (grower co-op) majority',
    country: 'Germany (Mannheim)',
    region: 'EU',
    productionVolume: 'Largest EU sugar producer',
    certifications: 'SAI Platform; SBTi-aligned climate targets',
    accusations: '2014: largest single fine (\u20ac195.5M) in the German sugar cartel (territory/quota/price coordination, 2008 agreement). Austrian cartel court fined S\u00fcdzucker \u20ac4.2M (2022). Faces follow-on damages actions.',
    sourceUrl: 'https://www.bundeskartellamt.de/SharedDocs/Meldung/EN/Pressemitteilungen/2014/18_02_2014_Zucker.html',
    severity: 'High',
    notes: 'Owns Agrana (Austria, majority), Saint Louis Sucre (France). Cartel is a Tier-1 regulatory finding.',
    brands: ['S\u00fcdzucker', 'Agrana', 'Saint Louis', 'Saint Louis Sucre', 'Wiener Zucker'],
  },
  {
    id: 'tereos',
    company: 'Tereos',
    parent: 'Tereos cooperative (French beet growers)',
    country: 'France',
    region: 'EU',
    productionVolume: '2nd-largest EU producer; major Brazil cane (Guarani)',
    certifications: 'Bonsucro (Brazil units); SBTi/sustainability reporting',
    accusations: "FY24/25 heavy losses (sales \u221217% to \u20ac5.9B; H1 25/26 net loss \u20ac572M). Governance friction. No major labor/enviro violation found.",
    sourceUrl: 'https://www.tereos.com/app/uploads/2025/07/annual-report-24-25.pdf',
    severity: 'Low',
    notes: 'Financial/governance stress rather than ethics violation. Brazil ops carry general cane-sector scrutiny.',
    brands: ['B\u00e9ghin Say', 'La Perruche', 'Guarani'],
  },
  {
    id: 'nordzucker',
    company: 'Nordzucker AG',
    parent: 'Nordzucker Holding / grower co-ops',
    country: 'Germany (Braunschweig)',
    region: 'EU',
    productionVolume: '~3.0M t beet + 0.6M t cane sugar',
    certifications: 'SAI FSA (min. silver) across growers; SBTi',
    accusations: '2014: fined as part of the \u20ac280M German sugar cartel (with S\u00fcdzucker & Pfeifer & Langen).',
    sourceUrl: 'https://www.bundeskartellamt.de/SharedDocs/Meldung/EN/Pressemitteilungen/2014/18_02_2014_Zucker.html',
    severity: 'Medium',
    notes: 'Cane sugar via Mackay Sugar (Australia) stake. Strong stated sustainability programs.',
    brands: ['Nordzucker', 'Sweet Family', 'Dansukker'],
  },
  {
    id: 'pfeifer-langen',
    company: 'Pfeifer & Langen',
    parent: 'Pfeifer & Langen family (private)',
    country: 'Germany (Cologne)',
    region: 'EU',
    productionVolume: '~2M t (DE) + ~0.6M t (Poland)',
    certifications: 'SBTi-validated (2023); climate-neutral target 2040; SAI Platform member',
    accusations: '2014: fined as part of the \u20ac280M German sugar cartel.',
    sourceUrl: 'https://www.bundeskartellamt.de/SharedDocs/Meldung/EN/Pressemitteilungen/2014/18_02_2014_Zucker.html',
    severity: 'Medium',
    notes: 'Large Polish operations (Pfeifer & Langen Polska).',
    brands: ['Diamant', 'Diamant Zucker', 'Kandis', 'K\u00f6lner Zucker'],
  },
  {
    id: 'ab-sugar',
    company: 'AB Sugar / British Sugar',
    parent: 'Associated British Foods plc (Weston family majority)',
    country: 'UK; Spain (Azucarera); Africa (Illovo); China',
    region: 'EU',
    productionVolume: 'Major: British Sugar (UK beet) + Illovo (Africa cane, largest African producer)',
    certifications: 'Some Bonsucro; Illovo human-rights & sustainability reporting (post-controversy)',
    accusations: "ActionAid 'Sweet Nothings' (2013): Illovo's Zambia Sugar paid ~0.05% corporate tax on $123M profit (2007\u201312), routing ~1/3 of profit via Ireland/Mauritius/Netherlands; est. $17.7M Zambian tax loss. Historic Illovo land-rights disputes in Malawi/Mozambique.",
    sourceUrl: 'https://www.business-humanrights.org/en/latest-news/actionaid-report-into-tax-avoidance-by-associated-british-foods-in-zambia/',
    severity: 'Medium',
    notes: 'Tax avoidance = legal but heavily criticised; Illovo later published land & tax commitments.',
    brands: ['Silver Spoon', "Billington's", 'Azucarera', 'Allinson'],
  },
  {
    id: 'tate-lyle-sugars',
    company: 'Tate & Lyle Sugars (London refinery)',
    parent: 'ASR Group (Fanjul family)',
    country: 'UK (London, Thames refinery)',
    region: 'EU',
    productionVolume: 'Major EU cane refiner',
    certifications: 'Bonsucro-linked sourcing (verify)',
    accusations: "Inherits ASR/Fanjul exposure to Central Romana forced-labor finding (raw cane supply). Note: Tate & Lyle PLC (sweeteners/ingredients) is a SEPARATE company; the SUGAR business was sold to ASR in 2010.",
    sourceUrl: null,
    severity: 'Medium',
    notes: 'The sugar brand belongs to ASR Group, not to Tate & Lyle PLC.',
    brands: ['Tate & Lyle', "Lyle's", "Lyle's Golden Syrup"],
  },
  {
    id: 'cristal-union',
    company: 'Cristal Union',
    parent: 'Grower cooperative',
    country: 'France (Paris/Bazancourt)',
    region: 'EU',
    productionVolume: '~1.5M t (2024/25)',
    certifications: 'SBTi climate targets; Bonsucro/sustainability',
    accusations: 'No major documented labor/environmental violation found in this review.',
    sourceUrl: null,
    severity: 'None',
    notes: 'French beet co-op; also bioethanol.',
    brands: ['Daddy', 'Daddy Sucre', 'Erstein'],
  },
  {
    id: 'cosun',
    company: 'Royal Cosun / Cosun Beet Company',
    parent: 'Royal Cosun (grower cooperative)',
    country: 'Netherlands (Breda)',
    region: 'EU',
    productionVolume: 'Major Dutch/EU beet producer',
    certifications: 'Sustainability reporting; SAI/FSA programs',
    accusations: 'No major documented violations found in this review.',
    sourceUrl: null,
    severity: 'None',
    notes: 'Suiker Unie is the sugar arm. Dutch co-op; strong reporting culture.',
    brands: ['Suiker Unie', 'Van Gilse'],
  },
  {
    id: 'ksc-polski',
    company: "Krajowa Sp\u00f3\u0142ka Cukrowa (KSC / 'Polski Cukier')",
    parent: 'Polish State Treasury (state-owned)',
    country: 'Poland (Toru\u0144)',
    region: 'EU',
    productionVolume: 'Largest Polish sugar producer; among top EU',
    certifications: 'EU sustainability frameworks (verify)',
    accusations: 'No major documented labor/environmental violation found in this review.',
    sourceUrl: null,
    severity: 'Low',
    notes: 'State-owned national champion; lower public ESG transparency than Western EU peers.',
    brands: ['Polski Cukier'],
  },
  {
    id: 'coprob',
    company: 'COPROB / Italia Zuccheri',
    parent: 'Grower cooperative',
    country: 'Italy (Minerbio)',
    region: 'EU',
    productionVolume: 'Only remaining Italian beet sugar producer',
    certifications: "'100% Italian' traceability; sustainability programs",
    accusations: 'No major documented violations found.',
    sourceUrl: null,
    severity: 'None',
    notes: "Italy's domestic beet producer; rest of Italian supply is imported/refined.",
    brands: ['Italia Zuccheri', 'Nostrano'],
  },
];

// ---------------------------------------------------------------------------
// Cane-Origin Suppliers
// ---------------------------------------------------------------------------

export const ORIGIN_SUGAR_COMPANIES: SugarCompany[] = [
  {
    id: 'central-romana',
    company: 'Central Romana Corporation',
    parent: 'Part-owned by Fanjul family; supplies ASR/Domino',
    country: 'Dominican Republic (La Romana)',
    region: 'Origin',
    productionVolume: 'Largest sugar producer & landholder in the Dominican Republic',
    certifications: 'None notable (subject of forced-labor finding)',
    accusations: "US CBP Withhold Release Order (Nov 2022) barred its sugar from the US over forced labor \u2014 CBP cited 5 of 11 ILO indicators (abuse of vulnerability, isolation, wage withholding, abusive conditions, excessive overtime). WRO controversially LIFTED by the Trump administration in March 2025.",
    sourceUrl: 'https://www.cbp.gov/newsroom/national-media-release/cbp-issues-withhold-release-order-central-romana-corporation',
    severity: 'Severe',
    notes: 'The clearest forced-labor finding in the US/EU sugar chain. 2025 lifting is itself contested (Fanjul political ties).',
    brands: [],
  },
  {
    id: 'mitr-phol',
    company: 'Mitr Phol Sugar Corporation',
    parent: 'Mitr Phol Group (Vongkusolkit family)',
    country: "Thailand (Asia's largest sugar producer)",
    region: 'Origin',
    productionVolume: "Asia's largest, top-5 global sugar producer",
    certifications: 'Bonsucro member (contested given land case)',
    accusations: "Koh Kong, Cambodia: 2008\u201309 forced evictions of 2,000+ families for a sugar concession. Transboundary class action SETTLED Feb 2025 with undisclosed payment \u2014 SE Asia's first transboundary human-rights class action.",
    sourceUrl: 'https://www.business-humanrights.org/en/latest-news/cambodia-displaced-families-settle-class-action-lawsuit-against-thai-sugar-company-mitr-phol/',
    severity: 'Severe',
    notes: "Historic EU 'Everything But Arms' duty-free links; previously dropped by Coca-Cola/Tate & Lyle over the dispute.",
    brands: ['Mitr Phol'],
  },
  {
    id: 'raizen',
    company: 'Ra\u00edzen',
    parent: 'JV: Cosan S.A. + Shell plc',
    country: 'Brazil (S\u00e3o Paulo)',
    region: 'Origin',
    productionVolume: "World's largest sugarcane producer & cane-ethanol producer",
    certifications: 'Bonsucro: first certified org globally; ~80% of plants certified, targeting 100% by 2030',
    accusations: 'No major recent violation found; cane sector carries general labor-heat & land scrutiny. Parent Cosan has historic labor-inspection issues (verify).',
    sourceUrl: 'https://bonsucro.com/raizen-receives-its-24th-bonsucro-production-standard-certification/',
    severity: 'Low',
    notes: "Positive certification leader \u2014 useful 'good practice' benchmark. Absorbed LDC's Biosev (2021).",
    brands: [],
  },
  {
    id: 'maharashtra-mills',
    company: 'Maharashtra cane mills (e.g., NSL Sugars)',
    parent: 'Various (state co-ops & private mills)',
    country: 'India (Maharashtra, Beed district)',
    region: 'Origin',
    productionVolume: 'Major Indian cane region supplying domestic + multinational buyers',
    certifications: 'Largely uncertified; informal labor',
    accusations: 'Fuller Project / NYT (2024): systemic debt bondage, child marriage, and coerced hysterectomies among female cane cutters (~1 in 5 of 82,200 female workers in Beed). Linked to suppliers of Coca-Cola/PepsiCo; NSL Sugars named in a 2019 Coca-Cola audit.',
    sourceUrl: 'https://fullerproject.org/story/the-brutality-of-sugar-debt-child-marriage-and-hysterectomies/',
    severity: 'Severe',
    notes: 'Systemic, region-wide rather than one firm. Feeds global beverage/food chains.',
    brands: [],
  },
  {
    id: 'illovo',
    company: 'Illovo Sugar Africa',
    parent: 'Associated British Foods (AB Sugar)',
    country: 'Malawi/Zambia/Mozambique/Tanzania/eSwatini/South Africa',
    region: 'Origin',
    productionVolume: 'Largest sugar producer in Africa',
    certifications: 'Land & human-rights commitments published post-2013; some Bonsucro',
    accusations: 'Zambia tax-avoidance case (see AB Sugar). Historic land-rights & community displacement disputes (Malawi, Mozambique) documented by NGOs.',
    sourceUrl: 'https://www.business-humanrights.org/en/latest-news/actionaid-report-into-tax-avoidance-by-associated-british-foods-in-zambia/',
    severity: 'Medium',
    notes: "Supplies AB Sugar's European footprint; later reforms on transparency reported.",
    brands: [],
  },
];

// ---------------------------------------------------------------------------
// All sugar companies
// ---------------------------------------------------------------------------

export const ALL_SUGAR_COMPANIES: SugarCompany[] = [
  ...US_SUGAR_COMPANIES,
  ...EU_SUGAR_COMPANIES,
  ...ORIGIN_SUGAR_COMPANIES,
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

const GENERIC_TOKENS = new Set([
  'sugar', 'sucre', 'zucker', 'cukier', 'zuccheri',
  'organic', 'pure', 'cane', 'co', 'co.', 'inc', 'inc.',
  'the', 'and', 'for', 'company', 'corp', 'group',
  'white', 'great', 'big', 'crystal', 'van',
]);

function tokenMatch(token: string, query: string): boolean {
  const t = token.toLowerCase().trim();
  if (t.length < 3 || GENERIC_TOKENS.has(t)) return false;
  return query.includes(t);
}

/**
 * Find the sugar company record for a brand string, if any.
 * Matches against on-pack brand names first, then company / parent.
 */
export function getSugarCompanyByBrand(
  brand: string | null | undefined,
): SugarCompany | undefined {
  if (!brand) return undefined;
  const query = brand.toLowerCase().trim();
  if (!query) return undefined;

  // Pass 1: exact brand name match.
  for (const record of ALL_SUGAR_COMPANIES) {
    for (const b of record.brands) {
      if (b.toLowerCase() === query) return record;
    }
  }

  // Pass 2: brand token in query (e.g. "Domino Golden Sugar" → "domino").
  for (const record of ALL_SUGAR_COMPANIES) {
    for (const b of record.brands) {
      if (b.split(/[/;,\s]+/).some((part) => tokenMatch(part, query))) return record;
    }
  }

  // Pass 3: company name / parent.
  for (const record of ALL_SUGAR_COMPANIES) {
    if (tokenMatch(record.company, query)) return record;
  }

  return undefined;
}

export function hasSugarRecord(brand: string | null | undefined): boolean {
  return !!getSugarCompanyByBrand(brand);
}

/**
 * Map sugar severity to the app's good/warn/bad tone.
 *  Severe/High = bad, Medium = warn, Low/None = good.
 */
export function sugarSeverityTone(s: SugarSeverity): 'good' | 'warn' | 'bad' {
  if (s === 'Severe' || s === 'High') return 'bad';
  if (s === 'Medium') return 'warn';
  return 'good';
}

/** Human-readable severity label. */
export function sugarSeverityLabel(s: SugarSeverity): string {
  switch (s) {
    case 'Severe': return 'Severe \u2014 forced labor / land grabbing documented';
    case 'High': return 'High \u2014 serious environmental harm or major cartel fine';
    case 'Medium': return 'Medium \u2014 regulatory fine, major labor dispute, or tax avoidance';
    case 'Low': return 'Low \u2014 minor/contested concerns';
    case 'None': return 'None found \u2014 no major documented violation in this review';
  }
}
