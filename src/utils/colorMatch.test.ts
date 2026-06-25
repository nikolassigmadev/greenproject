import { describe, it, expect } from "vitest";
import { rgbToHsv, signatureFromPixels, colorSimilarity } from "./colorMatch";

/** Build an RGBA pixel buffer of `n` pixels all of [r,g,b]. */
const fill = (n: number, r: number, g: number, b: number): number[] => {
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(r, g, b, 255);
  return out;
};

describe("rgbToHsv", () => {
  it("maps primaries to the right hue", () => {
    expect(rgbToHsv(255, 0, 0)[0]).toBeCloseTo(0, 1);
    expect(rgbToHsv(0, 255, 0)[0]).toBeCloseTo(120, 1);
    expect(rgbToHsv(0, 0, 255)[0]).toBeCloseTo(240, 1);
  });
  it("reports white as zero saturation", () => {
    const [, s] = rgbToHsv(255, 255, 255);
    expect(s).toBeCloseTo(0, 2);
  });
});

describe("signatureFromPixels", () => {
  it("treats a near-white studio background as non-colourful (filtered out)", () => {
    const sig = signatureFromPixels(fill(256, 250, 250, 250));
    expect(sig.colorfulFrac).toBeLessThan(0.05);
  });
  it("captures a vivid product colour", () => {
    const sig = signatureFromPixels(fill(256, 220, 20, 20)); // strong red
    expect(sig.colorfulFrac).toBeGreaterThan(0.9);
    // Bin 0 covers hue 0–30° (red) → it should dominate.
    expect(sig.hueHist[0]).toBeGreaterThan(0.8);
  });
});

describe("colorSimilarity", () => {
  it("scores the same colour as highly similar", () => {
    const a = signatureFromPixels(fill(256, 200, 30, 30));
    const b = signatureFromPixels(fill(256, 210, 25, 35));
    expect(colorSimilarity(a, b)).toBeGreaterThan(0.7);
  });
  it("scores opposite colours as dissimilar", () => {
    const red = signatureFromPixels(fill(256, 220, 20, 20));
    const blue = signatureFromPixels(fill(256, 20, 20, 220));
    expect(colorSimilarity(red, blue)).toBeLessThan(0.3);
  });
  it("returns no signal (0) when a side is essentially colourless", () => {
    const white = signatureFromPixels(fill(256, 252, 252, 252));
    const red = signatureFromPixels(fill(256, 220, 20, 20));
    expect(colorSimilarity(white, red)).toBe(0);
  });
  it("is null-safe", () => {
    expect(colorSimilarity(null, null)).toBe(0);
  });
});
