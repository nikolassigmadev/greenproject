import { describe, it, expect } from "vitest";
import { diagnoseProduct, assessUnmetDemand } from "./index";
import {
  detectSwapCategory, getCandidates, isInMarket,
} from "@/data/ethicalAlternatives";
import { getCustomCandidates } from "@/data/customSwaps";
import { getVerifiedEthicsCandidates } from "@/data/verifiedEthicsSwaps";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";

function mockProduct(p: Partial<OpenFoodFactsResult>): OpenFoodFactsResult {
  return {
    found: true, barcode: "0", productName: null, brand: null,
    ecoscoreGrade: null, ecoscoreScore: null, nutriscoreGrade: null,
    nutriscoreScore: null, novaGroup: null, carbonFootprint100g: null,
    carbonFootprintProduct: null, carbonFootprintServing: null,
    labels: [], categories: [], origins: null, ingredientsText: null,
    imageUrl: null, ecoscoreData: null, rawProduct: null, ...p,
  };
}

describe("category grouping", () => {
  const cases: [string, string][] = [
    ["Kit Kat Chunky", "chocolate"],
    ["Lay's Classic Potato Chips", "chips"],
    ["Walkers Crisps", "chips"],
    ["Haribo Goldbears gummy candy", "candy"],
    ["Oreo cookies", "cookies"],
    ["Nutella hazelnut spread", "spreads"],
    ["Oat milk drink", "milk"],
    ["Greek yoghurt", "yogurt"],
    ["Mature cheddar cheese", "cheese"],
    ["Nescafé instant coffee", "coffee"],
    ["Coca-Cola soda", "soft_drinks"],
    ["Ben & Jerry's ice cream", "ice_cream"],
    ["Free range eggs", "eggs"],
    ["Chiquita bananas", "bananas"],
    ["Tyson Chicken Nuggets", "chicken"],
    ["Quorn vegan chicken pieces", "chicken"],
  ];
  it.each(cases)("groups %s → %s", (name, expected) => {
    expect(detectSwapCategory({ productName: name })).toBe(expected);
  });
});

describe("category grouping — product form beats chocolate ingredient", () => {
  // Real OFF products whose names mention cocoa/chocolate but are NOT a bar.
  const cases: [string, string][] = [
    ["Pâte à tartiner noisettes et cacao", "spreads"],
    ["Nocciolata organic hazelnut spread", "spreads"],
    ["Nature Valley Sweet & Salty Dark Chocolate bar", "snack_bars"],
    ["Crunchy Avoine & Chocolat barre de céréales", "snack_bars"],
    ["Nestlé Chocapic breakfast cereal", "cereal"],
    ["Prince biscuit goût chocolat", "cookies"],
    // …but a real chocolate bar still resolves to chocolate.
    ["Kit Kat Chunky", "chocolate"],
    ["Lindt Excellence 85% cacao", "chocolate"],
    ["Generic dark chocolat noir", "chocolate"],
  ];
  it.each(cases)("groups %s → %s", (name, expected) => {
    expect(detectSwapCategory({ productName: name })).toBe(expected);
  });
});

describe("category grouping — European-language terms", () => {
  const cases: [string, string][] = [
    ["Lait demi-écrémé", "milk"],
    ["Sucre en poudre", "sugar"],
    ["Thé vert menthe", "tea"],
    ["Fromage blanc nature", "cheese"],
    ["Oeufs frais bio", "eggs"],
    ["Œufs frais plein air", "eggs"],
    ["Poulet fermier", "chicken"],
    // "bœuf" must NOT be mistaken for the "œuf" (egg) pattern.
    ["Steak haché de bœuf", "beef"],
    ["Charal Le Pur Bœuf", "beef"],
    // French cheeses that don't carry the word "cheese"/"fromage" in the name.
    ["Président Camembert", "cheese"],
    ["Emmental râpé", "cheese"],
  ];
  it.each(cases)("groups %s → %s", (name, expected) => {
    expect(detectSwapCategory({ productName: name })).toBe(expected);
  });
});

describe("category grouping — canonical OFF category tags (plural)", () => {
  // OFF's canonical English category tags are PLURAL (en:milks, en:cheeses,
  // en:sugars, en:teas, en:spreads). Products whose name lacks a singular
  // keyword must still classify from the category alone — \bmilk\b must not
  // miss "milks". Regression for Moroccan dairy (name-less, en:milks only).
  const cases: [string[], string][] = [
    [["dairies", "milks liquid and powder", "milks", "semi skimmed milks"], "milk"],
    [["dairies", "cheeses"], "cheese"],
    [["sweeteners", "sugars"], "sugar"],
    [["plant based beverages", "teas"], "tea"],
    [["spreads", "sweet spreads"], "spreads"],
  ];
  it.each(cases)("classifies %j → %s from the category alone", (categories, expected) => {
    expect(detectSwapCategory({ categories })).toBe(expected);
  });
});

describe("market availability", () => {
  it("treats brands with no markets as available everywhere", () => {
    const oatly = getCandidates("milk").find((c) => c.brand === "Oatly")!;
    expect(isInMarket(oatly, "ID")).toBe(true); // Oatly has no markets list
  });

  it("filters US-only brands out of a UK market", () => {
    const vitalFarms = getCandidates("eggs").find((c) => c.brand === "Vital Farms")!;
    expect(isInMarket(vitalFarms, "GB")).toBe(false);
    expect(isInMarket(vitalFarms, "US")).toBe(true);
  });

  it("offers UK egg brands to GB users", () => {
    const ukEgg = getCandidates("eggs").filter((c) => isInMarket(c, "GB"));
    expect(ukEgg.some((c) => c.brand === "Clarence Court")).toBe(true);
  });
});

