/** Repro for the KitKat Chocolate Drink parent-brand drift. */
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

async function runPipeline(brandOnly: string, prodOnly: string) {
  const rawQuery = [brandOnly, prodOnly].filter(Boolean).join(' ');
  console.log(`\n▶ brand="${brandOnly}" product="${prodOnly}"`);
  if (!hasUsableBrandAnchor(brandOnly)) { console.log('  ⛔ no usable brand anchor → NOT-FOUND'); return; }
  for (const q of buildQueries(brandOnly, prodOnly)) {
    const res = await searchOff(q); await sleep(200);
    const m = pickBestMatch(res, rawQuery, q, undefined, brandOnly || undefined);
    const top = res.slice(0, 3).map((r) => `"${r.productName}"(${r.brand})`).join(', ');
    if (m.passedRelevanceGate && m.product) { console.log(`  ✓ q="${q}" → RESOLVED "${m.product.productName}" (${m.product.brand}) [${m.product.barcode}] conf=${m.confidence.toFixed(2)}`); return; }
    console.log(`  · q="${q}" → ${res.length} hits [${top}] no-pass`);
  }
  console.log('  → NOT-FOUND');
}

describe.skipIf(!process.env.RUN_LIVE)('KitKat Chocolate Drink', () => {
  it('scans the real can image', async () => {
    const b64 = (await readFile('/tmp/scan_tests/kitkat_drink.jpg')).toString('base64');
    const id = await scan(b64);
    console.log(`OCR → brand="${id.brandOnly}" product="${id.prodOnly}"`);
    await runPipeline(id.brandOnly, id.prodOnly);
  }, 60000);

  it('also tests the parent-brand misread the user hit (brand="Nestlé")', async () => {
    await runPipeline('Nestlé', 'Chocolate Drink');
  }, 60000);
});
