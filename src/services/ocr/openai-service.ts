import { getBackendUrl } from '@/config/backend';

export type OcrResult = {
  text: string;
  confidence: number;
  success: boolean;
  error?: string;
};

/**
 * Extract text from image using OpenAI Vision API (GPT-4o) via backend proxy
 * @param imageDataUrl - Base64 encoded image data URL
 * @returns Extracted text and confidence score
 */
export const recognizeImageWithOpenAI = async (imageDataUrl: string): Promise<OcrResult> => {
  try {
    let base64Image = imageDataUrl;
    if (imageDataUrl.includes(',')) {
      base64Image = imageDataUrl.split(',')[1];
    }

    const prompt = 'Extract all visible text from this image. Focus on product names, brands, ingredients, and labels. Return ONLY the extracted text, no explanations.';

    const response = await fetch(`${getBackendUrl()}/api/openai/analyze-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64Image, prompt }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(errData.error || `Backend error: ${response.status}`);
    }

    const data = await response.json();
    const extractedText = data.content || '';

    return {
      text: extractedText,
      confidence: 90,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('OpenAI API error:', error);

    return {
      text: '',
      confidence: 0,
      success: false,
      error: `Failed to process image: ${errorMessage}`,
    };
  }
};

/**
 * Use OpenAI Vision API for product code/barcode extraction via backend proxy
 */
export const extractProductCode = async (imageDataUrl: string): Promise<string> => {
  try {
    let base64Image = imageDataUrl;
    if (imageDataUrl.includes(',')) {
      base64Image = imageDataUrl.split(',')[1];
    }

    const prompt = 'Extract the barcode number or product code from this image. Return ONLY the numeric code, nothing else.';

    const response = await fetch(`${getBackendUrl()}/api/openai/analyze-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64Image, prompt }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(errData.error || `Backend error: ${response.status}`);
    }

    const data = await response.json();
    return (data.content || '').trim();
  } catch (error) {
    console.error('Failed to extract product code:', error);
    throw error;
  }
};

/**
 * Extract product names from a receipt image using OpenAI Vision.
 * Returns a clean list of item names — no prices, totals, or store info.
 */
export const extractReceiptProducts = async (file: File): Promise<string[]> => {
  const base64Image = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const prompt =
    'This is a shopping receipt. List only the purchased product/item names, one per line. ' +
    'Exclude: prices, quantities, totals, subtotals, tax, store name, date, cashier, loyalty points, and any other non-product text. ' +
    'Return ONLY the item names, nothing else.';

  const response = await fetch(`${getBackendUrl()}/api/openai/analyze-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64Image, prompt }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(errData.error || `Backend error: ${response.status}`);
  }

  const data = await response.json();
  const text: string = data.content || '';

  return text
    .split('\n')
    .map((l: string) => l.replace(/^[\d\-.*•]+\s*/, '').trim())
    .filter((l: string) => l.length >= 3)
    .slice(0, 15);
};

/**
 * Health check - verify API connection via backend
 */
export const checkOpenAIConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${getBackendUrl()}/api/health`);
    const data = await response.json();
    return data.status === 'ok' && data.openaiConfigured;
  } catch (error) {
    console.error('OpenAI connection check failed:', error);
    return false;
  }
};
