import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CalAIButton } from "@/components/CalAIButton";
import { loadPriorities, savePriorities, DEFAULT_PRIORITIES, type UserPriorities } from "@/utils/userPreferences";
import { Leaf, Users, Heart, Apple, RotateCcw, Check } from "lucide-react";

const priorityConfig = [
  {
    key: "laborRights" as keyof UserPriorities,
    label: "Labor & Human Rights",
    description: "Child labor, forced labor, fair wages, worker safety",
    icon: Users,
    color: "hsl(0 70% 50%)",
    bgColor: "hsl(0 50% 97%)",
  },
  {
    key: "environment" as keyof UserPriorities,
    label: "Environmental Impact",
    description: "Carbon footprint, eco-score, packaging, sustainability",
    icon: Leaf,
    color: "hsl(152 45% 30%)",
    bgColor: "hsl(142 40% 96%)",
  },
  {
    key: "animalWelfare" as keyof UserPriorities,
    label: "Animal Welfare",
    description: "Factory farming, animal testing, cruelty-free practices",
    icon: Heart,
    color: "hsl(280 60% 50%)",
    bgColor: "hsl(280 40% 97%)",
  },
  {
    key: "nutrition" as keyof UserPriorities,
    label: "Nutrition & Health",
    description: "Nutri-score, processing level, additives",
    icon: Apple,
    color: "hsl(45 93% 40%)",
    bgColor: "hsl(45 60% 96%)",
  },
];

export default function Preferences() {
  const navigate = useNavigate();
  const [priorities, setPriorities] = useState<UserPriorities>(DEFAULT_PRIORITIES);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPriorities(loadPriorities());
  }, []);

  const handleChange = (key: keyof UserPriorities, value: number) => {
    const updated = { ...priorities, [key]: value };
    setPriorities(updated);
    setSaved(false);
  };

  const handleSave = () => {
    savePriorities(priorities);
    setSaved(true);
    setTimeout(() => navigate('/scan', { state: { prioritiesJustSaved: true } }), 600);
  };

  const handleReset = () => {
    setPriorities({ ...DEFAULT_PRIORITIES });
    setSaved(false);
  };

  const getWeightLabel = (value: number) => {
    if (value >= 80) return "Critical";
    if (value >= 60) return "High";
    if (value >= 40) return "Moderate";
    if (value >= 20) return "Low";
    return "Minimal";
  };

  const getWeightColor = (value: number) => {
    if (value >= 80) return "hsl(0 70% 50%)";
    if (value >= 60) return "hsl(25 80% 50%)";
    if (value >= 40) return "hsl(45 93% 47%)";
    if (value >= 20) return "hsl(152 45% 40%)";
    return "hsl(150 10% 55%)";
  };

  return (
    <div style={{ backgroundColor: "hsl(40 33% 95%)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <main style={{ flex: 1, paddingTop: "2rem", paddingBottom: "2rem" }}>
        <div style={{ maxWidth: "40rem", margin: "0 auto", padding: "0 1rem" }}>
          {/* Page Title */}
          <div style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "hsl(150 20% 15%)", marginBottom: "0.5rem" }}>
              ⚙️ My Priorities
            </h1>
            <p style={{ color: "hsl(150 10% 45%)", lineHeight: "1.6" }}>
              Tell us what matters most to you. We'll adjust product verdicts based on your values.
              Slide each priority to reflect how important it is in your purchasing decisions.
            </p>
          </div>

          {/* Priority Sliders */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2rem" }}>
            {priorityConfig.map((config) => {
              const value = priorities[config.key];
              const Icon = config.icon;
              return (
                <div
                  key={config.key}
                  style={{
                    backgroundColor: "hsl(40 30% 98%)",
                    borderRadius: "0.75rem",
                    padding: "1.5rem",
                    border: `1px solid ${value >= 60 ? config.color : "hsl(40 20% 85%)"}`,
                    transition: "border-color 0.3s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div style={{
                      width: "2.5rem",
                      height: "2.5rem",
                      borderRadius: "0.5rem",
                      backgroundColor: config.bgColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <Icon size={18} style={{ color: config.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontWeight: "600", color: "hsl(150 20% 15%)", fontSize: "1rem" }}>
                        {config.label}
                      </h3>
                      <p style={{ fontSize: "0.8rem", color: "hsl(150 10% 45%)" }}>
                        {config.description}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        color: getWeightColor(value),
                        padding: "0.2rem 0.6rem",
                        borderRadius: "9999px",
                        backgroundColor: `${getWeightColor(value)}15`,
                      }}>
                        {getWeightLabel(value)}
                      </span>
                    </div>
                  </div>

                  {/* Slider */}
                  <div style={{ position: "relative" }}>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={value}
                      onChange={(e) => handleChange(config.key, parseInt(e.target.value))}
                      style={{
                        width: "100%",
                        height: "6px",
                        borderRadius: "3px",
                        appearance: "none",
                        WebkitAppearance: "none",
                        background: `linear-gradient(to right, ${config.color} 0%, ${config.color} ${value}%, hsl(40 20% 85%) ${value}%, hsl(40 20% 85%) 100%)`,
                        outline: "none",
                        cursor: "pointer",
                        accentColor: config.color,
                      }}
                    />
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "0.25rem",
                    }}>
                      <span style={{ fontSize: "0.7rem", color: "hsl(150 10% 55%)" }}>Don't care</span>
                      <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: config.color }}>{value}%</span>
                      <span style={{ fontSize: "0.7rem", color: "hsl(150 10% 55%)" }}>Top priority</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* How it works */}
          <div style={{
            backgroundColor: "hsl(142 40% 96%)",
            borderRadius: "0.75rem",
            padding: "1.5rem",
            marginBottom: "2rem",
            border: "1px solid hsl(152 30% 80%)",
          }}>
            <h3 style={{ fontWeight: "bold", color: "hsl(150 20% 15%)", marginBottom: "0.75rem" }}>
              💡 How Priorities Work
            </h3>
            <ul style={{ color: "hsl(150 10% 35%)", fontSize: "0.9rem", lineHeight: "1.8", paddingLeft: "1.25rem" }}>
              <li>When a priority is set to <strong>Critical</strong> (80+), even minor concerns in that area will heavily downgrade a product's verdict.</li>
              <li>At <strong>Moderate</strong> (40-60), the default balanced scoring is used.</li>
              <li>At <strong>Minimal</strong> (0-20), that factor has very little influence on the overall verdict.</li>
              <li>Your priorities are saved locally and apply to all future product scans.</li>
            </ul>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <CalAIButton emoji={saved ? "✅" : "💾"} onClick={handleSave}>
              {saved ? "Saved!" : "Save Priorities"}
            </CalAIButton>
            <button
              onClick={handleReset}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                border: "1px solid hsl(40 20% 85%)",
                backgroundColor: "hsl(40 30% 98%)",
                color: "hsl(150 10% 45%)",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: "500",
              }}
            >
              <RotateCcw size={16} /> Reset to Default
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
