/**
 * Egg & Chicken Welfare Database — producer / brand level (USA & Europe, grocery retail)
 *
 * Source: "Egg & Chicken Welfare Database" workbook (prepared 23 June 2026).
 * Producer + brand records with ownership tracing, certifications, documented
 * issues, pledge status and credibility scores — every row is sourced.
 *
 * HOW THE SCORES WORK
 *  - Label integrity (1–5): does the on-pack label reliably mean what a shopper
 *    assumes? 5 = audited/defined/matches assumption; 1 = unregulated marketing.
 *  - Verification (1–5): how much INDEPENDENT evidence backs the record?
 *    5 = third-party audit + court/regulator; 1 = company claim only.
 *  - Suggested overall = MIN(label integrity, verification): a product is only as
 *    trustworthy as the WEAKER of "does the label mean anything" and "how
 *    independently verified". A well-documented bad actor does NOT score higher
 *    for being well-documented.
 *
 * Confidence flag per row:
 *   VERIFIED  — Tier-1 source
 *   REPORTED  — credible news, not independently checked
 *   DISPUTED  — sources conflict
 *   UNVERIFIED— company claim only / supplier opacity
 *
 * Source tiers:
 *   Tier 1 Authoritative: BBFAW, FAIRR, USDA/FSIS, EFSA, court & SEC records,
 *     third-party audit bodies (Certified Humane, AGW, RSPCA Assured, GAP).
 *   Tier 2 Strong-but-biased: NGO investigations (Mercy For Animals, CIWF, The
 *     Humane League, Animal Equality, ARM) and mainstream journalism.
 *   Tier 3 Weak: on-pack marketing & company-site claims with no audit — recorded
 *     only as CLAIMS, never as fact.
 *
 * NOTE: UPC, price and per-store availability are intentionally omitted — that
 * data lives only in store scans / retailer point-of-sale feeds and cannot be
 * assembled from public research without inventing it.
 */

export type WelfareCategory = 'egg' | 'chicken';

export type WelfareConfidence = 'VERIFIED' | 'REPORTED' | 'DISPUTED' | 'UNVERIFIED';

export interface WelfareProducer {
  /** Stable slug for keys / lookups. */
  id: string;
  category: WelfareCategory;
  region: string;
  productType: string;
  /** On-pack brand names this record covers. */
  brands: string[];
  /** Documented primary producer. */
  producer: string;
  /** Parent / holding company. */
  parent: string;
  /** Retailer name if this is a private label, else null. */
  privateLabel: string | null;
  ownershipChange: string;
  countryOfOrigin: string;
  welfareClaims: string;
  housingSystem: string;
  certifications: string;
  pledges: string;
  pledgeStatus: string;
  /** Dated issues / lawsuits / investigations. Allegations labelled as such. */
  documentedIssues: string;
  sourceTier: string;
  confidence: WelfareConfidence;
  /** Label integrity, 1–5. */
  labelIntegrity: number;
  /** Verification level, 1–5. */
  verification: number;
  /** Suggested overall = min(labelIntegrity, verification). */
  suggestedOverall: number;
  redFlags: string;
  /** ISO year-month the row was last verified. */
  lastVerified: string;
}

// ---------------------------------------------------------------------------
// Egg producers & brands — USA & Europe
// ---------------------------------------------------------------------------

