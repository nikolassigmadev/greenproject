#!/usr/bin/env node
// What is actually sold in a market, per category, according to Open Food Facts.
//
// The catalogue used to be built from recall — which is how a shopper in
// Denpasar got offered a Colorado micro-roaster at Indomaret. This grounds it in
// data instead: every brand it prints has real products, with real barcodes,
// tagged as sold in that country. If OFF doesn't have it, we don't claim it.
//
// Polite by design: one request at a time, a pause between them, and retries on
// the intermittent HTML error pages OFF returns under load. This hits a
// volunteer-run service on our behalf, so it behaves like a guest.
//
// Usage:
//   node scripts/market-research.mjs ID coffees chocolates
//   node scripts/market-research.mjs US coffees --json > us-coffee.json

const COUNTRY_NAMES = {
  ID: 'indonesia', US: 'united-states', GB: 'united-kingdom', FR: 'france',
  DE: 'germany', AU: 'australia', NL: 'netherlands', CA: 'canada',
};

const [, , codeArg, ...rest] = process.argv;
const JSON_OUT = rest.includes('--json');
const categories = rest.filter((a) => !a.startsWith('--'));
const code = (codeArg || 'ID').toUpperCase();
const country = COUNTRY_NAMES[code];

if (!country) {
  console.error(`Unknown market "${code}". Known: ${Object.keys(COUNTRY_NAMES).join(', ')}`);
  process.exit(1);
}
if (categories.length === 0) {
  console.error('Give at least one Open Food Facts category, e.g. coffees chocolates teas');
  process.exit(1);
}

const UA = { 'User-Agent': 'GoodScan/1.0 (market research; contact@goodscan.shop)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchCategory(cat, attempt = 0) {
  const url =
    'https://world.openfoodfacts.org/api/v2/search' +
    `?countries_tags_en=${country}` +
    `&categories_tags_en=${encodeURIComponent(cat)}` +
    '&fields=code,product_name,brands,categories_tags,ecoscore_grade,nutriscore_grade,stores_tags' +
    '&page_size=100&sort_by=popularity_key';
  try {
    const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(45000) });
    const text = await res.text();
    // OFF returns an HTML error page rather than a JSON error when it's busy.
    if (!text.trimStart().startsWith('{')) throw new Error(`non-JSON response (HTTP ${res.status})`);
    return JSON.parse(text);
  } catch (e) {
    if (attempt < 3) {
      await sleep(2000 * (attempt + 1));
      return fetchCategory(cat, attempt + 1);
    }
    throw e;
  }
}

/** Group a category's products by brand, so the output is a shortlist not a dump. */
function byBrand(products) {
  const brands = new Map();
  for (const p of products) {
    if (!p.brands || !p.product_name) continue;
    // OFF brands is a comma list; the first entry is the consumer-facing one.
    const brand = String(p.brands).split(',')[0].trim();
    if (!brand) continue;
    const key = brand.toLowerCase();
    const entry = brands.get(key) ?? { brand, count: 0, examples: [], stores: new Set() };
    entry.count++;
    if (entry.examples.length < 3) {
      entry.examples.push({ name: p.product_name, code: p.code, eco: p.ecoscore_grade ?? null });
    }
    for (const s of p.stores_tags ?? []) entry.stores.add(s);
    brands.set(key, entry);
  }
  return [...brands.values()]
    .map((b) => ({ ...b, stores: [...b.stores] }))
    .sort((a, b) => b.count - a.count);
}

const out = {};
for (const cat of categories) {
  process.stderr.write(`fetching ${code}/${cat}… `);
  try {
    const data = await fetchCategory(cat);
    const products = data.products ?? [];
    const brands = byBrand(products);
    out[cat] = { total: data.count ?? products.length, sampled: products.length, brands };
    process.stderr.write(`${products.length} products, ${brands.length} brands\n`);
  } catch (e) {
    out[cat] = { error: e.message };
    process.stderr.write(`FAILED (${e.message})\n`);
  }
  await sleep(1200); // be a guest, not a load test
}

if (JSON_OUT) {
  console.log(JSON.stringify({ market: code, categories: out }, null, 2));
} else {
  for (const [cat, res] of Object.entries(out)) {
    if (res.error) { console.log(`\n=== ${code} / ${cat} — FAILED: ${res.error}`); continue; }
    console.log(`\n=== ${code} / ${cat} — ${res.total} in OFF, ${res.sampled} sampled, ${res.brands.length} brands`);
    for (const b of res.brands.slice(0, 14)) {
      const eco = b.examples.map((e) => e.eco).filter(Boolean)[0] ?? '—';
      console.log(
        `  ${String(b.count).padStart(3)}x  ${b.brand.slice(0, 26).padEnd(28)}` +
        ` eco=${String(eco).padEnd(8)} ${b.examples[0].code}  ${b.examples[0].name.slice(0, 34)}` +
        (b.stores.length ? `  [stores: ${b.stores.slice(0, 3).join(',')}]` : ''),
      );
    }
  }
}
