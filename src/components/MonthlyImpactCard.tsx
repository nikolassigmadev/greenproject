import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ScanLine, TrendingDown, Eye, GitCompareArrows } from "lucide-react";
import { DS } from "@/styles/design-tokens";
import { computeMonthlyImpact, type MonthlyImpact } from "@/utils/impactStats";
import { WATCHLIST_EVENT, loadWatchlist } from "@/utils/watchlist";
import { SWAP_EVENT } from "@/utils/swapTracking";

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div style={{
      background: DS.bg, borderRadius: 14, padding: "14px 12px", textAlign: "center", flex: 1, minWidth: 0,
    }}>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, color, lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: DS.muted, marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

export function MonthlyImpactCard() {
  const [impact, setImpact] = useState<MonthlyImpact>(() => computeMonthlyImpact());
  const [watchlistCount, setWatchlistCount] = useState<number>(() => loadWatchlist().length);

  useEffect(() => {
    const recompute = () => {
      setImpact(computeMonthlyImpact());
      setWatchlistCount(loadWatchlist().length);
    };
    window.addEventListener("scanHistoryUpdated", recompute);
    window.addEventListener(WATCHLIST_EVENT, recompute);
    window.addEventListener(SWAP_EVENT, recompute);
    return () => {
      window.removeEventListener("scanHistoryUpdated", recompute);
      window.removeEventListener(WATCHLIST_EVENT, recompute);
      window.removeEventListener(SWAP_EVENT, recompute);
    };
  }, []);

  const empty = impact.scanCount === 0;

  return (
    <div style={{
      background: DS.card, borderRadius: 20, padding: "20px 18px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
      marginBottom: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12, background: DS.goodBg,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <ScanLine style={{ width: 18, height: 18, color: DS.good }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: DS.ink }}>This month</div>
          <div style={{ fontSize: 12, color: DS.muted }}>
            {empty
              ? "Scan a product to start tracking your impact"
              : `${impact.scanCount} scan${impact.scanCount === 1 ? "" : "s"} · last ${impact.windowDays} days`}
          </div>
        </div>
      </div>

      {!empty && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <Stat
              value={String(impact.scanCount)}
              label="Products scanned"
              color={DS.ink}
            />
            <Stat
              value={String(impact.flaggedBrandCount)}
              label="Flagged brands"
              color={impact.flaggedBrandCount > 0 ? DS.warn : DS.muted}
            />
            <Stat
              value={String(impact.swapsAccepted)}
              label="Swaps accepted"
              color={impact.swapsAccepted > 0 ? DS.good : DS.muted}
            />
          </div>

          {impact.co2SavedKg > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: DS.goodBg, borderRadius: 12, padding: "10px 14px", marginBottom: 14,
            }}>
              <TrendingDown style={{ width: 16, height: 16, color: DS.good, flexShrink: 0 }} />
              <div style={{ fontSize: 12.5, color: DS.ink }}>
                <strong style={{ fontWeight: 800 }}>{impact.co2SavedKg} kg CO2</strong> avoided through accepted swaps
              </div>
            </div>
          )}

          {impact.topBrands.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: DS.muted,
                letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8,
              }}>
                Top brands scanned
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {impact.topBrands.map((b) => (
                  <span key={b.brand} style={{
                    fontSize: 12, fontWeight: 600, color: DS.ink,
                    background: DS.bg, padding: "5px 10px", borderRadius: 999,
                    border: `1px solid ${DS.hair}`,
                  }}>
                    {b.brand} <span style={{ color: DS.muted, marginLeft: 4 }}>{b.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: empty ? 4 : 12 }}>
        <Link to="/watchlist" style={linkBtn(DS.ink)}>
          <Eye style={{ width: 14, height: 14 }} />
          Watchlist
          {watchlistCount > 0 && (
            <span style={countPill}>{watchlistCount}</span>
          )}
        </Link>
        <Link to="/compare" style={linkBtn(DS.ink)}>
          <GitCompareArrows style={{ width: 14, height: 14 }} />
          Compare
        </Link>
      </div>
    </div>
  );
}

function linkBtn(color: string): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: DS.bg, color,
    padding: "10px 14px", borderRadius: 12,
    fontSize: 13, fontWeight: 700,
    textDecoration: "none",
    border: `1px solid ${DS.hair}`,
    flex: 1, justifyContent: "center",
  };
}

const countPill: React.CSSProperties = {
  background: DS.ink, color: DS.card,
  fontSize: 10, fontWeight: 800,
  padding: "2px 7px", borderRadius: 999, marginLeft: 4,
};
