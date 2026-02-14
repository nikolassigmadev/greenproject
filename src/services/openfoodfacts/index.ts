import type { OpenFoodFactsResponse, OpenFoodFactsResult } from './types';

const OFF_API_BASE = 'https://world.openfoodfacts.org/api/v0';

const emptyResult = (barcode: string, error?: string): OpenFoodFactsResult => ({
  found: false,
  barcode,
  productName: null,
  brand: null,
  ecoscoreGrade: null,
  ecoscoreScore: null,
  nutriscoreGrade: null,
  nutriscoreScore: null,
  novaGroup: null,
  carbonFootprint100g: null,
  labels: [],
  categories: [],
  origins: null,
  ingredientsText: null,
  imageUrl: null,
  rawProduct: null,
  error,
});

export const isValidBarcode = (code: string): boolean => {
  const cleaned = code.replace(/\s+/g, '').trim();
  return /^\d{8,14}$/.test(cleaned);
};

export const lookupBarcode = async (barcode: string): Promise<OpenFoodFactsResult> => {
  const cleaned = barcode.replace(/\s+/g, '').trim();

  if (!isValidBarcode(cleaned)) {
    return emptyResult(cleaned, 'Invalid barcode format. Expected 8-14 digits.');
  }

  try {
    const response = await fetch(`${OFF_API_BASE}/product/${cleaned}.json`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: OpenFoodFactsResponse = await response.json();

    if (data.status !== 1 || !data.product) {
      return emptyResult(cleaned, data.status_verbose || 'Product not found on OpenFoodFacts');
    }

    const p = data.product;

    const carbonFootprint100g =
      p.nutriments?.['carbon-footprint-from-known-ingredients_100g'] ?? null;

    const labels = p.labels_tags
      ? p.labels_tags.map((l) => l.replace(/^en:/, '').replace(/-/g, ' '))
      : p.labels
        ? p.labels.split(',').map((l) => l.trim())
        : [];

    const categories = p.categories_tags
      ? p.categories_tags.map((c) => c.replace(/^en:/, '').replace(/-/g, ' '))
      : p.categories
        ? p.categories.split(',').map((c) => c.trim())
        : [];

    return {
      found: true,
      barcode: cleaned,
      productName: p.product_name_en || p.product_name || null,
      brand: p.brands || null,
      ecoscoreGrade:
        p.ecoscore_grade && p.ecoscore_grade !== 'unknown' && p.ecoscore_grade !== 'not-applicable'
          ? p.ecoscore_grade
          : null,
      ecoscoreScore: typeof p.ecoscore_score === 'number' ? p.ecoscore_score : null,
      nutriscoreGrade: p.nutriscore_grade || null,
      nutriscoreScore: typeof p.nutriscore_score === 'number' ? p.nutriscore_score : null,
      novaGroup: typeof p.nova_group === 'number' ? p.nova_group : null,
      carbonFootprint100g: typeof carbonFootprint100g === 'number' ? carbonFootprint100g : null,
      labels,
      categories,
      origins: p.origins || null,
      ingredientsText: p.ingredients_text_en || p.ingredients_text || null,
      imageUrl: p.image_front_url || p.image_url || null,
      rawProduct: p,
    };
  } catch (error) {
    console.error('OpenFoodFacts API error:', error);
    return emptyResult(
      cleaned,
      error instanceof Error ? error.message : 'Failed to contact OpenFoodFacts'
    );
  }
};
