import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { DS } from "@/styles/design-tokens";
import { getBackendUrl } from "@/config/backend";
import {
  Search, Camera, Loader2, Leaf, Users, Heart, Apple,
  ShieldCheck, ArrowLeft, Sparkles, AlertTriangle, ChevronRight,
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

// ── Helpers ──────────────────────────────────────────────────────────────────

const SCORE_COLORS: Record<string, { bg: string; fg: string }> = {
  A: { bg: "#D8E5DA", fg: "#1F6B4E" },
  B: { bg: "#D8E5DA", fg: "#1F6B4E" },
  C: { bg: "#F0E1C2", fg: "#C0822A" },
  D: { bg: "#FBE9E2", fg: "#C26544" },
  E: { bg: "#F0DAD3", fg: "#B23A2B" },
};

const RISK_COLORS: Record<string, { bg: string; fg: string }> = {
  low: { bg: "#D8E5DA", fg: "#1F6B4E" },
  medium: { bg: "#F0E1C2", fg: "#C0822A" },
  high: { bg: "#FBE9E2", fg: "#C26544" },
  critical: { bg: "#F0DAD3", fg: "#B23A2B" },
  unknown: { bg: "#E8E5E0", fg: "#8C8278" },
  "not-applicable": { bg: "#E8E5E0", fg: "#8C8278" },
};

const getScoreColor = (score: string) =>
  SCORE_COLORS[score?.toUpperCase()] || RISK_COLORS.unknown;
const getRiskColor = (risk: string) =>
  RISK_COLORS[risk?.toLowerCase()] || RISK_COLORS.unknown;

const compressImage = (dataUrl: string, maxSize = 512): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(maxSize / Math.max(img.width, img.height), 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL("image/jpeg", 0.6).split(",")[1]);
    };
    img.onerror = () => {
      resolve(dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl);
    };
    img.src = dataUrl.startsWith("data:") ? dataUrl : `data:image/jpeg;base64,${dataUrl}`;
  });

