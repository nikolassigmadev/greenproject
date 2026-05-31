import { getBackendUrl } from '@/config/backend';

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
 * Downscale image to max 512px on longest side and re-encode as JPEG 0.6
 */
const compressImage = (dataUrl: string, maxSize = 256): Promise<string> =>
  new Promise((resolve) => {
    const fallback = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    const timer = setTimeout(() => resolve(fallback), 5000);
    const img = new Image();
    img.onload = () => {
      clearTimeout(timer);
      const scale = Math.min(maxSize / Math.max(img.width, img.height), 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d')!.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', 0.4).split(',')[1]);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(fallback);
    };
    img.src = dataUrl.startsWith('data:') ? dataUrl : `data:image/jpeg;base64,${dataUrl}`;
  });

/**
 * Simple ChatGPT-style product analysis
 */
export const advancedProductOCR = async (imageDataUrl: string): Promise<AdvancedOCRResult> => {
  const startTime = performance.now();

  try {
    const base64Image = await compressImage(imageDataUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const proxyResponse = await fetch(`${getBackendUrl()}/api/openai/analyze-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64Image, task: 'scan-product' }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!proxyResponse.ok) {
      const errData = await proxyResponse.json().catch(() => ({ error: `HTTP ${proxyResponse.status}` }));
      throw new Error(errData.error || `Backend error: ${proxyResponse.status}`);
    }

    const data = await proxyResponse.json();
    const rawResponse = data.content || '';

    const productMatch = rawResponse.match(/Product:\s*(.+)/i);
    const brandMatch = rawResponse.match(/Brand:\s*(.+)/i);
    const barcodeMatch = rawResponse.match(/Barcode:\s*(.+)/i);

    const productName = productMatch ? productMatch[1].trim() : null;
    const brandName = brandMatch ? brandMatch[1].trim() : null;
    const extractedBarcode = barcodeMatch ? barcodeMatch[1].trim() : null;
    const barcode = extractedBarcode && extractedBarcode.toLowerCase() !== 'none' && /^\d{8,14}$/.test(extractedBarcode.replace(/\s/g, ''))
      ? extractedBarcode.replace(/\s/g, '')
      : null;

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    if (productName || brandName) {
      const fullText = `${brandName || ''} ${productName || ''}`.trim();

      return {
        success: true,
        fullText,
        confidence: 0.9,
        rawExtraction: rawResponse,
        processingTime,
        productName,
        brandName,
        certifications: [],
        ingredients: [],
        barcode: barcode,
        nutritionInfo: null,
        notes: 'ChatGPT-style image analysis'
      };
    } else {
      return {
        success: false,
        fullText: '',
        confidence: 0,
        rawExtraction: rawResponse,
        error: 'Could not identify product from image',
        processingTime
      };
    }

  } catch (error) {
    const endTime = performance.now();
    const processingTime = endTime - startTime;

    return {
      success: false,
      fullText: '',
      confidence: 0,
      rawExtraction: '',
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime
    };
  }
};

/**
 * Extract ONLY brand name (optimized endpoint)
 */
export const extractBrandName = async (imageDataUrl: string): Promise<string | null> => {
  try {
    let base64Image = imageDataUrl;
    if (imageDataUrl.includes(',')) {
      base64Image = imageDataUrl.split(',')[1];
    }

    const response = await fetch(`${getBackendUrl()}/api/openai/analyze-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64Image, task: 'extract-brand' }),
    });

    if (!response.ok) throw new Error(`Backend error: ${response.status}`);
    const data = await response.json();
    const brandName = (data.content || '').trim().replace(/["']/g, '');
    return brandName && brandName !== 'UNKNOWN' ? brandName : null;
  } catch (error) {
    console.error('Failed to extract brand name:', error);
    return null;
  }
};

/**
 * Extract ONLY product name (optimized endpoint)
 */
export const extractProductName = async (imageDataUrl: string): Promise<string | null> => {
  try {
    let base64Image = imageDataUrl;
    if (imageDataUrl.includes(',')) {
      base64Image = imageDataUrl.split(',')[1];
    }

    const response = await fetch(`${getBackendUrl()}/api/openai/analyze-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64Image, task: 'extract-product-name' }),
    });

    if (!response.ok) throw new Error(`Backend error: ${response.status}`);
    const data = await response.json();
    const productName = (data.content || '').trim().replace(/["']/g, '');
    return productName && productName !== 'UNKNOWN' ? productName : null;
  } catch (error) {
    console.error('Failed to extract product name:', error);
    return null;
  }
};

/**
 * Extract certifications/labels (optimized for ethical shopping)
 */
export const extractCertifications = async (imageDataUrl: string): Promise<string[]> => {
  try {
    let base64Image = imageDataUrl;
    if (imageDataUrl.includes(',')) {
      base64Image = imageDataUrl.split(',')[1];
    }

    const response = await fetch(`${getBackendUrl()}/api/openai/analyze-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64Image, task: 'extract-certifications' }),
    });

    if (!response.ok) throw new Error(`Backend error: ${response.status}`);
    const data = await response.json();
    const responseText = data.content || '';

    try {
      const jsonMatch = responseText.match(/\[.*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Return empty array if parsing fails
    }

    return [];
  } catch (error) {
    console.error('Failed to extract certifications:', error);
    return [];
  }
};

/**
 * Check API connection and health
 */
export const checkOpenAIHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${getBackendUrl()}/api/health`);
    const data = await response.json();
    return data.status === 'ok' && data.openaiConfigured;
  } catch (error) {
    console.error('Backend health check failed:', error);
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
    apiConfigured: true,
    model: 'gpt-4o',
    temperature: 0.3,
    maxTokens: 2048,
  };
};
