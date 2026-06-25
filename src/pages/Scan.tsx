import { useState, useRef, useCallback, useEffect } from "react";
import { lookupHardcodedBarcodes, lookupHardcodedImage } from "@/data/productBarcodeMap";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Camera, Upload, Search, Loader2, AlertCircle, AlertTriangle, RefreshCw, X, ScanLine, Image as ImageIcon, Plus, Leaf, BarChart3, QrCode, Settings, Users, Heart, Apple, ChevronRight, Check, Zap } from "lucide-react";
import { useBottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { Input } from "@/components/ui/input";
import { CalAIButton, ButtonGroup } from "@/components/CalAIButton";
import { AlertBox, AlertList } from "@/components/AlertBox";
import { StatsDisplay } from "@/components/StatsDisplay";
import { ProductCard } from "@/components/ProductCard";
import { OpenFoodFactsCard } from "@/components/OpenFoodFactsCard";
import { EnvironmentalImpactCard } from "@/components/EnvironmentalImpactCard";
import { ScoreBreakdownSlider } from "@/components/ScoreBreakdownSlider";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/useProducts";
import type { Product } from "@/data/products";
import { calculateScore, findLowCO2Alternative } from "@/data/products";
import { recognizeImageWithOpenAI } from "@/services/ocr/openai-service";
import { advancedProductOCR } from "@/services/ocr/advanced-openai-ocr";
import { copySingleProductCode } from "@/utils/productExporter";
import { loadPriorities, DEFAULT_PRIORITIES, hasSavedPriorities, type UserPriorities } from "@/utils/userPreferences";
import { lookupBarcode, isValidBarcode, searchProducts as searchOffProducts, searchVisualCandidates, imageQualityTier } from "@/services/openfoodfacts";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import { DS } from "@/styles/design-tokens";
import { getBackendUrl } from "@/config/backend";
import { pickBestMatch, validateBarcodeResult, scoreRelevance, hasUsableBrandAnchor, type MatchResult } from "@/utils/productRelevance";
import { logScan } from "@/utils/scanLogger";
import { pickVisualBestCandidate, type VisualPick } from "@/services/visualMatch";

/** Ask OpenAI to fix typos and clean up a user-typed product query */
const fixProductQuery = async (raw: string): Promise<string> => {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/openai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: 'fix-product-query', userMessage: raw }),
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return raw;
    const data = await response.json();
    if (data.success && data.content?.trim()) {
      const fixed = data.content.trim();
      console.log(`🤖 [AI] "${raw}" → "${fixed}"`);
      return fixed;
    }
  } catch {
    // Timeout or error — just use the raw query
  }
  return raw;
};

// Check if a product has an eco-score grade
const hasEcoScore = (product: OpenFoodFactsResult): boolean => {
  return !!product.ecoscoreGrade;
};

// Function to calculate ecological data completeness score
const calculateEcoScore = (result: OpenFoodFactsResult): number => {
  let score = 0;
  
  // Eco-Score data (most important)
  if (result.ecoscoreGrade) score += 20;
  if (result.ecoscoreScore !== null) score += 10;
  
  // Carbon footprint data
  if (result.carbonFootprint100g !== null) score += 15;
  if (result.carbonFootprintProduct !== null) score += 10;
  if (result.carbonFootprintServing !== null) score += 10;
  
  // Eco-Score adjustments (very important for detailed breakdown)
  const adjustments = result.ecoscoreData?.adjustments;
  if (adjustments) {
    if (adjustments.packaging?.value !== undefined) score += 15;
    if (adjustments.origins_of_ingredients?.value !== undefined) score += 15;
    if (adjustments.threatened_species?.value !== undefined) score += 10;
    if (adjustments.production_system?.value !== undefined) score += 10;
  }
  
  // Agribalyse data (CO2 lifecycle breakdown)
  const agri = result.ecoscoreData?.agribalyse;
  if (agri) {
    if (agri.co2_total !== undefined) score += 20;
    if (agri.co2_agriculture !== undefined) score += 5;
    if (agri.co2_processing !== undefined) score += 5;
    if (agri.co2_packaging !== undefined) score += 5;
    if (agri.co2_transportation !== undefined) score += 5;
    if (agri.co2_distribution !== undefined) score += 5;
    if (agri.co2_consumption !== undefined) score += 5;
  }
  
  // Additional data
  if (result.nutriscoreGrade) score += 5;
  if (result.novaGroup !== null) score += 5;
  if (result.labels && result.labels.length > 0) score += 5;
  if (result.origins) score += 5;
  if (result.imageUrl) score += 5;
  
  return score;
};

// Simple Levenshtein distance for fuzzy matching
const levenshtein = (a: string, b: string): number => {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1]
        : 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
    }
    prev = curr;
  }
  return prev[n];
};

// Character-level similarity between a query and an OFF result (0–1).

/**
 * Check if a product result contains at least one significant word from the query.
 * Prevents random/unrelated products while being lenient enough for OCR typos.
 *
 * Uses WORD BOUNDARIES, not substring. Substring matching is wrong here:
 *   query "Ben" should NOT match "jben jaouda" (Moroccan yogurt), but
 *   `pText.includes("ben")` is true because "jben" contains "ben" as a substring.
 * Fuzzy whole-word matching still handles OCR typos.
 */
const resultContainsQueryWord = (query: string, productText: string): boolean => {
  const qWords = query.toLowerCase().split(/[\s\-_,/&().]+/).filter(w => w.length >= 3);
  if (qWords.length === 0) return true;
  const pText = productText.toLowerCase();
  const pWords = pText.split(/[\s\-_,/&().]+/).filter(w => w.length >= 2);
  return qWords.some(qw => {
    const escaped = qw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wholeWord = new RegExp(`\\b${escaped}\\b`, 'i');
    if (wholeWord.test(pText)) return true;
    // OCR-typo tolerance: fuzzy match against whole words, not substrings.
    return fuzzyWordMatch(qw, pWords);
  });
};

/**
 * Clean an OCR query string for better search results.
 * - Strips numbers with units (500g, 250ml, 1.5L, 12oz, etc.)
 * - Strips standalone numbers
 * - Deduplicates words (case-insensitive, keeps first occurrence)
 * - Normalises whitespace
 */
const cleanOCRQuery = (raw: string): string => {
  let q = raw
    // Remove numbers with units: 500g, 250ml, 1.5L, 12oz, 100%, 330cl etc.
    .replace(/\d+[\.,]?\d*\s*(g|kg|mg|ml|l|cl|oz|fl\.?\s*oz|lb|lbs|liter|litre|%)\b/gi, ' ')
    // Remove standalone numbers
    .replace(/\b\d+\b/g, ' ')
    // Normalise whitespace
    .replace(/\s+/g, ' ')
    .trim();
  // Deduplicate words (case-insensitive, keep first occurrence)
  const seen = new Set<string>();
  q = q.split(' ').filter(w => {
    const lower = w.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  }).join(' ');
  return q;
};

// Check if a query word fuzzy-matches any word in the haystack
const fuzzyWordMatch = (queryWord: string, haystackWords: string[]): boolean => {
  // Allow up to ~25% edit distance (1 for short words, 2 for longer)
  const maxDist = queryWord.length <= 5 ? 1 : 2;
  return haystackWords.some(hw => {
    if (hw.includes(queryWord) || queryWord.includes(hw)) return true;
    if (Math.abs(hw.length - queryWord.length) > maxDist) return false;
    return levenshtein(queryWord, hw) <= maxDist;
  });
};

// Compute how relevant a product is to the query (0–1).
// Weighted by word length so short noise words don't dominate.
// Uses fuzzy matching to handle typos (e.g. "tkais" → "takis").
const computeRelevance = (result: OpenFoodFactsResult, words: string[]): number => {
  if (words.length === 0) return 0;
  const haystack = `${(result.productName || '').toLowerCase()} ${(result.brand || '').toLowerCase()}`;
  const haystackWords = haystack.split(/[\s\-_,/&().]+/).filter(w => w.length >= 2);
  let matchedWeight = 0;
  let totalWeight = 0;
  for (const w of words) {
    const weight = w.length;
    totalWeight += weight;
    if (haystack.includes(w) || fuzzyWordMatch(w, haystackWords)) {
      matchedWeight += weight;
    }
  }
  return totalWeight > 0 ? matchedWeight / totalWeight : 0;
};

// Function to filter and select best products
const filterBestProducts = (results: OpenFoodFactsResult[], query?: string): OpenFoodFactsResult[] => {
  let pool = results;

  if (query && query.trim()) {
    // Only keep words ≥3 chars to avoid single-letter noise matching
    const words = query.trim().toLowerCase().split(/[\s\-_]+/).filter(w => w.length >= 3);

    if (words.length > 0) {
      const scored = results.map(r => ({
        result: r,
        relevance: computeRelevance(r, words),
        ecoScore: calculateEcoScore(r),
      }));

      // Brand-priority filter: if the query has multiple words and the first word
      // matches a brand field in some results, restrict the pool to those.
      // Skip for single-word queries — the word is likely the product name, not brand.
      let searchPool = scored;
      if (words.length >= 2) {
        const queryBrand = words[0];
        const brandMatches = scored.filter(s =>
          (s.result.brand || '').toLowerCase().split(/[\s,/&]+/).some(bw =>
            bw.length >= 3 && (bw === queryBrand || bw.startsWith(queryBrand) || queryBrand.startsWith(bw))
          )
        );
        if (brandMatches.length >= 1) searchPool = brandMatches;
      }

      // Require relevance: for multi-word, 40% is fine. For single-word, require
      // the word to appear somewhere in the product name or brand (relevance > 0).
      const MIN_RELEVANCE = words.length === 1 ? 0.5 : 0.4;

      const relevant = searchPool.filter(s => s.relevance >= MIN_RELEVANCE);

      // If nothing clears the strict bar, fall back to any product that matches
      // at least one of the longer words (≥4 chars), ranked by how many match.
      const fallback = relevant.length === 0
        ? searchPool.filter(s => s.relevance > 0 && words.some(w => w.length >= 4 &&
            `${(s.result.productName || '').toLowerCase()} ${(s.result.brand || '').toLowerCase()}`.includes(w)))
        : [];

      const candidates = relevant.length > 0 ? relevant : fallback;

      // Word-containment gate: product must contain at least one word from the query
      // to prevent completely unrelated results (e.g. from API errors).
      const q = query.trim();
      const charFiltered = candidates.filter(s => {
        const offText = [s.result.productName, s.result.brand].filter(Boolean).join(' ');
        const passes = resultContainsQueryWord(q, offText);
        if (!passes) {
          console.log(`   [wordGate] REJECTED "${offText}" — no matching word from query "${q}"`);
        }
        return passes;
      });

      if (charFiltered.length > 0) {
        // Rank by relevance first (bucketed, so near-equal matches tie), then
        // prefer a clean front image and richer data. This stops a sparse entry
        // with an ugly photo from winning over an equally-relevant complete one
        // just because the API happened to return it first.
        charFiltered.sort((a, b) => {
          const relA = Math.round(a.relevance * 10);
          const relB = Math.round(b.relevance * 10);
          if (relB !== relA) return relB - relA;
          const imgA = imageQualityTier(a.result);
          const imgB = imageQualityTier(b.result);
          if (imgB !== imgA) return imgB - imgA;
          return b.ecoScore - a.ecoScore; // data completeness
        });
        return charFiltered.slice(0, 5).map(s => s.result);
      }

      // No match at all — return empty so callers can show a proper "not found"
      // instead of displaying an unrelated product (e.g. fromage blanc).
      return [];
    }
  }

  // No query: sort purely by eco data completeness
  if (pool.length <= 5) return pool;
  return [...pool]
    .sort((a, b) => calculateEcoScore(b) - calculateEcoScore(a))
    .slice(0, 5);
};


