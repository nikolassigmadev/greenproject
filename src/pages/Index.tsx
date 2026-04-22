import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ScanLine, ShoppingCart, AlertCircle, ChevronRight,
  Globe, Shield, Leaf, TrendingUp, Heart, Activity,
  Scan, Receipt, BarChart3, Settings,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { loadPriorities, DEFAULT_PRIORITIES } from "@/utils/userPreferences";

/* ─── Scanner visual chip data ──────────────────────────────────────── */
const SCANNER_CHIPS = [
  { label: "LABOUR", color: "#ff4136", verdict: "⚠", cls: "scanner-chip-0" },
  { label: "CARBON", color: "#00c853", verdict: "✓", cls: "scanner-chip-1" },
  { label: "ANIMAL", color: "#00c853", verdict: "✓", cls: "scanner-chip-2" },
  { label: "NUTRI",  color: "#ffc700", verdict: "B", cls: "scanner-chip-3" },
];

// Barcode bar widths (flex-basis units)
const BARCODE = [2,1,1,2,1,3,1,1,2,1,2,1,1,2,1,1,2,1,1,3];

/* ─── Demo card data ────────────────────────────────────────────────── */
const DEMO_SCORES = [
  { label: "Labour Rights", score: 38, color: "#ff4136", icon: Shield,     verdict: "Issues found" },
  { label: "Carbon (CO₂)",  score: 74, color: "#00c853", icon: Leaf,       verdict: "Low impact"   },
  { label: "Animal Welfare",score: 88, color: "#00c853", icon: Heart,       verdict: "Good"         },
  { label: "Nutrition",     score: 72, color: "#ffc700", icon: Activity,    verdict: "B Grade"      },
  { label: "Origin",        score: 55, color: "#ffc700", icon: Globe,       verdict: "Mixed"        },
];

/* ─── Quick actions ─────────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  { icon: Scan,      label: "SCAN",    sub: "any product", to: "/scan",        col: "#00c853" },
  { icon: Receipt,   label: "CART",    sub: "whole shop",  to: "/receipt",     col: "#ffc700" },
  { icon: BarChart3, label: "HISTORY", sub: "past scans",  to: "/dashboard",   col: "#40aaff" },
  { icon: Settings,  label: "VALUES",  sub: "priorities",  to: "/preferences", col: "#cc88ff" },
];

/* ─── Analysis dimensions ───────────────────────────────────────────── */
const CHECKS = [
  { icon: Globe,      label: "ORIGIN",       desc: "Where ingredients come from", color: "#40aaff" },
  { icon: Shield,     label: "LABOUR",       desc: "Forced & child labour flags",  color: "#ff4136" },
  { icon: Leaf,       label: "CARBON",       desc: "CO₂ per 100 g lifecycle",      color: "#00c853" },
  { icon: TrendingUp, label: "ALTERNATIVES", desc: "Greener swaps ranked for you", color: "#ffc700" },
  { icon: Heart,      label: "ANIMAL",       desc: "BBFAW welfare scores",         color: "#ff69b4" },
  { icon: Activity,   label: "NUTRITION",    desc: "Nutri-Score A–E grade",        color: "#00c853" },
];

/* ─── Shared tokens ─────────────────────────────────────────────────── */
const D  = "'Bebas Neue', sans-serif";
const M  = "'JetBrains Mono', monospace";
const G  = "#00c853";
const GR = "#84898E";
const B  = "rgba(255,255,255,0.08)";

/* ═══════════════════════════════════════════════════════════════════ */