export const EGG_PRODUCERS: WelfareProducer[] = [
  {
    id: 'vital-farms',
    category: 'egg',
    region: 'US',
    productType: 'Shell eggs (pasture)',
    brands: ['Vital Farms'],
    producer: 'Vital Farms, Inc. (+ ~300 family farms)',
    parent: 'Vital Farms (NASDAQ: VITL)',
    privateLabel: null,
    ownershipChange: 'IPO 2020; no major M&A',
    countryOfOrigin: 'USA',
    welfareClaims: "Pasture-raised; Certified Humane; 'ethical'",
    housingSystem: 'Pasture, ~108 sqft/hen (company claim)',
    certifications: 'Certified Humane (pasture)',
    pledges: 'n/a (already pasture)',
    pledgeStatus: 'n/a',
    documentedIssues:
      "Class action (W.D. Texas, proceeding 2024) alleges 'pasture-raised/humane' marketing overstates conditions; company denies",
    sourceTier: 'T1+T2',
    confidence: 'DISPUTED',
    labelIntegrity: 4,
    verification: 4,
    suggestedOverall: 4,
    redFlags: 'Pending humane-washing class action; premium price; yolk/diet claims contested',
    lastVerified: '2026-06',
  },
  {
    id: 'pete-and-gerrys',
    category: 'egg',
    region: 'US',
    productType: 'Shell eggs (cage-free/free-range/organic)',
    brands: ["Pete & Gerry's", "Nellie's Free Range"],
    producer: "Pete & Gerry's Organics",
    parent: "Pete & Gerry's (PE-backed)",
    privateLabel: null,
    ownershipChange: 'Growth via small-farm network',
    countryOfOrigin: 'USA',
    welfareClaims: 'Certified Humane free-range/organic',
    housingSystem: 'Free-range / barn + range',
    certifications: 'Certified Humane',
    pledges: 'n/a',
    pledgeStatus: 'n/a',
    documentedIssues: 'No major welfare lawsuit found (verify)',
    sourceTier: 'T1',
    confidence: 'REPORTED',
    labelIntegrity: 4,
    verification: 3,
    suggestedOverall: 3,
    redFlags: 'Verify current Certified Humane status per line',
    lastVerified: '2026-06',
  },
  {
    id: 'cal-maine',
    category: 'egg',
    region: 'US',
    productType: 'Shell eggs (conventional + cage-free)',
    brands: ['Farmer Brown', 'Sunny Meadow', 'Sunups', "Land O'Lakes (lic.)"],
    producer: 'Cal-Maine Foods',
    parent: 'Cal-Maine Foods (NASDAQ: CALM)',
    privateLabel: null,
    ownershipChange: 'Serial acquirer of regional egg cos',
    countryOfOrigin: 'USA',
    welfareClaims: 'Mostly conventional; some cage-free lines',
    housingSystem: 'Battery/enriched cage + cage-free barns',
    certifications: 'None company-wide',
    pledges: 'Cage-free by 2025 (status unclear)',
    pledgeStatus: 'DELAYED / UNCLEAR',
    documentedIssues:
      'Largest US producer (~20% share). DOJ antitrust suit in prep (price-fixing, 2023-25 spike); HPAI from Dec 2023',
    sourceTier: 'T1',
    confidence: 'VERIFIED',
    labelIntegrity: 2,
    verification: 3,
    suggestedOverall: 2,
    redFlags: 'Antitrust scrutiny; no welfare certification; litigates against welfare rules',
    lastVerified: '2026-06',
  },
  {
    id: 'rose-acre',
    category: 'egg',
    region: 'US',
    productType: 'Shell eggs (conventional + cage-free)',
    brands: ['Rose Acre', 'Sunshine', 'Sunny Acres'],
    producer: 'Rose Acre Farms',
    parent: 'Rose Acre Farms (private)',
    privateLabel: null,
    ownershipChange: 'Family-owned',
    countryOfOrigin: 'USA',
    welfareClaims: 'Conventional + cage-free lines',
    housingSystem: 'Cage + cage-free barns',
    certifications: 'None company-wide',
    pledges: 'Cage-free timeline (verify)',
    pledgeStatus: 'UNCLEAR',
    documentedIssues:
      '2nd-largest US producer; 2018 nationwide salmonella recall (~206M eggs, FDA); past wastewater/USDA actions',
    sourceTier: 'T1',
    confidence: 'VERIFIED',
    labelIntegrity: 2,
    verification: 3,
    suggestedOverall: 2,
    redFlags: 'History of regulatory actions; limited welfare disclosure',
    lastVerified: '2026-06',
  },
  {
    id: 'herbrucks',
    category: 'egg',
    region: 'US',
    productType: 'Shell eggs (cage-free / organic)',
    brands: ["Herbruck's", "Nature's Yoke"],
    producer: "Herbruck's Poultry Ranch",
    parent: "Herbruck's (private)",
    privateLabel: "Supplies retailers' private label",
    ownershipChange: 'Family-owned; capacity growth',
    countryOfOrigin: 'USA (Michigan)',
    welfareClaims: 'Cage-free & USDA Organic',
    housingSystem: 'Cage-free aviary / organic',
    certifications: 'USDA Organic; cage-free (3rd-party for customers)',
    pledges: 'Cage-free supply',
    pledgeStatus: 'ON TRACK (cage-free focus)',
    documentedIssues:
      '2024 HPAI: ~6.5M birds culled in Ionia Co., ~400 layoffs. Cleaner welfare record than Cal-Maine/Rose Acre. NOTE: Herbruck\'s is in Michigan (Ionia County), not Ohio',
    sourceTier: 'T1+T2',
    confidence: 'VERIFIED',
    labelIntegrity: 3,
    verification: 3,
    suggestedOverall: 3,
    redFlags: 'Avian-flu exposure; verify which lines carry third-party welfare audit',
    lastVerified: '2026-06',
  },
  {
    id: 'egglands-best',
    category: 'egg',
    region: 'US',
    productType: 'Shell eggs (branded, mixed)',
    brands: ["Eggland's Best"],
    producer: "Eggland's Best (franchise consortium of producers)",
    parent: "Eggland's Best LLC",
    privateLabel: null,
    ownershipChange: 'Franchise model',
    countryOfOrigin: 'USA',
    welfareClaims: 'Nutrition claims; some cage-free/free-range lines',
    housingSystem: 'Varies by franchisee',
    certifications: 'Varies (some Certified Humane lines)',
    pledges: 'Cage-free lines vary',
    pledgeStatus: 'MIXED / PER-LINE',
    documentedIssues:
      'Marketing centers on hen diet/nutrition, not welfare; welfare varies by franchised producer',
    sourceTier: 'T2',
    confidence: 'REPORTED',
    labelIntegrity: 2,
    verification: 2,
    suggestedOverall: 2,
    redFlags: "'Better' branding is nutrition not welfare; per-line cert must be checked",
    lastVerified: '2026-06',
  },
  {
    id: 'kirkland-eggs',
    category: 'egg',
    region: 'US',
    productType: 'Shell eggs (private label)',
    brands: ['Kirkland Signature'],
    producer: 'Multiple (undisclosed)',
    parent: 'Costco Wholesale',
    privateLabel: 'Costco',
    ownershipChange: 'n/a',
    countryOfOrigin: 'USA',
    welfareClaims: 'Cage-free / organic lines',
    housingSystem: 'Cage-free / organic (supplier-dependent)',
    certifications: 'Cage-free claim',
    pledges: 'Cage-free',
    pledgeStatus: 'REPORTED',
    documentedIssues:
      'Supplier(s) not publicly disclosed; Costco faced advocacy pressure over broiler welfare separately',
    sourceTier: 'T2/T3',
    confidence: 'UNVERIFIED',
    labelIntegrity: 3,
    verification: 2,
    suggestedOverall: 2,
    redFlags: 'Supplier opacity; claim credible but unaudited at brand level',
    lastVerified: '2026-06',
  },
  {
    id: 'great-value-eggs',
    category: 'egg',
    region: 'US',
    productType: 'Shell eggs (private label)',
    brands: ['Great Value'],
    producer: 'Likely Cal-Maine / Rose Acre (undisclosed)',
    parent: 'Walmart Inc.',
    privateLabel: 'Walmart',
    ownershipChange: 'n/a',
    countryOfOrigin: 'USA',
    welfareClaims: 'Conventional + cage-free SKUs',
    housingSystem: 'Cage / cage-free (supplier-dependent)',
    certifications: 'Cage-free SKU claim',
    pledges: 'Cage-free by 2025 (Walmart pledge)',
    pledgeStatus: 'DELAYED / UNCLEAR',
    documentedIssues:
      'Low price implies conventional bulk supplier; sourcing not disclosed at SKU level',
    sourceTier: 'T3',
    confidence: 'UNVERIFIED',
    labelIntegrity: 2,
    verification: 1,
    suggestedOverall: 1,
    redFlags: 'Supplier opacity; pledge status unclear',
    lastVerified: '2026-06',
  },
  {
    id: 'noble-foods',
    category: 'egg',
    region: 'UK',
    productType: 'Shell eggs (free-range/organic)',
    brands: ['The Happy Egg Co', 'Clarence Court', 'Purely Organic'],
    producer: 'Noble Foods',
    parent: 'Noble Foods (private)',
    privateLabel: 'Supplies retailer private label too',
    ownershipChange: 'UK consolidation',
    countryOfOrigin: 'UK',
    welfareClaims: 'Free-range; some organic; RSPCA Assured lines',
    housingSystem: 'Free-range / barn',
    certifications: 'RSPCA Assured (select); BEIC Lion',
    pledges: 'UK retail cage-free shell-egg shift',
    pledgeStatus: 'ON TRACK (UK free-range norm)',
    documentedIssues:
      "UK's largest egg company; Freedom Food member #0001. 2024 sector-wide RSPCA Assured welfare scandal is context, not Noble-specific",
    sourceTier: 'T1+T2',
    confidence: 'REPORTED',
    labelIntegrity: 3,
    verification: 3,
    suggestedOverall: 3,
    redFlags: 'Brand spans premium (Clarence Court) to volume; verify line-by-line',
    lastVerified: '2026-06',
  },
  {
    id: 'uk-own-label-eggs',
    category: 'egg',
    region: 'UK',
    productType: 'Shell eggs',
    brands: ["Store own-label (Tesco, Sainsbury's, etc.)"],
    producer: 'Multiple incl. Noble, Stonegate',
    parent: 'Respective retailers',
    privateLabel: 'Each retailer',
    ownershipChange: 'n/a',
    countryOfOrigin: 'UK',
    welfareClaims: 'Most UK retail shell eggs now cage-free/free-range',
    housingSystem: 'Free-range / barn (cages phased out in retail)',
    certifications: 'BEIC Lion; some RSPCA Assured',
    pledges: 'Major UK grocers: 100% cage-free shell eggs (largely met)',
    pledgeStatus: 'LARGELY MET (verify chain)',
    documentedIssues:
      'UK retail shell-egg market moved off cages; processed/ingredient eggs lag. Verify each chain\'s date',
    sourceTier: 'T1',
    confidence: 'REPORTED',
    labelIntegrity: 3,
    verification: 3,
    suggestedOverall: 3,
    redFlags: 'Whole-egg vs ingredient-egg gap; confirm each retailer',
    lastVerified: '2026-06',
  },
  {
    id: 'de-discounter-eggs',
    category: 'egg',
    region: 'EU',
    productType: 'Shell eggs',
    brands: ['Aldi/Lidl/Kaufland own-label (DE)'],
    producer: 'Multiple regional (KAT-certified)',
    parent: 'Respective retailers',
    privateLabel: 'Discounters',
    ownershipChange: 'n/a',
    countryOfOrigin: 'Germany',
    welfareClaims: 'Barn / free-range / organic (no cages)',
    housingSystem: 'Barn/free-range (DE banned conventional cages)',
    certifications: 'KAT; EU Organic; some',
    pledges: "EU 'End the Cage Age' political pledge (Commission)",
    pledgeStatus: 'PENDING (EU law delayed)',
    documentedIssues:
      'Germany ended conventional cages ahead of EU; KAT scheme codes farm/system. EU-wide cage ban proposal stalled',
    sourceTier: 'T1',
    confidence: 'REPORTED',
    labelIntegrity: 3,
    verification: 3,
    suggestedOverall: 3,
    redFlags: 'System printed on shell (0=organic..3=cage); good traceability in DE',
    lastVerified: '2026-06',
  },
  {
    id: 'fr-es-it-own-label-eggs',
    category: 'egg',
    region: 'EU',
    productType: 'Shell eggs',
    brands: ['Carrefour / retailer own-label (FR/ES/IT)'],
    producer: 'Multiple regional producers',
    parent: 'Respective retailers',
    privateLabel: 'Retailers',
    ownershipChange: 'n/a',
    countryOfOrigin: 'France/Spain/Italy',
    welfareClaims: 'Plein air / bio / barn',
    housingSystem: 'Varies; FR Label Rouge plein air for premium',
    certifications: 'Label Rouge; EU Organic',
    pledges: 'FR retailers shifting from cage',
    pledgeStatus: 'MIXED BY COUNTRY',
    documentedIssues:
      'Southern-EU markets more fragmented; sourcing opacity higher; Label Rouge plein air is a genuine higher-welfare tier',
    sourceTier: 'T2',
    confidence: 'UNVERIFIED',
    labelIntegrity: 3,
    verification: 2,
    suggestedOverall: 2,
    redFlags: 'Per-country and per-line verification needed',
    lastVerified: '2026-06',
  },
];

