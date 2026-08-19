import { gradeCo2PerKg, BASELINE_CO2_KG, SERVING_KG } from './carbonEstimates';

// User priority preferences for scoring
export interface UserPriorities {
  environment: number;    // 0-100 weight
  laborRights: number;    // 0-100 weight
  animalWelfare: number;  // 0-100 weight
  nutrition: number;      // 0-100 weight
}

/** Fired whenever priorities are saved, so open views can re-rank. */
export const PRIORITIES_EVENT = 'prioritiesUpdated';

export const DEFAULT_PRIORITIES: UserPriorities = {
  environment: 50,
  laborRights: 50,
  animalWelfare: 50,
  nutrition: 50,
};

/**
 * Map a 0–100 priority to a verdict weight. Three levels only — Low / Medium /
 * Critical — with an aggressive curve so priorities DOMINATE scoring: "Critical"
 * (5) outweighs a default "Medium" (1) by 5×, letting a single top priority drive
 * the verdict, while "Low" (0.3) only nudges it. Every pillar with data still
 * counts at least a little (there is no "off"). Legacy values fold into the
 * nearest level: ≤37 → Low, ≤62 → Medium, the rest → Critical.
 */
export function priorityMultiplier(value: number): number {
  if (value <= 37) return 0.3;  // Low
  if (value <= 62) return 1.0;  // Medium (default)
  return 5.0;                    // Critical
}

// Short, human names for each tunable priority, used in the impact summary.
const PRIORITY_SHORT_NAMES: Record<"laborRights" | "environment" | "animalWelfare", string> = {
  laborRights: "labour & human rights",
  environment: "environmental impact",
  animalWelfare: "animal welfare",
};

const joinList = (items: string[]): string => {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
};

/**
 * Plain-English summary of what the user's current priorities will do to a
 * verdict, e.g. "Verdicts will lean most on labour & human rights, weigh
 * environmental impact normally, and let animal welfare only nudge the result."
 * Shown right after priorities are changed so the effect is never a mystery.
 */
export function summarizePriorities(p: UserPriorities): string {
  const tunable = ["laborRights", "environment", "animalWelfare"] as const;
  const high: string[] = [];
  const mid: string[] = [];
  const low: string[] = [];
  for (const key of tunable) {
    const name = PRIORITY_SHORT_NAMES[key];
    const v = p[key];
    if (v <= 37) low.push(name);
    else if (v <= 62) mid.push(name);
    else high.push(name);
  }

  if (high.length === 0 && low.length === 0) {
    return "Every product is judged evenly across labour, environment, and animal welfare.";
  }

  const clauses: string[] = [];
  if (high.length) clauses.push(`lean most heavily on ${joinList(high)}`);
  if (mid.length) clauses.push(`weigh ${joinList(mid)} normally`);
  if (low.length) clauses.push(`let ${joinList(low)} only gently nudge the result`);

  return `Verdicts will ${joinList(clauses)}.`;
}

const PRIORITIES_KEY = 'ethical-shopper-priorities';
const PRIORITIES_SET_KEY = 'ethical-shopper-priorities-set';

export const savePriorities = (priorities: UserPriorities): void => {
  try {
    localStorage.setItem(PRIORITIES_KEY, JSON.stringify(priorities));
    localStorage.setItem(PRIORITIES_SET_KEY, 'true');
    window.dispatchEvent(new Event(PRIORITIES_EVENT));
  } catch (error) {
    console.error('Failed to save priorities:', error);
  }
};

export const hasSavedPriorities = (): boolean => {
  return localStorage.getItem(PRIORITIES_SET_KEY) === 'true';
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
  // Classify by the verdict LABEL (BUY/CONSIDER/CAUTION/AVOID/UNKNOWN) that is
  // actually stored. History entries are written with an empty `emoji`, so the
  // old emoji-based counts were always zero — matching the BUY+CONSIDER "good"
  // split used elsewhere (Index StatsOverview).
  const verdictKey = (h: ScanHistoryEntry) => (h.verdict.label || '').toUpperCase();
  const total = history.length;
  const good = history.filter(h => verdictKey(h) === 'BUY').length;
  const moderate = history.filter(h => verdictKey(h) === 'CONSIDER').length;
  const caution = history.filter(h => verdictKey(h) === 'CAUTION').length;
  const avoid = history.filter(h => verdictKey(h) === 'AVOID').length;
  const unknown = history.filter(h => verdictKey(h) === 'UNKNOWN').length;

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
    const goodCount = weekEntries.filter(h => {
      const k = (h.verdict.label || '').toUpperCase();
      return k === 'BUY' || k === 'CONSIDER';
    }).length;
    return {
      week: w === 0 ? 'This Week' : w === 1 ? 'Last Week' : `${w + 1} Weeks Ago`,
      total: weekEntries.length,
      good: goodCount,
      percentage: weekEntries.length > 0 ? Math.round((goodCount / weekEntries.length) * 100) : 0,
    };
  }).reverse();

  return { total, good, moderate, caution, avoid, unknown, withLaborConcerns, avgEcoScore, weeks };
};

// All-time carbon stats vs. average consumer
export const getCarbonStats = (history: ScanHistoryEntry[]) => {
  let totalUserCO2 = 0;
  let totalBaselineCO2 = 0;
  let scoredCount = 0;

  for (const scan of history) {
    const grade = scan.scores.ecoGrade?.toLowerCase();
    if (!grade && scan.carbonFootprint100g == null) continue;
    scoredCount++;
    // carbonFootprint100g is grams CO₂e per 100g (OFF nutriment unit), so
    // kg CO₂e per kg of product = value / 100. (A previous ×10 treated grams as
    // kg: 1000× off — the same slip still lived in the basket and swap maths
    // until the random-scan simulation caught it.)
    const co2PerKg = scan.carbonFootprint100g != null
      ? scan.carbonFootprint100g / 100
      : (gradeCo2PerKg(grade) ?? BASELINE_CO2_KG);
    totalUserCO2 += co2PerKg * SERVING_KG;
    totalBaselineCO2 += BASELINE_CO2_KG * SERVING_KG;
  }

  const co2SavedKg = Math.max(0, totalBaselineCO2 - totalUserCO2);
  const pctReduced = totalBaselineCO2 > 0 ? Math.round((co2SavedKg / totalBaselineCO2) * 100) : 0;

  // Project yearly saving based on scan frequency
  const oldest = history.length > 0 ? history[history.length - 1].timestamp : Date.now();
  const daysSinceFirst = Math.max(1, (Date.now() - oldest) / 86_400_000);
  const scansPerYear = (history.length / daysSinceFirst) * 365;
  const projectedSavedKgPerYear = scoredCount > 0
    ? Math.round(((co2SavedKg / scoredCount) * scansPerYear) * 10) / 10
    : 0;

  return {
    totalUserCO2: Math.round(totalUserCO2 * 10) / 10,
    totalBaselineCO2: Math.round(totalBaselineCO2 * 10) / 10,
    co2SavedKg: Math.round(co2SavedKg * 10) / 10,
    pctReduced,
    projectedSavedKgPerYear,
    scoredCount,
  };
};

// getImpactStats() lived here and was deleted 2026-08-19. It computed a second
// "CO₂ avoided this month" figure that disagreed with every other one in the app
// by 4× — it summed kg-per-kg differences without ever multiplying by a serving
// mass — and nothing rendered it. `computeMonthlyImpact` (utils/impactStats)
// answers the same question for the same window, and is what the Dashboard and
// the share card actually use.
