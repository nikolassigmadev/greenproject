import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft, Loader2, Leaf, AlertTriangle, ExternalLink,
  CheckCircle2, ChevronRight, Package, ShoppingBag, XCircle, Clock,
  BadgeCheck, Wheat, Factory, Truck, Store, UtensilsCrossed,
  ScanLine, Check, BarChart2, Sprout, PawPrint,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { lookupBarcode } from "@/services/openfoodfacts";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import { loadPriorities, saveScanToHistory, loadScanHistory, type UserPriorities } from "@/utils/userPreferences";
import { checkBoycott } from "@/data/boycottBrands";
import { checkAnimalWelfareFlag } from "@/utils/animalWelfareFlags";
import { AnimalWelfareFlagBadge } from "@/components/AnimalWelfareFlagBadge";
import { addToBasket, loadBasket } from "@/utils/basketStorage";
import { findLaborAllegations as findLaborAllegationsUtil, getLaborAllegationCount } from "@/utils/laborCheck";
import { EnvironmentalImpactCard } from "@/components/EnvironmentalImpactCard";
import { sendChatMessage } from "@/services/api/backend-client";
import { cn } from "@/lib/utils";
import { DS } from "@/styles/design-tokens";

// ─── Helpers (logic) ──────────────────────────────────────────────────────────

const nameCache = new Map<string, string>();

async function fetchCleanName(rawName: string): Promise<string> {
  if (nameCache.has(rawName)) return nameCache.get(rawName)!;
  try {
    const res = await sendChatMessage(
      [{ role: "user", content: `Given this product name from a barcode database: "${rawName}", return ONLY the clean, properly formatted product name (e.g. "Coca-Cola", "Nutella", "Lay's Classic Chips"). Remove size, weight, volume, and any descriptors that aren't part of the brand/product identity. Return just the name, nothing else.` }],
      "gpt-4o-mini",
      0
    );
    const clean = res.content?.trim();
    if (clean) nameCache.set(rawName, clean);
    return clean || rawName;
  } catch {
    return rawName;
  }
}

const findLaborAllegations = (product: OpenFoodFactsResult) =>
  findLaborAllegationsUtil(product.brand, product.productName);

// ─── Design constants ─────────────────────────────────────────────────────────

const GRADE_COLOR: Record<string, string> = {
  a: "#10b981", b: "#84cc16", c: "#f59e0b", d: "#f97316", e: "#ef4444",
};

const GRADE_BG: Record<string, string> = {
  a: "#ecfdf5", b: "#f7fee7", c: "#fffbeb", d: "#fff7ed", e: "#fef2f2",
};

const NOVA_LABEL: Record<number, string> = {
  1: "Unprocessed", 2: "Culinary", 3: "Processed", 4: "Ultra-processed",
};

const NOVA_COLOR: Record<number, string> = {
  1: "#10b981", 2: "#84cc16", 3: "#f59e0b", 4: "#ef4444",
};

const VERDICT_CONFIG = {
  BUY:      { color: "#10b981", bg: "#ecfdf5", Icon: CheckCircle2, label: "Buy" },
  CONSIDER: { color: "#f59e0b", bg: "#fffbeb", Icon: Clock,        label: "Consider" },
  CAUTION:  { color: "#f97316", bg: "#fff7ed", Icon: AlertTriangle, label: "Caution" },
  AVOID:    { color: "#ef4444", bg: "#fef2f2", Icon: XCircle,       label: "Avoid" },
  UNKNOWN:  { color: "#9CA3AF", bg: "#f9fafb", Icon: Clock,        label: "Unknown" },
};

const CO2_BARS = [
  { key: "co2_agriculture",    label: "Agriculture",  Icon: Wheat,           color: "#10b981" },
  { key: "co2_processing",     label: "Processing",   Icon: Factory,         color: "#3b82f6" },
  { key: "co2_packaging",      label: "Packaging",    Icon: Package,         color: "#f59e0b" },
  { key: "co2_transportation", label: "Transport",    Icon: Truck,           color: "#f97316" },
  { key: "co2_distribution",   label: "Distribution", Icon: Store,           color: "#a855f7" },
  { key: "co2_consumption",    label: "Consumption",  Icon: UtensilsCrossed, color: "#ec4899" },
] as const;

