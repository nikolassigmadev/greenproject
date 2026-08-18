// Flag expiry.
//
// THE RISK THIS EXISTS FOR. A flag with a working source URL looks healthy
// forever. Nothing in a liveness check notices that the 2019 lawsuit it cites
// settled in 2023, or that the Withhold Release Order was lifted. The page
// still loads. The allegation is still described on it. Every automated check
// passes — and we are now publishing, about a named company, something that
// stopped being true.
//
// That is the failure mode nobody plans for, because it needs no bug and no
// outage: a flag that was accurate the day it was written rots quietly into a
// false statement.
//
// Two mechanisms:
//   1. RESOLVED — a source with `resolvedDate` set describes a matter that has
//      concluded. It stops counting as a live finding immediately.
//   2. STALE — a source nobody has re-checked within its review interval.
//      Tier 1 (courts, regulators) gets 12 months; tier 2 (NGO benchmarks,
//      investigations) gets 6, because those change faster and are revised more
//      often. Tier 3 gets 6 as well and should never be a sole basis anyway.
//
// The test in staleness.test.ts FAILS rather than warns. A warning in a build
// log is a warning nobody reads; this is the same reasoning as the URL
// liveness check, and the same reason it has to break the build.

import type { BrandFlagV2, FlagSource, SourceTier } from '@/types/brandFlag';

/** How long a source of each tier may go unverified before it is stale. */
export const REVIEW_INTERVAL_DAYS: Record<SourceTier, number> = {
  tier1: 365,
  tier2: 182,
  tier3: 182,
};

const DAY_MS = 86_400_000;

function daysBetween(iso: string, now: Date): number | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.floor((now.getTime() - t) / DAY_MS);
}

/** A source whose underlying matter has concluded. Not a live finding. */
export function isResolved(source: FlagSource, now: Date = new Date()): boolean {
  if (!source.resolvedDate) return false;
  const d = daysBetween(source.resolvedDate, now);
  // A resolvedDate in the future is a data-entry error, not a resolution.
  return d !== null && d >= 0;
}

/**
 * A source nobody has re-checked inside its review interval.
 *
 * Uses `accessedDate` — the day we last actually looked at the page — rather
 * than `publishedDate`, which never changes and would make every old-but-valid
 * court record permanently stale.
 */
export function isStale(source: FlagSource, now: Date = new Date()): boolean {
  const age = daysBetween(source.accessedDate, now);
  if (age === null) return true; // unparseable date is worse than an old one
  return age > REVIEW_INTERVAL_DAYS[source.tier];
}

export interface StalenessReport {
  flagId: string;
  brand: string;
  staleSources: { url: string; tier: SourceTier; daysSinceCheck: number }[];
  resolvedSources: { url: string; resolvedDate: string }[];
  /** True when NOTHING still supports this flag — it should stop rendering. */
  fullyUnsupported: boolean;
}

/**
 * Audit one flag. A flag is `fullyUnsupported` when every source behind it is
 * either resolved or stale — at which point it is no longer a documented
 * finding, it is a memory of one.
 */
export function auditFlag(flag: BrandFlagV2, now: Date = new Date()): StalenessReport {
  const staleSources = flag.sources
    .filter((s) => !isResolved(s, now) && isStale(s, now))
    .map((s) => ({ url: s.url, tier: s.tier, daysSinceCheck: daysBetween(s.accessedDate, now) ?? -1 }));
  const resolvedSources = flag.sources
    .filter((s) => isResolved(s, now))
    .map((s) => ({ url: s.url, resolvedDate: s.resolvedDate! }));

  const live = flag.sources.filter((s) => !isResolved(s, now) && !isStale(s, now));
  return {
    flagId: flag.id,
    brand: flag.brandName,
    staleSources,
    resolvedSources,
    fullyUnsupported: live.length === 0,
  };
}

/** Every flag with a staleness or resolution problem. Empty is the goal. */
export function auditFlags(flags: BrandFlagV2[], now: Date = new Date()): StalenessReport[] {
  return flags
    .map((f) => auditFlag(f, now))
    .filter((r) => r.staleSources.length > 0 || r.resolvedSources.length > 0);
}

/** Days until this flag's soonest source needs re-checking. Negative = overdue. */
export function daysUntilReview(flag: BrandFlagV2, now: Date = new Date()): number {
  const remaining = flag.sources
    .filter((s) => !isResolved(s, now))
    .map((s) => {
      const age = daysBetween(s.accessedDate, now);
      return age === null ? -Infinity : REVIEW_INTERVAL_DAYS[s.tier] - age;
    });
  return remaining.length ? Math.min(...remaining) : -Infinity;
}
