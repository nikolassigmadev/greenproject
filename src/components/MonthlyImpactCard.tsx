import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ScanLine, TrendingDown, Eye, GitCompareArrows, Receipt, Flag, Share2 } from "lucide-react";
import { DS } from "@/styles/design-tokens";
import { computeMonthlyImpact, type MonthlyImpact } from "@/utils/impactStats";
import { WATCHLIST_EVENT, loadWatchlist } from "@/utils/watchlist";
import { SWAP_EVENT } from "@/utils/swapTracking";
import { shareImpactCard } from "@/utils/shareCard";
import { loadRegion, regionPlaceLabel } from "@/utils/userRegion";

function alpha(color: string, pct: number): string {
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

/** Inline stat — no bordered box, just number + label. Breathes better. */
function StatCell({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: 22, fontWeight: 800, letterSpacing: -0.5,
        color, lineHeight: 1, fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 10.5, fontWeight: 600, color: DS.muted,
        marginTop: 6, lineHeight: 1.2,
      }}>
        {label}
      </div>
    </div>
  );
}

/** OFF brand strings can be comma-chains. Show only the first one. */
function primaryBrand(brand: string): string {
  return brand.split(/[,;|/]/)[0].trim();
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
      background: DS.card, borderRadius: 20, padding: "18px 18px 16px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
      marginBottom: 10,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 11, background: DS.goodBg,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <ScanLine style={{ width: 17, height: 17, color: DS.good }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: DS.ink, lineHeight: 1.2 }}>
            This month
          </div>
          <div style={{ fontSize: 11.5, color: DS.muted, marginTop: 2 }}>
            {empty
              ? "Scan a product to start tracking your impact"
              : `${impact.scanCount} scan${impact.scanCount === 1 ? "" : "s"} · last ${impact.windowDays} days`}
          </div>
        </div>
        {!empty && (
          <button
            onClick={() => void shareImpactCard({
              co2SavedKg: impact.co2SavedKg,
              scanCount: impact.scanCount,
              swapsAccepted: impact.swapsAccepted,
              ethicalConcernsAvoided: impact.ethicalConcernsAvoided,
              windowLabel: "this month",
              regionLabel: regionPlaceLabel(loadRegion()),
            })}
            aria-label="Share my impact"
            style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: DS.bg, border: `1px solid ${DS.hair}`, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Share2 style={{ width: 15, height: 15, color: DS.muted }} />
          </button>
        )}
      </div>

      {!empty && (
        <>
          {/* Stat strip — no boxes, just numbers with vertical hair dividers */}
          <div style={{
            display: "flex", gap: 4,
            padding: "12px 14px",
            background: DS.bg, borderRadius: 14,
            marginBottom: 12,
          }}>
            <StatCell
              value={String(impact.scanCount)}
              label="Scanned"
              color={DS.ink}
            />
            <div style={{ width: 1, alignSelf: "stretch", background: DS.hair, margin: "0 6px" }} />
            <StatCell
              value={String(impact.flaggedBrandCount)}
              label="Flagged"
              color={impact.flaggedBrandCount > 0 ? DS.warn : DS.muted}
            />
            <div style={{ width: 1, alignSelf: "stretch", background: DS.hair, margin: "0 6px" }} />
            <StatCell
              value={String(impact.swapsAccepted)}
              label="Swaps"
              color={impact.swapsAccepted > 0 ? DS.good : DS.muted}
            />
            <div style={{ width: 1, alignSelf: "stretch", background: DS.hair, margin: "0 6px" }} />
            <StatCell
              value={String(impact.ethicalConcernsAvoided)}
              label="Flags avoided"
              color={impact.ethicalConcernsAvoided > 0 ? DS.warn : DS.muted}
            />
          </div>

          {/* CO2 saved row — only when non-zero */}
          {impact.co2SavedKg > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: alpha(DS.good, 10), borderRadius: 11,
              padding: "9px 12px", marginBottom: 12,
              fontSize: 12, color: DS.ink, lineHeight: 1.3,
            }}>
              <TrendingDown style={{ width: 14, height: 14, color: DS.good, flexShrink: 0 }} />
              <div>
                <strong style={{ fontWeight: 800 }}>{impact.co2SavedKg} kg CO2</strong> avoided through swaps
              </div>
            </div>
          )}

        </>
      )}

      {/* Action chips — 2×2 grid, lighter weight */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 6,
      }}>
        <ActionChip to="/watchlist" icon={<Eye style={{ width: 13, height: 13 }} />} label="Watchlist" badge={watchlistCount} />
        <ActionChip to="/compare" icon={<GitCompareArrows style={{ width: 13, height: 13 }} />} label="Compare" />
        <ActionChip to="/receipts" icon={<Receipt style={{ width: 13, height: 13 }} />} label="Receipts" />
        <ActionChip to="/submit-flag" icon={<Flag style={{ width: 13, height: 13 }} />} label="Flag" />
      </div>
    </div>
  );
}

function ActionChip({
  to, icon, label, badge,
}: {
  to: string; icon: React.ReactNode; label: string; badge?: number;
}) {
  return (
    <Link to={to} style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: "transparent", color: DS.ink,
      padding: "9px 12px", borderRadius: 10,
      fontSize: 12.5, fontWeight: 700,
      textDecoration: "none",
      border: `1px solid ${DS.hair}`,
      justifyContent: "center",
    }}>
      {icon}
      {label}
      {badge != null && badge > 0 && (
        <span style={{
          background: DS.ink, color: DS.card,
          fontSize: 10, fontWeight: 800,
          padding: "1px 6px", borderRadius: 999, marginLeft: 2,
          fontVariantNumeric: "tabular-nums",
        }}>
          {badge}
        </span>
      )}
    </Link>
  );
}
