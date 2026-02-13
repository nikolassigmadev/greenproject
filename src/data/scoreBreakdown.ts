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
  description?: string; // Optional description of how the score was calculated
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
const laborScore = (product: Product): number => {
  // Use manual points if provided, otherwise calculate normally
  if (product.laborManualPoints !== undefined) {
    console.log('Using manual labor points:', product.laborManualPoints);
    return clamp(product.laborManualPoints, 0, 35);
  }

  let score = 35;
  console.log('=== LABOR SCORING START ===');
  console.log('Initial score:', score);

  // Use detailed labor violations if available, otherwise fall back to laborRisk
  if (product.laborViolations && product.laborViolations !== 'none') {
    console.log('Processing labor violations:', product.laborViolations);
    switch (product.laborViolations) {
      case 'no-third-party-audit':
        score -= 3;
        console.log('After no-third-party-audit deduction:', score);
        break;
      case 'limited-transparency':
        score -= 5;
        console.log('After limited-transparency deduction:', score);
        break;
      case 'no-union-rights':
        score -= 8;
        console.log('After no-union-rights deduction:', score);
        break;
      case 'excessive-hours':
        score -= 10;
        console.log('After excessive-hours deduction:', score);
        break;
      case 'unsafe-conditions':
        score -= 12;
        console.log('After unsafe-conditions deduction:', score);
        break;
      case 'no-living-wage':
        score -= 15;
        console.log('After no-living-wage deduction:', score);
        break;
      case 'slavery-forced-child-labor':
        score = 0; // instant fail
        console.log('After slavery-forced-child-labor deduction:', score);
        break;
      case 'none':
        console.log('No violations, score remains:', score);
        break;
    }
  } else if (product.laborRisk) {
    console.log('Using fallback laborRisk:', product.laborRisk);
    // Fall back to original laborRisk logic for backward compatibility
    if (product.laborRisk === "high") {
      score -= 27; // High risk = no living wage (-15) + unsafe conditions (-12)
    } else if (product.laborRisk === "medium") {
      score -= 13; // Medium risk = no union rights (-8) + limited transparency (-5)
    }
    console.log('After laborRisk fallback:', score);
  } else {
    console.log('No labor data provided, score remains:', score);
  }

  // Add labor bonuses from detailed criteria
  if (product.laborBonuses && product.laborBonuses.length > 0) {
    console.log('Processing labor bonuses:', product.laborBonuses);
    const bonuses = product.laborBonuses;
    if (bonuses.includes('Fair Trade certified (+5)')) {
      score += 5;
      console.log('Added Fair Trade bonus, score now:', score);
    }
    if (bonuses.includes('B-Corp certified (+3)')) {
      score += 3;
      console.log('Added B-Corp bonus, score now:', score);
    }
    if (bonuses.includes('Living wage plus (+2)')) {
      score += 2;
      console.log('Added Living wage bonus, score now:', score);
    }
  } else {
    console.log('No labor bonuses to process');
    // Fall back to checking certifications for backward compatibility
    const certs = product.certifications.map((c) => c.toLowerCase());
    if (certs.some((c) => c.includes("fair trade"))) {
      score += 5;
      console.log('Added Fair Trade from certifications, score now:', score);
    }
    if (certs.some((c) => c.includes("b-corp"))) {
      score += 3;
      console.log('Added B-Corp from certifications, score now:', score);
    }
    if (certs.some((c) => c.includes("living wage"))) {
      score += 2;
      console.log('Added Living wage from certifications, score now:', score);
    }
  }

  const finalScore = clamp(score, 0, 35);
  console.log('Final labor score:', finalScore);
  console.log('=== LABOR SCORING END ===');
  return finalScore;
};

