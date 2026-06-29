import { useState, useEffect, useMemo } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  loadPriorities, savePriorities, summarizePriorities, DEFAULT_PRIORITIES, type UserPriorities,
} from "@/utils/userPreferences";
import { Leaf, Users, Heart, RotateCcw, Check, Sparkles } from "lucide-react";
import { DS } from "@/styles/design-tokens";
import { RegionPicker } from "@/components/RegionPicker";
import { WatchlistEditor } from "@/components/WatchlistEditor";
import { toast } from "sonner";

// Three discrete weights (0–100). The label + effect line do the explaining so
// users understand what each setting actually does to a verdict.
const LEVELS = [
  { value: 25,  label: "Low",      effect: "A small nudge on the verdict" },
  { value: 50,  label: "Medium",   effect: "Counted the usual amount" },
  { value: 100, label: "Critical", effect: "Strongly drives the final verdict" },
] as const;

const levelIndex = (v: number): number => {
  if (v <= 37) return 0;
  if (v <= 62) return 1;
  return 2;
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
    color: DS.warn,
    bgColor: DS.warnBg,
  },
  // Nutrition is no longer user-tunable here; it stays at its Medium default
  // (DEFAULT_PRIORITIES.nutrition = 50) and still feeds the nutri-score measure.
];

// ── Single compact value row: icon + label + 3-level segmented control ──

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
      <div style={{
        display: "flex", gap: 3, padding: 3, background: DS.bg, borderRadius: 11,
        // The track tone is almost identical to the cream card, so outline it
        // with a hairline + soft shadow to keep each selector from blending in.
        border: `1px solid ${DS.hair}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.07), inset 0 1px 1px rgba(0,0,0,0.03)",
      }}>
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
  const [priorities, setPriorities] = useState<UserPriorities>(DEFAULT_PRIORITIES);

  useEffect(() => {
    setPriorities(loadPriorities());
    const handler = () => setPriorities(loadPriorities());
    window.addEventListener("prioritiesUpdated", handler);
    return () => window.removeEventListener("prioritiesUpdated", handler);
  }, []);

  const handleChange = (key: keyof UserPriorities, value: number) => {
    const updated = { ...priorities, [key]: value };
    // Priorities have to mean something relative to each other — so the three
    // tunable values can't all sit on the same level (no all-Low / all-Medium /
    // all-Critical). Reject a change that would flatten them and explain why.
    const levels = priorityConfig.map((c) => levelIndex(updated[c.key]));
    if (levels.every((l) => l === levels[0])) {
      toast.warning("Your values can't all be the same", {
        description: "Keep at least one ahead of the others so scoring has something to weigh.",
        position: "top-center",
      });
      return;
    }
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

  const impactSummary = useMemo(() => summarizePriorities(priorities), [priorities]);

  return (
    <div style={{ background: DS.bg, minHeight: "100dvh", fontFamily: DS.font, color: DS.ink }}>
      <main style={{ paddingBottom: 110 }}>

        {/* Header — roomy large-title block. */}
        <div style={{ padding: "max(56px, calc(env(safe-area-inset-top, 0px) + 16px)) 20px 20px" }}>
          <div>
            <p style={{
              fontSize: 11, fontWeight: 800, color: DS.muted,
              letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 6px",
            }}>
              My Values
            </p>
            <h1 style={{
              fontSize: "1.7rem", fontWeight: 800, color: DS.ink,
              letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 8px",
            }}>
              What matters to you?
            </h1>
            <p style={{ fontSize: 13.5, color: DS.muted, lineHeight: 1.5, margin: 0 }}>
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

          {/* Live impact summary — explains what these settings do to a verdict */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            background: DS.goodBg, borderRadius: 14, padding: "12px 14px",
          }}>
            <Sparkles size={15} style={{ color: DS.good, flexShrink: 0, marginTop: 1 }} strokeWidth={2.2} />
            <p style={{ fontSize: 12.5, color: DS.ink, lineHeight: 1.5, margin: 0 }}>
              {impactSummary}
            </p>
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

          {/* ── Brands — a personal avoid/trust list that moves scores ── */}
          <p style={{
            fontSize: 11, fontWeight: 800, color: DS.muted,
            letterSpacing: "0.08em", textTransform: "uppercase",
            margin: "8px 2px 0",
          }}>
            Brands
          </p>
          <WatchlistEditor />

          {/* ── Settings (appearance + location) — separate from values ── */}
          <p style={{
            fontSize: 11, fontWeight: 800, color: DS.muted,
            letterSpacing: "0.08em", textTransform: "uppercase",
            margin: "8px 2px 0",
          }}>
            Settings
          </p>

          {/* Location — powers region-aware swap suggestions */}
          <RegionPicker
            onSaved={(r) => toast.success(`Location set to ${r.city ? `${r.city}, ` : ""}${r.country}`)}
          />

          {/* Appearance — below the location picker */}
          <div style={{
            background: DS.card, borderRadius: 18, padding: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: DS.ink, marginBottom: 2 }}>Appearance</div>
            <div style={{ fontSize: 11.5, color: DS.muted, marginBottom: 14 }}>Pick your theme</div>
            <ThemeToggle />
          </div>

        </div>
      </main>
    </div>
  );
}
