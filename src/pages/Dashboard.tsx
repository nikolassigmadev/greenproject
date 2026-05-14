import { useState, useEffect, useMemo } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Link } from "react-router-dom";
import {
  loadScanHistory,
  clearScanHistory,
  type ScanHistoryEntry,
} from "@/utils/userPreferences";
import { Search, ChevronRight, ShoppingBag, Trash2, AlertTriangle } from "lucide-react";
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
      fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0,
    }}>
      {Math.round(score)}
    </div>
  );
}

export default function Dashboard() {
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setHistory(loadScanHistory());
    const handler = () => setHistory(loadScanHistory());
    window.addEventListener("scanHistoryUpdated", handler);
    return () => window.removeEventListener("scanHistoryUpdated", handler);
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
                  padding: "6px 16px", borderRadius: 10, background: DS.bad, color: "#fff",
                  fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer",
                }}>Yes, Clear</button>
                <button onClick={() => setShowClearConfirm(false)} style={{
                  padding: "6px 16px", borderRadius: 10, background: DS.card, color: DS.muted,
                  fontSize: 12, fontWeight: 500, border: `1px solid ${DS.hair}`, cursor: "pointer",
                }}>Cancel</button>
              </div>
            </div>
          )}

          {history.length === 0 ? (
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
                background: DS.ink, color: "#fff", textDecoration: "none",
              }}>
                Start Scanning
              </Link>
            </div>
          ) : (
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
                        color: active ? "#fff" : DS.muted,
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
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
