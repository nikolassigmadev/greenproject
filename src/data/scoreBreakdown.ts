import type { Product } from "@/data/products";
import { extractSimpleLivestockFactors } from "@/data/simpleLivestockScoring";

export type ScoreFactorKey = "labor" | "carbon" | "transport" | "materials" | "certifications" | "manual";
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

const laborImpact = (laborRisk: Product["laborRisk"]) => {
  if (laborRisk === "high") return -50;
  if (laborRisk === "medium") return -20;
  return 0;
};

const carbonImpact = (carbonFootprint: number) => {
  if (carbonFootprint > 50) return -30;
  if (carbonFootprint > 20) return -20;
  if (carbonFootprint > 10) return -10;
  return 0;
};

const transportImpact = (transportDistance: number) => {
  if (transportDistance > 10000) return -35;
  if (transportDistance > 5000) return -20;
  if (transportDistance > 2000) return -5;
  return 0;
};

const certificationImpact = (certifications: string[]) => Math.min(certifications.length * 5, 15);

const materialsImpactStandard = (materials: string[]) => {
  const normalized = materials.map((m) => m.toLowerCase());

  let points = 0;

  const hasAny = (terms: string[]) => normalized.some((m) => terms.some((t) => m.includes(t)));

  if (hasAny(["recycled", "ocean plastic"])) points += 6;
  if (hasAny(["organic", "plant-based", "bamboo", "cork"])) points += 5;
  if (hasAny(["stainless steel", "glass"])) points += 3;
  if (hasAny(["plastic-free", "compostable"])) points += 4;

  if (hasAny(["virgin plastic"])) points -= 8;
  if (hasAny(["plastic", "pet"])) points -= 5;
  if (hasAny(["polyester", "synthetic", "nylon"])) points -= 4;
  if (hasAny(["artificial", "preservatives", "food coloring"])) points -= 3;

  return clamp(points, -15, 15);
};

const livestockWelfareScore = (product: Product) => {
  const factors = extractSimpleLivestockFactors(product);

  const spaceScores: Record<string, number> = { excellent: 95, good: 75, poor: 40, terrible: 15 };
  const executionScores: Record<string, number> = { humane: 90, standard: 60, inhumane: 20 };
  const dietScores: Record<string, number> = { natural: 85, organic: 80, conventional: 45, processed: 25 };

  const space = spaceScores[factors.animalSpace] ?? 50;
  const execution = executionScores[factors.animalExecution] ?? 50;
  const diet = dietScores[factors.animalDiet] ?? 50;

  return (space * 0.35) + (execution * 0.35) + (diet * 0.3);
};

export const getScoreBreakdown = (product: Product): ScoreBreakdown => {
  const baseline = 100;

  if (product.manualScore !== undefined && product.manualScore >= 0 && product.manualScore <= 100) {
    const impact = product.manualScore - baseline;
    const finalScore = clamp(baseline + impact, 0, 100);

    return {
      baseline,
      finalScore,
      isEstimated: false,
      factors: [
        {
          key: "manual",
          label: "Manual override",
          cap: 100,
          impact,
          direction: impact >= 0 ? "bonus" : "penalty",
          inputLabel: "Manual score",
          inputValue: String(product.manualScore),
        },
      ],
    };
  }

  const isLivestock = product.category.includes("Meat") || product.category.includes("Dairy") || product.category.includes("Eggs");
  const isFood = product.category === 'Food & Beverage' || product.category === 'Snacks & Packaged Foods';

  const labor = laborImpact(product.laborRisk);
  const carbon = carbonImpact(product.carbonFootprint);
  const transport = transportImpact(product.transportDistance);
  const cert = certificationImpact(product.certifications);

  if (!isLivestock) {
    const materials = materialsImpactStandard(product.materials);
    const score = clamp(baseline + labor + carbon + transport + materials + cert, 0, 100);

    return {
      baseline,
      finalScore: score,
      isEstimated: false,
      factors: [
        {
          key: "labor",
          label: "Labor practices",
          cap: 50,
          impact: labor,
          direction: "penalty",
          inputLabel: "Labor risk",
          inputValue: product.laborRisk,
        },
        {
          key: "carbon",
          label: "Carbon footprint",
          cap: 30,
          impact: carbon,
          direction: "penalty",
          inputLabel: "Carbon footprint",
          inputValue: `${product.carbonFootprint} kg CO₂`,
        },
        {
          key: "transport",
          label: "Transport distance",
          cap: 35,
          impact: transport,
          direction: "penalty",
          inputLabel: "Transport distance",
          inputValue: `${product.transportDistance.toLocaleString()} km`,
        },
        {
          key: "materials",
          label: isFood ? "Contents & packaging" : "Materials & packaging",
          cap: 15,
          impact: materials,
          direction: materials >= 0 ? "bonus" : "penalty",
          inputLabel: isFood ? "Contents" : "Materials",
          inputValue: `${product.materials.length} listed`,
        },
        {
          key: "certifications",
          label: "Certifications",
          cap: 15,
          impact: cert,
          direction: "bonus",
          inputLabel: "Certifications",
          inputValue: product.certifications.length > 0 ? product.certifications.join(", ") : "None",
        },
      ],
    };
  }

  const welfare = livestockWelfareScore(product);
  const standardScore = clamp(baseline + labor + carbon + transport + cert, 0, 100);
  const finalScore = clamp(Math.round((welfare * 0.7) + (standardScore * 0.3)), 0, 100);

  const scaledLabor = labor * 0.3;
  const scaledCarbon = carbon * 0.3;
  const scaledTransport = transport * 0.3;
  const scaledCert = cert * 0.3;

  const materialsPenalty = (welfare - 100) * 0.7;

  return {
    baseline,
    finalScore,
    isEstimated: false,
    factors: [
      {
        key: "labor",
        label: "Labor practices",
        cap: 50 * 0.3,
        impact: scaledLabor,
        direction: "penalty",
        inputLabel: "Labor risk",
        inputValue: product.laborRisk,
      },
      {
        key: "carbon",
        label: "Carbon footprint",
        cap: 30 * 0.3,
        impact: scaledCarbon,
        direction: "penalty",
        inputLabel: "Carbon footprint",
        inputValue: `${product.carbonFootprint} kg CO₂`,
      },
      {
        key: "transport",
        label: "Transport distance",
        cap: 35 * 0.3,
        impact: scaledTransport,
        direction: "penalty",
        inputLabel: "Transport distance",
        inputValue: `${product.transportDistance.toLocaleString()} km`,
      },
      {
        key: "materials",
        label: "Materials & packaging",
        cap: 70,
        impact: materialsPenalty,
        direction: materialsPenalty >= 0 ? "bonus" : "penalty",
        inputLabel: "Animal welfare factors",
        inputValue: `${product.materials.join(", ")}`,
      },
      {
        key: "certifications",
        label: "Certifications",
        cap: 15 * 0.3,
        impact: scaledCert,
        direction: "bonus",
        inputLabel: "Certifications",
        inputValue: product.certifications.length > 0 ? product.certifications.join(", ") : "None",
      },
    ],
  };
};

