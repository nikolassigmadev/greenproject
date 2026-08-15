// Tests for the exposure→conversion instrumentation.
//
// These columns exist to be read as evidence, so the things worth pinning down
// are the ones that would quietly produce a wrong number rather than an error:
//   - the swap-gap funnel naming the wrong stage (turning "our catalog is thin"
//     into "the market has a gap", which is the stronger and less true claim)
//   - a scan_event_id that doesn't actually pair the two rows
//   - dwell that keeps counting after the user has gone to lunch
//   - the INSERT drifting out of arity with its column list

import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { assessUnmetDemand } from "@/services/swaps";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import { DEFAULT_PRIORITIES } from "@/utils/userPreferences";
import {
  beginScanEvent, getScanEventId, getDwellMs, getSwapEngagement,
  markSwapShown, markSwapClicked, MAX_DWELL_MS,
} from "@/utils/scanSession";
// Server-side JS module — imported directly so the sanitiser under test is the
// exact one the insert path uses, not a copy.
import { imageData } from "../../db/scanStore.js";

function makeProduct(over: Partial<OpenFoodFactsResult>): OpenFoodFactsResult {
  return {
    found: true, barcode: "0000000000000", productName: null, brand: null,
    ecoscoreGrade: null, ecoscoreScore: null, nutriscoreGrade: null, nutriscoreScore: null,
    novaGroup: null, carbonFootprint100g: null, carbonFootprintProduct: null,
    carbonFootprintServing: null, labels: [], categories: [], origins: null,
    ingredientsText: null, imageUrl: null, ecoscoreData: null, rawProduct: null,
    ...over,
  };
}

// ── swap_gap_reason ──────────────────────────────────────────────────────────

describe("assessUnmetDemand — swapGapReason", () => {
  it("is null when the product carries no concern at all", () => {
    const clean = makeProduct({ brand: "Tony's Chocolonely", productName: "Milk Chocolate", ecoscoreGrade: "b" });
    const d = assessUnmetDemand(clean, DEFAULT_PRIORITIES, "GB");
    expect(d.primaryConcern).toBeNull();
    expect(d.swapAvailable).toBeNull();
    expect(d.swapGapReason).toBeNull();
  });

  it("reports no_candidate_in_catalog when the product doesn't map to a catalog category", () => {
    // Nestlé is boycott-listed, so there IS a concern; "motor oil" maps to no
    // swap category, so the pool is empty.
    const d = assessUnmetDemand(
      makeProduct({ brand: "Nestlé", productName: "Industrial Motor Oil 5W30", categories: [] }),
      DEFAULT_PRIORITIES,
      "GB",
    );
    expect(d.primaryConcern).not.toBeNull();
    expect(d.swapAvailable).toBe(false);
    expect(d.swapGapReason).toBe("no_candidate_in_catalog");
  });

  it("never reports a gap reason while also reporting a swap as available", () => {
    // Whatever the inputs, these two must never contradict each other — that
    // contradiction is what would make the unmet-demand numbers unreadable.
    const cases: OpenFoodFactsResult[] = [
      makeProduct({ brand: "Nestlé", productName: "KitKat", categories: ["Chocolates"] }),
      makeProduct({ brand: "Mars", productName: "Snickers", categories: ["Chocolates"] }),
      makeProduct({ brand: "Nestlé", productName: "Nescafé", categories: ["Coffees"] }),
      makeProduct({ brand: "Unknown Brand", productName: "Thing", ecoscoreGrade: "e" }),
    ];
    for (const p of cases) {
      for (const country of ["GB", "US", "ID", null]) {
        const d = assessUnmetDemand(p, DEFAULT_PRIORITIES, country);
        if (d.swapAvailable === true) {
          expect(d.swapGapReason, `${p.brand} in ${country}`).toBeNull();
        } else if (d.swapAvailable === false) {
          expect(d.swapGapReason, `${p.brand} in ${country}`).not.toBeNull();
        } else {
          // null = no concern to address
          expect(d.swapGapReason).toBeNull();
        }
      }
    }
  });

  it("only ever emits reasons the database column accepts", () => {
    // The server validates with oneOf(); an unlisted value would be silently
    // dropped to null, which reads identically to "a swap was available".
    const allowed = new Set(["no_candidate_in_catalog", "wrong_concern", "failed_clean", "not_sold_here"]);
    const products = ["Nestlé", "Mars", "Mondelez", "Ferrero", "Unilever", "PepsiCo"].flatMap((brand) => [
      makeProduct({ brand, productName: brand, categories: ["Chocolates"] }),
      makeProduct({ brand, productName: brand, categories: ["Coffees"] }),
      makeProduct({ brand, productName: brand, ecoscoreGrade: "e" }),
    ]);
    for (const p of products) {
      const r = assessUnmetDemand(p, DEFAULT_PRIORITIES, "GB").swapGapReason;
      if (r !== null) expect(allowed.has(r), `unexpected reason "${r}" for ${p.brand}`).toBe(true);
    }
  });
});

// ── scan_event_id / dwell_ms / swap engagement ───────────────────────────────

