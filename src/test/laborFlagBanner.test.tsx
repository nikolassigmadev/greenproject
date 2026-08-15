// The banner is where the claim distinction either lands or doesn't.
//
// A correct claimType in the data with a UI that renders both the same way is
// worse than no field at all: it looks like the problem was addressed.

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LaborFlagBanner } from "@/components/LaborFlagBanner";
import { brandFlagsV2 } from "@/data/brandFlags.v2";
import type { BrandFlagV2 } from "@/types/brandFlag";

const direct = brandFlagsV2.find((f) => f.claimType === "direct")!;
const inferred = brandFlagsV2.find((f) => f.claimType === "supply_chain_inference")!;

function show(flag: BrandFlagV2, compact = false) {
  return render(
    <MemoryRouter>
      <LaborFlagBanner flag={flag} brandName={flag.brandName} compact={compact} />
    </MemoryRouter>,
  );
}

describe("LaborFlagBanner — claim type", () => {
  it("says out loud when a flag is an inference", () => {
    show(inferred);
    expect(screen.getByText(/inferred, not alleged against this company/i)).toBeInTheDocument();
    expect(screen.getByText(/do not accuse this company of it directly/i)).toBeInTheDocument();
  });

  it("puts the caveat before the claim, not after it", () => {
    // A qualifier placed under the accusation is a qualifier most people never
    // read. Order is the whole point, so it's worth asserting.
    const { container } = show(inferred);
    const text = container.textContent ?? "";
    expect(text.indexOf("do not accuse this company")).toBeGreaterThan(-1);
    expect(text.indexOf("do not accuse this company")).toBeLessThan(text.indexOf(inferred.summary));
  });

  it("does not caveat a direct flag", () => {
    show(direct);
    expect(screen.queryByText(/inferred, not alleged/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/do not accuse this company/i)).not.toBeInTheDocument();
  });

  it("distinguishes the two in compact form as well", () => {
    const a = show(inferred, true);
    expect(a.container.textContent).toContain("Supply-chain risk");
    a.unmount();
    const b = show(direct, true);
    expect(b.container.textContent).not.toContain("Supply-chain risk");
  });

  it("marks commodity-level sources individually in the source list", () => {
    // A flag can mix one document naming the company with three that don't.
    // The flag-level label can't express that; the source list has to.
    const mixed = brandFlagsV2.find(
      (f) => f.sources.some((s) => s.commodityLevel) && f.sources.some((s) => !s.commodityLevel),
    );
    expect(mixed, "expected at least one flag with mixed source kinds").toBeDefined();
    show(mixed!);
    fireEvent.click(screen.getByRole("button", { name: /view sources/i }));
    expect(screen.getAllByText(/about the commodity, not this company/i).length).toBeGreaterThan(0);
  });
});
