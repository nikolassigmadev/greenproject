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
import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync, chmodSync } from 'fs';
import { createRequire } from 'module';
import { initScanStore, logScan, scanStoreReady, logCommunityFlag, updateCommunityFlagStatus } from './db/scanStore.js';

console.log('server.js: imports loaded');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Fix Node.js IPv6 timeout issue
try { dns.setDefaultResultOrder('ipv4first'); } catch(e) { console.warn('dns.setDefaultResultOrder not supported:', e.message); }

// Load environment variables (check .env.local first, then .env)
dotenv.config({ path: '.env.local' });
dotenv.config();

// Connect the Postgres scan store (Supabase/Neon/Railway via DATABASE_URL).
// Fire-and-forget: if DATABASE_URL is unset or unreachable it stays disabled
// and the server runs normally. Inserts are gated on its ready flag.
initScanStore();

console.log('server.js: dotenv loaded, PORT=', process.env.PORT);

// ── OpenAI call logger ──
// Persists { productName, timestamp } per API call to a private JSONL file.
// Reason: OpenAI's dashboard purges logs after 30 days; we want a permanent record.
// Stored at data/openai-logs.jsonl. This directory is OUTSIDE dist/ (the only
// static-served path), the catch-all route always serves index.html, and the
// directory is gitignored — so the file is not reachable over HTTP or in source.
const LOG_DIR = join(__dirname, 'data');
const OPENAI_LOG_FILE = join(LOG_DIR, 'openai-logs.jsonl');

function logOpenAICall(productName) {
  try {
    if (!existsSync(LOG_DIR)) {
      mkdirSync(LOG_DIR, { recursive: true, mode: 0o700 });
    }
    const raw = typeof productName === 'string' ? productName : '';
    const safe = raw.replace(/[\r\n\t]+/g, ' ').trim().slice(0, 200) || 'unknown';
    const line = JSON.stringify({
      productName: safe,
      timestamp: new Date().toISOString(),
    }) + '\n';
    appendFileSync(OPENAI_LOG_FILE, line);
    try { chmodSync(OPENAI_LOG_FILE, 0o600); } catch {}
  } catch (e) {
    console.error('Failed to log OpenAI call:', e.message);
  }
}

