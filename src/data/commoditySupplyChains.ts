/**
 * Controversial Food Commodity Supply Chains — company database
 *
 * Source: "Controversial Food Commodity Supply Chains — EU & US Company
 * Database" workbook (compiled June 2026). Five commodities: Palm Oil, Cocoa,
 * Coffee, Soy, Seafood. Major producers, processors, traders, refiners &
 * megabrand buyers (Tiers 1-7).
 *
 * GREENWASHING-RISK SCALE
 *  High        — Claims directly contradicted by documented findings.
 *  Medium-High — Repeatedly named by regulators/NGOs despite commitments.
 *  Medium      — Credible programs exist but coverage gaps remain.
 *  Low-Medium  — Above-average traceability; some self-defined elements.
 *  Low         — Radical transparency / strong third-party verification.
 *
 * DATA-QUALITY FLAG
 *  Verified     — Official/authoritative source (regulator, court, govt).
 *  Corroborated — Multiple credible sources agree.
 *  Alleged      — Reported but not independently confirmed.
 *  Unknown      — No reliable public information found.
 */

export type Commodity = 'palm-oil' | 'cocoa' | 'coffee' | 'soy' | 'seafood';

export type GreenwashRisk = 'High' | 'Medium-High' | 'Medium' | 'Low-Medium' | 'Low';

export type DataQuality = 'Verified' | 'Corroborated' | 'Alleged' | 'Unknown';

export interface CommodityCompany {
  id: string;
  commodity: Commodity;
  company: string;
  hq: string;
  tier: string;
  role: string;
  brands: string[];
  sourcingRegions: string;
  transparency: string;
  laborAllegations: string;
  environmentalImpact: string;
  certifications: string;
  greenwashRisk: GreenwashRisk;
  claimsVsReality: string;
  sourceUrl: string | null;
  dataQuality: DataQuality;
}

const COMMODITY_LABELS: Record<Commodity, string> = {
  'palm-oil': 'Palm Oil',
  cocoa: 'Cocoa',
  coffee: 'Coffee',
  soy: 'Soy',
  seafood: 'Seafood',
};

export { COMMODITY_LABELS };

// ---------------------------------------------------------------------------
// Palm Oil
// ---------------------------------------------------------------------------

