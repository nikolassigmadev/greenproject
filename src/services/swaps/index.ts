// Reason-aware swap engine.
//
// Given a scanned product, it (1) diagnoses the product's worst concern using
// the same detectors the detail page already trusts, (2) maps the product to a
// catalog category, and (3) resolves a ranked list of curated ethical
// alternatives that specifically address that concern — enriched with live Open
// Food Facts data and ordered to prefer options available in the user's region.

import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import { lookupBarcode, searchProducts } from "@/services/openfoodfacts";
import { findLaborAllegations } from "@/utils/laborCheck";
import { checkBoycott } from "@/data/boycottBrands";
import { checkAnimalWelfareFlag } from "@/utils/animalWelfareFlags";
import { findVerifiedEthics } from "@/utils/verifiedEthics";
import { getVerifiedFlagsForBrand } from "@/services/brandFlags";
import type { CertificationType } from "@/utils/verifiedEthics";
import { DEFAULT_PRIORITIES, priorityMultiplier, type UserPriorities } from "@/utils/userPreferences";
import {
  detectSwapCategory,
  getCandidates,
  isInMarket,
  type AltCandidate,
  type ConcernType,
  type SwapCategoryKey,
} from "@/data/ethicalAlternatives";
import { getCustomCandidates } from "@/data/customSwaps";
import { getVerifiedEthicsCandidates } from "@/data/verifiedEthicsSwaps";
import { getChocolateDirectoryCandidates } from "@/data/chocolateDirectorySwaps";
import {
  isSoldInRegion,
  findCountry,
  type UserRegion,
} from "@/utils/userRegion";

export type { ConcernType, SwapCategoryKey } from "@/data/ethicalAlternatives";

export type ConcernSeverity = "critical" | "high" | "medium" | "low";

export interface ProductConcern {
  type: ConcernType;
  severity: ConcernSeverity;
  /** Short headline, e.g. "Cocoa child-labour allegations". */
  label: string;
  /** One sentence of context. */
  detail: string;
  parentCompany?: string;
}

export interface SwapDiagnosis {
  concerns: ProductConcern[];
  primary: ProductConcern | null;
  categoryKey: SwapCategoryKey | null;
  /** True when the scanned product's own brand is already verified-ethical. */
  selfEthical: boolean;
}

export interface SwapSuggestion {
  brand: string;
  productName: string;
  certifications: CertificationType[];
  strengths: string[];
  addresses: ConcernType[];
  /** Whether this option addresses the scanned product's primary concern. */
  fixesPrimary: boolean;
  /** True when this came from the hand-curated customSwaps.json. */
  custom: boolean;
  /** Live OFF resolution, when found. */
  product: OpenFoodFactsResult | null;
  barcode: string | null;
  imageUrl: string | null;
  ecoGrade: string | null;
  co2Kg: number | null;
  /** Live OFF country-tag check: null = unknown, true/false otherwise. */
  availableInRegion: boolean | null;
  /** Curated: the brand is known to sell in the user's country. */
  inMarket: boolean;
  /** Combined signal used for ranking + the badge. */
  regionAvailable: boolean;
  /** Human label for the availability badge, e.g. "Available in the UK". */
  availabilityLabel: string;
}

export interface SwapResult {
  diagnosis: SwapDiagnosis;
  region: UserRegion | null;
  suggestions: SwapSuggestion[];
}

// kg CO2e per kg of product, estimated from eco-grade when OFF lacks figures.
const GRADE_CO2: Record<string, number> = { "a-plus": 0.3, a: 0.5, b: 1.2, c: 2.5, d: 4.0, e: 6.0 };

const SEVERITY_WEIGHT: Record<ConcernSeverity, number> = {
  critical: 4, high: 3, medium: 2, low: 1,
};

// Labour-style flag categories from the v2 brand-flag schema.
const LABOUR_FLAG_CATEGORIES = new Set([
  "forced_labour", "child_labour", "wage_theft", "unsafe_conditions", "union_busting",
]);

// Fixed tiebreak when weighted scores match.
const CONCERN_ORDER: ConcernType[] = ["labor", "animal_welfare", "boycott", "eco"];

