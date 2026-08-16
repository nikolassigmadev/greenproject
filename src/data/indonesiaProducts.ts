// Products actually sold in Indonesia.
//
// Built from scripts/market-research.mjs against Open Food Facts on 2026-08-15,
// not from memory. Every barcode below is a real OFF entry tagged as sold in
// Indonesia, and the store notes come from OFF's own `stores` tags. Re-run:
//
//   node scripts/market-research.mjs ID coffees chocolates teas instant-noodles
//
// WHY THIS FILE EXISTS
//
// The curated catalogue was built for Western shelves. Asked for coffee at
// Indomaret it offered Cafédirect, BLK & Bold and a Colorado roaster called
// Conscious Coffees — none of which Indomaret has ever stocked. A recommendation
// you cannot act on is worse than no recommendation: it costs the shopper a walk
// down the aisle and costs us their trust.
//
// WHAT IT DELIBERATELY DOESN'T CONTAIN
//
// Indonesian instant coffee (Kapal Api, Luwak, ABC, Torabika, Good Day) is
// mass-market with no certification or published sourcing standard I could
// verify. Rather than dress one of them up as the "ethical pick", the coffee
// category for Indonesia is left empty and the app says it has nothing verified
// to offer. An honest gap is a finding; an invented recommendation is not.

import type { AltCandidate, SwapCategoryKey } from '@/data/ethicalAlternatives';

/**
 * Indonesian alternatives, per category.
 *
 * `markets: ['ID']` on every entry, so these never leak into other countries the
 * way the Western entries leaked into this one.
 */
const INDONESIA_ALTERNATIVES: Partial<Record<SwapCategoryKey, AltCandidate[]>> = {
  chocolate: [
    {
      brand: 'Krakakoa',
      productName: 'Single Origin Bali 85% Cocoa',
      searchQuery: 'Krakakoa chocolate',
      barcodes: ['8997034690296'],
      certifications: [],
      strengths: [
        'Indonesian bean-to-bar — buys cocoa direct from Sumatran and Balinese farmers',
        'Runs farmer training and pays above the local market rate',
      ],
      addresses: ['labor'],
      markets: ['ID'],
      fallbackEcoGrade: 'e',
    },
    {
      brand: 'Junglegold Bali',
      productName: 'Bali 100% Cacao Chocolate Drops',
      searchQuery: 'Junglegold Bali cacao',
      barcodes: ['8997212731629'],
      certifications: [],
      strengths: [
        'Made in Bali from Balinese cacao — short, visible supply chain',
        'Direct trade with local growers',
      ],
      addresses: ['labor'],
      markets: ['ID'],
      fallbackEcoGrade: 'e',
    },
    {
      brand: 'Monggo',
      productName: 'Dark Chocolate',
      searchQuery: 'Monggo chocolate',
      barcodes: ['0997403811008'],
      certifications: [],
      strengths: [
        'Yogyakarta artisan maker using Indonesian cocoa',
        'Small-scale production, named sourcing regions',
      ],
      addresses: ['labor'],
      markets: ['ID'],
    },
  ],

  // Tea has genuine local options with strong eco-grades, and Tong Tji is
  // widely stocked including in the convenience chains.
  tea: [
    {
      brand: 'Tong Tji',
      productName: 'Teh Celup (tea bags)',
      searchQuery: 'Tong Tji teh celup',
      barcodes: ['8992936115069', '8992936115021'],
      certifications: [],
      strengths: [
        'Indonesian-grown and Indonesian-owned — no import leg',
        'Plain leaf tea rather than a sugared ready-to-drink',
      ],
      addresses: ['eco'],
      markets: ['ID'],
      fallbackEcoGrade: 'a',
    },
  ],

  // Lemonilo is the one instant-noodle brand here with a materially different
  // product (baked rather than fried, no MSG) and it is stocked at Indomaret.
  // Its strength is the formulation, NOT a labour or sourcing claim — the
  // strengths below say so rather than implying an ethics story it hasn't made.
  chips: [
    {
      brand: 'Lemonilo',
      productName: 'Keripik Ubi Jagung (baked cassava-corn crisps)',
      searchQuery: 'Lemonilo keripik',
      barcodes: ['8997014021867'],
      certifications: [],
      strengths: [
        'Baked, not fried, and made without MSG',
        'Indonesian brand, widely stocked at Indomaret',
      ],
      addresses: ['eco'],
      markets: ['ID'],
      fallbackEcoGrade: 'c',
    },
  ],
};

export function getIndonesiaCandidates(category: SwapCategoryKey): AltCandidate[] {
  return INDONESIA_ALTERNATIVES[category] ?? [];
}

/**
 * Categories where we have at least one verified Indonesian option.
 * Everything else falls through to a live product search, which is honest about
 * being a search rather than a recommendation.
 */
export const INDONESIA_COVERED_CATEGORIES = Object.keys(
  INDONESIA_ALTERNATIVES,
) as SwapCategoryKey[];

/**
 * Chains whose own-shelf presence we've seen in Open Food Facts store tags for
 * these products. Informational only — availability itself is still decided by
 * services/retailers from the live product data, never from this list.
 */
export const ID_STORE_TAG_NOTES: Record<string, string[]> = {
  '8994171101289': ['indomaret', 'alfamart'],   // Luwak White Coffee
  '8991002105485': ['indomaret', 'alfamart'],   // Kapal Api Special Mix
  '8998666003072': ['indomaret', 'alfamart'],   // Torabika Gilus Mix
  '8991002122017': ['alfamart'],                // ABC Kopi Susu
  '8997014021867': ['indomaret'],               // Lemonilo crisps
  '8993175538947': ['indomaret'],               // Nabati Nextar
  '0089686598957': ['indomaret', 'alfamart'],   // Chitato
};
