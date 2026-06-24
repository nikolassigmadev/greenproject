/**
 * Beef Welfare Database — company / brand level (USA, Europe & S. America, grocery retail)
 *
 * Source: "Ethical Beef — Company Database" workbook (compiled June 2026).
 * Company records with ownership tracing, certifications, documented issues,
 * pledge status and credibility — every row is sourced.
 *
 * HOW THE SCORES WORK
 *  - Transparency (Low / Low-Medium / Medium / Medium-High / High / Very High):
 *    how much the company discloses about its supply chain, welfare, and
 *    environmental practices.
 *  - Confidence flag per row:
 *    VERIFIED  — Tier-1 source (regulator, court record, named news, NGO, filing)
 *    REPORTED  — credible news / industry-standard, not independently confirmed
 *    MIXED     — sources partly confirm and partly conflict
 *
 * Source tiers:
 *   Tier 1 Authoritative: USDA FSIS, EPA, EFSA, Bundeskartellamt, CADE, courts,
 *     SEC filings, satellite monitors (Global Forest Watch / DETER).
 *   Tier 2 Strong-but-biased: NGO investigations (Mighty Earth, Greenpeace, CIWF)
 *     and mainstream journalism (Reuters, Guardian, NBC, CNBC).
 *   Tier 3 Weak: package marketing & company website claims without audit.
 */

export type BeefConfidence = 'Verified' | 'Reported' | 'Mixed';

export type BeefTransparency =
  | 'Low'
  | 'Low-Medium'
  | 'Medium'
  | 'Medium-High'
  | 'High'
  | 'Very High';

export interface BeefCompany {
  id: string;
  company: string;
  hq: string;
  region: 'US' | 'EU' | 'SA';
  supplyChainRole: string;
  brands: string[];
  parent: string;
  scale: string;
  productionSystem: string;
  certifications: string;
  documentedIssues: string;
  pledges: string;
  transparency: BeefTransparency;
  redFlags: string;
  confidence: BeefConfidence;
  keySources: string;
}

// ---------------------------------------------------------------------------
// US Companies
// ---------------------------------------------------------------------------