// ---------------------------------------------------------------------------
// Chicken (broiler) producers & brands — USA & Europe
//
// Cornish Cross = fast-grow industrial breed. 'Slower-growing' / Label Rouge /
// Das Klassenbester = genuine welfare signal.
// ---------------------------------------------------------------------------

export const CHICKEN_PRODUCERS: WelfareProducer[] = [
  {
    id: 'tyson',
    category: 'chicken',
    region: 'US',
    productType: 'Chicken (whole/parts/processed)',
    brands: ['Tyson', 'Hillshire Farm', 'Jimmy Dean', 'Ball Park'],
    producer: 'Tyson Foods',
    parent: 'Tyson Foods (NYSE: TSN)',
    privateLabel: 'Also supplies private label',
    ownershipChange: 'Acquired Hillshire 2014; sold some lines',
    countryOfOrigin: 'USA',
    welfareClaims: "Mostly conventional; some 'no antibiotics' lines",
    housingSystem: 'Fast-grow (Cornish Cross), indoor high density',
    certifications: 'Limited; no broad welfare cert',
    pledges: 'NOT a BCC signatory',
    pledgeStatus: 'NOT SIGNED',
    documentedIssues:
      "Repeated undercover investigations (MFA, Animal Outlook, ALDF); cruelty charges vs a contract grower (2023); dropped 'No Antibiotics Ever' 2019",
    sourceTier: 'T1+T2',
    confidence: 'VERIFIED',
    labelIntegrity: 2,
    verification: 3,
    suggestedOverall: 2,
    redFlags: 'Documented welfare investigations; fast-grow breed; not BCC',
    lastVerified: '2026-06',
  },
  {
    id: 'perdue',
    category: 'chicken',
    region: 'US',
    productType: 'Chicken (whole/parts/organic)',
    brands: ['Perdue', 'Harvestland', 'Coleman', 'Niman Ranch'],
    producer: 'Perdue Farms',
    parent: 'Perdue Farms (private)',
    privateLabel: 'Also supplies others',
    ownershipChange: 'Acquired Niman Ranch 2015, Coleman',
    countryOfOrigin: 'USA',
    welfareClaims: "'No antibiotics ever'; some Certified Humane (Harvestland)",
    housingSystem: 'Mostly fast-grow; slower-breed trials; more light/enrichment',
    certifications: 'Some Certified Humane / GAP 2+ lines; American Humane (corp.)',
    pledges: 'Better Chicken Commitment (partial)',
    pledgeStatus: 'PARTIAL / ON TRACK',
    documentedIssues:
      "Relative US leader (Animal Care Summit; petitioned USDA on 'pasture raised'); but core lines still fast-grow; American Humane is weak seal",
    sourceTier: 'T1+T2',
    confidence: 'VERIFIED',
    labelIntegrity: 3,
    verification: 3,
    suggestedOverall: 3,
    redFlags: "Mixed portfolio; check the specific line's cert/step",
    lastVerified: '2026-06',
  },
  {
    id: 'pilgrims-pride',
    category: 'chicken',
    region: 'US',
    productType: 'Chicken (whole/parts/processed)',
    brands: ["Pilgrim's", 'Just BARE', "Gold'n Plump"],
    producer: "Pilgrim's Pride",
    parent: "JBS S.A. (controls Pilgrim's)",
    privateLabel: null,
    ownershipChange: 'JBS majority owner; bought Moy Park, Tulip',
    countryOfOrigin: 'USA / global',
    welfareClaims: "Conventional; some 'no antibiotics' lines",
    housingSystem: 'Fast-grow, indoor high density',
    certifications: 'Limited',
    pledges: 'BCC status unclear (verify)',
    pledgeStatus: 'UNCLEAR',
    documentedIssues:
      "HSUS filed SEC complaint alleging JBS/Pilgrim's mislead investors on welfare; MFA contract-farm footage",
    sourceTier: 'T1+T2',
    confidence: 'VERIFIED',
    labelIntegrity: 2,
    verification: 3,
    suggestedOverall: 2,
    redFlags: 'Opaque JBS ownership; SEC complaint; investigations',
    lastVerified: '2026-06',
  },
  {
    id: 'wayne-sanderson',
    category: 'chicken',
    region: 'US',
    productType: 'Chicken (whole/parts)',
    brands: ['Wayne Farms', 'Sanderson Farms'],
    producer: 'Wayne-Sanderson Farms',
    parent: 'Cargill + Continental Grain (50/50 JV)',
    privateLabel: null,
    ownershipChange: 'FORMED 2022: Cargill+ContiGrain bought Sanderson, merged w/ Wayne Farms',
    countryOfOrigin: 'USA',
    welfareClaims: "Conventional; 'no antibiotics' lines",
    housingSystem: 'Fast-grow, indoor high density',
    certifications: 'Limited',
    pledges: 'Not a known BCC signatory',
    pledgeStatus: 'NOT SIGNED',
    documentedIssues:
      "3rd/4th-largest US chicken; private since 2022 merger so disclosure reduced. Sanderson did NOT merge with Cobb-Vantress (Tyson's broiler-genetics subsidiary)",
    sourceTier: 'T1',
    confidence: 'VERIFIED',
    labelIntegrity: 2,
    verification: 2,
    suggestedOverall: 2,
    redFlags: 'Reduced disclosure post-take-private; conventional breed/housing',
    lastVerified: '2026-06',
  },
  {
    id: 'bell-and-evans',
    category: 'chicken',
    region: 'US',
    productType: 'Chicken (whole/parts/organic)',
    brands: ['Bell & Evans'],
    producer: 'Farmers Pride, Inc.',
    parent: 'Bell & Evans (private)',
    privateLabel: null,
    ownershipChange: 'Family-owned; built welfare hatchery',
    countryOfOrigin: 'USA',
    welfareClaims: 'Air-chilled; organic; slower-growing breed',
    housingSystem: "SLOWER-GROWING 'Das Klassenbester' breed; organic-welfare hatchery",
    certifications: 'Organic; higher-welfare breed program',
    pledges: '100% slower-breed since ~2018',
    pledgeStatus: 'MET (own commitment)',
    documentedIssues:
      'Genuine US welfare leader: ~$14M/yr extra feed for slower breed; world-first organic welfare hatchery',
    sourceTier: 'T1+T2',
    confidence: 'VERIFIED',
    labelIntegrity: 4,
    verification: 4,
    suggestedOverall: 4,
    redFlags: 'Premium price; verify current GAP/Certified Humane status per SKU',
    lastVerified: '2026-06',
  },
  {
    id: 'foster-farms',
    category: 'chicken',
    region: 'US',
    productType: 'Chicken (whole/parts)',
    brands: ['Foster Farms'],
    producer: 'Foster Farms (Atlas-Holdings owned)',
    parent: 'Atlas Holdings (acq. 2022)',
    privateLabel: null,
    ownershipChange: 'Bought by Atlas Holdings 2022',
    countryOfOrigin: 'USA (West Coast)',
    welfareClaims: "'Antibiotic-free' lines; American Humane Certified",
    housingSystem: 'Conventional fast-grow',
    certifications: 'American Humane Certified',
    pledges: 'n/a',
    pledgeStatus: 'n/a',
    documentedIssues:
      'ALDF/critics cite American Humane Certified as weak; past Salmonella recalls (2013-14)',
    sourceTier: 'T1+T2',
    confidence: 'REPORTED',
    labelIntegrity: 2,
    verification: 3,
    suggestedOverall: 2,
    redFlags: 'American Humane is the weakest audited seal; verify recall history',
    lastVerified: '2026-06',
  },
  {
    id: 'applegate',
    category: 'chicken',
    region: 'US',
    productType: 'Chicken (processed, organic)',
    brands: ['Applegate'],
    producer: 'Applegate Farms',
    parent: 'Hormel Foods (NYSE: HRL)',
    privateLabel: null,
    ownershipChange: 'Hormel acquired Applegate 2015',
    countryOfOrigin: 'USA',
    welfareClaims: "'Humanely raised'; antibiotic-free; some GAP",
    housingSystem: 'Sourced from higher-welfare/organic farms',
    certifications: 'GAP-rated lines; Certified Humane (some)',
    pledges: 'Better Chicken Commitment signatory',
    pledgeStatus: 'ON TRACK (per CIWF)',
    documentedIssues:
      'Among BCC signatories showing measurable progress; owned by conventional parent Hormel',
    sourceTier: 'T1+T2',
    confidence: 'REPORTED',
    labelIntegrity: 3,
    verification: 3,
    suggestedOverall: 3,
    redFlags: 'Verify which SKUs are GAP step 4+ vs lower',
    lastVerified: '2026-06',
  },
  {
    id: 'us-private-label-chicken',
    category: 'chicken',
    region: 'US',
    productType: 'Chicken (private label)',
    brands: ['Great Value', 'Kirkland'],
    producer: 'Tyson / Pilgrim\'s / Perdue (undisclosed)',
    parent: 'Walmart / Costco',
    privateLabel: 'Retailers',
    ownershipChange: 'n/a',
    countryOfOrigin: 'USA',
    welfareClaims: "Varies; some 'no antibiotics' SKUs",
    housingSystem: 'Conventional fast-grow (supplier-dependent)',
    certifications: 'Mostly none; varies',
    pledges: 'Walmart broiler-welfare commitments (verify)',
    pledgeStatus: 'UNCLEAR',
    documentedIssues:
      'Private-label broiler sourcing rarely disclosed at SKU level; likely from big-3 conventional producers',
    sourceTier: 'T3',
    confidence: 'UNVERIFIED',
    labelIntegrity: 2,
    verification: 1,
    suggestedOverall: 1,
    redFlags: 'Supplier opacity; assume conventional unless cert shown',
    lastVerified: '2026-06',
  },
  {
    id: '2-sisters',
    category: 'chicken',
    region: 'UK',
    productType: 'Chicken (whole/parts/processed)',
    brands: ['Own-label for Tesco/Asda/Aldi', 'Bernard Matthews'],
    producer: '2 Sisters Food Group',
    parent: 'Boparan Holdings (private)',
    privateLabel: 'Major private-label supplier',
    ownershipChange: "Owns Bernard Matthews, Fox's",
    countryOfOrigin: 'UK',
    welfareClaims: 'Standard + some higher-welfare retailer lines',
    housingSystem: 'Mostly conventional fast-grow',
    certifications: 'Red Tractor; some RSPCA Assured lines',
    pledges: 'Retailer BCC-type pledges vary',
    pledgeStatus: 'MIXED',
    documentedIssues:
      "2018 FSA hygiene scandal (West Bromwich 'Site D'); ongoing welfare/worker complaints",
    sourceTier: 'T1+T2',
    confidence: 'VERIFIED',
    labelIntegrity: 2,
    verification: 3,
    suggestedOverall: 2,
    redFlags: 'Largest UK processor; standard-tier dominates volume',
    lastVerified: '2026-06',
  },
  {
    id: 'cranswick',
    category: 'chicken',
    region: 'UK',
    productType: 'Chicken (whole/parts)',
    brands: ['Own-label', 'Cranswick premium'],
    producer: 'Cranswick plc',
    parent: 'Cranswick plc (LSE: CWK)',
    privateLabel: 'Supplies retailers',
    ownershipChange: 'Expanded into poultry via acquisitions',
    countryOfOrigin: 'UK',
    welfareClaims: 'Higher-welfare lines; some RSPCA Assured',
    housingSystem: 'Mix; investing in higher-welfare',
    certifications: 'RSPCA Assured (select); Red Tractor',
    pledges: 'Retailer-aligned welfare programmes',
    pledgeStatus: 'MIXED / IMPROVING',
    documentedIssues:
      'Fewer documented welfare scandals than 2 Sisters; stronger ESG positioning',
    sourceTier: 'T1',
    confidence: 'REPORTED',
    labelIntegrity: 3,
    verification: 3,
    suggestedOverall: 3,
    redFlags: 'Verify proportion of RSPCA Assured vs standard',
    lastVerified: '2026-06',
  },
  {
    id: 'moy-park',
    category: 'chicken',
    region: 'UK/IE',
    productType: 'Chicken (whole/parts)',
    brands: ['Moy Park'],
    producer: 'Moy Park',
    parent: "Pilgrim's Pride / JBS",
    privateLabel: 'Major retailer supplier',
    ownershipChange: 'JBS/Pilgrim\'s owned',
    countryOfOrigin: 'UK / Ireland',
    welfareClaims: 'Standard + Free Range / higher-welfare lines',
    housingSystem: 'Conventional + free-range lines',
    certifications: 'Red Tractor; some RSPCA Assured',
    pledges: 'Retailer pledges vary',
    pledgeStatus: 'MIXED',
    documentedIssues:
      'Largest NI/UK poultry firm; JBS-owned (opaque); standard fast-grow dominates',
    sourceTier: 'T1',
    confidence: 'REPORTED',
    labelIntegrity: 2,
    verification: 3,
    suggestedOverall: 2,
    redFlags: 'JBS ownership; verify welfare-line share',
    lastVerified: '2026-06',
  },
  {
    id: 'phw-wiesenhof',
    category: 'chicken',
    region: 'EU',
    productType: 'Chicken (whole/parts/processed)',
    brands: ['Wiesenhof'],
    producer: 'PHW Group',
    parent: 'PHW Group (private, DE)',
    privateLabel: 'Supplies Lidl/Aldi/Kaufland',
    ownershipChange: 'Family-owned conglomerate',
    countryOfOrigin: 'Germany',
    welfareClaims: "Standard + 'Privathof' higher-welfare line",
    housingSystem: 'Mostly conventional fast-grow',
    certifications: "Some EU organic; 'Initiative Tierwohl'",
    pledges: "German 'Initiative Tierwohl' (industry)",
    pledgeStatus: 'MIXED',
    documentedIssues:
      'ARD (German public TV) documentary + activist footage alleged welfare/worker/environment abuses; company called them isolated cases',
    sourceTier: 'T2',
    confidence: 'REPORTED',
    labelIntegrity: 2,
    verification: 3,
    suggestedOverall: 2,
    redFlags: "Industry 'Tierwohl' scheme is low-bar; investigations are advocacy/TV-sourced",
    lastVerified: '2026-06',
  },
  {
    id: 'ldc-groupe',
    category: 'chicken',
    region: 'EU',
    productType: 'Chicken (whole/parts)',
    brands: ['Le Gaulois', 'Maitre CoQ', 'Loue'],
    producer: 'LDC Groupe',
    parent: 'LDC (Euronext: LOUP)',
    privateLabel: 'Supplies FR retailers',
    ownershipChange: 'Acquisitive French leader',
    countryOfOrigin: 'France',
    welfareClaims: 'Standard lines + Loue Label Rouge free-range',
    housingSystem: 'Conventional + Label Rouge plein air (slower, free-range)',
    certifications: 'FR Label Rouge (Loue); EU Organic lines',
    pledges: 'FR welfare/Label Rouge programmes',
    pledgeStatus: 'MIXED BY BRAND',
    documentedIssues:
      'Loue is a GENUINE higher-welfare tier (Label Rouge: slower breed, free-range, ~81 days); Le Gaulois/Maitre CoQ are conventional',
    sourceTier: 'T1',
    confidence: 'REPORTED',
    labelIntegrity: 3,
    verification: 3,
    suggestedOverall: 3,
    redFlags: 'Score depends entirely on sub-brand; Label Rouge is credible',
    lastVerified: '2026-06',
  },
];

