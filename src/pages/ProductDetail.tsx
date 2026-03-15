import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Truck, Leaf, AlertTriangle, Award, Package, ArrowRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { ProductCard } from "@/components/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { calculateScore, findAlternatives } from "@/data/products";
import { useProducts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import { ScoreBreakdownSlider } from "@/components/ScoreBreakdownSlider";
import { lookupBarcode, isValidBarcode } from "@/services/openfoodfacts";
import { OpenFoodFactsCard } from "@/components/OpenFoodFactsCard";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const products = useProducts();
  const product = products.find((p) => p.id === `#${id}`);

  if (!product) {
    return (<div className="min-h-screen flex flex-col bg-[#1a2332] text-[#f0f4f8] min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-display font-bold mb-4" style={{ color: 'hsl(210 15% 94%)' }}>Product Not Found</h1>
            <p className="mb-6" style={{ color: 'hsl(210 15% 63%)' }}>The product you're looking for doesn't exist.</p>
            <Button asChild>
              <Link to="/products">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Products
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const score = calculateScore(product);
  const alternatives = findAlternatives(product, products);

  const offQuery = useQuery({
    queryKey: ['openfoodfacts', product.barcode],
    queryFn: () => lookupBarcode(product.barcode!),
    enabled: !!product.barcode && isValidBarcode(product.barcode),
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const laborRiskConfig = {
    low: { label: 'Low Risk', color: 'text-score-excellent', bg: 'bg-score-excellent/10', progress: 20 },
    medium: { label: 'Medium Risk', color: 'text-score-fair', bg: 'bg-score-fair/10', progress: 50 },
    high: { label: 'High Risk', color: 'text-score-critical', bg: 'bg-score-critical/10', progress: 90 },
  };

  const materialsLabel = 'Contents';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container">
          {/* Back button */}
          <Button asChild variant="ghost" className="mb-6">
            <Link to="/products">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Link>
          </Button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Header */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Product Image with fallback to package icon */}
                    <div className="w-full sm:w-48 h-48 rounded-xl bg-gradient-to-br from-eco-sage/20 to-eco-leaf/10 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover rounded-xl"
                          onError={(e) => {
                            // Fallback to package icon if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const packageIcon = document.createElement('div');
                              packageIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-16 h-16 text-primary/30"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>';
                              packageIcon.className = 'absolute inset-0 flex items-center justify-center';
                              parent.appendChild(packageIcon);
                            }
                          }}
                        />
                      ) : (
                        <Package className="w-16 h-16 text-primary/30" />
                      )}
                    </div>

                    <div className="flex-1 space-y-4">
                      <div>
                        <p className="text-sm font-mono text-muted-foreground">{product.id}</p>
                        <h1 className="text-2xl sm:text-3xl font-display font-bold">{product.name}</h1>
                        <p className="text-lg text-muted-foreground">{product.brand}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <Badge variant="secondary">{product.category}</Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{product.origin.country}{product.origin.region && `, ${product.origin.region}`}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {product.certifications.map((cert, i) => (
                          <Badge key={i} className="bg-primary/10 text-primary border-0">
                            <Award className="w-3 h-3 mr-1" />
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Materials */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    {materialsLabel}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {product.materials.map((material, i) => (
                      <Badge key={i} variant="outline" className="text-sm py-1.5">
                        {material}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Product Comments */}
              {product.comments && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary" />
                      Product Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {product.comments}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Impact Metrics */}
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Labor Risk */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-primary" />
                      Labor Risk Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium", laborRiskConfig[product.laborRisk].bg, laborRiskConfig[product.laborRisk].color)}>
                      <AlertTriangle className="w-4 h-4" />
                      {laborRiskConfig[product.laborRisk].label}
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Risk Level</span>
                        <span className={laborRiskConfig[product.laborRisk].color}>
                          {laborRiskConfig[product.laborRisk].progress}%
                        </span>
                      </div>
                      <Progress 
                        value={laborRiskConfig[product.laborRisk].progress} 
                        className="h-2"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {product.laborRisk === 'low' && 'This product shows minimal indicators of child or forced labor in its supply chain.'}
                      {product.laborRisk === 'medium' && 'Some supply chain concerns exist. Further investigation recommended.'}
                      {product.laborRisk === 'high' && 'Significant risk indicators detected. Consider ethical alternatives.'}
                    </p>
                  </CardContent>
                </Card>

                {/* Carbon Impact */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Leaf className="w-5 h-5 text-primary" />
                      Carbon Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-display font-bold text-primary">
                      {product.carbonFootprint} <span className="text-lg font-normal text-muted-foreground">kg CO₂</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Transport Distance:</span>
                        <span className="font-medium">{product.transportDistance.toLocaleString()} km</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {product.carbonFootprint < 10 && 'Excellent! This product has a low carbon footprint.'}
                      {product.carbonFootprint >= 10 && product.carbonFootprint < 25 && 'Moderate carbon impact. Room for improvement.'}
                      {product.carbonFootprint >= 25 && 'High carbon footprint. Consider local or sustainable alternatives.'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Score Card */}
              <Card className="text-center">
                <CardHeader>
                  <CardTitle>Sustainability Score</CardTitle>
                </CardHeader>
                <CardContent className="pb-6">
                  <ScoreDisplay score={score} size="lg" />
                  <p className="text-sm text-muted-foreground mt-4">
                    Based on labor practices, carbon footprint, transport distance, and certifications.
                  </p>
                  <div className="mt-6 text-left">
                    <ScoreBreakdownSlider product={product} />
                  </div>
                </CardContent>
              </Card>

              {/* Barcode */}
              {product.barcode && (
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Barcode</p>
                    <p className="font-mono text-sm">{product.barcode}</p>
                  </CardContent>
                </Card>
              )}

              {/* OpenFoodFacts Data */}
              {offQuery.isLoading && product.barcode && (
                <Card>
                  <CardContent className="flex items-center justify-center gap-2 py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span className="text-sm text-muted-foreground">Fetching environmental data...</span>
                  </CardContent>
                </Card>
              )}
              {offQuery.data && (
                <OpenFoodFactsCard result={offQuery.data} />
              )}
            </div>
          </div>

          {/* Alternatives */}
          {alternatives.length > 0 && (
            <section className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-display font-bold">Better Alternatives</h2>
                  <p className="text-muted-foreground">
                    More sustainable options based on similar products
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {alternatives.map((alt) => (
                  <ProductCard key={alt.id} product={alt} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
