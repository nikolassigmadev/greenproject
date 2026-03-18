import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { Link } from "react-router-dom";
import {
  Camera, Leaf, Users, Heart, Apple,
  Settings, Globe, Shield, Search,
  ChevronRight, BarChart3, TrendingUp, Sparkles,
} from "lucide-react";

const CONTAINER = "w-full max-w-xl mx-auto px-5";

const analysisCategories = [
  {
    icon: Search,
    title: "AI Scan",
    desc: "Point your camera at any product label — GPT-4o reads it instantly",
    stat: "GPT-4o powered",
    statColor: "hsl(38 88% 40%)",
    statBg: "hsl(38 70% 96%)",
    gradientFrom: "hsl(38 88% 42%)",
    gradientTo: "hsl(40 88% 54%)",
    featured: true,
  },
  {
    icon: Globe,
    title: "Origin",
    desc: "Traces where ingredients and materials actually come from",
    stat: "Global coverage",
    statColor: "hsl(220 70% 46%)",
    statBg: "hsl(220 60% 96%)",
    gradientFrom: "hsl(220 68% 46%)",
    gradientTo: "hsl(215 72% 58%)",
  },
  {
    icon: Shield,
    title: "Labor",
    desc: "Flags forced & child labor linked to parent companies",
    stat: "10+ databases",
    statColor: "hsl(0 68% 46%)",
    statBg: "hsl(0 50% 97%)",
    gradientFrom: "hsl(0 68% 48%)",
    gradientTo: "hsl(8 72% 58%)",
  },
  {
    icon: Leaf,
    title: "Carbon",
    desc: "Full CO₂ lifecycle breakdown — agriculture to distribution",
    stat: "Per 100g precision",
    statColor: "hsl(152 48% 28%)",
    statBg: "hsl(152 42% 96%)",
    gradientFrom: "hsl(152 50% 28%)",
    gradientTo: "hsl(148 52% 40%)",
  },
  {
    icon: TrendingUp,
    title: "Alternatives",
    desc: "Surfaces greener swaps ranked by your priorities",
    stat: "Eco-score ranked",
    statColor: "hsl(280 52% 46%)",
    statBg: "hsl(280 40% 96%)",
    gradientFrom: "hsl(280 58% 48%)",
    gradientTo: "hsl(275 55% 60%)",
  },
  {
    icon: Heart,
    title: "Animal",
    desc: "BBFAW-rated welfare scores for brands and companies",
    stat: "BBFAW rated",
    statColor: "hsl(340 62% 46%)",
    statBg: "hsl(340 50% 97%)",
    gradientFrom: "hsl(340 62% 48%)",
    gradientTo: "hsl(350 65% 60%)",
  },
];

