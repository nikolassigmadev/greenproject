// Bulk-sources ~100 COMPLICATED real products across grocery categories from
// Open Food Facts (mid-popularity pages = niche/multilingual/variant-heavy).
// Downloads images to /tmp/scan_tests/bulk and writes manifest.json with
// ground-truth {name, brand, code, category}.  Run: node scripts/fetch-bulk-scan-images.mjs
import { writeFile, mkdir } from 'node:fs/promises';
const UA = { 'User-Agent': 'scan-bulk/1.0 (ethical-shopper test)' };
const DIR = '/tmp/scan_tests/bulk';
await mkdir(DIR, { recursive: true });

const CATEGORIES = [
  'energy-drinks','beers','wines','sodas','fruit-juices','waters','breakfast-cereals',
  'biscuits','chocolates','candies','crisps','ice-creams','yogurts','cheeses',
  'plant-based-beverages','baby-foods','dietary-supplements','sauces','coffees','teas',
  'spreads','frozen-desserts','breads','pastas','canned-vegetables','chewing-gum',
  'honeys','jams','cereal-bars','condiments','snacks','nuts',
];
const PER_CAT = 4;

async function getJSON(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(20000) });
      const t = await r.text();
      if (t.startsWith('<')) throw new Error('cloudflare-html');
      return JSON.parse(t);
    } catch (e) { if (i === tries - 1) throw e; await new Promise(r => setTimeout(r, 1500 * (i + 1))); }
  }
}
async function dl(url) {
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`img ${r.status}`);
  const b = Buffer.from(await r.arrayBuffer());
  if (b.length < 3000) throw new Error('tiny');
  return b;
}

const manifest = [];
let n = 0;
for (const cat of CATEGORIES) {
  let got = 0;
  for (const page of [2, 3, 4]) {
    if (got >= PER_CAT) break;
    const params = new URLSearchParams({ categories_tags_en: cat, fields: 'code,product_name,brands,image_front_url', sort_by: 'unique_scans_n', page_size: '15', page: String(page) });
    let d;
    try { d = await getJSON(`https://world.openfoodfacts.org/api/v2/search?${params}`); }
    catch (e) { console.log(`! ${cat} p${page}: ${e.message}`); continue; }
    for (const p of (d.products || [])) {
      if (got >= PER_CAT) break;
      if (!p.image_front_url || !(p.product_name || '').trim() || !(p.brands || '').trim()) continue;
      if ((p.product_name || '').length < 3) continue;
      const slug = `b${String(++n).padStart(3, '0')}`;
      try {
        const buf = await dl(p.image_front_url);
        await writeFile(`${DIR}/${slug}.jpg`, buf);
        manifest.push({ slug, category: cat, code: p.code, name: p.product_name, brand: p.brands });
        got++;
        console.log(`ok ${slug} [${cat}] "${p.product_name}" (${p.brands})`);
      } catch (e) { n--; console.log(`x  ${cat}: ${e.message}`); }
      await new Promise(r => setTimeout(r, 250));
    }
    await new Promise(r => setTimeout(r, 400));
  }
}
await writeFile(`${DIR}/manifest.json`, JSON.stringify(manifest, null, 2));
console.log(`\nTOTAL: ${manifest.length} products across ${new Set(manifest.map(m=>m.category)).size} categories`);
