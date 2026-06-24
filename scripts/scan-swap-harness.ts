/**
 * Scan + Swap test harness.
 *
 * Pulls hundreds of REAL popular products across every catalog category from
 * Open Food Facts (via the local backend proxy), then runs the exact same
 * diagnosis + swap engine the app uses on each one. Reports where the scan
 * path mis-classifies products and where the swap engine has gaps (a flagged
 * product with no usable greener alternative).
 *
 * Run:  VITE_BACKEND_URL=http://localhost:3001 npx vite-node scripts/scan-swap-harness.ts
 */

import { getBackendUrl } from "@/config/backend";
import { browseProducts, searchProducts } from "@/services/openfoodfacts";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import { diagnoseProduct, getSwaps, type SwapResult } from "@/services/swaps";
import {
  detectSwapCategory,
  CATEGORY_LABELS,
  type SwapCategoryKey,
} from "@/data/ethicalAlternatives";
import { writeFileSync } from "node:fs";

// Silence the app modules' verbose console output; keep our own channel.
const out = (...a: unknown[]) => process.stdout.write(a.join(" ") + "\n");
const out_nonl = (s: string) => process.stdout.write(s);
console.log = () => {};
console.warn = () => {};
console.info = () => {};

// OFF browse tag per catalog category. We browse popular real products so the
// test reflects what users actually scan.
const OFF_BROWSE_TAG: Record<SwapCategoryKey, string> = {
  chocolate: "chocolates",
  candy: "candies",
  chips: "crisps",
  cookies: "biscuits",
  spreads: "hazelnut-spreads",
  snack_bars: "cereal-bars",
  cereal: "breakfast-cereals",
  coffee: "coffees",
  tea: "teas",
  soft_drinks: "sodas",
  milk: "milks",
  yogurt: "yogurts",
  cheese: "cheeses",
  ice_cream: "ice-creams",
  eggs: "eggs",
  seafood: "canned-fishes",
  chicken: "chicken",
  bananas: "bananas",
  beef: "beef",
  sugar: "sugars",
  palm_oil: "palm-oils",
  soy: "tofu",
};

