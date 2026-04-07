import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { Link } from "react-router-dom";
import {
  Camera, Leaf, Users, Heart, Apple,
  Settings, Globe, Shield,
  ChevronRight, BarChart3, TrendingUp, Activity,
  Scan, Zap, ArrowRight, Sparkles,
} from "lucide-react";

const CONTAINER = "w-full max-w-xl mx-auto px-5";

const analysisCategories = [
  {
    icon: Globe,
    title: "Origin",
    desc: "Traces where ingredients and materials actually come from",
    stat: "Global coverage",
    color: "hsl(220 68% 46%)",
    bg: "hsl(220 60% 96%)",
    gradientFrom: "hsl(220 68% 42%)",
    gradientTo: "hsl(215 72% 56%)",
  },
  {
    icon: Shield,
    title: "Labor",
    desc: "Flags forced & child labor linked to parent companies",
    stat: "10+ databases",
    color: "hsl(0 68% 46%)",
    bg: "hsl(0 50% 97%)",
    gradientFrom: "hsl(0 68% 46%)",
    gradientTo: "hsl(8 72% 58%)",
  },
  {
    icon: Leaf,
    title: "Carbon",
    desc: "Full CO₂ lifecycle — agriculture to distribution",
    stat: "Per 100g precision",
    color: "hsl(172 80% 28%)",
    bg: "hsl(172 50% 95%)",
    gradientFrom: "hsl(196 88% 22%)",
    gradientTo: "hsl(172 82% 34%)",
  },
  {
    icon: TrendingUp,
    title: "Alternatives",
    desc: "Surfaces greener swaps ranked by your priorities",
    stat: "Eco-score ranked",
    color: "hsl(280 52% 46%)",
    bg: "hsl(280 40% 96%)",
    gradientFrom: "hsl(280 58% 46%)",
    gradientTo: "hsl(275 55% 60%)",
  },
  {
    icon: Heart,
    title: "Animal",
    desc: "BBFAW-rated welfare scores for brands and companies",
    stat: "BBFAW rated",
    color: "hsl(340 62% 46%)",
    bg: "hsl(340 50% 97%)",
    gradientFrom: "hsl(340 62% 46%)",
    gradientTo: "hsl(350 65% 60%)",
  },
  {
    icon: Activity,
    title: "Nutrition",
    desc: "Nutri-Score grades and processing level for every product",
    stat: "Nutri-Score A–E",
    color: "hsl(172 80% 28%)",
    bg: "hsl(172 50% 95%)",
    gradientFrom: "hsl(180 85% 26%)",
    gradientTo: "hsl(162 82% 38%)",
  },
];

const steps = [
  {
    num: "1",
    icon: Camera,
    title: "Scan a Product",
    desc: "Photo, barcode, or name — AI reads labels instantly",
    gradientFrom: "hsl(196 88% 22%)",
    gradientTo: "hsl(172 82% 34%)",
  },
  {
    num: "2",
    icon: Settings,
    title: "Set Your Priorities",
    desc: "Weight what matters most to you — planet, people, animals",
    gradientFrom: "hsl(36 92% 46%)",
    gradientTo: "hsl(28 90% 56%)",
  },
  {
    num: "3",
    icon: Zap,
    title: "Get Your Verdict",
    desc: "Eco-scores, labor flags, and greener swaps in seconds",
    gradientFrom: "hsl(280 58% 46%)",
    gradientTo: "hsl(275 55% 60%)",
  },
  {
    num: "4",
    icon: BarChart3,
    title: "Track Your Impact",
    desc: "See how your shopping habits improve over time",
    gradientFrom: "hsl(218 70% 46%)",
    gradientTo: "hsl(216 65% 58%)",
  },
];

