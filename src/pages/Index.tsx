import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Camera, Leaf, Shield, BarChart3, Users, Award, Zap, CheckCircle2, AlertTriangle as AlertTriangleIcon, Search, GitCompareArrows, ScanLine, Eye } from "lucide-react";
import { Logo, Wordmark } from "@/components/Logo";
import { DS, scoreTone, toneColor, toneBg } from "@/styles/design-tokens";
import { loadScanHistory, type ScanHistoryEntry } from "@/utils/userPreferences";
import {
  scanEntryToShowcase,
  hasCompleteEcoData,
  type ShowcaseProduct,
} from "@/utils/recentScanShowcase";

/* ── Animated result card (shared by the example demo and recent scan) ── */

const DEMO_PRODUCTS: ShowcaseProduct[] = [
  {
  name: "Niko's Lemonade",
  subtitle: "Niko's Beverages · 500mL",
  score: 88,
  verdict: "BUY",
  verdictColor: DS.good,
  verdictBg: DS.goodBg,
  ringColor: DS.good,
  description: "Made with locally sourced lemons, recyclable packaging, and ethically produced ingredients.",
  icon: "good",
  categories: [
    { label: "Environment", value: 90, color: DS.good },
    { label: "Labour", value: 85, color: DS.good },
    { label: "Nutrition", value: 82, color: DS.good },
    { label: "Packaging", value: 94, color: DS.good },
  ],
},
  {
    name: "Choco Crunch Bar",
    subtitle: "MegaCorp · 45g",
    score: 14,
    verdict: "AVOID",
    verdictColor: DS.bad,
    verdictBg: DS.badBg,
    ringColor: DS.bad,
    description: "High deforestation risk, child labour allegations, ultra-processed.",
    icon: "bad",
    categories: [
      { label: "Environment", value: 12, color: DS.bad },
      { label: "Labour", value: 8, color: DS.bad },
      { label: "Nutrition", value: 18, color: DS.bad },
      { label: "Animal welfare", value: 22, color: DS.bad },
    ],
  },
];

interface ResultShowcaseProps {
  /** Products to render. The demo passes several; a recent scan passes one. */
  products: ShowcaseProduct[];
  /** Cycle through products on a timer (only meaningful with 2+ products). */
  cycle: boolean;
  /** Footer content under the card (example hint, or a "view breakdown" link). */
  footer?: React.ReactNode;
}

