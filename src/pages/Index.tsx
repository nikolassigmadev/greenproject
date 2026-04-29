import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ScanLine, ShoppingCart, AlertCircle, ChevronRight,
  Globe, Shield, Leaf, TrendingUp, Heart, Activity,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { loadPriorities, DEFAULT_PRIORITIES } from "@/utils/userPreferences";

/* ── Design tokens ──────────────────────────────────────────────────── */
const BLUE = "#2979FF";
const BLUE_LIGHT = "#E3EDFF";
const GREEN = "#00C853";
const AMBER = "#FF8F00";
const RED = "#E53935";
const TEXT = "#111827";
const TEXT_MUTED = "#6B7280";
const BG = "#F5F7FA";
const CARD = "#FFFFFF";
const BORDER = "#E5E7EB";

/* ── Demo card data ─────────────────────────────────────────────────── */
const DEMO_SCORES = [
  { label: "Labour Rights", score: 38, color: RED,   icon: Shield,   verdict: "Issues found" },
  { label: "Carbon (CO₂)",  score: 74, color: GREEN, icon: Leaf,     verdict: "Low impact"   },
  { label: "Animal Welfare",score: 88, color: GREEN, icon: Heart,    verdict: "Good"         },
  { label: "Nutrition",     score: 72, color: AMBER, icon: Activity, verdict: "B Grade"      },
  { label: "Origin",        score: 55, color: AMBER, icon: Globe,    verdict: "Mixed"        },
];

