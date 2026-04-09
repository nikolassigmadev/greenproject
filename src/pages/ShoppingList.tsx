import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import {
  ShoppingCart,
  Search,
  X,
  Trash2,
  AlertTriangle,
  Loader2,
  Plus,
  ShoppingBag,
  AlertCircle,
  Users,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { searchProducts as searchOffProducts } from "@/services/openfoodfacts";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import { getBrandFlag } from "@/data/brandFlags";
import {
  loadBasket,
  addToBasket,
  removeFromBasket,
  clearBasket,
  getBasketEthicsReport,
  type BasketItem,
} from "@/utils/basketStorage";

// ── helpers ────────────────────────────────────────────────────────────────

const GRADE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  a: { bg: "bg-emerald-500", text: "text-white", border: "border-emerald-400" },
  b: { bg: "bg-lime-500",    text: "text-white", border: "border-lime-400" },
  c: { bg: "bg-amber-500",   text: "text-white", border: "border-amber-400" },
  d: { bg: "bg-orange-500",  text: "text-white", border: "border-orange-400" },
  e: { bg: "bg-red-500",     text: "text-white", border: "border-red-400" },
};

const GRADE_LABEL: Record<string, string> = {
  a: "Excellent", b: "Good", c: "Fair", d: "Poor", e: "Avoid",
};

const SCORE_COLOR = (score: number) =>
  score >= 70 ? "hsl(152 48% 30%)"
  : score >= 45 ? "hsl(38 88% 44%)"
  : "hsl(0 68% 50%)";