export default function Index() {
  const [isDefaultPriorities, setIsDefaultPriorities] = useState(() => {
    const p = loadPriorities();
    return (
      p.environment  === DEFAULT_PRIORITIES.environment &&
      p.laborRights  === DEFAULT_PRIORITIES.laborRights &&
      p.animalWelfare=== DEFAULT_PRIORITIES.animalWelfare &&
      p.nutrition    === DEFAULT_PRIORITIES.nutrition
    );
  });

  const [barsVisible, setBarsVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setBarsVisible(true), 320);
    return () => clearTimeout(t);
  }, []);

  const [buySignal, setBuySignal] = useState(true);
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => setBuySignal(v => !v), 2200);
    }, 3600);
    return () => { clearTimeout(timeoutId); clearInterval(intervalId); };
  }, []);

  useEffect(() => {
    const check = () => {
      const p = loadPriorities();
      setIsDefaultPriorities(
        p.environment  === DEFAULT_PRIORITIES.environment &&
        p.laborRights  === DEFAULT_PRIORITIES.laborRights &&
        p.animalWelfare=== DEFAULT_PRIORITIES.animalWelfare &&
        p.nutrition    === DEFAULT_PRIORITIES.nutrition
      );
    };
    window.addEventListener("prioritiesUpdated", check);
    window.addEventListener("focus", check);
    return () => {
      window.removeEventListener("prioritiesUpdated", check);
      window.removeEventListener("focus", check);
    };
  }, []);

  const scoreColor = (s: number) => s >= 70 ? G : s >= 45 ? "#ffc700" : "#ff4136";

  return (
    <div style={{ background: "#000", minHeight: "100vh", overflowX: "hidden" }}>
      <div className="scanlines" />

      <main className="pb-nav" style={{ position: "relative", zIndex: 1 }}>

        {/* ── Top bar ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "max(52px, env(safe-area-inset-top)) 20px 14px",
          borderBottom: `1px solid ${B}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span className="terminal-cursor" style={{ width: 6, height: 6, borderRadius: "50%", background: G, display: "inline-block" }} />
            <span style={{ fontFamily: M, fontSize: "0.44rem", color: GR, letterSpacing: "0.24em", textTransform: "uppercase" }}>
              ETHICAL SCANNER
            </span>
          </div>
          <Link to="/basket" style={{ width: 36, height: 36, border: `1px solid ${B}`, display: "flex", alignItems: "center", justifyContent: "center", color: GR }} aria-label="View basket">
            <ShoppingCart className="w-4 h-4" />
          </Link>
        </div>

        {/* ══════════════════════════════════════════
            HERO — headline left, scanner visual right
        ══════════════════════════════════════════ */}
        <div style={{ padding: "36px 20px 0", position: "relative" }}>
          {/* Corner marks */}
          {(["tl","tr","bl","br"] as const).map(c => (
            <div key={c} style={{ position: "absolute", [c.startsWith("t")?"top":"bottom"]: 10, [c.endsWith("l")?"left":"right"]: 10, fontFamily: "monospace", fontSize: 13, color: "rgba(255,255,255,0.14)", userSelect: "none" }}>+</div>
          ))}

          {/* Tag */}
          <p style={{ fontFamily: M, fontSize: "0.48rem", color: G, letterSpacing: "0.26em", textTransform: "uppercase", marginBottom: 16, opacity: 0.85 }}>
            // WHAT IS THIS APP?
          </p>

          {/* ── Side-by-side: headline + scanner ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 155px", gap: 8, alignItems: "start" }}>

            {/* LEFT: headline */}
            <div>
              <h1 style={{ fontFamily: D, fontWeight: 400, lineHeight: 0.9, margin: "0 0 20px" }}>
                <span style={{ display: "block", fontSize: "clamp(2.6rem, 12vw, 4.2rem)", color: "#fff", letterSpacing: "0.02em" }}>SCAN ANY PRODUCT.</span>
                <span style={{ display: "block", fontSize: "clamp(2.6rem, 12vw, 4.2rem)", color: G, letterSpacing: "0.02em", textShadow: "0 0 30px rgba(0,200,83,0.3)" }}>SEE ITS ETHICS.</span>
              </h1>
              <p style={{ fontFamily: M, fontSize: "0.75rem", color: GR, lineHeight: 1.75, letterSpacing: "0.02em" }}>
                Point your camera at any barcode. Instantly see labour rights, carbon footprint, animal welfare, nutrition grade, origin & greener alternatives — free.
              </p>
            </div>

            {/* RIGHT: animated scanner visual — chips intentionally bleed off-screen right */}
            <div style={{ position: "relative", minHeight: 315, overflow: "visible" }}>

              {/* Dot-grid background */}
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                backgroundImage: "radial-gradient(circle, rgba(0,200,83,0.12) 1px, transparent 1px)",
                backgroundSize: "8px 8px",
              }} />

              {/* ── Product box ── */}
              <div className="scanner-product" style={{ position: "absolute", left: 3, top: 8, width: 105, height: 190 }}>

                {/* Lock-on bracket corners (4 L-shapes) */}
                {[0,1,2,3].map((i) => {
                  const pos = [
                    { top: -4, left: -4 },
                    { top: -4, right: -4 },
                    { bottom: -4, left: -4 },
                    { bottom: -4, right: -4 },
                  ][i];
                  const borders = [
                    { borderTop: "2px solid", borderLeft: "2px solid" },
                    { borderTop: "2px solid", borderRight: "2px solid" },
                    { borderBottom: "2px solid", borderLeft: "2px solid" },
                    { borderBottom: "2px solid", borderRight: "2px solid" },
                  ][i];
                  return (
                    <div key={i} className="scanner-bracket" style={{
                      position: "absolute", width: 11, height: 11,
                      borderColor: G,
                      ...pos, ...borders,
                    }} />
                  );
                })}

                {/* Product body */}
                <div style={{ width: "100%", height: "100%", border: "1px solid rgba(0,200,83,0.35)", overflow: "hidden", position: "relative", background: "rgba(0,200,83,0.03)" }}>

                  {/* Label band */}
                  <div style={{ height: "30%", borderBottom: "1px solid rgba(0,200,83,0.18)", background: "rgba(0,200,83,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: D, fontSize: "1.1rem", color: "rgba(0,200,83,0.75)", letterSpacing: "0.06em" }}>OAT MILK</span>
                  </div>

                  {/* Product icon */}
                  <div style={{ height: "42%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{
                      fontSize: "2.4rem", lineHeight: 1,
                      filter: "grayscale(1) sepia(1) hue-rotate(72deg) saturate(14) brightness(0.6) drop-shadow(0 0 6px rgba(0,200,83,0.5))",
                      opacity: 0.7,
                    }}>🥛</span>
                  </div>

                  {/* Barcode */}
                  <div style={{ height: "28%", display: "flex", alignItems: "flex-end", padding: "0 7px 5px", gap: 1 }}>
                    {BARCODE.map((w, i) => (
                      <div key={i} style={{ flexBasis: w * 2, flexShrink: 0, height: i % 4 === 0 ? "75%" : "55%", background: "rgba(255,255,255,0.22)" }} />
                    ))}
                  </div>

                  {/* Scan beam */}
                  <div className="scanner-beam" style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 2,
                    background: G,
                    boxShadow: `0 0 8px ${G}, 0 0 20px rgba(0,200,83,0.4)`,
                  }} />

                  {/* Scan beam glow strip */}
                  <div className="scanner-beam" style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 20,
                    background: "linear-gradient(to bottom, rgba(0,200,83,0.16), transparent)",
                    pointerEvents: "none",
                  }} />
                </div>
              </div>

              {/* ── Score chips — bleed off right edge ── */}
              <div style={{ position: "absolute", left: 110, top: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                {SCANNER_CHIPS.map((chip, i) => (
                  <div key={chip.label} className={chip.cls} style={{ opacity: 0 }}>
                    {/* Connector tick */}
                    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                      <div style={{ width: 6, height: 1, background: `${chip.color}55`, flexShrink: 0 }} />
                      {/* Chip */}
                      <div style={{
                        background: "#000",
                        border: `1px solid ${chip.color}`,
                        padding: "4px 7px",
                        display: "flex", alignItems: "center", gap: 4,
                        whiteSpace: "nowrap",
                      }}>
                        <div className="scanner-dot" style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: chip.color,
                          animationDelay: `${i * 0.4}s`,
                          flexShrink: 0,
                        }} />
                        <div style={{ lineHeight: 1 }}>
                          <div style={{ fontFamily: M, fontSize: "0.44rem", color: chip.color, letterSpacing: "0.08em" }}>{chip.label}</div>
                          <div style={{ fontFamily: D, fontSize: "0.75rem", color: "#fff", letterSpacing: "0.06em", lineHeight: 1.1 }}>{chip.verdict}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Processing label ── */}
              <div style={{ position: "absolute", bottom: 0, left: 0, width: 108, textAlign: "center" }}>
                <span className="terminal-cursor" style={{ fontFamily: M, fontSize: "0.4rem", color: "rgba(0,200,83,0.4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  SCANNING...
                </span>
              </div>

              {/* ── Verdict arrow ── */}
              <div className="scanner-verdict" style={{
                position: "absolute", left: 3, top: 206, width: 105,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              }}>
                <div style={{
                  fontFamily: M, fontSize: "0.5rem", color: "rgba(132,137,142,0.7)",
                  letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 2,
                }}>VERDICT</div>
                <div className="scanner-verdict-arrow" style={{
                  fontFamily: M, fontSize: "0.7rem", lineHeight: 1,
                  color: buySignal ? G : "#ff4136",
                  transition: "color 0.3s",
                }}>▼</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                  <div style={{
                    fontFamily: D, fontSize: "2rem", letterSpacing: "0.04em", lineHeight: 1,
                    color: buySignal ? G : "#ff4136",
                    textShadow: buySignal ? "0 0 18px rgba(0,200,83,0.8)" : "0 0 18px rgba(255,65,54,0.8)",
                    transition: "color 0.3s, text-shadow 0.3s",
                  }}>
                    {buySignal ? "82" : "31"}
                  </div>
                  <div style={{
                    fontFamily: M, fontSize: "0.85rem", color: "rgba(132,137,142,0.6)",
                    letterSpacing: "0.1em",
                  }}>/100</div>
                </div>
                <div style={{
                  fontFamily: D, fontSize: "1.5rem", letterSpacing: "0.08em", lineHeight: 1,
                  color: buySignal ? G : "#ff4136",
                  transition: "color 0.3s",
                }}>
                  {buySignal ? "BUY" : "AVOID"}
                </div>
              </div>

              {/* ── Data flow lines (decorative vertical dashes) ── */}
              {[30, 60, 90].map((left, i) => (
                <div key={i} style={{
                  position: "absolute",
                  left,
                  top: 208,
                  width: 1,
                  height: 80,
                  overflow: "hidden",
                  opacity: 0.25,
                  pointerEvents: "none",
                }}>
                  <div style={{
                    width: 1,
                    height: "200%",
                    background: `repeating-linear-gradient(to bottom, ${G} 0px, ${G} 4px, transparent 4px, transparent 9px)`,
                    animation: `dataFlow ${2.2 + i * 0.6}s linear ${i * 0.7}s infinite`,
                  }} />
                </div>
              ))}
            </div>
          </div>

          {/* ── CTA — full width below grid ── */}
          <div style={{ marginTop: 24, paddingBottom: 24, borderBottom: `2px solid rgba(255,255,255,0.12)` }}>
            <Link to="/scan" style={{ display: "block", textDecoration: "none" }}>
              <div style={{ background: G, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
                {(["tl","tr","bl","br"] as const).map(c => (
                  <div key={c} style={{ position: "absolute", [c.startsWith("t")?"top":"bottom"]: 5, [c.endsWith("l")?"left":"right"]: 8, fontFamily: "monospace", fontSize: 11, color: "rgba(0,0,0,0.28)", userSelect: "none" }}>+</div>
                ))}
                <div>
                  <p style={{ fontFamily: M, fontSize: "0.44rem", color: "rgba(0,0,0,0.5)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 3 }}>
                    TAP TO BEGIN
                  </p>
                  <p style={{ fontFamily: D, fontSize: "clamp(2rem, 9vw, 2.6rem)", color: "#000", letterSpacing: "0.04em", lineHeight: 1, fontWeight: 400 }}>
                    START SCANNING
                  </p>
                </div>
                <ScanLine style={{ width: 30, height: 30, color: "#000", opacity: 0.65, flexShrink: 0 }} strokeWidth={1.5} />
              </div>
            </Link>

            {isDefaultPriorities && (
              <Link to="/preferences" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, textDecoration: "none", padding: "8px 0" }}>
                <AlertCircle size={12} style={{ color: "#ffc700", flexShrink: 0 }} />
                <span style={{ fontFamily: M, fontSize: "0.53rem", color: "#ffc700", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Personalise results — set your priorities →
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            DEMO SCAN CARD — shows what you get
        ══════════════════════════════════════════ */}
        <div style={{ padding: "24px 20px", borderBottom: `1px solid ${B}` }}>
          <p style={{ fontFamily: M, fontSize: "0.48rem", color: GR, letterSpacing: "0.26em", textTransform: "uppercase", marginBottom: 14 }}>
            // EXAMPLE SCAN RESULT
          </p>

          <div style={{ border: `1px solid rgba(255,255,255,0.14)`, position: "relative", overflow: "hidden" }}>
            {(["tl","tr","bl","br"] as const).map(c => (
              <div key={c} style={{ position: "absolute", [c.startsWith("t")?"top":"bottom"]: 8, [c.endsWith("l")?"left":"right"]: 10, fontFamily: "monospace", fontSize: 11, color: "rgba(0,200,83,0.22)", userSelect: "none" }}>+</div>
            ))}

            {/* Card header */}
            <div style={{ padding: "16px 18px 14px", borderBottom: `1px solid ${B}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontFamily: M, fontSize: "0.44rem", color: GR, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 4 }}>
                  SCANNED PRODUCT
                </p>
                <p style={{ fontFamily: D, fontSize: "clamp(1.6rem, 7vw, 2.2rem)", color: "#fff", letterSpacing: "0.04em", lineHeight: 1, marginBottom: 2 }}>
                  OAT MILK
                </p>
                <p style={{ fontFamily: M, fontSize: "0.5rem", color: GR, letterSpacing: "0.12em" }}>
                  SOME BRAND CO.
                </p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontFamily: M, fontSize: "0.42rem", color: GR, letterSpacing: "0.14em", marginBottom: 3 }}>SCORE</p>
                <p style={{ fontFamily: D, fontSize: "clamp(2rem, 9vw, 2.8rem)", color: scoreColor(61), lineHeight: 1, textShadow: `0 0 18px ${scoreColor(61)}55` }}>
                  61
                </p>
                <p style={{ fontFamily: M, fontSize: "0.38rem", color: GR, letterSpacing: "0.1em" }}>/100</p>
              </div>
            </div>

            {/* Score bars */}
            <div style={{ padding: "14px 18px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
              {DEMO_SCORES.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={item.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <Icon style={{ width: 11, height: 11, color: item.color, flexShrink: 0 }} strokeWidth={1.5} />
                        <span style={{ fontFamily: M, fontSize: "0.5rem", color: "#fff", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                          {item.label}
                        </span>
                      </div>
                      <span style={{ fontFamily: M, fontSize: "0.5rem", color: item.color, letterSpacing: "0.05em" }}>
                        {item.verdict}
                      </span>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
                      <div style={{
                        position: "absolute", top: 0, left: 0, height: "100%",
                        background: item.color,
                        width: barsVisible ? `${item.score}%` : "0%",
                        transition: `width 0.7s cubic-bezier(0.25,1,0.5,1) ${i * 100}ms`,
                        boxShadow: `0 0 8px ${item.color}88`,
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Greener swap teaser */}
            <div style={{ borderTop: `1px solid ${B}`, padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <TrendingUp style={{ width: 11, height: 11, color: "#ffc700", flexShrink: 0 }} strokeWidth={1.5} />
                <span style={{ fontFamily: M, fontSize: "0.5rem", color: "#ffc700", letterSpacing: "0.08em" }}>
                  GREENER SWAP AVAILABLE
                </span>
              </div>
              <ChevronRight style={{ width: 14, height: 14, color: GR }} />
            </div>
          </div>

          <p style={{ fontFamily: M, fontSize: "0.44rem", color: "rgba(132,137,142,0.4)", letterSpacing: "0.1em", marginTop: 10, textAlign: "center" }}>
            DEMO · Real results vary by product
          </p>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `1px solid ${B}` }}>
          {[
            { value: "3M+",  label: "Products" },
            { value: "6",    label: "Checks" },
            { value: "Free", label: "Always" },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: "20px 12px", textAlign: "center", borderRight: i < 2 ? `1px solid ${B}` : "none" }}>
              <p style={{ fontFamily: M, fontWeight: 900, fontSize: "1.5rem", color: "#fff", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 4 }}>
                {s.value}
              </p>
              <p style={{ fontFamily: M, fontSize: "0.46rem", color: GR, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Quick access grid ── */}
        <div style={{ padding: "20px 20px 0" }}>
          <p style={{ fontFamily: M, fontSize: "0.48rem", color: GR, letterSpacing: "0.24em", textTransform: "uppercase", marginBottom: 12 }}>
            // QUICK ACCESS
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: `1px solid ${B}` }}>
            {QUICK_ACTIONS.map((item, i) => {
              const Icon = item.icon;
              return (
                <Link key={item.label} to={item.to} style={{
                  textDecoration: "none", padding: "18px 16px 16px",
                  borderRight: i % 2 === 0 ? `1px solid ${B}` : "none",
                  borderBottom: i < 2 ? `1px solid ${B}` : "none",
                  display: "flex", flexDirection: "column", gap: 10, position: "relative",
                }}>
                  <div className="diagonal-stripe" style={{ position: "absolute", inset: 0, opacity: 0.5 }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
                    <span style={{ fontFamily: M, fontSize: "0.46rem", color: "rgba(132,137,142,0.4)", letterSpacing: "0.12em" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <Icon style={{ width: 13, height: 13, color: item.col, flexShrink: 0, opacity: 0.9 }} strokeWidth={1.5} />
                  </div>
                  <div style={{ position: "relative" }}>
                    <p style={{ fontFamily: D, fontSize: "clamp(1.5rem, 7vw, 2rem)", color: "#fff", letterSpacing: "0.04em", lineHeight: 1, marginBottom: 5 }}>
                      {item.label}
                    </p>
                    <p style={{ fontFamily: M, fontSize: "0.48rem", color: GR, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      {item.sub}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── 6 Checks manifest ── */}
        <div style={{ padding: "24px 20px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <p style={{ fontFamily: M, fontSize: "0.48rem", color: GR, letterSpacing: "0.24em", textTransform: "uppercase" }}>
              // 6 ETHICS CHECKS
            </p>
            <span style={{ fontFamily: D, fontSize: "1.6rem", color: "#40aaff", lineHeight: 1 }}>6</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {CHECKS.map((c, i) => {
              const Icon = c.icon;
              return (
                <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 0, borderLeft: `3px solid ${c.color}`, background: "rgba(255,255,255,0.02)", padding: "13px 0" }}>
                  <span style={{ fontFamily: M, fontSize: "0.46rem", color: "rgba(132,137,142,0.35)", letterSpacing: "0.1em", minWidth: "2.8rem", paddingLeft: 12 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Icon style={{ width: 12, height: 12, color: c.color, flexShrink: 0, marginRight: 10, opacity: 0.85 }} strokeWidth={1.5} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontFamily: D, fontSize: "clamp(1rem, 4.5vw, 1.3rem)", color: "#fff", letterSpacing: "0.06em", lineHeight: 1 }}>
                      {c.label}
                    </span>
                    <span style={{ fontFamily: M, fontSize: "0.5rem", color: GR, marginLeft: 10, letterSpacing: "0.03em" }}>
                      {c.desc}
                    </span>
                  </div>
                  <span style={{ fontFamily: M, fontSize: "0.44rem", color: G, letterSpacing: "0.12em", paddingRight: 14, flexShrink: 0 }}>
                    [ON]
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Bottom CTA ── */}
        <div style={{ marginTop: 24, borderTop: "2px solid rgba(255,255,255,0.1)" }}>
          <Link to="/scan" style={{ display: "block", textDecoration: "none", background: "#000", position: "relative" }}>
            {(["tl","tr","bl","br"] as const).map(c => (
              <div key={c} style={{ position: "absolute", [c.startsWith("t")?"top":"bottom"]: 8, [c.endsWith("l")?"left":"right"]: 12, fontFamily: "monospace", fontSize: 12, color: "rgba(0,200,83,0.3)", userSelect: "none", zIndex: 1 }}>+</div>
            ))}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 28px" }}>
              <div>
                <p style={{ fontFamily: M, fontSize: "0.46rem", color: G, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 6, opacity: 0.7 }}>
                  // START_SESSION
                </p>
                <p style={{ fontFamily: D, fontSize: "clamp(2rem, 9vw, 2.8rem)", color: "#fff", letterSpacing: "0.06em", lineHeight: 1, fontWeight: 400 }}>
                  [ START SCANNING ]
                </p>
              </div>
              <div style={{ width: 44, height: 44, border: `1px solid ${G}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ScanLine style={{ width: 20, height: 20, color: G }} strokeWidth={1.5} />
              </div>
            </div>
          </Link>
        </div>

      </main>

      <BottomNav />
    </div>
  );
}
