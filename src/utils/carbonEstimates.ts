// Carbon estimates from an eco-grade — the single source of truth.
//
// This ladder used to be copy-pasted into six modules (scan history, basket,
// the home impact card, the swap engine, the swap cards). The copies drifted:
// none of them knew about grade "f", which Open Food Facts serves for the worst
// products under the Green-Score, so an F-graded product silently dropped out
// of every CO₂ total instead of counting as the worst case.

/**
 * kg CO₂e per kg of product, estimated from the eco-grade when Open Food Facts
 * has no measured figure. A–E are the long-standing app estimates; "a-plus" and
 * "f" are the Green-Score's extra bands, extrapolated along the same curve
 * (each step grows by roughly a third towards the bottom).
 */
export const GRADE_CO2_KG: Record<string, number> = {
  "a-plus": 0.3, a: 0.5, b: 1.2, c: 2.5, d: 4.0, e: 6.0, f: 8.0,
};

/** kg CO₂e per kg for a "typical" product — grade C, the middle of the ladder. */
export const BASELINE_CO2_KG = 2.5;

/** Assumed mass of one scanned product, for turning per-kg figures into totals. */
export const SERVING_KG = 0.25;

/** Estimated kg CO₂e per kg for a grade, or null when the grade is unknown. */
export function gradeCo2PerKg(grade: string | null | undefined): number | null {
  if (!grade) return null;
  return GRADE_CO2_KG[grade.toLowerCase()] ?? null;
}
