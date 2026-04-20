/**
 * Hardcoded product name → barcode mappings.
 * When OpenAI identifies a product by name, we check here first
 * before falling back to OpenFoodFacts search.
 *
 * keywords: lowercase strings that should match the OpenAI response.
 * barcodes: ordered list — first is tried first, rest are fallbacks.
 */
export const PRODUCT_BARCODE_MAP: { keywords: string[]; barcodes: string[] }[] = [
  {
    keywords: ['takis fuego', 'taki fuego'],
    barcodes: [
      '0757528005276(', // confirmed working
      '', // fallback
      '', // fallback 3
    ],
  },
  {
    keywords: ['kinder bueno white', 'kinder bueno blanc'],
    barcodes: ['3017620690464'],
  },
  // Add more entries here:
  // {
  //   keywords: ['oreo original', 'oreo cookies'],
  //   barcodes: ['0044000030506', '', ''],
  // },
];

/**
 * Returns barcodes (in priority order) for a matched product, filtering out blanks.
 */
export function lookupHardcodedBarcodes(productText: string): string[] {
  const lower = productText.toLowerCase();
  for (const entry of PRODUCT_BARCODE_MAP) {
    if (entry.keywords.some(k => lower.includes(k))) {
      return entry.barcodes.filter(b => b.trim() !== '');
    }
  }
  return [];
}
