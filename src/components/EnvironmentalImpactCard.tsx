import { Package, Truck } from "lucide-react";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";

interface EnvironmentalImpactCardProps {
  result: OpenFoodFactsResult;
}

const getPackagingImpactLevel = (score?: number): { label: string; color: string } => {
  if (score === undefined) return { label: "Unknown", color: "text-gray-500" };
  if (score >= 10) return { label: "Very low impact", color: "hsl(152 48% 30%)" };
  if (score >= 5) return { label: "Low impact", color: "hsl(142 55% 38%)" };
  if (score >= 0) return { label: "Medium impact", color: "hsl(38 88% 44%)" };
  if (score >= -10) return { label: "High impact", color: "hsl(25 88% 48%)" };
  return { label: "Very high impact", color: "hsl(0 68% 50%)" };
};

export function EnvironmentalImpactCard({ result }: EnvironmentalImpactCardProps) {
  if (!result.found) return null;

  const adjustments = result.ecoscoreData?.adjustments;
  const packaging = adjustments?.packaging;
  const origins = adjustments?.origins_of_ingredients;

  if (!packaging && !origins && !result.origins) return null;

  return (
    <div className="space-y-2">
      {/* Packaging */}
      {packaging && (
        <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-bold text-foreground">Packaging</h3>
            </div>
            <span
              className="text-xs font-semibold"
              style={{ color: getPackagingImpactLevel(packaging.value).color }}
            >
              {getPackagingImpactLevel(packaging.value).label}
            </span>
          </div>
          {packaging.packagings && packaging.packagings.length > 0 && (
            <div className="space-y-1.5">
              {packaging.packagings.map((pkg, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    1 × {(pkg.shape || "Package").replace(/^en:/, "").replace(/-/g, " ")}
                    {pkg.weight_measured && ` (${pkg.weight_measured}g)`}
                  </span>
                  <span className="font-semibold text-foreground capitalize">
                    {pkg.material?.replace(/^en:/, "").replace(/-/g, " ") || "Unknown"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Transportation */}
      {(origins || result.origins) && (
        <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-4">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground">Transportation</h3>
          </div>

          {origins?.aggregated_origins && origins.aggregated_origins.length > 0 ? (
            <div className="space-y-1.5 mb-2">
              {origins.aggregated_origins.map((origin, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground capitalize">
                    {(origin.origin || "Unknown").replace(/^en:/, "").replace(/-/g, " ")}
                  </span>
                  <span className="font-semibold text-foreground">{origin.percent}%</span>
                </div>
              ))}
            </div>
          ) : result.origins ? (
            <p className="text-xs text-muted-foreground mb-2">{result.origins}</p>
          ) : (
            <p className="text-xs text-muted-foreground mb-2">Unknown origins</p>
          )}

          {origins?.transportation_score !== undefined && (
            <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
              <span className="text-muted-foreground">Transport impact score</span>
              <span className="font-semibold text-foreground">{origins.transportation_score}/100</span>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
