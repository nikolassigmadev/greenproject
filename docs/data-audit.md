# Data Audit — brandFlags.ts
Generated: 2026-04-29 | Read-only. No data was modified.

---

## 1. Current Schema

Each entry in `brandFlags.ts` has:

| Field | Type | Notes |
|-------|------|-------|
| `severity` | `"critical" \| "high" \| "medium"` | No "low" tier currently used |
| `allegation` | `string` | Free-text narrative |
| `sources` | `string[]` | Plain strings — no URL, publisher, tier, or date |

**Missing from current schema (required by new schema):**
- No structured source URL (unverifiable without manual lookup)
- No publisher / source type / tier classification
- No `publishedDate` or `accessedDate`
- No `id` slug
- No `status` (verified / pending / disputed)
- No `lastVerified` date
- No `createdAt` / `updatedAt`
- No `brandAliases` (aliases are handled via flat key duplication instead)
- No `category` (forced_labour, child_labour, etc.)
- No `details` field (allegation serves both summary and detail roles)

---

## 2. Flag Counts by Severity

### Unique flag objects (parent flags)
| Severity | Count |
|----------|-------|
| critical | 12 |
| high     | 15 |
| medium   | 9  |
| **Total unique flags** | **36** |

### Brand registry keys (aliases included)
The flat `brandFlags` record contains approximately **233 keys**, most being sub-brand aliases pointing to a shared parent flag object.

### Parent flag objects by name
**Critical (12):** NESTLE, MARS, HERSHEY, MONDELEZ, FERRERO, FANJUL/ASR, TYSON, Chicken of the Sea, Bumble Bee, Chiquita, Cargill, Barry Callebaut

**High (15):** COCA-COLA, PEPSICO, UNILEVER, KELLOGG, Lindt, Lindor, Ghirardelli, Russell Stover, Starbucks, Tetley, JBS, Pilgrim's Pride, Just Bare, Dole, Del Monte

**Medium (9):** KRAFT HEINZ, GENERAL MILLS, ABF/Twinings, DANONE, Folgers, Maxwell House (via Kraft Heinz flag), Lavazza, Illy, Godiva

---

## 3. Source Coverage

**All 36 unique flag objects have a non-empty `sources` array.** There are no completely unsourced entries. However, sources are plain strings — none have structured metadata (URL, publisher, tier, date).

### Provisional tier classification (by publisher name matching)

| Source string pattern | Provisional tier | Type |
|-----------------------|-----------------|------|
| "U.S. Supreme Court", "Federal Court ruling", "Federal lawsuit" | tier1 | court_filing |
| "U.S. DOL investigation", "U.S. CBP Withhold Release Order", "DOL sanitation subcontractor fine", "OECD complaint" | tier1 | regulatory_finding / government_report |
| "U.S. DOL TVPRA List" | tier1 | government_report |
| "IRA Advocates — cocoa child labor lawsuit", "Nestlé USA, Inc. v. Doe" | tier1 | court_filing |
| "Lindt forced labour report" | tier1 | corporate_admission |
| "Wage-fixing settlement" | tier1 | regulatory_finding |
| "Amnesty International", "Human Rights Watch", "Oxfam", "Greenpeace", "Rainforest Action Network", "Global Labor Justice-ILRF", "Green America", "Business & Human Rights Resource Centre", "Corporate Accountability Lab" | tier2 | ngo_report |
| "AP", "Associated Press", "BBC", "Washington Post", "Guardian", "Channel 4", "NYT", "Swiss TV Rundschau", "Danwatch", "Reporter Brasil", "Investigate Midwest", "NPR" | tier3 | investigative_journalism / news_report |

---

## 4. Provisional Verification Status (against new sourcing bar)

**Sourcing bar:** ≥1 tier-1 source, OR ≥2 independent tier-2 sources, OR ≥1 tier-2 + ≥2 tier-3 sources covering the same finding.

### Likely VERIFIED (26 flag objects)

| Flag | Key sources | Reason |
|------|-------------|--------|
| NESTLE | US Supreme Court 2021, DOL TVPRA | tier1 |
| MARS | IRA lawsuit, DOL TVPRA | tier1 |
| HERSHEY | IRA lawsuit, DOL TVPRA | tier1 |
| MONDELEZ | IRA lawsuit 2021, DOL TVPRA | tier1 |
| FERRERO | DOL TVPRA List | tier1 |
| FANJUL/ASR | U.S. CBP Withhold Release Order (2022) | tier1 |
| TYSON | U.S. DOL investigation (2024), DOL fine (2022) | tier1 |
| KRAFT HEINZ | DOL TVPRA List | tier1 |
| GENERAL MILLS | DOL TVPRA List | tier1 |
| ABF/Twinings | DOL TVPRA List | tier1 |
| COCA-COLA | DOL TVPRA List | tier1 |
| PEPSICO | DOL TVPRA List | tier1 |
| UNILEVER | Amnesty International + AP (tier2 + tier3 ×2) | 1×tier2 + 2×tier3 |
| KELLOGG | Amnesty International + Oxfam (independent) | 2×tier2 |
| Lindt | Lindt corporate admission 2023 + Swiss TV 2024 | tier1 (corporate_admission) |
| Folgers | DOL TVPRA List | tier1 |
| Illy | OECD complaint (2018) | tier1 (regulatory_finding) |
| Bumble Bee | Federal lawsuit San Diego (2025) | tier1 |
| Chiquita | U.S. Federal Court ruling Colombia (2024) | tier1 |
| Dole | Human Rights Watch + BHRRC (independent) | 2×tier2 |
| JBS | U.S. DOL investigation (2022) | tier1 |
| Pilgrim's Pride | U.S. DOL investigation (2022) | tier1 |
| Just Bare | U.S. DOL investigation (2022) | tier1 |
| Cargill | IRA lawsuit + Supreme Court case | tier1 |
| Barry Callebaut | IRA lawsuit + DOL TVPRA | tier1 |
| Godiva | Green America + BHRRC (independent) | 2×tier2 |

