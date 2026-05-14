import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import {
  ChevronLeft, Loader2, Leaf, AlertTriangle, ExternalLink,
  CheckCircle2, ChevronRight, Package, ShoppingBag, XCircle, Clock,
  BadgeCheck, Wheat, Factory, Truck, Store, UtensilsCrossed,
  ScanLine, Check, Sprout, PawPrint,
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
import { findVerifiedEthics } from "@/utils/verifiedEthics";
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

const EDITORIAL = {
  ink: "#1A1614",
  ink2: "#5C544B",
  ink3: "#8C8278",
  paper: "#F7F6F3",
  page: "#F7F6F3",
  card: "#FBF7EC",
  line: "#E4DCC9",
  green: "#1F6B4E",
  greenSoft: "#D8E5DA",
  red: "#B23A2B",
  redSoft: "#F0DAD3",
  amber: "#C0822A",
  amberSoft: "#F0E1C2",
  blue: "#2E5A7A",
  purple: "#6A4A6E",
} as const;

const GRADE_COLOR: Record<string, string> = {
  a: "#1F6B4E", b: "#1F6B4E", c: "#C0822A", d: "#C26544", e: "#B23A2B",
};

const GRADE_BG: Record<string, string> = {
  a: "#D8E5DA", b: "#D8E5DA", c: "#F0E1C2", d: "#FBE9E2", e: "#F0DAD3",
};

const NOVA_LABEL: Record<number, string> = {
  1: "Unprocessed", 2: "Culinary", 3: "Processed", 4: "Ultra-processed",
};

const NOVA_COLOR: Record<number, string> = {
  1: "#1F6B4E", 2: "#1F6B4E", 3: "#C0822A", 4: "#B23A2B",
};

const VERDICT_CONFIG = {
  BUY:      { color: EDITORIAL.green, bg: EDITORIAL.greenSoft, Icon: CheckCircle2, label: "Buy" },
  CONSIDER: { color: EDITORIAL.amber, bg: EDITORIAL.amberSoft, Icon: Clock,        label: "Consider" },
  CAUTION:  { color: "#C26544",       bg: "#FBE9E2",           Icon: AlertTriangle, label: "Caution" },
  AVOID:    { color: EDITORIAL.red,   bg: EDITORIAL.redSoft,   Icon: XCircle,       label: "Avoid" },
  UNKNOWN:  { color: EDITORIAL.ink3,  bg: "#EDE6D2",           Icon: Clock,        label: "Unknown" },
};

const CO2_BARS = [
  { key: "co2_agriculture",    label: "Agriculture",  Icon: Wheat,           color: EDITORIAL.green },
  { key: "co2_processing",     label: "Processing",   Icon: Factory,         color: EDITORIAL.blue },
  { key: "co2_packaging",      label: "Packaging",    Icon: Package,         color: EDITORIAL.amber },
  { key: "co2_transportation", label: "Transport",    Icon: Truck,           color: "#C26544" },
  { key: "co2_distribution",   label: "Distribution", Icon: Store,           color: EDITORIAL.purple },
  { key: "co2_consumption",    label: "Consumption",  Icon: UtensilsCrossed, color: "#9B4E63" },
] as const;

const GRADE_PERCENT: Record<string, number> = { a: 1, b: 0.8, c: 0.6, d: 0.4, e: 0.2 };
const NOVA_PERCENT: Record<number, number> = { 1: 1, 2: 0.75, 3: 0.5, 4: 0.25 };

// ─── Sub-components ───────────────────────────────────────────────────────────

function Tag({ children, bg, color }: { children: ReactNode; bg: string; color: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: bg, color, padding: "4px 9px", borderRadius: 999,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.2,
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function ScoreGauge({ value, color, percent, label, sublabel, delay = 0 }: {
  value: string;
  color: string;
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
  const strokeW = 3;
  const r = (size - strokeW * 2) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 0 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={EDITORIAL.line} strokeWidth={strokeW} />
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
          <span style={{ fontSize: 30, fontWeight: 500, color, lineHeight: 1 }}>{value}</span>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 11.5, fontWeight: 700, color: EDITORIAL.ink, margin: "8px 0 0" }}>{label}</p>
        {sublabel && <p style={{ fontSize: 10.5, color: EDITORIAL.ink3, margin: "2px 0 0" }}>{sublabel}</p>}
      </div>
    </div>
  );
}

function SectionHead({ num, title, kicker }: { num: string; title: string; kicker?: string }) {
  return (
    <div style={{ padding: "0 0 14px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ fontStyle: "italic", fontSize: 13, color: EDITORIAL.ink3 }}>{num}</span>
        <span style={{ fontSize: 24, color: EDITORIAL.ink, letterSpacing: -0.4, fontWeight: 600 }}>{title}</span>
      </div>
      {kicker && <div style={{ fontSize: 12.5, color: EDITORIAL.ink2, marginTop: 4, marginLeft: 26 }}>{kicker}</div>}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: EDITORIAL.line, margin: "0" }} />;
}

function shortCategory(product: OpenFoodFactsResult) {
  const category = product.categories.find(c => c.length > 3) || product.categories[0];
  return category ? category.replace(/^en:/, "").replace(/-/g, " ") : "Product";
}

function titleParts(name: string) {
  const bits = name.split(/\s+/).filter(Boolean);
  if (bits.length <= 1) return { first: name, rest: "" };
  return { first: bits[0], rest: bits.slice(1).join(" ") };
}

function packagingSummary(product: OpenFoodFactsResult) {
  const packages = product.ecoscoreData?.adjustments?.packaging?.packagings;
  if (!packages?.length) return "Packaging details unavailable";
  return packages
    .slice(0, 2)
    .map(pkg => [pkg.material, pkg.shape]
      .filter(Boolean)
      .join(" ")
      .replace(/en:/g, "")
      .replace(/-/g, " "))
    .join(", ");
}

function cleanLabel(label: string) {
  return label.replace(/^en:/, "").replace(/-/g, " ");
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OpenFoodFactsDetail() {
  const { barcode } = useParams<{ barcode: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromScan = searchParams.get("from") === "scan";

  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [seenFullDisclaimer] = useState(() => localStorage.getItem("goodscan_disclaimer_seen_full") === "true");
  const [showFullDisclaimer, setShowFullDisclaimer] = useState(false);
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

  // ── Disclaimer gate (shown once, persisted) ──

  if (!disclaimerAccepted) {
    const isShort = seenFullDisclaimer && !showFullDisclaimer;

    const acceptDisclaimer = () => {
      localStorage.setItem("goodscan_disclaimer_seen_full", "true");
      setDisclaimerAccepted(true);
      window.scrollTo(0, 0);
    };

    return (
      <div style={{ background: DS.bg, minHeight: "100dvh", fontFamily: DS.font, color: DS.ink }}>
        <main style={{ padding: "0 20px", paddingBottom: 40 }}>
          <div style={{ maxWidth: 520, margin: "0 auto" }}>

            {/* Header */}
            <div style={{ paddingTop: "max(60px, env(safe-area-inset-top))", marginBottom: 24 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: DS.good, margin: "0 0 6px", letterSpacing: 0.3 }}>
                GoodScan
              </p>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px", letterSpacing: -0.5, lineHeight: 1.15 }}>
                {isShort ? "Quick reminder" : "Before you continue"}
              </h1>
              {!isShort && (
                <p style={{ fontSize: 15, color: DS.muted, margin: 0, lineHeight: 1.5 }}>
                  Please read and accept the following to view product results.
                </p>
              )}
            </div>

            {/* Key message */}
            <div style={{
              background: DS.warnBg, borderRadius: DS.radius.md, padding: 16, marginBottom: 16,
              boxShadow: "0 2px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
            }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: DS.warn, margin: "0 0 6px" }}>
                Always verify information yourself
              </p>
              <p style={{ fontSize: 13, color: DS.ink, margin: 0, lineHeight: 1.55, opacity: 0.85 }}>
                GoodScan is a tool to help you explore — not a source of truth. Our data comes from third-party databases and public reports. <strong>It may be wrong, incomplete, or outdated.</strong> You should always do your own research and verify any claims before making decisions based on what you see here.
              </p>
            </div>

            {/* Full detail cards — only on first visit or when expanded */}
            {!isShort && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {[
                  { title: "We may be wrong", text: "Scores, flags, and verdicts are generated automatically from imperfect data. They can contain errors. A product rated highly may still have issues we missed, and a flagged product may have resolved its concerns. Treat everything as a starting point, not a conclusion." },
                  { title: "Not professional advice", text: "Nothing in GoodScan constitutes legal, medical, dietary, financial, or any other form of professional advice. Do not rely solely on this app for health or purchasing decisions." },
                  { title: "Flags are based on public reports", text: "Labour, environmental, and animal welfare flags reflect publicly available allegations and reports. A flag does not mean a company is guilty of wrongdoing. The absence of a flag does not mean a brand is ethical — it may simply not have been researched yet." },
                  { title: "No brand affiliation", text: "GoodScan is fully independent. We are not affiliated with, endorsed by, or sponsored by any brand, company, or product displayed in the app." },
                  { title: "Help us improve", text: "If you spot something wrong, you can reach us via email on the About page. We review all reports and aim to correct errors within 14 days." },
                ].map((item, i) => (
                  <div key={i} style={{
                    background: DS.card, borderRadius: DS.radius.md, padding: 16,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)",
                  }}>
                    <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>{item.title}</p>
                    <p style={{ fontSize: 13, color: DS.muted, margin: 0, lineHeight: 1.5 }}>{item.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Read full disclaimer link — short version only */}
            {isShort && (
              <button
                onClick={() => setShowFullDisclaimer(true)}
                style={{
                  background: "none", border: "none", padding: 0, marginBottom: 20,
                  color: DS.muted, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  textDecoration: "underline", fontFamily: DS.font,
                }}
              >
                Read full disclaimer
              </button>
            )}

            {/* Actions */}
            <button
              onClick={acceptDisclaimer}
              style={{
                width: "100%", height: 52, border: "none", borderRadius: DS.radius.md,
                background: DS.ink, color: "#fff",
                fontSize: 15, fontWeight: 800, cursor: "pointer",
                fontFamily: DS.font, marginBottom: 10,
              }}
            >
              I Understand — Show Results
            </button>

            <button
              onClick={() => navigate(-1)}
              style={{
                width: "100%", height: 44, borderRadius: DS.radius.sm,
                border: `1px solid ${DS.hair}`, background: DS.card,
                color: DS.muted, fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: DS.font,
              }}
            >
              Go Back
            </button>
          </div>
        </main>
      </div>
    );
  }

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
  const laborRecord     = findLaborAllegations(product);
  const boycottMatch    = checkBoycott(product.brand);
  const welfare         = checkAnimalWelfareFlag(product.brand);
  const verifiedEthics  = findVerifiedEthics(product.brand, product.productName);
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
  const title = titleParts(displayName);
  const category = shortCategory(product);
  const primaryAlert = laborRecord
    ? `${laborRecord.allegations.length} labour allegation${laborRecord.allegations.length > 1 ? "s" : ""} against ${laborRecord.parentCompany}`
    : welfare.isFlagged
    ? `${welfare.company?.companyName || product.brand || "This brand"} has animal welfare concerns`
    : boycottMatch
    ? `${boycottMatch.parent} is boycott listed`
    : verdict.reason;
  const productMeta = [product.brand, category].filter(Boolean).join(" · ");

  // ── Render ──

  return (
    <div style={{ background: EDITORIAL.page, fontFamily: DS.font, color: EDITORIAL.ink, minHeight: "100dvh", overflowX: "hidden" }}>

      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
        stickyVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      )}>
        <div style={{
          maxWidth: 560, margin: "0 auto", padding: "10px 16px",
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)",
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(241,235,221,0.94)",
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          borderBottom: `1px solid ${EDITORIAL.line}`,
        }}>
          <p style={{ flex: 1, fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
            {displayName}
          </p>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 11px", borderRadius: 999,
            background: EDITORIAL.ink, color: EDITORIAL.card,
            fontSize: 11, fontWeight: 800, flexShrink: 0,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: vc.color }} />
            {verdict.key}
          </div>
        </div>
      </div>

      <main style={{ paddingBottom: 96, maxWidth: 560, margin: "0 auto", background: EDITORIAL.paper, minHeight: "100dvh" }}>

        <div ref={heroRef} style={{ position: "relative", height: 280, overflow: "hidden", background: "radial-gradient(ellipse at 50% 35%, #F4DCB8 0%, #E8C58A 45%, #D9A86A 100%)" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)", backgroundSize: "3px 3px", opacity: 0.55 }} />
          <button
            type="button"
            onClick={() => {
              if (fromScan) navigate("/scan");
              else navigate(-1);
            }}
            aria-label="Go back"
            style={{
              position: "absolute", top: "calc(env(safe-area-inset-top, 0px) + 18px)", left: 16,
              width: 34, height: 34, borderRadius: 999, border: "none",
              background: "rgba(26,22,20,0.55)", color: EDITORIAL.card,
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(10px)", cursor: "pointer", zIndex: 2,
            }}
          >
            <ChevronLeft style={{ width: 18, height: 18 }} />
          </button>
          <div style={{
            position: "absolute", top: "calc(env(safe-area-inset-top, 0px) + 20px)", right: 16,
            background: EDITORIAL.ink, color: EDITORIAL.card, padding: "8px 13px 8px 11px",
            borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 7,
            fontSize: 12, fontWeight: 800, letterSpacing: 0.3,
            boxShadow: "0 6px 16px rgba(0,0,0,0.18)", zIndex: 2,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: vc.color, boxShadow: `0 0 0 3px ${vc.color}33` }} />
            {verdict.key}
          </div>
          <div style={{
            position: "absolute", left: "50%", top: "50%",
            transform: mounted ? "translate(-50%, -50%) rotate(-5deg)" : "translate(-50%, -46%) rotate(-5deg)",
            width: 178, height: 218, borderRadius: 22,
            background: "rgba(255,255,255,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 30px 50px rgba(120,40,15,0.28), inset 0 1px 0 rgba(255,255,255,0.35)",
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}>
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={displayName} style={{ maxWidth: "88%", maxHeight: "88%", objectFit: "contain", filter: "drop-shadow(0 18px 24px rgba(70,31,10,0.28))" }} />
            ) : (
              <Sprout style={{ width: 72, height: 72, color: "rgba(26,22,20,0.35)" }} />
            )}
          </div>
          <div style={{ position: "absolute", bottom: 12, left: 16, fontFamily: "ui-monospace, monospace", fontSize: 9, color: "rgba(26,22,20,0.42)", letterSpacing: 1 }}>
            {product.barcode}
          </div>
        </div>

        <div style={{ padding: "24px 22px 18px" }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: EDITORIAL.ink2 }}>
            {productMeta || "Product scan"}
          </div>
          <h1 style={{ fontSize: "clamp(2.45rem, 11vw, 3.05rem)", lineHeight: 1, margin: "8px 0 0", letterSpacing: -1.5, color: EDITORIAL.ink, fontWeight: 700 }}>
            {title.first}
            {title.rest && <><br /><span style={{ fontStyle: "italic", color: EDITORIAL.ink2, fontWeight: 500 }}>{title.rest}.</span></>}
          </h1>
          <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
            <Tag bg={vc.bg} color={vc.color}>{verdict.key[0] + verdict.key.slice(1).toLowerCase()}</Tag>
            {ecoGrade && <Tag bg={GRADE_BG[ecoGrade]} color={GRADE_COLOR[ecoGrade]}>Eco-Score {ecoGrade.toUpperCase()}</Tag>}
            {product.novaGroup !== null && <Tag bg="#EDE6D2" color={EDITORIAL.ink2}>{NOVA_LABEL[product.novaGroup] || `NOVA ${product.novaGroup}`}</Tag>}
            {verifiedEthics && <Tag bg="#D8E5DA" color={EDITORIAL.green}>Verified Ethics</Tag>}
          </div>
        </div>

        <div style={{ padding: "0 22px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{
            background: "#FBE9E2", borderRadius: 14, padding: "14px 16px",
            display: "flex", gap: 12, alignItems: "flex-start",
            border: `1px solid ${EDITORIAL.redSoft}`,
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: 99, background: vc.color, color: EDITORIAL.card,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontStyle: "italic", fontSize: 16, flexShrink: 0, marginTop: 1,
            }}>!</div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: EDITORIAL.ink, lineHeight: 1.3 }}>
                {primaryAlert}
              </div>
              <div style={{ fontSize: 12, color: EDITORIAL.ink2, marginTop: 3, lineHeight: 1.4 }}>
                {verdict.reason}
              </div>
            </div>
          </div>
          {verifiedEthics && (
            <div style={{
              background: "#D8E5DA", borderRadius: 14, padding: "14px 16px",
              display: "flex", gap: 12, alignItems: "flex-start",
              border: `1px solid rgba(31,107,78,0.2)`,
            }}>
              <BadgeCheck style={{ width: 20, height: 20, color: EDITORIAL.green, flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: EDITORIAL.ink, lineHeight: 1.3 }}>
                  Verified Ethics — {verifiedEthics.brandName}
                </div>
                <div style={{ fontSize: 12, color: EDITORIAL.ink2, marginTop: 3, lineHeight: 1.4 }}>
                  This brand has verified ethical sourcing and fair trade practices.
                </div>
              </div>
            </div>
          )}
        </div>

        {fromScan && (
          <div style={{ padding: "0 22px 22px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 12, color: EDITORIAL.ink3 }}>Matched automatically.</div>
            <div style={{ flex: 1 }} />
            <button
              type="button"
              onClick={() => candidates.length > 0 ? setShowCandidates(true) : setConfirmDismissed(true)}
              style={{
                fontSize: 12, fontWeight: 600, color: EDITORIAL.ink2,
                background: "transparent", border: `1px solid ${EDITORIAL.line}`, borderRadius: 999,
                padding: "5px 11px", cursor: "pointer",
              }}
            >
              Wrong product?
            </button>
          </div>
        )}

        <Divider />

        <div style={{ padding: "22px 22px 0", display: "flex", flexDirection: "column", gap: 28 }}>

          {fromScan && showCandidates && (
            <div style={{ background: EDITORIAL.card, borderRadius: 18, overflow: "hidden", border: `1px solid ${EDITORIAL.line}` }}>
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${EDITORIAL.line}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Other matches</p>
                  <p style={{ fontSize: 12, color: EDITORIAL.ink2, margin: "2px 0 0" }}>Select the correct product</p>
                </div>
                <button
                  type="button" onClick={() => setShowCandidates(false)}
                  style={{ background: "none", border: "none", color: EDITORIAL.ink, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
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
                      borderBottom: ci < candidates.length - 1 ? `1px solid ${EDITORIAL.line}` : "none",
                      background: "none", border: "none", color: EDITORIAL.ink,
                    }}
                  >
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${EDITORIAL.line}`, objectFit: "contain", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${EDITORIAL.line}`, background: EDITORIAL.paper, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Package style={{ width: 16, height: 16, color: EDITORIAL.ink3 }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.82rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                        {c.productName || "Unknown product"}
                      </p>
                      {c.brand && <p style={{ fontSize: "0.7rem", color: EDITORIAL.ink2, margin: "2px 0 0" }}>{c.brand}</p>}
                    </div>
                    {g && (
                      <span style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: GRADE_BG[g], color: GRADE_COLOR[g],
                        fontSize: "0.78rem", fontWeight: 800,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>{g.toUpperCase()}</span>
                    )}
                    <ChevronRight style={{ width: 14, height: 14, color: EDITORIAL.ink3, flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          )}

          {hasScores && (
            <div
              id="breakdown"
              style={{
                background: EDITORIAL.card, borderRadius: 22, padding: "20px 12px",
                border: `1px solid ${EDITORIAL.line}`,
                display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 8,
                opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(10px)",
                transition: "all 0.5s ease 0.2s",
              }}
            >
              {ecoGrade && (
                <ScoreGauge
                  value={ecoGrade.toUpperCase()}
                  color={GRADE_COLOR[ecoGrade] ?? EDITORIAL.ink3}
                  percent={GRADE_PERCENT[ecoGrade] ?? 0.5}
                  label="Eco-Score"
                  sublabel={product.ecoscoreScore !== null ? `${product.ecoscoreScore}/100` : undefined}
                  delay={0}
                />
              )}
              {nutriGrade && ["a", "b", "c", "d", "e"].includes(nutriGrade) && (
                <ScoreGauge
                  value={nutriGrade.toUpperCase()}
                  color={GRADE_COLOR[nutriGrade] ?? EDITORIAL.ink3}
                  percent={GRADE_PERCENT[nutriGrade] ?? 0.5}
                  label="Nutri-Score"
                  delay={150}
                />
              )}
              {product.novaGroup !== null && NOVA_LABEL[product.novaGroup!] && (
                <ScoreGauge
                  value={String(product.novaGroup)}
                  color={NOVA_COLOR[product.novaGroup!] ?? EDITORIAL.ink3}
                  percent={NOVA_PERCENT[product.novaGroup!] ?? 0.5}
                  label="NOVA"
                  sublabel={NOVA_LABEL[product.novaGroup!]}
                  delay={300}
                />
              )}
            </div>
          )}

          {agri?.co2_total !== undefined && (
            <section style={{
              opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(10px)",
              transition: "all 0.5s ease 0.3s",
            }}>
              <SectionHead num="01" title="Carbon footprint" kicker="Cradle-to-shelf, per kilogram." />
              <div style={{ background: EDITORIAL.card, border: `1px solid ${EDITORIAL.line}`, borderRadius: 22, padding: "22px 20px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <div style={{ fontSize: 64, lineHeight: 0.9, color: EDITORIAL.ink, letterSpacing: -2, fontWeight: 700 }}>
                    {(() => {
                      const [whole, decimal] = agri.co2_total.toFixed(2).split(".");
                      return <>{whole}<span style={{ color: EDITORIAL.ink3 }}>.</span>{decimal}</>;
                    })()}
                  </div>
                  <div style={{ fontSize: 12, color: EDITORIAL.ink2, lineHeight: 1.35 }}>
                    kg CO2e<br />per kg
                  </div>
                </div>
                {drivingKm !== null && (
                  <div style={{ fontSize: 12.5, color: EDITORIAL.ink2, marginTop: 10, paddingBottom: 18, borderBottom: `1px dashed ${EDITORIAL.line}` }}>
                    Same as driving <span style={{ color: EDITORIAL.ink, fontWeight: 700 }}>{drivingKm} km</span> in an average car.
                  </div>
                )}
                {co2Values.length > 0 && (
                  <>
                    <div style={{ marginTop: 18, display: "flex", height: 10, borderRadius: 99, overflow: "hidden", background: EDITORIAL.line }}>
                      {CO2_BARS.map(({ key, color }) => {
                        const val = agri[key as keyof typeof agri] as number | undefined;
                        if (typeof val !== "number" || val <= 0) return null;
                        return <div key={key} style={{ flex: val, background: color, borderRight: `2px solid ${EDITORIAL.card}` }} />;
                      })}
                    </div>
                    <div style={{ marginTop: 16, display: "grid", gap: 11 }}>
                    {CO2_BARS.map(({ key, label, Icon, color }, i) => {
                      const val = agri[key as keyof typeof agri] as number | undefined;
                      if (typeof val !== "number" || val <= 0) return null;
                      const pct = agri.co2_total ? Math.round((val / agri.co2_total) * 100) : Math.round((val / maxCo2) * 100);
                      return (
                        <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Icon style={{ width: 14, height: 14, color, flexShrink: 0 }} />
                          <div style={{ flex: 1, fontSize: 13, color: EDITORIAL.ink }}>{label}</div>
                          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: EDITORIAL.ink2, letterSpacing: 0.2 }}>{val.toFixed(2)} <span style={{ color: EDITORIAL.ink3 }}>kg</span></div>
                          <div style={{ fontSize: 11, color: EDITORIAL.ink3, width: 36, textAlign: "right" }}>{pct}%</div>
                        </div>
                      );
                    })}
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          <section style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(10px)", transition: "all 0.5s ease 0.4s" }}>
            <SectionHead num="02" title="Ethics & labour" kicker={laborRecord ? `Parent company: ${laborRecord.parentCompany}.` : undefined} />
            <div style={{ background: EDITORIAL.card, border: `1px solid ${EDITORIAL.line}`, borderRadius: 22, padding: "8px 20px 22px" }}>
              {laborRecord ? laborRecord.allegations.map((al, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "46px 1fr", gap: 14, padding: "18px 0", borderTop: `1px solid ${EDITORIAL.line}` }}>
                  <div>
                    <div style={{ fontStyle: "italic", fontSize: 22, color: EDITORIAL.ink, lineHeight: 1, letterSpacing: -0.5 }}>'{String(al.year).slice(2)}</div>
                    <div style={{ fontSize: 9.5, color: EDITORIAL.ink3, letterSpacing: 0.6, marginTop: 4 }}>{al.year}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 19, lineHeight: 1.15, color: EDITORIAL.ink, letterSpacing: -0.3, fontWeight: 700 }}>{al.issue}</div>
                    <div style={{ fontSize: 12.5, color: EDITORIAL.ink2, marginTop: 6, lineHeight: 1.45 }}>{al.details}</div>
                    <a href={al.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: EDITORIAL.red, marginTop: 8, display: "flex", alignItems: "center", gap: 4, fontWeight: 700, textDecoration: "none" }}>
                      <ExternalLink style={{ width: 10, height: 10 }} /> {al.source}
                    </a>
                  </div>
                </div>
              )) : (
                <div style={{ padding: "18px 0 0", display: "flex", gap: 10, alignItems: "center" }}>
                  <CheckCircle2 style={{ width: 18, height: 18, color: EDITORIAL.green }} />
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: EDITORIAL.green }}>No labour concerns found.</p>
                </div>
              )}
              <div style={{ fontStyle: "italic", fontSize: 12, color: EDITORIAL.ink3, marginTop: 16, lineHeight: 1.4, borderTop: `1px solid ${EDITORIAL.line}`, paddingTop: 14 }}>
                Based on publicly available reports. Companies may have taken corrective steps since publication.
              </div>
            </div>
            {verifiedEthics && (
              <div style={{ marginTop: 14, background: EDITORIAL.card, border: `1px solid ${EDITORIAL.line}`, borderLeft: `4px solid ${EDITORIAL.green}`, borderRadius: 14, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <BadgeCheck style={{ width: 18, height: 18, color: EDITORIAL.green, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: EDITORIAL.green }}>Verified Ethics — {verifiedEthics.brandName}</span>
                </div>
                {verifiedEthics.highlights.map((h, i) => (
                  <div key={i} style={{ padding: "10px 0", borderTop: i > 0 ? `1px solid ${EDITORIAL.line}` : "none" }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: EDITORIAL.ink, margin: "0 0 3px" }}>{h.label}</p>
                    <p style={{ fontSize: 12, color: EDITORIAL.ink2, lineHeight: 1.5, margin: "0 0 6px" }}>{h.detail}</p>
                    <a href={h.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: EDITORIAL.green, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                      <ExternalLink style={{ width: 10, height: 10 }} /> {h.source}
                    </a>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              {boycottMatch && (
                <div style={{ padding: "14px 16px", background: "#FFFFFF", border: `1px solid ${EDITORIAL.amberSoft}`, borderLeft: `4px solid ${EDITORIAL.amber}`, borderRadius: 14, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: EDITORIAL.ink }}>{boycottMatch.parent} - Boycott listed</div>
                    <div style={{ fontSize: 11.5, color: EDITORIAL.ink2, marginTop: 2 }}>{boycottMatch.reason}</div>
                  </div>
                  <a href="https://boycott-israel.org/boycott.html" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: EDITORIAL.amber, fontWeight: 800, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                    Read <span>→</span>
                  </a>
                </div>
              )}
              {welfare.isFlagged && <AnimalWelfareFlagBadge brand={product.brand} showDetails={true} />}
            </div>
          </section>

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
                background: EDITORIAL.card, borderRadius: 20, overflow: "hidden", border: `1px solid ${EDITORIAL.line}`,
                opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(10px)",
                transition: "all 0.5s ease 0.55s",
              }}>
                <div style={{ padding: "18px" }}>
                  <SectionHead num="03" title="Threatened species" />
                  <div style={{
                    background: "#fef2f2", borderRadius: 14, padding: 14,
                    borderLeft: `3px solid ${EDITORIAL.red}`,
                    display: "flex", alignItems: "flex-start", gap: 10,
                  }}>
                    <AlertTriangle style={{ width: 16, height: 16, color: EDITORIAL.red, flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p style={{ fontSize: "0.8rem", fontWeight: 700, color: EDITORIAL.red, margin: "0 0 4px" }}>
                        Contains {ingredientRaw}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: EDITORIAL.ink, lineHeight: 1.55, margin: 0 }}>{explanation}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: "0.62rem", color: EDITORIAL.ink3, marginTop: 10, margin: "10px 0 0" }}>Source: Open Food Facts Ecoscore</p>
                </div>
              </div>
            );
          })()}

          <section style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(10px)", transition: "all 0.5s ease 0.6s" }}>
            <SectionHead num="04" title="Materials & logistics" />
            <div style={{ display: "grid", gap: 10 }}>
              {[
                { icon: <Package style={{ width: 17, height: 17 }} />, label: "Packaging", value: packagingSummary(product), impact: product.ecoscoreData?.adjustments?.packaging?.value != null ? `${product.ecoscoreData.adjustments.packaging.value} pts` : "Unknown", bad: (product.ecoscoreData?.adjustments?.packaging?.value ?? 0) < 0 },
                { icon: <Truck style={{ width: 17, height: 17 }} />, label: "Transport origin", value: product.origins || "Manufacturer undisclosed", impact: product.ecoscoreData?.adjustments?.origins_of_ingredients?.value != null ? `${product.ecoscoreData.adjustments.origins_of_ingredients.value} pts` : "Unknown", bad: (product.ecoscoreData?.adjustments?.origins_of_ingredients?.value ?? 0) < 0 },
                { icon: <BadgeCheck style={{ width: 17, height: 17 }} />, label: "Certifications", value: product.labels.length ? product.labels.slice(0, 3).map(cleanLabel).join(", ") : "None found", impact: product.labels.length ? `${product.labels.length} mark${product.labels.length > 1 ? "s" : ""}` : "None", bad: false },
              ].map(item => (
                <div key={item.label} style={{ padding: "16px 18px", background: EDITORIAL.card, border: `1px solid ${EDITORIAL.line}`, borderRadius: 18, display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: EDITORIAL.paper, display: "flex", alignItems: "center", justifyContent: "center", color: EDITORIAL.ink }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: EDITORIAL.ink }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: EDITORIAL.ink2, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.value}</div>
                  </div>
                  <Tag bg={item.bad ? EDITORIAL.redSoft : item.impact === "Unknown" || item.impact === "None" ? "#EDE6D2" : EDITORIAL.greenSoft} color={item.bad ? EDITORIAL.red : item.impact === "Unknown" || item.impact === "None" ? EDITORIAL.ink2 : EDITORIAL.green}>{item.impact}</Tag>
                </div>
              ))}
            </div>
          </section>

          <div style={{ padding: "0 0 24px", textAlign: "center" }}>
            <Divider />
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: EDITORIAL.ink3, marginTop: 20 }}>
              Barcode {product.barcode}
            </div>
            <div style={{ fontStyle: "italic", fontSize: 16, color: EDITORIAL.ink2, marginTop: 10, lineHeight: 1.35 }}>
              Read fewer labels.<br />Eat with more intent.
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{
            padding: "14px 16px", margin: "0 0 16px",
            background: EDITORIAL.card, borderRadius: 14,
            border: `1px solid ${EDITORIAL.line}`,
          }}>
            <p style={{ fontSize: 11, color: EDITORIAL.ink3, margin: 0, lineHeight: 1.55 }}>
              <strong style={{ color: EDITORIAL.ink2 }}>Disclaimer:</strong> This information is for informational purposes only and does not constitute professional advice. Scores and flags are derived from publicly available data and may be incomplete or inaccurate. GoodScan is not affiliated with any brand shown. Please verify claims independently before making purchasing decisions.
            </p>
          </div>
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
