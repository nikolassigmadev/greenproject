import { Leaf, AlertTriangle, Info, ExternalLink, Package, Droplets, Factory, Truck, Flag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import { getBrandFlag } from "@/data/brandFlags";
import { LaborFlagBanner } from "@/components/LaborFlagBanner";
import { AnimalWelfareFlagBadge } from "@/components/AnimalWelfareFlagBadge";
import { checkBoycott } from "@/data/boycottBrands";

interface OpenFoodFactsCardProps {
  result: OpenFoodFactsResult;
}

const ecoscoreColors: Record<string, string> = {
  a: "bg-emerald-500 text-white",
  b: "bg-lime-500 text-white",
  c: "bg-amber-500 text-white",
  d: "bg-orange-500 text-white",
  e: "bg-red-500 text-white",
};

const nutriscoreColors: Record<string, string> = {
  a: "bg-emerald-600 text-white",
  b: "bg-lime-500 text-white",
  c: "bg-amber-500 text-white",
  d: "bg-orange-500 text-white",
  e: "bg-red-600 text-white",
};

const novaLabels: Record<number, string> = {
  1: "Unprocessed",
  2: "Processed culinary",
  3: "Processed",
  4: "Ultra-processed",
};

export function OpenFoodFactsCard({ result }: OpenFoodFactsCardProps) {
  if (!result.found) return null;

  const brandFlag = getBrandFlag(result.brand);
  const boycottMatch = checkBoycott(result.brand);
  const agri = result.ecoscoreData?.agribalyse;
  const adjustments = result.ecoscoreData?.adjustments;

  // Check if we have any comprehensive data to show
  const hasAgribalyse = agri && typeof agri.co2_total === 'number';
  const hasPackaging = adjustments?.packaging && typeof adjustments.packaging.value === 'number';
  const hasThreatened = adjustments?.threatened_species && typeof adjustments.threatened_species.value === 'number';
  const hasOrigins = adjustments?.origins_of_ingredients && typeof adjustments.origins_of_ingredients.value === 'number';
  const hasComprehensiveData = hasAgribalyse || hasPackaging || hasThreatened || hasOrigins;

  return (
    <Card className="border-emerald-200 dark:border-emerald-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Leaf className="w-5 h-5 text-emerald-600" />
          Environmental Impact
          <a
            href={`https://world.openfoodfacts.org/product/${result.barcode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-sm font-normal text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            View <ExternalLink className="w-3 h-3" />
          </a>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Product name and brand */}
        <div className="flex items-start gap-3">
          {result.imageUrl && (
            <img
              src={result.imageUrl}
              alt={result.productName || "Product"}
              className="w-16 h-16 rounded-lg object-cover border flex-shrink-0"
            />
          )}
          <div>
            <p className="font-medium text-lg">
              {result.productName || "Unknown Product"}
            </p>
            {result.brand && (
              <p className="text-sm text-muted-foreground">{result.brand}</p>
            )}
          </div>
        </div>

        {/* Labor flag */}
        {brandFlag && <LaborFlagBanner flag={brandFlag} brandName={result.brand} />}

        {/* Animal Welfare Flag */}
        <AnimalWelfareFlagBadge brand={result.brand} showDetails={true} />

        {/* Boycott / BDS note */}
        {boycottMatch && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/40">
            <Flag className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                Supports Israel — {boycottMatch.parent}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                {boycottMatch.reason}
              </p>
              <a
                href="https://boycott-israel.org/boycott.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 mt-1"
                onClick={(e) => e.stopPropagation()}
              >
                Source: BDS Boycott List <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Score badges */}
        <div className="flex flex-wrap gap-3">
          {result.ecoscoreGrade && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Eco-Score</p>
              <Badge
                className={
                  ecoscoreColors[result.ecoscoreGrade] ||
                  "bg-gray-400 text-white"
                }
              >
                {result.ecoscoreGrade.toUpperCase()}
                {result.ecoscoreScore !== null &&
                  ` (${result.ecoscoreScore}/100)`}
              </Badge>
            </div>
          )}

          {result.nutriscoreGrade && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Nutri-Score</p>
              <Badge
                className={
                  nutriscoreColors[result.nutriscoreGrade] ||
                  "bg-gray-400 text-white"
                }
              >
                {result.nutriscoreGrade.toUpperCase()}
                {result.nutriscoreScore !== null &&
                  ` (${result.nutriscoreScore})`}
              </Badge>
            </div>
          )}

          {result.novaGroup !== null && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">NOVA Group</p>
              <Badge variant="outline">
                {result.novaGroup} -{" "}
                {novaLabels[result.novaGroup] || "Unknown"}
              </Badge>
            </div>
          )}
        </div>

        {/* Carbon footprint summary */}
        {(result.carbonFootprint100g !== null ||
          result.carbonFootprintProduct !== null ||
          result.carbonFootprintServing !== null) && (
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <p className="text-sm font-medium">Carbon Footprint</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {result.carbonFootprint100g !== null && (
                <div>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                    {result.carbonFootprint100g.toFixed(1)}
                    <span className="text-xs font-normal text-muted-foreground ml-1">g</span>
                  </p>
                  <p className="text-xs text-muted-foreground">CO2e / 100g</p>
                </div>
              )}
              {result.carbonFootprintServing !== null && (
                <div>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                    {result.carbonFootprintServing.toFixed(1)}
                    <span className="text-xs font-normal text-muted-foreground ml-1">g</span>
                  </p>
                  <p className="text-xs text-muted-foreground">CO2e / serving</p>
                </div>
              )}
              {result.carbonFootprintProduct !== null && (
                <div>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                    {result.carbonFootprintProduct.toFixed(0)}
                    <span className="text-xs font-normal text-muted-foreground ml-1">g</span>
                  </p>
                  <p className="text-xs text-muted-foreground">CO2e / product</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CO2 Lifecycle Breakdown (from Agribalyse) */}
        {hasAgribalyse && agri && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <Factory className="w-4 h-4 text-emerald-600" />
              CO2 Lifecycle Breakdown
              <span className="text-xs font-normal text-muted-foreground">
                (total: {agri.co2_total?.toFixed(2)} kg CO2eq/kg)
              </span>
            </p>
            <div className="space-y-2">
              {[
                { label: "Agriculture", value: agri.co2_agriculture, icon: "🌾" },
                { label: "Processing", value: agri.co2_processing, icon: "🏭" },
                { label: "Packaging", value: agri.co2_packaging, icon: "📦" },
                { label: "Transportation", value: agri.co2_transportation, icon: "🚛" },
                { label: "Distribution", value: agri.co2_distribution, icon: "🏪" },
                { label: "Consumption", value: agri.co2_consumption, icon: "🍽️" },
              ]
                .filter((item) => typeof item.value === 'number' && item.value > 0)
                .map((item) => {
                  const pct = agri.co2_total && agri.co2_total > 0
                    ? ((item.value! / agri.co2_total) * 100)
                    : 0;
                  return (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className="text-sm w-5">{item.icon}</span>
                      <span className="text-xs w-28 text-muted-foreground">{item.label}</span>
                      <div className="flex-1">
                        <Progress value={pct} className="h-2" />
                      </div>
                      <span className="text-xs font-mono w-20 text-right">
                        {item.value!.toFixed(2)} kg ({pct.toFixed(0)}%)
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Eco-Score Adjustments */}
        {hasComprehensiveData && (
          <div className="p-3 rounded-lg bg-muted/50 border space-y-3">
            <p className="text-sm font-medium">Eco-Score Adjustments</p>

            {/* Packaging impact */}
            {hasPackaging && adjustments?.packaging && (
              <div className="flex items-start gap-2">
                <Package className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Packaging</span>
                    <Badge
                      variant="outline"
                      className={
                        adjustments.packaging.value! < 0
                          ? "border-red-300 text-red-700 dark:text-red-400"
                          : "border-emerald-300 text-emerald-700"
                      }
                    >
                      {adjustments.packaging.value! > 0 ? "+" : ""}
                      {adjustments.packaging.value} pts
                    </Badge>
                  </div>
                  {adjustments.packaging.packagings && adjustments.packaging.packagings.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {adjustments.packaging.packagings.map((pkg, i) => (
                        <span key={i} className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                          {(pkg.material || "unknown").replace(/^en:/, "").replace(/-/g, " ")}
                          {pkg.shape && ` (${pkg.shape.replace(/^en:/, "").replace(/-/g, " ")})`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Origins / Transportation */}
            {hasOrigins && adjustments?.origins_of_ingredients && (
              <div className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Origins & Transportation</span>
                    <Badge
                      variant="outline"
                      className={
                        adjustments.origins_of_ingredients.value! < 0
                          ? "border-red-300 text-red-700 dark:text-red-400"
                          : "border-emerald-300 text-emerald-700"
                      }
                    >
                      {adjustments.origins_of_ingredients.value! > 0 ? "+" : ""}
                      {adjustments.origins_of_ingredients.value} pts
                    </Badge>
                  </div>
                  {adjustments.origins_of_ingredients.transportation_score !== undefined && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Transport score: {adjustments.origins_of_ingredients.transportation_score}/100
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Threatened species */}
            {hasThreatened && adjustments?.threatened_species && (
              <div className="flex items-start gap-2">
                <Droplets className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Threatened Species</span>
                    <Badge variant="outline" className="border-red-300 text-red-700 dark:text-red-400">
                      {adjustments.threatened_species.value} pts
                    </Badge>
                  </div>
                  {adjustments.threatened_species.ingredient && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Due to: {adjustments.threatened_species.ingredient.replace(/^en:/, '').replace(/-/g, ' ')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Production system */}
            {adjustments?.production_system && typeof adjustments.production_system.value === 'number' && (
              <div className="flex items-start gap-2">
                <Factory className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Production System</span>
                    <Badge
                      variant="outline"
                      className={
                        adjustments.production_system.value > 0
                          ? "border-emerald-300 text-emerald-700"
                          : "border-muted-foreground"
                      }
                    >
                      {adjustments.production_system.value > 0 ? "+" : ""}
                      {adjustments.production_system.value} pts
                    </Badge>
                  </div>
                  {adjustments.production_system.labels && adjustments.production_system.labels.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {adjustments.production_system.labels.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Labels */}
        {result.labels.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Labels</p>
            <div className="flex flex-wrap gap-1">
              {result.labels.slice(0, 8).map((label, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-xs capitalize"
                >
                  {label}
                </Badge>
              ))}
              {result.labels.length > 8 && (
                <Badge variant="secondary" className="text-xs">
                  +{result.labels.length - 8} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Origins */}
        {result.origins && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="w-4 h-4" />
            <span>Origin: {result.origins}</span>
          </div>
        )}

        {/* No environmental data warning */}
        {!result.ecoscoreGrade &&
          result.carbonFootprint100g === null &&
          !hasComprehensiveData && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-amber-800 dark:text-amber-200">
              No environmental impact data available for this product on
              OpenFoodFacts.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
