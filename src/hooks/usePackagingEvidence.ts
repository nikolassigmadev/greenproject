// Read the packaging, but only when it would actually tell us something new.
//
// Rung A4 is the highest-coverage rung available, because origin is legally
// mandated ON-PACK far more often than it appears in any database. But reading
// it costs a second vision call per scan, and scan latency in this app has been
// carefully driven down (~13s to ~3.5-4.5s). So two rules shape this hook:
//
//   1. It NEVER blocks. The map renders immediately from the product record and
//      upgrades in place if and when the pack read returns. A slow or failed
//      OCR call degrades to exactly what the page showed before.
//
//   2. It only fires when the map is otherwise weak. If the product already
//      declares an origin, a second opinion from OCR adds a row to a list that
//      is already correct — it does not add COVERAGE. Spending the call on the
//      products with nothing is where the entire value of this rung lives.

import { useEffect, useState } from 'react';
import { extractOriginStatement } from '@/services/ocr/advanced-openai-ocr';
import {
  parseOriginStatements, parseUsdaEstablishment,
} from '@/services/supplyChain/originStatement';
import { resolveUsdaFacility } from '@/services/supplyChain/resolveFacility';
import type { PackagingEvidence } from '@/services/supplyChain/types';

/**
 * @param imageDataUrl  the scanned photo, or null when we don't have one
 * @param needed        false when the record already declares an origin
 */
export function usePackagingEvidence(
  imageDataUrl: string | null,
  needed: boolean,
): PackagingEvidence | null {
  const [evidence, setEvidence] = useState<PackagingEvidence | null>(null);

  useEffect(() => {
    if (!imageDataUrl || !needed) {
      setEvidence(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const raw = await extractOriginStatement(imageDataUrl);
        if (cancelled || !raw) return;

        const statements = parseOriginStatements(raw);
        const establishment = parseUsdaEstablishment(raw);
        // Loads the 13,290-row FSIS directory as its own chunk, and only when a
        // number was actually read off a USDA mark.
        const usdaFacility = await resolveUsdaFacility(establishment);
        if (cancelled) return;

        // Nothing readable on the pack is a NORMAL result, not a failure. Leave
        // the state null so the map keeps saying "not disclosed", which is the
        // honest answer and the one the app's voice is built on.
        if (!statements.length && !usdaFacility) return;

        setEvidence({ statements, usdaEstablishment: establishment, usdaFacility });
      } catch {
        // Never surface this. The page was already correct without it.
      }
    })();
    return () => { cancelled = true; };
  }, [imageDataUrl, needed]);

  return evidence;
}
