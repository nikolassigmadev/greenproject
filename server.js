/**
 * Backend API Server - Proxy for OpenAI and other external APIs
 *
 * This server:
 * 1. Handles CORS properly
 * 2. Keeps API keys secure (server-side only)
 * 3. Proxies requests to OpenAI, OpenFoodFacts, etc.
 * 4. Provides rate limiting and error handling
 * 5. Server-side admin authentication
 */

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import dns from 'dns';
import crypto from 'crypto';
import OpenAI from 'openai';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

console.log('server.js: imports loaded');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Fix Node.js IPv6 timeout issue
try { dns.setDefaultResultOrder('ipv4first'); } catch(e) { console.warn('dns.setDefaultResultOrder not supported:', e.message); }

// Load environment variables (check .env.local first, then .env)
dotenv.config({ path: '.env.local' });
dotenv.config();

console.log('server.js: dotenv loaded, PORT=', process.env.PORT);

const app = express();
const PORT = process.env.PORT || 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

// In-memory session store (replace with Redis/DB in production)
const adminSessions = new Map();
const SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

function createAdminSession() {
  const token = crypto.randomBytes(32).toString('hex');
  adminSessions.set(token, { createdAt: Date.now() });
  return token;
}

function isValidAdminSession(token) {
  if (!token) return false;
  const session = adminSessions.get(token);
  if (!session) return false;
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    adminSessions.delete(token);
    return false;
  }
  return true;
}

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!isValidAdminSession(token)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
}

// ── CORS ──
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
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,X-Admin-Token');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// ── Body limits: 2MB global, image routes get 10MB via per-route middleware ──
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb' }));

const largeBody = express.json({ limit: '10mb' });

// ── Rate limiting ──
const openaiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests - try again in a minute' },
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many search requests - slow down' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts - try again later' },
});

app.use('/api/openai', openaiLimiter);
app.use('/api/chat', openaiLimiter);
app.use('/api/openfoodfacts', searchLimiter);

// =====================================================
// SERVER-SIDE PROMPT REGISTRY (task-based, no client prompts)
// =====================================================

