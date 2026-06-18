import { useState, useRef, useCallback, useEffect } from "react";
import { DS } from "@/styles/design-tokens";
import { getBackendUrl } from "@/config/backend";
import { BackButton } from "@/components/BackButton";
import { buildAppContext, buildContextBrief } from "@/utils/appContext";
import { getAnonId } from "@/utils/scanLogger";
import { loadRegion } from "@/utils/userRegion";
import {
  Search, Camera, Loader2, Leaf, Users, Heart, Apple,
  ShieldCheck, Sparkles, AlertTriangle, ChevronRight,
  BadgeCheck, Zap, ArrowRight, RotateCcw,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface AnalysisResult {
  productName: string;
  brand: string | null;
  category: string;
  summary: string;
  overallScore: string;
  environment: { score: string; notes: string };
  nutrition: { score: string; novaGroup: number | null; notes: string };
  labor: { risk: string; notes: string };
  animalWelfare: { risk: string; notes: string };
  certifications: string[];
  alternatives: string[];
  confidence: string;
  disclaimer: string;
}

// ── Theme-aware score/risk palettes ──────────────────────────────────────────

const SCORE_MAP: Record<string, { bg: string; fg: string }> = {
  A: { bg: DS.goodBg, fg: DS.good },
  B: { bg: DS.goodBg, fg: DS.good },
  C: { bg: DS.warnBg, fg: DS.warn },
  D: { bg: "var(--ds-caution-bg, #FBE9E2)", fg: "#C26544" },
  E: { bg: DS.badBg, fg: DS.bad },
};
const RISK_MAP: Record<string, { bg: string; fg: string }> = {
  low:      { bg: DS.goodBg, fg: DS.good },
  medium:   { bg: DS.warnBg, fg: DS.warn },
  high:     { bg: "var(--ds-caution-bg, #FBE9E2)", fg: "#C26544" },
  critical: { bg: DS.badBg, fg: DS.bad },
  unknown:  { bg: "var(--ds-neutral-bg, #EDE6D2)", fg: DS.muted },
  "not-applicable": { bg: "var(--ds-neutral-bg, #EDE6D2)", fg: DS.muted },
};

const scoreColor = (v: string) => SCORE_MAP[v?.toUpperCase()] || RISK_MAP.unknown;
const riskColor  = (v: string) => RISK_MAP[v?.toLowerCase()] || RISK_MAP.unknown;

// ── Image compression ────────────────────────────────────────────────────────

const compressImage = (dataUrl: string, maxSize = 512): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(maxSize / Math.max(img.width, img.height), 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL("image/jpeg", 0.6).split(",")[1]);
    };
    img.onerror = () => resolve(dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl);
    img.src = dataUrl.startsWith("data:") ? dataUrl : `data:image/jpeg;base64,${dataUrl}`;
  });

// ── Accent gradient ──────────────────────────────────────────────────────────

const ACCENT = "linear-gradient(135deg, #7C3AED, #6D28D9)";
const ACCENT_SOFT = "var(--ds-animal-bg, #EAE0EF)";

// ── Pill ─────────────────────────────────────────────────────────────────────

