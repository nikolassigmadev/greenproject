import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { loadPriorities, savePriorities, DEFAULT_PRIORITIES, type UserPriorities } from "@/utils/userPreferences";
import { Leaf, Users, Heart, Apple, RotateCcw, Check } from "lucide-react";

const BLUE = "#2979FF";
const BG = "#F5F7FA";
const CARD = "#FFFFFF";
const BORDER = "#E5E7EB";
const TEXT = "#111827";
const TEXT_MUTED = "#6B7280";

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
    color: "#E53935",
    bgColor: "#FFF0F0",
  },
  {
    key: "environment" as keyof UserPriorities,
    label: "Environmental Impact",
    description: "Carbon footprint, eco-score, packaging, sustainability",
    icon: Leaf,
    color: "#2E7D32",
    bgColor: "#F0FAF1",
  },
  {
    key: "animalWelfare" as keyof UserPriorities,
    label: "Animal Welfare",
    description: "Factory farming, animal testing, cruelty-free practices",
    icon: Heart,
    color: "#7B1FA2",
    bgColor: "#F9F0FF",
  },
  {
    key: "nutrition" as keyof UserPriorities,
    label: "Nutrition & Health",
    description: "Nutri-score, processing level, additives",
    icon: Apple,
    color: "#E65100",
    bgColor: "#FFF6EE",
  },
];

export default function Preferences() {
  const navigate = useNavigate();
  const [priorities, setPriorities] = useState<UserPriorities>(DEFAULT_PRIORITIES);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPriorities(loadPriorities());
    const handler = () => setPriorities(loadPriorities());
    window.addEventListener("prioritiesUpdated", handler);
    return () => window.removeEventListener("prioritiesUpdated", handler);
  }, []);

  const handleChange = (key: keyof UserPriorities, value: number) => {
    setPriorities((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    savePriorities(priorities);
    setSaved(true);
    setTimeout(() => navigate("/scan", { state: { prioritiesJustSaved: true } }), 700);
  };

  const handleReset = () => {
    setPriorities({ ...DEFAULT_PRIORITIES });
    setSaved(false);
  };

  return (
    <div style={{ background: BG, minHeight: "100vh" }}>
      <main style={{ paddingBottom: "5.5rem" }}>

        {/* Header */}
        <div style={{
          background: CARD,
          borderBottom: `1px solid ${BORDER}`,
          padding: "max(52px, env(safe-area-inset-top)) 20px 18px",
        }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, color: TEXT_MUTED, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
            Preferences
          </p>
          <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: TEXT, letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: 6 }}>
            My Values
          </h1>
          <p style={{ fontSize: "0.85rem", color: TEXT_MUTED, lineHeight: 1.5 }}>
            Select what matters most. Every verdict will reflect your priorities.
          </p>
        </div>

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Priority cards */}
          {priorityConfig.map((config) => {
            const Icon = config.icon;
            const currentLevel = valueToLevel(priorities[config.key]);

            return (
              <div key={config.key} style={{
                background: CARD,
                borderRadius: 18,
                border: `1px solid ${BORDER}`,
                padding: 16,
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
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
                    <p style={{ fontSize: "0.9rem", fontWeight: 700, color: TEXT, marginBottom: 2 }}>
                      {config.label}
                    </p>
                    <p style={{ fontSize: "0.7rem", color: TEXT_MUTED, lineHeight: 1.4 }}>
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
                          border: isSelected ? "none" : `1px solid ${BORDER}`,
                          background: isSelected ? BLUE : "#F9FAFB",
                          color: isSelected ? "#fff" : TEXT_MUTED,
                          fontSize: "0.68rem",
                          fontWeight: isSelected ? 700 : 500,
                          cursor: "pointer",
                          textAlign: "center",
                          lineHeight: 1.2,
                          transition: "all 0.15s",
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

          {/* Info card */}
          <div style={{
            background: "#EBF2FF",
            borderRadius: 16,
            padding: "14px 16px",
            border: `1px solid #C3D6FF`,
          }}>
            <p style={{ fontSize: "0.8rem", fontWeight: 700, color: BLUE, marginBottom: 8 }}>How priorities work</p>
            {[
              "Critical — even minor concerns heavily downgrade a result",
              "Medium — balanced default scoring",
              "None — no influence on verdict",
              "Saved locally and applied to all future scans",
            ].map(t => (
              <div key={t} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: BLUE, marginTop: 6, flexShrink: 0 }} />
                <span style={{ fontSize: "0.72rem", color: "#374151", lineHeight: 1.5 }}>{t}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
            <button
              onClick={handleSave}
              style={{
                width: "100%", height: 52,
                background: saved ? "#00C853" : BLUE,
                border: "none", borderRadius: 16,
                color: "#fff", fontWeight: 800, fontSize: "0.95rem",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "background 0.2s",
              }}
            >
              {saved ? <><Check size={18} />Saved!</> : "Save My Values"}
            </button>
            <button
              onClick={handleReset}
              style={{
                width: "100%", height: 44,
                background: "#F9FAFB", border: `1px solid ${BORDER}`, borderRadius: 14,
                color: TEXT_MUTED, fontWeight: 600, fontSize: "0.85rem",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <RotateCcw size={14} /> Reset to defaults
            </button>
          </div>

        </div>
      </main>
      <BottomNav />
    </div>
  );
}
