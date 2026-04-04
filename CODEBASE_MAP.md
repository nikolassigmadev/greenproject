# Codebase Map

The app is split into two distinct product sections:

- **Section A — External Scan**: Camera/OCR/barcode scanning powered by OpenAI Vision and OpenFoodFacts APIs
- **Section B — Local Database**: Manually curated product database with ethical scoring algorithms

---

## Section A: External Scan
*Camera scanning, OCR, OpenAI Vision API, OpenFoodFacts API*

This section handles real-time product identification. A user points their camera at a product or types a barcode/brand name. The app either runs OCR via OpenAI or looks up the barcode via OpenFoodFacts, then displays nutritional and environmental data pulled live from external sources.

### Backend

| File | Role |
|------|------|
| `server.js` | Express proxy server. Handles all external API calls (OpenAI Vision, OpenFoodFacts). Exposes `/api/openai/analyze-image`, `/api/openai/chat`, `/api/openfoodfacts/product/:barcode`, `/api/openfoodfacts/search`, `/api/health` |
| `src/config/backend.ts` | Resolves the backend URL depending on environment (dev vs production/Capacitor) |

### Services

| File | Role |
|------|------|
| `src/services/api/backend-client.ts` | Wrapper around backend endpoints — `analyzeProductImage()`, `sendChatMessage()`, `checkBackendHealth()` |
| `src/services/ocr/openai-service.ts` | Calls OpenAI Vision API to extract text from product images — `recognizeImageWithOpenAI()`, `extractProductCode()`, `checkOpenAIConnection()` |
| `src/services/ocr/advanced-openai-ocr.ts` | Advanced product OCR: extracts brand name, product name, certifications from image — `advancedProductOCR()`, `checkOpenAIHealth()` |
| `src/services/openfoodfacts/index.ts` | Main OpenFoodFacts client with caching (5min TTL), retry logic, and backend/direct API fallback — `lookupBarcode()`, `searchProducts()`, `browseProducts()`, `searchBetterAlternatives()` |
| `src/services/openfoodfacts/types.ts` | TypeScript types for OpenFoodFacts API responses (eco-score, nutri-score, carbon footprint, etc.) |

### Pages

| File | Role |
|------|------|
| `src/pages/Scan.tsx` | Main scan UI (1,935 lines). Camera capture, barcode input, OCR pipeline, product search, results display. Orchestrates both OpenAI OCR and OpenFoodFacts lookup |
| `src/pages/OpenFoodFactsDetail.tsx` | Detail page for products found via OpenFoodFacts. Shows eco-score, nutri-score, carbon footprint, labor risk. Saves to scan history |
| `src/pages/Database.tsx` | Browseable OpenFoodFacts product database with filters. Calls `browseProducts()` |

### Components

| File | Role |
|------|------|
| `src/components/OpenFoodFactsCard.tsx` | Displays OpenFoodFacts product data card (eco-score, carbon, nutri-score) |
| `src/components/EnvironmentalImpactCard.tsx` | CO₂ lifecycle breakdown from Agribalyse data |
| `src/components/OCRDebugPanel.tsx` | Debug overlay showing OCR pipeline stages and confidence scores |
| `src/components/NutritionDisplay.tsx` | Nutri-Score display component |

### Utilities

| File | Role |
|------|------|
| `src/utils/barcodeValidator.ts` | Validates and normalises barcodes (EAN-13, EAN-8, UPC-A, ISBN) — `validateAndCleanBarcode()`, `isValidBarcode()`, `getAlternativeFormats()` |
| `src/utils/ocrSearchLogger.ts` | Logs OCR pipeline stages for debugging (barcode validation, extraction, API errors) |
| `src/hooks/useOCRDebug.ts` | State hook for OCR debug panel visibility |


---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
## Section B: Local Database & Scoring
*Manually curated product data, ethical scoring algorithms, IndexedDB, admin panel*

This section is a standalone product knowledge base. Products are manually entered (via the admin panel) with fields for labor risk, animal welfare, carbon footprint, certifications, etc. A multi-dimensional scoring algorithm converts this data into a 0–100 ethical score.

### Core Data

| File | Role |
|------|------|
| `src/data/products.json` | JSON database of ~50+ products with full ethical ratings and carbon data |
| `src/data/products.ts` | Main product scoring logic — `calculateScore()`, `findAlternatives()`, `findLowCO2Alternative()`. Calls into `scoreBreakdown` and `simpleLivestockScoring` |
| `src/data/scoreBreakdown.ts` | Factor-by-factor scoring breakdown: Labor (0–35pts), Animal Welfare (0–30pts), Carbon (0–25pts), Transport (0–10pts), Certifications (0–10pts) — `getScoreBreakdown()` |
| `src/data/simpleLivestockScoring.ts` | Scoring logic for meat/dairy/egg products (animal space, execution method, diet, certifications) |
| `src/data/livestockScoring.ts` | Legacy livestock scoring (likely superseded by simpleLivestockScoring) |

### Ethics Databases

| File | Role |
|------|------|
| `src/data/boycottBrands.ts` | Brand-level boycott data (BDS list, companies with operations flagged for ethical concerns) — `checkBoycott(brand)` |
| `src/data/brandFlags.ts` | Labor allegations database mapped by brand name. Sources: U.S. DOL, HRW, Washington Post. Severity: critical / high / medium |
| `src/data/poorAnimalWelfareCompanies.ts` | BBFAW (Business Benchmark on Farm Animal Welfare) rated companies with poor scores |