const normalizeOcrText = (text: string) => {
  return text
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1F\x7F]/g, " ")  // Control characters only
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};


const uniqPreserveOrder = (values: string[]) => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const v of values) {
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    result.push(v);
  }
  return result;
};

const shortOcrTokenAllowlist = new Set<string>([
  "bank",
  "beef",
  "milk",
  "egg",
  "eggs",
  "soy",
  "tea",
  "ham",
  "pork",
  "lamb",
  "fish",
  "rice",
]);

const isAcceptableOcrToken = (token: string) => {
  const t = token.toLowerCase();
  if (t.length < 2) return false; // Reduced from 3
  if (/(.)\1{2,}/.test(t)) return false;
  // FIXED: Allow accented characters (éàäöü etc.) in product names like "Häagen-Dazs"
  // Pattern: alphanumeric + common accented vowels/consonants
  if (!/^[a-z0-9áéíóúàèìòùäëïöüâêôûãõñçœæ]+$/i.test(t)) return false;

  const vowels = (t.match(/[aeiouyáéíóúàèìòùäëïöüâêôûãõ]/gi) || []).length;
  if (vowels === 0 && t.length > 2) return false; // Allow short vowel-less words

  if (t.length === 2) {
    if (shortOcrTokenAllowlist.has(t)) return true;
    return vowels / t.length >= 0.3; // Reduced from 0.5
  }

  if (t.length === 3) {
    if (shortOcrTokenAllowlist.has(t)) return true;
    return vowels / t.length >= 0.3; // Reduced from 0.5
  }

  if (t.length === 4) {
    if (shortOcrTokenAllowlist.has(t)) return true;
    return vowels / t.length >= 0.4; // Reduced from 0.5
  }

  if (/[b-df-hj-np-tv-z]{4,}/.test(t)) return false;
  return vowels / t.length >= 0.15; // Reduced from 0.18
};

