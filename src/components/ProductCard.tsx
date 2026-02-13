import { Link } from "react-router-dom";
import { MapPin, Leaf, AlertTriangle, Star, TrendingUp, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { Product, calculateScore } from "@/data/products";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const score = calculateScore(product);

  const laborRiskConfig = {
    low: { label: 'Low Risk', color: 'bg-score-excellent/10 text-score-excellent border-score-excellent/20' },
    medium: { label: 'Medium Risk', color: 'bg-score-fair/10 text-score-fair border-score-fair/20' },
    high: { label: 'High Risk', color: 'bg-score-critical/10 text-score-critical border-score-critical/20' },
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-score-excellent';
    if (score >= 70) return 'text-score-good';
    if (score >= 50) return 'text-score-fair';
    if (score >= 30) return 'text-score-poor';
    return 'text-score-critical';
  };

  return (
    <Link to={`/product/${product.id.replace('#', '')}`}>
      <Card 
        className="group overflow-hidden transition-all duration-500 hover:shadow-elevated hover:-translate-y-2 bg-card border-border/50 backdrop-blur-sm relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer" />
        </div>
        
        <CardContent className="p-0">
          {/* Product Image with fallback to leaf icon */}
          <div className="h-40 bg-gradient-to-br from-eco-sage/20 via-eco-leaf/10 to-eco-amber/10 flex items-center justify-center relative overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/20 to-transparent animate-pulse-slow" />
            </div>
            
            {/* Product Image or Leaf Icon */}
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  // Fallback to leaf icon if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const leafIcon = document.createElement('div');
                    leafIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-16 h-16 text-primary/40 transition-all duration-500 scale-100 rotate-0"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8c0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6c0 0 .01.01.03.01C7 15.08 7 15.14 7 15.2c0 2.08-1.07 3.28-1 5.3c0 0-1.93.5-4 .5Z"/></svg>';
                    leafIcon.className = 'absolute inset-0 flex items-center justify-center';
                    parent.appendChild(leafIcon);
                  }
                }}
              />
            ) : (
              <Leaf className={`w-16 h-16 text-primary/40 transition-all duration-500 ${
                isHovered ? 'scale-125 rotate-12 text-primary/60' : 'scale-100 rotate-0'
              }`} />
            )}
            
            {/* Score badge with enhanced animation */}
            <div className={`absolute top-3 right-3 transition-all duration-300 ${
              isHovered ? 'scale-110' : 'scale-100'
            }`}>
              <div className="relative">
                <ScoreDisplay score={score} size="sm" showLabel={false} />
                {score >= 90 && (
                  <Star className="absolute -top-2 -right-2 w-4 h-4 text-eco-amber fill-eco-amber animate-pulse" />
                )}
              </div>
            </div>
            
            {/* Hover overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/20 to-transparent transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`} />
          </div>
          
          {/* Content with enhanced layout */}
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">{product.id}</p>
                {score >= 90 && (
                  <div className="flex items-center gap-1 text-eco-amber">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs font-medium">Top Rated</span>
                  </div>
                )}
              </div>
              
              <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 text-lg">
                {product.name}
              </h3>
              
              <p className="text-sm text-muted-foreground font-medium">{product.brand}</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 text-primary" />
              <span>{product.origin.country}</span>
              <span className="text-muted-foreground/50">•</span>
              <span className={cn("font-medium", getScoreColor(score))}>
                Score: {score}/100
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge 
                variant="outline" 
                className={cn("text-xs border transition-all duration-300 hover:scale-105", laborRiskConfig[product.laborRisk].color)}
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                {laborRiskConfig[product.laborRisk].label}
              </Badge>
              <Badge variant="secondary" className="text-xs bg-eco-sage/10 text-eco-sage border-eco-sage/20 hover:bg-eco-sage/20 transition-colors">
                <Package className="w-3 h-3 mr-1" />
                {product.carbonFootprint} kg CO₂
              </Badge>
            </div>

            {product.certifications.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {product.certifications.slice(0, 2).map((cert, i) => (
                  <Badge 
                    key={i} 
                    className="text-xs bg-primary/10 text-primary border-0 hover:bg-primary/20 transition-all duration-300 hover:scale-105"
                  >
                    {cert}
                  </Badge>
                ))}
                {product.certifications.length > 2 && (
                  <Badge className="text-xs bg-muted text-muted-foreground border-0 hover:bg-muted/80 transition-colors">
                    +{product.certifications.length - 2} more
                  </Badge>
                )}
              </div>
            )}
            
            {/* Quick action hint */}
            <div className={`text-xs text-center text-muted-foreground transition-all duration-300 ${
              isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}>
              Click to view details →
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