### Database & Storage

| File | Role |
|------|------|
| `src/utils/db.ts` | Dexie.js IndexedDB wrapper — `getAllProducts()`, `addProduct()`, `updateProduct()`, `deleteProduct()`, `saveAllProducts()`. Includes migration from localStorage |
| `src/utils/storage.ts` | Legacy localStorage wrapper for product persistence — `saveProducts()`, `loadProducts()`, `clearProducts()` |
| `src/utils/userPreferences.ts` | Stores user priority weights (environment, labor, animal welfare, nutrition) and scan history — `savePriorities()`, `loadPriorities()`, `saveScanToHistory()`, `loadScanHistory()`, `getHistoryStats()` |

### Scoring Utilities

| File | Role |
|------|------|
| `src/utils/animalWelfareFlags.ts` | Flags products from low-BBFAW companies and adjusts scores — `checkAnimalWelfareFlag()`, `adjustScoreForAnimalWelfareFlag()` |

### Pages

| File | Role |
|------|------|
| `src/pages/Products.tsx` | Browse local product database with filtering and score-based sorting |
| `src/pages/ProductDetail.tsx` | Detail page for local database products. Shows score breakdown, labor risk, carbon, certifications. Also fetches OpenFoodFacts data for the same barcode |
| `src/pages/Dashboard.tsx` | Scan history dashboard — total scans, good/moderate/avoid counts, average eco-score, weekly trend |
| `src/pages/Preferences.tsx` | UI for setting user priority weights that affect how scores are weighted |
| `src/pages/Admin.tsx` | Admin panel for adding/editing/deleting products, livestock-specific form, image upload, manual score override |
| `src/pages/AdminLogin.tsx` | Admin panel authentication |

### Components

| File | Role |
|------|------|
| `src/components/ScoreDisplay.tsx` | Circular 0–100 score visualisation |
| `src/components/ScoreBreakdownSlider.tsx` | Factor-by-factor score breakdown bars (labor, animal welfare, carbon, etc.) |
| `src/components/ProductCard.tsx` | Product card for local database listings |
| `src/components/AnimalWelfareFlagBadge.tsx` | BBFAW animal welfare flag badge |
| `src/components/LaborFlagBanner.tsx` | Labor allegations banner |

### Admin Auth

| File | Role |
|------|------|
| `src/utils/adminAuth.ts` | Bcrypt password verification, admin session state — `verifyPassword()`, `isAdminAuthenticated()`, `setAdminAuthenticated()` |
| `src/utils/bcryptHasher.ts` | Password hashing utility |

### Hooks

| File | Role |
|------|------|
| `src/hooks/useProducts.ts` | Simple hook returning the default products array |

---

## Shared (Neither Section)

Infrastructure, navigation, and UI components used across both sections.

### App Shell

| File | Role |
|------|------|
| `src/main.tsx` | React DOM entry point |
| `src/App.tsx` | Root component — wraps app in React Query, Tooltip, Toaster providers |
| `src/router.tsx` | Route definitions for all pages |

### Navigation & Layout

| File | Role |
|------|------|
| `src/components/Header.tsx` | Top navigation bar |
| `src/components/BottomNav.tsx` | Mobile bottom navigation |
| `src/components/NavLink.tsx` | Navigation link with active state |
| `src/components/Footer.tsx` | Footer |
| `src/components/ScrollToTop.tsx` | Resets scroll position on route change |

### Pages

| File | Role |
|------|------|
| `src/pages/Index.tsx` | Home/landing page |
| `src/pages/NotFound.tsx` | 404 page |

### General Utilities

| File | Role |
|------|------|
| `src/lib/utils.ts` | clsx/tailwind-merge helper |
| `src/utils/productExporter.ts` | Export products to file |
| `src/hooks/use-mobile.tsx` | Mobile breakpoint detection hook |

### UI Component Library

`src/components/ui/` — 70+ Shadcn UI components (buttons, inputs, dialogs, tables, cards, toasts, etc.). Not domain-specific.

---

## Files to Clean Up

These files should be deleted — they are duplicates or dev artifacts committed to the repo:

| File | Reason |
|------|--------|
| `src/pages/Scan.tsx.backup` | 73KB backup file committed to source tree |
| `src/pages/adminAuth.ts` | Duplicate of `src/utils/adminAuth.ts` |
| `src/pages/bcryptHasher.ts` | Duplicate of `src/utils/bcryptHasher.ts` |

---

## API & Data Flow Summary

```
User scans product
       │
       ├─── Section A (External) ──────────────────────────────────────┐
       │    Camera → OpenAI Vision OCR → extract brand/barcode         │
       │    Barcode → OpenFoodFacts API → nutritional/eco data         │
       │    Results → OpenFoodFactsDetail page                         │
       │                                                                │
       └─── Section B (Local) ─────────────────────────────────────────┘
            Brand/barcode → match against products.json
            calculateScore() → scoreBreakdown + livestockScoring
            Cross-check brandFlags, boycottBrands, animalWelfareFlags
            Results → ProductDetail page
```
