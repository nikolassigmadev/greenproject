// Shelf scan — point the camera at a shelf, detect every product on it, score
// each with the user's personalized weighting, and rank them so the app can
// surface the best-rated option. Reuses the existing vision proxy
// (analyze-image · scan-shelf task), the smart OFF resolver, and the shared
// personalized scorer — no new scoring logic lives here.

import { analyzeProductImage } from "@/services/api/backend-client";
import { smartProductSearch } from "@/utils/smartProductSearch";
import { personalizedScore, type Verdict } from "@/utils/personalizedScore";
import { getBrandSentiment } from "@/utils/watchlist";
import { getLaborAllegationCount } from "@/utils/laborCheck";
import { loadPriorities } from "@/utils/userPreferences";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";

export interface DetectedProduct {
  brand: string;
  product: string;
}

export interface ShelfPick {
  /** "Brand Product" string as detected on the shelf. */
  label: string;
  detectedBrand: string;
  /** Resolved Open Food Facts product, or null when we couldn't match it. */
  product: OpenFoodFactsResult | null;
  /** Personalized 0–100 score, or null when no pillar the user cares about had data. */
  score: number | null;
  grade: "a" | "b" | "c" | "d" | "e" | "unknown";
  verdict: Verdict;
  /**
   * True only when we matched a real product WITH eco or nutrition data — i.e.
   * the score reflects the actual product, not just an unflagged brand. A
   * brand-only fallback (clean brand, no product data) is NOT a confident pick,
   * so these never outrank a data-backed one.
   */
  hasData: boolean;
}

export interface ShelfScanResult {
  /** Ranked best-first: scored products ahead of unresolved ones. */
  picks: ShelfPick[];
  /** How many distinct products the vision model reported. */
  detectedCount: number;
}

/** Pull the first JSON array out of the model reply, tolerating fences/prose. */
function parseDetected(content: string): DetectedProduct[] {
  if (!content) return [];
  const start = content.indexOf("[");
  const end = content.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return [];
  try {
    const arr = JSON.parse(content.slice(start, end + 1));
    if (!Array.isArray(arr)) return [];
    return arr
      .map((x) => ({
        brand: typeof x?.brand === "string" ? x.brand.trim() : "",
        product: typeof x?.product === "string" ? x.product.trim() : "",
      }))
      .filter((x) => x.product || x.brand);
  } catch {
    return [];
  }
}

/** Collapse duplicate facings the model may have reported more than once. */
function dedupe(items: DetectedProduct[]): DetectedProduct[] {
  const seen = new Set<string>();
  const out: DetectedProduct[] = [];
  for (const it of items) {
    const key = `${it.brand} ${it.product}`.toLowerCase().replace(/\s+/g, " ").trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(it);
    }
  }
  return out;
}

const normAlpha = (s: string | null | undefined): string =>
  (s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// Product-TYPE words that signal a different product than a packaged bar/snack.
// If a match introduces one the detection never mentioned, it's the wrong SKU
// (e.g. "Dairy Milk Caramel" must not resolve to "…caramel ice cream", nor
// "Munchies" to "BBQ Flavour Peanuts").
const FORMAT_GUARD = [
  "ice cream", "icecream", "biscuit", "biscuits", "cookie", "cookies",
  "peanut", "peanuts", "drink", "milkshake", "shake", "spread", "cereal",
  "pudding", "sauce", "syrup", "powder", "yogurt", "yoghurt",
];

/**
 * Reject obviously-wrong OFF matches so the shelf never scores the wrong SKU.
 * Two guards, both intentionally conservative (they only ever turn a bad match
 * into a clean "no match", never the reverse):
 *   1. Format — the match introduces a product-type word the detection lacked.
 *   2. Brand  — a real (3+ char) detected brand must appear in the match's
 *      brand OR name (OFF often omits the brand from the name, so we check both).
 */
export function validateMatch(
  detected: DetectedProduct,
  product: OpenFoodFactsResult | null,
): OpenFoodFactsResult | null {
  if (!product) return null;
  const q = ` ${normAlpha(`${detected.brand} ${detected.product}`)} `;
  const matched = ` ${normAlpha(`${product.brand} ${product.productName}`)} `;

  for (const w of FORMAT_GUARD) {
    const token = normAlpha(w);
    if (matched.includes(` ${token} `) && !q.includes(` ${token} `)) return null;
  }

  const brandPrimary = normAlpha(detected.brand).split(" ")[0];
  if (brandPrimary.length >= 3 && !matched.includes(brandPrimary)) return null;

  return product;
}

/**
 * Detect, resolve and score every product on a shelf photo.
 * `imageBase64` must be RAW base64 (no `data:` prefix) — the server adds it.
 */
export async function scanShelf(imageBase64: string): Promise<ShelfScanResult> {
  const res = await analyzeProductImage(imageBase64, "scan-shelf");
  const detected = dedupe(parseDetected(res.content)).slice(0, 8);
  if (detected.length === 0) return { picks: [], detectedCount: 0 };

  const priorities = loadPriorities();

  const picks = await Promise.all(
    detected.map(async (d): Promise<ShelfPick> => {
      const label = `${d.brand} ${d.product}`.trim();
      let product: OpenFoodFactsResult | null = null;
      try {
        // The vision model already emits a clean "Brand Product" string, so we
        // skip the extra AI typo-fix round-trip.
        const search = await smartProductSearch(label, { skipAiFix: true });
        // Drop wrong-format / wrong-brand matches so we never score the wrong SKU.
        product = validateMatch(d, search.product);
      } catch {
        product = null;
      }

      const brand = product?.brand ?? d.brand ?? null;
      const ps = personalizedScore(
        {
          ecoGrade: product?.ecoscoreGrade,
          ecoScore: product?.ecoscoreScore,
          nutriGrade: product?.nutriscoreGrade,
          laborAllegations: getLaborAllegationCount(brand, product?.productName ?? d.product),
          brand,
          userBrandSentiment: getBrandSentiment(brand),
        },
        priorities,
      );

      const hasData = !!product && (!!product.ecoscoreGrade || !!product.nutriscoreGrade);

      return {
        label,
        detectedBrand: d.brand,
        product,
        score: ps.score,
        grade: ps.grade,
        verdict: ps.verdict,
        hasData,
      };
    }),
  );

  // Data-backed picks always rank above brand-only ones, so a product we could
  // actually assess wins over an unflagged brand we know nothing else about.
  // Within each tier, higher score first; null scores sink to the bottom.
  picks.sort((a, b) => {
    if (a.hasData !== b.hasData) return a.hasData ? -1 : 1;
    if (a.score == null && b.score == null) return 0;
    if (a.score == null) return 1;
    if (b.score == null) return -1;
    return b.score - a.score;
  });

  return { picks, detectedCount: detected.length };
}