const GRADE_PERCENT: Record<string, number> = { a: 1, b: 0.8, c: 0.6, d: 0.4, e: 0.2 };
const NOVA_PERCENT: Record<number, number> = { 1: 1, 2: 0.75, 3: 0.5, 4: 0.25 };

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreGauge({ value, color, bg, percent, label, sublabel, delay = 0 }: {
  value: string;
  color: string;
  bg: string;
  percent: number;
  label: string;
  sublabel?: string;
  delay?: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 200 + delay);
    return () => clearTimeout(t);
  }, [delay]);

  const size = 72;
  const strokeW = 5;
  const r = (size - strokeW * 2) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={DS.hair} strokeWidth={strokeW} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={mounted ? circ * (1 - percent) : circ}
            style={{ transition: `stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms` }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: "1.3rem", fontWeight: 900, color, lineHeight: 1 }}>{value}</span>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "0.68rem", fontWeight: 700, color: DS.ink, margin: 0 }}>{label}</p>
        {sublabel && <p style={{ fontSize: "0.6rem", color: DS.muted, margin: "1px 0 0" }}>{sublabel}</p>}
      </div>
    </div>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <p style={{
      fontSize: "0.62rem", fontWeight: 800, color: DS.muted,
      letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px",
    }}>
      {title}
    </p>
  );
}