/**
 * Raw browse straight from the backend proxy. Unlike the app's browseProducts()
 * we do NOT require a curated front photo here — that filter is for the UI grid;
 * for testing diagnosis + swaps we want full coverage of real popular products,
 * including the eco-blank entries the grid hides.
 */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function rawBrowse(tag: string, n: number): Promise<OpenFoodFactsResult[]> {
  let data: { products?: Record<string, unknown>[] } | null = null;
  // OFF is flaky under load — retry with backoff so a transient empty/5xx
  // doesn't drop a whole category from coverage.
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const resp = await fetch(`${getBackendUrl()}/api/openfoodfacts/browse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: tag, pageSize: n * 2 }),
      });
      if (resp.ok) {
        const j = await resp.json();
        if (Array.isArray(j.products) && j.products.length > 0) { data = j; break; }
      }
    } catch { /* retry */ }
    await sleep(1200 * (attempt + 1));
  }
  const products: Record<string, unknown>[] = Array.isArray(data?.products) ? data!.products! : [];
  return products.slice(0, n).map((p): OpenFoodFactsResult => {
    const cats = (p.categories_tags as string[] | undefined)?.map((c) => c.replace(/^en:/, "").replace(/-/g, " "))
      ?? (typeof p.categories === "string" ? p.categories.split(",").map((c) => c.trim()) : []);
    const grade = (p.ecoscore_grade as string | undefined);
    return {
      found: true,
      barcode: (p.code as string) ?? "0",
      productName: (p.product_name_en as string) || (p.product_name as string) || null,
      brand: (p.brands as string) || null,
      ecoscoreGrade: grade && grade !== "unknown" && grade !== "not-applicable" ? grade : null,
      ecoscoreScore: null, nutriscoreGrade: null, nutriscoreScore: null, novaGroup: null,
      carbonFootprint100g: null, carbonFootprintProduct: null, carbonFootprintServing: null,
      labels: [], categories: cats, origins: null, ingredientsText: null,
      imageUrl: (p.image_front_url as string) || (p.image_url as string) || null,
      ecoscoreData: null,
      rawProduct: p as never,
    };
  });
}

// Iconic mainstream brands that SHOULD trigger an ethics concern. These probe
// the labor / boycott / animal-welfare path (browse only surfaces eco-scored
// products, which mostly exercises the eco path).
const FLAGGED_BRAND_PROBES = [
  "Nestlé Kit Kat", "Cadbury Dairy Milk", "Mars Snickers", "Twix", "Milka chocolate",
  "Ferrero Nutella", "Hershey chocolate", "Toblerone", "Lindt Excellence",
  "Coca-Cola", "Pepsi", "Sprite", "Fanta", "Mountain Dew", "Lipton tea",
  "Lay's chips", "Doritos", "Pringles", "Cheetos", "Walkers crisps",
  "Oreo cookies", "Ritz crackers", "Nescafé coffee", "Nespresso",
  "Häagen-Dazs ice cream", "Ben & Jerry's", "Magnum ice cream",
  "Yoplait yogurt", "Philadelphia cream cheese", "Tyson chicken",
  "Quaker oats", "Nature Valley bar", "Kellogg's Corn Flakes", "Cheerios",
  "Bonduelle", "Chiquita bananas", "Dole bananas",
];

const PER_CATEGORY = 14;       // products browsed per category
const CONCURRENCY = 4;         // parallel pipelines

interface Row {
  source: "browse" | "probe";
  barcode: string;
  brand: string | null;
  productName: string | null;
  ecoGrade: string | null;
  detectedCategory: SwapCategoryKey | null;
  expectedCategory: SwapCategoryKey | null; // for browse rows
  primaryConcern: string | null;
  concernCount: number;
  swapCount: number;
  fixesPrimaryCount: number;
  resolvedSwapCount: number; // swaps that resolved to a live OFF product w/ image
  selfEthical: boolean;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

function analyse(
  product: OpenFoodFactsResult,
  source: "browse" | "probe",
  expectedCategory: SwapCategoryKey | null,
  swap: SwapResult,
): Row {
  const diag = swap.diagnosis;
  return {
    source,
    barcode: product.barcode,
    brand: product.brand,
    productName: product.productName,
    ecoGrade: product.ecoscoreGrade,
    detectedCategory: diag.categoryKey,
    expectedCategory,
    primaryConcern: diag.primary?.type ?? null,
    concernCount: diag.concerns.length,
    swapCount: swap.suggestions.length,
    fixesPrimaryCount: swap.suggestions.filter((s) => s.fixesPrimary).length,
    resolvedSwapCount: swap.suggestions.filter((s) => s.product && s.imageUrl).length,
    selfEthical: diag.selfEthical,
  };
}

async function run() {
  out("Backend:", getBackendUrl());
  const rows: Row[] = [];

  // ── Phase A: browse all categories first (lightweight, spaced) so the heavy
  // swap-resolution phase can't rate-limit OFF and starve later categories.
  out("Phase A — browsing real products per category…");
  const browsed: { key: SwapCategoryKey; products: OpenFoodFactsResult[] }[] = [];
  for (const key of Object.keys(OFF_BROWSE_TAG) as SwapCategoryKey[]) {
    let products: OpenFoodFactsResult[] = [];
    try {
      products = await rawBrowse(OFF_BROWSE_TAG[key], PER_CATEGORY);
    } catch (e) {
      out(`browse ${OFF_BROWSE_TAG[key]} failed:`, e instanceof Error ? e.message : e);
    }
    browsed.push({ key, products });
    out(`  ${CATEGORY_LABELS[key].padEnd(22)} browsed ${products.length}`);
    await sleep(400);
  }

  // Add probe products (by name) to the work list too.
  out("Resolving flagged mainstream brand probes…");
  const probeProducts: OpenFoodFactsResult[] = [];
  for (const name of FLAGGED_BRAND_PROBES) {
    try {
      const r = await searchProducts(name, 1);
      if (r[0]) probeProducts.push(r[0]);
    } catch { /* skip */ }
    await sleep(150);
  }

  // ── Phase B: run the swap engine on everything.
  out(`\nPhase B — running diagnosis + swaps on ${browsed.reduce((n, b) => n + b.products.length, 0) + probeProducts.length} products…`);
  for (const { key, products } of browsed) {
    const browseRows = await mapLimit(products, CONCURRENCY, async (p) => {
      const swap = await getSwaps(p, { limit: 4 });
      return analyse(p, "browse", key, swap);
    });
    rows.push(...browseRows);
  }
  const probeRows = await mapLimit(probeProducts, CONCURRENCY, async (p) => {
    const swap = await getSwaps(p, { limit: 4 });
    return analyse(p, "probe", detectSwapCategory({ productName: p.productName, brand: p.brand }), swap);
  });
  rows.push(...probeRows);

  report(rows);
  writeFileSync(
    "/tmp/scan-swap-results.json",
    JSON.stringify(rows, null, 2),
  );
  out("\nFull rows written to /tmp/scan-swap-results.json");
}

function pct(n: number, d: number): string {
  return d === 0 ? "—" : `${((n / d) * 100).toFixed(0)}%`;
}

function report(rows: Row[]) {
  const total = rows.length;
  const found = rows.length;
  const categorised = rows.filter((r) => r.detectedCategory).length;
  const flagged = rows.filter((r) => r.primaryConcern && !r.selfEthical);
  const flaggedWithSwap = flagged.filter((r) => r.swapCount > 0);
  const flaggedWithFix = flagged.filter((r) => r.fixesPrimaryCount > 0);
  const flaggedWithResolved = flagged.filter((r) => r.resolvedSwapCount > 0);

  out("\n" + "=".repeat(64));
  out("SCAN + SWAP HARNESS REPORT");
  out("=".repeat(64));
  out(`Products analysed:           ${total}`);
  out(`Category detected:           ${categorised}/${total} (${pct(categorised, total)})`);
  out(`Flagged (has concern):       ${flagged.length}/${total} (${pct(flagged.length, total)})`);
  out(`  …with ≥1 swap:             ${flaggedWithSwap.length}/${flagged.length} (${pct(flaggedWithSwap.length, flagged.length)})`);
  out(`  …with a primary-fix swap:  ${flaggedWithFix.length}/${flagged.length} (${pct(flaggedWithFix.length, flagged.length)})`);
  out(`  …with a LIVE-resolved swap:${flaggedWithResolved.length}/${flagged.length} (${pct(flaggedWithResolved.length, flagged.length)})`);

  // Concern distribution
  const byConcern: Record<string, number> = {};
  for (const r of flagged) byConcern[r.primaryConcern!] = (byConcern[r.primaryConcern!] ?? 0) + 1;
  out("\nPrimary concern distribution:");
  for (const [k, v] of Object.entries(byConcern).sort((a, b) => b[1] - a[1])) {
    out(`  ${k.padEnd(16)} ${v}`);
  }

  // Category detection failures (browse rows where expected != detected)
  const miscat = rows.filter(
    (r) => r.source === "browse" && r.expectedCategory && r.detectedCategory !== r.expectedCategory,
  );
  out(`\nBrowse mis/owncategorisations: ${miscat.length}`);
  const miscatByExpected: Record<string, { count: number; sample: string[] }> = {};
  for (const r of miscat) {
    const key = `${r.expectedCategory} → ${r.detectedCategory ?? "none"}`;
    (miscatByExpected[key] ??= { count: 0, sample: [] }).count++;
    if (miscatByExpected[key].sample.length < 3)
      miscatByExpected[key].sample.push(`${r.brand ?? "?"} / ${r.productName ?? "?"}`);
  }
  for (const [k, v] of Object.entries(miscatByExpected).sort((a, b) => b[1].count - a[1].count)) {
    out(`  ${k.padEnd(28)} ${v.count}  e.g. ${v.sample.join(" | ")}`);
  }

  // THE KEY GAP LIST: flagged products with NO usable swap.
  const gaps = flagged.filter((r) => r.swapCount === 0 || r.fixesPrimaryCount === 0);
  out(`\n${"-".repeat(64)}`);
  out(`GAPS — flagged products with no primary-concern-fixing swap: ${gaps.length}`);
  out("-".repeat(64));
  const gapByCat: Record<string, Row[]> = {};
  for (const r of gaps) {
    const key = `${r.detectedCategory ?? "uncategorised"} / ${r.primaryConcern}`;
    (gapByCat[key] ??= []).push(r);
  }
  for (const [k, list] of Object.entries(gapByCat).sort((a, b) => b[1].length - a[1].length)) {
    out(`\n  ${k}  (${list.length})`);
    for (const r of list.slice(0, 5)) {
      out(`     ${r.brand ?? "?"} — ${r.productName ?? "?"} [swaps:${r.swapCount} fix:${r.fixesPrimaryCount}]`);
    }
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