export const US_BEEF_COMPANIES: BeefCompany[] = [
  {
    id: 'jbs-usa',
    company: 'JBS USA',
    hq: 'Greeley, CO (US); parent NL/Brazil',
    region: 'US',
    supplyChainRole: 'Packer, processor (sold its feedlots in 2018)',
    brands: ['Swift', 'Swift Premium', '1855 Black Angus', 'Aspen Ridge', 'Grass Run Farms', 'Cedar River Farms', 'Friboi'],
    parent: 'JBS N.V. (NYSE: JBS); Batista family / J&F Investimentos',
    scale: "World's largest meat company; ~20-22% US beef slaughter",
    productionSystem: 'Predominantly conventional grain-fed / feedlot',
    certifications: 'Limited; Grass Run Farms USDA Organic; no broad welfare cert',
    documentedIssues: "NY AG sued 2024 over misleading 'net-zero by 2040' marketing \u2192 $1.1M settlement Nov 2025. Amazon/Cerrado deforestation (~1,400 ha in 2025). 2017 Brazil bribery scandal. 2021 ransomware shutdown. Named in beef price-fixing antitrust (not settled). 2020 COVID worker-safety. Industry wage-suppression settlement ($200.2M).",
    pledges: 'Net-zero GHG by 2040 (ruled misleading by NY AG); deforestation-free supply by 2025 (monitors say likely missed)',
    transparency: 'Low',
    redFlags: 'Opaque supply chain; Brazilian-linked deforestation; target of Trump DOJ price-fixing probe (Nov 2025). Foreign ownership politically salient.',
    confidence: 'Verified',
    keySources: 'NY AG; Mighty Earth; CNBC; SEC 6-K',
  },
  {
    id: 'tyson-beef',
    company: 'Tyson Foods (Tyson Fresh Meats)',
    hq: 'Springdale, AR',
    region: 'US',
    supplyChainRole: 'Packer, processor',
    brands: ['Tyson', 'Star Ranch Angus', "Chairman's Reserve", 'Open Prairie'],
    parent: 'Tyson Foods Inc. (NYSE: TSN); Tyson family control',
    scale: '~22-24% US beef capacity; top US beef packer by volume',
    productionSystem: 'Predominantly conventional feedlot; Open Prairie natural line',
    certifications: "Limited; Open Prairie 'never-ever' natural",
    documentedIssues: 'Beef price-fixing antitrust: $55M settlement (approved May 2026). Closed Lexington, NE plant (~3,200 jobs) Jan 2026. Recurrent E. coli & ground-beef recalls. Sanitation-contractor child-labor scrutiny. Industry wage-suppression settlement.',
    pledges: 'Climate/scope-3 commitments; no strong beef deforestation pledge',
    transparency: 'Low',
    redFlags: 'Frequent recalls & labor issues; target of Trump DOJ probe. Lexington closure signals supply stress, not reform.',
    confidence: 'Verified',
    keySources: 'Top Class Actions; FSIS; UNL CAP; KCUR',
  },
  {
    id: 'cargill-beef',
    company: 'Cargill (Cargill Protein)',
    hq: 'Wichita, KS / Minnetonka, MN',
    region: 'US',
    supplyChainRole: 'Packer, feedlot, processor',
    brands: ['Sterling Silver', 'Angus Pride', 'Our Certified'],
    parent: 'Cargill Inc. (private; Cargill & MacMillan families)',
    scale: '~20% US beef capacity; #3 packer',
    productionSystem: 'Conventional feedlot',
    certifications: 'Limited',
    documentedIssues: 'Beef price-fixing antitrust: $32.5M settlement (May 2026). Closed Milwaukee plant Feb 2026. South America soy/cattle deforestation exposure. Labor disputes. Industry wage-suppression settlement.',
    pledges: 'Carbon-reduction & deforestation-free targets stated; thin public verification',
    transparency: 'Low-Medium',
    redFlags: 'Private = limited disclosure. Target of Trump DOJ probe. Scale gives outsized supply-chain influence.',
    confidence: 'Verified',
    keySources: 'Class Action; Capital Press; FinancialContent',
  },
  {
    id: 'national-beef',
    company: 'National Beef Packing Co.',
    hq: 'Kansas City, MO',
    region: 'US',
    supplyChainRole: 'Packer, processor',
    brands: ['National Beef', 'Kansas City Steak Co.'],
    parent: '80% owned by MBRF Global Foods (Marfrig + BRF merger, Sept 2025; Brazilian)',
    scale: '~14% US capacity; #4 packer',
    productionSystem: 'Conventional feedlot',
    certifications: 'Limited',
    documentedIssues: "Named in beef price-fixing antitrust (has NOT settled). Brazilian parent Marfrig carries Amazon deforestation exposure. Subject of Trump 'foreign-owned meatpacker' rhetoric (Nov 2025).",
    pledges: 'Via Marfrig: Amazon deforestation-monitoring commitments (contested)',
    transparency: 'Low',
    redFlags: 'Foreign (Brazilian) control is central to 2025-26 political scrutiny; supply opacity high.',
    confidence: 'Verified',
    keySources: 'Food Processing; CADE; MEAT+POULTRY',
  },
  {
    id: 'five-rivers',
    company: 'Five Rivers Cattle Feeding',
    hq: 'Loveland, CO',
    region: 'US',
    supplyChainRole: 'Feedlot (largest in the world)',
    brands: [],
    parent: 'Pinnacle Asset Management LP (bought from JBS for $200M, 2018)',
    scale: '11 feedyards; 900,000+ head one-time capacity',
    productionSystem: 'Grain-finishing CAFO',
    certifications: 'None notable',
    documentedIssues: 'CAFO-sector environmental concerns (manure, water, air, nitrate runoff); little facility-level public data.',
    pledges: 'None tracked',
    transparency: 'Low',
    redFlags: 'Ownership verified; specific environmental practices not publicly disclosed (sector-wide gap).',
    confidence: 'Verified',
    keySources: 'Western Livestock Journal; Farm Progress',
  },
  {
    id: 'harris-ranch',
    company: 'Harris Ranch Beef Co.',
    hq: 'Coalinga, CA',
    region: 'US',
    supplyChainRole: 'Feedlot + packer',
    brands: ['Harris Ranch'],
    parent: 'Harris Ranch (private, family)',
    scale: 'One of the largest feedlots on the US West Coast',
    productionSystem: 'Conventional grain-fed',
    certifications: 'None broad',
    documentedIssues: 'Long-running local scrutiny over odor, air quality and water near its Central Valley feedlot; historical activist targeting.',
    pledges: 'None tracked',
    transparency: 'Low-Medium',
    redFlags: 'Confirmed key Costco beef source; CAFO environmental footprint is the main flag.',
    confidence: 'Reported',
    keySources: 'Mashed; Costco Food DB',
  },
  {
    id: 'agri-beef',
    company: 'Agri Beef Co.',
    hq: 'Boise, ID',
    region: 'US',
    supplyChainRole: 'Vertically integrated rancher/feeder/packer',
    brands: ['Snake River Farms', 'Double R Ranch', 'St. Helens', 'Rancho El Oro'],
    parent: 'Agri Beef Co. (private, 3rd-gen family)',
    scale: 'Leading US premium/Wagyu supplier',
    productionSystem: 'Premium GRAIN-FED & Wagyu (not grass-fed)',
    certifications: 'Limited 3rd-party welfare; controls own supply',
    documentedIssues: 'Few documented issues.',
    pledges: 'None prominent',
    transparency: 'Medium',
    redFlags: 'Transparent on ranch families & integration, but premium = grain-finished, not pasture; thin welfare audits.',
    confidence: 'Verified',
    keySources: 'agribeef.com; Snake River Farms',
  },
  {
    id: 'creekstone',
    company: 'Creekstone Farms Premium Beef',
    hq: 'Arkansas City, KS',
    region: 'US',
    supplyChainRole: 'Packer / processor (premium Black Angus)',
    brands: ['Creekstone Farms'],
    parent: 'Marubeni Corp. (Japan) since 2017',
    scale: '~12th-largest US beef producer; premium specialist',
    productionSystem: "Premium grain-fed Angus; 'Natural' line",
    certifications: 'Reportedly Certified Humane / AWA on some lines (verify current)',
    documentedIssues: 'Few documented issues; relatively transparent vs. Big Four.',
    pledges: 'None prominent',
    transparency: 'Medium',
    redFlags: 'Stronger welfare practices than commodity packers; Japanese trading-house ownership; verify cert currency.',
    confidence: 'Mixed',
    keySources: 'Wikipedia; Marubeni; TSCRA',
  },
  {
    id: 'perdue-beef',
    company: 'Perdue Premium Meat Co.',
    hq: 'Salisbury, MD',
    region: 'US',
    supplyChainRole: 'Brand aggregator of independent-farm networks',
    brands: ['Niman Ranch', 'Coleman Natural', 'Panorama Organic Grass-Fed'],
    parent: 'Perdue Farms (private)',
    scale: "Largest 'natural/organic' meat aggregator in US",
    productionSystem: 'Niman = independent family farms (antibiotic-free); Panorama = 100% grass-fed/finished USDA Organic',
    certifications: 'Niman Ranch: Certified Humane on many; Panorama: USDA Organic + grass-fed',
    documentedIssues: 'Few documented issues at brand level (parent Perdue has poultry-welfare history).',
    pledges: 'Animal-care & sustainability commitments',
    transparency: 'Medium-High',
    redFlags: 'Niman publishes farmer network; among more credible scaled options. Verify per-product certification.',
    confidence: 'Verified',
    keySources: 'Food Dive; Supermarket Perimeter',
  },
  {
    id: 'white-oak-pastures',
    company: 'White Oak Pastures',
    hq: 'Bluffton, GA',
    region: 'US',
    supplyChainRole: 'Vertically integrated regenerative farm + on-site abattoir',
    brands: ['White Oak Pastures'],
    parent: 'Private (Will Harris family, 4th gen)',
    scale: 'Small-scale; flagship US regenerative producer; 3,200 acres, 10 species',
    productionSystem: 'Regenerative, multi-species, pasture-raised, grass-fed/finished',
    certifications: 'Largest Certified Organic farm in GA; AWA / GAP; Quantis LCA (2018)',
    documentedIssues: 'None notable.',
    pledges: 'Carbon claims: 2018 Quantis LCA found beef offsets >100% of its emissions (carbon-negative)',
    transparency: 'Very High',
    redFlags: 'Most transparent model; BUT carbon-negative claim is contested in peer literature. Limited supply.',
    confidence: 'Verified',
    keySources: 'PR Newswire; Civil Eats; Quantis LCA',
  },
  {
    id: 'thousand-hills',
    company: 'Thousand Hills Lifetime Grazed',
    hq: 'Cannon Falls, MN',
    region: 'US',
    supplyChainRole: 'Grass-fed brand / farm network',
    brands: ['Thousand Hills'],
    parent: 'Private (Matt Maier)',
    scale: 'Mid-size grass-fed brand; upper-Midwest family farms',
    productionSystem: "100% grass-fed/finished; 'Lifetime Grazed' (no grain ever); regenerative focus",
    certifications: 'Land to Market / Ecological Outcome Verification; regenerative claims',
    documentedIssues: 'None notable.',
    pledges: 'Soil-health / regenerative commitments',
    transparency: 'High',
    redFlags: "'Lifetime Grazed' is a strong, specific claim addressing the grass-fed loophole. Verify EOV currency.",
    confidence: 'Verified',
    keySources: 'Thousand Hills; Natural Grocers',
  },
  {
    id: 'verde-farms',
    company: 'Verde Farms',
    hq: 'Woburn, MA',
    region: 'US',
    supplyChainRole: 'Grass-fed brand / importer',
    brands: ['Verde Farms'],
    parent: 'Private (PE-backed)',
    scale: 'Widely distributed grass-fed grocery brand',
    productionSystem: '100% grass-fed/finished, organic options',
    certifications: 'USDA Organic options; grass-fed claims',
    documentedIssues: 'None notable.',
    pledges: 'Sustainability commitments',
    transparency: 'Medium',
    redFlags: "Sources from US AND Uruguay \u2014 'product of' origin matters; imported grass-fed common. Verify country-of-origin per pack.",
    confidence: 'Verified',
    keySources: 'Supermarket Perimeter; verdefarms.com',
  },
  {
    id: 'teton-sunfed',
    company: 'Teton Waters Ranch / SunFed Ranch',
    hq: 'Boulder, CO',
    region: 'US',
    supplyChainRole: 'Grass-fed brand (fresh + processed)',
    brands: ['Teton Waters Ranch', 'SunFed Ranch'],
    parent: 'Private (merged 2022)',
    scale: 'Leading grass-fed processed-beef (sausages, hot dogs) + fresh',
    productionSystem: '100% grass-fed; regenerative claims',
    certifications: 'Certified Humane (per certifier directory)',
    documentedIssues: 'None notable.',
    pledges: 'Regenerative / climate commitments',
    transparency: 'Medium-High',
    redFlags: 'Grass-fed processed niche; verify Certified Humane currency & sourcing origin.',
    confidence: 'Verified',
    keySources: 'Nosh; Certified Humane',
  },
  {
    id: 'certified-angus-beef',
    company: 'Certified Angus Beef (CAB)',
    hq: 'Wooster, OH',
    region: 'US',
    supplyChainRole: 'Breed-based brand / licensing program (NOT a packer)',
    brands: ['Certified Angus Beef'],
    parent: 'American Angus Association',
    scale: 'Best-known US beef brand; licensed to packers & retailers',
    productionSystem: 'Conventional grain-fed Angus meeting marbling/quality specs',
    certifications: 'Quality/breed standard ONLY',
    documentedIssues: 'n/a \u2014 brand program, not an operator.',
    pledges: 'None',
    transparency: 'Low',
    redFlags: "CRITICAL: a QUALITY/breed standard, NOT a welfare or environmental standard. Frequently misread by shoppers as 'ethical.'",
    confidence: 'Verified',
    keySources: 'American Angus Assn.',
  },
  {
    id: 'greater-omaha',
    company: 'Greater Omaha Packing',
    hq: 'Omaha, NE',
    region: 'US',
    supplyChainRole: 'Packer',
    brands: ['Greater Omaha'],
    parent: 'Private (family, since 1920)',
    scale: 'Mid-large regional packer; exports to 70+ countries',
    productionSystem: 'Conventional grain-fed',
    certifications: 'Export hygiene certs',
    documentedIssues: 'Periodic FSIS recalls typical of sector.',
    pledges: 'None tracked',
    transparency: 'Low-Medium',
    redFlags: 'Long-established single-source supplier; limited public welfare/enviro data.',
    confidence: 'Reported',
    keySources: 'greateromaha.com',
  },
  {
    id: 'american-foods-group',
    company: 'American Foods Group',
    hq: 'Green Bay, WI',
    region: 'US',
    supplyChainRole: 'Packer',
    brands: [],
    parent: 'Private (3rd-gen family)',
    scale: '~#5 US beef packer',
    productionSystem: 'Conventional grain-fed',
    certifications: 'Limited',
    documentedIssues: 'Sector-typical FSIS oversight.',
    pledges: 'None tracked',
    transparency: 'Low',
    redFlags: 'Largest privately held US beef company outside Big Four; opaque.',
    confidence: 'Reported',
    keySources: 'Industry directories',
  },
  {
    id: 'hormel-beef',
    company: 'Hormel Foods',
    hq: 'Austin, MN',
    region: 'US',
    supplyChainRole: 'Processor / brand owner',
    brands: ['Applegate', 'Hormel', 'Dinty Moore', "Lloyd's"],
    parent: 'Hormel Foods Corp. (NYSE: HRL)',
    scale: 'Major US processed-meat company',
    productionSystem: "Sources beef commodity + Applegate 'never-ever' network",
    certifications: 'Applegate: humane-network & organic claims',
    documentedIssues: 'Applegate acq. 2015 ($775M). Parent has prior poultry-welfare & labor scrutiny.',
    pledges: 'Responsible-sourcing commitments',
    transparency: 'Medium',
    redFlags: 'Applegate is the credible line; commodity beef inputs opaque.',
    confidence: 'Verified',
    keySources: 'Hormel; Food Logistics',
  },
  {
    id: 'kraft-heinz-beef',
    company: 'Kraft Heinz',
    hq: 'Chicago/Pittsburgh',
    region: 'US',
    supplyChainRole: 'Processor / brand owner',
    brands: ['Oscar Mayer'],
    parent: 'Kraft Heinz Co. (NASDAQ: KHC)',
    scale: 'Major US processed-meat brand',
    productionSystem: 'Conventional commodity beef',
    certifications: 'Limited',
    documentedIssues: 'Sodium/nitrate & ultra-processed-food scrutiny; commodity sourcing opaque.',
    pledges: 'None beef-specific',
    transparency: 'Low',
    redFlags: 'Processed; no welfare/enviro transparency on beef inputs.',
    confidence: 'Reported',
    keySources: 'Encyclopedia.com',
  },
  {
    id: 'conagra-beef',
    company: 'Conagra Brands',
    hq: 'Chicago, IL',
    region: 'US',
    supplyChainRole: 'Processor / frozen meals',
    brands: ['Banquet', "Marie Callender's", 'Slim Jim'],
    parent: 'Conagra Brands (NYSE: CAG)',
    scale: 'Major frozen/prepared-meal maker',
    productionSystem: 'Conventional commodity beef',
    certifications: 'Limited',
    documentedIssues: 'Commodity sourcing opaque; periodic recalls.',
    pledges: 'None beef-specific',
    transparency: 'Low',
    redFlags: 'Prepared-meal beef inputs untraceable to shopper.',
    confidence: 'Reported',
    keySources: 'Company filings',
  },
  {
    id: 'jack-links',
    company: "Jack Link's",
    hq: 'Minong, WI',
    region: 'US',
    supplyChainRole: 'Processor (jerky/snacks)',
    brands: ["Jack Link's", "Lorissa's Kitchen"],
    parent: 'Private (Link family)',
    scale: 'Largest US meat-snack maker',
    productionSystem: 'Conventional + some grass-fed lines; significant imported beef (Brazil/S. America)',
    certifications: 'Limited',
    documentedIssues: 'Imported-beef sourcing raises deforestation-origin questions.',
    pledges: 'None tracked',
    transparency: 'Low',
    redFlags: 'Jerky industry relies heavily on imported lean beef; origin rarely disclosed.',
    confidence: 'Reported',
    keySources: 'Industry reporting',
  },
];

