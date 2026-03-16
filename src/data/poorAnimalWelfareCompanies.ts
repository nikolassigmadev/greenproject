/**
 * Companies with Poor Animal Welfare Records
 * Based on BBFAW 2024/2025 Report, World Animal Protection, and Humane Society data
 *
 * Sources:
 * - BBFAW 2024/2025 Report: https://www.bbfaw.com/benchmark/
 * - World Animal Protection: https://www.worldanimalprotection.org/
 * - Humane Society Food Industry Scorecard: https://www.humanesociety.org/blog/food-companies-efforts-save-animals-rated
 * - PETA Animal Testing Database: https://crueltyfree.peta.org/companies-do-test/
 */

export interface PoorAnimalWelfareCompany {
  id: string;
  companyName: string;
  brands: string[];
  bbfawTier: string;
  bbfawScore: string;
  concerns: string[];
  severity: 'critical' | 'high' | 'moderate';
  sources: string[];
}

export const POOR_ANIMAL_WELFARE_COMPANIES: PoorAnimalWelfareCompany[] = [
  {
    id: 'nestle',
    companyName: 'Nestlé S.A.',
    brands: ['Purina', 'KitKat', 'Aero', 'Haagen-Dazs', 'Perrier', 'Vittel', 'Nescafé', 'Baci Perugina', 'Milkybar', 'Smarties'],
    bbfawTier: '5-6',
    bbfawScore: 'Below 26%',
    concerns: [
      'Farm animal welfare policies inadequate',
      'Animal testing with limited disclosure',
    ],
    severity: 'critical',
    sources: [
      'BBFAW 2024/2025 Report',
      'World Animal Protection',
      'Humane Society Food Industry Scorecard',
    ],
  },
  {
    id: 'mars',
    companyName: 'Mars, Inc.',
    brands: ['Mars', 'Pedigree', 'Whiskas', 'Royal Canin', 'Cesar', 'Iams', "M&M's", 'Snickers', "Ben's Original", 'Dolmio', 'Dove', 'Extra'],
    bbfawTier: '6 (Worst)',
    bbfawScore: 'Below 11%',
    concerns: [
      'Little evidence of farm animal welfare recognition',
      'No meaningful farm animal welfare policies',
    ],
    severity: 'critical',
    sources: [
      'BBFAW 2024/2025 Report',
      'World Animal Protection',
    ],
  },
  {
    id: 'mcdonalds',
    companyName: "McDonald's Corporation",
    brands: ["McDonald's"],
    bbfawTier: '5-6',
    bbfawScore: '11-26%',
    concerns: [
      'Bottom two tiers for second consecutive year',
      'Limited evidence of farm animal welfare management',
      'Poor chicken welfare practices despite some commitments',
    ],
    severity: 'critical',
    sources: [
      'BBFAW 2024/2025 Report',
      'World Animal Protection',
    ],
  },
  {
    id: 'tyson',
    companyName: 'Tyson Foods, Inc.',
    brands: ['Tyson', 'Jimmy Dean', 'Hillshire Farm', 'Ball Park'],
    bbfawTier: '5-6',
    bbfawScore: 'Below 26%',
    concerns: [
      'No adoption of leading animal welfare policies',
      'No ban on gestation crates for pigs',
      'No abolition of battery cages for hens',
      'No slower-growing broiler policy',
      'Documented abuse: worker violence against chickens',
      'Deformed birds, untreated injuries, crippling leg deformities',
      'Unsanitary conditions with toxic ammonia fumes',
      'Misuse of free-range labels',
      'Criminal cruelty charges in multiple cases',
    ],
    severity: 'critical',
    sources: [
      'BBFAW 2024/2025 Report',
      'Animal Outlook investigations',
      'Humane Society investigations',
      'World Animal Protection',
    ],
  },
  {
    id: 'yum_brands',
    companyName: 'Yum! Brands, Inc.',
    brands: ['KFC', 'Pizza Hut', 'Taco Bell'],
    bbfawTier: '5',
    bbfawScore: '11-26%',
    concerns: [
      'Limited evidence of implementation despite public animal welfare plans',
      'Bottom two tiers for second consecutive year',
      'Poor chicken welfare standards',
    ],
    severity: 'critical',
    sources: [
      'BBFAW 2024/2025 Report',
      'World Animal Protection',
    ],
  },
  {
    id: 'cargill',
    companyName: 'Cargill Inc.',
    brands: ['Cargill Meat Solutions'],
    bbfawTier: '5-6',
    bbfawScore: 'Below 26%',
    concerns: [
      'Reckless use of critical antibiotics designated vital for human health by WHO',
      'Documented use of 12 different antibiotics including important human medicines',
      "Named 'worst company in the world' by Mighty Earth (2019) for damaging ecosystems",
      'Child labor allegations',
      'Top 10 US food industry polluter',
    ],
    severity: 'critical',
    sources: [
      'BBFAW 2024/2025 Report',
      'Sentient Media',
      'Mighty Earth',
    ],
  },
  {
    id: 'e_leclerc',
    companyName: 'E.Leclerc',
    brands: ['E.Leclerc supermarket chain'],
    bbfawTier: '6 (Worst)',
    bbfawScore: 'Below 11%',
    concerns: [
      'Bottom of BBFAW rankings',
      'One of Europe\'s biggest supermarket chains with little regard for animal welfare',
      'No evidence of recognizing farm animal welfare as business issue',
    ],
    severity: 'critical',
    sources: [
      'BBFAW 2024/2025 Report',
      'World Animal Protection',
    ],
  },
  {
    id: 'starbucks',
    companyName: 'Starbucks Corporation',
    brands: ['Starbucks'],
    bbfawTier: '5',
    bbfawScore: '11-26%',
    concerns: [
      'Failed to follow through on cage-free egg commitment',
      'Cage-free promise altered to apply only to company-owned stores (40%)',
      'Licensed franchises (40%) exempt from cage-free requirement',
      'Poor chicken welfare practices in supply chain',
    ],
    severity: 'high',
    sources: [
      'BBFAW 2024/2025 Report',
      'World Animal Protection',
      'Humane Society Food Industry Scorecard',
    ],
  },
  {
    id: 'burger_king',
    companyName: 'Burger King',
    brands: ['Burger King'],
    bbfawTier: '4-5',
    bbfawScore: '26-50%',
    concerns: [
      'Limited farm animal welfare management',
      'Poor chicken welfare in supply chain',
      'Minimal commitment to addressing cruel farming practices',
    ],
    severity: 'high',
    sources: [
      'World Animal Protection',
      'Humane Society Food Industry Scorecard',
    ],
  },
  {
    id: 'subway',
    companyName: 'Subway',
    brands: ['Subway'],
    bbfawTier: '5',
    bbfawScore: '11-26%',
    concerns: [
      'No meaningful progress over 8+ years',
      'Failed to adopt meaningful pig or chicken welfare commitments',
      'Poor ranking across all animal welfare issues assessed',
    ],
    severity: 'high',
    sources: [
      'World Animal Protection',
      'Humane Society Food Industry Scorecard',
      'BBFAW 2024/2025 Report',
    ],
  },
  {
    id: 'walmart',
    companyName: 'Walmart Inc.',
    brands: ['Walmart', 'Whole Foods'],
    bbfawTier: '4',
    bbfawScore: '26-50%',
    concerns: [
      'Limited farm animal welfare management evidence',
      'Lack of consistency in addressing animal welfare across markets',
      'No global position to address cruelest farming practices',
      'No elimination of cage confinement, painful mutilations, inhumane slaughter',
      'No supply chain transparency',
      'Ranked F despite owning Whole Foods',
    ],
    severity: 'high',
    sources: [
      'BBFAW 2024/2025 Report',
      'World Animal Protection',
      'Humane Society Food Industry Scorecard',
    ],
  },
  {
    id: 'mondelez',
    companyName: 'Mondelēz International',
    brands: ['Oreo', 'Cadbury', 'Trident', 'Halls', 'Milka', 'Toblerone', 'Sour Patch', 'belVita'],
    bbfawTier: '5',
    bbfawScore: '11-26%',
    concerns: [
      'Failed to demonstrate implementation of public animal welfare plans',
      'History of funding non-required animal testing',
      'Force-fed obese women\'s feces to mice in studies',
      'Fed rats chips, crackers, and candies then killed and dissected',
      'Recent agreement to stop nutritional science tests on animals after shareholder pressure',
      'Inadequate farm animal welfare policies',
    ],
    severity: 'critical',
    sources: [
      'BBFAW 2024/2025 Report',
      'PETA',
      'World Animal Protection',
    ],
  },
  {
    id: 'general_mills',
    companyName: 'General Mills, Inc.',
    brands: ['Cheerios', 'Betty Crocker', 'Pillsbury', 'Nature Valley', 'Yoplait'],
    bbfawTier: '5',
    bbfawScore: '11-26%',
    concerns: [
      'Public animal welfare plans but failed to demonstrate implementation',
      'Declined from Tier 4 to Tier 5 in recent assessments',
      'Gap between commitments and actual performance',
    ],
    severity: 'high',
    sources: [
      'BBFAW 2024/2025 Report',
      'Compassion in World Farming',
    ],
  },
  {
    id: 'kraft_heinz',
    companyName: 'Kraft Heinz Company',
    brands: ['Oscar Mayer', 'Heinz', 'Kraft', 'Philadelphia Cream Cheese', 'Gevalia', 'Boca Burger', 'Grey Poupon', 'Primal Kitchen'],
    bbfawTier: '4-5',
    bbfawScore: '11-50%',
    concerns: [
      'Limited farm animal welfare policy implementation',
      'While claims 70% cage-free/free-range chickens, overall welfare practices lag',
    ],
    severity: 'moderate',
    sources: [
      'BBFAW reports',
      'Food Dive',
    ],
  },
  {
    id: 'chick_fil_a',
    companyName: 'Chick-fil-A',
    brands: ['Chick-fil-A'],
    bbfawTier: '5-6',
    bbfawScore: 'Below 26%',
    concerns: [
      'Bottom rankings across all animal welfare issues assessed',
      'Failed to adopt meaningful chicken welfare commitments',
      'Backtracked on no-antibiotics pledge for chicken',
      'Restricted cage-free implementation to own facilities only',
    ],
    severity: 'critical',
    sources: [
      'World Animal Protection',
      'The Humane League',
      'ABC News',
    ],
  },
  {
    id: 'dunkin',
    companyName: "Dunkin'",
    brands: ["Dunkin' Donuts"],
    bbfawTier: '5-6',
    bbfawScore: 'Below 26%',
    concerns: [
      'Failed to make animal welfare improvements',
      'Walked back chicken welfare policies from public materials',
      'Lack of transparency on cage-free transition progress',
      'Bottom rankings for animal welfare commitments',
    ],
    severity: 'high',
    sources: [
      'World Animal Protection',
      'The Humane League',
    ],
  },
  {
    id: 'dominos',
    companyName: "Domino's Pizza",
    brands: ["Domino's"],
    bbfawTier: '5-6',
    bbfawScore: 'Below 26%',
    concerns: [
      'Failing to invest in humane and sustainable food systems',
      'Limited animal welfare commitments',
    ],
    severity: 'moderate',
    sources: [
      'World Animal Protection',
      'Moving the Menu 2024 Scorecard',
    ],
  },
  {
    id: 'papa_johns',
    companyName: "Papa John's",
    brands: ["Papa John's"],
    bbfawTier: '5-6',
    bbfawScore: 'Below 26%',
    concerns: [
      'Inadequate commitment to farm animal welfare',
      'Poor animal welfare in supply chain',
    ],
    severity: 'moderate',
    sources: [
      'World Animal Protection',
    ],
  },
];

/**
 * Get company by name or brand
 * @param name - Company name or brand to search for (case-insensitive)
 * @returns Company object if found, undefined otherwise
 */
export function getPoorAnimalWelfareCompany(name: string): PoorAnimalWelfareCompany | undefined {
  const lowerName = name.toLowerCase().trim();
  return POOR_ANIMAL_WELFARE_COMPANIES.find(
    (company) =>
      company.companyName.toLowerCase() === lowerName ||
      company.brands.some((brand) => brand.toLowerCase() === lowerName),
  );
}

/**
 * Check if a brand has poor animal welfare record
 * @param brand - Brand name to check
 * @returns true if brand is in poor animal welfare list
 */
export function hasPoorAnimalWelfareRecord(brand: string): boolean {
  return !!getPoorAnimalWelfareCompany(brand);
}

/**
 * Get all brands from poor animal welfare companies
 * @returns Set of all brand names
 */
export function getAllPoorAnimalWelfareBrands(): Set<string> {
  const brands = new Set<string>();
  POOR_ANIMAL_WELFARE_COMPANIES.forEach((company) => {
    company.brands.forEach((brand) => brands.add(brand.toLowerCase()));
  });
  return brands;
}
