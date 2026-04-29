import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
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
  Leaf,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { searchProducts as searchOffProducts } from "@/services/openfoodfacts";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import { getLaborAllegationCount } from "@/utils/laborCheck";
import {
  loadBasket,
  addToBasket,
  removeFromBasket,
  clearBasket,
  getBasketEthicsReport,
  type BasketItem,
} from "@/utils/basketStorage";

// ── helpers ────────────────────────────────────────────────────────────────

const NUTRI_COLOR: Record<string, string> = {
  a: '#00C853', b: '#2979FF', c: '#F59E0B', d: '#F97316', e: '#EF4444',
};

const ECO_COLOR: Record<string, string> = {
  a: '#00C853', b: '#2979FF', c: '#F59E0B', d: '#F97316', e: '#EF4444',
};

function addResultToBasket(result: OpenFoodFactsResult) {
  addToBasket({
    barcode: result.barcode,
    productName: result.productName || "Unknown Product",
    brand: result.brand,
    imageUrl: result.imageUrl,
    ecoscoreGrade: result.ecoscoreGrade,
    ecoscoreScore: result.ecoscoreScore,
    nutriscoreGrade: result.nutriscoreGrade,
    laborAllegations: getLaborAllegationCount(result.brand, result.productName),
    co2Per100g: result.carbonFootprint100g,
  });
}

// ── design tokens ──────────────────────────────────────────────────────────

const BLUE = "#2979FF";
const BG = "#F5F7FA";
const CARD = "#FFFFFF";
const BORDER = "#E5E7EB";
const TEXT = "#111827";
const TEXT_MUTED = "#6B7280";
const RED = "#EF4444";
const GREEN = "#00C853";
const AMBER = "#F59E0B";

