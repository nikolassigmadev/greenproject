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
  ICCO_STATISTICS, companyCocoaSource, OFF_LABEL, EU_ORGANIC_REGULATION,
  EU_QUALITY_SCHEMES, FSIS_DIRECTORY, EU_HONEY_DIRECTIVE,
} from '@/data/supplyChain/sources';
import { lookupCountryPoint, lookupCountryByName } from '@/data/supplyChain/countryPoints';
import type {
  SupplyChainGraph, SupplyChainNode, SupplyChainEdge, ProvenanceTier, SourceRef,
  PackagingEvidence, PrecomputedOrigin,
} from './types';
import { originStatementNodes } from './originStatement';

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

/**
 * Rung A2 — origin-bearing labels, ordered by what they actually prove.
 *
 * These beat `origins_tags` on coverage, which sounds backwards until you see
 * why: "Made in France" alone appears on more products than ANY single value of
 * the origins field, because it is a REGULATED ON-PACK MARK rather than
 * optional volunteer data entry. A manufacturer must print it; a contributor
 * only has to tick it. The repo has been reading the sparse field and ignoring
 * the dense one.
 *
 * The confidence values are deliberately spread rather than uniform, because
 * these marks are not equivalent claims:
 *
 *   PDO 0.95   production is tied to a defined area by law
 *   PGI 0.85   at least ONE production stage happens in the named area
 *   Made-in 0.70  where MANUFACTURING happened. Says nothing about where the
 *                 ingredients were grown — canned tuna with a French mark was
 *                 CANNED in France; the tuna came from an ocean.
 *   EU/non-EU Agriculture 0.50 / 0.30   farmed inside/outside the EU, country
 *                 not specified, because Reg. (EU) 2018/848 does not require it
 *
 * `iso2: null` means the label proves a designation exists but names no country
 * we can place. Per INVARIANTS §6 that yields a node with null coordinates,
 * never a guessed centroid, and per §3/§5 such a node never receives an edge.
 */
const LABEL_ORIGIN: Record<string, {
  iso2: string | null;
  confidence: number;
  basis: string;
  kind: 'origin' | 'region';
  /** What the node is CALLED when there is no country to name it after. */
  label: string;
}> = {
  'en:pdo': { iso2: null, confidence: 0.95, kind: 'origin',
    basis: 'Protected Designation of Origin — production is tied to a defined geographic area by EU law',
    label: 'Protected Designation of Origin' },
  'en:protected-designation-of-origin': { iso2: null, confidence: 0.95, kind: 'origin',
    basis: 'Protected Designation of Origin — production is tied to a defined geographic area by EU law',
    label: 'Protected Designation of Origin' },
  'en:pgi': { iso2: null, confidence: 0.85, kind: 'origin',
    basis: 'Protected Geographical Indication — at least one production stage happens in the named area',
    label: 'Protected Geographical Indication' },
  'en:protected-geographical-indication': { iso2: null, confidence: 0.85, kind: 'origin',
    basis: 'Protected Geographical Indication — at least one production stage happens in the named area',
    label: 'Protected Geographical Indication' },
  'en:made-in-france':      { iso2: 'FR', confidence: 0.70, kind: 'origin',
    basis: "Marked 'Made in France' — this is the country of manufacture, not necessarily where the ingredients were grown",
    label: 'France' },
  'en:made-in-italy':       { iso2: 'IT', confidence: 0.70, kind: 'origin',
    basis: "Marked 'Made in Italy' — this is the country of manufacture, not necessarily where the ingredients were grown",
    label: 'Italy' },
  'en:made-in-germany':     { iso2: 'DE', confidence: 0.70, kind: 'origin',
    basis: "Marked 'Made in Germany' — this is the country of manufacture, not necessarily where the ingredients were grown",
    label: 'Germany' },
  'en:made-in-spain':       { iso2: 'ES', confidence: 0.70, kind: 'origin',
    basis: "Marked 'Made in Spain' — this is the country of manufacture, not necessarily where the ingredients were grown",
    label: 'Spain' },
  'en:made-in-belgium':     { iso2: 'BE', confidence: 0.70, kind: 'origin',
    basis: "Marked 'Made in Belgium' — this is the country of manufacture, not necessarily where the ingredients were grown",
    label: 'Belgium' },
  'en:made-in-switzerland': { iso2: 'CH', confidence: 0.70, kind: 'origin',
    basis: "Marked 'Made in Switzerland' — this is the country of manufacture, not necessarily where the ingredients were grown",
    label: 'Switzerland' },
  'en:eu-agriculture':        { iso2: null, confidence: 0.50, kind: 'region',
    basis: "The organic mark states 'EU Agriculture' — grown inside the EU, but the country is not specified",
    label: 'EU Agriculture' },
  'en:non-eu-agriculture':    { iso2: null, confidence: 0.50, kind: 'region',
    basis: "The organic mark states 'non-EU Agriculture' — grown outside the EU, but the country is not specified",
    label: 'Non-EU Agriculture' },
  'en:eu-non-eu-agriculture': { iso2: null, confidence: 0.30, kind: 'region',
    basis: "The organic mark states 'EU/non-EU Agriculture' — mixed origin, not specified",
    label: 'EU / non-EU Agriculture' },
};

