import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart, Search, X, Trash2, AlertTriangle, Loader2, Plus,
  ShoppingBag, Users, ChevronRight, CheckCircle2, TrendingDown, Sparkles,
} from "lucide-react";
import { searchProducts as searchOffProducts } from "@/services/openfoodfacts";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import { getLaborAllegationCount } from "@/utils/laborCheck";
import {
  loadBasket, addToBasket, removeFromBasket, clearBasket,
  getBasketEthicsReport, type BasketItem,
} from "@/utils/basketStorage";
import {
  loadSmartList, addSmartListItem, removeSmartListItem,
  SMART_LIST_EVENT, type SmartListItem,
} from "@/utils/smartListStorage";
import {
  getCategoryRecommendations, detectCategoryFromText, type SwapSuggestion,
} from "@/services/swaps";
import { CERTIFICATION_BADGES } from "@/utils/verifiedEthics";
import { loadRegion } from "@/utils/userRegion";
import { loadPriorities } from "@/utils/userPreferences";
import { DS } from "@/styles/design-tokens";

// ── helpers ────────────────────────────────────────────────────────────────

/** Map an A–E grade to the site's themed tone tokens. */
function gradeTone(grade: string | null | undefined): { color: string; bg: string } {
  const g = grade?.toLowerCase();
  if (g === "a-plus" || g === "a" || g === "b") return { color: DS.good, bg: DS.goodBg };
  if (g === "c") return { color: DS.warn, bg: DS.warnBg };
  if (g === "d" || g === "e") return { color: DS.bad, bg: DS.badBg };
  return { color: DS.muted, bg: DS.bg };
}

const SHADOW = "0 2px 6px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.04)";

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

// ── small pieces ─────────────────────────────────────────────────────────────

function GradePill({ grade, label }: { grade: string; label: string }) {
  const tone = gradeTone(grade);
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, color: tone.color, background: tone.bg,
      borderRadius: 6, padding: "2px 7px", whiteSpace: "nowrap",
    }}>
      {label}-{grade.toLowerCase() === "a-plus" ? "A+" : grade.toUpperCase()}
    </span>
  );
}

function Thumb({ url, size = 46 }: { url: string | null; size?: number }) {
  if (url) {
    return (
      <img src={url} alt="" style={{
        width: size, height: size, objectFit: "cover", borderRadius: 12,
        flexShrink: 0, border: `1px solid ${DS.hair}`, background: "#fff",
      }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, background: DS.bg, borderRadius: 12, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <ShoppingBag size={size * 0.38} style={{ color: DS.muted }} />
    </div>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: DS.muted, marginTop: 6 }}>{label}</div>
    </div>
  );
}

// ── smart list ───────────────────────────────────────────────────────────────

// Archived 2026-07 — flip to true to bring the Smart list back. The engine
// (getCategoryRecommendations) and storage (smartListStorage) stay tested.
const SMART_LIST_ENABLED = false;

/** Resolution state for one smart-list item's brand recommendation. */
type RecState =
  | { status: "loading" }
  | { status: "done"; pick: SwapSuggestion | null };

const QUICK_ADDS = ["Coffee", "Tea", "Chocolate", "Eggs", "Milk", "Cereal"];

/**
 * "Type what you need, we pick the brand" — generic items mapped to the swap
 * catalog and resolved to the best curated ethical brand for the user's
 * priorities and region.
 */
