// User priority preferences for scoring
export interface UserPriorities {
  environment: number;    // 0-100 weight
  laborRights: number;    // 0-100 weight
  animalWelfare: number;  // 0-100 weight
  nutrition: number;      // 0-100 weight
}

export const DEFAULT_PRIORITIES: UserPriorities = {
  environment: 50,
  laborRights: 50,
  animalWelfare: 50,
  nutrition: 50,
};

const PRIORITIES_KEY = 'ethical-shopper-priorities';

export const savePriorities = (priorities: UserPriorities): void => {
  try {
    localStorage.setItem(PRIORITIES_KEY, JSON.stringify(priorities));
    window.dispatchEvent(new Event('prioritiesUpdated'));
  } catch (error) {
    console.error('Failed to save priorities:', error);
  }
};

export const loadPriorities = (): UserPriorities => {
  try {
    const stored = localStorage.getItem(PRIORITIES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PRIORITIES, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load priorities:', error);
  }
  return { ...DEFAULT_PRIORITIES };
};

// Scan history tracking
export interface ScanHistoryEntry {
  id: string;
  barcode: string;
  productName: string;
  brand: string | null;
  imageUrl: string | null;
  timestamp: number;
  verdict: {
    emoji: string;
    label: string;
    color: string;
  };
  scores: {
    ecoScore: number | null;
    ecoGrade: string | null;
    nutriScore: string | null;
    laborAllegations: number;
    novaGroup: number | null;
  };
  // Extended impact tracking fields (optional for backward compatibility)
  carbonFootprint100g?: number | null;
  labels?: string[];
}

const HISTORY_KEY = 'ethical-shopper-scan-history';
const MAX_HISTORY = 200;

export const saveScanToHistory = (entry: ScanHistoryEntry): void => {
  try {
    const history = loadScanHistory();
    // Remove duplicate if exists
    const filtered = history.filter(h => h.barcode !== entry.barcode);
    filtered.unshift(entry);
    // Keep max entries
    const trimmed = filtered.slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new Event('scanHistoryUpdated'));
  } catch (error) {
    console.error('Failed to save scan history:', error);
  }
};

export const loadScanHistory = (): ScanHistoryEntry[] => {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load scan history:', error);
    return [];
  }
};

export const clearScanHistory = (): void => {
  try {
    localStorage.removeItem(HISTORY_KEY);
    window.dispatchEvent(new Event('scanHistoryUpdated'));
  } catch (error) {
    console.error('Failed to clear scan history:', error);
  }
};

// Get stats from history
export const getHistoryStats = (history: ScanHistoryEntry[]) => {
  const total = history.length;
  const good = history.filter(h => h.verdict.emoji === '✅').length;
  const moderate = history.filter(h => h.verdict.emoji === '🤔').length;
  const caution = history.filter(h => h.verdict.emoji === '⚠️').length;
  const avoid = history.filter(h => h.verdict.emoji === '🚫').length;
  const unknown = history.filter(h => h.verdict.emoji === '❓').length;

  const withLaborConcerns = history.filter(h => h.scores.laborAllegations > 0).length;
  const avgEcoScore = history
    .filter(h => h.scores.ecoScore !== null)
    .reduce((sum, h) => sum + (h.scores.ecoScore || 0), 0) / (history.filter(h => h.scores.ecoScore !== null).length || 1);

  // Weekly trend (last 4 weeks)
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const weeks = [0, 1, 2, 3].map(w => {
    const start = now - (w + 1) * weekMs;
    const end = now - w * weekMs;
    const weekEntries = history.filter(h => h.timestamp >= start && h.timestamp < end);
    const goodCount = weekEntries.filter(h => h.verdict.emoji === '✅' || h.verdict.emoji === '🤔').length;
    return {
      week: w === 0 ? 'This Week' : w === 1 ? 'Last Week' : `${w + 1} Weeks Ago`,
      total: weekEntries.length,
      good: goodCount,
      percentage: weekEntries.length > 0 ? Math.round((goodCount / weekEntries.length) * 100) : 0,
    };
  }).reverse();

  return { total, good, moderate, caution, avoid, unknown, withLaborConcerns, avgEcoScore, weeks };
};

// CO2 estimates by eco grade (kg CO2e per kg of product)
const GRADE_CO2_ESTIMATE: Record<string, number> = {
  a: 0.5, b: 1.2, c: 2.5, d: 4.0, e: 6.0,
};
const BASELINE_CO2 = 2.5; // grade C = "average" product

export const getImpactStats = (history: ScanHistoryEntry[]) => {
  const now = Date.now();
  const monthMs = 30 * 24 * 60 * 60 * 1000;
  const thisMonth = history.filter(h => h.timestamp > now - monthMs);

  let co2AvoidedKg = 0;
  for (const scan of thisMonth) {
    const grade = scan.scores.ecoGrade?.toLowerCase();
    if (!grade) continue;
    // Use real CO2 data (per 100g → per kg) if available, else estimate from grade
    const productCO2 = (scan.carbonFootprint100g != null)
      ? scan.carbonFootprint100g / 100
      : GRADE_CO2_ESTIMATE[grade] ?? BASELINE_CO2;
    const avoided = BASELINE_CO2 - productCO2;
    if (avoided > 0) co2AvoidedKg += avoided;
  }

  const fairTradeCount = thisMonth.filter(h =>
    h.labels?.some(l => /fair.?trade/i.test(l))
  ).length;

  const laborFlaggedCount = thisMonth.filter(h => h.scores.laborAllegations > 0).length;

  return {
    co2AvoidedKg: Math.round(co2AvoidedKg * 10) / 10,
    fairTradeCount,
    laborFlaggedCount,
    totalThisMonth: thisMonth.length,
  };
};
