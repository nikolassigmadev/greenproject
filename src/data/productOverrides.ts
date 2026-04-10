import type { OpenFoodFactsResult } from '../services/openfoodfacts/types';

/**
 * Local override map: barcode → OpenFoodFactsResult
 *
 * Add entries here for products that are missing from or incorrect in
 * Open Food Facts. The lookup is instant — no network call is made.
 *
 * Template (copy and fill in):
 *
 * '0000000000000': {
 *   found: true,
 *   barcode: '0000000000000',
 *   productName: 'Product Name',
 *   brand: 'Brand Name',
 *   ecoscoreGrade: 'a' | 'b' | 'c' | 'd' | 'e' | null,
 *   ecoscoreScore: null,          // number 0–100, or null
 *   nutriscoreGrade: null,        // 'a'–'e', or null
 *   nutriscoreScore: null,        // number, or null
 *   novaGroup: null,              // 1–4, or null
 *   carbonFootprint100g: null,    // gCO2eq per 100g, or null
 *   carbonFootprintProduct: null, // gCO2eq per product, or null
 *   carbonFootprintServing: null, // gCO2eq per serving, or null
 *   labels: [],                   // e.g. ['organic', 'fair trade']
 *   categories: [],               // e.g. ['beverages', 'waters']
 *   origins: null,                // e.g. 'Indonesia'
 *   ingredientsText: null,        // free-text ingredients, or null
 *   imageUrl: null,               // absolute URL, or null
 *   ecoscoreData: null,           // detailed EcoscoreData object, or null
 *   rawProduct: null,
 * },
 */
const productOverrides: Record<string, OpenFoodFactsResult> = {
  // Example — remove or replace with real entries:
  // '8999999083938': {
  //   found: true,
  //   barcode: '8999999083938',
  //   productName: 'Aqua Mineral Water 600ml',
  //   brand: 'Aqua (Danone)',
  //   ecoscoreGrade: 'c',
  //   ecoscoreScore: null,
  //   nutriscoreGrade: null,
  //   nutriscoreScore: null,
  //   novaGroup: 1,
  //   carbonFootprint100g: null,
  //   carbonFootprintProduct: null,
  //   carbonFootprintServing: null,
  //   labels: [],
  //   categories: ['beverages', 'waters', 'spring waters'],
  //   origins: 'Indonesia',
  //   ingredientsText: 'Natural mineral water.',
  //   imageUrl: null,
  //   ecoscoreData: null,
  //   rawProduct: null,
  // },
};

export const getProductOverride = (barcode: string): OpenFoodFactsResult | undefined =>
  productOverrides[barcode];