/**
 * Does a curated candidate address a given concern?
 *
 * A `boycott` is a BRAND-level problem — switching to any of our curated
 * alternatives (none of which are boycott-listed) inherently resolves it, so we
 * treat every candidate as addressing a boycott. All other concerns must be
 * explicitly listed in the candidate's `addresses`.
 */
function candidateAddresses(c: AltCandidate, concern: ConcernType): boolean {
  return concern === "boycott" || c.addresses.includes(concern);
}

function priorityWeight(type: ConcernType, p: UserPriorities): number {
  switch (type) {
    case "labor": return p.laborRights;
    case "animal_welfare": return p.animalWelfare;
    case "eco": return p.environment;
    case "boycott": return Math.max(p.laborRights, 40); // ethics-adjacent, never zeroed out
  }
}

/** Synchronous diagnosis — safe to call during render. */
export function diagnoseProduct(
  product: OpenFoodFactsResult,
  priorities: UserPriorities = DEFAULT_PRIORITIES,
): SwapDiagnosis {
  const concerns: ProductConcern[] = [];

  // Red signals first. A verified-ethics badge only suppresses concerns when
  // the record is otherwise clean — the same cleanEthicsRecord gate the detail
  // page uses. Without this gate, a boycott-listed B Corp (e.g. Ben & Jerry's)
  // read as "self-ethical": the page showed a red banner while the swap engine
  // reported no concerns and offered no alternatives.
  const labor = findLaborAllegations(product.brand, product.productName);
  const v2Flags = getVerifiedFlagsForBrand(product.brand || "");
  const labourFlags = v2Flags.filter((f) => LABOUR_FLAG_CATEGORIES.has(f.category));
  const boycottSignal = checkBoycott(product.brand);
  const welfareSignal = checkAnimalWelfareFlag(product.brand);
  const hasRedSignal =
    !!labor ||
    labourFlags.length > 0 ||
    !!boycottSignal ||
    (welfareSignal.isFlagged && (welfareSignal.severity === "critical" || welfareSignal.severity === "high"));
  const selfEthical = !hasRedSignal && !!findVerifiedEthics(product.brand, product.productName);

  // ── Labour: legacy allegations DB + verified v2 flags ──
  if (!selfEthical && (labor || labourFlags.length > 0)) {
    const count = labor?.allegations.length ?? labourFlags.length;
    const company = labor?.parentCompany ?? labourFlags[0]?.brandName ?? product.brand ?? "This brand";
    const severity: ConcernSeverity = count >= 3 ? "critical" : count === 2 ? "high" : "medium";
    const headline = labourFlags[0]?.summary
      || labor?.allegations[0]?.issue
      || "Labour & human-rights concerns";
    concerns.push({
      type: "labor",
      severity,
      label: count > 1 ? `${count} labour & human-rights concerns` : headline,
      detail: `Publicly reported labour concerns linked to ${company}.`,
      parentCompany: company,
    });
  }

  // ── Boycott ──
  const boycott = boycottSignal;
  if (!selfEthical && boycott) {
    concerns.push({
      type: "boycott",
      severity: "medium",
      label: `${boycott.parent} is boycott-listed`,
      detail: boycott.reason,
      parentCompany: boycott.parent,
    });
  }

  // ── Animal welfare ──
  const welfare = welfareSignal;
  if (!selfEthical && welfare.isFlagged) {
    const sev: ConcernSeverity = welfare.severity === "critical"
      ? "critical"
      : welfare.severity === "high"
        ? "high"
        : "medium";
    concerns.push({
      type: "animal_welfare",
      severity: sev,
      label: `${welfare.company?.companyName || product.brand || "This brand"} — animal-welfare concerns`,
      detail: welfare.message,
      parentCompany: welfare.company?.companyName,
    });
  }

  // ── Environment (poor eco-score) ──
  const grade = product.ecoscoreGrade?.toLowerCase();
  if (grade === "d" || grade === "e") {
    concerns.push({
      type: "eco",
      severity: grade === "e" ? "high" : "medium",
      label: `High carbon footprint (Eco-Score ${grade.toUpperCase()})`,
      detail: "This product sits in the highest-impact band for its category.",
    });
  }

  // ── Pick the primary concern (severity × user priority, fixed tiebreak) ──
  let primary: ProductConcern | null = null;
  let bestScore = -1;
  for (const c of concerns) {
    const score = SEVERITY_WEIGHT[c.severity] * priorityMultiplier(priorityWeight(c.type, priorities));
    const tie = primary
      && score === bestScore
      && CONCERN_ORDER.indexOf(c.type) < CONCERN_ORDER.indexOf(primary.type);
    if (score > bestScore || tie) {
      bestScore = score;
      primary = c;
    }
  }

  const categoryKey = detectSwapCategory({
    categories: product.categories,
    productName: product.productName,
    brand: product.brand,
  });

  return { concerns, primary, categoryKey, selfEthical };
}

