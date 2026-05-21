import { useState, useEffect, useMemo } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Link } from "react-router-dom";
import {
  loadScanHistory,
  clearScanHistory,
  type ScanHistoryEntry,
} from "@/utils/userPreferences";
import { loadBasket, removeFromBasket, getBasketEthicsReport, type BasketItem } from "@/utils/basketStorage";
import { Search, ChevronRight, ShoppingBag, Trash2, AlertTriangle, Leaf, TrendingDown, Award, X } from "lucide-react";
import { DS, scoreTone, toneColor } from "@/styles/design-tokens";

type Filter = "all" | "good" | "mixed" | "avoid";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "good", label: "Good" },
  { key: "mixed", label: "Mixed" },
  { key: "avoid", label: "Avoid" },
];

function entryTone(entry: ScanHistoryEntry): "good" | "warn" | "bad" | null {
  if (entry.scores.ecoScore != null) return scoreTone(entry.scores.ecoScore);
  return null;
}

function matchesFilter(entry: ScanHistoryEntry, filter: Filter): boolean {
  if (filter === "all") return true;
  const tone = entryTone(entry);
  if (filter === "good") return tone === "good";
  if (filter === "mixed") return tone === "warn";
  if (filter === "avoid") return tone === "bad";
  return true;
}

function dayLabel(ts: number): string {
  const now = new Date();
  const date = new Date(ts);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const entryDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (entryDay.getTime() === today.getTime()) return "TODAY";
  if (entryDay.getTime() === yesterday.getTime()) return "YESTERDAY";

  const diff = today.getTime() - entryDay.getTime();
  if (diff < 7 * 86400000) {
    return date.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function ScoreCircle({ entry }: { entry: ScanHistoryEntry }) {
  const score = entry.scores.ecoScore;
  if (score == null) {
    return (
      <div style={{
        width: 40, height: 40, borderRadius: 20,
        background: DS.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700, color: DS.muted, flexShrink: 0,
      }}>
        —
      </div>
    );
  }
  const tone = scoreTone(score);
  const color = toneColor(tone);
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 20,
      background: color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 14, fontWeight: 800, color: DS.card, flexShrink: 0,
    }}>
      {Math.round(score)}
    </div>
  );
}

// ── Impact Dashboard ──

