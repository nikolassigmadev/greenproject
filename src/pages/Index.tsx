import { BottomNav } from "@/components/BottomNav";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Camera, Leaf, Heart,
  Settings, Globe, Shield,
  BarChart3, TrendingUp, Activity,
  Scan, Receipt, ScanLine, ChevronRight, AlertCircle, ShoppingCart,
} from "lucide-react";
import { loadPriorities, DEFAULT_PRIORITIES } from "@/utils/userPreferences";

const analysisCategories = [
  {
    icon: Globe,
    title: "Origin",
    desc: "Where ingredients actually come from",
    color: "hsl(220 68% 46%)",
    bg: "hsl(220 60% 94%)",
  },
  {
    icon: Shield,
    title: "Labor",
    desc: "Forced & child labor flags",
    color: "hsl(0 68% 46%)",
    bg: "hsl(0 50% 94%)",
  },
  {
    icon: Leaf,
    title: "Carbon",
    desc: "CO₂ lifecycle per 100g",
    color: "hsl(172 72% 28%)",
    bg: "hsl(172 50% 92%)",
  },
  {
    icon: TrendingUp,
    title: "Alternatives",
    desc: "Greener swaps ranked for you",
    color: "hsl(280 52% 46%)",
    bg: "hsl(280 40% 94%)",
  },
  {
    icon: Heart,
    title: "Animal",
    desc: "BBFAW welfare scores",
    color: "hsl(340 62% 46%)",
    bg: "hsl(340 50% 94%)",
  },
  {
    icon: Activity,
    title: "Nutrition",
    desc: "Nutri-Score A–E grades",
    color: "hsl(172 72% 28%)",
    bg: "hsl(172 50% 92%)",
  },
];

const quickActions = [
  {
    icon: Scan,
    label: "Scan",
    sub: "Any product",
    to: "/scan",
    color: "hsl(172 72% 28%)",
    bg: "hsl(172 50% 92%)",
  },
  {
    icon: Receipt,
    label: "View Cart",
    sub: "Whole shop",
    to: "/receipt",
    color: "hsl(36 80% 38%)",
    bg: "hsl(36 80% 93%)",
  },
  {
    icon: BarChart3,
    label: "History",
    sub: "Past scans",
    to: "/dashboard",
    color: "hsl(220 68% 46%)",
    bg: "hsl(220 60% 94%)",
  },
  {
    icon: Settings,
    label: "Priorities",
    sub: "Your values",
    to: "/preferences",
    color: "hsl(280 52% 46%)",
    bg: "hsl(280 40% 94%)",
  },
];

const stats = [
  { value: "3M+", label: "Products" },
  { value: "6", label: "Ethics checks" },
  { value: "Free", label: "Always" },
];

