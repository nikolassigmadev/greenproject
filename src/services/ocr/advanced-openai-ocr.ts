import OpenAI from 'openai';

// Initialize OpenAI client
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
if (!apiKey) console.error('OpenAI API key not configured. Set VITE_OPENAI_API_KEY in .env.local');

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

const client = apiKey ? new OpenAI({ apiKey, dangerouslyAllowBrowser: true }) : null;

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

  if (!client) {
    const error = 'OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in .env.local or .env.production';
    console.error('❌', error);
    return {
      success: false,
      fullText: '',
      confidence: 0,
      rawExtraction: '',
      error,
      processingTime: performance.now() - startTime
    };
  }

  try {
    let base64Image = imageDataUrl;
    if (imageDataUrl.includes(',')) {
      base64Image = imageDataUrl.split(',')[1];
    }


    // Downscale image to max 800px before sending — reduces upload size ~4×
    const compressedBase64 = await compressImageBase64(base64Image, 800);

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 150,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${compressedBase64}`,
              },
            },
            {
              type: 'text',
              text: `What product is shown? Reply in exactly this format:
Product: <product name>
Brand: <brand name>
Barcode: <barcode digits, or none>

Only use text visible on the packaging. Do not guess.`,
            },
          ],
        },
      ],
      temperature: 0,
    });

    const rawResponse = response.choices[0]?.message?.content || '';

    // Parse simple response
    const productMatch = rawResponse.match(/Product:\s*(.+)/i);
    const brandMatch = rawResponse.match(/Brand:\s*(.+)/i);
    const barcodeMatch = rawResponse.match(/Barcode:\s*(.+)/i);

    const sanitize = (v: string | null) => {
      if (!v) return null;
      const t = v.trim();
      // Reject placeholder/unknown values the model sometimes returns
      if (/^\[.*\]$|^<.*>$|^unknown|^n\/a$|^none$|^not visible$/i.test(t)) return null;
      if (t.length < 2) return null;
      return t;
    };
    const productName = sanitize(productMatch ? productMatch[1] : null);
    const brandName = sanitize(brandMatch ? brandMatch[1] : null);
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
  if (!client) return null;

  try {
    let base64Image = imageDataUrl;
    if (imageDataUrl.includes(',')) {
      base64Image = imageDataUrl.split(',')[1];
    }

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 100,
      messages: [
        {
          role: 'system',
          content: 'You are a brand name extraction expert. Extract ONLY the brand/manufacturer name from product images.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
            {
              type: 'text',
              text: 'Extract ONLY the brand/manufacturer name from this product image. Return just the brand name, nothing else. If not found, return "UNKNOWN".',
            },
          ],
        },
      ],
      temperature: 0.2,
    });

    const brandName = (response.choices[0]?.message?.content || '').trim().replace(/["']/g, '');

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
  if (!client) return null;

  try {
    let base64Image = imageDataUrl;
    if (imageDataUrl.includes(',')) {
      base64Image = imageDataUrl.split(',')[1];
    }

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 100,
      messages: [
        {
          role: 'system',
          content: 'You are a product name extraction expert. Extract ONLY the product name from product images.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
            {
              type: 'text',
              text: 'Extract ONLY the product name/item name from this product image. Return just the product name, nothing else. If not found, return "UNKNOWN".',
            },
          ],
        },
      ],
      temperature: 0.2,
    });

    const productName = (response.choices[0]?.message?.content || '').trim().replace(/["']/g, '');

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
  if (!client) return [];

  try {
    let base64Image = imageDataUrl;
    if (imageDataUrl.includes(',')) {
      base64Image = imageDataUrl.split(',')[1];
    }

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 200,
      messages: [
        {
          role: 'system',
          content: 'You are an ethical certification detection expert. Identify sustainability and ethical labels on products.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
            {
              type: 'text',
              text: `Look for ethical and sustainability certifications/labels on this product:
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
Return empty array [] if none found.`,
            },
          ],
        },
      ],
      temperature: 0.1, // Very low for consistent categorization
    });

    const response_text = response.choices[0]?.message?.content || '';

    try {
      const jsonMatch = response_text.match(/\[.*\]/s);
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
  if (!client) return false;

  try {
    console.log('🏥 Checking OpenAI API health...');
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: 'Say "OK"',
        },
      ],
    });

    const isHealthy = response.choices[0]?.message?.content?.length > 0;
    console.log(isHealthy ? '✅ OpenAI API is healthy' : '❌ OpenAI API returned empty response');
    return isHealthy;
  } catch (error) {
    console.error('❌ OpenAI API health check failed:', error);
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
    apiConfigured: !!client,
    model: 'gpt-4o-mini',
    temperature: 0.3,
    maxTokens: 2048,
  };
};
