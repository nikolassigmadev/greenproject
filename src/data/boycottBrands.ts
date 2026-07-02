/**
 * Brands associated with companies on the BDS boycott list.
 * Source: https://boycott-israel.org/boycott.html
 *
 * This file maps normalised brand-name fragments to a short reason.
 * Matching is case-insensitive, diacritic/apostrophe-insensitive, and
 * WHOLE-WORD: a fragment must not sit inside a longer word, so "axe" cannot
 * match "Waxelene" and "tempo" cannot match "Contempo". A trailing plural /
 * possessive "s" is tolerated ("mcdonald" still matches "McDonalds").
 */

export interface BoycottMatch {
  /** The parent company or brand group */
  parent: string;
  /** One-line reason / note */
  reason: string;
}

interface BoycottEntry extends BoycottMatch {
  /**
   * False-positive guard: skip the match when this pattern ALSO appears in the
   * brand (e.g. "walkers" must not flag the independent Walkers Shortbread).
   */
  exclude?: RegExp;
}

// Each key is a LOWERCASE fragment that will be matched against the product brand.
// Keep fragments short enough to catch variations but long enough to avoid false positives.
const boycottMap: Record<string, BoycottEntry> = {
  // ── Food & Beverages ──────────────────────────
  "coca-cola":   { parent: "The Coca-Cola Company", reason: "Operates in Israel through Central Bottling Company" },
  "coca cola":   { parent: "The Coca-Cola Company", reason: "Operates in Israel through Central Bottling Company" },
  "sprite":      { parent: "The Coca-Cola Company", reason: "Coca-Cola subsidiary" },
  "fanta":       { parent: "The Coca-Cola Company", reason: "Coca-Cola subsidiary" },
  "powerade":    { parent: "The Coca-Cola Company", reason: "Coca-Cola subsidiary" },
  "minute maid": { parent: "The Coca-Cola Company", reason: "Coca-Cola subsidiary" },
  "dasani":      { parent: "The Coca-Cola Company", reason: "Coca-Cola subsidiary" },
  "fuze":        { parent: "The Coca-Cola Company", reason: "Coca-Cola subsidiary" },

  "pepsi":       { parent: "PepsiCo", reason: "Owns SodaStream, operates in Israel" },
  "pepsico":     { parent: "PepsiCo", reason: "Owns SodaStream, operates in Israel" },
  "sodastream":  { parent: "PepsiCo", reason: "PepsiCo subsidiary, manufactured in Israel" },
  "mountain dew":{ parent: "PepsiCo", reason: "PepsiCo subsidiary" },
  "7 up":        { parent: "PepsiCo", reason: "PepsiCo subsidiary" },
  "7up":         { parent: "PepsiCo", reason: "PepsiCo subsidiary" },
  "mirinda":     { parent: "PepsiCo", reason: "PepsiCo subsidiary" },
  "gatorade":    { parent: "PepsiCo", reason: "PepsiCo subsidiary" },
  "tropicana":   { parent: "PepsiCo", reason: "PepsiCo subsidiary" },
  "rockstar energy": { parent: "PepsiCo", reason: "PepsiCo subsidiary" },
  "lay's":       { parent: "PepsiCo", reason: "PepsiCo subsidiary" },
  "doritos":     { parent: "PepsiCo", reason: "PepsiCo subsidiary" },
  "cheetos":     { parent: "PepsiCo", reason: "PepsiCo subsidiary" },
  "quaker":      { parent: "PepsiCo", reason: "PepsiCo subsidiary" },
  // Walkers crisps are PepsiCo; Walkers Shortbread is an unrelated independent
  // Scottish company and must never be flagged.
  "walkers":     { parent: "PepsiCo", reason: "PepsiCo subsidiary", exclude: /shortbread/ },

  "nestlé":      { parent: "Nestlé", reason: "Major investments and operations in Israel" },
  "nestle":      { parent: "Nestlé", reason: "Major investments and operations in Israel" },
  "nescafé":     { parent: "Nestlé", reason: "Nestlé subsidiary" },
  "nescafe":     { parent: "Nestlé", reason: "Nestlé subsidiary" },
  "nespresso":   { parent: "Nestlé", reason: "Nestlé subsidiary" },
  "perrier":     { parent: "Nestlé", reason: "Nestlé subsidiary" },
  "kit kat":     { parent: "Nestlé", reason: "Nestlé subsidiary" },
  "kitkat":      { parent: "Nestlé", reason: "Nestlé subsidiary" },
  "smarties":    { parent: "Nestlé", reason: "Nestlé subsidiary" },
  "häagen-dazs": { parent: "Nestlé", reason: "Nestlé subsidiary" },
  "haagen-dazs": { parent: "Nestlé", reason: "Nestlé subsidiary" },
  "haagen dazs": { parent: "Nestlé", reason: "Nestlé subsidiary" },
  "purina":      { parent: "Nestlé", reason: "Nestlé subsidiary" },
  "stouffer":    { parent: "Nestlé", reason: "Nestlé subsidiary" },
  "lean cuisine": { parent: "Nestlé", reason: "Nestlé subsidiary" },
  "milo":        { parent: "Nestlé", reason: "Nestlé subsidiary" },
  "nestea":      { parent: "Nestlé", reason: "Nestlé subsidiary" },
  "powerbar":    { parent: "Nestlé", reason: "Nestlé subsidiary" },
  "gerber":      { parent: "Nestlé", reason: "Nestlé subsidiary" },
  "cerelac":     { parent: "Nestlé", reason: "Nestlé subsidiary" },
  "nido":        { parent: "Nestlé", reason: "Nestlé subsidiary" },
  "maggi":       { parent: "Nestlé", reason: "Nestlé subsidiary" },
  "osem":        { parent: "Nestlé", reason: "Nestlé subsidiary, Israeli company" },

  "starbucks":   { parent: "Starbucks", reason: "On BDS boycott list" },

  "mcdonald":    { parent: "McDonald's", reason: "On BDS boycott list" },

  "sabra":       { parent: "Sabra / Strauss Group", reason: "Israeli company, Strauss Group subsidiary" },
  "strauss":     { parent: "Strauss Group", reason: "Israeli company supporting IDF" },
  "elite":       { parent: "Strauss Group", reason: "Strauss Group subsidiary" },

  "prigat":      { parent: "Tempo Beverages", reason: "Israeli company" },
  "tempo":       { parent: "Tempo Beverages", reason: "Israeli beverage company" },

  "tnuva":       { parent: "Tnuva", reason: "Israeli dairy company" },
  "tara dairy":  { parent: "Tara", reason: "Israeli dairy company" },
  "achva":       { parent: "Achva", reason: "Israeli food company" },

  "carrefour":   { parent: "Carrefour", reason: "Operations linked to Israeli settlements" },

  // ── Unilever & sub-brands ─────────────────────
  "unilever":    { parent: "Unilever", reason: "Operations in Israel" },
  "ben & jerry": { parent: "Unilever", reason: "Unilever subsidiary" },
  "ben and jerry": { parent: "Unilever", reason: "Unilever subsidiary" },
  "knorr":       { parent: "Unilever", reason: "Unilever subsidiary" },
  "hellmann":    { parent: "Unilever", reason: "Unilever subsidiary" },
  "magnum":      { parent: "Unilever", reason: "Unilever subsidiary" },
  // NOTE: "dove" is deliberately NOT listed. In a food-scanning app the brand
  // "Dove" is almost always Mars' Dove CHOCOLATE (see laborCheck.ts, which maps
  // "dove chocolate" to Mars); Unilever's Dove is personal care. A bare "dove"
  // fragment wrongly flagged Mars chocolate as a Unilever product.
  "axe":         { parent: "Unilever", reason: "Unilever subsidiary" },
  "rexona":      { parent: "Unilever", reason: "Unilever subsidiary" },
  "vaseline":    { parent: "Unilever", reason: "Unilever subsidiary" },
  "sunsilk":     { parent: "Unilever", reason: "Unilever subsidiary" },
  "wall's":      { parent: "Unilever", reason: "Unilever subsidiary" },
  "lipton":      { parent: "Unilever", reason: "Unilever subsidiary" },

  // ── L'Oréal & sub-brands ─────────────────────
  "l'oréal":     { parent: "L'Oréal", reason: "Investments in Israeli tech" },
  "l'oreal":     { parent: "L'Oréal", reason: "Investments in Israeli tech" },
  "loreal":      { parent: "L'Oréal", reason: "Investments in Israeli tech" },
  "lancôme":     { parent: "L'Oréal", reason: "L'Oréal subsidiary" },
  "lancome":     { parent: "L'Oréal", reason: "L'Oréal subsidiary" },
  "garnier":     { parent: "L'Oréal", reason: "L'Oréal subsidiary" },
  "maybelline":  { parent: "L'Oréal", reason: "L'Oréal subsidiary" },
  "kiehl":       { parent: "L'Oréal", reason: "L'Oréal subsidiary" },
  "cerave":      { parent: "L'Oréal", reason: "L'Oréal subsidiary" },
  "la roche-posay": { parent: "L'Oréal", reason: "L'Oréal subsidiary" },
  "nyx professional": { parent: "L'Oréal", reason: "L'Oréal subsidiary" },

  // ── Other notable brands ──────────────────────
  "ahava":       { parent: "AHAVA", reason: "Israeli cosmetics from occupied territories" },
  "puma":        { parent: "Puma", reason: "Sponsors Israel Football Association" },
  "zara":        { parent: "Inditex / Zara", reason: "On BDS boycott list" },
  "caterpillar": { parent: "Caterpillar", reason: "Equipment used in demolitions" },
};

