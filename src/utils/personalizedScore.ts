// Shared, priority-weighted product scorer — the single source of truth for the
// "overall score / impact" shown across the app (cart, product cards, etc.).
//
// Priorities DOMINATE: a pillar set to "Critical" can single-handedly drive the
// result down (a bad top-priority pillar caps the whole score). Every pillar with
// data still counts at least a little — the lowest level is "Low", not off. See
// priorityMultiplier().

import { priorityMultiplier, type UserPriorities } from "@/utils/userPreferences";
import { checkAnimalWelfareFlag } from "@/utils/animalWelfareFlags";
import { checkBoycott } from "@/data/boycottBrands";
import { findVerifiedEthics } from "@/utils/verifiedEthics";
import { findChocolateEntry } from "@/data/chocolateDirectory";
import type { BrandSentiment } from "@/utils/watchlist";

export interface ScoreInput {
  ecoGrade?: string | null;
  ecoScore?: number | null;
  nutriGrade?: string | null;
  /** Count of labor/human-rights allegations against the brand (0 = clean). */
  laborAllegations?: number | null;
  /** Brand name — powers boycott + animal-welfare + verified-ethics pillars. */
  brand?: string | null;
  /** Product name — sharpens verified-ethics / chocolate-leader lookups. */
  productName?: string | null;
  /**
   * The user's personal stance on the brand from their watchlist. "avoid" caps
   * the score down hard; "trust" lifts it. This is the user's own call and so
   * overrides the data-driven score for their personalized view.
   */
  userBrandSentiment?: BrandSentiment | null;
}

// How far a personal watchlist stance moves the score. "avoid" caps it into
// AVOID territory; "trust" floors it into BUY territory.
const SENTIMENT_AVOID_CAP = 15;
const SENTIMENT_TRUST_FLOOR = 80;

export type Verdict = "BUY" | "CONSIDER" | "CAUTION" | "AVOID" | "UNKNOWN";

export interface PersonalizedScore {
  /** 0–100, or null when no pillar has data the user cares about. */
  score: number | null;
  grade: "a" | "b" | "c" | "d" | "e" | "unknown";
  verdict: Verdict;
}

const GRADE_SCORE: Record<string, number> = { a: 90, b: 70, c: 50, d: 30, e: 10 };

/** Letter grade from a 0–100 score (shared thresholds used app-wide). */
export function gradeFromScore(score: number): "a" | "b" | "c" | "d" | "e" {
  if (score >= 80) return "a";
  if (score >= 60) return "b";
  if (score >= 40) return "c";
  if (score >= 20) return "d";
  return "e";
}

function gradeToScore(grade?: string | null): number | null {
  if (!grade) return null;
  return GRADE_SCORE[grade.toLowerCase()] ?? null;
}

/** Environment 0–100: prefer numeric eco-score, fall back to eco grade. */
function envSubScore(input: ScoreInput): number | null {
  if (typeof input.ecoScore === "number") return Math.max(0, Math.min(100, input.ecoScore));
  return gradeToScore(input.ecoGrade);
}

/**
 * Ethics / labor 0–100 from allegation count, boycott status, AND positive
 * ethical standing. Verified ethical leaders (e.g. Tony's Chocolonely, a
 * Chocolate Scorecard "leader") earn a score ABOVE the neutral "no allegations"
 * 90, so a shopper who prioritises ethics can see a great-ethics product rise
 * even when its carbon/eco-score is poor.
 */
function laborSubScore(input: ScoreInput): number | null {
  const hasBrand = !!input.brand;
  const count = typeof input.laborAllegations === "number" ? input.laborAllegations : null;
  if (count === null && !hasBrand) return null; // nothing to judge

  // Negative signals first — allegations / boycott sink the score.
  const hasAllegation = !!(count && count > 0);
  let score = hasAllegation ? Math.max(5, 90 - count! * 30) : 90;
  const boycotted = !!checkBoycott(input.brand);
  if (boycotted) score = Math.min(score, 25);

  // Positive ethics — only credited when there is no live concern, so a
  // boycott or fresh allegation always wins over a legacy certification.
  if (hasBrand && !hasAllegation && !boycotted) {
    const verified = findVerifiedEthics(input.brand, input.productName ?? null);
    const choc = findChocolateEntry(input.brand, input.productName ?? null);
    if (verified || choc?.verdict === "leader") score = 100;
    else if (choc?.verdict === "better") score = 95;
  }
  return score;
}

