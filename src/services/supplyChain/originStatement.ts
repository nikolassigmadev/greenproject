// Rung A4 — origin statements read off the packaging itself.
//
// This is the highest-yield rung available, and the reason is regulatory rather
// than technical: origin is legally mandated ON THE PACK far more often than it
// appears in any database.
//
//   EU  Reg. 1169/2011 Art. 26(2)(a)  origin required wherever omission misleads
//       Reg. (EU) 2018/775            primary ingredient, where it differs
//       Reg. 1760/2000 / 1337/2013    meat: born / reared / slaughtered
//       Dir. (EU) 2024/1438           honey: every country + percentage
//       Reg. (EU) 2022/2104           olive oil
//       Reg. 1379/2013 Art. 35        fish: FAO catch area + gear
//       Reg. (EU) 2018/848            organic: EU / non-EU Agriculture
//   US  19 U.S.C. §1304               imported articles marked with origin
//
// So the pack says it even when Open Food Facts does not. ~3-5% of products
// carry a declared origin in the database; the printed rate is far higher.
//
// Everything in this file is PURE. The network call lives in
// src/services/ocr/advanced-openai-ocr.ts; this module only parses what came
// back and turns it into claims. That keeps resolveSupplyChain() synchronous
// (INVARIANTS §4) and keeps the parsing testable without a model in the loop.
//
// The evidentiary standing: a statement PRINTED ON THE PRODUCT is a field on
// the product itself, which is exactly what INVARIANTS §2 requires for
// `declared`. It is the product's own claim about itself, read directly rather
// than via a database transcription of it.
//
// What this file must never do is let the model fill a gap. The prompt tells
// the model that an empty result is correct; this parser enforces the same
// thing from the other side — a statement with no NAMED country produces no
// origin node, however confident the model sounded.

import { lookupCountryPoint } from '@/data/supplyChain/countryPoints';
import type { SourceRef, SupplyChainNode } from './types';

/** One origin statement as printed on the pack. */
export interface OriginStatement {
  /** Verbatim, exactly as printed. Shown to the user unaltered (INVARIANTS §7). */
  text: string;
  kind: OriginStatementKind;
  /** ISO 3166-1 alpha-2, only where the country is NAMED on the pack. */
  countries: string[];
  /** Declared share per country. Only where printed — honey, mainly. */
  percentages?: Record<string, number>;
}

export type OriginStatementKind =
  | 'origin'
  | 'reared'
  | 'slaughtered'
  | 'caught'
  | 'organic_region'
  | 'protected_designation';

const KINDS: readonly OriginStatementKind[] = [
  'origin', 'reared', 'slaughtered', 'caught', 'organic_region', 'protected_designation',
];

/** The pack itself, read by OCR. Cited as such — never as a database record. */
export const PACKAGING_OCR_SOURCE: SourceRef = {
  label: 'Product packaging (read by OCR)',
};

/**
 * Phrases that look like provenance and are not.
 *
 * A distributor address is the big one: "Distributed by Acme Foods, Chicago, IL"
 * names a country and sits in the same block of small print as the real origin
 * line, so both the model and a naive regex will happily read it as "made in the
 * US". It is a statement about who sells the product, not where it came from.
 *
 * Belt and braces with the prompt: the prompt tells the model not to return
 * these, and this list drops them if it does anyway. A prompt is a request, not
 * a guarantee, and this is the one error that would silently manufacture a
 * `declared` claim.
 */
const NOT_AN_ORIGIN = [
  /\bdistributed\s+(?:by|for)\b/i,
  /\bdistributor\b/i,
  /\bimported\s+(?:by|for)\b/i,
  /\bmanufactured\s+for\b/i,
  /\bpacked\s+for\b/i,
  /\bmarketed\s+by\b/i,
  /\bsold\s+by\b/i,
  /\ba\s+brand\s+of\b/i,
  /\bcustomer\s+(?:service|care)\b/i,
  /\bquestions\?\s*(?:call|visit)/i,
  /\bwww\.|\bhttps?:\/\//i,
];

function looksLikeAnAddress(text: string): boolean {
  return NOT_AN_ORIGIN.some((re) => re.test(text));
}

const ISO2 = /^[A-Z]{2}$/;