/** The three signals that power the unmet-ethical-demand heatmap. */
export interface DemandSignal {
  /** Swap-catalog category, e.g. "chocolate" (null if we couldn't classify it). */
  category: SwapCategoryKey | null;
  /** The product's worst concern, or null when it's clean. */
  primaryConcern: ConcernType | null;
  /**
   * Whether a curated alternative that addresses the primary concern is sold in
   * the user's market. null when there's no concern to address. Deliberately
   * conservative — entries we can only confirm via a live OFF lookup are not
   * counted, so we never hide a genuine gap behind an unverifiable "available".
   */
  swapAvailable: boolean | null;
}

/**
 * Synchronous, network-free read of the unmet-demand signals for a product:
 * its category, its worst concern, and whether we actually have an in-market
 * ethical alternative to offer. Cheap enough to call on the buy/skip path —
 * it reuses the same detectors as the full swap engine, minus the OFF I/O.
 */
export function assessUnmetDemand(
  product: OpenFoodFactsResult,
  priorities: UserPriorities = DEFAULT_PRIORITIES,
  countryCode?: string | null,
): DemandSignal {
  const { primary, categoryKey } = diagnoseProduct(product, priorities);
  if (!primary) {
    return { category: categoryKey, primaryConcern: null, swapAvailable: null };
  }
  let swapAvailable = false;
  if (categoryKey) {
    const candidates = [
      ...getCandidates(categoryKey),
      ...getCustomCandidates(categoryKey),
      ...getVerifiedEthicsCandidates(categoryKey),
      ...getChocolateDirectoryCandidates(categoryKey),
    ];
    swapAvailable = candidates.some(
      (c) =>
        isCandidateClean(c) &&
        candidateAddresses(c, primary.type) &&
        c.assumeAvailable !== false && // unverifiable-availability entries don't count
        isInMarket(c, countryCode),
    );
  }
  return { category: categoryKey, primaryConcern: primary.type, swapAvailable };
}

/**
 * Never recommend a brand the app itself red-flags: boycott-listed, carrying
 * labour allegations or a verified labour flag, or a critical/high animal-
 * welfare record. The curated catalogs are screened at build time by the
 * verdict-page audit, but this runtime guard keeps them honest if the flag
 * datasets and the catalogs ever drift apart again.
 */
function isCandidateClean(c: AltCandidate): boolean {
  if (checkBoycott(c.brand)) return false;
  if (findLaborAllegations(c.brand, c.productName)) return false;
  const welfare = checkAnimalWelfareFlag(c.brand);
  if (welfare.isFlagged && (welfare.severity === "critical" || welfare.severity === "high")) return false;
  return !getVerifiedFlagsForBrand(c.brand).some((f) => LABOUR_FLAG_CATEGORIES.has(f.category));
}

function sameBrand(a: string, b: string | null | undefined): boolean {
  if (!b) return false;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const x = norm(a);
  const y = norm(b);
  return x.length > 2 && (x.includes(y) || y.includes(x));
}