const IMAGE_TASK_PROMPTS = {
  'extract-text': 'Extract all visible text from this image. Focus on product names, brands, ingredients, and labels. Return ONLY the extracted text, no explanations.',
  'extract-barcode': 'Extract the barcode number or product code from this image. Return ONLY the numeric code, nothing else.',
  'extract-receipt': 'This is a shopping receipt. List only the purchased product/item names, one per line. Exclude: prices, quantities, totals, subtotals, tax, store name, date, cashier, loyalty points, and any other non-product text. Return ONLY the item names, nothing else.',
  'extract-brand': 'Extract ONLY the brand/manufacturer name from this product image. Return just the brand name, nothing else. If not found, return "UNKNOWN".',
  'extract-product-name': 'Extract ONLY the product name/item name from this product image. Return just the product name, nothing else. If not found, return "UNKNOWN".',
  'extract-certifications': `Look for ethical and sustainability certifications/labels on this product:
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
  'scan-product': `You are a barcode and product label scanner. Analyze this image and extract any product information visible.

ALWAYS respond in this exact format - never refuse, never say you cannot read it:

Product: [product name, or "Unknown"]
Brand: [brand or company name, or "Unknown"]
Barcode: [any numeric barcode you can see, or "none"]

Rules:
- Even if the image is blurry or partial, do your best to identify any text or numbers.
- Barcodes are the long sequence of numbers printed under barcode lines - extract those digits.
- Never say "I'm unable to read" - always fill each field with your best guess or "Unknown".
- Do not add any other text outside the three lines above.`,
};

const CHAT_TASK_PROMPTS = {
  'clean-product-name': 'You are a product name formatter. The user will give you a raw product name from a barcode database. Return ONLY the clean, properly formatted product name (e.g. "Coca-Cola", "Nutella", "Lay\'s Classic Chips"). Remove size, weight, volume, and any descriptors that aren\'t part of the brand/product identity. Return just the name, nothing else.',
};

// =====================================================
// ADMIN AUTH ENDPOINTS
// =====================================================

/**
 * POST /api/admin/login
 * Server-side admin login - returns session token
 */
app.post('/api/admin/login', authLimiter, async (req, res) => {
  try {
    if (!ADMIN_PASSWORD_HASH) {
      return res.status(500).json({ success: false, error: 'Admin not configured' });
    }

    const { password } = req.body || {};
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'Password required' });
    }

    const isValid = await bcrypt.compare(password.trim(), ADMIN_PASSWORD_HASH);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Incorrect password' });
    }

    const token = createAdminSession();
    res.json({ success: true, token });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

/**
 * POST /api/admin/logout
 */
app.post('/api/admin/logout', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (token) adminSessions.delete(token);
  res.json({ success: true });
});

/**
 * GET /api/admin/verify
 * Check if current session token is still valid
 */
app.get('/api/admin/verify', (req, res) => {
  const token = req.headers['x-admin-token'];
  res.json({ success: true, authenticated: isValidAdminSession(token) });
});

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

METHODOLOGY -- SEVERITY LEVELS:
- Critical: Documented forced labour, child labour, or modern slavery confirmed by a government body, court ruling, or corporate admission. Examples: CBP Withhold Release Order, US federal court verdict, DOL child labour investigation.
- High: Serious findings with credible NGO/investigative evidence, not yet confirmed by a government authority. Examples: Amnesty International, Human Rights Watch, BBC Dispatches.
- Medium: Ongoing concerns or unresolved supply-chain transparency gaps from campaign scorecards or multi-outlet investigations. Examples: Oxfam Behind the Brands, Green America Chocolate Scorecard.

METHODOLOGY -- SOURCE TIERS:
- Tier 1 (Primary official record): court filing, regulatory finding, government report, corporate admission. Examples: US DOL TVPRA list, CBP Withhold Release Order, Supreme Court opinion, OECD NCP complaint.
- Tier 2 (Independent NGO report): NGO report, academic study. Examples: Amnesty International, Human Rights Watch, Oxfam, Greenpeace, BHRRC, Columbia Law School.
- Tier 3 (Investigative journalism): news report, investigation. Examples: BBC, The Guardian, Washington Post, AP, Channel 4, NYT, Reporter Brasil.

METHODOLOGY -- THE SOURCING BAR:
A flag is only shown in the app if it meets at least ONE of:
1. 1+ tier-1 source.
2. 2+ independent tier-2 sources (different organisations, same finding).
3. 1 tier-2 source + 2 tier-3 sources covering the same allegation.
Flags with only tier-3 sources are kept in "pending review" and not shown to users.

METHODOLOGY -- WHAT WE DON'T DO:
- We don't include flags that fail the sourcing bar.
- We don't describe findings as proven fact when only one tier-3 source exists.
- We don't accept allegations from anonymous or unverifiable sources.
- We don't keep flags that have been proven factually incorrect.
- We don't carry flags indefinitely -- documented remediation leads to archival.

DATABASE STATUS:
- ~35 brands currently flagged.
- All sources have URLs cited.

LIMITATIONS:
- ~35 brands. Major multinationals are prioritised; smaller or regional brands may not yet be covered.
- Focus on consumer food and grocery goods. Fashion, electronics, and household goods are out of scope.
- Geographic coverage skews toward supply chains with English-language investigative coverage.
- A brand not in our database does not mean it has no issues -- it may not have been researched yet.
- Not legal advice. Flags describe documented findings, not legal verdicts (unless the source is a court ruling).

CONTACT FOR CORRECTIONS:
Users can report issues with any flag by emailing geovanis@proton.me.
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

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content: `You are GoodScan's friendly support assistant. Answer ONLY using the information below about the app, its mission, and its methodology. If the answer is not in the information, say: "I don't have that information -- try the contact email geovanis@proton.me." Keep replies short, plain-English, and helpful. Do not invent facts, brands, or sources.

INFORMATION:
${ABOUT_US_KNOWLEDGE}`,
        },
        { role: 'user', content: userMessage },
      ],
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "I don't have that information.";
    res.json({ success: true, reply });
  } catch (error) {
    console.error('About-us chat error:', error);
    res.status(500).json({ success: false, error: 'Chat failed' });
  }
});

// =====================================================
// CHATGPT PRODUCT ANALYSIS (no OpenFoodFacts)
// =====================================================

/**
 * POST /api/chatgpt/analyze-product
 * Pure ChatGPT product analysis.
 * Accepts { query } (text) or { imageBase64 } (photo) or both.
 */
app.post('/api/chatgpt/analyze-product', openaiLimiter, largeBody, async (req, res) => {
  try {
    if (!openaiClient) {
      return res.status(500).json({ success: false, error: 'OpenAI API key not configured' });
    }

    const { query, imageBase64 } = req.body;
    if (!query && !imageBase64) {
      return res.status(400).json({ success: false, error: 'Provide query or imageBase64' });
    }

    // Validate imageBase64 if provided
    if (imageBase64 && (typeof imageBase64 !== 'string' || imageBase64.length > 10_000_000)) {
      return res.status(400).json({ success: false, error: 'Invalid or oversized image' });
    }

    const systemPrompt = `You are an expert ethical-shopping analyst. Given a product name (or image), return a JSON analysis. Use your training knowledge about brands, supply chains, certifications, nutrition, and environmental impact.

IMPORTANT: Be honest about certainty. If you're unsure, say so. Never invent specific numeric scores -- estimate ranges instead.

Return ONLY valid JSON matching this schema:
{
  "productName": "string",
  "brand": "string or null",
  "category": "string (e.g. Snacks, Beverages, Dairy)",
  "summary": "1-2 sentence ethical verdict",
  "overallScore": "A | B | C | D | E (A=excellent, E=serious concerns)",
  "environment": {
    "score": "A-E or unknown",
    "notes": "string -- packaging, carbon footprint, sourcing"
  },
  "nutrition": {
    "score": "A-E or unknown",
    "novaGroup": 1-4 or null,
    "notes": "string -- processing level, sugar, additives"
  },
  "labor": {
    "risk": "low | medium | high | critical | unknown",
    "notes": "string -- known supply chain issues, certifications"
  },
  "animalWelfare": {
    "risk": "low | medium | high | critical | not-applicable",
    "notes": "string"
  },
  "certifications": ["list of known certifications or empty"],
  "alternatives": ["1-3 more ethical alternatives if applicable"],
  "confidence": "high | medium | low",
  "disclaimer": "string -- what you're uncertain about"
}`;

    const userContent = [];

    if (query) {
      userContent.push({
        type: 'text',
        text: `Analyze this product for ethical shopping: "${query}"`,
      });
    }

    if (imageBase64) {
      if (!query) {
        userContent.push({
          type: 'text',
          text: 'Identify this product and analyze it for ethical shopping.',
        });
      }
      userContent.push({
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64}`,
          detail: 'low',
        },
      });
    }

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 1200,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || '';

    let parsed;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      parsed = null;
    }

    if (!parsed) {
      return res.status(500).json({ success: false, error: 'Failed to parse AI response' });
    }

    res.json({
      success: true,
      analysis: parsed,
      usage: completion.usage,
    });
  } catch (error) {
    console.error('ChatGPT Analyze error:', error);
    res.status(500).json({ success: false, error: 'Analysis failed' });
  }
});

