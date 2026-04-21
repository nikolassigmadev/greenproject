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

const GRADE_STYLE: Record<string, {
  bg: string; text: string; border: string; indicator: string; solidBg: string;
}> = {
  a: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800", indicator: "bg-emerald-500", solidBg: "bg-emerald-500" },
  b: { bg: "bg-lime-50 dark:bg-lime-950/40",       text: "text-lime-700 dark:text-lime-300",       border: "border-lime-200 dark:border-lime-800",       indicator: "bg-lime-500",    solidBg: "bg-lime-500"    },
  c: { bg: "bg-amber-50 dark:bg-amber-950/40",     text: "text-amber-700 dark:text-amber-300",     border: "border-amber-200 dark:border-amber-800",     indicator: "bg-amber-400",   solidBg: "bg-amber-400"   },
  d: { bg: "bg-orange-50 dark:bg-orange-950/40",   text: "text-orange-700 dark:text-orange-300",   border: "border-orange-200 dark:border-orange-800",   indicator: "bg-orange-500",  solidBg: "bg-orange-500"  },
  e: { bg: "bg-red-50 dark:bg-red-950/40",         text: "text-red-700 dark:text-red-300",         border: "border-red-200 dark:border-red-800",         indicator: "bg-red-500",     solidBg: "bg-red-500"     },
};

const NOVA_STYLE: Record<number, { bg: string; text: string; border: string; indicator: string; label: string }> = {
  1: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800", indicator: "bg-emerald-500", label: "Unprocessed"   },
  2: { bg: "bg-lime-50 dark:bg-lime-950/40",       text: "text-lime-700 dark:text-lime-300",       border: "border-lime-200 dark:border-lime-800",       indicator: "bg-lime-500",    label: "Culinary"      },
  3: { bg: "bg-amber-50 dark:bg-amber-950/40",     text: "text-amber-700 dark:text-amber-300",     border: "border-amber-200 dark:border-amber-800",     indicator: "bg-amber-400",   label: "Processed"     },
  4: { bg: "bg-red-50 dark:bg-red-950/40",         text: "text-red-700 dark:text-red-300",         border: "border-red-200 dark:border-red-800",         indicator: "bg-red-500",     label: "Ultra-proc."   },
};

const VERDICT_CONFIG = {
  BUY: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    topBar: "bg-emerald-500",
    pill: "bg-emerald-500",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
    Icon: CheckCircle2,
    btnBg: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20",
    label: "BUY",
  },
  CONSIDER: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    topBar: "bg-amber-400",
    pill: "bg-amber-500",
    iconBg: "bg-amber-100 dark:bg-amber-900/60",
    Icon: Clock,
    btnBg: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20",
    label: "CONSIDER",
  },
  CAUTION: {
    bg: "bg-orange-50 dark:bg-orange-950/40",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
    topBar: "bg-orange-500",
    pill: "bg-orange-500",
    iconBg: "bg-orange-100 dark:bg-orange-900/60",
    Icon: AlertTriangle,
    btnBg: "bg-orange-600 hover:bg-orange-700 shadow-orange-500/20",
    label: "CAUTION",
  },
  AVOID: {
    bg: "bg-red-50 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
    topBar: "bg-red-500",
    pill: "bg-red-500",
    iconBg: "bg-red-100 dark:bg-red-900/60",
    Icon: XCircle,
    btnBg: "bg-red-600 hover:bg-red-700 shadow-red-500/20",
    label: "AVOID",
  },
  UNKNOWN: {
    bg: "bg-neutral-50 dark:bg-neutral-900",
    text: "text-neutral-600 dark:text-neutral-400",
    border: "border-neutral-200 dark:border-neutral-700",
    topBar: "bg-neutral-400",
    pill: "bg-neutral-500",
    iconBg: "bg-neutral-100 dark:bg-neutral-800",
    Icon: Clock,
    btnBg: "bg-neutral-500 hover:bg-neutral-600 shadow-neutral-500/20",
    label: "UNKNOWN",
  },
};

const CO2_BARS = [
  { key: "co2_agriculture",    label: "Agriculture",  Icon: Wheat,           color: "bg-emerald-500", track: "bg-emerald-100 dark:bg-emerald-900/30" },
  { key: "co2_processing",     label: "Processing",   Icon: Factory,         color: "bg-blue-500",    track: "bg-blue-100 dark:bg-blue-900/30"       },
  { key: "co2_packaging",      label: "Packaging",    Icon: Package,         color: "bg-amber-500",   track: "bg-amber-100 dark:bg-amber-900/30"     },
  { key: "co2_transportation", label: "Transport",    Icon: Truck,           color: "bg-orange-500",  track: "bg-orange-100 dark:bg-orange-900/30"   },
  { key: "co2_distribution",   label: "Distribution", Icon: Store,           color: "bg-violet-500",  track: "bg-violet-100 dark:bg-violet-900/30"   },
  { key: "co2_consumption",    label: "Consumption",  Icon: UtensilsCrossed, color: "bg-rose-500",    track: "bg-rose-100 dark:bg-rose-900/30"       },
] as const;