/** Keep the first candidate per normalised brand (custom entries lead the list). */
function dedupeByBrand(candidates: AltCandidate[]): AltCandidate[] {
  const seen = new Set<string>();
  const out: AltCandidate[] = [];
  for (const c of candidates) {
    const key = c.brand.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

/**
 * Resolve a single catalog candidate to a live OFF product, preferring one that
 * is actually sold in the user's country (matched via OFF `countries_tags`).
 */
async function resolveCandidate(
  c: AltCandidate,
  countryTag: string | null,
): Promise<OpenFoodFactsResult | null> {
  // Try canonical barcodes first.
  for (const code of c.barcodes ?? []) {
    try {
      const r = await lookupBarcode(code);
      if (r.found) return r;
    } catch {
      // try next
    }
  }
  // Pull a wider set so we can pick one available in the user's country.
  try {
    const results = await searchProducts(c.searchQuery, 8);
    if (results.length === 0) return null;
    const usable = results.filter((r) => r.found && (r.imageUrl || r.ecoscoreGrade));
    const pool = usable.length > 0 ? usable : results;
    if (countryTag) {
      const inCountry = pool.find((r) =>
        r.rawProduct?.countries_tags?.some((t) => t.toLowerCase() === countryTag),
      );
      if (inCountry) return inCountry;
    }
    return pool[0] ?? null;
  } catch {
    return null;
  }
}

function buildSuggestion(
  c: AltCandidate,
  resolved: OpenFoodFactsResult | null,
  primaryType: ConcernType | null,
  region: UserRegion | null,
): SwapSuggestion {
  const ecoGrade = resolved?.ecoscoreGrade?.toLowerCase() ?? c.fallbackEcoGrade ?? null;
  const liveCo2 = resolved?.ecoscoreData?.agribalyse?.co2_total
    ?? (resolved?.carbonFootprint100g != null ? resolved.carbonFootprint100g * 10 : null);
  const co2Kg = liveCo2 ?? (ecoGrade ? GRADE_CO2[ecoGrade] ?? null : null);

  const availableInRegion = isSoldInRegion(resolved?.rawProduct?.countries_tags, region);
  const inMarket = isInMarket(c, region?.countryCode);
  // Verified-ethics brands set assumeAvailable=false: we only claim local
  // availability for them when OFF actually confirms a country tag.
  const assume = c.assumeAvailable !== false;
  const regionAvailable = availableInRegion === true || (region != null && inMarket && assume);

  // Build the availability badge text.
  const where = region?.country ?? null;
  let availabilityLabel: string;
  if (!region) {
    availabilityLabel = "Widely available";
  } else if (availableInRegion === true) {
    availabilityLabel = `Available in ${where}`;
  } else if (inMarket && assume) {
    availabilityLabel = `Sold in ${where}`;
  } else if (!inMarket) {
    availabilityLabel = `Limited in ${where}`;
  } else {
    availabilityLabel = "Check local availability";
  }

  return {
    brand: c.brand,
    productName: resolved?.productName || c.productName,
    certifications: c.certifications,
    strengths: c.strengths,
    addresses: c.addresses,
    fixesPrimary: primaryType ? candidateAddresses(c, primaryType) : false,
    custom: c.custom ?? false,
    product: resolved,
    barcode: resolved?.barcode ?? null,
    imageUrl: resolved?.imageUrl ?? null,
    ecoGrade,
    co2Kg,
    availableInRegion,
    inMarket,
    regionAvailable,
    availabilityLabel,
  };
}

const ECO_RANK: Record<string, number> = { a: 5, b: 4, c: 3, d: 2, e: 1 };

export interface GetSwapsOptions {
  region?: UserRegion | null;
  priorities?: UserPriorities;
  limit?: number;
}

/**
 * Full pipeline: diagnose → pick category → resolve & rank curated swaps.
 * Always resolves; returns an empty `suggestions` array when there's nothing
 * meaningful to recommend (no concern, or no curated category).
 */
export async function getSwaps(
  product: OpenFoodFactsResult,
  opts: GetSwapsOptions = {},
): Promise<SwapResult> {
  const region = opts.region ?? null;
  const priorities = opts.priorities ?? DEFAULT_PRIORITIES;
  const limit = opts.limit ?? 4;

  const diagnosis = diagnoseProduct(product, priorities);

  if (!diagnosis.primary || !diagnosis.categoryKey) {
    return { diagnosis, region, suggestions: [] };
  }

  const primaryType = diagnosis.primary.type;
  const country = region?.countryCode ?? null;
  const countryTag = country ? findCountry(country)?.offTag ?? null : null;

  // Candidate sources, in priority order (dedupe keeps the first per brand):
  //   1. hand-curated customSwaps.json   2. built-in catalog
  //   3. the verified-ethics database (mapped to fine categories)
  const merged = dedupeByBrand(
    [
      ...getCustomCandidates(diagnosis.categoryKey),
      ...getCandidates(diagnosis.categoryKey),
      ...getVerifiedEthicsCandidates(diagnosis.categoryKey),
      ...getChocolateDirectoryCandidates(diagnosis.categoryKey),
    ].filter(isCandidateClean),
  );
  let pool = merged.filter((c) => !sameBrand(c.brand, product.brand));

  // Only suggest things the user can actually buy. When the user has a country
  // and we still have at least two in-market options, drop the rest entirely.
  if (country) {
    const inMarket = pool.filter((c) => isInMarket(c, country));
    if (inMarket.length >= 2) pool = inMarket;
  }

  // Candidate ordering before resolution: custom picks first, then in-market,
  // then ones that fix the primary concern, then richer certifications.
  const candidates = pool
    .sort((a, b) => {
      if (!!a.custom !== !!b.custom) return a.custom ? -1 : 1;
      const am = isInMarket(a, country) ? 1 : 0;
      const bm = isInMarket(b, country) ? 1 : 0;
      if (am !== bm) return bm - am;
      const af = candidateAddresses(a, primaryType) ? 1 : 0;
      const bf = candidateAddresses(b, primaryType) ? 1 : 0;
      if (af !== bf) return bf - af;
      // Curated/global brands (known availability) before verified-ethics
      // brands whose market coverage we can't vouch for.
      const ac = a.assumeAvailable === false ? 0 : 1;
      const bc = b.assumeAvailable === false ? 0 : 1;
      if (ac !== bc) return bc - ac;
      return b.certifications.length - a.certifications.length;
    })
    .slice(0, Math.max(limit + 2, 5)); // resolve a few extra, trim after

  const resolved = await Promise.all(candidates.map((c) => resolveCandidate(c, countryTag)));

  const suggestions = candidates
    .map((c, i) => buildSuggestion(c, resolved[i], primaryType, region))
    // Drop anything that resolved to the exact scanned product.
    .filter((s) => !s.barcode || s.barcode !== product.barcode)
    .sort((a, b) => {
      if (a.fixesPrimary !== b.fixesPrimary) return a.fixesPrimary ? -1 : 1;
      // Confirmed sold in-country beats merely in-market beats neither.
      const aAvail = (a.availableInRegion === true ? 2 : 0) + (a.regionAvailable ? 1 : 0);
      const bAvail = (b.availableInRegion === true ? 2 : 0) + (b.regionAvailable ? 1 : 0);
      if (aAvail !== bAvail) return bAvail - aAvail;
      if (a.custom !== b.custom) return a.custom ? -1 : 1;
      const aEco = a.ecoGrade ? ECO_RANK[a.ecoGrade] ?? 0 : 0;
      const bEco = b.ecoGrade ? ECO_RANK[b.ecoGrade] ?? 0 : 0;
      if (aEco !== bEco) return bEco - aEco;
      return (a.co2Kg ?? Infinity) - (b.co2Kg ?? Infinity);
    })
    .slice(0, limit);

  return { diagnosis, region, suggestions };
}

// ── Category recommendations (smart shopping list) ──────────────────────────
//
// The proactive path: no scanned product, just "I need coffee". We rank the
// curated candidates for a category by the user's region and priorities and
// resolve the best one(s) to live OFF products — same plumbing as getSwaps,
// minus the diagnosis.

/** How strongly a candidate speaks to what the user says they care about. */
function priorityAffinity(c: AltCandidate, p: UserPriorities): number {
  let score = 0;
  if (c.addresses.includes("labor")) score += priorityMultiplier(p.laborRights);
  if (c.addresses.includes("eco")) score += priorityMultiplier(p.environment);
  if (c.addresses.includes("animal_welfare")) score += priorityMultiplier(p.animalWelfare);
  return score;
}

/**
 * Pure ranking half of getCategoryRecommendations — network-free so it can be
 * unit-tested. Custom picks first, then in-market, then affinity with the
 * user's priorities, then confirmed availability, then richer certifications.
 */
export function rankCategoryCandidates(
  categoryKey: SwapCategoryKey,
  country: string | null,
  priorities: UserPriorities = DEFAULT_PRIORITIES,
): AltCandidate[] {
  const merged = dedupeByBrand(
    [
      ...getCustomCandidates(categoryKey),
      ...getCandidates(categoryKey),
      ...getVerifiedEthicsCandidates(categoryKey),
      ...getChocolateDirectoryCandidates(categoryKey),
    ].filter(isCandidateClean),
  );

  // Only recommend things the user can actually buy, when we know enough.
  let pool = merged;
  if (country) {
    const inMarket = pool.filter((c) => isInMarket(c, country));
    if (inMarket.length >= 2) pool = inMarket;
  }

  return pool.sort((a, b) => {
    if (!!a.custom !== !!b.custom) return a.custom ? -1 : 1;
    const am = isInMarket(a, country) ? 1 : 0;
    const bm = isInMarket(b, country) ? 1 : 0;
    if (am !== bm) return bm - am;
    const ap = priorityAffinity(a, priorities);
    const bp = priorityAffinity(b, priorities);
    if (ap !== bp) return bp - ap;
    const ac = a.assumeAvailable === false ? 0 : 1;
    const bc = b.assumeAvailable === false ? 0 : 1;
    if (ac !== bc) return bc - ac;
    return b.certifications.length - a.certifications.length;
  });
}

/** Map free text like "coffee" or "dark chocolate" onto a catalog category. */
export function detectCategoryFromText(text: string): SwapCategoryKey | null {
  return detectSwapCategory({ productName: text });
}

export interface CategoryRecommendationOptions {
  region?: UserRegion | null;
  priorities?: UserPriorities;
  limit?: number;
}

/**
 * Best curated brand(s) for a generic category, tuned to the user's region and
 * priorities and resolved to live OFF products where possible.
 */
export async function getCategoryRecommendations(
  categoryKey: SwapCategoryKey,
  opts: CategoryRecommendationOptions = {},
): Promise<SwapSuggestion[]> {
  const region = opts.region ?? null;
  const priorities = opts.priorities ?? DEFAULT_PRIORITIES;
  const limit = opts.limit ?? 1;
  const country = region?.countryCode ?? null;
  const countryTag = country ? findCountry(country)?.offTag ?? null : null;

  const candidates = rankCategoryCandidates(categoryKey, country, priorities)
    .slice(0, Math.max(limit + 2, 4)); // resolve a few extra, trim after

  const resolved = await Promise.all(candidates.map((c) => resolveCandidate(c, countryTag)));

  return candidates
    .map((c, i) => buildSuggestion(c, resolved[i], null, region))
    .sort((a, b) => {
      const aAvail = (a.availableInRegion === true ? 2 : 0) + (a.regionAvailable ? 1 : 0);
      const bAvail = (b.availableInRegion === true ? 2 : 0) + (b.regionAvailable ? 1 : 0);
      if (aAvail !== bAvail) return bAvail - aAvail;
      if (a.custom !== b.custom) return a.custom ? -1 : 1;
      const aEco = a.ecoGrade ? ECO_RANK[a.ecoGrade] ?? 0 : 0;
      const bEco = b.ecoGrade ? ECO_RANK[b.ecoGrade] ?? 0 : 0;
      if (aEco !== bEco) return bEco - aEco;
      return (a.co2Kg ?? Infinity) - (b.co2Kg ?? Infinity);
    })
    .slice(0, limit);
}

/** Concern → short human label, used by cards and the impact dashboard. */
export const CONCERN_LABEL: Record<ConcernType, string> = {
  labor: "labour concern",
  boycott: "boycott-listed brand",
  animal_welfare: "animal-welfare concern",
  eco: "high-carbon product",
};

/** Concern → verb phrase for "you avoided a …". */
export const CONCERN_AVOIDED_LABEL: Record<ConcernType, string> = {
  labor: "labour-flagged product",
  boycott: "boycott-listed product",
  animal_welfare: "animal-welfare-flagged product",
  eco: "high-carbon product",
};
