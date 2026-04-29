/**
 * Runtime read layer for brand flags.
 * All consumer code should use these functions — never import brandFlags.v2.ts directly.
 *
 * Only 'verified' flags that meet the sourcing bar are returned to non-admin callers.
 * Pending / disputed / archived flags are available via getPendingFlags() for admin use only.
 */

import type { BrandFlagV2 } from '@/types/brandFlag';
import { meetsSourcingBar } from '@/types/brandFlag';
import { brandFlagsV2 } from '@/data/brandFlags.v2';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isLive(flag: BrandFlagV2): boolean {
  return flag.status === 'verified' && meetsSourcingBar(flag);
}

function matchesBrand(flag: BrandFlagV2, query: string): boolean {
  const lower = query.toLowerCase();
  if (flag.brandName.toLowerCase().includes(lower)) return true;
  if (flag.brandAliases?.some((alias) => lower.includes(alias) || alias.includes(lower))) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** All verified flags for a brand string (for display on product cards). */
export function getVerifiedFlagsForBrand(brandName: string): BrandFlagV2[] {
  if (!brandName) return [];
  return brandFlagsV2.filter((f) => isLive(f) && matchesBrand(f, brandName));
}

/** Single verified flag for a brand — convenience wrapper for UI components. */
export function getVerifiedFlagForBrand(brandName: string | null | undefined): BrandFlagV2 | null {
  if (!brandName) return null;
  return getVerifiedFlagsForBrand(brandName)[0] ?? null;
}

/** All verified flags across the entire dataset. */
export function getAllVerifiedFlags(): BrandFlagV2[] {
  return brandFlagsV2.filter(isLive);
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
