import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { lookupBarcode } from "@/services/openfoodfacts";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import { CalAIButton } from "@/components/CalAIButton";
import { AlertBox } from "@/components/AlertBox";

export default function OpenFoodFactsDetail() {
  const { barcode } = useParams<{ barcode: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<OpenFoodFactsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (barcode) {
      loadProduct(barcode);
    }
  }, [barcode]);

  const loadProduct = async (code: string) => {
    setLoading(true);
    try {
      const result = await lookupBarcode(code);
      if (result.found) {
        setProduct(result);
      } else {
        setError("Product not found in OpenFoodFacts database");
      }
    } catch (err) {
      setError("Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  const getVerdict = () => {
    if (!product) return null;

    const grade = product.ecoscoreGrade?.toLowerCase();
    const novaGroup = product.novaGroup;

    // Verdict logic: A/B = BUY, C = CONSIDER, D/E = AVOID
    let verdict = { emoji: "❓", label: "UNKNOWN", color: "hsl(210 15% 63%)", action: "Review Details" };

    if (grade === "a" || grade === "b") {
      verdict = { emoji: "✅", label: "BUY - Excellent Choice!", color: "hsl(142 71% 45%)", action: "Perfect" };
    } else if (grade === "c") {
      verdict = { emoji: "🤔", label: "CONSIDER - Moderate Impact", color: "hsl(45 93% 47%)", action: "Review" };
    } else if (grade === "d") {
      verdict = { emoji: "⚠️", label: "CAUTION - High Impact", color: "hsl(0 84% 60%)", action: "Avoid if Possible" };
    } else if (grade === "e") {
      verdict = { emoji: "🚫", label: "AVOID - Very High Impact", color: "hsl(0 84% 60%)", action: "Strong Caution" };
    }

    return verdict;
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: "hsl(210 40% 10%)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Header />
        <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader2 className="w-12 h-12 animate-spin" style={{ color: "hsl(38 92% 50%)" }} />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ backgroundColor: "hsl(210 40% 10%)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Header />
        <main style={{ flex: 1, paddingTop: "2rem", paddingBottom: "2rem" }}>
          <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "0 1rem" }}>
            <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "hsl(38 92% 50%)" }}>
              <ArrowLeft size={20} /> Back
            </button>
            <AlertBox type="error" title="Product Not Found" message={error || "Unable to load product details"} />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const verdict = getVerdict();
  const agri = product.ecoscoreData?.agribalyse;
  const adjustments = product.ecoscoreData?.adjustments;

  return (
    <div style={{ backgroundColor: "hsl(210 40% 10%)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <main style={{ flex: 1, paddingTop: "2rem", paddingBottom: "2rem" }}>
        <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "0 1rem" }}>
          {/* Back Button */}
          <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "hsl(38 92% 50%)" }}>
            <ArrowLeft size={20} /> Back
          </button>

          {/* Verdict Box - Prominent at Top */}
          {verdict && (
            <div style={{
              backgroundColor: "hsl(210 35% 18%)",
              border: `2px solid ${verdict.color}`,
              borderRadius: "0.75rem",
              padding: "2rem",
              marginBottom: "2rem",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{verdict.emoji}</div>
              <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", marginBottom: "0.5rem", color: verdict.color }}>
                {verdict.label}
              </h1>
              <p style={{ fontSize: "1rem", color: "hsl(210 15% 63%)", marginBottom: "1.5rem" }}>
                {product.ecoscoreGrade
                  ? `Environmental Score: ${product.ecoscoreGrade.toUpperCase()} (${product.ecoscoreScore}/100)`
                  : "No eco-score available"}
              </p>
              <CalAIButton emoji={verdict.emoji} onClick={() => document.getElementById("details")?.scrollIntoView({ behavior: "smooth" })}>
                {verdict.action}
              </CalAIButton>
            </div>
          )}

          {/* Product Info */}
          <div style={{
            backgroundColor: "hsl(210 35% 18%)",
            borderRadius: "0.5rem",
            padding: "1.5rem",
            marginBottom: "2rem",
            display: "flex",
            gap: "1.5rem"
          }}>
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.productName || "Product"}
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "0.5rem",
                  objectFit: "cover",
                  flexShrink: 0
                }}
              />
            )}
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem", color: "hsl(210 15% 94%)" }}>
                {product.productName || "Unknown Product"}
              </h2>
              {product.brand && (
                <p style={{ fontSize: "1.125rem", marginBottom: "1rem", color: "hsl(210 15% 63%)" }}>
                  {product.brand}
                </p>
              )}
              <p style={{ fontSize: "0.875rem", color: "hsl(210 15% 63%)" }}>
                Barcode: <span style={{ fontFamily: "monospace" }}>{product.barcode}</span>
              </p>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div id="details" style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem", color: "hsl(210 15% 94%)" }}>
              🌍 Environmental Impact
            </h2>

            {/* Eco Score */}
            {product.ecoscoreGrade && (
              <div style={{
                backgroundColor: "hsl(210 35% 18%)",
                borderRadius: "0.5rem",
                padding: "1.5rem",
                marginBottom: "1rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <span style={{ color: "hsl(210 15% 63%)" }}>Eco-Score Grade:</span>
                  <span style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    backgroundColor: "hsl(38 92% 50%)",
                    color: "white"
                  }}>
                    {product.ecoscoreGrade.toUpperCase()}
                  </span>
                </div>
                {product.ecoscoreScore !== null && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "hsl(210 15% 63%)" }}>Score:</span>
                    <span style={{ fontWeight: "bold", color: "hsl(38 92% 50%)" }}>
                      {product.ecoscoreScore}/100
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Carbon Footprint */}
            {agri?.co2_total !== undefined && (
              <div style={{
                backgroundColor: "hsl(210 35% 18%)",
                borderRadius: "0.5rem",
                padding: "1.5rem",
                marginBottom: "1rem"
              }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: "bold", marginBottom: "1rem", color: "hsl(210 15% 94%)" }}>
                  🌱 Carbon Footprint
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  {agri.co2_total !== undefined && (
                    <div>
                      <span style={{ color: "hsl(210 15% 63%)", fontSize: "0.875rem" }}>Total CO₂</span>
                      <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "hsl(38 92% 50%)" }}>
                        {agri.co2_total.toFixed(2)} kg
                      </p>
                    </div>
                  )}
                  {agri.co2_agriculture !== undefined && (
                    <div>
                      <span style={{ color: "hsl(210 15% 63%)", fontSize: "0.875rem" }}>Agriculture</span>
                      <p style={{ fontSize: "1.25rem", fontWeight: "bold", color: "hsl(210 15% 94%)" }}>
                        {agri.co2_agriculture.toFixed(2)} kg
                      </p>
                    </div>
                  )}
                  {agri.co2_processing !== undefined && (
                    <div>
                      <span style={{ color: "hsl(210 15% 63%)", fontSize: "0.875rem" }}>Processing</span>
                      <p style={{ fontSize: "1.25rem", fontWeight: "bold", color: "hsl(210 15% 94%)" }}>
                        {agri.co2_processing.toFixed(2)} kg
                      </p>
                    </div>
                  )}
                  {agri.co2_packaging !== undefined && (
                    <div>
                      <span style={{ color: "hsl(210 15% 63%)", fontSize: "0.875rem" }}>Packaging</span>
                      <p style={{ fontSize: "1.25rem", fontWeight: "bold", color: "hsl(210 15% 94%)" }}>
                        {agri.co2_packaging.toFixed(2)} kg
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Nutri Score */}
            {product.nutriscoreGrade && (
              <div style={{
                backgroundColor: "hsl(210 35% 18%)",
                borderRadius: "0.5rem",
                padding: "1.5rem",
                marginBottom: "1rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "hsl(210 15% 63%)" }}>Nutrition Score:</span>
                  <span style={{
                    fontSize: "1.25rem",
                    fontWeight: "bold",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    backgroundColor: "hsl(38 92% 50%)",
                    color: "white"
                  }}>
                    {product.nutriscoreGrade.toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            {/* Processing Level */}
            {product.novaGroup && (
              <div style={{
                backgroundColor: "hsl(210 35% 18%)",
                borderRadius: "0.5rem",
                padding: "1.5rem",
                marginBottom: "1rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "hsl(210 15% 63%)" }}>Processing Level:</span>
                  <span style={{ fontWeight: "bold", color: "hsl(210 15% 94%)" }}>
                    {
                      {
                        1: "🌱 Unprocessed",
                        2: "🥘 Minimally Processed",
                        3: "🏭 Processed",
                        4: "🤖 Ultra-Processed"
                      }[product.novaGroup] || "Unknown"
                    }
                  </span>
                </div>
              </div>
            )}

            {/* Labels */}
            {product.labels.length > 0 && (
              <div style={{
                backgroundColor: "hsl(210 35% 18%)",
                borderRadius: "0.5rem",
                padding: "1.5rem"
              }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: "bold", marginBottom: "1rem", color: "hsl(210 15% 94%)" }}>
                  🏷️ Certifications & Labels
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {product.labels.map((label) => (
                    <span
                      key={label}
                      style={{
                        backgroundColor: "hsl(210 35% 22%)",
                        color: "hsl(210 15% 94%)",
                        padding: "0.5rem 1rem",
                        borderRadius: "9999px",
                        fontSize: "0.875rem"
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
