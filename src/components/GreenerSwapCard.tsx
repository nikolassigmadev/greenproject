import { useState } from "react";
import { ArrowRight, Package2, TrendingDown, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import { cn } from "@/lib/utils";
import { recordSwap } from "@/utils/swapTracking";
import { shareSwapCard } from "@/utils/shareCard";
import { toast } from "sonner";

interface GreenerSwapCardProps {
  original: OpenFoodFactsResult;
  alternatives: OpenFoodFactsResult[];
  loading?: boolean;
}

import { DS } from "@/styles/design-tokens";
const BLUE = DS.ink;
const BG   = DS.bg;
const CARD = DS.card;
const BORDER = DS.hair;
const TEXT = DS.ink;
const TEXT_MUTED = DS.muted;

const gradeColors: Record<string, { text: string; bg: string }> = {
  a: { text: "#10b981", bg: "#F0FAF6" },
  b: { text: "#84cc16", bg: "#F7FAF0" },
  c: { text: "#f59e0b", bg: "#FFFBEB" },
  d: { text: "#f97316", bg: "#FFF5EE" },
  e: { text: "#ef4444", bg: "#FFF0F0" },
};

function GradeBadge({ grade }: { grade: string }) {
  const s = gradeColors[grade] ?? { text: TEXT_MUTED, bg: BG };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 24, height: 24, borderRadius: 6,
      background: s.bg, color: s.text,
      fontSize: "0.75rem", fontWeight: 800,
    }}>
      {grade.toUpperCase()}
    </span>
  );
}

function ProductChip({
  product,
  isAlternative,
  onClick,
}: {
  product: OpenFoodFactsResult;
  isAlternative?: boolean;
  onClick?: () => void;
}) {
  const grade = product.ecoscoreGrade?.toLowerCase();
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      {...(onClick ? { onClick, type: "button" } : {})}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        flex: 1, minWidth: 0,
        padding: 8, borderRadius: 10,
        border: `1px solid ${isAlternative ? "rgba(0,0,0,0.12)" : BORDER}`,
        background: isAlternative ? "#f0f0ed" : BG,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.productName || "Product"}
          style={{
            width: 36, height: 36, borderRadius: 8, objectFit: "contain",
            border: `1px solid ${BORDER}`, flexShrink: 0,
          }}
        />
      ) : (
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          border: `1px solid ${BORDER}`, background: CARD,
          flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Package2 style={{ width: 16, height: 16, color: isAlternative ? BLUE : TEXT_MUTED }} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: "0.72rem", fontWeight: 600,
          color: isAlternative ? BLUE : TEXT,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {product.productName || (isAlternative ? "Better option" : "Current product")}
        </p>
        {grade && (
          <div style={{ marginTop: 4 }}>
            <GradeBadge grade={grade} />
          </div>
        )}
      </div>
    </Tag>
  );
}

