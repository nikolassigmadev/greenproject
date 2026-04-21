import { ArrowRight, Leaf, TrendingDown, Package2, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import { cn } from "@/lib/utils";

interface GreenerSwapCardProps {
  original: OpenFoodFactsResult;
  alternatives: OpenFoodFactsResult[];
  loading?: boolean;
}

// Grade color tokens — solid fills for the comparison chips
const gradeColors: Record<string, { solid: string; text: string; label: string }> = {
  a: { solid: "bg-emerald-500", text: "text-white", label: "Excellent" },
  b: { solid: "bg-lime-500",    text: "text-white", label: "Good"      },
  c: { solid: "bg-amber-400",   text: "text-white", label: "Fair"      },
  d: { solid: "bg-orange-500",  text: "text-white", label: "Poor"      },
  e: { solid: "bg-red-500",     text: "text-white", label: "Bad"       },
};

function GradeBadge({ grade }: { grade: string }) {
  const s = gradeColors[grade] ?? { solid: "bg-neutral-600", text: "text-white", label: "Unknown" };
  return (
    <span className={cn(
      "inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black flex-shrink-0",
      s.solid, s.text
    )}>
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
        "flex items-center gap-2.5 rounded-2xl p-3 min-w-0 flex-1 transition-all duration-200",
        isAlternative
          ? "bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 active:scale-[0.97] cursor-pointer"
          : "bg-white/5 border border-white/8"
      )}
    >
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.productName || "Product"}
          className={cn(
            "w-10 h-10 rounded-xl object-cover flex-shrink-0",
            isAlternative ? "border border-emerald-400/30" : "border border-white/10"
          )}
        />
      ) : (
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
          isAlternative ? "bg-emerald-500/30" : "bg-neutral-800"
        )}>
          <Package2 className={cn("w-5 h-5", isAlternative ? "text-emerald-300" : "text-neutral-500")} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-xs font-bold truncate leading-tight",
          isAlternative ? "text-emerald-200" : "text-neutral-300"
        )}>
          {product.productName || (isAlternative ? "Better option" : "Current product")}
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
      <div className="rounded-3xl border border-emerald-500/20 bg-emerald-950/30 p-5 mb-4 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-32 bg-emerald-500/20 rounded-full" />
            <div className="h-2.5 w-24 bg-emerald-500/10 rounded-full" />
          </div>
        </div>
        <div className="h-20 bg-emerald-500/10 rounded-2xl" />
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
    <div className="rounded-3xl border border-emerald-500/25 bg-neutral-900 overflow-hidden mb-4 shadow-lg shadow-emerald-950/40">
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <Leaf className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-black text-white leading-none">Greener Swap</p>
              <p className="text-xs text-emerald-400/80 mt-0.5 font-medium">Same category — lower footprint</p>
            </div>
          </div>
          {/* CO2 savings stat badge */}
          {co2Saved != null && co2Saved > 0 && (
            <div className="flex-shrink-0 text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/25">
                <TrendingDown className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-black text-emerald-300 leading-none tabular-nums">
                    -{co2Saved.toFixed(1)} kg
                  </p>
                  {pctSaved != null && (
                    <p className="text-[10px] text-emerald-500 font-bold leading-none mt-0.5">{pctSaved}% less CO₂</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Side-by-side comparison */}
        <div className="flex items-center gap-2 mb-5">
          <ProductChip product={original} />
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </div>
          <ProductChip
            product={best}
            isAlternative
            onClick={() => navigate(`/product-off/${best.barcode}`)}
          />
        </div>

        {/* Switch CTA */}
        <button
          type="button"
          onClick={() => navigate(`/product-off/${best.barcode}`)}
          className="w-full h-11 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer touch-manipulation transition-all hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.97] shadow-lg shadow-emerald-900/50"
        >
          <Zap className="w-4 h-4" />
          Switch to This Product
          {alternatives.length > 1 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black">
              +{alternatives.length - 1}
            </span>
          )}
        </button>

        {alternatives.length > 1 && (
          <button
            type="button"
            onClick={() => document.getElementById("greener-alternatives-section")?.scrollIntoView({ behavior: "smooth" })}
            className="w-full mt-2 text-xs text-neutral-500 hover:text-neutral-300 font-semibold transition-colors cursor-pointer touch-manipulation text-center"
          >
            View all {alternatives.length} alternatives
          </button>
        )}
      </div>
    </div>
  );
}
