import { toneColor, toneBg, scoreTone } from "@/styles/design-tokens";
import type { ScanHistoryEntry } from "@/utils/userPreferences";

/**
 * Shape consumed by the animated result card on the home page. The example
 * demo products and a real "most recent scan" both render through this exact
 * shape, so the card looks and animates identically in both modes.
 */
export interface ShowcaseProduct {
  name: string;
  subtitle: string;
  score: number;
  verdict: string;
  verdictColor: string;
  verdictBg: string;
  ringColor: string;
  description: string;
  icon: "good" | "bad";
  categories: { label: string; value: number; color: string }[];
}

// Eco-Score / Nutri-Score letter grades → a representative 0-100 value so a
// graded product can fill the same numeric ring + bars the demo uses.
const GRADE_SCORE: Record<string, number> = { a: 92, b: 74, c: 50, d: 30, e: 14, f: 8 };
// NOVA processing groups (1 = unprocessed … 4 = ultra-processed) → 0-100.
const NOVA_SCORE: Record<number, number> = { 1: 90, 2: 66, 3: 40, 4: 18 };

const gradeToScore = (grade?: string | null): number | null => {
  if (!grade) return null;
  return GRADE_SCORE[grade.toLowerCase()] ?? null;
};

// Guards against out-of-range scores persisted in scan history before scores
// were clamped at ingestion (e.g. an OFF eco-score of 101 saved to localStorage).
const clampScore = (value: number): number => Math.max(0, Math.min(100, value));

/**
 * A scan has "complete eco data" once Open Food Facts gave it a real
 * Eco-Score (a letter grade or a numeric score). Products without one show
 * an empty environment metric, so we keep the example showcase until the user
 * has scanned at least one fully-scored product.
 */
export const hasCompleteEcoData = (entry: ScanHistoryEntry): boolean =>
  !!entry.scores.ecoGrade || entry.scores.ecoScore != null;

// Verdict key (as stored by the detail page) → home-page tone + display label.
const VERDICT_TONE: Record<string, "good" | "warn" | "bad"> = {
  BUY: "good", CONSIDER: "warn", CAUTION: "warn", AVOID: "bad", UNKNOWN: "warn",
};
const VERDICT_LABEL: Record<string, string> = {
  BUY: "BUY", CONSIDER: "CONSIDER", CAUTION: "CAUTION", AVOID: "AVOID", UNKNOWN: "UNRATED",
};

const catColor = (value: number) => toneColor(scoreTone(value));

/**
 * Convert a stored scan-history entry into a {@link ShowcaseProduct} so it can
 * be rendered by the same animated card as the example demo. Only metrics with
 * real data produce a bar; Environment is always present because callers gate
 * on {@link hasCompleteEcoData}.
 */
export const scanEntryToShowcase = (entry: ScanHistoryEntry): ShowcaseProduct => {
  const envScore = clampScore(Math.round(
    entry.scores.ecoScore ?? gradeToScore(entry.scores.ecoGrade) ?? 50,
  ));

  const key = (entry.verdict.label || "UNKNOWN").toUpperCase();
  const tone = VERDICT_TONE[key] ?? "warn";

  const categories: { label: string; value: number; color: string }[] = [];

  // Environment — always available (entry passed the complete-eco gate).
  categories.push({ label: "Environment", value: envScore, color: catColor(envScore) });

  // Labour — derived from the count of flagged allegations.
  const allegations = entry.scores.laborAllegations;
  const labour = allegations > 0 ? Math.max(15, 80 - allegations * 22) : 88;
  categories.push({ label: "Labour", value: labour, color: catColor(labour) });

  // Nutrition — from the Nutri-Score grade, when graded.
  const nutrition = gradeToScore(entry.scores.nutriScore);
  if (nutrition != null) {
    categories.push({ label: "Nutrition", value: nutrition, color: catColor(nutrition) });
  }

  // Processing — from the NOVA group, when known.
  const processing = entry.scores.novaGroup != null
    ? NOVA_SCORE[entry.scores.novaGroup] ?? null
    : null;
  if (processing != null) {
    categories.push({ label: "Processing", value: processing, color: catColor(processing) });
  }

  // Description — a concise factual line from whatever grades we have.
  const bits: string[] = [];
  if (entry.scores.ecoGrade) bits.push(`Eco-Score ${entry.scores.ecoGrade.toUpperCase()}`);
  else if (entry.scores.ecoScore != null) bits.push(`Eco-Score ${clampScore(entry.scores.ecoScore)}/100`);
  if (entry.scores.nutriScore && gradeToScore(entry.scores.nutriScore) != null) {
    bits.push(`Nutri-Score ${entry.scores.nutriScore.toUpperCase()}`);
  }
  if (entry.scores.novaGroup != null) bits.push(`NOVA ${entry.scores.novaGroup}`);
  if (allegations > 0) {
    bits.push(`${allegations} labour allegation${allegations > 1 ? "s" : ""}`);
  }
  const description = bits.join(" · ") || "Tap to see the full breakdown.";

  return {
    name: entry.productName || "Unknown product",
    subtitle: entry.brand || "Unknown brand",
    score: envScore,
    verdict: VERDICT_LABEL[key] ?? key,
    verdictColor: toneColor(tone),
    verdictBg: toneBg(tone),
    ringColor: toneColor(tone),
    description,
    icon: tone === "good" ? "good" : "bad",
    categories,
  };
};