/** Which citations back a given label. */
function labelSources(tag: string): SourceRef[] {
  if (tag.includes('agriculture')) return [OFF_LABEL, EU_ORGANIC_REGULATION];
  if (tag.includes('pdo') || tag.includes('pgi') || tag.includes('protected-')) {
    return [OFF_LABEL, EU_QUALITY_SCHEMES];
  }
  return [OFF_LABEL];
}

/**
 * Every label tag on the product, in canonical `en:slug` form.
 *
 * Reads rawProduct.labels_tags first because those are the canonical tags the
 * table is keyed on. Falls back to the humanized `labels` array — humanizeTag()
 * turns 'en:made-in-france' into 'made in france', which reverses cleanly — so
 * a product that reached us through a path that dropped rawProduct still
 * resolves rather than silently losing its labels.
 */
function labelTags(product: OpenFoodFactsResult): string[] {
  const raw = product.rawProduct as unknown as Record<string, unknown> | null;
  const tags = raw?.labels_tags;
  if (Array.isArray(tags)) {
    return tags.filter((t): t is string => typeof t === 'string').map((t) => t.toLowerCase());
  }
  return (product.labels ?? [])
    .filter((l): l is string => typeof l === 'string')
    .map((l) => `en:${l.trim().toLowerCase().replace(/\s+/g, '-')}`);
}

/** Canonical origin tags from the raw record, lowercased. */
function originsTags(product: OpenFoodFactsResult): string[] {
  const raw = product.rawProduct as unknown as Record<string, unknown> | null;
  const tags = raw?.origins_tags;
  if (!Array.isArray(tags)) return [];
  return tags.filter((t): t is string => typeof t === 'string').map((t) => t.toLowerCase());
}

/** 'en:cote-d-ivoire' -> "cote d ivoire". Strips the language prefix only. */
function humanizeOriginTag(tag: string): string {
  return tag.replace(/^[a-z]{2,3}:/i, '').replace(/-/g, ' ').trim();
}

/**
 * Is this honey?
 *
 * Worth its own function because honey is the one category with a mandatory,
 * percentage-weighted origin disclosure (Dir. (EU) 2024/1438, in force
 * 14 June 2026), and the map says something different — and much stronger —
 * about it than about anything else.
 */
export function isHoney(product: OpenFoodFactsResult): boolean {
  const raw = product.rawProduct as unknown as Record<string, unknown> | null;
  const tags = Array.isArray(raw?.categories_tags) ? raw.categories_tags as string[] : [];
  if (tags.some((t) => typeof t === 'string' && /^[a-z]{2,3}:honeys?$/i.test(t))) return true;
  // The mapped `categories` array is humanized ('honeys'), so check it too.
  return (product.categories ?? []).some(
    (c) => typeof c === 'string' && /^honeys?$/i.test(c.trim()),
  );
}

// ── Origin nodes ─────────────────────────────────────────────────────────────