const PALM_OIL: CommodityCompany[] = [
  {
    id: 'unilever-palm',
    commodity: 'palm-oil',
    company: 'Unilever',
    hq: 'UK/NL',
    tier: '1',
    role: 'FMCG (food, soap, cosmetics)',
    brands: ['Dove', "Hellmann's", 'Magnum', 'Knorr', 'Ben & Jerry\'s', 'Lipton'],
    sourcingRegions: 'Indonesia, Malaysia (via traders)',
    transparency: 'Publishes mill list; partial farm traceability',
    laborAllegations: 'Supplier-linked labor abuses reported on Indonesian estates; relies on RSPO audits',
    environmentalImpact: 'Historic deforestation exposure via Wilmar/GAR/Musim Mas; peat & habitat loss',
    certifications: 'RSPO (member); NDPE policy',
    greenwashRisk: 'Medium',
    claimsVsReality: "Strong disclosure vs. peers but 'sustainable palm' rests on contested RSPO audits",
    sourceUrl: 'https://chainreactionresearch.com/report/wilmars-refineries-and-brands-lag-in-implementation-of-esg-policies/',
    dataQuality: 'Corroborated',
  },
  {
    id: 'nestle-palm',
    commodity: 'palm-oil',
    company: 'Nestl\u00e9',
    hq: 'Switzerland',
    tier: '1',
    role: 'Food & beverage',
    brands: ['KitKat', 'Maggi', 'Nescaf\u00e9', 'Aero', 'Smarties'],
    sourcingRegions: 'Indonesia, Malaysia',
    transparency: 'Starling satellite monitoring; mill-level traceability claims',
    laborAllegations: 'Supply-chain labor concerns; suspended suppliers (e.g., IOI 2016)',
    environmentalImpact: 'Deforestation alerts at suppliers; uses satellite monitoring to claim progress',
    certifications: 'RSPO; NDPE',
    greenwashRisk: 'Medium',
    claimsVsReality: "Monitoring is real but coverage gaps remain; 'no-deforestation' is target not verified-complete",
    sourceUrl: null,
    dataQuality: 'Corroborated',
  },
  {
    id: 'mondelez-palm',
    commodity: 'palm-oil',
    company: 'Mondel\u0113z',
    hq: 'USA',
    tier: '1',
    role: 'Snacks/confectionery',
    brands: ['Oreo', 'Cadbury', 'Ritz', 'Toblerone', 'Milka'],
    sourcingRegions: 'Indonesia, Malaysia',
    transparency: 'Mill list published; criticized by RAN for ongoing links',
    laborAllegations: 'RAN/Greenpeace flagged supplier labor & deforestation links',
    environmentalImpact: "Greenpeace 'Dying for a Cookie' & RAN reports tied its supply to deforestation",
    certifications: 'RSPO; NDPE',
    greenwashRisk: 'Medium-High',
    claimsVsReality: 'Repeatedly named by NGOs despite commitments; progress claims outpace verified traceability',
    sourceUrl: 'https://psmag.com/environment/brands-are-not-living-up-to-their-palm-oil-promises/',
    dataQuality: 'Corroborated',
  },
  {
    id: 'pg-palm',
    commodity: 'palm-oil',
    company: 'Procter & Gamble',
    hq: 'USA',
    tier: '1',
    role: 'Personal care/home',
    brands: ['Gillette', 'Olay', 'Head & Shoulders', 'Herbal Essences', 'Tide', 'Pampers'],
    sourcingRegions: 'Indonesia, Malaysia (derivatives)',
    transparency: 'Palm-kernel derivative chains are long & opaque; partial disclosure',
    laborAllegations: 'Greenpeace 2018 campaign linked P&G to deforestation suppliers',
    environmentalImpact: 'Derivative supply chains hard to trace to plantation; deforestation exposure',
    certifications: 'RSPO; NDPE',
    greenwashRisk: 'Medium',
    claimsVsReality: 'Derivatives (vs. crude oil) are the opacity point; claims exceed traceability',
    sourceUrl: null,
    dataQuality: 'Corroborated',
  },
  {
    id: 'pepsico-palm',
    commodity: 'palm-oil',
    company: 'PepsiCo',
    hq: 'USA',
    tier: '1',
    role: 'Food & beverage',
    brands: ["Lay's", 'Doritos', 'Quaker', 'Cheetos', 'Tostitos'],
    sourcingRegions: 'Indonesia, Malaysia',
    transparency: 'Mill list; ended Indofood JV after labor expos\u00e9',
    laborAllegations: 'RAN/OPPUK documented labor abuses at Indofood (former JV partner); PepsiCo cut ties 2018-19',
    environmentalImpact: 'Deforestation exposure via traders',
    certifications: 'RSPO; NDPE',
    greenwashRisk: 'Medium-High',
    claimsVsReality: 'Indofood labor scandal showed gap between policy and on-the-ground reality',
    sourceUrl: null,
    dataQuality: 'Corroborated',
  },
  {
    id: 'wilmar-palm',
    commodity: 'palm-oil',
    company: 'Wilmar International',
    hq: 'Singapore',
    tier: '6/7',
    role: 'Trader, refiner, grower (largest)',
    brands: [],
    sourcingRegions: 'Indonesia, Malaysia, Africa',
    transparency: 'NDPE since 2013 (first mover); supplier grievance log public',
    laborAllegations: 'Historic estate labor abuses; supplier suspensions ongoing',
    environmentalImpact: '1.3M ha of non-compliant supplier plantations on suspension list; deforestation legacy',
    certifications: 'RSPO; NDPE; POIG-adjacent',
    greenwashRisk: 'Medium',
    claimsVsReality: 'Pioneer on paper; CRR finds implementation lags policy across refineries',
    sourceUrl: 'https://chainreactionresearch.com/report/wilmars-refineries-and-brands-lag-in-implementation-of-esg-policies/',
    dataQuality: 'Corroborated',
  },
  {
    id: 'fgv-palm',
    commodity: 'palm-oil',
    company: 'FGV Holdings',
    hq: 'Malaysia',
    tier: '6/7',
    role: 'Grower & processor (Felda)',
    brands: [],
    sourcingRegions: 'Malaysia',
    transparency: 'Limited; under active US import ban',
    laborAllegations: 'US CBP WRO (Sept 2020) over forced labor \u2014 indicators incl. abuse of vulnerability, debt bondage, withheld wages, and potential forced CHILD labor. WRO remains in force.',
    environmentalImpact: 'Plantation labor & expansion concerns',
    certifications: 'RSPO (some); MSPO',
    greenwashRisk: 'High',
    claimsVsReality: 'Among the most serious live forced-labor findings in palm; import ban still active',
    sourceUrl: 'https://www.cbp.gov/newsroom/national-media-release/cbp-issues-withhold-release-order-palm-oil-produced-forced-labor',
    dataQuality: 'Verified',
  },
  {
    id: 'sime-darby-palm',
    commodity: 'palm-oil',
    company: 'Sime Darby Plantation',
    hq: 'Malaysia',
    tier: '6/7',
    role: 'Grower (largest by area), refiner',
    brands: [],
    sourcingRegions: 'Malaysia, Indonesia, Liberia, PNG',
    transparency: 'Post-WRO remediation & worker-recruitment reforms',
    laborAllegations: 'US CBP WRO (Dec 2020) cited ALL 11 ILO forced-labor indicators; MODIFIED Feb 2023 after remediation',
    environmentalImpact: 'Plantation expansion & habitat loss historically',
    certifications: 'RSPO; NDPE',
    greenwashRisk: 'Medium-High',
    claimsVsReality: 'Forced-labor finding was severe; reforms accepted by CBP but verification is recent',
    sourceUrl: 'https://www.cbp.gov/newsroom/national-media-release/cbp-modifies-finding-sime-darby-plantation-berhad-malaysia',
    dataQuality: 'Verified',
  },
];