/**
 * Two letters, but not a country.
 *
 * "EU" is the one that actually turns up, and it turns up in precisely the
 * context where the country is deliberately NOT specified: the organic mark
 * reads "EU Agriculture" exactly because the regulation does not require the
 * member state to be named (Reg. (EU) 2018/848). Letting it through as a
 * country code would convert "grown somewhere in the EU" into a placeable
 * origin, which is the inference this rung must never make.
 *
 * The rest are ISO 3166-1 user-assigned / reserved ranges — placeholders, not
 * places.
 */
const NOT_A_COUNTRY = new Set(['EU', 'XX', 'XY', 'XZ', 'ZZ', 'QQ', 'AA']);

function cleanCountries(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const c of raw) {
    if (typeof c !== 'string') continue;
    const code = c.trim().toUpperCase();
    // Only accept a real ISO 3166-1 alpha-2. Anything else -- a country name,
    // "EU", "non-EU", an empty string -- is not something we can place, and
    // guessing which country was meant is exactly the failure this file exists
    // to prevent. The verbatim text still carries the information to the user.
    if (ISO2.test(code) && !NOT_A_COUNTRY.has(code) && !out.includes(code)) out.push(code);
  }
  return out;
}

function cleanPercentages(raw: unknown, countries: string[]): Record<string, number> | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const code = k.trim().toUpperCase();
    const n = typeof v === 'number' ? v : Number(v);
    if (!ISO2.test(code)) continue;
    if (!Number.isFinite(n) || n <= 0 || n > 100) continue;
    // A percentage for a country that was not itself declared is not a
    // percentage of anything we can render.
    if (!countries.includes(code)) continue;
    out[code] = n;
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * Parse the model's reply into statements. NEVER throws.
 *
 * Tolerates: a bare JSON object, a ```json fence, prose either side, a top-level
 * array instead of the documented envelope, and total garbage. Anything it
 * cannot understand yields `[]` — which the caller treats as "the pack says
 * nothing", the same as an honest empty result. That is the correct failure
 * direction: a parse bug must lose a claim, never invent one.
 */
export function parseOriginStatements(raw: string | null | undefined): OriginStatement[] {
  if (!raw || typeof raw !== 'string') return [];

  let parsed: unknown = null;
  // Strip a markdown fence if the model added one despite being told not to.
  const unfenced = raw.replace(/```(?:json)?/gi, '').trim();

  for (const candidate of [unfenced, sliceBalanced(unfenced, '{', '}'), sliceBalanced(unfenced, '[', ']')]) {
    if (!candidate) continue;
    try {
      parsed = JSON.parse(candidate);
      break;
    } catch {
      // Try the next shape. A malformed reply is an expected outcome here, not
      // an exceptional one.
      parsed = null;
    }
  }
  if (!parsed) return [];

  const list: unknown = Array.isArray(parsed)
    ? parsed
    : (parsed as { statements?: unknown }).statements;
  if (!Array.isArray(list)) return [];

  const out: OriginStatement[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const rec = item as Record<string, unknown>;

    const text = typeof rec.text === 'string' ? rec.text.trim() : '';
    if (!text) continue;
    // An address is not a provenance claim.
    if (looksLikeAnAddress(text)) continue;

    const kindRaw = typeof rec.kind === 'string' ? rec.kind.trim().toLowerCase() : 'origin';
    const kind = (KINDS as readonly string[]).includes(kindRaw)
      ? (kindRaw as OriginStatementKind)
      : 'origin';

    const countries = cleanCountries(rec.countries);
    out.push({
      text,
      kind,
      countries,
      percentages: cleanPercentages(rec.percentages, countries),
    });
  }
  return out;
}

