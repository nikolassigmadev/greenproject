# Phase 1 Completion Report
Generated: 2026-04-29

---

## Status: COMPLETE

All 7 steps of the Phase 1 plan have been executed. The app builds with zero TypeScript errors.

---

## Verified flags vs pending flags

| Status | Count | Notes |
|--------|-------|-------|
| `verified` | 26 | Meet sourcing bar, shown in production |
| `pending_review` | 9 | Not shown to users until additional sourcing is confirmed |
| **Total** | **35** | (1 parent flag, Twinings/ABF, consolidates Maxwell House alias — net 35 unique flag objects vs 36 originally because Maxwell House now lives as an alias on the Kraft Heinz entry) |

---

## Brands now in `pending_review` — human research todo list

These flags exist in the database but are **not shown to users**. Each needs additional sourcing before it can go live.

| Brand | Current gap | Where to look |
|-------|-------------|---------------|
| **Lindor** | Swiss TV only (1×tier3). Needs any tier-2 confirmation of Lindt cocoa supply chain child labour. | KnowTheChain Cocoa Benchmark, BHRRC Lindt company profile, Walk Free Global Index |
| **Ghirardelli** | Swiss TV only (1×tier3). Same Lindt parent company gap. | As above — cite parent company finding + establish subsidiary relationship via tier-2 |
| **Russell Stover** | Swiss TV only (1×tier3). Same Lindt parent company gap. | As above |
| **Starbucks** | 1×tier2 (BHRRC) + 1×tier3 (Channel 4). Needs 1 more tier-3 or a second independent tier-2. | ILO, Rainforest Alliance audit findings, KnowTheChain Coffee Benchmark, any corroborating Channel 4 follow-up |
| **Tetley** | 1×tier2 (BHRRC) + 1×tier3 (BBC). Needs 1 more tier-3 or a second independent tier-2. | Ethical Tea Partnership reports, Oxfam Behind the Brands (Tata Consumer Products), ILO tea sector reports |
| **Lavazza** | 2×tier3 (Reporter Brasil + Danwatch). Needs 1 tier-2. | ILO, BHRRC Lavazza profile, KnowTheChain Coffee Benchmark, Slow Food reports |
| **Chicken of the Sea** | 1×tier2 (Greenpeace) + 1×tier3 (AP). Needs 1 more. | Environmental Justice Foundation seafood reports, ILO fishing vessel reports, Humanity United |
| **Del Monte** | 1×tier2 (HRW 2002). Needs a second independent tier-2 or a tier-1. | BHRRC, Oxfam banana industry report, any updated HRW or Amnesty banana supply chain coverage |
| **Danone** | 1×tier2 (Oxfam 2013). Needs a second independent tier-2. | KnowTheChain Food & Beverage Benchmark (Danone appears), BHRRC Danone profile, any post-2013 Oxfam update |

**Also outstanding for ALL flags:** Source URLs are currently `""`. Every `FlagSource.url` in `brandFlags.v2.ts` needs a real URL populated before any flag can be considered fully URL-verified. See `docs/migration-report.md` for the per-flag source list.

---

## Decisions made that may warrant review

1. **OECD NCP complaint (Illy) classified as tier-1.** OECD National Contact Points are official government-affiliated dispute mechanisms, not NGOs. This puts them at tier-1 (`regulatory_finding`). If you prefer a more conservative classification, downgrade to tier-2 — this would move Illy to `pending_review`.

2. **Lindt corporate admission classified as tier-1.** Lindt's own 2023 sustainability report disclosed 87 child workers found in audits. This is classified as `corporate_admission` (tier-1). The underlying source needs its exact URL populated to confirm the disclosure language.

3. **Lindor / Ghirardelli / Russell Stover are separate flags, not aliases of Lindt.** The plan called for sub-brand aliases to be consolidated. However, these three brands have their own distinct public-facing identity and are purchased by consumers who may not know they're owned by Lindt. They were kept as separate `pending_review` flags so they can be independently sourced and verified. If you prefer to merge them into the Lindt entry as `brandAliases`, that would reduce the pending count by 3.

4. **`lastVerified` date is the migration date, not a live URL check.** Because the original data had no URLs, no HEAD-request verification was possible. All `lastVerified: '2026-04-29'` dates reflect the migration date, not actual link checks.

5. **Bumble Bee lawsuit (2025) classified as tier-1.** The 2025 San Diego federal lawsuit is a real filed court case. However, it is a civil complaint — not a verdict. If you prefer conservative classification, downgrade to tier-2 (`ngo_report` or pending verification until verdict). Currently it gives Bumble Bee `verified` status.

---

## Files changed

### New files created
| File | Purpose |
|------|---------|
| `src/types/brandFlag.ts` | New citation schema, type guards, sourcing bar comment |
| `src/data/brandFlags.v2.ts` | Migrated flag data (36 entries, structured sources) |
| `src/data/brandFlags.legacy.ts` | Original file, deprecated, not imported anywhere |
| `src/services/brandFlags/index.ts` | Runtime read layer — filters to verified-only for consumers |
| `src/pages/Methodology.tsx` | Public methodology page at `/methodology` |
| `src/pages/AdminDisputes.tsx` | Admin dispute queue at `/admin/disputes` |
| `src/components/ReportIssue.tsx` | Report-an-issue modal, wired into LaborFlagBanner |
| `docs/data-audit.md` | Step 1 inventory audit |
| `docs/migration-report.md` | Step 3 migration report |
| `docs/dispute-sla.md` | 14-day dispute response commitment |
| `docs/phase-1-completion-report.md` | This file |

### Modified files
| File | Change |
|------|--------|
| `src/components/LaborFlagBanner.tsx` | Accepts `BrandFlagV2`, renders structured sources, adds methodology link, adds ReportIssue trigger |
| `src/components/OpenFoodFactsCard.tsx` | Uses `getVerifiedFlagForBrand()` from service instead of legacy `getBrandFlag()` |
| `src/pages/Database.tsx` | Uses `getVerifiedFlagForBrand()` from service |
| `src/router.tsx` | Added `/methodology`, `/admin/disputes` routes |
| `.env.example` | Added `VITE_DISPUTE_ENDPOINT`, `VITE_DISPUTE_EMAIL` |

### NOT modified (as required by plan)
- `src/data/brandFlags.ts` — original file untouched. Rename to `.legacy.ts` and delete manually after reviewing migration.

---

## TODOs remaining in code

- `// TODO: populate url fields` — all `FlagSource.url` fields in `brandFlags.v2.ts` are `""`. Requires human research.
- `AdminDisputes.tsx` — "No backend wired yet" placeholder. Wire to a real backend when ready.
- `ReportIssue.tsx` — submissions stored in `localStorage` only (no persistence beyond the browser session on the user's device). Wire `VITE_DISPUTE_ENDPOINT` to a real API.

---

## Out of scope (not done, by design)

- Automated source ingestion from external datasets
- Crowdsourced moderation pipeline
- Any change to OCR or OpenFoodFacts integration
- Any change to product-level scoring rubrics
- Marketing / share screens / viral loops
