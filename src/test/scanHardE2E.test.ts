/**
 * HARD live scan harness (manual, not CI) — niche brands + specific flavor
 * variants, where wrong-flavor / wrong-brand drift is most likely.
 *
 * Faithful to production: the `scan-product` prompt is read verbatim from
 * server.js and sent to gpt-4o-mini at detail:'low' (same as the backend). The
 * OFF search + relevance gate (pickBestMatch) are the real app code. We call
 * OpenAI directly only to bypass the server's 10/min limiter for volume.
 *
 * Setup: node scripts/fetch-hard-scan-images.mjs   (needs the server running)
 * Run:   RUN_LIVE=1 OPENAI_API_KEY=sk-... BACKEND=http://localhost:3001 \
 *          npx vitest run src/test/scanHardE2E.test.ts
 */
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import { pickBestMatch } from '@/utils/productRelevance';

const BACKEND = process.env.BACKEND || 'http://localhost:3001';
const IMG_DIR = process.env.IMG_DIR || '/tmp/scan_tests';
const KEY = process.env.OPENAI_API_KEY || '';

// Read the production scan-product prompt verbatim so the test can't drift.
const SCAN_PROMPT = (() => {
  const s = readFileSync(`${process.cwd()}/server.js`, 'utf8');
  const m = s.match(/'scan-product':\s*`([\s\S]*?)`,/);
  if (!m) throw new Error('could not extract scan-product prompt from server.js');
  return m[1];
})();

