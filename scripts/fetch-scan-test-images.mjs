// Downloads real product front-of-pack images into /tmp/scan_tests for the
// live scan harness (src/test/scanLiveE2E.test.ts). Run: node scripts/fetch-scan-test-images.mjs
import { writeFile } from 'node:fs/promises';
const UA = { 'User-Agent': 'scan-test/1.0' };
// Curated: known products with stable front images. We assert the scan resolves
// to the correct BRAND (the bug was wrong-brand drift).
const direct = [
  ['nutella',        'Ferrero',     'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_en.879.400.jpg'],
  ['cocacola_zero',  'Coca-Cola',   'https://images.openfoodfacts.org/images/products/544/900/013/1805/front_en.687.400.jpg'],
  ['heinz_ketchup',  'Heinz',       'https://images.openfoodfacts.org/images/products/871/570/011/0622/front_fr.18.400.jpg'],
  ['pringles',       'Pringles',    'https://images.openfoodfacts.org/images/products/505/399/010/1481/front_fr.7.400.jpg'],
];
// Search-sourced: pull the first result image for a named product to test fresh OCR.
const searches = [
  ['lays_chips',     'Lay', "Lay's Classic"],
  ['oreo_cookies',   'Oreo', 'Oreo Original'],
  ['pepsi_max',      'Pepsi', 'Pepsi Max'],
  ['doritos',        'Doritos', 'Doritos Nacho Cheese'],
];
async function save(name, url) {
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(20000) });
  if (!r.ok) { console.log(`✗ ${name}: HTTP ${r.status}`); return false; }
  const buf = Buffer.from(await r.arrayBuffer());
  await writeFile(`/tmp/scan_tests/${name}.jpg`, buf);
  console.log(`✓ ${name}: ${(buf.length/1024).toFixed(0)}KB`);
  return true;
}
for (const [name, , url] of direct) { try { await save(name, url); } catch(e){ console.log(`✗ ${name}: ${e.message}`);} }
for (const [name, , q] of searches) {
  try {
    const params = new URLSearchParams({ search_terms: q, fields: 'product_name,brands,image_front_url', page_size: '5', json: '1' });
    const r = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${params}`, { headers: UA, signal: AbortSignal.timeout(20000) });
    const d = await r.json();
    const hit = (d.products||[]).find(p => p.image_front_url);
    if (hit) { await save(name, hit.image_front_url); console.log(`   ↳ ${name} src: "${hit.product_name}" (${hit.brands})`); }
    else console.log(`✗ ${name}: no image in results`);
  } catch(e){ console.log(`✗ ${name}: ${e.message}`); }
}
