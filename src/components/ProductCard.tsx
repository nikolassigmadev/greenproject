import { Link } from "react-router-dom";
import { MapPin, Leaf, AlertTriangle, Package, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { Product, calculateScore } from "@/data/products";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

const laborRiskConfig = {
  low: { label: "Low Risk", className: "bg-score-excellent/10 text-score-excellent border-score-excellent/25" },
  medium: { label: "Medium Risk", className: "bg-score-fair/10 text-score-fair border-score-fair/25" },
  high: { label: "High Risk", className: "bg-score-critical/10 text-score-critical border-score-critical/25" },
};

export function ProductCard({ product }: ProductCardProps) {
  const score = calculateScore(product);
  const labor = laborRiskConfig[product.laborRisk];

  return (
    <Link
      to={`/product/${product.id.replace("#", "")}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
    >
      <article className="bg-card rounded-2xl border border-border/60 overflow-hidden transition-all duration-300 group-hover:shadow-card group-hover:-translate-y-1 group-hover:border-border h-full flex flex-col">
        {/* Image area */}
        <div className="h-36 bg-gradient-to-br from-eco-sage/15 via-eco-leaf/8 to-eco-sand/20 relative overflow-hidden flex-shrink-0">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Leaf className="w-12 h-12 text-primary/25 transition-all duration-300 group-hover:text-primary/40" />
            </div>
          )}

          {/* Top badge: score */}
          <div className="absolute top-2.5 right-2.5">
            <ScoreDisplay score={score} size="sm" showLabel={false} />
          </div>

          {/* Top-rated indicator */}
          {score >= 90 && (
            <div className="absolute top-2.5 left-2.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-eco-amber/90 text-white shadow-sm">
                <TrendingUp className="w-2.5 h-2.5" />
                Top
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-2.5 flex-1">
          {/* Name + brand */}
          <div>
            <h3 className="font-display font-semibold text-foreground text-[15px] leading-snug line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">{product.brand}</p>
          </div>

          {/* Origin + score text */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
            <span className="truncate">{product.origin.country}</span>
            <span className="text-muted/70">·</span>
            <span
              className={cn(
                "font-semibold",
                score >= 80 && "text-score-excellent",
                score >= 60 && score < 80 && "text-score-good",
                score >= 40 && score < 60 && "text-score-fair",
                score >= 20 && score < 40 && "text-score-poor",
                score < 20 && "text-score-critical"
              )}
            >
              {score}/100
            </span>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mt-auto">
            <Badge
              variant="outline"
              className={cn("text-[10px] px-2 py-0 h-5 border font-medium", labor.className)}
            >
              <AlertTriangle className="w-2.5 h-2.5 mr-1" />
              {labor.label}
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px] px-2 py-0 h-5 border bg-eco-sage/8 text-eco-sage border-eco-sage/25 font-medium"
            >
              <Package className="w-2.5 h-2.5 mr-1" />
              {product.carbonFootprint} kg CO₂
            </Badge>
          </div>

          {/* Certs */}
          {product.certifications.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.certifications.slice(0, 2).map((cert, i) => (
                <Badge
                  key={i}
                  className="text-[10px] px-2 py-0 h-5 bg-primary/8 text-primary border-0 font-medium hover:bg-primary/14 transition-colors"
                >
                  {cert}
                </Badge>
              ))}
              {product.certifications.length > 2 && (
                <Badge className="text-[10px] px-2 py-0 h-5 bg-muted text-muted-foreground border-0">
                  +{product.certifications.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