function resolveOrigins(
  product: OpenFoodFactsResult,
  nodes: SupplyChainNode[],
  packaging?: PackagingEvidence | null,
  precomputed?: PrecomputedOrigin | null,
): void {
  const seen = new Set<string>();
  const originCount = () => nodes.filter((n) => n.kind === 'origin').length;

  /**
   * A claim we believe but cannot place.
   *
   * "This is PDO" and "the organic mark says EU Agriculture" are real, cited,
   * `declared` facts about the product that name no country we hold a point
   * for. INVARIANTS §6 forbids substituting a centroid to make them drawable,
   * and §3 says the honest render is a node. So: node, null coordinates, no
   * edge — the edge builder only ever connects placed nodes.
   */
  const pushUnplaced = (
    key: string, label: string, tier: ProvenanceTier, confidence: number,
    basis: string, sources: SourceRef[],
  ) => {
    if (seen.has(key) || originCount() >= MAX_ORIGINS) return;
    seen.add(key);
    nodes.push({
      id: `origin:${key}`, kind: 'origin', label,
      lon: null, lat: null, tier, confidence, basis, sources,
    });
  };

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

  // 1a. DECLARED — origins_tags, the CANONICAL origins field.
  //
  // This rung was named "OFF origins_tags" from the start and was reading the
  // free-text `origins` string only. The two are not interchangeable: Open Food
  // Facts normalises contributor input into `origins_tags` ('en:france',
  // "fr:cote-d-ivoire"), and a large share of products carry the tags with the
  // free-text field EMPTY. Every one of those was scoring zero origin coverage
  // while the data sat one field away.
  //
  // Matched exactly, never fuzzily, and skipped when unmatched — the same
  // contract as the free-text path above. A sub-national tag ('fr:midi-pyrenees')
  // or a catch area ('fr:fao-27') is a real declaration we simply cannot place,
  // and inventing a point for it would be the failure this file exists to
  // prevent. It is left for rung A4, which can read what the pack actually says.
  for (const tag of originsTags(product)) {
    const name = humanizeOriginTag(tag);
    // Prefer the curated production point: it carries the commodity region and
    // the TVPRA linkage, which a bare country centroid does not.
    const m = matchOriginPoint(name);
    if (m) {
      push(m.key, m.point, 'declared', 0.9,
        `Open Food Facts records a declared origin of "${name}" for this product.`,
        [OFF_SOURCE]);
      continue;
    }
    const c = lookupCountryByName(name);
    if (c) {
      push(`country:${c.iso2}`,
        { name: c.point.name, lon: c.point.lon, lat: c.point.lat, iso2: c.iso2 },
        'declared', 0.9,
        `Open Food Facts records a declared origin of "${name}" for this product.`,
        [OFF_SOURCE]);
    }
  }

  // 1c. DECLARED — rung A4, statements read off the packaging itself.
  //
  // Sits between A1 and A2 deliberately. A printed "Product of Mexico" is a
  // statement about the INGREDIENTS and beats a made-in mark, which is only
  // about manufacture — but it ranks below the curated origins field, because
  // OCR can misread and a database field cannot.
  //
  // The nodes arrive fully formed from originStatementNodes(), which is shared
  // with the parser's own tests, so what ships and what is tested cannot drift.
  if (packaging?.statements?.length) {
    const remaining = MAX_ORIGINS - originCount();
    if (remaining > 0) {
      for (const node of originStatementNodes(packaging.statements, remaining)) {
        // `seen` is keyed on the id suffix so an OCR claim cannot duplicate a
        // country the origins field already placed.
        const key = node.id.replace(/^origin:/, '');
        if (seen.has(key) || originCount() >= MAX_ORIGINS) continue;
        seen.add(key);
        nodes.push(node);
      }
    }
  }

  // 1b. DECLARED — rung A2, regulated on-pack labels.
  //
  // Runs AFTER the origins field on purpose. `seen` makes the first claim for a
  // given key win, and A1 is the stronger evidence: an origins entry is a
  // statement about the INGREDIENTS, while a made-in mark is a statement about
  // MANUFACTURE. Where a product carries both, the origins claim is the one
  // that should set the headline, so it has to get there first.
  for (const tag of labelTags(product)) {
    const rule = LABEL_ORIGIN[tag];
    if (!rule) continue;
    if (rule.iso2) {
      const point = lookupCountryPoint(rule.iso2);
      if (point) {
        // A country point, NOT a production centroid. "Made in France" is a
        // claim about a country, so it is drawn at country granularity and no
        // finer — placing it on a crop region would be a different, wrong claim.
        push(`label:${rule.iso2}`, { name: point.name, lon: point.lon, lat: point.lat, iso2: rule.iso2 },
          'declared', rule.confidence, `${rule.basis}.`, labelSources(tag));
        continue;
      }
    }
    pushUnplaced(`label:${tag}`, rule.label,
      'declared', rule.confidence, `${rule.basis}.`, labelSources(tag));
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

  // 1d. DECLARED — claims resolved offline by the precomputed index.
  //
  // Same evidence as rungs A1-A3, computed ahead of time over the whole Open
  // Food Facts corpus rather than from this one product record. It runs after
  // the live rungs deliberately: where both have something to say they agree,
  // and where they disagree the record IN FRONT OF US is the one to trust — the
  // index may have been built before the product was edited.
  //
  // So this fills gaps. It never overrides, because `seen` lets the first claim
  // for a key win, and it cannot manufacture a claim: a product with no
  // origin-bearing field is simply absent from the index.
  for (const claim of precomputed?.claims ?? []) {
    if (originCount() >= MAX_ORIGINS) break;
    // Rung A3 is a PROCESSING claim, a different thing entirely, and must never
    // become an origin pin. It is handled by resolveProcessing().
    if (claim.kind === 'processing') continue;

    const name = claim.value.replace(/^[a-z]{2,3}:/i, '').replace(/-/g, ' ').trim();
    const m = matchOriginPoint(name);
    if (m) {
      push(m.key, m.point, claim.tier, claim.confidence, claim.basis, [OFF_SOURCE]);
      continue;
    }
    const c = claim.iso2 ? lookupCountryPoint(claim.iso2) : lookupCountryByName(name)?.point;
    const iso2 = claim.iso2 ?? lookupCountryByName(name)?.iso2;
    if (c && iso2) {
      push(`country:${iso2}`, { name: c.name, lon: c.lon, lat: c.lat, iso2 },
        claim.tier, claim.confidence, claim.basis, [OFF_SOURCE]);
      continue;
    }
    // A claim we believe and cannot place. Node, no coordinates, no edge.
    pushUnplaced(`pre:${claim.value}`, name || claim.value,
      claim.tier, claim.confidence, claim.basis, [OFF_SOURCE]);
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

  // ── REMOVED: world-production inference ──────────────────────────────────
  //
  // There used to be a fourth path here that read the ingredients list, looked
  // up where that commodity is grown worldwide, and put pins on the map:
  // "contains palm oil → Indonesia grows 59% of the world's palm oil".
  //
  // It roughly doubled map coverage and it should never have shipped. The map
  // exists to answer "where does THIS COMPANY get THIS product's ingredients",
  // and a world-production statistic answers a different question — one the
  // shopper did not ask and cannot act on. Every pin it drew was really a
  // statement about global agriculture wearing a supply-chain costume, and no
  // amount of hedging in the caption fixed that. A caveat explaining that the
  // map is not showing what it appears to show is a sign the map is wrong, not
  // a sign the caveat is good.
  //
  // The three paths above all say something about the company: its own declared
  // origins, its published sourcing, or documented findings about its supply
  // chain. Those are the only claims worth drawing a line for.
  //
  // Coverage drops as a result, and that is the correct trade. An empty map
  // that says "nobody has disclosed this" is honest; a full map of guesses is
  // the thing the app exists to argue against.
  //
  // detectCommodities() is still used elsewhere — the coverage harness and the
  // TVPRA commodity-risk work — so the data is not lost, only removed from the
  // map, where it was masquerading as provenance.
}

// ── Processing node ──────────────────────────────────────────────────────────

function resolveProcessing(
  product: OpenFoodFactsResult,
  usdaFacility?: PackagingEvidence['usdaFacility'],
): SupplyChainNode {
  const raw = product.rawProduct as unknown as Record<string, unknown> | null;
  const places = raw?.manufacturing_places as string | undefined;
  const embCodes = raw?.emb_codes as string | undefined;

  // 0. DECLARED — a USDA establishment number read off the inspection mark.
  //
  // The strongest processing evidence available anywhere in this resolver, and
  // the only one that reaches an individual FACILITY rather than a region: the
  // number inside the USDA mark is an exact key into the FSIS directory, which
  // carries the establishment's real coordinates. Not a fuzzy brand match — the
  // pack literally prints the primary key.
  //
  // Still a PROCESSING claim and nothing more. It says where the product was
  // slaughtered, processed or packed, not where the animal was raised.
  const fsis = usdaFacility;
  if (fsis) {
    return {
      id: 'processing', kind: 'processing',
      label: `${fsis.name} — ${fsis.city}, ${fsis.state}`,
      lon: fsis.lon, lat: fsis.lat,
      tier: 'declared', confidence: 0.95,
      basis: `The USDA inspection mark on this pack gives establishment ` +
             `${fsis.establishmentNumber}, which the FSIS directory lists as ` +
             `${fsis.name} in ${fsis.city}, ${fsis.state}. This is where the product ` +
             `was processed or packed — not where the animals were raised or the ` +
             `ingredients grown.`,
      sources: [FSIS_DIRECTORY],
    };
  }

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
  packaging?: PackagingEvidence | null,
  precomputed?: PrecomputedOrigin | null,
): SupplyChainGraph {
  const nodes: SupplyChainNode[] = [];

  resolveOrigins(product, nodes, packaging, precomputed);
  const processing = resolveProcessing(product, packaging?.usdaFacility);
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

  // Honey is the flagship: a complete, legally guaranteed, percentage-weighted
  // breakdown, printed on the jar. Explaining WHY it works here — and by
  // implication why chocolate cannot — is the intellectual content of this
  // feature, so the copy travels with the graph rather than living in a
  // component where it could drift from the data.
  const honey = isHoney(product);
  const declaredShares = nodes.filter(
    (n) => n.kind === 'origin' && typeof n.declaredShare === 'number',
  );

  return {
    nodes,
    edges,
    undisclosedCount,
    bestTier,
    isEmpty: origins.length === 0 && !placed(processing),
    ...(honey ? {
      mandatoryDisclosure: {
        category: 'honey',
        copy: declaredShares.length
          ? 'EU law requires honey to list every origin country with its ' +
            'percentage. Here is what this jar declares.'
          : 'EU law requires honey to list every origin country with its ' +
            'percentage. We have not been able to read that list for this jar — ' +
            'scan the label to see it.',
        source: EU_HONEY_DIRECTIVE,
      },
    } : {}),
  };
}

