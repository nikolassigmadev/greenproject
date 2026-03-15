import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Upload, Search, Loader2, AlertCircle, X, ScanLine, Image as ImageIcon, Plus, Leaf } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
import { advancedProductOCR, extractBrandName, extractProductName, extractCertifications, checkOpenAIHealth } from "@/services/ocr/advanced-openai-ocr";
import { copySingleProductCode } from "@/utils/productExporter";
import { lookupBarcode, isValidBarcode, searchProducts as searchOffProducts, searchBetterAlternatives } from "@/services/openfoodfacts";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import Tesseract from "tesseract.js";

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

// Function to filter and select best products
const filterBestProducts = (results: OpenFoodFactsResult[]): OpenFoodFactsResult[] => {
  if (results.length <= 3) return results;
  
  // Calculate eco scores for all products
  const productsWithScores = results.map(result => ({
    result,
    ecoScore: calculateEcoScore(result)
  }));
  
  // Sort by eco score (descending) - highest score first
  productsWithScores.sort((a, b) => b.ecoScore - a.ecoScore);
  
  // Take top 3
  return productsWithScores.slice(0, 3).map(item => item.result);
};

type OcrWord = {
  text?: string;
  confidence?: number;
};

type OcrResult = {
  data?: {
    text?: string;
    confidence?: number;
    words?: OcrWord[];
  };
};

type TesseractProgress = {
  status?: string;
};

const normalizeOcrText = (text: string) => {
  return text
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1F\x7F]/g, " ")  // Control characters only
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

/**
 * Removes duplicate words from search query
 * Example: "Coca-Cola Coca-Cola" → "Coca-Cola"
 */
const deduplicateSearchQuery = (query: string): string => {
  return query
    .split(/\s+/)  // Split by whitespace
    .filter((word, index, arr) => {
      // Keep word if it's the first occurrence or different from previous word (case-insensitive)
      return index === 0 || word.toLowerCase() !== arr[index - 1].toLowerCase();
    })
    .join(" ")
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

const shouldTreatAsNoText = (text: string, result: OcrResult) => {
  const visible = text.replace(/\s/g, "");
  // More lenient - accept shorter text
  if (visible.length < 3) return true;

  const letters = (visible.match(/[a-z]/gi) || []).length;
  const digits = (visible.match(/[0-9]/g) || []).length;
  const alnum = (visible.match(/[a-z0-9]/gi) || []).length;
  const nonAlnum = Math.max(0, visible.length - alnum);
  const alnumRatio = visible.length ? alnum / visible.length : 0;
  const nonAlnumRatio = visible.length ? nonAlnum / visible.length : 1;

  const overallConfidence = Number(result?.data?.confidence);
  const confidenceScore = Number.isFinite(overallConfidence) ? overallConfidence : 0;

  const words = Array.isArray(result?.data?.words) ? result.data.words : [];
  const wordConfs = words
    .map((w) => Number(w?.confidence))
    .filter((c) => Number.isFinite(c) && c >= 0 && c <= 100) as number[];
  const avgWordConfidence = wordConfs.length
    ? wordConfs.reduce((sum, c) => sum + c, 0) / wordConfs.length
    : 0;

  const lengthScore = Math.min(visible.length, 20);
  const letterScore = Math.min(letters * 2, 40);
  const digitScore = Math.min(digits, 15);

  const reliableBonus = Math.min(30, 30);
  const goodWordBonus = Math.min(60, 60);
  const noisyPenalty = nonAlnumRatio > 0.25 ? (nonAlnumRatio - 0.25) * 120 : 0;
  const lowAlnumPenalty = alnumRatio < 0.7 ? (0.7 - alnumRatio) * 120 : 0;
  const gibberishPenalty = isLikelyGibberish(text) ? 45 : 0;

  return (
    confidenceScore +
    avgWordConfidence * 0.6 +
    lengthScore +
    letterScore +
    digitScore +
    reliableBonus +
    goodWordBonus -
    noisyPenalty -
    lowAlnumPenalty -
    gibberishPenalty
  );
};

const getReliableOcrText = (result: OcrResult) => {
  const words = Array.isArray(result?.data?.words) ? result.data.words : [];
  const goodWords = words.filter((w) => {
    const t = String(w?.text || "").trim();
    const c = Number(w?.confidence);
    if (!Number.isFinite(c)) return false;
    const lettersInWord = (t.match(/[a-z]/gi) || []).length;
    return t.length >= 3 && lettersInWord >= 1 && c >= 50;
  });

  const reliableText = cleanupOcrTextForSearch(
    normalizeOcrText(goodWords.map((w) => String(w?.text || "").trim()).join(" "))
  );
  return { reliableText, goodWordsCount: goodWords.length, wordsCount: words.length };
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

const preprocessImageDataUrl = async (imageDataUrl: string) => {
  const img = new Image();
  img.decoding = "async";
  img.src = imageDataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load image"));
  });

  const maxWidth = 1600;
  const scale = img.width > maxWidth ? maxWidth / img.width : 1;
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return imageDataUrl;

  ctx.drawImage(img, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const contrast = 1.2;
  const intercept = 128 * (1 - contrast);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    const adjusted = Math.max(0, Math.min(255, gray * contrast + intercept));
    data[i] = adjusted;
    data[i + 1] = adjusted;
    data[i + 2] = adjusted;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
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

const preprocessImageThresholdDataUrl = async (imageDataUrl: string) => {
  const img = new Image();
  img.decoding = "async";
  img.src = imageDataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load image"));
  });

  const maxWidth = 1600;
  const scale = img.width > maxWidth ? maxWidth / img.width : 1;
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return imageDataUrl;

  ctx.drawImage(img, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const contrast = 1.25;
  const intercept = 128 * (1 - contrast);
  const threshold = 160;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    const adjusted = Math.max(0, Math.min(255, gray * contrast + intercept));
    const bw = adjusted > threshold ? 255 : 0;
    data[i] = bw;
    data[i + 1] = bw;
    data[i + 2] = bw;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
};

const cropImageDataUrl = async (
  imageDataUrl: string,
  crop: { x: number; y: number; w: number; h: number }
) => {
  const img = new Image();
  img.decoding = "async";
  img.src = imageDataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load image"));
  });

  const sx = Math.max(0, Math.min(img.width, Math.round(img.width * crop.x)));
  const sy = Math.max(0, Math.min(img.height, Math.round(img.height * crop.y)));
  const sw = Math.max(1, Math.min(img.width - sx, Math.round(img.width * crop.w)));
  const sh = Math.max(1, Math.min(img.height - sy, Math.round(img.height * crop.h)));

  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d");
  if (!ctx) return imageDataUrl;

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas.toDataURL("image/png");
};

