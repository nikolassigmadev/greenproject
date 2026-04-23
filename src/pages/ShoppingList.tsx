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
  a: '#00c853', b: '#40aaff', c: '#ffc700', d: '#ff8c00', e: '#ff3b30',
};

const ECO_COLOR: Record<string, string> = {
  a: '#00c853', b: '#40aaff', c: '#ffc700', d: '#ff8c00', e: '#ff3b30',
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

// ── component ──────────────────────────────────────────────────────────────

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

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
    <div className="min-h-screen bg-black diagonal-stripe">
      <div className="scanlines" />

      <main className="pb-nav">

        {/* ── Header ── */}
        <div className="px-5 pt-14 pb-0">
          <div className="max-w-xl mx-auto flex items-start justify-between" style={{ paddingRight: 50 }}>
            <div>
              <p style={{ ...MONO, fontSize: '0.55rem', color: '#84898E', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
                // SHOPPING
              </p>
              <h1 style={{ ...MONO, fontSize: 'clamp(1.8rem, 9vw, 2.5rem)', color: '#ffffff', letterSpacing: '-0.03em', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1 }}>
                MY BASKET<span style={{ color: '#00c853' }}>_</span>
              </h1>
            </div>
            {basket.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                style={{
                  ...MONO, marginTop: 8,
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'transparent', color: '#84898E', cursor: 'pointer',
                  fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                }}
              >
                <Trash2 size={12} /> CLEAR
              </button>
            )}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="px-5 pt-4">
          <div className="max-w-xl mx-auto" style={{ borderBottom: '1px solid rgba(132,137,142,0.2)' }} />
        </div>

        <div className="px-5 pt-4">
          <div className="max-w-xl mx-auto space-y-3">

            {/* ── Clear confirm ── */}
            {showClearConfirm && (
              <div style={{ border: '1px solid rgba(255,59,48,0.3)', borderLeft: '3px solid #ff3b30', background: 'rgba(255,59,48,0.05)', padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={14} style={{ color: '#ff3b30' }} />
                    <span style={{ ...MONO, fontSize: '0.65rem', fontWeight: 700, color: '#ff3b30', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      CLEAR ENTIRE BASKET?
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleClear} style={{ ...MONO, padding: '6px 14px', border: 'none', background: '#ff3b30', color: '#fff', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
                      [YES]
                    </button>
                    <button onClick={() => setShowClearConfirm(false)} style={{ ...MONO, padding: '6px 14px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#84898E', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
                      [NO]
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Labour Impact Card ── */}
            {basket.length > 0 && (
              <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderLeft: `3px solid ${report.laborFlagCount > 0 ? '#ff3b30' : '#00c853'}`, background: '#000', padding: '16px' }}>
                <p style={{ ...MONO, fontSize: '0.48rem', color: '#84898E', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>
                  // LABOUR_SCAN
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span style={{ ...MONO, fontSize: '2rem', fontWeight: 900, color: report.laborFlagCount > 0 ? '#ff3b30' : '#00c853', lineHeight: 1 }}>
                    {report.laborFlagCount > 0 ? report.laborFlagCount : report.cleanBrandCount}
                  </span>
                  <span style={{ ...MONO, fontSize: '0.65rem', color: '#84898E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {report.laborFlagCount > 0 ? 'flagged' : 'clean'}
                  </span>
                </div>
                <p style={{ ...MONO, fontSize: '0.6rem', color: report.laborFlagCount > 0 ? '#ff3b30' : '#00c853', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {report.laborFlagCount > 0
                    ? `brand${report.laborFlagCount !== 1 ? 's' : ''} with labour issues`
                    : 'no labour concerns'}
                </p>
                {report.flaggedItems.length > 0 && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {report.flaggedItems.slice(0, 3).map(item => (
                      <div key={item.barcode} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <span style={{ color: '#ff3b30', fontSize: '0.6rem' }}>▶</span>
                        <span style={{ ...MONO, fontSize: '0.6rem', color: '#84898E' }}>{item.brand || item.productName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── CO2 card ── */}
            {basket.length > 0 && report.co2ScoredCount > 0 && (
              <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderLeft: `3px solid ${report.co2NetKg >= 0 ? '#00c853' : '#ff8c00'}`, background: '#000', padding: '16px' }}>
                <p style={{ ...MONO, fontSize: '0.48rem', color: '#84898E', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>
                  // CO2_IMPACT
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span style={{ ...MONO, fontSize: '2rem', fontWeight: 900, color: report.co2NetKg >= 0 ? '#00c853' : '#ff8c00', lineHeight: 1 }}>
                    {report.co2NetKg >= 0 ? '-' : '+'}{Math.abs(report.co2NetKg)}
                  </span>
                  <span style={{ ...MONO, fontSize: '0.65rem', color: '#84898E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    kg CO₂
                  </span>
                </div>
                <p style={{ ...MONO, fontSize: '0.6rem', color: report.co2NetKg >= 0 ? '#00c853' : '#ff8c00', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {report.co2NetKg >= 0 ? 'saved vs avg basket' : 'more than avg basket'}
                </p>
              </div>
            )}

            {/* ── Weakest Link ── */}
            {report.weakestItem && ['d','e'].includes(report.weakestItem.ecoscoreGrade?.toLowerCase() ?? '') && (
              <Link to={`/product-off/${report.weakestItem.barcode}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', border: '1px solid rgba(255,140,0,0.3)', borderLeft: '3px solid #ff8c00', background: '#000', textDecoration: 'none' }}>
                <AlertCircle size={16} style={{ color: '#ff8c00', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ ...MONO, fontSize: '0.5rem', color: '#ff8c00', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 3 }}>
                    [!] WEAKEST LINK
                  </p>
                  <p style={{ ...MONO, fontSize: '0.75rem', color: '#ffffff', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {report.weakestItem.productName}
                  </p>
                  <p style={{ ...MONO, fontSize: '0.55rem', color: '#84898E', marginTop: 2 }}>
                    ECO_{report.weakestItem.ecoscoreGrade?.toUpperCase()} · consider swapping
                  </p>
                </div>
                <ChevronRight size={14} style={{ color: '#84898E', flexShrink: 0 }} />
              </Link>
            )}

            {/* ── Search ── */}
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#000' }}>
              <div style={{ padding: '10px 12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ ...MONO, fontSize: '0.45rem', color: '#84898E', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                  // ADD_PRODUCT
                </span>
              </div>
              <div style={{ padding: '10px 12px 12px' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: 10, ...MONO, fontSize: '0.7rem', color: '#00c853', pointerEvents: 'none' }}>›</span>
                  {searching
                    ? <Loader2 size={13} style={{ position: 'absolute', right: 10, color: '#84898E', animation: 'spin 1s linear infinite' }} />
                    : query
                    ? <button onClick={() => { setQuery(""); setSearchResults([]); }} style={{ position: 'absolute', right: 10, background: 'none', border: 'none', color: '#84898E', cursor: 'pointer', padding: 0 }}><X size={13} /></button>
                    : null
                  }
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="search products to add..."
                    style={{
                      width: '100%', height: 40,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff', ...MONO, fontSize: '0.75rem',
                      paddingLeft: 24, paddingRight: 32, outline: 'none',
                    }}
                  />
                </div>

                {(searchResults.length > 0) && (
                  <div style={{ marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {searchResults.map(result => {
                      const grade = result.ecoscoreGrade?.toLowerCase();
                      const already = inBasket(result.barcode);
                      return (
                        <div key={result.barcode} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          {result.imageUrl
                            ? <img src={result.imageUrl} alt="" style={{ width: 36, height: 36, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }} />
                            : <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShoppingBag size={14} style={{ color: '#84898E' }} /></div>
                          }
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ ...MONO, fontSize: '0.7rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.productName || 'Unknown'}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                              {result.brand && <span style={{ ...MONO, fontSize: '0.55rem', color: '#84898E' }}>{result.brand}</span>}
                              {grade && <span style={{ ...MONO, fontSize: '0.5rem', fontWeight: 700, color: ECO_COLOR[grade] || '#84898E', border: `1px solid ${ECO_COLOR[grade] || '#84898E'}`, padding: '1px 4px' }}>ECO_{grade.toUpperCase()}</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => !already && handleAdd(result)}
                            disabled={already}
                            style={{ width: 30, height: 30, border: `1px solid ${already ? 'rgba(0,200,83,0.4)' : 'rgba(255,255,255,0.15)'}`, background: already ? 'rgba(0,200,83,0.08)' : 'transparent', color: already ? '#00c853' : '#84898E', cursor: already ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                          >
                            {already ? <CheckCircle2 size={13} /> : <Plus size={13} />}
                          </button>
                        </div>
                      );
                    })}
                    {searchResults.length === 0 && query.trim().length >= 2 && !searching && (
                      <p style={{ ...MONO, fontSize: '0.6rem', color: '#84898E', padding: '10px 0' }}>NO_RESULTS_FOUND</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Basket Items ── */}
            {basket.length === 0 ? (
              <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderLeft: '3px solid #84898E', background: '#000', padding: '32px 20px', textAlign: 'center' }}>
                <ShoppingCart size={28} style={{ color: '#84898E', margin: '0 auto 12px' }} />
                <p style={{ ...MONO, fontSize: '0.75rem', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  BASKET_EMPTY
                </p>
                <p style={{ ...MONO, fontSize: '0.6rem', color: '#84898E', marginBottom: 20, lineHeight: 1.6 }}>
                  Search above or scan a product
                </p>
                <Link to="/scan" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#00c853', color: '#000', textDecoration: 'none', ...MONO, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  <ShoppingBag size={13} /> [START SCANNING]
                </Link>
              </div>
            ) : (
              <div>
                <p style={{ ...MONO, fontSize: '0.48rem', color: '#84898E', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>
                  // {basket.length} ITEM{basket.length !== 1 ? 'S' : ''} IN BASKET
                </p>
                <div style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  {basket.map((item, i) => {
                    const ecoGrade = item.ecoscoreGrade?.toLowerCase();
                    const nutriGrade = item.nutriscoreGrade?.toLowerCase();
                    const isFlagged = item.laborAllegations > 0;
                    const isWeakest = report.weakestItem?.barcode === item.barcode;

                    return (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: i < basket.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', borderLeft: isFlagged ? '2px solid #ff3b30' : isWeakest ? '2px solid #ff8c00' : '2px solid transparent' }}>
                        <Link to={`/product-off/${item.barcode}`} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, textDecoration: 'none' }}>
                          {item.imageUrl
                            ? <img src={item.imageUrl} alt="" style={{ width: 44, height: 44, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }} />
                            : <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShoppingBag size={16} style={{ color: '#84898E' }} /></div>
                          }
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ ...MONO, fontSize: '0.7rem', fontWeight: 700, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                              {item.productName}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                              {item.brand && <span style={{ ...MONO, fontSize: '0.55rem', color: '#84898E' }}>{item.brand}</span>}
                              {ecoGrade
                                ? <span style={{ ...MONO, fontSize: '0.48rem', fontWeight: 700, border: `1px solid ${ECO_COLOR[ecoGrade] || '#84898E'}`, color: ECO_COLOR[ecoGrade] || '#84898E', padding: '1px 5px' }}>ECO_{ecoGrade.toUpperCase()}</span>
                                : <span style={{ ...MONO, fontSize: '0.48rem', color: '#84898E', border: '1px solid rgba(255,255,255,0.1)', padding: '1px 5px' }}>NO_ECO</span>
                              }
                              {nutriGrade && <span style={{ ...MONO, fontSize: '0.48rem', fontWeight: 700, border: `1px solid ${NUTRI_COLOR[nutriGrade] || '#84898E'}`, color: NUTRI_COLOR[nutriGrade] || '#84898E', padding: '1px 5px' }}>NUTRI_{nutriGrade.toUpperCase()}</span>}
                              {isFlagged && <span style={{ ...MONO, fontSize: '0.48rem', fontWeight: 700, border: '1px solid rgba(255,59,48,0.5)', color: '#ff3b30', padding: '1px 5px', display: 'inline-flex', alignItems: 'center', gap: 3 }}><Users size={9} /> LABOUR</span>}
                            </div>
                          </div>
                        </Link>
                        <button
                          onClick={() => handleRemove(item.barcode)}
                          style={{ width: 30, height: 30, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#84898E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                        >
                          <X size={13} />
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
