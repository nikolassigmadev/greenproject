import { describe, it, expect } from "vitest";
import { isBannedSearchTerm } from "./profanityFilter";

describe("isBannedSearchTerm", () => {
  it("blocks slurs typed directly", () => {
    for (const q of ["nigger", "NIGGER", "  faggot ", "retard", "tranny", "spic", "chink"]) {
      expect(isBannedSearchTerm(q)).toBe(true);
    }
  });

  it("blocks swear words typed directly", () => {
    for (const q of ["fuck", "FUCK", "  shit ", "bitch", "cunt", "asshole", "dick", "bullshit", "motherfucker"]) {
      expect(isBannedSearchTerm(q)).toBe(true);
    }
  });

  it("blocks a swear word split by spaces/punctuation (exact whole-input)", () => {
    for (const q of ["f u c k", "f-u-c-k", "f.u.c.k", "fuuuck", "sh1t"]) {
      expect(isBannedSearchTerm(q)).toBe(true);
    }
  });

  it("blocks leetspeak and separator obfuscation", () => {
    for (const q of ["n1gger", "n i g g e r", "n-i-g-g-e-r", "f@ggot", "niiiggggaaa"]) {
      expect(isBannedSearchTerm(q)).toBe(true);
    }
  });

  it("blocks a slur embedded in a longer product-like query", () => {
    expect(isBannedSearchTerm("cool ranch nigger chips")).toBe(true);
  });

  it("does NOT flag empty / whitespace input", () => {
    expect(isBannedSearchTerm("")).toBe(false);
    expect(isBannedSearchTerm("   ")).toBe(false);
  });

  it("does NOT flag legitimate product searches (Scunthorpe safety)", () => {
    const legit = [
      "spicy doritos", "spice mix", "cocktail sauce", "cockerel",
      "assam tea", "grape juice", "niger seed", "shiitake mushrooms",
      "shitake", "scunthorpe crisps", "coconut water", "analgesic cream",
      "class assortment", "pistachio", "hummus", "dark chocolate",
      "gooseberry jam", "grassy fields honey", "cumin seeds", "damson jam",
      "prickly pear", "crappie fillet", "assorted nuts", "arsenic free rice",
      "peacock tea", "dickinson's jam",
    ];
    for (const q of legit) {
      expect(isBannedSearchTerm(q), `"${q}" should be allowed`).toBe(false);
    }
  });
});
