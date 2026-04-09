import { ArrowRight, Leaf, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";

interface GreenerSwapCardProps {
  original: OpenFoodFactsResult;
  alternatives: OpenFoodFactsResult[];
  loading?: boolean;
}

const gradeColors: Record<string, { bg: string; ring: string }> = {
  a: { bg: "bg-emerald-500", ring: "ring-emerald-300" },
  b: { bg: "bg-lime-500", ring: "ring-lime-300" },
  c: { bg: "bg-amber-500", ring: "ring-amber-300" },
  d: { bg: "bg-orange-500", ring: "ring-orange-300" },
  e: { bg: "bg-red-500", ring: "ring-red-300" },
};

function GradePill({ grade, label }: { grade: string; label?: string }) {
  const colors = gradeColors[grade] ?? { bg: "bg-gray-400", ring: "ring-gray-200" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${colors.bg}`}>
      {label ?? "Eco"} {grade.toUpperCase()}
    </span>
  );
}

export function GreenerSwapCard({ original, alternatives, loading }: GreenerSwapCardProps) {
  const navigate = useNavigate();
  const best = alternatives[0];

  if (loading) {
    return (
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-4 mb-4 animate-pulse">
        <div className="h-3.5 w-40 bg-emerald-200 dark:bg-emerald-800 rounded-full mb-3" />
        <div className="h-20 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl" />
      </div>
    );
  }

  if (!best) return null;

  const originalGrade = original.ecoscoreGrade?.toLowerCase();
  const bestGrade = best.ecoscoreGrade?.toLowerCase();

  const co2Original = original.ecoscoreData?.agribalyse?.co2_total ?? null;
  const co2Best = best.ecoscoreData?.agribalyse?.co2_total ?? null;
  const co2Saved = co2Original != null && co2Best != null ? co2Original - co2Best : null;

  return (
    <div className="rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-emerald-950/30 p-4 mb-4">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Leaf className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100 leading-none">
            Here's a better option
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
            Same category · greener choice
          </p>
        </div>
      </div>

      {/* Comparison row */}
      <div className="flex items-center gap-2 mb-3">
        {/* Original product chip */}
        <div className="flex-1 flex items-center gap-2 bg-white/70 dark:bg-black/20 rounded-xl p-2.5 min-w-0">
          {original.imageUrl ? (
            <img
              src={original.imageUrl}
              alt=""
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-white"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-lg">
              📦
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate leading-tight">
              {original.productName || "Current product"}
            </p>
            {originalGrade && <GradePill grade={originalGrade} />}
          </div>
        </div>

        <ArrowRight className="w-4 h-4 text-emerald-500 flex-shrink-0" />

        {/* Best alternative chip */}
        <button
          onClick={() => navigate(`/product-off/${best.barcode}`)}
          className="flex-1 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all rounded-xl p-2.5 min-w-0 text-left"
        >
          {best.imageUrl ? (
            <img
              src={best.imageUrl}
              alt=""
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border-2 border-white/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-emerald-400 flex items-center justify-center flex-shrink-0 text-lg">
              🌿
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate leading-tight">
              {best.productName || "Better option"}
            </p>
            {bestGrade && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-100 mt-0.5">
                Eco {bestGrade.toUpperCase()} ✓
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Footer: CO2 savings + extra count */}
      <div className="flex items-center justify-between">
        {co2Saved != null && co2Saved > 0 ? (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>
              Saves <strong>{co2Saved.toFixed(1)} kg CO₂</strong>/kg vs this product
            </span>
          </div>
        ) : (
          <span className="text-xs text-emerald-600 dark:text-emerald-400">
            Lower environmental impact
          </span>
        )}
        {alternatives.length > 1 && (
          <button
            onClick={() => {
              document.getElementById("greener-alternatives-section")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline ml-2 flex-shrink-0"
          >
            +{alternatives.length - 1} more ↓
          </button>
        )}
      </div>
    </div>
  );
}
