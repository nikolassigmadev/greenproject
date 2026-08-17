// Turn a product into a provenance graph.
//
// Pure, synchronous, offline. Same contract as personalizedScore.ts, for the
// same reason: it must be runnable thousands of times by an audit harness.
//
// The rule that shapes everything here (docs/SUPPLY_CHAIN_INVARIANTS.md §3):
// unknown provenance is a NODE, never a line. "Nestlé does not disclose where
// the palm oil in this product was grown" is a stronger statement than a
// made-up arc, and it's the one that matches this app's voice. It is also what
// lets every product have a map.
//
// v1 scope. Tier-B inference currently comes from our own cited
// commoditySupplyChains dataset rather than a FAOSTAT trade matrix — that table
// is Session 3 and isn't built. So an inferred origin here means "this company
// is documented as sourcing this commodity from this region", which is a
// narrower and better-evidenced claim than a national import share. When
// FAOSTAT lands it becomes an additional, weaker tier below this one.

import type { OpenFoodFactsResult } from '@/services/openfoodfacts/types';
import type { UserRegion } from '@/utils/userRegion';
import { getCommodityRecordsByBrand, COMMODITY_LABELS } from '@/data/commoditySupplyChains';
import { findChocolateEntry } from '@/data/chocolateDirectory';
import {
  ORIGIN_POINTS, COUNTRY_CENTROIDS, lookupCity, type OriginPoint,
} from '@/data/supplyChain/originPoints';
import type {
  SupplyChainGraph, SupplyChainNode, SupplyChainEdge, ProvenanceTier, SourceRef,
} from './types';

/** Never draw more than this many origin arcs, however much data exists. */
const MAX_ORIGINS = 5;

/**
 * US DOL TVPRA — commodity × country where child or forced labour is documented.
 *
 * Public domain (US Government work) and already cited in brandFlags.v2.ts.
 * This is the join key that makes the map mean something rather than just being
 * geography.
 *
 * Note the standing constraint from the flag work: TVPRA is COMMODITY-level. It
 * establishes that cocoa from Côte d'Ivoire involves child labour; it says
 * nothing about which company bought that cocoa. Copy must reflect that.
 */
const TVPRA: Record<string, string[]> = {
  cocoa: ['CI', 'GH', 'NG', 'CM', 'GN', 'SL'],
  coffee: ['BR', 'CO', 'CI', 'GT', 'HN', 'KE', 'MX', 'PA', 'VN'],
  'palm-oil': ['ID', 'MY'],
  sugar: ['BR', 'BO', 'CO', 'DO', 'SV', 'GT', 'IN', 'MM', 'PK', 'PH', 'TH'],
  seafood: ['TH', 'ID', 'CN', 'GH', 'KH', 'PH', 'TW'],
  soy: ['BR', 'BO', 'PY'],
};

const OFF_SOURCE: SourceRef = {
  label: 'Open Food Facts — product record',
  url: 'https://world.openfoodfacts.org',
};
const TVPRA_SOURCE: SourceRef = {
  label: 'US DOL — List of Goods Produced by Child Labor or Forced Labor',
  url: 'https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods',
};

/** Free-text region name → a bundled production point. Never guesses. */
function matchOriginPoint(text: string): { key: string; point: OriginPoint } | null {
  const t = text.toLowerCase();
  // Longest names first so "Côte d'Ivoire" wins over a bare "Ivoire" fragment.
  const entries = Object.entries(ORIGIN_POINTS).sort(
    (a, b) => b[1].name.length - a[1].name.length,
  );
  for (const [key, point] of entries) {
    const base = point.name.toLowerCase().replace(/\s*\(.*\)$/, '');
    if (base.length > 3 && t.includes(base)) return { key, point };
  }
  // A few spellings the display names don't cover.
  const ALIASES: Record<string, string> = {
    'ivory coast': 'civ', "cote d'ivoire": 'civ', 'côte d’ivoire': 'civ',
    'sulawesi': 'indonesia', 'sumatra': 'indonesiapalm', 'borneo': 'malaysia',
    'assam': 'india', 'kerala': 'indiakerala', 'bahia': 'brazil',
    'minas gerais': 'brazilcoffee', 'black sea': 'turkey', 'sabah': 'malaysia',
    // Abbreviations the chocolate directory uses in its free-text sourcing field.
    'w. africa': 'wafrica', 'west africa': 'wafrica', 'nicaragua': 'guatemala',
  };
  for (const [alias, key] of Object.entries(ALIASES)) {
    if (t.includes(alias) && ORIGIN_POINTS[key]) return { key, point: ORIGIN_POINTS[key] };
  }
  return null;
}

