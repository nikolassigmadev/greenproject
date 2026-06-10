import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { loadPriorities, savePriorities, DEFAULT_PRIORITIES, type UserPriorities } from "@/utils/userPreferences";
import { Leaf, Users, Heart, Apple } from "lucide-react";
import { DS } from "@/styles/design-tokens";

const LEVELS = [
  { label: "None",     value: 0   },
  { label: "Low",      value: 25  },
  { label: "Medium",   value: 50  },
  { label: "High",     value: 75  },
  { label: "Critical", value: 100 },
];

const valueToLevel = (v: number) => {
  if (v <= 12) return 0;
  if (v <= 37) return 25;
  if (v <= 62) return 50;
  if (v <= 87) return 75;
  return 100;
};

const priorityConfig = [
  {
    key: "laborRights" as keyof UserPriorities,
    label: "Labor & Human Rights",
    description: "Child labor, forced labor, fair wages, worker safety",
    icon: Users,
    color: DS.bad,
    bgColor: DS.badBg,
  },
  {
    key: "environment" as keyof UserPriorities,
    label: "Environmental Impact",
    description: "Carbon footprint, eco-score, packaging, sustainability",
    icon: Leaf,
    color: DS.good,
    bgColor: DS.goodBg,
  },
  {
    key: "animalWelfare" as keyof UserPriorities,
    label: "Animal Welfare",
    description: "Factory farming, animal testing, cruelty-free practices",
    icon: Heart,
    color: "#9B7AAE",
    bgColor: "var(--ds-animal-bg, #EAE0EF)",
  },
  {
    key: "nutrition" as keyof UserPriorities,
    label: "Nutrition & Health",
    description: "Nutri-score, processing level, additives",
    icon: Apple,
    color: DS.warn,
    bgColor: DS.warnBg,
  },
];

export default function Preferences() {
  const navigate = useNavigate();
  const [priorities, setPriorities] = useState<UserPriorities>(DEFAULT_PRIORITIES);

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

  return (
    <div style={{ background: DS.bg, minHeight: "100dvh", fontFamily: DS.font, color: DS.ink }}>
      <main style={{ paddingBottom: 100 }}>

        {/* Header */}
        <div style={{
          padding: "max(60px, calc(env(safe-area-inset-top, 0px) + 16px)) 20px 20px",
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: DS.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>
            Preferences
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: DS.ink, letterSpacing: "-0.025em", lineHeight: 1.1, margin: 0 }}>
              My Values
            </h1>
            <button
              onClick={() => { savePriorities(priorities); navigate("/scan"); }}
              style={{
                background: DS.ink,
                border: "none", borderRadius: DS.radius.sm,
                color: DS.card, fontWeight: 700, fontSize: "0.75rem",
                padding: "8px 14px",
                cursor: "pointer",
                fontFamily: DS.font,
                flexShrink: 0,
              }}
            >
              Continue to scan
            </button>
          </div>
          <p style={{ fontSize: "0.85rem", color: DS.muted, lineHeight: 1.5 }}>
            Select what matters most. Every verdict will reflect your priorities.
          </p>
        </div>

        <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Priority cards */}
          {priorityConfig.map((config) => {
            const Icon = config.icon;
            const currentLevel = valueToLevel(priorities[config.key]);

            return (
              <div key={config.key} style={{
                background: DS.card,
                borderRadius: DS.radius.md,
                padding: 16,
                boxShadow: "0 2px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
              }}>
                {/* Icon + title row */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 13,
                    background: config.bgColor,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon size={19} style={{ color: config.color }} strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.9rem", fontWeight: 700, color: DS.ink, marginBottom: 2 }}>
                      {config.label}
                    </p>
                    <p style={{ fontSize: "0.7rem", color: DS.muted, lineHeight: 1.4 }}>
                      {config.description}
                    </p>
                  </div>
                </div>

                {/* Level selector */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                  {LEVELS.map(level => {
                    const isSelected = currentLevel === level.value;
                    return (
                      <button
                        key={level.label}
                        onClick={() => handleChange(config.key, level.value)}
                        style={{
                          padding: "9px 4px",
                          borderRadius: 10,
                          border: isSelected ? "none" : `1px solid ${DS.hair}`,
                          background: isSelected ? DS.ink : DS.bg,
                          color: isSelected ? DS.card : DS.muted,
                          fontSize: "0.68rem",
                          fontWeight: isSelected ? 700 : 500,
                          cursor: "pointer",
                          textAlign: "center",
                          lineHeight: 1.2,
                          transition: "all 0.15s",
                          fontFamily: DS.font,
                        }}
                      >
                        {level.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Appearance card */}
          <div style={{
            background: DS.card,
            borderRadius: DS.radius.md,
            padding: 16,
            boxShadow: "0 2px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
          }}>
            <p style={{ fontSize: "0.9rem", fontWeight: 700, color: DS.ink, marginBottom: 4 }}>Appearance</p>
            <p style={{ fontSize: "0.72rem", color: DS.muted, lineHeight: 1.5, marginBottom: 14 }}>
              Choose your preferred theme
            </p>
            <ThemeToggle />
          </div>

          {/* Info card */}
          <div style={{
            background: DS.card,
            borderRadius: DS.radius.md,
            padding: "14px 16px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
          }}>
            <p style={{ fontSize: "0.8rem", fontWeight: 700, color: DS.ink, marginBottom: 8 }}>How priorities work</p>
            {[
              "Critical — even minor concerns heavily downgrade a result",
              "Medium — balanced default scoring",
              "None — no influence on verdict",
              "Changes are saved automatically and applied to all future scans",
            ].map(t => (
              <div key={t} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: DS.muted, marginTop: 6, flexShrink: 0 }} />
                <span style={{ fontSize: "0.72rem", color: DS.muted, lineHeight: 1.5 }}>{t}</span>
              </div>
            ))}
          </div>

        </div>
      </main>

    </div>
  );
}