// ─── Shared components ────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden",
      className
    )}>
      {children}
    </div>
  );
}

function SectionLabel({ Icon, label }: { Icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">{label}</span>
    </div>
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
      BUY: "#059669", CONSIDER: "#D97706", CAUTION: "#EA580C", AVOID: "#DC2626", UNKNOWN: "#6B7280",
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
      <div className="min-h-dvh bg-neutral-50 dark:bg-neutral-950 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Loading product…</p>
            <p className="text-xs text-neutral-400 mt-1">Fetching environmental data</p>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-dvh bg-neutral-50 dark:bg-neutral-950 flex flex-col">
        <div className="flex-1 px-5 pt-14 max-w-xl mx-auto w-full">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 mb-6 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer touch-manipulation"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-5 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-200 mb-1">Product Not Found</p>
              <p className="text-sm text-red-600 dark:text-red-400">{error || "Unable to load product details"}</p>
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
  const ecoStyle = ecoGrade ? (GRADE_STYLE[ecoGrade] ?? GRADE_STYLE.e) : null;

  return (
    <div className="min-h-dvh bg-neutral-50 dark:bg-neutral-950">

      {/* ── Sticky header ─────────────────────────────────────────────────────── */}
      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        stickyVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      )}>
        <div className="max-w-xl mx-auto px-4 py-2.5 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center cursor-pointer touch-manipulation"
          >
            <ChevronLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
          </button>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate flex-1">
            {cleanName ?? product.productName ?? "Unknown Product"}
          </p>
          {ecoStyle && ecoGrade && (
            <span className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0",
              ecoStyle.solidBg
            )}>
              {ecoGrade.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      <main className="pb-28 max-w-xl mx-auto">

        {/* ── 1. Hero ───────────────────────────────────────────────────────── */}
        <div ref={heroRef} className="relative h-72 w-full overflow-hidden bg-emerald-100 dark:bg-emerald-900/30">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.productName || "Product"}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Sprout className="w-20 h-20 text-emerald-300 dark:text-emerald-700" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-900/30 to-transparent" />

          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/85 dark:bg-neutral-900/85 backdrop-blur-sm border border-white/40 shadow-md flex items-center justify-center cursor-pointer touch-manipulation transition-opacity hover:opacity-80 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
          </button>

          {/* Eco-score badge — top right */}
          {ecoGrade && ecoStyle && (
            <div className={cn(
              "absolute top-4 right-4 w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg border-2 border-white/30",
              ecoStyle.solidBg
            )}>
              <span className="text-2xl font-black leading-none">{ecoGrade.toUpperCase()}</span>
              <span className="text-[9px] font-semibold opacity-80 mt-0.5 uppercase tracking-wider">Eco</span>
            </div>
          )}

          {/* Verdict pill */}
          <div className="absolute bottom-[72px] left-4">
            <div className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg",
              vc.pill
            )}>
              <vc.Icon className="w-3.5 h-3.5 text-white" />
              <span className="text-xs font-black text-white tracking-wider">{vc.label}</span>
            </div>
          </div>

          {/* Product info */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
            {product.brand && (
              <p className="text-[11px] font-bold text-emerald-300/90 uppercase tracking-widest mb-1">
                {product.brand}
              </p>
            )}
            <h1 className="text-2xl font-bold text-white leading-tight line-clamp-2">
              {cleanName ?? product.productName ?? "Unknown Product"}
            </h1>
          </div>
        </div>

        <div className="px-4 pt-4 space-y-3">

          {/* ── 2. Verdict card ─────────────────────────────────────────────── */}
          <Card className={cn("border", vc.border)}>
            <div className={cn("h-1.5 w-full", vc.topBar)} />
            <div className={cn("p-5", vc.bg)}>
              <div className="flex items-center gap-4 mb-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                  vc.iconBg
                )}>
                  <vc.Icon className={cn("w-6 h-6", vc.text)} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-0.5">Our Verdict</p>
                  <p className={cn("text-2xl font-black tracking-tight", vc.text)}>{verdict.key}</p>
                </div>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4 pl-3 border-l-2 border-neutral-300 dark:border-neutral-600">
                {verdict.reason}
              </p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => document.getElementById("breakdown")?.scrollIntoView({ behavior: "smooth" })}
                  className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl border-2 border-emerald-600 dark:border-emerald-500 bg-white dark:bg-neutral-900 text-emerald-700 dark:text-emerald-400 text-sm font-semibold cursor-pointer touch-manipulation transition-all hover:bg-emerald-50 dark:hover:bg-emerald-950/30 active:scale-[0.98]"
                >
                  <BarChart2 className="w-4 h-4" />
                  See Breakdown
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
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl text-white text-sm font-semibold cursor-pointer touch-manipulation transition-all active:scale-[0.98] shadow-md",
                    inBasket
                      ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 shadow-none"
                      : cn("bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30")
                  )}
                >
                  <ShoppingBag className="w-4 h-4" />
                  {inBasket ? "In Basket" : "Add to Basket"}
                </button>
              </div>
            </div>
          </Card>

          {/* ── 3. Scan confirmation ─────────────────────────────────────────── */}
          {fromScan && !confirmDismissed && !showCandidates && (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4 flex items-start gap-3">
              <ScanLine className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Is this the right product?</p>
                <p className="text-xs text-neutral-500 mt-0.5 mb-3">We matched your scan automatically.</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDismissed(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-semibold cursor-pointer touch-manipulation"
                  >
                    <Check className="w-3 h-3" /> Yes, correct
                  </button>
                  {candidates.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowCandidates(true)}
                      className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 font-medium cursor-pointer touch-manipulation"
                    >
                      See other matches <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Candidate picker */}
          {fromScan && showCandidates && (
            <Card>
              <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800">
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Other Matches</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Select the correct product</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCandidates(false)}
                  className="text-xs font-semibold text-emerald-600 cursor-pointer touch-manipulation"
                >
                  Cancel
                </button>
              </div>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {candidates.map(c => {
                  const g = c.ecoscoreGrade?.toLowerCase();
                  const gs = g ? GRADE_STYLE[g] : null;
                  return (
                    <button
                      key={c.barcode}
                      type="button"
                      onClick={() => { sessionStorage.removeItem("scan_candidates"); navigate(`/product-off/${c.barcode}`); }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors active:scale-[0.98] cursor-pointer touch-manipulation"
                    >
                      {c.imageUrl ? (
                        <img src={c.imageUrl} alt="" className="w-11 h-11 rounded-xl object-cover flex-shrink-0 border border-neutral-200 dark:border-neutral-700" />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-neutral-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{c.productName || "Unknown Product"}</p>
                        {c.brand && <p className="text-xs text-neutral-500 mt-0.5 truncate">{c.brand}</p>}
                      </div>
                      {g && gs && (
                        <span className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0",
                          gs.solidBg
                        )}>
                          {g.toUpperCase()}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          {/* ── 4. Score tiles ──────────────────────────────────────────────── */}
          {(product.ecoscoreGrade || product.nutriscoreGrade || product.novaGroup) && (
            <div className="grid grid-cols-3 gap-2.5" id="breakdown">
              {product.ecoscoreGrade && (() => {
                const g = product.ecoscoreGrade.toLowerCase();
                const s = GRADE_STYLE[g] ?? GRADE_STYLE.e;
                return (
                  <div className={cn(
                    "rounded-2xl flex flex-col items-center gap-1 border relative overflow-hidden shadow-sm pt-1 pb-4 px-2",
                    s.bg, s.border
                  )}>
                    <div className={cn("w-full h-1 mb-2", s.indicator)} />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Eco</span>
                    <span className={cn("text-4xl font-black leading-none", s.text)}>{g.toUpperCase()}</span>
                    {product.ecoscoreScore !== null && (
                      <span className="text-[10px] text-neutral-400 tabular-nums">{product.ecoscoreScore}/100</span>
                    )}
                  </div>
                );
              })()}
              {product.nutriscoreGrade && (() => {
                const g = product.nutriscoreGrade.toLowerCase();
                const s = GRADE_STYLE[g] ?? GRADE_STYLE.e;
                return (
                  <div className={cn(
                    "rounded-2xl flex flex-col items-center gap-1 border relative overflow-hidden shadow-sm pt-1 pb-4 px-2",
                    s.bg, s.border
                  )}>
                    <div className={cn("w-full h-1 mb-2", s.indicator)} />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Nutri</span>
                    <span className={cn("text-4xl font-black leading-none", s.text)}>{g.toUpperCase()}</span>
                    <span className="text-[10px] text-neutral-400">Nutrition</span>
                  </div>
                );
              })()}
              {product.novaGroup !== null && NOVA_STYLE[product.novaGroup] && (() => {
                const s = NOVA_STYLE[product.novaGroup!];
                return (
                  <div className={cn(
                    "rounded-2xl flex flex-col items-center gap-1 border relative overflow-hidden shadow-sm pt-1 pb-4 px-2",
                    s.bg, s.border
                  )}>
                    <div className={cn("w-full h-1 mb-2", s.indicator)} />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">NOVA</span>
                    <span className={cn("text-4xl font-black leading-none", s.text)}>{product.novaGroup}</span>
                    <span className="text-[10px] text-neutral-400 text-center leading-tight">{s.label}</span>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── 5. CO₂ Footprint ────────────────────────────────────────────── */}
          {agri?.co2_total !== undefined && (
            <Card>
              <div className="p-5">
                <SectionLabel Icon={Leaf} label="CO₂ Footprint" />

                {/* Big stat */}
                <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700 p-4 mb-5">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-5xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums leading-none">
                      {agri.co2_total.toFixed(2)}
                    </span>
                    <span className="text-sm text-neutral-500 font-medium">kg CO₂/kg</span>
                  </div>
                  {drivingKm !== null && (
                    <p className="text-xs text-neutral-400">
                      Like driving{" "}
                      <span className="font-semibold text-neutral-600 dark:text-neutral-300">{drivingKm} km</span>
                      {" "}in an average car
                    </p>
                  )}
                </div>

                {/* Lifecycle bars */}
                {co2Values.length > 0 && (
                  <div className="space-y-3">
                    {CO2_BARS.map(({ key, label, Icon, color, track }) => {
                      const val = agri[key as keyof typeof agri] as number | undefined;
                      if (typeof val !== "number" || val <= 0) return null;
                      const pct = (val / maxCo2) * 100;
                      return (
                        <div key={key} className="flex items-center gap-2.5">
                          <Icon className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                          <span className="text-xs text-neutral-600 dark:text-neutral-400 w-24 flex-shrink-0">{label}</span>
                          <div className={cn("flex-1 h-2.5 rounded-full overflow-hidden", track)}>
                            <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-semibold tabular-nums text-neutral-600 dark:text-neutral-400 w-14 text-right flex-shrink-0">
                            {val.toFixed(2)} kg
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ── 6. Ethics ───────────────────────────────────────────────────── */}
          {(laborRecord || boycottMatch || welfare.isFlagged) ? (
            <Card>
              <div className="p-5">
                <SectionLabel Icon={Scale} label="Ethics" />

                {/* Labor: clean */}
                {!laborRecord && (
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">No Labor Concerns</p>
                      <p className="text-xs text-neutral-500 mt-0.5">No allegations found in our database.</p>
                    </div>
                  </div>
                )}

                {/* Labor: concerns */}
                {laborRecord && (
                  <div className="space-y-2.5 mb-4">
                    <p className="text-xs text-neutral-500">
                      Parent: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{laborRecord.parentCompany}</span>
                    </p>
                    {laborRecord.allegations.map((al, i) => (
                      <div key={i} className="rounded-xl bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 overflow-hidden">
                        <div className="p-3.5">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-red-800 dark:text-red-200">{al.issue}</p>
                              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{al.details}</p>
                              <div className="flex items-center justify-between mt-2">
                                <a
                                  href={al.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 dark:text-red-400 hover:opacity-80 cursor-pointer"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" />{al.source}
                                </a>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">{al.year}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <p className="text-[10px] text-neutral-400 italic leading-relaxed">
                      Based on publicly available reports. Companies may have taken corrective steps.
                    </p>
                  </div>
                )}

                {/* Animal welfare */}
                <div className={cn("pt-3", (laborRecord || boycottMatch) && "border-t border-neutral-100 dark:border-neutral-800")}>
                  <AnimalWelfareFlagBadge brand={product.brand} showDetails={true} />
                </div>

                {/* Boycott */}
                {boycottMatch && (
                  <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                      <Megaphone className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-orange-800 dark:text-orange-200">{boycottMatch.parent} — Boycott Listed</p>
                        <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{boycottMatch.reason}</p>
                        <a
                          href="https://boycott-israel.org/boycott.html"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 hover:opacity-80 mt-1.5 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" /> BDS Boycott List
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">No Ethical Concerns Found</p>
                <p className="text-xs text-neutral-500 mt-0.5">No labor, boycott, or animal welfare flags for this brand.</p>
              </div>
            </div>
          )}

          {/* ── 7. Environmental adjustments ────────────────────────────────── */}
          <EnvironmentalImpactCard result={product} />

          {/* ── 8. Certifications ───────────────────────────────────────────── */}
          {product.labels.length > 0 && (
            <Card>
              <div className="p-5">
                <SectionLabel Icon={BadgeCheck} label="Certifications & Labels" />
                <div className="flex flex-wrap gap-2">
                  {product.labels.map(label => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 capitalize"
                    >
                      <Check className="w-3 h-3" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Barcode footer */}
          <div className="flex items-center justify-center pb-2">
            <span className="font-mono text-[10px] text-neutral-400 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              {product.barcode}
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
