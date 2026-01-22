import { Link } from "react-router-dom";
import { MapPin, Leaf, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { Product, calculateScore } from "@/data/products";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const score = calculateScore(product);

  const laborRiskConfig = {
    low: { label: 'Low Risk', color: 'bg-score-excellent/10 text-score-excellent border-score-excellent/20' },
    medium: { label: 'Medium Risk', color: 'bg-score-fair/10 text-score-fair border-score-fair/20' },
    high: { label: 'High Risk', color: 'bg-score-critical/10 text-score-critical border-score-critical/20' },
  };

  return (
    <Link to={`/product/${product.id.replace('#', '')}`}>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 bg-card border-border/50">
        <CardContent className="p-0">
          {/* Image placeholder */}
          <div className="h-40 bg-gradient-to-br from-eco-sage/20 to-eco-leaf/10 flex items-center justify-center relative overflow-hidden">
            <Leaf className="w-16 h-16 text-primary/30 group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute top-3 right-3">
              <ScoreDisplay score={score} size="sm" showLabel={false} />
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground font-mono">{product.id}</p>
              <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {product.name}
              </h3>
              <p className="text-sm text-muted-foreground">{product.brand}</p>
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{product.origin.country}</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge 
                variant="outline" 
                className={cn("text-xs border", laborRiskConfig[product.laborRisk].color)}
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                {laborRiskConfig[product.laborRisk].label}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {product.carbonFootprint} kg CO₂
              </Badge>
            </div>

            {product.certifications.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {product.certifications.slice(0, 2).map((cert, i) => (
                  <Badge key={i} className="text-xs bg-primary/10 text-primary border-0 hover:bg-primary/20">
                    {cert}
                  </Badge>
                ))}
                {product.certifications.length > 2 && (
                  <Badge className="text-xs bg-muted text-muted-foreground border-0">
                    +{product.certifications.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
