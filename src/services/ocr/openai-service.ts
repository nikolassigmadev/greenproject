export type OcrResult = {
  text: string;
  confidence: number;
  success: boolean;
  error?: string;
};

/**
 * Extract text from image using server-side OCR Netlify Function
 * The function proxies the request to OpenAI so the API key stays secret.
 */
export const recognizeImageWithOpenAI = async (imageDataUrl: string): Promise<OcrResult> => {
  try {
    let base64Image = imageDataUrl;
    if (imageDataUrl.includes(',')) {
      base64Image = imageDataUrl.split(',')[1];
    }

    const response = await fetch('/.netlify/functions/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        text: '',
        confidence: 0,
        success: false,
        error: errorData.error || `OCR service error: ${response.status}`,
      };
    }

    const data = await response.json();

    if (data.success) {
      const text = [data.brandName, data.productName].filter(Boolean).join(' ');
      return {
        text: text || data.rawText || '',
        confidence: 90,
        success: true,
      };
    }

    return {
      text: data.rawText || '',
      confidence: 0,
      success: false,
      error: 'Could not identify product from image',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('OCR service error:', error);

    return {
      text: '',
      confidence: 0,
      success: false,
      error: `Failed to process image: ${errorMessage}`,
    };
  }
};

/**
 * Use server-side OCR for product code/barcode extraction
 */
export const extractProductCode = async (imageDataUrl: string): Promise<string> => {
  try {
    let base64Image = imageDataUrl;
    if (imageDataUrl.includes(',')) {
      base64Image = imageDataUrl.split(',')[1];
    }

    const response = await fetch('/.netlify/functions/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!response.ok) {
      throw new Error(`OCR service error: ${response.status}`);
    }

    const data = await response.json();
    return data.barcode || '';
  } catch (error) {
    console.error('Failed to extract product code:', error);
    throw error;
  }
};

/**
 * Health check - verify server-side OCR function is available
 */
export const checkOpenAIConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch('/.netlify/functions/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: '' }),
    });
    // 400 = function works (just missing image), 500 = API key not set
    return response.status === 400;
  } catch {
    return false;
  }
};