// ---------------------------------------------------------------------------
// Europe Companies
// ---------------------------------------------------------------------------

export const EU_BEEF_COMPANIES: BeefCompany[] = [
  {
    id: 'abp-food',
    company: 'ABP Food Group',
    hq: 'Ardee, Ireland',
    region: 'EU',
    supplyChainRole: 'Packer / processor (beef & lamb)',
    brands: ['ABP', 'Linden Foods'],
    parent: 'Private \u2014 controlled by Larry Goodman',
    scale: "One of Europe's largest beef processors; major across IE, UK, Poland",
    productionSystem: 'Conventional EU (grass + some finishing)',
    certifications: 'Some RSPCA Assured sourcing lines',
    documentedIssues: 'Linked to the 2013 EU horsemeat scandal (Silvercrest plant). Periodic labor scrutiny.',
    pledges: 'Sustainability/2030 carbon commitments',
    transparency: 'Low-Medium',
    redFlags: 'Dominant, opaque; horsemeat-era reputational legacy. Supplies many UK own-label lines.',
    confidence: 'Verified',
    keySources: 'Irish Times; Wikipedia',
  },
  {
    id: 'dawn-meats',
    company: 'Dawn Meats / Dunbia',
    hq: 'Waterford, Ireland',
    region: 'EU',
    supplyChainRole: 'Packer / processor (beef & lamb)',
    brands: ['Dawn Meats', 'Dunbia'],
    parent: 'Private \u2014 Queally family',
    scale: 'Top-tier UK/IE beef & lamb processor',
    productionSystem: 'Conventional EU grass-based',
    certifications: 'Some RSPCA Assured; sustainability programs',
    documentedIssues: 'Fewer high-profile scandals than peers; standard sector labor scrutiny.',
    pledges: 'Carbon/sustainability roadmap',
    transparency: 'Medium',
    redFlags: 'Generally regarded as more progressive on sustainability among large processors; verify per-line.',
    confidence: 'Verified',
    keySources: 'Farmers Journal; Agriland',
  },
  {
    id: 'tesco-beef',
    company: 'Tesco',
    hq: 'Welwyn GC, UK',
    region: 'EU',
    supplyChainRole: 'Retailer (private label)',
    brands: ['Tesco', 'Tesco Finest', 'Tesco Organic'],
    parent: 'Tesco PLC (LSE: TSCO)',
    scale: "UK's largest grocer",
    productionSystem: '100% British/Irish fresh beef on core lines',
    certifications: 'RSPCA Assured & higher-welfare on selected lines; stunned slaughter',
    documentedIssues: 'Periodic sourcing scrutiny; BBFAW-ranked.',
    pledges: 'Welfare & climate commitments (BBFAW reporter)',
    transparency: 'Medium-High',
    redFlags: 'Among more transparent UK retailers; verify welfare tier per product.',
    confidence: 'Verified',
    keySources: 'RSPCA Assured; Ethical Consumer',
  },
  {
    id: 'sainsburys-beef',
    company: "Sainsbury's",
    hq: 'London, UK',
    region: 'EU',
    supplyChainRole: 'Retailer (private label)',
    brands: ["Sainsbury's", 'Taste the Difference'],
    parent: 'J Sainsbury PLC (LSE: SBRY)',
    scale: '#2 UK grocer',
    productionSystem: 'British fresh beef on core lines',
    certifications: 'All own-brand meat stunned before slaughter; RSPCA Assured lines',
    documentedIssues: 'Standard sector scrutiny.',
    pledges: 'Higher-welfare & climate policies',
    transparency: 'Medium-High',
    redFlags: 'Strong stated welfare policy; verify per line.',
    confidence: 'Verified',
    keySources: 'RSPCA Assured',
  },
  {
    id: 'marks-spencer-beef',
    company: 'Marks & Spencer',
    hq: 'London, UK',
    region: 'EU',
    supplyChainRole: 'Retailer (private label, premium)',
    brands: ['M&S', 'M&S Select Farms'],
    parent: 'Marks & Spencer Group PLC',
    scale: 'Premium UK retailer',
    productionSystem: "British, traceable 'Select Farms' beef",
    certifications: 'Higher-welfare standard; RSPCA Assured elements',
    documentedIssues: 'Few; consistently high BBFAW ranking.',
    pledges: 'Leading welfare & sustainability commitments',
    transparency: 'High',
    redFlags: 'Generally the highest-welfare mainstream UK private label; most transparent.',
    confidence: 'Verified',
    keySources: 'BBFAW; RSPCA Assured',
  },
  {
    id: 'tonnies',
    company: 'T\u00f6nnies Group',
    hq: 'Rheda-Wiedenbr\u00fcck, DE',
    region: 'EU',
    supplyChainRole: 'Packer / processor (pork-led; major beef)',
    brands: ['T\u00f6nnies'],
    parent: 'Private (T\u00f6nnies family)',
    scale: 'Largest German meat processor',
    productionSystem: 'Conventional; industrial scale',
    certifications: 'Limited',
    documentedIssues: "2020: ~1,300+ COVID infections \u2014 exposed severe exploitation of subcontracted Eastern-European workers (cramped housing, sub-minimum pay); prompted German law banning meat-industry labor subcontracting (2021). 2025: Bundeskartellamt PROHIBITED takeover of Vion's German beef ops.",
    pledges: 'Sustainability statements',
    transparency: 'Low',
    redFlags: 'Worst labor record in EU meat; antitrust regulators actively blocking expansion.',
    confidence: 'Verified',
    keySources: 'Washington Post; CNN; Bundeskartellamt',
  },
  {
    id: 'vion',
    company: 'Vion Food Group',
    hq: 'Boxtel, NL',
    region: 'EU',
    supplyChainRole: 'Packer / processor (beef & pork)',
    brands: ['Vion', 'De Groene Weg'],
    parent: "Private \u2014 owned by ZLTO (Dutch farmers' org)",
    scale: 'Major NL/DE processor; refocusing on Benelux',
    productionSystem: 'Conventional EU; organic line (De Groene Weg)',
    certifications: 'De Groene Weg organic; Beter Leven participation (NL)',
    documentedIssues: '2024-26 restructuring: divesting German beef plants. Sector labor & environmental scrutiny.',
    pledges: 'Sustainability roadmap',
    transparency: 'Low-Medium',
    redFlags: 'Strategically shrinking; Benelux focus. Organic sub-brand more credible.',
    confidence: 'Verified',
    keySources: 'Just-Food; Vion; Bundeskartellamt',
  },
  {
    id: 'groupe-bigard',
    company: 'Groupe Bigard',
    hq: 'Quimperl\u00e9, FR',
    region: 'EU',
    supplyChainRole: 'Packer / processor (dominant French)',
    brands: ['Charal', 'Socopa', 'Tendre Plus'],
    parent: 'Private (Bigard family)',
    scale: 'Largest French beef processor (~half of French slaughter); ~30 abattoirs',
    productionSystem: 'Conventional EU (grass + finishing)',
    certifications: 'Label Rouge & other French quality schemes on some lines',
    documentedIssues: 'Market-dominance concerns; environmental scrutiny at large abattoirs.',
    pledges: 'Sustainability statements',
    transparency: 'Low-Medium',
    redFlags: 'Near-monopoly position in France; Charal is the flagship consumer brand. Limited transparency.',
    confidence: 'Verified',
    keySources: 'Groupe Bigard; Wikipedia; Statista',
  },
  {
    id: 'carrefour-beef',
    company: 'Carrefour',
    hq: 'Massy, FR',
    region: 'EU',
    supplyChainRole: 'Retailer (private label)',
    brands: ['Carrefour', 'Carrefour Bio'],
    parent: 'Carrefour SA (EPA: CA)',
    scale: 'Largest French retailer; pan-EU',
    productionSystem: 'Conventional + FQC traceable & organic lines',
    certifications: 'FQC traceability scheme; Label Rouge; organic',
    documentedIssues: 'Sourcing varies by country.',
    pledges: 'Food-transition & welfare commitments',
    transparency: 'Medium',
    redFlags: "FQC ('Quality Lines') offers farm-level traceability on select beef; depth varies by country.",
    confidence: 'Verified',
    keySources: 'Carrefour; brief',
  },
  {
    id: 'albert-heijn-beef',
    company: 'Albert Heijn (Ahold Delhaize)',
    hq: 'Zaandam, NL',
    region: 'EU',
    supplyChainRole: 'Retailer (private label)',
    brands: ['Albert Heijn', 'AH Biologisch'],
    parent: 'Ahold Delhaize (AMS: AD)',
    scale: 'Largest Dutch grocer',
    productionSystem: 'Conventional + Beter Leven star-rated & organic',
    certifications: 'Beter Leven (Better Life) 1-3 star welfare label',
    documentedIssues: 'EU-wide sourcing.',
    pledges: 'Welfare & climate commitments',
    transparency: 'Medium-High',
    redFlags: 'Dutch Beter Leven star system is a useful welfare signal on pack.',
    confidence: 'Verified',
    keySources: 'Industry info; brief',
  },
  {
    id: 'cremonini-inalca',
    company: 'Cremonini / INALCA',
    hq: 'Castelvetro, IT',
    region: 'EU',
    supplyChainRole: 'Packer / processor (dominant Italian)',
    brands: ['Montana', 'Manzotin', 'Fiorani', 'Ibis', 'Inalca'],
    parent: 'Cremonini Group (private; Cremonini family)',
    scale: 'Largest Italian beef producer; exports to 70+ countries',
    productionSystem: 'Conventional; large industrial plant',
    certifications: 'Italian DOP/IGP on some lines',
    documentedIssues: 'Industrial-scale environmental footprint; standard sector scrutiny.',
    pledges: 'Sustainability statements',
    transparency: 'Low-Medium',
    redFlags: 'Dominates Italian processed beef (Montana/Manzotin); also imports/aggregates EU & S. American beef.',
    confidence: 'Verified',
    keySources: 'Cremonini; Inalca',
  },
  {
    id: 'danish-crown-beef',
    company: 'Danish Crown',
    hq: 'Randers, DK',
    region: 'EU',
    supplyChainRole: 'Cooperative packer/processor (pork-led; beef via Danish Crown Beef)',
    brands: ['Danish Crown'],
    parent: 'Farmer cooperative (Denmark)',
    scale: "One of Europe's largest meat companies",
    productionSystem: 'Conventional; climate-labeling programs',
    certifications: 'Some welfare/climate schemes',
    documentedIssues: "2024: Danish court found its 'climate-controlled' marketing MISLEADING (greenwashing) \u2014 landmark EU ruling.",
    pledges: 'Net-zero 2050; emissions-reduction targets (some marketing ruled misleading)',
    transparency: 'Low-Medium',
    redFlags: 'Beef is secondary to pork; notable EU greenwashing precedent on climate claims.',
    confidence: 'Reported',
    keySources: 'EU reporting; brief',
  },
];

