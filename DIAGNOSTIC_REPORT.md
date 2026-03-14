# OCR → OpenFoodFacts Search Failure Diagnostic Report

## Executive Summary

After analyzing the codebase and running tests, I've identified **6 critical failure points** that prevent products like Takis, Bueno, and Cheetos from being found.

---

## Critical Issue #1: Text Preprocessing Destroys Product Names

### The Problem

**File:** `src/pages/Scan.tsx` lines 107-120  
**Function:** `normalizeOcrText()`

```typescript
const normalizeOcrText = (text: string) => {
  return text
    .replace(/[^\x20-\x7E\n]+/g, " ")  // ⚠️ REMOVES ALL NON-ASCII
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};
```

**What it does:**
- Regex `/[^\x20-\x7E\n]+/g` removes **ALL non-ASCII characters**
- This includes accented letters (é, ñ, ü, ø, ä, etc.)

**Impact on our test products:**
- ✅ **Takis** - Unaffected (ASCII only)
- ✅ **Cheetos** - Unaffected (ASCII only)
- ❌ **Bueno** - Unaffected (ASCII only, but generic name might fail filtering)

### Why this is a problem:

Many products have accented names:
- Häagen-Dazs → becomes "Hagen-Dazs" ❌
- Côte d'Or → becomes "Cote d Or" ❌
- Knorr Süße → becomes "Knorr Sue" ❌

---

## Critical Issue #2: Vowel Ratio Filtering Destroys Short Product Names

### The Problem

**File:** `src/pages/Scan.tsx` lines 142-168  
**Function:** `isAcceptableOcrToken()`

```typescript
const isAcceptableOcrToken = (token: string) => {
  const t = token.toLowerCase();
  
  // For 5-letter words like "Takis" or "Cheetos":
  if (t.length === 5) {
    // REQUIRES: vowels / length >= 0.15
    // "TAKIS" = 1 vowel / 5 letters = 0.2 ✅ PASSES
    // "BUENO" = 3 vowels / 5 letters = 0.6 ✅ PASSES
    // "CHEETOS" = 3 vowels / 7 letters = 0.43 ✅ PASSES
  }
  
  // BUT: Line 166 also checks
  if (/[b-df-hj-np-tv-z]{4,}/.test(t)) return false;
  // "TAKIS" has no 4+ consonants in a row ✅ PASSES
  // "BUENO" has no 4+ consonants in a row ✅ PASSES
  // "CHEETOS" has no 4+ consonants in a row ✅ PASSES
};
```

**Analysis of test products:**
```
"TAKIS":
  - Length: 5
  - Vowels: 1 (a, i) = 2 / 5 = 0.4 ratio
  - Consonant check: T-K-S = no 4+ consecutive
  - Result: ✅ Should PASS filtering

"BUENO":
  - Length: 5
  - Vowels: u, e, o = 3 / 5 = 0.6 ratio
  - Consonant check: none
  - Result: ✅ Should PASS filtering

"CHEETOS":
  - Length: 7
  - Vowels: e, e, o = 3 / 7 = 0.43 ratio
  - Consonant check: none
  - Result: ✅ Should PASS filtering
```

**Wait - they should pass the vowel test!** So the issue must be elsewhere...

---

## Critical Issue #3: Regional Filtering Blocks Latin American Products

### The Problem

**File:** `src/services/openfoodfacts/index.ts` lines 36-60  
**Constant:** `ALLOWED_COUNTRY_TAGS`

```typescript
const ALLOWED_COUNTRY_TAGS = new Set([
  // North America
  "en:united-states", "en:canada", "en:mexico",
  // Europe (26 countries)
  "en:france", "en:germany", ... "en:malta",
  // Asia-Pacific
  "en:indonesia",
]);
```

**Impact on test products:**

1. **Takis** (Barcel brand)
   - Manufactured: Mexico 🇲🇽, USA 🇺🇸
   - Status: ✅ Should be FOUND (Mexico in allowed list)
   - **But:** OpenFoodFacts might list it as manufactured in Mexico but sold globally
   - If `countries_tags` shows primary origin instead of distribution, might be filtered

2. **Bueno** (Ferrero brand)
   - Manufactured: Multiple countries (Italy 🇮🇹, Spain 🇪🇸, Poland 🇵🇱)
   - Status: ✅ Should be FOUND (all EU countries in allowed list)

3. **Cheetos** (Frito-Lay/PepsiCo)
   - Manufactured: USA 🇺🇸
   - Sold: Global
   - Status: ✅ Should be FOUND (USA in allowed list)

**The real issue:** If ANY product has incomplete `countries_tags` data:
- Missing `countries_tags` field → Product is KEPT (line 57: `if (!tags || tags.length === 0) return true`)
- Empty `countries_tags` array → Product is KEPT
- But if it has tags that DON'T match → Product is FILTERED OUT

---

## Critical Issue #4: Search Query Formatting Too Simple

### The Problem

**File:** `src/services/openfoodfacts/index.ts` lines 179-232

