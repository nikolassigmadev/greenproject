/**
 * Runtime read layer for brand flags.
 * All consumer code should use these functions — never import brandFlags.v2.ts directly.
 *
 * Only 'verified' flags that meet the sourcing bar are returned to non-admin callers.
 * Pending / archived flags are available via getPendingFlags() for admin use only.
 */

import type { BrandFlagV2 } from '@/types/brandFlag';
import { meetsSourcingBar } from '@/types/brandFlag';
import { brandFlagsV2, flagMatchesBrand } from '@/data/brandFlags.v2';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isLive(flag: BrandFlagV2): boolean {
  return flag.status === 'verified' && meetsSourcingBar(flag);
}

// Word-boundary matching shared with the dataset (flagMatchesBrand). The old
// substring matching here flagged "Philly Swirl" for illycaffè and "Domino's
// Pizza" for Domino Sugar.
const matchesBrand = flagMatchesBrand;

// The live set never changes at runtime — the dataset is a static import — so
// filtering it on every lookup is pure waste.
const liveFlags = brandFlagsV2.filter(isLive);

/**
 * Memoised brand -> flags.
 *
 * This is a hot path now: since laborCheck falls through to the flag set, every
 * verdict computation lands here, and each miss costs a scan of the whole
 * dataset running an alias regex per flag. The verdict-audit battery (3,600+
 * verdicts) went from passing to timing out the moment that fallback was added.
 *
 * Safe to cache for the process lifetime: both inputs are static.
 */
const brandFlagCache = new Map<string, BrandFlagV2[]>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** All verified flags for a brand string (for display on product cards). */
export function getVerifiedFlagsForBrand(brandName: string): BrandFlagV2[] {
  if (!brandName) return [];
  const key = brandName.toLowerCase();
  const hit = brandFlagCache.get(key);
  if (hit) return hit;
  const found = liveFlags.filter((f) => matchesBrand(f, brandName));
  brandFlagCache.set(key, found);
  return found;
}

/** Single verified flag for a brand — convenience wrapper for UI components. */
export function getVerifiedFlagForBrand(brandName: string | null | undefined): BrandFlagV2 | null {
  if (!brandName) return null;
  return getVerifiedFlagsForBrand(brandName)[0] ?? null;
}

/** All verified flags across the entire dataset. */
export function getAllVerifiedFlags(): BrandFlagV2[] {
  return liveFlags;
}

/** All pending_review flags — for admin use only, never shown to end users. */
export function getPendingFlags(): BrandFlagV2[] {
  return brandFlagsV2.filter((f) => f.status === 'pending_review');
}

/** Full-text search across brand name and aliases (verified only). */
export function findFlagsByAlias(query: string): BrandFlagV2[] {
  if (!query.trim()) return [];
  return brandFlagsV2.filter((f) => isLive(f) && matchesBrand(f, query));
}

/** Most recent lastVerified date across all flags — for methodology page. */
export function getMostRecentVerifiedDate(): string {
  return brandFlagsV2
    .map((f) => f.lastVerified)
    .sort()
    .at(-1) ?? '';
}
