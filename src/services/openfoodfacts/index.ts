import type {
  OpenFoodFactsResponse,
  OpenFoodFactsSearchResponse,
  OpenFoodFactsProduct,
  OpenFoodFactsResult,
} from './types';

const OFF_API_BASE = 'https://world.openfoodfacts.org';

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
  carbonFootprintProduct: null,
  carbonFootprintServing: null,
  labels: [],
  categories: [],
  origins: null,
  ingredientsText: null,
  imageUrl: null,
  ecoscoreData: null,
  rawProduct: null,
  error,
});

const normalizeProduct = (p: OpenFoodFactsProduct): OpenFoodFactsResult => {
  const carbonFootprint100g =
    p.nutriments?.['carbon-footprint-from-known-ingredients_100g'] ?? null;
  const carbonFootprintProduct =
    p.nutriments?.['carbon-footprint-from-known-ingredients_product'] ?? null;
  const carbonFootprintServing =
    p.nutriments?.['carbon-footprint-from-known-ingredients_serving'] ?? null;

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
    barcode: p.code,
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
    carbonFootprintProduct: typeof carbonFootprintProduct === 'number' ? carbonFootprintProduct : null,
    carbonFootprintServing: typeof carbonFootprintServing === 'number' ? carbonFootprintServing : null,
    labels,
    categories,
    origins: p.origins || null,
    ingredientsText: p.ingredients_text_en || p.ingredients_text || null,
    imageUrl: p.image_front_url || p.image_url || null,
    ecoscoreData: p.ecoscore_data || null,
    rawProduct: p,
  };
};

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
    const response = await fetch(`${OFF_API_BASE}/api/v0/product/${cleaned}.json`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: OpenFoodFactsResponse = await response.json();

    if (data.status !== 1 || !data.product) {
      return emptyResult(cleaned, data.status_verbose || 'Product not found on OpenFoodFacts');
    }

    return normalizeProduct(data.product);
  } catch (error) {
    console.error('OpenFoodFacts API error:', error);
    return emptyResult(
      cleaned,
      error instanceof Error ? error.message : 'Failed to contact OpenFoodFacts'
    );
  }
};

export const searchProducts = async (
  query: string,
  limit: number = 3
): Promise<OpenFoodFactsResult[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    const params = new URLSearchParams({
      search_terms: trimmed,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: String(limit),
      sort_by: 'unique_scans_n',
    });

    const response = await fetch(`${OFF_API_BASE}/cgi/search.pl?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: OpenFoodFactsSearchResponse = await response.json();

    if (!data.products || data.products.length === 0) {
      return [];
    }

    return data.products.map(normalizeProduct);
  } catch (error) {
    console.error('OpenFoodFacts search error:', error);
    return [];
  }
};

export interface BrowseOptions {
  query?: string;
  category?: string;
  country?: string;
  page?: number;
  pageSize?: number;
}

export interface BrowseResult {
  products: OpenFoodFactsResult[];
  totalCount: number;
  page: number;
  pageCount: number;
}

export const browseProducts = async (options: BrowseOptions = {}): Promise<BrowseResult> => {
  const { query, category, country, page = 1, pageSize = 24 } = options;

  try {
    const params = new URLSearchParams({
      action: 'process',
      json: '1',
      page: String(page),
      page_size: String(pageSize),
      sort_by: 'unique_scans_n',
    });

    if (query?.trim()) {
      params.set('search_terms', query.trim());
    }

    let tagIndex = 0;

    if (category) {
      params.set(`tagtype_${tagIndex}`, 'categories');
      params.set(`tag_contains_${tagIndex}`, 'contains');
      params.set(`tag_${tagIndex}`, category);
      tagIndex++;
    }

    if (country) {
      params.set(`tagtype_${tagIndex}`, 'countries');
      params.set(`tag_contains_${tagIndex}`, 'contains');
      params.set(`tag_${tagIndex}`, country);
      tagIndex++;
    }

    // Require a front image to exist (filters out incomplete entries)
    params.set(`tagtype_${tagIndex}`, 'states');
    params.set(`tag_contains_${tagIndex}`, 'contains');
    params.set(`tag_${tagIndex}`, 'en:front-photo-selected');

    const response = await fetch(`${OFF_API_BASE}/cgi/search.pl?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: OpenFoodFactsSearchResponse = await response.json();

    return {
      products: (data.products || []).map(normalizeProduct),
      totalCount: data.count || 0,
      page: data.page || page,
      pageCount: data.page_count || 0,
    };
  } catch (error) {
    console.error('OpenFoodFacts browse error:', error);
    return { products: [], totalCount: 0, page: 1, pageCount: 0 };
  }
};