/** Split "Indonesia, Malaysia (via traders)" into matchable region names. */
function splitRegions(text: string): string[] {
  return text
    .split(/[,;/]| and /i)
    .map((s) => s.replace(/\(.*?\)/g, '').trim())
    .filter((s) => s.length > 2);
}

function isTvpra(commodity: string, iso2?: string): boolean {
  if (!iso2) return false;
  return (TVPRA[commodity] ?? []).includes(iso2);
}

// ── Origin nodes ─────────────────────────────────────────────────────────────

function resolveOrigins(
  product: OpenFoodFactsResult,
  nodes: SupplyChainNode[],
): void {
  const seen = new Set<string>();
  const push = (
    key: string, point: OriginPoint, tier: ProvenanceTier, confidence: number,
    basis: string, sources: SourceRef[], commodity?: string,
  ) => {
    if (seen.has(key) || nodes.filter((n) => n.kind === 'origin').length >= MAX_ORIGINS) return;
    seen.add(key);
    nodes.push({
      id: `origin:${key}`,
      kind: 'origin',
      label: point.name,
      lon: point.lon,
      lat: point.lat,
      tier,
      confidence,
      basis,
      sources,
      commodity,
      tvpraFlagged: commodity ? isTvpra(commodity, point.iso2) : false,
    });
  };

  // 1. DECLARED — the product's own origins field.
  const declared = product.origins ?? '';
  if (declared.trim()) {
    for (const region of splitRegions(declared)) {
      const m = matchOriginPoint(region);
      if (m) {
        push(m.key, m.point, 'declared', 0.9,
          `The product label declares an origin of "${region.trim()}".`,
          [OFF_SOURCE]);
      }
    }
  }

  // 2. DECLARED — per-brand cocoa sourcing from our own chocolate directory.
  //
  // The field is `sourcing` (free text like "Ghana, Côte d'Ivoire, Indonesia,
  // DR, Brazil (Cocoa Life)"), not an `origins` array — worth stating because
  // the original plan assumed the latter, and an optional-chained read of a
  // field that doesn't exist is silently dead code that looks like a feature.
  const choc = findChocolateEntry(product.brand, product.productName);
  if (choc?.sourcing) {
    for (const region of splitRegions(choc.sourcing)) {
      const m = matchOriginPoint(region);
      if (m) {
        push(m.key, m.point, 'declared', 0.8,
          `${choc.name} publishes ${m.point.name} among its cocoa origins ` +
          `("${choc.sourcing}").`,
          [{ label: 'Chocolate Scorecard — brand sourcing disclosure' }], 'cocoa');
      }
    }
  }

  // 3. INFERRED — this company is documented as sourcing this commodity here.
  //    Not the product's own claim, so never 'declared', however good the source.
  for (const rec of getCommodityRecordsByBrand(product.brand)) {
    const commodityLabel = COMMODITY_LABELS[rec.commodity] ?? rec.commodity;
    for (const region of splitRegions(rec.sourcingRegions)) {
      const m = matchOriginPoint(region);
      if (!m) continue;
      push(m.key, m.point, 'inferred', 0.55,
        `${rec.company} is documented sourcing ${commodityLabel.toLowerCase()} from ` +
        `${m.point.name}. This describes the company's supply chain, not a ` +
        `disclosure about this specific product.`,
        rec.sourceUrl
          ? [{ label: `${rec.company} — ${commodityLabel} sourcing`, url: rec.sourceUrl }]
          : [{ label: `${rec.company} — ${commodityLabel} sourcing` }],
        rec.commodity);
    }
  }
}

// ── Processing node ──────────────────────────────────────────────────────────

