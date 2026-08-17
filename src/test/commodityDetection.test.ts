/**
 * Guards the ingredient→commodity matching that drives the origin map.
 *
 * Every case below is a bug this file already caught once. A false positive
 * here is not cosmetic: it puts a country on a map next to a child-labour
 * warning for a product that never contained the commodity.
 */

import { describe, it, expect } from 'vitest';
import { detectCommodities } from '@/data/supplyChain/commodityOrigins';

const found = (text: string) => detectCommodities(text).map((m) => m.profile.commodity).sort();

describe('commodity detection — must NOT match', () => {
  it.each([
    ['plain water', 'Water, carbon dioxide'],
    ['French water', 'Eau de source naturelle'],
    ['generic sugar (could be beet)', 'Sugar, glucose syrup, citric acid, natural flavouring'],
    // Vanillin is usually synthetic. Matching it would point at Madagascar for
    // a molecule that never saw a vanilla pod.
    ['synthetic vanillin', 'Milk, sugar, vanillin'],
    ['French synthetic vanillin', 'Lait, sucre, arôme vanilline'],
    // "banana flavouring" contains no banana.
    ['banana flavouring', 'Banana flavouring, sugar, water'],
    // \b would let "liquorice" match /rice/ if the boundary were wrong.
    ['liquorice is not rice', 'Liquorice extract, sugar, wheat flour'],
    // "caffeine" / "caféïne" must not read as "café". The accented lookahead
    // has to exclude accented letters too, or "caféïne" slips through.
    ['caffeine', 'Coca-Cola: carbonated water, sugar, caffeine, caramel colour'],
    ['French caffeine', 'Caféïne, eau gazeuse'],
    ['plain wheat bread', 'Wheat flour, sugar, salt, yeast'],
  ])('%s', (_label, text) => {
    expect(found(text)).toEqual([]);
  });
});

describe('commodity detection — must match', () => {
  it('reads real ingredients', () => {
    expect(found('Soy lecithin, cocoa butter, sugar')).toEqual(['cocoa', 'soy']);
    expect(found('Green tea leaves')).toEqual(['tea']);
    expect(found('Riz, eau, sel')).toEqual(['rice']);
    expect(found('Huile de palme, sucre')).toEqual(['palm-oil']);
  });

  // JavaScript's \b is ASCII-only: "é" is not a word character, so /th(é|e)\b/
  // never fires on "Thé vert". This silently cost every French tea and coffee
  // product an origin until it was measured.
  it('handles accented French, where \\b does not work', () => {
    expect(found('Thé vert')).toEqual(['tea']);
    expect(found('Café moulu pur arabica')).toEqual(['coffee']);
  });

  it('falls back to name and category when ingredients are empty', () => {
    // A bag of coffee often has no ingredients list at all in Open Food Facts,
    // because the name already says what it is.
    const byName = detectCommodities(null, 'Café moulu arabica', null);
    expect(byName.map((m) => m.profile.commodity)).toEqual(['coffee']);
    expect(byName[0].matchedIn).toBe('name');

    const byCat = detectCommodities(null, null, ['en:teas', 'en:beverages']);
    expect(byCat.map((m) => m.profile.commodity)).toEqual(['tea']);
    expect(byCat[0].matchedIn).toBe('category');
  });

  it('prefers the ingredients list over weaker signals', () => {
    const m = detectCommodities('Cocoa mass, sugar', 'Cocoa bar', ['en:chocolates']);
    expect(m[0].matchedIn).toBe('ingredients');
  });
});