### Likely PENDING REVIEW (9 flag objects — need additional sourcing before going live)

| Flag | Current sources | Gap |
|------|-----------------|-----|
| DANONE | Oxfam only (1×tier2) | Needs 1 more independent tier2 or 1 tier1 |
| Lindor | Swiss TV Rundschau only (1×tier3) | Tier3-only; needs tier2 confirmation |
| Ghirardelli | Swiss TV Rundschau only (1×tier3) | Tier3-only; needs tier2 confirmation |
| Russell Stover | Swiss TV Rundschau only (1×tier3) | Tier3-only; needs tier2 confirmation |
| Starbucks | Channel 4 (tier3) + BHRRC (tier2) | 1×tier2 + 1×tier3 — needs 1 more tier3 or 1 more tier2 |
| Tetley | BBC (tier3) + BHRRC (tier2) | 1×tier2 + 1×tier3 — needs 1 more tier3 or 1 more tier2 |
| Lavazza | Reporter Brasil (tier3) + Danwatch (tier3) | 2×tier3 only — needs tier2 |
| Chicken of the Sea | AP (tier3) + Greenpeace (tier2) | 1×tier2 + 1×tier3 — needs 1 more tier3 or 1 more tier2 |
| Del Monte | Human Rights Watch only (1×tier2) | Needs 1 more independent tier2 or 1 tier1 |

**Note:** Lindor, Ghirardelli, and Russell Stover inherit the Lindt flag in the current schema. Under the new schema, they would each need individual sourcing unless they are formally described as Lindt sub-brands in a tier1/tier2 source.

---

## 5. Overlap Analysis

### Brands in both `brandFlags.ts` AND `boycottBrands.ts`

The following brand registry keys appear in both files (sourced from different reasons — labor vs. boycott):

| Brand group | brandFlags severity | Boycott reason |
|------------|--------------------|-|
| Nestlé + sub-brands | critical | Operations in Israel |
| Coca-Cola + sub-brands | high | Operations in Israel |
| PepsiCo + sub-brands | high | SodaStream / operations in Israel |
| Unilever + sub-brands | high | Operations in Israel |
| Starbucks | high | BDS list |

**Implication:** These brands will appear with both a labor flag and a boycott flag. The UI should handle this gracefully (they are separate concerns).

### Brands in both `brandFlags.ts` AND `poorAnimalWelfareCompanies.ts`

| Company | brandFlags flag | Animal welfare severity |
|---------|----------------|------------------------|
| Nestlé | critical (labor) | critical (BBFAW tier 5-6) |
| Mars | critical (labor) | critical (BBFAW tier 6) |
| Tyson | critical (labor) | critical (BBFAW tier 5-6) |
| Mondelēz | critical (labor) | critical (BBFAW tier 5) |
| General Mills | medium (labor) | high (BBFAW tier 5) |
| Kraft Heinz | medium (labor) | moderate (BBFAW tier 4-5) |
| Cargill | critical (labor) | critical (BBFAW tier 5-6) |
| Starbucks | high (labor) | high (BBFAW tier 5) |

**Note:** `poorAnimalWelfareCompanies.ts` is a separate dataset with its own sourcing (BBFAW, World Animal Protection, Humane Society). It is not migrated in Phase 1.

---

## 6. Files Inventoried

| File | Purpose | In-scope for Phase 1? |
|------|---------|----------------------|
| `src/data/brandFlags.ts` | Labor/ethics brand flags | YES — primary migration target |
| `src/data/boycottBrands.ts` | BDS boycott list | NO — separate concern, different schema |
| `src/data/poorAnimalWelfareCompanies.ts` | Animal welfare ratings | NO — out of scope per plan |
| `src/data/livestockScoringGuide.md` | Scoring algorithm doc | NO — product-level, out of scope |
| `src/data/products.ts` | Internal product database | NO — product-level, out of scope |

---

## 7. Call Sites (where brandFlags is imported)

| File | Usage |
|------|-------|
| `src/components/OpenFoodFactsCard.tsx:8` | `getBrandFlag()` — displays flag on product card |
| `src/components/LaborFlagBanner.tsx:3` | Type import `BrandFlag` — renders the flag banner UI |
| `src/pages/Database.tsx:14` | `getBrandFlag()` — used in database/search view |

All three call sites will need updating in Step 4 to use the new service layer.

---

## Summary

- **36 unique flag objects** covering ~233 brand aliases
- **0 entries with empty sources** — all have some sourcing, but all sources are unstructured strings
- **26 flags** provisionally meet the new sourcing bar (verified)
- **9 flags** are provisionally pending_review and need additional sourcing before production
- **3 call sites** to update in Step 4
- **No data was modified.** This is a read-only audit.