function resolveProcessing(product: OpenFoodFactsResult): SupplyChainNode {
  const raw = product.rawProduct as unknown as Record<string, unknown> | null;
  const places = raw?.manufacturing_places as string | undefined;
  const embCodes = raw?.emb_codes as string | undefined;

  if (places && String(places).trim()) {
    const m = matchOriginPoint(String(places));
    if (m) {
      return {
        id: 'processing', kind: 'processing', label: `Made in ${m.point.name}`,
        lon: m.point.lon, lat: m.point.lat,
        tier: 'declared', confidence: 0.75,
        basis: `The product record gives a manufacturing place of "${String(places).trim()}". ` +
               `This is a region, not a specific facility.`,
        sources: [OFF_SOURCE],
      };
    }
  }

  // A packager code exists but we can't place it without a bundled EMB table
  // (Session 3). Say that, rather than inventing a point.
  if (embCodes && String(embCodes).trim()) {
    return {
      id: 'processing', kind: 'processing',
      label: 'Packager code on file, location not resolved',
      lon: null, lat: null, tier: 'unknown', confidence: 0,
      basis: `The product carries packager code "${String(embCodes).trim()}", which ` +
             `identifies a real facility — but we don't yet bundle the code-to-location ` +
             `table needed to place it on the map.`,
      sources: [OFF_SOURCE],
    };
  }

  return {
    id: 'processing', kind: 'processing', label: 'Processing not disclosed',
    lon: null, lat: null, tier: 'unknown', confidence: 0,
    basis: 'This product does not disclose where it was made or packed.',
    sources: [],
  };
}

// ── Destination node ─────────────────────────────────────────────────────────

function resolveDestination(region: UserRegion | null): SupplyChainNode {
  if (!region) {
    return {
      id: 'destination', kind: 'destination', label: 'Set your region',
      lon: null, lat: null, tier: 'unknown', confidence: 0,
      basis: 'Set your region to see where this ends up relative to you.',
      sources: [],
    };
  }
  const city = lookupCity(region.city);
  if (city) {
    return {
      id: 'destination', kind: 'destination', label: region.city!,
      lon: city.lon, lat: city.lat, tier: 'declared', confidence: 1,
      basis: `The region you set in the app: ${region.city}, ${region.country}.`,
      sources: [],
    };
  }
  const c = COUNTRY_CENTROIDS[region.countryCode?.toUpperCase() ?? ''];
  if (c) {
    return {
      id: 'destination', kind: 'destination', label: region.country,
      lon: c.lon, lat: c.lat, tier: 'declared', confidence: 1,
      basis: region.city
        ? `The region you set: ${region.country}. We don't hold a location for ` +
          `${region.city}, so this points at the country.`
        : `The region you set in the app: ${region.country}.`,
      sources: [],
    };
  }
  return {
    id: 'destination', kind: 'destination', label: 'Your region',
    lon: null, lat: null, tier: 'unknown', confidence: 0,
    basis: 'We do not hold a location for the region you set.',
    sources: [],
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

export function resolveSupplyChain(
  product: OpenFoodFactsResult,
  region: UserRegion | null,
): SupplyChainGraph {
  const nodes: SupplyChainNode[] = [];

  resolveOrigins(product, nodes);
  const processing = resolveProcessing(product);
  const destination = resolveDestination(region);
  nodes.push(processing, destination);

  // Edges only ever connect nodes we can actually place. An edge touching an
  // unknown node would be a line asserting a route we cannot support.
  const edges: SupplyChainEdge[] = [];
  const placed = (n: SupplyChainNode) => n.lon !== null && n.lat !== null;
  const origins = nodes.filter((n) => n.kind === 'origin' && placed(n));

  if (placed(processing)) {
    for (const o of origins) {
      edges.push({
        from: o.id, to: processing.id, tier: o.tier, confidence: o.confidence,
        basis: o.basis,
      });
    }
    if (placed(destination)) {
      edges.push({
        from: processing.id, to: destination.id, tier: 'declared', confidence: 0.9,
        basis: `Sold in ${destination.label}.`,
      });
    }
  } else if (placed(destination)) {
    // No processing node to route through — connect origins straight to the
    // shopper rather than dropping them. The arc is a connector, not a route.
    for (const o of origins) {
      edges.push({
        from: o.id, to: destination.id, tier: o.tier, confidence: o.confidence,
        basis: o.basis,
      });
    }
  }

  const ingredientCount = (product.rawProduct as unknown as { ingredients_n?: number } | null)
    ?.ingredients_n ?? 0;
  const undisclosedCount = Math.max(0, ingredientCount - origins.length);

  const tiers = nodes.map((n) => n.tier);
  const bestTier: ProvenanceTier = tiers.includes('declared')
    ? 'declared'
    : tiers.includes('inferred') ? 'inferred' : 'unknown';

  return {
    nodes,
    edges,
    undisclosedCount,
    bestTier,
    isEmpty: origins.length === 0 && !placed(processing),
  };
}

export { TVPRA_SOURCE };
