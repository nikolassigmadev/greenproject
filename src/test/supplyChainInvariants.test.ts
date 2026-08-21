/**
 * The invariants, asserted mechanically rather than by review.
 *
 * docs/SUPPLY_CHAIN_INVARIANTS.md states the rules that make this feature
 * defensible. Two of them are the ones a future change is most likely to break
 * quietly, because breaking them makes the map look BETTER:
 *
 *   §6  never invent a coordinate
 *   §3  unknown renders as a node, never a line
 *
 * A reviewer cannot catch a centroid slipped in to fill a gap; this can. Every
 * coordinate the resolver emits must be traceable to a bundled table, and the
 * test enumerates those tables rather than trusting a comment.
 */

import { describe, it, expect } from 'vitest';
import { resolveSupplyChain } from '@/services/supplyChain/resolve';
import { ORIGIN_POINTS, COUNTRY_CENTROIDS, CITY_POINTS } from '@/data/supplyChain/originPoints';
import { COUNTRY_POINTS } from '@/data/supplyChain/countryPoints';
import { lookupFsisEstablishment } from '@/data/supplyChain/fsisEstablishments';
import type { OpenFoodFactsResult } from '@/services/openfoodfacts/types';
import type { PackagingEvidence, PrecomputedOrigin } from '@/services/supplyChain/types';

/** Every coordinate the app is ALLOWED to draw, from the bundled tables. */
const ALLOWED = new Set<string>();
const key = (lon: number, lat: number) => `${lon},${lat}`;
for (const p of Object.values(ORIGIN_POINTS)) ALLOWED.add(key(p.lon, p.lat));
for (const p of Object.values(COUNTRY_CENTROIDS)) ALLOWED.add(key(p.lon, p.lat));
for (const p of Object.values(CITY_POINTS)) ALLOWED.add(key(p.lon, p.lat));
for (const p of Object.values(COUNTRY_POINTS)) ALLOWED.add(key(p.lon, p.lat));
// FSIS coordinates are real facility locations from the USDA directory.
for (const est of ['G1016', 'G1028', 'G1105']) {
  const f = lookupFsisEstablishment(est);
  if (f) ALLOWED.add(key(f.lon, f.lat));
}

function stub(over: Record<string, unknown> = {}): OpenFoodFactsResult {
  const { labels_tags, origins_tags, categories_tags, ...rest } = over;
  return {
    found: true, barcode: '3017620422003', productName: 'Test',
    brand: (rest.brand as string) ?? null,
    ecoscoreGrade: null, ecoscoreScore: null, nutriscoreGrade: null,
    nutriscoreScore: null, novaGroup: null, carbonFootprint100g: null,
    carbonFootprintProduct: null, carbonFootprintServing: null,
    labels: [], categories: [], origins: (rest.origins as string) ?? null,
    ingredientsText: null, imageUrl: null, ecoscoreData: null,
    rawProduct: { labels_tags, origins_tags, categories_tags } as never,
    ...rest,
  } as OpenFoodFactsResult;
}

/** A spread that exercises every rung, including the awkward combinations. */
const CASES: { product: OpenFoodFactsResult; packaging?: PackagingEvidence; pre?: PrecomputedOrigin }[] = [
  { product: stub({ origins_tags: ['en:france'] }) },
  { product: stub({ origins_tags: ['en:ivory-coast', 'en:ghana', 'en:indonesia'] }) },
  { product: stub({ origins: 'Ghana, Côte d\'Ivoire' }) },
  { product: stub({ labels_tags: ['en:made-in-france'] }) },
  { product: stub({ labels_tags: ['en:eu-agriculture'] }) },
  { product: stub({ labels_tags: ['en:pdo', 'en:pgi'] }) },
  { product: stub({ origins_tags: ['fr:midi-pyrenees', 'fr:fao-27'] }) },
  { product: stub({ brand: 'Ferrero' }) },
  { product: stub({ brand: 'Nestlé' }) },
  { product: stub({ brand: 'Mondelez', origins_tags: ['en:ghana'] }) },
  { product: stub({ categories_tags: ['en:honeys'] }),
    packaging: { statements: [{ text: 'Spain 45%, Argentina 30%', kind: 'origin',
      countries: ['ES', 'AR'], percentages: { ES: 45, AR: 30 } }] } },
  { product: stub(), packaging: { statements: [{ text: 'Product of Mexico', kind: 'origin', countries: ['MX'] }] } },
  { product: stub(), packaging: { statements: [{ text: 'EU Agriculture', kind: 'organic_region', countries: [] }] } },
  { product: stub(), packaging: { usdaFacility: lookupFsisEstablishment('G1016') } },
  { product: stub(), pre: { code: '3017620422003', bestTier: 'declared',
      claims: [{ rung: 'A1', tier: 'declared', confidence: 0.9, value: 'en:peru', basis: 'Precomputed peru.' }] } },
  { product: stub(), pre: { code: '3017620422003', bestTier: 'declared',
      claims: [{ rung: 'A1', tier: 'declared', confidence: 0.9, value: 'zz:nowhere', basis: 'Unplaceable.' }] } },
];

