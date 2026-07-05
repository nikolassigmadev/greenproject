import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import {
  Loader2, Leaf, AlertTriangle, ExternalLink,
  CheckCircle2, ChevronRight, Package, ShoppingBag, ShoppingCart, XCircle, Clock,
  BadgeCheck, Wheat, Factory, Truck, Store, UtensilsCrossed,
  ScanLine, Check, Sprout, PawPrint, Search, Eye, Share2,
} from "lucide-react";
import { shareProductCard } from "@/utils/shareCard";
import { BackButton } from "@/components/BackButton";
import { isWatched, toggleWatchlist, getBrandSentiment, WATCHLIST_EVENT } from "@/utils/watchlist";
import { Logo, Wordmark } from "@/components/Logo";
import { lookupBarcode, searchProducts, scoreDataCompleteness, imageQualityTier } from "@/services/openfoodfacts";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import { loadPriorities, priorityMultiplier, saveScanToHistory, loadScanHistory, type UserPriorities } from "@/utils/userPreferences";
import { logScan } from "@/utils/scanLogger";
import { assessUnmetDemand } from "@/services/swaps";
import { loadRegion } from "@/utils/userRegion";
import { checkBoycott } from "@/data/boycottBrands";
import { checkAnimalWelfareFlag } from "@/utils/animalWelfareFlags";
import { AnimalWelfareFlagBadge } from "@/components/AnimalWelfareFlagBadge";
import { EggChickenWelfareCard } from "@/components/EggChickenWelfareCard";
import { BeefWelfareCard } from "@/components/BeefWelfareCard";
import { SugarIndustryCard } from "@/components/SugarIndustryCard";
import { CommoditySupplyChainCard } from "@/components/CommoditySupplyChainCard";
import { computeAnimalWelfareScore, welfareScoreColor } from "@/utils/animalWelfareScore";
import { addToBasket, removeFromBasket, loadBasket } from "@/utils/basketStorage";
import { findLaborAllegations as findLaborAllegationsUtil, getLaborAllegationCount } from "@/utils/laborCheck";
import { findVerifiedEthics, CERTIFICATION_BADGES, getPrimaryCertification, CATEGORY_LABELS, type CertificationType } from "@/utils/verifiedEthics";
import { checkDietaryConflicts, loadDietaryPrefs, hasDietaryPrefs, DIETARY_EVENT, type DietaryPrefs } from "@/utils/dietaryPreferences";
import { DietaryConflictBanner } from "@/components/DietaryConflictBanner";
import { findChocolateEntry, VERDICT_META, type ChocolateVerdict } from "@/data/chocolateDirectory";
import { EnvironmentalImpactCard } from "@/components/EnvironmentalImpactCard";
import { IngredientConcernsCard } from "@/components/IngredientConcernsCard";
import { SwapSuggestions } from "@/components/SwapSuggestions";
import { DecisionBar } from "@/components/DecisionBar";
import { useBottomNav } from "@/components/BottomNav";
import { findIngredientFlagsInText } from "@/services/ingredientFlags";
import { sendChatMessage } from "@/services/api/backend-client";
import { cn } from "@/lib/utils";
import { DS } from "@/styles/design-tokens";
import { toast } from "sonner";

// ─── Helpers (logic) ──────────────────────────────────────────────────────────

const nameCache = new Map<string, string>();

