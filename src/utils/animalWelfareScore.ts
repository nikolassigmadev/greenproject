/**
 * Animal Welfare Score (0–100)
 * ============================
 *
 * A single, comparable 0–100 figure for how well farmed animals were treated in
 * producing a product — shown as a circle alongside Eco-Score / Nutri-Score /
 * NOVA. Higher is better welfare.
 *
 * It is intentionally only computed for ANIMAL-DERIVED products (eggs, poultry,
 * red meat, dairy, seafood, honey). For everything else the score is `null` and
 * no circle is drawn — a plant-based product has no animal-welfare dimension.
 *
 * ── HOW THE SCORE IS BUILT ────────────────────────────────────────────────
 * The model mirrors how the welfare research itself reasons (see
 * src/data/eggChickenWelfare.ts): start from the conventional baseline for the
 * animal type, then move up for *audited* higher-welfare credentials and down
 * for a documented poor record. Marketing words move the needle barely at all.
 *
 *   1. BASELINE by animal type — the score a typical *conventional* product of
 *      that type earns with no welfare credentials. Industrial broilers (fast-
 *      grow, high density) are the worst common case, so chicken starts lowest.
 *
 *   2. PRODUCER RECORD (strongest signal) — if the brand matches a producer in
 *      the egg/chicken welfare database, its sourced "suggested overall" (1–5,
 *      already = min(label-integrity, verification)) replaces the baseline. This
 *      is brand-specific and primary-source backed, so it dominates.
 *
 *   3. CERTIFICATIONS — audited seals add points by credibility tier
 *      (Meaningful ≫ Moderate ≫ Marketing), ranked exactly as the Label Decoder
 *      ranks them. The best seal counts in full; extra seals add a small,
 *      capped bonus. Weak "humane-washing" seals add almost nothing.
 *
 *   4. CORPORATE RECORD — a documented poor animal-welfare record at the parent
 *      company (BBFAW bottom tiers) subtracts points by severity. Skipped when a
 *      producer record already applied, to avoid double-penalising.
 *
 *   5. HOUSING SIGNAL — explicit pasture / slower-growing-breed language nudges
 *      up; battery-cage / fast-grow / high-density language nudges down.
 *
 * The result is clamped to 0–100. Every adjustment is recorded in `factors[]`
 * so the UI can explain the number.
 *
 * ── WHY THESE WEIGHTS ─────────────────────────────────────────────────────
 * The single biggest welfare lever for a shopper is the housing/breed system,
 * which is exactly what a *meaningful audited* certification guarantees — so a
 * Meaningful seal (AGW, Certified Humane, Label Rouge) is worth ~a full grade
 * jump. Organic / free-range / cage-free are real but partial gains, so ~half
 * that. "American Humane", "Red Tractor", "natural", "humanely raised" are
 * unaudited or legal-baseline, so they are treated as marketing (token points).
 */

import { getWelfareProducerByBrand } from '@/data/eggChickenWelfare';
import { POOR_ANIMAL_WELFARE_COMPANIES, type PoorAnimalWelfareCompany } from '@/data/poorAnimalWelfareCompanies';

export type WelfareScoreConfidence = 'high' | 'medium' | 'low';

export interface WelfareScoreFactor {
  /** Short human-readable reason, e.g. "Certified Humane (audited)". */
  label: string;
  /** Points contributed (positive or negative); omitted for the baseline note. */
  delta?: number;
}

export interface AnimalWelfareScore {
  /** 0–100, or null when the product is not animal-derived. */
  score: number | null;
  /** Excellent / Good / Fair / Poor / Critical — null when score is null. */
  band: WelfareScoreBand | null;
  /** How much evidence backs the score. */
  confidence: WelfareScoreConfidence;
  /** True when the product was detected as animal-derived. */
  isAnimalProduct: boolean;
  /** Detected animal-product type, e.g. "chicken" / "egg" / "dairy". */
  animalType: string | null;
  /** Transparent breakdown of every adjustment. */
  factors: WelfareScoreFactor[];
}

export type WelfareScoreBand = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';

export interface AnimalWelfareScoreInput {
  brand?: string | null;
  productName?: string | null;
  /** OpenFoodFacts categories (already de-tagged), or a local product category. */
  categories?: string[] | string | null;
  /** OpenFoodFacts labels / on-pack certifications, or a local cert list. */
  labels?: string[] | string | null;
  ingredientsText?: string | null;
}

// ---------------------------------------------------------------------------
// Animal-product detection + conventional baselines
// ---------------------------------------------------------------------------

interface AnimalType {
  type: string;
  baseline: number;
  keywords: string[];
}

