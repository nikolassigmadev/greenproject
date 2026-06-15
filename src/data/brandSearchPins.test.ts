import { describe, it, expect } from 'vitest';
import { getPinnedBarcodes, BRAND_PINS } from './brandSearchPins';

const marmite = BRAND_PINS.find((p) => p.token === 'marmite')!.barcodes;
const vegemite = BRAND_PINS.find((p) => p.token === 'vegemite')!.barcodes;

describe('getPinnedBarcodes', () => {
  it('pins the bare brand name', () => {
    expect(getPinnedBarcodes('Marmite')).toEqual(marmite);
    expect(getPinnedBarcodes('Vegemite')).toEqual(vegemite);
  });

  it('is case-insensitive and trims', () => {
    expect(getPinnedBarcodes('  VEGEMITE  ')).toEqual(vegemite);
  });

  it('pins when the generic "yeast extract" descriptor rides along', () => {
    expect(getPinnedBarcodes('Marmite yeast extract')).toEqual(marmite);
    expect(getPinnedBarcodes('Vegemite, yeast extract')).toEqual(vegemite);
    expect(getPinnedBarcodes('Vegemite - yeast extract')).toEqual(vegemite);
    expect(getPinnedBarcodes('yeast extract marmite')).toEqual(marmite);
  });

  it('pins through size and filler tokens', () => {
    expect(getPinnedBarcodes('Marmite yeast extract spread 250g')).toEqual(marmite);
    expect(getPinnedBarcodes('Vegemite original 220g')).toEqual(vegemite);
  });

  it('does NOT pin distinct variant lines', () => {
    expect(getPinnedBarcodes('Marmite Truffle')).toEqual([]);
    expect(getPinnedBarcodes('Marmite XO')).toEqual([]);
    expect(getPinnedBarcodes('Marmite flatbreads')).toEqual([]);
    expect(getPinnedBarcodes('Vegemite cheese crackers')).toEqual([]);
    expect(getPinnedBarcodes('Vegemite Snackabouts')).toEqual([]);
  });

  it('does NOT pin unrelated queries', () => {
    expect(getPinnedBarcodes('yeast extract flatbreads')).toEqual([]);
    expect(getPinnedBarcodes('Nutella')).toEqual([]);
    expect(getPinnedBarcodes('')).toEqual([]);
  });
});