const cleanupOcrTextForDisplay = (text: string) => {
  const normalized = normalizeOcrText(text);
  // Less aggressive filtering - keep more text, including accented characters
  const words = normalized.match(/\b[a-zA-Z0-9áéíóúàèìòùäëïöüâêôûãõñçœæ]{2,}(?:[-'][a-zA-Z0-9áéíóúàèìòùäëïöüâêôûãõñçœæ]{1,})*\b/g) || [];
  const filtered = words.filter(isAcceptableOcrToken);
  return normalizeOcrText(uniqPreserveOrder(filtered).join(" "));
};

const cleanupOcrTextForSearch = (text: string) => {
  const normalized = normalizeOcrText(text);
  // Less aggressive filtering - keep more text including numbers, brand names, and accented characters
  const words = normalized.match(/\b[a-zA-Z0-9áéíóúàèìòùäëïöüâêôûãõñçœæ]{2,}(?:[-'][a-zA-Z0-9áéíóúàèìòùäëïöüâêôûãõñçœæ]{1,})*\b/g) || [];
  const numericCodes = normalized.match(/\b\d{6,}\b/g) || [];
  const filtered = words.filter(isAcceptableOcrToken);
  return normalizeOcrText(uniqPreserveOrder([...filtered, ...numericCodes]).join(" "));
};


const isLikelyGibberish = (text: string) => {
  const visible = text.replace(/\s/g, "");
  if (visible.length < 3) return true;

  const digits = (visible.match(/[0-9]/g) || []).length;
  const letters = (visible.match(/[a-zA-Z]/g) || []).length;
  const total = visible.length;

  const digitRatio = total ? digits / total : 0;
  const letterRatio = total ? letters / total : 0;

  // More lenient - accept barcodes and numbers
  if (digits >= 6 && digitRatio >= 0.6) return false;

  if (letters < 2) return true;
  if (letterRatio < 0.2) return true; // Lowered from 0.35
  if (/(.)\1{2,}/.test(visible)) return true;

  const vowels = (visible.match(/[aeiouAEIOU]/g) || []).length;
  const vowelRatio = letters ? vowels / letters : 0;
  if (vowelRatio < 0.05) return true; // Lowered from 0.12

  const tokens = text.split(/\s+/).map((t) => t.trim()).filter(Boolean);
  if (tokens.length === 0) return true;

  const avgTokenLen = tokens.reduce((sum, t) => sum + t.length, 0) / tokens.length;
  if (tokens.length < 2 && avgTokenLen < 2) return true;

  return false;
};


const normalizeForTokens = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const toTokens = (value: string) => {
  const normalized = normalizeForTokens(value);
  return normalized ? normalized.split(" ").filter(Boolean) : [];
};


const Scan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const products = useProducts();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraInitializingRef = useRef(false);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [frozenFrame, setFrozenFrame] = useState<string | null>(null);
  const [cameraInitializing, setCameraInitializing] = useState(false);
  // Camera-access failure (permission denied, no device, in use…). When set, the
  // viewfinder shows a clean error card instead of a throwaway destructive toast.
  const [cameraError, setCameraError] = useState<{ title: string; suggestion: string } | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [ocrMessage, setOcrMessage] = useState<string | null>(null);
  const [manualSearch, setManualSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [offResult, setOffResult] = useState<OpenFoodFactsResult | null>(null);
  const [offLoading, setOffLoading] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [offSearchResults, setOffSearchResults] = useState<OpenFoodFactsResult[]>([]);
  const [offSearchLoading, setOffSearchLoading] = useState(false);
  const [productUnknown, setProductUnknown] = useState(false);
  const [offSearchImage, setOffSearchImage] = useState<string | null>(null);
  const [offSearchText, setOffSearchText] = useState("");
  // Flowchart states: not-found confirmation, manual correction
  const [notFoundQuery, setNotFoundQuery] = useState<string | null>(null);       // "We searched for X"
  const [showManualCorrection, setShowManualCorrection] = useState(false);       // User types correct name
  const [manualCorrectionInput, setManualCorrectionInput] = useState("");
  const [showDetailedEnvironmental, setShowDetailedEnvironmental] = useState(false);
  const [selectedEnvironmentalResult, setSelectedEnvironmentalResult] = useState<OpenFoodFactsResult | null>(null);
  const offFileInputRef = useRef<HTMLInputElement>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStage, setScanStage] = useState<string>("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const viewfinderRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [priorities, setPriorities] = useState<UserPriorities>(loadPriorities());
  const [prioritiesDismissed, setPrioritiesDismissed] = useState(false);
  const [prioritiesJustSaved, setPrioritiesJustSaved] = useState(false);
  const [inlineSearch, setInlineSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  // Torch is only offered when the active camera track reports the capability
  // (rear cameras on most phones; never on desktop webcams).
  const [torchSupported, setTorchSupported] = useState(false);
  const [scanMode, setScanMode] = useState<'Scan Food' | 'Barcode' | 'Food label'>('Scan Food');

  // Bottom-chrome transition: BottomNav greets you when you arrive on /scan,
  // then it slides down and the capture deck slides up into the same slot.
  // Starting in "nav" mode ensures the user's eye perceives the footer as
  // sliding away rather than the capture deck dropping in from nowhere.
  const [chromeMode, setChromeMode] = useState<'nav' | 'capture'>('nav');
  useEffect(() => {
    const t = setTimeout(() => setChromeMode('capture'), 220);
    return () => clearTimeout(t);
  }, []);

  // BottomNav lives in RootLayout; we reach into the shared context to
  // toggle its slide-down state. On unmount we restore it so it never
  // stays hidden for downstream pages. We compute `priorityGateUp` via
  // hasSavedPriorities() inline so this effect doesn't depend on the
  // later `isDefaultPriorities` const (temporal-dead-zone safety).
  const { setHidden: setBottomNavHidden } = useBottomNav();
  useEffect(() => {
    const priorityGateUp = !hasSavedPriorities();
    const shouldHide =
      priorityGateUp
      || (chromeMode === 'capture' && !showSearch)
      || showManualCorrection
      || productUnknown
      || !!notFoundQuery;
    setBottomNavHidden(shouldHide);
  }, [chromeMode, showSearch, showManualCorrection, productUnknown, notFoundQuery, priorities, setBottomNavHidden]);
  useEffect(() => {
    return () => { setBottomNavHidden(false); };
  }, [setBottomNavHidden]);

  // Auto-open manual search if ?manual=true
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('manual') === 'true') {
      setShowSearch(true);
    }
  }, []);

  // Lock <html>/<body> background to black while the full-screen camera Scan page
  // is mounted. In standalone (home-screen) PWA mode the bottom safe-area /
  // home-indicator strip shows the page background; keeping it black (matching the
  // camera) makes the viewfinder read as edge-to-edge instead of leaving a white
  // strip at the bottom. Restored on unmount.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.background;
    const prevBody = body.style.background;
    html.style.background = '#000';
    body.style.background = '#000';
    return () => {
      html.style.background = prevHtml;
      body.style.background = prevBody;
    };
  }, []);

  useEffect(() => {
    if ((location.state as any)?.prioritiesJustSaved) {
      setPrioritiesJustSaved(true);
      // Clear the navigation state so refresh doesn't re-trigger
      window.history.replaceState({}, '');
      // Scroll to viewfinder
      setTimeout(() => {
        viewfinderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      // Clear the message after 3 seconds
      setTimeout(() => setPrioritiesJustSaved(false), 3000);
    }
  }, [location.state]);

  // Reload priorities when they change (e.g., user returns from Preferences page)
  useEffect(() => {
    const handler = () => setPriorities(loadPriorities());
    window.addEventListener('prioritiesUpdated', handler);
    window.addEventListener('focus', handler);
    return () => {
      window.removeEventListener('prioritiesUpdated', handler);
      window.removeEventListener('focus', handler);
    };
  }, []);

  const isDefaultPriorities = !hasSavedPriorities();

  // Auto-start camera only when priorities are set
  useEffect(() => {
    if (!isDefaultPriorities) {
      startCamera();
    }
    return () => { stopCamera(); };
  }, [isDefaultPriorities]); // eslint-disable-line react-hooks/exhaustive-deps

  // Guarantee camera is killed on unmount (even if refs are stale)
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Debug: Check if video element is mounted
  useEffect(() => {
    console.log('Video ref status:', Boolean(videoRef.current));
    console.log('Canvas ref status:', Boolean(canvasRef.current));
  }, [cameraActive, cameraInitializing]);

  // Reset scan progress when not loading
  useEffect(() => {
    if (!offSearchLoading) {
      setScanProgress(0);
      setScanStage("");
    }
  }, [offSearchLoading]);

  // Auto-scroll to results when products are found
  useEffect(() => {
    if ((offSearchResults.length > 0 || (offResult && offResult.found)) && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [offSearchResults, offResult]);

  // Start camera with improved browser and mobile compatibility
  const startCamera = useCallback(async () => {
    try {
      // Clear any previous timeout
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

      setCameraError(null);
      setCameraInitializing(true);
      cameraInitializingRef.current = true;

      // Verify video element exists
      if (!videoRef.current) {
        throw new Error('Video element not ready');
      }

      // Check browser support with fallbacks for different browser APIs
      const getMediaDevices = async () => {
        if (navigator.mediaDevices?.getUserMedia) {
          return navigator.mediaDevices;
        }
        // Fallback for iOS WKWebView (Capacitor) where mediaDevices may need a polyfill
        if (!navigator.mediaDevices) {
          (navigator as any).mediaDevices = {};
        }
        if (!navigator.mediaDevices.getUserMedia) {
          const getUserMedia = (navigator as any).webkitGetUserMedia ||
            (navigator as any).mozGetUserMedia ||
            (navigator as any).msGetUserMedia;
          if (getUserMedia) {
            navigator.mediaDevices.getUserMedia = (constraints: any) =>
              new Promise((resolve, reject) => {
                getUserMedia.call(navigator, constraints, resolve, reject);
              });
            return navigator.mediaDevices;
          }
        }
        // Fallback for older browsers
        if ((navigator as any).webkitGetUserMedia) {
          return {
            getUserMedia: (constraints: any) => new Promise((resolve, reject) => {
              (navigator as any).webkitGetUserMedia(constraints, resolve, reject);
            })
          };
        }
        throw new Error('Browser does not support camera access');
      };

      const mediaDevices = await getMediaDevices();
      console.log('Camera API available');

      // Try to get camera with progressive fallback
      let stream: MediaStream | null = null;

      // First try: rear camera with optimal settings (mobile)
      try {
        stream = await mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          },
          audio: false
        }) as MediaStream;
        console.log('Camera access granted with optimal settings');
      } catch (err) {
        console.log('Optimal settings failed, trying basic settings:', err);

        // Second try: basic video without constraints for desktop
        try {
          stream = await mediaDevices.getUserMedia({
            video: true,
            audio: false
          }) as MediaStream;
          console.log('Camera access granted with basic settings');
        } catch (err2) {
          console.log('Basic settings failed too:', err2);
          
          // Third try: very minimal constraints
          try {
            stream = await mediaDevices.getUserMedia({
              video: {
                width: { min: 320 },
                height: { min: 240 }
              },
              audio: false
            }) as MediaStream;
            console.log('Camera access granted with minimal settings');
          } catch (err3) {
            console.log('Minimal settings failed:', err3);
            throw err;
          }
        }
      }

      if (!stream) {
        throw new Error('Failed to get media stream');
      }

      // Verify video ref still exists
      if (!videoRef.current) {
        stream.getTracks().forEach(track => track.stop());
        throw new Error('Video element was removed');
      }

      const video = videoRef.current;

      // Stop any existing stream
      if (video.srcObject instanceof MediaStream) {
        video.srcObject.getTracks().forEach(track => track.stop());
      }

      // Assign new stream
      video.srcObject = stream;
      streamRef.current = stream;

      // Setup handlers
      const onCanPlay = () => {
        console.log('Video can play, dimensions:', video.videoWidth, 'x', video.videoHeight);

        // Clear timeout since we succeeded
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }

        cameraInitializingRef.current = false;
        setCameraActive(true);
        setCameraInitializing(false);

        // Detect torch/flash support on the live video track so the flash
        // button is only shown when it can actually do something.
        try {
          const track = stream.getVideoTracks()[0];
          const caps = track?.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
          setTorchSupported(!!caps && 'torch' in caps && !!caps.torch);
        } catch {
          setTorchSupported(false);
        }

        // Clean up event listener
        video.removeEventListener('canplay', onCanPlay);

      };

      const onError = () => {
        console.error('Video stream error');
        video.removeEventListener('error', onError);
        video.removeEventListener('canplay', onCanPlay);

        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }

        cameraInitializingRef.current = false;
        setCameraInitializing(false);

        toast({
          title: "Camera Error",
          description: "Failed to load video stream. Try again.",
          variant: "destructive",
        });
      };

      video.addEventListener('canplay', onCanPlay);
      video.addEventListener('error', onError);

      // Start playback - iOS requires user gesture but we're already in one
      try {
        // Ensure attributes are set before playing
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');

        const playPromise = video.play();
        if (playPromise !== undefined) {
          await playPromise;
          console.log('Video playback started');
        }
      } catch (err) {
        console.error('Play error:', err);
        // Continue - it might work with the canplay event
      }

      // Timeout safety using ref to avoid stale closures
      timeoutIdRef.current = setTimeout(() => {
        if (cameraInitializingRef.current) {
          console.error('Camera initialization timeout');
          video.removeEventListener('canplay', onCanPlay);
          video.removeEventListener('error', onError);
          cameraInitializingRef.current = false;
          setCameraInitializing(false);

          // Stop the stream
          if (video.srcObject instanceof MediaStream) {
            video.srcObject.getTracks().forEach(track => track.stop());
            video.srcObject = null;
          }

          toast({
            title: "Camera Error",
            description: "Camera setup took too long. Try again.",
            variant: "destructive",
          });
        }
      }, 8000);

    } catch (error: unknown) {
      console.error('Camera initialization error:', error);

      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

      cameraInitializingRef.current = false;
      setCameraInitializing(false);

      const errName =
        typeof error === "object" && error !== null && "name" in error
          ? String((error as { name?: unknown }).name)
          : "";

      const message = typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message)
        : String(error);

      let errorMessage = "Unable to access camera.";
      let suggestion = "Check permissions and try again.";

      if (errName === 'NotAllowedError' || message.includes('Permission')) {
        errorMessage = "Camera permission denied";
        suggestion = "Allow camera access in browser settings.";
      } else if (errName === 'NotFoundError' || message.includes('Requested device')) {
        errorMessage = "No camera found";
        suggestion = "Connect a camera and try again.";
      } else if (errName === 'NotReadableError' || message.includes('Could not start')) {
        errorMessage = "Camera is in use";
        suggestion = "Close other apps using the camera.";
      } else if (errName === 'OverconstrainedError') {
        errorMessage = "Camera constraints not compatible";
        suggestion = "Your device may not support these camera settings.";
      } else if (message.includes('does not support')) {
        errorMessage = "Browser not supported";
        suggestion = "Use Chrome, Firefox, Safari, or Edge.";
      }

      // Surface camera failures as an in-viewfinder card (see render) rather
      // than a destructive toast that vanishes and leaves a black screen.
      setCameraError({ title: errorMessage, suggestion });
    }
  }, [toast]);

  // Stop camera
  const stopCamera = useCallback(() => {
    // Clean up timeout
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    cameraInitializingRef.current = false;

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    // Also stop via streamRef in case videoRef was already unmounted
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCameraInitializing(false);
    setTorchSupported(false);
    setFlashOn(false);
  }, []);

  // Apply the torch constraint whenever the flash is toggled or the camera
  // (re)starts. The button only flips `flashOn`; this is what actually drives
  // the hardware flash via the live MediaStreamTrack.
  useEffect(() => {
    if (!cameraActive || !torchSupported) return;
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    // `torch` isn't in the standard MediaTrackConstraints lib types yet.
    const constraints = { advanced: [{ torch: flashOn }] } as unknown as MediaTrackConstraints;
    track.applyConstraints(constraints).catch((err) => console.warn('Torch toggle failed:', err));
  }, [flashOn, cameraActive, torchSupported]);

  // Search products with improved name-first matching
  const searchProducts = useCallback((query: string) => {
    const normalizedQuery = normalizeForTokens(query);
    const queryTokens = toTokens(query);

    const results = products
      .map((product) => {
        const nameNorm = normalizeForTokens(product.name);
        const brandNorm = normalizeForTokens(product.brand);
        const idNorm = normalizeForTokens(product.id);
        const idNoHash = idNorm.replace(/^#/, "");
        const barcodeNorm = normalizeForTokens(product.barcode || "");
        const keywordNorm = normalizeForTokens(product.keywords.join(" "));

        const nameTokens = new Set(toTokens(product.name));
        const brandTokens = new Set(toTokens(product.brand));
        const keywordTokens = new Set(toTokens(product.keywords.join(" ")));

        const allTokens = new Set<string>([
          ...nameTokens,
          ...brandTokens,
          ...keywordTokens,
          ...toTokens(product.id),
          ...toTokens(product.barcode || ""),
        ]);

        let score = 0;

        // Exact matches first (ID / barcode)
        if (normalizedQuery && (normalizedQuery === idNorm || normalizedQuery === idNoHash)) {
          score += 1000;
        }

        if (normalizedQuery && barcodeNorm && normalizedQuery === barcodeNorm) {
          score += 900;
        }

        // Exact full-field match (normalized)
        if (normalizedQuery && normalizedQuery === nameNorm) score += 200;
        if (normalizedQuery && normalizedQuery === brandNorm) score += 120;
        if (normalizedQuery && normalizedQuery === keywordNorm) score += 80;

        // Whole-token matching (prevents 'bee' matching 'beef')
        if (queryTokens.length === 1) {
          const t = queryTokens[0];
          if (nameTokens.has(t)) score += 110;
          if (brandTokens.has(t)) score += 70;
          if (keywordTokens.has(t)) score += 40;
          if (allTokens.has(t)) score += 10;
        } else if (queryTokens.length > 1) {
          const allPresent = queryTokens.every((t) => allTokens.has(t));
          if (allPresent) {
            const inNameCount = queryTokens.filter((t) => nameTokens.has(t)).length;
            score += 60 + inNameCount * 15;
          }
        }

        return { product, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ product }) => product);

    setSearchResults(results);

    if (results.length === 1) {
      // Direct match - navigate to product
      navigate(`/product/${results[0].id.replace("#", "")}`);
    } else if (results.length > 1) {
      toast({
        title: "Multiple Matches Found",
        description: `Found ${results.length} possible matches. Please select one below.`,
      });
    } else if (results.length === 0 && query.trim()) {
      toast({
        title: "No Products Found",
        description: "Try a different search or add the product to our database.",
      });
    }
  }, [navigate, products, toast]);

  // Create new product from OCR data
  const createProductFromOCR = useCallback(async () => {
    if (!uploadedImage || !extractedText) {
      toast({
        title: "Missing Information",
        description: "Please scan an image first to extract product information.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get OCR data for detailed extraction
      const ocrData = await advancedProductOCR(uploadedImage);
      
      if (!ocrData.success) {
        toast({
          title: "OCR Failed",
          description: "Could not extract product information. Try again.",
          variant: "destructive",
        });
        return;
      }

      // Generate new product ID
      const newProductId = `#p${String(products.length + 1).padStart(4, '0')}`;
      
      // Create new product object with extracted data
      const newProduct: Product = {
        id: newProductId,
        name: ocrData.productName || extractedText.split(' ').slice(-2).join(' '), // Use last 2 words as fallback name
        brand: ocrData.brandName || 'Unknown Brand',
        category: 'General', // Default category
        origin: {
          country: 'Unknown', // Default origin
        },
        materials: ocrData.ingredients || [], // Use ingredients as materials
        laborRisk: 'medium', // Default risk level
        transportDistance: 500, // Default distance
        certifications: ocrData.certifications || [],
        carbonFootprint: 2.5, // Default footprint
        keywords: [...extractedText.split(' '), ...(ocrData.certifications || [])], // Combine text and certifications
        barcode: ocrData.barcode || '',
        imageUrl: uploadedImage, // Include the uploaded image
      };

      // Copy product code to clipboard
      const success = await copySingleProductCode(newProduct);
      
      if (success) {
        toast({
          title: "Product Code Copied! 📋",
          description: `Product "${newProduct.name}" code copied to clipboard. Paste it in products.ts file.`,
        });
        
        // Navigate to admin page for easy editing
        setTimeout(() => {
          navigate('/admin');
        }, 2000);
      } else {
        toast({
          title: "Copy Failed",
          description: "Could not copy product code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: "Error",
        description: "Failed to create product. Please try again.",
        variant: "destructive",
      });
    }
  }, [uploadedImage, extractedText, products, toast, navigate]);

  // Handle viewing detailed environmental impact
  const viewDetailedEnvironmental = useCallback((result: OpenFoodFactsResult) => {
    setSelectedEnvironmentalResult(result);
    setShowDetailedEnvironmental(true);
    toast({
      title: "Environmental Impact Details",
      description: "Showing comprehensive environmental analysis.",
    });
  }, [toast]);

  // Handle back to search results
  const backToSearchResults = useCallback(() => {
    setShowDetailedEnvironmental(false);
    setSelectedEnvironmentalResult(null);
  }, []);

  // Process image with OCR using OpenAI Vision API
  const processImage = useCallback(async (imageData: string) => {
    setIsProcessing(true);
    setExtractedText("");
    setOcrMessage(null);
    setSearchResults([]);
    setOffResult(null);
    setOffLoading(false);

    try {
      setIsScanning(true);
      let extractedText = "";

      // Try Advanced OpenAI Vision API first (GPT-4 Vision with optimized prompts)
      try {
        console.log("🚀 Attempting ADVANCED OCR with GPT-4 Vision...");
        const advancedResult = await advancedProductOCR(imageData);

        if (advancedResult.success) {
          console.log("✅ Advanced OCR extraction successful");

          // Prefer product name + brand for search
          if (advancedResult.productName && advancedResult.brandName) {
            extractedText = `${advancedResult.brandName} ${advancedResult.productName}`;
          } else if (advancedResult.productName) {
            extractedText = advancedResult.productName;
          } else if (advancedResult.brandName) {
            extractedText = advancedResult.brandName;
          } else {
            extractedText = advancedResult.fullText;
          }

          // Check hardcoded barcode map first, try each barcode in order
          const hardcodedBarcodes = lookupHardcodedBarcodes(extractedText);
          if (hardcodedBarcodes.length > 0) {
            console.log(`✅ Hardcoded barcode match: "${extractedText}" → trying ${hardcodedBarcodes.length} barcode(s)`);
            for (const barcode of hardcodedBarcodes) {
              const result = await lookupBarcode(barcode);
              if (result.found) {
                const hardcodedImage = lookupHardcodedImage(extractedText) || lookupHardcodedImage(barcode);
                const finalResult = hardcodedImage ? { ...result, imageUrl: hardcodedImage } : result;
                sessionStorage.setItem('scan_candidates', JSON.stringify([finalResult]));
                navigate(`/product-off/${finalResult.barcode}?from=scan`);
                return;
              }
              console.log(`⚠️ Barcode ${barcode} not found, trying next...`);
            }
          }

          // Show additional info in toast
          if (advancedResult.certifications.length > 0) {
            toast({
              title: "Certifications Found",
              description: `${advancedResult.certifications.join(", ")}`,
            });
          }

          // If a barcode was extracted, query OpenFoodFacts in parallel
          if (advancedResult.barcode && isValidBarcode(advancedResult.barcode)) {
            console.log("Barcode detected by OCR:", advancedResult.barcode);
            setOffLoading(true);
            lookupBarcode(advancedResult.barcode)
              .then((result) => {
                console.log("OpenFoodFacts result:", result);
                if (result.found) {
                  // Validate barcode result against OCR-identified product
                  const ocrText = `${advancedResult.brandName || ''} ${advancedResult.productName || ''}`.trim();
                  const { valid } = validateBarcodeResult(result, ocrText);

                  if (!valid) {
                    console.warn(`⚠️ Barcode product "${result.productName}" doesn't pass relevance check against OCR "${ocrText}" — ignoring`);
                    return;
                  }

                  if (hasEcoScore(result)) {
                    const hardcodedImage = lookupHardcodedImage(advancedResult.barcode!) || lookupHardcodedImage(result.barcode);
                    const finalResult = hardcodedImage ? { ...result, imageUrl: hardcodedImage } : result;
                    sessionStorage.setItem('scan_candidates', JSON.stringify([finalResult]));
                    navigate(`/product-off/${finalResult.barcode}?from=scan`);
                  } else {
                    toast({
                      title: "No Environmental Data",
                      description: `"${result.productName || "Product"}" has no Eco-Score breakdown.`,
                      variant: "destructive",
                    });
                  }
                }
              })
              .catch((err) => {
                console.error("OpenFoodFacts lookup failed:", err);
              })
              .finally(() => {
                setOffLoading(false);
              });
          }
        } else {
          console.warn("❌ Advanced OCR failed, trying standard OpenAI:", advancedResult.error);
        }
      } catch (error) {
        console.warn("⚠️ Advanced OCR error, trying standard OpenAI:", error);
      }

      // Skip redundant second OpenAI call — advanced OCR already uses the same
      // endpoint; a second attempt just doubles wait time with no better result.

      const cleanedForDisplay = cleanupOcrTextForDisplay(extractedText);
      const cleanedForSearch = cleanupOcrTextForSearch(extractedText);
      const shouldReject = cleanedForSearch.length < 2 || isLikelyGibberish(cleanedForSearch);

      if (shouldReject) {
        setExtractedText("");
        setOcrMessage("No text recognized. Try manual search.");
        setIsScanning(false);
        return;
      }

      setExtractedText(cleanedForDisplay || cleanedForSearch);
      setIsScanning(false);
      searchProducts(cleanedForSearch);
    } catch (error) {
      console.error("Image processing error:", error);
      toast({
        title: "Processing Error",
        description: "Failed to process the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setIsScanning(false);
    }
  }, [searchProducts, toast]);

  // Block scanning if priorities not set
  const requirePriorities = useCallback((): boolean => {
    if (isDefaultPriorities) {
      return false;
    }
    return true;
  }, [isDefaultPriorities]);

  // Manual barcode lookup on OpenFoodFacts
  const handleProductSearch = useCallback(async (productName: string) => {
    if (!productName.trim()) return;
    if (!requirePriorities()) return;

    setOffLoading(true);
    setOffResult(null);
    setOffSearchResults([]);

    try {
      // Ask AI to fix typos before searching
      const cleanedName = await fixProductQuery(productName.trim());

      // Fetch a pool — we navigate to the top result immediately, so pull
      // enough candidates that the exact flavor/variant is in the pool.
      const results = await searchOffProducts(cleanedName, 10);

      // Filter: product must contain at least one query word to avoid random
      // results, then rank with the variant-aware relevance scorer so
      // "Coca-Cola Zero" never resolves to plain "Coca-Cola".
      // nameMatch guards against OFF data-entry junk where the full query was
      // mis-entered in the BRAND field of an unrelated product (e.g. a vinegar
      // whose "brand" is "Coca cola zero") — a real match has the query in its
      // product NAME, so name-matching candidates always rank first.
      const scored = results
        .filter(r => resultContainsQueryWord(cleanedName, [r.productName, r.brand].filter(Boolean).join(' ')))
        .map(r => ({
          result: r,
          rel: scoreRelevance(cleanedName, [r.productName, r.brand].filter(Boolean).join(' ')),
          nameMatch: resultContainsQueryWord(cleanedName, r.productName ?? '') ? 1 : 0,
          ecoScore: calculateEcoScore(r),
        }))
        .sort((a, b) =>
          b.nameMatch - a.nameMatch
          || b.rel.score - a.rel.score
          || b.ecoScore - a.ecoScore);

      // Prefer candidates that pass the strict relevance gate; if none do,
      // fall back to the best word-matched candidates rather than a wrong
      // flavor that merely shares the brand name.
      const passing = scored.filter(s => s.rel.passes);
      const topResults = (passing.length > 0 ? passing : scored)
        .slice(0, 5)
        .map(s => s.result);

      if (topResults.length > 0) {
        sessionStorage.setItem('scan_candidates', JSON.stringify(topResults));
        setShowSearch(false);
        navigate(`/product-off/${topResults[0].barcode}?from=scan`);
      } else {
        // Not found → "Was the search correct?" flow
        setShowSearch(false);
        setNotFoundQuery(productName.trim());
      }
    } catch (error) {
      console.error("Product search error:", error);
      toast({
        title: "Search Error",
        description: "Failed to search products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOffLoading(false);
    }
  }, [toast, requirePriorities]);

  // Process image for OpenFoodFacts search
  // Flow: OpenAI identifies product → search OFF → navigate to first result
  const processImageForOFF = useCallback(async (imageData: string) => {
    if (!requirePriorities()) return;
    setOffSearchLoading(true);
    setScanStage("Identifying Product...");
    setScanProgress(10);
    setOffSearchResults([]);
    setOffSearchText("");
    setOffSearchImage(imageData);
    setProductUnknown(false);
    setNotFoundQuery(null);
    setShowManualCorrection(false);
    // Clear stale OCR name / OpenAI identification from a previous scan
    sessionStorage.removeItem('ocr_product_name');
    sessionStorage.removeItem('scan_openai_response');
    sessionStorage.removeItem('scan_full_openai_response');
    sessionStorage.removeItem('scan_image');

    try {
      // Step 1: OpenAI identifies the product
      const identified = await advancedProductOCR(imageData);
      setScanStage("Product identified");
      setScanProgress(30);

      const isUnknownResponse = (s: string | null | undefined) =>
        !s || s.trim().toLowerCase() === 'unknown' || s.trim().toLowerCase() === 'none';

      // Log a scan that never resolved to a product (anonymous, fire-and-forget,
      // honours the same opt-out as a normal scan). Captures the photo and what
      // OpenAI actually read, so misses like "M&M's → Chocolate Party 1kg" are
      // debuggable from data (Supabase ai_scans.resolved = false) instead of guesswork.
      const logFailedScan = (query: string) => {
        logScan({
          name: query?.trim() || "Unknown product",
          resolved: false,
          verdict: "UNKNOWN",
          openaiResponse: sessionStorage.getItem("scan_openai_response"),
          fullOpenaiResponse: sessionStorage.getItem("scan_full_openai_response") || identified.rawExtraction || null,
          image: identified.compressedBase64 || sessionStorage.getItem("scan_image") || null,
        });
      };

      if (!identified.success || (isUnknownResponse(identified.productName) && isUnknownResponse(identified.brandName))) {
        logFailedScan("");
        setProductUnknown(true);
        return;
      }

      // Store OCR-identified product name so the detail page can use it as heading
      const ocrProductName = !isUnknownResponse(identified.productName) ? identified.productName!.trim() : null;
      if (ocrProductName) {
        sessionStorage.setItem('ocr_product_name', ocrProductName);
      }
      // The trimmed string OpenAI identified (brand + product). Carried to the
      // detail page so the scan log records exactly what the model saw
      // (Supabase ai_scans.openai_response).
      const openaiIdentified = [identified.brandName, identified.productName]
        .filter((s) => s && !isUnknownResponse(s)).join(' ').trim();
      if (openaiIdentified) sessionStorage.setItem('scan_openai_response', openaiIdentified);
      else sessionStorage.removeItem('scan_openai_response');
      // The COMPLETE raw model response, before we trimmed it to the brand+product
      // search above. Carried alongside so the scan log captures the full picture
      // of what OpenAI returned (Supabase ai_scans.full_openai_response).
      const fullOpenaiResponse = identified.rawExtraction?.trim();
      if (fullOpenaiResponse) sessionStorage.setItem('scan_full_openai_response', fullOpenaiResponse);
      else sessionStorage.removeItem('scan_full_openai_response');
      // The downscaled photo we sent to OpenAI, carried to the detail page so the
      // scan log can store it inline (Supabase ai_scans.image). Already ~512px
      // JPEG base64, so it fits sessionStorage and the scan-log POST comfortably.
      if (identified.compressedBase64) sessionStorage.setItem('scan_image', identified.compressedBase64);
      else sessionStorage.removeItem('scan_image');

      // Step 1b: Check hardcoded barcode map before anything else
      setScanStage("Checking local product database...");
      setScanProgress(40);
      const identifiedText = [identified.brandName, identified.productName].filter(Boolean).join(' ');
      const hardcodedBarcodes = lookupHardcodedBarcodes(identifiedText);
      if (hardcodedBarcodes.length > 0) {
        console.log(`✅ Hardcoded barcode match: "${identifiedText}" → trying ${hardcodedBarcodes.length} barcode(s)`);
        for (const barcode of hardcodedBarcodes) {
          const result = await lookupBarcode(barcode);
          if (result.found) {
            const hardcodedImage = lookupHardcodedImage(identifiedText) || lookupHardcodedImage(barcode);
            const finalResult = hardcodedImage ? { ...result, imageUrl: hardcodedImage } : result;
            sessionStorage.setItem('scan_candidates', JSON.stringify([finalResult]));
            navigate(`/product-off/${finalResult.barcode}?from=scan`);
            return;
          }
          console.log(`⚠️ Barcode ${barcode} not found, trying next...`);
        }
      }

      // Step 2: If a barcode was spotted, look it up directly — but validate against OCR text
      setScanStage("Looking up barcode...");
      setScanProgress(50);
      if (identified.barcode && isValidBarcode(identified.barcode)) {
        const barcodeResult = await lookupBarcode(identified.barcode);
        if (barcodeResult.found) {
          // Validate: the resolved product must share a distinctive token with the OCR query
          const ocrText = [identified.brandName, identified.productName].filter(s => !isUnknownResponse(s)).join(' ');
          const { valid, relevance } = validateBarcodeResult(barcodeResult, ocrText);
          if (valid) {
            const hardcodedImage = lookupHardcodedImage(identified.barcode);
            const finalResult = hardcodedImage ? { ...barcodeResult, imageUrl: hardcodedImage } : barcodeResult;
            sessionStorage.setItem('scan_candidates', JSON.stringify([finalResult]));
            navigate(`/product-off/${finalResult.barcode}?from=scan`);
            return;
          }
          console.warn(`⚠️ Barcode ${identified.barcode} resolved to "${barcodeResult.productName}" but failed relevance check against OCR "${ocrText}" (score=${relevance.score.toFixed(2)}, distinctiveOverlap=${relevance.distinctiveOverlap}) — falling through to text search`);
        }
      }

      // Step 3: Build search queries — product name first (better for OpenFoodFacts),
      // then combined, then brand-only as last resort.
      // rawQuery includes brand for relevance scoring, but search order prioritises product name.
      const prodOnly = identified.productName && !isUnknownResponse(identified.productName) ? identified.productName.trim() : '';
      const brandOnly = identified.brandName && !isUnknownResponse(identified.brandName) ? identified.brandName.trim() : '';
      const rawQuery = [brandOnly, prodOnly].filter(Boolean).join(' ');

      if (!rawQuery) {
        logFailedScan(rawQuery);
        setProductUnknown(true);
        return;
      }

      // Guard against generic cross-brand drift when no usable brand was read.
      // If the OCR brand has no Latin anchor token (blank, or non-Latin script
      // like Arabic), a product-only search lands on a same-category product from
      // a DIFFERENT brand — e.g. blank brand + "Protein Bar Peanut Caramel" →
      // another company's peanut-caramel bar, or "Tea" → a random iced tea.
      // Honest behaviour: prompt manual entry instead of guessing the brand.
      // (Verified against a 128-product battery: 0 correctly-resolved scans had
      // an unreadable brand, so this never blocks a real match.)
      if (!hasUsableBrandAnchor(brandOnly)) {
        console.warn(`⚠️ No usable brand anchor (brand="${brandOnly}") — refusing generic match, prompting manual entry`);
        logFailedScan(prodOnly || rawQuery);
        setNotFoundQuery(prodOnly || rawQuery);
        return;
      }

      const cleanedQuery = cleanOCRQuery(rawQuery);
      // Search order: lead with "Brand Product" since brand often disambiguates
      // generic product names (e.g. "Phish Food" → "Ben & Jerry's Phish Food").
      // Fall back to product-only, then brand-only, then progressive strips.
      const searchQueries: string[] = [];
      const addUnique = (q: string) => { if (q && !searchQueries.some(s => s.toLowerCase() === q.toLowerCase())) searchQueries.push(q); };
      // Lead with combined brand + product — most specific, most accurate.
      if (brandOnly && prodOnly) addUnique(`${brandOnly} ${prodOnly}`);
      // Then product alone — covers brand misreads.
      if (prodOnly) addUnique(prodOnly);
      // Then full raw/cleaned as further fallback.
      addUnique(rawQuery);
      if (cleanedQuery !== rawQuery) addUnique(cleanedQuery);
      // Brand alone — last resort when product name is gibberish.
      if (brandOnly) addUnique(brandOnly);
      // Progressive strip of cleaned query (drop rightmost word each time)
      const cleanedWords = cleanedQuery.split(' ').filter(Boolean);
      for (let len = cleanedWords.length - 1; len >= 2; len--) {
        addUnique(cleanedWords.slice(0, len).join(' '));
      }

      console.log(`🔍 [OCR] Raw: "${rawQuery}" → Cleaned: "${cleanedQuery}" → ${searchQueries.length} query candidates`);

      setOffSearchText(cleanedQuery);

      // Try each query candidate — validate against the ORIGINAL OCR query (rawQuery)
      let bestMatch: MatchResult<OpenFoodFactsResult> | null = null;
      let allCandidates: OpenFoodFactsResult[] = [];

      // Record every OFF search variation we send and how it resolved, so the
      // scan log captures the full match-finding trail (see append below).
      const searchAttempts: string[] = [];
      const recordAttempt = (q: string, outcome: string) =>
        searchAttempts.push(`${searchAttempts.length + 1}. "${q}" → ${outcome}`);

      // Fire the query candidates CONCURRENTLY instead of awaiting each in
      // series. The OCR-derived candidates heavily overlap (brand+product,
      // product, brand, progressive strips), so running them one-at-a-time used
      // to stack N network round-trips onto the critical path — the single
      // biggest contributor to slow scans (each OFF search itself chains several
      // upstream strategies server-side). We still evaluate the results in the
      // original priority order and accept the first query that passes the
      // relevance gate, so match selection is unchanged; only the waiting is gone.
      // Cap the parallel breadth: each search already shrinks its own query
      // internally (generateSearchVariations covers product-only / brand-only /
      // progressive strips), so the top-3 most-specific candidates give full
      // coverage. Firing more just adds upstream OFF contention without
      // improving the match — and the brand-only tail is never auto-accepted.
      const PARALLEL_QUERY_CAP = 3;
      const queriesToRun = searchQueries.slice(0, PARALLEL_QUERY_CAP);
      setScanStage("Searching product databases...");
      setScanProgress(70);
      const resultsPerQuery = await Promise.all(
        queriesToRun.map((q) =>
          searchOffProducts(q, 20).catch((e) => {
            console.warn(`   ↪ Search failed for "${q}":`, e);
            return [] as OpenFoodFactsResult[];
          }),
        ),
      );

      for (let qi = 0; qi < queriesToRun.length; qi++) {
        const q = queriesToRun[qi];
        const results = resultsPerQuery[qi];
        if (results.length === 0) {
          recordAttempt(q, "0 results");
          continue;
        }

        const topResults = filterBestProducts(results, q);
        if (topResults.length === 0) {
          recordAttempt(q, `${results.length} results, none relevant`);
          continue;
        }

        // Score against the ORIGINAL OCR query to prevent brand-only fallback winning.
        // Pass the OCR-identified brand so a brand-stripped query can't auto-accept a
        // different company's product (e.g. "Theo Hazelnut Crisp" → random "Hazelnut Crisp").
        const match = pickBestMatch(topResults, rawQuery, q, undefined, brandOnly || undefined);
        console.log(`   [relevance] query="${q}" → passed=${match.passedRelevanceGate}, brandOnly=${match.brandOnlyFallback}, confidence=${match.confidence.toFixed(2)}`);

        if (match.passedRelevanceGate && match.product) {
          recordAttempt(q, `matched "${match.product.productName}"${match.product.brand ? ` by ${match.product.brand}` : ""} [${match.product.barcode}]`);
          bestMatch = match;
          allCandidates = topResults;
          console.log(`✅ Matched: "${match.product.productName}" by ${match.product.brand} (query="${q}", confidence=${match.confidence.toFixed(2)})`);
          break;
        }

        // A brand-only fallback is never auto-accepted — log and continue trying
        if (match.brandOnlyFallback) {
          recordAttempt(q, `${topResults.length} results, brand-only fallback (not accepted)`);
        } else {
          recordAttempt(q, `${topResults.length} results, no confident match`);
        }
      }

      // Persist every variation we tried into the existing full OpenAI response
      // field carried to the detail page (Supabase ai_scans.full_openai_response).
      // Appended after the raw model output so one row shows what OpenAI saw AND
      // every query variation it drove into Open Food Facts, with each outcome.
      if (searchAttempts.length > 0) {
        const base = sessionStorage.getItem('scan_full_openai_response') || fullOpenaiResponse || '';
        const block = `OFF search variations tried (${searchAttempts.length}):\n${searchAttempts.join('\n')}`;
        sessionStorage.setItem('scan_full_openai_response', base ? `${base}\n\n${block}` : block);
      }

      if (!bestMatch || !bestMatch.product) {
        console.warn(`⚠️ No match found after ${searchQueries.length} query attempts for "${rawQuery}"`);
        logFailedScan(cleanedQuery);
        setNotFoundQuery(cleanedQuery);
        return;
      }

      setScanStage("Checking the photo matches...");
      setScanProgress(95);
      // ── Colour verification ───────────────────────────────────────────────
      // Confirm the resolved product actually LOOKS like what the user scanned,
      // by comparing the user's photo to the candidate cover photos (hue match,
      // robust to lighting). Two passes:
      //   Pass 1 — re-rank/verify against the text-search pool.
      //   Pass 2 — if NONE of those covers look like the photo, the eco-score
      //            quality filter has likely dropped the real product from the
      //            pool (OFF only eco-scores some variants — e.g. M&M's *ice
      //            cream* is scored while the M&M's *candy* bags are not, so the
      //            candy mis-resolves to the ice cream). Widen to an image-bearing
      //            pool with NO eco gate and let colour pick the right product.
      // Time-boxed throughout so a slow image download / vision call can't blow
      // the scan budget; on timeout we keep the proven text pick.
      // Colour histograms alone are noisy for busy packaging (two legit M&M's
      // bags can score as low against each other as a bag scores against the ice
      // cream), so `verified` — a STRONG colour win OR an AI vision confirmation
      // that the two photos are the same product — is the signal we trust. Colour
      // similarity is only the cheap pre-filter that decides what to AI-check.
      const PASS1_BUDGET_MS = 2500;   // re-rank/verify the existing pool
      const PASS2_BUDGET_MS = 3500;   // corrective widen — rarer, worth more time
      const COLOR_MISMATCH_MAX = 0.55; // best cover this unlike the photo ⇒ probably wrong
      const COLOR_SWITCH_MARGIN = 0.10;
      let chosenCandidate = bestMatch.product;
      let finalCandidates = [chosenCandidate, ...allCandidates.filter(c => c.barcode !== chosenCandidate.barcode)];

      const timeboxedVisual = (cands: OpenFoodFactsResult[], fb: OpenFoodFactsResult, budgetMs: number): Promise<VisualPick> =>
        Promise.race([
          pickVisualBestCandidate(identified.compressedBase64, cands, fb),
          new Promise<VisualPick>((resolve) =>
            setTimeout(() => resolve({ chosen: fb, reordered: cands, usedAi: false, topSimilarity: 0, hadSignal: false, verified: false }), budgetMs),
          ),
        ]);

      if (identified.compressedBase64) {
        try {
          // Pass 1: verify / re-rank against the existing (eco-ranked) pool.
          const visual = await timeboxedVisual(finalCandidates, chosenCandidate, PASS1_BUDGET_MS);
          chosenCandidate = visual.chosen;
          finalCandidates = visual.reordered;
          if (chosenCandidate.barcode !== bestMatch.product.barcode) {
            console.log(`🎨 Visual re-rank → "${chosenCandidate.productName}" over "${bestMatch.product.productName}"${visual.usedAi ? ' (AI-confirmed)' : ''}`);
          }

          // Pass 2: we had a colour signal but couldn't confirm the match, AND the
          // best cover doesn't really look like the photo → the real product was
          // likely filtered out of the pool (no eco-score). Widen to every
          // image-bearing match and let colour + AI find the right one.
          if (visual.hadSignal && !visual.verified && visual.topSimilarity < COLOR_MISMATCH_MAX) {
            console.warn(`🎨 Auto-match "${chosenCandidate.productName}" not visually confirmed (best sim=${visual.topSimilarity.toFixed(2)}) — widening pool`);
            setScanStage("Confirming it's the right product...");
            const widePool = await searchVisualCandidates(rawQuery, 12);
            const hasNew = widePool.some(p => !finalCandidates.some(c => c.barcode === p.barcode));
            if (widePool.length > 0 && hasNew) {
              const visual2 = await timeboxedVisual(widePool, chosenCandidate, PASS2_BUDGET_MS);
              // Swap when the wider pool yields a CONFIRMED match (AI or strong
              // colour) — trust that over the unconfirmed text pick — or, lacking
              // confirmation, when colour is clearly and meaningfully better.
              const colourClearlyBetter = visual2.hadSignal
                && visual2.topSimilarity >= COLOR_MISMATCH_MAX
                && visual2.topSimilarity > visual.topSimilarity + COLOR_SWITCH_MARGIN;
              if (visual2.chosen.barcode !== chosenCandidate.barcode && (visual2.verified || colourClearlyBetter)) {
                console.log(`🎨 Colour-verified swap → "${visual2.chosen.productName}" (sim=${visual2.topSimilarity.toFixed(2)}${visual2.usedAi ? ', AI-confirmed' : ''}) over "${chosenCandidate.productName}"`);
                chosenCandidate = visual2.chosen;
                finalCandidates = [
                  chosenCandidate,
                  ...visual2.reordered.filter(c => c.barcode !== chosenCandidate.barcode),
                  ...finalCandidates.filter(c => c.barcode !== chosenCandidate.barcode),
                ];
              }
            }
          }
        } catch (e) {
          console.warn('Visual match step failed — keeping text match:', e);
        }
      }

      setScanStage("Loading product details...");
      sessionStorage.setItem('scan_candidates', JSON.stringify(finalCandidates));
      navigate(`/product-off/${chosenCandidate.barcode}?from=scan`);
    } catch (error) {
      console.error("Image scan error:", error);
      const msg = error instanceof Error && error.name === 'AbortError'
        ? "Server took too long. Please try again."
        : "Failed to process the image. Please try again.";
      setScanStage("Error — tap to retry");
      toast({
        title: "Processing Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setOffSearchLoading(false);
    }
  }, [toast, requirePriorities, navigate]);

  // Handle file upload for OFF search
  const handleOffFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Stop camera so the uploaded image stays visible in the viewfinder
    stopCamera();

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        processImageForOFF(result);
      }
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again
    e.target.value = "";
  }, [processImageForOFF, stopCamera]);

  // Handle manual correction: user typed the correct name → progressively
  // strip words/special chars until OFF returns a match.
  // e.g. "kitkat nest,le mini matcha" → "kitkat nestle mini matcha"
  //   → "kitkat nestle mini" → "kitkat nestle" → "kitkat"
  const handleManualCorrectionSearch = useCallback(async () => {
    const raw = manualCorrectionInput.trim();
    if (!raw) return;

    setShowManualCorrection(false);
    setNotFoundQuery(null);
    setManualCorrectionInput("");
    setOffSearchLoading(true);
    setScanStage("Searching food database...");
    setScanProgress(20);

    try {
      // Clean special chars (commas, dots, slashes etc.) and normalise whitespace
      const rawCleaned = raw.replace(/[^a-zA-Z0-9\s\-']/g, ' ').replace(/\s+/g, ' ').trim();
      // Ask AI to fix typos
      const cleaned = await fixProductQuery(rawCleaned);
      const words = cleaned.split(' ').filter(Boolean);

      // Try progressively shorter queries: full → drop last word each time
      for (let len = words.length; len >= 1; len--) {
        const query = words.slice(0, len).join(' ');
        setScanStage(`Trying "${query}"...`);
        setScanProgress(20 + Math.round(((words.length - len) / words.length) * 60));
        console.log(`🔍 [manual] Trying: "${query}"`);
        const results = await searchOffProducts(query, 5);

        // Filter: product must contain at least one query word to avoid random results
        const qWords = query.toLowerCase().split(/[\s\-_]+/).filter(w => w.length >= 2);
        const topResults = results.length > 0
          ? results
              .filter(r => resultContainsQueryWord(query, [r.productName, r.brand].filter(Boolean).join(' ')))
              .map(r => ({ result: r, relevance: computeRelevance(r, qWords), ecoScore: calculateEcoScore(r) }))
              .sort((a, b) => b.relevance - a.relevance || b.ecoScore - a.ecoScore)
              .slice(0, 5)
              .map(s => s.result)
          : [];

        if (topResults.length > 0) {
          console.log(`✅ [manual] Found results for: "${query}"`);
          sessionStorage.removeItem('ocr_product_name');
          // Manual search isn't an OpenAI identification — don't carry one over.
          sessionStorage.removeItem('scan_openai_response');
          sessionStorage.removeItem('scan_full_openai_response');
          sessionStorage.setItem('scan_candidates', JSON.stringify(topResults));
          setShowSearch(false);
          navigate(`/product-off/${topResults[0].barcode}?from=scan`);
          return;
        }
        if (len > 1) {
          console.warn(`   ↪ No results for "${query}", stripping last word...`);
        }
      }

      // Nothing found even with single word — show not-found flow
      setNotFoundQuery(cleaned);
    } catch (error) {
      console.error('Manual correction search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOffSearchLoading(false);
    }
  }, [manualCorrectionInput, navigate, toast]);

  // Capture photo from camera with mobile orientation handling
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      toast({
        title: "Capture Error",
        description: "Camera not ready. Try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Get correct dimensions
      const width = video.videoWidth || video.width;
      const height = video.videoHeight || video.height;

      if (!width || !height) {
        throw new Error('Invalid video dimensions');
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, width, height);

      // Convert to JPEG with good quality
      const imageData = canvas.toDataURL("image/jpeg", 0.95);

      if (!imageData || imageData.length < 100) {
        throw new Error('Canvas conversion failed');
      }

      console.log('Photo captured:', imageData.length, 'bytes');
      setFrozenFrame(imageData);
      processImageForOFF(imageData);
      stopCamera();

    } catch (error) {
      console.error('Capture error:', error);
      toast({
        title: "Capture Error",
        description: "Failed to capture photo. Try again.",
        variant: "destructive",
      });
    }
  }, [processImageForOFF, stopCamera, toast]);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setUploadedImage(imageData);
        processImageForOFF(imageData);
      };
      reader.readAsDataURL(file);
    }
  }, [processImageForOFF]);

  // Manual search
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualSearch.trim()) {
      searchProducts(manualSearch);
    }
  };

  const handleShutter = () => {
    if (offSearchLoading) return;
    if (cameraActive) {
      capturePhoto();
    } else {
      offFileInputRef.current?.click();
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, backgroundColor: '#000', overflow: 'hidden', fontFamily: DS.font, display: 'flex', flexDirection: 'column' }}>

      {/* ── Priorities gate ─────────────────────────────────────────────── */}
      {isDefaultPriorities && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 100,
          background: DS.bg,
          display: 'flex', flexDirection: 'column',
          padding: 'calc(env(safe-area-inset-top, 0px) + 52px) 24px calc(env(safe-area-inset-bottom, 0px) + 32px)',
          fontFamily: DS.font,
        }}>
          {/* Close */}
          <Link to="/" style={{ alignSelf: 'flex-start', marginBottom: 32 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: DS.card,
              border: `1px solid ${DS.hair}`,
              boxShadow: '0 2px 6px rgba(0,0,0,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={15} color={DS.ink} />
            </div>
          </Link>

          {/* Icon */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 22,
              background: DS.card,
              border: `1.5px solid ${DS.hair}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}>
              <Settings size={32} color={DS.ink} strokeWidth={1.8} />
            </div>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: DS.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Before you scan
            </p>
            <h2 style={{ fontSize: '1.9rem', fontWeight: 900, color: DS.ink, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 12 }}>
              Set your<br />values first
            </h2>
            <p style={{ fontSize: '0.88rem', color: DS.muted, lineHeight: 1.6 }}>
              Tell us what matters to you — labour rights, environment, animal welfare, or nutrition. Every scan result is personalised to your priorities.
            </p>
          </div>

          {/* Priority category pills */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 32 }}>
            {[
              { icon: Users,  label: 'Labour Rights',  color: DS.bad,            bg: DS.badBg,   border: 'rgba(178,58,43,0.2)' },
              { icon: Leaf,   label: 'Environment',    color: DS.good,           bg: DS.goodBg,  border: 'rgba(31,107,78,0.2)' },
              { icon: Heart,  label: 'Animal Welfare', color: '#9B7AAE',         bg: 'var(--ds-animal-bg, #EAE0EF)',  border: 'rgba(122,90,138,0.2)' },
              { icon: Apple,  label: 'Nutrition',      color: DS.warn,           bg: DS.warnBg,  border: 'rgba(192,130,42,0.2)' },
            ].map(({ icon: Icon, label, color, bg, border }) => (
              <div key={label} style={{
                background: bg, border: `1px solid ${border}`,
                borderRadius: 14, padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
              }}>
                <Icon size={18} color={color} strokeWidth={2} />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: DS.ink }}>{label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link
              to="/preferences"
              onClick={() => stopCamera()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                height: 54, borderRadius: 16, textDecoration: 'none',
                background: DS.ink,
                boxShadow: '0 4px 16px rgba(26,22,20,0.2)',
              }}
            >
              <Settings size={18} style={{ color: DS.card }} strokeWidth={2} />
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: DS.card }}>Set my values</span>
            </Link>
            <p style={{ textAlign: 'center', fontSize: '0.72rem', color: DS.muted, lineHeight: 1.5 }}>
              Takes 30 seconds · you can change them anytime
            </p>
          </div>
        </div>
      )}

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* ════════════════════ TOP CONTROLS (overlay) ════════════════════ */}
      {/* Floats over the full-bleed camera — no solid bar, so the viewfinder
          reaches the very top of the screen. A dark gradient scrim keeps the
          light controls legible against any camera content. */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        zIndex: 20,
        paddingTop: 'env(safe-area-inset-top, 0px)',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.28) 55%, rgba(0,0,0,0) 100%)',
        pointerEvents: 'none',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px 24px',
          pointerEvents: 'auto',
        }}>
          {/* Close */}
          <Link to="/" onClick={() => stopCamera()} style={{ textDecoration: 'none' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 19,
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.14)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={17} style={{ color: '#fff' }} />
            </div>
          </Link>

          {/* Centre label — two-tone "goodscan" lockup, matching the app-wide
              Wordmark. "good" stays white for legibility over the live camera
              (this HUD is always on a dark feed); "scan" uses the brand green. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
            <Logo size={22} />
            <span style={{ fontFamily: DS.font, fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, whiteSpace: 'nowrap' }}>
              <span style={{ color: '#fff' }}>good</span>
              <span style={{ color: '#3DBA82' }}>scan</span>
            </span>
          </div>

          {/* Flash — only when the live camera track supports a torch */}
          {torchSupported ? (
            <button
              onClick={() => setFlashOn(f => !f)}
              aria-label={flashOn ? 'Turn flash off' : 'Turn flash on'}
              aria-pressed={flashOn}
              style={{
                width: 38, height: 38, borderRadius: 19,
                background: flashOn ? 'rgba(245,158,11,0.92)' : 'rgba(0,0,0,0.35)',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                border: `1px solid ${flashOn ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.14)'}`,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              <Zap size={17} strokeWidth={flashOn ? 2.5 : 1.8} color={flashOn ? '#1A1614' : '#fff'} fill={flashOn ? '#1A1614' : 'none'} />
            </button>
          ) : (
            <div style={{ width: 38, height: 38 }} />
          )}
        </div>

        {/* Status pills */}
        {(cameraInitializing || prioritiesJustSaved) && (
          <div style={{
            display: 'flex', justifyContent: 'center', paddingBottom: 14, marginTop: -10,
            pointerEvents: 'auto',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              borderRadius: 50,
              padding: '5px 14px',
            }}>
              {prioritiesJustSaved ? (
                <><Check size={12} style={{ color: '#4ade80' }} /><span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#fff' }}>Values saved — ready!</span></>
              ) : (
                <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite', color: 'rgba(255,255,255,0.8)' }} /><span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Starting camera…</span></>
              )}
            </div>
          </div>
        )}

        {/* Priorities CTA pill */}
        {isDefaultPriorities && !cameraInitializing && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 14, marginTop: -10, pointerEvents: 'auto' }}>
            <Link
              to="/preferences"
              onClick={() => stopCamera()}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: DS.warnBg,
                borderRadius: 50,
                border: `1px solid ${DS.warn}33`,
                padding: '6px 14px',
                textDecoration: 'none',
              }}
            >
              <AlertCircle size={12} style={{ color: DS.warn, flexShrink: 0 }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: DS.ink }}>Set your values to scan</span>
              <ChevronRight size={12} style={{ color: DS.muted }} />
            </Link>
          </div>
        )}
      </div>

      {/* ════════════════════ CAMERA VIEWFINDER (full bleed) ════════════════════ */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Camera video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* Frozen frame / uploaded image / dark placeholder */}
        {!cameraActive && !cameraInitializing && (
          (offSearchImage || frozenFrame)
            ? <img src={offSearchImage || frozenFrame!} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            : <div style={{ position: 'absolute', inset: 0, background: '#111' }} />
        )}

        {/* Scan line when loading */}
        {offSearchLoading && (
          <div style={{
            position: 'absolute', top: '30%', left: '14%', right: '14%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #4ade80, transparent)',
            boxShadow: '0 0 12px #4ade80, 0 0 28px rgba(74,222,128,0.6)',
            animation: 'scanLine 1.8s ease-in-out infinite',
            zIndex: 8,
            borderRadius: 99,
          }} />
        )}

        {/* Scanning bracket corners — bottom corners sit above the floating capture deck */}
        {(['tl','tr','bl','br'] as const).map(corner => {
          const isTop = corner.startsWith('t');
          const isLeft = corner.endsWith('l');
          const clr = offSearchLoading ? 'rgba(74,222,128,0.8)' : 'rgba(255,255,255,0.35)';
          return (
            <div key={corner} style={{
              position: 'absolute',
              top: isTop ? '14%' : undefined,
              bottom: !isTop ? 'calc(env(safe-area-inset-bottom, 0px) + 188px)' : undefined,
              left: isLeft ? '10%' : undefined,
              right: !isLeft ? '10%' : undefined,
              width: 28, height: 28,
              borderTop: isTop ? `2.5px solid ${clr}` : undefined,
              borderBottom: !isTop ? `2.5px solid ${clr}` : undefined,
              borderLeft: isLeft ? `2.5px solid ${clr}` : undefined,
              borderRight: !isLeft ? `2.5px solid ${clr}` : undefined,
              borderRadius: isTop && isLeft ? '8px 0 0 0' : isTop && !isLeft ? '0 8px 0 0' : !isTop && isLeft ? '0 0 0 8px' : '0 0 8px 0',
              zIndex: 8,
              transition: 'border-color 0.3s',
            }} />
          );
        })}

        {/* Centre label — biased upward so the floating capture deck never covers it */}
        <div style={{
          position: 'absolute',
          top: '42%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9, pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          {offSearchLoading ? (
            <>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(74,222,128,0.15)',
                border: '2px solid rgba(74,222,128,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(4px)',
              }}>
                <Loader2 size={22} style={{ color: '#4ade80', animation: 'spin 1s linear infinite' }} />
              </div>
              <div style={{
                background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
                borderRadius: 20, padding: '7px 16px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                minWidth: 180,
              }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4ade80' }}>
                  {scanStage || "Initializing..."}
                </span>
                <div style={{
                  width: '100%', height: 3, borderRadius: 2,
                  background: 'rgba(255,255,255,0.15)', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    background: '#4ade80',
                    width: `${scanProgress}%`,
                    transition: 'width 0.4s ease-out',
                  }} />
                </div>
              </div>
            </>
          ) : !cameraActive && !frozenFrame && !offSearchImage && !cameraInitializing && !cameraError ? (
            <div style={{
              textAlign: 'center',
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: 14, padding: '10px 18px',
            }}>
              <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Point at a product
              </p>
              <p style={{ fontSize: '0.72rem', fontWeight: 500, color: 'rgba(255,255,255,0.55)', margin: '3px 0 0' }}>
                or tap search below
              </p>
            </div>
          ) : null}
        </div>

        {/* Camera-access error card — replaces the old destructive toast. Same
            language as the shelf-scan error state, themed via DS tokens. */}
        {cameraError && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          }}>
            <div style={{
              width: '100%', maxWidth: 360,
              background: DS.card, borderRadius: 22, padding: 24, textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.2)',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px',
                background: DS.badBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertTriangle style={{ width: 26, height: 26, color: DS.bad }} />
              </div>
              <p style={{ fontSize: 17, fontWeight: 800, color: DS.ink, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                {cameraError.title}
              </p>
              <p style={{ fontSize: 13.5, color: DS.muted, margin: '0 0 18px', lineHeight: 1.5 }}>
                {cameraError.suggestion}
              </p>
              <button
                onClick={() => { setCameraError(null); startCamera(); }}
                style={{
                  width: '100%', height: 52, borderRadius: 14, border: 'none',
                  background: DS.ink, color: DS.card, fontWeight: 800, fontSize: 15,
                  fontFamily: DS.font, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <RefreshCw size={17} strokeWidth={2.2} /> Try again
              </button>
              <button
                onClick={() => { setCameraError(null); stopCamera(); navigate('/'); }}
                style={{
                  width: '100%', height: 48, borderRadius: 14,
                  border: `1px solid ${DS.hair}`, background: 'transparent',
                  color: DS.ink, fontWeight: 700, fontSize: 14.5,
                  fontFamily: DS.font, cursor: 'pointer', marginTop: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <X size={17} strokeWidth={2.2} /> Exit
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════ FLOATING CAPTURE DECK ════════════════════ */}
      {/* Glass pill that takes BottomNav's slot once the chrome transition
          completes. Both pills sit at the same `bottom` value; the BottomNav
          slides down while this one slides up, giving a clean handoff with
          no permanent stacking. Hidden whenever a modal sheet/overlay is up. */}
      {!isDefaultPriorities && (() => {
        const captureVisible =
          chromeMode === 'capture'
          && !showSearch
          && !showManualCorrection
          && !productUnknown
          && !notFoundQuery;
        const hiddenTransform =
          'translate(-50%, calc(100% + env(safe-area-inset-bottom, 0px) + 28px))';
        return (
        <div
          aria-label="Camera controls"
          aria-hidden={!captureVisible}
          style={{
            position: 'fixed',
            left: '50%',
            transform: captureVisible ? 'translateX(-50%)' : hiddenTransform,
            opacity: captureVisible ? 1 : 0,
            pointerEvents: captureVisible ? 'auto' : 'none',
            transition:
              'transform 540ms cubic-bezier(0.32, 0.72, 0, 1), opacity 320ms ease-out',
            // Anchored to the exact BottomNav slot — they share this slot,
            // never appearing simultaneously.
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 22px)',
            zIndex: 49,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            width: 'calc(100% - 56px)',
            maxWidth: 360,
            height: 72,
            padding: '0 16px',
            borderRadius: 999,
            background: 'rgba(20,20,22,0.72)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow:
              '0 10px 30px rgba(0,0,0,0.32), 0 2px 8px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* Gallery */}
          <button
            onClick={() => offFileInputRef.current?.click()}
            aria-label="Pick image from gallery"
            style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'transparent', border: 'none', padding: 0,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.85)',
              overflow: 'hidden',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {offSearchImage ? (
              <img src={offSearchImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
            ) : (
              <ImageIcon size={22} strokeWidth={1.8} />
            )}
          </button>

          {/* Shutter — large, glass-friendly */}
          <button
            onClick={handleShutter}
            disabled={offSearchLoading}
            aria-label="Capture"
            style={{
              width: 62, height: 62, borderRadius: '50%',
              backgroundColor: 'transparent',
              border: `3px solid ${offSearchLoading ? '#4ade80' : 'rgba(255,255,255,0.92)'}`,
              cursor: offSearchLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0,
              transition: 'transform 0.12s, border-color 0.2s',
              flexShrink: 0,
            }}
            onTouchStart={e => { if (!offSearchLoading) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.92)'; }}
            onTouchEnd={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          >
            <div style={{
              width: 50, height: 50, borderRadius: '50%',
              background: offSearchLoading ? 'rgba(74,222,128,0.18)' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}>
              {offSearchLoading ? (
                <Loader2 size={22} style={{ color: '#4ade80', animation: 'spin 1s linear infinite' }} />
              ) : (
                <ScanLine size={20} style={{ color: '#15171a' }} />
              )}
            </div>
          </button>

          {/* Search */}
          <button
            onClick={() => setShowSearch(s => !s)}
            aria-label="Search by text"
            style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'transparent', border: 'none', padding: 0,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.85)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Search size={22} strokeWidth={1.8} />
          </button>
        </div>
        );
      })()}

      {/* Product Unknown overlay */}
      {/* AMBIGUOUS — OpenAI couldn't identify the product */}
      {productUnknown && !notFoundQuery && !showManualCorrection && (
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: DS.bg,
            borderRadius: '20px 20px 0 0',
            padding: '20px 20px calc(env(safe-area-inset-bottom, 0px) + 24px)',
            zIndex: 50,
            boxShadow: '0 -4px 24px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: DS.warnBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertCircle size={18} style={{ color: DS.warn }} />
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: '0.95rem', color: DS.ink, marginBottom: 2 }}>Couldn't identify product</p>
              <p style={{ fontSize: '0.78rem', color: DS.muted, lineHeight: 1.4 }}>We couldn't recognise the product from your image.</p>
            </div>
          </div>
          {/* Primary CTA — always the most visible */}
          <button
            onClick={() => { setProductUnknown(false); setShowManualCorrection(true); setManualCorrectionInput(""); }}
            style={{
              width: '100%', height: 52, border: 'none', borderRadius: 14,
              background: DS.good, color: '#fff',
              fontWeight: 700, fontSize: '0.95rem', letterSpacing: 0.2,
              cursor: 'pointer', marginTop: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Search size={18} />
            Type Product Manually
          </button>
          <button
            onClick={() => { setProductUnknown(false); offFileInputRef.current?.click(); }}
            style={{
              width: '100%', height: 44, border: 'none', borderRadius: 14,
              backgroundColor: 'transparent', color: DS.muted,
              fontWeight: 600, fontSize: '0.85rem',
              cursor: 'pointer', marginTop: 6,
            }}
          >
            or retake photo
          </button>
        </div>
      )}

      {/* NOT FOUND — "We searched for X, was the search correct?" */}
      {notFoundQuery && !showManualCorrection && (
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: DS.bg,
            borderRadius: '20px 20px 0 0',
            padding: '20px 20px calc(env(safe-area-inset-bottom, 0px) + 24px)',
            zIndex: 50,
            boxShadow: '0 -4px 24px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: DS.warnBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Search size={18} style={{ color: DS.warn }} />
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: '0.95rem', color: DS.ink, marginBottom: 2 }}>Wrong product?</p>
              <p style={{ fontSize: '0.78rem', color: DS.muted, lineHeight: 1.4 }}>
                We searched for <strong style={{ color: DS.ink }}>"{notFoundQuery}"</strong> but couldn't find it.
              </p>
            </div>
          </div>
          {/* Primary CTA — always the most visible */}
          <button
            onClick={() => { setNotFoundQuery(null); setShowManualCorrection(true); setManualCorrectionInput(""); }}
            style={{
              width: '100%', height: 52, border: 'none', borderRadius: 14,
              background: DS.good, color: '#fff',
              fontWeight: 700, fontSize: '0.95rem', letterSpacing: 0.2,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Search size={18} />
            Type Product Manually
          </button>
        </div>
      )}

      {/* MANUAL CORRECTION — User types the correct product name */}
      {showManualCorrection && (
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: DS.bg,
            borderRadius: '20px 20px 0 0',
            padding: '20px 20px calc(env(safe-area-inset-bottom, 0px) + 24px)',
            zIndex: 50,
            boxShadow: '0 -4px 24px rgba(0,0,0,0.1)',
          }}
        >
          <p style={{ fontWeight: 800, fontSize: '0.95rem', color: DS.ink, marginBottom: 4 }}>Enter product name</p>
          <p style={{ fontSize: '0.78rem', color: DS.muted, marginBottom: 12, lineHeight: 1.4 }}>Type the correct product name and we'll search again.</p>
          <form onSubmit={(e) => { e.preventDefault(); handleManualCorrectionSearch(); }} style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, color: DS.muted, pointerEvents: 'none' }} />
              <input
                autoFocus
                type="text"
                value={manualCorrectionInput}
                onChange={e => setManualCorrectionInput(e.target.value)}
                placeholder="e.g. Coca-Cola, Weetbix…"
                style={{
                  width: '100%', height: 50,
                  border: `1.5px solid ${DS.hair}`,
                  borderRadius: 14,
                  backgroundColor: DS.bg,
                  fontSize: '1rem', padding: '0 14px 0 42px', outline: 'none',
                  color: DS.ink, boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!manualCorrectionInput.trim() || offLoading}
              style={{
                height: 50, borderRadius: 14, border: 'none',
                backgroundColor: manualCorrectionInput.trim() ? DS.ink : DS.bg,
                color: manualCorrectionInput.trim() ? DS.card : DS.muted,
                fontWeight: 700, fontSize: '0.9rem',
                padding: '0 20px', cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {offLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Go'}
            </button>
          </form>
          <button
            onClick={() => { setShowManualCorrection(false); setNotFoundQuery(null); setProductUnknown(false); }}
            style={{
              width: '100%', height: 42, border: 'none', borderRadius: 14,
              backgroundColor: 'transparent', color: DS.muted,
              fontWeight: 600, fontSize: '0.85rem',
              cursor: 'pointer', marginTop: 6,
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* ENRICHMENT SUBMITTED — product queued for data gathering */}
      {/* Search full-screen overlay — UI reserves space at the bottom for the
          floating BottomNav (slides back up when this opens). */}
      {showSearch && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 40,
            background: DS.bg,
            display: 'flex', flexDirection: 'column',
            // Bottom inset clears the BottomNav (22 + 56 height + 14 gap = 92)
            // so nothing inside the panel sits underneath the floating pill.
            padding: 'calc(env(safe-area-inset-top, 0px) + 28px) 20px calc(env(safe-area-inset-bottom, 0px) + 100px)',
            boxSizing: 'border-box',
          }}
        >
          {/* Header with close affordance — replaces the floating capture deck */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: DS.ink, marginBottom: 4 }}>Search manually</p>
              <p style={{ fontSize: '0.82rem', color: DS.muted }}>Search by brand or product name</p>
            </div>
            <button
              onClick={() => setShowSearch(false)}
              aria-label="Close search"
              style={{
                width: 36, height: 36, borderRadius: 18,
                background: DS.card,
                border: `1px solid ${DS.hair}`,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                marginLeft: 12,
              }}
            >
              <X size={16} style={{ color: DS.ink }} />
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); if (barcodeInput.trim()) { handleProductSearch(barcodeInput); } }} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1, minWidth: 0, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, color: DS.muted, pointerEvents: 'none' }} />
              <input
                autoFocus
                type="text"
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                placeholder={scanMode === 'Barcode' ? 'Barcode number…' : 'e.g. Coca-Cola, Weetbix…'}
                style={{
                  width: '100%', height: 50,
                  border: `1.5px solid ${DS.hair}`,
                  borderRadius: 14,
                  backgroundColor: DS.bg,
                  fontSize: '1rem', padding: '0 14px 0 42px', outline: 'none',
                  color: DS.ink,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!barcodeInput.trim() || offLoading}
              style={{
                height: 50, borderRadius: 14, border: 'none',
                backgroundColor: barcodeInput.trim() ? DS.ink : DS.bg,
                color: barcodeInput.trim() ? DS.card : DS.muted,
                fontWeight: 700, fontSize: '0.9rem',
                padding: '0 20px', cursor: 'pointer',
                transition: 'background 0.15s',
                flexShrink: 0,
              }}
            >
              {offLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Go'}
            </button>
          </form>

          {/* Loading indicator */}
          {offLoading && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '20px 0',
            }}>
              <Loader2 size={20} style={{ color: DS.ink, animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '0.9rem', color: DS.muted, fontWeight: 500 }}>Searching for results…</span>
            </div>
          )}

          {/* Priorities prompt if not set */}
          {isDefaultPriorities && (
            <Link
              to="/preferences"
              onClick={() => { setShowSearch(false); stopCamera(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
                padding: '12px 14px',
                backgroundColor: DS.warnBg,
                border: `1px solid ${DS.warn}33`,
                borderRadius: 14,
                textDecoration: 'none',
              }}
            >
              <AlertCircle size={14} style={{ color: DS.warn, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: DS.ink, marginBottom: 1 }}>Set your values first</p>
                <p style={{ fontSize: '0.72rem', color: DS.muted }}>Personalise every scan result</p>
              </div>
              <ChevronRight size={14} style={{ color: DS.warn, flexShrink: 0 }} />
            </Link>
          )}

          <div style={{ flex: 1 }} />
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={offFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleOffFileUpload}
        style={{ display: 'none' }}
      />

      {/* CSS animations */}
      <style>{`
        @keyframes scanLine {
          0%   { top: 15%; opacity: 0.9; }
          50%  { top: 70%; opacity: 0.5; }
          100% { top: 15%; opacity: 0.9; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {/* BottomNav is rendered once in RootLayout and persists across page
          transitions — we drive its slide animation via useBottomNav() above. */}

    </div>
  );
};

export default Scan;