export function GreenerSwapCard({ original, alternatives, loading }: GreenerSwapCardProps) {
  const navigate = useNavigate();
  const best = alternatives[0];
  const [sharing, setSharing] = useState(false);

  const handleAcceptSwap = () => {
    if (!best) return;
    recordSwap({
      timestamp: Date.now(),
      fromBarcode: original.barcode,
      fromName: original.productName || "Unknown",
      fromBrand: original.brand,
      toBarcode: best.barcode,
      toName: best.productName || "Unknown",
      toBrand: best.brand,
      co2SavedKg: co2SavedRoundedKg(original, best),
    });
    navigate(`/product-off/${best.barcode}`);
  };

  const handleShare = async () => {
    if (!best || sharing) return;
    setSharing(true);
    try {
      const result = await shareSwapCard({
        fromName: original.productName || "Current product",
        fromBrand: original.brand,
        toName: best.productName || "Better option",
        toBrand: best.brand,
        co2SavedKg: co2SavedRoundedKg(original, best),
        pctSaved: co2PctSaved(original, best),
      });
      if (result === "downloaded") toast.success("Share card downloaded");
      else if (result === "shared") toast.success("Shared");
      else toast.error("Couldn't generate share card");
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: CARD, borderRadius: 18, border: `1px solid ${BORDER}`, padding: 16, marginBottom: 10, opacity: 0.6 }}>
        <div style={{ height: 12, width: 120, background: BORDER, borderRadius: 6, marginBottom: 8 }} />
        <div style={{ height: 10, width: 80, background: BORDER, borderRadius: 6, marginBottom: 16 }} />
        <div style={{ height: 60, background: BG, borderRadius: 10 }} />
      </div>
    );
  }

  if (!best) return null;

  const co2Original = original.ecoscoreData?.agribalyse?.co2_total ?? null;
  const co2Best     = best.ecoscoreData?.agribalyse?.co2_total ?? null;
  const co2Saved    = co2Original != null && co2Best != null ? co2Original - co2Best : null;
  const pctSaved    = co2Saved != null && co2Original != null && co2Original > 0
    ? Math.round((co2Saved / co2Original) * 100)
    : null;

  return (
    <div style={{
      background: CARD, borderRadius: 18,
      border: `1px solid ${BORDER}`, borderLeft: `4px solid ${BLUE}`,
      overflow: "hidden", marginBottom: 10,
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      <div style={{ padding: 16 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: "0.85rem", fontWeight: 700, color: TEXT }}>Greener Swap</p>
            <p style={{ fontSize: "0.72rem", color: TEXT_MUTED, marginTop: 2 }}>Same category — lower footprint</p>
          </div>

          {co2Saved != null && co2Saved > 0 && (
            <div style={{
              flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
              padding: "6px 10px", borderRadius: 10,
              background: "#f0f0ed", border: "1px solid rgba(0,0,0,0.12)",
            }}>
              <TrendingDown style={{ width: 12, height: 12, color: BLUE, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: "0.82rem", fontWeight: 800, color: BLUE, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                  -{co2Saved.toFixed(1)} kg
                </p>
                {pctSaved != null && (
                  <p style={{ fontSize: "0.6rem", color: TEXT_MUTED, lineHeight: 1, marginTop: 2 }}>
                    {pctSaved}% less CO₂
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Side-by-side comparison */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 6 }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase" }}>Current</span>
            <span style={{ fontSize: "0.65rem", fontWeight: 600, color: BLUE, textTransform: "uppercase" }}>Swap to</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ProductChip product={original} />
            <div style={{
              flexShrink: 0, width: 28, height: 28, borderRadius: "50%",
              background: "#f0f0ed", border: "1px solid rgba(0,0,0,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ArrowRight style={{ width: 12, height: 12, color: BLUE }} />
            </div>
            <ProductChip
              product={best}
              isAlternative
              onClick={() => navigate(`/product-off/${best.barcode}`)}
            />
          </div>
        </div>

        {/* Switch CTA + Share */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={handleAcceptSwap}
            style={{
              flex: 1, height: 44, borderRadius: 12, border: "none",
              background: BLUE, color: CARD,
              fontWeight: 700, fontSize: "0.85rem",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            Switch to this product
            {alternatives.length > 1 && (
              <span style={{
                fontSize: "0.68rem", padding: "1px 8px", borderRadius: 10,
                background: "rgba(255,255,255,0.2)", color: CARD,
              }}>
                +{alternatives.length - 1}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            aria-label="Share this swap"
            style={{
              width: 44, height: 44, borderRadius: 12,
              border: `1px solid ${BORDER}`, background: CARD,
              color: BLUE, cursor: sharing ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Share2 style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {alternatives.length > 1 && (
          <button
            type="button"
            onClick={() => document.getElementById("greener-alternatives-section")?.scrollIntoView({ behavior: "smooth" })}
            style={{
              width: "100%", marginTop: 8,
              background: "none", border: "none",
              fontSize: "0.75rem", color: TEXT_MUTED,
              cursor: "pointer", textAlign: "center",
            }}
          >
            View all {alternatives.length} alternatives
          </button>
        )}
      </div>
    </div>
  );
}

function co2SavedRoundedKg(orig: OpenFoodFactsResult, swap: OpenFoodFactsResult): number | null {
  const a = orig.ecoscoreData?.agribalyse?.co2_total ?? null;
  const b = swap.ecoscoreData?.agribalyse?.co2_total ?? null;
  if (a == null || b == null) return null;
  const diff = a - b;
  return diff > 0 ? Math.round(diff * 10) / 10 : 0;
}

function co2PctSaved(orig: OpenFoodFactsResult, swap: OpenFoodFactsResult): number | null {
  const a = orig.ecoscoreData?.agribalyse?.co2_total ?? null;
  const b = swap.ecoscoreData?.agribalyse?.co2_total ?? null;
  if (a == null || b == null || a <= 0) return null;
  const diff = a - b;
  return diff > 0 ? Math.round((diff / a) * 100) : null;
}
