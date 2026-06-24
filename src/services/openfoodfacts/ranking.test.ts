import { describe, it, expect } from "vitest";
import { imageQualityTier, scoreDataCompleteness, rankByQuality } from "./index";
import type { OpenFoodFactsResult, OpenFoodFactsProduct } from "./types";

function mock(p: Partial<OpenFoodFactsResult>, raw?: Partial<OpenFoodFactsProduct>): OpenFoodFactsResult {
  return {
    found: true, barcode: "0", productName: null, brand: null,
    ecoscoreGrade: null, ecoscoreScore: null, nutriscoreGrade: null,
    nutriscoreScore: null, novaGroup: null, carbonFootprint100g: null,
    carbonFootprintProduct: null, carbonFootprintServing: null,
    labels: [], categories: [], origins: null, ingredientsText: null,
    imageUrl: null, ecoscoreData: null,
    rawProduct: raw ? ({ ...raw } as OpenFoodFactsProduct) : null,
    ...p,
  };
}

describe("imageQualityTier", () => {
  it("ranks curated front photo > selected front > raw image > none", () => {
    const curated = mock(
      { imageUrl: "x" },
      { image_front_url: "x", states_tags: ["en:front-photo-selected"] },
    );
    const selected = mock({ imageUrl: "x" }, { image_front_url: "x", states_tags: [] });
    const rawOnly = mock({ imageUrl: "x" }, { image_front_url: undefined });
    const none = mock({ imageUrl: null });
    expect(imageQualityTier(curated)).toBe(3);
    expect(imageQualityTier(selected)).toBe(2);
    expect(imageQualityTier(rawOnly)).toBe(1);
    expect(imageQualityTier(none)).toBe(0);
  });
});

describe("scoreDataCompleteness", () => {
  it("scores a fully-populated product above a near-empty one", () => {
    const rich = mock({
      ecoscoreGrade: "b", ecoscoreScore: 70, nutriscoreGrade: "c", novaGroup: 3,
      ingredientsText: "milk, sugar", categories: ["chocolates"], labels: ["organic"],
      brand: "X", productName: "Bar",
      ecoscoreData: { agribalyse: { co2_total: 2.1 } } as never,
    });
    const sparse = mock({ brand: "X", productName: "Bar" });
    expect(scoreDataCompleteness(rich)).toBeGreaterThan(scoreDataCompleteness(sparse));
  });
});

describe("rankByQuality", () => {
  const sparseFirst = mock({ productName: "Oat Milk", brand: "Alpro" });
  const richSecond = mock(
    {
      productName: "Oat Milk", brand: "Alpro",
      ecoscoreGrade: "a", ecoscoreScore: 80, nutriscoreGrade: "a", novaGroup: 1,
      ingredientsText: "oats, water", imageUrl: "x",
      ecoscoreData: { agribalyse: { co2_total: 0.4 } } as never,
    },
    { image_front_url: "x", states_tags: ["en:front-photo-selected"] },
  );

  it("promotes the richer, clean-image product over an equally-relevant sparse one returned first", () => {
    const ranked = rankByQuality("Alpro Oat Milk", [sparseFirst, richSecond]);
    expect(ranked[0]).toBe(richSecond);
  });

  it("keeps relevance dominant — a more-relevant sparse product beats a less-relevant rich one", () => {
    const relevantSparse = mock({ productName: "Alpro Oat Milk", brand: "Alpro" });
    const irrelevantRich = mock(
      {
        productName: "Coca-Cola Zero", brand: "Coca-Cola",
        ecoscoreGrade: "a", nutriscoreGrade: "a", novaGroup: 1, imageUrl: "x",
        ecoscoreData: { agribalyse: { co2_total: 0.2 } } as never,
      },
      { image_front_url: "x", states_tags: ["en:front-photo-selected"] },
    );
    const ranked = rankByQuality("Alpro Oat Milk", [irrelevantRich, relevantSparse]);
    expect(ranked[0]).toBe(relevantSparse);
  });

  it("is stable for products that tie on every signal", () => {
    const a = mock({ productName: "Oat Milk", brand: "Alpro", barcode: "a" });
    const b = mock({ productName: "Oat Milk", brand: "Alpro", barcode: "b" });
    const ranked = rankByQuality("Alpro Oat Milk", [a, b]);
    expect(ranked.map((r) => r.barcode)).toEqual(["a", "b"]);
  });
});
