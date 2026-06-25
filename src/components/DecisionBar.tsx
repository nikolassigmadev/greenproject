import { useEffect, useState } from "react";
import { Check, X, ShoppingCart, ArrowRight, RotateCcw } from "lucide-react";
import { DS } from "@/styles/design-tokens";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import { addToBasket, removeFromBasket } from "@/utils/basketStorage";
import { getLaborAllegationCount } from "@/utils/laborCheck";
import {
  recordDecision, getDecision, clearDecision, DECISIONS_EVENT, type DecisionOutcome,
} from "@/utils/decisions";
import { logScan } from "@/utils/scanLogger";
import { assessUnmetDemand } from "@/services/swaps";
import { loadPriorities } from "@/utils/userPreferences";
import { loadRegion } from "@/utils/userRegion";
import { toast } from "sonner";

type Lean = "buy" | "skip" | "neutral";

/** Turn a verdict into a plain-language recommendation + which choice we'd make. */
function meaning(key: string): { lean: Lean; color: string; headline: string } {
  switch (key) {
    case "BUY":      return { lean: "buy",  color: DS.good, headline: "Good pick — worth buying." };
    case "CONSIDER": return { lean: "buy",  color: DS.warn, headline: "Minor trade-offs — okay to buy." };
    case "CAUTION":  return { lean: "skip", color: DS.warn, headline: "We'd think twice about this." };
    case "AVOID":    return { lean: "skip", color: DS.bad,  headline: "We'd skip this one." };
    default:         return { lean: "neutral", color: DS.muted, headline: "Limited data — your call." };
  }
}

const SHELL: React.CSSProperties = {
  position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60,
  background: DS.card, borderTop: `1px solid ${DS.hair}`,
  boxShadow: "0 -6px 24px rgba(0,0,0,0.10)",
  padding: "12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)",
};
const INNER: React.CSSProperties = { maxWidth: 560, margin: "0 auto" };

function btnBase(filled: boolean, color: string): React.CSSProperties {
  return {
    flex: 1, height: 52, borderRadius: 14, cursor: "pointer", fontFamily: DS.font,
    fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    border: filled ? "none" : `1.5px solid ${DS.hair}`,
    background: filled ? color : "transparent",
    color: filled ? "#fff" : DS.ink,
    transition: "transform 0.1s ease",
  };
}

interface DecisionBarProps {
  product: OpenFoodFactsResult;
  /** Verdict key: BUY | CONSIDER | CAUTION | AVOID | UNKNOWN. */
  verdictKey: string;
  /** Scroll the page to the "better swaps" section. */
  onSeeBetter: () => void;
  /** Whether the "Better swaps" section actually has picks to scroll to. */
  hasSwaps?: boolean;
  /** What OpenAI identified the product as (trimmed brand+product), when arrived from a camera scan. */
  openaiResponse?: string | null;
  /** The COMPLETE raw OpenAI response, before it was trimmed to the OFF search. */
  fullOpenaiResponse?: string | null;
  /** The photo the user scanned (compressed base64), stored inline on the scan-log row. */
  capturedImage?: string | null;
}

