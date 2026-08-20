/**
 * Rung precedence (Task 6).
 *
 *   A1 origins_tags > A4 OCR statement > A2 labels > A3 processing
 *                   > B1 company > B2 trade flow > C unknown
 *
 * The ordering is not cosmetic. Each rung answers a subtly different question,
 * and letting a weaker one lead means the headline claims more than the
 * evidence supports:
 *
 *   A1  what the record says about the INGREDIENTS
 *   A4  what the PACK says — as strong a claim, but OCR can misread
 *   A2  a regulated mark, mostly about MANUFACTURE, not ingredients
 *   A3  where it was PROCESSED — a different claim entirely
 *   B1  what the COMPANY is documented doing, not this product
 *
 * These tests pin that order so a later change cannot quietly invert it.
 */

import { describe, it, expect } from 'vitest';
import { resolveSupplyChain } from '@/services/supplyChain/resolve';
import type { OpenFoodFactsResult } from '@/services/openfoodfacts/types';
import type {
  PackagingEvidence, PrecomputedOrigin,
} from '@/services/supplyChain/types';

function stub(
  over: Partial<OpenFoodFactsResult> & { labels_tags?: string[]; origins_tags?: string[] } = {},
): OpenFoodFactsResult {
  const { labels_tags, origins_tags, ...rest } = over;
  return {
    found: true, barcode: '3017620422003', productName: 'Test', brand: null,
    ecoscoreGrade: null, ecoscoreScore: null, nutriscoreGrade: null,
    nutriscoreScore: null, novaGroup: null, carbonFootprint100g: null,
    carbonFootprintProduct: null, carbonFootprintServing: null,
    labels: [], categories: [], origins: null, ingredientsText: null,
    imageUrl: null, ecoscoreData: null,
    rawProduct: {
      ...(labels_tags ? { labels_tags } : {}),
      ...(origins_tags ? { origins_tags } : {}),
    } as never,
    ...rest,
  } as OpenFoodFactsResult;
}

const ocr = (text: string, countries: string[]): PackagingEvidence => ({
  statements: [{ text, kind: 'origin', countries }],
});

const origins = (p: OpenFoodFactsResult, pk?: PackagingEvidence | null,
                 pre?: PrecomputedOrigin | null) =>
  resolveSupplyChain(p, null, pk, pre).nodes.filter((n) => n.kind === 'origin');

describe('rung precedence', () => {
  it('A1 leads A4: a curated field beats an OCR read of the same pack', () => {
    // Both are `declared`. The question is which claim leads, and a database
    // field cannot be misread by OCR.
    const nodes = origins(
      stub({ origins_tags: ['en:ghana'] }),
      ocr('Product of Mexico', ['MX']),
    );
    expect(nodes[0].label).toContain('Ghana');
    expect(nodes[0].confidence).toBe(0.9);
    // The pack's claim is not DISCARDED — it is still shown, just second.
    expect(nodes.some((n) => n.label === 'Mexico')).toBe(true);
  });

  it('A4 leads A2: what the pack says about ingredients beats a made-in mark', () => {
    const nodes = origins(
      stub({ labels_tags: ['en:made-in-italy'] }),
      ocr('Product of Mexico', ['MX']),
    );
    expect(nodes[0].label).toBe('Mexico');
    expect(nodes[0].basis).toContain('Printed on the packaging');
  });

  it('A2 leads B1: a regulated mark beats a company-level inference', () => {
    const nodes = origins(stub({ brand: 'Ferrero', labels_tags: ['en:made-in-italy'] }));
    expect(nodes[0].tier).toBe('declared');
    expect(nodes[0].label).toBe('Italy');
  });

  it('the precomputed index fills gaps but never overrides a live claim', () => {
    // The index may have been built before the product was edited, so where
    // both speak, the record in front of us wins.
    const pre: PrecomputedOrigin = {
      code: '3017620422003', bestTier: 'declared',
      claims: [{
        rung: 'A1', tier: 'declared', confidence: 0.9, value: 'en:france',
        basis: 'Precomputed: declared origin of france.',
      }],
    };
    const withLive = origins(stub({ origins_tags: ['en:ghana'] }), null, pre);
    expect(withLive[0].label).toContain('Ghana');

    // With nothing live, the index is what gives the product a map at all.
    const withoutLive = origins(stub(), null, pre);
    expect(withoutLive).toHaveLength(1);
    expect(withoutLive[0].label).toContain('France');
    expect(withoutLive[0].basis).toContain('Precomputed');
  });

  it('never turns a precomputed PROCESSING claim into an origin pin', () => {
    // Rung A3 says where a product was made or packed. Canned tuna with a
    // French health mark was CANNED in France; the tuna came from an ocean.
    const pre: PrecomputedOrigin = {
      code: '3017620422003', bestTier: 'declared',
      claims: [{
        rung: 'A3', tier: 'declared', confidence: 0.75, value: 'France',
        kind: 'processing', basis: 'Processed or packed in France.',
      }],
    };
    expect(origins(stub(), null, pre)).toEqual([]);
  });

  it('holds the 5-origin cap across every rung combined', () => {
    const pre: PrecomputedOrigin = {
      code: '3017620422003', bestTier: 'declared',
      claims: ['en:france', 'en:italy', 'en:spain', 'en:peru', 'en:kenya', 'en:brazil']
        .map((v) => ({ rung: 'A1', tier: 'declared' as const, confidence: 0.9, value: v, basis: `Precomputed ${v}.` })),
    };
    const nodes = origins(
      stub({ origins_tags: ['en:ghana'], labels_tags: ['en:made-in-italy'] }),
      ocr('Product of Mexico', ['MX']),
      pre,
    );
    expect(nodes.length).toBeLessThanOrEqual(5);
  });

  it('is unchanged when no extra evidence is supplied', () => {
    // The whole point of optional plain-data arguments: every existing caller
    // and audit harness keeps getting exactly what it got before.
    const p = stub({ origins_tags: ['en:ghana'] });
    expect(JSON.stringify(resolveSupplyChain(p, null)))
      .toBe(JSON.stringify(resolveSupplyChain(p, null, null, null)));
  });

  it('stays pure: the same inputs give the same graph every time', () => {
    const p = stub({ origins_tags: ['en:ghana'], labels_tags: ['en:made-in-italy'] });
    const pk = ocr('Product of Mexico', ['MX']);
    const a = JSON.stringify(resolveSupplyChain(p, null, pk));
    for (let i = 0; i < 25; i++) {
      expect(JSON.stringify(resolveSupplyChain(p, null, pk))).toBe(a);
    }
  });

  it('never draws an edge to a node it could not place', () => {
    // INVARIANTS §3 and §5, checked across every rung at once.
    const graph = resolveSupplyChain(
      stub({ labels_tags: ['en:eu-agriculture'] }),
      { country: 'France', countryCode: 'FR', city: 'Paris' } as never,
      { statements: [{ text: 'EU Agriculture', kind: 'organic_region', countries: [] }] },
      { code: '3017620422003', bestTier: 'declared',
        claims: [{ rung: 'A1', tier: 'declared', confidence: 0.9,
                   value: 'fr:midi-pyrenees', basis: 'Precomputed region.' }] },
    );
    const unplaced = new Set(
      graph.nodes.filter((n) => n.lon === null || n.lat === null).map((n) => n.id),
    );
    expect(unplaced.size).toBeGreaterThan(0);
    for (const e of graph.edges) {
      expect(unplaced.has(e.from)).toBe(false);
      expect(unplaced.has(e.to)).toBe(false);
    }
  });
});
