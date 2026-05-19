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
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import dns from 'dns';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

console.log('🟡 server.js: imports loaded');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Fix Node.js IPv6 timeout issue — OpenFoodFacts IPv6 is unreliable
try { dns.setDefaultResultOrder('ipv4first'); } catch(e) { console.warn('dns.setDefaultResultOrder not supported:', e.message); }

// Load environment variables (check .env.local first, then .env)
dotenv.config({ path: '.env.local' });
dotenv.config();

console.log('🟡 server.js: dotenv loaded, PORT=', process.env.PORT);

const app = express();
const PORT = process.env.PORT || 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

// ── CORS — explicit preflight handler must come first so nginx doesn't swallow OPTIONS ──
const ALLOWED_ORIGINS = [
  /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/,
  /capacitor:\/\/localhost/,
  /goodscan\.shop$/,
  /hostingersite\.com$/,
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

// ── Rate limiting ────────────────────────────────────────────────────────────
const openaiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests — try again in a minute' },
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many search requests — slow down' },
});

app.use('/api/openai', openaiLimiter);
app.use('/api/chat', openaiLimiter);
app.use('/api/openfoodfacts', searchLimiter);

// =====================================================
// ABOUT-US CHATBOT
// =====================================================

const openaiClient = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

const ABOUT_US_KNOWLEDGE = `
APP NAME: GoodScan (also referred to as Scan2Source).

MISSION:
Make ethical shopping simple. Scan a product and instantly understand its impact across labour rights, environmental impact, animal welfare, and nutrition. We aggregate data so consumers can shop with confidence.

CORE PILLARS:
- Labour Rights
- Environment
- Animal Welfare
- Transparency

DATA SOURCES:
- Nutritional and environmental product data: Open Food Facts (openfoodfacts.org), CC BY-SA 4.0 license.
- Labour and sourcing flags: researched and reviewed in-house against published reports and certifications.

CONTACT:
- Email: geovanis@proton.me
- Privacy Policy: /privacy
- Methodology page: /methodology

METHODOLOGY — SEVERITY LEVELS:
- Critical: Documented forced labour, child labour, or modern slavery confirmed by a government body, court ruling, or corporate admission. Examples: CBP Withhold Release Order, US federal court verdict, DOL child labour investigation.
- High: Serious findings with credible NGO/investigative evidence, not yet confirmed by a government authority. Examples: Amnesty International, Human Rights Watch, BBC Dispatches.
- Medium: Ongoing concerns or unresolved supply-chain transparency gaps from campaign scorecards or multi-outlet investigations. Examples: Oxfam Behind the Brands, Green America Chocolate Scorecard.

METHODOLOGY — SOURCE TIERS:
- Tier 1 (Primary official record): court filing, regulatory finding, government report, corporate admission. Examples: US DOL TVPRA list, CBP Withhold Release Order, Supreme Court opinion, OECD NCP complaint.
- Tier 2 (Independent NGO report): NGO report, academic study. Examples: Amnesty International, Human Rights Watch, Oxfam, Greenpeace, BHRRC, Columbia Law School.
- Tier 3 (Investigative journalism): news report, investigation. Examples: BBC, The Guardian, Washington Post, AP, Channel 4, NYT, Reporter Brasil.

METHODOLOGY — THE SOURCING BAR:
A flag is only shown in the app if it meets at least ONE of:
1. 1+ tier-1 source.
2. 2+ independent tier-2 sources (different organisations, same finding).
3. 1 tier-2 source + 2 tier-3 sources covering the same allegation.
Flags with only tier-3 sources are kept in "pending review" and not shown to users.

METHODOLOGY — WHAT WE DON'T DO:
- We don't include flags that fail the sourcing bar.
- We don't describe findings as proven fact when only one tier-3 source exists.
- We don't accept allegations from anonymous or unverifiable sources.
- We don't keep flags that have been proven factually incorrect.
- We don't carry flags indefinitely — documented remediation leads to archival.

DATABASE STATUS:
- ~35 brands currently flagged.
- 14-day SLA for dispute review.
- All sources have URLs cited.

LIMITATIONS:
- ~35 brands. Major multinationals are prioritised; smaller or regional brands may not yet be covered.
- Focus on consumer food and grocery goods. Fashion, electronics, and household goods are out of scope.
- Geographic coverage skews toward supply chains with English-language investigative coverage.
- A brand not in our database does not mean it has no issues — it may not have been researched yet.
- Not legal advice. Flags describe documented findings, not legal verdicts (unless the source is a court ruling).

DISPUTES:
Users can report issues with any flag. Disputes are reviewed within the 14-day SLA. The dispute form is reachable from individual flag pages.
`;

