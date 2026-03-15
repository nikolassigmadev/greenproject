import type {
  OpenFoodFactsResponse,
  OpenFoodFactsSearchResponse,
  OpenFoodFactsProduct,
  OpenFoodFactsResult,
} from './types';

import { validateAndCleanBarcode, getAlternativeFormats } from '../../utils/barcodeValidator';
import { ocrSearchLogger } from '../../utils/ocrSearchLogger';

const OFF_API_BASE = 'https://world.openfoodfacts.org';

// ---------------------------------------------------------------------------
// Simple in-memory cache with TTL (5 minutes) to avoid duplicate API calls
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function cacheGet<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return undefined;
  }
  return entry.data as T;
}

function cacheSet<T>(key: string, data: T): void {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
}

// Countries we care about — Europe, North America, and Indonesia.
// Matched against OpenFoodFacts `countries_tags` which use "en:" prefix.
const ALLOWED_COUNTRY_TAGS = new Set([
  // North America
  "en:united-states", "en:canada", "en:mexico",
  // Europe
  "en:france", "en:germany", "en:united-kingdom", "en:spain", "en:italy",
  "en:belgium", "en:switzerland", "en:netherlands", "en:portugal", "en:sweden",
  "en:austria", "en:poland", "en:denmark", "en:norway", "en:finland",
  "en:ireland", "en:greece", "en:czech-republic", "en:romania", "en:hungary",
  "en:croatia", "en:slovakia", "en:slovenia", "en:bulgaria", "en:luxembourg",
  "en:estonia", "en:latvia", "en:lithuania", "en:cyprus", "en:malta",
  "en:iceland", "en:liechtenstein",
  // Indonesia
  "en:indonesia",
]);

/**
 * Returns true if the product is sold in an allowed region
 * (Europe, North America, or Indonesia). If no country data
 * is available, the product is kept to avoid false negatives.
 */
const isAllowedRegion = (product: OpenFoodFactsResult): boolean => {
  const raw = product.rawProduct;
  if (!raw) return true;

  const tags = raw.countries_tags;
  // No country data → keep the product
  if (!tags || tags.length === 0) return true;

  return tags.some(tag => ALLOWED_COUNTRY_TAGS.has(tag.toLowerCase()));
};

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
  // Validate and clean the barcode
  const validation = validateAndCleanBarcode(barcode);
  const cleaned = validation.cleaned;

  // Log barcode validation
  ocrSearchLogger.logBarcodeValidation(barcode, cleaned, validation.isValid, validation.format);

  if (!validation.isValid) {
    console.warn(`❌ Barcode validation failed: "${barcode}" is not a valid format (${validation.format})`);
    return emptyResult(
      cleaned,
      `Invalid barcode format. Got: ${validation.format}. Expected 8-14 digits.`
    );
  }

  console.log(`✅ Barcode validated: "${barcode}" → "${cleaned}" (${validation.format})`);

  // Try primary barcode first
  const result = await lookupBarcodeInternal(cleaned);
  if (result.found) {
    ocrSearchLogger.logBarcodeSearch(cleaned, true, result.productName || undefined);
    return result;
  }

  // If primary lookup failed, try alternative formats
  console.warn(`🔄 Primary barcode lookup failed, trying alternatives...`);
  const alternatives = getAlternativeFormats(barcode);

  for (const alt of alternatives) {
    console.log(`   Trying alternative format: ${alt}`);
    const altResult = await lookupBarcodeInternal(alt);
    if (altResult.found) {
      console.log(`✅ Found product using alternative barcode: ${alt}`);
      ocrSearchLogger.logBarcodeSearch(alt, true, altResult.productName || undefined);
      return altResult;
    }
  }

  // All attempts failed
  console.warn(`❌ All barcode lookup attempts failed for: ${barcode}`);
  ocrSearchLogger.logBarcodeSearch(cleaned, false);
  return emptyResult(
    cleaned,
    `Product not found on OpenFoodFacts. Tried: ${[cleaned, ...alternatives].join(', ')}`
  );
};

