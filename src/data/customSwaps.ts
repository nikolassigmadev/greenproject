// Loader for hand-curated swap products (customSwaps.json).
//
// You add products by editing customSwaps.json — no code needed. This module
// validates each entry, turns it into an AltCandidate the swap engine
// understands, and exposes them per category. Invalid rows are skipped with a
// console warning so a typo never breaks the app.

import type { CertificationType } from "@/utils/verifiedEthics";
import {
  isSwapCategory,
  type AltCandidate,
  type ConcernType,
  type SwapCategoryKey,
} from "@/data/ethicalAlternatives";
import customData from "@/data/customSwaps.json";

interface RawCustomSwap {
  barcode?: string;
  name?: string;
  category?: string;
  brand?: string;
  certifications?: string[];
  strengths?: string[];
  addresses?: string[];
  markets?: string[];
}

const VALID_CONCERNS: ConcernType[] = ["labor", "boycott", "animal_welfare", "eco"];
const ALL_CONCERNS: ConcernType[] = [...VALID_CONCERNS];

function toCandidate(raw: RawCustomSwap, index: number): AltCandidate | null {
  const barcode = raw.barcode?.trim();
  const name = raw.name?.trim();
  const category = raw.category?.trim();

  if (!barcode || !name || !category) {
    console.warn(`[customSwaps] entry #${index} skipped: barcode, name and category are required.`);
    return null;
  }
  if (!isSwapCategory(category)) {
    console.warn(`[customSwaps] entry "${name}" skipped: "${category}" is not a valid category.`);
    return null;
  }

  const addresses = (raw.addresses ?? [])
    .filter((a): a is ConcernType => (VALID_CONCERNS as string[]).includes(a));

  return {
    brand: raw.brand?.trim() || name,
    productName: name,
    searchQuery: name,
    barcodes: [barcode],
    certifications: (raw.certifications ?? []) as CertificationType[],
    strengths: raw.strengths ?? [],
    addresses: addresses.length > 0 ? addresses : ALL_CONCERNS,
    markets: raw.markets && raw.markets.length > 0
      ? raw.markets.map((m) => m.toUpperCase())
      : undefined,
    custom: true,
  };
}

const CUSTOM_CANDIDATES: AltCandidate[] = (() => {
  const list = (customData as { products?: RawCustomSwap[] }).products ?? [];
  return list
    .map((raw, i) => toCandidate(raw, i))
    .filter((c): c is AltCandidate => c !== null);
})();

/** Hand-added candidates for a category (ranked first by the engine). */
export function getCustomCandidates(category: SwapCategoryKey): AltCandidate[] {
  return CUSTOM_CANDIDATES.filter(
    (c) => c.searchQuery && getCategoryOf(c) === category,
  );
}

// We re-derive category by matching the original JSON, kept in a parallel map
// so getCustomCandidates stays O(1)-ish without re-parsing.
const CATEGORY_BY_BRAND = new Map<string, SwapCategoryKey>();
((customData as { products?: RawCustomSwap[] }).products ?? []).forEach((raw) => {
  if (raw.category && isSwapCategory(raw.category) && raw.barcode) {
    CATEGORY_BY_BRAND.set(raw.barcode.trim(), raw.category);
  }
});
function getCategoryOf(c: AltCandidate): SwapCategoryKey | null {
  const code = c.barcodes?.[0];
  return code ? CATEGORY_BY_BRAND.get(code) ?? null : null;
}

export const CUSTOM_SWAP_COUNT = CUSTOM_CANDIDATES.length;
