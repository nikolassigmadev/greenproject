// Sources front-of-pack images for HARD cases via the app's OWN search endpoint
// (server multi-strategy OFF search). Prints each sourced product so we can
// confirm it's the intended flavor before scanning. -> /tmp/scan_tests
import { writeFile, mkdir } from 'node:fs/promises';
const BACKEND = process.env.BACKEND || 'http://localhost:3001';
const UA = { 'User-Agent': 'scan-hardtest/1.0' };
await mkdir('/tmp/scan_tests', { recursive: true });

const SEARCHES = [
  ['doritos_coolranch',   'Doritos Cool Ranch'],
  ['doritos_tangycheese', 'Doritos Tangy Cheese'],
  ['lays_saltvinegar',    'Lays Salt and Vinegar'],
  ['walkers_cheeseonion', 'Walkers Cheese and Onion'],
  ['pringles_sourcream',  'Pringles Sour Cream Onion'],
  ['pringles_paprika',    'Pringles Paprika'],
  ['benjerry_phishfood',  'Ben Jerrys Phish Food'],
  ['benjerry_halfbaked',  'Ben Jerrys Half Baked'],
  ['cadbury_fruitnut',    'Cadbury Dairy Milk Fruit and Nut'],
  ['cadbury_caramel',     'Cadbury Dairy Milk Caramel'],
  ['kitkat_chunky',       'KitKat Chunky'],
  ['haribo_tangfastics',  'Haribo Tangfastics'],
  ['tonys_caramelseasalt','Tonys Chocolonely Caramel Sea Salt'],
  ['oreo_golden',         'Oreo Golden'],
  ['magnum_almond',       'Magnum Almond'],
  ['poptarts_strawberry', 'Pop Tarts Frosted Strawberry'],
  ['twix_white',          'Twix White'],
  ['alpro_oatmilk',       'Alpro Oat'],
  ['monster_mango',       'Monster Mango Loco'],
  ['kinder_bueno',        'Kinder Bueno White'],
];

async function imgFor(term) {
  const r = await fetch(`${BACKEND}/api/openfoodfacts/search`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: term, limit: 8 }),
  });
  const d = await r.json();
  const products = d.products || d.results || [];
  const hit = products.find(p => (p.image_front_url || p.image_url) && (p.product_name || p.product_name_en));
  return hit ? { url: hit.image_front_url || hit.image_url, name: hit.product_name || hit.product_name_en, brand: hit.brands } : null;
}
async function save(name, url) {
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`img HTTP ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 2500) throw new Error('placeholder');
  await writeFile(`/tmp/scan_tests/${name}.jpg`, buf);
  return buf.length;
}
for (const [slug, term] of SEARCHES) {
  try {
    const hit = await imgFor(term);
    if (!hit) { console.log(`x  ${slug}: no result`); continue; }
    const kb = (await save(slug, hit.url) / 1024).toFixed(0);
    console.log(`ok ${slug.padEnd(22)} ${kb.padStart(3)}KB  src="${hit.name}" (${hit.brand || '?'})`);
    await new Promise(r => setTimeout(r, 2200)); // stay under 30/min search limit
  } catch (e) { console.log(`x  ${slug}: ${e.message}`); }
}