/** All egg + chicken producer records. */
export const WELFARE_PRODUCERS: WelfareProducer[] = [...EGG_PRODUCERS, ...CHICKEN_PRODUCERS];

// ---------------------------------------------------------------------------
// Label decoder — what the label requires vs what shoppers assume
// ---------------------------------------------------------------------------

export type LabelCredibility = 'Meaningful' | 'Moderate' | 'Marketing';

export interface LabelDecoderEntry {
  label: string;
  appliesTo: 'egg' | 'chicken' | 'both';
  requirementUS: string;
  requirementEU: string;
  shopperAssumption: string;
  reality: string;
  credibility: LabelCredibility;
  howToVerify: string;
}

export const LABEL_DECODER: LabelDecoderEntry[] = [
  {
    label: 'Animal Welfare Approved (AGW / A Greener World)',
    appliesTo: 'both',
    requirementUS: 'Pass/fail; pasture/range required; no cages/crates; slower breeds; independent audit',
    requirementEU: 'No direct EU equivalent',
    shopperAssumption: 'Animals lived outdoors on a real farm',
    reality: 'Smallest gap; widely cited most-rigorous US seal; limited availability',
    credibility: 'Meaningful',
    howToVerify: 'AGW certified-product directory',
  },
  {
    label: 'Certified Humane (HFAC)',
    appliesTo: 'both',
    requirementUS: 'Pass/fail; 100% of standards; no cages/crates; defined space; tiered free-range/pasture',
    requirementEU: 'National equivalents vary',
    shopperAssumption: 'Humanely raised, much better than factory',
    reality: "Strong for pasture/free-range tiers; indoor 'enriched' tier still barn; beak-trim allowed in some cases",
    credibility: 'Meaningful',
    howToVerify: 'HFAC audit; certifiedhumane.org search',
  },
  {
    label: 'Global Animal Partnership (GAP) Steps 1-5+',
    appliesTo: 'chicken',
    requirementUS: '6 steps; only Steps 4/5/5+ require pasture; 1-3 allow conventional indoor',
    requirementEU: 'No US-style steps in EU',
    shopperAssumption: "'Certified' = high welfare",
    reality: "Big gap at low steps: 1-3 'not high welfare' (AWI). Whole Foods house standard. Check the step #",
    credibility: 'Moderate',
    howToVerify: 'GAP certification database; step # on pack',
  },
  {
    label: 'RSPCA Assured',
    appliesTo: 'both',
    requirementUS: 'No US equivalent',
    requirementEU: 'Above UK legal min; no farrowing crates; more space than Red Tractor',
    shopperAssumption: 'RSPCA-approved = genuinely good',
    reality: '2024 investigations found breaches on Assured farms; VP Brian May resigned; ASA opened ad probe',
    credibility: 'Moderate',
    howToVerify: 'RSPCA Assured database (UK)',
  },
  {
    label: 'Organic (USDA / EU)',
    appliesTo: 'both',
    requirementUS: 'Organic feed; no routine antibiotics; outdoor access required',
    requirementEU: 'EU Organic: outdoor access, lower density, organic feed',
    shopperAssumption: 'Organic = high welfare + outdoors',
    reality: "Targets inputs/health, not all welfare; outdoor 'access' loosely enforced; broiler breed often still fast-grow",
    credibility: 'Moderate',
    howToVerify: 'USDA/EU organic cert + certifier housing standard',
  },
  {
    label: 'Free-range',
    appliesTo: 'both',
    requirementUS: "US: 'access to the outside' — no size/duration defined; loosely policed",
    requirementEU: "EU eggs: 4 sqm outdoor/hen; EU broiler: 'access', 2.5 sqm/bird in some schemes",
    shopperAssumption: 'Birds roamed outdoors in fields',
    reality: 'Large gap in US (a popdoor can qualify); EU rules stronger; meaningful with a seal',
    credibility: 'Moderate',
    howToVerify: 'Stocking-density data + third-party seal',
  },
  {
    label: 'Cage-free (eggs)',
    appliesTo: 'egg',
    requirementUS: 'USDA-graded: uncaged inside barn/aviary',
    requirementEU: 'EU: min 9 hens/sqm indoors, no cages',
    shopperAssumption: 'Hens roam freely, maybe outdoors',
    reality: 'Real gain over cages, but sheds hold tens of thousands; no outdoor access; more aggression',
    credibility: 'Moderate',
    howToVerify: 'USDA grade shield + third-party audit',
  },
  {
    label: 'Pasture-raised (uncertified)',
    appliesTo: 'both',
    requirementUS: 'No USDA definition',
    requirementEU: 'No EU legal definition',
    shopperAssumption: 'Animals lived on open pasture',
    reality: 'Meaning depends entirely on a backing certifier; unregulated alone',
    credibility: 'Moderate',
    howToVerify: 'Look for AGW or Certified Humane backing',
  },
  {
    label: 'American Humane Certified',
    appliesTo: 'both',
    requirementUS: '~85% of criteria at audit; STILL permits hen cages, sow crates, no transport-time limit',
    requirementEU: 'No EU equivalent',
    shopperAssumption: "'Humane' = better treatment (AHA survey: 95% assume so)",
    reality: 'Largest gap of any audited seal; Consumer Reports & AWI rate it weakest; called humane-washing',
    credibility: 'Marketing',
    howToVerify: 'Treat as low-bar; demand stronger seal',
  },
  {
    label: 'Red Tractor (UK)',
    appliesTo: 'both',
    requirementUS: 'No US equivalent',
    requirementEU: 'Baseline UK scheme = legal minimum; farrowing crates permitted',
    shopperAssumption: "'Farmed with care' (its slogan)",
    reality: "ASA UPHELD a greenwashing complaint vs its 'farmed with care' ad (2023); mostly a compliance mark",
    credibility: 'Marketing',
    howToVerify: 'Treat as legal-baseline only',
  },
  {
    label: "'Natural' / 'Farm fresh' / 'Hormone-free' (poultry)",
    appliesTo: 'both',
    requirementUS: "'Natural' = minimally processed; hormones already illegal in US poultry/pork",
    requirementEU: 'No welfare meaning',
    shopperAssumption: 'Humanely raised / small farm / chemical-free',
    reality: 'Meaningless for welfare; even worst operations qualify',
    credibility: 'Marketing',
    howToVerify: 'Ignore for welfare purposes',
  },
  {
    label: "'Humanely raised' (uncertified)",
    appliesTo: 'both',
    requirementUS: 'No legal definition (US)',
    requirementEU: 'Varies by country',
    shopperAssumption: 'Third-party verified welfare',
    reality: 'Often an unverified company claim; demand an audit/seal',
    credibility: 'Marketing',
    howToVerify: 'Require a third-party cert behind it',
  },
  {
    label: 'Label Rouge (France)',
    appliesTo: 'chicken',
    requirementUS: 'No US equivalent',
    requirementEU: 'FR scheme: slower-growing breed, free-range, ~81-day min, lower density',
    shopperAssumption: 'Higher-quality, free-range French bird',
    reality: 'Genuine higher-welfare tier; among the stronger mainstream EU signals',
    credibility: 'Meaningful',
    howToVerify: 'Label Rouge certified-product list',
  },
];

