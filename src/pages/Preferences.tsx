import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BackButton } from "@/components/BackButton";
import { useBottomNav } from "@/components/BottomNav";
import {
  loadPriorities, savePriorities, DEFAULT_PRIORITIES, type UserPriorities,
} from "@/utils/userPreferences";
import { Leaf, Users, Heart, ArrowRight, RotateCcw, Check } from "lucide-react";
import { DS } from "@/styles/design-tokens";
import { RegionPicker } from "@/components/RegionPicker";
import { toast } from "sonner";

// Five discrete weights (0–100). The label + effect line do the explaining so
// users understand what each setting actually does to a verdict.
const LEVELS = [
  { value: 0,   label: "None",     effect: "Left out of scoring entirely" },
  { value: 25,  label: "Low",      effect: "A small nudge on the verdict" },
  { value: 50,  label: "Medium",   effect: "Counted the usual amount" },
  { value: 75,  label: "High",     effect: "Can shift the verdict noticeably" },
  { value: 100, label: "Critical", effect: "Strongly drives the final verdict" },
] as const;

const levelIndex = (v: number): number => {
  if (v <= 12) return 0;
  if (v <= 37) return 1;
  if (v <= 62) return 2;
  if (v <= 87) return 3;
  return 4;
};

const priorityConfig = [
  {
    key: "laborRights" as keyof UserPriorities,
    label: "Labor & Human Rights",
    description: "Child & forced labor, fair wages, worker safety",
    icon: Users,
    color: DS.bad,
    bgColor: DS.badBg,
  },
  {
    key: "environment" as keyof UserPriorities,
    label: "Environmental Impact",
    description: "Carbon footprint, eco-score, packaging",
    icon: Leaf,
    color: DS.good,
    bgColor: DS.goodBg,
  },
  {
    key: "animalWelfare" as keyof UserPriorities,
    label: "Animal Welfare",
    description: "Factory farming, animal testing, cruelty",
    icon: Heart,
    color: "#9B7AAE",
    bgColor: "var(--ds-animal-bg, #EAE0EF)",
  },
  // Nutrition is no longer user-tunable here; it stays at its Medium default
  // (DEFAULT_PRIORITIES.nutrition = 50) and still feeds the nutri-score measure.
];

// ── Single compact value row: icon + label + 5-level segmented control ──