/* ── Feature cards ──────────────────────────────────────────────────── */
const FEATURE_CARDS = [
  {
    title: "Scanner",
    desc: "Analyze a product by photo or barcode.",
    to: "/scan",
    bg: "#D5EBD8",
    accent: "#4CAF72",
    illustration: (
      <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
        {/* Hand */}
        <path d="M58 100 Q54 85 56 70 L56 48 Q56 43 61 43 Q66 43 66 48 L66 60 Q66 55 71 55 Q76 55 76 60 L76 62 Q76 57 81 57 Q86 57 86 62 L86 65 Q86 61 91 61 Q96 61 96 66 L96 88 Q96 104 82 108 L64 108 Q58 106 58 100Z" fill="#C68B5A" />
        {/* Tube/product */}
        <rect x="68" y="20" width="20" height="44" rx="5" fill="#7BC47F" />
        <rect x="68" y="20" width="20" height="12" rx="5" fill="#5AA860" />
        {/* Heart on tube */}
        <path d="M78 39 Q78 35 74 35 Q70 35 70 39 Q70 43 78 48 Q86 43 86 39 Q86 35 82 35 Q78 35 78 39Z" fill="white" fillOpacity="0.7" transform="scale(0.55) translate(62,26)" />
        {/* Scan lines */}
        <line x1="44" y1="58" x2="56" y2="58" stroke="#4CAF72" strokeWidth="2" strokeLinecap="round" />
        <line x1="104" y1="58" x2="116" y2="58" stroke="#4CAF72" strokeWidth="2" strokeLinecap="round" />
        <line x1="44" y1="64" x2="56" y2="64" stroke="#4CAF72" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 2" />
        <line x1="104" y1="64" x2="116" y2="64" stroke="#4CAF72" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 2" />
        {/* Corner brackets */}
        <path d="M44 44 L44 52 M44 44 L52 44" stroke="#4CAF72" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M116 44 L116 52 M116 44 L108 44" stroke="#4CAF72" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M44 80 L44 72 M44 80 L52 80" stroke="#4CAF72" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M116 80 L116 72 M116 80 L108 80" stroke="#4CAF72" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Search",
    desc: "Type a product and see if it's ethical.",
    to: "/database",
    bg: "#E5DFF5",
    accent: "#7C3AED",
    illustration: (
      <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
        {/* Jar body */}
        <rect x="52" y="42" width="52" height="56" rx="10" fill="#B09ED9" />
        <rect x="52" y="42" width="52" height="14" rx="6" fill="#6D4FAF" />
        {/* Jar lid */}
        <rect x="48" y="34" width="60" height="14" rx="6" fill="#4A3080" />
        {/* Leaf decoration */}
        <ellipse cx="72" cy="76" rx="8" ry="13" fill="#5F42A8" transform="rotate(-20 72 76)" />
        <ellipse cx="92" cy="72" rx="6" ry="10" fill="#5F42A8" transform="rotate(15 92 72)" />
        <line x1="72" y1="88" x2="72" y2="64" stroke="#7C5ABF" strokeWidth="1.5" />
        {/* Magnifying glass */}
        <circle cx="104" cy="48" r="22" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="3" />
        <circle cx="104" cy="48" r="16" fill="white" fillOpacity="0.15" />
        <line x1="120" y1="64" x2="134" y2="78" stroke="white" strokeWidth="4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "History",
    desc: "Review your past scans and trends.",
    to: "/dashboard",
    bg: "#F5DAE0",
    accent: "#E03A5A",
    illustration: (
      <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
        {/* Person silhouette */}
        <circle cx="80" cy="38" r="18" fill="#C5687A" />
        <path d="M52 100 Q52 72 80 72 Q108 72 108 100" fill="#C5687A" />
        {/* Products floating around */}
        <rect x="30" y="45" width="16" height="26" rx="4" fill="#E8A0AC" />
        <rect x="30" y="45" width="16" height="8" rx="3" fill="#D07080" />
        {/* Dropper bottle */}
        <rect x="114" y="40" width="14" height="30" rx="4" fill="#E8A0AC" />
        <rect x="117" y="34" width="8" height="8" rx="2" fill="#D07080" />
        <line x1="121" y1="30" x2="121" y2="34" stroke="#D07080" strokeWidth="2" strokeLinecap="round" />
        {/* Thought bubble / sparkle */}
        <circle cx="80" cy="20" r="3" fill="#E03A5A" fillOpacity="0.5" />
        <circle cx="90" cy="14" r="2" fill="#E03A5A" fillOpacity="0.4" />
        <circle cx="98" cy="10" r="4" fill="#E03A5A" fillOpacity="0.3" />
      </svg>
    ),
  },
  {
    title: "Values",
    desc: "Set priorities that shape every result.",
    to: "/preferences",
    bg: "#D4E0EE",
    accent: "#3B6EA8",
    illustration: (
      <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
        {/* Wavy lines (scent/air) */}
        <path d="M55 80 Q65 68 75 80 Q85 92 95 80 Q105 68 115 80" stroke="#8AABCE" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M60 65 Q70 53 80 65 Q90 77 100 65 Q110 53 120 65" stroke="#8AABCE" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M65 50 Q73 40 81 50 Q89 60 97 50 Q105 40 113 50" stroke="#8AABCE" strokeWidth="2" fill="none" strokeLinecap="round" strokeOpacity="0.6" />
        {/* Flower */}
        <circle cx="88" cy="96" r="10" fill="white" fillOpacity="0.9" />
        <circle cx="88" cy="96" r="5" fill="#F5C842" />
        <circle cx="88" cy="82" r="7" fill="white" fillOpacity="0.8" />
        <circle cx="100" cy="88" r="7" fill="white" fillOpacity="0.8" />
        <circle cx="76" cy="88" r="7" fill="white" fillOpacity="0.8" />
        <circle cx="88" cy="96" r="4" fill="#F5C842" />
        {/* Leaf stem */}
        <line x1="88" y1="106" x2="88" y2="116" stroke="#6A9E5A" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="80" cy="113" rx="8" ry="5" fill="#6A9E5A" transform="rotate(-30 80 113)" />
      </svg>
    ),
  },
];

/* ── Analysis dimensions ────────────────────────────────────────────── */
const CHECKS = [
  { icon: Globe,      label: "Origin",       desc: "Where ingredients come from", color: BLUE  },
  { icon: Shield,     label: "Labour",       desc: "Forced & child labour flags",  color: RED   },
  { icon: Leaf,       label: "Carbon",       desc: "CO₂ per 100g lifecycle",       color: GREEN },
  { icon: TrendingUp, label: "Alternatives", desc: "Greener swaps ranked for you", color: AMBER },
  { icon: Heart,      label: "Animal",       desc: "BBFAW welfare scores",         color: "#E91E63" },
  { icon: Activity,   label: "Nutrition",    desc: "Nutri-Score A–E grade",        color: GREEN },
];

const scoreColor = (s: number) => s >= 70 ? GREEN : s >= 45 ? AMBER : RED;

export default function Index() {
  const [isDefaultPriorities, setIsDefaultPriorities] = useState(() => {
    const p = loadPriorities();
    return (
      p.environment   === DEFAULT_PRIORITIES.environment &&
      p.laborRights   === DEFAULT_PRIORITIES.laborRights &&
      p.animalWelfare === DEFAULT_PRIORITIES.animalWelfare &&
      p.nutrition     === DEFAULT_PRIORITIES.nutrition
    );
  });

  const [barsVisible, setBarsVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setBarsVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  const [buySignal, setBuySignal] = useState(true);
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => setBuySignal(v => !v), 2400);
    }, 3600);
    return () => { clearTimeout(timeoutId); clearInterval(intervalId); };
  }, []);

  useEffect(() => {
    const check = () => {
      const p = loadPriorities();
      setIsDefaultPriorities(
        p.environment   === DEFAULT_PRIORITIES.environment &&
        p.laborRights   === DEFAULT_PRIORITIES.laborRights &&
        p.animalWelfare === DEFAULT_PRIORITIES.animalWelfare &&
        p.nutrition     === DEFAULT_PRIORITIES.nutrition
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
    <div style={{ background: BG, minHeight: "100vh", overflowX: "hidden" }}>
      <main className="pb-nav">

        {/* ── Header ── */}
        <div style={{
          background: CARD,
          borderBottom: `1px solid ${BORDER}`,
          padding: "max(52px, env(safe-area-inset-top)) 20px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <p style={{ fontSize: "0.7rem", fontWeight: 600, color: TEXT_MUTED, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 2 }}>
              Good morning
            </p>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: TEXT, letterSpacing: "-0.025em", lineHeight: 1 }}>
              Ethical Shopper
            </h1>
          </div>
          <Link
            to="/basket"
            aria-label="View basket"
            style={{
              width: 38, height: 38,
              borderRadius: 12,
              background: BLUE_LIGHT,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: BLUE,
            }}
          >
            <ShoppingCart style={{ width: 18, height: 18 }} />
          </Link>
        </div>

        <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ── Hero CTA card ── */}
          <Link to="/scan" style={{ textDecoration: "none", display: "block" }}>
            <div style={{
              background: `linear-gradient(135deg, ${BLUE} 0%, #1565C0 100%)`,
              borderRadius: 20,
              padding: "24px 24px",
              position: "relative",
              overflow: "hidden",
              boxShadow: `0 8px 32px rgba(41,121,255,0.35)`,
            }}>
              {/* Decorative circle */}
              <div style={{
                position: "absolute", right: -32, top: -32,
                width: 140, height: 140,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.08)",
              }} />
              <div style={{
                position: "absolute", right: 24, bottom: -20,
                width: 80, height: 80,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.06)",
              }} />

              <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "rgba(255,255,255,0.7)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>
                Tap to begin
              </p>
              <p style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 6 }}>
                Scan any product
              </p>
              <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.5, maxWidth: 220 }}>
                Instantly see labour rights, carbon footprint, animal welfare &amp; more.
              </p>

              <div style={{
                marginTop: 20,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,255,255,0.18)",
                borderRadius: 50,
                padding: "8px 16px",
              }}>
                <ScanLine style={{ width: 16, height: 16, color: "#fff" }} />
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>Start scanning</span>
                <ChevronRight style={{ width: 14, height: 14, color: "rgba(255,255,255,0.7)" }} />
              </div>

              {isDefaultPriorities && (
                <div style={{
                  marginTop: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}>
                  <AlertCircle style={{ width: 13, height: 13, color: "#FFD54F", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                    Personalise results — set your priorities
                  </span>
                </div>
              )}
            </div>
          </Link>

          {/* ── Stats row ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
          }}>
            {[
              { value: "3M+", label: "Products" },
              { value: "6",   label: "Checks"   },
              { value: "Free",label: "Always"   },
            ].map(s => (
              <div key={s.label} style={{
                background: CARD,
                borderRadius: 14,
                padding: "14px 10px",
                textAlign: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                border: `1px solid ${BORDER}`,
              }}>
                <p style={{ fontSize: "1.25rem", fontWeight: 800, color: TEXT, letterSpacing: "-0.03em", marginBottom: 2 }}>
                  {s.value}
                </p>
                <p style={{ fontSize: "0.65rem", fontWeight: 500, color: TEXT_MUTED }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* ── Demo scan result ── */}
          <div>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: TEXT_MUTED, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 10 }}>
              Example scan result
            </p>
            <div style={{
              background: CARD,
              borderRadius: 18,
              border: `1px solid ${BORDER}`,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              overflow: "hidden",
            }}>
              {/* Card header */}
              <div style={{
                padding: "16px 18px 14px",
                borderBottom: `1px solid ${BORDER}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <div>
                  <p style={{ fontSize: "0.65rem", fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
                    Scanned product
                  </p>
                  <p style={{ fontSize: "1.2rem", fontWeight: 800, color: TEXT, letterSpacing: "-0.025em", marginBottom: 2 }}>
                    Oat Milk
                  </p>
                  <p style={{ fontSize: "0.75rem", color: TEXT_MUTED, fontWeight: 500 }}>
                    Some Brand Co.
                  </p>
                </div>
                <div style={{
                  width: 56, height: 56,
                  borderRadius: "50%",
                  background: `${scoreColor(61)}14`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  border: `2px solid ${scoreColor(61)}30`,
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: "1.1rem", fontWeight: 900, color: scoreColor(61), lineHeight: 1 }}>61</span>
                  <span style={{ fontSize: "0.5rem", color: TEXT_MUTED, fontWeight: 500 }}>/100</span>
                </div>
              </div>

              {/* Score bars */}
              <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 11 }}>
                {DEMO_SCORES.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: 6,
                            background: `${item.color}18`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                          }}>
                            <Icon style={{ width: 11, height: 11, color: item.color }} strokeWidth={2} />
                          </div>
                          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: TEXT }}>
                            {item.label}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.72rem", fontWeight: 600, color: item.color }}>
                          {item.verdict}
                        </span>
                      </div>
                      <div style={{ height: 6, background: "#F3F4F6", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          borderRadius: 99,
                          background: item.color,
                          width: barsVisible ? `${item.score}%` : "0%",
                          transition: `width 0.7s cubic-bezier(0.25,1,0.5,1) ${i * 80}ms`,
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Verdict footer */}
              <div style={{
                borderTop: `1px solid ${BORDER}`,
                padding: "12px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    padding: "4px 12px",
                    borderRadius: 50,
                    background: buySignal ? `${GREEN}18` : `${RED}14`,
                    color: buySignal ? GREEN : RED,
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    transition: "all 0.3s",
                  }}>
                    {buySignal ? "Good choice" : "Avoid"}
                  </div>
                  <span style={{ fontSize: "0.72rem", color: TEXT_MUTED, transition: "color 0.3s" }}>
                    Score: <strong style={{ color: TEXT }}>{buySignal ? "82" : "31"}/100</strong>
                  </span>
                </div>
                <span style={{ fontSize: "0.65rem", color: TEXT_MUTED, fontStyle: "italic" }}>Demo</span>
              </div>
            </div>
          </div>

          {/* ── Feature cards grid ── */}
          <div>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: TEXT_MUTED, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 10 }}>
              Explore
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {FEATURE_CARDS.map(card => (
                <Link key={card.title} to={card.to} style={{ textDecoration: "none" }}>
                  <div style={{
                    background: card.bg,
                    borderRadius: 18,
                    overflow: "hidden",
                    aspectRatio: "1 / 0.82",
                    display: "flex",
                    flexDirection: "column",
                    padding: "12px 14px 14px",
                  }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {card.illustration}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <p style={{ fontSize: "0.92rem", fontWeight: 800, color: "#111827", marginBottom: 2, letterSpacing: "-0.02em" }}>
                        {card.title}
                      </p>
                      <p style={{ fontSize: "0.68rem", color: "#4B5563", lineHeight: 1.35, fontWeight: 400 }}>
                        {card.desc}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── 6 Ethics checks ── */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <p style={{ fontSize: "0.72rem", fontWeight: 700, color: TEXT_MUTED, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Ethics checks
              </p>
              <span style={{
                fontSize: "0.65rem", fontWeight: 700, color: BLUE,
                background: BLUE_LIGHT, borderRadius: 50, padding: "2px 8px",
              }}>6 total</span>
            </div>
            <div style={{
              background: CARD,
              borderRadius: 18,
              border: `1px solid ${BORDER}`,
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              overflow: "hidden",
            }}>
              {CHECKS.map((c, i) => {
                const Icon = c.icon;
                return (
                  <div key={c.label} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "13px 16px",
                    borderBottom: i < CHECKS.length - 1 ? `1px solid ${BORDER}` : "none",
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 10,
                      background: `${c.color}15`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Icon style={{ width: 16, height: 16, color: c.color }} strokeWidth={2} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: TEXT, marginBottom: 1 }}>
                        {c.label}
                      </p>
                      <p style={{ fontSize: "0.72rem", color: TEXT_MUTED }}>
                        {c.desc}
                      </p>
                    </div>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: GREEN,
                      flexShrink: 0,
                    }} />
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </main>

      <BottomNav />
    </div>
  );
}