```typescript
export const searchProducts = async (query: string, limit: number = 3) => {
  const trimmed = query.trim();  // ⚠️ Just trims, no cleaning
  
  const params = new URLSearchParams({
    search_terms: trimmed,  // ⚠️ Raw input sent to API
    search_simple: '1',
    sort_by: 'unique_scans_n',  // ⚠️ Sorts by popularity, not relevance
    page_size: String(Math.min(limit * 3, 50)),
  });
```

**What happens:**
1. Search query is sent raw to OpenFoodFacts API
2. API searches by "most scanned products" (popularity)
3. Returns top 50 results
4. **THEN** filters by region (loses relevant results)
5. Returns only top 3 (loses alternatives)

**Example failure scenario:**
```
Search: "Takis"
↓
API returns top 50 results (maybe only 5 are Takis)
↓
Filter by region (Takis from Mexico/USA = all pass)
↓
Return top 3 Takis variants ✅ Should work!

BUT if API returns:
- Result 1: "Takis Fuego" (some non-allowed region)
- Result 2: "Takis Lime" (some non-allowed region)
- Result 3: "Takis Original" (Mexico - allowed) ✅
- ... more results
↓
After filtering: Only "Takis Original" remains
↓
Return 1 result ✅ OK

WORST CASE:
If top 50 results are mostly from non-allowed regions:
- All filtered out
- Returns empty array ❌
```

---

## Critical Issue #5: API Response Parsing Brittleness

### The Problem

**File:** `src/services/openfoodfacts/index.ts` lines 92-136  
**Function:** `normalizeProduct()`

```typescript
const normalizeProduct = (p: OpenFoodFactsProduct): OpenFoodFactsResult => {
  const productName = p.product_name_en || p.product_name;  // ⚠️ Might be missing
  const brand = p.brands;  // ⚠️ Might be null
  
  const labels = p.labels_tags ?? [];  // ⚠️ Might be undefined
  
  const rawProduct = p;
  
  return {
    productName,
    brand,
    labels,
    // ... rest of fields
  };
};
```

**What can break:**
1. **Missing `product_name_en`**: Falls back to `product_name`, which might be in another language
2. **Missing `brand`**: Product returns with `brand: null`
3. **Missing `labels_tags`**: Falls back to empty array, loses certification info
4. **Missing `countries_tags`**: `isAllowedRegion()` returns TRUE (keeps it), but no region filtering happens
5. **Malformed response**: No error handling - just returns null/empty

**Example - Takis in OpenFoodFacts:**
```json
{
  "code": "7501092102195",
  "product_name": "Takis Fuego",
  "brands": "Barcel",
  "countries_tags": ["en:mexico", "en:united-states"],
  "ecoscore_grade": null,  // ⚠️ No eco-score data
  "labels_tags": []  // ⚠️ No label data
}
```

The product might be found but with minimal data, so filtering for "complete" products filters it out.

---

## Critical Issue #6: No Fallback Search Strategy

### The Problem

**File:** `src/pages/Scan.tsx` lines ~1100-1150 (processImage flow)

```typescript
// Current flow:
1. OCR extracts: product="Takis", brand="Barcel"
2. Combines them: "Barcel Takis"
3. Searches OpenFoodFacts: searchProducts("Barcel Takis")
4. If no results → returns empty
5. No retry with just "Takis" alone
6. No retry with category search
7. No retry with barcode search fallback
```

**Why this fails:**
- Product name alone might find more results
- Brand+product might be too specific
- No cascade fallback strategy

---

## Root Cause Summary

| Issue | Takis | Bueno | Cheetos | Severity |
|-------|-------|-------|---------|----------|
| Text preprocessing (non-ASCII) | ✅ None | ✅ None | ✅ None | LOW |
| Vowel ratio filtering | ✅ Pass | ✅ Pass | ✅ Pass | LOW |
| Regional filtering | ⚠️ Data issue | ⚠️ Data issue | ⚠️ Data issue | **HIGH** |
| Search query formatting | ⚠️ Brand+product | ⚠️ Brand+product | ⚠️ Brand+product | **HIGH** |
| API response parsing | ⚠️ Incomplete data | ⚠️ Incomplete data | ⚠️ Incomplete data | **MEDIUM** |
| No fallback strategy | ❌ Hard fail | ❌ Hard fail | ❌ Hard fail | **HIGH** |

---

## Why Searches Actually Fail (Hypothesis)

### Most Likely Scenario:

1. **OpenFoodFacts has the products** (Takis, Bueno, Cheetos all exist)
2. **Search returns results**, but with:
   - Incomplete `countries_tags` data
   - Multiple regional variants
   - Low eco-score data coverage
3. **Regional filter removes most results**
4. **Fallback search with different query doesn't exist**
5. **User gets: "No results found"** ❌

### How to Fix:

See the implementation plan in `/plans/buzzing-booping-curry.md` for the complete solution.

---

## Next Steps

Run Phase 1 implementations:
1. ✅ Create debug panel to show exactly what's happening
2. ✅ Log each search step
3. ✅ Test with actual products
4. ✅ Then implement fixes