const steps = [
  {
    step: "01",
    icon: Camera,
    title: "Scan a Product",
    desc: "Photo, barcode, or search by name — AI reads labels instantly",
    colorBg: "hsl(152 42% 96%)",
    badgeColor: "hsl(152 45% 35%)",
    gradient: "from-[hsl(152_48%_28%)] to-[hsl(148_52%_38%)]",
  },
  {
    step: "02",
    icon: Settings,
    title: "Set Your Priorities",
    desc: "Personalise every result by weighting what matters to you",
    colorBg: "hsl(38 70% 96%)",
    badgeColor: "hsl(38 80% 38%)",
    gradient: "from-[hsl(38_88%_40%)] to-[hsl(40_85%_50%)]",
    pills: [
      { label: "Labor Rights", icon: Users, color: "hsl(0 70% 50%)" },
      { label: "Environment", icon: Leaf, color: "hsl(152 48% 30%)" },
      { label: "Animal", icon: Heart, color: "hsl(280 60% 50%)" },
      { label: "Nutrition", icon: Apple, color: "hsl(38 88% 40%)" },
    ],
  },
  {
    step: "03",
    icon: TrendingUp,
    title: "Get Verdict & Alternatives",
    desc: "Eco-scores, labor flags, carbon data, and greener swaps weighted to your values",
    colorBg: "hsl(280 40% 96%)",
    badgeColor: "hsl(280 50% 46%)",
    gradient: "from-[hsl(280_60%_50%)] to-[hsl(280_55%_62%)]",
  },
  {
    step: "04",
    icon: BarChart3,
    title: "Track Your Impact",
    desc: "Scanning history, weekly trends & how your habits improve over time",
    colorBg: "hsl(218 60% 96%)",
    badgeColor: "hsl(218 62% 46%)",
    gradient: "from-[hsl(218_70%_50%)] to-[hsl(216_65%_62%)]",
    bars: [
      { h: 70, color: "hsl(152 48% 36%)" },
      { h: 45, color: "hsl(152 48% 44%)" },
      { h: 85, color: "hsl(152 48% 30%)" },
      { h: 35, color: "hsl(38 88% 50%)" },
      { h: 60, color: "hsl(152 48% 40%)" },
      { h: 78, color: "hsl(152 48% 34%)" },
      { h: 25, color: "hsl(0 65% 55%)" },
    ],
  },
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pb-nav">

        {/* ── Hero ── */}
        <section
          className="relative overflow-hidden px-5 pt-10 pb-16 text-center"
          style={{ background: "var(--gradient-hero)" }}
        >
          {/* Decorative blobs */}
          <div className="absolute -top-10 -right-8 w-44 h-44 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
          <div className="absolute bottom-4 -left-6 w-28 h-28 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.04)" }} />

          <div className="max-w-xs mx-auto relative z-10">
            <div className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-5 shadow-card" style={{ backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <Leaf className="w-7 h-7" style={{ color: "#ffffff" }} strokeWidth={2} />
            </div>

            <h1 className="text-[1.9rem] font-display font-extrabold leading-tight tracking-tight mb-3" style={{ color: "#ffffff" }}>
              Know the True Cost
            </h1>
            <p className="text-sm leading-relaxed mb-7" style={{ color: "rgba(255,255,255,0.72)" }}>
              Scan products to reveal environmental impact, labor practices & ethical alternatives
            </p>

            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                to="/scan"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm shadow-elevated hover:scale-[1.02] transition-all duration-200 active:scale-[0.98]"
                style={{ backgroundColor: "#ffffff", color: "hsl(152 48% 28%)" }}
              >
                <Camera className="w-4 h-4" />
                Scan Now
              </Link>
              <Link
                to="/preferences"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm transition-all duration-200"
                style={{ backgroundColor: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.25)", color: "#ffffff" }}
              >
                <Settings className="w-4 h-4" />
                Priorities
              </Link>
            </div>
          </div>
        </section>

        {/* ── Quick actions (overlapping hero) ── */}
        <section className="relative z-10 -mt-6">
          <div className={CONTAINER}>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { emoji: "🔍", label: "Scan", sub: "Any product", to: "/scan" },
                { emoji: "💡", label: "Insights", sub: "Get verdicts", to: "/scan" },
                { emoji: "🌱", label: "Better", sub: "Alternatives", to: "/products" },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="bg-card rounded-2xl py-4 px-2 text-center border border-border/60 shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.97]"
                >
                  <div className="text-2xl mb-1.5">{item.emoji}</div>
                  <div className="text-xs font-bold text-foreground leading-tight">{item.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{item.sub}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="pt-8">
          <div className={CONTAINER}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-extrabold text-foreground">How It Works</h2>
              <Link
                to="/scan"
                className="text-xs font-semibold text-primary flex items-center gap-0.5 hover:gap-1.5 transition-all"
              >
                Try it <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              {steps.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.step}
                    className="bg-card rounded-2xl p-4 border border-border/60 shadow-soft"
                  >
                    <div className="flex gap-3.5 items-start">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${s.gradient}`}>
                        <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-1">
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{ color: s.badgeColor, backgroundColor: s.colorBg }}
                          >
                            Step {s.step}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-foreground mb-0.5">{s.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                      </div>
                    </div>

                    {/* Priority pills — step 2 */}
                    {s.pills && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pl-[3.625rem]">
                        {s.pills.map((pill) => {
                          const PillIcon = pill.icon;
                          return (
                            <span
                              key={pill.label}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold"
                              style={{ color: pill.color, backgroundColor: `${pill.color}12` }}
                            >
                              <PillIcon className="w-2.5 h-2.5" />
                              {pill.label}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Mini bar chart — step 4 */}
                    {s.bars && (
                      <div className="pl-[3.625rem] mt-3">
                        <div className="flex items-end gap-1.5 h-10">
                          {s.bars.map((bar, i) => (
                            <div
                              key={i}
                              className="flex-1 rounded-t-sm opacity-85"
                              style={{ height: `${bar.h}%`, backgroundColor: bar.color }}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[9px] text-muted-foreground/60">Mon</span>
                          <span className="text-[9px] text-muted-foreground/60">Sun</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── What We Analyze ── */}
        <section className="pt-8">
          <div className={CONTAINER}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-extrabold text-foreground">What We Analyze</h2>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: "hsl(152 42% 96%)", color: "hsl(152 48% 28%)" }}>
                6 dimensions
              </span>
            </div>

            {/* Featured AI Scan tile */}
            {(() => {
              const featured = analysisCategories.find(c => c.featured)!;
              const FeaturedIcon = featured.icon;
              return (
                <div
                  className="rounded-2xl p-4 mb-2.5 overflow-hidden relative"
                  style={{
                    background: `linear-gradient(135deg, ${featured.gradientFrom} 0%, ${featured.gradientTo} 100%)`,
                  }}
                >
                  {/* Decorative glow blob */}
                  <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
                  <div className="absolute -bottom-4 -left-2 w-16 h-16 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />

                  <div className="relative flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.25)" }}>
                      <FeaturedIcon className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-display font-extrabold" style={{ color: "#ffffff" }}>
                          {featured.title}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.22)", color: "#ffffff" }}>
                          <Sparkles className="w-2.5 h-2.5" />
                          {featured.stat}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.80)" }}>
                        {featured.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 2-column grid for remaining 5 items */}
            <div className="grid grid-cols-2 gap-2.5">
              {analysisCategories.filter(c => !c.featured).map((cat) => {
                const Icon = cat.icon;
                return (
                  <div
                    key={cat.title}
                    className="bg-card rounded-2xl p-4 border border-border/60 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {/* Gradient icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                      style={{
                        background: `linear-gradient(135deg, ${cat.gradientFrom} 0%, ${cat.gradientTo} 100%)`,
                        boxShadow: `0 4px 12px ${cat.gradientFrom}40`,
                      }}
                    >
                      <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>

                    <p className="text-xs font-display font-extrabold text-foreground mb-1">{cat.title}</p>
                    <p className="text-[10px] text-muted-foreground leading-snug mb-2.5">{cat.desc}</p>

                    {/* Stat pill */}
                    <span
                      className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: cat.statBg, color: cat.statColor }}
                    >
                      {cat.stat}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="pt-8 pb-2 px-5">
          <div
            className="max-w-xl mx-auto rounded-3xl px-6 py-8 text-center overflow-hidden relative"
            style={{ background: "var(--gradient-hero)" }}
          >
            <div className="absolute -top-8 -right-6 w-32 h-32 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.04)" }} />
            <div className="relative z-10">
              <div className="text-3xl mb-3">🌱</div>
              <h2 className="text-xl font-display font-extrabold mb-2" style={{ color: "#ffffff" }}>
                Ready to Shop Consciously?
              </h2>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
                Set your priorities, scan your first product, and start building better shopping habits today.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link
                  to="/scan"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-elevated hover:scale-[1.02] transition-all duration-200 active:scale-[0.98]"
                  style={{ backgroundColor: "#ffffff", color: "hsl(152 48% 28%)" }}
                >
                  <Camera className="w-4 h-4" />
                  Start Scanning
                </Link>
                <Link
                  to="/preferences"
                  className="inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl font-semibold text-sm transition-all"
                  style={{ backgroundColor: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.25)", color: "#ffffff" }}
                >
                  <Settings className="w-3.5 h-3.5" />
                  Priorities <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="h-4" />
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default Index;
