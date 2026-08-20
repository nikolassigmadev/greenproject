/**
 * Honey — the flagship demo (Task 7).
 *
 * Since 14 June 2026, Dir. (EU) 2024/1438 requires every honey jar sold in the
 * EU to list each origin country in descending order WITH its percentage. That
 * makes honey the ONE category where a complete, verified, percentage-weighted
 * origin breakdown is possible today.
 *
 * The point of the demo is the contrast. Honey works because the law forces the
 * disclosure onto the jar; cocoa cannot, for anyone, including the brands,
 * because lot identity is destroyed at the co-op, the port and the processor
 * long before it reaches a barcode. These tests pin both halves.
 */

import { describe, it, expect } from 'vitest';
import { resolveSupplyChain, isHoney } from '@/services/supplyChain/resolve';
import type { OpenFoodFactsResult } from '@/services/openfoodfacts/types';
import type { PackagingEvidence } from '@/services/supplyChain/types';

function stub(categories_tags: string[] = [], over: Partial<OpenFoodFactsResult> = {}) {
  return {
    found: true, barcode: '5000000000000', productName: 'Test', brand: null,
    ecoscoreGrade: null, ecoscoreScore: null, nutriscoreGrade: null,
    nutriscoreScore: null, novaGroup: null, carbonFootprint100g: null,
    carbonFootprintProduct: null, carbonFootprintServing: null,
    labels: [], categories: [], origins: null, ingredientsText: null,
    imageUrl: null, ecoscoreData: null,
    rawProduct: { categories_tags } as never,
    ...over,
  } as OpenFoodFactsResult;
}

const JAR: PackagingEvidence = {
  statements: [{
    text: 'Blend of honeys: Spain 45%, Argentina 30%, Ukraine 25%',
    kind: 'origin',
    countries: ['ES', 'AR', 'UA'],
    percentages: { ES: 45, AR: 30, UA: 25 },
  }],
};

describe('honey', () => {
  it('detects honey from the canonical category tag', () => {
    expect(isHoney(stub(['en:honeys']))).toBe(true);
    expect(isHoney(stub(['fr:miels']))).toBe(false);
    expect(isHoney(stub(['en:chocolates']))).toBe(false);
  });

  it('produces a percentage-weighted multi-origin breakdown, all declared', () => {
    const graph = resolveSupplyChain(stub(['en:honeys']), null, JAR);
    const origins = graph.nodes.filter((n) => n.kind === 'origin');

    expect(origins).toHaveLength(3);
    expect(origins.every((n) => n.tier === 'declared')).toBe(true);
    // Descending order, exactly as the jar must print it.
    expect(origins.map((n) => n.declaredShare)).toEqual([45, 30, 25]);
    expect(origins.map((n) => n.label)).toEqual(['Spain', 'Argentina', 'Ukraine']);
    // Every one is placed, so the breakdown is drawable.
    expect(origins.every((n) => n.lon !== null && n.lat !== null)).toBe(true);
  });

  it('explains WHY the breakdown exists, and cites the directive', () => {
    const graph = resolveSupplyChain(stub(['en:honeys']), null, JAR);
    expect(graph.mandatoryDisclosure?.category).toBe('honey');
    expect(graph.mandatoryDisclosure?.copy)
      .toContain('EU law requires honey to list every origin country with its percentage');
    expect(graph.mandatoryDisclosure?.source.label).toContain('2024/1438');
  });

  it('says the list is unread rather than implying the jar lacks one', () => {
    // A jar we could not read is not a jar with no disclosure. The law
    // guarantees the list is printed; the gap is ours, and the copy says so.
    const graph = resolveSupplyChain(stub(['en:honeys']), null, null);
    expect(graph.mandatoryDisclosure?.copy).toContain('not been able to read');
    expect(graph.nodes.filter((n) => n.kind === 'origin')).toEqual([]);
  });

  it('never normalises the declared shares to sum to 100', () => {
    // The directive allows a 5% tolerance, so real jars need not total 100.
    // "Tidying" them would be inventing a number the label does not carry.
    const partial: PackagingEvidence = {
      statements: [{
        text: 'Blend of EU honeys: Spain 40%, Poland 35%',
        kind: 'origin', countries: ['ES', 'PL'], percentages: { ES: 40, PL: 35 },
      }],
    };
    const shares = resolveSupplyChain(stub(['en:honeys']), null, partial)
      .nodes.filter((n) => n.kind === 'origin').map((n) => n.declaredShare);
    expect(shares).toEqual([40, 35]);
    expect(shares.reduce((a, b) => (a ?? 0) + (b ?? 0), 0)).toBe(75);
  });

  it('claims no mandatory disclosure for chocolate — the contrast is the point', () => {
    // Cocoa is bulked at the co-op, mixed at the port and blended at the
    // processor. Lot identity is gone long before the barcode, so no law
    // requires — and no brand can supply — an equivalent breakdown.
    const graph = resolveSupplyChain(stub(['en:chocolates']), null, null);
    expect(graph.mandatoryDisclosure).toBeUndefined();
  });
});
