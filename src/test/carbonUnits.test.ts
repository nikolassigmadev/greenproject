// @vitest-environment jsdom
//
// Regression tests for the one conversion the app gets wrong most easily.
//
// Open Food Facts stores `carbon-footprint-from-known-ingredients_100g` in
// GRAMS of CO₂e per 100 g of product (the detail card renders it as "g CO₂e /
// 100g"). Every kg-per-kg figure in the app therefore divides it by 100.
// Multiplying by 10 — treating grams as kilograms — inflates the result 1000×,
// and that slip lived in the basket totals, the swap cards and the swap engine
// until the random-scan simulation caught it. These tests pin the units down.

import { describe, it, expect } from "vitest";
import { GRADE_CO2_KG, BASELINE_CO2_KG, gradeCo2PerKg } from "@/utils/carbonEstimates";
import { getBasketEthicsReport, type BasketItem } from "@/utils/basketStorage";

function item(over: Partial<BasketItem>): BasketItem {
  return {
    id: "test-item",
    barcode: "0000000000000",
    productName: "Test product",
    brand: "Test brand",
    imageUrl: null,
    ecoscoreGrade: null,
    ecoscoreScore: null,
    nutriscoreGrade: null,
    laborAllegations: 0,
    co2Per100g: null,
    addedAt: Date.now(),
    ...over,
  };
}

describe("carbon estimates", () => {
  it("covers every eco grade Open Food Facts serves, worst-first", () => {
    for (const g of ["a-plus", "a", "b", "c", "d", "e", "f"]) {
      expect(GRADE_CO2_KG[g], `grade "${g}" has no CO₂ estimate`).toBeTypeOf("number");
    }
    // Monotonic: a worse grade never estimates less carbon than a better one.
    const ladder = ["a-plus", "a", "b", "c", "d", "e", "f"].map(g => GRADE_CO2_KG[g]);
    for (let i = 1; i < ladder.length; i++) {
      expect(ladder[i], `grade ladder is not monotonic at index ${i}`).toBeGreaterThan(ladder[i - 1]);
    }
    expect(gradeCo2PerKg("F")).toBe(GRADE_CO2_KG.f); // case-insensitive
    expect(gradeCo2PerKg("unknown")).toBeNull();
    expect(gradeCo2PerKg(null)).toBeNull();
  });

  it("reads carbonFootprint100g as grams per 100 g, not kilograms", () => {
    // 350 g CO₂e / 100 g  ⇒  3.5 kg CO₂e / kg  ⇒  1.0 kg above the 2.5 baseline.
    const report = getBasketEthicsReport([item({ co2Per100g: 350 })]);
    expect(report.co2ScoredCount).toBe(1);
    expect(report.co2ExtraKg).toBeCloseTo(3.5 - BASELINE_CO2_KG, 5);
    expect(report.co2SavedKg).toBe(0);
    // The old ×10 conversion produced 3,500 kg/kg here.
    expect(report.co2ExtraKg).toBeLessThan(10);
  });

  it("falls back to the grade ladder when there is no measured figure", () => {
    const report = getBasketEthicsReport([item({ ecoscoreGrade: "a" })]);
    expect(report.co2SavedKg).toBeCloseTo(BASELINE_CO2_KG - GRADE_CO2_KG.a, 5);
  });

  it("counts an F-graded product instead of dropping it from the totals", () => {
    const report = getBasketEthicsReport([item({ ecoscoreGrade: "f" })]);
    expect(report.co2ScoredCount).toBe(1);
    expect(report.co2ExtraKg).toBeCloseTo(GRADE_CO2_KG.f - BASELINE_CO2_KG, 5);
  });
});