// ── Scan analytics DB (SQLite) ──
// Records every product a user opens, for aggregate "most-scanned" analytics.
// Stored at data/scans.db (gitignored, outside dist, not HTTP-reachable). Loaded
// defensively: if the native module can't load on the host, scan logging is
// disabled but the rest of the server keeps running.
const nodeRequire = createRequire(import.meta.url);
let scanDb = null;
let scanInsertStmt = null;
try {
  const Database = nodeRequire('better-sqlite3');
  if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true, mode: 0o700 });
  scanDb = new Database(join(LOG_DIR, 'scans.db'));
  scanDb.pragma('journal_mode = WAL');
  scanDb.exec(`
    CREATE TABLE IF NOT EXISTS scans (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode   TEXT,
      name      TEXT NOT NULL,
      brand     TEXT,
      eco_grade TEXT,
      country   TEXT,
      anon_id   TEXT,
      ts        INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_scans_barcode ON scans(barcode);
    CREATE INDEX IF NOT EXISTS idx_scans_ts ON scans(ts);
  `);
  scanInsertStmt = scanDb.prepare(
    `INSERT INTO scans (barcode, name, brand, eco_grade, country, anon_id, ts)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  console.log('server.js: scan analytics DB ready');
} catch (e) {
  console.warn('server.js: scan analytics DB unavailable —', e.message);
}

function recordScan(rec) {
  if (!scanInsertStmt) return;
  const clean = (s, n = 200) =>
    typeof s === 'string' ? (s.replace(/[\r\n\t]+/g, ' ').trim().slice(0, n) || null) : null;
  const name = clean(rec.name);
  if (!name) return;
  scanInsertStmt.run(
    clean(rec.barcode, 64),
    name,
    clean(rec.brand, 120),
    clean(rec.ecoGrade, 4),
    clean(rec.country, 4),
    clean(rec.anonId, 64),
    Date.now(),
  );
}

const app = express();
const PORT = process.env.PORT || 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// Hardcoded so login doesn't depend on Hostinger env vars.
// Replace this string with a new bcrypt hash to rotate the password.
const ADMIN_PASSWORD_HASH = '$2b$10$OwDevUsgK7kV0kkUWM./n.a7vX4zMYKxF.TdsA0b3624GCWPYHKj2';

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
// IMPORTANT: every regex MUST be anchored with ^ AND $.
// Otherwise an origin like https://evilgoodscan.shop matches /goodscan\.shop$/
// and, combined with Access-Control-Allow-Credentials: true below, lets a
// malicious site call the API as the victim.
const ALLOWED_ORIGINS = [
  /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/,
  /^capacitor:\/\/localhost$/,
  // goodscan.shop apex + any direct subdomain (e.g. www.goodscan.shop)
  /^https:\/\/([a-z0-9-]+\.)?goodscan\.shop$/,
  // Hostinger staging slot. Tighten to your actual subdomain when known —
  // ANY .hostingersite.com is a shared host where other people can register.
  /^https:\/\/([a-z0-9-]+\.)?hostingersite\.com$/,
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

// Community flag submissions: strict 3-per-hour-per-IP cap (spam mitigation).
const communityFlagLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many flag submissions - try again in an hour' },
});

// Small JSON body cap for community-flag submissions (4KB).
const smallBody = express.json({ limit: '4kb' });

app.use('/api/openai', openaiLimiter);
app.use('/api/chat', openaiLimiter);
app.use('/api/openfoodfacts', searchLimiter);

// =====================================================
// SERVER-SIDE PROMPT REGISTRY (task-based, no client prompts)
// =====================================================

const IMAGE_TASK_PROMPTS = {
  'extract-text': 'Extract all visible text from this image. Focus on product names, brands, ingredients, and labels. Return ONLY the extracted text, no explanations.',
  'extract-barcode': 'Extract the barcode number or product code from this image. Return ONLY the numeric code, nothing else.',
  'extract-receipt': `This is a shopping receipt. List only the purchased product/item names, one per line. Exclude: prices, quantities, totals, subtotals, tax, store name, date, cashier, loyalty points, and any other non-product text.

CRITICAL: Each line MUST include the brand name followed by the product. The brand name is REQUIRED for every item -- this output is used to query Open Food Facts and a bare product name is not searchable. Use your knowledge to infer the brand from abbreviations on the receipt when possible. Also preserve any flavor/variant words shown on the receipt (e.g. "Zero", "Cool Ranch", "Light") -- they identify the exact product. Expand receipt abbreviations to full words ("CHKN" → "Chicken", "ORIG" → "Original").
- Good: "Lays Chilli Chips", "Cadbury Dairy Milk", "Coca-Cola Zero"
- Bad: "Chilli Chips", "Dairy Milk", "Zero"
If you genuinely cannot determine the brand for an item, prefix that line with "UNKNOWN " (e.g. "UNKNOWN Chilli Chips") rather than omitting it. Return ONLY the item names, one per line, nothing else.`,
  'extract-brand': 'Extract ONLY the brand/manufacturer name from this product image. Return just the brand name, nothing else. If not found, return "UNKNOWN".',
  'extract-product-name': `Extract the product name from this product image.

CRITICAL rules -- this output is used to query the Open Food Facts database:
1. The name MUST start with the brand name. A bare product name is not searchable.
2. The name MUST include the exact flavor/variant printed on the pack (e.g. "Zero", "Cool Ranch", "Salt & Vinegar"). Without it the search returns the wrong flavor. Copy the flavor words exactly as printed -- do not paraphrase or shorten.
3. Do NOT include size, weight, volume, count, slogans, or marketing claims.
- Good: "Lays Chilli Chips", "Cadbury Dairy Milk Fruit & Nut", "Coca-Cola Zero Sugar", "Nestle KitKat Chunky", "Doritos Cool Ranch"
- Bad: "Chilli Chips" (no brand), "Cadbury Chocolate" (flavor lost), "Doritos" (flavor lost), "KitKat Chunky 40g" (size included)
Return just the "Brand ProductName Flavor" string, nothing else. If the brand is unreadable or missing, return "UNKNOWN".`,
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
  'scan-product': `Identify this packaged product from the photo. Respond ONLY in this format:

Product: [product line + exact flavor/variant]
Brand: [brand]
Barcode: [digits or "none"]

Rules:
- Brand is REQUIRED. We use "Brand Product" to query Open Food Facts; without the brand the search is unreliable. Always populate Brand with your best guess from the package, even if the brand text is small or partially obscured.
- Brand = the consumer-facing brand on the package (e.g. "Ben & Jerry's", "Lay's", "Nestle", "Coca-Cola"). If the package shows both a parent and a sub-brand, prefer the SUB-brand the shopper sees (e.g. "Ben & Jerry's", not "Unilever").
- Product = the product line PLUS the exact flavor/variant/sub-type printed on the pack, WITHOUT the brand. The flavor/variant is CRITICAL: a database search for "Doritos" alone returns the wrong flavor — we need "Cool Ranch". Actively look for the flavor text; it is often smaller than the logo, near the bottom of the pack, or on a color band.
- Copy flavor/variant words EXACTLY as printed. Do not translate, paraphrase, shorten, or generalize them ("Cool Ranch" must not become "Ranch"; "Zero Sugar" must not become "Zero" or "Sugar Free").
- Good: Brand "Ben & Jerry's" + Product "Phish Food" | Brand "Doritos" + Product "Cool Ranch" | Brand "Coca-Cola" + Product "Zero Sugar" | Brand "Cadbury" + Product "Dairy Milk Fruit & Nut" | Brand "Walkers" + Product "Salt & Vinegar".
- Bad: Product "Tortilla Chips" when the bag says "Nacho Cheese" (flavor lost) | Product "Ice Cream" when the tub says "Phish Food" | Brand "UNKNOWN" + Product "Phish Food" (we lose searchability) | Brand "Ben & Jerry's Phish Food" (brand must not duplicate product).
- Do NOT include size, weight, volume, count, percentages, barcodes, slogans, or marketing claims ("New!", "Now Tastier") in Product.
- If the pack shows multiple languages, prefer the English product/flavor name.
- Always give your best guess. Never refuse or say you cannot read it. Only return Brand: UNKNOWN when there is literally no brand text or logo visible anywhere in the image.
- No extra text outside the three lines.`,
};

const CHAT_TASK_PROMPTS = {
  'clean-product-name': 'You are a product name formatter. The user will give you a raw product name from a barcode database. Return ONLY the clean, properly formatted product name (e.g. "Coca-Cola", "Nutella", "Lay\'s Classic Chips"). Remove size, weight, volume, and pure marketing text — but KEEP flavor/variant words ("Zero", "Cool Ranch", "Salt & Vinegar", "Light"): they are part of the product identity and required for accurate matching. Return just the name, nothing else.',
  'fix-product-query': 'You are a search-query fixer for a food product database. The user typed a product name, possibly with typos. Fix spelling and capitalization ONLY. Rules: (1) NEVER drop words — flavor/variant words like "zero", "diet", "light", "cool ranch", "salt & vinegar" identify the exact product and MUST stay; (2) NEVER add words the user did not type or clearly imply; (3) correct obvious brand misspellings to the canonical brand name. Examples: "cocacl ola zero" → "Coca-Cola Zero", "nuttela" → "Nutella", "lays clasic chips" → "Lay\'s Classic Chips", "doritos col ranch" → "Doritos Cool Ranch", "ben and jerrys fish food" → "Ben & Jerry\'s Phish Food", "chupa chps" → "Chupa Chups". Return ONLY the corrected query, nothing else. If the input is already correct, return it as-is with proper capitalization.',
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

/**
 * GET /api/admin/openai-logs
 * Admin-gated: returns the permanent OpenAI call log (data/openai-logs.jsonl).
 * Format is JSONL — one {productName, timestamp} per line.
 * Add ?download=1 to force a file download.
 */
app.get('/api/admin/openai-logs', requireAdmin, (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    if (req.query.download) {
      res.setHeader('Content-Disposition', 'attachment; filename="openai-logs.jsonl"');
    }
    if (!existsSync(OPENAI_LOG_FILE)) {
      return res.status(200).send('');
    }
    res.status(200).send(readFileSync(OPENAI_LOG_FILE, 'utf8'));
  } catch (e) {
    console.error('Failed to read OpenAI logs:', e);
    res.status(500).json({ success: false, error: 'Failed to read logs' });
  }
});

// =====================================================
// COMMUNITY FLAG SUBMISSIONS
// =====================================================
// Public submission queue for user-reported brand flags. Each record is scored
// against the tier-1/2/3 sourcing bar (same rules as in-house flags) and lands
// in pending_review until an admin approves or rejects it.
//
// Storage: append-only JSONL at data/community-flags.jsonl. Single-process
// server, small file expected (admins keep the queue drained), so plain
// readFileSync + writeFileSync is fine for the moderation rewrite path.
//
// Spam controls: honeypot field, 4KB body cap, 3-per-hour-per-IP rate limit,
// SHA-256 IP fingerprint (with daily salt) so we can spot abuse without ever
// storing or returning the raw IP.

const COMMUNITY_FLAGS_FILE = join(LOG_DIR, 'community-flags.jsonl');

const ALLOWED_FLAG_CATEGORIES = new Set([
  'forced_labour', 'child_labour', 'wage_theft', 'unsafe_conditions',
  'union_busting', 'discrimination', 'supply_chain_opacity',
  'animal_welfare', 'environmental_harm', 'boycott_listed',
]);
const ALLOWED_FLAG_SEVERITIES = new Set(['critical', 'high', 'medium', 'low']);
const ALLOWED_SOURCE_TIERS = new Set(['tier1', 'tier2', 'tier3']);

// Daily salt: rotates at UTC midnight so IP hashes can't be correlated across
// long periods. We never persist the raw IP -- only the salted hash.
function getDailyIpSalt() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
}

function hashIp(ip) {
  const salt = getDailyIpSalt();
  return crypto.createHash('sha256').update(`${ip || 'unknown'}|${salt}`).digest('hex');
}

function generateCommunityFlagId() {
  return `cf_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
}

function isHttpUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function isAllCaps(text) {
  if (typeof text !== 'string') return false;
  const letters = text.replace(/[^A-Za-z]/g, '');
  if (letters.length < 6) return false;
  return letters === letters.toUpperCase();
}

// The sourcing bar: identical rule to the in-house flag schema.
// 1) 1+ tier-1 source, OR
// 2) 2+ tier-2 sources from DIFFERENT publishers, OR
// 3) 1 tier-2 source + 2+ tier-3 sources.
function meetsSourcingBar(sources) {
  if (!Array.isArray(sources) || sources.length === 0) return false;
  const tier1 = sources.filter(s => s.tier === 'tier1');
  const tier2 = sources.filter(s => s.tier === 'tier2');
  const tier3 = sources.filter(s => s.tier === 'tier3');
  if (tier1.length >= 1) return true;
  const tier2Publishers = new Set(
    tier2.map(s => (typeof s.publisher === 'string' ? s.publisher.trim().toLowerCase() : '')).filter(Boolean)
  );
  if (tier2.length >= 2 && tier2Publishers.size >= 2) return true;
  if (tier2.length >= 1 && tier3.length >= 2) return true;
  return false;
}

function readJsonlRecords(filePath) {
  if (!existsSync(filePath)) return [];
  const raw = readFileSync(filePath, 'utf8');
  if (!raw) return [];
  const records = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      records.push(JSON.parse(trimmed));
    } catch (e) {
      console.warn('Skipped corrupt JSONL line:', e.message);
    }
  }
  return records;
}

function writeJsonlRecords(filePath, records) {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true, mode: 0o700 });
  }
  const payload = records.map(r => JSON.stringify(r)).join('\n') + (records.length ? '\n' : '');
  writeFileSync(filePath, payload, { mode: 0o600 });
}

/**
 * POST /api/community-flags
 * Public submission endpoint -- writes one record to data/community-flags.jsonl.
 * Validates structure, enforces sourcing-bar scoring, and rejects honeypot hits.
 */