const Index = () => {
  const [isDefaultPriorities, setIsDefaultPriorities] = useState(() => {
    const p = loadPriorities();
    return (
      p.environment === DEFAULT_PRIORITIES.environment &&
      p.laborRights === DEFAULT_PRIORITIES.laborRights &&
      p.animalWelfare === DEFAULT_PRIORITIES.animalWelfare &&
      p.nutrition === DEFAULT_PRIORITIES.nutrition
    );
  });

  useEffect(() => {
    const check = () => {
      const p = loadPriorities();
      setIsDefaultPriorities(
        p.environment === DEFAULT_PRIORITIES.environment &&
        p.laborRights === DEFAULT_PRIORITIES.laborRights &&
        p.animalWelfare === DEFAULT_PRIORITIES.animalWelfare &&
        p.nutrition === DEFAULT_PRIORITIES.nutrition
      );
    };
    window.addEventListener("prioritiesUpdated", check);
    window.addEventListener("focus", check);
    return () => {
      window.removeEventListener("prioritiesUpdated", check);
      window.removeEventListener("focus", check);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-nav">

        {/* ── Top header ── */}
        <div className="px-5 pt-14 pb-2">
          <div className="max-w-xl mx-auto flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-0.5">GoodScan</p>
              <h1 className="text-[1.75rem] font-display font-extrabold text-foreground leading-tight">
                Shop with your values.
              </h1>
            </div>
            <Link
              to="/basket"
              className="mt-1 w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer flex-shrink-0"
              aria-label="View basket"
            >
              <ShoppingCart className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            </Link>
          </div>
        </div>

        {/* ── Scan hero card ── */}
        <div className="px-5 pt-4">
          <div className="max-w-xl mx-auto">
            <Link
              to="/scan"
              className="block rounded-[1.25rem] overflow-hidden active:scale-[0.98] transition-transform duration-150"
              style={{
                background: "linear-gradient(145deg, hsl(196 88% 20%) 0%, hsl(172 82% 30%) 100%)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.08)",
              }}
            >
              <div className="px-6 py-7 flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs font-semibold mb-1 uppercase tracking-wider">Ready to scan</p>
                  <p className="text-white text-xl font-display font-extrabold leading-tight mb-3">
                    Scan a Product
                  </p>
                  <div
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold"
                    style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "white" }}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Take a photo or search
                  </div>
                  {isDefaultPriorities && (
                    <Link
                      to="/preferences"
                      onClick={e => e.stopPropagation()}
                      className="mt-3 flex items-center gap-1.5 text-xs font-semibold"
                      style={{ color: "hsl(38 95% 75%)", textDecoration: "none" }}
                    >
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      Set your priorities first
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                >
                  <ScanLine className="w-8 h-8 text-white" strokeWidth={1.6} />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="px-5 pt-4">
          <div className="max-w-xl mx-auto grid grid-cols-3 gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-card rounded-[1.25rem] py-4 px-3 text-center"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
              >
                <p className="text-[1.35rem] font-display font-extrabold text-foreground leading-none mb-1">
                  {s.value}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Priorities CTA ── */}
        {isDefaultPriorities && (
          <div className="px-5 pt-3">
            <div className="max-w-xl mx-auto">
              <Link
                to="/preferences"
                className="flex items-center gap-3 rounded-[1.1rem] px-4 py-3.5 active:scale-[0.98] transition-transform duration-150"
                style={{
                  backgroundColor: "hsl(38 70% 97%)",
                  border: "1.5px solid hsl(38 70% 82%)",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                  textDecoration: "none",
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "hsl(38 80% 90%)" }}
                >
                  <AlertCircle className="w-[1rem] h-[1rem]" style={{ color: "hsl(38 70% 44%)" }} strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold leading-tight" style={{ color: "hsl(35 50% 22%)" }}>Set your priorities</p>
                  <p className="text-xs mt-0.5 leading-tight" style={{ color: "hsl(35 30% 44%)" }}>Personalise every scan result to your values</p>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(38 60% 45%)" }} />
              </Link>
            </div>
          </div>
        )}

        {/* ── Quick actions ── */}
        <div className="px-5 pt-5">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-display font-extrabold text-foreground">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {quickActions.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="bg-card rounded-[1.1rem] pt-4 pb-3 px-1 flex flex-col items-center gap-2 active:scale-[0.96] transition-transform duration-150"
                    style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.03)" }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: item.bg }}
                    >
                      <Icon className="w-[1.1rem] h-[1.1rem]" style={{ color: item.color }} strokeWidth={2.2} />
                    </div>
                    <div className="text-center">
                      <div className="text-[11px] font-bold text-foreground leading-tight">{item.label}</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{item.sub}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── What we check ── */}
        <div className="px-5 pt-6">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-display font-extrabold text-foreground">What We Check</h2>
              <span className="text-xs font-semibold text-muted-foreground">6 dimensions</span>
            </div>

            <div className="bg-card rounded-[1.25rem] overflow-hidden divide-y divide-border/60"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)" }}
            >
              {analysisCategories.map((cat, i) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.title} className="flex items-center gap-3.5 px-4 py-3.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: cat.bg }}
                    >
                      <Icon className="w-[1rem] h-[1rem]" style={{ color: cat.color }} strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground leading-tight">{cat.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-tight truncate">{cat.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Start scanning CTA ── */}
        <div className="px-5 pt-5 pb-4">
          <div className="max-w-xl mx-auto">
            <Link
              to="/scan"
              className="flex items-center justify-center gap-2 w-full rounded-[1.1rem] py-4 font-bold text-sm active:scale-[0.98] transition-transform duration-150"
              style={{
                backgroundColor: "hsl(220 14% 12%)",
                color: "white",
                boxShadow: "0 2px 12px rgba(0,0,0,0.14)",
              }}
            >
              <Camera className="w-4 h-4" />
              Start Scanning
            </Link>
          </div>
        </div>

      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
