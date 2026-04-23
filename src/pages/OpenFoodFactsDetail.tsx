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

const GRADE_BORDER: Record<string, string> = {
  a: "#10b981",
  b: "#84cc16",
  c: "#f59e0b",
  d: "#f97316",
  e: "#00c853",
};

const GRADE_TEXT: Record<string, string> = {
  a: "#10b981",
  b: "#84cc16",
  c: "#f59e0b",
  d: "#f97316",
  e: "#00c853",
};

const NOVA_LABEL: Record<number, string> = {
  1: "UNPROCESSED",
  2: "CULINARY",
  3: "PROCESSED",
  4: "ULTRA-PROC.",
};

const NOVA_COLOR: Record<number, string> = {
  1: "#10b981",
  2: "#84cc16",
  3: "#f59e0b",
  4: "#00c853",
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
    borderColor: "#ff3b30",
    textColor: "#ff3b30",
    Icon: XCircle,
    label: "AVOID",
  },
  UNKNOWN: {
    borderColor: "#84898E",
    textColor: "#84898E",
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
  { key: "co2_consumption",    label: "Consumption",  Icon: UtensilsCrossed, color: "#00c853" },
] as const;

// ─── Shared components ────────────────────────────────────────────────────────

function TerminalCard({ children, className, accentColor }: {
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
}) {
  return (
    <div
      className={cn("overflow-hidden", className)}
      style={{
        background: "#000000",
        border: "1px solid rgba(255,255,255,0.08)",
        borderLeft: accentColor ? `3px solid ${accentColor}` : "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p
      className="font-mono uppercase mb-4"
      style={{ fontSize: "0.58rem", color: "#84898E", letterSpacing: "0.2em" }}
    >
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
      BUY: "#00c853", CONSIDER: "#ffc700", CAUTION: "#ffc700", AVOID: "#ff4136", UNKNOWN: "#84898E",
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
      <div className="min-h-dvh bg-black flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div
            className="flex items-center justify-center"
            style={{
              width: "3.5rem",
              height: "3.5rem",
              border: "1px solid rgba(240, 0, 7, 0.3)",
              borderLeft: "2px solid #00c853",
            }}
          >
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#00c853" }} />
          </div>
          <div className="text-center">
            <p
              className="font-mono uppercase"
              style={{ fontSize: "0.65rem", color: "#ffffff", letterSpacing: "0.15em" }}
            >
              LOADING PRODUCT
            </p>
            <p
              className="font-mono mt-1 uppercase"
              style={{ fontSize: "0.55rem", color: "#84898E", letterSpacing: "0.1em" }}
            >
              FETCHING ENVIRONMENTAL DATA
              <span className="terminal-cursor" style={{ color: "#00c853" }}>_</span>
            </p>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-dvh bg-black flex flex-col">
        <div className="flex-1 px-5 pt-14 max-w-xl mx-auto w-full">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 font-mono uppercase cursor-pointer touch-manipulation transition-opacity hover:opacity-70 mb-6"
            style={{ fontSize: "0.6rem", color: "#84898E", letterSpacing: "0.12em", background: "none", border: "none" }}
          >
            <ChevronLeft className="w-3.5 h-3.5" /> BACK
          </button>
          <div
            className="flex items-start gap-3 p-4"
            style={{
              border: "1px solid rgba(240, 0, 7, 0.3)",
              borderLeft: "3px solid #00c853",
            }}
          >
            <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#00c853" }} />
            <div>
              <p
                className="font-mono font-bold uppercase mb-1"
                style={{ fontSize: "0.7rem", color: "#00c853", letterSpacing: "0.08em" }}
              >
                [!] PRODUCT NOT FOUND
              </p>
              <p
                className="font-mono"
                style={{ fontSize: "0.6rem", color: "#84898E" }}
              >
                {error || "Unable to load product details"}
              </p>
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
    <div className="min-h-dvh bg-black">

      {/* ── Sticky header ─────────────────────────────────────────────────────── */}
      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
        stickyVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      )}>
        <div
          className="max-w-xl mx-auto px-4 py-2.5 flex items-center gap-3"
          style={{
            background: "#000000",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center cursor-pointer touch-manipulation"
            style={{
              width: "2rem",
              height: "2rem",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "none",
              color: "#84898E",
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <p
            className="font-mono font-bold uppercase truncate flex-1"
            style={{ fontSize: "0.65rem", color: "#ffffff", letterSpacing: "0.06em" }}
          >
            {cleanName ?? product.productName ?? "UNKNOWN PRODUCT"}
          </p>
          {ecoGrade && (
            <span
              className="font-mono font-black flex items-center justify-center flex-shrink-0"
              style={{
                width: "2rem",
                height: "2rem",
                border: `1px solid ${GRADE_BORDER[ecoGrade] ?? "#84898E"}`,
                color: GRADE_TEXT[ecoGrade] ?? "#84898E",
                fontSize: "0.85rem",
              }}
            >
              {ecoGrade.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      <main className="pb-28 max-w-xl mx-auto">

        {/* ── 1. Hero ───────────────────────────────────────────────────────── */}
        <div
          ref={heroRef}
          className="relative w-full overflow-hidden"
          style={{ height: "17rem", background: "#0a0a0a" }}
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.productName || "Product"}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Sprout className="w-16 h-16" style={{ color: "rgba(132,137,142,0.2)" }} />
            </div>
          )}

          {/* Heavy scanlines overlay on hero */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.3) 3px, rgba(0,0,0,0.3) 4px)",
              zIndex: 1,
            }}
          />

          {/* Red gradient at bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{
              height: "60%",
              background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
              zIndex: 2,
            }}
          />

          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 flex items-center justify-center cursor-pointer touch-manipulation transition-opacity hover:opacity-70 active:scale-95"
            style={{
              zIndex: 3,
              width: "2.25rem",
              height: "2.25rem",
              background: "rgba(0,0,0,0.7)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>

          {/* Eco-score badge — terminal style, top right */}
          {ecoGrade && (
            <div
              className="absolute top-4 right-4 flex flex-col items-center justify-center"
              style={{
                zIndex: 3,
                width: "3.25rem",
                height: "3.25rem",
                border: `2px solid ${GRADE_BORDER[ecoGrade] ?? "#84898E"}`,
                background: "rgba(0,0,0,0.85)",
              }}
            >
              <span
                className="font-mono font-black leading-none"
                style={{ fontSize: "1.6rem", color: GRADE_TEXT[ecoGrade] ?? "#84898E" }}
              >
                {ecoGrade.toUpperCase()}
              </span>
              <span
                className="font-mono uppercase mt-0.5"
                style={{ fontSize: "0.42rem", color: "#84898E", letterSpacing: "0.1em" }}
              >
                ECO
              </span>
            </div>
          )}

          {/* Product info */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4" style={{ zIndex: 3 }}>
            {product.brand && (
              <p
                className="font-mono uppercase mb-1"
                style={{ fontSize: "0.55rem", color: "#84898E", letterSpacing: "0.2em" }}
              >
                {product.brand}
              </p>
            )}
            <h1
              className="font-mono font-black uppercase leading-tight line-clamp-2"
              style={{ fontSize: "clamp(1.1rem, 5vw, 1.5rem)", color: "#ffffff", letterSpacing: "-0.02em" }}
            >
              {cleanName ?? product.productName ?? "UNKNOWN PRODUCT"}
            </h1>
          </div>
        </div>

        <div className="px-4 pt-4 space-y-3">

          {/* ── 2. Verdict card ─────────────────────────────────────────────── */}
          <TerminalCard accentColor={vc.borderColor}>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: "2.75rem",
                    height: "2.75rem",
                    border: `1px solid ${vc.borderColor}`,
                  }}
                >
                  <vc.Icon className="w-5 h-5" style={{ color: vc.textColor }} />
                </div>
                <div>
                  <p
                    className="font-mono uppercase"
                    style={{ fontSize: "0.5rem", color: "#84898E", letterSpacing: "0.18em" }}
                  >
                    // OUR VERDICT
                  </p>
                  <p
                    className="font-mono font-black uppercase leading-tight"
                    style={{ fontSize: "1.5rem", color: vc.textColor, letterSpacing: "-0.02em" }}
                  >
                    {verdict.key}
                  </p>
                </div>
              </div>
              <p
                className="font-mono leading-relaxed mb-4 pl-3"
                style={{
                  fontSize: "0.6rem",
                  color: "#84898E",
                  borderLeft: `2px solid ${vc.borderColor}`,
                }}
              >
                {verdict.reason}
              </p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => document.getElementById("breakdown")?.scrollIntoView({ behavior: "smooth" })}
                  className="flex-1 flex items-center justify-center gap-1.5 font-mono uppercase cursor-pointer touch-manipulation transition-opacity hover:opacity-80 active:opacity-60"
                  style={{
                    height: "2.75rem",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "transparent",
                    color: "#84898E",
                    fontSize: "0.58rem",
                    letterSpacing: "0.1em",
                  }}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  SEE BREAKDOWN
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
                  className="flex-1 flex items-center justify-center gap-1.5 font-mono uppercase cursor-pointer touch-manipulation transition-opacity active:opacity-60"
                  style={{
                    height: "2.75rem",
                    background: inBasket ? "transparent" : "#00c853",
                    border: inBasket ? `1px solid ${vc.borderColor}` : "none",
                    color: inBasket ? vc.textColor : "#ffffff",
                    fontSize: "0.58rem",
                    letterSpacing: "0.1em",
                    opacity: inBasket ? 0.7 : 1,
                  }}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {inBasket ? "IN BASKET" : "ADD TO BASKET"}
                </button>
              </div>
            </div>
          </TerminalCard>

          {/* ── 3. Scan confirmation ─────────────────────────────────────────── */}
          {fromScan && !confirmDismissed && !showCandidates && (
            <div
              className="flex items-start gap-3 p-4"
              style={{
                border: "1px solid rgba(64, 170, 255, 0.2)",
                borderLeft: "3px solid #40aaff",
              }}
            >
              <ScanLine className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#40aaff" }} />
              <div className="flex-1 min-w-0">
                <p
                  className="font-mono font-bold uppercase"
                  style={{ fontSize: "0.65rem", color: "#ffffff", letterSpacing: "0.08em" }}
                >
                  IS THIS THE RIGHT PRODUCT?
                </p>
                <p
                  className="font-mono mt-0.5 mb-3"
                  style={{ fontSize: "0.58rem", color: "#84898E" }}
                >
                  We matched your scan automatically.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDismissed(true)}
                    className="font-mono uppercase flex items-center gap-1.5 cursor-pointer touch-manipulation transition-opacity hover:opacity-80"
                    style={{
                      fontSize: "0.55rem",
                      color: "#000000",
                      background: "#40aaff",
                      border: "none",
                      padding: "5px 10px",
                      letterSpacing: "0.08em",
                    }}
                  >
                    <Check className="w-3 h-3" /> YES, CORRECT
                  </button>
                  {candidates.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowCandidates(true)}
                      className="font-mono uppercase flex items-center gap-1 cursor-pointer touch-manipulation transition-opacity hover:opacity-80"
                      style={{
                        fontSize: "0.55rem",
                        color: "#84898E",
                        background: "none",
                        border: "none",
                        letterSpacing: "0.08em",
                      }}
                    >
                      SEE OTHER MATCHES <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Candidate picker */}
          {fromScan && showCandidates && (
            <TerminalCard>
              <div
                className="px-4 pt-3 pb-3 flex items-center justify-between"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div>
                  <p
                    className="font-mono font-bold uppercase"
                    style={{ fontSize: "0.65rem", color: "#ffffff", letterSpacing: "0.08em" }}
                  >
                    OTHER MATCHES
                  </p>
                  <p
                    className="font-mono mt-0.5 uppercase"
                    style={{ fontSize: "0.55rem", color: "#84898E", letterSpacing: "0.06em" }}
                  >
                    Select the correct product
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCandidates(false)}
                  className="font-mono uppercase cursor-pointer touch-manipulation transition-opacity hover:opacity-80"
                  style={{ fontSize: "0.58rem", color: "#40aaff", background: "none", border: "none", letterSpacing: "0.08em" }}
                >
                  CANCEL
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
                      className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer touch-manipulation terminal-row active:opacity-70"
                      style={{
                        borderBottom: ci < candidates.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                        background: "none",
                        border: "none",
                      }}
                    >
                      {c.imageUrl ? (
                        <img
                          src={c.imageUrl}
                          alt=""
                          className="object-cover flex-shrink-0"
                          style={{ width: "2.5rem", height: "2.5rem", border: "1px solid rgba(255,255,255,0.1)" }}
                        />
                      ) : (
                        <div
                          className="flex items-center justify-center flex-shrink-0"
                          style={{ width: "2.5rem", height: "2.5rem", border: "1px solid rgba(255,255,255,0.08)", background: "#0a0a0a" }}
                        >
                          <Package className="w-4 h-4" style={{ color: "#84898E" }} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-mono font-bold uppercase truncate"
                          style={{ fontSize: "0.65rem", color: "#ffffff", letterSpacing: "0.04em" }}
                        >
                          {c.productName || "UNKNOWN PRODUCT"}
                        </p>
                        {c.brand && (
                          <p
                            className="font-mono mt-0.5 uppercase truncate"
                            style={{ fontSize: "0.55rem", color: "#84898E", letterSpacing: "0.06em" }}
                          >
                            {c.brand}
                          </p>
                        )}
                      </div>
                      {g && (
                        <span
                          className="font-mono font-black flex items-center justify-center flex-shrink-0"
                          style={{
                            width: "2rem",
                            height: "2rem",
                            border: `1px solid ${GRADE_BORDER[g] ?? "#84898E"}`,
                            color: GRADE_TEXT[g] ?? "#84898E",
                            fontSize: "0.85rem",
                          }}
                        >
                          {g.toUpperCase()}
                        </span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#84898E" }} />
                    </button>
                  );
                })}
              </div>
            </TerminalCard>
          )}

          {/* ── 4. Score tiles ──────────────────────────────────────────────── */}
          {(product.ecoscoreGrade || product.nutriscoreGrade || product.novaGroup) && (
            <div className="grid grid-cols-3 gap-2" id="breakdown">
              {product.ecoscoreGrade && (() => {
                const g = product.ecoscoreGrade.toLowerCase();
                const color = GRADE_TEXT[g] ?? "#84898E";
                return (
                  <div
                    className="flex flex-col items-center py-4 px-2"
                    style={{
                      border: `1px solid ${GRADE_BORDER[g] ?? "#84898E"}`,
                      borderTop: `3px solid ${GRADE_BORDER[g] ?? "#84898E"}`,
                      background: "#000000",
                    }}
                  >
                    <span
                      className="font-mono uppercase mb-1"
                      style={{ fontSize: "0.48rem", color: "#84898E", letterSpacing: "0.14em" }}
                    >
                      ECO
                    </span>
                    <span
                      className="font-mono font-black leading-none"
                      style={{ fontSize: "2.5rem", color }}
                    >
                      {g.toUpperCase()}
                    </span>
                    {product.ecoscoreScore !== null && (
                      <span
                        className="font-mono tabular-nums mt-1"
                        style={{ fontSize: "0.52rem", color: "#84898E" }}
                      >
                        {product.ecoscoreScore}/100
                      </span>
                    )}
                  </div>
                );
              })()}
              {product.nutriscoreGrade && (() => {
                const g = product.nutriscoreGrade.toLowerCase();
                const isLetter = ["a", "b", "c", "d", "e"].includes(g);
                const color = GRADE_TEXT[g] ?? "#84898E";
                return (
                  <div
                    className="flex flex-col items-center py-4 px-2 overflow-hidden"
                    style={{
                      border: `1px solid ${GRADE_BORDER[g] ?? "#84898E"}`,
                      borderTop: `3px solid ${GRADE_BORDER[g] ?? "#84898E"}`,
                      background: "#000000",
                    }}
                  >
                    <span
                      className="font-mono uppercase mb-1"
                      style={{ fontSize: "0.48rem", color: "#84898E", letterSpacing: "0.14em" }}
                    >
                      NUTRI
                    </span>
                    <span
                      className="font-mono font-black leading-none"
                      style={{ fontSize: isLetter ? "2.5rem" : "1.1rem", color }}
                    >
                      {isLetter ? g.toUpperCase() : "—"}
                    </span>
                    <span
                      className="font-mono uppercase mt-1 text-center leading-tight"
                      style={{ fontSize: "0.48rem", color: "#84898E", letterSpacing: "0.06em" }}
                    >
                      NUTRITION
                    </span>
                  </div>
                );
              })()}
              {product.novaGroup !== null && NOVA_LABEL[product.novaGroup!] && (() => {
                const color = NOVA_COLOR[product.novaGroup!] ?? "#84898E";
                return (
                  <div
                    className="flex flex-col items-center py-4 px-2"
                    style={{
                      border: `1px solid ${color}`,
                      borderTop: `3px solid ${color}`,
                      background: "#000000",
                    }}
                  >
                    <span
                      className="font-mono uppercase mb-1"
                      style={{ fontSize: "0.48rem", color: "#84898E", letterSpacing: "0.14em" }}
                    >
                      NOVA
                    </span>
                    <span
                      className="font-mono font-black leading-none"
                      style={{ fontSize: "2.5rem", color }}
                    >
                      {product.novaGroup}
                    </span>
                    <span
                      className="font-mono uppercase mt-1 text-center leading-tight"
                      style={{ fontSize: "0.42rem", color: "#84898E", letterSpacing: "0.06em" }}
                    >
                      {NOVA_LABEL[product.novaGroup!]}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── 5. CO₂ Footprint ────────────────────────────────────────────── */}
          {agri?.co2_total !== undefined && (
            <TerminalCard accentColor="#10b981">
              <div className="p-4">
                <SectionLabel label="// CO2 FOOTPRINT" />

                {/* Terminal readout block */}
                <div
                  className="p-3 mb-4"
                  style={{
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "#050505",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  <div className="flex items-baseline gap-2 mb-1">
                    <span
                      className="font-mono font-black tabular-nums leading-none"
                      style={{ fontSize: "3rem", color: "#ffffff" }}
                    >
                      {agri.co2_total.toFixed(2)}
                    </span>
                    <span
                      className="font-mono uppercase"
                      style={{ fontSize: "0.6rem", color: "#84898E", letterSpacing: "0.1em" }}
                    >
                      KG CO₂/KG
                    </span>
                  </div>
                  {drivingKm !== null && (
                    <p
                      className="font-mono"
                      style={{ fontSize: "0.58rem", color: "#84898E" }}
                    >
                      &gt; EQUIV: DRIVING{" "}
                      <span style={{ color: "#40aaff" }}>{drivingKm} KM</span>
                      {" "}IN AVERAGE CAR
                    </p>
                  )}
                </div>

                {/* Lifecycle breakdown — ASCII-style bars */}
                {co2Values.length > 0 && (
                  <div className="space-y-2.5">
                    {CO2_BARS.map(({ key, label, Icon, color }) => {
                      const val = agri[key as keyof typeof agri] as number | undefined;
                      if (typeof val !== "number" || val <= 0) return null;
                      const pct = Math.round((val / maxCo2) * 100);
                      // Build ASCII-style bar: filled blocks
                      const totalBlocks = 20;
                      const filledBlocks = Math.round((pct / 100) * totalBlocks);
                      const bar = "█".repeat(filledBlocks) + "░".repeat(totalBlocks - filledBlocks);
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <span
                            className="font-mono uppercase flex-shrink-0"
                            style={{ fontSize: "0.52rem", color: "#84898E", width: "5.5rem", letterSpacing: "0.04em" }}
                          >
                            {label.toUpperCase()}
                          </span>
                          <span
                            className="font-mono flex-1 overflow-hidden"
                            style={{ fontSize: "0.52rem", color, letterSpacing: "-0.02em" }}
                          >
                            {bar}
                          </span>
                          <span
                            className="font-mono tabular-nums flex-shrink-0 text-right"
                            style={{ fontSize: "0.52rem", color: "#84898E", width: "3.5rem" }}
                          >
                            {val.toFixed(2)} kg
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TerminalCard>
          )}

          {/* ── 6. Ethics ───────────────────────────────────────────────────── */}
          {(laborRecord || boycottMatch || welfare.isFlagged) ? (
            <TerminalCard accentColor={laborRecord ? "#ef4444" : boycottMatch ? "#f97316" : "#00c853"}>
              <div className="p-4">
                <SectionLabel label="// ETHICS ANALYSIS" />

                {/* Labor: clean */}
                {!laborRecord && (
                  <div
                    className="flex items-center gap-3 p-3 mb-3"
                    style={{
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      borderLeft: "2px solid #10b981",
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#10b981" }} />
                    <div>
                      <p
                        className="font-mono font-bold uppercase"
                        style={{ fontSize: "0.65rem", color: "#10b981", letterSpacing: "0.08em" }}
                      >
                        NO LABOR CONCERNS
                      </p>
                      <p
                        className="font-mono mt-0.5"
                        style={{ fontSize: "0.58rem", color: "#84898E" }}
                      >
                        No allegations found in our database.
                      </p>
                    </div>
                  </div>
                )}

                {/* Labor: concerns */}
                {laborRecord && (
                  <div className="space-y-2.5 mb-4">
                    <p
                      className="font-mono"
                      style={{ fontSize: "0.58rem", color: "#84898E" }}
                    >
                      PARENT:{" "}
                      <span style={{ color: "#ffffff" }}>{laborRecord.parentCompany}</span>
                    </p>
                    {laborRecord.allegations.map((al, i) => (
                      <div
                        key={i}
                        style={{
                          border: "1px solid rgba(239, 68, 68, 0.25)",
                          borderLeft: "3px solid #ef4444",
                          background: "#050505",
                        }}
                      >
                        <div className="p-3">
                          <div className="flex items-start gap-2">
                            <span
                              className="font-mono font-black flex-shrink-0"
                              style={{ fontSize: "0.65rem", color: "#ef4444" }}
                            >
                              [!]
                            </span>
                            <div className="flex-1 min-w-0">
                              <p
                                className="font-mono font-bold uppercase"
                                style={{ fontSize: "0.62rem", color: "#ffffff", letterSpacing: "0.04em" }}
                              >
                                {al.issue}
                              </p>
                              <p
                                className="font-mono mt-1 leading-relaxed"
                                style={{ fontSize: "0.58rem", color: "#84898E" }}
                              >
                                {al.details}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <a
                                  href={al.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono flex items-center gap-1 cursor-pointer transition-opacity hover:opacity-70"
                                  style={{ fontSize: "0.55rem", color: "#ef4444", textDecoration: "none", letterSpacing: "0.06em" }}
                                >
                                  <ExternalLink className="w-2.5 h-2.5" />{al.source}
                                </a>
                                <span
                                  className="font-mono font-bold px-2 py-0.5"
                                  style={{
                                    fontSize: "0.52rem",
                                    color: "#ef4444",
                                    border: "1px solid rgba(239, 68, 68, 0.3)",
                                  }}
                                >
                                  {al.year}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <p
                      className="font-mono leading-relaxed"
                      style={{ fontSize: "0.52rem", color: "#84898E", fontStyle: "italic" }}
                    >
                      Based on publicly available reports. Companies may have taken corrective steps.
                    </p>
                  </div>
                )}

                {/* Animal welfare */}
                <div
                  className={cn("pt-3", (laborRecord || boycottMatch) && "mt-3")}
                  style={{ borderTop: (laborRecord || boycottMatch) ? "1px solid rgba(255,255,255,0.06)" : "none" }}
                >
                  <AnimalWelfareFlagBadge brand={product.brand} showDetails={true} />
                </div>

                {/* Boycott */}
                {boycottMatch && (
                  <div
                    className="mt-3 pt-3"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div
                      className="flex items-start gap-2.5 p-3"
                      style={{
                        border: "1px solid rgba(249, 115, 22, 0.25)",
                        borderLeft: "3px solid #f97316",
                        background: "#050505",
                      }}
                    >
                      <span
                        className="font-mono font-black flex-shrink-0"
                        style={{ fontSize: "0.65rem", color: "#f97316" }}
                      >
                        [!]
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-mono font-bold uppercase"
                          style={{ fontSize: "0.65rem", color: "#ffffff", letterSpacing: "0.04em" }}
                        >
                          {boycottMatch.parent} — BOYCOTT LISTED
                        </p>
                        <p
                          className="font-mono mt-0.5 leading-relaxed"
                          style={{ fontSize: "0.58rem", color: "#84898E" }}
                        >
                          {boycottMatch.reason}
                        </p>
                        <a
                          href="https://boycott-israel.org/boycott.html"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono flex items-center gap-1 mt-1.5 cursor-pointer transition-opacity hover:opacity-70"
                          style={{ fontSize: "0.55rem", color: "#f97316", textDecoration: "none" }}
                        >
                          <ExternalLink className="w-2.5 h-2.5" /> BDS BOYCOTT LIST
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TerminalCard>
          ) : (
            <div
              className="flex items-center gap-3 p-4"
              style={{
                border: "1px solid rgba(16, 185, 129, 0.2)",
                borderLeft: "3px solid #10b981",
              }}
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#10b981" }} />
              <div>
                <p
                  className="font-mono font-bold uppercase"
                  style={{ fontSize: "0.65rem", color: "#10b981", letterSpacing: "0.08em" }}
                >
                  NO ETHICAL CONCERNS FOUND
                </p>
                <p
                  className="font-mono mt-0.5"
                  style={{ fontSize: "0.58rem", color: "#84898E" }}
                >
                  No labor, boycott, or animal welfare flags for this brand.
                </p>
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
              <TerminalCard accentColor="#ef4444">
                <div className="p-4">
                  <SectionLabel label="// THREATENED SPECIES RISK" />
                  <div
                    className="p-3 mb-3"
                    style={{
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      borderLeft: "3px solid #ef4444",
                      background: "#050505",
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="font-mono font-black flex-shrink-0"
                        style={{ fontSize: "0.65rem", color: "#ef4444" }}
                      >
                        [!]
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-mono font-bold uppercase"
                          style={{ fontSize: "0.62rem", color: "#ffffff", letterSpacing: "0.04em" }}
                        >
                          CONTAINS {ingredientRaw.toUpperCase()}
                        </p>
                        <p
                          className="font-mono mt-1 leading-relaxed"
                          style={{ fontSize: "0.58rem", color: "#84898E" }}
                        >
                          {explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p
                    className="font-mono"
                    style={{ fontSize: "0.52rem", color: "#84898E" }}
                  >
                    &gt; SOURCE: OPEN FOOD FACTS ECOSCORE ANALYSIS
                  </p>
                </div>
              </TerminalCard>
            );
          })()}

          {/* ── 8. Certifications ───────────────────────────────────────────── */}
          {product.labels.length > 0 && (
            <TerminalCard accentColor="#40aaff">
              <div className="p-4">
                <SectionLabel label="// CERTIFICATIONS & LABELS" />
                <div className="flex flex-wrap gap-2">
                  {product.labels.map(label => (
                    <span
                      key={label}
                      className="font-mono uppercase flex items-center gap-1.5"
                      style={{
                        fontSize: "0.55rem",
                        color: "#40aaff",
                        border: "1px solid rgba(64, 170, 255, 0.25)",
                        padding: "4px 8px",
                        letterSpacing: "0.08em",
                      }}
                    >
                      <Check className="w-2.5 h-2.5" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </TerminalCard>
          )}

          {/* Barcode footer */}
          <div className="flex items-center justify-center pb-2">
            <span
              className="font-mono px-3 py-1.5"
              style={{
                fontSize: "0.55rem",
                color: "#84898E",
                border: "1px solid rgba(255,255,255,0.08)",
                letterSpacing: "0.1em",
              }}
            >
              BARCODE: {product.barcode}
            </span>
          </div>

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
