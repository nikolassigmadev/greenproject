// GoodScan — Ingredient flag matching service.
//
// Substring-matches the OpenFoodFacts ingredients text against the patterns
// declared in src/data/ingredientFlags.ts. Pure functions, no IO.

import { INGREDIENT_FLAGS, type IngredientFlag, type IngredientSeverity } from '@/data/ingredientFlags';

const SEVERITY_ORDER: Record<IngredientSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/**
 * Match ingredient flags against the ingredients text of an OpenFoodFacts product.
 *
 * - Lowercases input.
 * - For each flag, returns it if ANY of its `ingredientPatterns` is a substring match.
 * - Dedupes by flag id (only returned once even if multiple patterns match).
 * - Returns [] for null/undefined/empty/whitespace-only input.
 * - Sorted by severity (critical → low), then alphabetically by displayName.
 */
export function findIngredientFlagsInText(
  ingredientsText: string | null | undefined,
): IngredientFlag[] {
  if (!ingredientsText) return [];
  const normalized = ingredientsText.toLowerCase();
  if (!normalized.trim()) return [];

  const matched = new Map<string, IngredientFlag>();
  for (const flag of INGREDIENT_FLAGS) {
    if (matched.has(flag.id)) continue;
    for (const pattern of flag.ingredientPatterns) {
      if (!pattern) continue;
      if (normalized.includes(pattern.toLowerCase())) {
        matched.set(flag.id, flag);
        break;
      }
    }
  }

  return Array.from(matched.values()).sort((a, b) => {
    const sev = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (sev !== 0) return sev;
    return a.displayName.localeCompare(b.displayName);
  });
}

/** Return every ingredient flag currently shipped. */
export function getAllIngredientFlags(): IngredientFlag[] {
  return INGREDIENT_FLAGS.slice();
}
