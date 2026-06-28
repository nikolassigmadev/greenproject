// GS1 payload parsing for the "Sunrise 2027" transition from 1D to 2D barcodes.
//
// Retailers are moving from classic 1D EAN/UPC barcodes to 2D codes (QR codes
// carrying a GS1 Digital Link, and GS1 DataMatrix). Both still encode the same
// product key — the GTIN, GS1 Application Identifier (AI) "01" — so once we pull
// the GTIN out of any payload, the existing Open Food Facts lookup keeps working.
//
// This module turns whatever the scanner decodes (a plain number, a Digital Link
// URL, or a GS1 element string) into the normalized EAN/UPC our lookup accepts.

/**
 * Normalize a GTIN (8–14 digits) into the EAN/UPC form `validateAndCleanBarcode`
 * understands. GTIN-14 is the canonical zero-padded form; stripping a single
 * leading zero yields the EAN-13 (our lookup also tries the UPC-A alternative).
 */
function normalizeGtin(gtin: string): string {
  const d = gtin.replace(/\D/g, "");
  if (d.length === 14 && d.startsWith("0")) return d.slice(1);
  return d;
}

/** Pull the GTIN from a GS1 Digital Link URL, e.g. https://id.gs1.org/01/09506000134352 */
function gtinFromDigitalLink(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  // The primary identifier is encoded as /01/<gtin> (or the short name /gtin/<gtin>).
  const m = url.pathname.match(/\/(?:01|gtin)\/(\d{8,14})(?:\/|$)/i);
  return m ? m[1] : null;
}

/** Pull the GTIN from a GS1 element string (bracketed or FNC1-delimited DataMatrix/QR). */
function gtinFromElementString(raw: string): string | null {
  // Drop a leading symbology identifier such as ]C1, ]Q3, ]d2, ]e0.
  const s = raw.replace(/^\][A-Za-z0-9]{2}/, "");
  // Human-readable bracketed form. Strictly AI 01 is GTIN-14, but real data
  // (incl. Open Food Facts' own examples, e.g. "(01)3274080005003") often omits
  // the zero-pad, so accept 8–14 digits and let normalizeGtin sort it out.
  const bracket = s.match(/\(01\)(\d{8,14})/);
  if (bracket) return bracket[1];
  // FNC1 form: AI "01" is fixed-length 14, at the start or after a GS (\x1d)
  // separator. Must stay 14 here — there's no delimiter, so the length is how
  // we know where the GTIN ends before the next AI.
  const fnc1 = s.match(/(?:^|\x1d)01(\d{14})/);
  if (fnc1) return fnc1[1];
  return null;
}

/**
 * Extract a normalized retail barcode (EAN/UPC) from any scanned payload.
 *
 * Accepts:
 *  - Plain 1D numeric barcodes (today's EAN-13/EAN-8/UPC-A/UPC-E) — passthrough
 *  - GS1 Digital Link URLs (2D QR codes) — extracts the /01/<gtin> identifier
 *  - GS1 element strings (2D DataMatrix/QR with AIs) — extracts the "01" GTIN
 *
 * Returns the best EAN/UPC string for lookup, or null when no GTIN is present
 * (e.g. an unrelated QR code linking to a website).
 */
export function extractBarcode(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  // Fast path: a plain numeric 1D barcode (whitespace tolerated).
  const compact = trimmed.replace(/\s+/g, "");
  if (/^\d{8,14}$/.test(compact)) return normalizeGtin(compact);

  // 2D GS1 Digital Link URL.
  const dl = gtinFromDigitalLink(trimmed);
  if (dl) return normalizeGtin(dl);

  // 2D GS1 element string.
  const el = gtinFromElementString(trimmed);
  if (el) return normalizeGtin(el);

  return null;
}
