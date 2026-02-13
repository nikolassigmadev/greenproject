import OpenAI from 'openai';

// Initialize OpenAI client
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  console.warn('OpenAI API key not configured. Set VITE_OPENAI_API_KEY in .env.local');
}

const client = apiKey ? new OpenAI({ apiKey, dangerouslyAllowBrowser: true }) : null;

export type OcrResult = {
  text: string;
  confidence: number;
  success: boolean;
  error?: string;
};

/**
 * Extract text from image using OpenAI Vision API (GPT-4o)
 * @param imageDataUrl - Base64 encoded image data URL
 * @returns Extracted text and confidence score
 */
export const recognizeImageWithOpenAI = async (imageDataUrl: string): Promise<OcrResult> => {
  if (!client) {
    return {
      text: '',
      confidence: 0,
      success: false,
      error: 'OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in .env.local'
    };
  }

  try {
    // Convert data URL to base64 if needed
    let base64Image = imageDataUrl;
    if (imageDataUrl.includes(',')) {
      base64Image = imageDataUrl.split(',')[1];
    }

    // Call OpenAI Vision API
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: 'You are an OCR expert. Extract all visible text from product images with high accuracy.',
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
              text: 'Extract all visible text from this image. Focus on product names, brands, ingredients, and labels. Return ONLY the extracted text, no explanations.',
            },
          ],
        },
      ],
    });

    const extractedText = response.choices[0]?.message?.content || '';

    return {
      text: extractedText,
      confidence: 90, // GPT-4o is very accurate
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
 * Use OpenAI Vision API for product code/barcode extraction
 */
export const extractProductCode = async (imageDataUrl: string): Promise<string> => {
  if (!client) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    let base64Image = imageDataUrl;
    if (imageDataUrl.includes(',')) {
      base64Image = imageDataUrl.split(',')[1];
    }

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 256,
      messages: [
        {
          role: 'system',
          content: 'You are a barcode and product code extraction expert.',
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
              text: 'Extract the barcode number or product code from this image. Return ONLY the numeric code, nothing else.',
            },
          ],
        },
      ],
    });

    const code = (response.choices[0]?.message?.content || '').trim();

    return code;
  } catch (error) {
    console.error('Failed to extract product code:', error);
    throw error;
  }
};

/**
 * Health check - verify API connection
 */
export const checkOpenAIConnection = async (): Promise<boolean> => {
  if (!client) {
    return false;
  }

  try {
    // Make a simple API call to verify connection
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: 'Say "OK"',
        },
      ],
    });

    return response.choices[0]?.message?.content?.length > 0;
  } catch (error) {
    console.error('OpenAI connection check failed:', error);
    return false;
  }
};
