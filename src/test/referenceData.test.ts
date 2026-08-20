/**
 * Bundled reference datasets (Task 4).
 *
 * Only two sources are ingested, both with unambiguous licences:
 *   USDA FSIS MPI Directory  — CC0 / public domain (US Government work)
 *   Sugar Collaboration Group UML — CC BY-SA 4.0, share-alike
 *
 * The palm-oil Universal Mill List and Trase trade-flow data are NOT here and
 * must not be added without written licence terms — see the BLOCKED section in
 * scripts/supplychain/fetch_reference_data.sh.
 */

import { describe, it, expect } from 'vitest';
import {
  lookupFsisEstablishment, FSIS_COUNT, FSIS_SOURCE,
} from '@/data/supplyChain/fsisEstablishments';
import {
  SUGAR_MILLS, SUGAR_MILL_COUNT, SUGAR_UML_SOURCE, sugarMillsByIso3,
} from '@/data/supplyChain/sugarMills';
import { parseUsdaEstablishment } from '@/services/supplyChain/originStatement';
import { resolveSupplyChain } from '@/services/supplyChain/resolve';
import { resolveUsdaFacility } from '@/services/supplyChain/resolveFacility';
import type { OpenFoodFactsResult } from '@/services/openfoodfacts/types';

function stub(): OpenFoodFactsResult {
  return {
    found: true, barcode: '0000000000000', productName: 'Test', brand: null,
    ecoscoreGrade: null, ecoscoreScore: null, nutriscoreGrade: null,
    nutriscoreScore: null, novaGroup: null, carbonFootprint100g: null,
    carbonFootprintProduct: null, carbonFootprintServing: null,
    labels: [], categories: [], origins: null, ingredientsText: null,
    imageUrl: null, ecoscoreData: null, rawProduct: {} as never,
  } as OpenFoodFactsResult;
}

describe('FSIS establishment directory', () => {
  it('bundles the whole directory', () => {
    // Compound entries ('G1126A+V1126A') are indexed under EACH number, because
    // the pack prints only one of them — so numbers exceed directory rows.
    expect(FSIS_COUNT).toBeGreaterThan(7000);
    expect(FSIS_SOURCE.label).toContain('public domain');
  });

  it('resolves the forms an establishment number actually takes on a pack', () => {
    const direct = lookupFsisEstablishment('G1016');
    expect(direct).not.toBeNull();
    expect(direct!.name).toContain('Waldbaum');
    expect(direct!.state).toBe('MN');
    // Real coordinates from the directory, not a city centroid.
    expect(direct!.lat).toBeGreaterThan(40);
    expect(direct!.lon).toBeLessThan(-90);

    // The same establishment as printed inside the mark, in its usual forms.
    for (const form of ['EST. G1016', 'est g1016', 'G-1016', ' G1016 ']) {
      expect(lookupFsisEstablishment(form)?.name).toBe(direct!.name);
    }
  });

  it('indexes both halves of a compound establishment number', () => {
    // 'G1126A+V1126A' is ONE facility holding two grants; the pack prints one.
    expect(lookupFsisEstablishment('G1126A')).not.toBeNull();
    expect(lookupFsisEstablishment('V1126A')).not.toBeNull();
  });

  it('returns null rather than guessing on an unknown number', () => {
    expect(lookupFsisEstablishment('ZZ99999')).toBeNull();
    expect(lookupFsisEstablishment('')).toBeNull();
    expect(lookupFsisEstablishment(null)).toBeNull();
    expect(lookupFsisEstablishment(undefined)).toBeNull();
  });

  it('makes the FSIS hit a PROCESSING node, never an origin', () => {
    // The mark says where the product was processed or packed. It says nothing
    // about where the animal was raised, and the copy has to carry that.
    const graph = resolveSupplyChain(stub(), null, {
      usdaFacility: lookupFsisEstablishment('G1016'),
    });
    const proc = graph.nodes.find((n) => n.kind === 'processing')!;
    expect(proc.tier).toBe('declared');
    expect(proc.lon).toBeTypeOf('number');
    expect(proc.basis).toContain('not where the animals were raised');
    expect(graph.nodes.filter((n) => n.kind === 'origin')).toEqual([]);
  });

  it('falls back to "not disclosed" when the number does not resolve', () => {
    const graph = resolveSupplyChain(stub(), null, {
      usdaFacility: lookupFsisEstablishment('ZZ99999'),
    });
    expect(graph.nodes.find((n) => n.kind === 'processing')!.tier).toBe('unknown');
  });
});

describe('parseUsdaEstablishment', () => {
  it('reads the number from the model reply', () => {
    expect(parseUsdaEstablishment('{"statements":[],"usdaEstablishment":"EST. 34D"}'))
      .toBe('34D');
    expect(parseUsdaEstablishment('{"statements":[],"usdaEstablishment":"P-12345"}'))
      .toBe('P12345');
  });

  it('returns null for anything that is not plausibly an establishment number', () => {
    // A wrong number resolves to a real but WRONG factory — worse than nothing.
    for (const v of ['null', '{}', '{"usdaEstablishment":null}',
                     '{"usdaEstablishment":"see back of pack"}',
                     '{"usdaEstablishment":"1234567890123"}', 'garbage', '']) {
      expect(parseUsdaEstablishment(v)).toBeNull();
    }
  });
});

describe('Sugar Universal Mill List', () => {
  it('bundles every mill with real coordinates', () => {
    expect(SUGAR_MILL_COUNT).toBeGreaterThan(1000);
    expect(SUGAR_MILLS).toHaveLength(SUGAR_MILL_COUNT);
    for (const m of SUGAR_MILLS) {
      expect(Number.isFinite(m[4])).toBe(true);
      expect(Number.isFinite(m[5])).toBe(true);
      expect(Math.abs(m[5])).toBeLessThanOrEqual(90);
      expect(Math.abs(m[4])).toBeLessThanOrEqual(180);
    }
  });

  it('carries the share-alike licence with it', () => {
    // CC BY-SA is a real constraint on anything derived and redistributed,
    // not a footnote — the notice has to travel with the data.
    expect(SUGAR_UML_SOURCE.label).toContain('CC BY-SA 4.0');
  });

  it('filters by ISO 3166-1 alpha-3 without guessing', () => {
    expect(sugarMillsByIso3('BRA').length).toBeGreaterThan(200);
    expect(sugarMillsByIso3('IDN').length).toBeGreaterThan(10);
    expect(sugarMillsByIso3('ZZZ')).toEqual([]);
    expect(sugarMillsByIso3(null)).toEqual([]);
  });
});

describe('resolveUsdaFacility (lazy directory load)', () => {
  it('resolves a real number without the resolver importing the directory', async () => {
    // The directory is 13,290 establishments. Loading it from the resolver put
    // ~305 KB gzipped into the verdict-page chunk for every scan worldwide, to
    // serve a lookup that only fires on US meat. It is loaded on demand instead.
    const f = await resolveUsdaFacility('EST. G1016');
    expect(f?.name).toContain('Waldbaum');
    expect(f?.lat).toBeGreaterThan(40);
  });

  it('returns null for an unknown or empty number', async () => {
    expect(await resolveUsdaFacility('ZZ99999')).toBeNull();
    expect(await resolveUsdaFacility(null)).toBeNull();
    expect(await resolveUsdaFacility('')).toBeNull();
  });
});
