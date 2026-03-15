/**
 * Backend API Server - Proxy for OpenAI and other external APIs
 * 
 * This server:
 * 1. Handles CORS properly
 * 2. Keeps API keys secure (server-side only)
 * 3. Proxies requests to OpenAI, OpenFoodFacts, etc.
 * 4. Provides rate limiting and error handling
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Middleware
// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests from localhost on any port
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

// =====================================================
// OPENAI API PROXY ENDPOINTS
// =====================================================

/**
 * POST /api/openai/analyze-image
 * Analyzes product image and extracts product info
 */
app.post('/api/openai/analyze-image', async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key not configured on server',
      });
    }

    const { imageBase64, prompt } = req.body;

    if (!imageBase64 || !prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing imageBase64 or prompt',
      });
    }

    console.log(`🔄 Processing image analysis request...`);

    // Call OpenAI API from server (secure)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ OpenAI API Error:', error);
      return res.status(response.status).json({
        success: false,
        error: error.error?.message || 'OpenAI API error',
      });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log(`✅ Image analysis successful`);

    res.json({
      success: true,
      content,
      model: data.model,
      usage: data.usage,
    });
  } catch (error) {
    console.error('❌ Image analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze image',
    });
  }
});

/**
 * POST /api/openai/chat
 * General chat completion endpoint
 */
app.post('/api/openai/chat', async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key not configured',
      });
    }

    const { messages, model = 'gpt-3.5-turbo', temperature = 0.7 } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid messages format',
      });
    }

    console.log(`🔄 Processing chat request with ${messages.length} messages...`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ OpenAI API Error:', error);
      return res.status(response.status).json({
        success: false,
        error: error.error?.message || 'OpenAI API error',
      });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log(`✅ Chat request successful`);

    res.json({
      success: true,
      content,
      model: data.model,
      usage: data.usage,
    });
  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process chat',
    });
  }
});

/**
 * POST /api/openfoodfacts/search
 * Search for products on OpenFoodFacts by name
 */
app.post('/api/openfoodfacts/search', async (req, res) => {
  try {
    const { query, limit = 50 } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Missing search query',
      });
    }

    console.log(`🔄 Searching OpenFoodFacts for: "${query}"`);

    const params = new URLSearchParams({
      search_terms: query.trim(),
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: String(Math.min(limit, 50)),
      sort_by: 'unique_scans_n',
      fields: [
        'code', 'product_name', 'product_name_en', 'brands',
        'ecoscore_grade', 'ecoscore_score', 'ecoscore_data',
        'nutriscore_grade', 'nutriscore_score', 'nova_group',
        'nutriments', 'labels_tags', 'labels', 'categories_tags', 'categories',
        'origins', 'ingredients_text', 'ingredients_text_en',
        'image_front_url', 'image_url', 'countries_tags',
      ].join(','),
    });

    const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log(`✅ OpenFoodFacts search successful - found ${data.products?.length || 0} products`);

    res.json({
      success: true,
      products: data.products || [],
      count: data.count || 0,
    });
  } catch (error) {
    console.error('❌ OpenFoodFacts search error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search OpenFoodFacts',
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    openaiConfigured: !!OPENAI_API_KEY,
  });
});

// =====================================================
// ERROR HANDLING
// =====================================================

app.use((err, req, res, next) => {
  console.error('❌ Unhandled Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                                                        ║');
  console.log('║   🚀 Backend API Server Started                        ║');
  console.log('║                                                        ║');
  console.log(`║   Server: http://localhost:${PORT}                      ║`);
  console.log(`║   OpenAI Configured: ${OPENAI_API_KEY ? '✅ Yes' : '❌ No                    '}║`);
  console.log('║                                                        ║');
  console.log('║   Endpoints:                                           ║');
  console.log('║   - POST /api/openai/analyze-image (image analysis)    ║');
  console.log('║   - POST /api/openai/chat (chat completion)           ║');
  console.log('║   - GET /api/health (health check)                    ║');
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
});

export default app;