const scoreOcrCandidate = (
  candidateText: string,
  reliableText: string,
  reliableStats: { goodWordsCount: number; wordsCount: number },
  result: OcrResult
) => {
  const visible = candidateText.replace(/\s/g, "");
  const letters = (visible.match(/[a-z]/gi) || []).length;
  const digits = (visible.match(/[0-9]/g) || []).length;
  const alnum = (visible.match(/[a-z0-9]/gi) || []).length;
  const nonAlnum = Math.max(0, visible.length - alnum);
  const alnumRatio = visible.length ? alnum / visible.length : 0;
  const nonAlnumRatio = visible.length ? nonAlnum / visible.length : 1;

  const overallConfidence = Number(result?.data?.confidence);
  const confidenceScore = Number.isFinite(overallConfidence) ? overallConfidence : 0;

  const words = Array.isArray(result?.data?.words) ? result.data.words : [];
  const wordConfs = words
    .map((w) => Number(w?.confidence))
    .filter((c) => Number.isFinite(c) && c >= 0 && c <= 100) as number[];
  const avgWordConfidence = wordConfs.length
    ? wordConfs.reduce((sum, c) => sum + c, 0) / wordConfs.length
    : 0;

  const lengthScore = Math.min(visible.length, 20);
  const letterScore = Math.min(letters * 2, 40);
  const digitScore = Math.min(digits, 15);

  const reliableBonus = Math.min(reliableText.replace(/\s/g, "").length, 30);
  const goodWordBonus = Math.min(reliableStats.goodWordsCount * 12, 60);
  const noisyPenalty = nonAlnumRatio > 0.25 ? (nonAlnumRatio - 0.25) * 120 : 0;
  const lowAlnumPenalty = alnumRatio < 0.7 ? (0.7 - alnumRatio) * 120 : 0;
  const gibberishPenalty = isLikelyGibberish(candidateText) ? 45 : 0;

  return (
    confidenceScore +
    avgWordConfidence * 0.6 +
    lengthScore +
    letterScore +
    digitScore +
    reliableBonus +
    goodWordBonus -
    noisyPenalty -
    lowAlnumPenalty -
    gibberishPenalty
  );
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
  const [offSearchImage, setOffSearchImage] = useState<string | null>(null);
  const [offSearchText, setOffSearchText] = useState("");
  const [showDetailedEnvironmental, setShowDetailedEnvironmental] = useState(false);
  const [selectedEnvironmentalResult, setSelectedEnvironmentalResult] = useState<OpenFoodFactsResult | null>(null);
  const [offAlternatives, setOffAlternatives] = useState<OpenFoodFactsResult[]>([]);
  const [offAlternativeLoading, setOffAlternativeLoading] = useState(false);
  const offFileInputRef = useRef<HTMLInputElement>(null);

  // Debug: Check if video element is mounted
  useEffect(() => {
    console.log('Video ref status:', Boolean(videoRef.current));
    console.log('Canvas ref status:', Boolean(canvasRef.current));
  }, [cameraActive, cameraInitializing]);

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

        toast({
          title: "Camera Active",
          description: "Ready to scan. Position product in frame.",
        });
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

  // Process image with OCR - Try OpenAI first, fallback to Tesseract
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
      let useOpenAI = true;

      // Try Advanced OpenAI Vision API first (GPT-4 Vision with optimized prompts)
      try {
        console.log("🚀 Attempting ADVANCED OCR with GPT-4 Vision...");
        const advancedResult = await advancedProductOCR(imageData);

        if (advancedResult.success) {
          console.log("✅ Advanced OCR extraction successful");
          console.log("📊 Extracted:", {
            product: advancedResult.productName,
            brand: advancedResult.brandName,
            certifications: advancedResult.certifications,
            confidence: advancedResult.confidence,
            time: advancedResult.processingTime,
          });

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
                if (result.found && hasEcoScore(result)) {
                  setOffResult(result);
                  toast({
                    title: "Found on OpenFoodFacts",
                    description: `${result.brand || ""} ${result.productName || "Unknown Product"}`.trim(),
                  });
                } else if (result.found) {
                  toast({
                    title: "No Environmental Data",
                    description: `"${result.productName || "Product"}" has no Eco-Score breakdown.`,
                    variant: "destructive",
                  });
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
          console.warn("❌ Advanced OCR failed, falling back to standard OpenAI:", advancedResult.error);
          useOpenAI = false;
        }
      } catch (error) {
        console.warn("⚠️ Advanced OCR error, trying standard OpenAI:", error);
        useOpenAI = false;
      }

      // Fallback to standard OpenAI if advanced failed
      if (!useOpenAI || !extractedText) {
        try {
          console.log("📡 Attempting standard OpenAI Vision API...");
          const openaiResult = await recognizeImageWithOpenAI(imageData);

          if (openaiResult.success && openaiResult.text) {
            console.log("✅ Standard OpenAI extraction successful");
            extractedText = openaiResult.text;
            useOpenAI = true;
          } else {
            console.warn("Standard OpenAI failed:", openaiResult.error);
            useOpenAI = false;
          }
        } catch (error) {
          console.warn("Standard OpenAI error:", error);
          useOpenAI = false;
        }
      }

      // Fallback to Tesseract if OpenAI didn't work
      if (!useOpenAI || !extractedText) {
        console.log("Using Tesseract.js for OCR...");
        const preprocessedGray = await preprocessImageDataUrl(imageData);
        const preprocessedThreshold = await preprocessImageThresholdDataUrl(imageData);

        const cropCenter = await cropImageDataUrl(imageData, { x: 0.15, y: 0.18, w: 0.7, h: 0.64 });
        const cropTop = await cropImageDataUrl(imageData, { x: 0.05, y: 0.0, w: 0.9, h: 0.55 });
        const cropCenterThreshold = await preprocessImageThresholdDataUrl(cropCenter);
        const cropTopThreshold = await preprocessImageThresholdDataUrl(cropTop);

        const inputs: Array<{ label: string; dataUrl: string }> = [
          { label: "original", dataUrl: imageData },
          { label: "gray", dataUrl: preprocessedGray },
          { label: "threshold", dataUrl: preprocessedThreshold },
          { label: "crop_center_threshold", dataUrl: cropCenterThreshold },
          { label: "crop_top_threshold", dataUrl: cropTopThreshold },
        ];

        let best: { candidateText: string; score: number } | null = null;

        for (let i = 0; i < inputs.length; i++) {
          const input = inputs[i];
          const result = (await Tesseract.recognize(input.dataUrl, "eng", {
            logger: (m: unknown) => {
              if (i !== 0) return;
              const status =
                typeof m === "object" && m !== null && "status" in m
                  ? String((m as TesseractProgress).status)
                  : "";
              if (status === "recognizing text") {
                setIsScanning(true);
              }
            },
          })) as OcrResult;

          const text = normalizeOcrText(String(result?.data?.text || ""));
          const reliable = getReliableOcrText(result);
          const candidateText = reliable.reliableText.length >= 4 ? reliable.reliableText : text;

          const score = scoreOcrCandidate(candidateText, reliable.reliableText, reliable, result);
          if (!best || score > best.score) {
            best = { candidateText, score };
          }
        }

        extractedText = normalizeOcrText(best?.candidateText || "");
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

  // Manual barcode lookup on OpenFoodFacts
  const handleBarcodeLookup = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return;

    setOffLoading(true);
    setOffResult(null);
    setOffSearchResults([]);

    try {
      const result = await lookupBarcode(barcode.trim());
      setOffResult(result);

      if (result.found && hasEcoScore(result)) {
        // Also populate search results so they display in the UI
        setOffSearchResults([result]);
        // Automatically show detailed environmental view for barcode lookups
        viewDetailedEnvironmental(result);
        toast({
          title: "Product Found on OpenFoodFacts",
          description: `${result.brand || ""} ${result.productName || "Unknown Product"}`.trim(),
        });
      } else if (result.found) {
        toast({
          title: "No Environmental Data",
          description: `"${result.productName || "This product"}" was found but has no Eco-Score or environmental breakdown.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Not Found",
          description: result.error || "Product not found on OpenFoodFacts.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Barcode lookup error:", error);
      toast({
        title: "Lookup Error",
        description: "Failed to query OpenFoodFacts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOffLoading(false);
    }
  }, [toast]);

  // Process image for OpenFoodFacts search (separate from internal DB scan)
  const processImageForOFF = useCallback(async (imageData: string) => {
    setOffSearchLoading(true);
    setOffSearchResults([]);
    setOffSearchText("");
    setOffSearchImage(imageData);

    try {
      // Use the same GPT-4o OCR to extract product name
      const advancedResult = await advancedProductOCR(imageData);

      let searchQuery = "";
      if (advancedResult.success) {
        if (advancedResult.productName && advancedResult.brandName) {
          searchQuery = `${advancedResult.brandName} ${advancedResult.productName}`;
        } else if (advancedResult.productName) {
          searchQuery = advancedResult.productName;
        } else if (advancedResult.brandName) {
          searchQuery = advancedResult.brandName;
        } else {
          searchQuery = advancedResult.fullText;
        }

        // Remove duplicate words from search query (e.g., "Coca-Cola Coca-Cola" → "Coca-Cola")
        searchQuery = deduplicateSearchQuery(searchQuery);

        // If barcode was found, also do a direct barcode lookup
        if (advancedResult.barcode && isValidBarcode(advancedResult.barcode)) {
          const barcodeResult = await lookupBarcode(advancedResult.barcode);
          if (barcodeResult.found && hasEcoScore(barcodeResult)) {
            setOffSearchResults([barcodeResult]);
            setOffSearchText(`Barcode: ${advancedResult.barcode}`);
            setOffSearchLoading(false);
            // Automatically show detailed environmental view for barcode lookups from images
            viewDetailedEnvironmental(barcodeResult);
            toast({
              title: "Product Found",
              description: `${barcodeResult.brand || ""} ${barcodeResult.productName || ""}`.trim(),
            });
            return;
          } else if (barcodeResult.found) {
            toast({
              title: "No Environmental Data",
              description: `"${barcodeResult.productName || "This product"}" has no Eco-Score or environmental breakdown.`,
              variant: "destructive",
            });
            setOffSearchLoading(false);
            return;
          }
        }
      }

      if (!searchQuery) {
        toast({
          title: "Could not identify product",
          description: "Try a clearer image or use manual barcode entry.",
          variant: "destructive",
        });
        setOffSearchLoading(false);
        return;
      }

      setOffSearchText(searchQuery);

      // Search OpenFoodFacts by product name - fetch more to filter
      const results = await searchOffProducts(searchQuery, 10);

      // Prefer products with eco-score, but fallback to all products if none have eco-score
      const withEcoScore = results.filter(hasEcoScore);
      let filteredResults = filterBestProducts(withEcoScore);
      
      // Fallback: if no products with eco-score, show all products found
      if (filteredResults.length === 0 && results.length > 0) {
        console.warn(`⚠️ No products with Eco-Score found, showing all results...`);
        filteredResults = filterBestProducts(results);
      }

      if (filteredResults.length === 0) {
        toast({
          title: "No Results",
          description: `No products found for "${searchQuery}" on OpenFoodFacts.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: `${filteredResults.length} Product${filteredResults.length > 1 ? "s" : ""} Found`,
          description: `Showing products with Eco-Score data for "${searchQuery}".`,
        });
        setOffSearchResults(filteredResults);
      }
    } catch (error) {
      console.error("OFF image search error:", error);
      toast({
        title: "Processing Error",
        description: "Failed to process the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOffSearchLoading(false);
    }
  }, [toast]);

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
      processImage(imageData);
      stopCamera();

    } catch (error) {
      console.error('Capture error:', error);
      toast({
        title: "Capture Error",
        description: "Failed to capture photo. Try again.",
        variant: "destructive",
      });
    }
  }, [processImage, stopCamera, toast]);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setUploadedImage(imageData);
        processImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  }, [processImage]);

  // Manual search
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualSearch.trim()) {
      searchProducts(manualSearch);
    }
  };

  return (
    <div style={{ backgroundColor: 'hsl(210 40% 10%)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      
      <main style={{ flex: 1, paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '0 1rem' }}>
          
          {/* Page Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.75rem', color: 'hsl(38 92% 50%)' }}>
              Scan a Product
            </h1>
            <p style={{ fontSize: '1rem', color: 'hsl(210 15% 63%)' }}>
              Discover the true cost of your purchase
            </p>
          </div>

          {/* Product Lookup - Barcode Search */}
          <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'hsl(210 35% 18%)', borderRadius: '0.5rem', border: '1px solid hsl(210 15% 30%)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: 'hsl(210 15% 94%)' }}>📱 Barcode Search</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleBarcodeLookup(barcodeInput); }} style={{ display: 'flex', gap: '0.75rem' }}>
              <Input
                placeholder="Enter barcode (e.g., 3017620422003)"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                style={{
                  flex: 1,
                  height: '2.75rem',
                  backgroundColor: 'hsl(210 35% 22%)',
                  color: 'hsl(210 15% 94%)',
                  border: '1px solid hsl(210 15% 30%)',
                  borderRadius: '0.375rem',
                  padding: '0 1rem'
                }}
                inputMode="numeric"
              />
              <CalAIButton type="submit" emoji="🔍" loading={offLoading}>
                Search
              </CalAIButton>
            </form>
          </div>

          {/* Image Upload */}
          <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'hsl(210 35% 18%)', borderRadius: '0.5rem', border: '1px solid hsl(210 15% 30%)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: 'hsl(210 15% 94%)' }}>📸 Image Search</h2>
            <CalAIButton onClick={() => offFileInputRef.current?.click()} loading={offSearchLoading} emoji={offSearchLoading ? '⏳' : '📤'} style={{ width: '100%' }}>
              {offSearchLoading ? 'Analyzing...' : 'Choose Product Image'}
            </CalAIButton>
            <input
              ref={offFileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleOffFileUpload}
              style={{ display: 'none' }}
            />
          </div>

          {/* Image Preview */}
          {offSearchImage && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                borderRadius: '0.5rem',
                overflow: 'hidden',
                aspectRatio: '16/9',
                maxHeight: '200px',
                backgroundColor: 'hsl(210 35% 18%)',
                border: '1px solid hsl(210 15% 30%)'
              }}>
                <img src={offSearchImage} alt="Scanned" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            </div>
          )}

          {/* Status Messages */}
          {ocrMessage && (
            <AlertBox type="warning" title="OCR Status" message={ocrMessage} onClose={() => setOcrMessage(null)} />
          )}

          {offResult && offResult.found && (
            <div style={{ marginBottom: '2rem' }}>
              <AlertBox type="success" message={`✅ Found: ${offResult.productName}`} />
              <div style={{ marginTop: '1rem' }}>
                <OpenFoodFactsCard result={offResult} />
              </div>
            </div>
          )}

          {offResult && !offResult.found && (
            <AlertBox type="warning" message="Product not found in OpenFoodFacts database" />
          )}

          {/* Search Results  */}
          {offSearchResults.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <StatsDisplay
                stats={[
                  { label: 'Products Found', value: String(offSearchResults.length), emoji: '📦' },
                  { label: 'Alternatives', value: String(offAlternatives.length), emoji: '♻️' },
                ]}
                columns={2}
              />
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {offSearchResults.map((result) => (
                  <OpenFoodFactsCard key={result.barcode} result={result} />
                ))}
              </div>
            </div>
          )}

          {/* Better Alternatives */}
          {offAlternatives.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: 'hsl(210 15% 94%)' }}>
                🌱 Greener Alternatives
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {offAlternatives.map((alt) => (
                  <OpenFoodFactsCard key={alt.barcode} result={alt} />
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Scan;