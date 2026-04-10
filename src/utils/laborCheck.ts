// Shared labor allegations database — single source of truth used by both the
// product detail page and the basket, so they always show the same data.

export interface LaborAllegation {
  issue: string;
  details: string;
  source: string;
  sourceUrl: string;
  year: string;
}

interface BrandLaborRecord {
  brandPattern: RegExp;
  parentCompany: string;
  allegations: LaborAllegation[];
}

const LABOR_DATABASE: BrandLaborRecord[] = [
  {
    brandPattern: /nestl[eé]|kit\s?kat|nescaf[eé]|maggi|nespresso|cheerios|gerber|purina|perrier|san pellegrino|häagen.?dazs|dreyer|stouffer|lean cuisine|digiorno|tombstone|buitoni|carnation|coffee.?mate|milo|nesquik/i,
    parentCompany: "Nestlé",
    allegations: [
      { issue: "Child Labor in Cocoa Supply Chain", details: "Nestlé has faced ongoing lawsuits and reports regarding child labor in cocoa farms in Côte d'Ivoire and Ghana. A 2020 University of Chicago study found 1.56 million children working in cocoa production in these countries.", source: "U.S. Department of Labor", sourceUrl: "https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods", year: "2020" },
      { issue: "Forced Labor in Thai Fishing Industry", details: "Nestlé's own internal investigation found forced labor in its Thai seafood supply chain, including workers being held against their will on fishing boats.", source: "Associated Press Investigation", sourceUrl: "https://www.ap.org/explore/seafood-from-slaves/", year: "2015" },
      { issue: "Coffee Supply Chain Labor Abuses", details: "Reports have linked Nestlé's coffee supply chain to forced labor conditions on Brazilian coffee farms.", source: "Danwatch Investigation", sourceUrl: "https://danwatch.dk/en/", year: "2016" },
    ],
  },
  {
    brandPattern: /coca.?cola|sprite|fanta|minute maid|dasani|powerade|vitaminwater|simply|honest tea|fuze/i,
    parentCompany: "The Coca-Cola Company",
    allegations: [
      { issue: "Sugar Supply Chain Child Labor", details: "Coca-Cola's sugar supply chain has been linked to child labor in sugarcane fields in countries including the Philippines, El Salvador, and Brazil.", source: "U.S. Department of Labor", sourceUrl: "https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods", year: "2018" },
      { issue: "Labor Rights Violations in Colombia", details: "Reports of violence against union workers at Coca-Cola bottling plants in Colombia, including threats and killings of labor organizers.", source: "Human Rights Watch", sourceUrl: "https://www.hrw.org/", year: "2008" },
    ],
  },
  {
    brandPattern: /pepsi|lay'?s|doritos|cheetos|tostitos|fritos|quaker|gatorade|tropicana|7.?up|mountain dew|mirinda|ruffles|walkers|sun chips/i,
    parentCompany: "PepsiCo",
    allegations: [
      { issue: "Palm Oil Supply Chain Labor Abuses", details: "PepsiCo's palm oil suppliers in Indonesia have been linked to child labor and forced labor on palm oil plantations.", source: "Amnesty International", sourceUrl: "https://www.amnesty.org/en/latest/news/2016/11/palm-oil-global-brands-profiting-from-child-and-forced-labour/", year: "2016" },
      { issue: "Sugarcane Supply Chain Child Labor", details: "PepsiCo's sugar supply chain in Brazil has been connected to exploitative labor conditions, including child labor in sugarcane harvesting.", source: "U.S. Department of Labor", sourceUrl: "https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods", year: "2018" },
    ],
  },
  {
    brandPattern: /mars|m&m|snickers|twix|milky way|bounty|skittles|starburst|dove chocolate|galaxy|maltesers|uncle ben|ben'?s original|pedigree|whiskas|royal canin/i,
    parentCompany: "Mars, Inc.",
    allegations: [
      { issue: "Child Labor in Cocoa Supply Chain", details: "Mars has been named in reports documenting child labor in West African cocoa farms. Despite pledges to eliminate child labor, progress has been slow.", source: "Washington Post Investigation", sourceUrl: "https://www.washingtonpost.com/graphics/2019/business/hershey-nestle-mars-chocolate-child-labor-west-africa/", year: "2019" },
      { issue: "Forced Labor in Palm Oil", details: "Mars' palm oil supply chain has been linked to forced labor and exploitation on plantations in Southeast Asia.", source: "Amnesty International", sourceUrl: "https://www.amnesty.org/en/latest/news/2016/11/palm-oil-global-brands-profiting-from-child-and-forced-labour/", year: "2016" },
    ],
  },
  {
    brandPattern: /mondelez|oreo|cadbury|toblerone|milka|ritz|lu|belvita|tang|trident|philadelphia|halls|chips ahoy|triscuit|wheat thins|sour patch/i,
    parentCompany: "Mondelēz International",
    allegations: [
      { issue: "Child Labor in Cocoa Supply Chain", details: "Mondelēz (formerly Kraft Foods) has been linked to child labor in cocoa production in Ghana and Côte d'Ivoire. A 2020 report found the company still had significant child labor in its supply chain.", source: "International Rights Advocates", sourceUrl: "https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods", year: "2021" },
    ],
  },
  {
    brandPattern: /ferrero|nutella|kinder|tic tac|ferrero rocher|raffaello|duplo|hanuta/i,
    parentCompany: "Ferrero Group",
    allegations: [
      { issue: "Hazelnut Supply Chain Child Labor", details: "Ferrero's hazelnut supply chain in Turkey has been linked to child labor, with children as young as 6 working during harvest season.", source: "BBC Investigation / Fair Labor Association", sourceUrl: "https://www.fairlabor.org/", year: "2019" },
      { issue: "Palm Oil Supply Chain Abuses", details: "Ferrero has faced criticism over palm oil sourcing linked to deforestation and labor exploitation in Indonesia and Malaysia.", source: "Rainforest Action Network", sourceUrl: "https://www.ran.org/", year: "2018" },
    ],
  },
  {
    brandPattern: /unilever|dove|axe|lynx|lipton|knorr|hellmann|ben.?jerry|breyer|magnum|cornetto|heartbrand|flora|becel|rama|vaseline|persil|surf|omo|comfort|domestos/i,
    parentCompany: "Unilever",
    allegations: [
      { issue: "Tea Plantation Labor Abuses", details: "Workers on Unilever's tea plantations in Kenya reported poverty wages, unsafe conditions, and sexual harassment.", source: "BBC Investigation", sourceUrl: "https://www.bbc.com/news/", year: "2019" },
      { issue: "Palm Oil Supply Chain Forced Labor", details: "Unilever's palm oil suppliers have been linked to forced labor, debt bondage, and child labor in Indonesia.", source: "Amnesty International", sourceUrl: "https://www.amnesty.org/en/latest/news/2016/11/palm-oil-global-brands-profiting-from-child-and-forced-labour/", year: "2016" },
    ],
  },
  {
    brandPattern: /hershey|reese|kisses|twizzler|jolly rancher|ice breaker|brookside|almond joy|mounds|york|kit kat/i,
    parentCompany: "The Hershey Company",
    allegations: [
      { issue: "Child Labor in Cocoa Supply Chain", details: "Hershey has faced persistent criticism for child labor in its West African cocoa supply chain, with children performing hazardous work including using machetes and carrying heavy loads.", source: "Washington Post Investigation", sourceUrl: "https://www.washingtonpost.com/graphics/2019/business/hershey-nestle-mars-chocolate-child-labor-west-africa/", year: "2019" },
    ],
  },
  {
    brandPattern: /danone|activia|evian|volvic|aptamil|nutricia|alpro|silk|oikos|actimel/i,
    parentCompany: "Danone",
    allegations: [
      { issue: "Supply Chain Labor Concerns", details: "Danone has faced criticism over labor conditions in its dairy supply chains, including low wages for farmworkers in developing markets.", source: "Oxfam Behind the Brands Report", sourceUrl: "https://www.oxfam.org/en/tags/behind-brands", year: "2018" },
    ],
  },
  {
    brandPattern: /kellogg|corn flakes|frosted flakes|froot loops|rice krispies|pop.?tarts|eggo|cheez.?it|pringles|morningstar/i,
    parentCompany: "Kellogg Company",
    allegations: [
      { issue: "Palm Oil Supply Chain Labor Abuses", details: "Kellogg's palm oil suppliers have been linked to child labor and forced labor in Indonesia and Guatemala.", source: "Amnesty International", sourceUrl: "https://www.amnesty.org/en/latest/news/2016/11/palm-oil-global-brands-profiting-from-child-and-forced-labour/", year: "2016" },
      { issue: "Sugarcane Supply Chain", details: "Reports have linked Kellogg's sugar suppliers to exploitative labor in sugarcane harvesting in developing countries.", source: "U.S. Department of Labor", sourceUrl: "https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods", year: "2020" },
    ],
  },
];

export interface LaborRecord {
  parentCompany: string;
  allegations: LaborAllegation[];
}

/**
 * Check brand + product name against the labor database using the same regex
 * matching used on the product detail page.
 */
export function findLaborAllegations(
  brand: string | null | undefined,
  productName: string | null | undefined,
): LaborRecord | null {
  const text = `${brand || ""} ${productName || ""}`.toLowerCase();
  for (const record of LABOR_DATABASE) {
    if (record.brandPattern.test(text)) {
      return { parentCompany: record.parentCompany, allegations: record.allegations };
    }
  }
  return null;
}

/** Convenience: returns allegation count (0 if none). */
export function getLaborAllegationCount(
  brand: string | null | undefined,
  productName: string | null | undefined,
): number {
  return findLaborAllegations(brand, productName)?.allegations.length ?? 0;
}