// ---------------------------------------------------------------------------
// South America Companies
// ---------------------------------------------------------------------------

export const SA_BEEF_COMPANIES: BeefCompany[] = [
  {
    id: 'jbs-sa',
    company: 'JBS S.A. / JBS N.V.',
    hq: 'S\u00e3o Paulo, BR / NL',
    region: 'SA',
    supplyChainRole: "Parent of JBS USA; world's largest meatpacker",
    brands: ['Friboi', 'Swift', 'Seara'],
    parent: 'JBS N.V. (NYSE: JBS); Batista family',
    scale: "World's #1 meat company by revenue",
    productionSystem: 'Conventional; vast Brazilian + global supply',
    certifications: 'Limited',
    documentedIssues: 'Repeatedly caught buying cattle from Amazon/Cerrado/Pantanal farms with deforestation & fire alerts. ~62% of 67,542 ha land-clearing tied to JBS/Marfrig/Minerva suppliers 2023-25. 2017 corruption scandal.',
    pledges: 'Deforestation-free direct AND indirect suppliers by 2025/2026 (monitors say off-track)',
    transparency: 'Low',
    redFlags: 'Single most-scrutinized beef company globally for deforestation. NYSE listing (2025) drew NGO opposition.',
    confidence: 'Verified',
    keySources: 'Mighty Earth; Greenpeace; Mongabay',
  },
  {
    id: 'mbrf',
    company: 'MBRF Global Foods (Marfrig + BRF)',
    hq: 'S\u00e3o Paulo, BR',
    region: 'SA',
    supplyChainRole: 'Parent of National Beef (80%); major Brazilian beef',
    brands: ['Marfrig', 'Bassi', 'Montana'],
    parent: 'MBRF Global Foods Co. S.A.; Molina family-led',
    scale: '~$26.75B annual sales; rival to JBS',
    productionSystem: 'Conventional; Brazil + US (National Beef)',
    certifications: 'Limited',
    documentedIssues: 'Amazon deforestation exposure (named alongside JBS). Merger created a vertically integrated beef/poultry/pork giant.',
    pledges: 'Deforestation-monitoring commitments (contested)',
    transparency: 'Low',
    redFlags: 'Newly merged; controls #4 US packer. Brazilian-ownership scrutiny under US politics (2025-26).',
    confidence: 'Verified',
    keySources: 'Yahoo Finance; CADE; Mighty Earth',
  },
  {
    id: 'minerva',
    company: 'Minerva Foods',
    hq: 'Barretos, BR',
    region: 'SA',
    supplyChainRole: 'Major South American beef exporter',
    brands: ['Minerva'],
    parent: 'Minerva S.A. (B3-listed); Vilela de Queiroz family + Salic (Saudi) stake',
    scale: 'Leading beef exporter in South America (BR, AR, UY, PY, CO)',
    productionSystem: 'Conventional; pasture-based S. American',
    certifications: 'Limited',
    documentedIssues: 'Named with JBS/Marfrig in supplier deforestation analysis; expanded via 2023-24 acquisition of Marfrig S. American plants.',
    pledges: 'Deforestation-monitoring commitments',
    transparency: 'Low',
    redFlags: 'Often invisible to shoppers but underlies much exported/processed beef; deforestation risk.',
    confidence: 'Reported',
    keySources: 'Mighty Earth; trade reporting',
  },
];

