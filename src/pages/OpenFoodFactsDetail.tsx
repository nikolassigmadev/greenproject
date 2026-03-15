import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { lookupBarcode } from "@/services/openfoodfacts";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import { CalAIButton } from "@/components/CalAIButton";
import { AlertBox } from "@/components/AlertBox";

// Known forced/child labor allegations database with sources
interface LaborAllegation {
  issue: string;
  details: string;
  source: string;
  sourceUrl: string;
  year: string;
}

interface BrandLaborRecord {
  brandPattern: RegExp;
  parentCompany: string;
  allegations: LaborAllegation[];
}

const LABOR_DATABASE: BrandLaborRecord[] = [
  {
    brandPattern: /nestl[eé]|kit\s?kat|nescaf[eé]|maggi|nespresso|cheerios|gerber|purina|perrier|san pellegrino|häagen.?dazs|dreyer|stouffer|lean cuisine|digiorno|tombstone|buitoni|carnation|coffee.?mate|milo|nesquik/i,
    parentCompany: "Nestlé",
    allegations: [
      { issue: "Child Labor in Cocoa Supply Chain", details: "Nestlé has faced ongoing lawsuits and reports regarding child labor in cocoa farms in Côte d'Ivoire and Ghana. A 2020 University of Chicago study found 1.56 million children working in cocoa production in these countries.", source: "U.S. Department of Labor", sourceUrl: "https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods", year: "2020" },
      { issue: "Forced Labor in Thai Fishing Industry", details: "Nestlé's own internal investigation found forced labor in its Thai seafood supply chain, including workers being held against their will on fishing boats.", source: "Associated Press Investigation", sourceUrl: "https://www.ap.org/explore/seafood-from-slaves/", year: "2015" },
      { issue: "Coffee Supply Chain Labor Abuses", details: "Reports have linked Nestlé's coffee supply chain to forced labor conditions on Brazilian coffee farms.", source: "Danwatch Investigation", sourceUrl: "https://danwatch.dk/en/", year: "2016" },
    ]
  },
  {
    brandPattern: /coca.?cola|sprite|fanta|minute maid|dasani|powerade|vitaminwater|simply|honest tea|fuze/i,
    parentCompany: "The Coca-Cola Company",
    allegations: [
      { issue: "Sugar Supply Chain Child Labor", details: "Coca-Cola's sugar supply chain has been linked to child labor in sugarcane fields in countries including the Philippines, El Salvador, and Brazil.", source: "U.S. Department of Labor", sourceUrl: "https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods", year: "2018" },
      { issue: "Labor Rights Violations in Colombia", details: "Reports of violence against union workers at Coca-Cola bottling plants in Colombia, including threats and killings of labor organizers.", source: "Human Rights Watch", sourceUrl: "https://www.hrw.org/", year: "2008" },
    ]
  },
  {
    brandPattern: /pepsi|lay'?s|doritos|cheetos|tostitos|fritos|quaker|gatorade|tropicana|7.?up|mountain dew|mirinda|ruffles|walkers|sun chips/i,
    parentCompany: "PepsiCo",
    allegations: [
      { issue: "Palm Oil Supply Chain Labor Abuses", details: "PepsiCo's palm oil suppliers in Indonesia have been linked to child labor and forced labor on palm oil plantations.", source: "Amnesty International", sourceUrl: "https://www.amnesty.org/en/latest/news/2016/11/palm-oil-global-brands-profiting-from-child-and-forced-labour/", year: "2016" },
      { issue: "Sugarcane Supply Chain Child Labor", details: "PepsiCo's sugar supply chain in Brazil has been connected to exploitative labor conditions, including child labor in sugarcane harvesting.", source: "U.S. Department of Labor", sourceUrl: "https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods", year: "2018" },
    ]
  },
  {
    brandPattern: /mars|m&m|snickers|twix|milky way|bounty|skittles|starburst|dove chocolate|galaxy|maltesers|uncle ben|ben'?s original|pedigree|whiskas|royal canin/i,
    parentCompany: "Mars, Inc.",
    allegations: [
      { issue: "Child Labor in Cocoa Supply Chain", details: "Mars has been named in reports documenting child labor in West African cocoa farms. Despite pledges to eliminate child labor, progress has been slow.", source: "Washington Post Investigation", sourceUrl: "https://www.washingtonpost.com/graphics/2019/business/hershey-nestle-mars-chocolate-child-labor-west-africa/", year: "2019" },
      { issue: "Forced Labor in Palm Oil", details: "Mars' palm oil supply chain has been linked to forced labor and exploitation on plantations in Southeast Asia.", source: "Amnesty International", sourceUrl: "https://www.amnesty.org/en/latest/news/2016/11/palm-oil-global-brands-profiting-from-child-and-forced-labour/", year: "2016" },
    ]
  },
  {
    brandPattern: /mondelez|oreo|cadbury|toblerone|milka|ritz|lu|belvita|tang|trident|philadelphia|halls|chips ahoy|triscuit|wheat thins|sour patch/i,
    parentCompany: "Mondelēz International",
    allegations: [
      { issue: "Child Labor in Cocoa Supply Chain", details: "Mondelēz (formerly Kraft Foods) has been linked to child labor in cocoa production in Ghana and Côte d'Ivoire. A 2020 report found the company still had significant child labor in its supply chain.", source: "International Rights Advocates", sourceUrl: "https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods", year: "2021" },
    ]
  },
  {
    brandPattern: /ferrero|nutella|kinder|tic tac|ferrero rocher|raffaello|duplo|hanuta/i,
    parentCompany: "Ferrero Group",
    allegations: [
      { issue: "Hazelnut Supply Chain Child Labor", details: "Ferrero's hazelnut supply chain in Turkey has been linked to child labor, with children as young as 6 working during harvest season.", source: "BBC Investigation / Fair Labor Association", sourceUrl: "https://www.fairlabor.org/", year: "2019" },
      { issue: "Palm Oil Supply Chain Abuses", details: "Ferrero has faced criticism over palm oil sourcing linked to deforestation and labor exploitation in Indonesia and Malaysia.", source: "Rainforest Action Network", sourceUrl: "https://www.ran.org/", year: "2018" },
    ]
  },
  {
    brandPattern: /unilever|dove|axe|lynx|lipton|knorr|hellmann|ben.?jerry|breyer|magnum|cornetto|heartbrand|flora|becel|rama|vaseline|persil|surf|omo|comfort|domestos/i,
    parentCompany: "Unilever",
    allegations: [
      { issue: "Tea Plantation Labor Abuses", details: "Workers on Unilever's tea plantations in Kenya reported poverty wages, unsafe conditions, and sexual harassment.", source: "BBC Investigation", sourceUrl: "https://www.bbc.com/news/", year: "2019" },
      { issue: "Palm Oil Supply Chain Forced Labor", details: "Unilever's palm oil suppliers have been linked to forced labor, debt bondage, and child labor in Indonesia.", source: "Amnesty International", sourceUrl: "https://www.amnesty.org/en/latest/news/2016/11/palm-oil-global-brands-profiting-from-child-and-forced-labour/", year: "2016" },
    ]
  },
  {
    brandPattern: /hershey|reese|kisses|twizzler|jolly rancher|ice breaker|brookside|almond joy|mounds|york|kit kat/i,
    parentCompany: "The Hershey Company",
    allegations: [
      { issue: "Child Labor in Cocoa Supply Chain", details: "Hershey has faced persistent criticism for child labor in its West African cocoa supply chain, with children performing hazardous work including using machetes and carrying heavy loads.", source: "Washington Post Investigation", sourceUrl: "https://www.washingtonpost.com/graphics/2019/business/hershey-nestle-mars-chocolate-child-labor-west-africa/", year: "2019" },
    ]
  },
  {
    brandPattern: /danone|activia|evian|volvic|aptamil|nutricia|alpro|silk|oikos|actimel/i,
    parentCompany: "Danone",
    allegations: [
      { issue: "Supply Chain Labor Concerns", details: "Danone has faced criticism over labor conditions in its dairy supply chains, including low wages for farmworkers in developing markets.", source: "Oxfam Behind the Brands Report", sourceUrl: "https://www.oxfam.org/en/tags/behind-brands", year: "2018" },
    ]
  },
  {
    brandPattern: /kellogg|corn flakes|frosted flakes|froot loops|rice krispies|pop.?tarts|eggo|cheez.?it|pringles|morningstar/i,
    parentCompany: "Kellogg Company",
    allegations: [
      { issue: "Palm Oil Supply Chain Labor Abuses", details: "Kellogg's palm oil suppliers have been linked to child labor and forced labor in Indonesia and Guatemala.", source: "Amnesty International", sourceUrl: "https://www.amnesty.org/en/latest/news/2016/11/palm-oil-global-brands-profiting-from-child-and-forced-labour/", year: "2016" },
      { issue: "Sugarcane Supply Chain", details: "Reports have linked Kellogg's sugar suppliers to exploitative labor in sugarcane harvesting in developing countries.", source: "U.S. Department of Labor", sourceUrl: "https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods", year: "2020" },
    ]
  },
];

