// Guards the direct / supply_chain_inference distinction.
//
// The failure this exists to prevent: a flag whose only evidence is "the US DOL
// says cocoa from Côte d'Ivoire involves child labour" being presented as
// though a court had found the company liable. That claim is the easiest thing
// to attack about this dataset, and a label nobody checks would drift back to
// the stronger wording within a few edits.

import { describe, it, expect } from "vitest";
import { brandFlagsV2 } from "@/data/brandFlags.v2";
import { meetsSourcingBar } from "@/types/brandFlag";

describe("claimType", () => {
  it("is set on every flag", () => {
    for (const f of brandFlagsV2) {
      expect(["direct", "supply_chain_inference"], `${f.id}`).toContain(f.claimType);
    }
  });

  it("is never 'direct' when every source is commodity-level", () => {
    // This is the hard invariant. A source marked commodityLevel documents a
    // commodity or region and names no company — if that is ALL we have, the
    // link to this company is an inference by construction, whatever the label
    // says. Tier-1 sourcing does not upgrade the claim; it only makes the
    // commodity finding well-evidenced.
    for (const f of brandFlagsV2) {
      const allCommodity = f.sources.length > 0 && f.sources.every((s) => s.commodityLevel);
      if (allCommodity) {
        expect(f.claimType, `${f.id} rests only on commodity-level sources`).toBe(
          "supply_chain_inference",
        );
      }
    }
  });

  it("never rests a flag on zero sources", () => {
    for (const f of brandFlagsV2) {
      expect(f.sources.length, `${f.id}`).toBeGreaterThan(0);
    }
  });

  it("keeps every verified flag above the sourcing bar", () => {
    // claimType is orthogonal to the tier system: an inference can be
    // impeccably sourced. Adding it must not have loosened anything.
    for (const f of brandFlagsV2.filter((x) => x.status === "verified")) {
      expect(meetsSourcingBar(f), `${f.id} is verified but below the sourcing bar`).toBe(true);
    }
  });

  it("does not let an inference flag claim the company was found responsible", () => {
    // Wording check, deliberately narrow: verbs that assert an adjudicated
    // finding against the company itself. An inference flag can say a company
    // "sources from" or "was linked to"; it cannot say it "was convicted".
    const ADJUDICATED = /\b(was|were|has been|have been)\s+(convicted|found guilty|found liable|sanctioned|prosecuted)\b/i;
    for (const f of brandFlagsV2.filter((x) => x.claimType === "supply_chain_inference")) {
      expect(ADJUDICATED.test(f.summary), `${f.id} summary overclaims`).toBe(false);
      expect(ADJUDICATED.test(f.details), `${f.id} details overclaim`).toBe(false);
    }
  });

  it("keeps the two claim types from collapsing into one", () => {
    // If every flag ended up on one side, the field is decoration. This is a
    // canary for a bulk edit that flipped them all rather than a real ratio.
    const direct = brandFlagsV2.filter((f) => f.claimType === "direct").length;
    const inferred = brandFlagsV2.length - direct;
    expect(direct).toBeGreaterThan(0);
    expect(inferred).toBeGreaterThan(0);
  });

  it("marks the DOL TVPRA list as commodity-level everywhere it is used", () => {
    // Four flags cited the same DOL general list; nothing recorded that it is a
    // commodity document. If a future edit reuses it without the marker, the
    // invariant above silently stops applying.
    const dolSources = brandFlagsV2
      .flatMap((f) => f.sources)
      .filter((s) => s.title.includes("List of Goods Produced by Child Labor"));
    expect(dolSources.length).toBeGreaterThan(0);
    for (const s of dolSources) {
      expect(s.commodityLevel, `${s.title} is not marked commodityLevel`).toBe(true);
    }
  });
});
