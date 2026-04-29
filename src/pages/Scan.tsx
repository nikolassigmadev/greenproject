import { useState, useRef, useCallback, useEffect } from "react";
import { lookupHardcodedBarcodes, lookupHardcodedImage } from "@/data/productBarcodeMap";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Camera, Upload, Search, Loader2, AlertCircle, X, ScanLine, Image as ImageIcon, Plus, Leaf, BarChart3, QrCode, Settings, Users, Heart, Apple, ChevronRight, Check, Zap } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
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
import { loadPriorities, DEFAULT_PRIORITIES, type UserPriorities } from "@/utils/userPreferences";
import { lookupBarcode, isValidBarcode, searchProducts as searchOffProducts, searchBetterAlternatives } from "@/services/openfoodfacts";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";

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

// Compute how relevant a product is to the query (0–1).
// Weighted by word length so short noise words don't dominate.
const computeRelevance = (result: OpenFoodFactsResult, words: string[]): number => {
  if (words.length === 0) return 0;
  const haystack = `${(result.productName || '').toLowerCase()} ${(result.brand || '').toLowerCase()}`;
  let matchedWeight = 0;
  let totalWeight = 0;
  for (const w of words) {
    const weight = w.length; // longer words carry more signal
    totalWeight += weight;
    if (haystack.includes(w)) matchedWeight += weight;
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

      // Require at least 40% of the query's weighted characters to match.
      // For a 1-word query the threshold is effectively "must contain that word".
      // For multi-word queries at least the longest or two mid-size words must hit.
      const MIN_RELEVANCE = words.length === 1 ? 1.0 : 0.4;

      const relevant = scored.filter(s => s.relevance >= MIN_RELEVANCE);

      // If nothing clears the strict bar, fall back to any product that matches
      // at least one of the longer words (≥4 chars), ranked by how many match.
      const fallback = relevant.length === 0
        ? scored.filter(s => s.relevance > 0 && words.some(w => w.length >= 4 &&
            `${(s.result.productName || '').toLowerCase()} ${(s.result.brand || '').toLowerCase()}`.includes(w)))
        : [];

      const candidates = relevant.length > 0 ? relevant : fallback;

      if (candidates.length > 0) {
        // Sort: relevance first (descending), then eco data completeness as tiebreaker
        candidates.sort((a, b) =>
          b.relevance !== a.relevance
            ? b.relevance - a.relevance
            : b.ecoScore - a.ecoScore
        );
        return candidates.slice(0, 5).map(s => s.result);
      }

      // Nothing matched at all — return empty so the caller can widen the search
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
  const [showDetailedEnvironmental, setShowDetailedEnvironmental] = useState(false);
  const [selectedEnvironmentalResult, setSelectedEnvironmentalResult] = useState<OpenFoodFactsResult | null>(null);
  const [offAlternatives, setOffAlternatives] = useState<OpenFoodFactsResult[]>([]);
  const [offAlternativeLoading, setOffAlternativeLoading] = useState(false);
  const offFileInputRef = useRef<HTMLInputElement>(null);
  const [scanProgress, setScanProgress] = useState(0);
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

  // When arriving from Preferences save, scroll to viewfinder and show message
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

  const isDefaultPriorities =
    priorities.environment === DEFAULT_PRIORITIES.environment &&
    priorities.laborRights === DEFAULT_PRIORITIES.laborRights &&
    priorities.animalWelfare === DEFAULT_PRIORITIES.animalWelfare &&
    priorities.nutrition === DEFAULT_PRIORITIES.nutrition;

  // Auto-start camera when page mounts
  useEffect(() => {
    startCamera();
    return () => { stopCamera(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debug: Check if video element is mounted
  useEffect(() => {
    console.log('Video ref status:', Boolean(videoRef.current));
    console.log('Canvas ref status:', Boolean(canvasRef.current));
  }, [cameraActive, cameraInitializing]);

  // Animated scan progress
  useEffect(() => {
    if (!offSearchLoading) {
      setScanProgress(0);
      return;
    }
    setScanProgress(5);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 90) return prev;
        return Math.min(90, prev + Math.random() * 8 + 2);
      });
    }, 300);
    return () => clearInterval(interval);
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
      setCameraActive(false);
      setCameraInitializing(false);
    }
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
                  // Cross-validate: make sure the found product name roughly matches
                  // what OCR identified (prevents hallucinated barcodes returning wrong products)
                  const ocrName = `${advancedResult.brandName || ''} ${advancedResult.productName || ''}`.toLowerCase().trim();
                  const foundName = `${result.productName || ''} ${result.brand || ''}`.toLowerCase().trim();
                  const ocrWords = ocrName.split(/\s+/).filter(w => w.length >= 3);
                  const nameMatches = ocrWords.length === 0 || ocrWords.some(w => foundName.includes(w));

                  if (!nameMatches) {
                    console.warn(`⚠️ Barcode product "${foundName}" doesn't match OCR name "${ocrName}" — ignoring barcode result`);
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

      // Fallback to standard OpenAI if advanced didn't extract text
      if (!extractedText) {
        try {
          console.log("📡 Attempting standard OpenAI Vision API...");
          const openaiResult = await recognizeImageWithOpenAI(imageData);

          if (openaiResult.success && openaiResult.text) {
            console.log("✅ Standard OpenAI extraction successful");
            extractedText = openaiResult.text;
          } else {
            console.warn("Standard OpenAI failed:", openaiResult.error);
          }
        } catch (error) {
          console.warn("Standard OpenAI error:", error);
        }
      }

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
      // Fetch a larger pool (20) so we can pick the 3 with the most eco data
      const results = await searchOffProducts(productName.trim(), 20);

      // Filter to show only the best 3 results (ranked by eco data completeness)
      const topResults = filterBestProducts(results, productName.trim());

      if (topResults.length > 0) {
        sessionStorage.setItem('scan_candidates', JSON.stringify(topResults));
        navigate(`/product-off/${topResults[0].barcode}?from=scan`);
      } else {
        toast({
          title: "No Products Found",
          description: `No products found for "${productName}"`,
          variant: "destructive",
        });
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
    setOffSearchResults([]);
    setOffSearchText("");
    setOffSearchImage(imageData);
    setProductUnknown(false);

    try {
      // Step 1: OpenAI identifies the product
      const identified = await advancedProductOCR(imageData);

      const isUnknownResponse = (s: string | null | undefined) =>
        !s || s.trim().toLowerCase() === 'unknown' || s.trim().toLowerCase() === 'none';

      if (!identified.success || (isUnknownResponse(identified.productName) && isUnknownResponse(identified.brandName))) {
        setProductUnknown(true);
        return;
      }

      // Step 1b: Check hardcoded barcode map before anything else
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

      // Step 2: If a barcode was spotted, look it up directly — most precise
      if (identified.barcode && isValidBarcode(identified.barcode)) {
        const barcodeResult = await lookupBarcode(identified.barcode);
        if (barcodeResult.found) {
          const hardcodedImage = lookupHardcodedImage(identified.barcode);
          const finalResult = hardcodedImage ? { ...barcodeResult, imageUrl: hardcodedImage } : barcodeResult;
          sessionStorage.setItem('scan_candidates', JSON.stringify([finalResult]));
          navigate(`/product-off/${finalResult.barcode}?from=scan`);
          return;
        }
      }

      // Step 3: Search OFF — searchOffProducts internally tries multiple query
      // variations (full → prefix shrink → suffix → brand alone), so one call suffices.
      const fullQuery = [identified.brandName, identified.productName]
        .filter(s => !isUnknownResponse(s))
        .join(' ')
        .trim();

      if (!fullQuery) {
        setProductUnknown(true);
        return;
      }

      setOffSearchText(fullQuery);
      const results = await searchOffProducts(fullQuery, 20);

      if (results.length === 0) {
        toast({
          title: "No Results",
          description: `Couldn't find "${fullQuery}" or any simplified version in OpenFoodFacts.`,
          variant: "destructive",
        });
        return;
      }

      // Step 4: Rank by eco data completeness and navigate to best result
      console.log(`Found results for query: "${fullQuery}"`);
      const topResults = filterBestProducts(results, fullQuery);
      const candidates = topResults.length > 0 ? topResults : results;
      sessionStorage.setItem('scan_candidates', JSON.stringify(candidates));
      navigate(`/product-off/${candidates[0].barcode}?from=scan`);
    } catch (error) {
      console.error("Image scan error:", error);
      toast({
        title: "Processing Error",
        description: "Failed to process the image. Please try again.",
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
  }, [processImageForOFF]);

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
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, backgroundColor: '#000', overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Full-screen camera video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Frozen frame after capture, or dark background when camera not yet active */}
      {!cameraActive && !cameraInitializing && (
        frozenFrame
          ? <img src={frozenFrame} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
          : <div style={{ position: 'absolute', inset: 0, background: '#000' }} />
      )}

      {/* Diagonal stripe overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
        backgroundImage: 'repeating-linear-gradient(45deg, transparent 0px, transparent 4px, rgba(255,255,255,0.012) 4px, rgba(255,255,255,0.012) 8px)',
      }} />

      {/* Scan line when loading */}
      {offSearchLoading && (
        <div style={{
          position: 'absolute', top: '22%', left: '10%', right: '10%',
          height: '2px',
          background: '#2979FF',
          boxShadow: '0 0 10px #2979FF, 0 0 24px rgba(41,121,255,0.5)',
          animation: 'scanLine 1.8s ease-in-out infinite',
          zIndex: 8,
          borderRadius: 99,
        }} />
      )}

      {/* Scanning bracket corners — rounded, blue */}
      {(['tl','tr','bl','br'] as const).map(corner => {
        const top = corner.startsWith('t');
        const left = corner.endsWith('l');
        return (
          <div key={corner} style={{
            position: 'absolute',
            top: top ? '20%' : undefined,
            bottom: !top ? '34%' : undefined,
            left: left ? '10%' : undefined,
            right: !left ? '10%' : undefined,
            width: 52, height: 52,
            borderTop: top ? '3px solid #2979FF' : undefined,
            borderBottom: !top ? '3px solid #2979FF' : undefined,
            borderLeft: left ? '3px solid #2979FF' : undefined,
            borderRight: !left ? '3px solid #2979FF' : undefined,
            borderRadius: top && left ? '12px 0 0 0' : top && !left ? '0 12px 0 0' : !top && left ? '0 0 0 12px' : '0 0 12px 0',
            zIndex: 8,
          }} />
        );
      })}

      {/* Corner label */}
      <div style={{ position: 'absolute', top: 'calc(20% - 22px)', left: '10%', fontFamily: "'Inter', sans-serif", fontSize: '0.62rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.02em', zIndex: 9 }}>
        {offSearchLoading ? `Scanning ${Math.round(scanProgress)}%` : 'Aim here'}
      </div>

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        paddingTop: 'max(52px, env(safe-area-inset-top))',
        paddingLeft: 16, paddingRight: 16, paddingBottom: 14,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: 20,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)',
      }}>
        <Link to="/" onClick={() => stopCamera()}>
          <button style={{
            width: 38, height: 38, borderRadius: 11,
            backgroundColor: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} />
          </button>
        </Link>

        {/* Mode selector */}
        <div style={{
          display: 'flex', gap: 4,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: 30,
          padding: '4px',
          border: '1px solid rgba(255,255,255,0.12)',
        }}>
          {(['Scan Food', 'Barcode', 'Food label'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setScanMode(mode)}
              style={{
                padding: '5px 13px', borderRadius: 22,
                border: 'none', cursor: 'pointer',
                background: scanMode === mode ? '#fff' : 'transparent',
                color: scanMode === mode ? '#111827' : 'rgba(255,255,255,0.7)',
                fontSize: '0.7rem', fontWeight: 700,
                letterSpacing: '0.01em',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowSearch(s => !s)}
          style={{
            width: 38, height: 38, borderRadius: 11,
            backgroundColor: showSearch ? '#2979FF' : 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: showSearch ? 'none' : '1px solid rgba(255,255,255,0.2)',
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Search size={16} />
        </button>
      </div>

      {/* Status bar */}
      {(cameraInitializing || offSearchLoading || prioritiesJustSaved) && (
        <div style={{
          position: 'absolute',
          top: 'calc(max(52px, env(safe-area-inset-top)) + 62px)',
          left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 6,
          backgroundColor: 'rgba(255,255,255,0.95)',
          border: '1px solid #E5E7EB',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          borderRadius: 50,
          padding: '6px 14px',
          whiteSpace: 'nowrap', zIndex: 15,
        }}>
          {offSearchLoading ? (
            <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite', color: '#2979FF' }} /><span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2979FF' }}>Scanning {Math.round(scanProgress)}%</span></>
          ) : prioritiesJustSaved ? (
            <><Check size={12} style={{ color: '#00C853' }} /><span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#00C853' }}>Values saved — ready!</span></>
          ) : cameraInitializing ? (
            <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite', color: '#2979FF' }} /><span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Starting camera…</span></>
          ) : null}
        </div>
      )}

      {/* Priorities CTA */}
      {isDefaultPriorities && (
        <Link
          to="/preferences"
          onClick={() => stopCamera()}
          style={{
            position: 'absolute',
            top: 'calc(max(52px, env(safe-area-inset-top)) + 62px)',
            left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: 8,
            backgroundColor: 'rgba(255,255,255,0.95)',
            border: '1px solid #FDE68A',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            borderRadius: 50,
            color: '#92400E', padding: '7px 14px',
            whiteSpace: 'nowrap', zIndex: 15, textDecoration: 'none',
          }}
        >
          <AlertCircle size={13} style={{ color: '#F59E0B', flexShrink: 0 }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Set your values to scan</span>
          <ChevronRight size={13} style={{ color: '#F59E0B' }} />
        </Link>
      )}

      {/* Bottom panel */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: '#fff',
        borderTop: '1px solid #E5E7EB',
        borderRadius: '20px 20px 0 0',
        paddingBottom: 'max(28px, env(safe-area-inset-bottom))',
        zIndex: 20,
        boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
      }}>
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 2 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: '#E5E7EB' }} />
        </div>

        {/* Inline search */}
        <form
          onSubmit={e => { e.preventDefault(); if (inlineSearch.trim()) { handleProductSearch(inlineSearch); setInlineSearch(""); } }}
          style={{ display: 'flex', gap: 8, padding: '8px 16px 10px' }}
        >
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, color: '#9CA3AF', pointerEvents: 'none' }} />
            <input
              type="text"
              value={inlineSearch}
              onChange={e => setInlineSearch(e.target.value)}
              placeholder="Search a product name…"
              style={{
                width: '100%', height: 42,
                backgroundColor: '#F5F7FA',
                border: '1px solid #E5E7EB',
                borderRadius: 12,
                color: '#111827', fontSize: '0.875rem',
                paddingLeft: 34, paddingRight: 12, outline: 'none',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!inlineSearch.trim() || offLoading}
            style={{
              height: 42, borderRadius: 12, border: 'none',
              backgroundColor: inlineSearch.trim() ? '#2979FF' : '#F5F7FA',
              color: inlineSearch.trim() ? '#fff' : '#9CA3AF',
              fontWeight: 700, fontSize: '0.8rem',
              padding: '0 16px', cursor: inlineSearch.trim() ? 'pointer' : 'default',
              whiteSpace: 'nowrap', flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >
            {offLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Search'}
          </button>
        </form>

        {/* Camera controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 40px 12px' }}>
          {/* Flash toggle */}
          <button
            onClick={() => setFlashOn(f => !f)}
            style={{
              width: 50, height: 50, borderRadius: '50%',
              backgroundColor: flashOn ? '#FEF3C7' : '#F5F7FA',
              border: `1px solid ${flashOn ? '#FDE68A' : '#E5E7EB'}`,
              color: flashOn ? '#D97706' : '#9CA3AF',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Zap size={20} strokeWidth={1.8} />
          </button>

          {/* Shutter — blue circle */}
          <button
            onClick={handleShutter}
            disabled={offSearchLoading || isDefaultPriorities}
            style={{
              width: 72, height: 72, borderRadius: '50%',
              backgroundColor: isDefaultPriorities ? '#E5E7EB' : offSearchLoading ? '#EBF2FF' : '#2979FF',
              border: `4px solid ${isDefaultPriorities ? '#D1D5DB' : '#fff'}`,
              boxShadow: (!offSearchLoading && !isDefaultPriorities) ? '0 4px 20px rgba(41,121,255,0.4)' : '0 2px 8px rgba(0,0,0,0.1)',
              cursor: (offSearchLoading || isDefaultPriorities) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
              outline: `3px solid ${isDefaultPriorities ? 'transparent' : '#2979FF'}`,
              outlineOffset: 3,
            }}
            onTouchStart={e => { if (!isDefaultPriorities) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.93)'; }}
            onTouchEnd={e => { if (!isDefaultPriorities) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          >
            {offSearchLoading
              ? <Loader2 size={24} style={{ color: '#2979FF', animation: 'spin 1s linear infinite' }} />
              : <div style={{ width: 26, height: 26, borderRadius: '50%', background: isDefaultPriorities ? '#9CA3AF' : '#fff' }} />
            }
          </button>

          {/* Gallery */}
          <button
            onClick={() => { if (!isDefaultPriorities) offFileInputRef.current?.click(); }}
            disabled={isDefaultPriorities}
            style={{
              width: 50, height: 50, borderRadius: '50%',
              backgroundColor: '#F5F7FA',
              border: '1px solid #E5E7EB',
              color: '#9CA3AF',
              cursor: isDefaultPriorities ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              opacity: isDefaultPriorities ? 0.4 : 1,
            }}
          >
            {offSearchImage ? (
              <img src={offSearchImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              <ImageIcon size={20} strokeWidth={1.5} />
            )}
          </button>
        </div>

        {/* Bottom hint */}
        <div style={{ textAlign: 'center', paddingBottom: 4 }}>
          <span style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 500 }}>
            {cameraActive ? 'Point camera at product · Tap to capture' : 'Tap the button to capture a photo'}
          </span>
        </div>
      </div>

      {/* Product Unknown overlay */}
      {productUnknown && (
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: '#fff',
            borderTop: '1px solid #E5E7EB',
            borderRadius: '20px 20px 0 0',
            padding: '20px 20px max(32px, env(safe-area-inset-bottom))',
            zIndex: 50,
            boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertCircle size={18} style={{ color: '#EF4444' }} />
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: '0.95rem', color: '#111827', marginBottom: 2 }}>Product not found</p>
              <p style={{ fontSize: '0.78rem', color: '#6B7280', lineHeight: 1.4 }}>Try a clearer photo of the barcode or label.</p>
            </div>
          </div>
          <button
            onClick={() => { setProductUnknown(false); offFileInputRef.current?.click(); }}
            style={{
              width: '100%', height: 48, border: 'none', borderRadius: 14,
              backgroundColor: '#2979FF', color: '#fff',
              fontWeight: 700, fontSize: '0.9rem',
              cursor: 'pointer', marginTop: 8,
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Search / manual input overlay */}
      {showSearch && (
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: '#fff',
            borderTop: '1px solid #E5E7EB',
            borderRadius: '20px 20px 0 0',
            padding: '16px 18px max(28px, env(safe-area-inset-bottom))',
            zIndex: 40,
            boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
          }}
        >
          {/* Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: '#E5E7EB' }} />
          </div>

          <p style={{ fontSize: '1rem', fontWeight: 800, color: '#111827', marginBottom: 4 }}>Search by name or barcode</p>
          <p style={{ fontSize: '0.78rem', color: '#6B7280', marginBottom: 14 }}>Enter a product name or scan barcode number</p>

          <form onSubmit={(e) => { e.preventDefault(); if (barcodeInput.trim()) { handleProductSearch(barcodeInput); setShowSearch(false); } }} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, color: '#9CA3AF', pointerEvents: 'none' }} />
              <input
                autoFocus
                type="text"
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                placeholder={scanMode === 'Barcode' ? 'Barcode number…' : 'e.g. Coca-Cola, Weetbix…'}
                style={{
                  flex: 1, height: 46, width: '100%',
                  border: '1.5px solid #2979FF',
                  borderRadius: 12,
                  backgroundColor: '#F0F5FF',
                  fontSize: '0.875rem', padding: '0 12px 0 36px', outline: 'none',
                  color: '#111827',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!barcodeInput.trim() || offLoading}
              style={{
                height: 46, borderRadius: 12, border: 'none',
                backgroundColor: barcodeInput.trim() ? '#2979FF' : '#F5F7FA',
                color: barcodeInput.trim() ? '#fff' : '#9CA3AF',
                fontWeight: 700, fontSize: '0.85rem',
                padding: '0 18px', cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {offLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Go'}
            </button>
          </form>

          {/* Priorities prompt if not set */}
          {isDefaultPriorities && (
            <Link
              to="/preferences"
              onClick={() => { setShowSearch(false); stopCamera(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
                padding: '10px 12px',
                backgroundColor: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: 12,
                textDecoration: 'none',
              }}
            >
              <AlertCircle size={14} style={{ color: '#F59E0B', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400E', marginBottom: 1 }}>Set your values first</p>
                <p style={{ fontSize: '0.7rem', color: '#B45309' }}>Personalise every scan result</p>
              </div>
              <ChevronRight size={14} style={{ color: '#F59E0B', flexShrink: 0 }} />
            </Link>
          )}

          <button
            onClick={() => setShowSearch(false)}
            style={{
              width: '100%', padding: '12px',
              border: '1px solid #E5E7EB',
              borderRadius: 12,
              backgroundColor: '#F9FAFB',
              color: '#6B7280', fontWeight: 600, fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Tap-outside to close search */}
      {showSearch && (
        <div
          onClick={() => setShowSearch(false)}
          style={{ position: 'absolute', inset: 0, zIndex: 35 }}
        />
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
          0% { top: 20%; opacity: 1; }
          50% { top: 60%; opacity: 0.6; }
          100% { top: 20%; opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes priorityPulse {
          0%   { transform: translateX(-50%) scale(1); }
          50%  { transform: translateX(-50%) scale(1.02); }
          100% { transform: translateX(-50%) scale(1); }
        }
      `}</style>

    </div>
  );
};

export default Scan;
