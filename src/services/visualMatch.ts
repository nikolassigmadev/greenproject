// ── Visual match: confirm the resolved product looks like the scanned photo ──
// Hybrid strategy (cheap → expensive):
//   1. Colour-match the user's photo against each candidate's cover (free, local).
//   2. If a candidate clearly wins on colour, take it — no API call.
//   3. Only when the top colour match is weak or the top two are close do we
//      spend one AI vision call to confirm the same product.
// Re-ranks silently and never blocks: it always returns one of the candidates
// (the closest-looking one), defaulting to the text-relevance pick when colour
// gives no usable signal.

import { getBackendUrl } from "@/config/backend";
import { getColorSignature, colorSimilarity } from "@/utils/colorMatch";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";

/** Route an Open Food Facts image through our backend so its pixels are CORS-readable on a canvas. */
export function proxiedImageUrl(url: string): string {
  return `${getBackendUrl()}/api/image-proxy?url=${encodeURIComponent(url)}`;
}

/** Ask the vision model whether the user's photo and a candidate cover are the same product. */
export async function verifyProductMatch(
  userImageBase64: string,
  candidateImageUrl: string,
): Promise<{ match: boolean; confidence: number } | null> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/openai/verify-product-match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: userImageBase64, candidateImageUrl }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.success) return null;
    return { match: !!data.match, confidence: Number(data.confidence) || 0 };
  } catch {
    return null;
  }
}

const STRONG_COLOR = 0.7;   // a confident colour match — accept without an AI call
const CLOSE_MARGIN = 0.08;  // top two within this → ambiguous, worth an AI check
const MAX_CANDIDATES = 5;   // cap colour work per scan
const MAX_AI_CHECKS = 2;    // cap AI confirmations per scan

export interface VisualPick {
  /** The candidate to show — the best colour/AI match, or `fallback`. */
  chosen: OpenFoodFactsResult;
  /** `candidates` reordered so `chosen` leads. */
  reordered: OpenFoodFactsResult[];
  /** Whether an AI vision confirmation was spent. */
  usedAi: boolean;
  /** Best colour similarity seen among candidates, 0–1 (0 = no usable signal). */
  topSimilarity: number;
  /** True when the user photo AND ≥1 candidate had usable colour to compare. */
  hadSignal: boolean;
  /**
   * True when `chosen` is a CONFIRMED visual match (strong colour or AI-verified).
   * False means "couldn't confirm" — either no signal, or the covers don't look
   * like the photo — so the caller may want to widen the candidate pool.
   */
  verified: boolean;
}

/**
 * Re-rank candidates by how much each one's cover photo looks like the user's
 * scan, and return the best along with a verification verdict. `fallback` (the
 * text-relevance winner) is returned whenever colour gives no usable signal, so
 * this can only improve the pick — and `verified`/`topSimilarity` let the caller
 * detect when NONE of the candidates actually match the photo.
 */
export async function pickVisualBestCandidate(
  userImageBase64: string | null | undefined,
  candidates: OpenFoodFactsResult[],
  fallback: OpenFoodFactsResult,
): Promise<VisualPick> {
  const noop: VisualPick = {
    chosen: fallback, reordered: candidates, usedAi: false,
    topSimilarity: 0, hadSignal: false, verified: false,
  };
  if (!userImageBase64) return noop;

  const pool = candidates.filter((c) => c.imageUrl).slice(0, MAX_CANDIDATES);
  if (pool.length === 0) return noop;

  const userSig = await getColorSignature(`data:image/jpeg;base64,${userImageBase64}`);
  if (!userSig) return noop; // can't read the user's own photo → don't reorder

  const scored = await Promise.all(
    pool.map(async (c) => ({
      c,
      color: colorSimilarity(userSig, await getColorSignature(proxiedImageUrl(c.imageUrl!))),
    })),
  );
  const withSignal = scored.filter((s) => s.color > 0).sort((a, b) => b.color - a.color);
  if (withSignal.length === 0) return noop;

  const reorder = (chosen: OpenFoodFactsResult): OpenFoodFactsResult[] => [
    chosen,
    ...candidates.filter((c) => c.barcode !== chosen.barcode),
  ];

  const top = withSignal[0];
  const second = withSignal[1];
  const topSimilarity = top.color;
  const ambiguous = top.color < STRONG_COLOR || (!!second && top.color - second.color < CLOSE_MARGIN);

  // Strong, unambiguous colour winner — accept, no API spend.
  if (!ambiguous) {
    return { chosen: top.c, reordered: reorder(top.c), usedAi: false, topSimilarity, hadSignal: true, verified: true };
  }

  // Ambiguous: confirm the top colour candidates with the vision model.
  let best: { c: OpenFoodFactsResult; confidence: number } | null = null;
  for (const s of withSignal.slice(0, MAX_AI_CHECKS)) {
    const v = await verifyProductMatch(userImageBase64, s.c.imageUrl!);
    if (v?.match && (!best || v.confidence > best.confidence)) best = { c: s.c, confidence: v.confidence };
  }
  if (best) return { chosen: best.c, reordered: reorder(best.c), usedAi: true, topSimilarity, hadSignal: true, verified: true };

  // AI inconclusive/unavailable → keep the proven text-relevance pick. We had a
  // colour signal but couldn't confirm a match (covers don't look like the
  // photo) → report unverified so the caller can widen the search.
  return { chosen: fallback, reordered: candidates, usedAi: true, topSimilarity, hadSignal: true, verified: false };
}
