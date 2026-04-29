import { Link } from "react-router-dom";
import { MapPin, Leaf, Package, Award } from "lucide-react";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { Product, calculateScore } from "@/data/products";

interface ProductCardProps {
  product: Product;
}

const BLUE = "#2979FF";
const BG   = "#F5F7FA";
const CARD = "#FFFFFF";
const BORDER = "#E5E7EB";
const TEXT = "#111827";
const TEXT_MUTED = "#6B7280";

const laborRiskConfig = {
  low:    { label: "Low risk",  color: "#10b981", bg: "#F0FAF6" },
  medium: { label: "Med risk",  color: "#f59e0b", bg: "#FFFBEB" },
  high:   { label: "High risk", color: "#ef4444", bg: "#FFF0F0" },
};

const gradeAccentColor = (score: number): string => {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#84cc16";
  if (score >= 40) return "#f59e0b";
  if (score >= 20) return "#f97316";
  return "#ef4444";
};

const gradeBg = (score: number): string => {
  if (score >= 80) return "#F0FAF6";
  if (score >= 60) return "#F7FAF0";
  if (score >= 40) return "#FFFBEB";
  if (score >= 20) return "#FFF5EE";
  return "#FFF0F0";
};

export function ProductCard({ product }: ProductCardProps) {
  const score = calculateScore(product);
  const labor = laborRiskConfig[product.laborRisk];
  const accentColor = gradeAccentColor(score);

  const gradeLetter =
    score >= 80 ? "A" :
    score >= 60 ? "B" :
    score >= 40 ? "C" :
    score >= 20 ? "D" : "E";

  return (
    <Link
      to={`/product/${product.id.replace("#", "")}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <article style={{
        height: "100%", display: "flex", flexDirection: "column",
        background: CARD, borderRadius: 16,
        border: `1px solid ${BORDER}`,
        borderTop: `3px solid ${accentColor}`,
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}>

        {/* Image area */}
        <div style={{ height: "9rem", background: BG, position: "relative", overflow: "hidden", flexShrink: 0 }}>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Leaf style={{ width: 36, height: 36, color: BORDER }} />
            </div>
          )}
          <div style={{
            position: "absolute", top: 8, right: 8,
            width: 28, height: 28, borderRadius: 8,
            background: gradeBg(score),
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 900, color: accentColor }}>{gradeLetter}</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: "0.78rem", fontWeight: 700, color: TEXT, lineHeight: 1.3,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {product.name}
            </h3>
            <p style={{ fontSize: "0.65rem", color: TEXT_MUTED, marginTop: 2 }}>{product.brand}</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <MapPin style={{ width: 10, height: 10, color: TEXT_MUTED, flexShrink: 0 }} />
            <span style={{ fontSize: "0.65rem", color: TEXT_MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {product.origin.country}
            </span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            <span style={{
              fontSize: "0.6rem", fontWeight: 600,
              color: labor.color, background: labor.bg,
              padding: "2px 6px", borderRadius: 6,
            }}>
              {labor.label}
            </span>
            <span style={{
              fontSize: "0.6rem", fontWeight: 500,
              color: TEXT_MUTED, background: BG,
              padding: "2px 6px", borderRadius: 6,
              display: "flex", alignItems: "center", gap: 3,
            }}>
              <Package style={{ width: 8, height: 8 }} />
              {product.carbonFootprint} CO₂
            </span>
          </div>

          {product.certifications.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {product.certifications.slice(0, 2).map((cert, i) => (
                <span key={i} style={{
                  fontSize: "0.58rem", fontWeight: 600,
                  color: BLUE, background: "#EBF2FF",
                  padding: "2px 6px", borderRadius: 6,
                  display: "flex", alignItems: "center", gap: 3,
                }}>
                  <Award style={{ width: 8, height: 8 }} />{cert}
                </span>
              ))}
              {product.certifications.length > 2 && (
                <span style={{
                  fontSize: "0.58rem", color: TEXT_MUTED,
                  background: BG, padding: "2px 6px", borderRadius: 6,
                }}>
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