// ---------------------------------------------------------------------------
// Coffee
// ---------------------------------------------------------------------------

const COFFEE: CommodityCompany[] = [
  {
    id: 'nestle-coffee',
    commodity: 'coffee',
    company: 'Nestl\u00e9',
    hq: 'Switzerland',
    tier: '1',
    role: 'Coffee & food',
    brands: ['Nescaf\u00e9', 'Nespresso', 'Dolce Gusto'],
    sourcingRegions: 'Brazil, Vietnam, Colombia',
    transparency: 'Nescaf\u00e9 Plan; partial farm mapping',
    laborAllegations: 'Named in Coffee Watch CBP Section-307 petition (2025) over Brazilian forced labor',
    environmentalImpact: 'Coffee deforestation exposure (Brazil, Vietnam)',
    certifications: 'Rainforest Alliance; 4C; Nescaf\u00e9 Plan',
    greenwashRisk: 'Medium',
    claimsVsReality: 'Large certified share but named in 2025 forced-labor petition over Brazil supply',
    sourceUrl: 'https://coffeewatch.org/stop-slavery-tainted-coffee-at-the-border/',
    dataQuality: 'Corroborated',
  },
  {
    id: 'jde-peets',
    commodity: 'coffee',
    company: "JDE Peet's",
    hq: 'Netherlands',
    tier: '1',
    role: 'Largest pure-play coffee',
    brands: ['Jacobs', "L'OR", "Peet's", 'Douwe Egberts', 'Senseo', 'Tassimo'],
    sourcingRegions: 'Brazil, Vietnam, Colombia, Indonesia',
    transparency: 'Enveritas mapping (>90% of growing areas)',
    laborAllegations: 'Named in Coffee Watch CBP petition (2025)',
    environmentalImpact: 'Coffee-federation lobbying against EUDR criticized',
    certifications: 'Rainforest Alliance; own Common Grounds',
    greenwashRisk: 'Medium',
    claimsVsReality: 'Strong mapping claims but named in forced-labor petition & EUDR-lobbying report',
    sourceUrl: 'https://coffeewatch.org/stop-slavery-tainted-coffee-at-the-border/',
    dataQuality: 'Corroborated',
  },
  {
    id: 'starbucks-coffee',
    commodity: 'coffee',
    company: 'Starbucks',
    hq: 'USA',
    tier: '1',
    role: 'Coffee retail/CPG',
    brands: ['Starbucks'],
    sourcingRegions: 'Brazil, Colombia, Ethiopia, Guatemala',
    transparency: "C.A.F.E. Practices; claims 99% 'ethically sourced'",
    laborAllegations: 'IRA class action (Apr 2025) \u2014 8 Brazilian workers allege trafficking/forced & child labor. Rep\u00f3rter Brasil (2023) found forced-labor farms certified under C.A.F.E. Practices',
    environmentalImpact: 'Coffee deforestation exposure',
    certifications: 'C.A.F.E. Practices (proprietary, 3rd-party verified by SCS)',
    greenwashRisk: 'High',
    claimsVsReality: "'99% ethically sourced' claim directly contradicted by forced-labor findings on C.A.F.E.-verified farms",
    sourceUrl: 'https://www.business-humanrights.org/en/latest-news/usa-starbucks-sued-over-alleged-forced-labour-in-brazilian-supply-chain/',
    dataQuality: 'Corroborated',
  },
  {
    id: 'lavazza-illy',
    commodity: 'coffee',
    company: 'Lavazza / illycaff\u00e8',
    hq: 'Italy',
    tier: '1/2',
    role: 'Coffee roasters',
    brands: ['Lavazza', 'illy'],
    sourcingRegions: 'Brazil, Vietnam, India, Central America',
    transparency: 'Partial; illy direct-trade claims',
    laborAllegations: 'Both named in Coffee Watch CBP petition (2025) over Brazil supply',
    environmentalImpact: 'Coffee deforestation exposure',
    certifications: 'RA; illy own quality programs',
    greenwashRisk: 'Medium',
    claimsVsReality: 'Premium positioning; named in 2025 Brazil forced-labor petition',
    sourceUrl: 'https://coffeewatch.org/stop-slavery-tainted-coffee-at-the-border/',
    dataQuality: 'Corroborated',
  },
  {
    id: 'keurig-jab',
    commodity: 'coffee',
    company: 'Keurig Dr Pepper / JAB Holding',
    hq: 'US / Luxembourg',
    tier: '1',
    role: 'Coffee systems / investor',
    brands: ['Green Mountain', 'Keurig', 'Dr Pepper', "Peet's Coffee"],
    sourcingRegions: 'Brazil, Vietnam, Central America',
    transparency: 'Varies; KDP responsible-sourcing program',
    laborAllegations: 'Sector forced-labor & deforestation exposure',
    environmentalImpact: 'Deforestation exposure',
    certifications: 'Rainforest Alliance; Fairtrade (some)',
    greenwashRisk: 'Medium',
    claimsVsReality: 'JAB is the financial hub behind much of Western coffee; brand-level transparency varies',
    sourceUrl: null,
    dataQuality: 'Corroborated',
  },
];

