/**
 * Backend API Client
 * Handles all communication with the backend server
 * Keeps API keys secure by using server-side proxying
 */

const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:3001';

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
 * Analyzes product image and extracts product information
 */
export const analyzeProductImage = async (
  imageBase64: string,
  prompt: string
): Promise<ImageAnalysisResponse> => {
  try {
    console.log(`📤 Sending image analysis request to backend...`);
    
    const response = await fetch(`${BACKEND_URL}/api/openai/analyze-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        prompt,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ Backend error (${response.status}):`, error.error);
      throw new Error(error.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Image analysis successful`);
    return data;
  } catch (error) {
    console.error('❌ Image analysis error:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to analyze image');
  }
};

/**
 * Sends chat messages to OpenAI via backend
 */
export const sendChatMessage = async (
  messages: Array<{ role: string; content: string }>,
  model: string = 'gpt-3.5-turbo',
  temperature: number = 0.7
): Promise<ChatResponse> => {
  try {
    console.log(`📤 Sending chat request to backend...`);
    
    const response = await fetch(`${BACKEND_URL}/api/openai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model,
        temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ Backend error (${response.status}):`, error.error);
      throw new Error(error.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Chat request successful`);
    return data;
  } catch (error) {
    console.error('❌ Chat error:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to send chat message');
  }
};

/**
 * Checks backend health status
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    const data = await response.json();
    console.log('✅ Backend health:', data);
    return data.status === 'ok';
  } catch (error) {
    console.warn('⚠️ Backend health check failed:', error);
    return false;
  }
};

export default {
  analyzeProductImage,
  sendChatMessage,
  checkBackendHealth,
};
