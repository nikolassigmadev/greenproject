/** Resize a base64 JPEG to maxPx on the longest side and re-encode at 0.8 quality */
const compressImageBase64 = (base64: string, maxPx: number): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
    };
    img.onerror = () => resolve(base64);
    img.src = `data:image/jpeg;base64,${base64}`;
  });
};

// Fallback OCR function when server-side OCR is not available
export const fallbackOCR = async (imageDataUrl: string): Promise<AdvancedOCRResult> => {
  const startTime = performance.now();

  try {
    // Use Tesseract.js as fallback with better preprocessing
    const Tesseract = (await import('tesseract.js')).default;

    // Preprocess image for better OCR results
    const preprocessImage = async (dataUrl: string) => {
      const img = new Image();
      img.src = dataUrl;
      await new Promise(resolve => img.onload = resolve);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // Scale up for better text recognition
      const scale = 2;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      // Apply preprocessing
      ctx.filter = 'contrast(1.5) brightness(1.1)';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      return canvas.toDataURL('image/jpeg', 0.9);
    };

    const preprocessed = await preprocessImage(imageDataUrl);

    const result = await Tesseract.recognize(preprocessed, 'eng', {
      logger: () => {} // Silent logging
    });

    const extractedText = result.data.text.trim();

    // Validate and clean the extracted text
    const cleanText = extractedText
      .replace(/[^\w\s\-.,]/g, ' ') // Remove special characters except hyphens, periods, commas
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Extract potential product name and brand from the text
    const words = cleanText.split(' ').filter(w => w.length > 2);
    let productName = null;
    let brandName = null;

    if (words.length >= 2) {
      // Heuristic: first word might be brand, rest might be product name
      brandName = words[0];
      productName = words.slice(1).join(' ').substring(0, 50); // Limit length
    } else if (words.length === 1) {
      productName = words[0];
    }

    if (cleanText && cleanText.length > 3) {
      return {
        success: true,
        fullText: cleanText,
        confidence: result.data.confidence / 100,
        productName: productName || undefined,
        brandName: brandName || undefined,
        certifications: [],
        ingredients: [],
        barcode: null,
        nutritionInfo: null,
        rawExtraction: extractedText,
        processingTime: performance.now() - startTime,
        notes: 'Tesseract.js fallback OCR with preprocessing'
      };
    }

    return {
      success: false,
      fullText: '',
      confidence: 0,
      rawExtraction: '',
      error: 'No text could be extracted with fallback OCR',
      processingTime: performance.now() - startTime
    };
  } catch (error) {
    return {
      success: false,
      fullText: '',
      confidence: 0,
      rawExtraction: '',
      error: error instanceof Error ? error.message : 'Fallback OCR failed',
      processingTime: performance.now() - startTime
    };
  }
};

/**
 * Advanced OCR Result Type
 */
export interface AdvancedOCRResult {
  success: boolean;
  fullText: string;
  productName?: string;
  brandName?: string;
  ingredients?: string[];
  barcode?: string;
  certifications?: string[];
  nutritionInfo?: string;
  confidence: number;
  rawExtraction: string;
  error?: string;
  processingTime?: number;
  notes?: string;
}

/**
 * Product OCR via server-side Netlify Function.
 * The function proxies the request to OpenAI so the API key stays secret.
 * Falls back to Tesseract.js if the function is unavailable.
 */
export const advancedProductOCR = async (imageDataUrl: string): Promise<AdvancedOCRResult> => {
  const startTime = performance.now();

  try {
    let base64Image = imageDataUrl;
    if (imageDataUrl.includes(',')) {
      base64Image = imageDataUrl.split(',')[1];
    }

    // Downscale image to max 800px before sending — reduces upload size ~4×
    const compressedBase64 = await compressImageBase64(base64Image, 800);

    const response = await fetch('/.netlify/functions/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: compressedBase64 }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('OCR function error, falling back to Tesseract.js:', errorData);
      return await fallbackOCR(imageDataUrl);
    }

    const data = await response.json();

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    if (data.success && (data.productName || data.brandName)) {
      const fullText = `${data.brandName || ''} ${data.productName || ''}`.trim();
      return {
        success: true,
        fullText,
        confidence: 0.9,
        rawExtraction: data.rawText || '',
        processingTime,
        productName: data.productName || undefined,
        brandName: data.brandName || undefined,
        certifications: [],
        ingredients: [],
        barcode: data.barcode || null,
        nutritionInfo: null,
        notes: 'Server-side GPT-4o-mini image analysis'
      };
    } else {
      // Server returned no match — try Tesseract fallback
      console.warn('Server OCR found no product, falling back to Tesseract.js');
      return await fallbackOCR(imageDataUrl);
    }
  } catch (error) {
    console.warn('OCR function request failed, falling back to Tesseract.js:', error);
    return await fallbackOCR(imageDataUrl);
  }
};

/**
 * Extract ONLY brand name — delegates to server-side function
 */
export const extractBrandName = async (imageDataUrl: string): Promise<string | null> => {
  try {
    const result = await advancedProductOCR(imageDataUrl);
    return result.brandName || null;
  } catch {
    return null;
  }
};

/**
 * Extract ONLY product name — delegates to server-side function
 */
export const extractProductName = async (imageDataUrl: string): Promise<string | null> => {
  try {
    const result = await advancedProductOCR(imageDataUrl);
    return result.productName || null;
  } catch {
    return null;
  }
};

/**
 * Extract certifications — returns empty since server function focuses on product ID
 */
export const extractCertifications = async (_imageDataUrl: string): Promise<string[]> => {
  return [];
};

/**
 * Check API connection health via server-side function
 */
export const checkOpenAIHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch('/.netlify/functions/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: '' }),
    });
    // A 400 (missing image) means the function is running and the API key is configured
    // A 500 means the API key is missing
    return response.status === 400;
  } catch {
    return false;
  }
};

/**
 * Get OCR statistics and performance metrics
 */
export const getOCRStats = (): {
  apiConfigured: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
} => {
  return {
    apiConfigured: true, // Server-side configuration
    model: 'gpt-4o-mini',
    temperature: 0,
    maxTokens: 150,
  };
};
