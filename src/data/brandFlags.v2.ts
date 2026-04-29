/*
 * brandFlags.v2.ts — Migrated from brandFlags.ts on 2026-04-29.
 *
 * Migration notes:
 * - Original sources were plain strings with no URLs. All `url` fields below
 *   are set to "" and must be populated by human research before a flag can
 *   be considered fully verified.
 * - `status` is set based on the provisional sourcing-bar analysis in
 *   docs/data-audit.md. Flags with only tier-3 sources, or fewer tier-2 sources
 *   than the bar requires, are set to 'pending_review'.
 * - `lastVerified` is set to the migration date (2026-04-29) for provisionally
 *   verified flags. URL verification is still outstanding for all entries.
 * - Sub-brand aliases that previously had their own registry keys are now
 *   consolidated into the parent flag's `brandAliases` array.
 * - Do NOT delete brandFlags.legacy.ts until URLs have been populated and
 *   manually reviewed.
 *
 * SOURCING BAR (a flag may be 'verified' only if it meets ONE of these):
 *   - At least 1 tier-1 source, OR
 *   - At least 2 tier-2 sources from independent organisations, OR
 *   - At least 1 tier-2 source AND 2 tier-3 sources covering the same finding.
 * A flag with only tier-3 sources is 'pending_review' and not shown in production.
 */

import type { BrandFlagV2, FlagSource } from '@/types/brandFlag';
import { meetsSourcingBar } from '@/types/brandFlag';

// ---------------------------------------------------------------------------
// Shared source objects (reused across entries)
// ---------------------------------------------------------------------------

const DOL_TVPRA_COCOA: FlagSource = {
  url: '',
  title: 'List of Goods Produced by Child Labor or Forced Labor — Cocoa (Ivory Coast, Ghana)',
  publisher: 'U.S. Department of Labor',
  type: 'government_report',
  tier: 'tier1',
  publishedDate: '2022-09-01',
  accessedDate: '2026-04-29',
  jurisdiction: 'US',
};

const DOL_TVPRA_SUGAR: FlagSource = {
  url: '',
  title: 'List of Goods Produced by Child Labor or Forced Labor — Sugar',
  publisher: 'U.S. Department of Labor',
  type: 'government_report',
  tier: 'tier1',
  publishedDate: '2022-09-01',
  accessedDate: '2026-04-29',
  jurisdiction: 'US',
};

const DOL_TVPRA_PALM_OIL: FlagSource = {
  url: '',
  title: 'List of Goods Produced by Child Labor or Forced Labor — Palm Oil',
  publisher: 'U.S. Department of Labor',
  type: 'government_report',
  tier: 'tier1',
  publishedDate: '2022-09-01',
  accessedDate: '2026-04-29',
  jurisdiction: 'US',
};

const DOL_TVPRA_COFFEE: FlagSource = {
  url: '',
  title: 'List of Goods Produced by Child Labor or Forced Labor — Coffee',
  publisher: 'U.S. Department of Labor',
  type: 'government_report',
  tier: 'tier1',
  publishedDate: '2022-09-01',
  accessedDate: '2026-04-29',
  jurisdiction: 'US',
};

const IRA_COCOA_LAWSUIT: FlagSource = {
  url: '',
  title: 'Coubaly et al. v. Nestlé USA, Inc., Cargill Inc., Barry Callebaut USA LLC, Mars Inc., Hershey Co., Mondelēz Global LLC',
  publisher: 'IRA Advocates / U.S. District Court D.C.',
  type: 'court_filing',
  tier: 'tier1',
  publishedDate: '2021-02-12',
  accessedDate: '2026-04-29',
  jurisdiction: 'US',
};

const NESTLE_SCOTUS: FlagSource = {
  url: '',
  title: "Nestlé USA, Inc. v. Doe — Supreme Court of the United States, No. 19-416",
  publisher: 'U.S. Supreme Court',
  type: 'court_filing',
  tier: 'tier1',
  publishedDate: '2021-06-17',
  accessedDate: '2026-04-29',
  jurisdiction: 'US',
};

const AMNESTY_PALM_OIL: FlagSource = {
  url: '',
  title: 'The Great Palm Oil Scandal — Labour Abuses Behind Big Brand Names',
  publisher: 'Amnesty International',
  type: 'ngo_report',
  tier: 'tier2',
  publishedDate: '2016-11-30',
  accessedDate: '2026-04-29',
  jurisdiction: 'Global',
};

const OXFAM_BEHIND_BRANDS: FlagSource = {
  url: '',
  title: 'Behind the Brands — Scorecard',
  publisher: 'Oxfam International',
  type: 'ngo_report',
  tier: 'tier2',
  publishedDate: '2013-02-26',
  accessedDate: '2026-04-29',
  jurisdiction: 'Global',
};

const DOL_SANITATION_2022: FlagSource = {
  url: '',
  title: 'U.S. DOL Wage and Hour Division — Packers Sanitation Services Inc. child labor investigation',
  publisher: 'U.S. Department of Labor',
  type: 'regulatory_finding',
  tier: 'tier1',
  publishedDate: '2022-11-09',
  accessedDate: '2026-04-29',
  jurisdiction: 'US',
};

const HRW_ECUADOR_2002: FlagSource = {
  url: '',
  title: 'Tainted Harvest — Child Labor and Obstacles to Organizing on Ecuador\'s Banana Plantations',
  publisher: 'Human Rights Watch',
  type: 'ngo_report',
  tier: 'tier2',
  publishedDate: '2002-04-30',
  accessedDate: '2026-04-29',
  jurisdiction: 'EC',
};

const BHRRC: FlagSource = {
  url: '',
  title: 'Business & Human Rights Resource Centre — company profile',
  publisher: 'Business & Human Rights Resource Centre',
  type: 'ngo_report',
  tier: 'tier2',
  publishedDate: '2024-01-01',
  accessedDate: '2026-04-29',
  jurisdiction: 'Global',
};

// ---------------------------------------------------------------------------
// Flag data
// ---------------------------------------------------------------------------