function ValueRow({
  config, value, onSelect, divider,
}: {
  config: (typeof priorityConfig)[number];
  value: number;
  onSelect: (v: number) => void;
  divider: boolean;
}) {
  const idx = levelIndex(value);
  const Icon = config.icon;

  return (
    <div style={{ padding: "14px 0", borderTop: divider ? `1px solid ${DS.hair}` : "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 11 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: config.bgColor,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon size={16} style={{ color: config.color }} strokeWidth={2} />
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: DS.ink, lineHeight: 1.2 }}>
          {config.label}
        </div>
      </div>

      {/* Segmented selector — single inset track, active pill in the category color */}
      <div style={{ display: "flex", gap: 3, padding: 3, background: DS.bg, borderRadius: 11 }}>
        {LEVELS.map((lvl, i) => {
          const active = i === idx;
          return (
            <button
              key={lvl.value}
              onClick={() => onSelect(lvl.value)}
              aria-pressed={active}
              style={{
                flex: 1, padding: "8px 2px", borderRadius: 8,
                border: "none", cursor: "pointer",
                background: active ? config.color : "transparent",
                color: active ? "#fff" : DS.muted,
                fontSize: 11, fontWeight: active ? 800 : 600,
                fontFamily: DS.font, letterSpacing: "-0.01em",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {lvl.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Preferences() {
  const navigate = useNavigate();
  const [priorities, setPriorities] = useState<UserPriorities>(DEFAULT_PRIORITIES);

  // Landing on the Values tab swaps the floating bottom nav for the primary
  // "Continue to scan" CTA: the footer slides away (its own hidden animation)
  // while the button animates up into its place, reading as one morph.
  const { setHidden: setBottomNavHidden } = useBottomNav();
  const [ctaIn, setCtaIn] = useState(false);
  useEffect(() => {
    setBottomNavHidden(true);
    // Wait one frame so the entrance transition runs from the hidden state.
    const raf = requestAnimationFrame(() => setCtaIn(true));
    return () => {
      cancelAnimationFrame(raf);
      setBottomNavHidden(false);
    };
  }, [setBottomNavHidden]);

  useEffect(() => {
    setPriorities(loadPriorities());
    const handler = () => setPriorities(loadPriorities());
    window.addEventListener("prioritiesUpdated", handler);
    return () => window.removeEventListener("prioritiesUpdated", handler);
  }, []);

  const handleChange = (key: keyof UserPriorities, value: number) => {
    const updated = { ...priorities, [key]: value };
    setPriorities(updated);
    savePriorities(updated);
  };

  const handleReset = () => {
    setPriorities(DEFAULT_PRIORITIES);
    savePriorities(DEFAULT_PRIORITIES);
  };

  const customized = useMemo(
    () => priorityConfig.some((c) => priorities[c.key] !== DEFAULT_PRIORITIES[c.key]),
    [priorities],
  );

  return (
    <div style={{ background: DS.bg, minHeight: "100dvh", fontFamily: DS.font, color: DS.ink }}>
      <main style={{ paddingBottom: 110 }}>

        {/* Header */}
        <div style={{
          padding: "max(56px, calc(env(safe-area-inset-top, 0px) + 16px)) 20px 18px",
          display: "flex", alignItems: "flex-start", gap: 14,
        }}>
          <BackButton />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 11, fontWeight: 800, color: DS.muted,
              letterSpacing: "0.08em", textTransform: "uppercase", margin: "2px 0 4px",
            }}>
              My Values
            </p>
            <h1 style={{
              fontSize: "1.7rem", fontWeight: 800, color: DS.ink,
              letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 6px",
            }}>
              What matters to you?
            </h1>
            <p style={{ fontSize: 13.5, color: DS.muted, lineHeight: 1.5 }}>
              Every scan is scored around what matters to you.
            </p>
          </div>
        </div>

        <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Values — one grouped card, compact rows */}
          <div style={{
            background: DS.card, borderRadius: 18, padding: "2px 16px 6px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
          }}>
            {priorityConfig.map((config, i) => (
              <ValueRow
                key={config.key}
                config={config}
                value={priorities[config.key]}
                onSelect={(v) => handleChange(config.key, v)}
                divider={i > 0}
              />
            ))}
          </div>

          {/* Saved hint + reset, on one compact line */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 2px", minHeight: 28,
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: DS.muted }}>
              <Check style={{ width: 13, height: 13, color: DS.good }} strokeWidth={3} />
              Saved automatically
            </span>
            {customized && (
              <button
                onClick={handleReset}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "transparent", border: `1px solid ${DS.hair}`,
                  borderRadius: 999, padding: "6px 12px",
                  fontSize: 12, fontWeight: 700, color: DS.muted,
                  cursor: "pointer", fontFamily: DS.font,
                }}
              >
                <RotateCcw style={{ width: 12, height: 12 }} />
                Reset
              </button>
            )}
          </div>

          {/* ── Settings (appearance + location) — separate from values ── */}
          <p style={{
            fontSize: 11, fontWeight: 800, color: DS.muted,
            letterSpacing: "0.08em", textTransform: "uppercase",
            margin: "8px 2px 0",
          }}>
            Settings
          </p>

          {/* Appearance */}
          <div style={{
            background: DS.card, borderRadius: 18, padding: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: DS.ink, marginBottom: 2 }}>Appearance</div>
            <div style={{ fontSize: 11.5, color: DS.muted, marginBottom: 14 }}>Pick your theme</div>
            <ThemeToggle />
          </div>

          {/* Location — powers region-aware swap suggestions */}
          <RegionPicker
            onSaved={(r) => toast.success(`Location set to ${r.city ? `${r.city}, ` : ""}${r.country}`)}
          />

        </div>
      </main>

      {/* Primary CTA — fixed where the bottom nav sits, so as the footer slides
          away on entry this button animates up into its place. */}
      <button
        onClick={() => navigate("/scan")}
        style={{
          position: "fixed",
          left: "50%",
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 22px)",
          transform: ctaIn
            ? "translateX(-50%) translateY(0)"
            : "translateX(-50%) translateY(16px)",
          opacity: ctaIn ? 1 : 0,
          transition:
            "transform 480ms cubic-bezier(0.32, 0.72, 0, 1) 120ms, opacity 320ms ease-out 120ms",
          zIndex: 9999,
          width: "calc(100% - 40px)", maxWidth: 380, height: 56,
          background: DS.ink, border: "none", borderRadius: 16,
          color: DS.card, fontWeight: 800, fontSize: "0.95rem",
          letterSpacing: "-0.01em", cursor: "pointer", fontFamily: DS.font,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: "0 10px 30px rgba(0,0,0,0.32), 0 2px 8px rgba(0,0,0,0.22)",
        }}
      >
        Continue to scan
        <ArrowRight size={18} strokeWidth={2.4} />
      </button>
    </div>
  );
}
