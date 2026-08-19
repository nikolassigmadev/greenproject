#!/usr/bin/env node
/**
 * Build a corpus of ~1,000 genuinely RANDOM real Open Food Facts products, so
 * the verdict pipeline can be simulated against the long tail rather than the
 * brands the app already knows about.
 *
 * Randomness comes from three stacked sources:
 *   1. a wide pool of seed queries (many languages, many aisles, bare letters),
 *   2. a random page inside each query's result set,
 *   3. the shuffle applied before the enrichment pass.
 *
 * Two phases, both using endpoints the app itself uses:
 *   1. Search-a-licious (`search.openfoodfacts.org`) — the app's primary search
 *      backend. Returns a rich record per hit; mapped through the same
 *      array→string conversion the app's fromSaliciousHit() does.
 *   2. The v2 product API — the endpoint lookupBarcode() calls on a real scan,
 *      with the same `fields` list. Adds ingredients_text (absent from the
 *      search index) and confirms the product is still live.
 *
 * Open Food Facts rate-limits product reads (~100/min) and search harder
 * (~10/min). Both phases are paced accordingly and back off on 429 — an
 * impolite version of this script got 90% of its lookups rejected.
 *
 * Output: data/random-scan-corpus.json  (gitignored — /data/ is)
 * Usage:  node scripts/fetch-random-scan-corpus.mjs [count] [--seed=N] [--no-enrich]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../data/random-scan-corpus.json");

const TARGET = Number(process.argv[2]) || 1000;
const SEED = Number((process.argv.find(a => a.startsWith("--seed=")) || "--seed=20260819").split("=")[1]);
const ENRICH = !process.argv.includes("--no-enrich");

const UA = "goodscan-verdict-audit/1.0 (offline QA harness; nikolasnikolas474@gmail.com)";
const SEARCH_BASE = "https://search.openfoodfacts.org";
const API_BASE = "https://world.openfoodfacts.org";

// Pacing (ms between requests). Search is limited far harder than product reads.
const SEARCH_DELAY = 3_000;
const PRODUCT_DELAY = 700;

// Byte-for-byte the field list in src/services/openfoodfacts/index.ts.
const FIELDS =
  "code,product_name,product_name_en,generic_name,generic_name_en,abbreviated_product_name,brands," +
  "ecoscore_grade,ecoscore_score,ecoscore_data,nutriscore_grade,nutriscore_score,nova_group,nutriments," +
  "labels_tags,labels,categories_tags,categories,origins,ingredients_text,ingredients_text_en," +
  "ingredients_analysis_tags,allergens_tags,traces_tags,image_front_url,image_url,countries_tags,states_tags";

// The same fields, as the search index names them.
const SEARCH_FIELDS =
  "code,product_name,generic_name,brands,ecoscore_grade,ecoscore_score,ecoscore_data,nutriscore_grade," +
  "nutriscore_score,nova_group,nutriments,labels_tags,categories_tags,origins_tags,ingredients_analysis_tags," +
  "allergens_tags,traces_tags,image_front_url,image_url,countries_tags,states_tags";

// ── deterministic PRNG so a run is reproducible from its seed ────────────────
let state = SEED >>> 0;
const rand = () => {
  state = (state * 1664525 + 1013904223) >>> 0;
  return state / 0x100000000;
};
const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Deliberately scattershot: aisles nobody tests, non-English words, bare
// letters that match whatever the index feels like returning.
const SEED_QUERIES = [
  "milk", "bread", "rice", "pasta", "yogurt", "cheese", "butter", "eggs", "beans", "flour",
  "cereal", "coffee", "tea", "juice", "water", "soda", "beer", "wine", "chips", "cookies",
  "chocolate", "candy", "ice cream", "frozen pizza", "soup", "sauce", "ketchup", "mustard",
  "mayonnaise", "vinegar", "olive oil", "sugar", "salt", "pepper", "honey", "jam", "peanut butter",
  "chicken", "beef", "pork", "sausage", "bacon", "tuna", "salmon", "shrimp", "tofu", "seitan",
  "apple", "banana", "tomato", "potato", "onion", "spinach", "mushroom", "avocado",
  "baby food", "pet food", "protein powder", "energy drink", "kombucha", "pickles", "seaweed",
  "instant noodles", "crackers", "granola", "syrup", "gelatin", "baking powder", "yeast",
  "coconut milk", "curry paste", "hummus", "falafel", "kimchi", "miso", "tahini", "harissa",
  "biltong", "marzipan", "halva", "mochi", "wafer", "cider", "gin", "rum",
  "leche", "pan", "queso", "galletas", "aceite", "arroz",
  "lait", "fromage", "biscuit", "chocolat", "confiture", "jambon",
  "milch", "brot", "käse", "wurst", "nudeln", "saft",
  "latte", "formaggio", "biscotti", "olio",
  "leite", "feijão", "мука", "молоко", "сок",
  "牛奶", "饼干", "巧克力", "うどん", "味噌", "醤油", "شاي", "زيت", "أرز",
  "bio", "org", "mix", "pack", "extra", "classic", "original",
  "premium", "light", "zero", "fresh", "natural", "deluxe", "value", "family",
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** GET with 429-aware backoff. Returns parsed JSON or null. */
async function getJson(url, { tries = 4 } = {}) {
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(25_000),
      });
      if (res.status === 429 || res.status === 503) {
        await sleep(5_000 * attempt);
        continue;
      }
      if (!res.ok) return null;
      const text = await res.text();
      if (text.trimStart().startsWith("<")) {
        await sleep(3_000 * attempt);
        continue;
      }
      return JSON.parse(text);
    } catch {
      if (attempt === tries) return null;
      await sleep(1_500 * attempt);
    }
  }
  return null;
}