const cleanOCRQuery = (raw: string): string => {
  let q = raw
    .replace(/\d+[\.,]?\d*\s*(g|kg|mg|ml|l|cl|oz|fl\.?\s*oz|lb|lbs|liter|litre|%)\b/gi, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

async function scanProductDirect(b64: string) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: [
        { type: 'text', text: SCAN_PROMPT },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}`, detail: 'low' } },
      ] }],
      max_tokens: 60,
    }),
  });
  const d = await r.json();
  const raw: string = d.choices?.[0]?.message?.content || '';
  const get = (re: RegExp) => { const m = raw.match(re); return m ? m[1].trim() : ''; };
  const isUnknown = (s: string) => !s || /^(unknown|none)$/i.test(s);
  const brand = get(/Brand:\s*(.+)/i);
  const product = get(/Product:\s*(.+)/i);
  return { raw: raw.replace(/\n/g, ' | '), brandOnly: isUnknown(brand) ? '' : brand, prodOnly: isUnknown(product) ? '' : product };
}

interface OffCand { productName: string | null; brand: string | null; barcode: string }
async function searchOff(query: string): Promise<OffCand[]> {
  const r = await fetch(`${BACKEND}/api/openfoodfacts/search`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit: 20 }),
  });
  if (!r.ok) return [];
  const d = await r.json();
  return (d.products || d.results || []).map((p: Record<string, unknown>): OffCand => ({
    productName: (p.product_name as string) || (p.product_name_en as string) || null,
    brand: (p.brands as string) || null,
    barcode: (p.code as string) || (p.barcode as string) || '',
  }));
}

// file, expected brand regex, expected flavor regex (the hard part).
const CASES: Array<{ file: string; brand: string; flavor: string }> = [
  { file: 'doritos_tangycheese',  brand: 'doritos',        flavor: 'tangy|cheese' },
  { file: 'lays_saltvinegar',     brand: 'lay',            flavor: 'vinegar' },
  { file: 'walkers_cheeseonion',  brand: 'walkers',        flavor: 'cheese|onion' },
  { file: 'pringles_sourcream',   brand: 'pringles',       flavor: 'sour cream|onion' },
  { file: 'pringles_paprika',     brand: 'pringles',       flavor: 'paprika' },
  { file: 'benjerry_phishfood',   brand: 'ben|jerry',      flavor: 'phish' },
  { file: 'benjerry_halfbaked',   brand: 'ben|jerry',      flavor: 'half baked|baked' },
  { file: 'cadbury_fruitnut',     brand: 'cadbury',        flavor: 'fruit|nut' },
  { file: 'cadbury_caramel',      brand: 'cadbury',        flavor: 'caramel' },
  { file: 'kitkat_chunky',        brand: 'kitkat|kit kat', flavor: 'chunky' },
  { file: 'haribo_tangfastics',   brand: 'haribo',         flavor: 'tangfastic' },
  { file: 'tonys_caramelseasalt', brand: 'tony',           flavor: 'caramel|sea salt' },
  { file: 'oreo_golden',          brand: 'oreo',           flavor: 'golden' },
  { file: 'magnum_almond',        brand: 'magnum',         flavor: 'almond' },
  { file: 'poptarts_strawberry',  brand: 'pop.?tart',      flavor: 'strawberry' },
  { file: 'twix_white',           brand: 'twix',           flavor: 'white' },
  { file: 'alpro_oatmilk',        brand: 'alpro',          flavor: 'oat' },
  { file: 'monster_mango',        brand: 'monster',        flavor: 'mango' },
  { file: 'kinder_bueno',         brand: 'kinder|ferrero', flavor: 'white|bueno' },
  // The two REAL culprits from the user's bug report / ai_scans log. These are
  // niche US snacks often absent from OFF. PASS = correct brand OR honest
  // "not found". A wrong brand (Movies pop / Organix Kids) is the bug and FAILS.
  { file: 'grandpapas_pizzapuffs', brand: 'grandpapa',     flavor: 'pizza|puff' },
  { file: 'cookiepop_oreo',        brand: 'cookie ?pop',   flavor: 'oreo|popcorn' },
];

const summary: string[] = [];

describe.skipIf(!process.env.RUN_LIVE)('HARD scan E2E (niche + flavors)', () => {
  for (const c of CASES) {
    it(`scans ${c.file}`, async () => {
      let b64: string;
      try { b64 = (await readFile(`${IMG_DIR}/${c.file}.jpg`)).toString('base64'); }
      catch { console.log(`SKIP ${c.file} (no image)`); summary.push(`⚠️  ${c.file.padEnd(22)} no image`); return; }

      const id = await scanProductDirect(b64);
      const rawQuery = [id.brandOnly, id.prodOnly].filter(Boolean).join(' ');
      const queries = buildSearchQueries(id.brandOnly, id.prodOnly);

      console.log(`\n━━━ ${c.file} ━━━`);
      console.log(`OpenAI →  Brand: "${id.brandOnly}"  Product: "${id.prodOnly}"`);

      let resolved: OffCand | null = null;
      let via = '';
      for (const q of queries) {
        const results = await searchOff(q);
        if (results.length === 0) { console.log(`  · "${q}" → 0`); continue; }
        const m = pickBestMatch(results, rawQuery, q, undefined, id.brandOnly || undefined);
        if (m.passedRelevanceGate && m.product) {
          resolved = m.product; via = q;
          console.log(`  ✓ "${q}" → "${m.product.productName}" by ${m.product.brand} [${m.product.barcode}] conf=${m.confidence.toFixed(2)}`);
          break;
        }
        console.log(`  · "${q}" → ${results.length} results, no match${m.brandOnlyFallback ? ' (brand-only rejected)' : ''}`);
      }

      if (!resolved) {
        console.log(`RESULT: NOT FOUND (manual entry)`);
        summary.push(`🔶 ${c.file.padEnd(22)} NOT FOUND  [OCR: ${id.brandOnly} / ${id.prodOnly}]`);
        return;
      }
      const got = `${resolved.productName ?? ''} ${resolved.brand ?? ''}`.toLowerCase();
      const brandOk = new RegExp(c.brand).test(got);
      const flavorOk = new RegExp(c.flavor).test(got);
      const tag = brandOk && flavorOk ? '✅ brand+flavor' : brandOk ? '🟡 brand ok / FLAVOR WRONG' : '❌ WRONG BRAND';
      console.log(`RESULT: ${tag} — "${resolved.productName}" by "${resolved.brand}" via "${via}"`);
      summary.push(`${brandOk && flavorOk ? '✅' : brandOk ? '🟡' : '❌'} ${c.file.padEnd(22)} ${tag.replace(/^[^ ]+ /, '')} → "${resolved.productName}" (${resolved.brand})`);
    }, 45000);
  }

  it('zzz prints summary', () => {
    console.log('\n\n══════════ HARD SCAN SUMMARY ══════════');
    for (const line of summary) console.log(line);
    const ok = summary.filter((s) => s.startsWith('✅')).length;
    const flavor = summary.filter((s) => s.startsWith('🟡')).length;
    const brandBad = summary.filter((s) => s.startsWith('❌')).length;
    const notFound = summary.filter((s) => s.startsWith('🔶')).length;
    console.log(`\nbrand+flavor: ${ok}   flavor-wrong: ${flavor}   WRONG-BRAND: ${brandBad}   not-found: ${notFound}   (of ${summary.length})`);
  });
});
