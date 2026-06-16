// Client-side gamification derived purely from existing local data
// (scan history + accepted swaps). No backend, no new storage.

import { loadScanHistory, type ScanHistoryEntry } from './userPreferences';
import { loadAcceptedSwaps } from './swapTracking';

// Local-midnight day index, so streak maths is timezone-stable.
function dayIndex(ts: number): number {
  const d = new Date(ts);
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}

export interface ScanStreak {
  current: number;     // consecutive days (incl. today/yesterday) with a scan
  longest: number;     // best run ever
  scannedToday: boolean;
}

export function computeStreak(history: ScanHistoryEntry[] = loadScanHistory()): ScanStreak {
  if (history.length === 0) return { current: 0, longest: 0, scannedToday: false };

  const days = new Set(history.map((h) => dayIndex(h.timestamp)));
  const today = dayIndex(Date.now());

  // Current run: anchor on today, else yesterday (so a missed "today" before
  // the user scans doesn't instantly break a live streak).
  let cursor = days.has(today) ? today : days.has(today - 1) ? today - 1 : null;
  let current = 0;
  while (cursor !== null && days.has(cursor)) {
    current++;
    cursor--;
  }

  // Longest run across all scanned days.
  const sorted = [...days].sort((a, b) => a - b);
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    run = sorted[i] === sorted[i - 1] + 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  return { current, longest, scannedToday: days.has(today) };
}

export type MilestoneMetric = 'scans' | 'swaps' | 'brands' | 'co2';

export interface Milestone {
  id: string;
  label: string;       // short badge label, e.g. "50 scans"
  metric: MilestoneMetric;
  target: number;
  value: number;       // current value of that metric
  achieved: boolean;
  progress: number;    // 0–1 toward target
}

export interface MilestoneSummary {
  milestones: Milestone[];
  achievedCount: number;
  nextUp: Milestone | null;  // closest unachieved milestone
}

const TIERS: { metric: MilestoneMetric; targets: number[]; label: (n: number) => string }[] = [
  { metric: 'scans',  targets: [10, 50, 100, 250], label: (n) => `${n} scans` },
  { metric: 'swaps',  targets: [1, 5, 10, 25],     label: (n) => (n === 1 ? 'First swap' : `${n} swaps`) },
  { metric: 'brands', targets: [10, 25, 50],       label: (n) => `${n} brands` },
  { metric: 'co2',    targets: [1, 5, 10, 25],     label: (n) => `${n}kg CO₂ saved` },
];

export function computeMilestones(
  history: ScanHistoryEntry[] = loadScanHistory(),
): MilestoneSummary {
  const swaps = loadAcceptedSwaps();
  const brands = new Set(
    history.map((h) => h.brand?.trim().toLowerCase()).filter(Boolean) as string[],
  );
  const co2Saved = swaps.reduce((sum, s) => sum + (s.co2SavedKg ?? 0), 0);

  const values: Record<MilestoneMetric, number> = {
    scans: history.length,
    swaps: swaps.length,
    brands: brands.size,
    co2: Math.round(co2Saved * 10) / 10,
  };

  const milestones: Milestone[] = [];
  for (const tier of TIERS) {
    const value = values[tier.metric];
    for (const target of tier.targets) {
      milestones.push({
        id: `${tier.metric}-${target}`,
        label: tier.label(target),
        metric: tier.metric,
        target,
        value,
        achieved: value >= target,
        progress: Math.min(1, target > 0 ? value / target : 0),
      });
    }
  }

  const achievedCount = milestones.filter((m) => m.achieved).length;

  // Next up = unachieved milestone closest to completion (highest progress).
  const nextUp = milestones
    .filter((m) => !m.achieved)
    .sort((a, b) => b.progress - a.progress)[0] ?? null;

  return { milestones, achievedCount, nextUp };
}