const joinIfArray = v => (Array.isArray(v) ? v.join(", ") : v);

/** Mirror of fromSaliciousHit() in src/services/openfoodfacts/index.ts. */
const fromSearchHit = hit => ({
  ...hit,
  brands: joinIfArray(hit.brands),
  labels: joinIfArray(hit.labels),
  categories: joinIfArray(hit.categories),
  origins: joinIfArray(hit.origins ?? hit.origins_tags),
});

/** Phase 1 — harvest random products straight out of the search index. */
async function harvest(target) {
  const byCode = new Map();
  const queries = shuffle(SEED_QUERIES);
  let qi = 0;
  let misses = 0;

  while (byCode.size < target && misses < 12 && qi < queries.length * 2) {
    const q = queries[qi % queries.length];
    qi++;
    const page = 1 + Math.floor(rand() * 25);
    const url =
      `${SEARCH_BASE}/search?q=${encodeURIComponent(q)}&page_size=50&page=${page}` +
      `&fields=${SEARCH_FIELDS}`;
    const data = await getJson(url);
    const hits = data?.hits ?? [];
    if (hits.length === 0) misses++;
    else {
      misses = 0;
      for (const h of hits) if (h.code && !byCode.has(h.code)) byCode.set(String(h.code), fromSearchHit(h));
    }
    process.stdout.write(`\r  [search] ${byCode.size}/${target} products (q="${q}" p${page})            `);
    await sleep(SEARCH_DELAY);
  }
  process.stdout.write("\n");
  return byCode;
}

/** Phase 2 — replace each record with the exact payload a scan would fetch. */
async function enrich(byCode) {
  const codes = shuffle([...byCode.keys()]);
  let upgraded = 0;
  let failed = 0;
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    const data = await getJson(`${API_BASE}/api/v2/product/${code}?fields=${FIELDS}`, { tries: 3 });
    if (data?.status === 1 && data.product) {
      byCode.set(code, data.product);
      upgraded++;
    } else {
      failed++;
    }
    if (i % 20 === 0) {
      process.stdout.write(`\r  [product API] ${upgraded} upgraded, ${failed} kept as search records (${i}/${codes.length})   `);
    }
    // Back off hard if the API starts refusing us outright.
    if (failed > 40 && upgraded === 0) {
      process.stdout.write("\n  [product API] refusing us — keeping search records\n");
      return;
    }
    await sleep(PRODUCT_DELAY);
  }
  process.stdout.write(`\r  [product API] ${upgraded} upgraded, ${failed} kept as search records.                 \n`);
}

(async () => {
  console.log(`Building random scan corpus: target ${TARGET}, seed ${SEED}, enrich=${ENRICH}`);
  const byCode = await harvest(TARGET);
  if (byCode.size === 0) {
    console.error("No products harvested — the search API is unreachable.");
    process.exit(1);
  }
  if (ENRICH) await enrich(byCode);

  const products = [...byCode.values()].slice(0, TARGET);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(
    OUT,
    JSON.stringify({ seed: SEED, fetchedAt: new Date().toISOString(), count: products.length, products }),
  );
  const mb = (fs.statSync(OUT).size / 1e6).toFixed(1);
  console.log(`Wrote ${products.length} products → ${path.relative(process.cwd(), OUT)} (${mb} MB)`);
})();