// ---------------------------------------------------------------------------
// Soy
// ---------------------------------------------------------------------------

const SOY: CommodityCompany[] = [
  {
    id: 'bunge-soy',
    commodity: 'soy',
    company: 'Bunge Global',
    hq: 'USA / Switzerland',
    tier: '6',
    role: 'Trader & oilseed crusher',
    brands: [],
    sourcingRegions: 'Brazil (Cerrado, Amazon fringe), US, Argentina',
    transparency: 'Partial; non-deforestation/conversion targets',
    laborAllegations: 'Land-rights & indigenous-displacement concerns in Cerrado expansion',
    environmentalImpact: 'Mighty Earth ranked Bunge WORST: ~224,181 ha deforestation linked (Feb 2022\u2013Jul 2024), ~25% in protected areas',
    certifications: 'RTRS / ProTerra (minority of volume)',
    greenwashRisk: 'High',
    claimsVsReality: "Completed $8.2B Viterra merger (Jul 2025) \u2014 now a top global grain trader; 'Terrible Trio' deforestation ranking",
    sourceUrl: 'https://mightyearth.org/article/terrible-trio-bunge-cargill-jbs-ranked-worst-for-deforestation/',
    dataQuality: 'Corroborated',
  },
  {
    id: 'cargill-soy',
    commodity: 'soy',
    company: 'Cargill',
    hq: 'USA',
    tier: '6',
    role: 'Largest private trader & crusher',
    brands: [],
    sourcingRegions: 'Brazil (Cerrado), US, Argentina, Paraguay',
    transparency: 'Partial; Soy moratorium signatory (Amazon)',
    laborAllegations: 'Land & labor concerns at origin',
    environmentalImpact: "~133,256 ha linked, ~85% in the Cerrado (NOT covered by Amazon moratorium). Biggest soy exporter to the UK (67%)",
    certifications: 'RTRS / ProTerra (minority)',
    greenwashRisk: 'Medium-High',
    claimsVsReality: "Cerrado is the loophole \u2014 Amazon moratorium doesn't cover it; Cargill is the dominant UK importer",
    sourceUrl: 'https://mightyearth.org/article/terrible-trio-bunge-cargill-jbs-ranked-worst-for-deforestation/',
    dataQuality: 'Corroborated',
  },
  {
    id: 'adm-soy',
    commodity: 'soy',
    company: 'ADM (Archer Daniels Midland)',
    hq: 'USA',
    tier: '6',
    role: 'Trader & crusher',
    brands: [],
    sourcingRegions: 'Brazil, US, Argentina',
    transparency: 'Partial',
    laborAllegations: 'Origin land/labor concerns',
    environmentalImpact: 'Linked to Cerrado/Amazon soy deforestation; top supplier to the Netherlands (22%)',
    certifications: 'RTRS / ProTerra (minority)',
    greenwashRisk: 'Medium-High',
    claimsVsReality: "One of the 'ABCD' quartet; deforestation exposure via Brazilian sourcing",
    sourceUrl: null,
    dataQuality: 'Corroborated',
  },
];

