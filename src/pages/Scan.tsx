import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Upload, Search, Loader2, AlertCircle, X, ScanLine, Image as ImageIcon, Plus, Leaf } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProducts } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { calculateScore, Product } from "@/data/products";
import { ScoreBreakdownSlider } from "@/components/ScoreBreakdownSlider";
import { recognizeImageWithOpenAI } from "@/services/ocr/openai-service";
import { advancedProductOCR, extractBrandName, extractProductName, extractCertifications, checkOpenAIHealth } from "@/services/ocr/advanced-openai-ocr";
import { copySingleProductCode } from "@/utils/productExporter";
import { lookupBarcode, isValidBarcode, searchProducts as searchOffProducts } from "@/services/openfoodfacts";
import { OpenFoodFactsCard } from "@/components/OpenFoodFactsCard";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import Tesseract from "tesseract.js";

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
  const offFileInputRef = useRef<HTMLInputElement>(null);

  // Debug: Check if video element is mounted
  useEffect(() => {
    console.log('Video ref status:', Boolean(videoRef.current));
    console.log('Canvas ref status:', Boolean(canvasRef.current));
  }, [cameraActive, cameraInitializing]);

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
        });
        console.log('Camera access granted with optimal settings');
      } catch (err) {
        console.log('Optimal settings failed, trying basic settings:', err);

        // Second try: basic video without constraints for desktop
        try {
          stream = await mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
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
            });
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
                setOffResult(result);
                if (result.found) {
                  toast({
                    title: "Found on OpenFoodFacts",
                    description: `${result.brand || ""} ${result.productName || "Unknown Product"}`.trim(),
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

    try {
      const result = await lookupBarcode(barcode.trim());
      setOffResult(result);

      if (result.found) {
        toast({
          title: "Product Found on OpenFoodFacts",
          description: `${result.brand || ""} ${result.productName || "Unknown Product"}`.trim(),
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
          if (barcodeResult.found) {
            setOffSearchResults([barcodeResult]);
            setOffSearchText(`Barcode: ${advancedResult.barcode}`);
            setOffSearchLoading(false);
            toast({
              title: "Product Found",
              description: `${barcodeResult.brand || ""} ${barcodeResult.productName || ""}`.trim(),
            });
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

      // Search OpenFoodFacts by product name
      const results = await searchOffProducts(searchQuery, 3);

      if (results.length === 0) {
        toast({
          title: "No Results",
          description: `No products found for "${searchQuery}" on OpenFoodFacts.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: `${results.length} Product${results.length > 1 ? "s" : ""} Found`,
          description: `Searched for "${searchQuery}" on OpenFoodFacts.`,
        });
      }

      setOffSearchResults(results);
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
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container max-w-2xl">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">
              Scan a Product
            </h1>
            <p className="text-muted-foreground">
              Use your camera or upload an image to identify products
            </p>
          </div>

          {/* Scanner Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-primary" />
                Product Scanner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Camera View */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 aspect-[3/4] sm:aspect-video max-h-[72vh] sm:max-h-none shadow-lg border border-slate-200 dark:border-slate-700">
                {/* Video element with improved mobile compatibility */}
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
                    {/* Scanning overlay with improved design */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative">
                        <div className="w-[min(78vw,26rem)] aspect-square border-2 border-primary rounded-2xl animate-pulse-soft shadow-lg" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="absolute inset-4 border border-primary/50 rounded-xl" />
                        </div>
                        {/* Corner indicators */}
                        <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                        <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                        <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                        <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
                      </div>
                    </div>

                    {/* Camera controls with improved positioning */}
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 px-6">
                      <div className="bg-black/20 backdrop-blur-md rounded-full p-2 flex gap-3">
                        <Button 
                          onClick={capturePhoto} 
                          size="lg" 
                          className="bg-gradient-hero hover:scale-105 transition-transform duration-200 rounded-full w-16 h-16 p-0 shadow-lg"
                        >
                          <Camera className="w-6 h-6" />
                        </Button>
                        <Button 
                          onClick={stopCamera} 
                          variant="secondary" 
                          size="lg"
                          className="bg-white/90 hover:bg-white hover:scale-105 transition-all duration-200 rounded-full w-14 h-14 p-0 shadow-lg border border-white/20"
                        >
                          <X className="w-5 h-5 text-slate-700" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
                
                {cameraInitializing ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                    <div className="text-center space-y-4 p-8">
                      <div className="relative">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                        <div className="absolute inset-0 w-12 h-12 animate-ping bg-primary/20 rounded-full mx-auto" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Initializing camera...</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Please allow camera access when prompted</p>
                      </div>
                    </div>
                  </div>
                ) : !cameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-8">
                    <div className="w-full max-w-md space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          onClick={startCamera}
                          variant="outline"
                          className="h-36 flex-col gap-4 bg-white/50 hover:bg-white hover:scale-105 transition-all duration-200 rounded-2xl border-2 border-transparent hover:border-primary/30 shadow-lg backdrop-blur-sm"
                          disabled={isProcessing}
                        >
                          <div className="relative">
                            <Camera className="w-10 h-10 text-primary" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
                          </div>
                          <span className="font-medium">Use Camera</span>
                        </Button>
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          variant="outline"
                          className="h-36 flex-col gap-4 bg-white/50 hover:bg-white hover:scale-105 transition-all duration-200 rounded-2xl border-2 border-transparent hover:border-primary/30 shadow-lg backdrop-blur-sm"
                          disabled={isProcessing}
                        >
                          <Upload className="w-10 h-10 text-primary" />
                          <span className="font-medium">Upload Image</span>
                        </Button>
                      </div>
                      
                      {/* Debug button with improved styling */}
                      <Button
                        onClick={() => {
                          console.log('Debug - Video ref:', videoRef.current);
                          console.log('Debug - Canvas ref:', canvasRef.current);
                          console.log('Debug - File input ref:', fileInputRef.current);
                          console.log('Debug - Camera active:', cameraActive);
                          console.log('Debug - Camera initializing:', cameraInitializing);
                          toast({
                            title: "Debug Info",
                            description: `Video ref: ${videoRef.current ? '✅' : '❌'}, Canvas ref: ${canvasRef.current ? '✅' : '❌'}`,
                          });
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full bg-slate-100/50 hover:bg-slate-200/50 dark:bg-slate-700/50 dark:hover:bg-slate-600/50 transition-all duration-200 rounded-xl border border-slate-300/30 dark:border-slate-600/30"
                      >
                        <span className="text-xs text-slate-500 dark:text-slate-400">🔧 Debug Video Elements</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

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
                <div className="flex items-center justify-center gap-3 py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-muted-foreground">
                    {isScanning ? "Reading text from image..." : "Processing image..."}
                  </span>
                </div>
              )}

              {/* Image Preview */}
              {uploadedImage && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Image Preview:</p>
                  <div className="relative rounded-lg overflow-hidden bg-muted aspect-video max-h-64">
                    <img
                      src={uploadedImage}
                      alt="Uploaded"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Extracted Text */}
              {(extractedText || ocrMessage) && (
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-2">Extracted Text:</p>
                  {extractedText ? (
                    <p className="text-sm font-mono whitespace-pre-wrap">
                      {extractedText.slice(0, 200)}
                      {extractedText.length > 200 && "..."}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">{ocrMessage}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                Manual Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSearch} className="flex gap-3">
                <Input
                  placeholder="Enter product name, barcode, or code (e.g., #p0001)"
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" className="bg-gradient-hero">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Barcode Lookup */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="w-5 h-5 text-emerald-600" />
                Barcode Lookup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleBarcodeLookup(barcodeInput);
                }}
                className="flex gap-3"
              >
                <Input
                  placeholder="Enter barcode number (e.g., 3017620422003)"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="flex-1"
                  inputMode="numeric"
                />
                <Button type="submit" className="bg-gradient-hero" disabled={offLoading}>
                  {offLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  Lookup
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-2">
                Look up food products by EAN/UPC barcode on OpenFoodFacts
              </p>
            </CardContent>
          </Card>

          {/* OpenFoodFacts Results */}
          {offLoading && (
            <Card className="mb-6">
              <CardContent className="flex items-center justify-center gap-3 py-8">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                <span className="text-muted-foreground">Looking up product on OpenFoodFacts...</span>
              </CardContent>
            </Card>
          )}

          {offResult && !offLoading && (
            <div className="mb-6">
              <OpenFoodFactsCard result={offResult} />
              {offResult.found === false && offResult.error && (
                <Card className="mt-3 border-amber-200 dark:border-amber-800">
                  <CardContent className="flex items-center gap-2 py-4">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      {offResult.error}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Scan Image for OpenFoodFacts */}
          <Card className="mb-6 border-emerald-200 dark:border-emerald-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-600" />
                Scan Product for Environmental Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload or take a photo of a food product to search OpenFoodFacts and see its environmental impact.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => offFileInputRef.current?.click()}
                  disabled={offSearchLoading}
                  className="flex-1"
                  variant="outline"
                >
                  {offSearchLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {offSearchLoading ? "Searching..." : "Upload Image"}
                </Button>
              </div>
              <input
                ref={offFileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleOffFileUpload}
                className="hidden"
              />

              {/* Preview uploaded image */}
              {offSearchImage && (
                <div className="space-y-2">
                  <div className="relative rounded-lg overflow-hidden bg-muted aspect-video max-h-48">
                    <img
                      src={offSearchImage}
                      alt="Scanned product"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {offSearchText && (
                    <p className="text-xs text-muted-foreground">
                      Identified: <span className="font-medium">{offSearchText}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Loading state */}
              {offSearchLoading && (
                <div className="flex items-center justify-center gap-3 py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                  <span className="text-sm text-muted-foreground">
                    Identifying product and searching OpenFoodFacts...
                  </span>
                </div>
              )}

              {/* Search results - top 3 */}
              {offSearchResults.length > 0 && !offSearchLoading && (
                <div className="space-y-4">
                  <p className="text-sm font-medium">
                    Top {offSearchResults.length} Result{offSearchResults.length > 1 ? "s" : ""}
                  </p>
                  {offSearchResults.map((result, i) => (
                    <OpenFoodFactsCard key={`${result.barcode}-${i}`} result={result} />
                  ))}
                </div>
              )}

              {/* No results */}
              {offSearchResults.length === 0 && offSearchImage && !offSearchLoading && offSearchText && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-amber-800 dark:text-amber-200">
                    No products found for "{offSearchText}" on OpenFoodFacts. Try a different image or use the barcode lookup above.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Search Results ({searchResults.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => navigate(`/product/${product.id.replace("#", "")}`)}
                      className="w-full p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-lg bg-eco-sage/20 flex items-center justify-center flex-shrink-0">
                        {uploadedImage ? (
                          <img src={uploadedImage} alt="" className="w-full h-full object-cover rounded" />
                        ) : (
                          <ScanLine className="w-6 h-6 text-primary/50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.brand} • {product.id}
                        </p>
                        <div className="mt-3">
                          <div className="text-sm font-medium">Score: {calculateScore(product)}</div>
                          <div className="mt-2">
                            <ScoreBreakdownSlider product={product} />
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Results Found - Add Product Option */}
          {searchResults.length === 0 && extractedText && uploadedImage && (
            <Card>
              <CardHeader>
                <CardTitle>No Products Found</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    No products match "{extractedText}". Would you like to add this product to the database?
                  </p>
                  
                  {/* Show extracted info */}
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="text-sm font-medium mb-2">Extracted Information:</p>
                    <p className="text-sm text-muted-foreground">{extractedText}</p>
                  </div>
                  
                  {/* Show uploaded image */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img 
                        src={uploadedImage} 
                        alt="Scanned product" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <Button 
                        onClick={createProductFromOCR}
                        className="w-full bg-gradient-hero gap-2"
                        disabled={isProcessing}
                      >
                        <Plus className="w-4 h-4" />
                        {isProcessing ? 'Processing...' : 'Add Product with Image'}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        This will copy product code to clipboard with the image included
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Scanning Tips</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Position the product label clearly in frame</li>
                  <li>Ensure good lighting for best results</li>
                  <li>Try scanning barcodes for faster identification</li>
                  <li>Use manual search if scanning doesn't work</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Debug Information */}
          <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-2">Camera Troubleshooting</p>
                <div className="space-y-1 text-blue-800 text-xs">
                  <p><strong>Browser:</strong> {navigator.userAgent.match(/Chrome|Safari|Firefox|Edge|Opera/) ? navigator.userAgent.match(/Chrome|Safari|Firefox|Edge|Opera/)?.[0] : 'Unknown'}</p>
                  <p><strong>Device:</strong> {/Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? '📱 Mobile' : '💻 Desktop'}</p>
                  <p><strong>Protocol:</strong> {location.protocol}</p>
                  <p><strong>Host:</strong> {location.hostname}</p>
                  <p><strong>mediaDevices:</strong> {navigator.mediaDevices ? '✅' : '❌'} {!navigator.mediaDevices && <span className="text-red-600 font-medium">(Required!)</span>}</p>
                  <p><strong>getUserMedia:</strong> {navigator.mediaDevices?.getUserMedia ? '✅' : '❌'} {!navigator.mediaDevices?.getUserMedia && <span className="text-red-600 font-medium">(Required!)</span>}</p>
                  <p><strong>Secure Context:</strong> {location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? '✅ Yes' : '❌ No'}</p>
                </div>
                <div className="mt-3 space-y-2">
                  <p className="font-medium text-blue-900 text-xs">If camera doesn't work:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800 text-xs">
                    <li><strong>First:</strong> Open browser console (F12) and click "Use Camera" - read any errors there</li>
                    <li><strong>Permissions:</strong> Check the 🔒 lock icon in address bar - grant camera access</li>
                    <li><strong>Refresh:</strong> Reload the page after allowing permissions</li>
                    <li><strong>Other apps:</strong> Close apps using camera (Zoom, Teams, Discord, etc)</li>
                    <li><strong>Browser:</strong> Try Chrome, Firefox, Safari, or Edge</li>
                    <li><strong>Mobile:</strong> Try portrait mode, use Chrome browser, check iOS privacy settings</li>
                    <li><strong>HTTPS:</strong> Remote sites need HTTPS (not http://)</li>
                    <li><strong>localhost:</strong> Use http://localhost:8080 or http://127.0.0.1:8080</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Scan;