function ResultShowcase({ products, cycle, footer }: ResultShowcaseProps) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [fadePhase, setFadePhase] = useState<"in" | "out">("in");
  const ref = useRef<HTMLDivElement>(null);

  const cycling = cycle && products.length > 1;

  // displayedIndex only updates after fade-out completes, so old product stays visible during exit
  const product = products[displayedIndex] ?? products[0];

  // Trigger animation when scrolled into view
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isFirstRender = useRef(true);

  // Animate score counting up on first appearance
  useEffect(() => {
    if (!visible) return;
    if (!isFirstRender.current) return;
    isFirstRender.current = false;
    setProgress(0);
    let frame: number;
    const start = performance.now();
    const duration = 1000;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  // Cycle between products (no-op for a single product, e.g. a recent scan)
  useEffect(() => {
    if (!visible || !cycling) return;
    const DISPLAY_TIME = 4700;
    const FADE_OUT_TIME = 400;
    const interval = setInterval(() => {
      setFadePhase("out");
      setTimeout(() => {
        setActiveIndex((i) => (i + 1) % products.length);
      }, FADE_OUT_TIME);
    }, DISPLAY_TIME);
    return () => clearInterval(interval);
  }, [visible, cycling, products.length]);

  // When activeIndex changes, swap displayed product and fade back in
  useEffect(() => {
    setDisplayedIndex(activeIndex);
    setProgress(1);
    // Small delay so the DOM updates with new product data before fading in
    requestAnimationFrame(() => {
      setFadePhase("in");
    });
  }, [activeIndex]);

  const score = Math.round(progress * product.score);
  const circumference = 2 * Math.PI * 42;
  const strokeDash = circumference * (progress * product.score / 100);

  const contentOpacity = fadePhase === "in" ? 1 : 0;
  const contentTransform = fadePhase === "in" ? "translateY(0)" : "translateY(8px)";

  return (
    <div ref={ref} style={{
      background: DS.card, borderRadius: DS.radius.lg, padding: 20,
      overflow: "hidden",
      boxShadow: "0 2px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
    }}>
      <div style={{
        opacity: contentOpacity,
        transform: contentTransform,
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}>
        {/* Mock product header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginBottom: 18,
          opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(8px)",
          transition: "all 0.4s ease 0.1s",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: product.icon === "good" ? DS.goodBg : DS.badBg,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {product.icon === "good"
              ? <Leaf style={{ width: 20, height: 20, color: DS.good }} />
              : <AlertTriangleIcon style={{ width: 20, height: 20, color: DS.bad }} />
            }
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{product.name}</p>
            <p style={{ fontSize: 12, color: DS.muted, margin: "2px 0 0" }}>{product.subtitle}</p>
          </div>
        </div>

        {/* Score ring + verdict */}
        <div style={{
          display: "flex", alignItems: "center", gap: 20, marginBottom: 20,
          opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)",
          transition: "all 0.5s ease 0.3s",
        }}>
          {/* SVG ring */}
          <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
            <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="48" cy="48" r="42" fill="none" stroke={DS.bg} strokeWidth="8" />
              <circle
                cx="48" cy="48" r="42" fill="none"
                stroke={product.ringColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - strokeDash}
                style={{ transition: "none" }}
              />
            </svg>
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: DS.ink, lineHeight: 1 }}>{score}</span>
              <span style={{ fontSize: 10, color: DS.muted, marginTop: 2 }}>/ 100</span>
            </div>
          </div>

          {/* Verdict */}
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 20,
              background: product.verdictBg, marginBottom: 8,
              opacity: progress > 0.7 ? 1 : 0,
              transition: "opacity 0.3s",
            }}>
              {product.icon === "good"
                ? <CheckCircle2 style={{ width: 14, height: 14, color: product.verdictColor }} />
                : <AlertTriangleIcon style={{ width: 14, height: 14, color: product.verdictColor }} />
              }
              <span style={{ fontSize: 13, fontWeight: 700, color: product.verdictColor }}>{product.verdict}</span>
            </div>
            <p style={{ fontSize: 13, color: DS.muted, margin: 0, lineHeight: 1.45, maxWidth: 180 }}>
              {product.description}
            </p>
          </div>
        </div>

        {/* Category breakdown bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {product.categories.map((cat, i) => (
            <div key={cat.label} style={{
              opacity: visible ? 1 : 0, transform: visible ? "translateX(0)" : "translateX(-10px)",
              transition: `all 0.4s ease ${0.3 + i * 0.08}s`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: DS.ink }}>{cat.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: cat.color }}>
                  {Math.round(progress * cat.value)}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: DS.bg, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 3, background: cat.color,
                  width: `${progress * cat.value}%`,
                  transition: "none",
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer — example hint or a link to the real breakdown */}
      <div style={{
        marginTop: 16,
        opacity: visible ? 1 : 0, transition: "opacity 0.4s ease 1s",
      }}>
        {footer}
      </div>

      {/* Dots indicator — only when cycling through multiple products */}
      {cycling && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
          {products.map((_, i) => (
            <div key={i} style={{
              width: i === displayedIndex ? 16 : 6, height: 6, borderRadius: 3,
              background: i === displayedIndex ? DS.ink : DS.hair,
              transition: "all 0.4s ease",
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Score badge ──────────────────────────────────────────────────── */
function ScoreBadge({ score }: { score: number }) {
  const tone = scoreTone(score);
  const c = toneColor(tone);
  const bg = toneBg(tone);
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 20, background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 15, fontWeight: 700, color: c, flexShrink: 0,
    }}>{score}</div>
  );
}

export default function Index() {
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);

  // Keep the hero in sync if a scan lands while this page stays mounted.
  useEffect(() => {
    const refresh = () => setHistory(loadScanHistory());
    window.addEventListener("scanHistoryUpdated", refresh);
    return () => window.removeEventListener("scanHistoryUpdated", refresh);
  }, []);

  useEffect(() => {
    setHistory(loadScanHistory());
  }, []);

  const recent = history.slice(0, 3);
  // Once the user has scanned a fully eco-scored product, the hero card swaps
  // from the rotating example to their most recent such scan — same card,
  // same animation — with a link through to the full breakdown.
  const recentEco = history.find(hasCompleteEcoData) ?? null;

  return (
    <div style={{ background: DS.bg, minHeight: "100dvh", fontFamily: DS.font, color: DS.ink }}>
      <main style={{ padding: "0 20px", paddingBottom: 110, maxWidth: 640, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ paddingTop: "max(60px, calc(env(safe-area-inset-top, 0px) + 16px))", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 6px" }}>
            <Logo size={28} />
            <Wordmark fontSize={16} />
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: -0.5, lineHeight: 1.15 }}>
            Shop with your <span style={{ color: DS.good }}>Values</span>.
          </h1>
          <p style={{ fontSize: 15, color: DS.muted, margin: "10px 0 0", lineHeight: 1.55 }}>
            Scan any product and instantly see its impact on the planet, people, and your health.
          </p>
        </div>

        {/* Big scan CTA — sticky on scroll */}
        <div style={{
          position: "sticky",
          top: "calc(env(safe-area-inset-top, 0px) + 12px)",
          zIndex: 30,
          marginBottom: 28,
        }}>
        <Link to="/scan" style={{ textDecoration: "none", display: "block" }}>
          <div style={{
            background: "var(--ds-scan-cta)", color: "#F7F6F3", borderRadius: DS.radius.lg, padding: 22,
            border: "1px solid var(--ds-scan-cta-border)",
            display: "flex", alignItems: "center", gap: 16,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 28, background: DS.good,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Camera style={{ width: 26, height: 26, color: "#F7F6F3" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Scan a product</div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>Point your camera at any barcode</div>
            </div>
            <ChevronRight style={{ width: 20, height: 20, opacity: 0.7 }} />
          </div>
        </Link>
        </div>

        {/* Enter product manually */}
        <Link to="/scan?manual=true" style={{
          textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, marginTop: -16, marginBottom: 28, padding: "8px 0",
        }}>
          <Search style={{ width: 14, height: 14, color: DS.muted }} />
          <span style={{ fontSize: 13, color: DS.muted, fontWeight: 500 }}>Or enter a product manually</span>
        </Link>

        {/* Animated result — example for new users, recent scan once they have one */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 14px" }}>
            {recentEco ? "Your most recent scan" : "Example result"}
          </h2>
          {recentEco ? (
            <ResultShowcase
              products={[scanEntryToShowcase(recentEco)]}
              cycle={false}
              footer={
                <Link
                  to={`/product-off/${recentEco.barcode}`}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    textDecoration: "none", background: DS.bg, borderRadius: 12,
                    padding: "11px 0", fontSize: 13, fontWeight: 700, color: DS.ink,
                  }}
                >
                  View full breakdown
                  <ChevronRight style={{ width: 15, height: 15 }} />
                </Link>
              }
            />
          ) : (
            <ResultShowcase
              products={DEMO_PRODUCTS}
              cycle
              footer={
                <p style={{ fontSize: 11, color: DS.muted, textAlign: "center", margin: 0 }}>
                  This is an example — scan any product to see its real score
                </p>
              }
            />
          )}
        </section>

        {/* Do more — high-visibility tools row, placed above the explainer content */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Do more</h2>
            <p style={{ fontSize: 13, color: DS.muted, margin: "4px 0 0", lineHeight: 1.45 }}>
              Beyond scanning — compare products, track brands, and review your impact.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { icon: ScanLine, title: "Scan a shelf", desc: "We pick the best-rated product", to: "/shelf", color: DS.good },
              { icon: GitCompareArrows, title: "Compare", desc: "Put two products head-to-head", to: "/compare", color: DS.warn },
              { icon: Eye, title: "Watchlist", desc: "Track brands you're watching", to: "/watchlist", color: "#9B7AAE" },
            ].map((tool) => (
              <Link key={tool.to} to={tool.to} style={{ textDecoration: "none" }}>
                <div style={{
                  background: DS.card, borderRadius: DS.radius.md, padding: 14, height: "100%",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 10,
                      background: `color-mix(in srgb, ${tool.color} 15%, transparent)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <tool.icon style={{ width: 18, height: 18, color: tool.color }} />
                    </div>
                    <ChevronRight style={{ width: 16, height: 16, color: DS.muted }} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px", color: DS.ink }}>{tool.title}</p>
                  <p style={{ fontSize: 12, color: DS.muted, margin: 0, lineHeight: 1.4 }}>{tool.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 14px" }}>How it works</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { step: "1", title: "Scan or search", desc: "Point your camera at a barcode, upload a photo, or type a product name." },
              { step: "2", title: "We analyse it", desc: "We check environmental impact, labour practices, nutrition, and certifications using open data." },
              { step: "3", title: "Get a clear score", desc: "See a simple 0–100 score plus a traffic-light verdict: Buy, Consider, or Avoid." },
            ].map((item) => (
              <div key={item.step} style={{
                background: DS.card, borderRadius: DS.radius.md, padding: 16,
                display: "flex", gap: 14, alignItems: "flex-start",
                boxShadow: "0 2px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
              }}>
                <span style={{
                  fontSize: 15, fontWeight: 800, color: DS.ink, flexShrink: 0,
                  lineHeight: 1.45, minWidth: 16,
                }}>
                  {item.step}
                </span>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 3px" }}>{item.title}</p>
                  <p style={{ fontSize: 13, color: DS.muted, margin: 0, lineHeight: 1.45 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* What we check */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 14px" }}>What we check</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { icon: Leaf, title: "Environment", desc: "Carbon footprint, packaging, transport distance", color: DS.good },
              { icon: Users, title: "Labour rights", desc: "Forced labour allegations, fair trade certification", color: DS.bad },
              { icon: Shield, title: "Animal welfare", desc: "Factory farming, testing, cruelty-free status", color: "#7A5A8A" },
              { icon: Zap, title: "Nutrition", desc: "Nutri-Score, NOVA processing level, additives", color: DS.warn },
            ].map((item) => (
              <div key={item.title} style={{
                background: DS.card, borderRadius: DS.radius.md, padding: 14,
                boxShadow: "0 2px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
              }}>
                <item.icon style={{ width: 20, height: 20, color: item.color, marginBottom: 8 }} />
                <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>{item.title}</p>
                <p style={{ fontSize: 12, color: DS.muted, margin: 0, lineHeight: 1.4 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Scoring example */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 14px" }}>Score meanings</h2>
          <div style={{ background: DS.card, borderRadius: DS.radius.md, overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)" }}>
            {[
              { range: "70–100", label: "Looks great", tone: "good" as const, desc: "Low impact, good practices" },
              { range: "45–69", label: "Mixed", tone: "warn" as const, desc: "Some concerns worth noting" },
              { range: "0–44", label: "Avoid", tone: "bad" as const, desc: "Significant ethical or environmental issues" },
            ].map((row, i) => (
              <div key={row.range} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                borderTop: i ? `1px solid ${DS.hair}` : "none",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 18,
                  background: toneColor(row.tone), color: DS.card,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 800, flexShrink: 0,
                }}>{row.range.split("–")[0]}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{row.label}</p>
                  <p style={{ fontSize: 12, color: DS.muted, margin: "2px 0 0" }}>{row.desc}</p>
                </div>
                <span style={{ fontSize: 12, color: DS.muted, flexShrink: 0 }}>{row.range}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Data sources */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 14px" }}>Our data sources</h2>
          <div style={{ background: DS.card, borderRadius: DS.radius.md, padding: 16, boxShadow: "0 2px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { name: "Open Food Facts", desc: "1M+ products with eco-scores, ingredients, and nutrition data" },
                { name: "Verified brand flags", desc: "35 manually sourced labour & ethics flags with citations" },
                { name: "Eco-Score (EU)", desc: "Lifecycle carbon analysis from Agribalyse database" },
                { name: "Nutri-Score", desc: "Nutritional quality grading (A–E)" },
              ].map((src, i) => (
                <div key={src.name} style={{
                  paddingTop: i ? 10 : 0,
                  borderTop: i ? `1px solid ${DS.hair}` : "none",
                }}>
                  <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 2px" }}>{src.name}</p>
                  <p style={{ fontSize: 12, color: DS.muted, margin: 0, lineHeight: 1.4 }}>{src.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recent scans (if any) */}
        {recent.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Recent scans</h2>
              <Link to="/dashboard" style={{ fontSize: 13, color: DS.muted, fontWeight: 500, textDecoration: "none" }}>See all</Link>
            </div>
            <div style={{ background: DS.card, borderRadius: DS.radius.md, overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)" }}>
              {recent.map((entry, i) => {
                const score = entry.scores.ecoScore ?? 50;
                return (
                  <Link
                    key={entry.id}
                    to={`/product-off/${entry.barcode}`}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: 14,
                      borderTop: i ? `1px solid ${DS.hair}` : "none",
                      textDecoration: "none", color: DS.ink,
                    }}
                  >
                    <ScoreBadge score={score} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {entry.productName || "Unknown product"}
                      </div>
                      <div style={{ fontSize: 13, color: DS.muted, marginTop: 2 }}>
                        {entry.brand || "Unknown brand"}
                      </div>
                    </div>
                    <ChevronRight style={{ width: 16, height: 16, color: DS.muted, flexShrink: 0 }} />
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Features */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 14px" }}>Features</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: BarChart3, title: "Greener Swaps", desc: "We suggest lower-impact alternatives in the same category." },
              { icon: Award, title: "Personalised scoring", desc: "Set your values (environment, labour, nutrition, animal welfare) and every score is weighted to you." },
              { icon: Shield, title: "Transparency", desc: "Every flag has a citation. See an issue? Email us and we'll look into it." },
            ].map((feat) => (
              <div key={feat.title} style={{
                background: DS.card, borderRadius: DS.radius.md, padding: 16,
                display: "flex", gap: 14, alignItems: "flex-start",
                boxShadow: "0 2px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 12, background: DS.bg,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <feat.icon style={{ width: 18, height: 18, color: DS.ink }} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 3px" }}>{feat.title}</p>
                  <p style={{ fontSize: 13, color: DS.muted, margin: 0, lineHeight: 1.45 }}>{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick links */}
        <section>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { title: "Search products", to: "/database" },
              { title: "Scan history", to: "/dashboard" },
              { title: "Set your values", to: "/preferences" },
              { title: "About us", to: "/about" },
            ].map(card => (
              <Link key={card.title} to={card.to} style={{ textDecoration: "none" }}>
                <div style={{
                  background: DS.card, borderRadius: DS.radius.md, padding: 16,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
                }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: DS.ink }}>{card.title}</span>
                  <ChevronRight style={{ width: 16, height: 16, color: DS.muted }} />
                </div>
              </Link>
            ))}
          </div>
        </section>

      </main>

    </div>
  );
}
