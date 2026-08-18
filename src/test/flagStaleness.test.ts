/**
 * Fails the build when a published flag has gone stale or been resolved.
 *
 * This is deliberately a FAILURE, not a warning. A flag with a live URL looks
 * healthy indefinitely — no check notices that the lawsuit it cites settled, or
 * that the Withhold Release Order was lifted. The page still loads. So the only
 * thing that can catch it is a clock, and the only clock anyone acts on is one
 * that breaks the build.
 *
 * WHEN THIS TEST FAILS, the fix is to re-check the source and either bump
 * `accessedDate` (still live) or set `resolvedDate` (concluded). It is not to
 * raise the interval.
 */

import { describe, it, expect } from 'vitest';
import { getVerifiedFlags } from '@/data/brandFlags.v2';
import {
  auditFlags, auditFlag, isStale, isResolved, daysUntilReview, REVIEW_INTERVAL_DAYS,
} from '@/services/brandFlags/staleness';
import type { FlagSource, BrandFlagV2 } from '@/types/brandFlag';

const src = (over: Partial<FlagSource> = {}): FlagSource => ({
  url: 'https://example.gov/finding',
  title: 'A finding',
  publisher: 'Example Regulator',
  type: 'regulatory_finding',
  tier: 'tier1',
  publishedDate: '2020-01-01',
  accessedDate: '2026-01-01',
  ...over,
});

const flag = (sources: FlagSource[]): BrandFlagV2 => ({
  id: 'test-flag', brandName: 'TestCo', category: 'forced_labour', severity: 'high',
  claimType: 'direct', summary: 's', details: 'd', sources,
  status: 'verified', lastVerified: '2026-01-01',
  createdAt: '2026-01-01', updatedAt: '2026-01-01',
} as BrandFlagV2);

const NOW = new Date('2026-08-18T00:00:00Z');

describe('staleness mechanics', () => {
  it('treats a tier-1 source as fresh for 12 months and stale after', () => {
    expect(isStale(src({ tier: 'tier1', accessedDate: '2025-10-01' }), NOW)).toBe(false);
    expect(isStale(src({ tier: 'tier1', accessedDate: '2025-06-01' }), NOW)).toBe(true);
  });

  it('holds tier-2 to a shorter 6-month interval', () => {
    // NGO benchmarks and investigations are revised far more often than court
    // records, so the same age means something different.
    expect(isStale(src({ tier: 'tier2', accessedDate: '2026-05-01' }), NOW)).toBe(false);
    expect(isStale(src({ tier: 'tier2', accessedDate: '2025-10-01' }), NOW)).toBe(true);
    expect(REVIEW_INTERVAL_DAYS.tier2).toBeLessThan(REVIEW_INTERVAL_DAYS.tier1);
  });

  it('treats an unparseable date as stale, not as fresh', () => {
    // Failing open here would mean a typo silently exempts a flag forever.
    expect(isStale(src({ accessedDate: 'not-a-date' }), NOW)).toBe(true);
  });

  it('marks a source resolved once its matter has concluded', () => {
    expect(isResolved(src({ resolvedDate: '2025-03-01' }), NOW)).toBe(true);
    expect(isResolved(src({}), NOW)).toBe(false);
  });

  it('ignores a resolvedDate in the future, which is a data-entry error', () => {
    expect(isResolved(src({ resolvedDate: '2027-01-01' }), NOW)).toBe(false);
  });

  it('flags as fully unsupported when every source is resolved or stale', () => {
    const dead = flag([
      src({ resolvedDate: '2025-01-01' }),
      src({ tier: 'tier2', accessedDate: '2024-01-01' }),
    ]);
    expect(auditFlag(dead, NOW).fullyUnsupported).toBe(true);

    const alive = flag([src({ resolvedDate: '2025-01-01' }), src({ accessedDate: '2026-06-01' })]);
    expect(auditFlag(alive, NOW).fullyUnsupported).toBe(false);
  });
});

describe('the published flag set', () => {
  const flags = getVerifiedFlags();

  it('has flags to check', () => {
    expect(flags.length).toBeGreaterThan(0);
  });

  it('publishes NO flag whose sources have all gone stale or resolved', () => {
    const unsupported = flags.map((f) => auditFlag(f)).filter((r) => r.fullyUnsupported);
    if (unsupported.length) {
      console.error(
        '\nFlags with no live source left — these must not ship:\n' +
        unsupported.map((r) => `  ${r.flagId} (${r.brand})`).join('\n'),
      );
    }
    expect(unsupported.map((r) => r.flagId)).toEqual([]);
  });

  it('publishes NO individually stale source', () => {
    const problems = auditFlags(flags);
    const stale = problems.filter((p) => p.staleSources.length > 0);
    if (stale.length) {
      console.error(
        '\nStale sources — re-check the page, then bump accessedDate (still live) ' +
        'or set resolvedDate (concluded). Do NOT raise the interval:\n' +
        stale.flatMap((p) => p.staleSources.map(
          (s) => `  ${p.flagId}: ${s.url} (${s.tier}, ${s.daysSinceCheck}d since last check)`,
        )).join('\n'),
      );
    }
    expect(stale.flatMap((p) => p.staleSources.map((s) => `${p.flagId}:${s.url}`))).toEqual([]);
  });

  it('reports how long until the next flag needs re-checking', () => {
    // Not an assertion — a visible countdown, so the review is planned rather
    // than discovered on the day the build breaks.
    const soonest = flags
      .map((f) => ({ id: f.id, days: daysUntilReview(f) }))
      .sort((a, b) => a.days - b.days)[0];
    console.log(`\n[staleness] next review due in ${soonest.days} days (${soonest.id})`);
    expect(Number.isFinite(soonest.days)).toBe(true);
  });
});