// ---------------------------------------------------------------------------
// Greenwashing / humane-washing red flags
// ---------------------------------------------------------------------------

export interface GreenwashingRedFlag {
  id: number;
  tactic: string;
  whatItLooksLike: string;
  example: string;
  howToCatch: string;
}

export const GREENWASHING_RED_FLAGS: GreenwashingRedFlag[] = [
  {
    id: 1,
    tactic: 'Undefined virtue words',
    whatItLooksLike: "'humane', 'natural', 'farm fresh' with no audit",
    example: "'Natural' eggs/chicken on conventional product",
    howToCatch: 'Require a third-party seal; otherwise discount the claim',
  },
  {
    id: 2,
    tactic: 'Misdirection (env. = welfare)',
    whatItLooksLike: "'Organic' implies high welfare",
    example: 'Organic broiler still a fast-grow Cornish Cross',
    howToCatch: 'Separate environmental from welfare; ask about breed & density',
  },
  {
    id: 3,
    tactic: 'Silent omission',
    whatItLooksLike: "States what it IS, hides what it isn't",
    example: "'Cage-free' with no stocking-density or outdoor info",
    howToCatch: 'Look for the missing metric (density, outdoor m2)',
  },
  {
    id: 4,
    tactic: 'Weak-seal halo',
    whatItLooksLike: 'Strong words + a weak certifier logo',
    example: "American Humane Certified marketed as 'humane'",
    howToCatch: 'Rank the seal (AGW/Certified Humane strong; Am. Humane/Red Tractor weak)',
  },
  {
    id: 5,
    tactic: 'Pledge theatre',
    whatItLooksLike: 'Announce, miss deadline, go silent',
    example: '2025 cage-free pledges quietly dropped by many chains',
    howToCatch: 'Check NGO trackers (Humane League Eggspose; CIWF ChickenTrack)',
  },
  {
    id: 6,
    tactic: 'Facility theatre',
    whatItLooksLike: 'Pastoral imagery, industrial reality',
    example: 'Red barn / single hen art on big-shed product',
    howToCatch: "Cross-check producer; ASA upheld Red Tractor 'farmed with care'",
  },
  {
    id: 7,
    tactic: 'Litigation against welfare rules',
    whatItLooksLike: 'Sue to avoid welfare law',
    example: 'Egg-industry challenges to cage-free / Prop 12',
    howToCatch: 'Note regulatory posture as a red flag',
  },
  {
    id: 8,
    tactic: 'Supplier opacity',
    whatItLooksLike: "'Multiple farms', none named, no audit",
    example: 'Private-label eggs/chicken (Great Value, Kirkland)',
    howToCatch: 'Treat undisclosed supply as unverified',
  },
  {
    id: 9,
    tactic: 'Vague breed claims',
    whatItLooksLike: "'slower-growing' without the breed name",
    example: 'Generic "slow grown" vs named Das Klassenbester / Label Rouge',
    howToCatch: 'Demand the breed name; Cornish Cross = industrial',
  },
  {
    id: 10,
    tactic: 'Stale evidence',
    whatItLooksLike: 'Old audit/cert used as current proof',
    example: 'Citing a past certification without current audit date',
    howToCatch: 'Check certificate expiry / last audit date',
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Tokens too short or generic to safely match a brand on. */
const GENERIC_BRAND_TOKENS = new Set([
  'own-label', 'own', 'label', 'store', 'retailer', 'premium', 'multiple', 'lic.',
  'co', 'co.', 'inc', 'inc.', 'the', 'and', 'for', 'farms', 'foods', 'group',
]);

function brandTokenMatches(token: string, query: string): boolean {
  const t = token.toLowerCase().trim();
  if (t.length < 4 || GENERIC_BRAND_TOKENS.has(t)) return false;
  return query.includes(t);
}

/**
 * Find the egg/chicken welfare record for a brand string, if any.
 * Matches against on-pack brand names first, then producer / parent company.
 */
export function getWelfareProducerByBrand(
  brand: string | null | undefined,
): WelfareProducer | undefined {
  if (!brand) return undefined;
  const query = brand.toLowerCase().trim();
  if (!query) return undefined;

  // Pass 1: on-pack brand names (most specific).
  for (const record of WELFARE_PRODUCERS) {
    for (const b of record.brands) {
      if (b.toLowerCase() === query) return record;
      if (b.split(/[/;,]/).some((part) => brandTokenMatches(part, query))) return record;
    }
  }

  // Pass 2: producer / parent company name.
  for (const record of WELFARE_PRODUCERS) {
    if (brandTokenMatches(record.producer, query)) return record;
    if (brandTokenMatches(record.parent, query)) return record;
  }

  return undefined;
}

/** True if a brand has any egg/chicken welfare record. */
export function hasWelfareRecord(brand: string | null | undefined): boolean {
  return !!getWelfareProducerByBrand(brand);
}

/** Look up a label-decoder entry by (partial) label text. */
export function getLabelInfo(label: string | null | undefined): LabelDecoderEntry | undefined {
  if (!label) return undefined;
  const query = label.toLowerCase().trim();
  return LABEL_DECODER.find(
    (entry) => entry.label.toLowerCase().includes(query) || query.includes(entry.label.toLowerCase()),
  );
}

/**
 * Map a 1–5 "suggested overall" welfare score to the app's good/warn/bad tone.
 *  4–5 = good, 3 = warn, 1–2 = bad.
 */
export function welfareScoreTone(suggestedOverall: number): 'good' | 'warn' | 'bad' {
  if (suggestedOverall >= 4) return 'good';
  if (suggestedOverall === 3) return 'warn';
  return 'bad';
}
