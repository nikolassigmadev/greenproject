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
import dns from 'dns';

// Fix Node.js IPv6 timeout issue — OpenFoodFacts IPv6 is unreliable
dns.setDefaultResultOrder('ipv4first');

// Load environment variables (check .env.local first, then .env)
dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

// ── CORS — explicit preflight handler must come first so nginx doesn't swallow OPTIONS ──
const ALLOWED_ORIGINS = [
  /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/,
  /capacitor:\/\/localhost/,
  /darkviolet-whale-491214\.hostingersite\.com/,
  /lightgray-sheep-324503\.hostingersite\.com/,
  /\.hostingersite\.com$/,
];

function isAllowedOrigin(origin) {
  if (!origin) return true;
  return ALLOWED_ORIGINS.some((re) => re.test(origin));
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  // Respond to preflight immediately — don't let it fall through to route handlers
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

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
        model: 'gpt-4o',
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
 * GET /api/openfoodfacts/product/:barcode
 * Lookup a product by barcode on OpenFoodFacts (proxy to avoid CORS/timeout)
 */
app.get('/api/openfoodfacts/product/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    if (!barcode) {
      return res.status(400).json({ status: 0, status_verbose: 'Missing barcode' });
    }

    console.log(`🔄 Looking up barcode: ${barcode}`);

    const fields = 'code,product_name,product_name_en,brands,ecoscore_grade,ecoscore_score,ecoscore_data,nutriscore_grade,nutriscore_score,nova_group,nutriments,labels_tags,labels,categories_tags,categories,origins,ingredients_text,ingredients_text_en,image_front_url,image_url,countries_tags,carbon_footprint_percent_of_known_ingredients';

    // Try v2 first, then v0
    const endpoints = [
      `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=${fields}`,
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json?fields=${fields}`,
    ];

    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(18000),
          headers: { 'User-Agent': 'Scan2Source/1.0 (ethical-shopper)' },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.status === 1 && data.product) {
            console.log(`✅ Product found: ${data.product.product_name || data.product.product_name_en}`);
            return res.json(data);
          }
        }
      } catch (e) {
        console.warn(`   ${url.includes('v2') ? 'v2' : 'v0'} failed: ${e.message}`);
      }
    }

    res.json({ status: 0, status_verbose: 'product not found', code: barcode });
  } catch (error) {
    console.error('❌ Barcode lookup error:', error);
    res.status(500).json({ status: 0, status_verbose: error.message });
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

    const fields = [
      'code', 'product_name', 'product_name_en', 'brands',
      'ecoscore_grade', 'ecoscore_score', 'ecoscore_data',
      'nutriscore_grade', 'nutriscore_score', 'nova_group',
      'nutriments', 'labels_tags', 'labels', 'categories_tags', 'categories',
      'origins', 'ingredients_text', 'ingredients_text_en',
      'image_front_url', 'image_url', 'countries_tags',
    ].join(',');

    const pageSize = String(Math.min(limit, 50));

    // Search strategy waterfall: brand tag → first-word brand → v2 text → legacy text search
    let data = null;
    const searchTimeout = 25000;
    const headers = { 'User-Agent': 'Scan2Source/1.0 (ethical-shopper)' };
    // Slugify for tag lookups: "Coca-Cola" → "coca-cola", "Lipton Ice Tea" → "lipton-ice-tea"
    const searchQuery = query.trim().toLowerCase().replace(/[\s]+/g, '-');
    const queryLower = query.trim().toLowerCase();
    const queryWords = queryLower.split(/[\s-]+/).filter(w => w.length > 1);

    const sortByRelevance = (products, words, fullQuery) => {
      return products.sort((a, b) => {
        const nameA = (a.product_name || a.product_name_en || '').toLowerCase();
        const nameB = (b.product_name || b.product_name_en || '').toLowerCase();
        const aExact = nameA.includes(fullQuery);
        const bExact = nameB.includes(fullQuery);
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        const aScore = words.filter(w => nameA.includes(w)).length;
        const bScore = words.filter(w => nameB.includes(w)).length;
        return bScore - aScore;
      });
    };

    // Strategy 1: v2 brand tag search — correct field is `brands_tags`, not `brands_tags_en`
    try {
      const brandParams = new URLSearchParams({
        brands_tags: searchQuery,
        fields,
        page_size: String(Math.min(limit * 3, 100)),
      });
      console.log(`   [1] v2 brand tag search: brands_tags="${searchQuery}"`);
      const brandResponse = await fetch(`https://world.openfoodfacts.org/api/v2/search?${brandParams}`, {
        signal: AbortSignal.timeout(searchTimeout),
        headers,
      });
      if (brandResponse.ok) {
        const brandData = await brandResponse.json();
        if (brandData.products?.length > 0) {
          sortByRelevance(brandData.products, queryWords, queryLower);
          data = brandData;
          console.log(`   ✅ [1] Brand tag search returned ${data.products.length} products`);
        }
      }
    } catch (e) {
      console.warn(`   ⚠️ [1] Brand tag search failed: ${e.message}`);
    }

    // Strategy 2: first-word brand tag (e.g. "Lipton" from "Lipton Lemon Ice Tea")
    if (!data?.products?.length) {
      const firstWord = queryWords[0];
      if (firstWord && firstWord !== searchQuery) {
        try {
          const firstWordParams = new URLSearchParams({
            brands_tags: firstWord,
            fields,
            page_size: String(Math.min(limit * 3, 100)),
          });
          console.log(`   [2] First-word brand tag search: brands_tags="${firstWord}"`);
          const fwResponse = await fetch(`https://world.openfoodfacts.org/api/v2/search?${firstWordParams}`, {
            signal: AbortSignal.timeout(searchTimeout),
            headers,
          });
          if (fwResponse.ok) {
            const fwData = await fwResponse.json();
            if (fwData.products?.length > 0) {
              sortByRelevance(fwData.products, queryWords.slice(1), queryLower);
              data = fwData;
              console.log(`   ✅ [2] First-word brand search returned ${data.products.length} products`);
            }
          }
        } catch (e) {
          console.warn(`   ⚠️ [2] First-word brand search failed: ${e.message}`);
        }
      }
    }

    // Strategy 3: v2 API full-text search via `q` param (supports product name + brand)
    if (!data?.products?.length) {
      try {
        const v2TextParams = new URLSearchParams({
          q: query.trim(),
          fields,
          page_size: String(Math.min(limit * 2, 50)),
          sort_by: 'unique_scans_n',
        });
        console.log(`   [3] v2 full-text search: q="${query.trim()}"`);
        const v2TextResponse = await fetch(`https://world.openfoodfacts.org/api/v2/search?${v2TextParams}`, {
          signal: AbortSignal.timeout(searchTimeout),
          headers,
        });
        if (v2TextResponse.ok) {
          const v2TextData = await v2TextResponse.json();
          if (v2TextData.products?.length > 0) {
            sortByRelevance(v2TextData.products, queryWords, queryLower);
            data = v2TextData;
            console.log(`   ✅ [3] v2 text search returned ${data.products.length} products`);
          }
        }
      } catch (e) {
        console.warn(`   ⚠️ [3] v2 text search failed: ${e.message}`);
      }
    }

    // Strategy 4: legacy cgi/search.pl — requires action=process for JSON response
    if (!data?.products?.length) {
      try {
        const textParams = new URLSearchParams({
          search_terms: query.trim(),
          action: 'process',   // ← required — without this, returns HTML not JSON
          json: '1',
          fields,
          page_size: pageSize,
          sort_by: 'unique_scans_n',
        });
        console.log(`   [4] Legacy full-text search: search_terms="${query.trim()}"`);
        const textResponse = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${textParams}`, {
          signal: AbortSignal.timeout(searchTimeout),
          headers,
        });
        if (textResponse.ok) {
          const textData = await textResponse.json();
          if (textData.products?.length > 0) {
            data = textData;
            console.log(`   ✅ [4] Legacy text search returned ${data.products.length} products`);
          }
        }
      } catch (e) {
        console.warn(`   ⚠️ [4] Legacy text search failed: ${e.message}`);
      }
    }

    if (!data || !data.products) {
      data = { products: [], count: 0 };
    }

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

app.listen(PORT, '0.0.0.0', () => {
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