// ============================================================
// ANIMAL WELFARE (30 points max) — Start at 30, deduct violations, add bonuses
// ============================================================
const animalWelfareScore = (product: Product): number => {
  // Use manual points if provided, otherwise calculate normally
  if (product.animalWelfareManualPoints !== undefined) {
    console.log('Using manual animal welfare points:', product.animalWelfareManualPoints);
    return clamp(product.animalWelfareManualPoints, 0, 30);
  }

  let score = 30;
  const materials = product.materials.map((m) => m.toLowerCase());
  const certs = product.certifications.map((c) => c.toLowerCase());
  const isLivestock =
    product.category.includes("Meat") ||
    product.category.includes("Dairy") ||
    product.category.includes("Eggs");

  // Use detailed animal welfare conditions if available
  if (product.animalWelfareConditions) {
    switch (product.animalWelfareConditions) {
      case 'plant-based':
        score = 30; // Plant-based/vegan gets full points
        break;
      case 'organic-humane':
        score = 25; // Organic + humane
        break;
      case 'free-range-cage-free':
        score = 18; // Free-range/cage-free
        break;
      case 'intensive-farming':
        score = 8; // Intensive farming
        break;
      case 'factory-farmed':
        score = 0; // Factory farmed - instant fail
        break;
    }
  } else if (isLivestock) {
    // Fall back to simple livestock scoring for backward compatibility
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
  } else {
    // Non-livestock: check for animal-derived materials or testing
    if (materials.some((m) => m.includes("animal testing") || m.includes("tested on animals"))) {
      score -= 15;
    }
    if (materials.some((m) => m.includes("leather") || m.includes("fur") || m.includes("down") || m.includes("silk") || m.includes("wool"))) {
      score -= 12;
    }
  }

  // Add animal welfare bonuses/violations from detailed criteria
  if (product.animalWelfareItems && product.animalWelfareItems.length > 0) {
    const items = product.animalWelfareItems;
    if (items.includes('Certified Humane (+3)')) score += 3;
    if (items.includes('Animal Welfare Approved (+3)')) score += 3;
    if (items.includes('Grass-fed (+2)')) score += 2;
    if (items.includes('Cruelty-free (vegan) (+2)')) score += 2;
    if (items.includes('Animal testing (-15)')) score -= 15;
  } else {
    // Fall back to checking certifications for backward compatibility
    if (certs.some((c) => c.includes("certified humane"))) score += 3;
    if (certs.some((c) => c.includes("animal welfare approved") || c === "awa")) score += 3;
    if (certs.some((c) => c.includes("grass-fed") || c.includes("grass fed"))) score += 2;
    if (certs.some((c) => c.includes("cruelty-free") || c.includes("cruelty free") || c.includes("vegan"))) score += 2;
  }

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

const getTransportMode = (product: Product): { mode: string; multiplier: number } => {
  // Use detailed transport mode if available, otherwise infer from distance
  if (product.transportMode) {
    switch (product.transportMode) {
      case 'local':
        return { mode: "Local", multiplier: 1.2 };
      case 'rail':
        return { mode: "Rail", multiplier: 1.0 };
      case 'ship':
        return { mode: "Ship", multiplier: 0.9 };
      case 'truck':
        return { mode: "Truck", multiplier: 0.8 };
      case 'air':
        return { mode: "Air", multiplier: 0.5 };
      default:
        return { mode: "Truck", multiplier: 0.8 };
    }
  }
  
  // Fall back to distance-based inference for backward compatibility
  if (product.transportDistance <= 100) return { mode: "Local", multiplier: 1.2 };
  if (product.transportDistance <= 2000) return { mode: "Truck", multiplier: 0.8 };
  if (product.transportDistance <= 10000) return { mode: "Ship", multiplier: 0.9 };
  return { mode: "Air", multiplier: 0.5 };
};

const transportScore = (product: Product): number => {
  // Use manual points if provided, otherwise calculate normally
  if (product.transportManualPoints !== undefined) {
    console.log('Using manual transport points:', product.transportManualPoints);
    return clamp(product.transportManualPoints, 0, 10);
  }

  const base = transportBaseScore(product.transportDistance);
  const { multiplier } = getTransportMode(product);
  return clamp(Math.round(base * multiplier * 10) / 10, 0, 10);
};

// ============================================================
// CERTIFICATIONS (10 points max) — Tiered certification scoring
// ============================================================
const TIER_1 = ["b-corp", "fair trade", "certified humane", "rainforest alliance", "animal welfare approved", "awa"];
const TIER_2 = ["usda organic", "eu organic", "gots certified", "organic", "non-gmo", "carbon neutral", "leaping bunny"];
const TIER_3 = ["cage-free", "cage free", "free-range", "free range", "grass-fed", "grass fed", "recyclable"];
const BONUS_CERTS = ["supply chain disclosure", "third-party audit", "third party audit", "sustainability report"];

const certificationScore = (product: Product): number => {
  // Use manual points if provided, otherwise calculate normally
  if (product.certificationManualPoints !== undefined) {
    console.log('Using manual certification points:', product.certificationManualPoints);
    return clamp(product.certificationManualPoints, 0, 10);
  }

  // Add null check to prevent undefined error
  const certs = (product.certifications || []).map((c) => c.toLowerCase());
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

  return clamp(score, 0, 10);
};

// ============================================================
// MAIN: getScoreBreakdown
// ============================================================
export const getScoreBreakdown = (product: Product): ScoreBreakdown => {
  // Debug: Log the entire product object
  console.log('=== SCORING DEBUG ===');
  console.log('Product object:', product);
  console.log('Labor violations:', product.laborViolations);
  console.log('Labor bonuses:', product.laborBonuses);
  console.log('Animal welfare conditions:', product.animalWelfareConditions);
  console.log('Animal welfare items:', product.animalWelfareItems);
  console.log('Transport mode:', product.transportMode);
  console.log('Certifications:', product.certifications);
  
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

  const labor = laborScore(product);
  console.log('Labor score result:', labor);
  
  const animal = animalWelfareScore(product);
  console.log('Animal welfare score result:', animal);
  
  const carbon = carbonScore(product.carbonFootprint);
  console.log('Carbon score result:', carbon);
  
  const transport = transportScore(product);
  console.log('Transport score result:', transport);
  
  // Add null check to prevent undefined error
  const certs = (product.certifications || []).map((c) => c.toLowerCase());
  const certsScore = certificationScore(product);
  console.log('Certifications score result:', certsScore);

  const finalScore = clamp(Math.round(labor + animal + carbon + transport + certsScore), 0, 100);
  console.log('Final total score:', finalScore);
  console.log('=== END SCORING DEBUG ===');

  const { mode } = getTransportMode(product);
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
        inputValue: product.laborViolations || product.laborRisk || 'Not specified',
        description: product.laborManualPoints !== undefined 
          ? `Manually set to ${product.laborManualPoints}/35 points`
          : product.laborViolations && product.laborViolations !== 'none'
            ? `Violation: ${product.laborViolations} (${35 - labor} points deducted)`
            : product.laborRisk
            ? `Risk level: ${product.laborRisk}`
            : 'No violations specified',
      },
      {
        key: "animalWelfare",
        label: "Animal welfare",
        cap: 30,
        impact: animal,
        direction: "bonus",
        inputLabel: isLivestock ? "Farming conditions" : "Animal impact",
        inputValue: product.animalWelfareConditions || 
          (isLivestock
            ? extractSimpleLivestockFactors(product).animalSpace
            : "Non-animal product"),
        description: product.animalWelfareManualPoints !== undefined 
          ? `Manually set to ${product.animalWelfareManualPoints}/30 points`
          : product.animalWelfareConditions
            ? `Farming: ${product.animalWelfareConditions} (${30 - animal} points)`
            : 'Non-animal product',
      },
      {
        key: "carbon",
        label: "Carbon footprint",
        cap: 20,
        impact: carbon,
        direction: "bonus",
        inputLabel: "CO₂ emissions",
        inputValue: `${product.carbonFootprint} kg CO₂`,
        description: `${product.carbonFootprint} kg CO₂ = ${carbon} points (${carbon <= 0.5 ? '≤0.5kg = 20pts' : carbon <= 2 ? '0.5-2kg = 16pts' : carbon <= 5 ? '2-5kg = 11pts' : carbon <= 10 ? '5-10kg = 6pts' : '>10kg = 2pts'})`,
      },
      {
        key: "transport",
        label: "Transportation",
        cap: 10,
        impact: transport,
        direction: "bonus",
        inputLabel: "Distance & mode",
        inputValue: `${product.transportDistance.toLocaleString()} km (${mode})`,
        description: product.transportManualPoints !== undefined 
          ? `Manually set to ${product.transportManualPoints}/10 points`
          : `${product.transportDistance.toLocaleString()} km by ${mode} = ${transport} points`,
      },
      {
        key: "certifications",
        label: "Certifications",
        cap: 10,
        impact: certs,
        direction: "bonus",
        inputLabel: "Certifications",
        inputValue: product.certifications.length > 0 ? product.certifications.join(", ") : "None",
        description: product.certificationManualPoints !== undefined 
          ? `Manually set to ${product.certificationManualPoints}/10 points`
          : `${product.certifications.length} certifications = ${certs} points (${certs} pts total)`,
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