// Order matters: the first match wins, so list the most specific welfare-salient
// types (eggs, poultry, red meat) before broad ones.
const ANIMAL_TYPES: AnimalType[] = [
  { type: 'egg', baseline: 38, keywords: ['egg', 'eggs', 'œuf', 'oeuf', 'huevo', 'uovo'] },
  {
    type: 'chicken',
    baseline: 28,
    keywords: ['chicken', 'broiler', 'poultry', 'hen', 'turkey', 'duck', 'poulet', 'pollo', 'volaille'],
  },
  {
    type: 'red meat',
    baseline: 32,
    keywords: [
      'beef', 'pork', 'lamb', 'veal', 'bacon', 'ham', 'sausage', 'steak', 'mutton',
      'meat', 'charcuterie', 'salami', 'prosciutto', 'boeuf', 'porc',
    ],
  },
  {
    type: 'dairy',
    baseline: 45,
    keywords: ['milk', 'cheese', 'yogurt', 'yoghurt', 'butter', 'cream', 'dairy', 'dairies', 'lait', 'fromage'],
  },
  {
    type: 'seafood',
    baseline: 48,
    keywords: ['fish', 'salmon', 'tuna', 'shrimp', 'prawn', 'seafood', 'cod', 'crab', 'lobster', 'poisson'],
  },
  { type: 'honey', baseline: 60, keywords: ['honey', 'miel'] },
];

// Plant-based analogues must NOT be scored as animal products (e.g. oat "milk",
// "meatless" burgers). If any of these appear, the product has no welfare axis.
const PLANT_MARKERS = [
  'vegan', 'plant-based', 'plant based', 'dairy-free', 'dairy free',
  'meat-free', 'meat free', 'meatless', 'meat substitute', 'meat alternative',
  'almond milk', 'soy milk', 'soya milk', 'oat milk', 'coconut milk', 'rice milk',
  'nut milk', 'plant milk', 'plant-based milk',
];

// ---------------------------------------------------------------------------
// Certification credibility tiers (ranked exactly as the Label Decoder does)
// ---------------------------------------------------------------------------

interface CertTier {
  points: number;
  /** Lowercase substrings that identify a seal in this tier. */
  patterns: string[];
}

const MEANINGFUL: CertTier = {
  points: 38,
  patterns: [
    'animal welfare approved', 'a greener world', 'agw',
    'certified humane',
    'label rouge',
    'demeter',
    'soil association',
  ],
};

const MODERATE: CertTier = {
  points: 22,
  patterns: [
    'organic', 'bio', 'biologique', 'biologisch', 'eu organic', 'usda organic',
    'free range', 'free-range', 'plein air', 'freilandhaltung',
    'pasture', 'pasture raised', 'pasture-raised', 'pastured',
    'rspca assured', 'rspca',
    'global animal partnership', 'gap step', 'animal partnership',
    'cage free', 'cage-free', 'ohne käfig',
    'grass fed', 'grass-fed',
  ],
};

const MARKETING: CertTier = {
  points: 5,
  patterns: [
    'american humane',
    'red tractor',
    'natural', 'farm fresh', 'farm-fresh',
    'humanely raised', 'humane',
    'no antibiotics', 'antibiotic free', 'antibiotic-free', 'no added hormones', 'hormone free',
    'initiative tierwohl',
  ],
};

// ---------------------------------------------------------------------------
// Housing-system language nudges
// ---------------------------------------------------------------------------

