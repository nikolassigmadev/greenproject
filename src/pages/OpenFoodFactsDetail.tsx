import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft, Loader2, Leaf, AlertTriangle, Flag, ExternalLink,
  CheckCircle2, ChevronRight, Package, ShoppingBag, XCircle, Clock,
  BadgeCheck, Wheat, Factory, Truck, Store, UtensilsCrossed, Scale,
  ScanLine, Check, Megaphone, BarChart2, Sprout, PawPrint,
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

// Simple in-memory cache so we don't re-call for the same raw name
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

// ─── Design tokens ────────────────────────────────────────────────────────────

const BLUE = "#2979FF";
const BG   = "#F5F7FA";
const CARD = "#FFFFFF";
const BORDER = "#E5E7EB";
const TEXT = "#111827";
const TEXT_MUTED = "#6B7280";

const GRADE_BORDER: Record<string, string> = {
  a: "#10b981",
  b: "#84cc16",
  c: "#f59e0b",
  d: "#f97316",
  e: "#ef4444",
};

const GRADE_TEXT: Record<string, string> = {
  a: "#10b981",
  b: "#84cc16",
  c: "#f59e0b",
  d: "#f97316",
  e: "#ef4444",
};

const GRADE_BG: Record<string, string> = {
  a: "#F0FAF6",
  b: "#F7FAF0",
  c: "#FFFBEB",
  d: "#FFF5EE",
  e: "#FFF0F0",
};

const NOVA_LABEL: Record<number, string> = {
  1: "Unprocessed",
  2: "Culinary",
  3: "Processed",
  4: "Ultra-proc.",
};

const NOVA_COLOR: Record<number, string> = {
  1: "#10b981",
  2: "#84cc16",
  3: "#f59e0b",
  4: "#ef4444",
};

const VERDICT_CONFIG = {
  BUY: {
    borderColor: "#10b981",
    textColor: "#10b981",
    Icon: CheckCircle2,
    label: "BUY",
  },
  CONSIDER: {
    borderColor: "#f59e0b",
    textColor: "#f59e0b",
    Icon: Clock,
    label: "CONSIDER",
  },
  CAUTION: {
    borderColor: "#f97316",
    textColor: "#f97316",
    Icon: AlertTriangle,
    label: "CAUTION",
  },
  AVOID: {
    borderColor: "#ef4444",
    textColor: "#ef4444",
    Icon: XCircle,
    label: "AVOID",
  },
  UNKNOWN: {
    borderColor: "#9CA3AF",
    textColor: "#9CA3AF",
    Icon: Clock,
    label: "UNKNOWN",
  },
};

const CO2_BARS = [
  { key: "co2_agriculture",    label: "Agriculture",  Icon: Wheat,           color: "#10b981" },
  { key: "co2_processing",     label: "Processing",   Icon: Factory,         color: "#40aaff" },
  { key: "co2_packaging",      label: "Packaging",    Icon: Package,         color: "#f59e0b" },
  { key: "co2_transportation", label: "Transport",    Icon: Truck,           color: "#f97316" },
  { key: "co2_distribution",   label: "Distribution", Icon: Store,           color: "#a855f7" },
  { key: "co2_consumption",    label: "Consumption",  Icon: UtensilsCrossed, color: "#ec4899" },
] as const;

// ─── Shared components ────────────────────────────────────────────────────────

