// Resolve a USDA establishment number to a real facility — lazily.
//
// Why this exists as its own module: the FSIS directory is 13,290
// establishments (~305 KB gzipped). Importing it from resolve.ts put all of
// that into the verdict-page chunk for EVERY scan of EVERY product worldwide,
// to serve a lookup that only ever fires on US meat and poultry. Measured: the
// chunk went from 83 KB to 388 KB gzipped.
//
// So the import happens here, dynamically, only once a number has actually been
// read off a pack. The scans that use the directory pay for it; the rest do not.
// The data is still BUNDLED — this is a separate chunk in the same build, not a
// network fetch — so the offline guarantee (INVARIANTS §4) is unaffected.

import type { PackagingEvidence } from './types';

/**
 * Look up an establishment number, loading the directory on first use.
 *
 * Returns null for an unknown number rather than guessing. That matters more
 * here than almost anywhere else in the codebase: the number is an exact
 * primary key, so a near-miss does not degrade to a vague answer — it resolves
 * to a real but WRONG factory, named and pinned with full confidence.
 */
export async function resolveUsdaFacility(
  establishmentNumber: string | null | undefined,
): Promise<PackagingEvidence['usdaFacility']> {
  if (!establishmentNumber) return null;
  try {
    const { lookupFsisEstablishment } = await import('@/data/supplyChain/fsisEstablishments');
    return lookupFsisEstablishment(establishmentNumber) ?? null;
  } catch {
    // The chunk failed to load — offline before it was ever cached, most
    // likely. The processing node falls back to "not disclosed", which is
    // correct: we genuinely cannot place it right now.
    return null;
  }
}