async function fetchCleanName(rawName: string): Promise<string> {
  if (nameCache.has(rawName)) return nameCache.get(rawName)!;
  try {
    const res = await sendChatMessage(
      'clean-product-name',
      `Given this product name from a barcode database: "${rawName}", return ONLY the clean, properly formatted product name (e.g. "Coca-Cola", "Nutella", "Lay's Classic Chips"). Remove size, weight, volume, and any descriptors that aren't part of the brand/product identity. Return just the name, nothing else.`
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
  ink: DS.ink,
  ink2: DS.ink2,
  ink3: DS.muted,
  paper: DS.card,
  page: DS.card,
  card: DS.card,
  line: DS.hair,
  green: DS.good,
  greenSoft: DS.goodBg,
  red: DS.bad,
  redSoft: DS.badBg,
  amber: DS.warn,
  amberSoft: DS.warnBg,
  blue: "#2E5A7A",
  gold: "#9A7B1F",
} as const;

/**
 * A candidate is worth offering only if it carries some substantive data beyond
 * a bare name/brand — an eco- or nutri-score, NOVA group, ingredients, or a
 * carbon figure. Pure stubs are dropped from the "select the correct product"
 * list so the shopper isn't sent to an empty record.
 */
const hasMeaningfulData = (p: OpenFoodFactsResult): boolean =>
  !!(p.ecoscoreGrade || p.nutriscoreGrade || p.novaGroup !== null || p.ingredientsText || p.carbonFootprint100g !== null);

/**
 * Open Food Facts serves each product photo at 100 / 200 / 400 / full sizes
 * (e.g. `front_en.311.400.jpg`). The verdict hero is the one place that
 * deserves the sharpest available shot, so bump the size segment to `full`.
 * Only rewrites recognised OFF image URLs; anything else passes through.
 */
const fullResOffImage = (url: string | null | undefined): string | null => {
  if (!url) return url ?? null;
  if (!/openfoodfacts\.org/.test(url)) return url;
  return url.replace(/\.(100|200|400)\.jpg(\?.*)?$/i, ".full.jpg$2");
};

const GRADE_COLOR: Record<string, string> = {
  "a-plus": DS.good, a: DS.good, b: DS.good, c: DS.warn, d: "var(--ds-caution, #C26544)", e: DS.bad,
};

const GRADE_BG: Record<string, string> = {
  "a-plus": DS.goodBg, a: DS.goodBg, b: DS.goodBg, c: DS.warnBg, d: "var(--ds-caution-bg, #FBE9E2)", e: DS.badBg,
};

const NOVA_LABEL: Record<number, string> = {
  1: "Unprocessed", 2: "Culinary", 3: "Processed", 4: "Ultra-processed",
};

const NOVA_COLOR: Record<number, string> = {
  1: DS.good, 2: DS.good, 3: DS.warn, 4: DS.bad,
};

const VERDICT_CONFIG = {
  BUY:      { color: EDITORIAL.green, bg: EDITORIAL.greenSoft, Icon: CheckCircle2, label: "Buy" },
  CONSIDER: { color: EDITORIAL.amber, bg: EDITORIAL.amberSoft, Icon: Clock,        label: "Consider" },
  CAUTION:  { color: "var(--ds-caution, #C26544)", bg: "var(--ds-caution-bg, #FBE9E2)", Icon: AlertTriangle, label: "Caution" },
  AVOID:    { color: EDITORIAL.red,   bg: EDITORIAL.redSoft,   Icon: XCircle,       label: "Avoid" },
  UNKNOWN:  { color: EDITORIAL.ink3,  bg: "var(--ds-neutral-bg, #EDE6D2)", Icon: Clock,        label: "Unknown" },
};

const CO2_BARS = [
  { key: "co2_agriculture",    label: "Agriculture",  Icon: Wheat,           color: EDITORIAL.green },
  { key: "co2_processing",     label: "Processing",   Icon: Factory,         color: EDITORIAL.blue },
  { key: "co2_packaging",      label: "Packaging",    Icon: Package,         color: EDITORIAL.amber },
  { key: "co2_transportation", label: "Transport",    Icon: Truck,           color: "var(--ds-caution, #C26544)" },
  { key: "co2_distribution",   label: "Distribution", Icon: Store,           color: EDITORIAL.gold },
  { key: "co2_consumption",    label: "Consumption",  Icon: UtensilsCrossed, color: "#9B4E63" },
] as const;

const GRADE_PERCENT: Record<string, number> = { "a-plus": 1, a: 0.9, b: 0.8, c: 0.6, d: 0.4, e: 0.2 };

/** OFF grade → tight display label. "a-plus" prints as "A+", everything else uppercased. */
function gradeLabel(grade: string): string {
  return grade.toLowerCase() === "a-plus" ? "A+" : grade.toUpperCase();
}
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
  // The hero line is normally the first word, but never orphan a tiny leading
  // word ("Mr", "Dr", "St") on its own line — keep it with the next word.
  const firstCount = bits[0].length <= 2 && bits.length > 2 ? 2 : 1;
  return { first: bits.slice(0, firstCount).join(" "), rest: bits.slice(firstCount).join(" ") };
}

/**
 * Remove a leading brand from a product name so the title is the PRODUCT, not
 * "Brand Product". Handles OFF's comma-joined brands ("Feastables, MrBeast") and
 * spacing/punctuation variants ("MrBeast" vs "Mr Beast"). Returns "" if nothing
 * meaningful is left.
 */
function stripLeadingBrand(name: string, brand: string | null): string {
  let out = (name || "").trim();
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const brands = (brand || "").split(",").map((b) => b.trim()).filter(Boolean);
  for (const b of brands) {
    const nb = norm(b);
    if (!nb) continue;
    const words = out.split(/\s+/);
    let acc = "";
    for (let i = 0; i < words.length; i++) {
      acc += norm(words[i]);
      if (acc === nb) {
        out = words.slice(i + 1).join(" ").replace(/^[\s\-–—:]+/, "").trim();
        break;
      }
      if (!nb.startsWith(acc)) break; // name doesn't lead with this brand
    }
  }
  return out.trim();
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
  const [dietaryPrefs, setDietaryPrefs]     = useState<DietaryPrefs>(() => loadDietaryPrefs());
  const [confirmDismissed, setConfirmDismissed] = useState(false);
  const [showCandidates, setShowCandidates] = useState(false);
  const [candidates, setCandidates]         = useState<OpenFoodFactsResult[]>([]);
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [manualSearchInput, setManualSearchInput] = useState("");
  const [manualSearchLoading, setManualSearchLoading] = useState(false);
  const [inBasket, setInBasket]             = useState(false);
  const [brandWatched, setBrandWatched]     = useState(false);
  const [stickyVisible, setStickyVisible]   = useState(false);
  const [cleanName, setCleanName]           = useState<string | null>(null);
  const [mounted, setMounted]               = useState(false);
  // Whether the "Better swaps" section actually renders any picks (null = still
  // resolving). Drives whether the DecisionBar promises "see a cleaner pick".
  const [swapsAvailable, setSwapsAvailable] = useState<boolean | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const swapsRef = useRef<HTMLDivElement>(null);
  const { setHidden: setBottomNavHidden } = useBottomNav();
  const scrollToSwaps = () => swapsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  useEffect(() => { if (barcode) loadProduct(barcode); }, [barcode]);

  // Focused decision context: hide the floating bottom nav while a product is
  // shown so the fixed Decision bar owns the bottom. Restored when we leave.
  useEffect(() => {
    if (!product) return;
    setBottomNavHidden(true);
    return () => setBottomNavHidden(false);
  }, [product, setBottomNavHidden]);

  useEffect(() => {
    if (fromScan) {
      try {
        const stored = sessionStorage.getItem("scan_candidates");
        if (stored) {
          const parsed: OpenFoodFactsResult[] = JSON.parse(stored);
          // OFF often holds several entries for what is effectively the same
          // product — many are near-empty stubs (just a name, no scores). Keep
          // only the well-populated ones (don't sacrifice data), then surface
          // the cleanest front-of-pack photo first so the shopper lands on the
          // best-looking, best-documented record. Fall back to the full list if
          // the data filter would empty it.
          const ordered = parsed
            .filter(c => c.barcode !== barcode)
            .sort((a, b) =>
              imageQualityTier(b) - imageQualityTier(a) ||
              scoreDataCompleteness(b) - scoreDataCompleteness(a),
            );
          const rich = ordered.filter(hasMeaningfulData);
          setCandidates(rich.length > 0 ? rich : ordered);
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
    const handler = () => setDietaryPrefs(loadDietaryPrefs());
    window.addEventListener(DIETARY_EVENT, handler);
    return () => window.removeEventListener(DIETARY_EVENT, handler);
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
    if (!product?.brand) {
      setBrandWatched(false);
      return;
    }
    setBrandWatched(isWatched(product.brand));
    const handler = () => setBrandWatched(isWatched(product.brand));
    window.addEventListener(WATCHLIST_EVENT, handler);
    return () => window.removeEventListener(WATCHLIST_EVENT, handler);
  }, [product?.brand]);

  const handleWatchlistToggle = () => {
    if (!product?.brand) return;
    const nowWatched = toggleWatchlist(product.brand);
    setBrandWatched(nowWatched);
    toast.success(
      nowWatched ? `Watching ${product.brand}` : `Removed ${product.brand}`,
      {
        id: "watchlist-toggle",
        description: nowWatched
          ? "We'll alert you about new verified flags."
          : "No longer in your watchlist.",
        duration: 4500,
        action: {
          label: "View watched brands",
          onClick: () => navigate("/watchlist"),
        },
      },
    );
  };

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
    // Record to the global scan-analytics DB (anonymous, fire-and-forget).
    // When we arrived from a camera scan, attach exactly what OpenAI identified
    // the product as. Left in sessionStorage (not consumed) so the Decision bar
    // can attach it to the buy/skip row too; a fresh scan clears it.
    const openaiResponse = fromScan ? sessionStorage.getItem("scan_openai_response") : null;
    // The COMPLETE raw OpenAI response (before it was trimmed to the OFF search).
    const fullOpenaiResponse = fromScan ? sessionStorage.getItem("scan_full_openai_response") : null;
    // The photo the user scanned (compressed base64), stored inline on the row.
    const scanImage = fromScan ? sessionStorage.getItem("scan_image") : null;
    // Capture the unmet-demand signals at scan time too (not just on decision):
    // category, worst concern, and whether an in-market alternative exists.
    const demand = assessUnmetDemand(product, priorities, loadRegion()?.countryCode);
    logScan({
      barcode: product.barcode,
      name: product.productName || "Unknown Product",
      brand: product.brand,
      ecoGrade: product.ecoscoreGrade,
      openaiResponse,
      fullOpenaiResponse,
      image: scanImage,
      verdict: verdictKey,
      priorities,
      category: demand.category,
      primaryConcern: demand.primaryConcern,
      swapAvailable: demand.swapAvailable,
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

  const handleManualProductSearch = async () => {
    const query = manualSearchInput.trim();
    if (!query) return;
    setManualSearchLoading(true);
    try {
      const results = await searchProducts(query, 5);
      if (results.length > 0) {
        sessionStorage.setItem("scan_candidates", JSON.stringify(results));
        navigate(`/product-off/${results[0].barcode}?from=scan`);
      } else {
        toast.error(`No results found for "${query}"`);
      }
    } catch {
      toast.error("Search failed. Please try again.");
    } finally {
      setManualSearchLoading(false);
    }
  };

  const handleCartToggle = () => {
    if (!product) return;
    if (inBasket) {
      removeFromBasket(product.barcode);
      toast.dismiss("cart-added");
    } else {
      const laborCount = getLaborAllegationCount(product.brand, product.productName);
      addToBasket({
        barcode: product.barcode,
        productName: product.productName || "Unknown Product",
        brand: product.brand,
        imageUrl: product.imageUrl,
        ecoscoreGrade: product.ecoscoreGrade,
        ecoscoreScore: product.ecoscoreScore,
        nutriscoreGrade: product.nutriscoreGrade,
        laborAllegations: laborCount,
        co2Per100g: product.carbonFootprint100g ?? null,
      });
      toast.success("Added to cart", {
        id: "cart-added",
        description: "View it anytime under the History tab.",
        duration: 4500,
        action: {
          label: "View cart",
          onClick: () => navigate("/dashboard"),
        },
      });
    }
  };

  const loadProduct = async (code: string) => {
    setMounted(false);
    setError(null);

    // Fast path: arriving straight from a scan, we already hold the fully
    // normalised product (eco-score, nutri-score, image, …) that the search
    // step fetched moments ago — it's stored in scan_candidates. Render it
    // instantly instead of blocking on a fresh barcode lookup, which used to
    // bolt a whole network round-trip onto the critical path AFTER navigation.
    // We still refresh from OpenFoodFacts in the background to pick up any
    // richer fields, but the user sees the result immediately.
    let renderedFromCache = false;
    if (fromScan) {
      try {
        const stored = sessionStorage.getItem("scan_candidates");
        if (stored) {
          const parsed: OpenFoodFactsResult[] = JSON.parse(stored);
          const hit = parsed.find((c) => c.barcode === code);
          if (hit && hit.found !== false && hit.productName) {
            setProduct(hit);
            setLoading(false);
            renderedFromCache = true;
          }
        }
      } catch { /* ignore — fall through to a normal network load */ }
    }

    if (!renderedFromCache) setLoading(true);

    // A transient failure (backend proxy hiccup, OFF timeout/rate-limit) comes
    // back as a network-ish error — NOT a genuine "not found". Retry those a
    // couple of times so a one-off blip doesn't masquerade as "doesn't exist".
    const isTransient = (e?: string | null) =>
      !!e && /tim(e|ed)\s*out|timeout|network|abort|fetch|unreachable|signal|failed to/i.test(e);
    try {
      let result = await lookupBarcode(code);
      for (let attempt = 0; !result.found && isTransient(result.error) && attempt < 2; attempt++) {
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        result = await lookupBarcode(code);
      }
      if (result.found) {
        // Background refresh succeeded — swap in the (possibly richer) record.
        setProduct(result);
      } else if (!renderedFromCache) {
        // Only surface a miss/error if we have nothing already on screen.
        const cached = loadScanHistory().find(h => h.barcode === code);
        if (cached) setProduct(buildFromCache(cached));
        else if (isTransient(result.error))
          setError("Couldn't reach OpenFoodFacts. Check your connection and try again.");
        else setError("Product not found in OpenFoodFacts database");
      }
    } catch {
      if (!renderedFromCache) {
        const cached = loadScanHistory().find(h => h.barcode === code);
        if (cached) setProduct(buildFromCache(cached));
        else setError("Failed to load product details");
      }
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
            <div style={{ paddingTop: "max(60px, calc(env(safe-area-inset-top, 0px) + 16px))", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 6px" }}>
                <Logo size={24} />
                <Wordmark fontSize={16} />
              </div>
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
                  { title: "Help us improve", text: "If you spot something wrong, email us at contact@goodscan.shop." },
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

            {/* Policies reminder — the legal terms accepted at onboarding, always one tap away */}
            <p style={{ fontSize: 12.5, color: DS.muted, lineHeight: 1.55, margin: "0 0 16px", textAlign: "center" }}>
              By continuing you agree to our{" "}
              <Link to="/terms-of-service" style={{ color: DS.ink, fontWeight: 700, textDecoration: "underline" }}>Terms of Service</Link>,{" "}
              <Link to="/terms-and-conditions" style={{ color: DS.ink, fontWeight: 700, textDecoration: "underline" }}>Terms &amp; Conditions</Link>, and{" "}
              <Link to="/privacy" style={{ color: DS.ink, fontWeight: 700, textDecoration: "underline" }}>Privacy Policy</Link>.
            </p>

            {/* Actions */}
            <button
              onClick={acceptDisclaimer}
              style={{
                width: "100%", height: 52, border: "none", borderRadius: DS.radius.md,
                background: DS.ink, color: DS.card,
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
        <style>{`@keyframes off-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Error ──

  if (error || !product) {
    return (
      <div style={{ background: DS.bg, fontFamily: DS.font, color: DS.ink, minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, padding: "0 20px", paddingTop: "max(24px, calc(env(safe-area-inset-top, 0px) + 16px))", maxWidth: 560, margin: "0 auto", width: "100%" }}>
          <div style={{ background: "var(--ds-error-bg, #fef2f2)", borderRadius: 16, border: "1px solid var(--ds-error-border, #fecaca)", padding: 18, display: "flex", alignItems: "flex-start", gap: 14 }}>
            <XCircle style={{ color: EDITORIAL.red, width: 20, height: 20, flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: "0.88rem", fontWeight: 700, color: EDITORIAL.red, marginBottom: 4 }}>Product not found</p>
              <p style={{ fontSize: "0.78rem", color: DS.muted }}>{error || "Unable to load product details"}</p>
            </div>
          </div>
        </div>
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
  // Positive-ethics display follows the same precedence as the scorer
  // (personalizedScore) and getVerdict below: a live concern (allegation,
  // boycott, serious welfare flag) suppresses the green "verified ethics"
  // card/badges. Otherwise a brand like Ben & Jerry's — genuinely a B Corp but
  // also boycott-listed via Unilever — would show an all-clear green card
  // directly under a red warning.
  const cleanEthicsRecord = !laborRecord && !boycottMatch
    && !(welfare.isFlagged && (welfare.severity === "critical" || welfare.severity === "high"));
  const verifiedEthics  = cleanEthicsRecord
    ? findVerifiedEthics(product.brand, product.productName)
    : null;
  const chocolateEntry  = findChocolateEntry(product.brand, product.productName);
  const ecoGrade     = product.ecoscoreGrade?.toLowerCase();
  const nutriGrade   = product.nutriscoreGrade?.toLowerCase();
  const welfareScore = computeAnimalWelfareScore({
    brand: product.brand,
    productName: product.productName,
    categories: product.categories,
    labels: product.labels,
    ingredientsText: product.ingredientsText,
  });
  const dietaryCheck = checkDietaryConflicts(product, dietaryPrefs);
  // Only whisper "couldn't check" when the user actually has dietary needs set.
  const showDietaryNoData = dietaryCheck.noData && hasDietaryPrefs(dietaryPrefs);

  const co2Values = CO2_BARS
    .map(b => agri?.[b.key as keyof typeof agri] as number | undefined)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const maxCo2 = co2Values.length > 0 ? Math.max(...co2Values) : 1;

  const drivingKm = agri?.co2_total != null
    ? Math.round((agri.co2_total / 0.21) * 10) / 10
    : null;

  // Prefer OCR-identified product name from scan (e.g. "KitKat") over OFF's product_name (e.g. "Chunky")
  // Only use it if it's not obviously unrelated to the product (guard against stale sessionStorage)
  const ocrNameRaw = fromScan ? sessionStorage.getItem('ocr_product_name') : null;
  const ocrName = (() => {
    if (!ocrNameRaw) return null;
    // If the product has a name/brand and the OCR name shares no words with either, skip it
    const ocrLower = ocrNameRaw.toLowerCase();
    const prodLower = (product.productName || "").toLowerCase();
    const brandLower = (product.brand || "").toLowerCase();
    const ocrWords = ocrLower.split(/\s+/).filter(w => w.length >= 3);
    const prodBrandText = `${prodLower} ${brandLower}`;
    if (ocrWords.length > 0 && !ocrWords.some(w => prodBrandText.includes(w))) return null;
    return ocrNameRaw;
  })();
  // When we arrived from a scan, the title is the exact query OpenAI handed to
  // Open Food Facts (brand + product) — shorter and truer to what was scanned
  // than OFF's often-verbose product_name. The brand is already shown in the
  // meta line above the title, so strip a leading brand to avoid repeating it.
  const openaiQuery = fromScan ? (sessionStorage.getItem("scan_openai_response") || "").trim() : "";
  const displayName = (() => {
    // Prefer the OpenAI-identified PRODUCT name (e.g. "Feastables Peanut Butter").
    // It's exactly what was handed to Open Food Facts (so it tracks the product
    // that came back), reads cleanly, and — unlike the brand+product query —
    // doesn't duplicate the brand already shown in the meta line above. This is
    // what avoids titles like "Mr Beast Feastables Peanut Butter".
    if (ocrName) return ocrName;
    // Fallback: the full OpenAI query, with a leading brand stripped so the title
    // is the product, not "Brand Product" (handles OFF's comma-joined brands and
    // "MrBeast" vs "Mr Beast" spacing).
    if (openaiQuery) return stripLeadingBrand(openaiQuery, product.brand) || openaiQuery;
    return cleanName || product.productName || "Unknown product";
  })();

  const hasScores = !!(ecoGrade || nutriGrade || product.novaGroup || welfareScore.score !== null);
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
  // OFF often lists several brands ("Feastables, MrBeast"); show just the primary
  // one in the meta line so it reads "Feastables · Snacks", not the whole list.
  const primaryBrand = (product.brand || "").split(",")[0].trim();
  const productMeta = [primaryBrand, category].filter(Boolean).join(" · ");

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
          background: "var(--ds-sticky-bg, rgba(241,235,221,0.94))",
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

      <main style={{ paddingBottom: 150, maxWidth: 560, margin: "0 auto", background: EDITORIAL.paper, minHeight: "100dvh" }}>

        <div ref={heroRef} style={{ position: "relative", height: 280, overflow: "hidden", background: `radial-gradient(ellipse at 50% 35%, color-mix(in srgb, ${vc.color} 26%, transparent) 0%, color-mix(in srgb, ${vc.color} 10%, transparent) 45%, ${EDITORIAL.page} 100%)` }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)", backgroundSize: "3px 3px", opacity: 0.55 }} />
          <div style={{
            position: "absolute", top: "calc(env(safe-area-inset-top, 0px) + 18px)", left: 16, zIndex: 2,
          }}>
            <BackButton
              variant="overlay"
              size={36}
              onClick={() => { if (fromScan) navigate("/scan"); else navigate(-1); }}
            />
          </div>
          <div style={{
            position: "absolute", top: "calc(env(safe-area-inset-top, 0px) + 20px)", right: 16,
            display: "inline-flex", alignItems: "center", gap: 8, zIndex: 2,
          }}>
            <button
              onClick={() => void shareProductCard({
                productName: displayName,
                brand: product.brand,
                score: product.ecoscoreScore,
                verdictLabel: vc.label,
              })}
              aria-label="Share this product"
              style={{
                width: 36, height: 36, borderRadius: 999,
                background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
                backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <Share2 style={{ width: 17, height: 17, color: EDITORIAL.ink }} />
            </button>
            <div style={{
              background: EDITORIAL.ink, color: EDITORIAL.card, padding: "8px 13px 8px 11px",
              borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 7,
              fontSize: 12, fontWeight: 800, letterSpacing: 0.3,
              boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: vc.color, boxShadow: `0 0 0 3px color-mix(in srgb, ${vc.color} 22%, transparent)` }} />
              {verdict.key}
            </div>
          </div>
          <div style={{
            position: "absolute", left: "50%", top: "50%",
            transform: mounted ? "translate(-50%, -50%) rotate(-5deg)" : "translate(-50%, -46%) rotate(-5deg)",
            width: 178, height: 218, borderRadius: 22,
            background: "rgba(255,255,255,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 30px 50px color-mix(in srgb, ${vc.color} 22%, transparent), inset 0 1px 0 rgba(255,255,255,0.35)`,
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}>
            {product.imageUrl ? (
              <img
                src={fullResOffImage(product.imageUrl) || product.imageUrl}
                alt={displayName}
                onError={(e) => {
                  // If the full-res variant is missing for this revision, drop
                  // back to the original (smaller) OFF URL so we still show a photo.
                  const img = e.currentTarget;
                  if (product.imageUrl && img.src !== product.imageUrl) {
                    img.src = product.imageUrl;
                  }
                }}
                style={{ maxWidth: "88%", maxHeight: "88%", objectFit: "contain", filter: "drop-shadow(0 18px 24px rgba(0,0,0,0.30))" }}
              />
            ) : (
              <Sprout style={{ width: 72, height: 72, color: "rgba(26,22,20,0.35)" }} />
            )}
          </div>
          <div style={{ position: "absolute", bottom: 12, left: 16, fontFamily: DS.mono, fontSize: 9, color: "rgba(26,22,20,0.42)", letterSpacing: 1 }}>
            {product.barcode}
          </div>
        </div>

        <div style={{ padding: "24px 22px 18px" }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: EDITORIAL.ink2 }}>
            {productMeta || "Product scan"}
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <h1 style={{ fontSize: "clamp(2.45rem, 11vw, 3.05rem)", lineHeight: 1, margin: "8px 0 0", letterSpacing: -1.5, color: EDITORIAL.ink, fontWeight: 700, flex: 1 }}>
              {title.first}
              {title.rest && <><br /><span style={{ fontStyle: "italic", color: EDITORIAL.ink2, fontWeight: 500 }}>{title.rest}.</span></>}
            </h1>
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexShrink: 0 }}>
              {product.brand && (
                <button
                  onClick={handleWatchlistToggle}
                  aria-label={brandWatched ? "Remove brand from watchlist" : "Watch this brand"}
                  style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: brandWatched ? EDITORIAL.redSoft : EDITORIAL.card,
                    color: brandWatched ? EDITORIAL.red : EDITORIAL.ink2,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    border: `1.5px solid ${brandWatched ? EDITORIAL.red : EDITORIAL.line}`,
                  }}
                >
                  <Eye style={{
                    width: 22, height: 22,
                    color: brandWatched ? EDITORIAL.red : EDITORIAL.ink2,
                    strokeWidth: brandWatched ? 2.4 : 1.9,
                  }} />
                </button>
              )}
              <button
                onClick={handleCartToggle}
                aria-label={inBasket ? "Remove from cart" : "Add to cart"}
                style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: inBasket ? EDITORIAL.greenSoft : EDITORIAL.card,
                  color: inBasket ? EDITORIAL.green : EDITORIAL.ink2,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  border: `1.5px solid ${inBasket ? EDITORIAL.green : EDITORIAL.line}`,
                }}
              >
                {inBasket ? <Check style={{ width: 22, height: 22 }} /> : <ShoppingCart style={{ width: 22, height: 22 }} />}
              </button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
            <Tag bg={vc.bg} color={vc.color}>{verdict.key[0] + verdict.key.slice(1).toLowerCase()}</Tag>
            {ecoGrade && <Tag bg={GRADE_BG[ecoGrade]} color={GRADE_COLOR[ecoGrade]}>Eco-Score {gradeLabel(ecoGrade)}</Tag>}
            {product.novaGroup !== null && <Tag bg="var(--ds-neutral-bg, #EDE6D2)" color={EDITORIAL.ink2}>{NOVA_LABEL[product.novaGroup] || `NOVA ${product.novaGroup}`}</Tag>}
            {verifiedEthics && verifiedEthics.certifications.map(cert => {
              const badge = CERTIFICATION_BADGES[cert];
              return <Tag key={cert} bg={badge.bg} color={badge.color}>{badge.shortLabel}</Tag>;
            })}
          </div>
        </div>

        <div style={{ padding: "0 22px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          {(dietaryCheck.conflicts.length > 0 || showDietaryNoData) && (
            <DietaryConflictBanner check={dietaryCheck} />
          )}
          {brandWatched && product.brand && (
            <div style={{
              background: EDITORIAL.redSoft, borderRadius: 14, padding: "12px 14px",
              display: "flex", gap: 10, alignItems: "center",
              border: `1px solid color-mix(in srgb, ${EDITORIAL.red} 22%, transparent)`,
            }}>
              <Eye style={{
                width: 18, height: 18, color: EDITORIAL.red,
                strokeWidth: 2.2, flexShrink: 0,
              }} />
              <div style={{ fontSize: 12.5, color: EDITORIAL.ink, lineHeight: 1.4 }}>
                On your watchlist. You asked to be reminded about <strong style={{ fontWeight: 800 }}>{product.brand}</strong>.
              </div>
            </div>
          )}
          {(() => {
            // The headline verdict callout takes its colour from the verdict itself,
            // so a positive "Buy" reads green (matching the rest of the site) instead
            // of the caution-brown it used to hard-code for every verdict.
            const VIcon = vc.Icon;
            return (
              <div style={{
                background: vc.bg, borderRadius: 14, padding: "14px 16px",
                display: "flex", gap: 12, alignItems: "flex-start",
                border: `1px solid color-mix(in srgb, ${vc.color} 22%, transparent)`,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 99, background: vc.color, color: EDITORIAL.card,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, marginTop: 1,
                }}>
                  <VIcon style={{ width: 13, height: 13 }} />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: EDITORIAL.ink, lineHeight: 1.3 }}>
                    {primaryAlert}
                  </div>
                  {verdict.reason !== primaryAlert && (
                    <div style={{ fontSize: 12, color: EDITORIAL.ink2, marginTop: 3, lineHeight: 1.4 }}>
                      {verdict.reason}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          {verifiedEthics && (() => {
            const categoryLabel = CATEGORY_LABELS[verifiedEthics.category] || verifiedEthics.category;
            const certText = verifiedEthics.certifications.map(c => CERTIFICATION_BADGES[c].shortLabel).join(", ");
            return (
              <div style={{
                background: EDITORIAL.greenSoft, borderRadius: 14, padding: "14px 16px",
                display: "flex", gap: 12, alignItems: "flex-start",
                border: `1px solid rgba(31,107,78,0.2)`,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 99, background: EDITORIAL.green, color: EDITORIAL.card,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, marginTop: 1,
                }}>
                  <Check style={{ width: 13, height: 13 }} />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: EDITORIAL.ink, lineHeight: 1.3 }}>
                    {verifiedEthics.brandName} — {certText}
                  </div>
                  <div style={{ fontSize: 12, color: EDITORIAL.ink2, marginTop: 3, lineHeight: 1.4 }}>
                    {categoryLabel} · Verified ethical certifications and sourcing practices
                  </div>
                </div>
              </div>
            );
          })()}
          {chocolateEntry && (chocolateEntry.verdict === "leader" || chocolateEntry.verdict === "better") && (
            // Surface a strong ethical performer (Chocolate Scorecard leader/better)
            // right up top, next to the verdict — not buried in the Ethics section.
            <div style={{
              background: EDITORIAL.greenSoft, borderRadius: 14, padding: "14px 16px",
              display: "flex", gap: 12, alignItems: "flex-start",
              border: `1px solid rgba(31,107,78,0.2)`,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 99, background: EDITORIAL.green, color: EDITORIAL.card,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginTop: 1,
              }}>
                <Check style={{ width: 13, height: 13 }} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: EDITORIAL.ink, lineHeight: 1.3 }}>
                  {chocolateEntry.name} — Chocolate Scorecard {VERDICT_META[chocolateEntry.verdict].label}
                </div>
                <div style={{ fontSize: 12, color: EDITORIAL.ink2, marginTop: 3, lineHeight: 1.4 }}>
                  {chocolateEntry.note}
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
              onClick={() => setShowCandidates(true)}
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
                  <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Wrong product?</p>
                  <p style={{ fontSize: 12, color: EDITORIAL.ink2, margin: "2px 0 0" }}>{candidates.length > 0 ? "Select the correct product or search manually" : "Search for the correct product"}</p>
                </div>
                <button
                  type="button" onClick={() => { setShowCandidates(false); setShowManualSearch(false); }}
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
                      borderBottom: `1px solid ${EDITORIAL.line}`,
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
                      }}>{gradeLabel(g)}</span>
                    )}
                    <ChevronRight style={{ width: 14, height: 14, color: EDITORIAL.ink3, flexShrink: 0 }} />
                  </button>
                );
              })}
              {/* Manual search input */}
              <div style={{ padding: "12px 16px", borderTop: candidates.length === 0 ? "none" : undefined }}>
                {!showManualSearch ? (
                  <button
                    type="button"
                    onClick={() => setShowManualSearch(true)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      padding: "10px 14px", background: EDITORIAL.paper, border: `1px solid ${EDITORIAL.line}`,
                      borderRadius: 12, cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, color: EDITORIAL.ink2,
                    }}
                  >
                    <Search style={{ width: 14, height: 14 }} />
                    Search for a different product
                  </button>
                ) : (
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleManualProductSearch(); }}
                    style={{ display: "flex", gap: 8 }}
                  >
                    <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
                      <Search size={14} style={{ position: "absolute", left: 12, color: EDITORIAL.ink3, pointerEvents: "none" }} />
                      <input
                        autoFocus
                        type="text"
                        value={manualSearchInput}
                        onChange={e => setManualSearchInput(e.target.value)}
                        placeholder="e.g. Coca-Cola, Weetbix…"
                        style={{
                          width: "100%", height: 42, border: `1.5px solid ${EDITORIAL.line}`,
                          borderRadius: 12, backgroundColor: EDITORIAL.paper,
                          fontSize: "0.88rem", padding: "0 12px 0 36px", outline: "none",
                          color: EDITORIAL.ink, boxSizing: "border-box",
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!manualSearchInput.trim() || manualSearchLoading}
                      style={{
                        height: 42, borderRadius: 12, border: "none",
                        backgroundColor: manualSearchInput.trim() ? EDITORIAL.ink : EDITORIAL.paper,
                        color: manualSearchInput.trim() ? "#fff" : EDITORIAL.ink3,
                        fontWeight: 700, fontSize: "0.85rem", padding: "0 16px",
                        cursor: manualSearchInput.trim() && !manualSearchLoading ? "pointer" : "not-allowed",
                        flexShrink: 0,
                      }}
                    >
                      {manualSearchLoading ? <Loader2 size={14} style={{ animation: "off-spin 0.7s linear infinite" }} /> : "Go"}
                    </button>
                  </form>
                )}
              </div>
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
                  value={gradeLabel(ecoGrade)}
                  color={GRADE_COLOR[ecoGrade] ?? EDITORIAL.ink3}
                  percent={GRADE_PERCENT[ecoGrade] ?? 0.5}
                  label="Eco-Score"
                  sublabel={product.ecoscoreScore !== null ? `${product.ecoscoreScore}/100` : undefined}
                  delay={0}
                />
              )}
              {nutriGrade && ["a", "b", "c", "d", "e"].includes(nutriGrade) && (
                <ScoreGauge
                  value={gradeLabel(nutriGrade)}
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
              {welfareScore.score !== null && (
                <ScoreGauge
                  value={String(welfareScore.score)}
                  color={welfareScoreColor(welfareScore.score)}
                  percent={welfareScore.score / 100}
                  label="Welfare"
                  sublabel={welfareScore.band ?? undefined}
                  delay={450}
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
                          <div style={{ fontFamily: DS.mono, fontSize: 12, color: EDITORIAL.ink2, letterSpacing: 0.2 }}>{val.toFixed(2)} <span style={{ color: EDITORIAL.ink3 }}>kg</span></div>
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
              <div style={{ marginTop: 14, background: EDITORIAL.card, border: `1px solid ${EDITORIAL.line}`, borderRadius: 22, padding: "8px 20px 22px" }}>
                {verifiedEthics.highlights.map((h, i) => {
                  const certBadge = h.certification ? CERTIFICATION_BADGES[h.certification] : null;
                  return (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "46px 1fr", gap: 14, padding: "18px 0", borderTop: `1px solid ${EDITORIAL.line}` }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {certBadge ? (
                          <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: EDITORIAL.greenSoft,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 900, color: EDITORIAL.green,
                          }}>{certBadge.icon}</div>
                        ) : (
                          <CheckCircle2 style={{ width: 22, height: 22, color: EDITORIAL.green }} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 19, lineHeight: 1.15, color: EDITORIAL.ink, letterSpacing: -0.3, fontWeight: 700 }}>{h.label}</div>
                        <div style={{ fontSize: 12.5, color: EDITORIAL.ink2, marginTop: 6, lineHeight: 1.45 }}>{h.detail}</div>
                        <a href={h.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: EDITORIAL.green, marginTop: 8, display: "flex", alignItems: "center", gap: 4, fontWeight: 700, textDecoration: "none" }}>
                          <ExternalLink style={{ width: 10, height: 10 }} /> {h.source}
                        </a>
                      </div>
                    </div>
                  );
                })}
                <div style={{ fontStyle: "italic", fontSize: 12, color: EDITORIAL.ink3, marginTop: 16, lineHeight: 1.4, borderTop: `1px solid ${EDITORIAL.line}`, paddingTop: 14 }}>
                  Certifications reduce risk; they do not guarantee a supply chain free of abuse. Re-verify against cited sources.
                </div>
              </div>
            )}
            {chocolateEntry && (() => {
              const tone: Record<ChocolateVerdict, { color: string; soft: string }> = {
                avoid:   { color: EDITORIAL.red,   soft: EDITORIAL.redSoft },
                caution: { color: EDITORIAL.amber, soft: EDITORIAL.amberSoft },
                better:  { color: EDITORIAL.green, soft: EDITORIAL.greenSoft },
                leader:  { color: EDITORIAL.green, soft: EDITORIAL.greenSoft },
              };
              const t = tone[chocolateEntry.verdict];
              const positive = chocolateEntry.verdict === "better" || chocolateEntry.verdict === "leader";
              return (
                <div style={{ marginTop: 14, background: EDITORIAL.card, border: `1px solid ${EDITORIAL.line}`, borderRadius: 22, padding: "18px 20px", display: "grid", gridTemplateColumns: "46px 1fr", gap: 14, alignItems: "start" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: t.soft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {positive
                        ? <CheckCircle2 style={{ width: 20, height: 20, color: t.color }} />
                        : <AlertTriangle style={{ width: 20, height: 20, color: t.color }} />}
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 19, lineHeight: 1.15, color: EDITORIAL.ink, letterSpacing: -0.3, fontWeight: 700 }}>{chocolateEntry.name}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: t.color, background: t.soft, border: `1px solid ${t.color}`, borderRadius: 999, padding: "2px 9px" }}>
                        {VERDICT_META[chocolateEntry.verdict].label}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: EDITORIAL.ink3, marginTop: 4, letterSpacing: 0.3 }}>Chocolate Scorecard verdict</div>
                    <div style={{ fontSize: 12.5, color: EDITORIAL.ink2, marginTop: 8, lineHeight: 1.45 }}>{chocolateEntry.note}</div>
                    <div style={{ fontSize: 12, color: EDITORIAL.ink3, marginTop: 8, lineHeight: 1.45 }}>
                      <span style={{ fontWeight: 700, color: EDITORIAL.ink2 }}>Cocoa sourcing: </span>{chocolateEntry.sourcing}
                    </div>
                    <button onClick={() => navigate("/chocolate")} style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", fontSize: 11, color: t.color, marginTop: 10, display: "flex", alignItems: "center", gap: 4, fontWeight: 700, fontFamily: DS.font }}>
                      View the full Chocolate Directory →
                    </button>
                  </div>
                </div>
              );
            })()}
            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              {boycottMatch && (
                <div style={{ background: EDITORIAL.card, border: `1px solid ${EDITORIAL.line}`, borderRadius: 22, padding: "18px 20px", display: "grid", gridTemplateColumns: "46px 1fr", gap: 14, alignItems: "start" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: EDITORIAL.amberSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <AlertTriangle style={{ width: 20, height: 20, color: EDITORIAL.amber }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 19, lineHeight: 1.15, color: EDITORIAL.ink, letterSpacing: -0.3, fontWeight: 700 }}>{boycottMatch.parent} — Boycott listed</div>
                    <div style={{ fontSize: 12.5, color: EDITORIAL.ink2, marginTop: 6, lineHeight: 1.45 }}>{boycottMatch.reason}</div>
                    <a href="https://boycott-israel.org/boycott.html" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: EDITORIAL.amber, marginTop: 8, display: "flex", alignItems: "center", gap: 4, fontWeight: 700, textDecoration: "none" }}>
                      <ExternalLink style={{ width: 10, height: 10 }} /> Read more
                    </a>
                  </div>
                </div>
              )}
              {welfare.isFlagged && <AnimalWelfareFlagBadge brand={product.brand} showDetails={true} />}
              <EggChickenWelfareCard brand={product.brand} />
              <BeefWelfareCard brand={product.brand} />
              <SugarIndustryCard brand={product.brand} />
              <CommoditySupplyChainCard brand={product.brand} />
            </div>
          </section>

          {/* Better swaps — reason-aware ethical alternatives */}
          <section ref={swapsRef} style={{ scrollMarginTop: 80, opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(10px)", transition: "all 0.5s ease 0.45s" }}>
            <SwapSuggestions product={product} onAvailabilityChange={setSwapsAvailable} />
          </section>

          {(() => {
            const ingredientFlags = findIngredientFlagsInText(product.ingredientsText);
            // Brands with a strong, verified ethical rating already account for
            // responsible sourcing of their headline commodity, so a generic
            // commodity-level warning their rating directly contradicts would be
            // misleading. Chocolate Scorecard "leader"/"better" brands and
            // verified-ethics chocolate brands suppress the cocoa concern.
            const ethicalChocolateLeader =
              verifiedEthics?.category === "chocolate" ||
              chocolateEntry?.verdict === "leader" ||
              chocolateEntry?.verdict === "better";
            const visibleFlags = ethicalChocolateLeader
              ? ingredientFlags.filter(f => f.id !== "cocoa-child-labour-west-africa")
              : ingredientFlags;
            if (visibleFlags.length === 0) return null;
            return (
              <section style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(10px)", transition: "all 0.5s ease 0.5s" }}>
                <SectionHead num="04" title="Ingredient concerns" kicker="Detected from the ingredient list." />
                <IngredientConcernsCard flags={visibleFlags} />
              </section>
            );
          })()}

          {(() => {
            const threatened = product.ecoscoreData?.adjustments?.threatened_species;
            if (!threatened?.ingredient) return null;
            const ingredientRaw = threatened.ingredient.replace(/^en:/, "").replace(/-/g, " ");
            const isPalmOil = ingredientRaw.toLowerCase().includes("palm");
            const explanation = isPalmOil
              ? "Palm oil is the #1 driver of tropical deforestation. Its cultivation destroys critical habitat for orangutans, pygmy elephants, and Sumatran tigers."
              : `${ingredientRaw} production is linked to habitat destruction in biodiversity hotspots.`;
            return (
              <section style={{
                opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(10px)",
                transition: "all 0.5s ease 0.55s",
              }}>
                <SectionHead num="05" title="Threatened species" />
                <div style={{ background: EDITORIAL.card, border: `1px solid ${EDITORIAL.line}`, borderRadius: 22, padding: "8px 20px 22px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "46px 1fr", gap: 14, padding: "18px 0", borderTop: `1px solid ${EDITORIAL.line}` }}>
                    <div>
                      <PawPrint style={{ width: 22, height: 22, color: EDITORIAL.ink }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 19, lineHeight: 1.15, color: EDITORIAL.ink, letterSpacing: -0.3, fontWeight: 700 }}>
                        Contains {ingredientRaw}
                      </div>
                      <div style={{ fontSize: 12.5, color: EDITORIAL.ink2, marginTop: 6, lineHeight: 1.45 }}>
                        {explanation}
                      </div>
                      <div style={{ fontSize: 11, color: EDITORIAL.ink3, marginTop: 8, fontWeight: 700 }}>
                        Open Food Facts Ecoscore
                      </div>
                    </div>
                  </div>
                  <div style={{ fontStyle: "italic", fontSize: 12, color: EDITORIAL.ink3, marginTop: 16, lineHeight: 1.4, borderTop: `1px solid ${EDITORIAL.line}`, paddingTop: 14 }}>
                    Ingredient linked to habitat loss for threatened species.
                  </div>
                </div>
              </section>
            );
          })()}

          <section style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(10px)", transition: "all 0.5s ease 0.6s" }}>
            <SectionHead num="06" title="Materials & logistics" />
            <div style={{ display: "grid", gap: 10 }}>
              {[
                { icon: <Package style={{ width: 17, height: 17 }} />, label: "Packaging", value: packagingSummary(product), impact: product.ecoscoreData?.adjustments?.packaging?.value != null ? `${product.ecoscoreData.adjustments.packaging.value} pts` : "Unknown", bad: (product.ecoscoreData?.adjustments?.packaging?.value ?? 0) < 0 },
                { icon: <Truck style={{ width: 17, height: 17 }} />, label: "Transport origin", value: product.origins || "Manufacturer undisclosed", impact: product.ecoscoreData?.adjustments?.origins_of_ingredients?.value != null ? `${product.ecoscoreData.adjustments.origins_of_ingredients.value} pts` : "Unknown", bad: (product.ecoscoreData?.adjustments?.origins_of_ingredients?.value ?? 0) < 0 },
                { icon: <BadgeCheck style={{ width: 17, height: 17 }} />, label: "Certifications", value: product.labels.length ? product.labels.slice(0, 3).map(cleanLabel).join(", ") : "None found", impact: product.labels.length ? `${product.labels.length} mark${product.labels.length > 1 ? "s" : ""}` : "None", bad: false },
              ].map(item => (
                <div key={item.label} style={{ padding: "16px 14px 16px 18px", background: EDITORIAL.card, border: `1px solid ${EDITORIAL.line}`, borderRadius: 18, display: "flex", alignItems: "center", gap: 12, overflow: "hidden" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: EDITORIAL.paper, display: "flex", alignItems: "center", justifyContent: "center", color: EDITORIAL.ink, flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: EDITORIAL.ink }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: EDITORIAL.ink2, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.value}</div>
                  </div>
                  <span style={{ flexShrink: 0 }}>
                    <Tag bg={item.bad ? EDITORIAL.redSoft : item.impact === "Unknown" || item.impact === "None" ? "var(--ds-neutral-bg, #EDE6D2)" : EDITORIAL.greenSoft} color={item.bad ? EDITORIAL.red : item.impact === "Unknown" || item.impact === "None" ? EDITORIAL.ink2 : EDITORIAL.green}>{item.impact}</Tag>
                  </span>
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

          {/* The Buy/Skip decision now lives in the fixed DecisionBar below. */}

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

      {/* Fixed buy/skip decision — the page's primary call to action. */}
      <DecisionBar
        product={product}
        verdictKey={verdict.key}
        onSeeBetter={scrollToSwaps}
        hasSwaps={swapsAvailable === true}
        openaiResponse={fromScan ? sessionStorage.getItem("scan_openai_response") : null}
        fullOpenaiResponse={fromScan ? sessionStorage.getItem("scan_full_openai_response") : null}
        capturedImage={fromScan ? sessionStorage.getItem("scan_image") : null}
      />

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

// Exported for the verdict-page audit harness (src/test/verdictPageAudit.test.ts),
// which runs the real page logic across hundreds of synthetic products.
export function getVerdict(product: OpenFoodFactsResult, priorities: UserPriorities) {
  const grade = product.ecoscoreGrade?.toLowerCase();
  const score = product.ecoscoreScore;
  const laborRecord = findLaborAllegations(product);
  const laborCount = laborRecord?.allegations.length || 0;
  const envWeight = priorityMultiplier(priorities.environment);
  const laborWeight = priorityMultiplier(priorities.laborRights);
  const animalWeight = priorityMultiplier(priorities.animalWelfare);

  const scoreLabel = grade
    ? `Eco-Score ${gradeLabel(grade)}`
    : score !== null && score !== undefined
    ? `Eco-Score ${score}/100`
    : "No eco-score data";

  let key = "UNKNOWN";
  let reason = "No eco-score data available";

  // Environment only shapes the verdict to the extent the user prioritises it.
  // The lowest level is "Low" (weight 0.3), so a poor eco-grade is softened to a
  // gentle nudge for those users (see the grade branches below) rather than
  // sinking the verdict; the concerns they *do* prioritise (labour, boycott,
  // animal welfare, nutrition) adjust it afterwards.
  if (grade === "a-plus" || grade === "a" || grade === "b") {
    key = "BUY"; reason = `${scoreLabel} — excellent environmental credentials`;
  } else if (grade === "c") {
    if (envWeight >= 2.0) { key = "CAUTION"; reason = `${scoreLabel} — moderate impact (environment is a top priority for you)`; }
    else if (envWeight >= 1.0) { key = "CONSIDER"; reason = `${scoreLabel} — moderate environmental impact (eco matters to you)`; }
    else { key = "CONSIDER"; reason = `${scoreLabel} — moderate environmental impact`; }
  } else if (grade === "d") {
    if (envWeight >= 1.0) { key = "CAUTION"; reason = `${scoreLabel} — high environmental impact`; }
    else { key = "CONSIDER"; reason = `${scoreLabel} — high environmental impact (environment is not a priority for you)`; }
  } else if (grade === "e" || grade === "f") {
    if (envWeight >= 1.0) { key = "AVOID"; reason = `${scoreLabel} — very high environmental impact`; }
    else { key = "CONSIDER"; reason = `${scoreLabel} — very high environmental impact (environment is not a priority for you)`; }
  } else if (score !== null && score !== undefined) {
    const good = 60 + (envWeight - 1) * 20;
    const mod  = 40 + (envWeight - 1) * 15;
    const caut = 20 + (envWeight - 1) * 10;
    if (score >= good)      { key = "BUY";     reason = `${scoreLabel} — strong eco credentials`; }
    else if (score >= mod)  { key = "CONSIDER"; reason = `${scoreLabel} — moderate impact`; }
    else if (score >= caut) { key = "CAUTION";  reason = `${scoreLabel} — elevated impact`; }
    else                    { key = "AVOID";    reason = `${scoreLabel} — very high impact`; }
  }

  if (laborCount > 0 && laborWeight > 0) {
    const eff = laborCount * laborWeight;
    if (eff >= 2.0 || (laborCount >= 3 && laborWeight >= 0.35)) {
      key = "AVOID"; reason = `${laborCount} labor/human rights allegations against ${laborRecord!.parentCompany}`;
    } else if (eff >= 1.0 && (key === "BUY" || key === "CONSIDER" || key === "UNKNOWN")) {
      key = "CAUTION"; reason = `${laborCount} labor allegations against ${laborRecord!.parentCompany}`;
    } else if (eff >= 0.35 && (key === "BUY" || key === "UNKNOWN")) {
      key = "CONSIDER"; reason = `${laborCount} labor allegation${laborCount > 1 ? "s" : ""} against ${laborRecord!.parentCompany}`;
    }
  }

  const boycott = checkBoycott(product.brand);
  if (boycott && laborWeight > 0) {
    if (laborWeight >= 2.0 && (key === "BUY" || key === "CONSIDER")) {
      key = "CAUTION"; reason = `${boycott.parent} is on the BDS boycott list`;
    } else if (key === "BUY") {
      key = "CONSIDER"; reason = `${boycott.parent} is on the BDS boycott list`;
    }
  }

  const welfare = checkAnimalWelfareFlag(product.brand);
  if (welfare.isFlagged && animalWeight > 0) {
    if (welfare.severity === "critical") {
      if (animalWeight >= 2.0 && (key === "BUY" || key === "CONSIDER" || key === "UNKNOWN")) {
        key = "AVOID"; reason = `${welfare.company!.companyName} has critical animal welfare concerns`;
      } else if (key === "BUY" || key === "CONSIDER" || key === "UNKNOWN") {
        key = "CAUTION"; reason = `${welfare.company!.companyName} has critical animal welfare concerns`;
      }
    } else if (welfare.severity === "high") {
      if (animalWeight >= 2.0 && (key === "BUY" || key === "CONSIDER" || key === "UNKNOWN")) {
        key = "CAUTION"; reason = `${welfare.company!.companyName} has animal welfare concerns`;
      } else if (animalWeight > 0 && (key === "BUY" || key === "UNKNOWN")) {
        key = "CONSIDER"; reason = `${welfare.company!.companyName} has animal welfare concerns`;
      }
    }
  }

  // Nutrition is no longer a user-selectable priority, so a poor Nutri-Score no
  // longer flips the top-line verdict. It still appears in the numeric score
  // breakdown, but it never drives the Buy/Consider/Avoid decision or its reason.

  // Positive ethics is a real UPWARD force — symmetric to the penalties above.
  // A verified ethical brand or a Chocolate Scorecard "leader"/"better" (e.g.
  // Tony's Chocolonely) lifts the verdict in proportion to how much the shopper
  // prioritises ethics, so a great-ethics / poor-carbon product isn't stranded
  // at AVOID when ethics is exactly what they care about. Only applied when no
  // live concern fired (a boycott or real allegation always wins).
  const ethics = findVerifiedEthics(product.brand, product.productName);
  const choc = findChocolateEntry(product.brand, product.productName);
  const ethicalLeader = !!ethics || choc?.verdict === "leader" || choc?.verdict === "better";
  const cleanRecord = laborCount === 0 && !boycott && !(welfare.isFlagged && (welfare.severity === "critical" || welfare.severity === "high"));
  if (ethicalLeader && cleanRecord && laborWeight > 0) {
    const who = ethics?.brandName || choc?.name || product.brand || "This brand";
    // A full verb phrase so every reason reads naturally.
    const standing = ethics
      ? "has verified ethical certifications"
      : `is a Chocolate Scorecard ${choc?.verdict === "leader" ? "leader" : "standout"}`;
    if (laborWeight >= 5) {
      // Ethics is the shopper's top priority — let it carry the verdict.
      key = "BUY"; reason = `${who} ${standing} — your top priority`;
    } else if (laborWeight >= 1) {
      if (key === "AVOID" || key === "CAUTION") { key = "CONSIDER"; reason = `${who} ${standing} (offsets a weak eco-score)`; }
      else if (key === "CONSIDER" || key === "UNKNOWN") { key = "BUY"; reason = `${who} ${standing}`; }
    } else if (key === "AVOID") {
      key = "CAUTION"; reason = `${who} ${standing}, though environmental impact is high`;
    }
  }

  // The user's personal watchlist stance has the final say — it overrides the
  // data-driven verdict for their own view (avoid sinks it, trust lifts it).
  const sentiment = getBrandSentiment(product.brand);
  if (sentiment === "avoid") {
    key = "AVOID";
    reason = `You marked ${product.brand} as a brand to avoid`;
  } else if (sentiment === "trust") {
    key = "BUY";
    reason = `You marked ${product.brand} as a brand you trust`;
  }

  return { key, reason };
}