// =====================================================
// TASK-BASED IMAGE ANALYSIS (replaces open prompt endpoint)
// =====================================================

/**
 * POST /api/openai/analyze-image
 * Task-based image analysis - client sends a task name, NOT a prompt.
 * Accepts { imageBase64, task } where task is a key in IMAGE_TASK_PROMPTS.
 */
app.post('/api/openai/analyze-image', openaiLimiter, largeBody, async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key not configured on server',
      });
    }

    const { imageBase64, task } = req.body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing or invalid imageBase64' });
    }

    if (imageBase64.length > 10_000_000) {
      return res.status(400).json({ success: false, error: 'Image too large (max ~7.5MB)' });
    }

    // Only allow registered tasks
    const prompt = IMAGE_TASK_PROMPTS[task];
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: `Invalid task. Allowed: ${Object.keys(IMAGE_TASK_PROMPTS).join(', ')}`,
      });
    }

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
              { type: 'text', text: prompt },
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
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API Error:', response.status);
      return res.status(response.status).json({
        success: false,
        error: errorData.error?.message || 'OpenAI API error',
      });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    res.json({
      success: true,
      content,
      model: data.model,
      usage: data.usage,
    });
  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({ success: false, error: 'Failed to analyze image' });
  }
});

// =====================================================
// TASK-BASED CHAT (replaces open chat endpoint)
// =====================================================

