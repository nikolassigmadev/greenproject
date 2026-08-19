// @vitest-environment jsdom
//
// Random-scan simulation.
//
// The verdict-page audit (verdictPageAudit.test.ts) drives the pipeline with
// SYNTHETIC products built from brands the app already knows. This harness does
// the opposite: it replays ~1,000 REAL, randomly-sampled Open Food Facts
// products — the long tail, in every language, most of them brands the app has
// never heard of — through the same code a scan runs:
//
//   raw OFF payload → normalizeProduct() → getVerdict() → every detail-page
//   signal → saveScanToHistory() → the history / impact / carbon aggregates.
//
// It is looking for what only the long tail can show: grades the display maps
// don't cover, matcher false positives on innocent brands, verdict reasons that
// contradict their own verdict, and impact maths that disagree with itself.
//
// Corpus: data/random-scan-corpus.json — build/refresh with
//   node scripts/fetch-random-scan-corpus.mjs 1000
// (gitignored; the suite skips cleanly when it's absent).
//
// Report: docs/random-scan-simulation-report.md

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

import { normalizeProduct } from "@/services/openfoodfacts";
import type { OpenFoodFactsProduct, OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import { getVerdict, GRADE_COLOR, GRADE_BG, GRADE_PERCENT } from "@/pages/OpenFoodFactsDetail";
import { personalizedScore, GRADE_SCORE } from "@/utils/personalizedScore";
import {
  DEFAULT_PRIORITIES,
  priorityMultiplier,
  saveScanToHistory,
  loadScanHistory,
  clearScanHistory,
  getHistoryStats,
  getCarbonStats,
  type UserPriorities,
} from "@/utils/userPreferences";
import { computeMonthlyImpact } from "@/utils/impactStats";
import { GRADE_CO2_KG } from "@/utils/carbonEstimates";
import { checkBoycott } from "@/data/boycottBrands";
import { findLaborAllegations } from "@/utils/laborCheck";
import { checkAnimalWelfareFlag } from "@/utils/animalWelfareFlags";
import { findVerifiedEthics } from "@/utils/verifiedEthics";
import { findChocolateEntry } from "@/data/chocolateDirectory";
import { getVerifiedFlagsForBrand } from "@/services/brandFlags";
import { findIngredientFlagsInText } from "@/services/ingredientFlags";
import { computeAnimalWelfareScore } from "@/utils/animalWelfareScore";
import { checkDietaryConflicts } from "@/utils/dietaryPreferences";
import { diagnoseProduct, assessUnmetDemand } from "@/services/swaps";
import { getCommodityRecordsByBrand } from "@/data/commoditySupplyChains";
import type { BasketItem } from "@/utils/basketStorage";

// ── Corpus ───────────────────────────────────────────────────────────────────

const CORPUS_PATH = path.resolve(__dirname, "../../data/random-scan-corpus.json");
const hasCorpus = fs.existsSync(CORPUS_PATH);

interface Corpus {
  seed: number;
  fetchedAt: string;
  count: number;
  products: OpenFoodFactsProduct[];
}

let raw: OpenFoodFactsProduct[] = [];
let scans: OpenFoodFactsResult[] = [];

beforeAll(() => {
  if (!hasCorpus) return;
  const corpus: Corpus = JSON.parse(fs.readFileSync(CORPUS_PATH, "utf8"));
  raw = corpus.products;
  scans = raw.map(normalizeProduct);
});

// ── Findings ─────────────────────────────────────────────────────────────────

interface Finding {
  level: "ERROR" | "WARN" | "INFO";
  area: string;
  message: string;
}
const findings: Finding[] = [];
const seenMessages = new Set<string>();
const report = (level: Finding["level"], area: string, message: string) => {
  // The same defect fires on hundreds of products; record it once with a count
  // rather than 400 identical lines.
  const key = `${level}|${area}|${message}`;
  if (seenMessages.has(key)) return;
  seenMessages.add(key);
  findings.push({ level, area, message });
};
/** Counters for issues that are worth quantifying, not just listing. */
const counters = new Map<string, number>();
const bump = (key: string) => counters.set(key, (counters.get(key) ?? 0) + 1);

/**
 * A defect that fires on hundreds of products is one defect. Aggregate it into
 * a single finding carrying its hit count and a few real examples, so the
 * report reads as "this is broken, N times, here are three" instead of N lines.
 */
interface Bucket { level: Finding["level"]; area: string; count: number; examples: string[] }
const buckets = new Map<string, Bucket>();
const reportMany = (level: Finding["level"], area: string, headline: string, example: string) => {
  const b = buckets.get(headline) ?? { level, area, count: 0, examples: [] };
  b.count++;
  if (b.examples.length < 3) b.examples.push(example);
  buckets.set(headline, b);
};
const flushBuckets = () => {
  for (const [headline, b] of buckets) {
    report(b.level, b.area, `${headline} — ${b.count} product${b.count === 1 ? "" : "s"} (e.g. ${b.examples.join("; ")})`);
  }
  buckets.clear();
};

afterAll(() => {
  if (!hasCorpus) return;
  flushBuckets();
  const lines: string[] = [
    "# Random-scan simulation report",
    "",
    `Generated by \`src/test/randomScanSimulation.test.ts\` on ${new Date().toISOString().slice(0, 10)}.`,
    `Corpus: ${scans.length} randomly-sampled real Open Food Facts products.`,
    "",
    `Totals: ${findings.filter(f => f.level === "ERROR").length} errors, ` +
      `${findings.filter(f => f.level === "WARN").length} warnings, ` +
      `${findings.filter(f => f.level === "INFO").length} notes.`,
    "",
  ];
  if (counters.size > 0) {
    lines.push("## Counts", "");
    for (const [k, v] of [...counters.entries()].sort((a, b) => b[1] - a[1])) {
      lines.push(`- ${k}: **${v}**`);
    }
    lines.push("");
  }
  for (const level of ["ERROR", "WARN", "INFO"] as const) {
    const group = findings.filter(f => f.level === level);
    if (group.length === 0) continue;
    lines.push(`## ${level}`, "");
    for (const f of group) lines.push(`- **[${f.area}]** ${f.message}`);
    lines.push("");
  }
  fs.writeFileSync(path.resolve(__dirname, "../../docs/random-scan-simulation-report.md"), lines.join("\n"));
  // eslint-disable-next-line no-console
  console.log(`\n[random-scan] ${findings.length} findings → docs/random-scan-simulation-report.md`);
});

// ── Fixtures ─────────────────────────────────────────────────────────────────

const PRIORITY_SETS: [string, UserPriorities][] = [
  ["default", { ...DEFAULT_PRIORITIES }],
  ["ethics-critical", { ...DEFAULT_PRIORITIES, laborRights: 80, animalWelfare: 80, environment: 50 }],
  ["eco-critical", { ...DEFAULT_PRIORITIES, laborRights: 20, animalWelfare: 20, environment: 80 }],
];

const VALID_VERDICTS = new Set(["BUY", "CONSIDER", "CAUTION", "AVOID", "UNKNOWN"]);
const BAND_RANK: Record<string, number> = { AVOID: 0, CAUTION: 1, CONSIDER: 2, BUY: 3 };

/**
 * The real lookup tables, imported rather than mirrored — a grade Open Food
 * Facts serves that any of them misses renders with no colour, a meaningless
 * ring, or drops out of the carbon maths entirely.
 */
const GRADE_TABLES: [string, Record<string, unknown>][] = [
  ["GRADE_COLOR (detail page chip + gauge colour)", GRADE_COLOR],
  ["GRADE_BG (detail page chip background)", GRADE_BG],
  ["GRADE_PERCENT (detail page gauge fill)", GRADE_PERCENT],
  ["GRADE_SCORE (numeric scoring)", GRADE_SCORE],
  ["GRADE_CO2_KG (carbon estimates)", GRADE_CO2_KG],
];

const describeIf = hasCorpus ? describe : describe.skip;

if (!hasCorpus) {
  // eslint-disable-next-line no-console
  console.warn(
    `[random-scan] corpus missing at ${CORPUS_PATH} — run: node scripts/fetch-random-scan-corpus.mjs 1000`,
  );
}

// ── 1. Verdict integrity across the long tail ────────────────────────────────

describeIf("random-scan: verdict integrity", () => {
  it("every product yields a valid, self-consistent verdict at every priority set", () => {
    for (const product of scans) {
      const labor = findLaborAllegations(product.brand, product.productName);
      const laborCount = labor?.allegations.length ?? 0;
      const boycott = checkBoycott(product.brand);
      const welfare = checkAnimalWelfareFlag(product.brand);
      const who = `${product.brand ?? "?"} / ${product.productName ?? "?"} (${product.barcode})`;

      for (const [preset, priorities] of PRIORITY_SETS) {
        const verdict = getVerdict(product, priorities);
        expect(VALID_VERDICTS.has(verdict.key), `invalid verdict "${verdict.key}" for ${who}`).toBe(true);
        expect(verdict.reason.trim().length, `empty verdict reason for ${who}`).toBeGreaterThan(0);
        bump(`verdict ${verdict.key} (${preset})`);

        const laborWeight = priorityMultiplier(priorities.laborRights);
        const animalWeight = priorityMultiplier(priorities.animalWelfare);

        // Hard escalation rules — same ones the synthetic audit enforces.
        if (boycott && laborWeight > 0 && verdict.key === "BUY") {
          report("ERROR", "verdict", `${who} is boycott-listed (${boycott.parent}) but reads BUY (${preset})`);
        }
        if (laborCount * laborWeight >= 2.0 && verdict.key !== "AVOID") {
          report("ERROR", "verdict", `${who} has ${laborCount} labour allegations (weight ${laborWeight}) but reads ${verdict.key} (${preset})`);
        }
        if (welfare.isFlagged && welfare.severity === "critical" && animalWeight >= 2.0 && verdict.key === "BUY") {
          report("ERROR", "verdict", `${who} has a critical welfare flag but reads BUY (${preset})`);
        }

        // The reason is the ONLY explanation the shopper gets. It must not
        // praise a product the verdict rejects, or vice versa.
        const r = verdict.reason.toLowerCase();
        const praises = /excellent environmental credentials|strong eco credentials|verified ethical certifications|scorecard (leader|standout)|brand you trust/.test(r);
        const condemns = /very high (environmental )?impact|allegations|boycott|critical animal welfare|brand to avoid/.test(r);
        if ((verdict.key === "AVOID" || verdict.key === "CAUTION") && praises && !condemns) {
          report("ERROR", "verdict-reason", `${who}: verdict ${verdict.key} but the reason praises it — "${verdict.reason}" (${preset})`);
        }
        if (verdict.key === "BUY" && condemns) {
          report("ERROR", "verdict-reason", `${who}: verdict BUY but the reason condemns it — "${verdict.reason}" (${preset})`);
        }
      }

      // A red banner with an UNKNOWN top-line: the page shows a labour/boycott/
      // welfare warning while the verdict says it has no idea.
      const neutral = getVerdict(product, DEFAULT_PRIORITIES);
      if (neutral.key === "UNKNOWN" && (laborCount > 0 || boycott || welfare.isFlagged)) {
        reportMany("ERROR", "verdict", "verdict reads UNKNOWN while the page shows a live red signal (labour / boycott / welfare)", `${who} [labour=${laborCount}, boycott=${!!boycott}, welfare=${welfare.severity ?? "none"}]`);
      }
    }
  }, 120_000);

  it("every grade the API serves is one the display layer can render", () => {
    const ecoGrades = new Set<string>();
    const nutriGrades = new Set<string>();
    for (const p of scans) {
      if (p.ecoscoreGrade) ecoGrades.add(p.ecoscoreGrade.toLowerCase());
      if (p.nutriscoreGrade) nutriGrades.add(p.nutriscoreGrade.toLowerCase());
    }
    for (const g of ecoGrades) {
      const count = scans.filter(p => p.ecoscoreGrade?.toLowerCase() === g).length;
      for (const [label, table] of GRADE_TABLES) {
        if (table[g] === undefined) {
          report("ERROR", "grades", `eco-score grade "${g}" is served by Open Food Facts (${count} of ${scans.length} products) but missing from ${label}`);
        }
      }
      counters.set(`eco grade ${g}`, count);
    }
    for (const g of nutriGrades) {
      const count = scans.filter(p => p.nutriscoreGrade?.toLowerCase() === g).length;
      // Nutri-Score has no A+/F bands, so only the display tables apply.
      for (const [label, table] of GRADE_TABLES.slice(0, 3)) {
        if (table[g] === undefined) {
          report("ERROR", "grades", `nutri-score grade "${g}" (${count} products) is missing from ${label}`);
        }
      }
      counters.set(`nutri grade ${g}`, count);
    }
  });

  it("normalizeProduct never emits out-of-range or malformed scores", () => {
    for (const p of scans) {
      const who = `${p.brand ?? "?"} (${p.barcode})`;
      if (p.ecoscoreScore !== null) {
        if (p.ecoscoreScore < 0 || p.ecoscoreScore > 100) {
          report("ERROR", "normalize", `${who}: ecoscoreScore ${p.ecoscoreScore} outside 0–100`);
        }
      }
      if (p.novaGroup !== null && ![1, 2, 3, 4].includes(p.novaGroup)) {
        report("ERROR", "normalize", `${who}: novaGroup ${p.novaGroup} is not 1–4 — NOVA_LABEL/NOVA_COLOR render blank`);
      }
      if (p.nutriscoreGrade && !/^[a-e]$/i.test(p.nutriscoreGrade) && p.nutriscoreGrade !== "unknown" && p.nutriscoreGrade !== "not-applicable") {
        report("WARN", "normalize", `${who}: nutriscoreGrade "${p.nutriscoreGrade}" is not a plain A–E letter`);
      }
      // "unknown"/"not-applicable" must never reach the UI as a grade.
      if (p.ecoscoreGrade === "unknown" || p.ecoscoreGrade === "not-applicable") {
        reportMany("ERROR", "normalize", `ecoscoreGrade "unknown"/"not-applicable" leaked through normalizeProduct`, `${who} → "${p.ecoscoreGrade}"`);
      }
      if (p.nutriscoreGrade === "unknown" || p.nutriscoreGrade === "not-applicable") {
        reportMany("ERROR", "normalize", `nutriscoreGrade "unknown"/"not-applicable" reaches the UI as a real grade`, `${who} → "${p.nutriscoreGrade}"`);
      }
    }
  });
});

// ── 1b. What the shopper actually reads on the page ──────────────────────────

describeIf("random-scan: the page a shopper ends up looking at", () => {
  /** Mostly non-Latin — the same test normalizeProduct's pickEnglishName uses. */
  const isNonLatin = (s: string): boolean => {
    const latin = s.replace(/[^a-zA-Z]/g, "").length;
    const total = s.replace(/[\s\d\-_.,!?()]/g, "").length;
    return total > 0 && latin / total < 0.5;
  };

  it("names, categories and carbon comparisons render as something readable", () => {
    let nameless = 0;
    let brandless = 0;
    for (const p of scans) {
      const who = `${p.brand ?? "(no brand)"} / ${p.productName ?? "(no name)"} (${p.barcode})`;

      if (!p.productName?.trim()) nameless++;
      else if (isNonLatin(p.productName)) {
        reportMany("WARN", "display", `pickEnglishName still returns a non-Latin title, so the hero reads as untranslated text`, who);
      }
      if (!p.brand?.trim()) brandless++;

      // shortCategory: the meta line under the title.
      const category = p.categories.find(c => c.length > 3) || p.categories[0];
      if (category && /^[a-z]{2}:/.test(category)) {
        reportMany("ERROR", "display", `a category tag reaches the meta line with its language prefix intact`, `${who} → "${category}"`);
      }

      // "Same as driving N km" — a headline comparison on the detail page.
      const co2Total = p.ecoscoreData?.agribalyse?.co2_total;
      if (typeof co2Total === "number") {
        const km = Math.round((co2Total / 0.21) * 10) / 10;
        if (!Number.isFinite(km) || km < 0) {
          reportMany("ERROR", "display", `the driving-distance comparison computes a nonsense value`, `${who} → co2_total=${co2Total} → ${km} km`);
        }
        if (co2Total > 60) {
          reportMany("WARN", "display", `an implausible Agribalyse co2_total drives the carbon bars and the driving comparison`, `${who} → ${co2Total} kg CO₂e/kg`);
        }
      }
    }
    counters.set("products with no usable name (page shows \"Unknown product\")", nameless);
    counters.set("products with no brand (every brand-keyed signal is skipped)", brandless);
  });
});

// ── 2. Page verdict vs. the numeric score everything else uses ───────────────

describeIf("random-scan: page verdict vs numeric score", () => {
  it("the two never land more than one band apart for the same product", () => {
    for (const [preset, priorities] of PRIORITY_SETS) {
      let divergent = 0;
      for (const product of scans) {
        const labor = findLaborAllegations(product.brand, product.productName);
        const page = getVerdict(product, priorities);
        const ps = personalizedScore(
          {
            brand: product.brand,
            productName: product.productName,
            ecoGrade: product.ecoscoreGrade,
            ecoScore: product.ecoscoreScore,
            nutriGrade: product.nutriscoreGrade,
            laborAllegations: labor?.allegations.length ?? 0,
          },
          priorities,
        );
        if (ps.score === null || page.key === "UNKNOWN") continue;
        const gap = Math.abs(BAND_RANK[page.key] - BAND_RANK[ps.verdict]);
        if (gap >= 2) {
          divergent++;
          reportMany(
            "WARN",
            "coherence",
            `page verdict and numeric score land ≥2 bands apart (${preset})`,
            `${product.brand ?? "?"} / ${product.productName ?? "?"}: page ${page.key} vs numeric ${ps.verdict} (eco=${product.ecoscoreGrade ?? "none"}, nutri=${product.nutriscoreGrade ?? "none"})`,
          );
        }
      }
      if (divergent > 0) bump(`coherence gap ≥2 bands (${preset})`);
      counters.set(`coherence gap ≥2 bands (${preset})`, divergent);
    }
  }, 120_000);
});

// ── 3. Matcher false positives on 1,000 unknown brands ───────────────────────

describeIf("random-scan: brand matchers on the long tail", () => {
  /**
   * A match is trustworthy when the matched entity's name (or one of its words)
   * actually appears in the brand text. When it doesn't, the regex fired on
   * something else — a word inside the PRODUCT name, or a substring.
   */
  const brandContains = (brand: string | null, needle: string): boolean => {
    if (!brand) return false;
    const b = brand.toLowerCase();
    return needle
      .toLowerCase()
      .split(/[\s,.'&()-]+/)
      .filter(w => w.length >= 4)
      .some(w => b.includes(w));
  };

  it("labour / boycott / welfare / ethics matches are anchored to the brand, not the product name", () => {
    for (const p of scans) {
      const who = `${p.brand ?? "(no brand)"} / ${p.productName ?? "?"} (${p.barcode})`;

      const labor = findLaborAllegations(p.brand, p.productName);
      if (labor) {
        bump("labour match");
        // findLaborAllegations tests brand + productName together, so a product
        // NAME containing a brand word ("mars", "dove", "coke") flags a brand
        // that has nothing to do with it.
        const brandOnly = findLaborAllegations(p.brand, null);
        if (!brandOnly) {
          report("ERROR", "matchers", `${who}: labour allegations against ${labor.parentCompany} matched the PRODUCT NAME only — the brand is clean`);
        }
      }

      const boycott = checkBoycott(p.brand);
      if (boycott) {
        bump("boycott match");
        // checkBoycott only reports the parent, so the brand-anchoring check is
        // weaker here: record the pairing for review rather than asserting.
        if (!brandContains(p.brand, boycott.parent)) {
          report("INFO", "matchers", `boycott: brand "${p.brand}" → ${boycott.parent} (matched via a fragment, not the parent name) — e.g. ${who}`);
        }
      }

      const welfare = checkAnimalWelfareFlag(p.brand);
      if (welfare.isFlagged) {
        bump("welfare match");
        const company = welfare.company?.companyName ?? "";
        const viaBrandList = (welfare.company?.brands ?? []).some(b => brandContains(p.brand, b));
        if (!brandContains(p.brand, company) && !viaBrandList) {
          report("ERROR", "matchers", `${who}: welfare flag "${company}" matches neither the brand nor any of its listed brands`);
        }
      }

      const ethics = findVerifiedEthics(p.brand, p.productName);
      if (ethics) {
        bump("verified-ethics match");
        if (!findVerifiedEthics(p.brand, null) && !brandContains(p.brand, ethics.brandName)) {
          report("ERROR", "matchers", `${who}: verified-ethics record "${ethics.brandName}" matched the PRODUCT NAME only — a green all-clear on an unrelated brand`);
        }
      }

      const choc = findChocolateEntry(p.brand, p.productName);
      if (choc) {
        bump("chocolate-directory match");
        if (!findChocolateEntry(p.brand, null) && !brandContains(p.brand, choc.name)) {
          report("ERROR", "matchers", `${who}: chocolate-directory entry "${choc.name}" (${choc.verdict}) matched the PRODUCT NAME only`);
        }
      }

      const flags = getVerifiedFlagsForBrand(p.brand ?? "");
      for (const f of flags) {
        bump("v2 flag match");
        const viaAlias = (f.brandAliases ?? []).some(a => brandContains(p.brand, a));
        if (!brandContains(p.brand, f.brandName) && !viaAlias) {
          report("ERROR", "matchers", `${who}: verified flag "${f.brandName}" matches neither the brand name nor an alias`);
        }
      }

      const commodity = getCommodityRecordsByBrand(p.brand);
      if (commodity.length > 0) bump("commodity supply-chain match");
    }
  }, 120_000);
});

// ── 4. Ingredient / dietary / welfare cards on real ingredient text ──────────

describeIf("random-scan: ingredient + dietary cards", () => {
  it("ingredient flags fire on real ingredient lists without duplicating or misfiring", () => {
    for (const p of scans) {
      if (!p.ingredientsText) continue;
      const flags = findIngredientFlagsInText(p.ingredientsText);
      if (flags.length === 0) continue;
      bump("product with ingredient flags");
      const ids = flags.map(f => f.id);
      if (new Set(ids).size !== ids.length) {
        report("ERROR", "ingredients", `${p.brand ?? "?"} (${p.barcode}): duplicate ingredient-flag cards ${ids.join(", ")}`);
      }
    }
  });

  it("the animal-welfare score stays in range and explains itself", () => {
    for (const p of scans) {
      const score = computeAnimalWelfareScore({
        brand: p.brand,
        productName: p.productName,
        categories: p.categories,
        labels: p.labels,
        ingredientsText: p.ingredientsText,
      });
      if (score.score === null) continue;
      bump("product with welfare score");
      if (score.score < 0 || score.score > 100) {
        report("ERROR", "welfare-score", `${p.brand ?? "?"} (${p.barcode}): welfare score ${score.score} outside 0–100`);
      }
      if (score.factors.length === 0) {
        report("ERROR", "welfare-score", `${p.brand ?? "?"} (${p.barcode}): welfare score ${score.score} with no contributing factors — the breakdown renders empty`);
      }
    }
  });

  it("dietary conflicts only fire on real allergen/analysis data", () => {
    const prefs = {
      diets: ["vegan", "palm_oil_free"] as const,
      allergens: ["gluten", "milk", "nuts", "soybeans"] as const,
    };
    for (const p of scans) {
      const check = checkDietaryConflicts(p, { diets: [...prefs.diets], allergens: [...prefs.allergens] });
      if (check.conflicts.length > 0) bump("product with dietary conflict");
      for (const c of check.conflicts) {
        if (!c.message.trim()) {
          report("ERROR", "dietary", `${p.brand ?? "?"} (${p.barcode}): dietary conflict "${c.label}" with an empty message`);
        }
      }
    }
  });
});

// ── 5. Swap engine on products it has never seen ─────────────────────────────

describeIf("random-scan: swap engine", () => {
  it("diagnoses concerns and demand without crashing or contradicting itself", () => {
    for (const p of scans) {
      const diagnosis = diagnoseProduct(p, DEFAULT_PRIORITIES);
      const demand = assessUnmetDemand(p, DEFAULT_PRIORITIES, "GB");
      const who = `${p.brand ?? "?"} / ${p.productName ?? "?"} (${p.barcode})`;

      if (diagnosis.primary) bump(`primary concern: ${diagnosis.primary.type}`);
      if (diagnosis.categoryKey) bump(`swap category: ${diagnosis.categoryKey}`);

      // The demand signal drives the unmet-demand analytics — it must agree
      // with the diagnosis it is derived from.
      if (!!diagnosis.primary !== (demand.primaryConcern !== null)) {
        report("ERROR", "swaps", `${who}: diagnoseProduct says primary=${diagnosis.primary?.type ?? "none"} but assessUnmetDemand says ${demand.primaryConcern ?? "none"}`);
      }
      if (demand.swapAvailable === false && demand.swapGapReason === null) {
        report("ERROR", "swaps", `${who}: no swap available but no gap reason recorded — the funnel analytics lose this row`);
      }
      for (const c of diagnosis.concerns) {
        if (!c.label.trim()) report("ERROR", "swaps", `${who}: concern of type ${c.type} has an empty label`);
      }
    }
  }, 60_000);
});

// ── 6. Scan history + the impact numbers built on it ─────────────────────────

describeIf("random-scan: history and impact", () => {
  beforeAll(() => {
    clearScanHistory();
    // Replay the exact write the detail page performs on every scan, spread
    // over the last ~40 days so the weekly/monthly windows are exercised.
    const colorMap: Record<string, string> = {
      BUY: "#10b981", CONSIDER: "#f59e0b", CAUTION: "#f97316", AVOID: "#ef4444", UNKNOWN: "#6B7280",
    };
    scans.forEach((product, i) => {
      const labor = findLaborAllegations(product.brand, product.productName);
      const key = getVerdict(product, DEFAULT_PRIORITIES).key;
      saveScanToHistory({
        id: `${product.barcode}-${i}`,
        barcode: product.barcode,
        productName: product.productName || "Unknown Product",
        brand: product.brand,
        imageUrl: product.imageUrl,
        timestamp: Date.now() - (i % 40) * 86_400_000,
        verdict: { emoji: "", label: key, color: colorMap[key] || "#6B7280" },
        scores: {
          ecoScore: product.ecoscoreScore,
          ecoGrade: product.ecoscoreGrade,
          nutriScore: product.nutriscoreGrade,
          laborAllegations: labor?.allegations.length ?? 0,
          novaGroup: product.novaGroup,
        },
        carbonFootprint100g: product.carbonFootprint100g,
        labels: product.labels,
      });
    });
  });

  afterAll(() => clearScanHistory());

  it("history keeps one row per scanned product", () => {
    const history = loadScanHistory();
    const uniqueBarcodes = new Set(scans.map(s => s.barcode));
    counters.set("history rows retained", history.length);
    counters.set("unique barcodes scanned", uniqueBarcodes.size);
    // MAX_HISTORY caps at 200 — expected. What is NOT expected is rows being
    // merged away because they share a falsy barcode.
    const blankBarcodes = scans.filter(s => !s.barcode).length;
    if (blankBarcodes > 1) {
      report("ERROR", "history", `${blankBarcodes} scanned products have an empty barcode; saveScanToHistory dedupes on barcode, so they all collapse into a single history row`);
    }
  });

  it("every history row is reachable from the History page's own filters", async () => {
    const { entryTone, matchesFilter } = await import("@/pages/Dashboard");
    const history = loadScanHistory();
    let unreachable = 0;
    let contradicting = 0;
    for (const h of history) {
      const reachable = (["good", "mixed", "avoid", "unrated"] as const).some(f => matchesFilter(h, f));
      if (!reachable) {
        unreachable++;
        continue;
      }
      // The History row is toned by raw eco-score, but the verdict beside it was
      // computed from labour/boycott/welfare too. When they disagree, the list
      // files a product the app told the user to AVOID under "Good".
      const tone = entryTone(h);
      const label = (h.verdict.label || "").toUpperCase();
      if ((label === "AVOID" || label === "CAUTION") && tone === "good") contradicting++;
      if (label === "BUY" && tone === "bad") contradicting++;
    }
    counters.set("history rows matching no filter", unreachable);
    counters.set("history rows whose tone contradicts their verdict", contradicting);
    if (unreachable > 0) {
      report("ERROR", "history-page", `${unreachable}/${history.length} history rows match none of the Good/Mixed/Avoid filters — they only exist under "All" (entryTone returns null without a numeric eco-score)`);
    }
    if (contradicting > 0) {
      report("ERROR", "history-page", `${contradicting}/${history.length} history rows are toned by eco-score in a way that contradicts the verdict stored on the same row (e.g. an AVOID product filed under "Good")`);
    }
  });

  it("the home-page showcase renders each scan honestly", async () => {
    const { scanEntryToShowcase, hasCompleteEcoData } = await import("@/utils/recentScanShowcase");
    for (const h of loadScanHistory()) {
      if (!hasCompleteEcoData(h)) continue;
      const card = scanEntryToShowcase(h);
      const who = `${h.brand ?? "?"} (${h.barcode})`;
      if (card.score < 0 || card.score > 100) {
        report("ERROR", "showcase", `${who}: showcase score ${card.score} outside 0–100`);
      }
      for (const c of card.categories) {
        if (!Number.isFinite(c.value)) {
          report("ERROR", "showcase", `${who}: showcase metric "${c.label}" is ${c.value}`);
        }
      }
      // The grade is printed raw here while the detail page prints it through
      // gradeLabel() — so the same product can read "A+" on one screen and
      // "A-PLUS" on the other.
      if (/A-PLUS/.test(card.description)) {
        reportMany("ERROR", "showcase", `the home card prints the eco grade as "A-PLUS" where the detail page prints "A+"`, who);
      }
    }
  });

  it("history stats account for every row", () => {
    const history = loadScanHistory();
    const stats = getHistoryStats(history);
    const summed = stats.good + stats.moderate + stats.caution + stats.avoid + stats.unknown;
    if (summed !== stats.total) {
      report("ERROR", "history", `getHistoryStats loses rows: ${summed} classified vs ${stats.total} total (verdict labels outside the five buckets)`);
    }
    for (const w of stats.weeks) {
      if (w.percentage < 0 || w.percentage > 100) {
        report("ERROR", "history", `weekly trend "${w.week}" percentage ${w.percentage} outside 0–100`);
      }
    }
  });

  it("carbon and impact aggregates agree with each other and stay plausible", () => {
    const history = loadScanHistory();
    const carbon = getCarbonStats(history);
    const monthly = computeMonthlyImpact(30);

    counters.set("getCarbonStats co2SavedKg", carbon.co2SavedKg);
    counters.set("computeMonthlyImpact scanCount", monthly.scanCount);
    counters.set("computeMonthlyImpact flaggedBrandCount", monthly.flaggedBrandCount);

    // The Dashboard's month view is built from the same rows as the all-time
    // carbon view, so its counts must be a subset of them.
    if (monthly.scanCount > history.length) {
      report("ERROR", "impact", `computeMonthlyImpact counts ${monthly.scanCount} scans this month, more than the ${history.length} rows in history`);
    }
    if (monthly.flaggedBrandCount > monthly.scanCount) {
      report("ERROR", "impact", `computeMonthlyImpact reports ${monthly.flaggedBrandCount} flagged scans out of ${monthly.scanCount}`);
    }

    // Real OFF carbon values include junk (mis-keyed units, per-portion figures
    // entered as per-100g). One bad row must not blow up a headline number.
    for (const h of history) {
      if (h.carbonFootprint100g == null) continue;
      const perKg = h.carbonFootprint100g / 100;
      if (perKg > 100) {
        report(
          "ERROR",
          "impact",
          `${h.brand ?? "?"} (${h.barcode}): carbonFootprint100g=${h.carbonFootprint100g} → ${perKg.toFixed(0)} kg CO₂e/kg feeds the impact totals unclamped`,
        );
        bump("implausible carbon row");
      }
    }

    if (carbon.pctReduced < 0 || carbon.pctReduced > 100) {
      report("ERROR", "impact", `getCarbonStats pctReduced=${carbon.pctReduced} outside 0–100`);
    }
    if (!Number.isFinite(carbon.projectedSavedKgPerYear)) {
      report("ERROR", "impact", `getCarbonStats projectedSavedKgPerYear is ${carbon.projectedSavedKgPerYear}`);
    }
  });

  it("the streak read of the same history is internally consistent", async () => {
    const { computeStreak } = await import("@/utils/streaks");
    const history = loadScanHistory();
    const streak = computeStreak(history);
    counters.set("streak: current", streak.current);
    counters.set("streak: longest", streak.longest);
    if (streak.current > streak.longest) {
      report("ERROR", "streaks", `current streak ${streak.current} exceeds the longest-ever ${streak.longest}`);
    }
    const distinctDays = new Set(history.map(h => new Date(h.timestamp).toDateString())).size;
    if (streak.longest > distinctDays) {
      report("ERROR", "streaks", `longest streak ${streak.longest} spans more days than the ${distinctDays} the history actually covers`);
    }
  });

  it("the AI context built from this history reports the same numbers the app shows", async () => {
    const { buildAppContext } = await import("@/utils/appContext");
    const history = loadScanHistory();
    const ctx = buildAppContext();
    if (ctx.scanHistory.total !== history.length) {
      report("ERROR", "app-context", `buildAppContext reports ${ctx.scanHistory.total} scans, history holds ${history.length}`);
    }
    const summed = ctx.scanHistory.good + ctx.scanHistory.moderate + ctx.scanHistory.caution + ctx.scanHistory.avoid;
    if (summed > ctx.scanHistory.total) {
      report("ERROR", "app-context", `buildAppContext verdict buckets sum to ${summed}, more than its own total of ${ctx.scanHistory.total}`);
    }
    if (ctx.scanHistory.recent.some(r => !r.name)) {
      report("ERROR", "app-context", `buildAppContext sends a recent scan with no name to the AI analyst`);
    }
  });
});

// ── 7. Basket: the other place these products get scored ─────────────────────

describeIf("random-scan: basket", () => {
  it("a basket of random scans reports coherent totals", async () => {
    const { getBasketEthicsReport } = await import("@/utils/basketStorage");
    const { gradeFromScore } = await import("@/utils/personalizedScore");

    // Built exactly as ShoppingList/DecisionBar build it from a scanned product.
    const items = scans.slice(0, 200).map((p, i): BasketItem => ({
      id: `${p.barcode}-${i}`,
      barcode: p.barcode,
      productName: p.productName ?? "Unknown product",
      brand: p.brand,
      imageUrl: p.imageUrl,
      ecoscoreGrade: p.ecoscoreGrade,
      ecoscoreScore: p.ecoscoreScore,
      nutriscoreGrade: p.nutriscoreGrade,
      laborAllegations: findLaborAllegations(p.brand, p.productName)?.allegations.length ?? 0,
      co2Per100g: p.carbonFootprint100g,
      addedAt: Date.now(),
    }));

    const r = getBasketEthicsReport(items);
    counters.set("basket items", r.itemCount);
    counters.set("basket co2SavedKg", r.co2SavedKg);
    counters.set("basket co2ExtraKg", r.co2ExtraKg);

    if (r.goodCount + r.fairCount + r.poorCount + r.unknownCount !== r.itemCount) {
      report("ERROR", "basket", `grade buckets sum to ${r.goodCount + r.fairCount + r.poorCount + r.unknownCount}, basket holds ${r.itemCount}`);
    }
    if (r.overallScore < 0 || r.overallScore > 100) {
      report("ERROR", "basket", `overall score ${r.overallScore} outside 0–100`);
    }
    if (r.scoredCount > 0 && r.overallGrade !== gradeFromScore(r.overallScore)) {
      report("ERROR", "basket", `overall grade "${r.overallGrade}" does not match the score ${r.overallScore}`);
    }
    if (Math.abs(r.co2NetKg - (r.co2SavedKg - r.co2ExtraKg)) > 0.15) {
      report("ERROR", "basket", `net CO₂ ${r.co2NetKg} ≠ saved ${r.co2SavedKg} − extra ${r.co2ExtraKg}`);
    }
    // A per-item swing of more than ~10 kg CO₂e means a unit conversion is off:
    // the grade ladder tops out at 8 kg/kg and real food rarely exceeds ~60.
    const perItem = (r.co2SavedKg + r.co2ExtraKg) / Math.max(1, r.co2ScoredCount);
    if (perItem > 20) {
      report("ERROR", "basket", `CO₂ totals average ${perItem.toFixed(1)} kg per scored item — a unit conversion is wrong somewhere`);
    }
  });
});
