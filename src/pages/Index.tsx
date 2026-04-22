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
  { icon: Globe,      title: "Origin",       desc: "Where ingredients actually come from", accent: "#40aaff" },
  { icon: Shield,     title: "Labor",        desc: "Forced & child labor flags",           accent: "#ff4136" },
  { icon: Leaf,       title: "Carbon",       desc: "CO₂ lifecycle per 100g",               accent: "#00c853" },
  { icon: TrendingUp, title: "Alternatives", desc: "Greener swaps ranked for you",         accent: "#ffc700" },
  { icon: Heart,      title: "Animal",       desc: "BBFAW welfare scores",                 accent: "#ff69b4" },
  { icon: Activity,   title: "Nutrition",    desc: "Nutri-Score A–E grades",               accent: "#00c853" },
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

  // Ticker items
  const tickerItems = [
    "COCA-COLA", "WHOLE MILK", "DORITOS", "MINERAL WATER", "ORANGE JUICE",
    "OAT MILK", "PRINGLES", "SPARKLING WATER", "ENERGY DRINK", "SOY MILK",
    "KETTLE CHIPS", "ALMOND MILK", "PEPSI", "COCONUT WATER", "RICE MILK",
    "LAYS", "APPLE JUICE", "GREEK YOGURT", "TOMATO SAUCE", "OLIVE OIL",
  ];


  return (
    <div className="min-h-screen bg-black" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="scanlines" />

      <main className="pb-nav" style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Ticker row ── */}
        <div style={{ overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#000' }}>
          <div className="ticker-track">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.48rem', color: 'rgba(132,137,142,0.5)', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '5px 18px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            MSCHF-STYLE HERO POSTER
        ══════════════════════════════════════════ */}
        <div style={{ position: 'relative', overflow: 'hidden', borderBottom: '2px solid rgba(255,255,255,0.15)' }}>

          {/* ── Compact top bar ── */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: 'max(52px, env(safe-area-inset-top)) 20px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            position: 'relative', zIndex: 2,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span className="terminal-cursor" style={{ width: 6, height: 6, borderRadius: '50%', background: '#00c853', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.44rem', color: '#84898E', letterSpacing: '0.24em', textTransform: 'uppercase' }}>
                ETHICAL SCANNER
              </span>
            </div>
            <Link to="/basket" style={{ width: 36, height: 36, border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#84898E' }} aria-label="View basket">
              <ShoppingCart className="w-4 h-4" />
            </Link>
          </div>

          {/* ── Giant two-line wordmark — each word fills full width ── */}
          <div style={{ position: 'relative', zIndex: 2, lineHeight: 0.85, padding: '4px 0 0', overflow: 'hidden' }}>
            {/* GOOD — outlined, glitches to FOOD */}
            <div style={{ position: 'relative', display: 'block', textAlign: 'center' }}>
              <span style={{
                fontFamily: "'Bebas Neue', sans-serif", fontWeight: 400,
                fontSize: 'min(41.5vw, 180px)',
                color: 'transparent',
                WebkitTextStroke: '1.5px #84898E',
                letterSpacing: '0.01em', display: 'inline-block',
                animation: 'logoGood 10s linear infinite',
              }}>GOOD</span>
              <span style={{
                fontFamily: "'Bebas Neue', sans-serif", fontWeight: 400,
                fontSize: 'min(41.5vw, 180px)',
                color: 'transparent',
                WebkitTextStroke: '1.5px #40aaff',
                letterSpacing: '0.01em',
                position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)',
                animation: 'logoFood 10s linear infinite',
              }}>FOOD</span>
            </div>
            {/* SCAN — solid white + green glow */}
            <div style={{ textAlign: 'center' }}>
              <span style={{
                fontFamily: "'Bebas Neue', sans-serif", fontWeight: 400,
                fontSize: 'min(41.5vw, 180px)',
                color: '#fff',
                textShadow: '0 0 50px rgba(0,200,83,0.5)',
                letterSpacing: '0.01em', display: 'inline-block',
              }}>SCAN</span>
            </div>
          </div>

          {/* ── Mission block ── */}
          <div style={{
            position: 'relative', zIndex: 2,
            borderTop: '1px solid rgba(255,255,255,0.07)',
            padding: '16px 20px 20px',
            textAlign: 'center',
          }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.42rem', color: '#84898E', letterSpacing: '0.26em', textTransform: 'uppercase', marginBottom: 10 }}>
              // MISSION
            </p>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 400, fontSize: 'clamp(1.5rem, 7vw, 2.6rem)', lineHeight: 1.05, margin: '0 0 12px' }}>
              <span style={{ color: '#fff' }}>SCAN ANY PRODUCT. </span>
              <span style={{ color: '#00c853', textShadow: '0 0 16px rgba(0,200,83,0.35)' }}>SEE WHAT BRANDS </span>
              <span style={{ color: '#fff' }}>DON'T WANT YOU TO KNOW.</span>
            </h2>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.48rem', color: '#84898E', letterSpacing: '0.05em', lineHeight: 1.8 }}>
              Labour · CO₂ · Origin · Nutrition · Animal welfare · Greener swaps
            </p>
          </div>

          {/* Corner registration marks */}
          {(['tl','tr','bl','br'] as const).map(c => (
            <div key={c} style={{ position: 'absolute', [c.startsWith('t') ? 'top' : 'bottom']: 10, [c.endsWith('l') ? 'left' : 'right']: 10, zIndex: 3, fontFamily: 'monospace', fontSize: 13, color: 'rgba(255,255,255,0.2)', lineHeight: 1, userSelect: 'none' }}>+</div>
          ))}
        </div>

        {/* ── Full-width green scan CTA strip ── */}
        <Link to="/scan" style={{ display: 'block', textDecoration: 'none', position: 'relative', background: '#00c853', borderBottom: '2px solid #fff' }}>
          {/* Corner marks */}
          {(['tl','tr','bl','br'] as const).map(c => (
            <div key={c} style={{ position: 'absolute', [c.startsWith('t') ? 'top' : 'bottom']: 6, [c.endsWith('l') ? 'left' : 'right']: 10, fontFamily: 'monospace', fontSize: 13, color: 'rgba(0,0,0,0.4)', lineHeight: 1, userSelect: 'none', zIndex: 1 }}>+</div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px' }}>
            <div>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.5rem', color: 'rgba(0,0,0,0.55)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 3 }}>
                TAP TO BEGIN
              </p>
              <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.6rem, 8vw, 2.4rem)', color: '#000', letterSpacing: '0.04em', lineHeight: 1, fontWeight: 400 }}>
                SCAN YOUR PRODUCT
              </p>
            </div>
            <ScanLine className="w-9 h-9" style={{ color: '#000', opacity: 0.7, flexShrink: 0 }} strokeWidth={1.5} />
          </div>
          {isDefaultPriorities && (
            <div style={{ padding: '0 24px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={12} style={{ color: 'rgba(0,0,0,0.6)', flexShrink: 0 }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem', color: 'rgba(0,0,0,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Set priorities first →
              </span>
            </div>
          )}
        </Link>

        {/* ── Reverse ticker ── */}
        <div style={{ overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="ticker-track ticker-track--rev">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.48rem', color: 'rgba(0,200,83,0.3)', letterSpacing: '0.18em', textTransform: 'uppercase', padding: '5px 18px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="px-5 pt-4">
          <div className="max-w-xl mx-auto grid grid-cols-3">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className="py-4 px-3 text-center"
                style={{
                  borderRight: i < stats.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  borderLeft: i === 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}
              >
                <p
                  className="font-mono font-black tabular-nums leading-none mb-1"
                  style={{ fontSize: "1.4rem", color: "#ffffff", letterSpacing: "-0.03em" }}
                >
                  {s.value}
                </p>
                <p
                  className="font-mono uppercase"
                  style={{ fontSize: "0.5rem", color: "#84898E", letterSpacing: "0.15em" }}
                >
                  {s.label}
                </p>
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
                className="flex items-center gap-3 px-4 py-3.5 active:opacity-70 transition-opacity"
                style={{
                  border: "1px solid rgba(255, 199, 0, 0.25)",
                  borderLeft: "3px solid #ffc700",
                  textDecoration: "none",
                }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#ffc700" }} strokeWidth={2} />
                <div className="flex-1 min-w-0">
                  <p
                    className="font-mono font-bold uppercase leading-tight"
                    style={{ fontSize: "0.7rem", color: "#ffc700", letterSpacing: "0.08em" }}
                  >
                    SET YOUR PRIORITIES
                  </p>
                  <p
                    className="font-mono mt-0.5 leading-tight"
                    style={{ fontSize: "0.6rem", color: "#84898E" }}
                  >
                    Personalise every scan result to your values
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "#84898E" }} />
              </Link>
            </div>
          </div>
        )}

        {/* ── Quick actions 2×2 grid ── */}
        <div className="px-5 pt-5">
          <div className="max-w-xl mx-auto">
            <p className="font-mono uppercase mb-3" style={{ fontSize: "0.55rem", color: "#84898E", letterSpacing: "0.22em" }}>
              // QUICK ACCESS
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid rgba(255,255,255,0.1)' }}>
              {quickActions.map((item, i) => {
                const Icon = item.icon;
                const num = String(i + 1).padStart(2, "0");
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="card-interactive"
                    style={{
                      textDecoration: 'none',
                      padding: '18px 16px 16px',
                      borderRight: i % 2 === 0 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                      borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    <div className="diagonal-stripe-overlay" />
                    {/* Top row: number + icon */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.5rem', color: 'rgba(132,137,142,0.5)', letterSpacing: '0.12em' }}>{num}</span>
                      <Icon style={{ width: 14, height: 14, color: '#84898E', flexShrink: 0 }} strokeWidth={1.5} />
                    </div>
                    {/* Action name */}
                    <div>
                      <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1.5rem, 7vw, 2.1rem)', color: '#fff', letterSpacing: '0.04em', lineHeight: 1, marginBottom: 5 }}>
                        {item.label}
                      </p>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.5rem', color: '#84898E', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {item.sub}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Analysis dimensions manifest ── */}
        <div className="px-5 pt-5">
          <div className="max-w-xl mx-auto">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <p className="font-mono uppercase" style={{ fontSize: "0.55rem", color: "#84898E", letterSpacing: "0.22em" }}>
                // ANALYSIS DIMENSIONS
              </p>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: '#40aaff', lineHeight: 1 }}>6</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {analysisCategories.map((cat, i) => {
                const Icon = cat.icon;
                const num = String(i + 1).padStart(2, "0");
                return (
                  <div
                    key={cat.title}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0,
                      borderLeft: `3px solid ${cat.accent}`,
                      background: 'rgba(255,255,255,0.02)',
                      padding: '14px 0',
                    }}
                  >
                    {/* Number */}
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.5rem', color: 'rgba(132,137,142,0.4)', letterSpacing: '0.1em', minWidth: '2.8rem', paddingLeft: 12 }}>
                      {num}
                    </span>
                    {/* Icon */}
                    <Icon style={{ width: 13, height: 13, color: cat.accent, flexShrink: 0, marginRight: 10, opacity: 0.8 }} strokeWidth={1.5} />
                    {/* Title + desc */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(1rem, 4.5vw, 1.3rem)', color: '#ffffff', letterSpacing: '0.06em', lineHeight: 1 }}>
                        {cat.title}
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.52rem', color: '#84898E', marginLeft: 10, letterSpacing: '0.04em' }}>
                        {cat.desc}
                      </span>
                    </div>
                    {/* ON tag */}
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.48rem', color: '#00c853', letterSpacing: '0.12em', paddingRight: 14, flexShrink: 0 }}>
                      [ON]
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Bottom CTA — full bleed MSCHF strip ── */}
        <div style={{ marginTop: 20, borderTop: '2px solid rgba(255,255,255,0.1)' }}>
          <Link
            to="/scan"
            style={{ display: 'block', textDecoration: 'none', position: 'relative', background: '#000' }}
          >
            {/* Corner marks */}
            {(['tl','tr','bl','br'] as const).map(c => (
              <div key={c} style={{ position: 'absolute', [c.startsWith('t') ? 'top' : 'bottom']: 8, [c.endsWith('l') ? 'left' : 'right']: 12, fontFamily: 'monospace', fontSize: 12, color: 'rgba(0,200,83,0.4)', lineHeight: 1, userSelect: 'none', zIndex: 1 }}>+</div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 28px' }}>
              <div>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.48rem', color: '#00c853', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 6, opacity: 0.7 }}>
                  // START_SESSION
                </p>
                <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2rem, 9vw, 2.8rem)', color: '#fff', letterSpacing: '0.06em', lineHeight: 1, fontWeight: 400 }}>
                  [ START SCANNING ]
                </p>
              </div>
              <div style={{ width: 44, height: 44, border: '1px solid #00c853', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ScanLine style={{ width: 20, height: 20, color: '#00c853' }} strokeWidth={1.5} />
              </div>
            </div>
          </Link>
        </div>

      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
