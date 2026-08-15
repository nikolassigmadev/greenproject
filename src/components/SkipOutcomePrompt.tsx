// One question, asked after roughly one skip in five.
//
// Pressing Skip in the app is a stated intention, not an outcome. Everything
// downstream — the impact numbers, the unmet-demand map — currently treats the
// two as the same thing. They aren't: a shopper who skips in the app and buys
// the product anyway looks identical in the data to one who walked away.
//
// Three options, because that is the whole outcome space and they are mutually
// exclusive: they bought something cleaner, they bought nothing, or they bought
// it anyway. The third is the one that makes the answer worth trusting — a
// prompt with no way to say "your advice didn't change what I did" only ever
// collects agreement.
//
// Sampled, not always shown. Asking on every skip trains people to dismiss it,
// and a dismissed prompt is a worse measurement than an occasional answered one.

import { X } from "lucide-react";
import { DS } from "@/styles/design-tokens";
import type { SwapTaken } from "@/utils/scanLogger";

/** Roughly one skip in five. */
export const SKIP_PROMPT_RATE = 0.2;

/** Roll once, at decision time — never during render, or it re-rolls on every paint. */
export function shouldAskSkipOutcome(): boolean {
  return Math.random() < SKIP_PROMPT_RATE;
}

const OPTIONS: { value: SwapTaken; label: string }[] = [
  { value: "alternative", label: "Bought a different brand" },
  { value: "nothing", label: "Bought nothing" },
  { value: "bought_anyway", label: "Bought it anyway" },
];

interface Props {
  onAnswer: (answer: SwapTaken) => void;
  onDismiss: () => void;
}

export function SkipOutcomePrompt({ onAnswer, onDismiss }: Props) {
  return (
    <div style={{ paddingTop: 2 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: DS.ink }}>
          What did you get instead?
        </span>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 26, height: 26, borderRadius: 999, border: "none",
            background: "transparent", color: DS.muted, cursor: "pointer",
          }}
        >
          <X style={{ width: 14, height: 14 }} strokeWidth={2.4} />
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onAnswer(o.value)}
            style={{
              width: "100%", textAlign: "left", cursor: "pointer",
              border: `1px solid ${DS.hair}`, borderRadius: 11,
              background: "transparent", color: DS.ink,
              padding: "10px 13px", fontFamily: DS.font,
              fontSize: 13.5, fontWeight: 600,
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