export default function ShoppingList() {
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OpenFoodFactsResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setBasket(loadBasket());
    const handler = () => setBasket(loadBasket());
    window.addEventListener("basketUpdated", handler);
    return () => window.removeEventListener("basketUpdated", handler);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.trim().length < 2) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try { setSearchResults(await searchOffProducts(query.trim(), 5)); }
      catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 500);
  }, [query]);

  const handleAdd = (result: OpenFoodFactsResult) => {
    addResultToBasket(result);
    setBasket(loadBasket());
  };

  const handleRemove = (barcode: string) => {
    removeFromBasket(barcode);
    setBasket(loadBasket());
  };

  const handleClear = () => {
    clearBasket();
    setBasket([]);
    setShowClearConfirm(false);
  };

  const report = getBasketEthicsReport(basket);
  const inBasket = (barcode: string) => basket.some(b => b.barcode === barcode);

  return (
    <div style={{ background: BG, minHeight: "100vh" }}>
      <main style={{ paddingBottom: "5.5rem" }}>

        {/* ── Header ── */}
        <div style={{
          background: CARD,
          borderBottom: `1px solid ${BORDER}`,
          padding: "max(52px, env(safe-area-inset-top)) 20px 16px",
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        }}>
          <div>
            <p style={{ fontSize: "0.7rem", fontWeight: 600, color: TEXT_MUTED, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
              Shopping
            </p>
            <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: TEXT, letterSpacing: "-0.025em", lineHeight: 1 }}>
              My Basket
              {basket.length > 0 && (
                <span style={{ marginLeft: 10, fontSize: "1rem", fontWeight: 700, color: BLUE }}>
                  {basket.length}
                </span>
              )}
            </h1>
          </div>
          {basket.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 10,
                border: `1px solid ${BORDER}`,
                background: CARD, color: TEXT_MUTED, cursor: "pointer",
                fontSize: "0.8rem", fontWeight: 600,
              }}
            >
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* ── Clear confirm ── */}
          {showClearConfirm && (
            <div style={{
              background: "#FFF5F5", border: `1px solid #FECACA`,
              borderRadius: 16, padding: "16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <AlertTriangle size={16} style={{ color: RED, flexShrink: 0 }} />
                <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#7F1D1D" }}>Clear entire basket?</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleClear} style={{ flex: 1, height: 40, borderRadius: 10, border: "none", background: RED, color: "#fff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
                  Yes, clear
                </button>
                <button onClick={() => setShowClearConfirm(false)} style={{ flex: 1, height: 40, borderRadius: 10, border: `1px solid ${BORDER}`, background: CARD, color: TEXT_MUTED, fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── Stats row ── */}
          {basket.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>

              {/* Labour card */}
              <div style={{
                background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`,
                borderLeft: `4px solid ${report.laborFlagCount > 0 ? RED : GREEN}`,
                padding: "14px 14px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: report.laborFlagCount > 0 ? "#FEF2F2" : "#F0FAF1",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Users size={14} style={{ color: report.laborFlagCount > 0 ? RED : GREEN }} />
                  </div>
                  <span style={{ fontSize: "0.68rem", fontWeight: 600, color: TEXT_MUTED }}>Labour</span>
                </div>
                <p style={{ fontSize: "1.6rem", fontWeight: 900, color: report.laborFlagCount > 0 ? RED : GREEN, lineHeight: 1, marginBottom: 2 }}>
                  {report.laborFlagCount > 0 ? report.laborFlagCount : report.cleanBrandCount}
                </p>
                <p style={{ fontSize: "0.68rem", color: report.laborFlagCount > 0 ? RED : GREEN, fontWeight: 600 }}>
                  {report.laborFlagCount > 0 ? `flagged brand${report.laborFlagCount !== 1 ? "s" : ""}` : "clean brands"}
                </p>
                {report.flaggedItems.length > 0 && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${BORDER}` }}>
                    {report.flaggedItems.slice(0, 2).map(item => (
                      <p key={item.barcode} style={{ fontSize: "0.65rem", color: TEXT_MUTED, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        · {item.brand || item.productName}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* CO2 card */}
              {report.co2ScoredCount > 0 ? (
                <div style={{
                  background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`,
                  borderLeft: `4px solid ${report.co2NetKg >= 0 ? GREEN : AMBER}`,
                  padding: "14px 14px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: report.co2NetKg >= 0 ? "#F0FAF1" : "#FFFBEB",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {report.co2NetKg >= 0
                        ? <TrendingDown size={14} style={{ color: GREEN }} />
                        : <TrendingUp size={14} style={{ color: AMBER }} />}
                    </div>
                    <span style={{ fontSize: "0.68rem", fontWeight: 600, color: TEXT_MUTED }}>CO₂</span>
                  </div>
                  <p style={{ fontSize: "1.6rem", fontWeight: 900, color: report.co2NetKg >= 0 ? GREEN : AMBER, lineHeight: 1, marginBottom: 2 }}>
                    {report.co2NetKg >= 0 ? "-" : "+"}{Math.abs(report.co2NetKg)}
                    <span style={{ fontSize: "0.8rem", fontWeight: 700 }}> kg</span>
                  </p>
                  <p style={{ fontSize: "0.68rem", color: report.co2NetKg >= 0 ? GREEN : AMBER, fontWeight: 600 }}>
                    {report.co2NetKg >= 0 ? "saved vs avg" : "above avg basket"}
                  </p>
                </div>
              ) : (
                <div style={{
                  background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`,
                  padding: "14px 14px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
                  gap: 6, color: TEXT_MUTED,
                }}>
                  <Leaf size={22} style={{ color: "#D1D5DB" }} />
                  <p style={{ fontSize: "0.7rem", textAlign: "center", lineHeight: 1.4 }}>No eco data yet</p>
                </div>
              )}
            </div>
          )}

          {/* ── Weakest Link ── */}
          {report.weakestItem && ["d", "e"].includes(report.weakestItem.ecoscoreGrade?.toLowerCase() ?? "") && (
            <Link to={`/product-off/${report.weakestItem.barcode}`} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 16px",
              background: "#FFFBEB", border: `1px solid #FDE68A`, borderRadius: 16,
              textDecoration: "none",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AlertCircle size={18} style={{ color: AMBER }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "#92400E", marginBottom: 2 }}>Weakest link</p>
                <p style={{ fontSize: "0.85rem", fontWeight: 700, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {report.weakestItem.productName}
                </p>
                <p style={{ fontSize: "0.7rem", color: TEXT_MUTED, marginTop: 1 }}>
                  Eco-{report.weakestItem.ecoscoreGrade?.toUpperCase()} · consider swapping
                </p>
              </div>
              <ChevronRight size={16} style={{ color: AMBER, flexShrink: 0 }} />
            </Link>
          )}

          {/* ── Search / Add ── */}
          <div style={{ background: CARD, borderRadius: 18, border: `1px solid ${BORDER}`, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ padding: "14px 16px 0" }}>
              <p style={{ fontSize: "0.72rem", fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                Add product
              </p>
              <div style={{ position: "relative", display: "flex", alignItems: "center", marginBottom: 12 }}>
                <Search size={15} style={{ position: "absolute", left: 12, color: "#9CA3AF", pointerEvents: "none" }} />
                {searching
                  ? <Loader2 size={14} style={{ position: "absolute", right: 12, color: BLUE, animation: "spin 1s linear infinite" }} />
                  : query
                  ? <button onClick={() => { setQuery(""); setSearchResults([]); }} style={{ position: "absolute", right: 10, background: "none", border: "none", color: TEXT_MUTED, cursor: "pointer", padding: 0 }}><X size={14} /></button>
                  : null
                }
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search products to add…"
                  style={{
                    width: "100%", height: 44,
                    background: BG,
                    border: `1px solid ${BORDER}`, borderRadius: 12,
                    color: TEXT, fontSize: "0.875rem",
                    paddingLeft: 36, paddingRight: 36, outline: "none",
                  }}
                />
              </div>
            </div>

            {searchResults.length > 0 && (
              <div style={{ borderTop: `1px solid ${BORDER}` }}>
                {searchResults.map((result, i) => {
                  const grade = result.ecoscoreGrade?.toLowerCase();
                  const already = inBasket(result.barcode);
                  return (
                    <div key={result.barcode} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "12px 16px",
                      borderBottom: i < searchResults.length - 1 ? `1px solid ${BORDER}` : "none",
                    }}>
                      {result.imageUrl
                        ? <img src={result.imageUrl} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 10, flexShrink: 0, border: `1px solid ${BORDER}` }} />
                        : <div style={{ width: 40, height: 40, background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><ShoppingBag size={16} style={{ color: "#D1D5DB" }} /></div>
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "0.85rem", fontWeight: 700, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>
                          {result.productName || "Unknown"}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {result.brand && <span style={{ fontSize: "0.7rem", color: TEXT_MUTED }}>{result.brand}</span>}
                          {grade && (
                            <span style={{
                              fontSize: "0.62rem", fontWeight: 700,
                              color: ECO_COLOR[grade] || TEXT_MUTED,
                              background: `${ECO_COLOR[grade] || TEXT_MUTED}18`,
                              borderRadius: 6, padding: "1px 6px",
                            }}>
                              Eco-{grade.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => !already && handleAdd(result)}
                        disabled={already}
                        style={{
                          width: 34, height: 34, borderRadius: 10,
                          border: "none",
                          background: already ? "#F0FAF1" : BLUE,
                          color: already ? GREEN : "#fff",
                          cursor: already ? "default" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}
                      >
                        {already ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {searchResults.length === 0 && query.trim().length >= 2 && !searching && (
              <div style={{ padding: "14px 16px", borderTop: `1px solid ${BORDER}` }}>
                <p style={{ fontSize: "0.8rem", color: TEXT_MUTED }}>No results found for "{query}"</p>
              </div>
            )}
          </div>

          {/* ── Basket Items ── */}
          {basket.length === 0 ? (
            <div style={{
              background: CARD, borderRadius: 18, border: `1px solid ${BORDER}`,
              padding: "36px 20px", textAlign: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: "#EBF2FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <ShoppingCart size={26} style={{ color: BLUE }} />
              </div>
              <p style={{ fontSize: "1rem", fontWeight: 800, color: TEXT, marginBottom: 6 }}>Your basket is empty</p>
              <p style={{ fontSize: "0.82rem", color: TEXT_MUTED, marginBottom: 22, lineHeight: 1.5 }}>
                Search above or scan a product to get started
              </p>
              <Link to="/scan" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 24px", borderRadius: 14,
                background: BLUE, color: "#fff",
                textDecoration: "none", fontWeight: 700, fontSize: "0.875rem",
              }}>
                <ShoppingBag size={15} /> Start Scanning
              </Link>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: "0.72rem", fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                {basket.length} item{basket.length !== 1 ? "s" : ""} in basket
              </p>
              <div style={{ background: CARD, borderRadius: 18, border: `1px solid ${BORDER}`, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                {basket.map((item, i) => {
                  const ecoGrade = item.ecoscoreGrade?.toLowerCase();
                  const nutriGrade = item.nutriscoreGrade?.toLowerCase();
                  const isFlagged = item.laborAllegations > 0;
                  const isWeakest = report.weakestItem?.barcode === item.barcode;

                  return (
                    <div key={item.id} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 14px",
                      borderBottom: i < basket.length - 1 ? `1px solid ${BORDER}` : "none",
                      borderLeft: `4px solid ${isFlagged ? RED : isWeakest ? AMBER : "transparent"}`,
                    }}>
                      <Link to={`/product-off/${item.barcode}`} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0, textDecoration: "none" }}>
                        {item.imageUrl
                          ? <img src={item.imageUrl} alt="" style={{ width: 46, height: 46, objectFit: "cover", borderRadius: 12, flexShrink: 0, border: `1px solid ${BORDER}` }} />
                          : <div style={{ width: 46, height: 46, background: BG, border: `1px solid ${BORDER}`, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><ShoppingBag size={18} style={{ color: "#D1D5DB" }} /></div>
                        }
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "0.875rem", fontWeight: 700, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>
                            {item.productName}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                            {item.brand && <span style={{ fontSize: "0.7rem", color: TEXT_MUTED }}>{item.brand}</span>}
                            {ecoGrade
                              ? <span style={{ fontSize: "0.62rem", fontWeight: 700, color: ECO_COLOR[ecoGrade] || TEXT_MUTED, background: `${ECO_COLOR[ecoGrade] || TEXT_MUTED}18`, borderRadius: 6, padding: "1px 6px" }}>Eco-{ecoGrade.toUpperCase()}</span>
                              : null
                            }
                            {nutriGrade && <span style={{ fontSize: "0.62rem", fontWeight: 700, color: NUTRI_COLOR[nutriGrade] || TEXT_MUTED, background: `${NUTRI_COLOR[nutriGrade] || TEXT_MUTED}18`, borderRadius: 6, padding: "1px 6px" }}>Nutri-{nutriGrade.toUpperCase()}</span>}
                            {isFlagged && (
                              <span style={{ fontSize: "0.62rem", fontWeight: 700, color: RED, background: "#FEF2F2", borderRadius: 6, padding: "1px 6px", display: "inline-flex", alignItems: "center", gap: 3 }}>
                                <Users size={9} /> Labour flag
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                      <button
                        onClick={() => handleRemove(item.barcode)}
                        style={{
                          width: 32, height: 32, borderRadius: 9,
                          border: `1px solid ${BORDER}`, background: BG,
                          color: TEXT_MUTED, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </main>

      <BottomNav />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
