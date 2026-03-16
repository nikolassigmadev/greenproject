import { getBackendUrl } from '@/config/backend';

console.log('🔑 OpenAI OCR: Using backend proxy at', getBackendUrl());

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
 * Optimized system prompt for product recognition
 * Focuses on brand names, product names, ingredients, and certifications
 */
const PRODUCT_OCR_SYSTEM_PROMPT = `You are an expert OCR system specialized in recognizing and extracting product information from images.

Your task is to extract the following information from product images with high precision:

1. **PRODUCT NAME**: The main product/item name (e.g., "Organic Almond Butter", "Fair Trade Coffee")
2. **BRAND NAME**: The manufacturer or brand name (e.g., "Natura", "Nature's Way", "Patagonia")
3. **INGREDIENTS**: List all visible ingredients (especially organic, fair-trade, certifications)
4. **BARCODE/CODE**: Any UPC, EAN, or product codes visible
5. **CERTIFICATIONS**: Look for labels like:
   - Organic (USDA, EU)
   - Fair Trade
   - Non-GMO
   - Vegan/Vegetarian
   - Gluten-Free
   - Rainforest Alliance
   - B-Corp
   - Kosher/Halal
6. **NUTRITION INFO**: Any visible nutritional facts
7. **FULL TEXT**: All readable text on the product

CRITICAL INSTRUCTIONS:
- Be extremely precise with brand and product names
- Extract EXACT text as it appears (preserve capitalization)
- Look for hidden or small text
- Identify quality certifications and labels
- Return ONLY found information (don't invent)
- Use proper JSON formatting

Return your response as JSON with this exact structure:
{
  "productName": "extracted product name or null",
  "brandName": "extracted brand name or null",
  "ingredients": ["ingredient1", "ingredient2", ...],
  "barcode": "barcode number or null",
  "certifications": ["certification1", "certification2", ...],
  "nutritionInfo": "nutrition text or null",
  "fullText": "all extracted text",
  "confidence": 0.95,
  "notes": "any additional observations"
}`;

/**
 * Simple ChatGPT-style product analysis
 */
export const advancedProductOCR = async (imageDataUrl: string): Promise<AdvancedOCRResult> => {
  const startTime = performance.now();

  console.log('🚀 Starting ChatGPT-style OCR analysis via backend proxy...');

  try {
    let base64Image = imageDataUrl;
    if (imageDataUrl.includes(',')) {
      base64Image = imageDataUrl.split(',')[1];
    }

    console.log('📷 Image data processed:', {
      hasBase64: !!base64Image,
      base64Length: base64Image?.length,
    });

    console.log('🤖 Calling OpenAI API via backend proxy...');

    const prompt = `Look at this image and tell me what product this is. Give me the information in this exact format:

Product: [Product Name]
Brand: [Brand Name]
Barcode: [barcode number if visible, otherwise "none"]

If you can't identify the product clearly, say "Unknown Product" and "Unknown Brand".
Look carefully for any barcode numbers (UPC, EAN) printed on the packaging.`;

    const proxyResponse = await fetch(`${getBackendUrl()}/api/openai/analyze-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64Image, prompt }),
    });

    if (!proxyResponse.ok) {
      const errData = await proxyResponse.json().catch(() => ({ error: `HTTP ${proxyResponse.status}` }));
      throw new Error(errData.error || `Backend error: ${proxyResponse.status}`);
    }

    const data = await proxyResponse.json();

    console.log('✅ OpenAI API response received via backend proxy');

    const rawResponse = data.content || '';
    console.log('🤖 ChatGPT Response:', rawResponse);

    // Parse simple response
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
      console.log('✅ ChatGPT-style analysis successful:', { productName, brandName, fullText, processingTime });

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
      console.log('❌ Could not identify product from response:', rawResponse);
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
    console.error('❌ ChatGPT-style analysis failed:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      isProduction: import.meta.env.PROD,
      apiKeyConfigured: !!import.meta.env.VITE_OPENAI_API_KEY
    });
    
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
      body: JSON.stringify({
        imageBase64: base64Image,
        prompt: 'Extract ONLY the brand/manufacturer name from this product image. Return just the brand name, nothing else. If not found, return "UNKNOWN".',
      }),
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
      body: JSON.stringify({
        imageBase64: base64Image,
        prompt: 'Extract ONLY the product name/item name from this product image. Return just the product name, nothing else. If not found, return "UNKNOWN".',
      }),
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

    const prompt = `Look for ethical and sustainability certifications/labels on this product:
- Organic (USDA, EU, etc.)
- Fair Trade
- Rainforest Alliance
- B-Corp
- Non-GMO
- Vegan/Vegetarian
- Cruelty-Free
- Carbon Neutral
- Gluten-Free
- Local/Regional

Return a JSON array of found certifications. Example: ["Organic", "Fair Trade"]
Return empty array [] if none found.`;

    const response = await fetch(`${getBackendUrl()}/api/openai/analyze-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64Image, prompt }),
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
    console.log('🏥 Checking backend health...');
    const response = await fetch(`${getBackendUrl()}/api/health`);
    const data = await response.json();
    const isHealthy = data.status === 'ok' && data.openaiConfigured;
    console.log(isHealthy ? '✅ Backend + OpenAI is healthy' : '❌ Backend health check failed');
    return isHealthy;
  } catch (error) {
    console.error('❌ Backend health check failed:', error);
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
    apiConfigured: true, // Configured on backend
    model: 'gpt-4o',
    temperature: 0.3,
    maxTokens: 2048,
  };
};
