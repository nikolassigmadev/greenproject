import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Receipt, Trash2, AlertTriangle, TrendingUp, Sparkles,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { DS } from "@/styles/design-tokens";
import {
  loadReceiptScans, clearReceiptScans, computeMonthlyReceiptStats,
  RECEIPT_EVENT, type ReceiptScan, type MonthlyReceiptStats,
} from "@/utils/receiptStorage";

const GRADE_COLOR: Record<string, string> = {
  a: DS.good, b: DS.good, c: DS.warn, d: DS.bad, e: DS.bad, unknown: DS.muted,
};

function GradeBar({ dist }: { dist: MonthlyReceiptStats["gradeDistribution"] }) {
  const total = Object.values(dist).reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  return (
    <div>
      <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginTop: 6 }}>
        {(Object.keys(dist) as Array<keyof typeof dist>).map((k) =>
          dist[k] > 0 ? (
            <div key={k} style={{
              flex: dist[k], background: GRADE_COLOR[k] ?? DS.muted,
            }} />
          ) : null,
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: DS.muted }}>
        {(Object.keys(dist) as Array<keyof typeof dist>).map((k) =>
          dist[k] > 0 ? (
            <span key={k} style={{ color: GRADE_COLOR[k] ?? DS.muted, fontWeight: 700 }}>
              {k.toUpperCase()} {dist[k]}
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
}

function MonthCard({ stats }: { stats: MonthlyReceiptStats }) {
  return (
    <div style={{
      background: DS.card, borderRadius: 18, padding: "18px 18px 16px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: 12,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: DS.ink, letterSpacing: -0.3 }}>
            {stats.monthLabel}
          </div>
          <div style={{ fontSize: 11.5, color: DS.muted, marginTop: 2 }}>
            {stats.receiptCount} receipt{stats.receiptCount === 1 ? "" : "s"} · {stats.itemCount} item{stats.itemCount === 1 ? "" : "s"}
          </div>
        </div>
        <div style={{
          fontSize: 24, fontWeight: 800, letterSpacing: -0.4,
          color: stats.ethicalSpendPct >= 80 ? DS.good : stats.ethicalSpendPct >= 50 ? DS.warn : DS.bad,
        }}>
          {stats.ethicalSpendPct}<span style={{ fontSize: 14, fontWeight: 600 }}>%</span>
        </div>
      </div>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: DS.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        Ethical spend share
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: DS.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Eco grade mix
        </div>
        <GradeBar dist={stats.gradeDistribution} />
      </div>

      {stats.flaggedItemCount > 0 && (
        <div style={{
          marginTop: 14, padding: "10px 12px", borderRadius: 12,
          background: DS.warnBg, display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <AlertTriangle style={{ width: 14, height: 14, color: DS.warn, flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 12, color: DS.ink, lineHeight: 1.4 }}>
            <strong style={{ fontWeight: 800 }}>{stats.flaggedItemCount}</strong> item
            {stats.flaggedItemCount === 1 ? "" : "s"} from flagged brands.
            {stats.flaggedBrands.length > 0 && (
              <span style={{ color: DS.muted, marginLeft: 4 }}>
                {stats.flaggedBrands.map((b) => `${b.brand}${b.count > 1 ? ` ×${b.count}` : ""}`).join(", ")}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReceiptAnalytics() {
  const [scans, setScans] = useState<ReceiptScan[]>(() => loadReceiptScans());
  const [showClear, setShowClear] = useState(false);

  useEffect(() => {
    const handler = () => setScans(loadReceiptScans());
    window.addEventListener(RECEIPT_EVENT, handler);
    return () => window.removeEventListener(RECEIPT_EVENT, handler);
  }, []);

  const months = useMemo(() => computeMonthlyReceiptStats(scans), [scans]);
  const totalItems = scans.reduce((s, x) => s + x.itemCount, 0);
  const totalFlagged = scans.reduce(
    (s, x) => s + x.items.filter((i) => i.flagged).length,
    0,
  );
  const overallEthical = totalItems > 0
    ? Math.round(((totalItems - totalFlagged) / totalItems) * 100)
    : 0;

  return (
    <div style={{
      background: DS.bg, minHeight: "100dvh", fontFamily: DS.font, color: DS.ink,
    }}>
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "0 20px 96px" }}>
        <header style={{
          display: "flex", alignItems: "center", gap: 16,
          paddingTop: "max(24px, calc(env(safe-area-inset-top, 0px) + 16px))",
          paddingBottom: 18,
        }}>
          <BackButton />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: -0.4,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Receipt style={{ width: 20, height: 20, color: DS.ink }} />
              Receipt analytics
            </h1>
            <p style={{ fontSize: 12.5, color: DS.muted, margin: "4px 0 0" }}>
              Your monthly ethical-spend breakdown
            </p>
          </div>
          {scans.length > 0 && (
            <button
              onClick={() => setShowClear(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 12px", borderRadius: 12, fontSize: 12, fontWeight: 600,
                color: DS.muted, background: DS.card, border: `1px solid ${DS.hair}`,
                cursor: "pointer", flexShrink: 0,
              }}
            >
              <Trash2 style={{ width: 13, height: 13 }} />
              Clear
            </button>
          )}
        </header>

        {showClear && (
          <div style={{
            background: DS.badBg, borderRadius: 14, padding: 14, marginBottom: 14,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: DS.bad, fontWeight: 600 }}>
              <AlertTriangle style={{ width: 14, height: 14 }} />
              Delete all receipt history?
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => { clearReceiptScans(); setScans([]); setShowClear(false); }}
                style={{
                  padding: "6px 14px", borderRadius: 10, background: DS.bad, color: DS.card,
                  fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer",
                }}>
                Yes, Clear
              </button>
              <button
                onClick={() => setShowClear(false)}
                style={{
                  padding: "6px 14px", borderRadius: 10, background: DS.card, color: DS.muted,
                  fontSize: 12, fontWeight: 500, border: `1px solid ${DS.hair}`, cursor: "pointer",
                }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {scans.length === 0 ? (
          <div style={{
            background: DS.card, borderRadius: 18, padding: "44px 24px", textAlign: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%", background: DS.bg,
              display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
            }}>
              <Receipt style={{ width: 24, height: 24, color: DS.muted }} />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 6px" }}>No receipts scanned yet</h2>
            <p style={{ fontSize: 13, color: DS.muted, margin: "0 0 16px", lineHeight: 1.5 }}>
              Scan a receipt and we'll show you the ethical breakdown over time.
            </p>
            <Link to="/scan" style={{
              display: "inline-block", padding: "10px 20px", borderRadius: 12,
              background: DS.ink, color: DS.card, textDecoration: "none",
              fontSize: 13, fontWeight: 700,
            }}>
              Scan a receipt
            </Link>
          </div>
        ) : (
          <>
            {/* All-time summary */}
            <div style={{
              background: DS.card, borderRadius: 18, padding: "18px 18px 16px", marginBottom: 16,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 12, background: DS.goodBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <TrendingUp style={{ width: 18, height: 18, color: DS.good }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>All-time</div>
                  <div style={{ fontSize: 12, color: DS.muted }}>
                    {scans.length} receipt{scans.length === 1 ? "" : "s"} · {totalItems} item{totalItems === 1 ? "" : "s"}
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <Stat value={`${overallEthical}%`} label="Ethical share" color={overallEthical >= 80 ? DS.good : overallEthical >= 50 ? DS.warn : DS.bad} />
                <Stat value={String(totalItems)} label="Items tracked" color={DS.ink} />
                <Stat value={String(totalFlagged)} label="Flagged items" color={totalFlagged > 0 ? DS.warn : DS.muted} />
              </div>
            </div>

            <div style={{
              fontSize: 11, fontWeight: 800, color: DS.muted,
              letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <Sparkles style={{ width: 12, height: 12 }} />
              Monthly breakdown
            </div>

            {months.map((m) => (
              <MonthCard key={m.monthKey} stats={m} />
            ))}
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div style={{
      background: DS.bg, borderRadius: 12, padding: "12px 8px", textAlign: "center",
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: -0.4, lineHeight: 1.05 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: DS.muted, marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}
