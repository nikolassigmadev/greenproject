// Brand → parent company.
//
// WHY THIS EXISTS. We cannot research thousands of brands, and we don't have
// to: a relatively small number of groups own most of what sits on a
// supermarket shelf. Researching one parent properly and inheriting the result
// to its brands buys far more coverage than the same hours spent brand by
// brand.
//
// WHAT IT DOES NOT DO. It does not create findings. It resolves a brand to a
// parent so the EXISTING flag lookups can be run against the parent name too.
// If we hold nothing on Nestlé, mapping KitKat to Nestlé still yields nothing —
// this widens the key, never the claim.
//
// A CAVEAT MEASURED, NOT ASSUMED. The premise "a dozen conglomerates own most
// packaged food" is true of US and UK supermarket shelves. It is much weaker on
// the Open Food Facts corpus, which is heavily French, North African and
// Indonesian: the biggest single gap in our coverage sample was Jaouda, a
// Moroccan dairy group owned by nobody on this list. So this table helps, and
// it is not the silver bullet it looks like. See
// docs/sourced-signal-coverage.md for the measured lift.
//
// SOURCING. Corporate ownership is a matter of public record (company filings,
// investor relations pages, regulatory merger approvals). Entries here are
// limited to ownership that is well documented and stable. Ownership changes —
// brands are bought and sold constantly — so this table needs a review date,
// and an entry that has gone stale is a wrong answer, not a missing one.

export const PARENT_COMPANY_REVIEWED_ON = '2026-08-18';

export interface ParentEntry {
  /** Canonical parent name, used as the lookup key for existing flag data. */
  parent: string;
  /** Brand-name patterns owned by that parent. Matched case-insensitively. */
  brands: RegExp;
}

export const PARENT_COMPANIES: ParentEntry[] = [
  {
    parent: 'Nestlé',
    brands: /\b(nestl[ée]|kit\s?kat|nescaf[ée]|nespresso|maggi|milkybar|smarties|aero|cheerios|shreddies|garden gourmet|purina|felix|gerber|perrier|s\.?pellegrino|vittel|buitoni|h[äa]agen[- ]dazs)\b/i,
  },
  {
    parent: 'Unilever',
    brands: /\b(unilever|knorr|hellmann'?s|magnum|ben\s*&\s*jerry|cornetto|lipton|pg tips|marmite|colman'?s|dove|axe|lynx|domestos|cif|persil|comfort|wall'?s)\b/i,
  },
  {
    parent: 'PepsiCo',
    brands: /\b(pepsi|lay'?s|walkers|doritos|cheetos|quaker|tropicana|gatorade|7up|mountain dew|ruffles|sunbites|naked juice)\b/i,
  },
  {
    parent: 'The Coca-Cola Company',
    brands: /\b(coca[- ]?cola|coke|fanta|sprite|schweppes|minute maid|innocent|powerade|costa coffee|dasani|smartwater)\b/i,
  },
  {
    parent: 'Mondelēz',
    brands: /\b(mondel[eē]z|cadbury|milka|oreo|toblerone|c[ôo]te d'?or|lu\b|belvita|philadelphia|ritz|tuc\b|daim|prince\b|halls)\b/i,
  },
  {
    parent: 'Mars',
    brands: /\b(mars|snickers|twix|bounty|m&m'?s|maltesers|milky way|galaxy|skittles|extra gum|orbit|dolmio|uncle ben'?s|ben'?s original|pedigree|whiskas|royal canin)\b/i,
  },
  {
    parent: 'Ferrero',
    brands: /\b(ferrero|nutella|kinder|tic\s?tac|rocher|raffaello|thorntons|butterfinger)\b/i,
  },
  {
    parent: 'Danone',
    brands: /\b(danone|activia|actimel|alpro|evian|volvic|badoit|danette|aptamil|cow\s*&\s*gate|oikos|light\s*&\s*free)\b/i,
  },
  {
    parent: 'Kellanova / WK Kellogg',
    brands: /\b(kellogg'?s|kellanova|pringles|special k|corn flakes|coco pops|rice krispies|frosties|crunchy nut|nutri[- ]grain|pop[- ]tarts)\b/i,
  },
  {
    parent: 'General Mills',
    brands: /\b(general mills|h[äa]agen|old el paso|nature valley|yoplait|betty crocker|cheerios|fibre one|fiber one)\b/i,
  },
  {
    parent: 'Kraft Heinz',
    brands: /\b(kraft|heinz|hp sauce|lea\s*&\s*perrins|philadelphia|capri[- ]sun|weight watchers)\b/i,
  },
  {
    parent: 'Procter & Gamble',
    brands: /\b(procter|p&g|pampers|ariel|fairy|gillette|head\s*&\s*shoulders|oral[- ]b|always|tampax|febreze)\b/i,
  },
  {
    parent: 'JBS',
    brands: /\b(jbs|swift|pilgrim'?s|seara|friboi|moy park)\b/i,
  },
  {
    parent: 'Tyson Foods',
    brands: /\b(tyson|jimmy dean|hillshire|ball park|aidells)\b/i,
  },
  // ── Groups that showed up in the coverage sample and are not on the usual
  //    "big twelve" list. Included because the measurement named them, which is
  //    the whole point of measuring first.
  {
    parent: 'Barilla Group',
    brands: /\b(barilla|wasa|harrys|misko|filiz|pasta evangelists)\b/i,
  },
  {
    parent: 'Post Holdings',
    brands: /\b(weetabix|alpen|ready brek|post consumer|honey bunches)\b/i,
  },
  {
    parent: 'Suntory',
    brands: /\b(suntory|orangina|oasis|lucozade|ribena|schweppes france)\b/i,
  },
  {
    parent: 'Ebro Foods',
    brands: /\b(ebro|lustucru|panzani|tilda|garofalo|riviana)\b/i,
  },
  {
    parent: 'Indofood',
    brands: /\b(indofood|indomie|sarimi|supermi|pop mie)\b/i,
  },
  {
    parent: 'Lactalis',
    brands: /\b(lactalis|pr[ée]sident|galbani|parmalat|seriously strong|leerdammer)\b/i,
  },
  {
    parent: 'Otsuka / Nutrition & Santé',
    brands: /\b(gerbl[ée]|bjorg|isostar|milical)\b/i,
  },
];

/**
 * Resolve a brand string to its parent company, or null.
 *
 * Open Food Facts `brands` is free text and often a comma-separated list
 * ("Nutella, Ferrero, Yum yum"), so every part is checked rather than just the
 * first — the parent is frequently not the first entry.
 */
export function findParentCompany(brand: string | null | undefined): string | null {
  if (!brand) return null;
  const parts = brand.split(',').map((s) => s.trim()).filter(Boolean);
  const candidates = [brand, ...parts];
  for (const entry of PARENT_COMPANIES) {
    if (candidates.some((c) => entry.brands.test(c))) return entry.parent;
  }
  return null;
}
