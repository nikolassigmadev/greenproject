// Aggregate impact stats for the dashboard.
// Combines scan history + accepted swaps + brand-flag service.

import { loadScanHistory, type ScanHistoryEntry } from './userPreferences';
import { loadAcceptedSwaps, type AcceptedSwap } from './swapTracking';
import { getVerifiedFlagForBrand } from '@/services/brandFlags';

export interface MonthlyImpact {
  scanCount: number;
  flaggedBrandCount: number;
  uniqueBrandsScanned: number;
  swapsAccepted: number;
  co2SavedKg: number;
  topBrands: { brand: string; count: number }[];
  windowDays: number;
}

function isFlagged(brand: string | null | undefined): boolean {
  if (!brand) return false;
  return !!getVerifiedFlagForBrand(brand);
}

function withinDays(timestamp: number, days: number): boolean {
  return timestamp > Date.now() - days * 86_400_000;
}

export function computeMonthlyImpact(windowDays = 30): MonthlyImpact {
  const history: ScanHistoryEntry[] = loadScanHistory().filter((h) =>
    withinDays(h.timestamp, windowDays),
  );
  const swaps: AcceptedSwap[] = loadAcceptedSwaps().filter((s) =>
    withinDays(s.timestamp, windowDays),
  );

  const flaggedBrandCount = history.filter((h) => isFlagged(h.brand)).length;

  const brandCounts = new Map<string, number>();
  for (const h of history) {
    const brand = h.brand?.trim();
    if (!brand) continue;
    brandCounts.set(brand, (brandCounts.get(brand) ?? 0) + 1);
  }

  const topBrands = [...brandCounts.entries()]
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const co2SavedKg = swaps.reduce((sum, s) => sum + (s.co2SavedKg ?? 0), 0);

  return {
    scanCount: history.length,
    flaggedBrandCount,
    uniqueBrandsScanned: brandCounts.size,
    swapsAccepted: swaps.length,
    co2SavedKg: Math.round(co2SavedKg * 10) / 10,
    topBrands,
    windowDays,
  };
}