function Pill({ children, bg, fg }: { children: React.ReactNode; bg: string; fg: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 999, fontSize: "0.68rem",
      fontWeight: 700, letterSpacing: 0.3, background: bg, color: fg,
      textTransform: "uppercase", whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

// ── Score Ring ────────────────────────────────────────────────────────────────

function ScoreRing({ grade, size = 64 }: { grade: string; size?: number }) {
  const c = scoreColor(grade);
  const stroke = 3.5;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = { A: 1, B: 0.8, C: 0.6, D: 0.4, E: 0.2 }[grade?.toUpperCase()] ?? 0.5;
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 200); return () => clearTimeout(t); }, []);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={DS.hair} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c.fg} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ}
          strokeDashoffset={mounted ? circ * (1 - pct) : circ}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1)" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: size * 0.42, fontWeight: 800, color: c.fg, lineHeight: 1 }}>{grade}</span>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ChatGPTScan() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (result) { setMounted(false); requestAnimationFrame(() => setMounted(true)); } }, [result]);

  const analyze = useCallback(async (text?: string, imageBase64?: string) => {
    setLoading(true); setError(null); setResult(null); setMounted(false);
    try {
      const context = buildAppContext();
      const contextBrief = buildContextBrief(context);
      const region = loadRegion();
      const body: Record<string, unknown> = {
        anonId: getAnonId(),
        country: region?.countryCode ?? null,
        city: region?.city ?? null,
      };
      if (text) body.query = text;
      if (imageBase64) body.imageBase64 = imageBase64;
      if (contextBrief) {
        body.userContext = contextBrief;
        body.userContextRaw = context;
      }
      const res = await fetch(`${getBackendUrl()}/api/chatgpt/analyze-product`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Analysis failed");
      setResult(data.analysis);
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); }
    finally { setLoading(false); }
  }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); if (query.trim()) analyze(query.trim()); };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string; setImagePreview(dataUrl);
      analyze(undefined, await compressImage(dataUrl));
    };
    reader.readAsDataURL(file); e.target.value = "";
  };

  const r = result;
  const PILLAR_CONFIG = r ? [
    { key: "environment" as const, icon: Leaf,  label: "Environment",    score: r.environment.score, notes: r.environment.notes, type: "score" as const, iconColor: DS.good },
    { key: "nutrition"   as const, icon: Apple, label: "Nutrition",      score: r.nutrition.score,    notes: r.nutrition.notes,    type: "score" as const, iconColor: DS.warn },
    { key: "labor"       as const, icon: Users, label: "Labor Rights",   score: r.labor.risk,         notes: r.labor.notes,        type: "risk"  as const, iconColor: DS.bad },
    { key: "animal"      as const, icon: Heart, label: "Animal Welfare", score: r.animalWelfare.risk, notes: r.animalWelfare.notes, type: "risk"  as const, iconColor: "#9B7AAE" },
  ] : [];

  return (
    <div style={{ background: DS.bg, minHeight: "100dvh", fontFamily: DS.font, color: DS.ink }}>
      <main style={{ paddingBottom: 100, maxWidth: 520, margin: "0 auto" }}>

        {/* ─── Header ─── */}
        <div style={{ padding: "max(60px, calc(env(safe-area-inset-top, 0px) + 16px)) 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <BackButton />
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 12px 5px 8px", borderRadius: 999,
              background: ACCENT_SOFT, fontSize: "0.68rem", fontWeight: 700, color: "#7C3AED",
            }}>
              <Zap size={12} /> Secret Feature
            </div>
          </div>

          {/* Hero */}
          <div style={{
            background: ACCENT, borderRadius: 22, padding: "28px 22px",
            position: "relative", overflow: "hidden", marginBottom: 20,
          }}>
            {/* Decorative circles */}
            <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
            <div style={{ position: "absolute", bottom: -20, left: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backdropFilter: "blur(8px)",
                }}>
                  <Sparkles size={20} color="#fff" />
                </div>
                <div>
                  <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>
                    AI Product Analyst
                  </h1>
                  <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.65)", margin: 0 }}>
                    Pure AI knowledge — no database needed
                  </p>
                </div>
              </div>
              <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.55, margin: 0 }}>
                Ask about any product. Get instant ethical, environmental, nutritional, and labor analysis.
              </p>
            </div>
          </div>
        </div>

        {/* ─── Search Bar ─── */}
        <div style={{ padding: "0 20px 20px", position: "sticky", top: 0, zIndex: 30, background: DS.bg, paddingTop: 4 }}>
          <form onSubmit={handleSearch} style={{
            display: "flex", alignItems: "center", gap: 8,
            background: DS.card, borderRadius: 16, padding: "6px 6px 6px 16px",
            border: `1px solid ${DS.hair}`,
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          }}>
            <Search size={16} style={{ color: DS.muted, flexShrink: 0 }} />
            <input
              value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any product..."
              style={{
                flex: 1, border: "none", background: "none", outline: "none",
                fontSize: "0.85rem", padding: "10px 0", color: DS.ink, fontFamily: DS.font,
              }}
            />
            <button type="button" onClick={() => fileRef.current?.click()} style={{
              width: 38, height: 38, borderRadius: 11, border: "none",
              background: DS.bg, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Camera size={16} style={{ color: DS.muted }} />
            </button>
            <button type="submit" disabled={loading || !query.trim()} style={{
              height: 38, borderRadius: 11, border: "none",
              background: loading ? DS.muted : ACCENT,
              color: "#fff", fontWeight: 700, fontSize: "0.78rem",
              padding: "0 16px", cursor: loading ? "default" : "pointer",
              fontFamily: DS.font, whiteSpace: "nowrap",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <><ArrowRight size={14} />Go</>}
            </button>
          </form>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: "none" }} />
        </div>

        {/* ─── Loading State ─── */}
        {loading && (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20, background: ACCENT_SOFT,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <Loader2 size={28} className="animate-spin" style={{ color: "#7C3AED" }} />
            </div>
            <p style={{ fontSize: "0.92rem", fontWeight: 700, color: DS.ink, marginBottom: 4 }}>
              Analyzing{query ? ` "${query}"` : " image"}...
            </p>
            <p style={{ fontSize: "0.72rem", color: DS.muted }}>
              AI is evaluating ethics, nutrition, environment & labor
            </p>
            {/* Animated dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: "50%", background: "#7C3AED",
                  opacity: 0.3, animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite`,
                }} />
              ))}
            </div>
            <style>{`@keyframes pulse { 0%,100% { opacity:0.2; transform:scale(0.8); } 50% { opacity:1; transform:scale(1.3); } }`}</style>
          </div>
        )}

        {/* ─── Error ─── */}
        {error && (
          <div style={{
            margin: "0 20px", padding: 16, borderRadius: 16,
            background: "var(--ds-error-bg, #fef2f2)", border: "1px solid var(--ds-error-border, #fecaca)",
            display: "flex", gap: 12, alignItems: "flex-start",
          }}>
            <AlertTriangle size={18} style={{ color: DS.bad, flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: "0.82rem", fontWeight: 700, color: DS.bad, marginBottom: 2 }}>{error}</p>
              <button onClick={() => { setError(null); if (query) analyze(query); }} style={{
                background: "none", border: "none", color: DS.bad, fontSize: "0.72rem",
                fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: DS.font,
                textDecoration: "underline",
              }}>Try again</button>
            </div>
          </div>
        )}

        {/* ─── Results ─── */}
        {r && !loading && (
          <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Product Hero Card */}
            <div style={{
              background: DS.card, borderRadius: 22, padding: "22px 20px",
              border: `1px solid ${DS.hair}`,
              opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(12px)",
              transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
            }}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <ScoreRing grade={r.overallScore} size={68} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "1.15rem", fontWeight: 800, color: DS.ink, margin: "0 0 2px", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                    {r.productName}
                  </p>
                  {r.brand && (
                    <p style={{ fontSize: "0.75rem", color: DS.muted, fontWeight: 500, margin: "0 0 8px" }}>
                      {r.brand} &middot; {r.category}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Pill bg={scoreColor(r.overallScore).bg} fg={scoreColor(r.overallScore).fg}>
                      Score {r.overallScore}
                    </Pill>
                    <Pill bg={r.confidence === "high" ? DS.goodBg : r.confidence === "medium" ? DS.warnBg : DS.badBg}
                          fg={r.confidence === "high" ? DS.good : r.confidence === "medium" ? DS.warn : DS.bad}>
                      <ShieldCheck size={10} />{r.confidence}
                    </Pill>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: "0.82rem", color: DS.ink2, lineHeight: 1.55, marginTop: 14 }}>
                {r.summary}
              </p>
            </div>

            {/* Four Pillar Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {PILLAR_CONFIG.map((p, i) => {
                const colors = p.type === "score" ? scoreColor(p.score) : riskColor(p.score);
                const Icon = p.icon;
                return (
                  <div key={p.key} style={{
                    background: DS.card, borderRadius: 18, padding: "16px 14px",
                    border: `1px solid ${DS.hair}`,
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(12px)",
                    transition: `all 0.5s cubic-bezier(0.16,1,0.3,1) ${100 + i * 80}ms`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 10,
                        background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon size={15} style={{ color: p.iconColor }} />
                      </div>
                      <Pill bg={colors.bg} fg={colors.fg}>{p.score || "N/A"}</Pill>
                    </div>
                    <p style={{ fontSize: "0.78rem", fontWeight: 700, color: DS.ink, marginBottom: 4 }}>{p.label}</p>
                    <p style={{ fontSize: "0.68rem", color: DS.muted, lineHeight: 1.5 }}>{p.notes}</p>
                  </div>
                );
              })}
            </div>

            {/* NOVA badge (inline) */}
            {r.nutrition.novaGroup && (
              <div style={{
                background: DS.card, borderRadius: 14, padding: "12px 16px",
                border: `1px solid ${DS.hair}`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                opacity: mounted ? 1 : 0,
                transition: "all 0.5s cubic-bezier(0.16,1,0.3,1) 0.5s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, background: DS.warnBg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.78rem", fontWeight: 800, color: DS.warn,
                  }}>{r.nutrition.novaGroup}</div>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: DS.ink }}>NOVA Processing Group</span>
                </div>
                <span style={{ fontSize: "0.68rem", color: DS.muted }}>
                  {r.nutrition.novaGroup === 1 ? "Unprocessed" : r.nutrition.novaGroup === 2 ? "Culinary" : r.nutrition.novaGroup === 3 ? "Processed" : "Ultra-processed"}
                </span>
              </div>
            )}

            {/* Certifications */}
            {r.certifications.length > 0 && (
              <div style={{
                background: DS.card, borderRadius: 18, padding: "16px 16px",
                border: `1px solid ${DS.hair}`,
                opacity: mounted ? 1 : 0, transition: "all 0.5s ease 0.55s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <BadgeCheck size={16} style={{ color: DS.good }} />
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: DS.ink }}>Certifications</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {r.certifications.map(c => (
                    <Pill key={c} bg={DS.goodBg} fg={DS.good}>{c}</Pill>
                  ))}
                </div>
              </div>
            )}

            {/* Ethical Alternatives */}
            {r.alternatives.length > 0 && (
              <div style={{
                background: DS.card, borderRadius: 18, padding: "16px 16px",
                border: `1px solid ${DS.hair}`,
                opacity: mounted ? 1 : 0, transition: "all 0.5s ease 0.6s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Sparkles size={15} style={{ color: "#7C3AED" }} />
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: DS.ink }}>Try Instead</span>
                </div>
                {r.alternatives.map((alt, i) => (
                  <button key={alt} onClick={() => { setQuery(alt); analyze(alt); }} style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 0",
                    borderTop: i > 0 ? `1px solid ${DS.hair}` : "none",
                    background: "none", border: "none", cursor: "pointer", fontFamily: DS.font,
                  }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: DS.ink }}>{alt}</span>
                    <ChevronRight size={14} style={{ color: DS.muted }} />
                  </button>
                ))}
              </div>
            )}

            {/* Disclaimer */}
            {r.disclaimer && (
              <div style={{
                borderRadius: 14, padding: "12px 14px",
                background: "var(--ds-neutral-bg, #EDE6D2)",
                display: "flex", gap: 10, alignItems: "flex-start",
                opacity: mounted ? 1 : 0, transition: "all 0.5s ease 0.65s",
              }}>
                <AlertTriangle size={14} style={{ color: DS.warn, flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: "0.7rem", color: DS.ink2, lineHeight: 1.5, margin: 0 }}>
                  <strong style={{ color: DS.warn }}>AI Disclaimer:</strong> {r.disclaimer}
                </p>
              </div>
            )}

            {/* New Search */}
            <button onClick={() => { setResult(null); setQuery(""); setImagePreview(null); }} style={{
              width: "100%", padding: "12px", borderRadius: 14, border: `1px solid ${DS.hair}`,
              background: DS.card, cursor: "pointer", fontFamily: DS.font,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontSize: "0.82rem", fontWeight: 600, color: DS.muted,
            }}>
              <RotateCcw size={14} /> Analyze another product
            </button>

            {/* Footer */}
            <p style={{ textAlign: "center", fontSize: "0.62rem", color: DS.muted, lineHeight: 1.5, padding: "4px 0 8px" }}>
              Powered by GPT-4o-mini &middot; Training data, not live database
            </p>
          </div>
        )}

        {/* ─── Empty State ─── */}
        {!loading && !result && !error && (
          <div style={{ padding: "12px 20px" }}>

            {/* Quick search suggestions */}
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: DS.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>
              Popular searches
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
              {["Nutella", "Coca-Cola", "Oatly Oat Milk", "Nescafe Gold", "Oreo", "Ben & Jerry's"].map(s => (
                <button key={s} onClick={() => { setQuery(s); analyze(s); }} style={{
                  padding: "8px 14px", borderRadius: 999,
                  background: DS.card, border: `1px solid ${DS.hair}`,
                  fontSize: "0.78rem", fontWeight: 600, color: DS.ink,
                  cursor: "pointer", fontFamily: DS.font,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <Search size={12} style={{ color: DS.muted }} /> {s}
                </button>
              ))}
            </div>

            {/* How it works */}
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: DS.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>
              How it works
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { step: "1", icon: Search, title: "Search or snap a photo", desc: "Type a product name or take a picture of any product label" },
                { step: "2", icon: Sparkles, title: "AI analyzes the product", desc: "ChatGPT evaluates ethical, nutritional, environmental & labor impact" },
                { step: "3", icon: ShieldCheck, title: "Get your verdict", desc: "See scores, risks, certifications, and better alternatives" },
              ].map(item => (
                <div key={item.step} style={{
                  background: DS.card, borderRadius: 16, padding: "14px 16px",
                  border: `1px solid ${DS.hair}`,
                  display: "flex", gap: 14, alignItems: "center",
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: ACCENT_SOFT,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.78rem", fontWeight: 800, color: "#7C3AED",
                    flexShrink: 0,
                  }}>
                    {item.step}
                  </div>
                  <div>
                    <p style={{ fontSize: "0.82rem", fontWeight: 700, color: DS.ink, marginBottom: 2 }}>{item.title}</p>
                    <p style={{ fontSize: "0.7rem", color: DS.muted, lineHeight: 1.45 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Camera CTA */}
            <button onClick={() => fileRef.current?.click()} style={{
              width: "100%", marginTop: 20, padding: "14px",
              borderRadius: 16, border: "none", cursor: "pointer",
              background: ACCENT, color: "#fff",
              fontFamily: DS.font, fontSize: "0.85rem", fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <Camera size={18} /> Snap a product photo
            </button>
          </div>
        )}
      </main>

    </div>
  );
}
