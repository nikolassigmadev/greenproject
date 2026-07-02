// Personal dietary & allergen preferences — the "hard constraints" layer that
// sits alongside the ethics priorities. Users declare what they can't (or
// won't) eat; every product view checks Open Food Facts' ingredient analysis
// and allergen tags against it and raises a warning on conflict.
//
// Two kinds of rule:
//   - diets     → checked against `ingredients_analysis_tags`
//                 (en:non-vegan, en:palm-oil, …)
//   - allergens → checked against `allergens_tags` (contains) and
//                 `traces_tags` (may contain)
//
// Stored in localStorage and mirrored to a window event, matching the
// priorities/watchlist pattern.

import type { OpenFoodFactsResult } from '@/services/openfoodfacts/types';

export type DietKey = 'vegan' | 'vegetarian' | 'palm_oil_free';

export type AllergenKey =
  | 'gluten'
  | 'milk'
  | 'eggs'
  | 'peanuts'
  | 'nuts'
  | 'soybeans'
  | 'fish'
  | 'crustaceans'
  | 'molluscs'
  | 'sesame-seeds'
  | 'mustard'
  | 'celery'
  | 'sulphur-dioxide-and-sulphites'
  | 'lupin';

export interface DietaryPrefs {
  diets: DietKey[];
  allergens: AllergenKey[];
}

export const EMPTY_DIETARY_PREFS: DietaryPrefs = { diets: [], allergens: [] };

export const DIET_OPTIONS: { key: DietKey; label: string }[] = [
  { key: 'vegan', label: 'Vegan' },
  { key: 'vegetarian', label: 'Vegetarian' },
  { key: 'palm_oil_free', label: 'Palm-oil free' },
];

export const ALLERGEN_OPTIONS: { key: AllergenKey; label: string }[] = [
  { key: 'gluten', label: 'Gluten' },
  { key: 'milk', label: 'Milk / dairy' },
  { key: 'eggs', label: 'Eggs' },
  { key: 'peanuts', label: 'Peanuts' },
  { key: 'nuts', label: 'Tree nuts' },
  { key: 'soybeans', label: 'Soy' },
  { key: 'fish', label: 'Fish' },
  { key: 'crustaceans', label: 'Shellfish' },
  { key: 'molluscs', label: 'Molluscs' },
  { key: 'sesame-seeds', label: 'Sesame' },
  { key: 'mustard', label: 'Mustard' },
  { key: 'celery', label: 'Celery' },
  { key: 'sulphur-dioxide-and-sulphites', label: 'Sulphites' },
  { key: 'lupin', label: 'Lupin' },
];

const ALLERGEN_LABEL: Record<AllergenKey, string> = Object.fromEntries(
  ALLERGEN_OPTIONS.map((o) => [o.key, o.label]),
) as Record<AllergenKey, string>;

// ── Persistence ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'goodscan-dietary';
export const DIETARY_EVENT = 'dietaryUpdated';

export function loadDietaryPrefs(): DietaryPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_DIETARY_PREFS };
    const parsed = JSON.parse(raw);
    return {
      diets: Array.isArray(parsed?.diets) ? parsed.diets : [],
      allergens: Array.isArray(parsed?.allergens) ? parsed.allergens : [],
    };
  } catch {
    return { ...EMPTY_DIETARY_PREFS };
  }
}

export function saveDietaryPrefs(prefs: DietaryPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new Event(DIETARY_EVENT));
  } catch (error) {
    console.error('Failed to save dietary preferences:', error);
  }
}

export function hasDietaryPrefs(prefs: DietaryPrefs): boolean {
  return prefs.diets.length > 0 || prefs.allergens.length > 0;
}

// ── Conflict checking ────────────────────────────────────────────────────────

/**
 * 'contains'  → the product definitely violates the preference.
 * 'maybe'     → OFF marks it uncertain (may-contain / traces / analysis unknown).
 */
export type ConflictLevel = 'contains' | 'maybe';

