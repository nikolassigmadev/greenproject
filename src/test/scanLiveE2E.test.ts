/**
 * LIVE end-to-end scan harness (manual, not part of CI).
 *
 * Drives the REAL pipeline against the running backend (OpenAI Vision +
 * Open Food Facts) using actual product images, then runs the SAME query
 * building + relevance gate (pickBestMatch) the scan screen uses.
 *
 * Setup: node scripts/fetch-scan-test-images.mjs   (downloads images to /tmp/scan_tests)
 * Run:   RUN_LIVE=1 BACKEND=http://localhost:3001 npx vitest run src/test/scanLiveE2E.test.ts
 * Needs: the server running with OPENAI_API_KEY.
 *
 * Note: the server rate-limits OpenAI calls; if a scan returns blank, space the
 * runs out (it's the limiter, not an identification miss).
 */
import { readFile } from 'node:fs/promises';
import { describe, it } from 'vitest';
import { pickBestMatch } from '@/utils/productRelevance';

const BACKEND = process.env.BACKEND || 'http://localhost:3001';
const IMG_DIR = process.env.IMG_DIR || '/tmp/scan_tests';

// Faithful copy of Scan.tsx cleanOCRQuery (strip units/numbers, dedupe words).
const cleanOCRQuery = (raw: string): string => {
  let q = raw
    .replace(/\d+[.,]?\d*\s*(g|kg|mg|ml|l|cl|oz|fl\.?\s*oz|lb|lbs|liter|litre|%)\b/gi, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const seen = new Set<string>();
  q = q.split(' ').filter((w) => {
    const lo = w.toLowerCase();
    if (seen.has(lo)) return false;
    seen.add(lo);
    return true;
  }).join(' ');
  return q;
};

// Faithful copy of Scan.tsx processImageForOFF search-query ordering.
const buildSearchQueries = (brandOnly: string, prodOnly: string): string[] => {
  const rawQuery = [brandOnly, prodOnly].filter(Boolean).join(' ');
  const cleanedQuery = cleanOCRQuery(rawQuery);
  const out: string[] = [];
  const add = (q: string) => { if (q && !out.some((s) => s.toLowerCase() === q.toLowerCase())) out.push(q); };
  if (brandOnly && prodOnly) add(`${brandOnly} ${prodOnly}`);
  if (prodOnly) add(prodOnly);
  add(rawQuery);
  if (cleanedQuery !== rawQuery) add(cleanedQuery);
  if (brandOnly) add(brandOnly);
  const words = cleanedQuery.split(' ').filter(Boolean);
  for (let len = words.length - 1; len >= 2; len--) add(words.slice(0, len).join(' '));
  return out;
};

async function scanProduct(imageBase64: string) {
  const r = await fetch(`${BACKEND}/api/openai/analyze-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, task: 'scan-product' }),
  });
  const d = await r.json();
  const raw: string = d.content || '';
  const get = (re: RegExp) => { const m = raw.match(re); return m ? m[1].trim() : ''; };
  const isUnknown = (s: string) => !s || /^(unknown|none)$/i.test(s);
  const brand = get(/Brand:\s*(.+)/i);
  const product = get(/Product:\s*(.+)/i);
  return {
    raw,
    brandOnly: isUnknown(brand) ? '' : brand,
    prodOnly: isUnknown(product) ? '' : product,
  };
}

interface OffCand { productName: string | null; brand: string | null; barcode: string }

async function searchOff(query: string): Promise<OffCand[]> {
  const r = await fetch(`${BACKEND}/api/openfoodfacts/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit: 20 }),
  });
  if (!r.ok) return [];
  const d = await r.json();
  const products = d.products || d.results || [];
  return products.map((p: Record<string, unknown>): OffCand => ({
    productName: (p.product_name as string) || (p.product_name_en as string) || null,
    brand: (p.brands as string) || null,
    barcode: (p.code as string) || (p.barcode as string) || '',
  }));
}

const CASES: Array<{ file: string; expectBrand: string }> = [
  { file: 'nutella.jpg',       expectBrand: 'nutella|ferrero' },
  { file: 'cocacola_zero.jpg', expectBrand: 'coca' },
  { file: 'heinz_ketchup.jpg', expectBrand: 'heinz' },
  { file: 'pringles.jpg',      expectBrand: 'pringles' },
  { file: 'lays_chips.jpg',    expectBrand: 'lay' },
  { file: 'oreo_cookies.jpg',  expectBrand: 'oreo|mondelez' },
];

describe.skipIf(!process.env.RUN_LIVE)('LIVE scan E2E', () => {
  for (const c of CASES) {
    it(`scans ${c.file}`, async () => {
      const buf = await readFile(`${IMG_DIR}/${c.file}`);
      const b64 = buf.toString('base64');

      const id = await scanProduct(b64);
      const rawQuery = [id.brandOnly, id.prodOnly].filter(Boolean).join(' ');
      const queries = buildSearchQueries(id.brandOnly, id.prodOnly);

      console.log(`\n━━━ ${c.file} ━━━`);
      console.log(`OpenAI →  Brand: "${id.brandOnly}"  Product: "${id.prodOnly}"`);
      console.log(`Queries:  ${queries.map((q) => `"${q}"`).join('  →  ')}`);

      let resolved: OffCand | null = null;
      let winningQuery = '';
      for (const q of queries) {
        const results = await searchOff(q);
        if (results.length === 0) { console.log(`  · "${q}" → 0 results`); continue; }
        const m = pickBestMatch(results, rawQuery, q, undefined, id.brandOnly || undefined);
        if (m.passedRelevanceGate && m.product) {
          resolved = m.product;
          winningQuery = q;
          console.log(`  ✓ "${q}" → MATCH "${m.product.productName}" by ${m.product.brand} [${m.product.barcode}] conf=${m.confidence.toFixed(2)}`);
          break;
        }
        console.log(`  · "${q}" → ${results.length} results, no confident match${m.brandOnlyFallback ? ' (brand-only, rejected)' : ''}`);
      }

      if (!resolved) {
        console.log(`RESULT:   NOT FOUND (would prompt manual entry)`);
      } else {
        const got = `${resolved.productName ?? ''} ${resolved.brand ?? ''}`.toLowerCase();
        const ok = new RegExp(c.expectBrand).test(got);
        console.log(`RESULT:   ${ok ? '✅ CORRECT BRAND' : '❌ WRONG BRAND'} — resolved "${resolved.productName}" by "${resolved.brand}" via "${winningQuery}" (expected /${c.expectBrand}/)`);
      }
    }, 45000);
  }
});
