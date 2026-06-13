import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  loadScanHistory,
  clearScanHistory,
  type ScanHistoryEntry,
} from "@/utils/userPreferences";
import { loadBasket, getBasketEthicsReport, type BasketItem } from "@/utils/basketStorage";
import { computeMonthlyImpact, type MonthlyImpact } from "@/utils/impactStats";
import { WATCHLIST_EVENT, loadWatchlist } from "@/utils/watchlist";
import { SWAP_EVENT } from "@/utils/swapTracking";
import {
  Search, ChevronRight, ShoppingBag, Trash2, ScanLine, TrendingDown,
  Eye, GitCompareArrows, Receipt, Flag, ShoppingCart,
} from "lucide-react";
import { DS, scoreTone, toneColor } from "@/styles/design-tokens";

type Filter = "all" | "good" | "mixed" | "avoid";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "good", label: "Good" },
  { key: "mixed", label: "Mixed" },
  { key: "avoid", label: "Avoid" },
];

function alpha(color: string, pct: number): string {
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

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

  if (entryDay.getTime() === today.getTime()) return "Today";
  if (entryDay.getTime() === yesterday.getTime()) return "Yesterday";

  const diff = today.getTime() - entryDay.getTime();
  if (diff < 7 * 86400000) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

const GRADE_COLOR: Record<string, string> = {
  a: DS.good, b: DS.good, c: DS.warn, d: DS.bad, e: DS.bad,
};

// ── Score badge (eco score 0–100) ──

function ScoreBadge({ entry }: { entry: ScanHistoryEntry }) {
  const score = entry.scores.ecoScore;
  if (score == null) {
    return (
      <div style={{
        width: 38, height: 38, borderRadius: 12,
        background: DS.bg, border: `1px solid ${DS.hair}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 700, color: DS.muted, flexShrink: 0,
      }}>
        —
      </div>
    );
  }
  const color = toneColor(scoreTone(score));
  return (
    <div style={{
      width: 38, height: 38, borderRadius: 12,
      background: alpha(color, 14), color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 15, fontWeight: 800, flexShrink: 0,
      fontVariantNumeric: "tabular-nums",
    }}>
      {Math.round(score)}
    </div>
  );
}

// ── This-month summary bar (compact, one row) ──

function SummaryBar({ impact }: { impact: MonthlyImpact }) {
  const stats: { value: string; label: string; color: string }[] = [
    { value: String(impact.scanCount), label: "Scanned", color: DS.ink },
    { value: String(impact.flaggedBrandCount), label: "Flagged", color: impact.flaggedBrandCount > 0 ? DS.warn : DS.ink },
    { value: String(impact.swapsAccepted), label: "Swaps", color: impact.swapsAccepted > 0 ? DS.good : DS.ink },
  ];

  return (
    <div style={{
      background: DS.card, borderRadius: 18, padding: "14px 6px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
      marginBottom: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {stats.map((s, i) => (
          <div key={s.label} style={{ flex: 1, textAlign: "center", position: "relative" }}>
            {i > 0 && (
              <div style={{
                position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                width: 1, height: 26, background: DS.hair,
              }} />
            )}
            <div style={{
              fontSize: 22, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1,
              color: s.color, fontVariantNumeric: "tabular-nums",
            }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: DS.muted, marginTop: 5 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {impact.co2SavedKg > 0 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          marginTop: 12, paddingTop: 12, borderTop: `1px solid ${DS.hair}`,
          fontSize: 12, color: DS.ink,
        }}>
          <TrendingDown style={{ width: 14, height: 14, color: DS.good }} />
          <strong style={{ fontWeight: 800 }}>{impact.co2SavedKg} kg CO₂</strong>
          <span style={{ color: DS.muted }}>avoided through swaps</span>
        </div>
      )}
    </div>
  );
}

// ── Cart pill (links to dedicated /basket page) ──

function CartPill({ basket }: { basket: BasketItem[] }) {
  const report = useMemo(() => getBasketEthicsReport(basket), [basket]);
  if (basket.length === 0) return null;

  const grade = report.scoredCount > 0 ? report.overallGrade.toLowerCase() : null;
  const gColor = grade ? (GRADE_COLOR[grade] ?? DS.muted) : DS.muted;

  return (
    <Link to="/basket" style={{
      display: "flex", alignItems: "center", gap: 12,
      background: DS.card, borderRadius: 16, padding: "13px 14px",
      textDecoration: "none", color: DS.ink, marginBottom: 10,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 12, background: DS.goodBg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <ShoppingCart style={{ width: 18, height: 18, color: DS.good }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.2 }}>Your cart</div>
        <div style={{ fontSize: 12, color: DS.muted, marginTop: 2 }}>
          {basket.length} item{basket.length !== 1 ? "s" : ""}
          {report.laborFlagCount > 0 && ` · ${report.laborFlagCount} flagged`}
        </div>
      </div>
      {grade && (
        <div style={{
          padding: "4px 10px", borderRadius: 999,
          background: alpha(gColor, 14), color: gColor,
          fontSize: 12, fontWeight: 800, letterSpacing: 0.2,
        }}>
          Grade {grade.toUpperCase()}
        </div>
      )}
      <ChevronRight style={{ width: 18, height: 18, color: DS.muted, flexShrink: 0 }} />
    </Link>
  );
}

// ── Quick action chips ──

function QuickActions({ watchlistCount }: { watchlistCount: number }) {
  const actions = [
    { to: "/watchlist", icon: Eye, label: "Watchlist", badge: watchlistCount },
    { to: "/compare", icon: GitCompareArrows, label: "Compare" },
    { to: "/receipts", icon: Receipt, label: "Receipts" },
    { to: "/submit-flag", icon: Flag, label: "Flag" },
  ];
  return (
    <div style={{
      display: "flex", gap: 8, overflowX: "auto", marginBottom: 20,
      paddingBottom: 2, scrollbarWidth: "none",
    }}>
      {actions.map(({ to, icon: Icon, label, badge }) => (
        <Link key={to} to={to} style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "9px 14px", borderRadius: 999,
          background: DS.card, color: DS.ink, textDecoration: "none",
          fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.04)",
        }}>
          <Icon style={{ width: 15, height: 15, color: DS.muted }} />
          {label}
          {badge != null && badge > 0 && (
            <span style={{
              background: DS.ink, color: DS.card,
              fontSize: 10, fontWeight: 800,
              minWidth: 16, height: 16, borderRadius: 999,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              padding: "0 4px", fontVariantNumeric: "tabular-nums",
            }}>
              {badge}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

// ── Main ──

export default function Dashboard() {
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [impact, setImpact] = useState<MonthlyImpact>(() => computeMonthlyImpact());
  const [watchlistCount, setWatchlistCount] = useState<number>(() => loadWatchlist().length);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setHistory(loadScanHistory());
      setBasket(loadBasket());
      setImpact(computeMonthlyImpact());
      setWatchlistCount(loadWatchlist().length);
    };
    refresh();
    window.addEventListener("scanHistoryUpdated", refresh);
    window.addEventListener("basketUpdated", refresh);
    window.addEventListener(WATCHLIST_EVENT, refresh);
    window.addEventListener(SWAP_EVENT, refresh);
    return () => {
      window.removeEventListener("scanHistoryUpdated", refresh);
      window.removeEventListener("basketUpdated", refresh);
      window.removeEventListener(WATCHLIST_EVENT, refresh);
      window.removeEventListener(SWAP_EVENT, refresh);
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

  // Group consecutive entries by day label
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

  const hasHistory = history.length > 0;

  return (
    <div style={{ minHeight: "100dvh", background: DS.bg, fontFamily: DS.font, color: DS.ink }}>
      {/* Header */}
      <div style={{ padding: "0 20px", paddingTop: "max(56px, calc(env(safe-area-inset-top, 0px) + 14px))" }}>
        <div style={{
          maxWidth: 640, margin: "0 auto",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          marginBottom: 18,
        }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: -0.8 }}>History</h1>
            <p style={{ fontSize: 13.5, color: DS.muted, margin: "4px 0 0" }}>
              {hasHistory
                ? `${history.length} product${history.length !== 1 ? "s" : ""} scanned`
                : "Everything you scan lands here"}
            </p>
          </div>
          {hasHistory && (
            <button
              onClick={() => setShowClearConfirm(true)}
              aria-label="Clear history"
              style={{
                width: 38, height: 38, borderRadius: 12, marginTop: 2,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                color: DS.muted, background: DS.card, border: "none", cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.04)",
                flexShrink: 0,
              }}
            >
              <Trash2 style={{ width: 17, height: 17 }} />
            </button>
          )}
        </div>
      </div>

      <main style={{ padding: "0 20px", paddingBottom: 120 }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>

          {/* Clear confirmation */}
          {showClearConfirm && (
            <div style={{
              background: DS.card, borderRadius: 16, padding: "14px 16px", marginBottom: 14,
              boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>Clear all history?</div>
              <div style={{ fontSize: 12.5, color: DS.muted, marginBottom: 12 }}>
                This permanently removes your {history.length} scanned product{history.length !== 1 ? "s" : ""}.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleClear} style={{
                  flex: 1, padding: "10px 16px", borderRadius: 11, background: DS.bad, color: "#fff",
                  fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
                }}>Clear</button>
                <button onClick={() => setShowClearConfirm(false)} style={{
                  flex: 1, padding: "10px 16px", borderRadius: 11, background: DS.bg, color: DS.ink,
                  fontSize: 13, fontWeight: 600, border: `1px solid ${DS.hair}`, cursor: "pointer",
                }}>Cancel</button>
              </div>
            </div>
          )}

          {!hasHistory && basket.length === 0 ? (
            /* Empty state */
            <div style={{
              background: DS.card, borderRadius: 20, padding: "52px 24px", textAlign: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: 18, background: DS.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 18px",
              }}>
                <ShoppingBag style={{ width: 28, height: 28, color: DS.muted }} />
              </div>
              <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 8 }}>No scans yet</h2>
              <p style={{ fontSize: 14, color: DS.muted, maxWidth: 250, margin: "0 auto 24px", lineHeight: 1.45 }}>
                Scan a product to see its ethics rating and start building your history.
              </p>
              <Link to="/scan" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "13px 26px", borderRadius: 14, fontWeight: 700, fontSize: 14.5,
                background: DS.ink, color: DS.card, textDecoration: "none",
              }}>
                <ScanLine style={{ width: 17, height: 17 }} />
                Start scanning
              </Link>
            </div>
          ) : (
            <>
              {/* Compact summary */}
              <SummaryBar impact={impact} />
              <CartPill basket={basket} />
              <QuickActions watchlistCount={watchlistCount} />

              {hasHistory && (
                <>
                  {/* Search */}
                  <div style={{ position: "relative", marginBottom: 12 }}>
                    <Search size={17} style={{
                      position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                      color: DS.muted, pointerEvents: "none",
                    }} />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search your scans..."
                      style={{
                        width: "100%", height: 46, boxSizing: "border-box",
                        paddingLeft: 42, paddingRight: 14,
                        borderRadius: 14, border: "none",
                        background: DS.card, color: DS.ink,
                        fontSize: 15, outline: "none",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
                        fontFamily: DS.font,
                      }}
                    />
                  </div>

                  {/* Segmented filter */}
                  <div style={{
                    display: "flex", gap: 4, padding: 4, marginBottom: 18,
                    background: DS.card, borderRadius: 13,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
                  }}>
                    {FILTERS.map((f) => {
                      const active = filter === f.key;
                      return (
                        <button
                          key={f.key}
                          onClick={() => setFilter(f.key)}
                          style={{
                            flex: 1, padding: "8px 0", borderRadius: 10,
                            fontSize: 13, fontWeight: 700,
                            border: "none", cursor: "pointer",
                            background: active ? DS.ink : "transparent",
                            color: active ? DS.card : DS.muted,
                            transition: "color 0.15s, background 0.15s",
                          }}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Day-grouped list */}
                  {filtered.length === 0 ? (
                    <div style={{
                      textAlign: "center", padding: "40px 20px",
                      fontSize: 14, color: DS.muted,
                    }}>
                      No scans match{search.trim() ? ` "${search.trim()}"` : " this filter"}.
                    </div>
                  ) : (
                    grouped.map((group) => (
                      <div key={group.label} style={{ marginBottom: 18 }}>
                        <div style={{
                          fontSize: 12, fontWeight: 700, color: DS.muted,
                          textTransform: "uppercase", letterSpacing: "0.05em",
                          padding: "0 4px 8px",
                        }}>
                          {group.label}
                        </div>
                        <div style={{
                          background: DS.card, borderRadius: 16, overflow: "hidden",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
                        }}>
                          {group.items.map((entry, i) => (
                            <Link
                              key={entry.id}
                              to={`/product-off/${entry.barcode}`}
                              style={{
                                display: "flex", alignItems: "center", gap: 12,
                                padding: "12px 14px", textDecoration: "none", color: DS.ink,
                                borderTop: i > 0 ? `1px solid ${DS.hair}` : undefined,
                              }}
                            >
                              <ScoreBadge entry={entry} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                  fontSize: 15, fontWeight: 600, margin: 0,
                                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                }}>
                                  {entry.productName || "Unknown product"}
                                </p>
                                <p style={{
                                  fontSize: 12.5, color: DS.muted, margin: "2px 0 0",
                                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                }}>
                                  {entry.brand || "Unknown brand"} · {formatTime(entry.timestamp)}
                                </p>
                              </div>
                              <ChevronRight style={{ width: 18, height: 18, color: DS.muted, flexShrink: 0 }} />
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
