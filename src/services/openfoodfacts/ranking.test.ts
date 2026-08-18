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

/**
 * Guards the threshold that decides whether lookupBarcode probes alternative
 * barcode formats for a richer record.
 *
 * The bug being pinned: the same physical product exists on Open Food Facts
 * under both a UPC-12 and an EAN-13 entry, and they are routinely uneven. A
 * shopper was being told "no eco data" for a product whose data sat one leading
 * zero away, because the lookup returned the first entry that existed.
 */
describe("DATA_RICH_ENOUGH calibration", () => {
  const RICH_ENOUGH = 40; // must match the constant in index.ts

  it("treats a stub as NOT rich enough, so alternatives get checked", () => {
    const stub = mock({ brand: "X", productName: "Bar", categories: ["c"] });
    expect(scoreDataCompleteness(stub)).toBeLessThan(RICH_ENOUGH);
  });

  it("still treats a name+ingredients+nutriscore entry as not rich enough", () => {
    // No eco-score. This is the case that makes the verdict page look broken,
    // so it must fall through to the alternative-format check.
    const noEco = mock({
      brand: "X", productName: "Bar", categories: ["c"],
      ingredientsText: "milk, sugar", nutriscoreGrade: "c", novaGroup: 3,
    });
    expect(scoreDataCompleteness(noEco)).toBeLessThan(RICH_ENOUGH);
  });

  it("treats an entry WITH an eco-score as rich enough to return immediately", () => {
    const withEco = mock({
      brand: "X", productName: "Bar", categories: ["c"],
      ingredientsText: "milk, sugar", nutriscoreGrade: "c",
      ecoscoreGrade: "b", ecoscoreScore: 70,
    });
    expect(scoreDataCompleteness(withEco)).toBeGreaterThanOrEqual(RICH_ENOUGH);
  });

  it("ranks the richer of two entries for the same product above the sparser", () => {
    const ean13 = mock({ barcode: "0012345678905", brand: "X", productName: "Bar" });
    const upc12 = mock({
      barcode: "012345678905", brand: "X", productName: "Bar",
      ecoscoreGrade: "b", ecoscoreScore: 70, ingredientsText: "milk",
      categories: ["c"], nutriscoreGrade: "c",
    });
    const best = [ean13, upc12].reduce((a, b) =>
      scoreDataCompleteness(b) > scoreDataCompleteness(a) ? b : a,
    );
    expect(best.barcode).toBe("012345678905");
  });

  it("keeps the primary entry on a tie", () => {
    // Ties must not swap records: the primary is the number physically on the
    // packet in the shopper's hand.
    const primary = mock({ barcode: "PRIMARY", brand: "X", productName: "Bar" });
    const alt = mock({ barcode: "ALT", brand: "X", productName: "Bar" });
    const best = [primary, alt].reduce((a, b) =>
      scoreDataCompleteness(b) > scoreDataCompleteness(a) ? b : a,
    );
    expect(best.barcode).toBe("PRIMARY");
  });
});

describe("rankByQuality — data outranks image", () => {
  /**
   * The reported bug: the same product exists on Open Food Facts under several
   * barcodes, and search was surfacing the prettiest entry rather than the most
   * informative one. A studio photo with no eco-score beat a plain photo of a
   * fully populated record, so the app showed the shopper the entry it could
   * say least about.
   */
  it("prefers the fully-populated record over a prettier but empty one", () => {
    const prettyButEmpty = mock(
      { productName: "Oat Milk", brand: "Alpro", barcode: "pretty", imageUrl: "x" },
      { image_front_url: "x", states_tags: ["en:front-photo-selected"] },
    );
    const plainButRich = mock({
      productName: "Oat Milk", brand: "Alpro", barcode: "rich",
      ecoscoreGrade: "a", ecoscoreScore: 80, nutriscoreGrade: "a", novaGroup: 1,
      ingredientsText: "oats, water", categories: ["plant-milks"],
      ecoscoreData: { agribalyse: { co2_total: 0.4 } } as never,
    });
    const ranked = rankByQuality("Alpro Oat Milk", [prettyButEmpty, plainButRich]);
    expect(ranked[0].barcode).toBe("rich");
  });

  it("still uses the image as a tie-breaker when records are equally informative", () => {
    const base = {
      productName: "Oat Milk", brand: "Alpro",
      ecoscoreGrade: "a" as const, nutriscoreGrade: "a" as const,
      ingredientsText: "oats, water", categories: ["plant-milks"],
    };
    const noImage = mock({ ...base, barcode: "no-image" });
    const goodImage = mock(
      { ...base, barcode: "good-image", imageUrl: "x" },
      { image_front_url: "x", states_tags: ["en:front-photo-selected"] },
    );
    const ranked = rankByQuality("Alpro Oat Milk", [noImage, goodImage]);
    expect(ranked[0].barcode).toBe("good-image");
  });

  it("keeps relevance above both", () => {
    const relevantSparse = mock({ productName: "Alpro Oat Milk", brand: "Alpro", barcode: "relevant" });
    const irrelevantRich = mock({
      productName: "Coca-Cola Zero", brand: "Coca-Cola", barcode: "irrelevant",
      ecoscoreGrade: "a", nutriscoreGrade: "a", novaGroup: 1,
      ingredientsText: "water", categories: ["sodas"],
    });
    const ranked = rankByQuality("Alpro Oat Milk", [irrelevantRich, relevantSparse]);
    expect(ranked[0].barcode).toBe("relevant");
  });
});
