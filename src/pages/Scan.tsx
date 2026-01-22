import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Upload, Search, Loader2, AlertCircle, X, ScanLine, Image as ImageIcon } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProducts } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { calculateScore, Product } from "@/data/products";
import { ScoreBreakdownSlider } from "@/components/ScoreBreakdownSlider";
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
   if (t.length < 3) return false;
   if (/(.)\1{2,}/.test(t)) return false;
   if (!/^[a-z]+$/.test(t)) return false;

   const vowels = (t.match(/[aeiouy]/g) || []).length;
   if (vowels === 0) return false;

   if (t.length === 3) {
     return shortOcrTokenAllowlist.has(t);
   }

   if (t.length === 4) {
     if (shortOcrTokenAllowlist.has(t)) return true;
     return vowels / t.length >= 0.5;
   }

   if (/[b-df-hj-np-tv-z]{5,}/.test(t)) return false;
   return vowels / t.length >= 0.18;
 };

 const cleanupOcrTextForDisplay = (text: string) => {
   const normalized = normalizeOcrText(text).toLowerCase();
   const words = normalized.match(/\b[a-z]{3,}(?:[-'][a-z]{2,})*\b/g) || [];
   const filtered = words.filter(isAcceptableOcrToken);
   return normalizeOcrText(uniqPreserveOrder(filtered).join(" "));
 };

 const cleanupOcrTextForSearch = (text: string) => {
   const normalized = normalizeOcrText(text).toLowerCase();
   const words = normalized.match(/\b[a-z]{3,}(?:[-'][a-z]{2,})*\b/g) || [];
   const numericCodes = normalized.match(/\b\d{8,}\b/g) || [];
   const filtered = words.filter(isAcceptableOcrToken);
   return normalizeOcrText(uniqPreserveOrder([...filtered, ...numericCodes]).join(" "));
 };

 const shouldTreatAsNoText = (text: string, result: OcrResult) => {
   const visible = text.replace(/\s/g, "");
   if (visible.length < 6) return true;

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
   if (visible.length < 6) return true;

   const digits = (visible.match(/[0-9]/g) || []).length;
   const letters = (visible.match(/[a-z]/gi) || []).length;
   const total = visible.length;

   const digitRatio = total ? digits / total : 0;
   const letterRatio = total ? letters / total : 0;

   // If it looks like a numeric code/barcode, allow it.
   if (digits >= 8 && digitRatio >= 0.6) return false;

   if (letters < 4) return true;
   if (letterRatio < 0.35) return true;
   if (/(.)\1{3,}/.test(visible)) return true;

   const vowels = (visible.match(/[aeiou]/gi) || []).length;
   const vowelRatio = letters ? vowels / letters : 0;
   if (vowelRatio < 0.12) return true;

   const tokens = text.split(/\s+/).map((t) => t.trim()).filter(Boolean);
   if (tokens.length === 0) return true;

   const avgTokenLen = tokens.reduce((sum, t) => sum + t.length, 0) / tokens.length;
   if (tokens.length < 2 && avgTokenLen < 3) return true;

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

  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraInitializing, setCameraInitializing] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [ocrMessage, setOcrMessage] = useState<string | null>(null);
  const [manualSearch, setManualSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Debug: Check if video element is mounted
  useEffect(() => {
    console.log('Video ref status:', Boolean(videoRef.current));
    console.log('Canvas ref status:', Boolean(canvasRef.current));
  }, [cameraActive, cameraInitializing]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setCameraInitializing(true);
      
      // Check if video ref exists before proceeding
      if (!videoRef.current) {
        console.error('Video ref is null at start');
        setCameraInitializing(false);
        toast({
          title: "Camera Error",
          description: "Video element not ready. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }
      
      // Debug: Log what's available in navigator
      console.log('Navigator object:', navigator);
      console.log('MediaDevices available:', Boolean(navigator.mediaDevices));
      console.log('getUserMedia available:', Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
      console.log('Video element exists:', Boolean(videoRef.current));
      
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices) {
        console.error('navigator.mediaDevices is not available');
        toast({
          title: "Browser Not Supported",
          description: "Camera access is not supported in this browser. Please try Chrome, Firefox, or Safari.",
          variant: "destructive",
        });
        setCameraInitializing(false);
        return;
      }

      if (!navigator.mediaDevices.getUserMedia) {
        console.error('navigator.mediaDevices.getUserMedia is not available');
        toast({
          title: "Browser Not Supported",
          description: "Camera access is not supported in this browser. Please try Chrome, Firefox, or Safari.",
          variant: "destructive",
        });
        setCameraInitializing(false);
        return;
      }

      // Check if we're in a secure context
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        toast({
          title: "Secure Context Required",
          description: "Camera access requires HTTPS. Please use a secure connection or localhost.",
          variant: "destructive",
        });
        setCameraInitializing(false);
        return;
      }

      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      console.log('Camera access granted, setting up video stream...');
      
      // Double-check video ref still exists
      if (!videoRef.current) {
        console.error('Video ref became null during async operation');
        setCameraInitializing(false);
        toast({
          title: "Camera Error",
          description: "Video element not found. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }
      
      const video = videoRef.current;
      
      // Clear any existing stream
      if (video.srcObject) {
        const oldStream = video.srcObject as MediaStream;
        oldStream.getTracks().forEach(track => track.stop());
      }
      
      video.srcObject = stream;
      
      // Force video to load the new stream
      video.load();
      
      // Wait for video to be ready to play
      video.onloadedmetadata = () => {
        console.log('Video metadata loaded, playing video...');
        // Ensure video dimensions are set
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        
        video.play()
          .then(() => {
            console.log('Video playing successfully');
            console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
            setCameraActive(true);
            setCameraInitializing(false);
            toast({
              title: "Camera Active",
              description: "Camera is ready to scan products.",
            });
          })
          .catch((error) => {
            console.error('Error playing video:', error);
            setCameraInitializing(false);
            toast({
              title: "Camera Error",
              description: "Failed to start video stream. Please try again.",
              variant: "destructive",
            });
          });
      };
      
      video.onerror = (error) => {
        console.error('Video error:', error);
        setCameraInitializing(false);
        toast({
          title: "Camera Error",
          description: "Video stream failed to load. Please try again.",
          variant: "destructive",
        });
      };

      // Add timeout for video loading
      setTimeout(() => {
        if (!cameraActive && cameraInitializing) {
          console.error('Video loading timeout');
          setCameraInitializing(false);
          toast({
            title: "Camera Error",
            description: "Camera initialization timed out. Please try again.",
            variant: "destructive",
          });
        }
      }, 10000); // 10 second timeout
    } catch (error: unknown) {
      console.error('Camera error:', error);
      setCameraInitializing(false);

      const errName =
        typeof error === "object" && error !== null && "name" in error
          ? String((error as { name?: unknown }).name)
          : "";
      
      let errorMessage = "Unable to access camera. Please check permissions.";
      if (errName === 'NotAllowedError') {
        errorMessage = "Camera permission denied. Please allow camera access in your browser settings.";
      } else if (errName === 'NotFoundError') {
        errorMessage = "No camera found. Please connect a camera and try again.";
      } else if (errName === 'NotReadableError') {
        errorMessage = "Camera is already in use by another application.";
      } else if (errName === 'OverconstrainedError') {
        errorMessage = "Camera constraints not supported. Trying with default settings...";
        // Fallback to basic video constraints
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            setCameraActive(true);
          }
        } catch {
          errorMessage = "Unable to access camera with any settings.";
        }
      }
      
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast, cameraActive, cameraInitializing]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
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

  // Process image with OCR
  const processImage = useCallback(async (imageData: string) => {
    setIsProcessing(true);
    setExtractedText("");
    setOcrMessage(null);
    setSearchResults([]);

    try {
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

     const chosenText = normalizeOcrText(best?.candidateText || "");
     const cleanedForDisplay = cleanupOcrTextForDisplay(chosenText);
     const cleanedForSearch = cleanupOcrTextForSearch(chosenText);
     const shouldReject = cleanedForSearch.length < 4 || isLikelyGibberish(cleanedForSearch);

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

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      processImage(canvas.toDataURL("image/jpeg"));
    }
    stopCamera();
  }, [processImage, stopCamera]);

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
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 aspect-video shadow-lg border border-slate-200 dark:border-slate-700">
                {/* Always render video element, control visibility with CSS */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  style={{ 
                    transform: 'scaleX(-1)',
                    backgroundColor: '#000'
                  }}
                  onError={(e) => {
                    console.error('Video element error:', e);
                  }}
                  onStalled={() => {
                    console.log('Video stalled');
                  }}
                  onSuspend={() => {
                    console.log('Video suspended');
                  }}
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {cameraActive && (
                  <>
                    {/* Scanning overlay with improved design */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative">
                        <div className="w-56 h-56 border-2 border-primary rounded-2xl animate-pulse-soft shadow-lg" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-48 h-48 border border-primary/50 rounded-xl" />
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
                <div className="space-y-1 text-blue-800">
                  <p><strong>Browser:</strong> {navigator.userAgent.split(' ').slice(-2).join(' ')}</p>
                  <p><strong>Protocol:</strong> {location.protocol}</p>
                  <p><strong>Hostname:</strong> {location.hostname}</p>
                  <p><strong>Navigator has mediaDevices:</strong> {navigator.mediaDevices ? '✅ Yes' : '❌ No'}</p>
                  <p><strong>getUserMedia available:</strong> {!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ? '❌ No' : '✅ Yes'}</p>
                  <p><strong>Secure Context:</strong> {location.protocol === 'https:' || location.hostname === 'localhost' ? '✅ Yes' : '❌ No'}</p>
                  <p><strong>HTTPS required:</strong> {location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1' ? '❌ Yes (missing)' : '✅ No'}</p>
                </div>
                <div className="mt-3 space-y-2">
                  <p className="font-medium text-blue-900">If camera doesn't work:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>Open browser console (F12) and click "Use Camera" to see detailed errors</li>
                    <li>Check browser camera permissions (click the 🔒 icon in address bar)</li>
                    <li>Try refreshing the page and granting camera access</li>
                    <li>Ensure no other app is using the camera</li>
                    <li>Try using Chrome, Firefox, or Safari browsers</li>
                    <li>On mobile, use the built-in camera app instead</li>
                    <li>If using localhost, make sure you're on http://localhost:8080 or http://127.0.0.1:8080</li>
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
