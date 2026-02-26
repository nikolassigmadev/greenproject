// Brand-level labor and ethics flags from independent research.
// These overlay on top of OpenFoodFacts data which lacks labor information.
//
// HOW TO ADD A NEW FLAG:
//   1. Add the brand name (lowercase) as a key
//   2. Fill in the flag details — severity, allegation, and sources
//   3. The app will automatically match products by brand name
//
// Severity levels:
//   "critical"  — Documented forced labor, child labor, or slavery
//   "high"      — Serious allegations with credible evidence
//   "medium"    — Ongoing concerns or unresolved investigations

export interface BrandFlag {
  severity: "critical" | "high" | "medium";
  allegation: string;
  sources: string[];
}

// Keys are lowercase brand names. When matching, the product brand
// is lowercased and checked with `includes` so "Nestlé S.A." matches "nestlé".
export const brandFlags: Record<string, BrandFlag> = {
  "nestlé": {
    severity: "critical",
    allegation:
      "Nestlé has faced multiple lawsuits and investigations alleging the use of child labor and forced labor in its cocoa supply chain in West Africa, including a U.S. Supreme Court case (Nestlé USA v. Doe, 2021).",
    sources: [
      "U.S. Department of Labor — List of Goods Produced by Child Labor",
      "International Labour Rights Forum",
      "Nestlé USA, Inc. v. Doe (Supreme Court, 2021)",
    ],
  },
  "nestle": {
    severity: "critical",
    allegation:
      "Nestlé has faced multiple lawsuits and investigations alleging the use of child labor and forced labor in its cocoa supply chain in West Africa, including a U.S. Supreme Court case (Nestlé USA v. Doe, 2021).",
    sources: [
      "U.S. Department of Labor — List of Goods Produced by Child Labor",
      "International Labour Rights Forum",
      "Nestlé USA, Inc. v. Doe (Supreme Court, 2021)",
    ],
  },
};

/**
 * Look up a labor/ethics flag for a given brand string.
 * Returns the flag if found, or null if the brand has no flag.
 */
export function getBrandFlag(brand: string | null | undefined): BrandFlag | null {
  if (!brand) return null;
  const lower = brand.toLowerCase();
  for (const [key, flag] of Object.entries(brandFlags)) {
    if (lower.includes(key)) return flag;
  }
  return null;
}