const findLaborAllegations = (product: OpenFoodFactsResult): { parentCompany: string; allegations: LaborAllegation[] } | null => {
  const brandText = `${product.brand || ""} ${product.productName || ""}`.toLowerCase();

  for (const record of LABOR_DATABASE) {
    if (record.brandPattern.test(brandText)) {
      return { parentCompany: record.parentCompany, allegations: record.allegations };
    }
  }
  return null;
};

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
    const laborRecord = findLaborAllegations(product);
    const laborCount = laborRecord?.allegations.length || 0;

    // Step 1: Base verdict from eco-score grade or numeric score
    const score = product.ecoscoreScore;
    const hasEcoData = grade || (score !== null && score !== undefined);
    const scoreLabel = grade ? `Eco-Score: ${grade.toUpperCase()}` : (score !== null && score !== undefined ? `Eco-Score: ${score}/100` : "No eco-score data available");

    let verdict = { emoji: "❓", label: "UNKNOWN", color: "hsl(150 10% 45%)", action: "Review Details", reason: "No eco-score data available" };

    if (grade === "a" || grade === "b") {
      verdict = { emoji: "✅", label: "BUY - Excellent Choice!", color: "hsl(142 71% 45%)", action: "Perfect", reason: scoreLabel };
    } else if (grade === "c") {
      verdict = { emoji: "🤔", label: "CONSIDER - Moderate Impact", color: "hsl(45 93% 47%)", action: "Review", reason: scoreLabel };
    } else if (grade === "d") {
      verdict = { emoji: "⚠️", label: "CAUTION - High Impact", color: "hsl(0 84% 60%)", action: "Avoid if Possible", reason: scoreLabel };
    } else if (grade === "e" || grade === "f") {
      verdict = { emoji: "🚫", label: "AVOID - Very High Impact", color: "hsl(0 84% 60%)", action: "Strong Caution", reason: scoreLabel };
    } else if (!grade && score !== null && score !== undefined) {
      // No letter grade but has numeric score
      if (score >= 60) {
        verdict = { emoji: "✅", label: "BUY - Excellent Choice!", color: "hsl(142 71% 45%)", action: "Perfect", reason: scoreLabel };
      } else if (score >= 40) {
        verdict = { emoji: "🤔", label: "CONSIDER - Moderate Impact", color: "hsl(45 93% 47%)", action: "Review", reason: scoreLabel };
      } else if (score >= 20) {
        verdict = { emoji: "⚠️", label: "CAUTION - High Impact", color: "hsl(0 84% 60%)", action: "Avoid if Possible", reason: scoreLabel };
      } else {
        verdict = { emoji: "🚫", label: "AVOID - Very High Impact", color: "hsl(0 84% 60%)", action: "Strong Caution", reason: scoreLabel };
      }
    }

    // Step 2: Downgrade verdict if labor allegations exist
    // Labor allegations are serious — they override eco-score in severity
    if (laborCount > 0) {
      if (laborCount >= 3) {
        // 3+ allegations = always AVOID regardless of current verdict
        verdict = {
          emoji: "🚫",
          label: "AVOID - Severe Labor Concerns",
          color: "hsl(0 84% 50%)",
          action: "Strong Caution",
          reason: `${laborCount} labor/human rights allegations against ${laborRecord!.parentCompany}`,
        };
      } else if (laborCount >= 2) {
        // 2 allegations = at minimum CAUTION, can be worse
        if (verdict.emoji === "✅" || verdict.emoji === "🤔" || verdict.emoji === "❓") {
          verdict = {
            emoji: "⚠️",
            label: "CAUTION - Labor Concerns",
            color: "hsl(0 84% 60%)",
            action: "Avoid if Possible",
            reason: `${laborCount} labor allegations against ${laborRecord!.parentCompany}`,
          };
        }
      } else {
        // 1 allegation = at minimum CONSIDER, can be worse
        if (verdict.emoji === "✅" || verdict.emoji === "❓") {
          verdict = {
            emoji: "🤔",
            label: "CONSIDER - Labor Concerns",
            color: "hsl(45 93% 47%)",
            action: "Review",
            reason: `1 labor allegation against ${laborRecord!.parentCompany}`,
          };
        }
      }
    }

    return verdict;
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: "hsl(40 33% 95%)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Header />
        <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader2 className="w-12 h-12 animate-spin" style={{ color: "hsl(152 45% 30%)" }} />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ backgroundColor: "hsl(40 33% 95%)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Header />
        <main style={{ flex: 1, paddingTop: "2rem", paddingBottom: "2rem" }}>
          <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "0 1rem" }}>
            <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "hsl(152 45% 30%)" }}>
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
  const laborRecord = findLaborAllegations(product);

  return (
    <div style={{ backgroundColor: "hsl(40 33% 95%)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <main style={{ flex: 1, paddingTop: "2rem", paddingBottom: "2rem" }}>
        <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "0 1rem" }}>
          {/* Back Button */}
          <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "hsl(152 45% 30%)" }}>
            <ArrowLeft size={20} /> Back
          </button>

          {/* Verdict Box - Prominent at Top */}
          {verdict && (
            <div style={{
              backgroundColor: "hsl(40 30% 98%)",
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
              <p style={{ fontSize: "1rem", color: "hsl(150 10% 45%)", marginBottom: "0.5rem" }}>
                {verdict.reason}
              </p>
              {laborRecord && (product.ecoscoreGrade || product.ecoscoreScore !== null) && (
                <p style={{ fontSize: "0.875rem", color: "hsl(150 10% 45%)", marginBottom: "1rem" }}>
                  Environmental Score: {product.ecoscoreGrade ? `${product.ecoscoreGrade.toUpperCase()} (${product.ecoscoreScore}/100)` : `${product.ecoscoreScore}/100`}
                </p>
              )}
              {!laborRecord && !product.ecoscoreGrade && (product.ecoscoreScore === null || product.ecoscoreScore === undefined) && (
                <p style={{ fontSize: "0.875rem", color: "hsl(150 10% 45%)", marginBottom: "1rem" }}>
                  No eco-score available
                </p>
              )}
              <CalAIButton emoji={verdict.emoji} onClick={() => document.getElementById("details")?.scrollIntoView({ behavior: "smooth" })}>
                {verdict.action}
              </CalAIButton>
            </div>
          )}

          {/* Product Info */}
          <div style={{
            backgroundColor: "hsl(40 30% 98%)",
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
              <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem", color: "hsl(150 20% 15%)" }}>
                {product.productName || "Unknown Product"}
              </h2>
              {product.brand && (
                <p style={{ fontSize: "1.125rem", marginBottom: "1rem", color: "hsl(150 10% 45%)" }}>
                  {product.brand}
                </p>
              )}
              <p style={{ fontSize: "0.875rem", color: "hsl(150 10% 45%)" }}>
                Barcode: <span style={{ fontFamily: "monospace" }}>{product.barcode}</span>
              </p>
            </div>
          </div>

          {/* Labor Allegations Section */}
          {laborRecord && (
            <div style={{
              backgroundColor: "hsl(0 50% 97%)",
              border: "2px solid hsl(0 70% 60%)",
              borderRadius: "0.75rem",
              padding: "1.5rem",
              marginBottom: "2rem",
            }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem", color: "hsl(0 70% 40%)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                ⚠️ Labor & Human Rights Concerns
              </h2>
              <p style={{ fontSize: "0.95rem", color: "hsl(150 10% 45%)", marginBottom: "1.5rem" }}>
                Parent company: <strong style={{ color: "hsl(150 20% 15%)" }}>{laborRecord.parentCompany}</strong>
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {laborRecord.allegations.map((allegation, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: "hsl(0 40% 95%)",
                      borderRadius: "0.5rem",
                      padding: "1rem",
                      borderLeft: "3px solid hsl(0 84% 50%)",
                    }}
                  >
                    <h3 style={{ fontSize: "1rem", fontWeight: "bold", color: "hsl(0 70% 35%)", marginBottom: "0.5rem" }}>
                      {allegation.issue}
                    </h3>
                    <p style={{ fontSize: "0.875rem", color: "hsl(150 10% 35%)", marginBottom: "0.75rem", lineHeight: "1.5" }}>
                      {allegation.details}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <a
                        href={allegation.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: "0.8rem",
                          color: "hsl(152 45% 40%)",
                          textDecoration: "underline",
                        }}
                      >
                        Source: {allegation.source}
                      </a>
                      <span style={{ fontSize: "0.75rem", color: "hsl(150 10% 50%)" }}>
                        {allegation.year}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: "0.75rem", color: "hsl(150 10% 55%)", marginTop: "1rem", fontStyle: "italic" }}>
                Note: Allegations are based on publicly available reports and investigations. Companies may have taken steps to address these issues since the reports were published.
              </p>
            </div>
          )}

          {/* Detailed Breakdown */}
          <div id="details" style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem", color: "hsl(150 20% 15%)" }}>
              🌍 Environmental Impact
            </h2>

            {/* Eco Score */}
            {product.ecoscoreGrade && (
              <div style={{
                backgroundColor: "hsl(40 30% 98%)",
                borderRadius: "0.5rem",
                padding: "1.5rem",
                marginBottom: "1rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <span style={{ color: "hsl(150 10% 45%)" }}>Eco-Score Grade:</span>
                  <span style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    backgroundColor: (product.ecoscoreScore !== null && product.ecoscoreScore !== undefined)
                      ? product.ecoscoreScore < 30 ? "hsl(0 84% 55%)" : product.ecoscoreScore < 50 ? "hsl(45 93% 47%)" : "hsl(152 45% 30%)"
                      : ["a", "b"].includes(product.ecoscoreGrade?.toLowerCase?.() || "") ? "hsl(152 45% 30%)" : ["d", "e", "f"].includes(product.ecoscoreGrade?.toLowerCase?.() || "") ? "hsl(0 84% 55%)" : "hsl(45 93% 47%)",
                    color: "white"
                  }}>
                    {product.ecoscoreGrade.toUpperCase()}
                  </span>
                </div>
                {product.ecoscoreScore !== null && product.ecoscoreScore !== undefined && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "hsl(150 10% 45%)" }}>Score:</span>
                    <span style={{
                      fontWeight: "bold",
                      color: product.ecoscoreScore < 30 ? "hsl(0 84% 55%)" : product.ecoscoreScore < 50 ? "hsl(45 93% 47%)" : "hsl(152 45% 30%)"
                    }}>
                      {product.ecoscoreScore}/100
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Carbon Footprint */}
            {agri?.co2_total !== undefined && (
              <div style={{
                backgroundColor: "hsl(40 30% 98%)",
                borderRadius: "0.5rem",
                padding: "1.5rem",
                marginBottom: "1rem"
              }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: "bold", marginBottom: "1rem", color: "hsl(150 20% 15%)" }}>
                  🌱 Carbon Footprint
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  {agri.co2_total !== undefined && (
                    <div>
                      <span style={{ color: "hsl(150 10% 45%)", fontSize: "0.875rem" }}>Total CO₂</span>
                      <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "hsl(152 45% 30%)" }}>
                        {agri.co2_total.toFixed(2)} kg
                      </p>
                    </div>
                  )}
                  {agri.co2_agriculture !== undefined && (
                    <div>
                      <span style={{ color: "hsl(150 10% 45%)", fontSize: "0.875rem" }}>Agriculture</span>
                      <p style={{ fontSize: "1.25rem", fontWeight: "bold", color: "hsl(150 20% 15%)" }}>
                        {agri.co2_agriculture.toFixed(2)} kg
                      </p>
                    </div>
                  )}
                  {agri.co2_processing !== undefined && (
                    <div>
                      <span style={{ color: "hsl(150 10% 45%)", fontSize: "0.875rem" }}>Processing</span>
                      <p style={{ fontSize: "1.25rem", fontWeight: "bold", color: "hsl(150 20% 15%)" }}>
                        {agri.co2_processing.toFixed(2)} kg
                      </p>
                    </div>
                  )}
                  {agri.co2_packaging !== undefined && (
                    <div>
                      <span style={{ color: "hsl(150 10% 45%)", fontSize: "0.875rem" }}>Packaging</span>
                      <p style={{ fontSize: "1.25rem", fontWeight: "bold", color: "hsl(150 20% 15%)" }}>
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
                backgroundColor: "hsl(40 30% 98%)",
                borderRadius: "0.5rem",
                padding: "1.5rem",
                marginBottom: "1rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "hsl(150 10% 45%)" }}>Nutrition Score:</span>
                  <span style={{
                    fontSize: "1.25rem",
                    fontWeight: "bold",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    backgroundColor: "hsl(152 45% 30%)",
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
                backgroundColor: "hsl(40 30% 98%)",
                borderRadius: "0.5rem",
                padding: "1.5rem",
                marginBottom: "1rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "hsl(150 10% 45%)" }}>Processing Level:</span>
                  <span style={{ fontWeight: "bold", color: "hsl(150 20% 15%)" }}>
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
                backgroundColor: "hsl(40 30% 98%)",
                borderRadius: "0.5rem",
                padding: "1.5rem"
              }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: "bold", marginBottom: "1rem", color: "hsl(150 20% 15%)" }}>
                  🏷️ Certifications & Labels
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {product.labels.map((label) => (
                    <span
                      key={label}
                      style={{
                        backgroundColor: "hsl(40 25% 93%)",
                        color: "hsl(150 20% 15%)",
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