function Divider() {
  return <div style={{ height: 1, background: DS.hair, margin: "0" }} />;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OpenFoodFactsDetail() {
  const { barcode } = useParams<{ barcode: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromScan = searchParams.get("from") === "scan";

  const [product, setProduct]               = useState<OpenFoodFactsResult | null>(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [priorities, setPriorities]         = useState<UserPriorities>(loadPriorities());
  const [confirmDismissed, setConfirmDismissed] = useState(false);
  const [showCandidates, setShowCandidates] = useState(false);
  const [candidates, setCandidates]         = useState<OpenFoodFactsResult[]>([]);
  const [inBasket, setInBasket]             = useState(false);
  const [stickyVisible, setStickyVisible]   = useState(false);
  const [cleanName, setCleanName]           = useState<string | null>(null);
  const [mounted, setMounted]               = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (barcode) loadProduct(barcode); }, [barcode]);

  useEffect(() => {
    if (fromScan) {
      try {
        const stored = sessionStorage.getItem("scan_candidates");
        if (stored) {
          const parsed: OpenFoodFactsResult[] = JSON.parse(stored);
          setCandidates(parsed.filter(c => c.barcode !== barcode));
        }
      } catch { /* ignore */ }
    }
  }, [fromScan, barcode]);

  useEffect(() => {
    const handler = () => setPriorities(loadPriorities());
    window.addEventListener("prioritiesUpdated", handler);
    return () => window.removeEventListener("prioritiesUpdated", handler);
  }, []);

  useEffect(() => {
    if (product) {
      setInBasket(loadBasket().some(b => b.barcode === product.barcode));
      const handler = () => setInBasket(loadBasket().some(b => b.barcode === product.barcode));
      window.addEventListener("basketUpdated", handler);
      return () => window.removeEventListener("basketUpdated", handler);
    }
  }, [product?.barcode]);

  useEffect(() => {
    if (!product) return;
    const laborRecord = findLaborAllegations(product);
    const laborCount = laborRecord?.allegations.length || 0;
    const verdictKey = getVerdictKey(product, priorities);
    const colorMap: Record<string, string> = {
      BUY: "#10b981", CONSIDER: "#f59e0b", CAUTION: "#f97316", AVOID: "#ef4444", UNKNOWN: "#6B7280",
    };
    saveScanToHistory({
      id: `${product.barcode}-${Date.now()}`,
      barcode: product.barcode,
      productName: product.productName || "Unknown Product",
      brand: product.brand,
      imageUrl: product.imageUrl,
      timestamp: Date.now(),
      verdict: { emoji: "", label: verdictKey, color: colorMap[verdictKey] || "#6B7280" },
      scores: {
        ecoScore: product.ecoscoreScore,
        ecoGrade: product.ecoscoreGrade,
        nutriScore: product.nutriscoreGrade,
        laborAllegations: laborCount,
        novaGroup: product.novaGroup,
      },
      carbonFootprint100g: product.carbonFootprint100g,
      labels: product.labels,
    });
  }, [product?.barcode]);

  useEffect(() => {
    if (!product?.productName) return;
    setCleanName(null);
    fetchCleanName(product.productName).then(setCleanName);
  }, [product?.productName]);

  useEffect(() => {
    const onScroll = () => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      setStickyVisible(rect.bottom < 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Trigger mount animations after product loads
  useEffect(() => {
    if (product) {
      const t = setTimeout(() => setMounted(true), 50);
      return () => clearTimeout(t);
    }
  }, [product]);

  const loadProduct = async (code: string) => {
    setLoading(true);
    setMounted(false);
    try {
      const result = await lookupBarcode(code);
      if (result.found) {
        setProduct(result);
      } else {
        const cached = loadScanHistory().find(h => h.barcode === code);
        if (cached) setProduct(buildFromCache(cached));
        else setError("Product not found in OpenFoodFacts database");
      }
    } catch {
      const cached = loadScanHistory().find(h => h.barcode === code);
      if (cached) setProduct(buildFromCache(cached));
      else setError("Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ──

  if (loading) {
    return (
      <div style={{ background: DS.bg, fontFamily: DS.font, color: DS.ink, minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            border: `3px solid ${DS.hair}`, borderTopColor: DS.ink,
            animation: "off-spin 0.7s linear infinite",
          }} />
          <p style={{ fontSize: "0.82rem", fontWeight: 600 }}>Loading product</p>
        </div>
        <BottomNav />
        <style>{`@keyframes off-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Error ──

  if (error || !product) {
    return (
      <div style={{ background: DS.bg, fontFamily: DS.font, color: DS.ink, minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, padding: "0 20px", paddingTop: "max(24px, env(safe-area-inset-top))", maxWidth: 560, margin: "0 auto", width: "100%" }}>
          <div style={{ background: "#fef2f2", borderRadius: 16, border: "1px solid #fecaca", padding: 18, display: "flex", alignItems: "flex-start", gap: 14 }}>
            <XCircle style={{ color: "#ef4444", width: 20, height: 20, flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: "0.88rem", fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>Product not found</p>
              <p style={{ fontSize: "0.78rem", color: DS.muted }}>{error || "Unable to load product details"}</p>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Derived data ──

  const verdict    = getVerdict(product, priorities);
  const vc         = VERDICT_CONFIG[verdict.key as keyof typeof VERDICT_CONFIG] ?? VERDICT_CONFIG.UNKNOWN;
  const agri       = product.ecoscoreData?.agribalyse;
  const laborRecord  = findLaborAllegations(product);
  const boycottMatch = checkBoycott(product.brand);
  const welfare      = checkAnimalWelfareFlag(product.brand);
  const ecoGrade     = product.ecoscoreGrade?.toLowerCase();
  const nutriGrade   = product.nutriscoreGrade?.toLowerCase();

  const co2Values = CO2_BARS
    .map(b => agri?.[b.key as keyof typeof agri] as number | undefined)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const maxCo2 = co2Values.length > 0 ? Math.max(...co2Values) : 1;

  const drivingKm = agri?.co2_total != null
    ? Math.round((agri.co2_total / 0.21) * 10) / 10
    : null;

  const displayName = cleanName ?? product.productName ?? "Unknown product";

  const hasScores = !!(ecoGrade || nutriGrade || product.novaGroup);
  const hasEthicsConcerns = !!(laborRecord || boycottMatch || welfare.isFlagged);

  // ── Render ──

  return (
    <div style={{ background: DS.bg, fontFamily: DS.font, color: DS.ink, minHeight: "100dvh" }}>

      {/* ── Sticky compact header ─────────────────────────────────── */}
      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
        stickyVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      )}>
        <div
          style={{
            maxWidth: 560, margin: "0 auto", padding: "10px 16px",
            display: "flex", alignItems: "center", gap: 10,
            background: "rgba(247,246,243,0.92)",
            backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
            borderBottom: `1px solid ${DS.hair}`,
          }}
        >
          <p style={{ flex: 1, fontSize: "0.82rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
            {displayName}
          </p>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 10px", borderRadius: 20,
            background: vc.bg, color: vc.color,
            fontSize: "0.68rem", fontWeight: 800, flexShrink: 0,
          }}>
            <vc.Icon style={{ width: 10, height: 10 }} />
            {verdict.key}
          </div>
        </div>
      </div>

      <main style={{ paddingBottom: 110, maxWidth: 560, margin: "0 auto" }}>

        {/* ── HERO ────────────────────────────────────────────────── */}
        <div
          ref={heroRef}
          style={{
            position: "relative", overflow: "hidden",
            paddingTop: "env(safe-area-inset-top)",
          }}
        >
          {/* Product card */}
          <div style={{
            margin: "0 16px", borderRadius: 24,
            background: DS.card,
            boxShadow: "0 2px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)",
            overflow: "hidden",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}>
            {/* Verdict accent stripe */}
            <div style={{ height: 4, background: `linear-gradient(90deg, ${vc.color}, ${vc.color}88)` }} />

            <div style={{ padding: "20px 20px 18px" }}>
              {/* Product row */}
              <div style={{ display: "flex", gap: 16, marginBottom: 18 }}>
                {/* Image */}
                <div style={{
                  width: 88, height: 88, borderRadius: 16, flexShrink: 0,
                  background: DS.bg, border: `1px solid ${DS.hair}`,
                  overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : (
                    <Sprout style={{ width: 32, height: 32, color: DS.hair }} />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  {product.brand && (
                    <p style={{
                      fontSize: "0.65rem", fontWeight: 700, color: DS.muted,
                      textTransform: "uppercase", letterSpacing: "0.08em",
                      margin: "0 0 4px", lineHeight: 1,
                    }}>
                      {product.brand}
                    </p>
                  )}
                  <h1 style={{
                    fontSize: "clamp(1.05rem, 4.5vw, 1.25rem)", fontWeight: 800,
                    lineHeight: 1.2, letterSpacing: "-0.02em", margin: "0 0 10px",
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>
                    {displayName}
                  </h1>

                  {/* Verdict + eco pills */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "4px 10px", borderRadius: 20,
                      background: vc.bg, color: vc.color,
                      fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.02em",
                    }}>
                      <vc.Icon style={{ width: 11, height: 11 }} />
                      {verdict.key}
                    </span>
                    {ecoGrade && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "4px 10px", borderRadius: 20,
                        background: GRADE_BG[ecoGrade],
                        color: GRADE_COLOR[ecoGrade],
                        fontSize: "0.7rem", fontWeight: 700,
                      }}>
                        <Leaf style={{ width: 10, height: 10 }} />
                        Eco {ecoGrade.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Verdict reason */}
              <div style={{
                background: vc.bg, borderRadius: 14, padding: "12px 14px",
                border: `1px solid ${DS.hair}`,
                borderLeft: `4px solid ${vc.color}`,
                marginBottom: 16,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <vc.Icon style={{ width: 16, height: 16, color: vc.color, marginTop: 1, flexShrink: 0 }} />
                  <p style={{ fontSize: "0.82rem", color: DS.ink, fontWeight: 700, lineHeight: 1.45, margin: 0 }}>
                    {verdict.reason}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => document.getElementById("breakdown")?.scrollIntoView({ behavior: "smooth" })}
                  style={{
                    flex: 1, height: 42, borderRadius: 12,
                    border: `1px solid ${DS.hair}`, background: DS.card,
                    color: DS.muted, fontWeight: 600, fontSize: "0.78rem",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  <BarChart2 style={{ width: 13, height: 13 }} />
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (inBasket) return;
                    addToBasket({
                      barcode: product.barcode,
                      productName: product.productName || "Unknown Product",
                      brand: product.brand,
                      imageUrl: product.imageUrl,
                      ecoscoreGrade: product.ecoscoreGrade,
                      ecoscoreScore: product.ecoscoreScore,
                      nutriscoreGrade: product.nutriscoreGrade,
                      laborAllegations: getLaborAllegationCount(product.brand, product.productName),
                      co2Per100g: product.carbonFootprint100g,
                    });
                    setInBasket(true);
                  }}
                  style={{
                    flex: 1, height: 42, borderRadius: 12, border: "none",
                    background: inBasket ? vc.bg : DS.ink,
                    color: inBasket ? vc.color : "#fff",
                    fontWeight: 700, fontSize: "0.78rem",
                    cursor: inBasket ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    boxShadow: inBasket ? "none" : "0 2px 8px rgba(0,0,0,0.12)",
                  }}
                >
                  <ShoppingBag style={{ width: 13, height: 13 }} />
                  {inBasket ? "In basket" : "Add to basket"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────────────── */}
        <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* ── Scan confirmation ───────────────────────────────── */}
          {fromScan && !confirmDismissed && !showCandidates && (
            <div style={{
              background: DS.card, borderRadius: 16, padding: "14px 16px",
              boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
              display: "flex", alignItems: "flex-start", gap: 12,
              opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(8px)",
              transition: "all 0.4s ease 0.15s",
            }}>
              <ScanLine style={{ width: 18, height: 18, color: DS.ink, flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 2, margin: 0 }}>Is this the right product?</p>
                <p style={{ fontSize: "0.72rem", color: DS.muted, marginBottom: 10, margin: "2px 0 10px" }}>We matched your scan automatically.</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button" onClick={() => setConfirmDismissed(true)}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "6px 14px", borderRadius: 20, border: "none",
                      background: DS.ink, color: "#fff",
                      fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    <Check style={{ width: 11, height: 11 }} /> Yes
                  </button>
                  {candidates.length > 0 && (
                    <button
                      type="button" onClick={() => setShowCandidates(true)}
                      style={{
                        display: "flex", alignItems: "center", gap: 3,
                        background: "none", border: "none", padding: 0,
                        color: DS.ink, fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      Other matches <ChevronRight style={{ width: 13, height: 13 }} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Candidate picker */}
          {fromScan && showCandidates && (
            <div style={{ background: DS.card, borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${DS.hair}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: "0.85rem", fontWeight: 700, margin: 0 }}>Other matches</p>
                  <p style={{ fontSize: "0.72rem", color: DS.muted, margin: "2px 0 0" }}>Select the correct product</p>
                </div>
                <button
                  type="button" onClick={() => setShowCandidates(false)}
                  style={{ background: "none", border: "none", color: DS.ink, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
                >Cancel</button>
              </div>
              {candidates.map((c, ci) => {
                const g = c.ecoscoreGrade?.toLowerCase();
                return (
                  <button
                    key={c.barcode} type="button"
                    onClick={() => { sessionStorage.removeItem("scan_candidates"); navigate(`/product-off/${c.barcode}`); }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 16px", textAlign: "left", cursor: "pointer",
                      borderBottom: ci < candidates.length - 1 ? `1px solid ${DS.hair}` : "none",
                      background: "none", border: "none", color: DS.ink,
                    }}
                  >
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${DS.hair}`, objectFit: "contain", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${DS.hair}`, background: DS.bg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Package style={{ width: 16, height: 16, color: DS.muted }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.82rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                        {c.productName || "Unknown product"}
                      </p>
                      {c.brand && <p style={{ fontSize: "0.7rem", color: DS.muted, margin: "2px 0 0" }}>{c.brand}</p>}
                    </div>
                    {g && (
                      <span style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: GRADE_BG[g], color: GRADE_COLOR[g],
                        fontSize: "0.78rem", fontWeight: 800,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>{g.toUpperCase()}</span>
                    )}
                    <ChevronRight style={{ width: 14, height: 14, color: DS.muted, flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Score Gauges ─────────────────────────────────────── */}
          {hasScores && (
            <div
              id="breakdown"
              style={{
                background: DS.card, borderRadius: 20, padding: "22px 12px 18px",
                boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 8,
                opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(10px)",
                transition: "all 0.5s ease 0.2s",
              }}
            >
              {ecoGrade && (
                <ScoreGauge
                  value={ecoGrade.toUpperCase()}
                  color={GRADE_COLOR[ecoGrade] ?? DS.muted}
                  bg={GRADE_BG[ecoGrade] ?? DS.bg}
                  percent={GRADE_PERCENT[ecoGrade] ?? 0.5}
                  label="Eco-Score"
                  sublabel={product.ecoscoreScore !== null ? `${product.ecoscoreScore}/100` : undefined}
                  delay={0}
                />
              )}
              {nutriGrade && ["a", "b", "c", "d", "e"].includes(nutriGrade) && (
                <ScoreGauge
                  value={nutriGrade.toUpperCase()}
                  color={GRADE_COLOR[nutriGrade] ?? DS.muted}
                  bg={GRADE_BG[nutriGrade] ?? DS.bg}
                  percent={GRADE_PERCENT[nutriGrade] ?? 0.5}
                  label="Nutri-Score"
                  delay={150}
                />
              )}
              {product.novaGroup !== null && NOVA_LABEL[product.novaGroup!] && (
                <ScoreGauge
                  value={String(product.novaGroup)}
                  color={NOVA_COLOR[product.novaGroup!] ?? DS.muted}
                  bg={`${NOVA_COLOR[product.novaGroup!] ?? DS.muted}12`}
                  percent={NOVA_PERCENT[product.novaGroup!] ?? 0.5}
                  label="NOVA"
                  sublabel={NOVA_LABEL[product.novaGroup!]}
                  delay={300}
                />
              )}
            </div>
          )}

          {/* ── CO₂ Footprint ───────────────────────────────────── */}
          {agri?.co2_total !== undefined && (
            <div style={{
              background: DS.card, borderRadius: 20, overflow: "hidden",
              boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
              opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(10px)",
              transition: "all 0.5s ease 0.3s",
            }}>
              <div style={{ padding: "18px 18px 16px" }}>
                <SectionHead title="Carbon Footprint" />

                {/* Total readout */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "#ecfdf5", borderRadius: 14, padding: "14px 16px",
                  marginBottom: 18,
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{
                        fontSize: "2rem", fontWeight: 900, color: "#10b981",
                        lineHeight: 1, fontVariantNumeric: "tabular-nums",
                      }}>
                        {agri.co2_total.toFixed(2)}
                      </span>
                      <span style={{ fontSize: "0.72rem", fontWeight: 600, color: DS.muted }}>kg CO₂/kg</span>
                    </div>
                    {drivingKm !== null && (
                      <p style={{ fontSize: "0.72rem", color: DS.muted, marginTop: 5, margin: "5px 0 0" }}>
                        Same as driving <span style={{ fontWeight: 700, color: DS.ink }}>{drivingKm} km</span>
                      </p>
                    )}
                  </div>
                  <Leaf style={{ width: 28, height: 28, color: "#10b981", opacity: 0.2 }} />
                </div>

                {/* Lifecycle bars */}
                {co2Values.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {CO2_BARS.map(({ key, label, Icon, color }, i) => {
                      const val = agri[key as keyof typeof agri] as number | undefined;
                      if (typeof val !== "number" || val <= 0) return null;
                      const pct = Math.round((val / maxCo2) * 100);
                      return (
                        <div key={key}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <div style={{
                                width: 24, height: 24, borderRadius: 7,
                                background: `${color}12`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                <Icon style={{ width: 12, height: 12, color }} />
                              </div>
                              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: DS.ink }}>{label}</span>
                            </div>
                            <span style={{ fontSize: "0.72rem", fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>
                              {val.toFixed(2)}
                            </span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: DS.bg, overflow: "hidden" }}>
                            <div style={{
                              height: "100%", borderRadius: 3,
                              background: `linear-gradient(90deg, ${color}, ${color}bb)`,
                              width: mounted ? `${pct}%` : "0%",
                              transition: `width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.4 + i * 0.1}s`,
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Ethics ──────────────────────────────────────────── */}
          {hasEthicsConcerns ? (
            <div style={{
              background: DS.card, borderRadius: 20, overflow: "hidden",
              boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
              opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(10px)",
              transition: "all 0.5s ease 0.4s",
            }}>
              <div style={{ padding: "18px 18px 16px" }}>
                <SectionHead title="Ethics & Labour" />

                {/* Labor clean */}
                {!laborRecord && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "#ecfdf5", borderRadius: 12, padding: "10px 14px", marginBottom: 14,
                  }}>
                    <CheckCircle2 style={{ width: 15, height: 15, color: "#10b981", flexShrink: 0 }} />
                    <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#10b981", margin: 0 }}>No labour concerns found</p>
                  </div>
                )}

                {/* Labor concerns */}
                {laborRecord && (
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: "0.72rem", color: DS.muted, marginBottom: 10, margin: "0 0 10px" }}>
                      Parent company: <span style={{ color: DS.ink, fontWeight: 700 }}>{laborRecord.parentCompany}</span>
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {laborRecord.allegations.map((al, i) => (
                        <div key={i} style={{
                          background: "#fef2f2", borderRadius: 14, padding: "14px 14px 12px",
                          borderLeft: "3px solid #ef4444",
                        }}>
                          <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#ef4444", marginBottom: 4, margin: "0 0 4px" }}>{al.issue}</p>
                          <p style={{ fontSize: "0.75rem", color: DS.muted, lineHeight: 1.5, marginBottom: 10, margin: "0 0 10px" }}>{al.details}</p>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <a
                              href={al.sourceUrl} target="_blank" rel="noopener noreferrer"
                              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.68rem", color: "#ef4444", textDecoration: "none", fontWeight: 600 }}
                            >
                              <ExternalLink style={{ width: 10, height: 10 }} />{al.source}
                            </a>
                            <span style={{
                              fontSize: "0.65rem", fontWeight: 700, color: "#ef4444",
                              background: "#fecaca", padding: "2px 8px", borderRadius: 6,
                            }}>{al.year}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: "0.65rem", color: DS.muted, fontStyle: "italic", marginTop: 10, margin: "10px 0 0" }}>
                      Based on publicly available reports. Companies may have taken corrective steps.
                    </p>
                  </div>
                )}

                {/* Animal welfare */}
                {(laborRecord || boycottMatch) && <Divider />}
                <div style={{ paddingTop: (laborRecord || boycottMatch) ? 14 : 0 }}>
                  <AnimalWelfareFlagBadge brand={product.brand} showDetails={true} />
                </div>

                {/* Boycott */}
                {boycottMatch && (
                  <>
                    <Divider />
                    <div style={{ paddingTop: 14 }}>
                      <div style={{
                        background: "#fff7ed", borderRadius: 14, padding: "14px",
                        borderLeft: "3px solid #f97316",
                      }}>
                        <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#f97316", margin: "0 0 4px" }}>
                          {boycottMatch.parent} — Boycott listed
                        </p>
                        <p style={{ fontSize: "0.75rem", color: DS.muted, lineHeight: 1.5, margin: "0 0 8px" }}>
                          {boycottMatch.reason}
                        </p>
                        <a
                          href="https://boycott-israel.org/boycott.html" target="_blank" rel="noopener noreferrer"
                          style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.68rem", color: "#f97316", textDecoration: "none", fontWeight: 600 }}
                        >
                          <ExternalLink style={{ width: 10, height: 10 }} /> BDS Boycott List
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              background: DS.card, borderRadius: 20, padding: "18px",
              boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
              display: "flex", alignItems: "center", gap: 14,
              opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(10px)",
              transition: "all 0.5s ease 0.4s",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: "#ecfdf5",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <CheckCircle2 style={{ width: 22, height: 22, color: "#10b981" }} />
              </div>
              <div>
                <p style={{ fontSize: "0.85rem", fontWeight: 800, color: "#10b981", margin: "0 0 3px" }}>No ethical concerns</p>
                <p style={{ fontSize: "0.72rem", color: DS.muted, lineHeight: 1.5, margin: 0 }}>
                  No labour, boycott, or animal welfare flags in our database.
                </p>
              </div>
            </div>
          )}

          {/* ── Environmental adjustments ────────────────────── */}
          <div style={{
            opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(10px)",
            transition: "all 0.5s ease 0.5s",
          }}>
            <EnvironmentalImpactCard result={product} />
          </div>

          {/* ── Threatened Species ───────────────────────────── */}
          {(() => {
            const threatened = product.ecoscoreData?.adjustments?.threatened_species;
            if (!threatened?.ingredient) return null;
            const ingredientRaw = threatened.ingredient.replace(/^en:/, "").replace(/-/g, " ");
            const isPalmOil = ingredientRaw.toLowerCase().includes("palm");
            const explanation = isPalmOil
              ? "Palm oil is the #1 driver of tropical deforestation. Its cultivation destroys critical habitat for orangutans, pygmy elephants, and Sumatran tigers."
              : `${ingredientRaw} production is linked to habitat destruction in biodiversity hotspots.`;
            return (
              <div style={{
                background: DS.card, borderRadius: 20, overflow: "hidden",
                boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(10px)",
                transition: "all 0.5s ease 0.55s",
              }}>
                <div style={{ padding: "18px" }}>
                  <SectionHead title="Threatened Species" />
                  <div style={{
                    background: "#fef2f2", borderRadius: 14, padding: 14,
                    borderLeft: "3px solid #ef4444",
                    display: "flex", alignItems: "flex-start", gap: 10,
                  }}>
                    <AlertTriangle style={{ width: 16, height: 16, color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#ef4444", margin: "0 0 4px" }}>
                        Contains {ingredientRaw}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: DS.ink, lineHeight: 1.55, margin: 0 }}>{explanation}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: "0.62rem", color: DS.muted, marginTop: 10, margin: "10px 0 0" }}>Source: Open Food Facts Ecoscore</p>
                </div>
              </div>
            );
          })()}

          {/* ── Certifications ───────────────────────────────── */}
          {product.labels.length > 0 && (
            <div style={{
              background: DS.card, borderRadius: 20, padding: "18px",
              boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
              opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(10px)",
              transition: "all 0.5s ease 0.6s",
            }}>
              <SectionHead title="Certifications" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {product.labels.map(label => (
                  <span
                    key={label}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "5px 10px", borderRadius: 20,
                      background: DS.bg, color: DS.ink,
                      fontSize: "0.7rem", fontWeight: 600,
                    }}
                  >
                    <BadgeCheck style={{ width: 11, height: 11, color: "#10b981" }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Footer ──────────────────────────────────────── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 0",
            opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease 0.7s",
          }}>
            <span style={{
              fontSize: "0.65rem", color: DS.muted,
              background: DS.card, padding: "4px 14px", borderRadius: 20,
              fontVariantNumeric: "tabular-nums",
            }}>
              {product.barcode}
            </span>
          </div>

          {/* Scan again */}
          {fromScan && (
            <button
              type="button"
              onClick={() => navigate("/scan")}
              style={{
                width: "100%", height: 50, borderRadius: 14, border: "none",
                background: DS.ink, color: "#fff",
                fontWeight: 700, fontSize: "0.88rem",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(6px)",
                transition: "all 0.5s ease 0.75s",
              }}
            >
              <ScanLine style={{ width: 17, height: 17 }} />
              Scan another product
            </button>
          )}
        </div>
      </main>

      <BottomNav />

      <style>{`
        @keyframes off-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── Verdict logic ────────────────────────────────────────────────────────────

function buildFromCache(cached: ReturnType<typeof loadScanHistory>[number]): OpenFoodFactsResult {
  return {
    found: true,
    barcode: cached.barcode,
    productName: cached.productName,
    brand: cached.brand,
    imageUrl: cached.imageUrl,
    ecoscoreGrade: cached.scores.ecoGrade,
    ecoscoreScore: cached.scores.ecoScore,
    nutriscoreGrade: cached.scores.nutriScore,
    nutriscoreScore: null,
    novaGroup: cached.scores.novaGroup,
    carbonFootprint100g: null,
    carbonFootprintProduct: null,
    carbonFootprintServing: null,
    labels: [],
    categories: [],
    origins: null,
    ingredientsText: null,
    ecoscoreData: null,
    rawProduct: null,
  };
}

function getVerdictKey(product: OpenFoodFactsResult, priorities: UserPriorities): string {
  return getVerdict(product, priorities).key;
}

function getVerdict(product: OpenFoodFactsResult, priorities: UserPriorities) {
  const grade = product.ecoscoreGrade?.toLowerCase();
  const score = product.ecoscoreScore;
  const laborRecord = findLaborAllegations(product);
  const laborCount = laborRecord?.allegations.length || 0;
  const envWeight   = priorities.environment / 50;
  const laborWeight = priorities.laborRights / 50;

  const scoreLabel = grade
    ? `Eco-Score ${grade.toUpperCase()}`
    : score !== null && score !== undefined
    ? `Eco-Score ${score}/100`
    : "No eco-score data";

  let key = "UNKNOWN";
  let reason = "No eco-score data available";

  if (grade === "a" || grade === "b") {
    key = "BUY"; reason = `${scoreLabel} — excellent environmental credentials`;
  } else if (grade === "c") {
    if (envWeight > 1.4) { key = "CAUTION"; reason = `${scoreLabel} (your eco priority is high)`; }
    else                 { key = "CONSIDER"; reason = `${scoreLabel} — moderate environmental impact`; }
  } else if (grade === "d") {
    key = "CAUTION"; reason = `${scoreLabel} — high environmental impact`;
  } else if (grade === "e" || grade === "f") {
    key = "AVOID"; reason = `${scoreLabel} — very high environmental impact`;
  } else if (score !== null && score !== undefined) {
    const good = 60 + (envWeight - 1) * 15;
    const mod  = 40 + (envWeight - 1) * 10;
    const caut = 20 + (envWeight - 1) * 5;
    if (score >= good)      { key = "BUY";     reason = `${scoreLabel} — strong eco credentials`; }
    else if (score >= mod)  { key = "CONSIDER"; reason = `${scoreLabel} — moderate impact`; }
    else if (score >= caut) { key = "CAUTION";  reason = `${scoreLabel} — elevated impact`; }
    else                    { key = "AVOID";    reason = `${scoreLabel} — very high impact`; }
  }

  if (laborCount > 0) {
    const eff = laborCount * laborWeight;
    if (eff >= 2.5 || laborCount >= 3) {
      key = "AVOID"; reason = `${laborCount} labor/human rights allegations against ${laborRecord!.parentCompany}`;
    } else if (eff >= 1.5 && (key === "BUY" || key === "CONSIDER" || key === "UNKNOWN")) {
      key = "CAUTION"; reason = `${laborCount} labor allegations against ${laborRecord!.parentCompany}`;
    } else if (eff >= 0.5 && (key === "BUY" || key === "UNKNOWN")) {
      key = "CONSIDER"; reason = `${laborCount} labor allegation${laborCount > 1 ? "s" : ""} against ${laborRecord!.parentCompany}`;
    }
  }

  const boycott = checkBoycott(product.brand);
  if (boycott && key === "BUY") {
    key = "CONSIDER"; reason = `${boycott.parent} is on the BDS boycott list`;
  }

  const welfare = checkAnimalWelfareFlag(product.brand);
  if (welfare.isFlagged) {
    if (welfare.severity === "critical" && (key === "BUY" || key === "CONSIDER" || key === "UNKNOWN")) {
      key = "CAUTION"; reason = `${welfare.company!.companyName} has critical animal welfare concerns`;
    } else if (welfare.severity === "high" && (key === "BUY" || key === "UNKNOWN")) {
      key = "CONSIDER"; reason = `${welfare.company!.companyName} has animal welfare concerns`;
    }
  }

  return { key, reason };
}