// ── Score Badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ label, value, type = "score" }: { label: string; value: string; type?: "score" | "risk" }) {
  const colors = type === "score" ? getScoreColor(value) : getRiskColor(value);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: "0.82rem", color: DS.ink, fontWeight: 500 }}>{label}</span>
      <span style={{
        fontSize: "0.72rem", fontWeight: 700, padding: "3px 10px",
        borderRadius: 8, background: colors.bg, color: colors.fg,
        textTransform: "uppercase", letterSpacing: 0.5,
      }}>
        {value || "N/A"}
      </span>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ChatGPTScan() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const analyze = useCallback(async (text?: string, imageBase64?: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const body: Record<string, string> = {};
      if (text) body.query = text;
      if (imageBase64) body.imageBase64 = imageBase64;

      const res = await fetch(`${getBackendUrl()}/api/chatgpt/analyze-product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Analysis failed");
      setResult(data.analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    analyze(query.trim());
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      const compressed = await compressImage(dataUrl);
      analyze(undefined, compressed);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const r = result;

  return (
    <div style={{ background: DS.bg, minHeight: "100dvh", fontFamily: DS.font, color: DS.ink }}>
      <main style={{ paddingBottom: 100, maxWidth: 480, margin: "0 auto" }}>

        {/* Header */}
        <div style={{
          padding: "max(60px, calc(env(safe-area-inset-top, 0px) + 16px)) 20px 16px",
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "none", border: "none", color: DS.muted, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4, padding: 0, marginBottom: 12,
              fontFamily: DS.font, fontSize: "0.8rem",
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                AI Product Analyst
              </h1>
              <p style={{ fontSize: "0.7rem", color: DS.muted, margin: 0 }}>
                Powered by ChatGPT &middot; No database, pure AI knowledge
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: "0 20px 16px" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 8 }}>
            <div style={{
              flex: 1, display: "flex", alignItems: "center", gap: 8,
              background: DS.card, borderRadius: 12, padding: "0 12px",
              border: `1px solid ${DS.hair}`,
            }}>
              <Search size={16} style={{ color: DS.muted, flexShrink: 0 }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a product or brand name..."
                style={{
                  flex: 1, border: "none", background: "none", outline: "none",
                  fontSize: "0.85rem", padding: "12px 0", color: DS.ink,
                  fontFamily: DS.font,
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{
                width: 46, height: 46, borderRadius: 12, border: `1px solid ${DS.hair}`,
                background: DS.card, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Camera size={18} style={{ color: DS.muted }} />
            </button>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              style={{
                height: 46, borderRadius: 12, border: "none",
                background: loading ? DS.muted : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff", fontWeight: 700, fontSize: "0.8rem",
                padding: "0 18px", cursor: loading ? "default" : "pointer",
                fontFamily: DS.font, whiteSpace: "nowrap",
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Analyze"}
            </button>
          </form>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhoto}
            style={{ display: "none" }}
          />
        </div>

        {/* Loading */}
        {loading && (
          <div style={{
            padding: "60px 20px", textAlign: "center",
          }}>
            <Loader2 size={32} className="animate-spin" style={{ color: "#8b5cf6", margin: "0 auto 12px" }} />
            <p style={{ fontSize: "0.85rem", color: DS.muted, fontWeight: 500 }}>
              ChatGPT is analyzing{query ? ` "${query}"` : " the image"}...
            </p>
            <p style={{ fontSize: "0.72rem", color: DS.muted, marginTop: 4 }}>
              This takes 3-8 seconds
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            margin: "0 20px", padding: 16, borderRadius: 14,
            background: "#FEF2F2", border: "1px solid #FECACA",
          }}>
            <p style={{ fontSize: "0.82rem", color: "#B91C1C", fontWeight: 600 }}>{error}</p>
          </div>
        )}

        {/* Image Preview */}
        {imagePreview && !loading && !result && (
          <div style={{ padding: "0 20px 16px", textAlign: "center" }}>
            <img
              src={imagePreview}
              alt="Product"
              style={{ maxHeight: 160, borderRadius: 12, border: `1px solid ${DS.hair}` }}
            />
          </div>
        )}

        {/* Results */}
        {r && !loading && (
          <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>

            {/* Product Header */}
            <div style={{
              background: DS.card, borderRadius: 16, padding: 18,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "1.1rem", fontWeight: 800, color: DS.ink, marginBottom: 2 }}>
                    {r.productName}
                  </p>
                  {r.brand && (
                    <p style={{ fontSize: "0.78rem", color: DS.muted, fontWeight: 500 }}>
                      {r.brand} &middot; {r.category}
                    </p>
                  )}
                </div>
                <div style={{
                  width: 44, height: 44, borderRadius: 13,
                  background: getScoreColor(r.overallScore).bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <span style={{
                    fontSize: "1.2rem", fontWeight: 900,
                    color: getScoreColor(r.overallScore).fg,
                  }}>
                    {r.overallScore}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: "0.82rem", color: DS.ink, lineHeight: 1.5 }}>
                {r.summary}
              </p>

              {/* Confidence badge */}
              <div style={{
                marginTop: 10, display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 8,
                background: r.confidence === "high" ? "#D8E5DA" : r.confidence === "medium" ? "#F0E1C2" : "#F0DAD3",
                fontSize: "0.68rem", fontWeight: 600,
                color: r.confidence === "high" ? "#1F6B4E" : r.confidence === "medium" ? "#C0822A" : "#B23A2B",
              }}>
                <ShieldCheck size={12} />
                {r.confidence} confidence
              </div>
            </div>

            {/* Scores Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {/* Environment */}
              <div style={{
                background: DS.card, borderRadius: 14, padding: 14,
                boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Leaf size={16} style={{ color: "#1F6B4E" }} />
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: DS.ink }}>Environment</span>
                </div>
                <ScoreBadge label="Score" value={r.environment.score} />
                <p style={{ fontSize: "0.7rem", color: DS.muted, lineHeight: 1.5, marginTop: 8 }}>
                  {r.environment.notes}
                </p>
              </div>

              {/* Nutrition */}
              <div style={{
                background: DS.card, borderRadius: 14, padding: 14,
                boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Apple size={16} style={{ color: "#C0822A" }} />
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: DS.ink }}>Nutrition</span>
                </div>
                <ScoreBadge label="Score" value={r.nutrition.score} />
                {r.nutrition.novaGroup && (
                  <div style={{ marginTop: 6 }}>
                    <ScoreBadge label="NOVA" value={String(r.nutrition.novaGroup)} />
                  </div>
                )}
                <p style={{ fontSize: "0.7rem", color: DS.muted, lineHeight: 1.5, marginTop: 8 }}>
                  {r.nutrition.notes}
                </p>
              </div>

              {/* Labor */}
              <div style={{
                background: DS.card, borderRadius: 14, padding: 14,
                boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Users size={16} style={{ color: "#B23A2B" }} />
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: DS.ink }}>Labor Rights</span>
                </div>
                <ScoreBadge label="Risk" value={r.labor.risk} type="risk" />
                <p style={{ fontSize: "0.7rem", color: DS.muted, lineHeight: 1.5, marginTop: 8 }}>
                  {r.labor.notes}
                </p>
              </div>

              {/* Animal Welfare */}
              <div style={{
                background: DS.card, borderRadius: 14, padding: 14,
                boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Heart size={16} style={{ color: "#6A4A6E" }} />
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: DS.ink }}>Animal Welfare</span>
                </div>
                <ScoreBadge label="Risk" value={r.animalWelfare.risk} type="risk" />
                <p style={{ fontSize: "0.7rem", color: DS.muted, lineHeight: 1.5, marginTop: 8 }}>
                  {r.animalWelfare.notes}
                </p>
              </div>
            </div>

            {/* Certifications */}
            {r.certifications.length > 0 && (
              <div style={{
                background: DS.card, borderRadius: 14, padding: 14,
                boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)",
              }}>
                <p style={{ fontSize: "0.82rem", fontWeight: 700, color: DS.ink, marginBottom: 10 }}>
                  Certifications
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {r.certifications.map((c) => (
                    <span key={c} style={{
                      fontSize: "0.7rem", fontWeight: 600, padding: "4px 10px",
                      borderRadius: 8, background: "#D8E5DA", color: "#1F6B4E",
                    }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Alternatives */}
            {r.alternatives.length > 0 && (
              <div style={{
                background: DS.card, borderRadius: 14, padding: 14,
                boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)",
              }}>
                <p style={{ fontSize: "0.82rem", fontWeight: 700, color: DS.ink, marginBottom: 10 }}>
                  More Ethical Alternatives
                </p>
                {r.alternatives.map((alt) => (
                  <div
                    key={alt}
                    onClick={() => { setQuery(alt); analyze(alt); }}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 0", borderBottom: `1px solid ${DS.hair}`, cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: "0.8rem", color: DS.ink }}>{alt}</span>
                    <ChevronRight size={14} style={{ color: DS.muted }} />
                  </div>
                ))}
              </div>
            )}

            {/* Disclaimer */}
            {r.disclaimer && (
              <div style={{
                background: DS.card, borderRadius: 14, padding: 14,
                boxShadow: "0 2px 6px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)",
                display: "flex", gap: 10, alignItems: "flex-start",
              }}>
                <AlertTriangle size={16} style={{ color: "#C0822A", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#C0822A", marginBottom: 4 }}>
                    AI Disclaimer
                  </p>
                  <p style={{ fontSize: "0.72rem", color: DS.muted, lineHeight: 1.5 }}>
                    {r.disclaimer}
                  </p>
                </div>
              </div>
            )}

            {/* Powered by notice */}
            <p style={{
              textAlign: "center", fontSize: "0.68rem", color: DS.muted,
              padding: "8px 0 4px", lineHeight: 1.5,
            }}>
              Analysis by GPT-4o-mini &middot; Based on AI training data, not a live database.
              <br />Results may not reflect the latest product changes.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !result && !error && (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <Sparkles size={40} style={{ color: DS.hair, margin: "0 auto 16px" }} />
            <p style={{ fontSize: "0.9rem", fontWeight: 700, color: DS.ink, marginBottom: 6 }}>
              AI-Powered Product Analysis
            </p>
            <p style={{ fontSize: "0.78rem", color: DS.muted, lineHeight: 1.6, maxWidth: 300, margin: "0 auto" }}>
              Type any product name or take a photo. ChatGPT will analyze its ethical,
              environmental, nutritional, and labor impact using its training knowledge.
            </p>
            <div style={{
              marginTop: 24, padding: 14, borderRadius: 12,
              background: DS.card, border: `1px solid ${DS.hair}`,
              maxWidth: 300, margin: "24px auto 0",
            }}>
              <p style={{ fontSize: "0.72rem", fontWeight: 600, color: DS.ink, marginBottom: 8 }}>
                Try searching for:
              </p>
              {["Nutella", "Coca-Cola", "Oatly Oat Milk", "Nescafe Gold"].map((s) => (
                <button
                  key={s}
                  onClick={() => { setQuery(s); analyze(s); }}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "8px 0", borderBottom: `1px solid ${DS.hair}`,
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: "0.78rem", color: "#6366f1", fontWeight: 500,
                    fontFamily: DS.font,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
