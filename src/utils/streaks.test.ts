import { describe, it, expect, beforeEach } from 'vitest';
import { computeStreak, computeMilestones } from './streaks';
import type { ScanHistoryEntry } from './userPreferences';

const DAY = 86_400_000;

// Minimal entry — only timestamp/brand matter for these calcs.
const entry = (overrides: Partial<ScanHistoryEntry> = {}): ScanHistoryEntry => ({
  id: Math.random().toString(36),
  barcode: '0',
  productName: 'X',
  brand: 'BrandA',
  imageUrl: null,
  timestamp: Date.now(),
  verdict: { emoji: '', label: 'BUY', color: '#000' },
  scores: { ecoScore: 50, ecoGrade: 'b', nutriScore: 'c', laborAllegations: 0, novaGroup: 4 },
  ...overrides,
});

describe('computeStreak', () => {
  beforeEach(() => localStorage.clear());

  it('is zero for empty history', () => {
    expect(computeStreak([])).toEqual({ current: 0, longest: 0, scannedToday: false });
  });

  it('counts consecutive days ending today', () => {
    const now = Date.now();
    const s = computeStreak([
      entry({ timestamp: now }),
      entry({ timestamp: now - DAY }),
      entry({ timestamp: now - 2 * DAY }),
    ]);
    expect(s.current).toBe(3);
    expect(s.scannedToday).toBe(true);
  });

  it('keeps a live streak when today has no scan yet (anchors on yesterday)', () => {
    const now = Date.now();
    const s = computeStreak([
      entry({ timestamp: now - DAY }),
      entry({ timestamp: now - 2 * DAY }),
    ]);
    expect(s.current).toBe(2);
    expect(s.scannedToday).toBe(false);
  });

  it('breaks the current streak after a gap but reports the longest run', () => {
    const now = Date.now();
    const s = computeStreak([
      entry({ timestamp: now }),                 // today (run of 1)
      entry({ timestamp: now - 5 * DAY }),       // gap, then a run of 3
      entry({ timestamp: now - 6 * DAY }),
      entry({ timestamp: now - 7 * DAY }),
    ]);
    expect(s.current).toBe(1);
    expect(s.longest).toBe(3);
  });

  it('treats multiple scans on the same day as one day', () => {
    const now = Date.now();
    const s = computeStreak([
      entry({ timestamp: now }),
      entry({ timestamp: now - 1000 }),
      entry({ timestamp: now - 2000 }),
    ]);
    expect(s.current).toBe(1);
  });
});

describe('computeMilestones', () => {
  beforeEach(() => localStorage.clear());

  it('marks a scan milestone achieved once the threshold is reached', () => {
    const history = Array.from({ length: 12 }, () => entry());
    const { milestones, achievedCount } = computeMilestones(history);
    const tenScans = milestones.find((m) => m.id === 'scans-10')!;
    expect(tenScans.achieved).toBe(true);
    expect(milestones.find((m) => m.id === 'scans-50')!.achieved).toBe(false);
    expect(achievedCount).toBeGreaterThanOrEqual(1);
  });

  it('counts unique brands, not raw scans', () => {
    const history = [
      ...Array.from({ length: 8 }, () => entry({ brand: 'Same' })),
      entry({ brand: 'Other' }),
    ];
    const brands10 = computeMilestones(history).milestones.find((m) => m.id === 'brands-10')!;
    expect(brands10.value).toBe(2);
    expect(brands10.achieved).toBe(false);
  });

  it('surfaces the closest unachieved milestone as nextUp', () => {
    const history = Array.from({ length: 9 }, () => entry()); // 9/10 scans = 90%
    const { nextUp } = computeMilestones(history);
    expect(nextUp?.id).toBe('scans-10');
    expect(nextUp?.progress).toBeCloseTo(0.9);
  });
});
