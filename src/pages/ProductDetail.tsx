import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Truck, Leaf, AlertTriangle, Award, Package, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { ProductCard } from "@/components/ProductCard";
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
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-5">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-display font-bold text-foreground mb-2">Product Not Found</h1>
            <p className="text-sm text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-soft hover:bg-primary/90 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Products
            </Link>
          </div>
        </main>
        <Footer />
        <BottomNav />
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
    low: { label: 'Low Risk', color: 'hsl(152 48% 30%)', bg: 'hsl(152 42% 96%)', progress: 20, desc: 'Minimal indicators of child or forced labor in supply chain.' },
    medium: { label: 'Medium Risk', color: 'hsl(38 88% 44%)', bg: 'hsl(38 70% 96%)', progress: 50, desc: 'Some supply chain concerns exist. Further investigation recommended.' },
    high: { label: 'High Risk', color: 'hsl(0 68% 50%)', bg: 'hsl(0 50% 97%)', progress: 90, desc: 'Significant risk indicators detected. Consider ethical alternatives.' },
  };

  const riskCfg = laborRiskConfig[product.laborRisk];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pb-nav">
        {/* Hero */}
        <div
          className="px-5 pt-10 pb-16 relative"
          style={{ background: "var(--gradient-hero)" }}
        >
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-sm font-semibold mb-6 hover:opacity-80 transition-opacity"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            <ArrowLeft className="w-4 h-4" /> Products
          </Link>

          <div className="max-w-xl mx-auto flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-8 h-8" style={{ color: "rgba(255,255,255,0.7)" }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono mb-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                {product.id} · {product.category}
              </p>
              <h1 className="text-lg font-display font-extrabold leading-tight truncate" style={{ color: "#ffffff" }}>
                {product.name}
              </h1>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.72)" }}>{product.brand}</p>
            </div>
          </div>
        </div>

        <div className="px-5 -mt-8 relative z-10">
          <div className="max-w-xl mx-auto space-y-3">

            {/* Score + breakdown card */}
            <div className="bg-card rounded-2xl border border-border/60 shadow-elevated p-5">
              <div className="flex items-center gap-5">
                <ScoreDisplay score={score} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Sustainability Score</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Based on labor practices, carbon footprint, transport, and certifications.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border/60">
                <ScoreBreakdownSlider product={product} />
              </div>
            </div>

            {/* Product info card */}
            <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-4">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Product Details</h3>
              </div>

              {/* Origin + transport row */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-xl p-3 bg-muted/60">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Origin</span>
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    {product.origin.country}{product.origin.region && `, ${product.origin.region}`}
                  </p>
                </div>
                <div className="rounded-xl p-3 bg-muted/60">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Truck className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Transport</span>
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    {product.transportDistance.toLocaleString()} km
                  </p>
                </div>
              </div>

              {/* Certifications */}
              {product.certifications.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {product.certifications.map((cert, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold"
                      style={{ backgroundColor: "hsl(152 42% 96%)", color: "hsl(152 48% 28%)" }}
                    >
                      <Award className="w-2.5 h-2.5" />
                      {cert}
                    </span>
                  ))}
                </div>
              )}

              {/* Materials */}
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Contents</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.materials.map((material, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-full border text-[10px] font-semibold text-muted-foreground border-border/70"
                    >
                      {material}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Product comments */}
            {product.comments && (
              <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Product Information</p>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{product.comments}</p>
              </div>
            )}

            {/* Labor risk */}
            <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" style={{ color: riskCfg.color }} />
                <h3 className="text-sm font-bold text-foreground">Labor Risk Assessment</h3>
              </div>
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-3"
                style={{ backgroundColor: riskCfg.bg, color: riskCfg.color }}
              >
                {riskCfg.label}
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
                  <span>Risk Level</span>
                  <span className="font-semibold" style={{ color: riskCfg.color }}>{riskCfg.progress}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${riskCfg.progress}%`, backgroundColor: riskCfg.color }}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{riskCfg.desc}</p>
            </div>

            {/* Carbon impact */}
            <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-4">
              <div className="flex items-center gap-2 mb-3">
                <Leaf className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Carbon Impact</h3>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-display font-extrabold text-primary">{product.carbonFootprint}</span>
                <span className="text-sm text-muted-foreground">kg CO₂</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {product.carbonFootprint < 10 && 'Low carbon footprint — excellent choice.'}
                {product.carbonFootprint >= 10 && product.carbonFootprint < 25 && 'Moderate carbon impact. Room for improvement.'}
                {product.carbonFootprint >= 25 && 'High carbon footprint. Consider local or sustainable alternatives.'}
              </p>
            </div>

            {/* Barcode */}
            {product.barcode && (
              <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-4 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">Barcode</p>
                <p className="font-mono text-sm font-semibold">{product.barcode}</p>
              </div>
            )}

            {/* OpenFoodFacts */}
            {offQuery.isLoading && product.barcode && (
              <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-4 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Fetching environmental data...</span>
              </div>
            )}
            {offQuery.data && (
              <div className="[&>*]:rounded-2xl [&>*]:border [&>*]:border-border/60 [&>*]:shadow-soft">
                <OpenFoodFactsCard result={offQuery.data} />
              </div>
            )}

            {/* Alternatives */}
            {alternatives.length > 0 && (
              <div>
                <div className="mb-3">
                  <h2 className="text-base font-display font-extrabold text-foreground">Better Alternatives</h2>
                  <p className="text-xs text-muted-foreground">More sustainable options in the same category</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {alternatives.map((alt) => (
                    <ProductCard key={alt.id} product={alt} />
                  ))}
                </div>
              </div>
            )}

            <div className="h-2" />
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default ProductDetail;
