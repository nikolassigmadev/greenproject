/**
 * Smart product search — the same pipeline the scan flow uses, packaged for
 * any caller (Compare page, manual search box, etc.).
 *
 * Pipeline:
 *   1. AI typo / formatting fix (with 3s timeout fallback).
 *   2. Pull a pool of OpenFoodFacts candidates (default 12).
 *   3. Filter by word-containment so unrelated products are dropped.
 *   4. Score the survivors with productRelevance.pickBestMatch.
 *   5. Prefer ties by eco-data completeness so the chosen product is usable.
 */

import { getBackendUrl } from '@/config/backend';
import { searchProducts as searchOff } from '@/services/openfoodfacts';
import type { OpenFoodFactsResult } from '@/services/openfoodfacts/types';
import { pickBestMatch } from './productRelevance';

export interface SmartSearchResult {
  product: OpenFoodFactsResult | null;
  /** Confidence 0-1 from the relevance scorer. */
  confidence: number;
  /** Query the backend AI returned (may equal the original). */
  cleanedQuery: string;
  /** True when no candidate cleared the strict relevance gate. */
  noMatch: boolean;
}

const NO_MATCH = (cleanedQuery: string): SmartSearchResult => ({
  product: null, confidence: 0, cleanedQuery, noMatch: true,
});

/** Ask OpenAI to spell-check and format a user-typed product query. */
async function fixProductQuery(raw: string): Promise<string> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/openai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: 'fix-product-query', userMessage: raw }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return raw;
    const data = await res.json();
    const fixed = typeof data?.content === 'string' ? data.content.trim() : '';
    return fixed || raw;
  } catch {
    return raw;
  }
}

/** At least one ≥3-char word in `query` must appear in `text` (case-insensitive). */
function containsAnyWord(query: string, text: string): boolean {
  const qWords = query
    .toLowerCase()
    .split(/[\s\-_,/&().]+/)
    .filter((w) => w.length >= 3);
  if (qWords.length === 0) return true;
  const lowered = text.toLowerCase();
  return qWords.some((w) => lowered.includes(w));
}

/** Sort tiebreaker: how much eco/nutrition data does this product have? */
function dataRichness(r: OpenFoodFactsResult): number {
  let s = 0;
  if (r.ecoscoreGrade) s += 20;
  if (r.nutriscoreGrade) s += 10;
  if (r.novaGroup != null) s += 5;
  if (r.ecoscoreData?.agribalyse?.co2_total != null) s += 25;
  if (r.imageUrl) s += 5;
  if (r.brand) s += 10;
  return s;
}

/** Strictest data tier — fully comparable across every metric we render. */
function hasFullCompareData(r: OpenFoodFactsResult): boolean {
  return !!r.ecoscoreGrade
    && r.ecoscoreData?.agribalyse?.co2_total != null
    && !!r.nutriscoreGrade
    && r.novaGroup != null;
}

/** Mid tier — at least eco grade + CO2 so we can run an Eco/CO2 comparison. */
function hasEcoData(r: OpenFoodFactsResult): boolean {
  return !!r.ecoscoreGrade && r.ecoscoreData?.agribalyse?.co2_total != null;
}

/** Pick the strictest tier that still has at least one survivor — graceful fallback. */
function applyDataFloor(candidates: OpenFoodFactsResult[]): OpenFoodFactsResult[] {
  // Tier 1: full data (eco + CO2 + nutri + nova) — gold standard.
  const full = candidates.filter(hasFullCompareData);
  if (full.length > 0) return full;
  // Tier 2: at least eco + CO2 — the metrics Compare actually renders.
  const eco = candidates.filter(hasEcoData);
  if (eco.length > 0) return eco;
  // Tier 3: any product with an eco grade — still has SOME comparable metric.
  const anyEco = candidates.filter((c) => !!c.ecoscoreGrade);
  if (anyEco.length > 0) return anyEco;
  // Tier 4: any product with a nutri grade — last comparable metric.
  const anyNutri = candidates.filter((c) => !!c.nutriscoreGrade);
  if (anyNutri.length > 0) return anyNutri;
  // No comparable data at all — return the richest by total field count so the
  // user at least sees the right brand instead of "no match".
  return [...candidates].sort((a, b) => dataRichness(b) - dataRichness(a));
}

export interface SmartSearchOptions {
  /** How many OFF candidates to pull before filtering. Default 12. */
  poolSize?: number;
  /** Skip the AI typo-fix step (use raw query directly). Default false. */
  skipAiFix?: boolean;
}

/** Brand-shape check: does the candidate's primary brand line up with the query? */
function isBrandHit(query: string, brand: string | null | undefined): boolean {
  if (!brand) return false;
  // OFF brand strings can be comma-separated parent chains.
  // Match the *primary* (first) brand only — that's the one shoppers see.
  const primary = brand.split(/[,;|/]/)[0].trim().toLowerCase();
  const q = query.toLowerCase().trim();
  if (!primary || !q) return false;
  if (primary === q) return true;
  if (primary.startsWith(q)) return true;
  if (q.startsWith(primary) && primary.length >= 4) return true;
  // Hyphen / space agnostic: "coca-cola" vs "coca cola"
  const stripped = (s: string) => s.replace(/[\s\-]+/g, '');
  return stripped(primary) === stripped(q);
}