export function DecisionBar({ product, verdictKey, onSeeBetter, hasSwaps = false, openaiResponse, fullOpenaiResponse, capturedImage }: DecisionBarProps) {
  const [decision, setDecision] = useState(() => getDecision(product.barcode));
  const { lean, color, headline } = meaning(verdictKey);

  useEffect(() => {
    const sync = () => setDecision(getDecision(product.barcode));
    sync();
    window.addEventListener(DECISIONS_EVENT, sync);
    return () => window.removeEventListener(DECISIONS_EVENT, sync);
  }, [product.barcode]);

  const decide = (outcome: DecisionOutcome) => {
    recordDecision({
      barcode: product.barcode,
      name: product.productName || "Unknown product",
      brand: product.brand,
      outcome,
      verdict: verdictKey,
      ecoGrade: product.ecoscoreGrade,
    });
    // Log the buy/skip decision to the backend (Supabase ai_scans.bought = YES/NO),
    // plus the signals that power the unmet-ethical-demand heatmap: the product's
    // category, its worst concern, and whether we had an in-market alternative.
    const priorities = loadPriorities();
    const demand = assessUnmetDemand(product, priorities, loadRegion()?.countryCode);
    logScan({
      barcode: product.barcode,
      name: product.productName || "Unknown Product",
      brand: product.brand,
      ecoGrade: product.ecoscoreGrade,
      openaiResponse,
      fullOpenaiResponse,
      image: capturedImage,
      bought: outcome === "bought" ? "YES" : "NO",
      carbonFootprint100g: product.carbonFootprint100g ?? null,
      verdict: verdictKey,
      priorities,
      category: demand.category,
      primaryConcern: demand.primaryConcern,
      swapAvailable: demand.swapAvailable,
    });
    if (outcome === "bought") {
      addToBasket({
        barcode: product.barcode,
        productName: product.productName || "Unknown Product",
        brand: product.brand,
        imageUrl: product.imageUrl,
        ecoscoreGrade: product.ecoscoreGrade,
        ecoscoreScore: product.ecoscoreScore,
        nutriscoreGrade: product.nutriscoreGrade,
        laborAllegations: getLaborAllegationCount(product.brand, product.productName),
        co2Per100g: product.carbonFootprint100g ?? null,
      });
      // No toast — the bar itself confirms with "In your cart".
    } else {
      removeFromBasket(product.barcode);
      // Only point to "cleaner picks below" when some actually rendered.
      if (hasSwaps) {
        toast("Skipped — see a cleaner pick below", { icon: "👇" });
        onSeeBetter();
      } else {
        toast("Skipped");
      }
    }
  };

  const undo = () => {
    if (decision?.outcome === "bought") removeFromBasket(product.barcode);
    clearDecision(product.barcode);
  };

  // ── Decided state — confirmation + the productive next step ──
  if (decision) {
    const bought = decision.outcome === "bought";
    return (
      <div style={SHELL}>
        <div style={{ ...INNER, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 999, flexShrink: 0,
            background: bought ? DS.goodBg : DS.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {bought
              ? <Check style={{ width: 18, height: 18, color: DS.good }} strokeWidth={3} />
              : <X style={{ width: 18, height: 18, color: DS.muted }} strokeWidth={3} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: DS.ink }}>
              {bought ? "In your cart" : "You skipped this"}
            </div>
            <button
              onClick={undo}
              style={{
                background: "none", border: "none", padding: 0, cursor: "pointer",
                fontFamily: DS.font, fontSize: 12.5, color: DS.muted, fontWeight: 600,
                display: "inline-flex", alignItems: "center", gap: 4, marginTop: 1,
              }}
            >
              <RotateCcw style={{ width: 11, height: 11 }} /> Undo
            </button>
          </div>
          {!bought && hasSwaps && (
            <button
              onClick={onSeeBetter}
              style={{
                flexShrink: 0, height: 44, padding: "0 16px", borderRadius: 12, border: "none",
                background: DS.ink, color: DS.card, fontFamily: DS.font, fontSize: 13.5, fontWeight: 800,
                cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              Better pick <ArrowRight style={{ width: 15, height: 15 }} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Undecided — the recommendation + the explicit choice ──
  return (
    <div style={SHELL}>
      <div style={INNER}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10, paddingLeft: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: color, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: DS.ink }}>{headline}</span>
          {lean !== "neutral" && (
            <span style={{ fontSize: 11.5, color: DS.muted, fontWeight: 600 }}>
              · our pick: {lean === "buy" ? "Buy" : "Skip"}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => decide("rejected")}
            style={btnBase(lean === "skip", meaning(verdictKey).color)}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <X style={{ width: 18, height: 18 }} strokeWidth={2.4} /> Skip it
          </button>
          <button
            onClick={() => decide("bought")}
            style={btnBase(lean === "buy", DS.good)}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <ShoppingCart style={{ width: 18, height: 18 }} strokeWidth={2.4} /> Buy it
          </button>
        </div>
      </div>
    </div>
  );
}
