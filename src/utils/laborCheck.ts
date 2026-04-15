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
    // Nestlé + all sub-brands / product lines
    brandPattern: /nestl[eé]|nestle\s*(s\.?a\.?|corp|company|group)?|kit\s?kat|nescaf[eé]|maggi|nespresso|cheerios|gerber|purina|perrier|san pellegrino|häagen.?dazs|dreyer'?s?|edy'?s?|stouffer'?s?|lean cuisine|lean pocket|hot pocket|digiorno|tombstone|buitoni|carnation|coffee.?mate|milo|nesquik|butterfinger|baby ruth|raisinets|sno.?cap|after eight|smarties|aero|lion bar|polo mint|quality street|rowntree|cailler|toll.?house|powerbar|boost|resource|optifast|novasource|gerber|jenny craig/i,
    parentCompany: "Nestlé",
    allegations: [
      { issue: "Child Labor in Cocoa Supply Chain", details: "Nestlé has faced ongoing lawsuits and reports regarding child labor in cocoa farms in Côte d'Ivoire and Ghana. A 2020 University of Chicago study found 1.56 million children working in cocoa production in these countries.", source: "U.S. Department of Labor", sourceUrl: "https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods", year: "2020" },
      { issue: "Forced Labor in Thai Fishing Industry", details: "Nestlé's own internal investigation found forced labor in its Thai seafood supply chain, including workers being held against their will on fishing boats.", source: "Associated Press Investigation", sourceUrl: "https://www.ap.org/explore/seafood-from-slaves/", year: "2015" },
      { issue: "Coffee Supply Chain Labor Abuses", details: "Reports have linked Nestlé's coffee supply chain to forced labor conditions on Brazilian coffee farms.", source: "Danwatch Investigation", sourceUrl: "https://danwatch.dk/en/", year: "2016" },
    ],
  },
  {
    // Coca-Cola Company + all sub-brands
    brandPattern: /coca.?cola|coke\b|the coca.?cola company|sprite|fanta|minute maid|dasani|powerade|vitaminwater|vitamin water|simply (orange|lemonade|apple)|honest tea|fuze|schweppes|glaceau|smartwater|smart water|bodyarmor|body armor|topo chico|barq'?s?|mello yello|pibb|mr\.? pibb|del valle|gold peak|inca kola|thums up|fairlife|costa coffee/i,
    parentCompany: "The Coca-Cola Company",
    allegations: [
      { issue: "Sugar Supply Chain Child Labor", details: "Coca-Cola's sugar supply chain has been linked to child labor in sugarcane fields in countries including the Philippines, El Salvador, and Brazil.", source: "U.S. Department of Labor", sourceUrl: "https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods", year: "2018" },
      { issue: "Labor Rights Violations in Colombia", details: "Reports of violence against union workers at Coca-Cola bottling plants in Colombia, including threats and killings of labor organizers.", source: "Human Rights Watch", sourceUrl: "https://www.hrw.org/", year: "2008" },
    ],
  },
  {
    // PepsiCo + all sub-brands
    brandPattern: /pepsi(co)?(\s*(inc\.?|corp\.?|company))?|lay'?s|lays\b|doritos|cheetos|tostitos|fritos|frito.?lay|quaker|gatorade|tropicana|7.?up|mountain dew|mirinda|ruffles|walkers\s*crisp|sun\s*chips|aquafina|naked juice|rockstar energy|mug root beer|sierra mist|starry\b|smartfood|sabra|stacy'?s pita|bare snacks|off the eaten path/i,
    parentCompany: "PepsiCo",
    allegations: [
      { issue: "Palm Oil Supply Chain Labor Abuses", details: "PepsiCo's palm oil suppliers in Indonesia have been linked to child labor and forced labor on palm oil plantations.", source: "Amnesty International", sourceUrl: "https://www.amnesty.org/en/latest/news/2016/11/palm-oil-global-brands-profiting-from-child-and-forced-labour/", year: "2016" },
      { issue: "Sugarcane Supply Chain Child Labor", details: "PepsiCo's sugar supply chain in Brazil has been connected to exploitative labor conditions, including child labor in sugarcane harvesting.", source: "U.S. Department of Labor", sourceUrl: "https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods", year: "2018" },
    ],
  },
  {
    // Mars, Inc. + all sub-brands / Wrigley
    brandPattern: /\bmars\b|mars\s*(inc\.?|incorporated|chocolate|petcare|food)?|m\s*&\s*m'?s?|snickers|twix|milky way|bounty\s*bar|skittles|starburst|dove\s*chocolate|galaxy\s*chocolate|maltesers|uncle ben'?s?|ben'?s original|pedigree\b|whiskas|royal canin|iams\b|eukanuba|cesar\s*dog|chapstick|extra\s*gum|orbit\s*gum|doublemint|eclipse\s*gum|airwaves|wrigley'?s?|juicy fruit|hubba bubba|altoids|lifesavers|5\s*gum/i,
    parentCompany: "Mars, Inc.",
    allegations: [
      { issue: "Child Labor in Cocoa Supply Chain", details: "Mars has been named in reports documenting child labor in West African cocoa farms. Despite pledges to eliminate child labor, progress has been slow.", source: "Washington Post Investigation", sourceUrl: "https://www.washingtonpost.com/graphics/2019/business/hershey-nestle-mars-chocolate-child-labor-west-africa/", year: "2019" },
      { issue: "Forced Labor in Palm Oil", details: "Mars' palm oil supply chain has been linked to forced labor and exploitation on plantations in Southeast Asia.", source: "Amnesty International", sourceUrl: "https://www.amnesty.org/en/latest/news/2016/11/palm-oil-global-brands-profiting-from-child-and-forced-labour/", year: "2016" },
    ],
  },
  {
    // Mondelēz International (formerly Kraft Foods) + all sub-brands
    brandPattern: /mondel[eē]z|mondelez(\s*(international|inc\.?|corp\.?))?|kraft\s*foods|nabisco|oreo|cadbury|toblerone|milka|ritz\s*crackers|lu\s*biscuit|belvita|tang\b|trident\s*gum|philadelphia\s*cream|halls\b|chips\s*ahoy|triscuit|wheat\s*thins|sour\s*patch|swedish\s*fish|mike\s*and\s*ike|dentyne|chiclets|stride\s*gum|newtons\b|nutter\s*butter|barnum'?s|honey\s*maid|club\s*social|jacobs\s*coffee|tassimo|velveeta|a1\s*sauce|grey\s*poupon/i,
    parentCompany: "Mondelēz International",
    allegations: [
      { issue: "Child Labor in Cocoa Supply Chain", details: "Mondelēz (formerly Kraft Foods) has been linked to child labor in cocoa production in Ghana and Côte d'Ivoire. A 2020 report found the company still had significant child labor in its supply chain.", source: "International Rights Advocates", sourceUrl: "https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods", year: "2021" },
    ],
  },
  {
    // Ferrero Group + all sub-brands
    brandPattern: /ferrero(\s*(group|rocher|spa))?|nutella|kinder(\s*(bueno|surprise|joy|chocolate|schoko|country))?|tic\s*tac|raffaello|duplo\s*chocolate|hanuta|mon\s*ch[eé]ri|rocher\b|pocket\s*coffee|rondnoir|gran\s*rocher/i,
    parentCompany: "Ferrero Group",
    allegations: [
      { issue: "Hazelnut Supply Chain Child Labor", details: "Ferrero's hazelnut supply chain in Turkey has been linked to child labor, with children as young as 6 working during harvest season.", source: "BBC Investigation / Fair Labor Association", sourceUrl: "https://www.fairlabor.org/", year: "2019" },
      { issue: "Palm Oil Supply Chain Abuses", details: "Ferrero has faced criticism over palm oil sourcing linked to deforestation and labor exploitation in Indonesia and Malaysia.", source: "Rainforest Action Network", sourceUrl: "https://www.ran.org/", year: "2018" },
    ],
  },
  {
    // Unilever + all sub-brands
    brandPattern: /unilever(\s*(plc|nv|corp\.?|company))?|dove\b|axe\s*(deodorant|body)?|lynx\b|lipton\b|knorr\b|hellmann'?s?|ben\s*&\s*jerry'?s?|breyer'?s?|magnum\s*(ice cream|bar)|cornetto|heartbrand|flora\s*(margarine)?|becel|rama\s*margarine|vaseline|persil\b|surf\s*(laundry|detergent)?|omo\b|comfort\s*fabric|domestos|cif\b|sunlight\b|sunsilk|tresemm[eé]|clear\s*shampoo|pond'?s?\b|rexona|lux\b|signal\s*toothpaste|closeup\s*toothpaste|talenti|so\s*delicious|seventh\s*generation|7th\s*generation|pukka\s*herbs|t2\s*tea|marmite|bovril|colman'?s?|lea\s*&\s*perrins|pot\s*noodle|slim.?fast/i,
    parentCompany: "Unilever",
    allegations: [
      { issue: "Tea Plantation Labor Abuses", details: "Workers on Unilever's tea plantations in Kenya reported poverty wages, unsafe conditions, and sexual harassment.", source: "BBC Investigation", sourceUrl: "https://www.bbc.com/news/", year: "2019" },
      { issue: "Palm Oil Supply Chain Forced Labor", details: "Unilever's palm oil suppliers have been linked to forced labor, debt bondage, and child labor in Indonesia.", source: "Amnesty International", sourceUrl: "https://www.amnesty.org/en/latest/news/2016/11/palm-oil-global-brands-profiting-from-child-and-forced-labour/", year: "2016" },
    ],
  },
  {
    // The Hershey Company + all sub-brands
    brandPattern: /hershey'?s?(\s*(company|co\.?|chocolate|foods))?|the\s*hershey|reese'?s?(\s*(pieces|peanut|cup))?|hershey\s*kiss(es)?|twizzler'?s?|jolly\s*rancher|ice\s*breakers|brookside\b|almond\s*joy|mounds\b|york\s*(peppermint)?|heath\s*bar|payday\s*bar|whoppers\b|symphony\b|special\s*dark|good\s*&\s*plenty|milk\s*duds|rolo\b|caramello|skor\b|take\s*5/i,
    parentCompany: "The Hershey Company",
    allegations: [
      { issue: "Child Labor in Cocoa Supply Chain", details: "Hershey has faced persistent criticism for child labor in its West African cocoa supply chain, with children performing hazardous work including using machetes and carrying heavy loads.", source: "Washington Post Investigation", sourceUrl: "https://www.washingtonpost.com/graphics/2019/business/hershey-nestle-mars-chocolate-child-labor-west-africa/", year: "2019" },
    ],
  },
  {
    // Danone + all sub-brands
    brandPattern: /danone(\s*(s\.?a\.?|group|corp\.?|company))?|dannon\b|activia\b|evian\b|volvic\b|aptamil\b|nutricia\b|alpro\b|silk\s*(milk|soy|almond)?|oikos\b|actimel|danonino|babybel|la\s*serre|blédina|cow\s*&\s*gate|karicare|nutrilon|dumex|international\s*delight|stonyfield|follow\s*your\s*heart|vega\b/i,
    parentCompany: "Danone",
    allegations: [
      { issue: "Supply Chain Labor Concerns", details: "Danone has faced criticism over labor conditions in its dairy supply chains, including low wages for farmworkers in developing markets.", source: "Oxfam Behind the Brands Report", sourceUrl: "https://www.oxfam.org/en/tags/behind-brands", year: "2018" },
    ],
  },
  {
    // Kellogg Company / Kellanova + all sub-brands
    brandPattern: /kellogg'?s?(\s*(company|co\.?|corp\.?))?|kellanova\b|corn\s*flakes|frosted\s*flakes|froot\s*loops|fruit\s*loops|rice\s*krispies|pop.?tarts|eggo\b|cheez.?it|pringles\b|morningstar\s*farms|special\s*k|nutri.?grain|krave\s*cereal|bear\s*naked|rxbar|rx\s*bar|famous\s*amos|keebler|club\s*crackers|town\s*house|fudge\s*stripe|mini.?wheat|all.?bran|cracklin\s*oat|raisin\s*bran|apple\s*jacks|coco\s*pops|crunchy\s*nut|vector\b/i,
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
