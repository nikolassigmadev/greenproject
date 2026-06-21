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

export interface ScoreInput {
  ecoGrade?: string | null;
  ecoScore?: number | null;
  nutriGrade?: string | null;
  /** Count of labor/human-rights allegations against the brand (0 = clean). */
  laborAllegations?: number | null;
  /** Brand name — powers boycott + animal-welfare pillars. */
  brand?: string | null;
}

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

/** Labor 0–100 from allegation count + boycott status. */
function laborSubScore(input: ScoreInput): number | null {
  const hasBrand = !!input.brand;
  const count = typeof input.laborAllegations === "number" ? input.laborAllegations : null;
  if (count === null && !hasBrand) return null; // nothing to judge
  let score = count && count > 0 ? Math.max(5, 90 - count * 30) : 90;
  if (checkBoycott(input.brand)) score = Math.min(score, 25);
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
    return { score: null, grade: "unknown", verdict: "UNKNOWN" };
  }

  const totalWeight = active.reduce((a, p) => a + p.weight, 0);
  let score = active.reduce((a, p) => a + p.sub * p.weight, 0) / totalWeight;

  // Domination: a Critical pillar (weight ≥ 2.5) that scores badly (≤ 30)
  // drags the whole verdict down to it — a top priority can sink a product alone.
  for (const p of active) {
    if (p.weight >= 2.5 && p.sub <= 30) score = Math.min(score, p.sub);
  }

  const rounded = Math.round(Math.max(0, Math.min(100, score)));
  return { score: rounded, grade: gradeFromScore(rounded), verdict: verdictFromScore(rounded) };
}

function verdictFromScore(score: number): Verdict {
  if (score >= 70) return "BUY";
  if (score >= 45) return "CONSIDER";
  if (score >= 25) return "CAUTION";
  return "AVOID";
}
