// GoodScan — Ingredient-level concerns.
//
// Each entry models a specific concern about a specific ingredient pattern.
// These flags trigger by matching patterns in OpenFoodFacts ingredients text,
// so they catch products even when the brand itself is not yet in our database.
//
// Sourcing standard: prefer Tier 1 (government, intergovernmental) and Tier 2
// (established NGOs, academic). Tier 3 reserved for credible journalism.

export type IngredientCategory =
  | 'forced_labour'
  | 'child_labour'
  | 'environmental_harm'
  | 'deforestation'
  | 'biodiversity_loss'
  | 'water_stress'
  | 'unsafe_conditions';

export type IngredientSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface IngredientSource {
  url: string;
  title: string;
  publisher: string;
  tier: 'tier1' | 'tier2' | 'tier3';
  publishedDate: string; // ISO 8601
}

export interface IngredientFlag {
  id: string;
  ingredientPatterns: string[];
  displayName: string;
  category: IngredientCategory;
  severity: IngredientSeverity;
  summary: string;
  details: string;
  whatToLookFor: string;
  sources: IngredientSource[];
  lastVerified: string;
}

export const INGREDIENT_FLAGS: IngredientFlag[] = [
  {
    id: 'palm-oil-deforestation-indonesia',
    ingredientPatterns: [
      'palm oil',
      'palm kernel',
      'palmitate',
      'palm fat',
      'palm fruit',
      'elaeis guineensis',
      'huile de palme',
    ],
    displayName: 'Palm oil',
    category: 'deforestation',
    severity: 'high',
    summary:
      'Industrial palm oil expansion in Indonesia and Malaysia is a leading driver of tropical deforestation and habitat loss for orangutans, tigers and elephants.',
    details:
      'Roughly 85% of global palm oil is produced in Indonesia and Malaysia, where plantations have replaced millions of hectares of rainforest and peatland. Peatland conversion releases enormous stores of carbon, and habitat fragmentation threatens orangutan and Sumatran tiger populations. Labour abuses, including child labour, have also been documented on several major plantations.',
    whatToLookFor:
      'Look for RSPO Certified Sustainable Palm Oil (segregated or identity-preserved), Rainforest Alliance, or "palm oil free" claims.',
    sources: [
      {
        url: 'https://www.worldwildlife.org/industries/palm-oil',
        title: 'Palm Oil: Overview',
        publisher: 'WWF',
        tier: 'tier2',
        publishedDate: '2024-01-15',
      },
      {
        url: 'https://www.unep.org/news-and-stories/story/our-global-food-system-primary-driver-biodiversity-loss',
        title: 'Food system is the primary driver of biodiversity loss',
        publisher: 'UN Environment Programme',
        tier: 'tier1',
        publishedDate: '2021-02-03',
      },
      {
        url: 'https://www.amnesty.org/en/latest/news/2016/11/palm-oil-global-brands-profiting-from-child-and-forced-labour/',
        title: 'Palm oil: global brands profiting from child and forced labour',
        publisher: 'Amnesty International',
        tier: 'tier2',
        publishedDate: '2016-11-30',
      },
    ],
    lastVerified: '2026-06-09',
  },
  {
    id: 'cocoa-child-labour-west-africa',
    ingredientPatterns: [
      'cocoa',
      'cacao',
      'chocolate liquor',
      'cocoa butter',
      'cocoa mass',
      'cocoa powder',
      'cocoa solids',
      'cacao butter',
    ],
    displayName: 'Cocoa',
    category: 'child_labour',
    severity: 'critical',
    summary:
      'Roughly 1.56 million children are engaged in child labour on cocoa farms in Côte d\'Ivoire and Ghana, the source of about 60% of the world\'s cocoa.',
    details:
      'A 2020 NORC report commissioned by the US Department of Labor found that 1.56 million children work on cocoa farms in Côte d\'Ivoire and Ghana, with about 1.48 million exposed to hazardous work. Despite two decades of industry commitments (Harkin-Engel Protocol, 2001), the problem persists due to farmer poverty and weak enforcement.',
    whatToLookFor:
      'Look for Fairtrade, Rainforest Alliance, or Tony\'s Open Chain. Single-origin chocolates from Latin America also reduce exposure to West African supply chains.',
    sources: [
      {
        url: 'https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods',
        title: 'List of Goods Produced by Child Labor or Forced Labor',
        publisher: 'US Department of Labor (ILAB)',
        tier: 'tier1',
        publishedDate: '2024-09-05',
      },
      {
        url: 'https://www.norc.org/research/projects/assessing-progress-cocoa-production-areas-of-cote-d-ivoire-ghana.html',
        title: 'Assessing Progress in Reducing Child Labor in Cocoa Production',
        publisher: 'NORC at the University of Chicago',
        tier: 'tier2',
        publishedDate: '2020-10-19',
      },
      {
        url: 'https://www.cocoainitiative.org/knowledge-hub',
        title: 'Cocoa Initiative — Knowledge Hub',
        publisher: 'International Cocoa Initiative',
        tier: 'tier2',
        publishedDate: '2023-06-01',
      },
    ],
    lastVerified: '2026-06-09',
  },
  {
    id: 'cane-sugar-labour-brazil-dominican',
    ingredientPatterns: [
      'cane sugar',
      'sugarcane',
      'sugar cane',
      'raw sugar',
      'turbinado',
      'demerara',
      'molasses',
    ],
    displayName: 'Cane sugar',
    category: 'forced_labour',
    severity: 'high',
    summary:
      'Sugarcane appears on the US DOL forced and child labour list for multiple countries, with documented cases in Brazil, the Dominican Republic and the Philippines.',
    details:
      'Investigations have repeatedly found debt bondage, dangerous working conditions and unpaid wages on sugarcane plantations, particularly affecting Haitian migrant workers in the Dominican Republic. The US Customs and Border Protection issued a Withhold Release Order against Central Romana sugar in 2022 over forced labour indicators.',
    whatToLookFor:
      'Look for Fairtrade, Bonsucro Mass Balance, or organic cane sugar from cooperatives. Beet sugar is an alternative not flagged for these specific concerns.',
    sources: [
      {
        url: 'https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods',
        title: 'List of Goods Produced by Child Labor or Forced Labor — Sugarcane',
        publisher: 'US Department of Labor (ILAB)',
        tier: 'tier1',
        publishedDate: '2024-09-05',
      },
      {
        url: 'https://www.cbp.gov/newsroom/national-media-release/cbp-issues-withhold-release-order-raw-sugar-and-sugar-based-products',
        title: 'CBP Withhold Release Order on Central Romana sugar',
        publisher: 'US Customs and Border Protection',
        tier: 'tier1',
        publishedDate: '2022-11-23',
      },
      {
        url: 'https://www.verite.org/project/sugar/',
        title: 'Sugar — Commodity Research',
        publisher: 'Verité',
        tier: 'tier2',
        publishedDate: '2023-03-01',
      },
    ],
    lastVerified: '2026-06-09',
  },
  {
    id: 'coffee-labour-conditions',
    ingredientPatterns: [
      'coffee',
      'coffee bean',
      'coffea',
      'ground coffee',
      'instant coffee',
      'coffee extract',
    ],
    displayName: 'Coffee',
    category: 'child_labour',
    severity: 'high',
    summary:
      'Coffee appears on the US DOL child labour list for at least 17 countries, with concentrated risk in Côte d\'Ivoire, Guatemala, Honduras and Brazil.',
    details:
      'Smallholder coffee farmers earn well below a living income, which drives reliance on family and child labour during harvest. Brazilian operations have also been raided for conditions analogous to slave labour. Climate volatility is intensifying the pressure on supply chains.',
    whatToLookFor:
      'Look for Fairtrade, Rainforest Alliance, Smithsonian Bird Friendly, or direct-trade roasters publishing farmgate prices.',
    sources: [
      {
        url: 'https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods',
        title: 'List of Goods Produced by Child Labor or Forced Labor — Coffee',
        publisher: 'US Department of Labor (ILAB)',
        tier: 'tier1',
        publishedDate: '2024-09-05',
      },
      {
        url: 'https://www.danwatch.dk/en/undersogelse/bitter-coffee/',
        title: 'Bitter Coffee — slavery-like conditions in Brazilian coffee',
        publisher: 'Danwatch',
        tier: 'tier3',
        publishedDate: '2016-03-01',
      },
      {
        url: 'https://www.fairtrade.net/issue/coffee',
        title: 'Coffee — Issue Briefing',
        publisher: 'Fairtrade International',
        tier: 'tier2',
        publishedDate: '2023-10-01',
      },
    ],
    lastVerified: '2026-06-09',
  },
  {
    id: 'hazelnuts-child-labour-turkey',
    ingredientPatterns: [
      'hazelnut',
      'hazelnuts',
      'corylus avellana',
      'hazelnut paste',
      'hazelnut oil',
    ],
    displayName: 'Hazelnuts',
    category: 'child_labour',
    severity: 'high',
    summary:
      'Turkey produces around 70% of the world\'s hazelnuts, with documented use of seasonal migrant and child labour during the August harvest.',
    details:
      'Most hazelnuts are bought by a small number of confectionery majors (Ferrero alone buys roughly a quarter of the global crop). Seasonal Kurdish and Syrian refugee labourers — including children as young as ten — work long hours in steep terrain for piece-rate wages well below Turkey\'s minimum wage.',
    whatToLookFor:
      'Brands publishing supply-chain traceability and participating in the Fair Labor Association\'s Harvesting the Future programme provide more accountability.',
    sources: [
      {
        url: 'https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods',
        title: 'List of Goods Produced by Child Labor or Forced Labor — Hazelnuts',
        publisher: 'US Department of Labor (ILAB)',
        tier: 'tier1',
        publishedDate: '2024-09-05',
      },
      {
        url: 'https://www.fairlabor.org/projects/harvesting-the-future-turkish-hazelnuts/',
        title: 'Harvesting the Future: Turkish Hazelnuts',
        publisher: 'Fair Labor Association',
        tier: 'tier2',
        publishedDate: '2022-09-01',
      },
    ],
    lastVerified: '2026-06-09',
  },
  {
    id: 'vanilla-labour-theft-madagascar',
    ingredientPatterns: [
      'vanilla',
      'vanilla extract',
      'vanilla bean',
      'vanilla pod',
      'vanilla planifolia',
    ],
    displayName: 'Vanilla',
    category: 'unsafe_conditions',
    severity: 'medium',
    summary:
      'Madagascar produces about 80% of the world\'s vanilla. Price volatility has driven child labour, armed vigilante killings, and forced pre-harvesting of green pods.',
    details:
      'When vanilla prices spiked above $600/kg, theft from smallholder farms became rampant, leading to vigilante violence and the practice of harvesting pods early to deter thieves — which damages quality and incomes. Children work alongside parents to guard and process pods during the harvest.',
    whatToLookFor:
      'Look for Fairtrade or single-origin direct-trade vanilla. Synthetic vanillin (labelled as "vanillin" or "artificial flavour") does not carry these risks.',
    sources: [
      {
        url: 'https://www.verite.org/wp-content/uploads/2016/11/Research-on-Indicators-of-Forced-Labor-in-the-Madagascar-Vanilla-Sector__9.16.pdf',
        title: 'Research on Indicators of Forced Labor in Madagascar Vanilla',
        publisher: 'Verité',
        tier: 'tier2',
        publishedDate: '2016-09-15',
      },
      {
        url: 'https://www.oecd.org/corporate/mne/Guidance-on-RBC-in-the-Agriculture-Sector.htm',
        title: 'OECD-FAO Guidance for Responsible Agricultural Supply Chains',
        publisher: 'OECD',
        tier: 'tier1',
        publishedDate: '2016-05-25',
      },
    ],
    lastVerified: '2026-06-09',
  },
  {
    id: 'tea-labour-assam-sri-lanka',
    ingredientPatterns: [
      'tea',
      'black tea',
      'green tea',
      'tea extract',
      'tea leaves',
      'camellia sinensis',
    ],
    displayName: 'Tea',
    category: 'unsafe_conditions',
    severity: 'medium',
    summary:
      'Tea plantation workers in Assam and Sri Lanka frequently earn below the local poverty line, with substandard housing, sanitation and pesticide exposure documented for decades.',
    details:
      'Oxfam and BBC investigations have found that workers on tea estates supplying major UK brands receive wages well below India\'s national minimum, often paid partly in inadequate rations and housing. Women, who make up the majority of pluckers, face the worst conditions.',
    whatToLookFor:
      'Fairtrade and Rainforest Alliance certifications raise the floor, though they are not a guarantee. Brands disclosing estate-level wage data are stronger.',
    sources: [
      {
        url: 'https://www.bbc.co.uk/news/world-asia-india-34173532',
        title: 'The bitter story behind the UK\'s national drink',
        publisher: 'BBC News',
        tier: 'tier3',
        publishedDate: '2015-09-08',
      },
      {
        url: 'https://www.oxfam.org/en/research/addressing-power-imbalances-tea-value-chains',
        title: 'Addressing Power Imbalances in Tea Value Chains',
        publisher: 'Oxfam',
        tier: 'tier2',
        publishedDate: '2019-10-21',
      },
      {
        url: 'https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods',
        title: 'List of Goods — Tea',
        publisher: 'US Department of Labor (ILAB)',
        tier: 'tier1',
        publishedDate: '2024-09-05',
      },
    ],
    lastVerified: '2026-06-09',
  },
  {
    id: 'shrimp-forced-labour-thailand',
    ingredientPatterns: [
      'shrimp',
      'prawn',
      'prawns',
      'shrimps',
      'crevette',
      'penaeus',
    ],
    displayName: 'Shrimp and prawns',
    category: 'forced_labour',
    severity: 'critical',
    summary:
      'Thai shrimp and seafood processing has been repeatedly linked to forced labour and trafficking of Burmese, Cambodian and Rohingya migrants at sea and in peeling sheds.',
    details:
      'A 2015 Associated Press investigation that won a Pulitzer Prize documented enslaved fishermen on Thai boats supplying global brands. Despite reforms, the ILO and US Department of Labor continue to list Thai shrimp and fish for forced labour and child labour risk.',
    whatToLookFor:
      'Look for Best Aquaculture Practices (BAP) 4-star, Aquaculture Stewardship Council (ASC), or domestic / wild-caught with traceable vessel data.',
    sources: [
      {
        url: 'https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods',
        title: 'List of Goods — Shrimp (Thailand)',
        publisher: 'US Department of Labor (ILAB)',
        tier: 'tier1',
        publishedDate: '2024-09-05',
      },
      {
        url: 'https://www.ilo.org/asia/projects/ship/lang--en/index.htm',
        title: 'Ship to Shore Rights — Forced labour in Thai fisheries',
        publisher: 'International Labour Organization',
        tier: 'tier1',
        publishedDate: '2020-12-01',
      },
      {
        url: 'https://apnews.com/article/seafood-from-slaves',
        title: 'Seafood from Slaves',
        publisher: 'Associated Press',
        tier: 'tier3',
        publishedDate: '2015-03-25',
      },
    ],
    lastVerified: '2026-06-09',
  },
  {
    id: 'soy-deforestation-amazon-cerrado',
    ingredientPatterns: [
      'soy',
      'soya',
      'soybean',
      'soy lecithin',
      'soya lecithin',
      'soy protein',
      'glycine max',
    ],
    displayName: 'Soy',
    category: 'deforestation',
    severity: 'high',
    summary:
      'Soy expansion is the leading driver of deforestation in the Brazilian Cerrado and a major contributor to Amazon clearance, mostly for animal feed.',
    details:
      'About 77% of global soy is fed to livestock. Despite the 2006 Amazon Soy Moratorium, expansion has shifted to the Cerrado savanna, where roughly half of native vegetation has been lost. Several major traders have been linked to clearance on Indigenous and protected land.',
    whatToLookFor:
      'Look for ProTerra, Round Table on Responsible Soy (RTRS) credits, organic, or "deforestation-free" certified soy. EU products produced after Dec 2024 must meet the EU Deforestation Regulation.',
    sources: [
      {
        url: 'https://www.worldwildlife.org/industries/soy',
        title: 'Soy — Overview',
        publisher: 'WWF',
        tier: 'tier2',
        publishedDate: '2024-04-01',
      },
      {
        url: 'https://www.mightyearth.org/2023/04/13/soy-and-cattle-tracker/',
        title: 'Soy and Cattle Deforestation Tracker',
        publisher: 'Mighty Earth',
        tier: 'tier2',
        publishedDate: '2023-04-13',
      },
      {
        url: 'https://environment.ec.europa.eu/topics/forests/deforestation/regulation-deforestation-free-products_en',
        title: 'EU Deforestation Regulation (EUDR)',
        publisher: 'European Commission',
        tier: 'tier1',
        publishedDate: '2023-06-29',
      },
    ],
    lastVerified: '2026-06-09',
  },
  {
    id: 'beef-deforestation-amazon',
    ingredientPatterns: [
      'beef',
      'beef extract',
      'beef tallow',
      'beef gelatin',
      'bovine gelatin',
      'bovine gelatine',
    ],
    displayName: 'Beef',
    category: 'deforestation',
    severity: 'high',
    summary:
      'Cattle ranching is the single largest driver of Amazon deforestation, responsible for roughly 80% of cleared land in the Brazilian Amazon.',
    details:
      'Cattle laundering — where animals raised on illegally cleared land are moved to compliant farms before slaughter — undermines existing zero-deforestation cattle agreements. The world\'s three largest meatpackers have repeatedly been linked to ranches inside protected and Indigenous territories.',
    whatToLookFor:
      'Look for grass-fed beef from documented origins, EU-origin or US-origin beef, or certified Regenerative Organic. Avoid beef from suppliers without published deforestation audits.',
    sources: [
      {
        url: 'https://www.worldwildlife.org/industries/beef',
        title: 'Beef — Overview',
        publisher: 'WWF',
        tier: 'tier2',
        publishedDate: '2024-02-01',
      },
      {
        url: 'https://www.globalwitness.org/en/campaigns/forests/beefing-about-deforestation/',
        title: 'Beefing about deforestation',
        publisher: 'Global Witness',
        tier: 'tier2',
        publishedDate: '2020-12-02',
      },
    ],
    lastVerified: '2026-06-09',
  },
];
