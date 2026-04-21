/**
 * Hardcoded product name → barcode mappings.
 * When OpenAI identifies a product by name, we check here first
 * before falling back to OpenFoodFacts search.
 *
 * keywords:  lowercase strings that should match the OpenAI response.
 * barcodes:  ordered list — first is tried first, rest are fallbacks.
 * imageUrl:  hardcoded product image URL — always shown instead of whatever
 *            the API returns.  Set to '' to leave the API image unchanged.
 */
export const PRODUCT_BARCODE_MAP: {
  keywords: string[];
  barcodes: string[];
  imageUrl?: string;
}[] = [
  {
    keywords: ['takis fuego', 'taki fuego'],
    barcodes: [
      '0757528005276', // confirmed working
      '', // fallback
      '', // fallback 3
    ],
    imageUrl: '', // ← paste product image URL here
  },
  {
    keywords: ['kinder bueno white', 'kinder bueno blanc'],
    barcodes: ['3017620690464'],
    imageUrl: '', // ← paste product image URL here
  },
  {
    keywords: ['coca-cola', 'coca cola', 'coca-cola classic', 'coca cola classic', 'coca-cola original', 'coca cola original', 'coke classic'],
    barcodes: ['5449000054227'],
    imageUrl: 'https://images.openfoodfacts.org/images/products/544/900/005/4227/front_en.3.400.jpg',
  },
  // Add more entries here:
  // {
  //   keywords: ['oreo original', 'oreo cookies'],
  //   barcodes: ['0044000030506', '', ''],
  //   imageUrl: '', // ← paste product image URL here
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

/**
 * Returns the hardcoded imageUrl for a product matched by name or barcode.
 * Returns null if no override is set.
 */
export function lookupHardcodedImage(productTextOrBarcode: string): string | null {
  const lower = productTextOrBarcode.toLowerCase();
  for (const entry of PRODUCT_BARCODE_MAP) {
    const matchKeyword = entry.keywords.some(k => lower.includes(k));
    const matchBarcode = entry.barcodes.some(b => b.trim() !== '' && b === productTextOrBarcode);
    if ((matchKeyword || matchBarcode) && entry.imageUrl) {
      return entry.imageUrl;
    }
  }
  return null;
}
