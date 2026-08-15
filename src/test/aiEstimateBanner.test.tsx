// Keeps AI output from looking like sourced data.
//
// The specific regression this guards: the AI result used to render a green
// ShieldCheck "high confidence" pill — the same badge language the app uses for
// a US Department of Labor finding — driven by the model's own opinion of
// itself. The more confidently the model asserted something, the more verified
// it looked.

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AiEstimateBanner } from "@/components/AiEstimateBanner";
import { LaborFlagBanner } from "@/components/LaborFlagBanner";
import { brandFlagsV2 } from "@/data/brandFlags.v2";

function show(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("AiEstimateBanner", () => {
  it("says it is not source-verified, in those words", () => {
    show(<AiEstimateBanner />);
    expect(screen.getByText(/AI estimate — not source-verified/i)).toBeInTheDocument();
    expect(screen.getByText(/no citations/i)).toBeInTheDocument();
  });

  it("describes the model's confidence as the model's own opinion", () => {
    // Presenting a self-reported confidence as a quality measure is the thing
    // that made this look verified in the first place.
    show(<AiEstimateBanner confidence="high" />);
    expect(screen.getByText(/opinion of itself/i)).toBeInTheDocument();
    expect(screen.getByText(/not a measure of accuracy/i)).toBeInTheDocument();
  });

  it("surfaces what the model said it was unsure about", () => {
    show(<AiEstimateBanner disclaimer="I do not know this brand's suppliers." />);
    expect(screen.getByText(/I do not know this brand's suppliers/i)).toBeInTheDocument();
  });

  it("still identifies itself in compact form", () => {
    const { container } = show(<AiEstimateBanner compact />);
    expect(container.textContent).toContain("AI estimate");
  });

  it("shares no rendered wording with the verified flag banner", () => {
    // Belt and braces against someone 'unifying' the two components later.
    const flag = brandFlagsV2.find((f) => f.status === "verified")!;
    const ai = show(<AiEstimateBanner confidence="high" />);
    const aiText = ai.container.textContent ?? "";
    ai.unmount();

    const verified = show(<LaborFlagBanner flag={flag} brandName={flag.brandName} />);
    const flagText = verified.container.textContent ?? "";

    expect(aiText).toContain("AI estimate");
    expect(flagText).not.toContain("AI estimate");
    expect(aiText).not.toContain("View sources");
  });
});
