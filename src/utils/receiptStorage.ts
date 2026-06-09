// Persists each receipt scan + aggregates them for ReceiptAnalytics.

import type { OpenFoodFactsResult } from '@/services/openfoodfacts/types';
import { getVerifiedFlagForBrand } from '@/services/brandFlags';

const STORAGE_KEY = 'goodscan-receipt-scans';
const MAX_ENTRIES = 60;
export const RECEIPT_EVENT = 'receiptScansUpdated';

export interface ReceiptScanItem {
  query: string;             // raw line from receipt OCR
  productName: string | null;
  brand: string | null;
  ecoscoreGrade: string | null;
  carbonFootprint100g: number | null;
  flagged: boolean;          // had a verified BrandFlag at log time
  barcode: string | null;
}

export interface ReceiptScan {
  id: string;
  timestamp: number;
  itemCount: number;
  matchedCount: number;
  items: ReceiptScanItem[];
}

export function loadReceiptScans(): ReceiptScan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReceiptScan(items: { query: string; result: OpenFoodFactsResult | null }[]): ReceiptScan {
  const mapped: ReceiptScanItem[] = items.map(({ query, result }) => ({
    query,
    productName: result?.productName ?? null,
    brand: result?.brand ?? null,
    ecoscoreGrade: result?.ecoscoreGrade ?? null,
    carbonFootprint100g: result?.carbonFootprint100g ?? null,
    flagged: result?.brand ? !!getVerifiedFlagForBrand(result.brand) : false,
    barcode: result?.barcode ?? null,
  }));

  const scan: ReceiptScan = {
    id: `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    itemCount: mapped.length,
    matchedCount: mapped.filter((m) => m.productName).length,
    items: mapped,
  };

  try {
    const all = loadReceiptScans();
    all.unshift(scan);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, MAX_ENTRIES)));
    window.dispatchEvent(new Event(RECEIPT_EVENT));
  } catch {
    // localStorage may be full / disabled
  }
  return scan;
}

export function clearReceiptScans(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(RECEIPT_EVENT));
}

// ────────────────────────────────────────────────────────────────────
// Analytics
// ────────────────────────────────────────────────────────────────────

export interface MonthlyReceiptStats {
  monthKey: string;                // "2026-06"
  monthLabel: string;              // "Jun 2026"
  receiptCount: number;
  itemCount: number;
  flaggedItemCount: number;
  flaggedBrands: { brand: string; count: number }[];
  gradeDistribution: { a: number; b: number; c: number; d: number; e: number; unknown: number };
  ethicalSpendPct: number;         // share of items NOT from flagged brands (0-100)
}

function monthKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function computeMonthlyReceiptStats(scans: ReceiptScan[]): MonthlyReceiptStats[] {
  const buckets = new Map<string, ReceiptScan[]>();
  for (const scan of scans) {
    const k = monthKey(scan.timestamp);
    const list = buckets.get(k) ?? [];
    list.push(scan);
    buckets.set(k, list);
  }

  const months = [...buckets.keys()].sort().reverse();
  return months.map((key) => {
    const monthScans = buckets.get(key) ?? [];
    const allItems = monthScans.flatMap((s) => s.items);
    const dist = { a: 0, b: 0, c: 0, d: 0, e: 0, unknown: 0 };
    const brandFlagged = new Map<string, number>();

    for (const item of allItems) {
      const g = item.ecoscoreGrade?.toLowerCase();
      if (g && g in dist) {
        (dist as Record<string, number>)[g] += 1;
      } else {
        dist.unknown += 1;
      }
      if (item.flagged && item.brand) {
        brandFlagged.set(item.brand, (brandFlagged.get(item.brand) ?? 0) + 1);
      }
    }

    const flaggedItemCount = allItems.filter((i) => i.flagged).length;
    const ethicalSpendPct = allItems.length > 0
      ? Math.round(((allItems.length - flaggedItemCount) / allItems.length) * 100)
      : 0;

    return {
      monthKey: key,
      monthLabel: monthLabel(key),
      receiptCount: monthScans.length,
      itemCount: allItems.length,
      flaggedItemCount,
      flaggedBrands: [...brandFlagged.entries()]
        .map(([brand, count]) => ({ brand, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      gradeDistribution: dist,
      ethicalSpendPct,
    };
  });
}