export interface DietaryConflict {
  /** Which preference is violated, e.g. "Vegan" or "Peanuts". */
  label: string;
  level: ConflictLevel;
  /** Short human sentence for the banner row. */
  message: string;
}

export interface DietaryCheck {
  conflicts: DietaryConflict[];
  /**
   * True when the product carries no ingredient information at all, so none of
   * the user's preferences could be checked. (Distinct from "checked, clean".)
   */
  noData: boolean;
}

interface DietAnalysisRule {
  violates: string[];
  uncertain: string[];
  confirms: string[];
  label: string;
  containsMessage: string;
  maybeMessage: string;
}

// OFF ingredient-analysis tag vocabulary per diet. `confirms` short-circuits
// the uncertain check (an explicit en:vegan beats en:vegan-status-unknown).
const DIET_RULES: Record<DietKey, DietAnalysisRule> = {
  vegan: {
    label: 'Vegan',
    violates: ['en:non-vegan'],
    uncertain: ['en:maybe-vegan', 'en:vegan-status-unknown'],
    confirms: ['en:vegan'],
    containsMessage: 'Contains non-vegan ingredients',
    maybeMessage: 'Vegan status is uncertain',
  },
  vegetarian: {
    label: 'Vegetarian',
    violates: ['en:non-vegetarian'],
    uncertain: ['en:maybe-vegetarian', 'en:vegetarian-status-unknown'],
    confirms: ['en:vegetarian'],
    containsMessage: 'Contains non-vegetarian ingredients',
    maybeMessage: 'Vegetarian status is uncertain',
  },
  palm_oil_free: {
    label: 'Palm-oil free',
    violates: ['en:palm-oil'],
    uncertain: ['en:may-contain-palm-oil', 'en:palm-oil-content-unknown'],
    confirms: ['en:palm-oil-free'],
    containsMessage: 'Contains palm oil',
    maybeMessage: 'May contain palm oil',
  },
};

const normalizeTag = (t: string) => t.trim().toLowerCase();

/**
 * Check a product against the user's dietary preferences. Pure and synchronous
 * — safe to call during render. Returns no conflicts when the user has no
 * preferences set.
 */
export function checkDietaryConflicts(
  product: OpenFoodFactsResult,
  prefs: DietaryPrefs,
): DietaryCheck {
  if (!hasDietaryPrefs(prefs)) return { conflicts: [], noData: false };

  const raw = product.rawProduct;
  const analysis = (raw?.ingredients_analysis_tags ?? []).map(normalizeTag);
  const allergens = (raw?.allergens_tags ?? []).map(normalizeTag);
  const traces = (raw?.traces_tags ?? []).map(normalizeTag);

  // No ingredient list and no analysis at all → we can't check anything.
  const noData = !product.ingredientsText && analysis.length === 0 && allergens.length === 0;
  if (noData) return { conflicts: [], noData: true };

  const conflicts: DietaryConflict[] = [];

  for (const diet of prefs.diets) {
    const rule = DIET_RULES[diet];
    if (!rule) continue;
    if (rule.violates.some((t) => analysis.includes(t))) {
      conflicts.push({ label: rule.label, level: 'contains', message: rule.containsMessage });
    } else if (
      !rule.confirms.some((t) => analysis.includes(t)) &&
      rule.uncertain.some((t) => analysis.includes(t))
    ) {
      conflicts.push({ label: rule.label, level: 'maybe', message: rule.maybeMessage });
    }
  }

  for (const allergen of prefs.allergens) {
    const tag = `en:${allergen}`;
    const label = ALLERGEN_LABEL[allergen] ?? allergen;
    if (allergens.includes(tag)) {
      conflicts.push({ label, level: 'contains', message: `Contains ${label.toLowerCase()}` });
    } else if (traces.includes(tag)) {
      conflicts.push({ label, level: 'maybe', message: `May contain traces of ${label.toLowerCase()}` });
    }
  }

  // Hard violations first so the banner leads with what matters.
  conflicts.sort((a, b) => (a.level === b.level ? 0 : a.level === 'contains' ? -1 : 1));

  return { conflicts, noData: false };
}