const trustStats = [
  { value: "3M+", label: "Products covered" },
  { value: "6", label: "Checks every scan" },
  { value: "Free", label: "No account needed" },
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pb-nav">

        {/* ── Hero ── */}
        <section
          className="relative overflow-hidden px-5 pt-12 pb-20 text-center"
          style={{ background: "var(--gradient-hero)" }}
        >
          {/* Aurora orbs — large blurred colour blobs in corners, never near text */}
          <div className="animate-orb-1 absolute -top-20 -left-20 w-72 h-72 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, hsl(180 90% 55%) 0%, transparent 70%)", filter: "blur(48px)" }} />
          <div className="animate-orb-2 absolute -bottom-24 -right-16 w-80 h-80 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, hsl(155 85% 50%) 0%, transparent 70%)", filter: "blur(56px)", animationDelay: "-3s" }} />
          <div className="animate-orb-3 absolute top-1/2 -right-24 w-56 h-56 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, hsl(200 90% 60%) 0%, transparent 70%)", filter: "blur(40px)", animationDelay: "-6s" }} />

          <div className="max-w-sm mx-auto relative z-10">
            {/* Pulsing icon */}
            <div className="flex justify-center mb-5">
              <div
                className="animate-icon-ring w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.30)" }}
              >
                <Leaf className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
            </div>

            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold mb-5 tracking-wide"
              style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.95)", border: "1px solid rgba(255,255,255,0.22)" }}
            >
              <Sparkles className="w-3 h-3" />
              AI-Powered Ethical Shopping
            </div>

            <h1 className="text-[2.1rem] font-display font-extrabold leading-[1.15] tracking-tight mb-4" style={{ color: "#ffffff" }}>
              Know the True Cost of What You Buy
            </h1>
            <p className="text-sm leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.75)" }}>
              Scan any product to instantly reveal its environmental impact, labor practices, and ethical alternatives.
            </p>

            <div className="flex gap-3 justify-center">
              <Link
                to="/scan"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm shadow-elevated hover:scale-[1.02] transition-all duration-200 active:scale-[0.98]"
                style={{ backgroundColor: "#ffffff", color: "hsl(196 88% 22%)" }}
              >
                <Camera className="w-4 h-4" />
                Scan a Product
              </Link>
              <Link
                to="/preferences"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 hover:bg-white/20"
                style={{ backgroundColor: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.28)", color: "#ffffff" }}
              >
                <Settings className="w-4 h-4" />
                Priorities
              </Link>
            </div>
          </div>
        </section>

        {/* ── Trust stats — overlap hero ── */}
        <section className="relative z-10 -mt-6 px-5">
          <div className="max-w-xl mx-auto">
            <div className="bg-card rounded-2xl border border-border/50 shadow-card grid grid-cols-3 divide-x divide-border/50 overflow-hidden">
              {trustStats.map((s) => (
                <div key={s.label} className="py-4 px-2 text-center">
                  <div className="text-xl font-display font-extrabold text-primary">{s.value}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Quick actions ── */}
        <section className="pt-6">
          <div className={CONTAINER}>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { icon: Scan, label: "Scan", sub: "Any product", to: "/scan", gradient: "linear-gradient(135deg, hsl(196 88% 22%) 0%, hsl(172 82% 34%) 100%)" },
                { icon: Zap, label: "Insights", sub: "Get verdicts", to: "/scan", gradient: "linear-gradient(135deg, hsl(36 92% 46%) 0%, hsl(28 90% 56%) 100%)" },
                { icon: TrendingUp, label: "Better", sub: "Alternatives", to: "/products", gradient: "linear-gradient(135deg, hsl(280 58% 46%) 0%, hsl(275 55% 60%) 100%)" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="bg-card rounded-2xl py-4 px-2 text-center border border-border/60 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                  >
                    <div
                      className="w-9 h-9 rounded-xl mx-auto mb-2 flex items-center justify-center"
                      style={{ background: item.gradient }}
                    >
                      <Icon className="w-4.5 h-4.5 text-white w-[1.125rem] h-[1.125rem]" strokeWidth={2.2} />
                    </div>
                    <div className="text-xs font-bold text-foreground leading-tight">{item.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{item.sub}</div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="pt-9">
          <div className={CONTAINER}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-display font-extrabold text-foreground">How It Works</h2>
              <Link
                to="/scan"
                className="text-xs font-semibold text-primary flex items-center gap-0.5 hover:gap-1.5 transition-all"
              >
                Try it <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="relative">
              {/* Vertical connector line */}
              <div className="absolute left-[1.625rem] top-10 bottom-10 w-px bg-border/60" aria-hidden />

              <div className="flex flex-col gap-3">
                {steps.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.num} className="bg-card rounded-2xl p-4 border border-border/60 shadow-soft flex gap-4 items-start">
                      <div
                        className="w-[3.25rem] h-[3.25rem] rounded-2xl flex-shrink-0 flex flex-col items-center justify-center gap-0.5 relative z-10"
                        style={{ background: `linear-gradient(145deg, ${s.gradientFrom} 0%, ${s.gradientTo} 100%)`, boxShadow: `0 4px 14px ${s.gradientFrom}50` }}
                      >
                        <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                        <span className="text-[9px] font-extrabold text-white/80 tracking-wider leading-none">{s.num}</span>
                      </div>
                      <div className="flex-1 pt-1">
                        <h3 className="text-sm font-bold text-foreground mb-1">{s.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── What We Analyze ── */}
        <section className="pt-9">
          <div className={CONTAINER}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-display font-extrabold text-foreground">What We Analyze</h2>
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "hsl(172 50% 95%)", color: "hsl(172 80% 28%)" }}
              >
                6 dimensions
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {analysisCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div
                    key={cat.title}
                    className="bg-card rounded-2xl p-4 border border-border/60 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                      style={{
                        background: `linear-gradient(135deg, ${cat.gradientFrom} 0%, ${cat.gradientTo} 100%)`,
                        boxShadow: `0 4px 12px ${cat.gradientFrom}45`,
                      }}
                    >
                      <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                    <p className="text-xs font-display font-extrabold text-foreground mb-1">{cat.title}</p>
                    <p className="text-[10px] text-muted-foreground leading-snug mb-3">{cat.desc}</p>
                    <span
                      className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: cat.bg, color: cat.color }}
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
        <section className="pt-9 pb-2 px-5">
          <div
            className="max-w-xl mx-auto rounded-3xl px-6 py-9 text-center overflow-hidden relative"
            style={{ background: "var(--gradient-hero)" }}
          >
            <div className="animate-orb-1 absolute -top-16 -left-16 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, hsl(180 90% 55%) 0%, transparent 70%)", filter: "blur(36px)", animationDelay: "-2s" }} />
            <div className="animate-orb-2 absolute -bottom-16 -right-16 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, hsl(155 85% 50%) 0%, transparent 70%)", filter: "blur(36px)", animationDelay: "-5s" }} />

            <div className="relative z-10">
              <div
                className="inline-flex w-12 h-12 rounded-2xl items-center justify-center mb-4"
                style={{ backgroundColor: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.25)" }}
              >
                <Leaf className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <h2 className="text-xl font-display font-extrabold mb-2" style={{ color: "#ffffff" }}>
                Ready to Shop Consciously?
              </h2>
              <p className="text-sm mb-7 leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
                Set your priorities, scan your first product, and start building better habits today.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link
                  to="/scan"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-elevated hover:scale-[1.02] transition-all duration-200 active:scale-[0.98]"
                  style={{ backgroundColor: "#ffffff", color: "hsl(196 88% 22%)" }}
                >
                  <Camera className="w-4 h-4" />
                  Start Scanning
                </Link>
                <Link
                  to="/preferences"
                  className="inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl font-semibold text-sm transition-all hover:bg-white/20"
                  style={{ backgroundColor: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.28)", color: "#ffffff" }}
                >
                  <Settings className="w-3.5 h-3.5" />
                  Priorities
                  <ArrowRight className="w-3.5 h-3.5" />
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
