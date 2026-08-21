/**
 * What the map actually SHOWS.
 *
 * The resolver tests prove the graph is right. They do not prove the component
 * renders the parts that carry the argument — the honey disclosure copy, the
 * per-origin percentages, and the licence attribution. Those live in JSX, and
 * JSX is exactly where a correct graph quietly stops reaching the user.
 *
 * The attribution in particular is a licence CONDITION (ODbL, CC BY-SA), so
 * "it is in the component somewhere" is not good enough — it has to be in the
 * rendered output without the user opening anything.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SupplyChainMap } from '@/components/SupplyChainMap';
import type { OpenFoodFactsResult } from '@/services/openfoodfacts/types';
import type { PackagingEvidence } from '@/services/supplyChain/types';

// The component fetches the precomputed index on mount. Absence is the ordinary
// case, so a 404 is the honest default for these tests.
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: false, status: 404, json: async () => ({}),
  })) as unknown as typeof fetch);
  // jsdom has no canvas 2D context; the globe draws in a useEffect we do not
  // need here, and without this it throws before the DOM we DO care about.
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as never;
});

function honeyProduct(): OpenFoodFactsResult {
  return {
    found: true, barcode: '3564709171715', productName: 'Miel', brand: null,
    ecoscoreGrade: null, ecoscoreScore: null, nutriscoreGrade: null,
    nutriscoreScore: null, novaGroup: null, carbonFootprint100g: null,
    carbonFootprintProduct: null, carbonFootprintServing: null,
    labels: [], categories: [], origins: null, ingredientsText: null,
    imageUrl: null, ecoscoreData: null,
    rawProduct: { categories_tags: ['en:honeys'] } as never,
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

describe('SupplyChainMap rendering', () => {
  it('shows the honey disclosure copy and every declared percentage', async () => {
    render(<SupplyChainMap product={honeyProduct()} region={null} packaging={JAR} />);

    await waitFor(() => {
      expect(screen.getByText(/EU law requires honey to list every origin country/i))
        .toBeTruthy();
    });

    // Each origin, with the share the jar declares. Descending, as printed.
    for (const [country, share] of [['Spain', '45%'], ['Argentina', '30%'], ['Ukraine', '25%']]) {
      expect(screen.getByText(country)).toBeTruthy();
      expect(screen.getAllByText(share).length).toBeGreaterThan(0);
    }
  });

  it('renders the licence attribution WITHOUT the user opening anything', async () => {
    // ODbL and CC BY-SA require attribution as a condition of use. A credit
    // hidden inside a collapsed <details> is not obviously discharging it, so
    // this asserts it is in the rendered output directly.
    const { container } = render(
      <SupplyChainMap product={honeyProduct()} region={null} packaging={JAR} />,
    );
    await waitFor(() => {
      expect(screen.getByText(/Open Food Facts, licensed under ODbL/i)).toBeTruthy();
    });
    const attribution = screen.getByText(/Open Food Facts, licensed under ODbL/i);
    expect(attribution.closest('details')).toBeNull();
    expect(container.textContent).toContain('CC BY-SA 4.0');
  });

  it('says the list is unread rather than implying the jar has none', async () => {
    render(<SupplyChainMap product={honeyProduct()} region={null} packaging={null} />);
    await waitFor(() => {
      expect(screen.getByText(/have not been able to read that list/i)).toBeTruthy();
    });
  });

  it('shows no honey copy for a product that is not honey', async () => {
    const chocolate = { ...honeyProduct(), rawProduct: { categories_tags: ['en:chocolates'] } as never };
    render(<SupplyChainMap product={chocolate} region={null} packaging={null} />);
    await waitFor(() => {
      expect(screen.queryByText(/EU law requires honey/i)).toBeNull();
    });
  });
});