/** Heuristic: a 1-2 word query that doesn't look like a generic noun. */
function looksLikeBrandQuery(query: string): boolean {
  const words = query.trim().split(/\s+/);
  if (words.length > 2) return false;
  // Reject generic nouns ("chips", "soda", "yogurt") — those belong to products.
  const GENERIC = new Set([
    'chips', 'crisps', 'soda', 'yogurt', 'yoghurt', 'cola', 'water', 'beer',
    'wine', 'milk', 'bread', 'cheese', 'butter', 'rice', 'pasta', 'tea',
    'coffee', 'juice', 'cereal', 'cookies', 'biscuits', 'chocolate',
  ]);
  return !words.every((w) => GENERIC.has(w.toLowerCase()));
}

export async function smartProductSearch(
  rawQuery: string,
  opts: SmartSearchOptions = {},
): Promise<SmartSearchResult> {
  const trimmed = rawQuery.trim();
  if (!trimmed) return NO_MATCH('');

  const cleanedQuery = opts.skipAiFix ? trimmed : await fixProductQuery(trimmed);

  // Pull a bigger pool — many OFF hits have no eco data, so we need headroom
  // to find ones that actually do.
  const pool = await searchOff(cleanedQuery, opts.poolSize ?? 30);
  if (pool.length === 0) return NO_MATCH(cleanedQuery);

  // BRAND-LED PATH:
  // For 1-2 word non-generic queries, treat the query as a brand. The brand
  // gate runs BEFORE the data floor — we must not pick a product from a
  // different brand just because the right brand has no eco data.
  if (looksLikeBrandQuery(trimmed)) {
    const brandHits = pool.filter((c) => isBrandHit(trimmed, c.brand));
    if (brandHits.length > 0) {
      // Within brand hits: prefer the data tier that has at least one survivor,
      // then sort by data richness (CO2 weighted highest), then popularity.
      const dataTiered = applyDataFloor(brandHits);
      // applyDataFloor always returns SOMETHING for a non-empty input, but
      // guard anyway.
      const candidatePool = dataTiered.length > 0 ? dataTiered : brandHits;
      const winner = [...candidatePool]
        .map((c) => ({ c, originalIndex: brandHits.indexOf(c), richness: dataRichness(c) }))
        .sort((a, b) => {
          if (b.richness !== a.richness) return b.richness - a.richness;
          return a.originalIndex - b.originalIndex; // popularity tiebreak
        })[0].c;
      return { product: winner, confidence: 0.9, cleanedQuery, noMatch: false };
    }
    // Brand query but no brand hit anywhere in the pool — refuse rather than
    // fall through to a fuzzy-text match that would return the wrong brand.
    return NO_MATCH(cleanedQuery);
  }

  // PRODUCT-NAME PATH:
  // Multi-word descriptive queries (e.g. "lays chilli chips", "alpro oat milk")
  // run through the normal relevance + word-containment filter.
  const wordMatched = pool.filter((p) =>
    containsAnyWord(cleanedQuery, [p.productName, p.brand].filter(Boolean).join(' ')),
  );
  const relevantPool = wordMatched.length > 0 ? wordMatched : pool;
  const candidates = applyDataFloor(relevantPool);

  const match = pickBestMatch(candidates, trimmed, cleanedQuery);
  if (match.passedRelevanceGate && match.product) {
    const winner = pickRichestEquallyRelevant(candidates, match.product, trimmed);
    return {
      product: winner,
      confidence: match.confidence,
      cleanedQuery,
      noMatch: false,
    };
  }

  // No strong match. Refuse rather than return a misleading first result.
  return NO_MATCH(cleanedQuery);
}

/**
 * If multiple candidates pass the relevance gate with similar scores,
 * prefer the one with more eco / nutrition data — otherwise the user
 * lands on a product with no scores to compare.
 */
function pickRichestEquallyRelevant(
  candidates: OpenFoodFactsResult[],
  defaultWinner: OpenFoodFactsResult,
  originalQuery: string,
): OpenFoodFactsResult {
  // Re-score every candidate and find any whose score is within 0.08 of the leader.
  const scored = candidates
    .map((c) => {
      const m = pickBestMatch([c], originalQuery, originalQuery);
      return {
        product: c,
        score: m.passedRelevanceGate ? m.confidence : 0,
        richness: dataRichness(c),
      };
    })
    .filter((s) => s.score > 0);

  if (scored.length === 0) return defaultWinner;

  const top = Math.max(...scored.map((s) => s.score));
  const closeContenders = scored.filter((s) => s.score >= top - 0.08);

  if (closeContenders.length <= 1) return defaultWinner;

  closeContenders.sort((a, b) => b.richness - a.richness || b.score - a.score);
  return closeContenders[0].product;
}