/** Lowercase, strip diacritics ("Nestlé" → "nestle") and apostrophes ("Lay's" → "lays"). */
const normalizeBrand = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’‘`´]/g, '');

const isWordChar = (c: string | undefined): boolean => !!c && /[a-z0-9]/.test(c);

/**
 * Whole-word containment of `fragment` in `hay` (both already normalized).
 * A trailing "s" on the brand is tolerated so "mcdonald" matches "mcdonalds"
 * and "stouffer" matches "stouffers".
 */
function containsFragment(hay: string, fragment: string): boolean {
  let from = 0;
  while (true) {
    const idx = hay.indexOf(fragment, from);
    if (idx === -1) return false;
    let end = idx + fragment.length;
    if (hay[end] === 's') end++; // plural / possessive
    if (!isWordChar(hay[idx - 1]) && !isWordChar(hay[end])) return true;
    from = idx + 1;
  }
}

/**
 * Check whether a brand name matches any boycotted brand.
 * Returns the match info or null.
 */
export function checkBoycott(brand: string | undefined | null): BoycottMatch | null {
  if (!brand) return null;
  const hay = normalizeBrand(brand);

  for (const [fragment, entry] of Object.entries(boycottMap)) {
    if (!containsFragment(hay, normalizeBrand(fragment))) continue;
    if (entry.exclude && entry.exclude.test(hay)) continue;
    return { parent: entry.parent, reason: entry.reason };
  }
  return null;
}