app.post('/api/community-flags', communityFlagLimiter, smallBody, (req, res) => {
  try {
    const body = req.body || {};
    const {
      brandName,
      category,
      severity,
      summary,
      sources,
      submitterEmail,
      honeypot,
    } = body;

    // Honeypot: legitimate clients leave this empty. Bots fill every field.
    // Return a success-ish 200 so spammers don't learn the trap exists.
    if (typeof honeypot !== 'string' || honeypot.length > 0) {
      return res.status(200).json({ success: true, id: 'cf_ignored' });
    }

    if (typeof brandName !== 'string' || brandName.trim().length < 2 || brandName.trim().length > 80) {
      return res.status(400).json({ success: false, error: 'brandName must be 2-80 characters' });
    }
    if (!ALLOWED_FLAG_CATEGORIES.has(category)) {
      return res.status(400).json({ success: false, error: 'Invalid category' });
    }
    if (!ALLOWED_FLAG_SEVERITIES.has(severity)) {
      return res.status(400).json({ success: false, error: 'Invalid severity' });
    }
    if (typeof summary !== 'string' || summary.trim().length < 10 || summary.trim().length > 300) {
      return res.status(400).json({ success: false, error: 'summary must be 10-300 characters' });
    }
    if (isAllCaps(summary)) {
      return res.status(400).json({ success: false, error: 'summary must not be all caps' });
    }
    if (!Array.isArray(sources) || sources.length < 1 || sources.length > 5) {
      return res.status(400).json({ success: false, error: 'sources must contain 1-5 entries' });
    }
    for (const [i, s] of sources.entries()) {
      if (!s || typeof s !== 'object') {
        return res.status(400).json({ success: false, error: `sources[${i}] must be an object` });
      }
      if (!isHttpUrl(s.url)) {
        return res.status(400).json({ success: false, error: `sources[${i}].url must be a valid http(s) URL` });
      }
      if (typeof s.title !== 'string' || !s.title.trim()) {
        return res.status(400).json({ success: false, error: `sources[${i}].title is required` });
      }
      if (typeof s.publisher !== 'string' || !s.publisher.trim()) {
        return res.status(400).json({ success: false, error: `sources[${i}].publisher is required` });
      }
      if (!ALLOWED_SOURCE_TIERS.has(s.tier)) {
        return res.status(400).json({ success: false, error: `sources[${i}].tier must be tier1, tier2, or tier3` });
      }
    }
    if (submitterEmail !== undefined && submitterEmail !== null) {
      if (typeof submitterEmail !== 'string' || submitterEmail.length > 200) {
        return res.status(400).json({ success: false, error: 'submitterEmail invalid' });
      }
    }

    const normalisedSources = sources.map(s => ({
      url: s.url.trim(),
      title: s.title.trim().slice(0, 300),
      publisher: s.publisher.trim().slice(0, 120),
      tier: s.tier,
    }));

    const record = {
      id: generateCommunityFlagId(),
      submittedAt: new Date().toISOString(),
      status: 'pending_review',
      meetsSourcingBar: meetsSourcingBar(normalisedSources),
      ipHash: hashIp(req.ip),
      submission: {
        brandName: brandName.trim(),
        category,
        severity,
        summary: summary.trim(),
        sources: normalisedSources,
        submitterEmail: typeof submitterEmail === 'string' ? submitterEmail.trim() : undefined,
      },
    };

    if (!existsSync(LOG_DIR)) {
      mkdirSync(LOG_DIR, { recursive: true, mode: 0o700 });
    }
    appendFileSync(COMMUNITY_FLAGS_FILE, JSON.stringify(record) + '\n');
    try { chmodSync(COMMUNITY_FLAGS_FILE, 0o600); } catch {}

    // Also send straight to Postgres/Supabase (fire-and-forget; JSONL is backup).
    logCommunityFlag(record);

    res.json({ success: true, id: record.id });
  } catch (error) {
    console.error('Community flag submission error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit flag' });
  }
});

/**
 * GET /api/admin/community-flags?status=pending_review|approved|rejected
 * Admin-gated (admin password) -- returns matching records, newest first.
 * Read privately via scripts/pull-flags.sh.
 */
app.get('/api/admin/community-flags', requireAdmin, (req, res) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : 'pending_review';
    if (!['pending_review', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status filter' });
    }
    const records = readJsonlRecords(COMMUNITY_FLAGS_FILE)
      .filter(r => r.status === status)
      .sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
    res.json({ success: true, count: records.length, records });
  } catch (error) {
    console.error('Community flag list error:', error);
    res.status(500).json({ success: false, error: 'Failed to read flags' });
  }
});

/**
 * PATCH /api/admin/community-flags/:id
 * Admin-gated -- approve or reject a pending submission.
 * Body: { status: 'approved' | 'rejected', note?: string }
 */
app.patch('/api/admin/community-flags/:id', requireAdmin, smallBody, (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body || {};
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'status must be approved or rejected' });
    }
    if (note !== undefined && (typeof note !== 'string' || note.length > 500)) {
      return res.status(400).json({ success: false, error: 'note must be a string up to 500 chars' });
    }

    const records = readJsonlRecords(COMMUNITY_FLAGS_FILE);
    const idx = records.findIndex(r => r.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Flag not found' });
    }

    records[idx] = {
      ...records[idx],
      status,
      moderatedAt: new Date().toISOString(),
      moderatorNote: typeof note === 'string' ? note.trim() : undefined,
    };

    writeJsonlRecords(COMMUNITY_FLAGS_FILE, records);

    // Keep the Postgres/Supabase row in sync with the moderation decision.
    updateCommunityFlagStatus(id, status, typeof note === 'string' ? note.trim() : undefined);

    res.json({ success: true, record: records[idx] });
  } catch (error) {
    console.error('Community flag patch error:', error);
    res.status(500).json({ success: false, error: 'Failed to update flag' });
  }
});

// =====================================================
// WEB PUSH SUBSCRIPTION REGISTRY (stub)
// =====================================================
// Stores Web Push subscriptions for "watched brand" notifications. Actual
// VAPID-signed push delivery is not wired up yet -- this section handles
// registration, dedupe by endpoint, and a manual admin trigger that just
// logs and counts matching subscriptions.
//
// Storage: data/push-subscriptions.jsonl. Append-only for new subs; dedupe
// rewrites the whole file when an endpoint already exists.

const PUSH_SUBSCRIPTIONS_FILE = join(LOG_DIR, 'push-subscriptions.jsonl');

function isValidPushSubscription(sub) {
  if (!sub || typeof sub !== 'object') return false;
  if (typeof sub.endpoint !== 'string' || !isHttpUrl(sub.endpoint)) return false;
  if (sub.keys && typeof sub.keys !== 'object') return false;
  return true;
}

function normaliseWatchedBrands(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const item of list) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed || trimmed.length > 80) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
    if (out.length >= 50) break; // hard cap
  }
  return out;
}

/**
 * POST /api/push/subscribe
 * Public -- registers a Web Push subscription. Dedupes by subscription.endpoint;
 * an existing record for that endpoint is replaced.
 */
