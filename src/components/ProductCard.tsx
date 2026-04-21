import { Link } from "react-router-dom";
import { MapPin, Leaf, Package, Award } from "lucide-react";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { Product, calculateScore } from "@/data/products";

interface ProductCardProps {
  product: Product;
}

const laborRiskConfig = {
  low: {
    label: "LOW RISK",
    borderColor: "rgba(16, 185, 129, 0.4)",
    textColor: "#10b981",
  },
  medium: {
    label: "MED RISK",
    borderColor: "rgba(245, 158, 11, 0.4)",
    textColor: "#f59e0b",
  },
  high: {
    label: "HIGH RISK",
    borderColor: "rgba(240, 0, 7, 0.5)",
    textColor: "#00c853",
  },
};

const gradeAccentColor = (score: number): string => {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#84cc16";
  if (score >= 40) return "#f59e0b";
  if (score >= 20) return "#f97316";
  return "#00c853";
};

export function ProductCard({ product }: ProductCardProps) {
  const score = calculateScore(product);
  const labor = laborRiskConfig[product.laborRisk];
  const accentColor = gradeAccentColor(score);

  // Grade letter from score
  const gradeLetter =
    score >= 80 ? "A" :
    score >= 60 ? "B" :
    score >= 40 ? "C" :
    score >= 20 ? "D" : "E";

  return (
    <Link
      to={`/product/${product.id.replace("#", "")}`}
      className="group block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
      style={{ textDecoration: "none" }}
    >
      <article
        className="h-full flex flex-col overflow-hidden transition-all duration-150 group-hover:border-white/20"
        style={{
          background: "#000000",
          border: "1px solid rgba(255,255,255,0.08)",
          borderTop: `2px solid ${accentColor}`,
        }}
      >

        {/* Image area */}
        <div
          className="relative overflow-hidden flex-shrink-0"
          style={{ height: "9rem", background: "#0a0a0a" }}
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Leaf className="w-10 h-10" style={{ color: "rgba(132,137,142,0.2)" }} />
            </div>
          )}

          {/* Score badge — outlined box */}
          <div
            className="absolute top-2 right-2 flex flex-col items-center justify-center"
            style={{
              width: "2.25rem",
              height: "2.25rem",
              border: `1px solid ${accentColor}`,
              background: "rgba(0,0,0,0.85)",
            }}
          >
            <span
              className="font-mono font-black leading-none"
              style={{ fontSize: "1.1rem", color: accentColor }}
            >
              {gradeLetter}
            </span>
          </div>

          {/* Score overlay */}
          <div className="absolute bottom-0 left-0 right-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)", height: "2rem" }} />
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col gap-2 flex-1">

          {/* Name + brand */}
          <div className="flex-1">
            <h3
              className="font-mono font-bold uppercase leading-tight line-clamp-2 transition-colors group-hover:text-white"
              style={{ fontSize: "0.7rem", color: "#ffffff", letterSpacing: "0.04em" }}
            >
              {product.name}
            </h3>
            <p
              className="font-mono mt-0.5 uppercase"
              style={{ fontSize: "0.55rem", color: "#84898E", letterSpacing: "0.08em" }}
            >
              {product.brand}
            </p>
          </div>

          {/* Origin */}
          <div className="flex items-center gap-1.5">
            <MapPin className="w-2.5 h-2.5 flex-shrink-0" style={{ color: "#84898E" }} />
            <span
              className="font-mono truncate"
              style={{ fontSize: "0.58rem", color: "#84898E" }}
            >
              {product.origin.country}
            </span>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {/* Labor risk badge */}
            <span
              className="font-mono uppercase"
              style={{
                fontSize: "0.5rem",
                color: labor.textColor,
                border: `1px solid ${labor.borderColor}`,
                padding: "2px 6px",
                letterSpacing: "0.08em",
              }}
            >
              [{labor.label}]
            </span>

            {/* CO2 badge */}
            <span
              className="font-mono uppercase flex items-center gap-1"
              style={{
                fontSize: "0.5rem",
                color: "#84898E",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "2px 6px",
                letterSpacing: "0.06em",
              }}
            >
              <Package className="w-2 h-2" />
              {product.carbonFootprint} CO₂
            </span>
          </div>

          {/* Certifications */}
          {product.certifications.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.certifications.slice(0, 2).map((cert, i) => (
                <span
                  key={i}
                  className="font-mono uppercase flex items-center gap-1"
                  style={{
                    fontSize: "0.48rem",
                    color: "#40aaff",
                    border: "1px solid rgba(64, 170, 255, 0.25)",
                    padding: "2px 5px",
                    letterSpacing: "0.06em",
                  }}
                >
                  <Award className="w-2 h-2" />
                  {cert}
                </span>
              ))}
              {product.certifications.length > 2 && (
                <span
                  className="font-mono"
                  style={{
                    fontSize: "0.48rem",
                    color: "#84898E",
                    border: "1px solid rgba(255,255,255,0.08)",
                    padding: "2px 5px",
                  }}
                >
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