// Specific enough to match safely with a plain substring test (no overlap with
// the welfare-positive "cage-free" / "free-range" wording).
const HOUSING_POSITIVE = ['pasture', 'slower-grow', 'slower grow', 'slow grown', 'slow-grown', 'das klassenbester', 'plein air'];
const HOUSING_NEGATIVE = ['fast-grow', 'fast grow', 'fast-grown', 'cornish cross', 'battery cage', 'enriched cage', 'high density', 'high-density'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Whole-word(-ish) match so short tokens like "bio" don't hit "antibiotics". */
function wordMatch(pattern: string, haystack: string): boolean {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`).test(haystack);
}

/**
 * Substring match against the BBFAW poor-welfare company list — both directions,
 * with a generic-token guard, so "Nestlé" matches "Nestlé S.A." and "Purina"
 * (a Nestlé brand) matches too, without false-matching short noise.
 */
function matchPoorWelfareCompany(brand: string): PoorAnimalWelfareCompany | undefined {
  const q = brand.toLowerCase().trim();
  if (q.length < 3) return undefined;
  return POOR_ANIMAL_WELFARE_COMPANIES.find((c) => {
    if (c.companyName.toLowerCase().includes(q)) return true;
    return c.brands.some((b) => {
      const bl = b.toLowerCase();
      return bl.length >= 4 && (q.includes(bl) || bl.includes(q));
    });
  });
}

function toLowerHaystack(input: AnimalWelfareScoreInput): string {
  const parts: string[] = [];
  if (input.productName) parts.push(input.productName);
  if (Array.isArray(input.categories)) parts.push(input.categories.join(' '));
  else if (input.categories) parts.push(input.categories);
  if (input.ingredientsText) parts.push(input.ingredientsText);
  return parts.join(' ').toLowerCase();
}

function labelsHaystack(input: AnimalWelfareScoreInput): string {
  if (Array.isArray(input.labels)) return input.labels.join(' ').toLowerCase();
  if (input.labels) return input.labels.toLowerCase();
  return '';
}

function detectAnimalType(haystack: string): AnimalType | null {
  // Plant-based analogues borrow animal words ("oat milk") — exclude them first.
  if (PLANT_MARKERS.some((m) => haystack.includes(m))) return null;
  for (const t of ANIMAL_TYPES) {
    // Allow a regular plural (cheese→cheeses) without matching unrelated words.
    if (t.keywords.some((k) => new RegExp(`\\b${k}(es|s)?\\b`).test(haystack))) return t;
  }
  return null;
}

/** Map an egg/chicken DB suggested-overall (1–5) to a 0–100 base score. */
function overallToScore(overall: number): number {
  return ({ 5: 92, 4: 78, 3: 58, 2: 36, 1: 22 } as Record<number, number>)[overall] ?? 50;
}

export function welfareBand(score: number): WelfareScoreBand {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Critical';
}

/** HSL stroke colour for the welfare ring — matches ScoreDisplay's palette. */
export function welfareScoreColor(score: number): string {
  if (score >= 80) return 'hsl(152 58% 32%)';
  if (score >= 60) return 'hsl(82 52% 38%)';
  if (score >= 40) return 'hsl(43 88% 43%)';
  if (score >= 20) return 'hsl(24 78% 44%)';
  return 'hsl(0 68% 44%)';
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function computeAnimalWelfareScore(input: AnimalWelfareScoreInput): AnimalWelfareScore {
  const haystack = toLowerHaystack(input);
  const labels = labelsHaystack(input);
  const certHaystack = `${labels} ${haystack}`;

  const animalType = detectAnimalType(haystack);
  if (!animalType) {
    return {
      score: null,
      band: null,
      confidence: 'low',
      isAnimalProduct: false,
      animalType: null,
      factors: [],
    };
  }

  const factors: WelfareScoreFactor[] = [];
  let score: number;
  let confidence: WelfareScoreConfidence = 'low';

  // 2. Producer record — strongest, brand-specific, primary-source signal.
  const producer = input.brand ? getWelfareProducerByBrand(input.brand) : undefined;
  const hasProducerRecord = !!producer;

  if (producer) {
    score = overallToScore(producer.suggestedOverall);
    confidence = 'high';
    factors.push({
      label: `${producer.producer} — welfare database overall ${producer.suggestedOverall}/5`,
    });
  } else {
    score = animalType.baseline;
    factors.push({ label: `Conventional ${animalType.type} baseline` });
  }

  // 3. Certifications — best seal in full, extra seals add a small capped bonus.
  const tiers: Array<{ name: string; tier: CertTier }> = [
    { name: 'Meaningful audited certification', tier: MEANINGFUL },
    { name: 'Moderate welfare certification', tier: MODERATE },
    { name: 'Marketing / unaudited claim', tier: MARKETING },
  ];

  const matchedTiers = tiers.filter((t) => t.tier.patterns.some((p) => wordMatch(p, certHaystack)));
  if (matchedTiers.length > 0) {
    const best = matchedTiers[0]; // tiers array is ordered strongest-first
    // A producer record already reflects its own certifications, so a seal we
    // also detect on-pack should only nudge, not re-credit the full value.
    const primary = hasProducerRecord ? Math.round(best.tier.points * 0.25) : best.tier.points;
    score += primary;
    factors.push({ label: best.name, delta: primary });

    // Each additional distinct tier adds a small, capped bonus.
    const extra = Math.min(10, (matchedTiers.length - 1) * 5);
    if (extra > 0) {
      score += extra;
      factors.push({ label: 'Additional welfare credentials', delta: extra });
    }

    if (best.tier === MEANINGFUL && confidence !== 'high') confidence = 'high';
    else if (best.tier === MODERATE && confidence === 'low') confidence = 'medium';
  }

  // 4. Corporate record — poor BBFAW parent. Skipped when a producer record
  //    already encoded the company's documented issues (avoids double-counting).
  if (!hasProducerRecord && input.brand) {
    const poor = matchPoorWelfareCompany(input.brand);
    if (poor) {
      const penalty = poor.severity === 'critical' ? -22 : poor.severity === 'high' ? -14 : -8;
      score += penalty;
      factors.push({ label: `${poor.companyName} — poor BBFAW welfare record`, delta: penalty });
      if (confidence === 'low') confidence = 'medium';
    }
  }

  // 5. Housing-system language — a last-resort signal used only when no audited
  //    seal was found and no producer record set the base (avoids double-count).
  if (!hasProducerRecord && matchedTiers.length === 0) {
    if (HOUSING_POSITIVE.some((p) => certHaystack.includes(p))) {
      score += 5;
      factors.push({ label: 'Higher-welfare housing / breed language', delta: 5 });
    } else if (HOUSING_NEGATIVE.some((p) => certHaystack.includes(p))) {
      score -= 5;
      factors.push({ label: 'Intensive housing / fast-grow language', delta: -5 });
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    band: welfareBand(score),
    confidence,
    isAnimalProduct: true,
    animalType: animalType.type,
    factors,
  };
}
