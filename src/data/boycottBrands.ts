/**
 * Brands associated with companies on the BDS boycott list.
 * Source: https://boycott-israel.org/boycott.html
 *
 * This file maps normalised brand‑name fragments to a short reason.
 * Matching is case-insensitive and uses "includes" so sub-strings work
 * (e.g. "coca" matches "Coca-Cola", "The Coca-Cola Company", etc.)
 */

export interface BoycottMatch {
  /** The parent company or brand group */
  parent: string;
  /** One-line reason / note */
  reason: string;
}

// Each key is a LOWERCASE fragment that will be matched against the product brand.
// Keep fragments short enough to catch variations but long enough to avoid false positives.
const boycottMap: Record<string, BoycottMatch> = {
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
  "walkers":     { parent: "PepsiCo", reason: "PepsiCo subsidiary" },

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
  "dove":        { parent: "Unilever", reason: "Unilever subsidiary" },
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

/**
 * Check whether a brand name matches any boycotted brand.
 * Returns the match info or null.
 */
export function checkBoycott(brand: string | undefined | null): BoycottMatch | null {
  if (!brand) return null;
  const lower = brand.toLowerCase();

  for (const [fragment, match] of Object.entries(boycottMap)) {
    if (lower.includes(fragment)) {
      return match;
    }
  }
  return null;
}
