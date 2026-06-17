import { describe, it, expect } from "vitest";
import { diagnoseProduct } from "./index";
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
  ];
  it.each(cases)("groups %s → %s", (name, expected) => {
    expect(detectSwapCategory({ productName: name })).toBe(expected);
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
