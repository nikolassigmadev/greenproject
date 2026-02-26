import { 
  Leaf, 
  AlertTriangle, 
  Info, 
  ExternalLink, 
  Package, 
  Droplets, 
  Factory, 
  Truck,
  Car,
  MapPin,
  TreePine,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import { getBrandFlag } from "@/data/brandFlags";
import { LaborFlagBanner } from "@/components/LaborFlagBanner";

interface EnvironmentalImpactCardProps {
  result: OpenFoodFactsResult;
}

const ecoscoreColors: Record<string, { bg: string; text: string; label: string }> = {
  a: { bg: "bg-emerald-500", text: "text-white", label: "Excellent" },
  b: { bg: "bg-lime-500", text: "text-white", label: "Good" },
  c: { bg: "bg-amber-500", text: "text-white", label: "Fair" },
  d: { bg: "bg-orange-500", text: "text-white", label: "Poor" },
  e: { bg: "bg-red-500", text: "text-white", label: "Very Poor" },
};

const getEcoScoreDescription = (grade: string): string => {
  switch (grade) {
    case 'a': return 'Very low environmental impact';
    case 'b': return 'Low environmental impact';
    case 'c': return 'Moderate environmental impact';
    case 'd': return 'High environmental impact';
    case 'e': return 'Very high environmental impact';
    default: return 'Environmental impact not assessed';
  }
};

const getCarEquivalent = (co2e: number): string => {
  // Average petrol car emits ~120g CO2 per km
  const km = co2e / 120;
  if (km < 1) {
    return `Equal to driving ${(km * 1000).toFixed(0)}m in a petrol car`;
  }
  return `Equal to driving ${km.toFixed(1)} km in a petrol car`;
};

const getPackagingImpactLevel = (score?: number): { label: string; color: string } => {
  if (score === undefined) return { label: "Unknown", color: "text-gray-500" };
  if (score >= 10) return { label: "Very low impact", color: "text-emerald-600" };
  if (score >= 5) return { label: "Low impact", color: "text-lime-600" };
  if (score >= 0) return { label: "Medium impact", color: "text-amber-600" };
  if (score >= -10) return { label: "High impact", color: "text-orange-600" };
  return { label: "Very high impact", color: "text-red-600" };
};

export function EnvironmentalImpactCard({ result }: EnvironmentalImpactCardProps) {
  if (!result.found) return null;

  const brandFlag = getBrandFlag(result.brand);
  const agri = result.ecoscoreData?.agribalyse;
  const adjustments = result.ecoscoreData?.adjustments;
  const packaging = adjustments?.packaging;
  const origins = adjustments?.origins_of_ingredients;
  const threatened = adjustments?.threatened_species;

  // Check if we have comprehensive data
  const hasComprehensiveData = agri || packaging || origins || threatened;

  return (
    <div className="space-y-6">
      {/* Header with product info */}
      <Card className="border-emerald-200 dark:border-emerald-800">
        <CardHeader>
          <div className="flex items-start gap-3">
            {result.imageUrl && (
              <img
                src={result.imageUrl}
                alt={result.productName || "Product"}
                className="w-20 h-20 rounded-lg object-cover border flex-shrink-0"
              />
            )}
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {result.productName || "Unknown Product"}
              </h3>
              {result.brand && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{result.brand}</p>
              )}
              <a
                href={`https://world.openfoodfacts.org/product/${result.barcode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 mt-2"
              >
                View on OpenFoodFacts <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Labor flag */}
      {brandFlag && <LaborFlagBanner flag={brandFlag} brandName={result.brand} />}

      {/* Environment Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-600" />
            Environment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Eco-Score */}
          {result.ecoscoreGrade && (
            <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className={`w-16 h-16 rounded-full ${ecoscoreColors[result.ecoscoreGrade]?.bg} ${ecoscoreColors[result.ecoscoreGrade]?.text} flex items-center justify-center text-2xl font-bold`}>
                {result.ecoscoreGrade.toUpperCase()}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-lg">Green-Score {result.ecoscoreGrade.toUpperCase()}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getEcoScoreDescription(result.ecoscoreGrade)}
                </p>
                {result.ecoscoreScore !== null && (
                  <p className="text-xs text-gray-500 mt-1">
                    Score: {result.ecoscoreScore}/100
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Carbon Footprint */}
          {(result.carbonFootprint100g !== null || agri?.co2_total) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-600" />
                <h4 className="font-medium">Carbon footprint</h4>
              </div>
              
              {result.carbonFootprint100g !== null && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">CO₂e per 100g</span>
                    <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                      {result.carbonFootprint100g.toFixed(0)} g
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {getCarEquivalent(result.carbonFootprint100g)}
                  </p>
                </div>
              )}

              {agri?.co2_total && (
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Total lifecycle impact: {agri.co2_total.toFixed(2)} kg CO₂eq/kg
                  </p>
                </div>
              )}
            </div>
          )}

          {/* CO2 Lifecycle Breakdown */}
          {agri && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Factory className="w-4 h-4" />
                Lifecycle Breakdown
              </h4>
              <div className="space-y-2">
                {[
                  { label: "Agriculture", value: agri.co2_agriculture, icon: "🌾" },
                  { label: "Processing", value: agri.co2_processing, icon: "🏭" },
                  { label: "Packaging", value: agri.co2_packaging, icon: "📦" },
                  { label: "Transportation", value: agri.co2_transportation, icon: "🚚" },
                  { label: "Distribution", value: agri.co2_distribution, icon: "🏪" },
                  { label: "Consumption", value: agri.co2_consumption, icon: "🍽️" },
                ]
                  .filter((item) => typeof item.value === 'number' && item.value > 0)
                  .map((item) => {
                    const pct = agri.co2_total && agri.co2_total > 0
                      ? ((item.value! / agri.co2_total) * 100)
                      : 0;
                    return (
                      <div key={item.label} className="flex items-center gap-3">
                        <span className="text-sm w-6">{item.icon}</span>
                        <span className="text-sm w-24 text-gray-600 dark:text-gray-400">{item.label}</span>
                        <div className="flex-1">
                          <Progress value={pct} className="h-2" />
                        </div>
                        <span className="text-xs font-mono w-16 text-right">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Packaging Section */}
      {packaging && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Packaging
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                Packaging with <span className={`font-medium ${getPackagingImpactLevel(packaging.value).color}`}>
                  {getPackagingImpactLevel(packaging.value).label}
                </span>
              </span>
            </div>

            {/* Packaging parts */}
            {packaging.packagings && packaging.packagings.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Packaging parts</h5>
                <div className="space-y-2">
                  {packaging.packagings.map((pkg, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-2">
                        <Package className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">
                          1 × {pkg.shape || 'Package'} 
                          {pkg.weight_measured && ` (${pkg.weight_measured}g)`}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {pkg.material?.replace(/^en:/, '').replace(/-/g, ' ') || 'Unknown material'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Packaging materials breakdown */}
            {packaging.packagings && packaging.packagings.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Packaging materials</h5>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b dark:border-gray-700">
                        <th className="text-left py-2">Material</th>
                        <th className="text-right py-2">%</th>
                        <th className="text-right py-2">Weight</th>
                        <th className="text-right py-2">Weight/100g</th>
                      </tr>
                    </thead>
                    <tbody>
                      {packaging.packagings.map((pkg, i) => {
                        const totalWeight = packaging.packagings?.reduce((sum, p) => sum + (p.weight_measured || 0), 0) || 1;
                        const percentage = pkg.weight_measured ? (pkg.weight_measured / totalWeight * 100) : 0;
                        const weightPer100g = pkg.weight_measured ? (pkg.weight_measured / 100) : 0;
                        
                        return (
                          <tr key={i} className="border-b dark:border-gray-700">
                            <td className="py-2 capitalize">
                              {pkg.material?.replace(/^en:/, '').replace(/-/g, ' ') || 'Unknown'}
                            </td>
                            <td className="text-right py-2">{percentage.toFixed(0)}%</td>
                            <td className="text-right py-2">{pkg.weight_measured || 0}g</td>
                            <td className="text-right py-2">{weightPer100g.toFixed(1)}g</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recycling instructions */}
            {result.labels && result.labels.some(label => label.toLowerCase().includes('recycl')) && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                  <Info className="w-4 h-4" />
                  <span>Recycling information available on packaging</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transportation Section */}
      {(origins || result.origins) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-600" />
              Transportation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Origins of ingredients */}
            <div className="space-y-2">
              <h5 className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Origins of ingredients
              </h5>
              {origins?.aggregated_origins && origins.aggregated_origins.length > 0 ? (
                <div className="space-y-1">
                  {origins.aggregated_origins.map((origin, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span>{origin.origin}</span>
                      <Badge variant="outline">{origin.percent}%</Badge>
                    </div>
                  ))}
                </div>
              ) : result.origins ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">{result.origins}</p>
              ) : (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Missing origins of ingredients information</span>
                </div>
              )}
            </div>

            {/* Transportation score */}
            {origins?.transportation_score !== undefined && (
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Transportation impact score</span>
                  <Badge variant="outline">{origins.transportation_score}/100</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Threatened Species Section */}
      {threatened && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Threatened species
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Droplets className="w-4 h-4" />
                <span className="font-medium">Contains ingredients that impact threatened species</span>
              </div>
              
              {threatened.ingredient && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <strong>Concern:</strong> {threatened.ingredient}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Drives deforestation and threatens species such as the orangutan, if available
                  </p>
                </div>
              )}

              {/* Palm oil warning */}
              {result.labels && result.labels.some(label => 
                label.toLowerCase().includes('palm') || 
                label.toLowerCase().includes('palmoil')
              ) && (
                <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Contains palm oil</span>
                  </div>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    Drives deforestation and threatens species such as the orangutan
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No environmental data warning */}
      {!result.ecoscoreGrade && 
       result.carbonFootprint100g === null && 
       !hasComprehensiveData && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <div>
                <p className="font-medium">No environmental impact data available</p>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  This product hasn't been assessed for environmental impact on OpenFoodFacts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