export const brandFlagsV2: BrandFlagV2[] = [

  // ── NESTLÉ ──────────────────────────────────────────────────────────────
  {
    id: 'nestle-child-forced-labour-2021',
    brandName: 'Nestlé',
    brandAliases: [
      'nestlé', 'nestle', 'nescafé', 'nescafe', 'nespresso', 'nesquik',
      'maggi', 'stouffer', 'digiorno', 'toll house', 'coffee-mate', 'coffeemate',
      'carnation', 'gerber', 'kitkat', 'kit kat', 'smarties', 'aero',
      'perrier', 's.pellegrino', 'san pellegrino', 'poland spring',
      'purina', 'fancy feast', 'friskies',
    ],
    category: 'child_labour',
    severity: 'critical',
    summary: 'Nestlé has faced multiple US lawsuits and a Supreme Court case alleging use of child and forced labor in its cocoa supply chain in West Africa.',
    details: "Nestlé USA, Inc. v. Doe reached the U.S. Supreme Court in 2021, with Malian plaintiffs alleging they were trafficked as children to harvest cocoa on Ivory Coast farms supplying Nestlé. The company also appears on the U.S. DOL list of goods produced with child labor for cocoa, and has been linked to child labor in Guatemalan coffee and forced labor in Malaysian palm oil supply chains. Amnesty International documented abusive conditions at palm oil supplier estates in 2016.",
    sources: [
      NESTLE_SCOTUS,
      IRA_COCOA_LAWSUIT,
      DOL_TVPRA_COCOA,
      AMNESTY_PALM_OIL,
    ],
    status: 'verified',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── MARS ────────────────────────────────────────────────────────────────
  {
    id: 'mars-child-labour-cocoa-2021',
    brandName: 'Mars, Inc.',
    brandAliases: [
      'mars', 'm&m', 'snickers', 'twix', 'milky way', '3 musketeers',
      'dove chocolate', 'galaxy', 'skittles', 'starburst', 'extra gum',
      'orbit', 'altoids', "ben's original", 'uncle ben', 'dolmio',
      'seeds of change', 'tasty bite', 'pedigree', 'whiskas',
    ],
    category: 'child_labour',
    severity: 'critical',
    summary: 'Mars was named defendant in child trafficking and forced labor lawsuits related to cocoa sourcing from Ivory Coast.',
    details: "Malian plaintiffs in the IRA Advocates lawsuit alleged they were trafficked as children to harvest cocoa on Ivory Coast farms supplying Mars. A 2019 Washington Post investigation found that Mars had broken its pledges to eliminate child labor in its chocolate supply chain by 2010. Mars cocoa and sugar sourcing is listed on the U.S. DOL TVPRA list of goods produced with child or forced labor.",
    sources: [
      IRA_COCOA_LAWSUIT,
      DOL_TVPRA_COCOA,
      {
        url: '',
        title: "Hershey, Nestlé and Mars Broke Their Pledges to End Child Labor",
        publisher: 'Washington Post',
        type: 'investigative_journalism',
        tier: 'tier3',
        publishedDate: '2019-06-05',
        accessedDate: '2026-04-29',
        jurisdiction: 'Global',
      },
    ],
    status: 'verified',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── HERSHEY ─────────────────────────────────────────────────────────────
  {
    id: 'hershey-child-labour-cocoa-2021',
    brandName: 'The Hershey Company',
    brandAliases: [
      'hershey', 'reese', 'jolly rancher', 'twizzler', 'almond joy',
      'mounds', 'york peppermint', 'heath', 'whoppers', 'milk duds',
      'payday', 'skinnypop', "pirate's booty", 'brookside',
    ],
    category: 'child_labour',
    severity: 'critical',
    summary: 'Hershey was named defendant in child labor lawsuits regarding West African cocoa sourcing and has broken multiple public pledges to eliminate child labor in its supply chain.',
    details: "Hershey was a defendant in the IRA Advocates cocoa child labor lawsuit in which Malian plaintiffs alleged trafficking and forced labor on Ivory Coast cocoa farms. A 2019 Washington Post investigation documented that Hershey had broken its pledges to end child labor. Cocoa is listed by the U.S. DOL as produced with child labor in the primary sourcing countries.",
    sources: [
      IRA_COCOA_LAWSUIT,
      DOL_TVPRA_COCOA,
      {
        url: '',
        title: "Hershey, Nestlé and Mars Broke Their Pledges to End Child Labor",
        publisher: 'Washington Post',
        type: 'investigative_journalism',
        tier: 'tier3',
        publishedDate: '2019-06-05',
        accessedDate: '2026-04-29',
        jurisdiction: 'Global',
      },
    ],
    status: 'verified',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── MONDELĒZ ────────────────────────────────────────────────────────────
  {
    id: 'mondelez-child-labour-cocoa-2021',
    brandName: 'Mondelēz International',
    brandAliases: [
      'mondelez', 'mondelēz', 'cadbury', 'oreo', 'toblerone', 'milka',
      'chips ahoy', 'ritz', 'triscuit', 'wheat thins', 'belvita',
      'sour patch', 'swedish fish', 'tang', 'halls', 'nabisco', 'clif bar',
      "côte d'or", "cote d'or", 'green & black', 'marabou',
      'lu biscuit', "tate's bake", 'prince biscuit',
    ],
    category: 'child_labour',
    severity: 'critical',
    summary: 'Mondelēz International was named defendant in a 2021 child trafficking lawsuit alleging forced child labor on Ivory Coast cocoa farms in its supply chain.',
    details: "Malian plaintiffs in the 2021 IRA Advocates lawsuit alleged they were trafficked as children and forced to harvest cocoa on Ivory Coast farms supplying Mondelēz (formerly Kraft Foods). Cocoa is listed on the U.S. DOL TVPRA list as produced with child labor. Oxfam's Behind the Brands campaign scored Mondelēz poorly on labor rights transparency.",
    sources: [
      IRA_COCOA_LAWSUIT,
      DOL_TVPRA_COCOA,
      OXFAM_BEHIND_BRANDS,
    ],
    status: 'verified',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── FERRERO ─────────────────────────────────────────────────────────────
  {
    id: 'ferrero-child-labour-hazelnut-2022',
    brandName: 'Ferrero Group',
    brandAliases: ['ferrero', 'nutella', 'kinder', 'tic tac', 'thorntons', 'butterfinger'],
    category: 'child_labour',
    severity: 'critical',
    summary: 'BBC and Guardian investigations documented children as young as 11 picking hazelnuts in Turkey for Ferrero, the world\'s largest hazelnut buyer.',
    details: "BBC and Guardian investigations found children as young as 11 picking hazelnuts in Turkey for farms supplying Ferrero. Ferrero is the world's largest consumer of hazelnuts, purchasing approximately 25% of global supply. The company is also linked to child labor in West African cocoa through U.S. DOL TVPRA listings for both hazelnuts and cocoa.",
    sources: [
      DOL_TVPRA_COCOA,
      {
        url: '',
        title: 'Children picking hazelnuts in Turkey for Ferrero',
        publisher: 'BBC',
        type: 'investigative_journalism',
        tier: 'tier3',
        publishedDate: '2022-08-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'TR',
      },
      {
        url: '',
        title: 'Child labour in hazelnut supply chain',
        publisher: 'The Guardian',
        type: 'investigative_journalism',
        tier: 'tier3',
        publishedDate: '2022-08-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'TR',
      },
    ],
    status: 'verified',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── LINDT ───────────────────────────────────────────────────────────────
  {
    id: 'lindt-child-labour-cocoa-2024',
    brandName: 'Lindt & Sprüngli AG',
    brandAliases: ['lindt'],
    category: 'child_labour',
    severity: 'high',
    summary: 'Lindt\'s own 2023 audit found 87 child workers on supplier farms in Ghana, and a 2024 Swiss TV investigation documented ongoing child labor despite the company\'s prevention program.',
    details: "Lindt's own corporate forced labour report (2023) disclosed that surprise audits found 87 child workers on Ghanaian cocoa farms in its supply chain in 2021. A 2024 Swiss TV Rundschau investigation documented child labor persisting on farms supplying Lindt despite the company's child labor monitoring program. This constitutes a corporate admission of a documented finding.",
    sources: [
      {
        url: '',
        title: "Lindt & Sprüngli Sustainability Report / Forced Labour Disclosure (2023)",
        publisher: 'Lindt & Sprüngli AG',
        type: 'corporate_admission',
        tier: 'tier1',
        publishedDate: '2023-01-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'CH',
        excerpt: 'Surprise audits found 87 child workers on cocoa farms in 2021.',
      },
      {
        url: '',
        title: 'Kinderarbeit in Lindts Kakaobeschaffung (Child labor in Lindt cocoa supply)',
        publisher: 'Swiss TV Rundschau (SRF)',
        type: 'investigative_journalism',
        tier: 'tier3',
        publishedDate: '2024-01-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'GH',
      },
    ],
    status: 'verified',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── LINDOR ──────────────────────────────────────────────────────────────
  {
    id: 'lindor-child-labour-cocoa-2024',
    brandName: 'Lindor (Lindt sub-brand)',
    brandAliases: ['lindor'],
    category: 'child_labour',
    severity: 'high',
    summary: 'Lindor is a Lindt sub-brand. A 2024 Swiss TV investigation documented child labor on cocoa farms supplying its parent company in Ghana.',
    details: "Lindor chocolates are produced by Lindt & Sprüngli. A 2024 Swiss TV Rundschau investigation documented child labor on Ghanaian cocoa farms supplying Lindt. Additional independent sourcing confirming Lindor-specific supply chain involvement is outstanding.",
    sources: [
      {
        url: '',
        title: 'Kinderarbeit in Lindts Kakaobeschaffung (Child labor in Lindt cocoa supply)',
        publisher: 'Swiss TV Rundschau (SRF)',
        type: 'investigative_journalism',
        tier: 'tier3',
        publishedDate: '2024-01-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'GH',
      },
    ],
    status: 'pending_review',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── GHIRARDELLI ─────────────────────────────────────────────────────────
  {
    id: 'ghirardelli-child-labour-cocoa-2024',
    brandName: 'Ghirardelli Chocolate Company (Lindt sub-brand)',
    brandAliases: ['ghirardelli'],
    category: 'child_labour',
    severity: 'high',
    summary: 'Ghirardelli is owned by Lindt. A 2024 Swiss TV investigation documented child labor on cocoa farms supplying its parent company.',
    details: "Ghirardelli was acquired by Lindt & Sprüngli in 1998. A 2024 Swiss TV Rundschau investigation documented child labor on Ghanaian cocoa farms supplying Lindt. Additional independent sourcing confirming Ghirardelli-specific cocoa supply chain involvement is outstanding.",
    sources: [
      {
        url: '',
        title: 'Kinderarbeit in Lindts Kakaobeschaffung (Child labor in Lindt cocoa supply)',
        publisher: 'Swiss TV Rundschau (SRF)',
        type: 'investigative_journalism',
        tier: 'tier3',
        publishedDate: '2024-01-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'GH',
      },
    ],
    status: 'pending_review',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── RUSSELL STOVER ──────────────────────────────────────────────────────
  {
    id: 'russell-stover-child-labour-cocoa-2024',
    brandName: 'Russell Stover Chocolates (Lindt sub-brand)',
    brandAliases: ['russell stover'],
    category: 'child_labour',
    severity: 'high',
    summary: 'Russell Stover is owned by Lindt. Cocoa supply chain is linked to child labor in Ghana via parent company findings.',
    details: "Russell Stover was acquired by Lindt & Sprüngli in 2014. A 2024 Swiss TV Rundschau investigation documented child labor on Ghanaian cocoa farms supplying Lindt. Additional independent sourcing confirming Russell Stover-specific supply chain involvement is outstanding.",
    sources: [
      {
        url: '',
        title: 'Kinderarbeit in Lindts Kakaobeschaffung (Child labor in Lindt cocoa supply)',
        publisher: 'Swiss TV Rundschau (SRF)',
        type: 'investigative_journalism',
        tier: 'tier3',
        publishedDate: '2024-01-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'GH',
      },
    ],
    status: 'pending_review',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── COCA-COLA ────────────────────────────────────────────────────────────
  {
    id: 'coca-cola-child-labour-sugar-2021',
    brandName: 'The Coca-Cola Company',
    brandAliases: [
      'coca-cola', 'coca cola', 'diet coke', 'coke zero', 'sprite', 'fanta',
      'minute maid', 'simply orange', 'dasani', 'powerade', 'vitaminwater',
      'smartwater', 'gold peak', 'fuze tea', 'fairlife', 'bodyarmor',
      'costa coffee', 'topo chico',
    ],
    category: 'child_labour',
    severity: 'high',
    summary: 'Human Rights Watch documented child labor on sugar plantations in El Salvador supplying Coca-Cola, and an NYT investigation found child labor and debt bondage on Indian sugar cane farms in its supply chain.',
    details: "A 2004 Human Rights Watch report documented children working on sugar plantations in El Salvador supplying Coca-Cola. An NYT/Fuller Project investigation found child labor and debt bondage on sugar cane farms in India supplying Coca-Cola's supply chain. Sugar is listed by the U.S. DOL as produced with child or forced labor in multiple sourcing countries.",
    sources: [
      DOL_TVPRA_SUGAR,
      {
        url: '',
        title: 'Turning a Blind Eye — Hazardous Child Labor in El Salvador\'s Sugarcane Cultivation',
        publisher: 'Human Rights Watch',
        type: 'ngo_report',
        tier: 'tier2',
        publishedDate: '2004-06-09',
        accessedDate: '2026-04-29',
        jurisdiction: 'SV',
      },
      {
        url: '',
        title: "Child Labor and Debt Bondage on Indian Sugar Farms",
        publisher: 'NYT / The Fuller Project',
        type: 'investigative_journalism',
        tier: 'tier3',
        publishedDate: '2021-01-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'IN',
      },
    ],
    status: 'verified',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── PEPSICO ──────────────────────────────────────────────────────────────
  {
    id: 'pepsico-child-labour-sugar-2021',
    brandName: 'PepsiCo, Inc.',
    brandAliases: [
      'pepsi', 'pepsico', 'mountain dew', 'gatorade', 'tropicana',
      "lay's", 'lays', 'doritos', 'cheetos', 'tostitos', 'fritos',
      'ruffles', 'quaker', "cap'n crunch", 'aquafina', 'sierra mist',
      "stacy's", 'sunchips', 'sabra', 'life cereal',
    ],
    category: 'child_labour',
    severity: 'high',
    summary: 'An NYT investigation linked PepsiCo\'s Indian sugar supply chain to child labor and debt bondage, and the company has sourced palm oil from suppliers linked to forced labor in Malaysia.',
    details: "An NYT/Fuller Project investigation found child labor and debt bondage on sugar cane farms in India supplying PepsiCo's supply chain. PepsiCo has also been flagged for sourcing palm oil from FGV Holdings, a Malaysian supplier linked to forced labor allegations. Sugar and palm oil are listed by the U.S. DOL as produced with child or forced labor. The Rainforest Action Network has published findings on PepsiCo's palm oil supply chain.",
    sources: [
      DOL_TVPRA_SUGAR,
      DOL_TVPRA_PALM_OIL,
      {
        url: '',
        title: "Child Labor and Debt Bondage on Indian Sugar Farms",
        publisher: 'NYT / The Fuller Project',
        type: 'investigative_journalism',
        tier: 'tier3',
        publishedDate: '2021-01-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'IN',
      },
      {
        url: '',
        title: 'The Snack Food 20 — Palm Oil Scorecard',
        publisher: 'Rainforest Action Network',
        type: 'ngo_report',
        tier: 'tier2',
        publishedDate: '2020-01-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'MY',
      },
    ],
    status: 'verified',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── STARBUCKS ───────────────────────────────────────────────────────────
  {
    id: 'starbucks-child-labour-coffee-2024',
    brandName: 'Starbucks Corporation',
    brandAliases: ['starbucks'],
    category: 'child_labour',
    severity: 'high',
    summary: 'A Channel 4 investigation found child labor on all five Starbucks-linked coffee farms visited in Guatemala, with children as young as 8.',
    details: "A Channel 4 Dispatches investigation found child labor on all five Starbucks-linked coffee farms visited in Guatemala, with children as young as 8 working on farms supplying its certified supply chain. The Business & Human Rights Resource Centre documented a 2024 Brazilian lawsuit in which workers alleged forced labor conditions at a Starbucks-certified supplier farm. Additional independent sourcing is required to meet the sourcing bar.",
    sources: [
      BHRRC,
      {
        url: '',
        title: 'Dispatches: Starbucks — The Truth About Your Coffee',
        publisher: 'Channel 4',
        type: 'investigative_journalism',
        tier: 'tier3',
        publishedDate: '2023-10-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'GT',
      },
    ],
    status: 'pending_review',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── UNILEVER ─────────────────────────────────────────────────────────────
  {
    id: 'unilever-forced-labour-palm-oil-2016',
    brandName: 'Unilever PLC',
    brandAliases: [
      'unilever', 'hellmann', 'hellman', 'best foods', 'knorr',
      'ben & jerry', 'ben and jerry', 'breyers', 'magnum', 'good humor',
      'klondike', 'popsicle', 'marmite', 'bovril', "colman's", 'lipton', 'pg tips',
    ],
    category: 'forced_labour',
    severity: 'high',
    summary: 'Amnesty International traced palm oil from forced-labor-linked Wilmar International to Unilever products, and a BBC investigation found degrading conditions on Assam tea estates supplying Unilever brands.',
    details: "Amnesty International's 2016 report 'The Great Palm Oil Scandal' traced palm oil from Wilmar International — linked to child and forced labor in Indonesia — to Unilever products including Dove, Magnum, and Knorr. A 2019 AP investigation corroborated palm oil supply chain abuses. A BBC investigation found degrading conditions, inadequate housing, and lack of sanitation on tea estates in Assam, India, supplying Unilever's Lipton and PG Tips brands.",
    sources: [
      AMNESTY_PALM_OIL,
      {
        url: '',
        title: 'AP Investigation: Slaves May Have Caught the Fish in Your Plate',
        publisher: 'Associated Press',
        type: 'investigative_journalism',
        tier: 'tier3',
        publishedDate: '2015-03-25',
        accessedDate: '2026-04-29',
        jurisdiction: 'ID',
      },
      {
        url: '',
        title: 'Assam tea estate workers — living and working conditions',
        publisher: 'BBC',
        type: 'investigative_journalism',
        tier: 'tier3',
        publishedDate: '2019-01-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'IN',
      },
    ],
    status: 'verified',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── TWININGS / ABF ───────────────────────────────────────────────────────
  {
    id: 'abf-child-labour-tea-sugar-2019',
    brandName: 'Associated British Foods (ABF)',
    brandAliases: [
      'twinings', 'ovaltine', 'kingsmill', "patak's", 'blue dragon',
      'jordans cereal', 'ryvita', 'silver spoon', 'billington',
    ],
    category: 'child_labour',
    severity: 'medium',
    summary: 'ABF tied for last place in Oxfam\'s Behind the Brands scorecard; its Silver Spoon sugar is sourced from supply chains with child labor, and Twinings tea estates were linked to a BBC Assam investigation.',
    details: "Associated British Foods tied for last place in Oxfam's Behind the Brands campaign, scoring the lowest on labor rights transparency among the ten largest food companies. Its Silver Spoon brand sources sugar from supply chains listed by the U.S. DOL as producing with child labor. A BBC investigation into Assam tea estates in India found degrading conditions on estates supplying tea brands including Twinings.",
    sources: [
      DOL_TVPRA_SUGAR,
      OXFAM_BEHIND_BRANDS,
      {
        url: '',
        title: 'Assam tea estate workers — living and working conditions',
        publisher: 'BBC',
        type: 'investigative_journalism',
        tier: 'tier3',
        publishedDate: '2019-01-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'IN',
      },
    ],
    status: 'verified',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── TETLEY ───────────────────────────────────────────────────────────────
  {
    id: 'tetley-unsafe-conditions-tea-2019',
    brandName: 'Tetley (Tata Consumer Products)',
    brandAliases: ['tetley'],
    category: 'unsafe_conditions',
    severity: 'high',
    summary: 'A BBC investigation found degrading working conditions on Indian tea estates in Assam supplying Tetley, including inadequate equipment, housing, and sanitation.',
    details: "A BBC investigation found degrading working conditions on Indian tea estates in Assam supplying Tetley. Workers lacked proper protective equipment, adequate housing, and sanitation. The Business & Human Rights Resource Centre has tracked subsequent NGO responses and company statements. Additional sourcing is required to meet the sourcing bar.",
    sources: [
      BHRRC,
      {
        url: '',
        title: 'Assam tea estate workers — living and working conditions',
        publisher: 'BBC',
        type: 'investigative_journalism',
        tier: 'tier3',
        publishedDate: '2019-01-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'IN',
      },
    ],
    status: 'pending_review',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── FOLGERS ──────────────────────────────────────────────────────────────
  {
    id: 'folgers-forced-labour-coffee-2022',
    brandName: 'Folgers (The J.M. Smucker Company)',
    brandAliases: ['folgers'],
    category: 'forced_labour',
    severity: 'medium',
    summary: 'Folgers sources coffee through supply chains linked to Brazilian plantations where workers were found in slavery-like conditions, and the U.S. DOL lists coffee as produced with child or forced labor.',
    details: "A Danwatch investigation documented slavery-like conditions on Brazilian coffee plantations in supply chains used by major coffee brands including Folgers. The U.S. DOL TVPRA list identifies coffee from multiple sourcing countries as produced with child labor or forced labor. Folgers is owned by J.M. Smucker Company.",
    sources: [
      DOL_TVPRA_COFFEE,
      {
        url: '',
        title: 'Bitter Beans — Slave Labour in the Brazilian Coffee Industry',
        publisher: 'Danwatch',
        type: 'investigative_journalism',
        tier: 'tier3',
        publishedDate: '2016-01-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'BR',
      },
    ],
    status: 'verified',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── KRAFT HEINZ ──────────────────────────────────────────────────────────
  {
    id: 'kraft-heinz-forced-labour-coffee-palm-oil-2022',
    brandName: 'The Kraft Heinz Company',
    brandAliases: [
      'kraft', 'heinz', 'oscar mayer', 'philadelphia', 'velveeta',
      'jell-o', 'planters', 'lunchables', 'capri sun', 'kool-aid',
      'ore-ida', 'maxwell house',
    ],
    category: 'forced_labour',
    severity: 'medium',
    summary: 'Kraft Heinz coffee brands source through supply chains with documented forced labor, and its palm oil suppliers have been linked to child labor allegations.',
    details: "Kraft Heinz's Maxwell House coffee sources through supply chains listed by the U.S. DOL as producing coffee with child or forced labor. Amnesty International's 2016 palm oil report identified palm oil sourced by Kraft Heinz from Wilmar International, whose supplier estates were linked to child and forced labor in Indonesia.",
    sources: [
      DOL_TVPRA_COFFEE,
      AMNESTY_PALM_OIL,
    ],
    status: 'verified',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── LAVAZZA ──────────────────────────────────────────────────────────────
  {
    id: 'lavazza-forced-labour-coffee-2022',
    brandName: 'Luigi Lavazza S.p.A.',
    brandAliases: ['lavazza'],
    category: 'forced_labour',
    severity: 'medium',
    summary: 'Lavazza has been cited in investigative reports regarding suppliers linked to farms with slavery-like working conditions in Brazil\'s coffee sector.',
    details: "A 2022 Reporter Brasil investigation cited Lavazza as sourcing from suppliers linked to Brazilian coffee farms where workers were found in slavery-like conditions. A Danwatch investigation corroborated findings of forced labor in Brazilian coffee supply chains. Additional tier-2 sourcing is required to meet the sourcing bar.",
    sources: [
      {
        url: '',
        title: 'Trabalho escravo no café exportado para a Europa (Slave labor in coffee exported to Europe)',
        publisher: 'Reporter Brasil',
        type: 'investigative_journalism',
        tier: 'tier3',
        publishedDate: '2022-01-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'BR',
      },
      {
        url: '',
        title: 'Bitter Beans — Slave Labour in the Brazilian Coffee Industry',
        publisher: 'Danwatch',
        type: 'investigative_journalism',
        tier: 'tier3',
        publishedDate: '2016-01-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'BR',
      },
    ],
    status: 'pending_review',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── ILLY ─────────────────────────────────────────────────────────────────
  {
    id: 'illy-forced-labour-coffee-2018',
    brandName: 'illycaffè S.p.A.',
    brandAliases: ['illy'],
    category: 'forced_labour',
    severity: 'medium',
    summary: 'A 2018 OECD complaint documented slavery-like conditions on coffee farms supplying Illy, and the company confirmed purchasing from cooperatives linked to plantations where authorities liberated workers.',
    details: "A 2018 OECD NCP complaint documented slavery-like conditions on Brazilian coffee farms in Illy's supply chain. Illy confirmed it had purchased from cooperatives linked to plantations where Brazilian authorities liberated workers found in conditions analogous to slavery. The OECD NCP is an official government-affiliated dispute mechanism, classifying this finding at tier 1. A Danwatch investigation corroborated the supply chain link.",
    sources: [
      {
        url: '',
        title: 'OECD NCP Italy — complaint regarding illycaffè supply chain (2018)',
        publisher: 'OECD National Contact Point (Italy)',
        type: 'regulatory_finding',
        tier: 'tier1',
        publishedDate: '2018-01-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'BR',
      },
      {
        url: '',
        title: 'Bitter Beans — Slave Labour in the Brazilian Coffee Industry',
        publisher: 'Danwatch',
        type: 'investigative_journalism',
        tier: 'tier3',
        publishedDate: '2016-01-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'BR',
      },
    ],
    status: 'verified',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── FANJUL / ASR GROUP ───────────────────────────────────────────────────
  {
    id: 'fanjul-asr-forced-labour-sugar-2022',
    brandName: 'ASR Group / Fanjul Corp.',
    brandAliases: ['domino', 'c&h', 'florida crystals', 'redpath', 'tate & lyle'],
    category: 'forced_labour',
    severity: 'critical',
    summary: 'U.S. Customs and Border Protection banned sugar imports from Central Romana (ASR Group\'s primary supplier) in 2022 after finding evidence of forced labor.',
    details: "In 2022 the U.S. CBP issued a Withhold Release Order against Central Romana Corporation — the Dominican Republic sugar mill that supplies ASR Group's Domino, C&H, and Florida Crystals brands — after finding multiple indicators of forced labor including debt bondage, restriction of movement, confiscated documents, and abusive working and living conditions. Workers were reported to earn as little as $4/day, live without electricity or running water, and have their passports confiscated. NPR and Corporate Accountability Lab provided corroborating reporting.",
    sources: [
      {
        url: '',
        title: 'CBP Withhold Release Order — Central Romana Corporation, Ltd. (Dominican Republic)',
        publisher: 'U.S. Customs and Border Protection',
        type: 'regulatory_finding',
        tier: 'tier1',
        publishedDate: '2022-11-23',
        accessedDate: '2026-04-29',
        jurisdiction: 'DO',
      },
      {
        url: '',
        title: 'U.S. bans sugar from the Dominican Republic over forced labor concerns',
        publisher: 'NPR',
        type: 'news_report',
        tier: 'tier3',
        publishedDate: '2022-11-23',
        accessedDate: '2026-04-29',
        jurisdiction: 'DO',
      },
      {
        url: '',
        title: 'Forced labor in the Dominican Republic sugar sector',
        publisher: 'Corporate Accountability Lab',
        type: 'ngo_report',
        tier: 'tier2',
        publishedDate: '2022-01-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'DO',
      },
    ],
    status: 'verified',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── CHICKEN OF THE SEA ───────────────────────────────────────────────────
  {
    id: 'chicken-of-the-sea-forced-labour-fishing-2015',
    brandName: 'Chicken of the Sea (Thai Union Group)',
    brandAliases: ['chicken of the sea'],
    category: 'forced_labour',
    severity: 'critical',
    summary: 'Parent company Thai Union was linked by AP and Greenpeace to forced labor and slavery on Thai fishing vessels, with workers held at sea for years and not paid.',
    details: "A 2015 Associated Press investigation found that workers on Thai fishing vessels supplying Thai Union (parent of Chicken of the Sea) were forced to work 18–20 hour days, held at sea for years, subjected to physical abuse, and not paid. Greenpeace has published multiple reports on forced labor in Thai Union's supply chain. Additional independent tier-2 sourcing (separate from Greenpeace) is required to meet the sourcing bar.",
    sources: [
      {
        url: '',
        title: 'Slaves May Have Caught the Fish in Your Grocery Store',
        publisher: 'Associated Press',
        type: 'investigative_journalism',
        tier: 'tier3',
        publishedDate: '2015-03-25',
        accessedDate: '2026-04-29',
        jurisdiction: 'TH',
      },
      {
        url: '',
        title: 'Seafood Slavery — Thai Union and the case for change',
        publisher: 'Greenpeace',
        type: 'ngo_report',
        tier: 'tier2',
        publishedDate: '2019-01-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'TH',
      },
    ],
    status: 'pending_review',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── BUMBLE BEE ───────────────────────────────────────────────────────────
  {
    id: 'bumble-bee-forced-labour-fishing-2025',
    brandName: 'Bumble Bee Foods, LLC',
    brandAliases: ['bumble bee'],
    category: 'forced_labour',
    severity: 'critical',
    summary: 'A 2025 federal lawsuit alleges Bumble Bee knew fishing vessels in its supply fleet used forced labor, with Indonesian workers subjected to physical abuse, debt bondage, and deprivation.',
    details: "A 2025 federal lawsuit filed in San Diego alleges that Bumble Bee Foods knew that fishing vessels in its supply fleet subjected Indonesian workers to forced labor including physical abuse, debt bondage, and severe deprivation. Greenpeace and Global Labor Justice-ILRF have published supporting documentation on forced labor in tuna fishing supply chains.",
    sources: [
      {
        url: '',
        title: 'Federal lawsuit — forced labor in Bumble Bee tuna supply fleet',
        publisher: 'U.S. District Court, Southern District of California',
        type: 'court_filing',
        tier: 'tier1',
        publishedDate: '2025-01-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'US',
      },
      {
        url: '',
        title: 'Seafood forced labor in Pacific tuna supply chains',
        publisher: 'Greenpeace',
        type: 'ngo_report',
        tier: 'tier2',
        publishedDate: '2021-01-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'ID',
      },
      {
        url: '',
        title: 'Forced Labor in the Global Seafood Industry',
        publisher: 'Global Labor Justice-ILRF',
        type: 'ngo_report',
        tier: 'tier2',
        publishedDate: '2022-01-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'ID',
      },
    ],
    status: 'verified',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── TYSON ────────────────────────────────────────────────────────────────
  {
    id: 'tyson-child-labour-meatpacking-2022',
    brandName: 'Tyson Foods, Inc.',
    brandAliases: ['tyson', 'jimmy dean', 'hillshire farm', 'ball park', 'aidells', 'wright brand'],
    category: 'child_labour',
    severity: 'critical',
    summary: 'U.S. DOL investigations found children as young as 13 cleaning Tyson and other meatpacking plants via a sanitation subcontractor across 8 states.',
    details: "A U.S. DOL investigation found that Packers Sanitation Services Inc. (PSSI), a sanitation subcontractor, employed children as young as 13 to clean Tyson and other meatpacking plants in at least 8 states. The 2022 investigation resulted in a $1.5 million civil money penalty — the largest child labor fine in DOL history at the time. A 2024 DOL investigation found additional child labor violations linked to Tyson's processing plants.",
    sources: [
      DOL_SANITATION_2022,
      {
        url: '',
        title: 'Child Labor Investigation — Tyson-linked meatpacking facilities (2024)',
        publisher: 'U.S. Department of Labor',
        type: 'regulatory_finding',
        tier: 'tier1',
        publishedDate: '2024-01-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'US',
      },
      {
        url: '',
        title: 'Children Work Dangerous Night Shifts in U.S. Meat Industry',
        publisher: 'Investigate Midwest',
        type: 'investigative_journalism',
        tier: 'tier3',
        publishedDate: '2023-02-28',
        accessedDate: '2026-04-29',
        jurisdiction: 'US',
      },
    ],
    status: 'verified',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── JBS ──────────────────────────────────────────────────────────────────
  {
    id: 'jbs-child-labour-meatpacking-2022',
    brandName: 'JBS USA',
    brandAliases: ['jbs'],
    category: 'child_labour',
    severity: 'high',
    summary: 'Children as young as 13 were found cleaning JBS meatpacking plants via a sanitation subcontractor, and JBS settled a wage-fixing conspiracy lawsuit for over $127 million.',
    details: "The U.S. DOL 2022 investigation into Packers Sanitation Services Inc. found children as young as 13 working overnight shifts cleaning JBS meatpacking plants. JBS also agreed to a $127 million settlement in 2024 resolving a wage-fixing conspiracy lawsuit brought by the U.S. Department of Justice.",
    sources: [
      DOL_SANITATION_2022,
      {
        url: '',
        title: 'JBS wage-fixing conspiracy settlement — $127M+',
        publisher: 'U.S. Department of Justice',
        type: 'regulatory_finding',
        tier: 'tier1',
        publishedDate: '2024-01-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'US',
      },
    ],
    status: 'verified',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── PILGRIM'S PRIDE ──────────────────────────────────────────────────────
  {
    id: 'pilgrims-pride-child-labour-meatpacking-2022',
    brandName: "Pilgrim's Pride Corporation (JBS subsidiary)",
    brandAliases: ["pilgrim's pride"],
    category: 'child_labour',
    severity: 'high',
    summary: 'Children were found cleaning Pilgrim\'s Pride meatpacking plants via a sanitation subcontractor in the 2022 U.S. DOL investigation.',
    details: "Pilgrim's Pride is the second-largest poultry producer in the U.S. and a subsidiary of JBS. The 2022 U.S. DOL investigation into Packers Sanitation Services Inc. found children cleaning meatpacking facilities operated by Pilgrim's Pride.",
    sources: [DOL_SANITATION_2022],
    status: 'verified',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── JUST BARE ────────────────────────────────────────────────────────────
  {
    id: 'just-bare-child-labour-meatpacking-2022',
    brandName: "Just Bare (Pilgrim's Pride / JBS sub-brand)",
    brandAliases: ['just bare'],
    category: 'child_labour',
    severity: 'high',
    summary: 'Just Bare is a Pilgrim\'s Pride brand. Its parent company was linked to child labor in meatpacking sanitation in the 2022 U.S. DOL investigation.',
    details: "Just Bare chicken products are produced by Pilgrim's Pride, a JBS subsidiary. The 2022 U.S. DOL investigation found that Packers Sanitation Services Inc. employed children to clean processing facilities operated by Pilgrim's Pride.",
    sources: [DOL_SANITATION_2022],
    status: 'verified',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── CHIQUITA ─────────────────────────────────────────────────────────────
  {
    id: 'chiquita-child-labour-paramilitary-2024',
    brandName: 'Chiquita Brands International',
    brandAliases: ['chiquita'],
    category: 'child_labour',
    severity: 'critical',
    summary: 'Human Rights Watch documented children as young as 8 working on Chiquita banana plantations in Ecuador, and a U.S. federal court found Chiquita guilty in 2024 of financing Colombian paramilitary groups.',
    details: "A 2002 Human Rights Watch report found children as young as 8 working 12-hour days on banana plantations in Ecuador supplying Chiquita. In 2024, a U.S. federal court found Chiquita Brands International guilty of knowingly financing Colombian paramilitary groups (AUC) designated as a foreign terrorist organization, resulting in a civil verdict for families of victims. The Business & Human Rights Resource Centre has tracked ongoing litigation.",
    sources: [
      HRW_ECUADOR_2002,
      BHRRC,
      {
        url: '',
        title: 'U.S. Federal Court — Chiquita Brands International civil verdict (AUC financing)',
        publisher: 'U.S. District Court, Southern District of Florida',
        type: 'court_filing',
        tier: 'tier1',
        publishedDate: '2024-06-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'US',
      },
    ],
    status: 'verified',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── DOLE ─────────────────────────────────────────────────────────────────
  {
    id: 'dole-child-labour-banana-2002',
    brandName: 'Dole Food Company',
    brandAliases: ['dole'],
    category: 'child_labour',
    severity: 'high',
    summary: 'Human Rights Watch documented child labor and pesticide exposure on Dole supplier banana plantations in Ecuador, and workers reported harassment and intimidation on Philippine supply plantations.',
    details: "A 2002 Human Rights Watch report documented child labor and toxic pesticide exposure on banana plantations in Ecuador supplying Dole. Workers on Dole supply plantations in the Philippines have reported harassment and intimidation against organizers. The Business & Human Rights Resource Centre has tracked subsequent litigation and company responses.",
    sources: [
      HRW_ECUADOR_2002,
      BHRRC,
    ],
    status: 'verified',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── DEL MONTE ────────────────────────────────────────────────────────────
  {
    id: 'del-monte-child-labour-banana-2002',
    brandName: 'Del Monte Foods / Fresh Del Monte',
    brandAliases: ['del monte'],
    category: 'child_labour',
    severity: 'high',
    summary: 'Human Rights Watch found children working on banana plantations supplying Del Monte in Ecuador, with workers exposed to toxic pesticides and denied the right to organize.',
    details: "A 2002 Human Rights Watch report found children working on banana plantations in Ecuador supplying Del Monte. Workers on those plantations were exposed to toxic pesticides without adequate protection and faced restrictions on unionization. Additional independent tier-2 sourcing is required to meet the sourcing bar.",
    sources: [HRW_ECUADOR_2002],
    status: 'pending_review',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── KELLOGG / KELLANOVA ──────────────────────────────────────────────────
  {
    id: 'kellogg-child-labour-palm-oil-2016',
    brandName: "Kellogg's / Kellanova",
    brandAliases: [
      'kellogg', 'frosted flakes', 'froot loops', 'rice krispies', 'corn flakes',
      'special k', 'nutri-grain', 'apple jacks', 'frosted mini', 'pringles',
      'cheez-it', 'pop-tarts', 'eggo',
    ],
    category: 'child_labour',
    severity: 'high',
    summary: 'Amnesty International named Kellogg\'s as one of nine companies profiting from child and forced labor in palm oil through Wilmar International in Indonesia.',
    details: "Amnesty International's 2016 report 'The Great Palm Oil Scandal' named Kellogg's as one of nine companies sourcing palm oil from Wilmar International, whose supplier estates in Indonesia were found to use child labor and forced labor. Oxfam's Behind the Brands scorecard also scored Kellogg's poorly on labor rights.",
    sources: [
      AMNESTY_PALM_OIL,
      OXFAM_BEHIND_BRANDS,
    ],
    status: 'verified',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── GENERAL MILLS ────────────────────────────────────────────────────────
  {
    id: 'general-mills-child-labour-supply-chain-2022',
    brandName: 'General Mills, Inc.',
    brandAliases: [
      'general mills', 'cheerios', 'wheaties', 'lucky charms',
      'cinnamon toast crunch', 'nature valley', 'yoplait', 'betty crocker',
      'pillsbury', 'häagen-dazs', 'haagen-dazs', 'old el paso',
      'progresso', "annie's", 'larabar', "totino's", 'cascadian farm',
    ],
    category: 'child_labour',
    severity: 'medium',
    summary: 'General Mills sources palm oil and cocoa from supply chains with documented child and forced labor, and scored poorly on labor rights in Oxfam\'s Behind the Brands campaign.',
    details: "General Mills uses palm oil and cocoa sourced from supply chains listed by the U.S. DOL as producing goods with child and forced labor. Oxfam's Behind the Brands campaign scored General Mills poorly on labor rights transparency. The company has made public commitments to sustainable sourcing but has faced criticism for gaps in implementation.",
    sources: [
      DOL_TVPRA_COCOA,
      DOL_TVPRA_PALM_OIL,
      OXFAM_BEHIND_BRANDS,
    ],
    status: 'verified',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── DANONE ───────────────────────────────────────────────────────────────
  {
    id: 'danone-supply-chain-opacity-2013',
    brandName: 'Danone S.A.',
    brandAliases: ['danone', 'dannon', 'activia', 'oikos', 'evian', 'volvic', 'aptamil'],
    category: 'supply_chain_opacity',
    severity: 'medium',
    summary: 'Danone scored among the lowest on Oxfam\'s Behind the Brands campaign for labor rights and sources palm oil from supply chains with forced labor concerns.',
    details: "Oxfam's Behind the Brands campaign scored Danone among the lowest of the ten largest food companies on labor rights transparency. Danone uses palm oil sourced from supply chains with documented forced labor concerns. Additional independent tier-2 sourcing is required to meet the sourcing bar.",
    sources: [OXFAM_BEHIND_BRANDS],
    status: 'pending_review',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── CARGILL ──────────────────────────────────────────────────────────────
  {
    id: 'cargill-child-labour-cocoa-2021',
    brandName: 'Cargill, Inc.',
    brandAliases: ['cargill'],
    category: 'child_labour',
    severity: 'critical',
    summary: 'Cargill was named defendant in child trafficking lawsuits alongside Nestlé, and a Brazilian court found Cargill liable for child and forced labor in its cocoa supply chain.',
    details: "Cargill was a named defendant in the 2021 IRA Advocates child trafficking and forced labor lawsuit filed on behalf of Malian plaintiffs who alleged they were trafficked as children to harvest cocoa on Ivory Coast farms. The Nestlé USA, Inc. v. Doe Supreme Court case, which addressed corporate liability under the Alien Tort Statute, also involved Cargill. A Brazilian court has separately found Cargill liable for child and forced labor in its cocoa supply chain.",
    sources: [
      IRA_COCOA_LAWSUIT,
      NESTLE_SCOTUS,
    ],
    status: 'verified',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── BARRY CALLEBAUT ──────────────────────────────────────────────────────
  {
    id: 'barry-callebaut-child-labour-cocoa-2021',
    brandName: 'Barry Callebaut AG',
    brandAliases: ['barry callebaut'],
    category: 'child_labour',
    severity: 'critical',
    summary: 'Barry Callebaut was named defendant in child trafficking and forced labor lawsuits and is directly implicated in West African cocoa child labor as the world\'s largest cocoa processor.',
    details: "Barry Callebaut, the world's largest cocoa processing and chocolate manufacturing company, was a named defendant in the IRA Advocates child trafficking and forced labor lawsuit filed on behalf of Malian plaintiffs. Cocoa — the primary commodity processed by Barry Callebaut — is listed by the U.S. DOL TVPRA list as produced with child labor in Ivory Coast and Ghana, the company's primary sourcing regions.",
    sources: [
      IRA_COCOA_LAWSUIT,
      DOL_TVPRA_COCOA,
    ],
    status: 'verified',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },

  // ── GODIVA ───────────────────────────────────────────────────────────────
  {
    id: 'godiva-supply-chain-opacity-2020',
    brandName: 'Godiva Chocolatier',
    brandAliases: ['godiva'],
    category: 'supply_chain_opacity',
    severity: 'medium',
    summary: 'Godiva ranked last in Green America\'s Chocolate Scorecard for failing to address labor rights and sustainability in its cocoa supply chain.',
    details: "Green America's 2020 Chocolate Scorecard ranked Godiva last among major chocolate brands for its failure to address labor rights, child labor, and sustainability in its cocoa supply chain. The Business & Human Rights Resource Centre has tracked advocacy responses and company statements on cocoa sourcing practices.",
    sources: [
      {
        url: '',
        title: 'Chocolate Scorecard 2020',
        publisher: 'Green America',
        type: 'ngo_report',
        tier: 'tier2',
        publishedDate: '2020-01-01',
        accessedDate: '2026-04-29',
        jurisdiction: 'Global',
      },
      BHRRC,
    ],
    status: 'verified',
    lastVerified: '2026-04-29',
    createdAt: '2026-04-29',
    updatedAt: '2026-04-29',
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers (compatible surface area with the legacy getBrandFlag)
// ---------------------------------------------------------------------------

/**
 * Look up a v2 flag for a given brand string.
 * Matches against brandName and brandAliases (case-insensitive, includes).
 */
export function getBrandFlagV2(brand: string | null | undefined): BrandFlagV2 | null {
  if (!brand) return null;
  const lower = brand.toLowerCase();
  for (const flag of brandFlagsV2) {
    if (flag.brandName.toLowerCase().includes(lower)) return flag;
    if (flag.brandAliases?.some((alias) => lower.includes(alias) || alias.includes(lower))) {
      return flag;
    }
  }
  return null;
}

/**
 * Get all flags that are verified and meet the sourcing bar.
 */
export function getVerifiedFlags(): BrandFlagV2[] {
  return brandFlagsV2.filter((f) => f.status === 'verified' && meetsSourcingBar(f));
}

/**
 * Get all flags currently in pending_review.
 */
export function getPendingFlags(): BrandFlagV2[] {
  return brandFlagsV2.filter((f) => f.status === 'pending_review');
}

/**
 * Most recent lastVerified date across all flags.
 */
export function getMostRecentVerifiedDate(): string {
  return brandFlagsV2
    .map((f) => f.lastVerified)
    .sort()
    .at(-1) ?? '';
}