/** Animal welfare 0–100 from the brand's welfare flag severity. */
function animalSubScore(input: ScoreInput): number | null {
  if (!input.brand) return null;
  const flag = checkAnimalWelfareFlag(input.brand);
  if (!flag.isFlagged) return 90;
  if (flag.severity === "critical") return 10;
  if (flag.severity === "high") return 30;
  return 50; // moderate
}

interface Pillar {
  sub: number | null;
  weight: number;
}

/**
 * Compute the priority-weighted overall score for a product.
 * Only pillars that have data AND a non-zero priority weight are counted.
 */
export function personalizedScore(
  input: ScoreInput,
  priorities: UserPriorities,
): PersonalizedScore {
  const pillars: Pillar[] = [
    { sub: envSubScore(input), weight: priorityMultiplier(priorities.environment) },
    { sub: gradeToScore(input.nutriGrade), weight: priorityMultiplier(priorities.nutrition) },
    { sub: laborSubScore(input), weight: priorityMultiplier(priorities.laborRights) },
    { sub: animalSubScore(input), weight: priorityMultiplier(priorities.animalWelfare) },
  ];

  const active = pillars.filter((p) => p.sub !== null && p.weight > 0) as {
    sub: number;
    weight: number;
  }[];

  if (active.length === 0) {
    // A personal watchlist stance is enough to render a verdict even when we have
    // no other data on the product.
    if (input.userBrandSentiment === "avoid") {
      return { score: SENTIMENT_AVOID_CAP, grade: gradeFromScore(SENTIMENT_AVOID_CAP), verdict: verdictFromScore(SENTIMENT_AVOID_CAP) };
    }
    if (input.userBrandSentiment === "trust") {
      return { score: SENTIMENT_TRUST_FLOOR, grade: gradeFromScore(SENTIMENT_TRUST_FLOOR), verdict: verdictFromScore(SENTIMENT_TRUST_FLOOR) };
    }
    return { score: null, grade: "unknown", verdict: "UNKNOWN" };
  }

  const totalWeight = active.reduce((a, p) => a + p.weight, 0);
  let score = active.reduce((a, p) => a + p.sub * p.weight, 0) / totalWeight;

  // Domination is symmetric: a Critical pillar (weight ≥ 2.5) drives the whole
  // verdict toward itself. A great top priority LIFTS the score (so excellent
  // ethics can carry a poor-carbon product when ethics is what you care about);
  // a bad top priority SINKS it. Lift first, then sink — so a genuine critical
  // concern (a boycott, a critical allegation) always has the final say and can
  // never be masked by a strength elsewhere.
  for (const p of active) {
    if (p.weight >= 2.5 && p.sub >= 70) score = Math.max(score, p.sub - 8);
  }
  for (const p of active) {
    if (p.weight >= 2.5 && p.sub <= 30) score = Math.min(score, p.sub);
  }

  // The user's personal watchlist stance has the final say in their own score.
  if (input.userBrandSentiment === "avoid") score = Math.min(score, SENTIMENT_AVOID_CAP);
  else if (input.userBrandSentiment === "trust") score = Math.max(score, SENTIMENT_TRUST_FLOOR);

  const rounded = Math.round(Math.max(0, Math.min(100, score)));
  return { score: rounded, grade: gradeFromScore(rounded), verdict: verdictFromScore(rounded) };
}

function verdictFromScore(score: number): Verdict {
  if (score >= 70) return "BUY";
  if (score >= 45) return "CONSIDER";
  if (score >= 25) return "CAUTION";
  return "AVOID";
}
