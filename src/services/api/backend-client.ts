/**
 * Backend API Client
 * Handles all communication with the backend server
 * Keeps API keys secure by using server-side proxying
 */

import { getBackendUrl } from '@/config/backend';

const BACKEND_URL = getBackendUrl();

interface ImageAnalysisResponse {
  success: boolean;
  content: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ChatResponse {
  success: boolean;
  content: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Analyzes product image using a registered server-side task.
 * Valid tasks: extract-text, extract-barcode,
 *   extract-brand, extract-product-name, extract-certifications, scan-product
 */
export const analyzeProductImage = async (
  imageBase64: string,
  task: string
): Promise<ImageAnalysisResponse> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/openai/analyze-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, task }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Image analysis error:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to analyze image');
  }
};

/**
 * Sends a task-based chat message via the backend.
 * Valid tasks: clean-product-name
 */
export const sendChatMessage = async (
  task: string,
  userMessage: string
): Promise<ChatResponse> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/openai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, userMessage }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Chat error:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to send chat message');
  }
};

/**
 * Fetches a professional white-background catalog photo of a product from the
 * backend's image-search proxy (SerpAPI / Google Images). Used on the verdict
 * screen in place of the Open Food Facts cover. Returns null on any failure or
 * when image search isn't configured — callers should fall back to the OFF image.
 */
export const fetchProductImage = async (params: {
  brand?: string | null;
  name?: string | null;
  barcode?: string | null;
}): Promise<string | null> => {
  try {
    const qs = new URLSearchParams();
    if (params.brand) qs.set('brand', params.brand);
    if (params.name) qs.set('name', params.name);
    if (params.barcode) qs.set('barcode', params.barcode);
    if (!qs.has('brand') && !qs.has('name')) return null;

    const response = await fetch(`${BACKEND_URL}/api/product-image?${qs}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.success && typeof data.imageUrl === 'string' ? data.imageUrl : null;
  } catch (error) {
    console.warn('Product image lookup failed:', error);
    return null;
  }
};

/**
 * Checks backend health status
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.warn('Backend health check failed:', error);
    return false;
  }
};

export default {
  analyzeProductImage,
  sendChatMessage,
  fetchProductImage,
  checkBackendHealth,
};