/**
 * POST /api/chat/aboutus
 * Q&A chatbot grounded ONLY in the About Us / Methodology content.
 */
app.post('/api/chat/aboutus', async (req, res) => {
  try {
    if (!openaiClient) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key not configured on server',
      });
    }

    const { message } = req.body || {};
    const userMessage = typeof message === 'string' ? message.trim() : '';

    if (!userMessage) {
      return res.json({ success: true, reply: 'Please enter a question.' });
    }
    if (userMessage.length > 1000) {
      return res.status(400).json({ success: false, error: 'Message too long (1000 char max).' });
    }

    console.log(`🔄 About-us chat: "${userMessage.slice(0, 80)}..."`);

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content: `You are GoodScan's friendly support assistant. Answer ONLY using the information below about the app, its mission, and its methodology. If the answer is not in the information, say: "I don't have that information — try the contact email geovanis@proton.me." Keep replies short, plain-English, and helpful. Do not invent facts, brands, or sources.

INFORMATION:
${ABOUT_US_KNOWLEDGE}`,
        },
        { role: 'user', content: userMessage },
      ],
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "I don't have that information.";
    console.log('✅ About-us chat reply sent');
    res.json({ success: true, reply });
  } catch (error) {
    console.error('❌ About-us chat error:', error);
    res.status(500).json({ success: false, error: error.message || 'Chat failed' });
  }
});

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

    // Call OpenAI API from server (secure) — gpt-4o-mini for speed
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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
                  detail: 'low',
                },
              },
            ],
          },
        ],
        max_tokens: 300,
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

    // Common brand aliases / nicknames → canonical OFF brand slug
    const BRAND_ALIASES = {
      'coke': 'coca-cola',
      'pepsi': 'pepsi',
      'sprite': 'coca-cola',  // Sprite is a Coca-Cola brand
      'fanta': 'coca-cola',
      'diet-coke': 'coca-cola',
      'coke-zero': 'coca-cola',
    };

    // Slugify for tag lookups: "Coca-Cola" → "coca-cola", "Lipton Ice Tea" → "lipton-ice-tea"
    const rawSlug = query.trim().toLowerCase().replace(/[\s]+/g, '-');
    const searchQuery = BRAND_ALIASES[rawSlug] || rawSlug;
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

    // Strategy 5: v2 product_name_tags search — catches nicknames missed by brand_tags
    // e.g. "Coke" appears in product_name_tags as "coke" even if brand is "coca-cola"
    if (!data?.products?.length) {
      try {
        const nameTagParams = new URLSearchParams({
          product_name_tags: rawSlug,
          fields,
          page_size: String(Math.min(limit * 2, 50)),
          sort_by: 'unique_scans_n',
        });
        console.log(`   [5] product_name_tags search: "${rawSlug}"`);
        const nameTagResponse = await fetch(`https://world.openfoodfacts.org/api/v2/search?${nameTagParams}`, {
          signal: AbortSignal.timeout(searchTimeout),
          headers,
        });
        if (nameTagResponse.ok) {
          const nameTagData = await nameTagResponse.json();
          if (nameTagData.products?.length > 0) {
            sortByRelevance(nameTagData.products, queryWords, queryLower);
            data = nameTagData;
            console.log(`   ✅ [5] product_name_tags search returned ${data.products.length} products`);
          }
        }
      } catch (e) {
        console.warn(`   ⚠️ [5] product_name_tags search failed: ${e.message}`);
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
// SERVE FRONTEND (React SPA)
// =====================================================

const distPath = join(__dirname, 'dist');

if (existsSync(distPath)) {
  app.use(express.static(distPath));
  // All non-API routes → serve index.html (client-side routing)
  app.get('/{*splat}', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

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
  console.log(`✅ Server listening on port ${PORT}`);
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
  console.log('║   - POST /api/chat/aboutus (about-us Q&A)             ║');
  console.log('║   - GET /api/health (health check)                    ║');
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
});

export default app;
