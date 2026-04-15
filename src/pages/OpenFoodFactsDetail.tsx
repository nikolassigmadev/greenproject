import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Leaf, AlertTriangle, Flag, ExternalLink, CheckCircle2, ChevronRight, Package, ShoppingCart } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { lookupBarcode } from "@/services/openfoodfacts";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import { AlertBox } from "@/components/AlertBox";
import { loadPriorities, saveScanToHistory, loadScanHistory, type UserPriorities } from "@/utils/userPreferences";
import { checkBoycott } from "@/data/boycottBrands";
import { checkAnimalWelfareFlag } from "@/utils/animalWelfareFlags";
import { AnimalWelfareFlagBadge } from "@/components/AnimalWelfareFlagBadge";
import { addToBasket, loadBasket } from "@/utils/basketStorage";
import { findLaborAllegations as findLaborAllegationsUtil, getLaborAllegationCount } from "@/utils/laborCheck";

const findLaborAllegations = (product: OpenFoodFactsResult) =>
  findLaborAllegationsUtil(product.brand, product.productName);

export default function OpenFoodFactsDetail() {
  const { barcode } = useParams<{ barcode: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromScan = searchParams.get('from') === 'scan';
  const [product, setProduct] = useState<OpenFoodFactsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priorities, setPriorities] = useState<UserPriorities>(loadPriorities());
  const [confirmDismissed, setConfirmDismissed] = useState(false);
  const [showCandidates, setShowCandidates] = useState(false);
  const [candidates, setCandidates] = useState<OpenFoodFactsResult[]>([]);
  const [inBasket, setInBasket] = useState(false);

  useEffect(() => {
    if (barcode) {
      loadProduct(barcode);
    }
  }, [barcode]);

  useEffect(() => {
    if (fromScan) {
      try {
        const stored = sessionStorage.getItem('scan_candidates');
        if (stored) {
          const parsed: OpenFoodFactsResult[] = JSON.parse(stored);
          // Only keep candidates that are different from the current product
          const others = parsed.filter(c => c.barcode !== barcode);
          setCandidates(others);
        }
      } catch {
        // ignore parse errors
      }
    }
  }, [fromScan, barcode]);

  // Listen for priority changes
  useEffect(() => {
    const handler = () => setPriorities(loadPriorities());
    window.addEventListener('prioritiesUpdated', handler);
    return () => window.removeEventListener('prioritiesUpdated', handler);
  }, []);

  // Sync basket state when product loads
  useEffect(() => {
    if (product) {
      setInBasket(loadBasket().some(b => b.barcode === product.barcode));
      const handler = () => setInBasket(loadBasket().some(b => b.barcode === product.barcode));
      window.addEventListener('basketUpdated', handler);
      return () => window.removeEventListener('basketUpdated', handler);
    }
  }, [product?.barcode]);

  // Save to scan history when product loads
  useEffect(() => {
    if (product) {
      const laborRecord = findLaborAllegations(product);
      const grade = product.ecoscoreGrade?.toLowerCase();
      const laborCount = laborRecord?.allegations.length || 0;
      // Compute a simple verdict emoji for history
      let emoji = "❓";
      if (laborCount >= 3) emoji = "🚫";
      else if (laborCount >= 2) emoji = "⚠️";
      else if (grade === "a" || grade === "b") emoji = laborCount > 0 ? "🤔" : "✅";
      else if (grade === "c") emoji = "🤔";
      else if (grade === "d") emoji = "⚠️";
      else if (grade === "e" || grade === "f") emoji = "🚫";

      const labelMap: Record<string, string> = { "✅": "BUY", "🤔": "CONSIDER", "⚠️": "CAUTION", "🚫": "AVOID", "❓": "UNKNOWN" };
      const colorMap: Record<string, string> = { "✅": "hsl(142 71% 45%)", "🤔": "hsl(45 93% 47%)", "⚠️": "hsl(0 84% 60%)", "🚫": "hsl(0 84% 50%)", "❓": "hsl(150 10% 45%)" };

      saveScanToHistory({
        id: `${product.barcode}-${Date.now()}`,
        barcode: product.barcode,
        productName: product.productName || "Unknown Product",
        brand: product.brand,
        imageUrl: product.imageUrl,
        timestamp: Date.now(),
        verdict: { emoji, label: labelMap[emoji] || "UNKNOWN", color: colorMap[emoji] || "hsl(150 10% 45%)" },
        scores: {
          ecoScore: product.ecoscoreScore,
          ecoGrade: product.ecoscoreGrade,
          nutriScore: product.nutriscoreGrade,
          laborAllegations: laborCount,
          novaGroup: product.novaGroup,
        },
        carbonFootprint100g: product.carbonFootprint100g,
        labels: product.labels,
      });
    }
  }, [product?.barcode]);

  const loadProduct = async (code: string) => {
    setLoading(true);
    try {
      const result = await lookupBarcode(code);
      if (result.found) {
        setProduct(result);
      } else {
        // Try to build a minimal product from scan history
        const cached = loadScanHistory().find(h => h.barcode === code);
        if (cached) {
          setProduct({
            found: true,
            barcode: cached.barcode,
            productName: cached.productName,
            brand: cached.brand,
            imageUrl: cached.imageUrl,
            ecoscoreGrade: cached.scores.ecoGrade,
            ecoscoreScore: cached.scores.ecoScore,
            nutriscoreGrade: cached.scores.nutriScore,
            nutriscoreScore: null,
            novaGroup: cached.scores.novaGroup,
            carbonFootprint100g: null,
            carbonFootprintProduct: null,
            carbonFootprintServing: null,
            labels: [],
            categories: [],
            origins: null,
            ingredientsText: null,
            ecoscoreData: null,
            rawProduct: null,
          });
        } else {
          setError("Product not found in OpenFoodFacts database");
        }
      }
    } catch (err) {
      // On network error, also try scan history cache
      const cached = loadScanHistory().find(h => h.barcode === code);
      if (cached) {
        setProduct({
          found: true,
          barcode: cached.barcode,
          productName: cached.productName,
          brand: cached.brand,
          imageUrl: cached.imageUrl,
          ecoscoreGrade: cached.scores.ecoGrade,
          ecoscoreScore: cached.scores.ecoScore,
          nutriscoreGrade: cached.scores.nutriScore,
          nutriscoreScore: null,
          novaGroup: cached.scores.novaGroup,
          carbonFootprint100g: null,
          carbonFootprintProduct: null,
          carbonFootprintServing: null,
          labels: [],
          categories: [],
          origins: null,
          ingredientsText: null,
          ecoscoreData: null,
          rawProduct: null,
        });
      } else {
        setError("Failed to load product details");
      }
    } finally {
      setLoading(false);
    }
  };

  const getVerdict = () => {
    if (!product) return null;

    const grade = product.ecoscoreGrade?.toLowerCase();
    const laborRecord = findLaborAllegations(product);
    const laborCount = laborRecord?.allegations.length || 0;

    // User priority weights (0-100 scale, normalized to multiplier)
    const envWeight = priorities.environment / 50;       // 1.0 = default, 2.0 = max priority
    const laborWeight = priorities.laborRights / 50;     // 1.0 = default, 2.0 = max priority

    // Step 1: Base verdict from eco-score grade or numeric score
    const score = product.ecoscoreScore;
    const hasEcoData = grade || (score !== null && score !== undefined);
    const scoreLabel = grade ? `Eco-Score: ${grade.toUpperCase()}` : (score !== null && score !== undefined ? `Eco-Score: ${score}/100` : "No eco-score data available");

    let verdict = { emoji: "❓", label: "UNKNOWN", color: "hsl(150 10% 45%)", action: "Review Details", reason: "No eco-score data available" };

    // When environment priority is high, be stricter with eco-scores
    if (grade === "a" || grade === "b") {
      verdict = { emoji: "✅", label: "BUY - Excellent Choice!", color: "hsl(142 71% 45%)", action: "Perfect", reason: scoreLabel };
    } else if (grade === "c") {
      // If environment priority is high (>1.4x), treat C as caution instead of moderate
      if (envWeight > 1.4) {
        verdict = { emoji: "⚠️", label: "CAUTION - Moderate Eco Impact", color: "hsl(0 84% 60%)", action: "Avoid if Possible", reason: `${scoreLabel} (your eco priority is high)` };
      } else {
        verdict = { emoji: "🤔", label: "CONSIDER - Moderate Impact", color: "hsl(45 93% 47%)", action: "Review", reason: scoreLabel };
      }
    } else if (grade === "d") {
      verdict = { emoji: "⚠️", label: "CAUTION - High Impact", color: "hsl(0 84% 60%)", action: "Avoid if Possible", reason: scoreLabel };
    } else if (grade === "e" || grade === "f") {
      verdict = { emoji: "🚫", label: "AVOID - Very High Impact", color: "hsl(0 84% 60%)", action: "Strong Caution", reason: scoreLabel };
    } else if (!grade && score !== null && score !== undefined) {
      // No letter grade but has numeric score — apply environment weight
      const adjustedThresholds = {
        good: 60 + (envWeight - 1) * 15,      // higher priority = harder to be "good"
        moderate: 40 + (envWeight - 1) * 10,
        caution: 20 + (envWeight - 1) * 5,
      };
      if (score >= adjustedThresholds.good) {
        verdict = { emoji: "✅", label: "BUY - Excellent Choice!", color: "hsl(142 71% 45%)", action: "Perfect", reason: scoreLabel };
      } else if (score >= adjustedThresholds.moderate) {
        verdict = { emoji: "🤔", label: "CONSIDER - Moderate Impact", color: "hsl(45 93% 47%)", action: "Review", reason: scoreLabel };
      } else if (score >= adjustedThresholds.caution) {
        verdict = { emoji: "⚠️", label: "CAUTION - High Impact", color: "hsl(0 84% 60%)", action: "Avoid if Possible", reason: scoreLabel };
      } else {
        verdict = { emoji: "🚫", label: "AVOID - Very High Impact", color: "hsl(0 84% 60%)", action: "Strong Caution", reason: scoreLabel };
      }
    }

    // Step 2: Downgrade verdict if labor allegations exist
    // Apply labor priority weight — higher priority = more aggressive downgrading
    if (laborCount > 0) {
      // Effective labor severity = allegation count amplified by user's labor priority
      const effectiveSeverity = laborCount * laborWeight;

      if (effectiveSeverity >= 2.5 || laborCount >= 3) {
        // Severe: 3+ allegations always, or 2 with high priority, or 1 with critical priority
        verdict = {
          emoji: "🚫",
          label: "AVOID - Severe Labor Concerns",
          color: "hsl(0 84% 50%)",
          action: "Strong Caution",
          reason: `${laborCount} labor/human rights allegations against ${laborRecord!.parentCompany}`,
        };
      } else if (effectiveSeverity >= 1.5) {
        // Moderate-high: at minimum CAUTION
        if (verdict.emoji === "✅" || verdict.emoji === "🤔" || verdict.emoji === "❓") {
          verdict = {
            emoji: "⚠️",
            label: "CAUTION - Labor Concerns",
            color: "hsl(0 84% 60%)",
            action: "Avoid if Possible",
            reason: `${laborCount} labor allegations against ${laborRecord!.parentCompany}`,
          };
        }
      } else if (effectiveSeverity >= 0.5) {
        // Low-moderate: at minimum CONSIDER
        if (verdict.emoji === "✅" || verdict.emoji === "❓") {
          verdict = {
            emoji: "🤔",
            label: "CONSIDER - Labor Concerns",
            color: "hsl(45 93% 47%)",
            action: "Review",
            reason: `${laborCount} labor allegation${laborCount > 1 ? 's' : ''} against ${laborRecord!.parentCompany}`,
          };
        }
      }
      // If labor weight is very low (< 0.5 effective), labor won't downgrade at all
    }

    // Step 3: Downgrade if brand is on BDS boycott list
    const boycott = checkBoycott(product.brand);
    if (boycott) {
      // At minimum CONSIDER if currently a BUY
      if (verdict.emoji === "✅") {
        verdict = {
          emoji: "🤔",
          label: "CONSIDER - Boycott Listed Brand",
          color: "hsl(45 93% 47%)",
          action: "Review",
          reason: `${boycott.parent} is on the BDS boycott list`,
        };
      }
    }

    // Step 4: Downgrade if company has poor animal welfare record
    const welfareFlag = checkAnimalWelfareFlag(product.brand);
    if (welfareFlag.isFlagged) {
      const company = welfareFlag.company!;
      if (welfareFlag.severity === 'critical') {
        // Critical: at minimum CAUTION
        if (verdict.emoji === "✅" || verdict.emoji === "🤔" || verdict.emoji === "❓") {
          verdict = {
            emoji: "⚠️",
            label: "CAUTION - Poor Animal Welfare",
            color: "hsl(0 84% 60%)",
            action: "Avoid if Possible",
            reason: `${company.companyName} has critical animal welfare concerns (BBFAW Tier ${company.bbfawTier})`,
          };
        }
      } else if (welfareFlag.severity === 'high') {
        // High: at minimum CONSIDER
        if (verdict.emoji === "✅" || verdict.emoji === "❓") {
          verdict = {
            emoji: "🤔",
            label: "CONSIDER - Animal Welfare Concerns",
            color: "hsl(45 93% 47%)",
            action: "Review",
            reason: `${company.companyName} has animal welfare concerns (BBFAW Tier ${company.bbfawTier})`,
          };
        }
      }
    }

    return verdict;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </main>
        <BottomNav />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <main className="flex-1 pb-nav">
          <div className="px-5 pt-8 max-w-xl mx-auto">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground mb-6 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <AlertBox type="error" title="Product Not Found" message={error || "Unable to load product details"} />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  const verdict = getVerdict();
  const agri = product.ecoscoreData?.agribalyse;
  const laborRecord = findLaborAllegations(product);
  const boycottMatch = checkBoycott(product.brand);

  // Eco score color helper
  const ecoColor = (grade?: string | null, score?: number | null): string => {
    if (grade) {
      const g = grade.toLowerCase();
      if (g === "a" || g === "b") return "hsl(152 48% 30%)";
      if (g === "c") return "hsl(38 88% 44%)";
      return "hsl(0 68% 50%)";
    }
    if (score !== null && score !== undefined) {
      if (score >= 60) return "hsl(152 48% 30%)";
      if (score >= 40) return "hsl(38 88% 44%)";
      return "hsl(0 68% 50%)";
    }
    return "hsl(150 10% 50%)";
  };

  const nutriColor = (grade?: string | null): string => {
    if (!grade) return "hsl(150 10% 50%)";
    const g = grade.toLowerCase();
    if (g === "a") return "hsl(152 48% 30%)";
    if (g === "b") return "hsl(142 55% 38%)";
    if (g === "c") return "hsl(38 88% 44%)";
    if (g === "d") return "hsl(25 88% 48%)";
    return "hsl(0 68% 50%)";
  };

  const novaLabels: Record<number, { label: string; color: string }> = {
    1: { label: "Unprocessed", color: "hsl(152 48% 30%)" },
    2: { label: "Minimally Processed", color: "hsl(142 55% 38%)" },
    3: { label: "Processed", color: "hsl(38 88% 44%)" },
    4: { label: "Ultra-Processed", color: "hsl(0 68% 50%)" },
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="flex-1 pb-nav">
        {/* Hero */}
        <div className="relative px-5 pt-14 pb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground mb-4 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="max-w-xl mx-auto text-center">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.productName || "Product"}
                className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 shadow-elevated border border-border/40"
              />
            )}
            <h1 className="text-xl font-display font-extrabold tracking-tight mb-1 leading-snug text-foreground">
              {product.productName || "Unknown Product"}
            </h1>
            {product.brand && (
              <p className="text-sm font-medium mb-3 text-muted-foreground">
                {product.brand}
              </p>
            )}
            <span className="inline-block font-mono text-[10px] px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
              {product.barcode}
            </span>
          </div>
        </div>

        <div className="px-5 pt-3 pb-6 max-w-xl mx-auto">
          <div className="max-w-xl mx-auto space-y-3">

            {/* Verdict card */}
            {verdict && (
              <div
                className="bg-card rounded-2xl border border-border/60 shadow-elevated overflow-hidden"
              >
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundColor: verdict.color }}
                />
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: `${verdict.color}18` }}
                    >
                      {verdict.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2
                        className="text-base font-display font-extrabold leading-tight mb-1"
                        style={{ color: verdict.color }}
                      >
                        {verdict.label}
                      </h2>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {verdict.reason}
                      </p>
                      {laborRecord && (product.ecoscoreGrade || product.ecoscoreScore !== null) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Eco-Score:{" "}
                          <span className="font-semibold">
                            {product.ecoscoreGrade
                              ? `${product.ecoscoreGrade.toUpperCase()} (${product.ecoscoreScore}/100)`
                              : `${product.ecoscoreScore}/100`}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => document.getElementById("details")?.scrollIntoView({ behavior: "smooth" })}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{ backgroundColor: verdict.color, color: "#ffffff" }}
                    >
                      {verdict.action} — See Full Breakdown
                    </button>
                    <button
                      onClick={() => {
                        if (inBasket) return;
                        addToBasket({
                          barcode: product.barcode,
                          productName: product.productName || "Unknown Product",
                          brand: product.brand,
                          imageUrl: product.imageUrl,
                          ecoscoreGrade: product.ecoscoreGrade,
                          ecoscoreScore: product.ecoscoreScore,
                          nutriscoreGrade: product.nutriscoreGrade,
                          laborAllegations: getLaborAllegationCount(product.brand, product.productName),
                          co2Per100g: product.carbonFootprint100g,
                        });
                        setInBasket(true);
                      }}
                      className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] flex-shrink-0"
                      style={{
                        backgroundColor: inBasket ? "hsl(152 42% 92%)" : "hsl(152 48% 30%)",
                        color: inBasket ? "hsl(152 48% 30%)" : "#ffffff",
                      }}
                      title={inBasket ? "In basket" : "Add to basket"}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {inBasket ? "Added" : ""}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* "Is this the right product?" confirmation */}
            {fromScan && !confirmDismissed && !showCandidates && (
              <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-4">
                <p className="text-sm font-bold text-foreground mb-0.5">Is this the right product?</p>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  We matched your scan automatically. Confirm or pick from alternatives.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDismissed(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ backgroundColor: "hsl(152 48% 30%)", color: "#ffffff" }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Yes, correct
                  </button>
                  {candidates.length > 0 && (
                    <button
                      onClick={() => setShowCandidates(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold border border-border/70 bg-muted/60 text-foreground transition-all hover:bg-muted active:scale-[0.98]"
                    >
                      No, show others
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Other matches picker */}
            {fromScan && showCandidates && (
              <div className="bg-card rounded-2xl border border-border/60 shadow-soft overflow-hidden">
                <div className="p-4 border-b border-border/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">Other Matches</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Select the correct product</p>
                    </div>
                    <button
                      onClick={() => setShowCandidates(false)}
                      className="text-xs font-semibold text-primary hover:opacity-70 transition-opacity"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-border/50">
                  {candidates.map((c) => {
                    const cGrade = c.ecoscoreGrade?.toLowerCase();
                    const cColor = cGrade === "a" || cGrade === "b"
                      ? "hsl(152 48% 30%)"
                      : cGrade === "c"
                      ? "hsl(38 88% 44%)"
                      : cGrade === "d" || cGrade === "e" || cGrade === "f"
                      ? "hsl(0 68% 50%)"
                      : "hsl(150 10% 55%)";
                    return (
                      <button
                        key={c.barcode}
                        onClick={() => {
                          sessionStorage.removeItem('scan_candidates');
                          navigate(`/product-off/${c.barcode}`);
                        }}
                        className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-muted/50 transition-all duration-100 active:bg-muted active:scale-[0.98] active:opacity-70"
                      >
                        {c.imageUrl ? (
                          <img
                            src={c.imageUrl}
                            alt={c.productName || ""}
                            className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground truncate leading-tight">
                            {c.productName || "Unknown Product"}
                          </p>
                          {c.brand && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{c.brand}</p>
                          )}
                        </div>
                        {c.ecoscoreGrade && (
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold text-white flex-shrink-0"
                            style={{ backgroundColor: cColor }}
                          >
                            {c.ecoscoreGrade.toUpperCase()}
                          </div>
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Labor Allegations */}
            {!laborRecord && (
              <div className="bg-card rounded-2xl border border-border/60 shadow-soft overflow-hidden">
                <div className="h-1 w-full" style={{ backgroundColor: "hsl(152 48% 40%)" }} />
                <div className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(152 48% 36%)" }} />
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: "hsl(152 48% 28%)" }}>No Labor Concerns Found</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">No labor or human rights allegations found for this brand in our database.</p>
                  </div>
                </div>
              </div>
            )}
            {laborRecord && (
              <div className="bg-card rounded-2xl border border-border/60 shadow-soft overflow-hidden">
                <div className="h-1 w-full" style={{ backgroundColor: "hsl(0 68% 50%)" }} />
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(0 68% 50%)" }} />
                    <h3 className="text-sm font-bold" style={{ color: "hsl(0 68% 40%)" }}>
                      Labor & Human Rights Concerns
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Parent company:{" "}
                    <span className="font-semibold text-foreground">{laborRecord.parentCompany}</span>
                  </p>

                  <div className="space-y-2.5">
                    {laborRecord.allegations.map((allegation, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl p-3.5"
                        style={{
                          backgroundColor: "hsl(0 50% 97%)",
                          borderLeft: "3px solid hsl(0 68% 58%)",
                        }}
                      >
                        <h4
                          className="text-xs font-bold mb-1.5"
                          style={{ color: "hsl(0 68% 35%)" }}
                        >
                          {allegation.issue}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-2.5">
                          {allegation.details}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <a
                            href={allegation.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-semibold hover:opacity-80 transition-opacity"
                            style={{ color: "hsl(152 45% 35%)" }}
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            {allegation.source}
                          </a>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: "hsl(0 40% 92%)", color: "hsl(0 68% 40%)" }}
                          >
                            {allegation.year}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-muted-foreground/70 mt-3 italic leading-relaxed">
                    Allegations are based on publicly available reports. Companies may have taken steps to address these issues since publication.
                  </p>
                </div>
              </div>
            )}

            {/* Animal Welfare Badge */}
            <div className="[&>*]:rounded-2xl [&>*]:border [&>*]:border-border/60 [&>*]:shadow-soft">
              <AnimalWelfareFlagBadge brand={product.brand} showDetails={true} />
            </div>

            {/* Boycott / BDS Note */}
            {boycottMatch && (
              <div className="bg-card rounded-2xl border border-border/60 shadow-soft overflow-hidden">
                <div className="h-1 w-full" style={{ backgroundColor: "hsl(0 68% 55%)" }} />
                <div className="p-4 flex items-start gap-3">
                  <Flag className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "hsl(0 68% 50%)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold mb-1" style={{ color: "hsl(0 68% 38%)" }}>
                      {boycottMatch.parent} — Boycott Listed
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                      {boycottMatch.reason}
                    </p>
                    <a
                      href="https://boycott-israel.org/boycott.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-semibold hover:opacity-80 transition-opacity"
                      style={{ color: "hsl(0 60% 45%)" }}
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      BDS Boycott List
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Environmental Impact */}
            <div id="details" className="bg-card rounded-2xl border border-border/60 shadow-soft p-4">
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Environmental Impact</h3>
              </div>

              {/* Eco score + nutri score + nova row */}
              <div className="flex flex-wrap gap-2 mb-4">
                {product.ecoscoreGrade && (
                  <div className="flex-1 min-w-[6rem] rounded-xl p-3 text-center" style={{ backgroundColor: `${ecoColor(product.ecoscoreGrade, product.ecoscoreScore)}14` }}>
                    <div className="text-[10px] font-semibold text-muted-foreground mb-1">Eco-Score</div>
                    <div
                      className="text-2xl font-display font-extrabold"
                      style={{ color: ecoColor(product.ecoscoreGrade, product.ecoscoreScore) }}
                    >
                      {product.ecoscoreGrade.toUpperCase()}
                    </div>
                    {product.ecoscoreScore !== null && product.ecoscoreScore !== undefined && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">{product.ecoscoreScore}/100</div>
                    )}
                  </div>
                )}
                {product.nutriscoreGrade && (
                  <div className="flex-1 min-w-[6rem] rounded-xl p-3 text-center" style={{ backgroundColor: `${nutriColor(product.nutriscoreGrade)}14` }}>
                    <div className="text-[10px] font-semibold text-muted-foreground mb-1">Nutri-Score</div>
                    <div
                      className="text-2xl font-display font-extrabold"
                      style={{ color: nutriColor(product.nutriscoreGrade) }}
                    >
                      {product.nutriscoreGrade.toUpperCase()}
                    </div>
                  </div>
                )}
                {product.novaGroup && novaLabels[product.novaGroup] && (
                  <div className="flex-1 min-w-[6rem] rounded-xl p-3 text-center" style={{ backgroundColor: `${novaLabels[product.novaGroup].color}14` }}>
                    <div className="text-[10px] font-semibold text-muted-foreground mb-1">Processing</div>
                    <div
                      className="text-sm font-bold leading-tight"
                      style={{ color: novaLabels[product.novaGroup].color }}
                    >
                      {novaLabels[product.novaGroup].label}
                    </div>
                  </div>
                )}
              </div>

              {/* Carbon footprint */}
              {agri?.co2_total !== undefined && (
                <div className="rounded-xl p-3.5 mb-3" style={{ backgroundColor: "hsl(152 42% 96%)" }}>
                  <div className="text-[10px] font-semibold text-muted-foreground mb-1">Carbon Footprint</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-display font-extrabold" style={{ color: "hsl(152 48% 28%)" }}>
                      {agri.co2_total.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">kg CO₂eq / kg product</span>
                  </div>
                </div>
              )}

              {/* Lifecycle bars */}
              {agri && (agri.co2_agriculture !== undefined || agri.co2_processing !== undefined || agri.co2_packaging !== undefined || agri.co2_transportation !== undefined || agri.co2_distribution !== undefined) && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">
                    Lifecycle Breakdown
                  </p>
                  <div className="space-y-2">
                    {[
                      { label: "Agriculture", value: agri.co2_agriculture },
                      { label: "Processing", value: agri.co2_processing },
                      { label: "Packaging", value: agri.co2_packaging },
                      { label: "Transport", value: agri.co2_transportation },
                      { label: "Distribution", value: agri.co2_distribution },
                      { label: "Consumption", value: agri.co2_consumption },
                    ]
                      .filter((item) => typeof item.value === "number")
                      .map((item) => {
                        const pct = agri.co2_total && agri.co2_total > 0
                          ? Math.max((item.value! / agri.co2_total) * 100, 1)
                          : 0;
                        return (
                          <div key={item.label} className="flex items-center gap-2.5">
                            <span className="text-[10px] font-medium text-muted-foreground w-20 shrink-0">
                              {item.label}
                            </span>
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, backgroundColor: "hsl(152 48% 32%)" }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-foreground w-7 text-right shrink-0">
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Certifications */}
            {product.labels.length > 0 && (
              <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Certifications & Labels
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {product.labels.map((label) => (
                    <span
                      key={label}
                      className="px-2.5 py-1 rounded-full text-[10px] font-semibold border"
                      style={{
                        backgroundColor: "hsl(152 42% 96%)",
                        color: "hsl(152 48% 28%)",
                        borderColor: "hsl(152 42% 88%)",
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="h-2" />
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
