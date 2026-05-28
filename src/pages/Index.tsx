import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Camera, Leaf, Shield, BarChart3, Users, Award, Zap, CheckCircle2, AlertTriangle as AlertTriangleIcon, Share, Plus, MoreVertical, X, Search } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { DS, scoreTone, toneColor, toneBg } from "@/styles/design-tokens";
import { loadScanHistory, type ScanHistoryEntry } from "@/utils/userPreferences";

/* ── Animated example result card ─────────────────────────────────── */

interface DemoProduct {
  name: string;
  subtitle: string;
  score: number;
  verdict: string;
  verdictColor: string;
  verdictBg: string;
  ringColor: string;
  description: string;
  icon: "good" | "bad";
  categories: { label: string; value: number; color: string }[];
}

const DEMO_PRODUCTS: DemoProduct[] = [
  {
    name: "Organic Oat Milk",
    subtitle: "Oatly · 1L",
    score: 79,
    verdict: "BUY",
    verdictColor: DS.good,
    verdictBg: DS.goodBg,
    ringColor: DS.good,
    description: "Low carbon footprint, fair trade certified, no labour concerns.",
    icon: "good",
    categories: [
      { label: "Environment", value: 82, color: DS.good },
      { label: "Labour", value: 91, color: DS.good },
      { label: "Nutrition", value: 65, color: DS.warn },
      { label: "Animal welfare", value: 78, color: DS.good },
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

function AnimatedResultDemo() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [fadePhase, setFadePhase] = useState<"in" | "out">("in");
  const ref = useRef<HTMLDivElement>(null);

  // displayedIndex only updates after fade-out completes, so old product stays visible during exit
  const product = DEMO_PRODUCTS[displayedIndex];

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

  // Cycle between products
  useEffect(() => {
    if (!visible) return;
    const DISPLAY_TIME = 4700;
    const FADE_OUT_TIME = 400;
    const interval = setInterval(() => {
      setFadePhase("out");
      setTimeout(() => {
        setActiveIndex((i) => (i + 1) % DEMO_PRODUCTS.length);
      }, FADE_OUT_TIME);
    }, DISPLAY_TIME);
    return () => clearInterval(interval);
  }, [visible]);

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

      {/* Footer hint */}
      <p style={{
        fontSize: 11, color: DS.muted, textAlign: "center", margin: "16px 0 0",
        opacity: visible ? 1 : 0, transition: "opacity 0.4s ease 1s",
      }}>
        This is an example — scan any product to see its real score
      </p>

      {/* Dots indicator */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
        {DEMO_PRODUCTS.map((_, i) => (
          <div key={i} style={{
            width: i === displayedIndex ? 16 : 6, height: 6, borderRadius: 3,
            background: i === displayedIndex ? DS.ink : DS.hair,
            transition: "all 0.4s ease",
          }} />
        ))}
      </div>
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

function isStandalone(): boolean {
  if ((navigator as any).standalone) return true; // iOS Safari
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
  return false;
}

function isNativeApp(): boolean {
  return !!(window as any).Capacitor;
}

function getInstallPlatform(): "ios" | "android" | null {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return null;
}

const INSTALL_DISMISSED_KEY = "gs_install_dismissed";

export default function Index() {
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [showInstall, setShowInstall] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    setHistory(loadScanHistory());
    // Only show on web browsers — never on native Capacitor apps or standalone PWAs
    if (!isStandalone() && !isNativeApp()) {
      const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY);
      if (dismissed) {
        setShowInstallBanner(true);
      } else {
        setShowInstall(true);
      }
    }
  }, []);

  const handleDismissInstall = () => {
    localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
    setShowInstall(false);
  };

  const platform = getInstallPlatform();
  const recent = history.slice(0, 3);

  return (
    <div style={{ background: DS.bg, minHeight: "100dvh", fontFamily: DS.font, color: DS.ink }}>
      <main style={{ padding: "0 20px", paddingBottom: 110, maxWidth: 640, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ paddingTop: "max(60px, calc(env(safe-area-inset-top, 0px) + 16px))", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 6px" }}>
            <Logo size={28} />
            <p style={{ fontSize: 13, fontWeight: 600, color: DS.good, margin: 0, letterSpacing: 0.3 }}>
              GoodScan
            </p>
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
            background: "#1A1614", color: "#F7F6F3", borderRadius: DS.radius.lg, padding: 22,
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

        {/* Animated example result */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 14px" }}>Example result</h2>
          <AnimatedResultDemo />
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
                <div style={{
                  width: 32, height: 32, borderRadius: 16, background: DS.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 800, color: DS.ink, flexShrink: 0,
                }}>
                  {item.step}
                </div>
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
              { title: "About & methodology", to: "/about" },
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

      {/* ── Add to Home Screen modal ──────────────────────────────── */}
      {showInstall && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.65)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: DS.card, borderRadius: 22, padding: 28,
              width: "100%", maxWidth: 360,
              boxShadow: "0 20px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.08)",
            }}
          >
            {/* Icon */}
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: DS.goodBg,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <Plus style={{ width: 26, height: 26, color: DS.good }} />
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 800, textAlign: "center", margin: "0 0 6px", letterSpacing: -0.3 }}>
              Add to Home Screen
            </h2>
            <p style={{ fontSize: 14, color: DS.muted, textAlign: "center", margin: "0 0 20px", lineHeight: 1.5 }}>
              Get the full app experience — faster loading, full screen, and easy access from your home screen.
            </p>

            {/* Steps */}
            <div style={{
              background: DS.bg, borderRadius: DS.radius.md, padding: 16,
              display: "flex", flexDirection: "column", gap: 14, marginBottom: 20,
            }}>
              {platform === "ios" ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 12, background: DS.card,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)", gap: 4,
                    }}>
                      <MoreVertical style={{ width: 14, height: 14, color: DS.ink }} />
                      <Share style={{ width: 14, height: 14, color: DS.ink }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 2px" }}>Find the Share button</p>
                      <p style={{ fontSize: 12, color: DS.muted, margin: 0 }}>You may need to tap the <strong>···</strong> menu first, then tap the share icon</p>
                    </div>
                  </div>
                  <div style={{ height: 1, background: DS.hair, margin: "0 0 0 48px" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 12, background: DS.card,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    }}>
                      <Plus style={{ width: 17, height: 17, color: DS.ink }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 2px" }}>Add to Home Screen</p>
                      <p style={{ fontSize: 12, color: DS.muted, margin: 0 }}>Scroll down in the share menu and tap it</p>
                    </div>
                  </div>
                  <div style={{ height: 1, background: DS.hair, margin: "0 0 0 48px" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 12, background: DS.card,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    }}>
                      <CheckCircle2 style={{ width: 17, height: 17, color: DS.good }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 2px" }}>Tap Add</p>
                      <p style={{ fontSize: 12, color: DS.muted, margin: 0 }}>GoodScan will appear on your home screen</p>
                    </div>
                  </div>
                </>
              ) : platform === "android" ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 12, background: DS.card,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    }}>
                      <MoreVertical style={{ width: 17, height: 17, color: DS.ink }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 2px" }}>Open browser menu</p>
                      <p style={{ fontSize: 12, color: DS.muted, margin: 0 }}>Tap the three dots at the top right</p>
                    </div>
                  </div>
                  <div style={{ height: 1, background: DS.hair, margin: "0 0 0 48px" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 12, background: DS.card,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    }}>
                      <Plus style={{ width: 17, height: 17, color: DS.ink }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 2px" }}>Install app</p>
                      <p style={{ fontSize: 12, color: DS.muted, margin: 0 }}>Tap "Add to Home screen" or "Install app"</p>
                    </div>
                  </div>
                  <div style={{ height: 1, background: DS.hair, margin: "0 0 0 48px" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 12, background: DS.card,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    }}>
                      <CheckCircle2 style={{ width: 17, height: 17, color: DS.good }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 2px" }}>Confirm</p>
                      <p style={{ fontSize: 12, color: DS.muted, margin: 0 }}>GoodScan will appear on your home screen</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 12, background: DS.card,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)", gap: 4,
                    }}>
                      <Share style={{ width: 14, height: 14, color: DS.ink }} />
                      <MoreVertical style={{ width: 14, height: 14, color: DS.ink }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 2px" }}>Open browser menu</p>
                      <p style={{ fontSize: 12, color: DS.muted, margin: 0 }}>Tap the share or three-dot menu icon</p>
                    </div>
                  </div>
                  <div style={{ height: 1, background: DS.hair, margin: "0 0 0 48px" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 12, background: DS.card,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    }}>
                      <Plus style={{ width: 17, height: 17, color: DS.ink }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 2px" }}>Add to Home Screen</p>
                      <p style={{ fontSize: 12, color: DS.muted, margin: 0 }}>Look for "Install" or "Add to Home Screen"</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <p style={{ fontSize: 12, color: DS.muted, textAlign: "center", margin: "0 0 12px", lineHeight: 1.45 }}>
              You need to add GoodScan to your home screen for the app to work properly.
            </p>
            <button
              onClick={handleDismissInstall}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 11, color: DS.muted, opacity: 0.6,
                fontFamily: DS.font, padding: 0,
                textDecoration: "underline",
              }}
            >
              Continue to website
            </button>
          </div>
        </div>
      )}

      {/* ── Small reminder banner (shown after first dismissal) ── */}
      {showInstallBanner && (
        <div
          style={{
            position: "fixed",
            top: "env(safe-area-inset-top, 0px)",
            left: 0, right: 0,
            zIndex: 100,
            padding: "0 12px",
          }}
        >
          <div
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: DS.card, borderRadius: 14,
              padding: "10px 14px",
              margin: "8px auto", maxWidth: 480,
              boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
            }}
          >
            <Plus style={{ width: 18, height: 18, color: DS.good, flexShrink: 0 }} />
            <p style={{ flex: 1, fontSize: 13, color: DS.ink2, margin: 0, lineHeight: 1.35 }}>
              <strong style={{ color: DS.ink }}>Add to Home Screen</strong> for the full experience
            </p>
            <button
              onClick={() => {
                setShowInstallBanner(false);
                setShowInstall(true);
              }}
              style={{
                background: DS.ink, color: DS.card, border: "none",
                borderRadius: 8, padding: "6px 12px", fontSize: 12,
                fontWeight: 700, cursor: "pointer", flexShrink: 0,
                fontFamily: DS.font,
              }}
            >
              Show me
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              aria-label="Dismiss"
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: 4, color: DS.muted, flexShrink: 0,
              }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
