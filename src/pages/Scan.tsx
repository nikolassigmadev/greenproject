import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Upload, Search, Loader2, AlertCircle, X, ScanLine, Image as ImageIcon, Plus, Leaf, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  // Auto-start camera when page loads
  useEffect(() => {
    // Small delay to ensure video element is mounted
    const timer = setTimeout(() => {
      if (videoRef.current && !cameraActive && !cameraInitializing) {
        startCamera();
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      const filteredResults = results.slice(0, 3);

      if (filteredResults.length === 0) {
        toast({
          title: "No Results",
          description: `No products found for "${searchQuery}" on OpenFoodFacts.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: `${filteredResults.length} Product${filteredResults.length > 1 ? "s" : ""} Found`,
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Camera Interface - Full Width */}
        <section className="bg-black relative">
          <div className="relative w-full" style={{ minHeight: '60vh', maxHeight: '80vh' }}>
            {/* Video element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              webkit-playsinline="true"
              x5-playsinline="true"
              controls={false}
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              style={{
                minHeight: '60vh',
                maxHeight: '80vh',
                backgroundColor: '#000',
                WebkitTransform: 'translate3d(0,0,0)',
                transform: 'translate3d(0,0,0)',
                WebkitUserSelect: 'none',
                userSelect: 'none',
              } as React.CSSProperties}
              onError={(e) => {
                console.error('Video element error:', e);
              }}
              onLoadedMetadata={() => {
                console.log('Video metadata loaded:', (videoRef.current as HTMLVideoElement).videoWidth, 'x', (videoRef.current as HTMLVideoElement).videoHeight);
              }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {cameraActive && (
              <>
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative">
                    <div className="w-[min(78vw,26rem)] aspect-square border-2 border-green-400 rounded-2xl" />
                    <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-green-400 rounded-tl-lg" />
                    <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-green-400 rounded-tr-lg" />
                    <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-green-400 rounded-bl-lg" />
                    <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-green-400 rounded-br-lg" />
                  </div>
                </div>

                {/* Top bar */}
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4 sm:p-6">
                  <div className="flex items-center justify-between max-w-screen-xl mx-auto">
                    <div>
                      <p className="text-white font-black text-lg">Scan Product</p>
                      <p className="text-white/60 text-sm">Point at barcode or product label</p>
                    </div>
                    <Button
                      onClick={stopCamera}
                      variant="secondary"
                      size="sm"
                      className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-full backdrop-blur-sm"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Bottom controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6 sm:p-8">
                  <div className="flex justify-center items-center gap-4">
                    <Button
                      onClick={() => offFileInputRef.current?.click()}
                      variant="secondary"
                      className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-full w-12 h-12 p-0 backdrop-blur-sm"
                    >
                      <Upload className="w-5 h-5" />
                    </Button>
                    <Button
                      onClick={capturePhoto}
                      size="lg"
                      className="bg-white hover:bg-green-50 text-green-900 rounded-full w-20 h-20 p-0 shadow-lg ring-4 ring-white/30"
                    >
                      <Camera className="w-8 h-8" />
                    </Button>
                    <Button
                      onClick={() => {
                        stopCamera();
                        const el = document.getElementById('lookup');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      variant="secondary"
                      className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-full w-12 h-12 p-0 backdrop-blur-sm"
                    >
                      <Search className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {cameraInitializing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black" style={{ minHeight: '60vh' }}>
                <div className="text-center space-y-4 p-8">
                  <Loader2 className="w-12 h-12 animate-spin text-green-400 mx-auto" />
                  <div className="space-y-2">
                    <p className="text-lg font-black text-white">Starting camera...</p>
                    <p className="text-sm text-white/60">Please allow camera access when prompted</p>
                  </div>
                </div>
              </div>
            )}

            {!cameraActive && !cameraInitializing && (
              <div className="flex items-center justify-center bg-green-950" style={{ minHeight: '60vh' }}>
                <div className="text-center space-y-6 p-8 max-w-md">
                  <div className="w-20 h-20 rounded-full bg-green-900 flex items-center justify-center mx-auto">
                    <Camera className="w-10 h-10 text-green-300" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white mb-2">Camera Access Needed</h2>
                    <p className="text-green-200/70 text-sm leading-relaxed">
                      Allow camera access to scan product barcodes and labels instantly
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={startCamera}
                      className="bg-white text-green-900 font-black hover:bg-green-50 h-14 rounded-2xl text-base"
                      disabled={isProcessing}
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Enable Camera
                    </Button>
                    <Button
                      onClick={() => offFileInputRef.current?.click()}
                      variant="outline"
                      className="bg-white/10 text-white border-white/20 font-black hover:bg-white/20 h-12 rounded-2xl"
                      disabled={isProcessing}
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Upload Image Instead
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Processing State */}
        {isProcessing && (
          <div className="bg-green-50 border-b border-green-100">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-center gap-4">
              <div className="relative">
                <Loader2 className="w-6 h-6 animate-spin text-green-600" />
              </div>
              <p className="text-sm font-semibold text-green-900">
                {isScanning ? "Reading text from image..." : "Processing image..."}
              </p>
            </div>
          </div>
        )}

        {/* Results area */}
        <div className="py-10 sm:py-14">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6">

          {/* OpenFoodFacts Lookup */}
          <section id="lookup" className="mb-12 sm:mb-16">
            <div className="mb-8">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-green-950">Search Products</h2>
              <p className="text-gray-500 font-medium mt-1">Look up by barcode or upload a product image</p>
            </div>
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="pt-6 space-y-6">
              {/* Barcode Input */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Barcode Search</label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleBarcodeLookup(barcodeInput);
                  }}
                  className="flex gap-3"
                >
                  <Input
                    placeholder="Enter barcode (e.g., 3017620422003)"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="flex-1 h-11 rounded-lg border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                    inputMode="numeric"
                  />
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 h-11 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300" disabled={offLoading}>
                    {offLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </div>

              {/* Image Upload */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Image Search</label>
                <Button
                  onClick={() => offFileInputRef.current?.click()}
                  disabled={offSearchLoading}
                  className="w-full h-11 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-all duration-300"
                  variant="outline"
                >
                  {offSearchLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Product Image
                    </>
                  )}
                </Button>
                <input
                  ref={offFileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleOffFileUpload}
                  className="hidden"
                />
              </div>

              {/* Preview uploaded image */}
              {offSearchImage && (
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900 aspect-video max-h-48 border border-slate-200 dark:border-slate-700">
                    <img
                      src={offSearchImage}
                      alt="Scanned product"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {offSearchText && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Identified: <span className="font-medium">{offSearchText}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Loading state */}
              {offSearchLoading && (
                <div className="flex items-center justify-center gap-3 py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Searching database...</span>
                </div>
              )}

              {/* Search results */}
              {offSearchResults.length > 0 && !offSearchLoading && !showDetailedEnvironmental && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Found {offSearchResults.length} result{offSearchResults.length > 1 ? "s" : ""}
                  </p>
                  <div className="space-y-2">
                    {offSearchResults.map((result, i) => (
                      <div key={`${result.barcode}-${i}`}>
                        <OpenFoodFactsCard result={result} />
                        <div className="mt-2 flex justify-center">
                          <Button
                            onClick={() => viewDetailedEnvironmental(result)}
                            variant="outline"
                            size="sm"
                            className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                          >
                            <Leaf className="w-4 h-4 mr-2" />
                            View Detailed Environmental Impact
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Greener Alternatives Suggestion */}
                  {offAlternativeLoading && (
                    <div className="flex items-center gap-2 py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Searching for greener alternatives...</span>
                    </div>
                  )}
                  {offAlternatives.length > 0 && !offAlternativeLoading && (
                    <div className="p-4 rounded-2xl border-2 border-emerald-300/60 dark:border-emerald-700/60 bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Leaf className="w-5 h-5 text-emerald-600" />
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                          Greener Alternatives ({offAlternatives.length})
                        </p>
                      </div>
                      <div className="space-y-3">
                        {offAlternatives.map((alt, i) => (
                          <div key={`${alt.barcode}-alt-${i}`} className="flex items-start gap-3 p-3 rounded-xl bg-white/60 dark:bg-slate-800/40 border border-emerald-200/40 dark:border-emerald-700/40">
                            {alt.imageUrl && (
                              <img
                                src={alt.imageUrl}
                                alt={alt.productName || "Alternative"}
                                className="w-14 h-14 rounded-lg object-cover border border-emerald-200 dark:border-emerald-700 flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">
                                {alt.productName || "Unknown Product"}
                              </p>
                              {alt.brand && (
                                <p className="text-xs text-slate-600 dark:text-slate-400">{alt.brand}</p>
                              )}
                              <div className="flex items-center gap-3 mt-1">
                                {alt.ecoscoreGrade && (
                                  <span className="text-xs font-bold text-emerald-600">
                                    Eco-Score: {alt.ecoscoreGrade.toUpperCase()}
                                  </span>
                                )}
                                {alt.ecoscoreData?.agribalyse?.co2_total != null ? (
                                  <span className="text-xs text-slate-600 dark:text-slate-400">
                                    CO2: <span className="font-bold text-emerald-600">{alt.ecoscoreData.agribalyse.co2_total.toFixed(2)} kg/kg</span>
                                  </span>
                                ) : alt.carbonFootprint100g != null ? (
                                  <span className="text-xs text-slate-600 dark:text-slate-400">
                                    CO2: <span className="font-bold text-emerald-600">{alt.carbonFootprint100g.toFixed(1)} g/100g</span>
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <Button
                              onClick={() => viewDetailedEnvironmental(alt)}
                              variant="outline"
                              size="sm"
                              className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 flex-shrink-0"
                            >
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Detailed Environmental View */}
              {showDetailedEnvironmental && selectedEnvironmentalResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                      Environmental Impact Analysis
                    </h3>
                    <Button
                      onClick={backToSearchResults}
                      variant="outline"
                      size="sm"
                    >
                      ← Back to Results
                    </Button>
                  </div>
                  <EnvironmentalImpactCard result={selectedEnvironmentalResult} />
                </div>
              )}

              {/* No results */}
              {offSearchResults.length === 0 && (offSearchImage || barcodeInput) && !offSearchLoading && !offLoading && (offSearchText || offResult) && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    {offSearchText ? `No products found for "${offSearchText}"` : 
                     offResult?.found === false ? offResult.error || "Product not found" :
                     "No products found"}
                  </p>
                </div>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Powered by OpenFoodFacts database
              </p>
            </CardContent>
            </Card>
          </section>



          {/* Search Results */}
          {searchResults.length > 0 && (
            <section className="mb-12 sm:mb-16">
              <div className="mb-8">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-green-950 mb-3">
                  Found {searchResults.length} Product{searchResults.length > 1 ? "s" : ""}
                </h2>
                <p className="text-gray-600 font-medium">Click on any product to view detailed ethical ratings</p>
              </div>
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50/30 dark:from-slate-900 dark:to-slate-800/30">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/50">
                    <Search className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-lg bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
                    Results
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchResults.map((product) => {
                    const score = calculateScore(product);
                    const alternative = score < 60 ? findLowCO2Alternative(product, products) : null;
                    return (
                      <div key={product.id} className="space-y-3">
                        <button
                          onClick={() => navigate(`/product/${product.id.replace("#", "")}`)}
                          className="w-full p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-400/50 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-blue-100/30 dark:hover:from-blue-950/20 dark:hover:to-blue-900/20 transition-all duration-300 text-left flex items-center gap-4 group shadow-sm hover:shadow-lg"
                        >
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                            {uploadedImage ? (
                              <img src={uploadedImage} alt="" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <ScanLine className="w-8 h-8 text-blue-500/50" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-base text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                              {product.name}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                              {product.brand} • <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{product.id}</span>
                            </p>
                            <div className="flex items-center gap-4">
                              <div className="text-sm">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Score: </span>
                                <span className="font-bold text-blue-600 dark:text-blue-400">{score}</span>
                              </div>
                              <div className="flex-1">
                                <ScoreBreakdownSlider product={product} />
                              </div>
                            </div>
                          </div>
                        </button>

                        {alternative && (
                          <button
                            onClick={() => navigate(`/product/${alternative.id.replace("#", "")}`)}
                            className="w-full p-4 rounded-2xl border-2 border-emerald-300/60 dark:border-emerald-700/60 bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 hover:border-emerald-400 hover:shadow-lg transition-all duration-300 text-left flex items-center gap-4 group"
                          >
                            <div className="w-12 h-12 rounded-xl bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center flex-shrink-0">
                              <Leaf className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide mb-1">
                                Greener Alternative
                              </p>
                              <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                                {alternative.name}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {alternative.brand} • Score: <span className="font-bold text-emerald-600">{calculateScore(alternative)}</span> • CO2: <span className="font-bold text-emerald-600">{alternative.carbonFootprint} kg</span>
                              </p>
                            </div>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              </Card>
            </section>
          )}

          {/* No Results Found - Add Product Option */}
          {searchResults.length === 0 && extractedText && uploadedImage && (
            <section className="mb-12 sm:mb-16">
              <div className="mb-8">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-green-950 mb-3">Help Us Grow</h2>
                <p className="text-gray-600 font-medium">Add this product to our ethical database</p>
              </div>
              <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-50 via-amber-100/50 to-amber-50/30 dark:from-amber-950/30 dark:via-amber-900/20 dark:to-amber-950/10">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-amber-200 dark:bg-amber-800">
                    <Plus className="w-4 h-4 text-amber-700 dark:text-amber-300" />
                  </div>
                  <CardTitle className="text-lg text-amber-800 dark:text-amber-200">
                    Add New Product
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-amber-200/50 dark:border-amber-800/30">
                    <div className="flex items-center gap-2 mb-3">
                      <ScanLine className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Extracted Information</p>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-mono bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200/30 dark:border-amber-800/30">
                      {extractedText}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 shadow-lg flex-shrink-0">
                      <img 
                        src={uploadedImage} 
                        alt="Scanned product" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-3">
                      <Button 
                        onClick={createProductFromOCR}
                        className="w-full h-14 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 gap-3 text-base font-semibold"
                        disabled={isProcessing}
                      >
                        <Plus className="w-5 h-5" />
                        {isProcessing ? 'Creating Product...' : 'Add Product with Image'}
                      </Button>
                      <div className="p-3 rounded-lg bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200/30 dark:border-amber-800/30">
                        <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                          <Plus className="w-3 h-3" />
                          This will copy product code to clipboard with the image included for easy addition to the database
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              </Card>
            </section>
          )}

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Scan;