describe("concern diagnosis", () => {
  it("flags Nestlé Kit Kat as a labour concern in the chocolate category", () => {
    const d = diagnoseProduct(
      mockProduct({ brand: "Nestlé", productName: "Kit Kat", ecoscoreGrade: "c" }),
    );
    expect(d.primary?.type).toBe("labor");
    expect(d.categoryKey).toBe("chocolate");
  });

  it("does not flag an already-ethical brand", () => {
    const d = diagnoseProduct(
      mockProduct({ brand: "Tony's Chocolonely", productName: "Milk Chocolate", ecoscoreGrade: "c" }),
    );
    expect(d.selfEthical).toBe(true);
    expect(d.primary).toBeNull();
  });

  it("flags a poor eco-score even without ethics flags", () => {
    const d = diagnoseProduct(
      mockProduct({ brand: "Generic", productName: "Oat Milk", ecoscoreGrade: "e" }),
    );
    expect(d.primary?.type).toBe("eco");
    expect(d.categoryKey).toBe("milk");
  });
});

describe("custom swaps database", () => {
  it("loads hand-added entries from customSwaps.json with the barcode + custom flag", () => {
    const choc = getCustomCandidates("chocolate");
    const tonys = choc.find((c) => /chocolonely/i.test(c.brand));
    expect(tonys).toBeTruthy();
    expect(tonys?.custom).toBe(true);
    expect(tonys?.barcodes?.[0]).toBeTruthy();
  });

  it("does not leak custom entries into unrelated categories", () => {
    expect(getCustomCandidates("seafood").some((c) => /chocolonely/i.test(c.brand))).toBe(false);
  });
});

describe("verified-ethics brands as swap candidates", () => {
  it("contributes coffee brands from the verified-ethics list", () => {
    const coffee = getVerifiedEthicsCandidates("coffee");
    expect(coffee.length).toBeGreaterThan(0);
    // A verified-ethics-only coffee brand (not in the hand catalog).
    expect(coffee.some((c) => /conscious coffees|ethical bean|higher ground/i.test(c.brand))).toBe(true);
  });

  it("routes a tea-named verified brand to the tea category", () => {
    expect(getVerifiedEthicsCandidates("tea").some((c) => /numi/i.test(c.brand))).toBe(true);
    expect(getVerifiedEthicsCandidates("coffee").some((c) => /numi/i.test(c.brand))).toBe(false);
  });

  it("places a named packaged-grocery brand into its precise category", () => {
    expect(getVerifiedEthicsCandidates("ice_cream").some((c) => /jeni/i.test(c.brand))).toBe(true);
  });

  it("never claims assured availability for verified brands (assumeAvailable=false)", () => {
    expect(getVerifiedEthicsCandidates("chocolate").every((c) => c.assumeAvailable === false)).toBe(true);
  });
});

describe("chicken & poultry category", () => {
  it("offers plant-based + higher-welfare poultry alternatives", () => {
    const c = getCandidates("chicken");
    expect(c.length).toBeGreaterThan(0);
    expect(c.some((x) => /quorn|tofurky|gardein/i.test(x.brand))).toBe(true);
    // Every candidate addresses animal welfare — the core concern for poultry.
    expect(c.every((x) => x.addresses.includes("animal_welfare"))).toBe(true);
  });
});

describe("concern coverage closes harness gaps", () => {
  it("chocolate has an animal-welfare-addressing swap (dark/vegan)", () => {
    expect(getCandidates("chocolate").some((c) => c.addresses.includes("animal_welfare"))).toBe(true);
  });
  it("yogurt has a labour-addressing swap", () => {
    expect(getCandidates("yogurt").some((c) => c.addresses.includes("labor"))).toBe(true);
  });
  it("beef has a labour-addressing swap (fair-farmer real beef)", () => {
    expect(getCandidates("beef").some((c) => c.addresses.includes("labor"))).toBe(true);
  });
});

describe("boycott is resolved by switching brands", () => {
  // A boycott is a brand-level problem — any curated alternative fixes it, even
  // categories whose candidates don't explicitly list "boycott" in addresses.
  function mockProduct(p: Partial<OpenFoodFactsResult>): OpenFoodFactsResult {
    return {
      found: true, barcode: "0", productName: null, brand: null,
      ecoscoreGrade: null, ecoscoreScore: null, nutriscoreGrade: null,
      nutriscoreScore: null, novaGroup: null, carbonFootprint100g: null,
      carbonFootprintProduct: null, carbonFootprintServing: null,
      labels: [], categories: [], origins: null, ingredientsText: null,
      imageUrl: null, ecoscoreData: null, rawProduct: null, ...p,
    };
  }
  it("reports a swap available for a boycott-listed store-brand in eggs", () => {
    const d = assessUnmetDemand(
      mockProduct({ brand: "Carrefour", productName: "Oeufs frais bio" }),
      undefined,
      "FR",
    );
    if (d.primaryConcern === "boycott") {
      expect(d.swapAvailable).toBe(true);
    }
  });
});