app.post('/api/push/subscribe', smallBody, (req, res) => {
  try {
    const { subscription, watchedBrands } = req.body || {};
    if (!isValidPushSubscription(subscription)) {
      return res.status(400).json({ success: false, error: 'Invalid push subscription' });
    }

    const record = {
      subscription: {
        endpoint: subscription.endpoint,
        expirationTime: subscription.expirationTime ?? null,
        keys: subscription.keys || {},
      },
      watchedBrands: normaliseWatchedBrands(watchedBrands),
      registeredAt: new Date().toISOString(),
    };

    const existing = readJsonlRecords(PUSH_SUBSCRIPTIONS_FILE);
    const idx = existing.findIndex(r => r.subscription?.endpoint === record.subscription.endpoint);

    if (idx === -1) {
      // New subscription: append-only fast path.
      if (!existsSync(LOG_DIR)) {
        mkdirSync(LOG_DIR, { recursive: true, mode: 0o700 });
      }
      appendFileSync(PUSH_SUBSCRIPTIONS_FILE, JSON.stringify(record) + '\n');
      try { chmodSync(PUSH_SUBSCRIPTIONS_FILE, 0o600); } catch {}
    } else {
      // Existing endpoint: replace and rewrite the whole file.
      existing[idx] = record;
      writeJsonlRecords(PUSH_SUBSCRIPTIONS_FILE, existing);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Push subscribe error:', error);
    res.status(500).json({ success: false, error: 'Failed to register subscription' });
  }
});

/**
 * POST /api/push/unsubscribe
 * Public -- removes the subscription matching { endpoint }.
 */
app.post('/api/push/unsubscribe', smallBody, (req, res) => {
  try {
    const { endpoint } = req.body || {};
    if (typeof endpoint !== 'string' || !isHttpUrl(endpoint)) {
      return res.status(400).json({ success: false, error: 'endpoint required' });
    }

    const existing = readJsonlRecords(PUSH_SUBSCRIPTIONS_FILE);
    const filtered = existing.filter(r => r.subscription?.endpoint !== endpoint);

    if (filtered.length === existing.length) {
      // Nothing to remove. Idempotent success.
      return res.json({ success: true, removed: 0 });
    }

    writeJsonlRecords(PUSH_SUBSCRIPTIONS_FILE, filtered);
    res.json({ success: true, removed: existing.length - filtered.length });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    res.status(500).json({ success: false, error: 'Failed to unsubscribe' });
  }
});

/**
 * GET /api/admin/push-subscriptions
 * Admin-gated -- returns total count + a sample list (endpoint truncated to
 * 60 chars + watched brands). Full endpoint URLs are not exposed.
 */
app.get('/api/admin/push-subscriptions', requireAdmin, (req, res) => {
  try {
    const records = readJsonlRecords(PUSH_SUBSCRIPTIONS_FILE);
    const sample = records.slice(0, 50).map(r => ({
      endpointPreview: (r.subscription?.endpoint || '').slice(0, 60),
      watchedBrands: Array.isArray(r.watchedBrands) ? r.watchedBrands : [],
      registeredAt: r.registeredAt || null,
    }));
    res.json({ success: true, count: records.length, sample });
  } catch (error) {
    console.error('Push list error:', error);
    res.status(500).json({ success: false, error: 'Failed to read subscriptions' });
  }
});

/**
 * POST /api/admin/push/trigger-demo
 * Admin-gated -- DEMO ONLY. Counts subscriptions watching the given brand
 * (case-insensitive) and logs the payload. Actual VAPID delivery is a
 * follow-up; for now we just report how many users would have been notified.
 */
app.post('/api/admin/push/trigger-demo', requireAdmin, smallBody, (req, res) => {
  try {
    const { brand, message } = req.body || {};
    if (typeof brand !== 'string' || !brand.trim()) {
      return res.status(400).json({ success: false, error: 'brand required' });
    }
    if (typeof message !== 'string' || !message.trim() || message.length > 280) {
      return res.status(400).json({ success: false, error: 'message required (max 280 chars)' });
    }

    const brandKey = brand.trim().toLowerCase();
    const records = readJsonlRecords(PUSH_SUBSCRIPTIONS_FILE);
    const wouldNotify = records.filter(r =>
      Array.isArray(r.watchedBrands) &&
      r.watchedBrands.some(b => typeof b === 'string' && b.trim().toLowerCase() === brandKey)
    ).length;

    console.log('[push-demo]', { brand: brand.trim(), message: message.trim(), wouldNotify });
    res.json({ success: true, wouldNotify });
  } catch (error) {
    console.error('Push trigger-demo error:', error);
    res.status(500).json({ success: false, error: 'Failed to trigger demo' });
  }
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
- Email: contact@goodscan.shop
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
Users can report issues with any flag by emailing contact@goodscan.shop.
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
      store: true,
      temperature: 0.2,
      max_tokens: 400,
      messages: [
        {
          role: 'system',
          content: `You are GoodScan's friendly support assistant. Answer ONLY using the information below about the app, its mission, and its methodology. If the answer is not in the information, say: "I don't have that information -- try the contact email contact@goodscan.shop." Keep replies short, plain-English, and helpful. Do not invent facts, brands, or sources.

INFORMATION:
${ABOUT_US_KNOWLEDGE}`,
        },
        { role: 'user', content: userMessage },
      ],
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "I don't have that information.";
    logOpenAICall(userMessage);
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

    const { query, imageBase64, userContext } = req.body;
    if (!query && !imageBase64) {
      return res.status(400).json({ success: false, error: 'Provide query or imageBase64' });
    }

    // Validate imageBase64 if provided
    if (imageBase64 && (typeof imageBase64 !== 'string' || imageBase64.length > 10_000_000)) {
      return res.status(400).json({ success: false, error: 'Invalid or oversized image' });
    }

    // Cap user context to keep prompt size reasonable
    const safeUserContext = typeof userContext === 'string'
      ? userContext.slice(0, 4000)
      : null;

    const personalizationBlock = safeUserContext
      ? `\n\n=== USER CONTEXT (from their app data) ===\n${safeUserContext}\n=== END USER CONTEXT ===\n\nWhen relevant, tailor your verdict, alternatives, and "summary" to this specific user. If they've flagged a brand on their watchlist or own this product already, mention that. Heavily weight pillars they care about (high/critical priority) and de-emphasize ones they marked "none". Suggest alternatives that align with what they actually buy.`
      : '';

    const systemPrompt = `You are an expert ethical-shopping analyst. Given a product name (or image), return a JSON analysis. Use your training knowledge about brands, supply chains, certifications, nutrition, and environmental impact.

IMPORTANT: Be honest about certainty. If you're unsure, say so. Never invent specific numeric scores -- estimate ranges instead.${personalizationBlock}

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
      store: true,
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

    logOpenAICall(parsed?.productName || query || 'image-only-product');

    // Rich Postgres log: full analysis + metadata (fire-and-forget, never blocks).
    logScan({
      source: 'chatgpt/analyze-product',
      userId: req.body?.anonId,
      query,
      productName: parsed?.productName || query || null,
      brand: parsed?.brand || null,
      country: req.body?.country,
      city: req.body?.city,
      imageBase64,
      response: { analysis: parsed, usage: completion.usage },
      model: completion.model || 'gpt-4o-mini',
    });

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
        store: true,
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
        max_tokens: task === 'scan-product' ? 60 : 300,
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

    let loggedName = task;
    if (task === 'scan-product' && typeof content === 'string') {
      const m = content.match(/Product:\s*(.+)/i);
      if (m) loggedName = m[1].trim();
    }
    logOpenAICall(loggedName);

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
        store: true,
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

    logOpenAICall(userMessage);

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

    const fields = 'code,product_name,product_name_en,brands,ecoscore_grade,ecoscore_score,ecoscore_data,nutriscore_grade,nutriscore_score,nova_group,nutriments,labels_tags,labels,categories_tags,categories,origins,ingredients_text,ingredients_text_en,image_front_url,image_url,countries_tags,carbon_footprint_percent_of_known_ingredients,states_tags';

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

// =====================================================
// OPENFOODFACTS SEARCH HELPERS
// =====================================================

// Search-a-licious (search.openfoodfacts.org) returns some fields as arrays
// where the classic API returns comma-separated strings (notably `brands`).
// Normalize hits to the classic shape so the client's parser works unchanged.
// NOTE: Search-a-licious has no CORS headers, so browsers can't call it
// directly — all access must go through this server.
const joinIfArray = (v) => (Array.isArray(v) ? v.join(', ') : v);
const fromSaliciousHit = (hit) => ({
  ...hit,
  brands: joinIfArray(hit.brands),
  labels: joinIfArray(hit.labels),
  categories: joinIfArray(hit.categories),
  origins: joinIfArray(hit.origins),
  countries: joinIfArray(hit.countries),
});

/** Slugify a display name into an OFF taxonomy tag: "United States" → "en:united-states" */
const toOffTag = (name) => `en:${String(name).trim().toLowerCase().replace(/\s+/g, '-')}`;

const OFF_SEARCH_FIELDS = [
  'code', 'product_name', 'product_name_en', 'generic_name', 'generic_name_en', 'abbreviated_product_name', 'brands',
  'ecoscore_grade', 'ecoscore_score', 'ecoscore_data',
  'nutriscore_grade', 'nutriscore_score', 'nova_group',
  'nutriments', 'labels_tags', 'labels', 'categories_tags', 'categories',
  'origins', 'ingredients_text', 'ingredients_text_en',
  'image_front_url', 'image_url', 'countries_tags', 'states_tags',
].join(',');

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
      'image_front_url', 'image_url', 'countries_tags', 'states_tags',
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

    // Sort by relevance but preserve original API order (popularity) as tiebreaker.
    // Only reorder when there's a meaningful name-match difference.
    const sortByRelevance = (products, words, fullQuery) => {
      return products.sort((a, b) => {
        const nameA = (a.product_name || a.product_name_en || '').toLowerCase();
        const nameB = (b.product_name || b.product_name_en || '').toLowerCase();
        // Exact full-query match in name wins
        const aExact = nameA.includes(fullQuery);
        const bExact = nameB.includes(fullQuery);
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        // If both match equally, preserve original order (popularity from API)
        const aScore = words.filter(w => nameA.includes(w)).length;
        const bScore = words.filter(w => nameB.includes(w)).length;
        if (bScore !== aScore) return bScore - aScore;
        return 0; // stable — keeps API's popularity order
      });
    };

    // Determinism rules:
    //  - For SINGLE-word queries we trust the brand_tags index (Strategy 1).
    //  - For MULTI-word queries we go straight to full-text (Strategy 3) so
    //    distinctive product tokens (Phish Food, Dairy Milk) are scored. The
    //    old "first word brand_tags" fallback returned products from any brand
    //    whose name happened to start with the query's first word (e.g. query
    //    "Ben & Jerry's Phish Food" → first word "Ben" → matched a whey-protein
    //    brand called "Ben" and Moroccan "jben" yogurt → wildly wrong + flaky).
    const isMultiWord = queryWords.length > 1;

    /** v2 brand tag search (full slug). Returns true if it produced results. */
    const tryBrandTagSearch = async () => {
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
            return true;
          }
        }
      } catch (e) {
        console.warn(`Brand tag search failed: ${e.message}`);
      }
      return false;
    };

    // Strategy 1: brand tag search — but ONLY first for SINGLE-word queries.
    // For multi-word queries the relevance-ranked full-text search (Strategy 3)
    // must go first: OFF contributors sometimes mis-enter a full product name
    // ("coca cola zero") in the brand field, so a brands_tags hit on a
    // multi-word slug can surface junk entries (e.g. an apple cider vinegar
    // whose "brand" is "Coca cola zero") ahead of the real product. Genuine
    // multi-word brands still work — full text matches the brands field too,
    // and Strategy 3b retries brands_tags if full text finds nothing.
    if (!isMultiWord) {
      await tryBrandTagSearch();
    }

    // Strategy 2: first-word brand_tags — ONLY for single-word queries.
    // Multi-word queries skip this; using the first word alone makes search
    // non-deterministic and routinely returns the wrong brand.
    if (!data?.products?.length && !isMultiWord) {
      const firstWord = queryWords[0];
      if (firstWord && firstWord !== searchQuery && firstWord.length >= 4) {
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

    // Strategy 3: Search-a-licious full-text search — primary path for
    // multi-word queries. This is OFF's modern Elasticsearch-backed engine
    // with phrase boosting, so "doritos cool ranch" ranks exact-flavor
    // matches first. (The old v2 `q` param this replaced is silently IGNORED
    // by the v2 API — it returned random popular products and made multi-word
    // search non-deterministic.)
    if (!data?.products?.length) {
      try {
        const saliciousParams = new URLSearchParams({
          q: query.trim(),
          langs: 'en',
          page_size: String(Math.min(limit * 2, 50)),
          fields,
        });
        const saliciousResponse = await fetch(`https://search.openfoodfacts.org/search?${saliciousParams}`, {
          signal: AbortSignal.timeout(searchTimeout),
          headers,
        });
        if (saliciousResponse.ok) {
          const saliciousData = await saliciousResponse.json();
          if (saliciousData.hits?.length > 0) {
            // Preserve Elasticsearch relevance order — it already phrase-boosts
            // exact name matches. sortByRelevance is stable, so it only lifts
            // exact full-query name hits and keeps ES order for ties.
            const products = saliciousData.hits.map(fromSaliciousHit);
            sortByRelevance(products, queryWords, queryLower);
            data = { products, count: saliciousData.count || products.length };
          }
        }
      } catch (e) {
        console.warn(`Search-a-licious search failed: ${e.message}`);
      }
    }

    // Strategy 3b: brand tag search for multi-word queries — only after full
    // text found nothing (covers genuine multi-word brand names).
    if (!data?.products?.length && isMultiWord) {
      await tryBrandTagSearch();
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

    // Final safety net: regardless of which strategy hit, drop products whose
    // name/brand share NO whole-word token (>=3 chars) with the query. This
    // prevents leaks like "Natural Whey Protein (Ben)" coming back for a
    // "Ben & Jerry's Phish Food" query. Whole-word, not substring — "Ben" must
    // not match "jben".
    const significantQueryWords = queryWords.filter((w) => w.length >= 3);
    if (significantQueryWords.length > 0 && Array.isArray(data.products)) {
      const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const patterns = significantQueryWords.map((w) => new RegExp(`\\b${escapeRe(w)}\\b`, 'i'));
      const filtered = data.products.filter((p) => {
        const haystack = [p.product_name, p.product_name_en, p.brands].filter(Boolean).join(' ');
        return patterns.some((re) => re.test(haystack));
      });
      // Only apply the filter if it leaves at least one result. If the entire
      // pool was unrelated, return the filtered (empty) set so the client gets
      // a clean "no match" instead of nonsense.
      data.products = filtered;
      data.count = filtered.length;
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
 * POST /api/openfoodfacts/browse
 * Browse products with an optional text query plus category/country filters.
 * Tries the legacy cgi/search.pl first, then Search-a-licious — the legacy
 * endpoint is frequently unavailable, and browsers cannot call
 * Search-a-licious directly (no CORS), so this proxy is the reliable path
 * for the Database page and "greener alternatives" lookups.
 */
app.post('/api/openfoodfacts/browse', async (req, res) => {
  try {
    const { query, category, country, page = 1, pageSize = 24 } = req.body || {};
    const headers = { 'User-Agent': 'Scan2Source/1.0 (ethical-shopper)' };
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safePageSize = Math.min(Math.max(1, parseInt(pageSize, 10) || 24), 50);

    // Attempt 1: legacy cgi/search.pl with tag filters
    try {
      const params = new URLSearchParams({
        action: 'process',
        json: '1',
        page: String(safePage),
        page_size: String(safePageSize),
        sort_by: 'unique_scans_n',
        fields: OFF_SEARCH_FIELDS,
      });
      if (query && String(query).trim()) params.set('search_terms', String(query).trim());
      let tagIndex = 0;
      if (category) {
        params.set(`tagtype_${tagIndex}`, 'categories');
        params.set(`tag_contains_${tagIndex}`, 'contains');
        params.set(`tag_${tagIndex}`, String(category));
        tagIndex++;
      }
      if (country) {
        params.set(`tagtype_${tagIndex}`, 'countries');
        params.set(`tag_contains_${tagIndex}`, 'contains');
        params.set(`tag_${tagIndex}`, String(country));
        tagIndex++;
      }
      params.set(`tagtype_${tagIndex}`, 'states');
      params.set(`tag_contains_${tagIndex}`, 'contains');
      params.set(`tag_${tagIndex}`, 'en:front-photo-selected');

      const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${params}`, {
        headers,
        signal: AbortSignal.timeout(15000),
      });
      // The legacy endpoint serves an HTML error page when overloaded —
      // only trust it when it actually returns JSON.
      if (response.ok && (response.headers.get('content-type') || '').includes('json')) {
        const data = await response.json();
        if (data.products?.length > 0) {
          return res.json({
            success: true,
            products: data.products,
            count: data.count || 0,
            page: data.page || safePage,
            page_count: data.page_count || 0,
          });
        }
      }
    } catch (e) {
      console.warn(`Legacy browse failed: ${e.message}`);
    }

    // Attempt 2: Search-a-licious.
    // NOTE: its Lucene parser cannot combine MULTI-WORD free text with tag
    // filters (the text gets mangled and returns 0 hits), so:
    //  - text queries → search by text only, over-fetch, filter tags ourselves
    //  - filter-only queries → pure tag expression (parses fine) + popularity sort
    const hasText = query && String(query).trim();
    const hasCuratedPhoto = (h) => {
      const states = h.states_tags || [];
      return states.includes('en:front-photo-selected') || states.includes('en:photos-validated');
    };

    if (hasText) {
      const saliciousParams = new URLSearchParams({
        q: String(query).trim(),
        langs: 'en',
        page: String(safePage),
        page_size: '50',
        fields: OFF_SEARCH_FIELDS,
      });
      const saliciousResponse = await fetch(`https://search.openfoodfacts.org/search?${saliciousParams}`, {
        headers,
        signal: AbortSignal.timeout(15000),
      });
      if (saliciousResponse.ok) {
        const saliciousData = await saliciousResponse.json();
        if (Array.isArray(saliciousData.hits)) {
          const catTag = category ? toOffTag(category) : null;
          const cntTag = country ? toOffTag(country) : null;
          const filtered = saliciousData.hits.filter((h) => {
            if (catTag && !(h.categories_tags || []).includes(catTag)) return false;
            if (cntTag && !(h.countries_tags || []).includes(cntTag)) return false;
            return hasCuratedPhoto(h);
          });
          return res.json({
            success: true,
            products: filtered.slice(0, safePageSize).map(fromSaliciousHit),
            count: filtered.length,
            page: safePage,
            page_count: filtered.length > 0 ? safePage : 0,
          });
        }
      }
    } else {
      const parts = [];
      if (category) parts.push(`categories_tags:"${toOffTag(category)}"`);
      if (country) parts.push(`countries_tags:"${toOffTag(country)}"`);
      parts.push('states_tags:"en:front-photo-selected"');

      const saliciousParams = new URLSearchParams({
        q: parts.join(' AND '),
        langs: 'en',
        page: String(safePage),
        page_size: String(safePageSize),
        sort_by: '-unique_scans_n',
        fields: OFF_SEARCH_FIELDS,
      });
      const saliciousResponse = await fetch(`https://search.openfoodfacts.org/search?${saliciousParams}`, {
        headers,
        signal: AbortSignal.timeout(15000),
      });
      if (saliciousResponse.ok) {
        const saliciousData = await saliciousResponse.json();
        if (Array.isArray(saliciousData.hits)) {
          return res.json({
            success: true,
            products: saliciousData.hits.map(fromSaliciousHit),
            count: saliciousData.count || 0,
            page: saliciousData.page || safePage,
            page_count: saliciousData.page_count || 0,
          });
        }
      }
    }

    res.json({ success: true, products: [], count: 0, page: 1, page_count: 0 });
  } catch (error) {
    console.error('OpenFoodFacts browse error:', error);
    res.status(500).json({ success: false, error: 'Failed to browse OpenFoodFacts' });
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
// SCAN ANALYTICS
// =====================================================

const scanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many scan logs - slow down' },
});

/**
 * POST /api/scans — public, fire-and-forget from the client. Logs one scanned
 * product. Body: { barcode?, name, brand?, ecoGrade?, country?, anonId? }.
 */
app.post('/api/scans', scanLimiter, smallBody, (req, res) => {
  try {
    const { barcode, name, brand, ecoGrade, country, city, anonId } = req.body || {};
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, error: 'name is required' });
    }
    // SQLite "most-scanned" counter (internally no-ops if unavailable).
    recordScan({ barcode, name, brand, ecoGrade, country, anonId });
    // Rich Postgres log of every scan (no-ops if DATABASE_URL unset/unreachable).
    logScan({ source: 'scan', userId: anonId, productName: name, brand, barcode, ecoGrade, country, city });
    // Only fail if BOTH stores are unavailable.
    if (!scanDb && !scanStoreReady()) {
      return res.status(503).json({ success: false, error: 'Scan logging unavailable' });
    }
    res.json({ success: true });
  } catch (e) {
    console.error('scan log error:', e.message);
    res.status(500).json({ success: false, error: 'Failed to log scan' });
  }
});