// ---------------------------------------------------------------------------
// Seafood
// ---------------------------------------------------------------------------

const SEAFOOD: CommodityCompany[] = [
  {
    id: 'thai-union',
    commodity: 'seafood',
    company: 'Thai Union Group',
    hq: 'Thailand',
    tier: '1',
    role: "World's largest canned-tuna processor",
    brands: ['Chicken of the Sea', 'John West', 'Petit Navire', 'Sealect', 'Mareblu'],
    sourcingRegions: 'W. & Central Pacific, Indian Ocean',
    transparency: 'SeaChange strategy; vessel traceability program',
    laborAllegations: "2015 AP 'Seafood from Slaves' expos\u00e9 legacy; since reformed \u2014 brought 1,200+ workers in-house, co-founded Seafood Task Force",
    environmentalImpact: 'Overfishing/bycatch exposure; FAD use',
    certifications: 'MSC (some), Dolphin Safe, ProSea',
    greenwashRisk: 'Medium',
    claimsVsReality: 'Most-reformed major after 2015 scandal; reforms real but Asian supply risk persists',
    sourceUrl: 'https://www.thaiunion.com/en/blog/sustainability/545/tackling-slavery-at-sea',
    dataQuality: 'Corroborated',
  },
  {
    id: 'bumble-bee',
    commodity: 'seafood',
    company: 'Bumble Bee Foods',
    hq: 'USA (owned by FCF, Taiwan)',
    tier: '1',
    role: 'Canned tuna',
    brands: ['Bumble Bee', 'Wild Selections'],
    sourcingRegions: 'Pacific (albacore via FCF network)',
    transparency: "Low; long-line 'trusted network' vessels",
    laborAllegations: 'Akhmad v. Bumble Bee (TVPRA, filed Mar 2025; motion to dismiss DENIED Nov 2025). Indonesian fishers allege forced labor/trafficking.',
    environmentalImpact: 'Bycatch/overfishing exposure',
    certifications: 'Some Dolphin Safe; MSC on select lines',
    greenwashRisk: 'High',
    claimsVsReality: 'First TVPRA forced-labor case against a US seafood brand to survive dismissal',
    sourceUrl: 'https://www.business-humanrights.org/en/latest-news/usa-indonesian-fishers-case-against-bumble-bee-foods-over-forced-labour-in-tuna-supply-chain-allowed-to-proceed/',
    dataQuality: 'Verified',
  },
  {
    id: 'starkist',
    commodity: 'seafood',
    company: 'StarKist',
    hq: 'USA (owned by Dongwon, S. Korea)',
    tier: '1',
    role: 'Canned tuna',
    brands: ['StarKist'],
    sourcingRegions: 'Pacific',
    transparency: 'Low\u2013medium',
    laborAllegations: 'Pleaded GUILTY to US price-fixing (2019), $100M criminal fine; supply-chain labor exposure',
    environmentalImpact: 'Bycatch/overfishing exposure',
    certifications: 'Dolphin Safe; some MSC',
    greenwashRisk: 'Medium-High',
    claimsVsReality: 'Criminal antitrust conviction + opaque distant-water supply',
    sourceUrl: null,
    dataQuality: 'Corroborated',
  },
  {
    id: 'mowi-salmon',
    commodity: 'seafood',
    company: 'Mowi',
    hq: 'Norway',
    tier: '1',
    role: "World's largest salmon farmer",
    brands: ['Mowi'],
    sourcingRegions: 'Norway, Scotland, Chile, Canada, Ireland',
    transparency: 'Publishes sustainability data; integrated producer',
    laborAllegations: 'Sector labor & at-sea transshipment risks',
    environmentalImpact: 'Salmon-farming impacts: sea lice, escapes, antibiotics in Chile, feed sourcing',
    certifications: 'ASC; GlobalG.A.P.',
    greenwashRisk: 'Medium',
    claimsVsReality: 'Aquaculture carries different risk profile from wild-catch; environmental concerns remain',
    sourceUrl: null,
    dataQuality: 'Corroborated',
  },
  {
    id: 'rio-mare',
    commodity: 'seafood',
    company: 'Bolton Group (Rio Mare)',
    hq: 'Italy',
    tier: '1',
    role: 'Canned tuna (EU market leader)',
    brands: ['Rio Mare', 'Saupiquet'],
    sourcingRegions: 'Indian Ocean, Pacific',
    transparency: 'Publishes sustainability data',
    laborAllegations: 'Sector labor risks',
    environmentalImpact: 'Overfishing/bycatch exposure; FAD use',
    certifications: 'MSC (some); Dolphin Safe',
    greenwashRisk: 'Medium',
    claimsVsReality: 'Moderate transparency; MSC certification contested industry-wide',
    sourceUrl: null,
    dataQuality: 'Corroborated',
  },
];

