import { useEffect, useState } from "react";
import { Flame, Trophy, Check, Lock, Leaf, ScanLine, GitCompareArrows, Store } from "lucide-react";
import { DS } from "@/styles/design-tokens";
import { computeStreak, computeMilestones, type Milestone, type MilestoneMetric } from "@/utils/streaks";
import { SWAP_EVENT } from "@/utils/swapTracking";

function alpha(color: string, pct: number): string {
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

const METRIC_ICON: Record<MilestoneMetric, typeof Leaf> = {
  scans: ScanLine,
  swaps: GitCompareArrows,
  brands: Store,
  co2: Leaf,
};

function MilestoneBadge({ m }: { m: Milestone }) {
  const Icon = METRIC_ICON[m.metric];
  const accent = m.metric === "co2" || m.metric === "swaps" ? DS.good : DS.ink;
  return (
    <div style={{
      flexShrink: 0, width: 92,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      padding: "12px 6px", borderRadius: 14,
      background: m.achieved ? alpha(accent, 8) : DS.bg,
      border: `1px solid ${m.achieved ? alpha(accent, 22) : DS.hair}`,
      opacity: m.achieved ? 1 : 0.7,
    }}>
      <div style={{
        position: "relative",
        width: 38, height: 38, borderRadius: 12,
        background: m.achieved ? accent : DS.card,
        border: m.achieved ? "none" : `1px solid ${DS.hair}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon style={{ width: 18, height: 18, color: m.achieved ? DS.card : DS.muted }} />
        {m.achieved ? (
          <span style={{
            position: "absolute", top: -5, right: -5,
            width: 16, height: 16, borderRadius: 999, background: DS.good,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `2px solid ${DS.card}`,
          }}>
            <Check style={{ width: 9, height: 9, color: "#fff" }} strokeWidth={4} />
          </span>
        ) : (
          <span style={{
            position: "absolute", top: -5, right: -5,
            width: 16, height: 16, borderRadius: 999, background: DS.muted,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `2px solid ${DS.card}`,
          }}>
            <Lock style={{ width: 8, height: 8, color: "#fff" }} strokeWidth={3} />
          </span>
        )}
      </div>
      <span style={{
        fontSize: 10.5, fontWeight: 700, color: m.achieved ? DS.ink : DS.muted,
        textAlign: "center", lineHeight: 1.2,
      }}>
        {m.label}
      </span>
    </div>
  );
}

export function StreakMilestones() {
  const [streak, setStreak] = useState(() => computeStreak());
  const [summary, setSummary] = useState(() => computeMilestones());

  useEffect(() => {
    const refresh = () => {
      setStreak(computeStreak());
      setSummary(computeMilestones());
    };
    window.addEventListener("scanHistoryUpdated", refresh);
    window.addEventListener(SWAP_EVENT, refresh);
    return () => {
      window.removeEventListener("scanHistoryUpdated", refresh);
      window.removeEventListener(SWAP_EVENT, refresh);
    };
  }, []);

  // Nothing earned and no streak yet → keep the dashboard uncluttered.
  if (streak.current === 0 && summary.achievedCount === 0) return null;

  const { nextUp } = summary;
  // Show achieved first, then the next few locked ones for aspiration.
  const ordered = [...summary.milestones].sort(
    (a, b) => Number(b.achieved) - Number(a.achieved) || b.progress - a.progress,
  );

  return (
    <div style={{
      background: DS.card, borderRadius: 18, padding: "16px 16px 14px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
      marginBottom: 10,
    }}>
      {/* Streak header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: nextUp ? 12 : 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 13,
          background: streak.scannedToday ? alpha(DS.warn, 14) : DS.bg,
          border: `1px solid ${streak.scannedToday ? alpha(DS.warn, 28) : DS.hair}`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Flame style={{
            width: 22, height: 22,
            color: streak.current > 0 ? DS.warn : DS.muted,
          }} strokeWidth={2.2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: DS.ink, lineHeight: 1.15 }}>
            {streak.current > 0
              ? `${streak.current}-day streak`
              : "Start a streak"}
          </div>
          <div style={{ fontSize: 12, color: DS.muted, marginTop: 2 }}>
            {streak.scannedToday
              ? "Scanned today — nice 🔥"
              : streak.current > 0
                ? "Scan today to keep it going"
                : "Scan a product to begin"}
          </div>
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "5px 10px", borderRadius: 999,
          background: alpha(DS.good, 10), color: DS.good,
          fontSize: 12, fontWeight: 800, flexShrink: 0,
        }}>
          <Trophy style={{ width: 13, height: 13 }} />
          {summary.achievedCount}
        </div>
      </div>

      {/* Next milestone progress */}
      {nextUp && (
        <div style={{ marginBottom: 14 }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "baseline",
            fontSize: 11.5, marginBottom: 5,
          }}>
            <span style={{ color: DS.muted, fontWeight: 600 }}>Next: {nextUp.label}</span>
            <span style={{ color: DS.ink, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {Math.min(nextUp.value, nextUp.target)}/{nextUp.target}
            </span>
          </div>
          <div style={{ height: 7, borderRadius: 999, background: DS.bg, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 999, background: DS.good,
              width: `${Math.round(nextUp.progress * 100)}%`,
              transition: "width 0.4s ease-out",
            }} />
          </div>
        </div>
      )}

      {/* Badge row */}
      <div style={{
        display: "flex", gap: 8, overflowX: "auto",
        paddingBottom: 2, scrollbarWidth: "none",
      }}>
        {ordered.map((m) => <MilestoneBadge key={m.id} m={m} />)}
      </div>
    </div>
  );
}
