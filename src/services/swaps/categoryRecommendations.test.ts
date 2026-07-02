import { describe, it, expect } from "vitest";
import { rankCategoryCandidates, detectCategoryFromText } from "./index";
import { isInMarket } from "@/data/ethicalAlternatives";
import { DEFAULT_PRIORITIES, type UserPriorities } from "@/utils/userPreferences";

describe("detectCategoryFromText", () => {
  it.each([
    ["coffee", "coffee"],
    ["dark chocolate", "chocolate"],
    ["eggs", "eggs"],
    ["tea bags", "tea"],
    ["milk", "milk"],
  ] as const)("maps '%s' → %s", (text, expected) => {
    expect(detectCategoryFromText(text)).toBe(expected);
  });

  it("returns null for things without a curated category", () => {
    expect(detectCategoryFromText("toilet paper")).toBeNull();
    expect(detectCategoryFromText("")).toBeNull();
  });
});

describe("rankCategoryCandidates", () => {
  it("returns candidates for every curated category term users would type", () => {
    for (const key of ["coffee", "chocolate", "tea", "eggs", "milk"] as const) {
      expect(rankCategoryCandidates(key, null).length).toBeGreaterThan(0);
    }
  });

  it("never recommends a brand twice", () => {
    const ranked = rankCategoryCandidates("chocolate", null);
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const brands = ranked.map((c) => norm(c.brand));
    expect(new Set(brands).size).toBe(brands.length);
  });

  it("prefers in-market candidates when a country is set", () => {
    const ranked = rankCategoryCandidates("chocolate", "GB");
    // With ≥2 in-market options the pool is filtered — everything left must be
    // in-market (or globally available).
    expect(ranked.length).toBeGreaterThanOrEqual(2);
    for (const c of ranked) {
      expect(isInMarket(c, "GB")).toBe(true);
    }
  });

  it("lets priorities reorder the picks", () => {
    const welfareFirst: UserPriorities = {
      ...DEFAULT_PRIORITIES,
      animalWelfare: 100,
      laborRights: 25,
      environment: 25,
    };
    const ranked = rankCategoryCandidates("chocolate", null, welfareFirst);
    const top = ranked.filter((c) => !c.custom)[0];
    // The strongest animal-welfare priority should surface a candidate that
    // actually addresses animal welfare (when the category has any).
    const hasWelfareOption = rankCategoryCandidates("chocolate", null)
      .some((c) => c.addresses.includes("animal_welfare"));
    if (hasWelfareOption) {
      expect(top.addresses).toContain("animal_welfare");
    }
  });
});
