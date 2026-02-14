import { Leaf, AlertTriangle, Info, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";

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

  return (
    <Card className="border-emerald-200 dark:border-emerald-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Leaf className="w-5 h-5 text-emerald-600" />
          OpenFoodFacts Environmental Data
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
        <div>
          <p className="font-medium text-lg">
            {result.productName || "Unknown Product"}
          </p>
          {result.brand && (
            <p className="text-sm text-muted-foreground">{result.brand}</p>
          )}
        </div>

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

        {/* Carbon footprint */}
        {result.carbonFootprint100g !== null && (
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-1">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <p className="text-sm font-medium">Carbon Footprint</p>
            </div>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {result.carbonFootprint100g.toFixed(1)}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                g CO2e / 100g
              </span>
            </p>
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
        {!result.ecoscoreGrade && result.carbonFootprint100g === null && (
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
