import { describe, it, expect } from 'vitest';
import {
  checkDietaryConflicts,
  EMPTY_DIETARY_PREFS,
  type DietaryPrefs,
} from './dietaryPreferences';
import type { OpenFoodFactsResult, OpenFoodFactsProduct } from '@/services/openfoodfacts/types';

function makeProduct(raw: Partial<OpenFoodFactsProduct>, ingredientsText: string | null = 'water, sugar'): OpenFoodFactsResult {
  return {
    found: true,
    barcode: '123',
    productName: 'Test Product',
    brand: 'TestBrand',
    ecoscoreGrade: null,
    ecoscoreScore: null,
    nutriscoreGrade: null,
    nutriscoreScore: null,
    novaGroup: null,
    carbonFootprint100g: null,
    carbonFootprintProduct: null,
    carbonFootprintServing: null,
    labels: [],
    categories: [],
    origins: null,
    ingredientsText,
    imageUrl: null,
    ecoscoreData: null,
    rawProduct: { code: '123', ...raw },
  };
}

describe('checkDietaryConflicts', () => {
  it('returns nothing when the user has no preferences', () => {
    const product = makeProduct({ ingredients_analysis_tags: ['en:non-vegan'] });
    const check = checkDietaryConflicts(product, EMPTY_DIETARY_PREFS);
    expect(check.conflicts).toHaveLength(0);
    expect(check.noData).toBe(false);
  });

  it('flags a hard vegan violation', () => {
    const prefs: DietaryPrefs = { diets: ['vegan'], allergens: [] };
    const product = makeProduct({ ingredients_analysis_tags: ['en:non-vegan', 'en:vegetarian'] });
    const check = checkDietaryConflicts(product, prefs);
    expect(check.conflicts).toEqual([
      { label: 'Vegan', level: 'contains', message: 'Contains non-vegan ingredients' },
    ]);
  });

  it('flags uncertain vegan status as maybe', () => {
    const prefs: DietaryPrefs = { diets: ['vegan'], allergens: [] };
    const product = makeProduct({ ingredients_analysis_tags: ['en:vegan-status-unknown'] });
    const check = checkDietaryConflicts(product, prefs);
    expect(check.conflicts[0]).toMatchObject({ label: 'Vegan', level: 'maybe' });
  });

  it('does not flag an explicitly vegan product', () => {
    const prefs: DietaryPrefs = { diets: ['vegan', 'vegetarian'], allergens: [] };
    const product = makeProduct({ ingredients_analysis_tags: ['en:vegan', 'en:vegetarian'] });
    expect(checkDietaryConflicts(product, prefs).conflicts).toHaveLength(0);
  });

  it('flags palm oil', () => {
    const prefs: DietaryPrefs = { diets: ['palm_oil_free'], allergens: [] };
    const product = makeProduct({ ingredients_analysis_tags: ['en:palm-oil'] });
    expect(checkDietaryConflicts(product, prefs).conflicts[0]).toMatchObject({
      label: 'Palm-oil free',
      level: 'contains',
    });
  });

  it('flags declared allergens as contains and traces as maybe', () => {
    const prefs: DietaryPrefs = { diets: [], allergens: ['milk', 'peanuts'] };
    const product = makeProduct({
      allergens_tags: ['en:milk'],
      traces_tags: ['en:peanuts'],
    });
    const check = checkDietaryConflicts(product, prefs);
    expect(check.conflicts).toHaveLength(2);
    expect(check.conflicts[0]).toMatchObject({ label: 'Milk / dairy', level: 'contains' });
    expect(check.conflicts[1]).toMatchObject({ label: 'Peanuts', level: 'maybe' });
  });

  it('ignores allergens the user did not select', () => {
    const prefs: DietaryPrefs = { diets: [], allergens: ['gluten'] };
    const product = makeProduct({ allergens_tags: ['en:milk', 'en:soybeans'] });
    expect(checkDietaryConflicts(product, prefs).conflicts).toHaveLength(0);
  });

  it('sorts hard violations before maybes', () => {
    const prefs: DietaryPrefs = { diets: ['vegan'], allergens: ['milk'] };
    const product = makeProduct({
      ingredients_analysis_tags: ['en:maybe-vegan'],
      allergens_tags: ['en:milk'],
    });
    const check = checkDietaryConflicts(product, prefs);
    expect(check.conflicts.map((c) => c.level)).toEqual(['contains', 'maybe']);
  });

  it('reports noData when the product has no ingredient info at all', () => {
    const prefs: DietaryPrefs = { diets: ['vegan'], allergens: ['milk'] };
    const product = makeProduct({}, null);
    const check = checkDietaryConflicts(product, prefs);
    expect(check.noData).toBe(true);
    expect(check.conflicts).toHaveLength(0);
  });

  it('does not report noData when an ingredient list exists but is clean', () => {
    const prefs: DietaryPrefs = { diets: ['vegan'], allergens: ['milk'] };
    const product = makeProduct({ ingredients_analysis_tags: ['en:vegan'] });
    const check = checkDietaryConflicts(product, prefs);
    expect(check.noData).toBe(false);
    expect(check.conflicts).toHaveLength(0);
  });
});
