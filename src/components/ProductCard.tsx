import { Link } from "react-router-dom";
import { MapPin, Leaf, AlertTriangle, Package, Award, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { Product, calculateScore } from "@/data/products";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

const laborRiskConfig = {
  low: {
    label: "Low Risk",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  medium: {
    label: "Medium Risk",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  high: {
    label: "High Risk",
    className: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
};

const scoreGradient: (score: number) => string = (score) => {
  if (score >= 80) return "from-emerald-400/20 via-teal-300/10 to-emerald-200/20";
  if (score >= 60) return "from-lime-400/20 via-lime-300/10 to-emerald-200/20";
  if (score >= 40) return "from-amber-400/20 via-amber-300/10 to-yellow-200/20";
  if (score >= 20) return "from-orange-400/20 via-orange-300/10 to-amber-200/20";
  return "from-red-400/20 via-red-300/10 to-orange-200/20";
};

export function ProductCard({ product }: ProductCardProps) {
  const score = calculateScore(product);
  const labor = laborRiskConfig[product.laborRisk];

  return (
    <Link
      to={`/product/${product.id.replace("#", "")}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-2xl cursor-pointer"
    >
      <article className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden transition-all duration-200 group-hover:shadow-lg group-hover:shadow-emerald-500/10 group-hover:-translate-y-0.5 group-hover:border-emerald-200 dark:group-hover:border-emerald-800 h-full flex flex-col">

        {/* Image area */}
        <div className={cn("relative h-40 bg-gradient-to-br overflow-hidden flex-shrink-0", scoreGradient(score))}>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Leaf className="w-14 h-14 text-emerald-500/20 transition-all duration-300 group-hover:text-emerald-500/35" />
            </div>
          )}

          {/* Top-left: Top badge */}
          {score >= 90 && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow-sm shadow-emerald-500/30">
                <TrendingUp className="w-3 h-3" />
                Top Pick
              </span>
            </div>
          )}

          {/* Top-right: Score badge */}
          <div className="absolute top-3 right-3">
            <ScoreDisplay score={score} size="sm" showLabel={false} />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3 flex-1">

          {/* Name + brand */}
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-[15px] leading-snug line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
              {product.name}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">{product.brand}</p>
          </div>

          {/* Origin */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <MapPin className="w-3 h-3 text-emerald-500 flex-shrink-0" />
            <span className="truncate">{product.origin.country}</span>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap gap-1.5 mt-auto">
            <span className={cn(
              "inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium",
              labor.className
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", labor.dot)} />
              {labor.label}
            </span>

            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium">
              <Package className="w-3 h-3" />
              {product.carbonFootprint} kg CO₂
            </span>
          </div>

          {/* Certifications */}
          {product.certifications.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.certifications.slice(0, 2).map((cert, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium"
                >
                  <Award className="w-2.5 h-2.5" />
                  {cert}
                </span>
              ))}
              {product.certifications.length > 2 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-medium">
                  +{product.certifications.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
