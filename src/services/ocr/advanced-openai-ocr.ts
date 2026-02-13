import OpenAI from 'openai';

// Initialize OpenAI client with new API key
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  console.error('❌ OpenAI API key not configured. Set VITE_OPENAI_API_KEY in .env.local');
}

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
 * Advanced OCR with GPT-4 Vision
 * Optimized for product recognition with structured output
 */
export const advancedProductOCR = async (imageDataUrl: string): Promise<AdvancedOCRResult> => {
  const startTime = performance.now();

  if (!client) {
    return {
      success: false,
      fullText: '',
      confidence: 0,
      rawExtraction: '',
      error: 'OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in .env.local'
    };
  }

  try {
    // Convert data URL to base64 if needed
    let base64Image = imageDataUrl;
    if (imageDataUrl.includes(',')) {
      base64Image = imageDataUrl.split(',')[1];
    }

    console.log('🔍 Starting advanced OCR with GPT-4 Vision...');

    // Call OpenAI GPT-4 Vision API with optimized parameters
    const response = await client.messages.create({
      model: 'gpt-4-vision-preview',
      max_tokens: 2048, // Increased for detailed extraction
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: PRODUCT_OCR_SYSTEM_PROMPT,
            },
          ],
        },
      ],
      temperature: 0.3, // Low temperature for consistent, precise output
    });

    const rawResponse = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n');

    console.log('📄 Raw OCR Response:', rawResponse);

    // Parse JSON response
    let extractedData;
    try {
      // Find JSON in response (in case there's extra text)
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError);
      // Fallback: treat entire response as text
      extractedData = {
        productName: null,
        brandName: null,
        ingredients: [],
        barcode: null,
        certifications: [],
        nutritionInfo: null,
        fullText: rawResponse,
        confidence: 0.5,
      };
    }

    const processingTime = performance.now() - startTime;

    console.log('✅ Advanced OCR completed successfully');
    console.log('📊 Extracted Data:', {
      product: extractedData.productName,
      brand: extractedData.brandName,
      certifications: extractedData.certifications,
      confidence: extractedData.confidence,
      time: `${processingTime.toFixed(2)}ms`,
    });

    return {
      success: true,
      fullText: extractedData.fullText || rawResponse,
      productName: extractedData.productName,
      brandName: extractedData.brandName,
      ingredients: extractedData.ingredients || [],
      barcode: extractedData.barcode,
      certifications: extractedData.certifications || [],
      nutritionInfo: extractedData.nutritionInfo,
      confidence: extractedData.confidence || 0.85,
      rawExtraction: rawResponse,
      processingTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Advanced OCR Error:', error);

    return {
      success: false,
      fullText: '',
      confidence: 0,
      rawExtraction: '',
      error: `Advanced OCR failed: ${errorMessage}`,
      processingTime: performance.now() - startTime,
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

    const response = await client.messages.create({
      model: 'gpt-4-vision-preview',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image,
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

    const brandName = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text.trim() : ''))
      .join('')
      .replace(/["']/g, '');

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

    const response = await client.messages.create({
      model: 'gpt-4-vision-preview',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image,
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

    const productName = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text.trim() : ''))
      .join('')
      .replace(/["']/g, '');

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

    const response = await client.messages.create({
      model: 'gpt-4-vision-preview',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image,
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

    const response_text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('');

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
    const response = await client.messages.create({
      model: 'gpt-4-vision-preview',
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: 'Say "OK"',
        },
      ],
    });

    const isHealthy = response.content.length > 0;
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
    model: 'gpt-4-vision-preview',
    temperature: 0.3,
    maxTokens: 2048,
  };
};
