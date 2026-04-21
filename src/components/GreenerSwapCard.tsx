import { ArrowRight, Package2, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import { cn } from "@/lib/utils";

interface GreenerSwapCardProps {
  original: OpenFoodFactsResult;
  alternatives: OpenFoodFactsResult[];
  loading?: boolean;
}

// Grade color tokens — terminal style
const gradeColors: Record<string, { border: string; text: string; label: string }> = {
  a: { border: "#10b981", text: "#10b981", label: "EXCELLENT" },
  b: { border: "#84cc16", text: "#84cc16", label: "GOOD"      },
  c: { border: "#f59e0b", text: "#f59e0b", label: "FAIR"      },
  d: { border: "#f97316", text: "#f97316", label: "POOR"      },
  e: { border: "#00c853", text: "#00c853", label: "BAD"       },
};

function GradeBadge({ grade }: { grade: string }) {
  const s = gradeColors[grade] ?? { border: "#84898E", text: "#84898E", label: "UNKNOWN" };
  return (
    <span
      className="inline-flex items-center justify-center font-mono font-black flex-shrink-0"
      style={{
        width: "1.75rem",
        height: "1.75rem",
        border: `1px solid ${s.border}`,
        color: s.text,
        fontSize: "0.8rem",
        background: "transparent",
      }}
    >
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
      className={cn(
        "flex items-center gap-2.5 min-w-0 flex-1 transition-all duration-150",
        onClick && "cursor-pointer"
      )}
      style={{
        padding: "0.625rem",
        border: isAlternative
          ? "1px solid rgba(64, 170, 255, 0.25)"
          : "1px solid rgba(255,255,255,0.08)",
        background: isAlternative
          ? "rgba(64, 170, 255, 0.04)"
          : "transparent",
      }}
    >
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.productName || "Product"}
          className="object-cover flex-shrink-0"
          style={{
            width: "2.25rem",
            height: "2.25rem",
            border: isAlternative
              ? "1px solid rgba(64, 170, 255, 0.2)"
              : "1px solid rgba(255,255,255,0.08)",
          }}
        />
      ) : (
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: "2.25rem",
            height: "2.25rem",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "#0a0a0a",
          }}
        >
          <Package2
            className="w-4 h-4"
            style={{ color: isAlternative ? "#40aaff" : "#84898E" }}
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p
          className="font-mono font-bold truncate leading-tight uppercase"
          style={{
            fontSize: "0.58rem",
            color: isAlternative ? "#40aaff" : "#84898E",
            letterSpacing: "0.04em",
          }}
        >
          {product.productName || (isAlternative ? "BETTER OPTION" : "CURRENT PRODUCT")}
        </p>
        {grade && (
          <div className="mt-1.5">
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

  if (loading) {
    return (
      <div
        className="mb-4 animate-pulse"
        style={{
          border: "1px solid rgba(64, 170, 255, 0.15)",
          borderLeft: "3px solid #40aaff",
          padding: "1.25rem",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div style={{ width: "2.5rem", height: "2.5rem", background: "rgba(64,170,255,0.1)", border: "1px solid rgba(64,170,255,0.15)" }} />
          <div className="space-y-1.5">
            <div style={{ height: "0.75rem", width: "8rem", background: "rgba(64,170,255,0.1)" }} />
            <div style={{ height: "0.6rem", width: "6rem", background: "rgba(64,170,255,0.06)" }} />
          </div>
        </div>
        <div style={{ height: "5rem", background: "rgba(64,170,255,0.05)" }} />
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
    <div
      className="overflow-hidden mb-4"
      style={{
        background: "#000000",
        border: "1px solid rgba(64, 170, 255, 0.15)",
        borderLeft: "3px solid #40aaff",
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p
              className="font-mono font-black uppercase"
              style={{ fontSize: "0.65rem", color: "#40aaff", letterSpacing: "0.15em" }}
            >
              // GREENER SWAP
            </p>
            <p
              className="font-mono mt-0.5"
              style={{ fontSize: "0.58rem", color: "#84898E" }}
            >
              Same category — lower footprint
            </p>
          </div>

          {/* CO2 savings */}
          {co2Saved != null && co2Saved > 0 && (
            <div
              className="flex-shrink-0 text-right flex items-center gap-1.5 px-3 py-2"
              style={{
                border: "1px solid rgba(64, 170, 255, 0.2)",
                background: "rgba(64, 170, 255, 0.04)",
              }}
            >
              <TrendingDown className="w-3 h-3 flex-shrink-0" style={{ color: "#40aaff" }} />
              <div>
                <p
                  className="font-mono font-black tabular-nums leading-none"
                  style={{ fontSize: "0.85rem", color: "#40aaff" }}
                >
                  -{co2Saved.toFixed(1)} kg
                </p>
                {pctSaved != null && (
                  <p
                    className="font-mono leading-none mt-0.5 uppercase"
                    style={{ fontSize: "0.5rem", color: "#84898E", letterSpacing: "0.08em" }}
                  >
                    {pctSaved}% LESS CO₂
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Side-by-side comparison table */}
        <div className="mb-1">
          {/* Table header */}
          <div
            className="grid grid-cols-2 gap-0 mb-1"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span
              className="font-mono uppercase pb-1.5"
              style={{ fontSize: "0.48rem", color: "#84898E", letterSpacing: "0.14em" }}
            >
              CURRENT
            </span>
            <span
              className="font-mono uppercase pb-1.5 pl-2"
              style={{ fontSize: "0.48rem", color: "#40aaff", letterSpacing: "0.14em" }}
            >
              SWAP TO
            </span>
          </div>

          {/* Comparison row */}
          <div className="flex items-center gap-2 pt-2">
            <ProductChip product={original} />
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{
                width: "1.75rem",
                height: "1.75rem",
                border: "1px solid rgba(64, 170, 255, 0.2)",
              }}
            >
              <ArrowRight className="w-3 h-3" style={{ color: "#40aaff" }} />
            </div>
            <ProductChip
              product={best}
              isAlternative
              onClick={() => navigate(`/product-off/${best.barcode}`)}
            />
          </div>
        </div>

        {/* Switch CTA */}
        <button
          type="button"
          onClick={() => navigate(`/product-off/${best.barcode}`)}
          className="w-full mt-4 font-mono font-black uppercase flex items-center justify-center gap-2 cursor-pointer touch-manipulation transition-opacity active:opacity-70 hover:opacity-90"
          style={{
            height: "2.75rem",
            background: "#40aaff",
            color: "#000000",
            fontSize: "0.65rem",
            letterSpacing: "0.15em",
            border: "none",
          }}
        >
          SWITCH TO THIS PRODUCT
          {alternatives.length > 1 && (
            <span
              className="font-mono ml-1"
              style={{
                fontSize: "0.5rem",
                padding: "2px 6px",
                background: "rgba(0,0,0,0.25)",
                color: "#000000",
              }}
            >
              +{alternatives.length - 1}
            </span>
          )}
        </button>

        {alternatives.length > 1 && (
          <button
            type="button"
            onClick={() => document.getElementById("greener-alternatives-section")?.scrollIntoView({ behavior: "smooth" })}
            className="w-full mt-2 font-mono uppercase cursor-pointer touch-manipulation text-center transition-colors hover:text-white"
            style={{
              fontSize: "0.55rem",
              color: "#84898E",
              background: "none",
              border: "none",
              letterSpacing: "0.1em",
            }}
          >
            VIEW ALL {alternatives.length} ALTERNATIVES
          </button>
        )}
      </div>
    </div>
  );
}