// ---------------------------------------------------------------------------
// All commodity companies (cocoa excluded — handled by chocolateDirectory.ts)
// ---------------------------------------------------------------------------

export const ALL_COMMODITY_COMPANIES: CommodityCompany[] = [
  ...PALM_OIL,
  ...COFFEE,
  ...SOY,
  ...SEAFOOD,
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

const GENERIC_TOKENS = new Set([
  'the', 'and', 'for', 'inc', 'inc.', 'co', 'co.', 'corp', 'group', 'foods',
  'food', 'oil', 'palm', 'coffee', 'soy', 'sea', 'fish', 'bee',
]);

function tokenMatch(token: string, query: string): boolean {
  const t = token.toLowerCase().trim();
  if (t.length < 3 || GENERIC_TOKENS.has(t)) return false;
  return query.includes(t);
}

/**
 * Find all commodity supply-chain records for a brand string.
 * A brand like "Nestl\u00e9" may appear in multiple commodities (palm + coffee).
 * Returns all matching records.
 */
export function getCommodityRecordsByBrand(
  brand: string | null | undefined,
): CommodityCompany[] {
  if (!brand) return [];
  const query = brand.toLowerCase().trim();
  if (!query) return [];

  const matched = new Set<string>();
  const results: CommodityCompany[] = [];

  // Pass 1: exact brand name.
  for (const record of ALL_COMMODITY_COMPANIES) {
    for (const b of record.brands) {
      if (b.toLowerCase() === query && !matched.has(record.id)) {
        matched.add(record.id);
        results.push(record);
      }
    }
  }

  // Pass 2: brand token in query.
  for (const record of ALL_COMMODITY_COMPANIES) {
    if (matched.has(record.id)) continue;
    for (const b of record.brands) {
      if (b.split(/[/;,\s]+/).some((part) => tokenMatch(part, query))) {
        matched.add(record.id);
        results.push(record);
        break;
      }
    }
  }

  // Pass 3: company name.
  for (const record of ALL_COMMODITY_COMPANIES) {
    if (matched.has(record.id)) continue;
    if (tokenMatch(record.company, query)) {
      matched.add(record.id);
      results.push(record);
    }
  }

  return results;
}

export function hasCommodityRecord(brand: string | null | undefined): boolean {
  return getCommodityRecordsByBrand(brand).length > 0;
}

/**
 * Map greenwash risk to the app's good/warn/bad tone.
 */
export function greenwashRiskTone(risk: GreenwashRisk): 'good' | 'warn' | 'bad' {
  if (risk === 'High' || risk === 'Medium-High') return 'bad';
  if (risk === 'Medium') return 'warn';
  return 'good';
}

const COMMODITY_ICON: Record<Commodity, string> = {
  'palm-oil': '\uD83C\uDF34',  // palm tree
  cocoa: '\uD83C\uDF6B',       // chocolate bar
  coffee: '\u2615',             // hot beverage
  soy: '\uD83C\uDF31',         // seedling
  seafood: '\uD83D\uDC1F',     // fish
};

export { COMMODITY_ICON };
