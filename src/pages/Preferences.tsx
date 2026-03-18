import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { loadPriorities, savePriorities, DEFAULT_PRIORITIES, type UserPriorities } from "@/utils/userPreferences";
import { Leaf, Users, Heart, Apple, RotateCcw, Check, Info } from "lucide-react";

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
    color: "hsl(152 48% 30%)",
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
    color: "hsl(38 88% 40%)",
    bgColor: "hsl(38 70% 96%)",
  },
];

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
  if (value >= 40) return "hsl(38 88% 44%)";
  if (value >= 20) return "hsl(152 48% 40%)";
  return "hsl(150 10% 55%)";
};

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
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pb-nav">
        {/* Hero header */}
        <div
          className="px-5 pt-10 pb-12 text-center"
          style={{ background: "var(--gradient-hero)" }}
        >
          <div className="max-w-lg mx-auto">
            <h1 className="text-2xl font-display font-extrabold tracking-tight mb-1.5" style={{ color: "#ffffff" }}>
              My Priorities
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
              Adjust the sliders to weight what matters most. Every product verdict adapts to your values.
            </p>
          </div>
        </div>

        <div className="px-5 -mt-5 relative z-10">
          <div className="max-w-lg mx-auto space-y-3">
            {/* Priority cards */}
            {priorityConfig.map((config) => {
              const value = priorities[config.key];
              const Icon = config.icon;
              const weightLabel = getWeightLabel(value);
              const weightColor = getWeightColor(value);
              const isHighPriority = value >= 60;

              return (
                <div
                  key={config.key}
                  className="bg-card rounded-2xl border shadow-soft p-4 transition-all duration-200"
                  style={{
                    borderColor: isHighPriority ? `${config.color}40` : "hsl(var(--border))",
                  }}
                >
                  {/* Header row */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: config.bgColor }}
                    >
                      <Icon className="w-5 h-5" style={{ color: config.color }} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-foreground leading-tight">{config.label}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{config.description}</p>
                    </div>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 tabular-nums"
                      style={{
                        color: weightColor,
                        backgroundColor: `${weightColor}14`,
                      }}
                    >
                      {weightLabel}
                    </span>
                  </div>

                  {/* Slider */}
                  <div className="space-y-1.5">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={value}
                      onChange={(e) => handleChange(config.key, parseInt(e.target.value))}
                      aria-label={`${config.label} priority: ${value}%`}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      style={{
                        background: `linear-gradient(to right, ${config.color} 0%, ${config.color} ${value}%, hsl(var(--muted)) ${value}%, hsl(var(--muted)) 100%)`,
                        accentColor: config.color,
                      }}
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground/70">Don't care</span>
                      <span className="text-xs font-bold tabular-nums" style={{ color: config.color }}>
                        {value}%
                      </span>
                      <span className="text-[10px] text-muted-foreground/70">Top priority</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* How priorities work */}
            <div className="bg-primary/6 border border-primary/20 rounded-2xl p-4">
              <div className="flex items-start gap-2.5 mb-3">
                <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <h3 className="text-sm font-bold text-foreground">How Priorities Work</h3>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed list-none">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 flex-shrink-0" />
                  <span><strong className="text-foreground">Critical (80+)</strong> — even minor concerns heavily downgrade a verdict</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 flex-shrink-0" />
                  <span><strong className="text-foreground">Moderate (40–60)</strong> — balanced default scoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 flex-shrink-0" />
                  <span><strong className="text-foreground">Minimal (0–20)</strong> — very little influence on the overall verdict</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 flex-shrink-0" />
                  <span>Priorities are saved locally and apply to all future scans</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-center pt-2 pb-2">
              <button
                onClick={handleSave}
                className="flex-1 max-w-[12rem] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-soft hover:bg-primary/90 hover:shadow-card transition-all duration-200 active:scale-[0.97]"
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  "Save Priorities"
                )}
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-border bg-card text-muted-foreground font-medium text-sm hover:text-foreground hover:border-border/80 transition-all duration-200"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
