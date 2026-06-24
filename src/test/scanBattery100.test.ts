/**
 * 100-PRODUCT live scan battery (manual, not CI) — complicated/niche products
 * across the full grocery domain. Measures the anti-drift guarantee at scale.
 *
 * Faithful to production: scan-product prompt read verbatim from server.js, sent
 * to gpt-4o-mini at detail:'low'; OFF search + relevance gate are real app code.
 * OpenAI is called directly only to bypass the server's 10/min limiter.
 *
 * Setup: node scripts/fetch-bulk-scan-images.mjs   (writes /tmp/scan_tests/bulk/manifest.json)
 * Run:   RUN_LIVE=1 OPENAI_API_KEY=sk-... BACKEND=http://localhost:3001 \
 *          npx vitest run src/test/scanBattery100.test.ts --no-file-parallelism
 * Report written to /tmp/scan_tests/bulk/report.txt
 */
import { readFile, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import { pickBestMatch, tokenize, classifyToken, DEFAULT_CONFIG, normalize, hasUsableBrandAnchor } from '@/utils/productRelevance';

const BACKEND = process.env.BACKEND || 'http://localhost:3001';
const DIR = process.env.IMG_DIR || '/tmp/scan_tests/bulk';
const KEY = process.env.OPENAI_API_KEY || '';

const SCAN_PROMPT = (() => {
  const s = readFileSync(`${process.cwd()}/server.js`, 'utf8');
  const m = s.match(/'scan-product':\s*`([\s\S]*?)`,/);
  if (!m) throw new Error('could not extract scan-product prompt');
  return m[1];
})();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const cleanOCRQuery = (raw: string): string => {
  let q = raw.replace(/\d+[\.,]?\d*\s*(g|kg|mg|ml|l|cl|oz|fl\.?\s*oz|lb|lbs|liter|litre|%)\b/gi, ' ')
    .replace(/\b\d+\b/g, ' ').replace(/\s+/g, ' ').trim();
  const seen = new Set<string>();
  q = q.split(' ').filter((w) => { const lo = w.toLowerCase(); if (seen.has(lo)) return false; seen.add(lo); return true; }).join(' ');
  return q;
};
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

async function scanDirect(b64: string) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: [
          { type: 'text', text: SCAN_PROMPT },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}`, detail: 'low' } },
        ] }], max_tokens: 60 }),
      });
      const d = await r.json();
      const raw: string = d.choices?.[0]?.message?.content || '';
      if (!raw && d.error) { await sleep(2000); continue; }
      const get = (re: RegExp) => { const m = raw.match(re); return m ? m[1].trim() : ''; };
      const isUnknown = (s: string) => !s || /^(unknown|none|n\/a)$/i.test(s);
      return { brandOnly: isUnknown(get(/Brand:\s*(.+)/i)) ? '' : get(/Brand:\s*(.+)/i),
               prodOnly: isUnknown(get(/Product:\s*(.+)/i)) ? '' : get(/Product:\s*(.+)/i) };
    } catch { await sleep(1500); }
  }
  return { brandOnly: '', prodOnly: '' };
}

interface OffCand { productName: string | null; brand: string | null; barcode: string }
async function searchOff(query: string): Promise<OffCand[]> {
  for (let i = 0; i < 5; i++) {
    try {
      const r = await fetch(`${BACKEND}/api/openfoodfacts/search`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 20 }),
      });
      if (r.status === 429) { await sleep(3000); continue; }
      if (!r.ok) return [];
      const d = await r.json();
      return (d.products || d.results || []).map((p: Record<string, unknown>): OffCand => ({
        productName: (p.product_name as string) || (p.product_name_en as string) || null,
        brand: (p.brands as string) || null,
        barcode: (p.code as string) || (p.barcode as string) || '',
      }));
    } catch { await sleep(1500); }
  }
  return [];
}

/** Strong (>=4 char, non-stopword, non-parent) identity tokens of a brand string. */
const strongTokens = (brand: string): string[] =>
  tokenize(brand).filter((t) => t.length >= 4 && classifyToken(t, DEFAULT_CONFIG) !== 'stop' && !DEFAULT_CONFIG.brandTokens.has(normalize(t)));
/** Does `text` carry any strong token of `brand`? */
const shareBrand = (brand: string, text: string): boolean => {
  const want = strongTokens(brand);
  if (want.length === 0) { // fall back to any >=3 token
    const any = tokenize(brand).filter((t) => t.length >= 3);
    const hay = new Set(tokenize(text));
    return any.some((t) => hay.has(t));
  }
  const hay = new Set(tokenize(text));
  return want.some((t) => hay.has(t));
};

interface Manifest { slug: string; category: string; code: string; name: string; brand: string }

describe.skipIf(!process.env.RUN_LIVE)('100-product scan battery', () => {
  it('runs the battery', async () => {
    const manifest: Manifest[] = JSON.parse(await readFile(`${DIR}/manifest.json`, 'utf8'));
    const rows: string[] = [];
    const tally = { exact: 0, sameBrand: 0, wrongBrand: 0, ocrMiss: 0, notFound: 0, ocrBlank: 0 };

    for (let i = 0; i < manifest.length; i++) {
      const gt = manifest[i];
      let b64: string;
      try { b64 = (await readFile(`${DIR}/${gt.slug}.jpg`)).toString('base64'); } catch { continue; }

      const id = await scanDirect(b64);
      if (!id.brandOnly && !id.prodOnly) tally.ocrBlank++;
      const rawQuery = [id.brandOnly, id.prodOnly].filter(Boolean).join(' ');
      // Production guard: an unreadable brand (blank / non-Latin) gives the matcher
      // nothing to anchor on, so we refuse to auto-match and prompt manual entry.
      const queries = rawQuery && hasUsableBrandAnchor(id.brandOnly)
        ? buildSearchQueries(id.brandOnly, id.prodOnly) : [];

      let resolved: OffCand | null = null;
      for (const q of queries) {
        const results = await searchOff(q);
        await sleep(150);
        if (results.length === 0) continue;
        const m = pickBestMatch(results, rawQuery, q, undefined, id.brandOnly || undefined);
        if (m.passedRelevanceGate && m.product) { resolved = m.product; break; }
      }

      const gtText = `${gt.name} ${gt.brand}`;
      let verdict: string;
      if (!resolved) { verdict = '🔶 not-found'; tally.notFound++; }
      else {
        const rText = `${resolved.productName ?? ''} ${resolved.brand ?? ''}`;
        if (resolved.barcode && resolved.barcode === gt.code) { verdict = '✅ EXACT'; tally.exact++; }
        else if (shareBrand(gt.brand, rText)) { verdict = '✅ same-brand'; tally.sameBrand++; }
        else if (id.brandOnly && shareBrand(id.brandOnly, rText)) {
          // Result matches what OCR *read*, but OCR read differs from the package
          // brand → an OCR misread, NOT a matcher drift.
          verdict = '⚠️ ocr-misread'; tally.ocrMiss++;
        } else { verdict = '❌ WRONG-BRAND'; tally.wrongBrand++; }
      }

      const line = `${verdict.padEnd(16)} [${gt.category}] pkg="${gt.brand} / ${gt.name}"  ocr="${id.brandOnly} / ${id.prodOnly}"  → ${resolved ? `"${resolved.productName}" (${resolved.brand}) [${resolved.barcode}]` : '—'}`;
      rows.push(line);
      console.log(`${String(i + 1).padStart(3)}/${manifest.length} ${line}`);
    }

    const total = manifest.length;
    const summary = [
      '', '════════════ 100-PRODUCT BATTERY SUMMARY ════════════',
      `total products:        ${total}`,
      `✅ exact barcode:      ${tally.exact}`,
      `✅ same brand:         ${tally.sameBrand}`,
      `⚠️ OCR misread:        ${tally.ocrMiss}  (resolved to what OCR read; OCR ≠ package — not a matcher bug)`,
      `🔶 not found:          ${tally.notFound}  (safe — prompts manual entry)`,
      `❌ WRONG-BRAND drift:  ${tally.wrongBrand}   ← the bug; must be ~0`,
      `   (ocr blank reads:   ${tally.ocrBlank})`,
      '',
      `brand-correct of resolved: ${tally.exact + tally.sameBrand}/${tally.exact + tally.sameBrand + tally.wrongBrand + tally.ocrMiss}`,
    ];
    for (const s of summary) console.log(s);
    await writeFile(`${DIR}/report.txt`, [...rows, ...summary].join('\n'));
  }, 1_800_000);
});
