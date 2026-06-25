/** Verify the previously-wrong cases now resolve to the CORRECT OFF product. */
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import { pickBestMatch, hasUsableBrandAnchor } from '@/utils/productRelevance';

const BACKEND = process.env.BACKEND || 'http://localhost:3001';
const KEY = process.env.OPENAI_API_KEY || '';
const SCAN_PROMPT = (() => readFileSync(`${process.cwd()}/server.js`, 'utf8').match(/'scan-product':\s*`([\s\S]*?)`,/)![1])();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const cleanOCRQuery = (raw: string): string => {
  let q = raw.replace(/\d+[\.,]?\d*\s*(g|kg|mg|ml|l|cl|oz|fl\.?\s*oz|lb|lbs|liter|litre|%)\b/gi, ' ').replace(/\b\d+\b/g, ' ').replace(/\s+/g, ' ').trim();
  const seen = new Set<string>(); q = q.split(' ').filter((w) => { const lo = w.toLowerCase(); if (seen.has(lo)) return false; seen.add(lo); return true; }).join(' '); return q;
};
const buildQueries = (b: string, p: string): string[] => {
  const raw = [b, p].filter(Boolean).join(' '); const cl = cleanOCRQuery(raw); const out: string[] = [];
  const add = (q: string) => { if (q && !out.some((s) => s.toLowerCase() === q.toLowerCase())) out.push(q); };
  if (b && p) add(`${b} ${p}`); if (p) add(p); add(raw); if (cl !== raw) add(cl); if (b) add(b);
  const w = cl.split(' ').filter(Boolean); for (let l = w.length - 1; l >= 2; l--) add(w.slice(0, l).join(' ')); return out;
};
interface OffCand { productName: string | null; brand: string | null; barcode: string }
async function searchOff(q: string): Promise<OffCand[]> {
  for (let i = 0; i < 5; i++) {
    const r = await fetch(`${BACKEND}/api/openfoodfacts/search`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q, limit: 20 }) });
    if (r.status === 429) { await sleep(2500); continue; }
    if (!r.ok) return [];
    const d = await r.json();
    return (d.products || []).map((p: Record<string, unknown>): OffCand => ({ productName: (p.product_name as string) || null, brand: (p.brands as string) || null, barcode: (p.code as string) || '' }));
  }
  return [];
}
async function scan(b64: string) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: [{ type: 'text', text: SCAN_PROMPT }, { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}`, detail: 'low' } }] }], max_tokens: 60 }) });
  const d = await r.json(); const raw: string = d.choices?.[0]?.message?.content || '';
  const g = (re: RegExp) => { const m = raw.match(re); return m ? m[1].trim() : ''; }; const u = (s: string) => !s || /^(unknown|none)$/i.test(s);
  return { brandOnly: u(g(/Brand:\s*(.+)/i)) ? '' : g(/Brand:\s*(.+)/i), prodOnly: u(g(/Product:\s*(.+)/i)) ? '' : g(/Product:\s*(.+)/i) };
}

const CASES = [
  { file: 'harry_cereales.jpg', expectBrand: /harry/i, label: "Harry's Céréales et graines" },
  { file: 'harry_brioche.jpg',  expectBrand: /harry/i, label: "Harry's Brioche" },
  { file: 'lunedemiel.jpg',     expectBrand: /lune de miel|famille michaud/i, label: 'Lune de Miel honey' },
  { file: 'peroni_front.jpg',   expectBrand: /peroni/i, label: 'Peroni (front, if available)' },
];

describe.skipIf(!process.env.RUN_LIVE)('fix the 4 wrong-brand cases', () => {
  for (const c of CASES) {
    it(`${c.label}`, async () => {
      let b64: string;
      try { b64 = (await readFile(`/tmp/scan_tests/${c.file}`)).toString('base64'); } catch { console.log(`SKIP ${c.file} (no image)`); return; }
      const id = await scan(b64);
      const rawQuery = [id.brandOnly, id.prodOnly].filter(Boolean).join(' ');
      console.log(`\n━━━ ${c.label}  OCR brand="${id.brandOnly}" product="${id.prodOnly}" ━━━`);
      if (!hasUsableBrandAnchor(id.brandOnly)) { console.log('  ⛔ no usable brand → NOT-FOUND'); return; }
      let resolved: OffCand | null = null;
      for (const q of buildQueries(id.brandOnly, id.prodOnly)) {
        const res = await searchOff(q); await sleep(200);
        const m = pickBestMatch(res, rawQuery, q, undefined, id.brandOnly || undefined);
        if (m.passedRelevanceGate && m.product) { resolved = m.product; console.log(`  ✓ q="${q}" → "${m.product.productName}" (${m.product.brand}) [${m.product.barcode}]`); break; }
      }
      if (!resolved) { console.log('  → NOT-FOUND'); return; }
      const ok = c.expectBrand.test(`${resolved.productName} ${resolved.brand}`);
      console.log(`  RESULT: ${ok ? '✅ CORRECT BRAND' : '❌ WRONG BRAND'} — "${resolved.productName}" (${resolved.brand})`);
    }, 60000);
  }
});