function InfoCard({ children, accentColor }: {
  children: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 18,
        borderLeft: accentColor ? `4px solid ${accentColor}` : `1px solid ${BORDER}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p style={{ fontSize: "0.65rem", fontWeight: 800, color: TEXT_MUTED, letterSpacing: "0.07em", marginBottom: 14, textTransform: "uppercase" }}>
      {label}
    </p>
  );
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
      BUY: "#10b981", CONSIDER: "#f59e0b", CAUTION: "#f97316", AVOID: "#ef4444", UNKNOWN: "#9CA3AF",
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

  // Clean product name via OpenAI
  useEffect(() => {
    if (!product?.productName) return;
    setCleanName(null);
    fetchCleanName(product.productName).then(setCleanName);
  }, [product?.productName]);

  // Sticky header on scroll
  useEffect(() => {
    const onScroll = () => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      setStickyVisible(rect.bottom < 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const loadProduct = async (code: string) => {
    setLoading(true);
    try {
      const result = await lookupBarcode(code);
      if (result.found) {
        setProduct(result);
      } else {
        const cached = loadScanHistory().find(h => h.barcode === code);
        if (cached) {
          setProduct(buildFromCache(cached));
        } else {
          setError("Product not found in OpenFoodFacts database");
        }
      }
    } catch {
      const cached = loadScanHistory().find(h => h.barcode === code);
      if (cached) setProduct(buildFromCache(cached));
      else setError("Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  // ─── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: BG }}>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div
            style={{
              width: "3.5rem", height: "3.5rem",
              borderRadius: "50%",
              border: `3px solid ${BORDER}`,
              borderTopColor: BLUE,
              animation: "spin 0.8s linear infinite",
            }}
          />
          <div className="text-center">
            <p style={{ fontSize: "0.85rem", fontWeight: 600, color: TEXT }}>Loading product</p>
            <p style={{ fontSize: "0.75rem", color: TEXT_MUTED, marginTop: 4 }}>Fetching data…</p>
          </div>
        </div>
        <BottomNav />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: BG }}>
        <div className="flex-1 px-5 pt-14 max-w-xl mx-auto w-full">
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: TEXT_MUTED, fontSize: "0.85rem", cursor: "pointer", marginBottom: 24 }}
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div style={{ background: "#FFF0F0", borderRadius: 16, border: "1px solid #FFCCCC", padding: "16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <XCircle style={{ color: "#ef4444", width: 20, height: 20, flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>Product not found</p>
              <p style={{ fontSize: "0.8rem", color: TEXT_MUTED }}>{error || "Unable to load product details"}</p>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const verdict      = getVerdict(product, priorities);
  const vc           = VERDICT_CONFIG[verdict.key as keyof typeof VERDICT_CONFIG] ?? VERDICT_CONFIG.UNKNOWN;
  const agri         = product.ecoscoreData?.agribalyse;
  const laborRecord  = findLaborAllegations(product);
  const boycottMatch = checkBoycott(product.brand);
  const welfare      = checkAnimalWelfareFlag(product.brand);

  const co2Values = CO2_BARS
    .map(b => agri?.[b.key as keyof typeof agri] as number | undefined)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const maxCo2 = co2Values.length > 0 ? Math.max(...co2Values) : 1;

  const drivingKm = agri?.co2_total != null
    ? Math.round((agri.co2_total / 0.21) * 10) / 10
    : null;

  const ecoGrade = product.ecoscoreGrade?.toLowerCase();

  return (
    <div className="min-h-dvh" style={{ background: BG }}>

      {/* ── Sticky header ─────────────────────────────────────────────────────── */}
      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
        stickyVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      )}>
        <div
          className="max-w-xl mx-auto px-4 py-2.5 flex items-center gap-3"
          style={{
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              width: "2rem", height: "2rem", borderRadius: "50%",
              border: `1px solid ${BORDER}`,
              background: CARD,
              color: TEXT_MUTED,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0,
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <p
            className="truncate flex-1"
            style={{ fontSize: "0.85rem", fontWeight: 700, color: TEXT }}
          >
            {cleanName ?? product.productName ?? "Unknown product"}
          </p>
          {ecoGrade && (
            <span
              style={{
                width: "2rem", height: "2rem", borderRadius: 8,
                background: GRADE_BG[ecoGrade] ?? "#F5F7FA",
                color: GRADE_TEXT[ecoGrade] ?? TEXT_MUTED,
                fontSize: "0.9rem", fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {ecoGrade.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      <main style={{ paddingBottom: "7rem", maxWidth: "36rem", margin: "0 auto" }}>

        {/* ── 1. Hero ───────────────────────────────────────────────────────── */}
        <div
          ref={heroRef}
          style={{
            background: CARD,
            borderBottom: `1px solid ${BORDER}`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle verdict color tint in top-right */}
          <div style={{
            position: "absolute", top: -40, right: -40,
            width: 160, height: 160, borderRadius: "50%",
            background: `${vc.borderColor}10`,
            pointerEvents: "none",
          }} />

          {/* Back button row */}
          <div style={{ padding: "max(52px, env(safe-area-inset-top)) 16px 0", position: "relative" }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: BG, border: `1px solid ${BORDER}`,
                borderRadius: 20, padding: "5px 12px 5px 8px",
                color: TEXT_MUTED, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
              }}
            >
              <ChevronLeft style={{ width: 14, height: 14 }} /> Back
            </button>
          </div>

          <div style={{ display: "flex", gap: 16, padding: "16px 16px 20px", position: "relative" }}>
            {/* Product image */}
            <div style={{
              width: 110, height: 110, borderRadius: 18,
              border: `1px solid ${BORDER}`, background: BG,
              flexShrink: 0, overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            }}>
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.productName || "Product"}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              ) : (
                <Sprout style={{ width: 40, height: 40, color: BORDER }} />
              )}
            </div>

            {/* Product info */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
              {product.brand && (
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                  {product.brand}
                </p>
              )}
              <h1 style={{ fontSize: "clamp(1rem, 4.5vw, 1.2rem)", fontWeight: 800, color: TEXT, lineHeight: 1.25, letterSpacing: "-0.02em", margin: 0 }}>
                {cleanName ?? product.productName ?? "Unknown product"}
              </h1>
              {/* Verdict pill in hero */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "4px 10px", borderRadius: 20,
                  background: `${vc.borderColor}15`,
                  color: vc.textColor,
                  fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.03em",
                  border: `1px solid ${vc.borderColor}30`,
                }}>
                  <vc.Icon style={{ width: 11, height: 11 }} />
                  {verdict.key}
                </span>
                {ecoGrade && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "4px 10px", borderRadius: 20,
                    background: GRADE_BG[ecoGrade] ?? BG,
                    color: GRADE_TEXT[ecoGrade] ?? TEXT_MUTED,
                    fontSize: "0.72rem", fontWeight: 700,
                    border: `1px solid ${GRADE_TEXT[ecoGrade] ?? BORDER}20`,
                  }}>
                    <Leaf style={{ width: 11, height: 11 }} />
                    Eco {ecoGrade.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* ── 2. Verdict card ─────────────────────────────────────────────── */}
          <div style={{
            borderRadius: 18,
            border: `1px solid ${vc.borderColor}40`,
            background: `linear-gradient(135deg, ${vc.borderColor}08 0%, ${vc.borderColor}03 100%)`,
            overflow: "hidden",
            boxShadow: `0 2px 12px ${vc.borderColor}15`,
          }}>
            <div style={{ padding: "18px 18px 14px" }}>
              {/* Top row: icon + verdict + reason */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                  background: `${vc.borderColor}15`,
                  border: `1.5px solid ${vc.borderColor}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <vc.Icon style={{ width: 24, height: 24, color: vc.textColor }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.65rem", fontWeight: 700, color: TEXT_MUTED, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>Verdict</p>
                  <p style={{ fontSize: "1.6rem", fontWeight: 900, color: vc.textColor, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 8 }}>
                    {verdict.key}
                  </p>
                  <p style={{
                    fontSize: "0.78rem", color: TEXT_MUTED, lineHeight: 1.55,
                    borderLeft: `3px solid ${vc.borderColor}60`,
                    paddingLeft: 9,
                  }}>
                    {verdict.reason}
                  </p>
                </div>
              </div>

              {/* Action row */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => document.getElementById("breakdown")?.scrollIntoView({ behavior: "smooth" })}
                  style={{
                    flex: 1, height: 42, borderRadius: 11,
                    border: `1px solid ${BORDER}`, background: "#fff",
                    color: TEXT_MUTED, fontWeight: 600, fontSize: "0.78rem",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  <BarChart2 style={{ width: 13, height: 13 }} />
                  See breakdown
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
                    flex: 1, height: 42, borderRadius: 11, border: "none",
                    background: inBasket ? `${vc.borderColor}15` : BLUE,
                    color: inBasket ? vc.textColor : "#fff",
                    fontWeight: 700, fontSize: "0.78rem",
                    cursor: inBasket ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    boxShadow: inBasket ? "none" : "0 2px 8px rgba(41,121,255,0.35)",
                  }}
                >
                  <ShoppingBag style={{ width: 13, height: 13 }} />
                  {inBasket ? "In basket ✓" : "Add to basket"}
                </button>
              </div>
            </div>
          </div>

          {/* ── 3. Scan confirmation ─────────────────────────────────────────── */}
          {fromScan && !confirmDismissed && !showCandidates && (
            <div style={{
              background: "#EBF2FF", borderRadius: 16,
              border: "1px solid #C3D6FF", padding: "14px 16px",
              display: "flex", alignItems: "flex-start", gap: 12,
            }}>
              <ScanLine style={{ width: 18, height: 18, color: BLUE, flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "0.85rem", fontWeight: 700, color: TEXT, marginBottom: 2 }}>Is this the right product?</p>
                <p style={{ fontSize: "0.75rem", color: TEXT_MUTED, marginBottom: 10 }}>We matched your scan automatically.</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setConfirmDismissed(true)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "6px 14px", borderRadius: 20, border: "none",
                      background: BLUE, color: "#fff",
                      fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    <Check style={{ width: 12, height: 12 }} /> Yes, correct
                  </button>
                  {candidates.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowCandidates(true)}
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        background: "none", border: "none",
                        color: BLUE, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      Other matches <ChevronRight style={{ width: 14, height: 14 }} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Candidate picker */}
          {fromScan && showCandidates && (
            <InfoCard>
              <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: "0.9rem", fontWeight: 700, color: TEXT }}>Other matches</p>
                  <p style={{ fontSize: "0.75rem", color: TEXT_MUTED }}>Select the correct product</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCandidates(false)}
                  style={{ background: "none", border: "none", color: BLUE, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
              <div>
                {candidates.map((c, ci) => {
                  const g = c.ecoscoreGrade?.toLowerCase();
                  return (
                    <button
                      key={c.barcode}
                      type="button"
                      onClick={() => { sessionStorage.removeItem("scan_candidates"); navigate(`/product-off/${c.barcode}`); }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 16px", textAlign: "left", cursor: "pointer",
                        borderBottom: ci < candidates.length - 1 ? `1px solid ${BORDER}` : "none",
                        background: "none", border: "none",
                      }}
                    >
                      {c.imageUrl ? (
                        <img
                          src={c.imageUrl}
                          alt=""
                          style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${BORDER}`, objectFit: "contain", flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${BORDER}`, background: BG, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Package style={{ width: 16, height: 16, color: TEXT_MUTED }} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "0.85rem", fontWeight: 600, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.productName || "Unknown product"}
                        </p>
                        {c.brand && (
                          <p style={{ fontSize: "0.72rem", color: TEXT_MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.brand}
                          </p>
                        )}
                      </div>
                      {g && (
                        <span style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: GRADE_BG[g] ?? BG,
                          color: GRADE_TEXT[g] ?? TEXT_MUTED,
                          fontSize: "0.8rem", fontWeight: 800,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          {g.toUpperCase()}
                        </span>
                      )}
                      <ChevronRight style={{ width: 14, height: 14, color: TEXT_MUTED, flexShrink: 0 }} />
                    </button>
                  );
                })}
              </div>
            </InfoCard>
          )}

          {/* ── 4. Score tiles ──────────────────────────────────────────────── */}
          {(product.ecoscoreGrade || product.nutriscoreGrade || product.novaGroup) && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }} id="breakdown">
              {product.ecoscoreGrade && (() => {
                const g = product.ecoscoreGrade.toLowerCase();
                const color = GRADE_TEXT[g] ?? TEXT_MUTED;
                const bg = GRADE_BG[g] ?? BG;
                return (
                  <div style={{
                    background: CARD, borderRadius: 16,
                    border: `1px solid ${color}25`,
                    padding: "16px 8px 12px",
                    display: "flex", flexDirection: "column", alignItems: "center",
                    boxShadow: `0 2px 8px ${color}12`,
                    position: "relative", overflow: "hidden",
                  }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: "16px 16px 0 0" }} />
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: "1.6rem", fontWeight: 900, color, lineHeight: 1 }}>{g.toUpperCase()}</span>
                    </div>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.04em" }}>Eco</span>
                    {product.ecoscoreScore !== null && (
                      <span style={{ fontSize: "0.6rem", color: TEXT_MUTED, marginTop: 2 }}>{product.ecoscoreScore}/100</span>
                    )}
                  </div>
                );
              })()}
              {product.nutriscoreGrade && (() => {
                const g = product.nutriscoreGrade.toLowerCase();
                const isLetter = ["a", "b", "c", "d", "e"].includes(g);
                const color = GRADE_TEXT[g] ?? TEXT_MUTED;
                const bg = GRADE_BG[g] ?? BG;
                return (
                  <div style={{
                    background: CARD, borderRadius: 16,
                    border: `1px solid ${color}25`,
                    padding: "16px 8px 12px",
                    display: "flex", flexDirection: "column", alignItems: "center",
                    boxShadow: `0 2px 8px ${color}12`,
                    position: "relative", overflow: "hidden",
                  }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: "16px 16px 0 0" }} />
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: isLetter ? "1.6rem" : "1.1rem", fontWeight: 900, color, lineHeight: 1 }}>
                        {isLetter ? g.toUpperCase() : "—"}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.04em" }}>Nutri</span>
                    <span style={{ fontSize: "0.6rem", color: TEXT_MUTED, marginTop: 2, textAlign: "center" }}>Score</span>
                  </div>
                );
              })()}
              {product.novaGroup !== null && NOVA_LABEL[product.novaGroup!] && (() => {
                const color = NOVA_COLOR[product.novaGroup!] ?? TEXT_MUTED;
                return (
                  <div style={{
                    background: CARD, borderRadius: 16,
                    border: `1px solid ${color}25`,
                    padding: "16px 8px 12px",
                    display: "flex", flexDirection: "column", alignItems: "center",
                    boxShadow: `0 2px 8px ${color}12`,
                    position: "relative", overflow: "hidden",
                  }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: "16px 16px 0 0" }} />
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: "1.6rem", fontWeight: 900, color, lineHeight: 1 }}>{product.novaGroup}</span>
                    </div>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.04em" }}>Nova</span>
                    <span style={{ fontSize: "0.6rem", color: TEXT_MUTED, marginTop: 2, textAlign: "center" }}>
                      {NOVA_LABEL[product.novaGroup!]}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── 5. CO₂ Footprint ────────────────────────────────────────────── */}
          {agri?.co2_total !== undefined && (
            <InfoCard accentColor="#10b981">
              <div style={{ padding: 16 }}>
                <SectionLabel label="CO₂ Footprint" />

                {/* Total readout */}
                <div style={{
                  background: "#F0FAF6", borderRadius: 12, padding: "12px 14px", marginBottom: 16,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontSize: "2.4rem", fontWeight: 900, color: "#10b981", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                        {agri.co2_total.toFixed(2)}
                      </span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: TEXT_MUTED }}>kg CO₂/kg</span>
                    </div>
                    {drivingKm !== null && (
                      <p style={{ fontSize: "0.75rem", color: TEXT_MUTED, marginTop: 4 }}>
                        ≈ driving <span style={{ color: BLUE, fontWeight: 600 }}>{drivingKm} km</span> in an average car
                      </p>
                    )}
                  </div>
                  <Leaf style={{ width: 32, height: 32, color: "#10b981", opacity: 0.3 }} />
                </div>

                {/* Lifecycle breakdown — clean progress bars */}
                {co2Values.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {CO2_BARS.map(({ key, label, Icon, color }) => {
                      const val = agri[key as keyof typeof agri] as number | undefined;
                      if (typeof val !== "number" || val <= 0) return null;
                      const pct = Math.round((val / maxCo2) * 100);
                      return (
                        <div key={key}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <Icon style={{ width: 12, height: 12, color }} />
                              <span style={{ fontSize: "0.72rem", fontWeight: 500, color: TEXT_MUTED }}>{label}</span>
                            </div>
                            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: TEXT }}>{val.toFixed(2)} kg</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: BORDER, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, borderRadius: 3, background: color, transition: "width 0.5s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </InfoCard>
          )}

          {/* ── 6. Ethics ───────────────────────────────────────────────────── */}
          {(laborRecord || boycottMatch || welfare.isFlagged) ? (
            <InfoCard accentColor={laborRecord ? "#ef4444" : boycottMatch ? "#f97316" : "#a855f7"}>
              <div style={{ padding: 16 }}>
                <SectionLabel label="Ethics Analysis" />

                {/* Labor: clean */}
                {!laborRecord && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "#F0FAF6", borderRadius: 10, padding: "10px 12px", marginBottom: 12,
                  }}>
                    <CheckCircle2 style={{ width: 16, height: 16, color: "#10b981", flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#10b981" }}>No labor concerns</p>
                      <p style={{ fontSize: "0.72rem", color: TEXT_MUTED }}>No allegations found in our database.</p>
                    </div>
                  </div>
                )}

                {/* Labor: concerns */}
                {laborRecord && (
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: "0.75rem", color: TEXT_MUTED, marginBottom: 8 }}>
                      Parent company: <span style={{ color: TEXT, fontWeight: 600 }}>{laborRecord.parentCompany}</span>
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {laborRecord.allegations.map((al, i) => (
                        <div key={i} style={{
                          background: "#FFF5F5", borderRadius: 10,
                          border: "1px solid #FFCCCC", borderLeft: "3px solid #ef4444",
                          padding: 12,
                        }}>
                          <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>{al.issue}</p>
                          <p style={{ fontSize: "0.75rem", color: TEXT_MUTED, lineHeight: 1.5, marginBottom: 8 }}>{al.details}</p>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <a
                              href={al.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.7rem", color: "#ef4444", textDecoration: "none", fontWeight: 500 }}
                            >
                              <ExternalLink style={{ width: 10, height: 10 }} />{al.source}
                            </a>
                            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#ef4444", background: "#FFCCCC", padding: "2px 8px", borderRadius: 6 }}>
                              {al.year}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: "0.68rem", color: TEXT_MUTED, fontStyle: "italic", marginTop: 8 }}>
                      Based on publicly available reports. Companies may have taken corrective steps.
                    </p>
                  </div>
                )}

                {/* Animal welfare */}
                <div style={{ borderTop: (laborRecord || boycottMatch) ? `1px solid ${BORDER}` : "none", paddingTop: (laborRecord || boycottMatch) ? 12 : 0, marginTop: (laborRecord || boycottMatch) ? 12 : 0 }}>
                  <AnimalWelfareFlagBadge brand={product.brand} showDetails={true} />
                </div>

                {/* Boycott */}
                {boycottMatch && (
                  <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12, marginTop: 12 }}>
                    <div style={{
                      background: "#FFF6EE", borderRadius: 10,
                      border: "1px solid #FDDCB5", borderLeft: "3px solid #f97316",
                      padding: 12,
                    }}>
                      <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#f97316", marginBottom: 4 }}>
                        {boycottMatch.parent} — Boycott listed
                      </p>
                      <p style={{ fontSize: "0.75rem", color: TEXT_MUTED, lineHeight: 1.5, marginBottom: 8 }}>
                        {boycottMatch.reason}
                      </p>
                      <a
                        href="https://boycott-israel.org/boycott.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem", color: "#f97316", textDecoration: "none", fontWeight: 500 }}
                      >
                        <ExternalLink style={{ width: 10, height: 10 }} /> BDS Boycott List
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </InfoCard>
          ) : (
            <div style={{
              background: "linear-gradient(135deg, #F0FAF6 0%, #E8F8F0 100%)",
              borderRadius: 16,
              border: "1px solid #BBE8D4",
              padding: "16px",
              display: "flex", alignItems: "center", gap: 14,
              boxShadow: "0 2px 8px rgba(16,185,129,0.08)",
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#10b98118", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CheckCircle2 style={{ width: 22, height: 22, color: "#10b981" }} />
              </div>
              <div>
                <p style={{ fontSize: "0.88rem", fontWeight: 800, color: "#10b981", marginBottom: 3 }}>No ethical concerns found</p>
                <p style={{ fontSize: "0.75rem", color: TEXT_MUTED, lineHeight: 1.5 }}>No labor, boycott, or animal welfare flags for this brand in our database.</p>
              </div>
            </div>
          )}

          {/* ── 7. Environmental adjustments ────────────────────────────────── */}
          <EnvironmentalImpactCard result={product} />

          {/* ── 7b. Threatened Species ───────────────────────────────────────── */}
          {(() => {
            const threatened = product.ecoscoreData?.adjustments?.threatened_species;
            if (!threatened?.ingredient) return null;
            const ingredientRaw = threatened.ingredient.replace(/^en:/, "").replace(/-/g, " ");
            const isPalmOil = ingredientRaw.toLowerCase().includes("palm");
            const explanation = isPalmOil
              ? "Palm oil is the #1 driver of tropical deforestation. Its cultivation destroys critical habitat for orangutans, pygmy elephants, and Sumatran tigers — all critically endangered. An estimated 3.5 million hectares of forest are cleared for palm plantations every year."
              : `${ingredientRaw} production is linked to habitat destruction in biodiversity hotspots. Sourcing from high-risk regions accelerates species loss and ecosystem collapse at a scale that cannot be reversed.`;
            return (
              <InfoCard accentColor="#ef4444">
                <div style={{ padding: 16 }}>
                  <SectionLabel label="Threatened Species Risk" />
                  <div style={{
                    background: "#FFF5F5", borderRadius: 10,
                    border: "1px solid #FFCCCC", borderLeft: "3px solid #ef4444",
                    padding: 12, marginBottom: 10,
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <AlertTriangle style={{ width: 16, height: 16, color: "#ef4444", flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>
                          Contains {ingredientRaw}
                        </p>
                        <p style={{ fontSize: "0.75rem", color: TEXT_MUTED, lineHeight: 1.5 }}>{explanation}</p>
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: "0.68rem", color: TEXT_MUTED }}>Source: Open Food Facts Ecoscore analysis</p>
                </div>
              </InfoCard>
            );
          })()}

          {/* ── 8. Certifications ───────────────────────────────────────────── */}
          {product.labels.length > 0 && (
            <InfoCard accentColor={BLUE}>
              <div style={{ padding: 16 }}>
                <SectionLabel label="Certifications & Labels" />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {product.labels.map(label => (
                    <span
                      key={label}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "5px 10px", borderRadius: 20,
                        background: "#EBF2FF", color: BLUE,
                        fontSize: "0.72rem", fontWeight: 600,
                        border: "1px solid #C3D6FF",
                      }}
                    >
                      <BadgeCheck style={{ width: 12, height: 12 }} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </InfoCard>
          )}

          {/* Barcode footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, paddingBottom: 8, flexWrap: "wrap" }}>
            <span style={{
              fontSize: "0.68rem", color: TEXT_MUTED,
              background: CARD, border: `1px solid ${BORDER}`,
              padding: "4px 12px", borderRadius: 20,
              fontVariantNumeric: "tabular-nums",
            }}>
              Barcode: {product.barcode}
            </span>
          </div>

          {/* Scan again CTA */}
          {fromScan && (
            <button
              type="button"
              onClick={() => navigate("/scan")}
              style={{
                width: "100%", height: 50, borderRadius: 14, border: "none",
                background: "#111827", color: "#fff",
                fontWeight: 700, fontSize: "0.9rem",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
                marginBottom: 8,
              }}
            >
              <ScanLine style={{ width: 18, height: 18 }} />
              Scan another product
            </button>
          )}

        </div>
      </main>

      <BottomNav />
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
