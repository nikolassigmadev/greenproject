import { useState, useRef, useCallback, useEffect } from "react";
import { lookupHardcodedBarcodes, lookupHardcodedImage } from "@/data/productBarcodeMap";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Camera, Upload, Search, Loader2, AlertCircle, X, ScanLine, Image as ImageIcon, Plus, Leaf, BarChart3, QrCode, Settings, Users, Heart, Apple, ChevronRight, Check, Zap } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { Input } from "@/components/ui/input";
import { CalAIButton, ButtonGroup } from "@/components/CalAIButton";
import { AlertBox, AlertList } from "@/components/AlertBox";
import { StatsDisplay } from "@/components/StatsDisplay";
import { ProductCard } from "@/components/ProductCard";
import { OpenFoodFactsCard } from "@/components/OpenFoodFactsCard";
import { GreenerSwapCard } from "@/components/GreenerSwapCard";
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
import { lookupBarcode, isValidBarcode, searchProducts as searchOffProducts, searchBetterAlternatives } from "@/services/openfoodfacts";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import { DS } from "@/styles/design-tokens";
import { getBackendUrl } from "@/config/backend";
import { pickBestMatch, validateBarcodeResult, type MatchResult } from "@/utils/productRelevance";

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
 */
const resultContainsQueryWord = (query: string, productText: string): boolean => {
  const qWords = query.toLowerCase().split(/[\s\-_,/&().]+/).filter(w => w.length >= 3);
  const pText = productText.toLowerCase();
  const pWords = pText.split(/[\s\-_,/&().]+/).filter(w => w.length >= 2);
  // At least one query word (≥3 chars) must appear in the product text (substring or fuzzy)
  return qWords.length === 0 || qWords.some(qw =>
    pText.includes(qw) || fuzzyWordMatch(qw, pWords)
  );
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
        // Sort: eco data completeness first so the richest result wins,
        // then relevance as tiebreaker for equal eco scores.
        charFiltered.sort((a, b) =>
          b.ecoScore !== a.ecoScore
            ? b.ecoScore - a.ecoScore
            : b.relevance - a.relevance
        );
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
  const [offAlternatives, setOffAlternatives] = useState<OpenFoodFactsResult[]>([]);
  const [offAlternativeLoading, setOffAlternativeLoading] = useState(false);
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
  const [scanMode, setScanMode] = useState<'Scan Food' | 'Barcode' | 'Food label'>('Scan Food');

  // Auto-open manual search if ?manual=true
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('manual') === 'true') {
      setShowSearch(true);
    }
  }, []);

  // Set html background to white while Scan is mounted (matches white chrome)
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.background;
    html.style.background = '#F7F6F3';
    return () => { html.style.background = prev; };
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

  // Search for greener alternatives when OFF results have a poor eco-score
  useEffect(() => {
    setOffAlternatives([]);
    // Check the first result (primary product) for poor eco-score
    const primaryResult = offSearchResults[0] || offResult;
    if (!primaryResult?.found) return;

    const grade = primaryResult.ecoscoreGrade?.toLowerCase();
    if (!grade || !['d', 'e'].includes(grade)) return;

    setOffAlternativeLoading(true);
    searchBetterAlternatives(primaryResult)
      .then((alts) => setOffAlternatives(alts))
      .catch(() => setOffAlternatives([]))
      .finally(() => setOffAlternativeLoading(false));
  }, [offSearchResults, offResult]);

  // Start camera with improved browser and mobile compatibility
  const startCamera = useCallback(async () => {
    try {
      // Clear any previous timeout
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

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

      toast({
        title: errorMessage,
        description: suggestion,
        variant: "destructive",
      });
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
  }, []);

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

      // Fetch a small pool — we navigate to the top result immediately
      const results = await searchOffProducts(cleanedName, 5);

      // Filter: product must contain at least one query word to avoid random results
      const queryWords = cleanedName.toLowerCase().split(/[\s\-_]+/).filter(w => w.length >= 2);
      const topResults = results.length > 0
        ? results
            .filter(r => resultContainsQueryWord(cleanedName, [r.productName, r.brand].filter(Boolean).join(' ')))
            .map(r => ({ result: r, relevance: computeRelevance(r, queryWords), ecoScore: calculateEcoScore(r) }))
            .sort((a, b) => b.relevance - a.relevance || b.ecoScore - a.ecoScore)
            .slice(0, 5)
            .map(s => s.result)
        : [];

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
    setScanStage("Extracting text from image...");
    setScanProgress(10);
    setOffSearchResults([]);
    setOffSearchText("");
    setOffSearchImage(imageData);
    setProductUnknown(false);
    setNotFoundQuery(null);
    setShowManualCorrection(false);
    // Clear stale OCR name from previous scan
    sessionStorage.removeItem('ocr_product_name');

    try {
      // Step 1: OpenAI identifies the product
      const identified = await advancedProductOCR(imageData);
      setScanStage("Product identified");
      setScanProgress(30);

      const isUnknownResponse = (s: string | null | undefined) =>
        !s || s.trim().toLowerCase() === 'unknown' || s.trim().toLowerCase() === 'none';

      if (!identified.success || (isUnknownResponse(identified.productName) && isUnknownResponse(identified.brandName))) {
        setProductUnknown(true);
        return;
      }

      // Store OCR-identified product name so the detail page can use it as heading
      const ocrProductName = !isUnknownResponse(identified.productName) ? identified.productName!.trim() : null;
      if (ocrProductName) {
        sessionStorage.setItem('ocr_product_name', ocrProductName);
      }

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
        setProductUnknown(true);
        return;
      }

      const cleanedQuery = cleanOCRQuery(rawQuery);
      // Search order: product name alone first (most distinctive), then product+brand, then full raw
      const searchQueries: string[] = [];
      const addUnique = (q: string) => { if (q && !searchQueries.some(s => s.toLowerCase() === q.toLowerCase())) searchQueries.push(q); };
      // Lead with product name — this is what OpenFoodFacts matches best
      if (prodOnly) addUnique(prodOnly);
      // Then product + brand (brand helps disambiguate if product name is generic)
      if (prodOnly && brandOnly) addUnique(`${prodOnly} ${brandOnly}`);
      // Then full raw/cleaned as fallback
      addUnique(rawQuery);
      if (cleanedQuery !== rawQuery) addUnique(cleanedQuery);
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

      for (let qi = 0; qi < searchQueries.length; qi++) {
        const q = searchQueries[qi];
        setScanStage(`Searching "${q}"...`);
        setScanProgress(60 + Math.round((qi / searchQueries.length) * 25));
        console.log(`   [attempt ${qi + 1}/${searchQueries.length}] Searching: "${q}"`);

        const results = await searchOffProducts(q, 20);
        if (results.length === 0) {
          console.warn(`   ↪ No results for "${q}"`);
          continue;
        }

        const topResults = filterBestProducts(results, q);
        if (topResults.length === 0) {
          console.warn(`   ↪ Results for "${q}" filtered out by relevance`);
          continue;
        }

        // Score against the ORIGINAL OCR query to prevent brand-only fallback winning
        const match = pickBestMatch(topResults, rawQuery, q);
        console.log(`   [relevance] query="${q}" → passed=${match.passedRelevanceGate}, brandOnly=${match.brandOnlyFallback}, confidence=${match.confidence.toFixed(2)}`);

        if (match.passedRelevanceGate && match.product) {
          bestMatch = match;
          allCandidates = topResults;
          console.log(`✅ Matched: "${match.product.productName}" by ${match.product.brand} (query="${q}", confidence=${match.confidence.toFixed(2)})`);
          break;
        }

        // A brand-only fallback is never auto-accepted — log and continue trying
        if (match.brandOnlyFallback) {
          console.warn(`   ↪ Brand-only fallback for "${q}" — not auto-accepting`);
        }
      }

      if (!bestMatch || !bestMatch.product) {
        console.warn(`⚠️ No match found after ${searchQueries.length} query attempts for "${rawQuery}"`);
        setNotFoundQuery(cleanedQuery);
        return;
      }

      setScanStage("Loading product details...");
      setScanProgress(95);
      const chosenCandidate = bestMatch.product;
      const finalCandidates = [chosenCandidate, ...allCandidates.filter(c => c.barcode !== chosenCandidate.barcode)];
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

  // ── Shared chrome heights ──
  const TOP_BAR_H = 96;   // white top bar (includes safe area)
  const BOT_BAR_H = 160;  // white bottom bar (includes safe area)

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 'calc(-1 * env(safe-area-inset-bottom, 0px))', zIndex: 60, backgroundColor: '#000', overflow: 'hidden', fontFamily: '"Inter", -apple-system, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>

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

      {/* ════════════════════ WHITE TOP BAR ════════════════════ */}
      <div style={{
        flexShrink: 0,
        background: DS.bg,
        paddingTop: 'env(safe-area-inset-top, 0px)',
        zIndex: 20,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px 14px',
        }}>
          {/* Close */}
          <Link to="/" onClick={() => stopCamera()} style={{ textDecoration: 'none' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: DS.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={16} style={{ color: DS.ink }} />
            </div>
          </Link>

          {/* Centre label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Logo size={22} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: DS.ink, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              GoodScan
            </span>
          </div>

          {/* Flash */}
          <button
            onClick={() => setFlashOn(f => !f)}
            style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: flashOn ? DS.warnBg : DS.hair,
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            <Zap size={16} strokeWidth={flashOn ? 2.5 : 1.8} color={flashOn ? '#F59E0B' : '#8C8278'} />
          </button>
        </div>

        {/* Status pills inside top bar */}
        {(cameraInitializing || prioritiesJustSaved) && (
          <div style={{
            display: 'flex', justifyContent: 'center', paddingBottom: 10,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#E8E6E1',
              borderRadius: 50,
              padding: '5px 14px',
            }}>
              {prioritiesJustSaved ? (
                <><Check size={12} style={{ color: '#1F6B4E' }} /><span style={{ fontSize: '0.72rem', fontWeight: 600, color: DS.ink }}>Values saved — ready!</span></>
              ) : (
                <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite', color: DS.muted }} /><span style={{ fontSize: '0.72rem', fontWeight: 600, color: DS.muted }}>Starting camera…</span></>
              )}
            </div>
          </div>
        )}

        {/* Priorities CTA pill inside top bar */}
        {isDefaultPriorities && !cameraInitializing && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 10 }}>
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

      {/* ════════════════════ CAMERA VIEWFINDER ════════════════════ */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '18px', margin: '0 4px' }}>
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

        {/* Scanning bracket corners */}
        {(['tl','tr','bl','br'] as const).map(corner => {
          const isTop = corner.startsWith('t');
          const isLeft = corner.endsWith('l');
          const clr = offSearchLoading ? 'rgba(74,222,128,0.8)' : 'rgba(255,255,255,0.35)';
          return (
            <div key={corner} style={{
              position: 'absolute',
              top: isTop ? '12%' : undefined,
              bottom: !isTop ? '12%' : undefined,
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

        {/* Centre label */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
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
          ) : !cameraActive && !frozenFrame && !offSearchImage && !cameraInitializing ? (
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
      </div>

      {/* ════════════════════ WHITE BOTTOM BAR ════════════════════ */}
      <div style={{
        flexShrink: 0,
        background: DS.bg,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 20,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 36, padding: '14px 40px 10px',
        }}>
          {/* Gallery */}
          <button
            onClick={() => { if (!isDefaultPriorities) offFileInputRef.current?.click(); }}
            disabled={isDefaultPriorities}
            style={{
              width: 48, height: 48, borderRadius: 14,
              backgroundColor: DS.bg,
              border: 'none',
              color: DS.ink,
              cursor: isDefaultPriorities ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              opacity: isDefaultPriorities ? 0.35 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {offSearchImage ? (
              <img src={offSearchImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <ImageIcon size={20} strokeWidth={1.5} />
            )}
          </button>

          {/* Shutter */}
          <button
            onClick={handleShutter}
            disabled={offSearchLoading || isDefaultPriorities}
            style={{
              width: 70, height: 70, borderRadius: '50%',
              backgroundColor: 'transparent',
              border: `3.5px solid ${isDefaultPriorities ? '#ddd' : offSearchLoading ? '#4ade80' : DS.ink}`,
              cursor: (offSearchLoading || isDefaultPriorities) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
              padding: 0,
            }}
            onTouchStart={e => { if (!isDefaultPriorities && !offSearchLoading) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.92)'; }}
            onTouchEnd={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: isDefaultPriorities
                ? '#eee'
                : offSearchLoading
                  ? 'rgba(74,222,128,0.2)'
                  : DS.ink,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}>
              {offSearchLoading ? (
                <Loader2 size={22} style={{ color: '#4ade80', animation: 'spin 1s linear infinite' }} />
              ) : (
                <ScanLine size={22} style={{ color: DS.card }} />
              )}
            </div>
          </button>

          {/* Search */}
          <button
            onClick={() => setShowSearch(s => !s)}
            style={{
              width: 48, height: 48, borderRadius: 14,
              backgroundColor: DS.bg,
              border: 'none',
              color: DS.ink,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Search size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>

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
      {/* Search full-screen overlay */}
      {showSearch && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 40,
            background: DS.bg,
            display: 'flex', flexDirection: 'column',
            padding: 'calc(env(safe-area-inset-top, 0px) + 52px) 20px calc(env(safe-area-inset-bottom, 0px) + 28px)',
            boxSizing: 'border-box',
          }}
        >
          <p style={{ fontSize: '1.25rem', fontWeight: 800, color: DS.ink, marginBottom: 4 }}>Search manually</p>
          <p style={{ fontSize: '0.82rem', color: DS.muted, marginBottom: 18 }}>Search by brand or product name</p>

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

          <button
            onClick={() => setShowSearch(false)}
            style={{
              width: '100%', padding: '14px',
              border: `1.5px solid ${DS.hair}`,
              borderRadius: 14,
              backgroundColor: DS.bg,
              color: DS.muted, fontWeight: 600, fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
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

    </div>
  );
};

export default Scan;
