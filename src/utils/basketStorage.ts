import { personalizedScore, gradeFromScore } from "@/utils/personalizedScore";
import { loadPriorities, type UserPriorities } from "@/utils/userPreferences";
import { getBrandSentiment } from "@/utils/watchlist";

export interface BasketItem {
  id: string;
  barcode: string;
  productName: string;
  brand: string | null;
  imageUrl: string | null;
  ecoscoreGrade: string | null;
  ecoscoreScore: number | null;
  nutriscoreGrade: string | null;
  laborAllegations: number;
  co2Per100g: number | null;   // kg CO2e per 100g (from Agribalyse / OFF)
  addedAt: number;
}

const BASKET_KEY = 'ethical-shopper-basket';

export const loadBasket = (): BasketItem[] => {
  try {
    const stored = localStorage.getItem(BASKET_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveBasket = (items: BasketItem[]): void => {
  try {
    localStorage.setItem(BASKET_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('basketUpdated'));
  } catch {
    // ignore
  }
};

export const addToBasket = (item: Omit<BasketItem, 'id' | 'addedAt'>): void => {
  const basket = loadBasket();
  if (basket.some(b => b.barcode === item.barcode)) return;
  basket.push({ ...item, id: `${item.barcode}-${Date.now()}`, addedAt: Date.now() });
  saveBasket(basket);
};

export const removeFromBasket = (barcode: string): void => {
  saveBasket(loadBasket().filter(b => b.barcode !== barcode));
};

export const clearBasket = (): void => {
  saveBasket([]);
};

// ── CO2 estimates by eco grade (kg CO2e per kg of product) ──────────────────
// Source: approximate Agribalyse averages per grade band
const GRADE_CO2_KG: Record<string, number> = { a: 0.5, b: 1.2, c: 2.5, d: 4.0, e: 6.0 };
const BASELINE_CO2_KG = 2.5; // grade C = "average supermarket product"

function itemCO2PerKg(item: BasketItem): number | null {
  if (item.co2Per100g !== null && item.co2Per100g !== undefined) {
    return item.co2Per100g * 10; // per 100g → per kg
  }
  const g = item.ecoscoreGrade?.toLowerCase();
  return g ? (GRADE_CO2_KG[g] ?? null) : null;
}


export interface BasketEthicsReport {
  overallScore: number;
  overallGrade: string;
  itemCount: number;
  scoredCount: number;
  weakestItem: BasketItem | null;
  goodCount: number;
  fairCount: number;
  poorCount: number;
  unknownCount: number;
  laborFlagCount: number;
  cleanBrandCount: number;
  flaggedItems: BasketItem[];
  // CO2
  co2SavedKg: number;        // saved vs. average basket (greener items)
  co2ExtraKg: number;        // extra vs. average basket (worse items)
  co2NetKg: number;          // net: positive = net saving
  co2ScoredCount: number;    // how many items contributed to CO2 calc
  bestCO2Item: BasketItem | null;
  worstCO2Item: BasketItem | null;
}

export const getBasketEthicsReport = (
  items: BasketItem[],
  priorities: UserPriorities = loadPriorities(),
): BasketEthicsReport => {
  // Priority-weighted personalized score per item (env + nutrition + labor +
  // animal welfare, weighted by what the user cares about).
  const rated = items.map(item => ({
    item,
    ps: personalizedScore(
      {
        ecoGrade: item.ecoscoreGrade,
        ecoScore: item.ecoscoreScore,
        nutriGrade: item.nutriscoreGrade,
        laborAllegations: item.laborAllegations,
        brand: item.brand,
        userBrandSentiment: getBrandSentiment(item.brand),
      },
      priorities,
    ),
  }));

  const scoredRated = rated.filter(r => r.ps.score !== null);
  const scores = scoredRated.map(r => r.ps.score as number);

  const overallScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;
  const overallGrade = scores.length > 0 ? gradeFromScore(overallScore) : 'unknown';

  // Weakest item = lowest personalized score.
  let weakestItem: BasketItem | null = null;
  let worstScore = Infinity;
  for (const r of scoredRated) {
    if ((r.ps.score as number) < worstScore) { worstScore = r.ps.score as number; weakestItem = r.item; }
  }

  // Good / fair / poor buckets by personalized grade (not raw eco grade).
  const goodCount    = rated.filter(r => ['a','b'].includes(r.ps.grade)).length;
  const fairCount    = rated.filter(r => r.ps.grade === 'c').length;
  const poorCount    = rated.filter(r => ['d','e'].includes(r.ps.grade)).length;
  const unknownCount = items.length - goodCount - fairCount - poorCount;

  const laborFlagCount  = items.filter(i => i.laborAllegations > 0).length;
  const cleanBrandCount = items.filter(i => i.laborAllegations === 0).length;
  const flaggedItems    = items.filter(i => i.laborAllegations > 0);

  // CO2 impact vs. average basket
  let co2SavedKg = 0;
  let co2ExtraKg = 0;
  let co2ScoredCount = 0;
  let bestCO2Item: BasketItem | null = null;
  let worstCO2Item: BasketItem | null = null;
  let bestCO2 = Infinity;
  let worstCO2 = -Infinity;

  for (const item of items) {
    const co2 = itemCO2PerKg(item);
    if (co2 === null) continue;
    co2ScoredCount++;
    const delta = BASELINE_CO2_KG - co2;
    if (delta > 0) co2SavedKg += delta;
    else co2ExtraKg += Math.abs(delta);

    if (co2 < bestCO2) { bestCO2 = co2; bestCO2Item = item; }
    if (co2 > worstCO2) { worstCO2 = co2; worstCO2Item = item; }
  }

  const co2NetKg = Math.round((co2SavedKg - co2ExtraKg) * 10) / 10;

  return {
    overallScore,
    overallGrade,
    itemCount: items.length,
    scoredCount: scoredRated.length,
    weakestItem,
    goodCount,
    fairCount,
    poorCount,
    unknownCount,
    laborFlagCount,
    cleanBrandCount,
    flaggedItems,
    co2SavedKg: Math.round(co2SavedKg * 10) / 10,
    co2ExtraKg: Math.round(co2ExtraKg * 10) / 10,
    co2NetKg,
    co2ScoredCount,
    bestCO2Item,
    worstCO2Item,
  };
};
