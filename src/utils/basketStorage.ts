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
  // Don't add duplicates
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

// Eco grade → numeric score (for averaging when ecoscoreScore is null)
const GRADE_SCORE: Record<string, number> = { a: 90, b: 70, c: 50, d: 30, e: 10 };

// Numeric score → grade letter
const scoreToGrade = (score: number): string => {
  if (score >= 80) return 'a';
  if (score >= 60) return 'b';
  if (score >= 40) return 'c';
  if (score >= 20) return 'd';
  return 'e';
};

export interface BasketEthicsReport {
  overallScore: number;       // 0-100
  overallGrade: string;       // a-e
  itemCount: number;
  scoredCount: number;        // items that have eco data
  weakestItem: BasketItem | null;
  goodCount: number;          // grade a or b
  fairCount: number;          // grade c
  poorCount: number;          // grade d or e
  unknownCount: number;       // no grade
  laborFlagCount: number;
}

export const getBasketEthicsReport = (items: BasketItem[]): BasketEthicsReport => {
  const scored = items.filter(i => i.ecoscoreGrade || i.ecoscoreScore !== null);

  const scores = scored.map(i => {
    if (i.ecoscoreScore !== null) return i.ecoscoreScore;
    return GRADE_SCORE[i.ecoscoreGrade!.toLowerCase()] ?? 50;
  });

  const overallScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  const overallGrade = scores.length > 0 ? scoreToGrade(overallScore) : 'unknown';

  // Weakest = lowest score
  let weakestItem: BasketItem | null = null;
  let worstScore = Infinity;
  for (const item of scored) {
    const s = item.ecoscoreScore !== null
      ? item.ecoscoreScore
      : GRADE_SCORE[item.ecoscoreGrade!.toLowerCase()] ?? 50;
    if (s < worstScore) { worstScore = s; weakestItem = item; }
  }

  const goodCount   = items.filter(i => ['a','b'].includes(i.ecoscoreGrade?.toLowerCase() ?? '')).length;
  const fairCount   = items.filter(i => i.ecoscoreGrade?.toLowerCase() === 'c').length;
  const poorCount   = items.filter(i => ['d','e'].includes(i.ecoscoreGrade?.toLowerCase() ?? '')).length;
  const unknownCount = items.length - goodCount - fairCount - poorCount;
  const laborFlagCount = items.filter(i => i.laborAllegations > 0).length;

  return {
    overallScore,
    overallGrade,
    itemCount: items.length,
    scoredCount: scored.length,
    weakestItem,
    goodCount,
    fairCount,
    poorCount,
    unknownCount,
    laborFlagCount,
  };
};