/**
 * POST /api/openai/chat
 * Task-based chat - client sends { task, userMessage }.
 * No arbitrary prompts, model choice, or temperature allowed.
 */
app.post('/api/openai/chat', openaiLimiter, async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ success: false, error: 'OpenAI API key not configured' });
    }

    const { task, userMessage } = req.body;

    if (!task || !userMessage || typeof userMessage !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing task or userMessage' });
    }

    if (userMessage.length > 2000) {
      return res.status(400).json({ success: false, error: 'Message too long' });
    }

    const systemPrompt = CHAT_TASK_PROMPTS[task];
    if (!systemPrompt) {
      return res.status(400).json({
        success: false,
        error: `Invalid task. Allowed: ${Object.keys(CHAT_TASK_PROMPTS).join(', ')}`,
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API Error:', response.status);
      return res.status(response.status).json({
        success: false,
        error: errorData.error?.message || 'OpenAI API error',
      });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    res.json({
      success: true,
      content,
      model: data.model,
      usage: data.usage,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ success: false, error: 'Failed to process chat' });
  }
});

/**
 * GET /api/openfoodfacts/product/:barcode
 * Lookup a product by barcode on OpenFoodFacts (proxy to avoid CORS/timeout)
 */
app.get('/api/openfoodfacts/product/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;

    // Validate barcode format: 8-14 digits only
    if (!barcode || !/^\d{8,14}$/.test(barcode)) {
      return res.status(400).json({ status: 0, status_verbose: 'Invalid barcode format (8-14 digits required)' });
    }

    const fields = 'code,product_name,product_name_en,brands,ecoscore_grade,ecoscore_score,ecoscore_data,nutriscore_grade,nutriscore_score,nova_group,nutriments,labels_tags,labels,categories_tags,categories,origins,ingredients_text,ingredients_text_en,image_front_url,image_url,countries_tags,carbon_footprint_percent_of_known_ingredients';

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
            return res.json(data);
          }
        }
      } catch (e) {
        console.warn(`   ${url.includes('v2') ? 'v2' : 'v0'} failed: ${e.message}`);
      }
    }

    res.json({ status: 0, status_verbose: 'product not found', code: barcode });
  } catch (error) {
    console.error('Barcode lookup error:', error);
    res.status(500).json({ status: 0, status_verbose: 'Internal server error' });
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

    const fields = [
      'code', 'product_name', 'product_name_en', 'brands',
      'ecoscore_grade', 'ecoscore_score', 'ecoscore_data',
      'nutriscore_grade', 'nutriscore_score', 'nova_group',
      'nutriments', 'labels_tags', 'labels', 'categories_tags', 'categories',
      'origins', 'ingredients_text', 'ingredients_text_en',
      'image_front_url', 'image_url', 'countries_tags',
    ].join(',');

    const pageSize = String(Math.min(limit, 50));

    let data = null;
    const searchTimeout = 25000;
    const headers = { 'User-Agent': 'Scan2Source/1.0 (ethical-shopper)' };

    const BRAND_ALIASES = {
      'coke': 'coca-cola',
      'pepsi': 'pepsi',
      'sprite': 'coca-cola',
      'fanta': 'coca-cola',
      'diet-coke': 'coca-cola',
      'coke-zero': 'coca-cola',
    };

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

    // Strategy 1: v2 brand tag search
    try {
      const brandParams = new URLSearchParams({
        brands_tags: searchQuery,
        fields,
        page_size: String(Math.min(limit * 3, 100)),
      });
      const brandResponse = await fetch(`https://world.openfoodfacts.org/api/v2/search?${brandParams}`, {
        signal: AbortSignal.timeout(searchTimeout),
        headers,
      });
      if (brandResponse.ok) {
        const brandData = await brandResponse.json();
        if (brandData.products?.length > 0) {
          sortByRelevance(brandData.products, queryWords, queryLower);
          data = brandData;
        }
      }
    } catch (e) {
      console.warn(`Brand tag search failed: ${e.message}`);
    }

    // Strategy 2: first-word brand tag
    if (!data?.products?.length) {
      const firstWord = queryWords[0];
      if (firstWord && firstWord !== searchQuery) {
        try {
          const firstWordParams = new URLSearchParams({
            brands_tags: firstWord,
            fields,
            page_size: String(Math.min(limit * 3, 100)),
          });
          const fwResponse = await fetch(`https://world.openfoodfacts.org/api/v2/search?${firstWordParams}`, {
            signal: AbortSignal.timeout(searchTimeout),
            headers,
          });
          if (fwResponse.ok) {
            const fwData = await fwResponse.json();
            if (fwData.products?.length > 0) {
              sortByRelevance(fwData.products, queryWords.slice(1), queryLower);
              data = fwData;
            }
          }
        } catch (e) {
          console.warn(`First-word brand search failed: ${e.message}`);
        }
      }
    }

    // Strategy 3: v2 API full-text search
    if (!data?.products?.length) {
      try {
        const v2TextParams = new URLSearchParams({
          q: query.trim(),
          fields,
          page_size: String(Math.min(limit * 2, 50)),
          sort_by: 'unique_scans_n',
        });
        const v2TextResponse = await fetch(`https://world.openfoodfacts.org/api/v2/search?${v2TextParams}`, {
          signal: AbortSignal.timeout(searchTimeout),
          headers,
        });
        if (v2TextResponse.ok) {
          const v2TextData = await v2TextResponse.json();
          if (v2TextData.products?.length > 0) {
            sortByRelevance(v2TextData.products, queryWords, queryLower);
            data = v2TextData;
          }
        }
      } catch (e) {
        console.warn(`v2 text search failed: ${e.message}`);
      }
    }

    // Strategy 4: legacy cgi/search.pl
    if (!data?.products?.length) {
      try {
        const textParams = new URLSearchParams({
          search_terms: query.trim(),
          action: 'process',
          json: '1',
          fields,
          page_size: pageSize,
          sort_by: 'unique_scans_n',
        });
        const textResponse = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${textParams}`, {
          signal: AbortSignal.timeout(searchTimeout),
          headers,
        });
        if (textResponse.ok) {
          const textData = await textResponse.json();
          if (textData.products?.length > 0) {
            data = textData;
          }
        }
      } catch (e) {
        console.warn(`Legacy text search failed: ${e.message}`);
      }
    }

    // Strategy 5: v2 product_name_tags search
    if (!data?.products?.length) {
      try {
        const nameTagParams = new URLSearchParams({
          product_name_tags: rawSlug,
          fields,
          page_size: String(Math.min(limit * 2, 50)),
          sort_by: 'unique_scans_n',
        });
        const nameTagResponse = await fetch(`https://world.openfoodfacts.org/api/v2/search?${nameTagParams}`, {
          signal: AbortSignal.timeout(searchTimeout),
          headers,
        });
        if (nameTagResponse.ok) {
          const nameTagData = await nameTagResponse.json();
          if (nameTagData.products?.length > 0) {
            sortByRelevance(nameTagData.products, queryWords, queryLower);
            data = nameTagData;
          }
        }
      } catch (e) {
        console.warn(`product_name_tags search failed: ${e.message}`);
      }
    }

    if (!data || !data.products) {
      data = { products: [], count: 0 };
    }

    res.json({
      success: true,
      products: data.products || [],
      count: data.count || 0,
    });
  } catch (error) {
    console.error('OpenFoodFacts search error:', error);
    res.status(500).json({ success: false, error: 'Failed to search OpenFoodFacts' });
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
  app.get('/{*splat}', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

// =====================================================
// ERROR HANDLING
// =====================================================

app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`OpenAI Configured: ${OPENAI_API_KEY ? 'Yes' : 'No'}`);
  console.log(`Admin Configured: ${ADMIN_PASSWORD_HASH ? 'Yes' : 'No'}`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

export default app;