/**
 * Internal barcode lookup (single attempt)
 */
const lookupBarcodeInternal = async (barcode: string): Promise<OpenFoodFactsResult> => {
  const cacheKey = `barcode:${barcode}`;
  const cached = cacheGet<OpenFoodFactsResult>(cacheKey);
  if (cached) {
    console.log(`📦 Using cached result for barcode: ${barcode}`);
    return cached;
  }

  try {
    const startTime = Date.now();
    const response = await fetch(`${OFF_API_BASE}/api/v0/product/${barcode}.json`, {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    const duration = Date.now() - startTime;
    console.log(`   API call took ${duration}ms`);

    if (!response.ok) {
      console.warn(`   HTTP ${response.status}: ${response.statusText}`);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: OpenFoodFactsResponse = await response.json();

    if (data.status !== 1 || !data.product) {
      console.warn(`   Status ${data.status}: ${data.status_verbose || 'Product not found'}`);
      return emptyResult(barcode, data.status_verbose || 'Product not found on OpenFoodFacts');
    }

    const result = normalizeProduct(data.product);
    cacheSet(cacheKey, result);
    
    console.log(`✅ Product found: ${result.productName} (${result.brand})`);
    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`   Error: ${errorMsg}`);
    return emptyResult(barcode, errorMsg);
  }
};

export const searchProducts = async (
  query: string,
  limit: number = 3
): Promise<OpenFoodFactsResult[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const cacheKey = `search:${trimmed.toLowerCase()}:${limit}`;
  const cached = cacheGet<OpenFoodFactsResult[]>(cacheKey);
  if (cached) return cached;

  try {
    // Fetch extra results so we still have enough after region filtering
    const params = new URLSearchParams({
      search_terms: trimmed,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: String(Math.min(limit * 3, 50)),
      sort_by: 'unique_scans_n',
      // Only fetch the fields we actually use — cuts response size dramatically
      fields: [
        'code', 'product_name', 'product_name_en', 'brands',
        'ecoscore_grade', 'ecoscore_score', 'ecoscore_data',
        'nutriscore_grade', 'nutriscore_score', 'nova_group',
        'nutriments', 'labels_tags', 'labels', 'categories_tags', 'categories',
        'origins', 'ingredients_text', 'ingredients_text_en',
        'image_front_url', 'image_url', 'countries_tags',
      ].join(','),
    });

    const response = await fetch(`${OFF_API_BASE}/cgi/search.pl?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: OpenFoodFactsSearchResponse = await response.json();

    if (!data.products || data.products.length === 0) {
      ocrSearchLogger.logTextSearch(trimmed, 0, { regionFiltered: true });
      return [];
    }

    // Try to get results from allowed regions first
    const allNormalized = data.products.map(normalizeProduct);
    const regionalResults = allNormalized.filter(isAllowedRegion);
    let results = regionalResults.slice(0, limit);

    // Log regional filtering
    ocrSearchLogger.logRegionalFiltering(
      allNormalized.length,
      regionalResults.length,
      false
    );

    // If we got very few results after regional filtering, include global results too
    if (results.length < Math.ceil(limit * 0.5)) {
      console.warn(`⚠️ Only ${results.length} results in allowed regions, including global results...`);
      const allResults = allNormalized.slice(0, limit * 2);

      // Prefer regional results but fill with global ones if needed
      results = [
        ...results,
        ...allResults.filter(r => !results.some(ur => ur.barcode === r.barcode))
      ].slice(0, limit);
    }

    // Log text search results
    ocrSearchLogger.logTextSearch(trimmed, results.length, { regionFiltered: true });

    cacheSet(cacheKey, results);
    return results;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('OpenFoodFacts search error:', error);
    ocrSearchLogger.logAPIError('/cgi/search.pl', errorMsg);
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

// Search for greener alternatives in the same category with better eco-scores and lower CO2

/**
 * Search with automatic regional fallback
 * First tries region-filtered search, then expands globally if needed
 */
export const searchProductsWithRegionalFallback = async (
  query: string,
  limit: number = 3
): Promise<{ results: OpenFoodFactsResult[]; expandedRegion: boolean }> => {
  // First try with region filter
  const results = await searchProducts(query, limit);
  
  if (results.length > 0) {
    console.log(`✅ Found ${results.length} results within allowed regions`);
    return { results, expandedRegion: false };
  }

  // No results in allowed regions - expand to all regions
  console.warn(`⚠️ No results in allowed regions, expanding search globally...`);
  
  // Retry without region filter (search globally)
  const globalResults = await searchProductsGlobal(query, limit);
  
  if (globalResults.length > 0) {
    console.log(`✅ Found ${globalResults.length} global results after regional expansion`);
  }
  
  return { results: globalResults, expandedRegion: true };
};

/**
 * Global product search (no region filtering)
 */
const searchProductsGlobal = async (
  query: string,
  limit: number = 3
): Promise<OpenFoodFactsResult[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const cacheKey = `search:global:${trimmed.toLowerCase()}:${limit}`;
  const cached = cacheGet<OpenFoodFactsResult[]>(cacheKey);
  if (cached) {
    console.log(`📦 Using cached global search results`);
    return cached;
  }

  try {
    const params = new URLSearchParams({
      search_terms: trimmed,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: String(Math.min(limit * 3, 50)),
      sort_by: 'unique_scans_n',
      fields: [
        'code', 'product_name', 'product_name_en', 'brands',
        'ecoscore_grade', 'ecoscore_score', 'ecoscore_data',
        'nutriscore_grade', 'nutriscore_score', 'nova_group',
        'nutriments', 'labels_tags', 'labels', 'categories_tags', 'categories',
        'origins', 'ingredients_text', 'ingredients_text_en',
        'image_front_url', 'image_url', 'countries_tags',
      ].join(','),
    });

    const response = await fetch(`${OFF_API_BASE}/cgi/search.pl?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: OpenFoodFactsSearchResponse = await response.json();

    if (!data.products || data.products.length === 0) {
      console.warn(`   No global results found`);
      return [];
    }

    // Return ALL results without region filtering
    const results = data.products
      .map(normalizeProduct)
      .slice(0, limit);
    
    console.log(`   Got ${results.length} global results (region filter disabled)`);
    
    cacheSet(cacheKey, results);
    return results;
  } catch (error) {
    console.error('OpenFoodFacts global search error:', error);
    return [];
  }
};


/**
 * Search with fallback to simpler queries
 * If full query returns no results, try searching by just the brand name
 */
export const searchWithFallback = async (
  query: string,
  limit: number = 3
): Promise<OpenFoodFactsResult[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Extract parts (usually brand first, then product)
  const parts = trimmed.split(/\s+/).filter(p => p.length > 0);

  // Try searches in order of specificity
  const searchVariations = [
    trimmed,  // Full query first
    parts[0],  // Just the brand (usually first)
    parts.slice(0, 2).join(' '),  // First two words
  ].filter((v, i, arr) => arr.indexOf(v) === i); // Remove duplicates

  console.log(`🔍 Trying search variations: ${searchVariations.join(' | ')}`);

  for (const searchQuery of searchVariations) {
    console.log(`   Attempting: "${searchQuery}"`);
    const results = await searchProducts(searchQuery, limit * 2);
    
    if (results.length > 0) {
      console.log(`   ✅ Found ${results.length} results with "${searchQuery}"`);
      return results.slice(0, limit);
    }
    console.log(`   ❌ No results for "${searchQuery}", trying next variation...`);
  }

  console.warn(`⚠️ No results found for any search variation of "${query}"`);
  return [];
};

export const searchBetterAlternatives = async (
  result: OpenFoodFactsResult,
  limit: number = 3
): Promise<OpenFoodFactsResult[]> => {
  const grade = result.ecoscoreGrade?.toLowerCase();
  if (!grade || !['d', 'e'].includes(grade)) return [];

  // Use the first meaningful category (skip very generic ones)
  const category = result.categories.find(c => c.length > 3) || result.categories[0];
  if (!category) return [];

  const cacheKey = `alts:${result.barcode}:${category}:${limit}`;
  const cached = cacheGet<OpenFoodFactsResult[]>(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({
      action: 'process',
      json: '1',
      page_size: '30',
      sort_by: 'unique_scans_n',
      tagtype_0: 'categories',
      tag_contains_0: 'contains',
      tag_0: category,
      fields: [
        'code', 'product_name', 'product_name_en', 'brands',
        'ecoscore_grade', 'ecoscore_score', 'ecoscore_data',
        'nutriscore_grade', 'nutriscore_score', 'nova_group',
        'nutriments', 'labels_tags', 'labels', 'categories_tags', 'categories',
        'origins', 'ingredients_text', 'ingredients_text_en',
        'image_front_url', 'image_url', 'countries_tags',
      ].join(','),
    });

    const response = await fetch(`${OFF_API_BASE}/cgi/search.pl?${params}`);
    if (!response.ok) return [];

    const data: OpenFoodFactsSearchResponse = await response.json();
    if (!data.products || data.products.length === 0) return [];

    const betterGrades = new Set(['a', 'b']);
    const candidates = data.products
      .filter(p => p.code !== result.barcode)
      .map(normalizeProduct)
      .filter(isAllowedRegion)
      .filter(p =>
        p.ecoscoreGrade && betterGrades.has(p.ecoscoreGrade.toLowerCase()) &&
        (p.ecoscoreData?.agribalyse?.co2_total != null || p.carbonFootprint100g != null)
      );

    if (candidates.length === 0) return [];

    // Sort by CO2 total (ascending) - prefer lowest carbon footprint
    candidates.sort((a, b) => {
      const aCO2 = a.ecoscoreData?.agribalyse?.co2_total ?? a.carbonFootprint100g ?? Infinity;
      const bCO2 = b.ecoscoreData?.agribalyse?.co2_total ?? b.carbonFootprint100g ?? Infinity;
      return aCO2 - bCO2;
    });

    const results = candidates.slice(0, limit);
    cacheSet(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Error searching for alternatives:', error);
    return [];
  }
};

export const browseProducts = async (options: BrowseOptions = {}): Promise<BrowseResult> => {
  const { query, category, country, page = 1, pageSize = 24 } = options;

  const cacheKey = `browse:${query || ''}:${category || ''}:${country || ''}:${page}:${pageSize}`;
  const cached = cacheGet<BrowseResult>(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({
      action: 'process',
      json: '1',
      page: String(page),
      page_size: String(pageSize),
      sort_by: 'unique_scans_n',
      // Only fetch the fields we actually use — cuts response size dramatically
      fields: [
        'code', 'product_name', 'product_name_en', 'brands',
        'ecoscore_grade', 'ecoscore_score', 'ecoscore_data',
        'nutriscore_grade', 'nutriscore_score', 'nova_group',
        'nutriments', 'labels_tags', 'labels', 'categories_tags', 'categories',
        'origins', 'ingredients_text', 'ingredients_text_en',
        'image_front_url', 'image_url', 'countries_tags',
      ].join(','),
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

    const products = (data.products || [])
      .map(normalizeProduct)
      .filter(isAllowedRegion);

    const result: BrowseResult = {
      products,
      totalCount: data.count || 0,
      page: data.page || page,
      pageCount: data.page_count || 0,
    };
    cacheSet(cacheKey, result);
    return result;
  } catch (error) {
    console.error('OpenFoodFacts browse error:', error);
    return { products: [], totalCount: 0, page: 1, pageCount: 0 };
  }
};