export const generateWhyThisScore = (breakdown: ScoreBreakdown): string[] => {
  const factors = breakdown.factors.filter((f) => f.key !== "manual");

  const negatives = factors
    .filter((f) => f.impact < 0)
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  const positives = factors
    .filter((f) => f.impact > 0)
    .sort((a, b) => b.impact - a.impact);

  const sentences: string[] = [];

  const topNegative = negatives[0];
  const secondNegative = negatives[1];

  const lowScore = breakdown.finalScore < 60;
  const hasCertBonus = factors.some((f) => f.key === "certifications" && f.impact > 0);

  const describeFactorCause = (f: ScoreFactorBreakdown) => {
    if (f.key === "labor") return `labor-risk sourcing`;
    if (f.key === "carbon") return `carbon emissions`;
    if (f.key === "transport") return `long-distance transport`;
    if (f.key === "materials") return `materials and packaging`;
    if (f.key === "certifications") return `verified certifications`;
    return f.label.toLowerCase();
  };

  const describeInput = (f: ScoreFactorBreakdown) => {
    if (f.key === "carbon") return `${f.inputValue}`;
    if (f.key === "transport") return `${f.inputValue}`;
    if (f.key === "labor") return `labor risk is ${f.inputValue}`;
    if (f.key === "certifications") return f.inputValue === "None" ? `no verified certifications` : `certifications are present`;
    if (f.key === "materials") return `the listed materials/packaging signals`;
    return `${f.inputLabel.toLowerCase()} is ${f.inputValue}`;
  };

  if (topNegative) {
    sentences.push(`Most of the score reduction comes from ${describeFactorCause(topNegative)} because ${describeInput(topNegative)}.`);

    if (secondNegative && Math.abs(secondNegative.impact) >= Math.abs(topNegative.impact) * 0.4) {
      sentences.push(`The score is further reduced because of ${describeFactorCause(secondNegative)} because ${describeInput(secondNegative)}.`);
    }

    if (lowScore && !hasCertBonus) {
      sentences.push(`The score does not gain much from verified certifications.`);
    }
  } else {
    const topPositive = positives[0];
    if (topPositive) {
      sentences.push(`The score remains high due to ${describeFactorCause(topPositive)} because ${describeInput(topPositive)}.`);
      const nextPositive = positives[1];
      if (nextPositive && nextPositive.impact >= topPositive.impact * 0.4) {
        sentences.push(`The product also gains points from ${describeFactorCause(nextPositive)} because ${describeInput(nextPositive)}.`);
      }
    } else {
      sentences.push(`The score remains close to the baseline because no single factor creates a large penalty or bonus.`);
    }
  }

  if (breakdown.isEstimated) {
    sentences.push("Some values are estimated due to limited public data.");
  }

  return sentences.slice(0, 3);
};