function ImpactDashboard({ basket }: { basket: BasketItem[] }) {
  const report = useMemo(() => getBasketEthicsReport(basket), [basket]);

  if (basket.length === 0) return null;

  const gradeColor = (g: string) => {
    const map: Record<string, string> = { a: DS.good, b: DS.good, c: DS.warn, d: DS.bad, e: DS.bad };
    return map[g] || DS.muted;
  };

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Impact header card */}
      <div style={{
        background: DS.card, borderRadius: 20, padding: "20px 18px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
        marginBottom: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 12,
            background: DS.goodBg,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Leaf style={{ width: 18, height: 18, color: DS.good }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: DS.ink }}>Your Impact</div>
            <div style={{ fontSize: 12, color: DS.muted }}>{basket.length} item{basket.length !== 1 ? "s" : ""} in cart</div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {/* Overall score */}
          <div style={{
            background: DS.bg, borderRadius: 14, padding: "14px 12px",
            textAlign: "center",
          }}>
            <div style={{
              fontSize: 28, fontWeight: 800, letterSpacing: -1,
              color: report.scoredCount > 0 ? gradeColor(report.overallGrade) : DS.muted,
            }}>
              {report.scoredCount > 0 ? report.overallGrade.toUpperCase() : "—"}
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: DS.muted, marginTop: 2 }}>
              Avg Grade
            </div>
          </div>

          {/* CO2 saved */}
          <div style={{
            background: DS.bg, borderRadius: 14, padding: "14px 12px",
            textAlign: "center",
          }}>
            <div style={{
              fontSize: 22, fontWeight: 800, letterSpacing: -0.5,
              color: report.co2NetKg >= 0 ? DS.good : DS.bad,
            }}>
              {report.co2ScoredCount > 0 ? (
                <>{report.co2NetKg >= 0 ? "+" : ""}{report.co2NetKg}<span style={{ fontSize: 13, fontWeight: 600 }}>kg</span></>
              ) : "—"}
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: DS.muted, marginTop: 2 }}>
              CO2 vs Avg
            </div>
          </div>

          {/* Clean brands */}
          <div style={{
            background: DS.bg, borderRadius: 14, padding: "14px 12px",
            textAlign: "center",
          }}>
            <div style={{
              fontSize: 22, fontWeight: 800, letterSpacing: -0.5,
              color: report.laborFlagCount === 0 ? DS.good : DS.warn,
            }}>
              {report.cleanBrandCount}<span style={{ fontSize: 13, fontWeight: 600 }}>/{basket.length}</span>
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: DS.muted, marginTop: 2 }}>
              Clean Brands
            </div>
          </div>
        </div>

        {/* Breakdown bar */}
        {report.scoredCount > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", gap: 3, height: 6, borderRadius: 3, overflow: "hidden" }}>
              {report.goodCount > 0 && (
                <div style={{ flex: report.goodCount, background: DS.good, borderRadius: 3 }} />
              )}
              {report.fairCount > 0 && (
                <div style={{ flex: report.fairCount, background: DS.warn, borderRadius: 3 }} />
              )}
              {report.poorCount > 0 && (
                <div style={{ flex: report.poorCount, background: DS.bad, borderRadius: 3 }} />
              )}
              {report.unknownCount > 0 && (
                <div style={{ flex: report.unknownCount, background: DS.hair, borderRadius: 3 }} />
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: DS.good }}>{report.goodCount} good</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: DS.warn }}>{report.fairCount} fair</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: DS.bad }}>{report.poorCount} poor</span>
            </div>
          </div>
        )}
      </div>

      {/* Cart items (compact) */}
      <div style={{
        background: DS.card, borderRadius: 16, overflow: "hidden",
        boxShadow: "0 2px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
      }}>
        <div style={{
          padding: "12px 16px 8px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: DS.muted, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Cart Items
          </span>
        </div>
        {basket.map((item, i) => {
          const grade = item.ecoscoreGrade?.toLowerCase();
          const gColor = grade ? gradeColor(grade) : DS.muted;
          return (
            <div
              key={item.id}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 16px",
                borderTop: i > 0 ? `1px solid ${DS.hair}` : undefined,
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: grade ? `${gColor}18` : DS.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, color: gColor, flexShrink: 0,
              }}>
                {grade ? grade.toUpperCase() : "?"}
              </div>
              <Link
                to={`/product-off/${item.barcode}`}
                style={{
                  flex: 1, minWidth: 0, textDecoration: "none", color: DS.ink,
                }}
              >
                <div style={{
                  fontSize: 14, fontWeight: 600,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {item.productName}
                </div>
                <div style={{ fontSize: 11, color: DS.muted, marginTop: 1 }}>
                  {item.brand || "Unknown brand"}
                </div>
              </Link>
              <button
                onClick={() => removeFromBasket(item.barcode)}
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: "none", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: DS.muted, flexShrink: 0,
                }}
                aria-label={`Remove ${item.productName}`}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ──

export default function Dashboard() {
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setHistory(loadScanHistory());
    setBasket(loadBasket());
    const histHandler = () => setHistory(loadScanHistory());
    const basketHandler = () => setBasket(loadBasket());
    window.addEventListener("scanHistoryUpdated", histHandler);
    window.addEventListener("basketUpdated", basketHandler);
    return () => {
      window.removeEventListener("scanHistoryUpdated", histHandler);
      window.removeEventListener("basketUpdated", basketHandler);
    };
  }, []);

  const handleClear = () => {
    clearScanHistory();
    setHistory([]);
    setShowClearConfirm(false);
  };

  const filtered = useMemo(() => {
    let items = history;
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (e) =>
          (e.productName || "").toLowerCase().includes(q) ||
          (e.brand || "").toLowerCase().includes(q)
      );
    }
    return items.filter((e) => matchesFilter(e, filter));
  }, [history, filter, search]);

  // Group by day
  const grouped = useMemo(() => {
    const groups: { label: string; items: ScanHistoryEntry[] }[] = [];
    let currentLabel = "";
    for (const entry of filtered) {
      const label = dayLabel(entry.timestamp);
      if (label !== currentLabel) {
        groups.push({ label, items: [entry] });
        currentLabel = label;
      } else {
        groups[groups.length - 1].items.push(entry);
      }
    }
    return groups;
  }, [filtered]);

  return (
    <div style={{ minHeight: "100dvh", background: DS.bg, fontFamily: DS.font, color: DS.ink }}>
      {/* Header */}
      <div style={{ padding: "0 20px", paddingTop: "max(60px, calc(env(safe-area-inset-top, 0px) + 16px))" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>History</h1>
          {history.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 12px", borderRadius: 12, fontSize: 12, fontWeight: 600,
                color: DS.muted, background: DS.card, border: `1px solid ${DS.hair}`, cursor: "pointer",
              }}
            >
              <Trash2 style={{ width: 14, height: 14 }} />
              Clear
            </button>
          )}
        </div>
      </div>

      <main style={{ padding: "0 20px", paddingBottom: 110 }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>

          {/* Impact Dashboard */}
          <ImpactDashboard basket={basket} />

          {/* Clear confirmation */}
          {showClearConfirm && (
            <div style={{
              background: DS.badBg, borderRadius: 16, padding: 16, marginBottom: 16,
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500, color: DS.bad }}>
                <AlertTriangle style={{ width: 16, height: 16 }} />
                Delete all history?
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleClear} style={{
                  padding: "6px 16px", borderRadius: 10, background: DS.bad, color: DS.card,
                  fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer",
                }}>Yes, Clear</button>
                <button onClick={() => setShowClearConfirm(false)} style={{
                  padding: "6px 16px", borderRadius: 10, background: DS.card, color: DS.muted,
                  fontSize: 12, fontWeight: 500, border: `1px solid ${DS.hair}`, cursor: "pointer",
                }}>Cancel</button>
              </div>
            </div>
          )}

          {history.length === 0 && basket.length === 0 ? (
            /* Empty state */
            <div style={{
              background: DS.card, borderRadius: 18, padding: "48px 24px", textAlign: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, background: DS.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <ShoppingBag style={{ width: 28, height: 28, color: DS.muted }} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No scans yet</h2>
              <p style={{ fontSize: 14, color: DS.muted, marginBottom: 24, maxWidth: 260, margin: "0 auto 24px" }}>
                Scan a product to start building your history.
              </p>
              <Link to="/scan" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 24px", borderRadius: 14, fontWeight: 700, fontSize: 14,
                background: DS.ink, color: DS.card, textDecoration: "none",
              }}>
                Start Scanning
              </Link>
            </div>
          ) : history.length > 0 ? (
            <>
              {/* Search bar */}
              <div style={{ position: "relative", marginBottom: 14 }}>
                <Search size={16} style={{
                  position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                  color: DS.muted, pointerEvents: "none",
                }} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  style={{
                    width: "100%", height: 44, boxSizing: "border-box",
                    paddingLeft: 40, paddingRight: 14,
                    borderRadius: 14, border: "none",
                    background: DS.card, color: DS.ink,
                    fontSize: 15, outline: "none",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
                    fontFamily: DS.font,
                  }}
                />
              </div>

              {/* Filter chips */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {FILTERS.map((f) => {
                  const active = filter === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setFilter(f.key)}
                      style={{
                        padding: "7px 16px", borderRadius: 20,
                        fontSize: 13, fontWeight: 600,
                        border: "none", cursor: "pointer",
                        background: active ? DS.ink : DS.card,
                        color: active ? DS.card : DS.muted,
                        transition: "all 0.15s",
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>

              {/* Day-grouped list */}
              {filtered.length === 0 ? (
                <p style={{ textAlign: "center", fontSize: 14, color: DS.muted, marginTop: 32 }}>
                  No results match your filters.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {grouped.map((group) => (
                    <div key={group.label}>
                      {/* Day header */}
                      <p style={{
                        fontSize: 11, fontWeight: 700, color: DS.muted,
                        letterSpacing: "0.06em", padding: "12px 0 6px",
                        margin: 0,
                      }}>
                        {group.label}
                      </p>

                      {/* Items */}
                      {group.items.map((entry) => (
                        <Link
                          key={entry.id}
                          to={`/product-off/${entry.barcode}`}
                          style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "12px 14px", borderRadius: 16,
                            background: DS.card, textDecoration: "none", color: DS.ink,
                            marginBottom: 6,
                            boxShadow: "0 2px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
                          }}
                        >
                          <ScoreCircle entry={entry} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              fontSize: 15, fontWeight: 600, margin: 0,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                              {entry.productName || "Unknown Product"}
                            </p>
                            <p style={{ fontSize: 13, color: DS.muted, margin: "2px 0 0" }}>
                              {entry.brand || "Unknown brand"} · {formatTime(entry.timestamp)}
                            </p>
                          </div>
                          <ChevronRight style={{ width: 18, height: 18, color: DS.muted, flexShrink: 0 }} />
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
