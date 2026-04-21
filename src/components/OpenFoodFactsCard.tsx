import {
  Leaf, AlertTriangle, Info, ExternalLink,
  Package, Droplets, Factory, Truck, Flag,
  Wheat, Store, UtensilsCrossed, Sprout,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import { getBrandFlag } from "@/data/brandFlags";
import { LaborFlagBanner } from "@/components/LaborFlagBanner";
import { AnimalWelfareFlagBadge } from "@/components/AnimalWelfareFlagBadge";
import { checkBoycott } from "@/data/boycottBrands";
import { cn } from "@/lib/utils";

interface OpenFoodFactsCardProps {
  result: OpenFoodFactsResult;
}

// ─── Grade helpers ────────────────────────────────────────────────────────────

const ecoscoreStyle: Record<string, {
  solid: string; text: string; ring: string; label: string; glow: string;
}> = {
  a: { solid: "bg-emerald-500", text: "text-white", ring: "ring-emerald-500/30", label: "Excellent", glow: "shadow-emerald-500/20" },
  b: { solid: "bg-lime-500",    text: "text-white", ring: "ring-lime-500/30",    label: "Good",      glow: "shadow-lime-500/20"    },
  c: { solid: "bg-amber-400",   text: "text-white", ring: "ring-amber-400/30",   label: "Fair",      glow: "shadow-amber-400/20"   },
  d: { solid: "bg-orange-500",  text: "text-white", ring: "ring-orange-500/30",  label: "Poor",      glow: "shadow-orange-500/20"  },
  e: { solid: "bg-red-500",     text: "text-white", ring: "ring-red-500/30",     label: "Bad",       glow: "shadow-red-500/20"     },
};

const nutriscoreStyle: Record<string, { solid: string; text: string }> = {
  a: { solid: "bg-emerald-500", text: "text-white" },
  b: { solid: "bg-lime-500",    text: "text-white" },
  c: { solid: "bg-amber-400",   text: "text-white" },
  d: { solid: "bg-orange-500",  text: "text-white" },
  e: { solid: "bg-red-500",     text: "text-white" },
};

const novaColors: Record<number, { solid: string; text: string; label: string }> = {
  1: { solid: "bg-emerald-500", text: "text-white", label: "Unprocessed"     },
  2: { solid: "bg-lime-500",    text: "text-white", label: "Culinary proc."  },
  3: { solid: "bg-amber-400",   text: "text-white", label: "Processed"       },
  4: { solid: "bg-red-500",     text: "text-white", label: "Ultra-processed" },
};

// ─── CO2 breakdown categories ─────────────────────────────────────────────────

const CO2_CATEGORIES = [
  { key: "co2_agriculture",   label: "Agriculture",   Icon: Wheat,           gradient: "from-emerald-500 to-emerald-400" },
  { key: "co2_processing",    label: "Processing",    Icon: Factory,         gradient: "from-blue-500 to-blue-400"       },
  { key: "co2_packaging",     label: "Packaging",     Icon: Package,         gradient: "from-amber-500 to-amber-400"     },
  { key: "co2_transportation",label: "Transport",     Icon: Truck,           gradient: "from-orange-500 to-orange-400"   },
  { key: "co2_distribution",  label: "Distribution",  Icon: Store,           gradient: "from-violet-500 to-violet-400"   },
  { key: "co2_consumption",   label: "Consumption",   Icon: UtensilsCrossed, gradient: "from-rose-500 to-rose-400"       },
] as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function GradeHero({ grade, score }: { grade: string; score: number | null }) {
  const style = ecoscoreStyle[grade] ?? {
    solid: "bg-neutral-600", text: "text-white", ring: "ring-neutral-500/30", label: "Unknown", glow: "shadow-neutral-500/20",
  };
  return (
    <div className="flex items-center gap-4">
      <div className={cn(
        "w-16 h-16 rounded-2xl flex flex-col items-center justify-center ring-4 shadow-lg flex-shrink-0",
        style.solid, style.ring, style.glow
      )}>
        <span className={cn("text-2xl font-black leading-none", style.text)}>
          {grade.toUpperCase()}
        </span>
        {score !== null && (
          <span className={cn("text-[10px] font-bold opacity-80 leading-none mt-0.5", style.text)}>
            {score}/100
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Eco-Score</p>
        <p className="text-xl font-black text-neutral-900 dark:text-neutral-100 leading-tight">{style.label}</p>
        <p className="text-xs text-neutral-400 mt-0.5">Environmental impact rating</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OpenFoodFactsCard({ result }: OpenFoodFactsCardProps) {
  if (!result.found) return null;

  const brandFlag    = getBrandFlag(result.brand);
  const boycottMatch = checkBoycott(result.brand);
  const agri         = result.ecoscoreData?.agribalyse;
  const adjustments  = result.ecoscoreData?.adjustments;

  const hasAgribalyse  = agri && typeof agri.co2_total === "number";
  const hasPackaging   = adjustments?.packaging && typeof adjustments.packaging.value === "number";
  const hasThreatened  = adjustments?.threatened_species && typeof adjustments.threatened_species.value === "number";
  const hasOrigins     = adjustments?.origins_of_ingredients && typeof adjustments.origins_of_ingredients.value === "number";
  const hasAdjustments = hasPackaging || hasThreatened || hasOrigins ||
    (adjustments?.production_system && typeof adjustments.production_system.value === "number");

  const co2Total = agri?.co2_total;
  const co2Items = CO2_CATEGORIES
    .map(c => ({ ...c, val: agri?.[c.key as keyof typeof agri] as number | undefined }))
    .filter(c => typeof c.val === "number" && c.val > 0);
  const maxCo2 = co2Items.length > 0 ? Math.max(...co2Items.map(c => c.val as number)) : 1;

  const ecoGrade  = result.ecoscoreGrade?.toLowerCase();
  const ecoStyle  = ecoGrade ? (ecoscoreStyle[ecoGrade] ?? null) : null;
  const nutriGrade = result.nutriscoreGrade?.toLowerCase();
  const nutriStyle = nutriGrade ? (nutriscoreStyle[nutriGrade] ?? null) : null;
  const novaStyle  = result.novaGroup ? (novaColors[result.novaGroup] ?? null) : null;

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">

      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-500/20">
            <Leaf className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">Environmental Impact</span>
        </div>
        <a
          href={`https://world.openfoodfacts.org/product/${result.barcode}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-neutral-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors cursor-pointer"
        >
          Source <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="p-4 space-y-4">

        {/* ── Product identity ── */}
        <div className="flex items-start gap-3">
          {result.imageUrl ? (
            <img
              src={result.imageUrl}
              alt={result.productName || "Product"}
              className="w-16 h-16 rounded-2xl object-cover border border-neutral-100 dark:border-neutral-800 flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
              <Sprout className="w-7 h-7 text-neutral-300 dark:text-neutral-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-neutral-900 dark:text-neutral-100 text-base leading-snug">
              {result.productName || "Unknown Product"}
            </p>
            {result.brand && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{result.brand}</p>
            )}
            {result.origins && (
              <div className="flex items-center gap-1 mt-1 text-xs text-neutral-400">
                <Info className="w-3 h-3 flex-shrink-0" />
                <span>{result.origins}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Alerts: labor, animal welfare, boycott ── */}
        {brandFlag && <LaborFlagBanner flag={brandFlag} brandName={result.brand} />}
        <AnimalWelfareFlagBadge brand={result.brand} showDetails={true} />

        {boycottMatch && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30">
            <div className="w-7 h-7 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Flag className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-800 dark:text-red-200">
                Supports Israel — {boycottMatch.parent}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{boycottMatch.reason}</p>
              <a
                href="https://boycott-israel.org/boycott.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 transition-colors mt-1.5 cursor-pointer font-semibold"
                onClick={(e) => e.stopPropagation()}
              >
                Source: BDS Boycott List <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* ── Eco-Score hero ── */}
        {result.ecoscoreGrade && (
          <div className="rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 p-3.5">
            <GradeHero grade={result.ecoscoreGrade} score={result.ecoscoreScore} />
          </div>
        )}

        {/* ── Secondary scores row (compact metric badges) ── */}
        {(result.nutriscoreGrade || result.novaGroup !== null) && (
          <div className="flex gap-2.5">
            {result.nutriscoreGrade && nutriStyle && (
              <div className="flex-1 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 p-3 flex items-center gap-2.5">
                <span className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0",
                  nutriStyle.solid, nutriStyle.text
                )}>
                  {result.nutriscoreGrade.toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider leading-none">Nutri-Score</p>
                  <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mt-0.5 leading-tight truncate">
                    {result.nutriscoreScore !== null ? `Score ${result.nutriscoreScore}` : "Nutrition"}
                  </p>
                </div>
              </div>
            )}
            {result.novaGroup !== null && novaStyle && (
              <div className="flex-1 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 p-3 flex items-center gap-2.5">
                <span className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0",
                  novaStyle.solid, novaStyle.text
                )}>
                  {result.novaGroup}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider leading-none">NOVA Group</p>
                  <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mt-0.5 leading-tight truncate">
                    {novaStyle.label}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Carbon footprint summary metrics ── */}
        {(result.carbonFootprint100g !== null || result.carbonFootprintProduct !== null || result.carbonFootprintServing !== null) && (
          <div className="rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 p-3.5">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Carbon Footprint</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {result.carbonFootprint100g !== null && (
                <div className="rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-2.5">
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">
                    {result.carbonFootprint100g.toFixed(1)}
                    <span className="text-[10px] font-bold text-neutral-400 ml-0.5">g</span>
                  </p>
                  <p className="text-[10px] font-medium text-neutral-400 mt-0.5 leading-tight">CO₂e / 100g</p>
                </div>
              )}
              {result.carbonFootprintServing !== null && (
                <div className="rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-2.5">
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">
                    {result.carbonFootprintServing.toFixed(1)}
                    <span className="text-[10px] font-bold text-neutral-400 ml-0.5">g</span>
                  </p>
                  <p className="text-[10px] font-medium text-neutral-400 mt-0.5 leading-tight">CO₂e / serving</p>
                </div>
              )}
              {result.carbonFootprintProduct !== null && (
                <div className="rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-2.5">
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">
                    {result.carbonFootprintProduct.toFixed(0)}
                    <span className="text-[10px] font-bold text-neutral-400 ml-0.5">g</span>
                  </p>
                  <p className="text-[10px] font-medium text-neutral-400 mt-0.5 leading-tight">CO₂e / product</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CO2 Lifecycle Breakdown ── */}
        {hasAgribalyse && agri && co2Total !== undefined && (
          <div className="rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 p-3.5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">CO₂ Lifecycle</p>
              <span className="text-xs font-black text-neutral-600 dark:text-neutral-300 tabular-nums">
                {co2Total?.toFixed(2)} kg CO₂/kg
              </span>
            </div>
            <div className="space-y-2.5">
              {co2Items.map(({ key, label, Icon, gradient, val }) => {
                const pct = co2Total && co2Total > 0 ? ((val as number) / co2Total) * 100 : 0;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 w-20 flex-shrink-0 truncate">{label}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700">
                      <div
                        className={cn("h-full rounded-full bg-gradient-to-r", gradient)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold font-mono text-neutral-500 w-14 text-right flex-shrink-0 tabular-nums">
                      {(val as number).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Eco-Score Adjustments ── */}
        {hasAdjustments && (
          <div className="rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 p-3.5">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Eco-Score Adjustments</p>
            <div className="space-y-3">

              {hasPackaging && adjustments?.packaging && (
                <div className="flex items-start gap-2.5">
                  <Package className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Packaging</span>
                      <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full",
                        adjustments.packaging.value! < 0
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      )}>
                        {adjustments.packaging.value! > 0 ? "+" : ""}{adjustments.packaging.value} pts
                      </span>
                    </div>
                    {adjustments.packaging.packagings && adjustments.packaging.packagings.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {adjustments.packaging.packagings.map((pkg, i) => (
                          <span key={i} className="text-[11px] text-neutral-500 bg-neutral-100 dark:bg-neutral-700/60 rounded-md px-1.5 py-0.5 capitalize">
                            {(pkg.material || "unknown").replace(/^en:/, "").replace(/-/g, " ")}
                            {pkg.shape && ` · ${pkg.shape.replace(/^en:/, "").replace(/-/g, " ")}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {hasOrigins && adjustments?.origins_of_ingredients && (
                <div className="flex items-start gap-2.5">
                  <Truck className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Origins & Transport</span>
                      <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full",
                        adjustments.origins_of_ingredients.value! < 0
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      )}>
                        {adjustments.origins_of_ingredients.value! > 0 ? "+" : ""}{adjustments.origins_of_ingredients.value} pts
                      </span>
                    </div>
                    {adjustments.origins_of_ingredients.transportation_score !== undefined && (
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Transport score: {adjustments.origins_of_ingredients.transportation_score}/100
                      </p>
                    )}
                  </div>
                </div>
              )}

              {hasThreatened && adjustments?.threatened_species && (
                <div className="flex items-start gap-2.5">
                  <Droplets className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Threatened Species</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        {adjustments.threatened_species.value} pts
                      </span>
                    </div>
                    {adjustments.threatened_species.ingredient && (
                      <p className="text-[11px] text-neutral-400 mt-1 capitalize">
                        Due to: {adjustments.threatened_species.ingredient.replace(/^en:/, "").replace(/-/g, " ")}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {adjustments?.production_system && typeof adjustments.production_system.value === "number" && (
                <div className="flex items-start gap-2.5">
                  <Factory className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Production System</span>
                      <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full",
                        adjustments.production_system.value > 0
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400"
                      )}>
                        {adjustments.production_system.value > 0 ? "+" : ""}{adjustments.production_system.value} pts
                      </span>
                    </div>
                    {adjustments.production_system.labels && adjustments.production_system.labels.length > 0 && (
                      <p className="text-[11px] text-neutral-400 mt-1">
                        {adjustments.production_system.labels.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Labels ── */}
        {result.labels.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
              Certifications & Labels
            </p>
            <div className="flex flex-wrap gap-1.5">
              {result.labels.slice(0, 8).map((label, i) => (
                <span
                  key={i}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 capitalize font-semibold"
                >
                  {label}
                </span>
              ))}
              {result.labels.length > 8 && (
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 font-medium">
                  +{result.labels.length - 8} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── No data warning ── */}
        {!result.ecoscoreGrade && result.carbonFootprint100g === null && !hasAdjustments && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30">
            <div className="w-7 h-7 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            </div>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              No environmental data available for this product on OpenFoodFacts.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