// Arc progress ring (SVG)
function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const R = 44;
  const C = 2 * Math.PI * R;
  const dash = (score / 100) * C;
  const color = SCORE_COLOR(score);

  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
      <circle
        cx="55" cy="55" r={R}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${C}`}
        strokeDashoffset={C / 4}
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text x="55" y="50" textAnchor="middle" dominantBaseline="middle"
        fontSize="22" fontWeight="800" fill={color} fontFamily="Rubik, sans-serif">
        {score}
      </text>
      <text x="55" y="68" textAnchor="middle" dominantBaseline="middle"
        fontSize="11" fontWeight="700" fill={color} fontFamily="Rubik, sans-serif">
        {grade !== 'unknown' ? `Grade ${grade.toUpperCase()}` : 'No data'}
      </text>
    </svg>
  );
}

function addResultToBasket(result: OpenFoodFactsResult) {
  const flag = getBrandFlag(result.brand);
  addToBasket({
    barcode: result.barcode,
    productName: result.productName || "Unknown Product",
    brand: result.brand,
    imageUrl: result.imageUrl,
    ecoscoreGrade: result.ecoscoreGrade,
    ecoscoreScore: result.ecoscoreScore,
    nutriscoreGrade: result.nutriscoreGrade,
    laborAllegations: flag ? 1 : 0,
  });
}

// ── component ──────────────────────────────────────────────────────────────

export default function ShoppingList() {
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OpenFoodFactsResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [addedBarcodes, setAddedBarcodes] = useState<Set<string>>(new Set());
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setBasket(loadBasket());
    const handler = () => setBasket(loadBasket());
    window.addEventListener("basketUpdated", handler);
    return () => window.removeEventListener("basketUpdated", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchOffProducts(query.trim(), 5);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  }, [query]);

  const handleAdd = (result: OpenFoodFactsResult) => {
    addResultToBasket(result);
    setAddedBarcodes(prev => new Set([...prev, result.barcode]));
    setBasket(loadBasket());
  };

  const handleRemove = (barcode: string) => {
    removeFromBasket(barcode);
    setBasket(loadBasket());
  };

  const handleClear = () => {
    clearBasket();
    setBasket([]);
    setAddedBarcodes(new Set());
    setShowClearConfirm(false);
  };

  const report = getBasketEthicsReport(basket);
  const inBasket = (barcode: string) => basket.some(b => b.barcode === barcode);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pb-nav">
        {/* Hero */}
        <div
          className="px-5 pt-10 pb-12 text-center relative"
          style={{ background: "var(--gradient-hero)" }}
        >
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-display font-extrabold tracking-tight mb-1.5 text-white">
              Basket Ethics Check
            </h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.72)" }}>
              Build your shopping list and get an overall ethics score before you shop
            </p>
          </div>
          {basket.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium hover:opacity-90 transition-all"
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                borderColor: "rgba(255,255,255,0.25)",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        <div className="px-5 -mt-5 relative z-10">
          <div className="max-w-2xl mx-auto space-y-4">

            {/* Clear confirm */}
            {showClearConfirm && (
              <div className="bg-destructive/8 border border-destructive/25 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap animate-fade-in">
                <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  Clear the entire basket?
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleClear}
                    className="px-4 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold"
                  >
                    Yes, Clear
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-4 py-1.5 rounded-lg border border-border bg-card text-muted-foreground text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── Ethics Summary Card ── */}
            {basket.length > 0 && report.scoredCount > 0 && (
              <div className="bg-card rounded-2xl border border-border/60 shadow-soft overflow-hidden">
                {/* Score bar at top */}
                <div
                  className="h-1.5 w-full"
                  style={{ background: SCORE_COLOR(report.overallScore) }}
                />
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    <ScoreRing score={report.overallScore} grade={report.overallGrade} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground mb-1">
                        Basket Ethics Score
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        {report.scoredCount} of {report.itemCount} item{report.itemCount !== 1 ? "s" : ""} scored
                      </p>
                      {/* Breakdown pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {report.goodCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            {report.goodCount} good
                          </span>
                        )}
                        {report.fairCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
                            {report.fairCount} fair
                          </span>
                        )}
                        {report.poorCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300">
                            <AlertCircle className="w-3 h-3" />
                            {report.poorCount} poor
                          </span>
                        )}
                        {report.unknownCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {report.unknownCount} unknown
                          </span>
                        )}
                        {report.laborFlagCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300">
                            <Users className="w-3 h-3" />
                            {report.laborFlagCount} labor flag{report.laborFlagCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Weakest Link Banner ── */}
            {report.weakestItem && ['d','e'].includes(report.weakestItem.ecoscoreGrade?.toLowerCase() ?? '') && (
              <Link
                to={`/product-off/${report.weakestItem.barcode}`}
                className="flex items-center gap-3 p-3.5 rounded-2xl border-2 border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30 hover:shadow-soft transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-orange-800 dark:text-orange-200 uppercase tracking-wide mb-0.5">
                    Weakest link
                  </p>
                  <p className="text-sm font-semibold text-orange-900 dark:text-orange-100 truncate">
                    {report.weakestItem.productName}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    Eco grade {report.weakestItem.ecoscoreGrade?.toUpperCase()} · consider swapping this one
                  </p>
                </div>
                {report.weakestItem.imageUrl && (
                  <img
                    src={report.weakestItem.imageUrl}
                    alt=""
                    className="w-11 h-11 rounded-lg object-cover flex-shrink-0 opacity-80"
                  />
                )}
                <ChevronRight className="w-4 h-4 text-orange-400 flex-shrink-0" />
              </Link>
            )}

            {/* ── Search to Add ── */}
            <div className="bg-card rounded-2xl border border-border/60 shadow-soft overflow-hidden">
              <div className="p-3 border-b border-border/60">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search products to add…"
                    className="w-full pl-9 pr-9 py-2.5 text-sm bg-muted/40 rounded-xl border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 placeholder:text-muted-foreground/50"
                  />
                  {query && (
                    <button
                      onClick={() => { setQuery(""); setSearchResults([]); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Search results */}
              {(searching || searchResults.length > 0) && (
                <div className="divide-y divide-border/40">
                  {searching && (
                    <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Searching…
                    </div>
                  )}
                  {!searching && searchResults.map(result => {
                    const grade = result.ecoscoreGrade?.toLowerCase();
                    const gradeStyle = grade ? GRADE_STYLE[grade] : null;
                    const already = inBasket(result.barcode);

                    return (
                      <div
                        key={result.barcode}
                        className="flex items-center gap-3 px-4 py-2.5"
                      >
                        {result.imageUrl ? (
                          <img
                            src={result.imageUrl}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-border/40"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-lg">
                            📦
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {result.productName || "Unknown"}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {result.brand && (
                              <span className="text-xs text-muted-foreground truncate">
                                {result.brand}
                              </span>
                            )}
                            {gradeStyle && (
                              <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-md", gradeStyle.bg, gradeStyle.text)}>
                                Eco {grade!.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => !already && handleAdd(result)}
                          disabled={already}
                          className={cn(
                            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all",
                            already
                              ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 cursor-default"
                              : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
                          )}
                        >
                          {already
                            ? <CheckCircle2 className="w-4 h-4" />
                            : <Plus className="w-4 h-4" />
                          }
                        </button>
                      </div>
                    );
                  })}
                  {!searching && searchResults.length === 0 && query.trim().length >= 2 && (
                    <p className="px-4 py-3 text-sm text-muted-foreground">No products found.</p>
                  )}
                </div>
              )}
            </div>

            {/* ── Basket Items ── */}
            {basket.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border/60 shadow-soft p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-lg font-display font-bold text-foreground mb-2">
                  Your basket is empty
                </h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                  Search for products above, or{" "}
                  <Link to="/scan" className="text-primary font-semibold hover:underline">
                    scan them
                  </Link>{" "}
                  and add directly from the product page.
                </p>
                <div className="flex justify-center gap-3">
                  <Link
                    to="/scan"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-soft hover:bg-primary/90 transition-all"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Start Scanning
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">
                  {basket.length} item{basket.length !== 1 ? "s" : ""} in basket
                </p>
                <div className="space-y-2">
                  {basket.map(item => {
                    const grade = item.ecoscoreGrade?.toLowerCase();
                    const gradeStyle = grade ? GRADE_STYLE[grade] : null;
                    const isWeakest = report.weakestItem?.barcode === item.barcode;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border bg-card transition-all",
                          isWeakest
                            ? "border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/10"
                            : "border-border/60"
                        )}
                      >
                        <Link to={`/product-off/${item.barcode}`} className="flex items-center gap-3 flex-1 min-w-0">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-xl">
                              📦
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isWeakest && (
                                <AlertCircle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                              )}
                              <span className="text-sm font-semibold text-foreground truncate">
                                {item.productName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {item.brand && (
                                <span className="text-xs text-muted-foreground">{item.brand}</span>
                              )}
                              {gradeStyle ? (
                                <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-md", gradeStyle.bg, gradeStyle.text)}>
                                  Eco {grade!.toUpperCase()} · {GRADE_LABEL[grade!]}
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                                  No eco data
                                </span>
                              )}
                              {item.nutriscoreGrade && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500 text-white">
                                  Nutri {item.nutriscoreGrade.toUpperCase()}
                                </span>
                              )}
                              {item.laborAllegations > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300">
                                  <Users className="w-2.5 h-2.5" />
                                  Labor flag
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                        <button
                          onClick={() => handleRemove(item.barcode)}
                          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
