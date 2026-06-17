// Adapter: turn the verified-ethics database (verifiedEthics.ts) into swap
// candidates the engine can recommend.
//
// verifiedEthics groups brands into coarse buckets (chocolate, coffee_tea,
// packaged_grocery, eggs_dairy_meat, seafood). The swap engine works in fine
// categories (coffee vs tea, milk vs yogurt vs cheese, …), so we translate each
// brand to its precise category — and skip any packaged-grocery brand we can't
// confidently place rather than mis-categorising it.

import {
  getVerifiedEthicsBrands,
  type VerifiedEthicsCategory,
  type CertificationType,
} from "@/utils/verifiedEthics";
import {
  detectSwapCategory,
  type AltCandidate,
  type ConcernType,
  type SwapCategoryKey,
} from "@/data/ethicalAlternatives";

// Which concern a certification primarily speaks to.
const CERT_CONCERN: Partial<Record<CertificationType, ConcernType>> = {
  fair_trade: "labor",
  worker_coop: "labor",
  direct_trade: "labor",
  b_corp: "eco",
  organic: "eco",
  climate_neutral: "eco",
  regenerative_organic: "eco",
  rainforest_alliance: "eco",
  msc: "eco",
  asc: "eco",
  certified_humane: "animal_welfare",
  animal_welfare_approved: "animal_welfare",
  gap_rated: "animal_welfare",
};

function fineCategory(brandName: string, vCategory: VerifiedEthicsCategory): SwapCategoryKey | null {
  switch (vCategory) {
    case "chocolate":
      return "chocolate";
    case "seafood":
      return "seafood";
    case "coffee_tea":
      return /\btea\b/i.test(brandName) ? "tea" : "coffee";
    case "eggs_dairy_meat":
      // Most entries are eggs; fall back to eggs when the name gives no hint.
      return detectSwapCategory({ productName: brandName }) ?? "eggs";
    case "packaged_grocery":
      // Only include when we can place it precisely (e.g. "…Ice Creams" → ice_cream).
      return detectSwapCategory({ productName: brandName });
    default:
      return null;
  }
}

function build(): Map<SwapCategoryKey, AltCandidate[]> {
  const map = new Map<SwapCategoryKey, AltCandidate[]>();
  for (const b of getVerifiedEthicsBrands()) {
    const category = fineCategory(b.brandName, b.category);
    if (!category) continue;

    const addresses = [
      ...new Set(
        b.certifications
          .map((c) => CERT_CONCERN[c])
          .filter((x): x is ConcernType => !!x),
      ),
    ];

    const candidate: AltCandidate = {
      brand: b.brandName,
      productName: b.brandName,
      searchQuery: b.brandName,
      certifications: b.certifications,
      strengths: b.strengths,
      addresses: addresses.length > 0 ? addresses : ["labor", "eco"],
      // Market coverage isn't tracked in the verified-ethics list, so we don't
      // assume local availability — only claim it when OFF confirms a country.
      assumeAvailable: false,
    };

    const list = map.get(category) ?? [];
    list.push(candidate);
    map.set(category, list);
  }
  return map;
}

let CACHE: Map<SwapCategoryKey, AltCandidate[]> | null = null;

/** Verified-ethics brands that belong to a swap category. */
export function getVerifiedEthicsCandidates(category: SwapCategoryKey): AltCandidate[] {
  if (!CACHE) CACHE = build();
  return CACHE.get(category) ?? [];
}
