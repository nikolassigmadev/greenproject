import { describe, it, expect, beforeEach } from 'vitest';
import { getBrandTimeline, markEventsSeen, checkForNewBrandEvents, getUnseenEventCount } from './brandEvents';
import { addToWatchlist } from './watchlist';

// "Nestlé" has verified flags in brandFlags.v2 and sits on the boycott list,
// so it exercises both event sources.
const FLAGGED_BRAND = 'Nestlé';

beforeEach(() => {
  localStorage.clear();
});

describe('getBrandTimeline', () => {
  it('is empty when nothing is watched', () => {
    expect(getBrandTimeline()).toEqual([]);
  });

  it('builds flag and boycott events for a watched flagged brand', () => {
    addToWatchlist(FLAGGED_BRAND);
    const timeline = getBrandTimeline();
    expect(timeline.length).toBeGreaterThan(0);
    expect(timeline.some((e) => e.type === 'flag')).toBe(true);
    expect(timeline.some((e) => e.type === 'boycott')).toBe(true);
    // Every event belongs to the watched brand and starts unseen.
    for (const e of timeline) {
      expect(e.brand).toBe(FLAGGED_BRAND);
      expect(e.isNew).toBe(true);
    }
  });

  it('sorts dated events before undated boycott listings, newest first', () => {
    addToWatchlist(FLAGGED_BRAND);
    const timeline = getBrandTimeline();
    const dates = timeline.map((e) => e.date);
    const firstNull = dates.indexOf(null);
    if (firstNull !== -1) {
      // No dated event after the first undated one.
      expect(dates.slice(firstNull).every((d) => d === null)).toBe(true);
    }
    const dated = dates.filter((d): d is string => d !== null);
    expect([...dated].sort().reverse()).toEqual(dated);
  });
});

describe('markEventsSeen', () => {
  it('clears the NEW state on the next read', () => {
    addToWatchlist(FLAGGED_BRAND);
    const before = getBrandTimeline();
    expect(getUnseenEventCount()).toBe(before.length);
    markEventsSeen(before);
    expect(getUnseenEventCount()).toBe(0);
    expect(getBrandTimeline().every((e) => !e.isNew)).toBe(true);
  });
});

describe('checkForNewBrandEvents', () => {
  it('baselines a newly watched brand silently', async () => {
    addToWatchlist(FLAGGED_BRAND);
    // First check: history is baselined, nothing is "new".
    expect(await checkForNewBrandEvents()).toEqual([]);
    // Second check: still nothing — data hasn't changed.
    expect(await checkForNewBrandEvents()).toEqual([]);
  });

  it('returns nothing when the watchlist is empty', async () => {
    expect(await checkForNewBrandEvents()).toEqual([]);
  });
});