/**
 * GET /api/admin/scans?q=&limit= — admin-gated (admin password only, same as
 * the OpenAI logs and flag submissions). Returns totals + most-scanned
 * products (grouped by barcode, falling back to name). Read privately via
 * scripts/pull-scans.sh. Read-only: never deletes or mutates any scan.
 */
app.get('/api/admin/scans', requireAdmin, (req, res) => {
  if (!scanDb) return res.status(503).json({ success: false, error: 'Scan DB unavailable' });
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 500, 1), 5000);
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const totals = scanDb
      .prepare("SELECT COUNT(*) AS totalScans, COUNT(DISTINCT COALESCE(NULLIF(barcode, ''), name)) AS uniqueProducts FROM scans")
      .get();

    const where = q ? 'WHERE name LIKE @like OR brand LIKE @like OR barcode LIKE @like' : '';
    const products = scanDb.prepare(`
      SELECT COALESCE(barcode, '') AS barcode,
             name,
             MAX(brand)     AS brand,
             MAX(eco_grade) AS ecoGrade,
             COUNT(*)       AS count,
             MAX(ts)        AS lastSeen
      FROM scans
      ${where}
      GROUP BY COALESCE(NULLIF(barcode, ''), name)
      ORDER BY count DESC, lastSeen DESC
      LIMIT @limit
    `).all(q ? { like: `%${q}%`, limit } : { limit });

    res.json({
      success: true,
      totalScans: totals.totalScans,
      uniqueProducts: totals.uniqueProducts,
      products,
    });
  } catch (e) {
    console.error('scan query error:', e.message);
    res.status(500).json({ success: false, error: 'Failed to query scans' });
  }
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
