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
import { detectCommodities } from '@/data/supplyChain/commodityOrigins';
import {
  ORIGIN_POINTS, COUNTRY_CENTROIDS, lookupCity, type OriginPoint,
} from '@/data/supplyChain/originPoints';
import {
  OFF_PRODUCT, DOL_TVPRA, CHOCOLATE_SCORECARD, FAOSTAT_PRODUCTION,
  ICCO_STATISTICS, companyCocoaSource,
} from '@/data/supplyChain/sources';
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

// Citations live in one registry (src/data/supplyChain/sources.ts) so a URL
// can't drift between the places that reference it, and every one was verified
// to return 200 on SOURCES_VERIFIED_ON.
const OFF_SOURCE = OFF_PRODUCT;

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

function isTvpra(commodity: string, point: OriginPoint): boolean {
  // Multi-country regions carry their own listing, because TVPRA is keyed on
  // countries and a region like "West Africa" has no ISO code.
  if (point.tvpraCommodities?.includes(commodity)) return true;
  if (!point.iso2) return false;
  return (TVPRA[commodity] ?? []).includes(point.iso2);
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
    const flagged = commodity ? isTvpra(commodity, point) : false;
    nodes.push({
      id: `origin:${key}`,
      kind: 'origin',
      label: point.name,
      lon: point.lon,
      lat: point.lat,
      tier,
      confidence,
      basis,
      // A TVPRA warning with nothing to check it against is an accusation
      // without a citation. Where the flag fires, the list comes with it.
      // FAOSTAT/ICCO back the claim that this region produces this commodity,
      // which is what puts the point on the map in the first place.
      sources: flagged
        ? [...sources, DOL_TVPRA, commodity === 'cocoa' ? ICCO_STATISTICS : FAOSTAT_PRODUCTION]
        : sources,
      commodity,
      tvpraFlagged: flagged,
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
          [CHOCOLATE_SCORECARD, ...(companyCocoaSource(product.brand) ? [companyCocoaSource(product.brand)!] : [])],
          'cocoa');
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

  // 4. INFERRED — from the ingredients list, via world production.
  //
  // Deliberately LAST, so it can only fill space the stronger paths left empty:
  // a declared origin or documented company sourcing always wins, and push()
  // stops at MAX_ORIGINS. Before this step the map was blank for 76% of real
  // products while 99% of them carried an ingredients list we never read.
  //
  // The claim is about the commodity, never the jar. "This contains palm oil,
  // and Indonesia grows 59% of the world's palm oil" is true and checkable;
  // "this jar's palm oil came from Indonesia" would be invented, and the basis
  // text below is written so a reader cannot mistake the first for the second.
  const matches = detectCommodities(
    product.ingredientsText, product.productName, product.categories,
  );
  for (const { profile, matchedIn } of matches) {
    // Say where we found it. Matching the ingredients list is a fact about the
    // recipe; matching the name or the category tag is weaker, and the copy
    // should not dress the second up as the first.
    const found =
      matchedIn === 'ingredients' ? `lists ${profile.label} in its ingredients`
      : matchedIn === 'name' ? `is described as ${profile.label}`
      : `is categorised as ${profile.label}`;
    // A category-tag match is the weakest thing on the map, and its confidence
    // should say so rather than sit level with a read of the actual recipe.
    const confidence = matchedIn === 'ingredients' ? 0.3 : matchedIn === 'name' ? 0.25 : 0.2;

    // Top two producers only. Listing every country that grows a crop turns a
    // finding into a world tour and buries the concentration that made it
    // worth showing.
    for (const { originKey, sharePct } of profile.origins.slice(0, 2)) {
      const point = ORIGIN_POINTS[originKey];
      if (!point) continue;
      push(originKey, point, 'inferred', confidence,
        `This product ${found}. ${point.name} produces roughly ${sharePct}% of ` +
        `the world's supply. Nobody has disclosed where this product's ` +
        `${profile.label} actually came from — this shows where it most likely ` +
        `grew, not where it did.`,
        [profile.source],
        profile.commodity);
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

  // Judge disclosure on ORIGIN and PROCESSING nodes only — never the
  // destination.
  //
  // This used to read every node, and the destination node is the user's own
  // region, which is always 'declared' because they typed it. So a Coca-Cola
  // with no traceable origin at all still reported bestTier 'declared', and the
  // header read "Partly disclosed" directly above the sentence "we can't trace
  // an origin for this one". Knowing where the SHOPPER is standing is not a
  // disclosure about the PRODUCT, and letting it set the headline was the same
  // mistake as the retailer header that named a shop we had no evidence for:
  // an honest caveat under a headline that contradicts it.
  const tiers = nodes
    .filter((n) => n.kind === 'origin' || n.kind === 'processing')
    .map((n) => n.tier);
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