const REGIONS = [
  null,
  { country: 'Indonesia', countryCode: 'ID', city: 'Denpasar' },
  { country: 'France', countryCode: 'FR', city: 'Paris' },
  { country: 'Atlantis', countryCode: 'ZZ', city: 'Nowhere' },
] as unknown as (Parameters<typeof resolveSupplyChain>[1])[];

describe('supply-chain invariants', () => {
  it('the coordinate guard can actually fail', () => {
    // A test that cannot fail is worse than no test, and this one would pass
    // trivially if ALLOWED were over-broad or the cases produced no placed
    // nodes at all. So: prove the guard rejects a plausible-looking invented
    // coordinate, and prove the cases really do place nodes for it to check.
    expect(ALLOWED.has(key(2.3522, 48.8566))).toBe(false); // Paris, city hall
    expect(ALLOWED.has(key(0, 0))).toBe(false);
    expect(ALLOWED.size).toBeGreaterThan(100);

    let placed = 0;
    for (const c of CASES) {
      const graph = resolveSupplyChain(c.product, REGIONS[1], c.packaging, c.pre);
      placed += graph.nodes.filter((n) => n.lon !== null && n.lat !== null).length;
    }
    expect(placed).toBeGreaterThan(20);
  });

  it('§6 — never emits a coordinate that is not in a bundled table', () => {
    const offenders: string[] = [];
    for (const c of CASES) {
      for (const region of REGIONS) {
        const graph = resolveSupplyChain(c.product, region, c.packaging, c.pre);
        for (const n of graph.nodes) {
          if (n.lon === null || n.lat === null) continue;
          if (!ALLOWED.has(key(n.lon, n.lat))) {
            offenders.push(`${n.kind} "${n.label}" at ${n.lon},${n.lat}`);
          }
        }
      }
    }
    // An invented coordinate is the failure mode that makes the map look
    // better while making it a fabrication engine. There is no acceptable count
    // above zero.
    expect(offenders).toEqual([]);
  });

  it('§3 and §5 — no edge ever touches a node without coordinates', () => {
    for (const c of CASES) {
      for (const region of REGIONS) {
        const graph = resolveSupplyChain(c.product, region, c.packaging, c.pre);
        const unplaced = new Set(
          graph.nodes.filter((n) => n.lon === null || n.lat === null).map((n) => n.id),
        );
        for (const e of graph.edges) {
          expect(unplaced.has(e.from)).toBe(false);
          expect(unplaced.has(e.to)).toBe(false);
        }
      }
    }
  });

  it('§Scope — never exceeds five origin arcs', () => {
    for (const c of CASES) {
      for (const region of REGIONS) {
        const graph = resolveSupplyChain(c.product, region, c.packaging, c.pre);
        expect(graph.nodes.filter((n) => n.kind === 'origin').length).toBeLessThanOrEqual(5);
      }
    }
  });

  it('§1 — every node carries a tier, a confidence and a plain-English basis', () => {
    for (const c of CASES) {
      const graph = resolveSupplyChain(c.product, REGIONS[1], c.packaging, c.pre);
      for (const n of graph.nodes) {
        expect(['declared', 'inferred', 'unknown']).toContain(n.tier);
        expect(n.confidence).toBeGreaterThanOrEqual(0);
        expect(n.confidence).toBeLessThanOrEqual(1);
        expect(n.basis.length).toBeGreaterThan(10);
        expect(Array.isArray(n.sources)).toBe(true);
      }
    }
  });

  it('§2 — an unknown-tier node never carries a confidence above zero', () => {
    for (const c of CASES) {
      const graph = resolveSupplyChain(c.product, REGIONS[1], c.packaging, c.pre);
      for (const n of graph.nodes) {
        if (n.tier === 'unknown') expect(n.confidence).toBe(0);
      }
    }
  });

  it('§4 — is pure: no Date.now, no Math.random, no drift across runs', () => {
    for (const c of CASES) {
      const first = JSON.stringify(resolveSupplyChain(c.product, REGIONS[1], c.packaging, c.pre));
      for (let i = 0; i < 10; i++) {
        expect(JSON.stringify(resolveSupplyChain(c.product, REGIONS[1], c.packaging, c.pre)))
          .toBe(first);
      }
    }
  });
});
