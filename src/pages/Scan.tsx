import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Upload, Search, Loader2, X, ScanLine, Image as ImageIcon, Leaf, ArrowLeft, MoreHorizontal, Zap, Database } from "lucide-react";
import { getBrandFlag } from "@/data/brandFlags";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/useProducts";
import type { Product } from "@/data/products";
import { calculateScore, findLowCO2Alternative } from "@/data/products";
import { recognizeImageWithOpenAI } from "@/services/ocr/openai-service";
import { advancedProductOCR } from "@/services/ocr/advanced-openai-ocr";
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

// Return top 3 results in OpenFoodFacts relevance order (sorted by scan popularity).
// Do NOT re-sort by eco-data completeness — that causes unrelated high-eco-data products
// (e.g. "Prince Gout Chocolat") to replace the actually searched product.
const filterBestProducts = (results: OpenFoodFactsResult[]): OpenFoodFactsResult[] => {
  return results.slice(0, 3);
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
    .replace(/[^\x20-\x7E\n]+/g, " ")
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
  if (!/^[a-z0-9]+$/i.test(t)) return false; // Allow alphanumeric only

  const vowels = (t.match(/[aeiouy]/gi) || []).length;
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
  // Less aggressive filtering - keep more text
  const words = normalized.match(/\b[a-zA-Z0-9]{2,}(?:[-'][a-zA-Z0-9]{1,})*\b/g) || [];
  const filtered = words.filter(isAcceptableOcrToken);
  return normalizeOcrText(uniqPreserveOrder(filtered).join(" "));
};

const cleanupOcrTextForSearch = (text: string) => {
  const normalized = normalizeOcrText(text);
  // Less aggressive filtering - keep more text including numbers and brand names
  const words = normalized.match(/\b[a-zA-Z0-9]{2,}(?:[-'][a-zA-Z0-9]{1,})*\b/g) || [];
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
  const cameraFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraInitializingRef = useRef(false);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraInitializing, setCameraInitializing] = useState(false);
  const [_extractedText, setExtractedText] = useState("");
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
  const [scanMode, setScanMode] = useState<'off' | 'bali'>('off');
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
        const nav = navigator as Navigator & {
          webkitGetUserMedia?: (c: MediaStreamConstraints, s: (stream: MediaStream) => void, e: (err: Error) => void) => void;
        };
        if (nav.webkitGetUserMedia) {
          return {
            getUserMedia: (constraints: MediaStreamConstraints) => new Promise<MediaStream>((resolve, reject) => {
              nav.webkitGetUserMedia!(constraints, resolve, reject);
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
        // Guard: only resolve once (canplay can sometimes fire multiple times)
        if (!cameraInitializingRef.current) return;

        console.log('Video can play, dimensions:', video.videoWidth, 'x', video.videoHeight);

        // Clear timeout since we succeeded
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }

        cameraInitializingRef.current = false;
        setCameraActive(true);
        setCameraInitializing(false);

        // Clean up event listeners
        video.removeEventListener('canplay', onCanPlay);
        video.removeEventListener('loadedmetadata', onCanPlay);

        toast({
          title: "Camera Active",
          description: "Ready to scan. Position product in frame.",
        });
      };

      const onError = () => {
        console.error('Video stream error');
        video.removeEventListener('error', onError);
        video.removeEventListener('canplay', onCanPlay);
        video.removeEventListener('loadedmetadata', onCanPlay);

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

      // Ensure attributes are set before playing
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');

      // If already in a playable state (readyState >= 3), resolve immediately
      if (video.readyState >= 3) {
        onCanPlay();
        return;
      }

      // Start playback
      try {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          await playPromise;
          console.log('Video playback started');
          // canplay may have already fired while we were awaiting play() —
          // if still initializing, resolve now.
          if (cameraInitializingRef.current) {
            onCanPlay();
          }
        }
      } catch (err) {
        console.error('Play error:', err);
        // Continue — canplay event may still fire
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
        // Browser doesn't support camera — fail silently, image upload still works
        console.log('Camera not supported in this browser, image upload available.');
        return;
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
  }, [toast, viewDetailedEnvironmental]);

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
        const name = advancedResult.productName?.trim() || "";
        const brand = advancedResult.brandName?.trim() || "";
        if (brand && name) {
          searchQuery = `${brand} ${name}`;
        } else if (name) {
          searchQuery = name;
        } else if (brand) {
          searchQuery = brand;
        } else {
          searchQuery = advancedResult.fullText?.trim() || "";
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

      if (results.length === 0) {
        toast({
          title: "No Results",
          description: `No products found for "${searchQuery}" on OpenFoodFacts.`,
          variant: "destructive",
        });
      } else {
        // Keep results in OFF relevance order — sliced to top 3
        const filteredResults = filterBestProducts(results);
        toast({
          title: "Product Found",
          description: `Showing best match for "${searchQuery}".`,
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
      if (scanMode === 'bali') processImage(imageData);
      else processImageForOFF(imageData);
      stopCamera();

    } catch (error) {
      console.error('Capture error:', error);
      toast({
        title: "Capture Error",
        description: "Failed to capture photo. Try again.",
        variant: "destructive",
      });
    }
  }, [scanMode, processImage, processImageForOFF, stopCamera, toast]);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setUploadedImage(imageData);
        if (scanMode === 'bali') processImage(imageData);
        else processImageForOFF(imageData);
      };
      reader.readAsDataURL(file);
    }
  }, [scanMode, processImage, processImageForOFF]);

  // Manual search
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualSearch.trim()) {
      searchProducts(manualSearch);
    }
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Hidden elements */}
      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
      <input ref={offFileInputRef} type="file" accept="image/*" onChange={handleOffFileUpload} className="hidden" />
      {/* Native camera capture — bypasses WebRTC, works on all browsers */}
      <input
        ref={cameraFileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const result = ev.target?.result;
            if (typeof result === "string") {
              stopCamera();
              if (scanMode === 'bali') processImage(result);
              else processImageForOFF(result);
            }
          };
          reader.readAsDataURL(file);
          e.target.value = "";
        }}
        className="hidden"
      />

      {/* === BACKGROUND: Camera or uploaded image === */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          webkit-playsinline="true"
          x5-playsinline="true"
          controls={false}
          className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
          style={{ backgroundColor: '#000', WebkitTransform: 'translate3d(0,0,0)', transform: 'translate3d(0,0,0)' } as React.CSSProperties}
          onError={(e) => console.error('Video element error:', e)}
          onLoadedMetadata={() => console.log('Video metadata loaded:', (videoRef.current as HTMLVideoElement).videoWidth, 'x', (videoRef.current as HTMLVideoElement).videoHeight)}
        />
        {uploadedImage && !cameraActive && (
          <img src={uploadedImage} alt="Scanned product" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
      </div>

      {/* === SCAN BOX OVERLAY === */}
      {cameraActive && !isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-72 h-72">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-white rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-white rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-white rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-white rounded-br-xl" />
          </div>
        </div>
      )}

      {/* === FLOATING LABELS (results + image) === */}
      {searchResults.length > 0 && uploadedImage && !isProcessing && (
        <>
          <div className="absolute top-[28%] left-6 z-10">
            <div className="bg-white rounded-2xl px-4 py-2 shadow-2xl">
              <p className="font-black text-green-950 text-xs uppercase tracking-wide">{searchResults[0]?.brand || 'Brand'}</p>
              <p className="font-black text-2xl text-green-950 leading-none">{calculateScore(searchResults[0])}</p>
            </div>
          </div>
          {searchResults.length > 1 && (
            <div className="absolute top-[40%] right-6 z-10">
              <div className="bg-white rounded-2xl px-4 py-2 shadow-2xl">
                <p className="font-black text-green-950 text-xs uppercase tracking-wide">{searchResults[1]?.brand || 'Alt'}</p>
                <p className="font-black text-2xl text-gray-500 leading-none">{calculateScore(searchResults[1])}</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* === TOP BAR === */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-safe">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <span className="text-white font-semibold text-base tracking-tight drop-shadow">Scanner</span>
          <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <MoreHorizontal className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* === PROCESSING OVERLAY === */}
      {(isProcessing || cameraInitializing || offSearchLoading) && (
        <div className="absolute inset-0 z-30 flex items-center justify-center">
          <div className="bg-black/80 backdrop-blur-xl rounded-3xl px-10 py-8 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
            <p className="text-white font-semibold text-sm text-center">
              {cameraInitializing ? 'Starting camera…' : isProcessing ? 'Analysing product…' : 'Searching database…'}
            </p>
          </div>
        </div>
      )}

      {/* === BOTTOM CONTROLS (no results yet) === */}
      {searchResults.length === 0 && offSearchResults.length === 0 && !showDetailedEnvironmental && !isProcessing && !offSearchLoading && (
        <div className="absolute bottom-0 left-0 right-0 z-20 pb-safe">
          <div className="px-5 pb-8 pt-4">
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar mb-6">
              <button
                onClick={() => { setScanMode('off'); if (!cameraActive && !cameraInitializing) startCamera(); }}
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-lg transition-colors ${scanMode === 'off' ? 'bg-green-900 text-white' : 'bg-white text-green-900'}`}
              >
                <Leaf className="w-3.5 h-3.5" />
                <span>Open Food Facts</span>
              </button>
              <button
                onClick={() => { setScanMode('bali'); if (!cameraActive && !cameraInitializing) startCamera(); }}
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-lg transition-colors ${scanMode === 'bali' ? 'bg-green-900 text-white' : 'bg-white text-green-900'}`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Bali Database</span>
              </button>
              <button onClick={() => stopCamera()} className="flex-shrink-0 w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <ScanLine className="w-5 h-5 text-white" />
              </button>
              <button onClick={() => { stopCamera(); fileInputRef.current?.click(); }} className="flex-shrink-0 w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <ImageIcon className="w-5 h-5 text-white" />
              </button>
              <button onClick={() => { stopCamera(); offFileInputRef.current?.click(); }} className="flex-shrink-0 w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Upload className="w-5 h-5 text-white" />
              </button>
              <button onClick={() => stopCamera()} className="flex-shrink-0 w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Search className="w-5 h-5 text-white" />
              </button>
            </div>

            {!cameraActive && (
              <div className="mb-6">
                <form onSubmit={async (e) => { e.preventDefault(); const q = (barcodeInput || manualSearch).trim(); if (!q) return; if (scanMode === 'bali') { searchProducts(q); } else if (isValidBarcode(q)) { handleBarcodeLookup(q); } else { setOffSearchLoading(true); setOffSearchResults([]); try { const results = await searchOffProducts(q, 10); if (results.length === 0) { toast({ title: "No Results", description: `Nothing found for "${q}" on Open Food Facts.`, variant: "destructive" }); } else { const best = filterBestProducts(results); setOffSearchResults(best); } } catch { toast({ title: "Search Error", description: "Failed to search Open Food Facts.", variant: "destructive" }); } finally { setOffSearchLoading(false); } } }} className="flex gap-2">
                  <input
                    placeholder="Barcode or product name…"
                    value={barcodeInput || manualSearch}
                    onChange={(e) => { setBarcodeInput(e.target.value); setManualSearch(e.target.value); }}
                    className="flex-1 h-12 rounded-2xl bg-white/90 backdrop-blur-sm px-4 text-black font-medium placeholder:text-gray-400 text-sm border-0 outline-none shadow-lg"
                    inputMode="search"
                  />
                  <button type="submit" disabled={offLoading || isProcessing} className="h-12 px-5 rounded-2xl bg-white text-black font-bold text-sm shadow-lg disabled:opacity-60">
                    {offLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </button>
                </form>
              </div>
            )}

            <div className="flex items-center justify-center gap-8">
              <div className="w-12 h-12" />
              <button
                onClick={() => cameraFileInputRef.current?.click()}
                disabled={isProcessing || offSearchLoading}
                className="w-20 h-20 rounded-full bg-white shadow-2xl flex items-center justify-center disabled:opacity-60 active:scale-95 transition-transform"
              >
                <Camera className="w-8 h-8 text-black" />
              </button>
              <button onClick={() => cameraActive ? stopCamera() : undefined} className={`w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center border border-white/20 ${cameraActive ? 'bg-black/50' : 'bg-transparent'}`}>
                {cameraActive ? <X className="w-5 h-5 text-white" /> : <Zap className="w-5 h-5 text-white/40" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === RESULTS BOTTOM SHEET === */}
      {(searchResults.length > 0 || offSearchResults.length > 0 || showDetailedEnvironmental) && !isProcessing && (
        <div className="absolute inset-x-0 bottom-0 z-30 animate-slide-up" style={{ maxHeight: '82vh', overflowY: 'auto' }}>
          <div className="bg-background rounded-t-3xl shadow-2xl">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-green-200 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <button onClick={() => { setSearchResults([]); setOffSearchResults([]); setShowDetailedEnvironmental(false); setSelectedEnvironmentalResult(null); setUploadedImage(null); setOffSearchImage(null); setExtractedText(''); }} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-green-900 transition-colors">
                <ArrowLeft className="w-4 h-4" />Back
              </button>
              <span className="font-black text-base text-green-950">{showDetailedEnvironmental ? 'Environmental Impact' : 'Nutrition'}</span>
              <div className="w-14" />
            </div>

            {showDetailedEnvironmental && selectedEnvironmentalResult && (
              <div className="px-5 pb-8">
                {(() => {
                  const r = selectedEnvironmentalResult;
                  const agri = r.ecoscoreData?.agribalyse;
                  const grade = r.ecoscoreGrade?.toLowerCase();
                  const gradeColor = grade === 'a' ? '#16a34a' : grade === 'b' ? '#84cc16' : grade === 'c' ? '#eab308' : grade === 'd' ? '#f97316' : '#ef4444';
                  const gradeLabel = grade === 'a' ? 'Excellent' : grade === 'b' ? 'Good' : grade === 'c' ? 'Fair' : grade === 'd' ? 'Poor' : 'Very Poor';
                  const lifecycleItems = (agri ? [
                    { label: "Agriculture", value: agri.co2_agriculture, icon: "🌾" },
                    { label: "Processing", value: agri.co2_processing, icon: "🏭" },
                    { label: "Packaging", value: agri.co2_packaging, icon: "📦" },
                    { label: "Transport", value: agri.co2_transportation, icon: "🚚" },
                    { label: "Distribution", value: agri.co2_distribution, icon: "🏪" },
                    { label: "Consumption", value: agri.co2_consumption, icon: "🍽️" },
                  ] as { label: string; value: number | undefined; icon: string }[] : []).filter(item => typeof item.value === 'number' && (item.value as number) > 0);
                  const maxVal = Math.max(...lifecycleItems.map(i => i.value as number), 0.01);
                  const brandFlag = getBrandFlag(r.brand);
                  const adjustments = r.ecoscoreData?.adjustments;
                  const packaging = adjustments?.packaging;
                  const threatened = adjustments?.threatened_species;
                  return (
                    <>
                      {/* Product header */}
                      <div className="flex items-start gap-3 pt-4 mb-4">
                        {r.imageUrl && <img src={r.imageUrl} alt="" className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border border-green-100" />}
                        <div className="flex-1">
                          <h2 className="text-xl font-black text-green-950 leading-tight">{r.productName || 'Unknown Product'}</h2>
                          {r.brand && <p className="text-sm text-gray-500 font-semibold mt-0.5">{r.brand}</p>}
                        </div>
                      </div>

                      {/* Labor flag — top priority alert */}
                      {brandFlag && (() => {
                        const severityBg = brandFlag.severity === 'critical' ? 'bg-red-500' : brandFlag.severity === 'high' ? 'bg-orange-500' : 'bg-amber-500';
                        const severityLabel = brandFlag.severity === 'critical' ? 'Forced / Child Labor Allegations' : brandFlag.severity === 'high' ? 'Serious Labor Allegations' : 'Labor Concerns';
                        return (
                          <div className={`${severityBg} rounded-2xl p-4 mb-4`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">🚨</span>
                              <span className="text-sm font-black text-white">{severityLabel}</span>
                            </div>
                            <p className="text-sm text-white/90 leading-snug">{brandFlag.allegation}</p>
                            {brandFlag.sources.length > 0 && (
                              <p className="text-xs text-white/70 mt-2">{brandFlag.sources.length} source{brandFlag.sources.length > 1 ? 's' : ''} documented</p>
                            )}
                          </div>
                        );
                      })()}

                      {/* Score tiles */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {grade && (
                          <div className="bg-green-50/60 rounded-2xl p-4">
                            <div className="flex items-center gap-1.5 mb-1"><span className="text-lg">🌍</span><span className="text-xs font-semibold text-gray-500">Eco Score</span></div>
                            <span className="text-3xl font-black uppercase" style={{ color: gradeColor }}>{grade}</span>
                            <p className="text-xs text-gray-500 mt-0.5">{gradeLabel}</p>
                          </div>
                        )}
                        {r.nutriscoreGrade && (
                          <div className="bg-green-50/60 rounded-2xl p-4">
                            <div className="flex items-center gap-1.5 mb-1"><span className="text-lg">🥗</span><span className="text-xs font-semibold text-gray-500">Nutri Score</span></div>
                            <span className="text-3xl font-black text-green-950 uppercase">{r.nutriscoreGrade}</span>
                          </div>
                        )}
                        {r.carbonFootprint100g != null && (
                          <div className="bg-green-50/60 rounded-2xl p-4">
                            <div className="flex items-center gap-1.5 mb-1"><span className="text-lg">🌿</span><span className="text-xs font-semibold text-gray-500">CO₂/100g</span></div>
                            <span className="text-2xl font-black text-green-950">{r.carbonFootprint100g.toFixed(1)}g</span>
                          </div>
                        )}
                        {agri?.co2_total != null && (
                          <div className="bg-green-50/60 rounded-2xl p-4">
                            <div className="flex items-center gap-1.5 mb-1"><span className="text-lg">♻️</span><span className="text-xs font-semibold text-gray-500">Total CO₂/kg</span></div>
                            <span className="text-2xl font-black text-green-950">{agri.co2_total.toFixed(1)}</span>
                            <p className="text-xs text-gray-500 mt-0.5">kg CO₂eq</p>
                          </div>
                        )}
                        {r.novaGroup != null && (
                          <div className="bg-green-50/60 rounded-2xl p-4">
                            <div className="flex items-center gap-1.5 mb-1"><span className="text-lg">🔬</span><span className="text-xs font-semibold text-gray-500">NOVA Group</span></div>
                            <span className="text-3xl font-black text-green-950">{r.novaGroup}</span>
                            <p className="text-xs text-gray-500 mt-0.5">{r.novaGroup === 1 ? 'Unprocessed' : r.novaGroup === 2 ? 'Minimally processed' : r.novaGroup === 3 ? 'Processed' : 'Ultra-processed'}</p>
                          </div>
                        )}
                        {r.ecoscoreScore != null && (
                          <div className="bg-green-50/60 rounded-2xl p-4">
                            <div className="flex items-center gap-1.5 mb-1"><span className="text-lg">📊</span><span className="text-xs font-semibold text-gray-500">Eco Score Pts</span></div>
                            <span className="text-3xl font-black text-green-950">{r.ecoscoreScore}</span>
                            <p className="text-xs text-gray-500 mt-0.5">out of 100</p>
                          </div>
                        )}
                      </div>

                      {/* Eco score progress */}
                      {grade && (
                        <div className="bg-green-50/60 rounded-2xl p-4 mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2"><span className="text-lg">💚</span><span className="text-sm font-bold text-green-950">Environmental Impact</span></div>
                            <span className="text-sm font-black uppercase" style={{ color: gradeColor }}>{grade} · {gradeLabel}</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: grade === 'a' ? '90%' : grade === 'b' ? '70%' : grade === 'c' ? '50%' : grade === 'd' ? '30%' : '10%', background: gradeColor }} />
                          </div>
                        </div>
                      )}

                      {/* CO2 lifecycle breakdown */}
                      {lifecycleItems.length > 0 && (
                        <div className="bg-green-50/60 rounded-2xl p-4 mb-4">
                          <div className="flex items-center gap-2 mb-3"><span className="text-lg">🏭</span><span className="text-sm font-bold text-green-950">CO₂ Lifecycle Breakdown</span></div>
                          <div className="space-y-2.5">
                            {lifecycleItems.map(item => (
                              <div key={item.label} className="flex items-center gap-3">
                                <span className="text-sm w-5">{item.icon}</span>
                                <span className="text-xs font-semibold text-gray-500 w-20">{item.label}</span>
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${((item.value as number) / maxVal) * 100}%`, background: '#16a34a' }} />
                                </div>
                                <span className="text-xs font-black text-green-950 w-10 text-right">{(item.value as number).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          {agri?.co2_total != null && (
                            <p className="text-xs text-gray-400 mt-3 text-right">Total: {agri.co2_total.toFixed(2)} kg CO₂eq/kg</p>
                          )}
                        </div>
                      )}

                      {/* Threatened species */}
                      {threatened && typeof threatened.value === 'number' && threatened.value < 0 && (
                        <div className="bg-red-50 rounded-2xl p-4 mb-4 border border-red-200">
                          <div className="flex items-center gap-2 mb-2"><span className="text-lg">⚠️</span><span className="text-sm font-bold text-red-800">Threatened Species Risk</span></div>
                          <p className="text-sm text-red-700">Contains ingredients that impact threatened species.</p>
                          {threatened.ingredient && <p className="text-xs text-red-600 mt-1 font-semibold">{threatened.ingredient}</p>}
                        </div>
                      )}

                      {/* Packaging */}
                      {packaging && packaging.packagings && packaging.packagings.length > 0 && (
                        <div className="bg-green-50/60 rounded-2xl p-4 mb-4">
                          <div className="flex items-center gap-2 mb-3"><span className="text-lg">📦</span><span className="text-sm font-bold text-green-950">Packaging</span></div>
                          <div className="space-y-2">
                            {packaging.packagings.map((pkg, i) => (
                              <div key={i} className="flex items-center justify-between py-1.5 border-b border-green-100 last:border-0">
                                <span className="text-xs text-gray-600 capitalize">{pkg.shape || 'Package'}{pkg.weight_measured ? ` · ${pkg.weight_measured}g` : ''}</span>
                                <span className="text-xs font-bold text-green-950 capitalize">{pkg.material?.replace(/^en:/, '').replace(/-/g, ' ') || 'Unknown'}</span>
                              </div>
                            ))}
                          </div>
                          {typeof packaging.value === 'number' && (
                            <p className="text-xs text-gray-500 mt-2">{packaging.value >= 10 ? '✅ Very low packaging impact' : packaging.value >= 5 ? '🟡 Low packaging impact' : packaging.value >= 0 ? '🟠 Medium packaging impact' : '🔴 High packaging impact'}</p>
                          )}
                        </div>
                      )}

                      {/* Better alternatives */}
                      {offAlternativeLoading && (
                        <div className="flex items-center gap-3 py-3 mb-2">
                          <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                          <span className="text-sm text-gray-500">Finding better alternatives…</span>
                        </div>
                      )}
                      {offAlternatives.length > 0 && !offAlternativeLoading && (
                        <div className="bg-green-50/60 rounded-2xl p-4 mb-4">
                          <div className="flex items-center gap-2 mb-3"><span className="text-xl">🌱</span><span className="text-sm font-bold text-green-950">Better Alternatives</span></div>
                          <div className="space-y-3">
                            {offAlternatives.map((alt, i) => (
                              <button key={`${alt.barcode}-alt-${i}`} onClick={() => viewDetailedEnvironmental(alt)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/70 border border-green-200/40 text-left active:scale-[0.98] transition-transform">
                                {alt.imageUrl && <img src={alt.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-black text-green-950 truncate">{alt.productName || 'Unknown Product'}</p>
                                  {alt.brand && <p className="text-xs text-gray-500">{alt.brand}</p>}
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {alt.ecoscoreGrade && <span className="text-xs font-bold text-green-700 uppercase">Eco: {alt.ecoscoreGrade}</span>}
                                    {alt.ecoscoreData?.agribalyse?.co2_total != null && <span className="text-xs text-gray-500">{alt.ecoscoreData.agribalyse.co2_total.toFixed(1)} kg CO₂/kg</span>}
                                    {alt.carbonFootprint100g != null && !alt.ecoscoreData?.agribalyse?.co2_total && <span className="text-xs text-gray-500">{alt.carbonFootprint100g.toFixed(1)}g CO₂/100g</span>}
                                  </div>
                                </div>
                                <span className="text-sm text-green-700 font-bold flex-shrink-0">→</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
                <button onClick={backToSearchResults} className="w-full mt-2 py-4 rounded-2xl bg-green-900 text-white font-bold text-base">Done</button>
              </div>
            )}

            {!showDetailedEnvironmental && searchResults.map((product) => {
              const score = calculateScore(product);
              const alt = score < 60 ? findLowCO2Alternative(product, products) : null;
              const laborEmoji = product.laborRisk === 'low' ? '🟢' : product.laborRisk === 'medium' ? '🟡' : '🔴';
              const scoreColor = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-500' : 'text-red-500';
              return (
                <div key={product.id} className="px-5 pb-2">
                  <div className="flex items-start justify-between gap-3 mt-4 mb-5">
                    <div className="flex-1">
                      <span className="inline-flex mb-2 px-3 py-1 rounded-full bg-green-900 text-white text-xs font-bold">{product.category}</span>
                      <h2 className="text-xl font-black text-green-950 leading-tight">{product.name}</h2>
                      <p className="text-sm text-gray-500 font-semibold mt-0.5">{product.brand}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 flex-shrink-0 mt-6">
                      <span className="text-gray-400 font-bold text-lg leading-none select-none">−</span>
                      <span className="font-black text-green-950 text-sm px-1">1</span>
                      <span className="text-gray-400 font-bold text-lg leading-none select-none">+</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-green-50/60 rounded-2xl p-4">
                      <div className="flex items-center gap-1.5 mb-1"><span className="text-lg">🌱</span><span className="text-xs font-semibold text-gray-500">Ethics Score</span></div>
                      <span className={`text-3xl font-black ${scoreColor}`}>{score}</span>
                    </div>
                    <div className="bg-green-50/60 rounded-2xl p-4">
                      <div className="flex items-center gap-1.5 mb-1"><span className="text-lg">⚠️</span><span className="text-xs font-semibold text-gray-500">Labor Risk</span></div>
                      <span className="text-xl font-black text-green-950">{laborEmoji} <span className="capitalize">{product.laborRisk}</span></span>
                    </div>
                    <div className="bg-green-50/60 rounded-2xl p-4">
                      <div className="flex items-center gap-1.5 mb-1"><span className="text-lg">🌿</span><span className="text-xs font-semibold text-gray-500">Carbon kg CO₂</span></div>
                      <span className="text-3xl font-black text-green-950">{product.carbonFootprint}</span>
                    </div>
                    <div className="bg-green-50/60 rounded-2xl p-4">
                      <div className="flex items-center gap-1.5 mb-1"><span className="text-lg">✅</span><span className="text-xs font-semibold text-gray-500">Certifications</span></div>
                      <span className="text-3xl font-black text-green-950">{product.certifications.length}</span>
                    </div>
                  </div>
                  <div className="bg-green-50/60 rounded-2xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2"><span className="text-lg">💚</span><span className="text-sm font-bold text-green-950">Ethics score</span></div>
                      <span className={`text-sm font-black ${scoreColor}`}>{score}/100</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: score >= 80 ? '#16a34a' : score >= 60 ? '#eab308' : '#ef4444' }} />
                    </div>
                  </div>
                  {alt && (
                    <button onClick={() => navigate(`/product/${alt.id.replace('#', '')}`)} className="w-full mb-4 p-4 rounded-2xl border-2 border-green-200 bg-green-50 text-left flex items-center gap-3">
                      <span className="text-2xl">🌿</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-green-700 uppercase tracking-wide">Greener Alternative</p>
                        <p className="text-sm font-black text-green-950 truncate">{alt.name}</p>
                        <p className="text-xs text-gray-500">{alt.brand} · Score: {calculateScore(alt)}</p>
                      </div>
                    </button>
                  )}
                  <div className="space-y-3 pb-6">
                    <button onClick={() => navigate(`/product/${product.id.replace('#', '')}`)} className="w-full py-4 rounded-2xl border-2 border-green-200 text-green-900 font-bold text-base flex items-center justify-center gap-2 hover:bg-green-50 transition-colors">
                      View Results
                    </button>
                    <button onClick={() => { setSearchResults([]); setOffSearchResults([]); setUploadedImage(null); setExtractedText(''); }} className="w-full py-4 rounded-2xl bg-green-900 text-white font-bold text-base">Done</button>
                  </div>
                </div>
              );
            })}

            {!showDetailedEnvironmental && searchResults.length === 0 && offSearchResults.length > 0 && (
              <div className="px-5 pb-6">
                {offSearchResults.slice(0, 3).map((result, i) => (
                  <div key={`${result.barcode}-${i}`} className="pt-4">
                    <div className="flex items-start gap-3 mb-5">
                      <div className="flex-1">
                        <span className="inline-flex mb-2 px-3 py-1 rounded-full bg-green-900 text-white text-xs font-bold">Food Product</span>
                        <h2 className="text-xl font-black text-green-950 leading-tight">{result.productName || 'Unknown Product'}</h2>
                        {result.brand && <p className="text-sm text-gray-500 font-semibold mt-0.5">{result.brand}</p>}
                      </div>
                      {result.imageUrl && <img src={result.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-green-50/60 rounded-2xl p-4">
                        <div className="flex items-center gap-1.5 mb-1"><span className="text-lg">🌍</span><span className="text-xs font-semibold text-gray-500">Eco Score</span></div>
                        <span className="text-3xl font-black text-green-950 uppercase">{result.ecoscoreGrade || '—'}</span>
                      </div>
                      <div className="bg-green-50/60 rounded-2xl p-4">
                        <div className="flex items-center gap-1.5 mb-1"><span className="text-lg">🥗</span><span className="text-xs font-semibold text-gray-500">Nutri Score</span></div>
                        <span className="text-3xl font-black text-green-950 uppercase">{result.nutriscoreGrade || '—'}</span>
                      </div>
                      {result.carbonFootprint100g != null && (
                        <div className="bg-green-50/60 rounded-2xl p-4">
                          <div className="flex items-center gap-1.5 mb-1"><span className="text-lg">🌿</span><span className="text-xs font-semibold text-gray-500">CO₂/100g</span></div>
                          <span className="text-2xl font-black text-green-950">{result.carbonFootprint100g.toFixed(1)}g</span>
                        </div>
                      )}
                      {result.novaGroup != null && (
                        <div className="bg-green-50/60 rounded-2xl p-4">
                          <div className="flex items-center gap-1.5 mb-1"><span className="text-lg">🔬</span><span className="text-xs font-semibold text-gray-500">NOVA Group</span></div>
                          <span className="text-3xl font-black text-green-950">{result.novaGroup}</span>
                        </div>
                      )}
                    </div>
                    {result.ecoscoreGrade && (
                      <div className="bg-green-50/60 rounded-2xl p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2"><span className="text-lg">💚</span><span className="text-sm font-bold text-green-950">Eco score</span></div>
                          <span className="text-sm font-black text-green-600 uppercase">{result.ecoscoreGrade}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: result.ecoscoreGrade === 'a' ? '90%' : result.ecoscoreGrade === 'b' ? '70%' : result.ecoscoreGrade === 'c' ? '50%' : result.ecoscoreGrade === 'd' ? '30%' : '10%', background: result.ecoscoreGrade === 'a' ? '#16a34a' : result.ecoscoreGrade === 'b' ? '#84cc16' : result.ecoscoreGrade === 'c' ? '#eab308' : '#ef4444' }} />
                        </div>
                      </div>
                    )}
                    {offAlternativeLoading && (
                      <div className="flex items-center gap-2 mb-3">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-green-600" />
                        <span className="text-xs text-gray-500">Finding better alternatives…</span>
                      </div>
                    )}
                    {offAlternatives.length > 0 && !offAlternativeLoading && (
                      <div className="bg-green-50/60 rounded-2xl p-4 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-base">🌱</span>
                          <span className="text-xs font-bold text-green-950">Better Alternatives</span>
                          <span className="ml-auto text-xs font-semibold text-green-700">{offAlternatives.length} found</span>
                        </div>
                        <div className="space-y-2">
                          {offAlternatives.slice(0, 2).map((alt, altIdx) => (
                            <button key={`preview-alt-${altIdx}`} onClick={() => viewDetailedEnvironmental(alt)} className="w-full flex items-center gap-2 p-2 rounded-xl bg-white/60 text-left">
                              {alt.imageUrl && <img src={alt.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-green-950 truncate">{alt.productName || 'Product'}</p>
                                {alt.ecoscoreGrade && <span className="text-xs font-bold text-green-700 uppercase">Eco: {alt.ecoscoreGrade}</span>}
                              </div>
                              <span className="text-xs text-green-700 font-bold">→</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="space-y-3 pb-2">
                      <button onClick={() => viewDetailedEnvironmental(result)} className="w-full py-4 rounded-2xl border-2 border-green-200 text-green-900 font-bold text-base flex items-center justify-center gap-2 hover:bg-green-50 transition-colors">View Results</button>
                      <button onClick={() => { setOffSearchResults([]); setOffSearchImage(null); setUploadedImage(null); }} className="w-full py-4 rounded-2xl bg-green-900 text-white font-bold text-base">Done</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Scan;
