// Keeps the two labour datasets from contradicting each other.
//
// The bug this locks shut: brandFlags.v2 drove the BANNERS and laborCheck's
// regexes drove the SCORE, and 22 of 33 verified labour flags matched no regex.
// A Tyson product rendered "critical child labour" at the top of the page and a
// verdict computed as though its labour record were clean. Both statements came
// from the same app, on the same screen, at the same time.
//
// The failure mode is silent — nothing errors, the page just disagrees with
// itself — so it needs a test rather than a comment asking people to be careful.
// The old comment asking people to be careful is what was there before.

import { describe, it, expect } from "vitest";
import { LABOR_DATABASE, findLaborAllegations } from "@/utils/laborCheck";
import { brandFlagsV2 } from "@/data/brandFlags.v2";
import { getVerifiedFlagsForBrand } from "@/services/brandFlags";

const LABOUR_CATEGORIES = new Set([
  "forced_labour", "child_labour", "wage_theft", "unsafe_conditions", "union_busting",
]);

const verifiedLabourFlags = brandFlagsV2.filter(
  (f) => f.status === "verified" && LABOUR_CATEGORIES.has(f.category),
);

describe("labour datasets — banners and scoring agree", () => {
  it("has flags to check", () => {
    // Guards against the suite silently passing because a filter went wrong.
    expect(verifiedLabourFlags.length).toBeGreaterThan(20);
  });

  it("makes every verified labour flag reachable by the scorer", () => {
    // This is the whole point. If a flag can put a banner on the page, the same
    // brand must produce an allegation for the verdict — otherwise the page
    // shows a critical warning next to a score that ignores it.
    const unreachable: string[] = [];
    for (const flag of verifiedLabourFlags) {
      const record = findLaborAllegations(flag.brandName, null);
      if (!record || record.allegations.length === 0) {
        unreachable.push(`${flag.brandName} (${flag.category})`);
      }
    }
    expect(unreachable, `flags that banner but do not score:\n  ${unreachable.join("\n  ")}`).toEqual([]);
  });

  it("also reaches the scorer through brand aliases", () => {
    // Users scan "KitKat", not "Nestlé S.A.". A flag that only resolves from its
    // canonical brandName is unreachable in practice.
    const missed: string[] = [];
    for (const flag of verifiedLabourFlags) {
      for (const alias of flag.brandAliases ?? []) {
        if (!findLaborAllegations(alias, null)) missed.push(`${flag.brandName} via "${alias}"`);
      }
    }
    expect(missed, `aliases that banner but do not score:\n  ${missed.join("\n  ")}`).toEqual([]);
  });

  it("keeps the hand-written records winning over the derived ones", () => {
    // LABOR_DATABASE is kept first for its richer per-allegation prose. If the
    // fallback started shadowing it, those companies would silently lose their
    // detail and their existing verdicts would shift.
    for (const record of LABOR_DATABASE) {
      const found = findLaborAllegations(record.parentCompany, null);
      expect(found?.parentCompany, `${record.parentCompany} no longer resolves to its own record`)
        .toBe(record.parentCompany);
      expect(found?.allegations).toEqual(record.allegations);
    }
  });

  it("does not invent allegations for brands with no labour finding at all", () => {
    // The fallback must not turn every flag category into a labour allegation:
    // an animal-welfare or environmental flag is a real finding, but it is not
    // a labour one and must not be scored as such.
    const nonLabour = brandFlagsV2.find(
      (f) => f.status === "verified" && !LABOUR_CATEGORIES.has(f.category)
        && getVerifiedFlagsForBrand(f.brandName).every((g) => !LABOUR_CATEGORIES.has(g.category))
        // ...and not one of the ten companies with a hand-written record here,
        // which legitimately resolves through LABOR_DATABASE regardless of its
        // v2 flag categories (Danone is both, which is what caught this).
        && !LABOR_DATABASE.some((r) => r.brandPattern.test(f.brandName.toLowerCase())),
    );
    if (nonLabour) {
      expect(findLaborAllegations(nonLabour.brandName, null)).toBeNull();
    }
    // And an unrelated brand stays clean.
    expect(findLaborAllegations("Tony's Chocolonely", "Milk Chocolate")).toBeNull();
    expect(findLaborAllegations("A Brand That Does Not Exist", null)).toBeNull();
  });

  it("gives every derived allegation a real citation", () => {
    // A derived allegation still renders in the allegation list with a source
    // link. Deriving one without a URL would put "See methodology" in front of
    // a user where a citation belongs.
    for (const flag of verifiedLabourFlags) {
      const record = findLaborAllegations(flag.brandName, null);
      for (const a of record?.allegations ?? []) {
        expect(a.sourceUrl, `${flag.brandName} allegation has no source URL`).toBeTruthy();
        expect(a.issue.length, `${flag.brandName} allegation has no issue text`).toBeGreaterThan(0);
      }
    }
  });
});