function SmartList({ onAddToBasket, inBasket }: {
  onAddToBasket: (result: OpenFoodFactsResult) => void;
  inBasket: (barcode: string) => boolean;
}) {
  const [items, setItems] = useState<SmartListItem[]>(() => loadSmartList());
  const [input, setInput] = useState("");
  const [recs, setRecs] = useState<Record<string, RecState>>({});
  const inFlight = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handler = () => setItems(loadSmartList());
    window.addEventListener(SMART_LIST_EVENT, handler);
    return () => window.removeEventListener(SMART_LIST_EVENT, handler);
  }, []);

  // Resolve a recommendation once per item; region + priorities are read at
  // resolution time so fresh items always reflect current settings.
  useEffect(() => {
    for (const item of items) {
      if (!item.category || inFlight.current.has(item.id)) continue;
      inFlight.current.add(item.id);
      setRecs((prev) => ({ ...prev, [item.id]: { status: "loading" } }));
      getCategoryRecommendations(item.category, {
        region: loadRegion(),
        priorities: loadPriorities(),
        limit: 1,
      })
        .then(([pick]) => setRecs((prev) => ({ ...prev, [item.id]: { status: "done", pick: pick ?? null } })))
        .catch(() => setRecs((prev) => ({ ...prev, [item.id]: { status: "done", pick: null } })));
    }
  }, [items]);

  const add = (label: string) => {
    const name = label.trim();
    if (!name) return;
    addSmartListItem(name, detectCategoryFromText(name));
    setInput("");
  };

  const remove = (id: string) => {
    inFlight.current.delete(id);
    removeSmartListItem(id);
  };

  return (
    <div style={{ background: DS.card, borderRadius: 18, boxShadow: SHADOW, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px" }}>
        <p style={{
          fontSize: 11.5, fontWeight: 700, color: DS.muted, textTransform: "uppercase",
          letterSpacing: 0.5, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 5,
        }}>
          <Sparkles size={11} style={{ color: DS.good }} /> Smart list
        </p>
        <p style={{ fontSize: 12, color: DS.muted, margin: "0 0 10px", lineHeight: 1.45 }}>
          Add what you need — we'll suggest the most ethical brand for your values, sold near you.
        </p>
        <form
          onSubmit={(e) => { e.preventDefault(); add(input); }}
          style={{ display: "flex", gap: 8 }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. coffee, chocolate, eggs…"
            style={{
              flex: 1, height: 44, background: DS.bg, border: `1px solid ${DS.hair}`,
              borderRadius: 12, color: DS.ink, fontSize: 14, padding: "0 14px",
              outline: "none", fontFamily: DS.font, boxSizing: "border-box", minWidth: 0,
            }}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            aria-label="Add to smart list"
            style={{
              width: 44, height: 44, borderRadius: 12, border: "none", flexShrink: 0,
              background: input.trim() ? DS.ink : DS.hair,
              color: input.trim() ? DS.card : DS.muted,
              cursor: input.trim() ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Plus size={17} />
          </button>
        </form>

        {items.length === 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {QUICK_ADDS.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => add(label)}
                style={{
                  padding: "6px 12px", borderRadius: 999, border: `1px solid ${DS.hair}`,
                  background: DS.bg, color: DS.muted, fontSize: 12, fontWeight: 700,
                  cursor: "pointer", fontFamily: DS.font,
                }}
              >
                + {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div style={{ borderTop: `1px solid ${DS.hair}` }}>
          {items.map((item, i) => {
            const rec = item.category ? recs[item.id] : undefined;
            const pick = rec?.status === "done" ? rec.pick : null;
            const already = pick?.barcode ? inBasket(pick.barcode) : false;
            return (
              <div key={item.id} style={{
                padding: "12px 16px",
                borderBottom: i < items.length - 1 ? `1px solid ${DS.hair}` : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 800, color: DS.ink,
                    textTransform: "capitalize", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {item.label}
                  </span>
                  <button
                    onClick={() => remove(item.id)}
                    aria-label={`Remove ${item.label} from smart list`}
                    style={{
                      width: 28, height: 28, borderRadius: 8, border: "none", flexShrink: 0,
                      background: DS.bg, color: DS.muted, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>

                {!item.category ? (
                  <p style={{ fontSize: 12, color: DS.muted, margin: "6px 0 0", lineHeight: 1.4 }}>
                    No curated pick for this yet — try the product search below.
                  </p>
                ) : rec?.status !== "done" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 8 }}>
                    <Loader2 size={13} style={{ color: DS.muted, animation: "spin 1s linear infinite" }} />
                    <span style={{ fontSize: 12, color: DS.muted }}>Finding the best brand…</span>
                  </div>
                ) : !pick ? (
                  <p style={{ fontSize: 12, color: DS.muted, margin: "6px 0 0", lineHeight: 1.4 }}>
                    Couldn't find a recommendation right now — try the search below.
                  </p>
                ) : (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 11, marginTop: 9,
                    background: DS.goodBg, borderRadius: 13, padding: "10px 12px",
                  }}>
                    <Thumb url={pick.imageUrl} size={42} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 13, fontWeight: 800, color: DS.ink, margin: "0 0 2px",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {pick.brand}
                      </p>
                      <p style={{
                        fontSize: 11.5, color: DS.muted, margin: "0 0 4px",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {pick.productName}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                        {pick.certifications.slice(0, 2).map((cert) => {
                          const badge = CERTIFICATION_BADGES[cert];
                          return badge ? (
                            <span key={cert} style={{
                              fontSize: 9.5, fontWeight: 800, color: badge.color, background: badge.bg,
                              borderRadius: 6, padding: "2px 6px", whiteSpace: "nowrap",
                            }}>
                              {badge.shortLabel}
                            </span>
                          ) : null;
                        })}
                        <span style={{ fontSize: 10.5, color: DS.muted, whiteSpace: "nowrap" }}>
                          {pick.availabilityLabel}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (pick.product && !already) {
                          onAddToBasket(pick.product);
                          remove(item.id);
                        }
                      }}
                      disabled={!pick.product || already}
                      aria-label={already ? "Already in basket" : `Add ${pick.brand} to basket`}
                      style={{
                        width: 34, height: 34, borderRadius: 10, border: "none", flexShrink: 0,
                        background: already ? DS.goodBg : pick.product ? DS.ink : DS.hair,
                        color: already ? DS.good : pick.product ? DS.card : DS.muted,
                        cursor: pick.product && !already ? "pointer" : "default",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {already ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── page ───────────────────────────────────────────────────────────────────

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
  const inBasket = (barcode: string) => basket.some((b) => b.barcode === barcode);
  const overallTone = gradeTone(report.overallGrade);
  const weakest = report.weakestItem;
  const weakestPoor = weakest && ["d", "e"].includes(weakest.ecoscoreGrade?.toLowerCase() ?? "");

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 44, background: DS.bg, border: `1px solid ${DS.hair}`,
    borderRadius: 12, color: DS.ink, fontSize: 14, paddingLeft: 38, paddingRight: 38,
    outline: "none", fontFamily: DS.font, boxSizing: "border-box",
  };

  return (
    <div style={{ background: DS.bg, minHeight: "100dvh", fontFamily: DS.font, color: DS.ink }}>
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px 120px" }}>

        {/* ── Header ── */}
        <header style={{
          paddingTop: "max(48px, calc(env(safe-area-inset-top, 0px) + 16px))",
          paddingBottom: 18, display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: -0.4,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <ShoppingCart style={{ width: 20, height: 20, color: DS.ink, strokeWidth: 2.2 }} />
              Basket
            </h1>
            <p style={{ fontSize: 12.5, color: DS.muted, margin: "4px 0 0" }}>
              {basket.length > 0
                ? `${basket.length} item${basket.length !== 1 ? "s" : ""} you're tracking`
                : "Build a basket to see its impact"}
            </p>
          </div>
          {basket.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0,
                padding: "8px 12px", borderRadius: 10, border: `1px solid ${DS.hair}`,
                background: DS.card, color: DS.muted, cursor: "pointer",
                fontSize: 12.5, fontWeight: 700, fontFamily: DS.font,
              }}
            >
              <Trash2 size={13} /> Clear
            </button>
          )}
        </header>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* ── Clear confirm ── */}
          {showClearConfirm && (
            <div style={{ background: DS.card, border: `1px solid ${DS.bad}40`, borderRadius: 16, padding: 16, boxShadow: SHADOW }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <AlertTriangle size={16} style={{ color: DS.bad, flexShrink: 0 }} />
                <p style={{ fontSize: 14, fontWeight: 700, color: DS.ink, margin: 0 }}>Clear your whole basket?</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleClear} style={{ flex: 1, height: 42, borderRadius: 11, border: "none", background: DS.bad, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: DS.font }}>
                  Yes, clear
                </button>
                <button onClick={() => setShowClearConfirm(false)} style={{ flex: 1, height: 42, borderRadius: 11, border: `1px solid ${DS.hair}`, background: DS.card, color: DS.ink, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: DS.font }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── Summary card (consolidated) ── */}
          {basket.length > 0 && (
            <div style={{ background: DS.card, borderRadius: 18, padding: "16px 16px 14px", boxShadow: SHADOW }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                  background: overallTone.bg, color: overallTone.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, fontWeight: 800,
                }}>
                  {report.overallGrade !== "unknown" ? report.overallGrade.toUpperCase() : "—"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: DS.ink, lineHeight: 1.2 }}>
                    Basket impact
                  </div>
                  <div style={{ fontSize: 12, color: DS.muted, marginTop: 2 }}>
                    {report.overallGrade !== "unknown"
                      ? report.laborFlagCount > 0
                        ? `${report.overallScore}/100 for your values · ${report.laborFlagCount} flagged brand${report.laborFlagCount !== 1 ? "s" : ""}`
                        : `${report.overallScore}/100 — matched to your values`
                      : "Scores will appear as you add products"}
                  </div>
                </div>
              </div>

              {/* stat strip */}
              <div style={{
                display: "flex", alignItems: "center",
                background: DS.bg, borderRadius: 13, padding: "12px 8px", marginTop: 14,
              }}>
                <Stat value={String(basket.length)} label="Items" color={DS.ink} />
                <div style={{ width: 1, alignSelf: "stretch", background: DS.hair, margin: "0 4px" }} />
                <Stat
                  value={String(report.laborFlagCount)}
                  label="Labour flags"
                  color={report.laborFlagCount > 0 ? DS.bad : DS.good}
                />
                <div style={{ width: 1, alignSelf: "stretch", background: DS.hair, margin: "0 4px" }} />
                <Stat
                  value={report.co2ScoredCount > 0 ? `${report.co2NetKg >= 0 ? "−" : "+"}${Math.abs(report.co2NetKg)}` : "—"}
                  label={report.co2ScoredCount > 0 ? "kg CO₂ vs avg" : "CO₂"}
                  color={report.co2ScoredCount === 0 ? DS.muted : report.co2NetKg >= 0 ? DS.good : DS.warn}
                />
              </div>

              {/* weakest link — quiet, actionable */}
              {weakestPoor && weakest && (
                <Link to={`/product-off/${weakest.barcode}`} style={{
                  display: "flex", alignItems: "center", gap: 10, marginTop: 12,
                  padding: "10px 12px", borderRadius: 12, background: DS.warnBg,
                  textDecoration: "none",
                }}>
                  <AlertTriangle size={15} style={{ color: DS.warn, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 12.5, color: DS.ink, fontWeight: 600 }}>
                      Weakest: <strong style={{ fontWeight: 800 }}>{weakest.productName}</strong>
                    </span>
                    <span style={{ fontSize: 11.5, color: DS.muted, display: "block" }}>
                      Eco-{weakest.ecoscoreGrade?.toUpperCase()} · tap to find a greener swap
                    </span>
                  </div>
                  <ChevronRight size={16} style={{ color: DS.warn, flexShrink: 0 }} />
                </Link>
              )}
            </div>
          )}

          {/* ── Smart list — generic needs resolved to best-brand picks ── */}
          {SMART_LIST_ENABLED && <SmartList onAddToBasket={handleAdd} inBasket={inBasket} />}

          {/* ── Add product ── */}
          <div style={{ background: DS.card, borderRadius: 18, boxShadow: SHADOW, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px" }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: DS.muted, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 10px" }}>
                Add a product
              </p>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Search size={15} style={{ position: "absolute", left: 13, color: DS.muted, pointerEvents: "none" }} />
                {searching
                  ? <Loader2 size={15} style={{ position: "absolute", right: 13, color: DS.ink, animation: "spin 1s linear infinite" }} />
                  : query
                    ? <button onClick={() => { setQuery(""); setSearchResults([]); }} style={{ position: "absolute", right: 11, background: "none", border: "none", color: DS.muted, cursor: "pointer", padding: 0, display: "flex" }}><X size={15} /></button>
                    : null}
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products to add…"
                  style={inputStyle}
                />
              </div>
            </div>

            {searchResults.length > 0 && (
              <div style={{ borderTop: `1px solid ${DS.hair}` }}>
                {searchResults.map((result, i) => {
                  const already = inBasket(result.barcode);
                  return (
                    <div key={result.barcode} style={{
                      display: "flex", alignItems: "center", gap: 11, padding: "11px 16px",
                      borderBottom: i < searchResults.length - 1 ? `1px solid ${DS.hair}` : "none",
                    }}>
                      <Thumb url={result.imageUrl} size={40} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13.5, fontWeight: 700, color: DS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: "0 0 3px" }}>
                          {result.productName || "Unknown"}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {result.brand && <span style={{ fontSize: 11.5, color: DS.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{result.brand}</span>}
                          {result.ecoscoreGrade && <GradePill grade={result.ecoscoreGrade} label="Eco" />}
                        </div>
                      </div>
                      <button
                        onClick={() => !already && handleAdd(result)}
                        disabled={already}
                        aria-label={already ? "Already in basket" : "Add to basket"}
                        style={{
                          width: 34, height: 34, borderRadius: 10, border: "none", flexShrink: 0,
                          background: already ? DS.goodBg : DS.ink,
                          color: already ? DS.good : DS.card,
                          cursor: already ? "default" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
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
              <div style={{ padding: "12px 16px", borderTop: `1px solid ${DS.hair}` }}>
                <p style={{ fontSize: 13, color: DS.muted, margin: 0 }}>No results for "{query}"</p>
              </div>
            )}
          </div>

          {/* ── Items ── */}
          {basket.length === 0 ? (
            <div style={{ background: DS.card, borderRadius: 18, padding: "40px 24px", textAlign: "center", boxShadow: SHADOW }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: DS.bg, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <ShoppingCart size={24} style={{ color: DS.muted }} />
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 6px" }}>Your basket is empty</h2>
              <p style={{ fontSize: 13, color: DS.muted, margin: "0 0 18px", lineHeight: 1.5 }}>
                Search above or scan a product, and we'll track its ethics and footprint here.
              </p>
              <Link to="/scan" style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px",
                borderRadius: 12, background: DS.ink, color: DS.card,
                textDecoration: "none", fontWeight: 700, fontSize: 13.5,
              }}>
                <ShoppingBag size={15} /> Start scanning
              </Link>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: DS.muted, textTransform: "uppercase", letterSpacing: 0.5, margin: "2px 0 8px 2px" }}>
                In your basket
              </p>
              <div style={{ background: DS.card, borderRadius: 18, boxShadow: SHADOW, overflow: "hidden" }}>
                {basket.map((item, i) => {
                  const isFlagged = item.laborAllegations > 0;
                  return (
                    <div key={item.id} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                      borderBottom: i < basket.length - 1 ? `1px solid ${DS.hair}` : "none",
                    }}>
                      <Link to={`/product-off/${item.barcode}`} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0, textDecoration: "none" }}>
                        <Thumb url={item.imageUrl} size={46} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: DS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: "0 0 4px" }}>
                            {item.productName}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                            {item.brand && <span style={{ fontSize: 11.5, color: DS.muted }}>{item.brand}</span>}
                            {item.ecoscoreGrade && <GradePill grade={item.ecoscoreGrade} label="Eco" />}
                            {item.nutriscoreGrade && <GradePill grade={item.nutriscoreGrade} label="Nutri" />}
                            {isFlagged && (
                              <span style={{ fontSize: 10, fontWeight: 800, color: DS.bad, background: DS.badBg, borderRadius: 6, padding: "2px 7px", display: "inline-flex", alignItems: "center", gap: 3 }}>
                                <Users size={9} /> Labour
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                      <button
                        onClick={() => handleRemove(item.barcode)}
                        aria-label="Remove from basket"
                        style={{
                          width: 32, height: 32, borderRadius: 9, border: "none", flexShrink: 0,
                          background: DS.bg, color: DS.muted, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* CO₂ positive reinforcement footer */}
              {report.co2ScoredCount > 0 && report.co2NetKg > 0 && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, marginTop: 10,
                  padding: "10px 14px", borderRadius: 12,
                  background: DS.goodBg, fontSize: 12.5, color: DS.ink,
                }}>
                  <TrendingDown size={15} style={{ color: DS.good, flexShrink: 0 }} />
                  <span>This basket is <strong style={{ fontWeight: 800 }}>{report.co2NetKg} kg CO₂</strong> lighter than an average one.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
