import type { Product } from "@/data/products";
import { extractSimpleLivestockFactors } from "@/data/simpleLivestockScoring";

export type ScoreFactorKey = "labor" | "animalWelfare" | "carbon" | "transport" | "certifications" | "manual";
export type ScoreFactorDirection = "penalty" | "bonus";

export interface ScoreFactorBreakdown {
  key: ScoreFactorKey;
  label: string;
  cap: number;
  impact: number;
  direction: ScoreFactorDirection;
  inputLabel: string;
  inputValue: string;
}

export interface ScoreBreakdown {
  baseline: number;
  factors: ScoreFactorBreakdown[];
  finalScore: number;
  isEstimated: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

// ============================================================
// LABOR (35 points max) — Start at 35, deduct violations, add bonuses
// ============================================================
const laborScore = (laborRisk: Product["laborRisk"], certifications: string[]): number => {
  let score = 35;

  if (laborRisk === "high") {
    // High risk = no living wage (-15) + unsafe conditions (-12)
    score -= 27;
  } else if (laborRisk === "medium") {
    // Medium risk = no union rights (-8) + limited transparency (-5)
    score -= 13;
  }
  // low = no violations

  // Bonuses from certifications
  const certs = certifications.map((c) => c.toLowerCase());
  if (certs.some((c) => c.includes("fair trade"))) score += 5;
  if (certs.some((c) => c.includes("b-corp"))) score += 3;
  if (certs.some((c) => c.includes("living wage"))) score += 2;

  return clamp(score, 0, 35);
};

// ============================================================
// ANIMAL WELFARE (30 points max) — Start at 30, deduct violations, add bonuses
// ============================================================
const animalWelfareScore = (product: Product): number => {
  let score = 30;
  const materials = product.materials.map((m) => m.toLowerCase());
  const certs = product.certifications.map((c) => c.toLowerCase());
  const isLivestock =
    product.category.includes("Meat") ||
    product.category.includes("Dairy") ||
    product.category.includes("Eggs");

  if (isLivestock) {
    const factors = extractSimpleLivestockFactors(product);

    // Map animal space to farming type violations
    if (factors.animalSpace === "terrible") {
      score -= 30; // factory farmed — instant 0
    } else if (factors.animalSpace === "poor") {
      score -= 22; // intensive farming
    } else if (factors.animalSpace === "good") {
      score -= 12; // free-range/cage-free
    } else if (factors.animalSpace === "excellent") {
      score -= 5; // organic + humane
    }

    // Animal testing penalty
    if (materials.some((m) => m.includes("animal testing") || m.includes("tested on animals"))) {
      score -= 15;
    }
  } else {
    // Non-livestock: check for animal-derived materials or testing
    if (materials.some((m) => m.includes("animal testing") || m.includes("tested on animals"))) {
      score -= 15;
    }
    if (materials.some((m) => m.includes("leather") || m.includes("fur") || m.includes("down") || m.includes("silk") || m.includes("wool"))) {
      score -= 12;
    }
  }

  // Bonuses from certifications
  if (certs.some((c) => c.includes("certified humane"))) score += 3;
  if (certs.some((c) => c.includes("animal welfare approved") || c === "awa")) score += 3;
  if (certs.some((c) => c.includes("grass-fed") || c.includes("grass fed"))) score += 2;
  if (certs.some((c) => c.includes("cruelty-free") || c.includes("cruelty free") || c.includes("vegan"))) score += 2;

  return clamp(score, 0, 30);
};

// ============================================================
// CARBON FOOTPRINT (20 points max) — Tier-based on kg CO2
// ============================================================
const carbonScore = (carbonFootprint: number): number => {
  if (carbonFootprint <= 0.5) return 20;
  if (carbonFootprint <= 2.0) return 16;
  if (carbonFootprint <= 5.0) return 11;
  if (carbonFootprint <= 10.0) return 6;
  return 2;
};

// ============================================================
// TRANSPORTATION (10 points max) — Distance base × mode multiplier
// ============================================================
const transportBaseScore = (distance: number): number => {
  if (distance <= 100) return 10;
  if (distance <= 500) return 8;
  if (distance <= 2000) return 6;
  if (distance <= 5000) return 4;
  if (distance <= 10000) return 2;
  return 1;
};

const inferTransportMode = (distance: number): { mode: string; multiplier: number } => {
  if (distance <= 100) return { mode: "Local", multiplier: 1.2 };
  if (distance <= 2000) return { mode: "Truck", multiplier: 0.8 };
  if (distance <= 10000) return { mode: "Ship", multiplier: 0.9 };
  return { mode: "Air", multiplier: 0.5 };
};

const transportScore = (distance: number): number => {
  const base = transportBaseScore(distance);
  const { multiplier } = inferTransportMode(distance);
  return clamp(Math.round(base * multiplier * 10) / 10, 0, 10);
};

// ============================================================
// CERTIFICATIONS (5 points max) — Tiered certification scoring
// ============================================================
const TIER_1 = ["b-corp", "fair trade", "certified humane", "rainforest alliance", "animal welfare approved", "awa"];
const TIER_2 = ["usda organic", "eu organic", "gots certified", "organic", "non-gmo", "carbon neutral", "leaping bunny"];
const TIER_3 = ["cage-free", "cage free", "free-range", "free range", "grass-fed", "grass fed", "recyclable"];
const BONUS_CERTS = ["supply chain disclosure", "third-party audit", "third party audit", "sustainability report"];

const certificationScore = (certifications: string[]): number => {
  const certs = certifications.map((c) => c.toLowerCase());
  let score = 0;

  for (const cert of certs) {
    if (TIER_1.some((t) => cert.includes(t))) {
      score += 2;
    } else if (TIER_2.some((t) => cert.includes(t))) {
      score += 1;
    } else if (TIER_3.some((t) => cert.includes(t))) {
      score += 0.5;
    }

    // Bonus certifications stack
    if (BONUS_CERTS.some((b) => cert.includes(b))) {
      if (cert.includes("supply chain")) score += 2;
      else if (cert.includes("third-party audit") || cert.includes("third party audit")) score += 1;
      else if (cert.includes("sustainability report")) score += 1;
    }
  }

  return clamp(score, 0, 5);
};

// ============================================================
// MAIN: getScoreBreakdown
// ============================================================
export const getScoreBreakdown = (product: Product): ScoreBreakdown => {
  // Manual override — untouched
  if (product.manualScore !== undefined && product.manualScore >= 0 && product.manualScore <= 100) {
    return {
      baseline: 0,
      finalScore: product.manualScore,
      isEstimated: false,
      factors: [
        {
          key: "manual",
          label: "Manual override",
          cap: 100,
          impact: product.manualScore,
          direction: "bonus",
          inputLabel: "Manual score",
          inputValue: String(product.manualScore),
        },
      ],
    };
  }

  const labor = laborScore(product.laborRisk, product.certifications);
  const animal = animalWelfareScore(product);
  const carbon = carbonScore(product.carbonFootprint);
  const transport = transportScore(product.transportDistance);
  const certs = certificationScore(product.certifications);

  const finalScore = clamp(Math.round(labor + animal + carbon + transport + certs), 0, 100);

  const { mode } = inferTransportMode(product.transportDistance);
  const isLivestock =
    product.category.includes("Meat") ||
    product.category.includes("Dairy") ||
    product.category.includes("Eggs");

  return {
    baseline: 0,
    finalScore,
    isEstimated: false,
    factors: [
      {
        key: "labor",
        label: "Labor practices",
        cap: 35,
        impact: labor,
        direction: "bonus",
        inputLabel: "Labor risk",
        inputValue: product.laborRisk,
      },
      {
        key: "animalWelfare",
        label: "Animal welfare",
        cap: 30,
        impact: animal,
        direction: "bonus",
        inputLabel: isLivestock ? "Farming conditions" : "Animal impact",
        inputValue: isLivestock
          ? extractSimpleLivestockFactors(product).animalSpace
          : "Non-animal product",
      },
      {
        key: "carbon",
        label: "Carbon footprint",
        cap: 20,
        impact: carbon,
        direction: "bonus",
        inputLabel: "CO₂ emissions",
        inputValue: `${product.carbonFootprint} kg CO₂`,
      },
      {
        key: "transport",
        label: "Transportation",
        cap: 10,
        impact: transport,
        direction: "bonus",
        inputLabel: "Distance & mode",
        inputValue: `${product.transportDistance.toLocaleString()} km (${mode})`,
      },
      {
        key: "certifications",
        label: "Certifications",
        cap: 5,
        impact: certs,
        direction: "bonus",
        inputLabel: "Certifications",
        inputValue: product.certifications.length > 0 ? product.certifications.join(", ") : "None",
      },
    ],
  };
};

// ============================================================
// "Why This Score?" explanation generator
// ============================================================
export const generateWhyThisScore = (breakdown: ScoreBreakdown): string[] => {
  const factors = breakdown.factors.filter((f) => f.key !== "manual");
  if (factors.length === 0) return ["This score was set manually."];

  const sentences: string[] = [];

  // Sort by how far each factor is from its max (worst performers first)
  const gaps = factors
    .map((f) => ({ factor: f, gap: f.cap - f.impact }))
    .filter((g) => g.gap > 0)
    .sort((a, b) => b.gap - a.gap);

  const describeCategory = (f: ScoreFactorBreakdown) => {
    if (f.key === "labor") return "labor practices";
    if (f.key === "animalWelfare") return "animal welfare";
    if (f.key === "carbon") return "carbon emissions";
    if (f.key === "transport") return "transportation distance";
    if (f.key === "certifications") return "certifications";
    return f.label.toLowerCase();
  };

  if (gaps.length > 0) {
    const worst = gaps[0];
    sentences.push(
      `The biggest score gap is in ${describeCategory(worst.factor)}, scoring ${Math.round(worst.factor.impact)} out of ${worst.factor.cap} possible points.`
    );

    if (gaps.length > 1) {
      const second = gaps[1];
      sentences.push(
        `${describeCategory(second.factor).charAt(0).toUpperCase() + describeCategory(second.factor).slice(1)} also reduces the score, earning ${Math.round(second.factor.impact)} out of ${second.factor.cap}.`
      );
    }
  }

  // Mention strongest category
  const best = factors.slice().sort((a, b) => (b.impact / b.cap) - (a.impact / a.cap))[0];
  if (best && best.impact / best.cap >= 0.8) {
    sentences.push(
      `The product scores well in ${describeCategory(best)}, earning ${Math.round(best.impact)} out of ${best.cap} points.`
    );
  }

  if (breakdown.isEstimated) {
    sentences.push("Some values are estimated due to limited public data.");
  }

  return sentences.slice(0, 3);
};
