import { describe, it, expect } from 'vitest';
import {
  nameSimilarity, pickSibling, applySupplement, needsSupplement, MIN_SIMILARITY,
  productFamily, familiesConflict,
} from './siblingData';
import type { OpenFoodFactsResult } from './types';

const mock = (p: Partial<OpenFoodFactsResult>): OpenFoodFactsResult => ({
  found: true, barcode: '0', productName: null, brand: null,
  ecoscoreGrade: null, ecoscoreScore: null, nutriscoreGrade: null,
  nutriscoreScore: null, novaGroup: null, carbonFootprint100g: null,
  carbonFootprintProduct: null, carbonFootprintServing: null,
  labels: [], categories: [], origins: null, ingredientsText: null,
  imageUrl: null, ecoscoreData: null, rawProduct: null,
  ...p,
});

// The real listing, measured from world.openfoodfacts.org (brand "nutella",
// 428 entries). The scanned jar has no eco-score; siblings do.
const SCANNED = mock({
  barcode: '3017620422003', productName: 'Nutella', brand: 'Nutella, Ferrero',
  ecoscoreGrade: 'unknown', nutriscoreGrade: 'e', ingredientsText: 'sugar, palm oil, hazelnuts',
  categories: ['en:Produits à tartiner', 'en:Pâtes à tartiner'],
});
const SIBLING_SPREAD = mock({
  barcode: '3017620420702', productName: 'Nutella pâte à tartiner aux noisettes',
  brand: 'Nutella, Ferrero', ecoscoreGrade: 'e', ecoscoreScore: 31,
  categories: ['en:chocolate-spreads', 'en:cocoa-and-hazelnuts-spreads'],
});
const SIBLING_BISCUITS = mock({
  barcode: '8000500310427', productName: 'Biscuits NUTELLA B-ready',
  brand: 'Nutella, Ferrero', ecoscoreGrade: 'd', ecoscoreScore: 45,
  categories: ['en:biscuits', 'en:biscuits-cookies-shelf-stable'],
});

describe('nameSimilarity', () => {
  it('treats pack-size variants as the same product', () => {
    expect(nameSimilarity('Nutella 400g jar', 'Nutella 750g')).toBeGreaterThanOrEqual(MIN_SIMILARITY);
  });

  it('survives very different name lengths, which Jaccard could not', () => {
    // "Nutella" vs "Nutella pâte à tartiner aux noisettes" scores 0.33 under
    // Jaccard and would be wrongly rejected.
    expect(nameSimilarity('Nutella', 'Nutella pâte à tartiner aux noisettes'))
      .toBeGreaterThanOrEqual(MIN_SIMILARITY);
  });

  it('folds accents so French entries match', () => {
    expect(nameSimilarity('Nutella pate a tartiner', 'Nutella pâte à tartiner'))
      .toBeGreaterThanOrEqual(MIN_SIMILARITY);
  });
});

describe('needsSupplement', () => {
  it('is true when eco-score is unknown and there is no carbon figure', () => {
    expect(needsSupplement(SCANNED)).toBe(true);
  });

  it('is false when the scanned record already has a real grade', () => {
    expect(needsSupplement(mock({ ecoscoreGrade: 'b' }))).toBe(false);
  });

  it('is false when carbon data exists even without a grade', () => {
    expect(needsSupplement(mock({ carbonFootprint100g: 2.1 }))).toBe(false);
  });
});

describe('pickSibling', () => {
  it('borrows from the matching spread, not the biscuits', () => {
    const sup = pickSibling(SCANNED, [SIBLING_BISCUITS, SIBLING_SPREAD]);
    expect(sup?.sourceBarcode).toBe('3017620420702');
    expect(sup?.ecoscoreGrade).toBe('e');
  });

  it('returns null when only a different product is available', () => {
    expect(pickSibling(SCANNED, [SIBLING_BISCUITS])).toBeNull();
  });

  it('returns null when the scanned product already has data', () => {
    const rich = mock({ ...SCANNED, ecoscoreGrade: 'c' });
    expect(pickSibling(rich, [SIBLING_SPREAD])).toBeNull();
  });

  it('never borrows across brands', () => {
    const otherBrand = mock({
      barcode: 'x', productName: 'Nutella', brand: 'Some Other Co', ecoscoreGrade: 'a',
    });
    expect(pickSibling(SCANNED, [otherBrand])).toBeNull();
  });

  it('never borrows from itself', () => {
    expect(pickSibling(SCANNED, [{ ...SCANNED, ecoscoreGrade: 'a' }])).toBeNull();
  });

  it('picks the most SIMILAR sibling, not the best-graded one', () => {
    // Choosing by grade would let us flatter or punish a product by picking
    // whichever data suited.
    const lessSimilarBetterGrade = mock({
      barcode: 'far', productName: 'Nutella Biscuits Cocoa Snack',
      brand: 'Nutella, Ferrero', ecoscoreGrade: 'a',
      categories: ['en:biscuits'],
    });
    const sup = pickSibling(SCANNED, [lessSimilarBetterGrade, SIBLING_SPREAD]);
    expect(sup?.sourceBarcode).toBe('3017620420702');
  });
});

describe('applySupplement', () => {
  it('fills the gap and records where the number came from', () => {
    const sup = pickSibling(SCANNED, [SIBLING_SPREAD])!;
    const merged = applySupplement(SCANNED, sup);
    expect(merged.ecoscoreGrade).toBe('e');
    expect(merged.supplementedFrom.sourceBarcode).toBe('3017620420702');
    // Identity must survive untouched — this is still the product they scanned.
    expect(merged.barcode).toBe('3017620422003');
    expect(merged.productName).toBe('Nutella');
  });

  it('never overwrites a value the scanned record already had', () => {
    const partial = mock({ ...SCANNED, carbonFootprint100g: 9.9 });
    const merged = applySupplement(partial, {
      carbonFootprint100g: 1.1, sourceBarcode: 'x', sourceProductName: 'y', similarity: 1,
    });
    expect(merged.carbonFootprint100g).toBe(9.9);
  });
});

describe('productFamily / familiesConflict', () => {
  it('reads the same family through two different tag languages', () => {
    // The real records: one tagged in French, one in English slugs.
    expect(productFamily(['en:Produits à tartiner', 'en:Pâtes à tartiner'])).toBe('spread');
    expect(productFamily(['en:chocolate-spreads', 'en:cocoa-and-hazelnuts-spreads'])).toBe('spread');
    expect(familiesConflict(
      ['en:Produits à tartiner'], ['en:chocolate-spreads'],
    )).toBe(false);
  });

  it('detects the spread-vs-biscuit conflict that name matching misses', () => {
    expect(productFamily(['en:biscuits', 'en:biscuits-cookies-shelf-stable'])).toBe('biscuit');
    expect(familiesConflict(['en:Pâtes à tartiner'], ['en:biscuits'])).toBe(true);
  });

  it('treats an unknown family as absence of evidence, not conflict', () => {
    // Blocking on unknown would reject most legitimate matches.
    expect(familiesConflict(null, ['en:biscuits'])).toBe(false);
    expect(familiesConflict([], [])).toBe(false);
  });
});