/** Extract the first balanced {...} or [...] block, so prose either side is fine. */
function sliceBalanced(s: string, open: string, close: string): string | null {
  const start = s.indexOf(open);
  if (start < 0) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

/** How a statement of each kind should be described to the user, verbatim-first. */
const KIND_PREFIX: Record<OriginStatementKind, string> = {
  origin: 'Printed on the packaging',
  reared: 'Printed on the packaging (EU meat labelling — rearing)',
  slaughtered: 'Printed on the packaging (EU meat labelling — slaughter)',
  caught: 'Printed on the packaging (EU catch-area labelling)',
  organic_region: 'Printed on the packaging (EU organic mark)',
  protected_designation: 'Printed on the packaging (protected designation)',
};

/**
 * The plain-English basis string shown to the user for this statement.
 *
 * The verbatim printed text is quoted, because that is the whole evidentiary
 * claim: the user can turn the pack over and check it. INVARIANTS §7.
 */
export function originStatementBasis(s: OriginStatement): string {
  const base = `${KIND_PREFIX[s.kind]}: "${s.text}"`;
  if (s.percentages && Object.keys(s.percentages).length) {
    const parts = Object.entries(s.percentages)
      .sort((a, b) => b[1] - a[1])
      .map(([c, n]) => `${c} ${n}%`);
    return `${base}. Declared shares: ${parts.join(', ')}.`;
  }
  return base;
}

/**
 * Confidence for a statement read off the pack.
 *
 * Slightly below a database `origins` field (0.9) for one honest reason: OCR can
 * misread. The claim itself is at least as strong -- it is the pack's own words
 * -- but our reading of it is one step less certain than a curated text field.
 *
 * A "slaughtered in" mark is a weaker statement about ingredient origin than a
 * plain "Product of X", and is scored as such. That is a difference in what the
 * mark PROVES, not in how well we read it.
 */
export function originStatementConfidence(s: OriginStatement): number {
  switch (s.kind) {
    case 'origin': return 0.85;
    case 'protected_designation': return 0.85;
    case 'caught': return 0.8;
    case 'reared': return 0.7;
    case 'slaughtered': return 0.6;
    case 'organic_region': return 0.5;
    default: return 0.6;
  }
}

// ── Statements → origin nodes ────────────────────────────────────────────────

/**
 * Turn parsed statements into `declared` origin nodes.
 *
 * Pure. Takes `max` explicitly rather than importing MAX_ORIGINS, so the cap
 * stays owned by the resolver that enforces it (INVARIANTS Scope: max 5 arcs).
 *
 * Two shapes come out of here:
 *
 *   - the pack NAMED a country  -> a placed node at that country's point
 *   - the pack said something we cannot place ("EU Agriculture", or an origin
 *     line whose country we could not resolve to an ISO code) -> a node with
 *     NULL coordinates
 *
 * The second is not a failure and is not dropped. The pack made a statement and
 * the user is entitled to see it verbatim; we simply have nowhere to draw it.
 * Per INVARIANTS §3 and §6 that renders as a node and never receives an edge —
 * which the resolver enforces by only drawing edges between placed nodes.
 */
export function originStatementNodes(
  statements: OriginStatement[],
  max: number,
): SupplyChainNode[] {
  const nodes: SupplyChainNode[] = [];
  const seen = new Set<string>();

  for (const st of statements) {
    if (nodes.length >= max) break;
    const basis = originStatementBasis(st);
    const confidence = originStatementConfidence(st);

    if (st.countries.length === 0) {
      // Nothing to place. Keep the claim, drop the pin.
      const key = `text:${st.text.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      nodes.push({
        id: `origin:ocr:${slug(st.text)}`,
        kind: 'origin',
        label: st.text,
        lon: null,
        lat: null,
        tier: 'declared',
        confidence,
        basis,
        sources: [PACKAGING_OCR_SOURCE],
      });
      continue;
    }

    for (const iso2 of st.countries) {
      if (nodes.length >= max) break;
      if (seen.has(iso2)) continue;
      seen.add(iso2);
      const point = lookupCountryPoint(iso2);
      const share = st.percentages?.[iso2];
      nodes.push({
        id: `origin:ocr:${iso2}`,
        kind: 'origin',
        // Where we hold a point, use its canonical name; otherwise the bare
        // code, which is still true. Never invent a name for a code.
        label: point?.name ?? iso2,
        lon: point?.lon ?? null,
        lat: point?.lat ?? null,
        tier: 'declared',
        confidence,
        basis,
        sources: [PACKAGING_OCR_SOURCE],
        ...(typeof share === 'number' ? { declaredShare: share } : {}),
      });
    }
  }
  return nodes;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
}