// ---------------------------------------------------------------------------
// All beef companies
// ---------------------------------------------------------------------------

export const ALL_BEEF_COMPANIES: BeefCompany[] = [
  ...US_BEEF_COMPANIES,
  ...EU_BEEF_COMPANIES,
  ...SA_BEEF_COMPANIES,
];

// ---------------------------------------------------------------------------
// Label & Certification Decoder — beef specific
// ---------------------------------------------------------------------------

export type BeefLabelCredibility = 'Meaningful' | 'Moderate' | 'Marketing';

export interface BeefLabelEntry {
  label: string;
  legalUS: string;
  legalEU: string;
  shopperAssumption: string;
  realGap: string;
  howToVerify: string;
  greenwashingFlag: string;
  credibility: BeefLabelCredibility;
}

export const BEEF_LABEL_DECODER: BeefLabelEntry[] = [
  {
    label: 'Grass-fed',
    legalUS: 'USDA: fed only grass/forage \u2014 but NO rule on duration; CAN be grain-finished at the end',
    legalEU: 'Varies by country; some require 100% grass, others allow finishing',
    shopperAssumption: 'Cow ate grass its whole life; no feedlot',
    realGap: 'Often grass-fed for ~2 yrs then GRAIN-FINISHED ~90-180 days. Technically legal, highly misleading.',
    howToVerify: "Demand 'grass-FINISHED'; check brand transparency & feed records",
    greenwashingFlag: "'Grass-fed' WITHOUT 'grass-finished' = likely feedlot-finished",
    credibility: 'Moderate',
  },
  {
    label: 'Grass-finished',
    legalUS: 'USDA: no legal definition',
    legalEU: 'No legal definition',
    shopperAssumption: 'Cow ate grass until slaughter',
    realGap: "More credible than 'grass-fed' alone, but says nothing about density, antibiotics or land",
    howToVerify: "AWA, Certified Humane grass-fed std, 'Lifetime Grazed'",
    greenwashingFlag: 'Unaudited claim = greenwashing',
    credibility: 'Moderate',
  },
  {
    label: 'Pasture-raised',
    legalUS: 'USDA: no legal definition; varies by certifier',
    legalEU: 'Varies by country/certifier',
    shopperAssumption: 'Most of life on diverse pasture',
    realGap: 'Ranges from genuine rotational grazing to sparse/degraded land + grain supplement',
    howToVerify: 'Certified Humane, AWA, RSPCA Assured, GAP; demand farm + audit',
    greenwashingFlag: 'Company claim with no audit',
    credibility: 'Moderate',
  },
  {
    label: 'Regenerative',
    legalUS: 'No legal definition anywhere (most-gamed label)',
    legalEU: 'No legal definition',
    shopperAssumption: 'Restores soil, sequesters carbon',
    realGap: 'Wildly variable; no baseline. Can mask conventional grazing.',
    howToVerify: 'Regenerative Organic Certified, Land to Market, Regenified; demand soil/carbon data',
    greenwashingFlag: "Unaudited 'regenerative' = almost certainly greenwashing",
    credibility: 'Marketing',
  },
  {
    label: 'Certified Humane',
    legalUS: '3rd-party audit: pasture access, density, (mostly) no antibiotics',
    legalEU: 'RSPCA Assured (UK) comparable/stronger',
    shopperAssumption: 'High welfare',
    realGap: 'Verified, strong; some therapeutic antibiotics allowed',
    howToVerify: 'humanecertified.org/search; check farm & audit date',
    greenwashingFlag: 'Weaker than AWA/RSPCA on a few metrics',
    credibility: 'Meaningful',
  },
  {
    label: 'Animal Welfare Approved (AWA)',
    legalUS: 'Stringent: pasture-based, low density, slow-growth, high transparency',
    legalEU: 'RSPCA Assured comparable',
    shopperAssumption: 'High welfare, pasture-based',
    realGap: 'Strong audited standard; limited availability',
    howToVerify: 'animalwelfareapproved.org',
    greenwashingFlag: 'Limited supply; smaller producer base',
    credibility: 'Meaningful',
  },
  {
    label: 'USDA / EU Organic',
    legalUS: 'Organic feed, no synthetic hormones, no routine antibiotics',
    legalEU: 'Similar; EU often stricter',
    shopperAssumption: 'Natural, humane, sustainable',
    realGap: 'Organic \u2260 welfare or low-carbon. Density/outdoor access not specified.',
    howToVerify: 'Organic cert covers FEED; demand SEPARATE welfare/enviro audit',
    greenwashingFlag: 'Conflated with welfare \u2014 they are different things',
    credibility: 'Moderate',
  },
  {
    label: 'Carbon-neutral',
    legalUS: 'No legal definition; company-defined',
    legalEU: 'No legal definition',
    shopperAssumption: 'Zero net carbon',
    realGap: 'Often questionable offsets; may ignore feedlot emissions',
    howToVerify: 'Demand full LCA (farm-gate to retail), 3rd-party verification, offset methodology',
    greenwashingFlag: 'Claim without published LCA = greenwashing',
    credibility: 'Marketing',
  },
  {
    label: "'Natural'",
    legalUS: 'USDA: minimal processing \u2014 NOT a welfare claim',
    legalEU: 'Similar',
    shopperAssumption: 'Humane, wholesome',
    realGap: 'Meaningless for welfare/environment',
    howToVerify: 'Look for a SEPARATE welfare certification',
    greenwashingFlag: 'Almost always greenwashing when used to imply welfare',
    credibility: 'Marketing',
  },
  {
    label: 'No hormones / no added hormones',
    legalUS: 'US: synthetic hormones ARE routine in conventional US beef',
    legalEU: 'Hormones BANNED in EU beef',
    shopperAssumption: 'No synthetic hormones',
    realGap: 'True & meaningful in US; meaningless (baseline) in EU',
    howToVerify: 'US: demand 3rd-party verification; EU: assume baseline',
    greenwashingFlag: 'US claim without verification = weak; EU claim is marketing of the baseline',
    credibility: 'Moderate',
  },
  {
    label: 'Certified Angus Beef',
    legalUS: 'Breed/quality (marbling) spec, not welfare/enviro',
    legalEU: 'n/a',
    shopperAssumption: 'Premium = ethical',
    realGap: 'A QUALITY standard only \u2014 no welfare or environmental meaning',
    howToVerify: 'Treat as eating-quality info, not ethics',
    greenwashingFlag: 'Misread as an ethics claim',
    credibility: 'Marketing',
  },
  {
    label: "Local / 'from [region]'",
    legalUS: 'No legal definition',
    legalEU: 'No legal definition',
    shopperAssumption: 'Raised nearby, higher welfare, fresher',
    realGap: 'Can be conventional regional beef, relabeled, or imported & repackaged',
    howToVerify: 'Demand farm name + production system + audit',
    greenwashingFlag: 'Vague geography with no farm name = greenwashing',
    credibility: 'Marketing',
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

const GENERIC_TOKENS = new Set([
  'own-label', 'own', 'label', 'store', 'retailer', 'premium', 'multiple',
  'co', 'co.', 'inc', 'inc.', 'the', 'and', 'for', 'farms', 'foods', 'group',
  'brand', 'brands', 'beef', 'meat', 'meats',
]);

/** Strip diacritics so accented brand names match plain-ASCII queries. */
const strip = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function tokenMatch(token: string, query: string): boolean {
  const t = strip(token);
  if (t.length < 4 || GENERIC_TOKENS.has(t)) return false;
  return query.includes(t);
}

/**
 * Find the beef company record for a brand string, if any.
 * Matches against on-pack brand names first, then company / parent.
 */
export function getBeefCompanyByBrand(
  brand: string | null | undefined,
): BeefCompany | undefined {
  if (!brand) return undefined;
  const query = strip(brand);
  if (!query) return undefined;

  // Pass 1: on-pack brand names (most specific).
  for (const record of ALL_BEEF_COMPANIES) {
    for (const b of record.brands) {
      if (strip(b) === query) return record;
      if (b.split(/[/;,]/).some((part) => tokenMatch(part, query))) return record;
    }
  }

  // Pass 2: company name.
  for (const record of ALL_BEEF_COMPANIES) {
    if (tokenMatch(record.company, query)) return record;
    if (tokenMatch(record.parent, query)) return record;
  }

  return undefined;
}

export function hasBeefRecord(brand: string | null | undefined): boolean {
  return !!getBeefCompanyByBrand(brand);
}

/**
 * Map beef transparency level to the app's good/warn/bad tone.
 *  High/Very High = good, Medium/Medium-High = warn, Low/Low-Medium = bad.
 */
export function beefTransparencyTone(t: BeefTransparency): 'good' | 'warn' | 'bad' {
  if (t === 'High' || t === 'Very High') return 'good';
  if (t === 'Medium' || t === 'Medium-High') return 'warn';
  return 'bad';
}

/**
 * Map beef confidence to the app's good/warn/bad tone.
 *  Verified = good, Reported = warn, Mixed = bad.
 */
export function beefConfidenceTone(c: BeefConfidence): 'good' | 'warn' | 'bad' {
  if (c === 'Verified') return 'good';
  if (c === 'Reported') return 'warn';
  return 'bad';
}