describe("scanSession", () => {
  beforeEach(() => sessionStorage.clear());

  it("gives the exposure row and the conversion row the same id", () => {
    const minted = beginScanEvent("123");
    expect(getScanEventId("123")).toBe(minted);
  });

  it("refuses to hand an id to a different product", () => {
    beginScanEvent("123");
    expect(getScanEventId("456")).toBeNull();
    expect(getDwellMs("456")).toBeNull();
  });

  it("mints a fresh id per page view, so a revisit isn't merged into the old one", () => {
    const first = beginScanEvent("123");
    const second = beginScanEvent("123");
    expect(second).not.toBe(first);
  });

  it("clamps dwell so an abandoned tab can't poison the average", () => {
    beginScanEvent("123");
    const raw = JSON.parse(sessionStorage.getItem("goodscan-scan-event")!);
    // Pretend the page opened an hour ago.
    sessionStorage.setItem("goodscan-scan-event", JSON.stringify({ ...raw, openedAt: Date.now() - 3_600_000 }));
    expect(getDwellMs("123")).toBe(MAX_DWELL_MS);
  });

  it("tracks shown and clicked as separate stages", () => {
    beginScanEvent("123");
    expect(getSwapEngagement("123")).toEqual({ swapShown: false, swapClicked: false });
    markSwapShown("123");
    expect(getSwapEngagement("123")).toEqual({ swapShown: true, swapClicked: false });
    markSwapClicked("123");
    expect(getSwapEngagement("123")).toEqual({ swapShown: true, swapClicked: true });
  });

  it("treats a click as implying it was shown", () => {
    beginScanEvent("123");
    markSwapClicked("123");
    expect(getSwapEngagement("123").swapShown).toBe(true);
  });

  it("reports nulls rather than false when there is no live event", () => {
    // false would mean "we looked and it didn't happen"; null means "we don't know".
    expect(getSwapEngagement("nope")).toEqual({ swapShown: null, swapClicked: null });
  });
});

// ── image validation ─────────────────────────────────────────────────────────

describe("imageData", () => {
  // A real 1x1 JPEG, so the happy path is tested against actual bytes rather
  // than something hand-assembled to satisfy the check.
  const JPEG_1PX =
    "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a" +
    "HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAA" +
    "AAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==";

  it("accepts a real JPEG, with or without the data: prefix", () => {
    expect(imageData(JPEG_1PX)).toBe(JPEG_1PX);
    expect(imageData(`data:image/jpeg;base64,${JPEG_1PX}`)).toBe(JPEG_1PX);
  });

  it("accepts line-wrapped base64", () => {
    const wrapped = JPEG_1PX.match(/.{1,76}/g)!.join("\n");
    expect(imageData(wrapped)).toBe(JPEG_1PX);
  });

  it("rejects a PNG — right shape, wrong format", () => {
    // PNG magic is 89 50 4E 47. Long enough to pass any length check.
    const png = Buffer.from("89504e470d0a1a0a" + "00".repeat(200), "hex").toString("base64");
    expect(imageData(png)).toBeNull();
  });

  it("rejects text that merely looks like base64", () => {
    // This is the case a length-only check waves through.
    const text = Buffer.from("this is not an image, it is a sentence".repeat(20)).toString("base64");
    expect(imageData(text)).toBeNull();
  });

  it("rejects non-base64 characters instead of letting Buffer silently drop them", () => {
    expect(imageData("!!!!" + JPEG_1PX)).toBeNull();
    expect(imageData("<script>alert(1)</script>")).toBeNull();
  });

  it("still rejects empty, oversized and non-string input", () => {
    expect(imageData("")).toBeNull();
    expect(imageData(null)).toBeNull();
    expect(imageData(123)).toBeNull();
    expect(imageData("/9j/" + "A".repeat(3_000_001))).toBeNull();
  });
});

// ── the INSERT itself ────────────────────────────────────────────────────────

describe("scanStore INSERT arity", () => {
  it("keeps the column list, the placeholders and the values array in lockstep", () => {
    // A silent off-by-one here writes every column after the mismatch into the
    // wrong field. Postgres only catches it when the types happen to disagree.
    // jsdom's import.meta.url isn't a file: URL, so resolve from the repo root.
    const src = readFileSync(resolve(process.cwd(), "db/scanStore.js"), "utf8");
    const stmt = src.match(/INSERT INTO ai_scans\s*\n\s*\(([\s\S]*?)\)\s*\n\s*VALUES\s*\(([\s\S]*?)\)`/);
    expect(stmt, "could not locate the ai_scans INSERT").not.toBeNull();

    const columns = stmt![1].split(",").map((s) => s.trim()).filter(Boolean);
    const placeholders = stmt![2].match(/\$\d+/g) ?? [];

    const valuesSrc = src.match(/const values = \[([\s\S]*?)\n {4}\];/)![1];
    let depth = 0, cur = "";
    const values: string[] = [];
    for (const ch of valuesSrc) {
      if ("([{".includes(ch)) depth++;
      else if (")]}".includes(ch)) depth--;
      if (ch === "," && depth === 0) { values.push(cur); cur = ""; } else cur += ch;
    }
    values.push(cur);
    const cleaned = values.map((s) => s.replace(/\/\/.*$/gm, "").trim()).filter(Boolean);

    expect(placeholders.length).toBe(columns.length);
    expect(cleaned.length).toBe(columns.length);
    // Placeholders must also be $1..$n in order, not just the right count.
    expect(placeholders.map((p) => Number(p.slice(1)))).toEqual(
      Array.from({ length: columns.length }, (_, i) => i + 1),
    );
  });
});
