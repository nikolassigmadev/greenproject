import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Share2, ScanLine, GitCompareArrows, Leaf } from "lucide-react";
import { DS } from "@/styles/design-tokens";
import {
  isRecapDue, getWeeklyRecap, markRecapSeen, maybeNotifyRecap, type WeeklyRecap,
} from "@/utils/weeklyRecap";
import { shareImpactCard } from "@/utils/shareCard";

function alpha(color: string, pct: number): string {
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

function Stat({ icon, value, label, accent }: { icon: React.ReactNode; value: string; label: string; accent: string }) {
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{
        width: 38, height: 38, borderRadius: 12, margin: "0 auto 8px",
        background: alpha(accent, 12), color: accent,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: DS.ink, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: DS.muted, marginTop: 4 }}>{label}</div>
    </div>
  );
}

export function WeeklyRecapModal() {
  const [recap, setRecap] = useState<WeeklyRecap | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!isRecapDue()) return;
    const data = getWeeklyRecap();
    markRecapSeen();          // throttle: at most once per 7 days
    setRecap(data);
    void maybeNotifyRecap(data);
  }, []);

  if (!recap) return null;

  const close = () => setRecap(null);

  const handleShare = async () => {
    setSharing(true);
    try {
      await shareImpactCard({
        co2SavedKg: recap.co2SavedKg,
        scanCount: recap.scanCount,
        swapsAccepted: recap.swapsAccepted,
        windowLabel: "this week",
      });
    } finally {
      setSharing(false);
    }
  };

  // Portal to <body> so the overlay escapes the page-transition stacking context
  // (an opacity animation) and its z-index can actually sit above the BottomNav.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Your weekly impact recap"
      onClick={close}
      style={{
        // Above the fixed BottomNav (z-index 9999) so the sheet's action buttons
        // aren't covered by it — this is a full-screen modal with its own backdrop.
        position: "fixed", inset: 0, zIndex: 10000,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0 12px calc(env(safe-area-inset-bottom, 0px) + 12px)",
        fontFamily: DS.font,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 440,
          background: DS.card, borderRadius: 24,
          padding: "22px 20px 20px",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.25)",
          animation: "recapIn 0.32s cubic-bezier(0.32,0.72,0,1)",
        }}
      >
        <style>{`@keyframes recapIn { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`}</style>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: DS.good, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Your week 🌱
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: DS.ink, margin: "4px 0 0", letterSpacing: -0.5 }}>
              {recap.scanCount} product{recap.scanCount === 1 ? "" : "s"} scanned
            </h2>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            style={{
              width: 32, height: 32, borderRadius: 999, flexShrink: 0,
              background: DS.bg, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X style={{ width: 16, height: 16, color: DS.muted }} />
          </button>
        </div>

        <p style={{ fontSize: 13, color: DS.muted, margin: "8px 0 18px", lineHeight: 1.5 }}>
          {recap.swapsAccepted > 0
            ? `You chose ${recap.swapsAccepted} greener swap${recap.swapsAccepted === 1 ? "" : "s"} this week. Small choices add up.`
            : "Here's how your conscious shopping looked this week."}
        </p>

        {/* Stat strip */}
        <div style={{
          display: "flex", gap: 4, padding: "16px 8px",
          background: DS.bg, borderRadius: 16, marginBottom: 16,
        }}>
          <Stat icon={<ScanLine style={{ width: 18, height: 18 }} />} value={String(recap.scanCount)} label="Scanned" accent={DS.ink} />
          <div style={{ width: 1, alignSelf: "stretch", background: DS.hair }} />
          <Stat icon={<GitCompareArrows style={{ width: 18, height: 18 }} />} value={String(recap.swapsAccepted)} label="Swaps" accent={DS.good} />
          <div style={{ width: 1, alignSelf: "stretch", background: DS.hair }} />
          <Stat icon={<Leaf style={{ width: 18, height: 18 }} />} value={`${recap.co2SavedKg}kg`} label="CO₂ saved" accent={DS.good} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleShare}
            disabled={sharing}
            style={{
              flex: 1, height: 50, borderRadius: 14, border: "none",
              background: DS.good, color: "#fff",
              fontSize: 14.5, fontWeight: 800, cursor: sharing ? "default" : "pointer",
              fontFamily: DS.font, opacity: sharing ? 0.7 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <Share2 style={{ width: 17, height: 17 }} />
            {sharing ? "Preparing…" : "Share my week"}
          </button>
          <button
            onClick={close}
            style={{
              height: 50, padding: "0 20px", borderRadius: 14,
              background: DS.bg, color: DS.ink, border: `1px solid ${DS.hair}`,
              fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: DS.font,
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
