# Migration Report — brandFlags.ts → brandFlags.v2.ts
Generated: 2026-04-29 | brandFlags.ts has NOT been deleted or modified.

---

## Summary

| Metric | Count |
|--------|-------|
| Unique flag objects migrated | 36 |
| Brand alias keys consolidated | ~233 |
| Flags set to `verified` | 26 |
| Flags set to `pending_review` | 9 |
| Flags with empty `sources[]` | 0 |
| Source URLs populated | 0 (all `url: ""` — requires human research) |

---

## Key migration decisions

### 1. Source URLs are unpopulated
The original `brandFlags.ts` used plain string descriptions for sources (e.g., `"Washington Post — cocoa child labor investigation (2019)"`), not structured objects with URLs. As a result, no HEAD-request URL verification was possible. Every `FlagSource.url` is set to `""`. This means **no flag has been URL-verified**, and the `lastVerified` date on "verified" flags reflects the migration date, not a live link check.

**Action required:** For each verified flag, a human researcher must locate and populate the correct URL for each source before the flag can be considered fully defensible.

### 2. Status is set on sourcing-bar analysis, not URL verification
Because URL verification was impossible (no URLs in original data), `status` was set based on whether the cited sources — classified by publisher name — provisionally meet the sourcing bar. Flags marked `verified` could be downgraded to `pending_review` during URL research if a source turns out to be a dead link or misclassified.

### 3. Sub-brand aliases consolidated into parent flag
The original file had ~233 flat registry keys (e.g., `"oreo"`, `"chips ahoy"`, `"cadbury"` all pointing to `MONDELEZ_FLAG`). The v2 file consolidates all aliases into the `brandAliases` array on the parent flag. This reduces duplication and makes flag management cleaner.

### 4. `maxwell house` is now an alias of `kraft-heinz`
In the original file, `"maxwell house"` pointed to `KRAFT_HEINZ_FLAG`. In v2 it is listed as an alias on the Kraft Heinz entry rather than a separate flag.

### 5. Tier classification rationale
- DOL TVPRA List entries → `tier1` (`government_report`)
- US CBP Withhold Release Orders → `tier1` (`regulatory_finding`)
- Court filings (lawsuits, Supreme Court cases, federal verdicts) → `tier1` (`court_filing`)
- Lindt's own corporate disclosure admitting child workers → `tier1` (`corporate_admission`)
- OECD NCP complaint (Italy, re: Illy) → `tier1` (`regulatory_finding`) — OECD NCPs are official government-affiliated dispute mechanisms
- Amnesty International, HRW, Oxfam, Greenpeace, BHRRC, RAN, Green America, Global Labor Justice-ILRF, Corporate Accountability Lab → `tier2` (`ngo_report`)
- BBC, Guardian, AP, Washington Post, Channel 4, Swiss TV Rundschau, NYT, Danwatch, Reporter Brasil, Investigate Midwest, NPR → `tier3` (`investigative_journalism` or `news_report`)

---

## Per-flag migration table

| Brand | Old severity | New status | Reason |
|-------|-------------|------------|--------|
| Nestlé | critical | verified | US Supreme Court case (tier1) + DOL TVPRA (tier1) |
| Mars | critical | verified | IRA lawsuit (tier1) + DOL TVPRA (tier1) |
| Hershey | critical | verified | IRA lawsuit (tier1) + DOL TVPRA (tier1) |
| Mondelēz | critical | verified | IRA lawsuit (tier1) + DOL TVPRA (tier1) |
| Ferrero | critical | verified | DOL TVPRA (tier1) |
| Lindt | high | verified | Corporate admission in own report (tier1) |
| **Lindor** | high | **pending_review** | Swiss TV only (1×tier3) |
| **Ghirardelli** | high | **pending_review** | Swiss TV only (1×tier3) |
| **Russell Stover** | high | **pending_review** | Swiss TV only (1×tier3) |
| Coca-Cola | high | verified | DOL TVPRA sugar (tier1) |
| PepsiCo | high | verified | DOL TVPRA sugar + palm oil (tier1) |
| **Starbucks** | high | **pending_review** | 1×tier2 (BHRRC) + 1×tier3 (Channel 4) — needs 1 more |
| Unilever | high | verified | Amnesty International (tier2) + AP + BBC (2×tier3) = 1t2+2t3 |
| Twinings / ABF | medium | verified | DOL TVPRA sugar (tier1) |
| **Tetley** | high | **pending_review** | 1×tier2 (BHRRC) + 1×tier3 (BBC) — needs 1 more |
| Folgers | medium | verified | DOL TVPRA coffee (tier1) |
| Kraft Heinz (incl. Maxwell House) | medium | verified | DOL TVPRA coffee (tier1) + Amnesty (tier2) |
| **Lavazza** | medium | **pending_review** | 2×tier3 only (Reporter Brasil + Danwatch) |
| Illy | medium | verified | OECD NCP complaint (tier1) |
| Fanjul / ASR Group | critical | verified | US CBP Withhold Release Order (tier1) |
| **Chicken of the Sea** | critical | **pending_review** | 1×tier2 (Greenpeace) + 1×tier3 (AP) — needs 1 more |
| Bumble Bee | critical | verified | Federal lawsuit 2025 (tier1) |
| Tyson | critical | verified | DOL investigation 2022 + 2024 (tier1) |
| JBS | high | verified | DOL investigation (tier1) + DOJ settlement (tier1) |
| Pilgrim's Pride | high | verified | DOL investigation (tier1) |
| Just Bare | high | verified | DOL investigation (tier1) |
| Chiquita | critical | verified | US Federal Court ruling 2024 (tier1) + HRW (tier2) |
| Dole | high | verified | HRW (tier2) + BHRRC (tier2) — 2 independent tier2 |
| **Del Monte** | high | **pending_review** | HRW 2002 only (1×tier2) — needs 1 more |
| Kellogg's / Kellanova | high | verified | Amnesty International (tier2) + Oxfam (tier2) — 2 independent tier2 |
| General Mills | medium | verified | DOL TVPRA (tier1) + Oxfam (tier2) |
| **Danone** | medium | **pending_review** | Oxfam only (1×tier2) — needs 1 more |
| Cargill | critical | verified | IRA lawsuit + Supreme Court case (tier1) |
| Barry Callebaut | critical | verified | IRA lawsuit (tier1) + DOL TVPRA (tier1) |
| Godiva | medium | verified | Green America (tier2) + BHRRC (tier2) — 2 independent tier2 |

---

## Pending review — research todo list

These 9 flags need additional sourcing before they can be shown in production:

| Brand | Gap | Recommended databases to check |
|-------|-----|--------------------------------|
| Lindor | Needs tier-2 confirmation of Lindt cocoa supply | KnowTheChain, BHRRC, Walk Free |
| Ghirardelli | Needs tier-2 confirmation of Lindt cocoa supply | KnowTheChain, BHRRC, Walk Free |
| Russell Stover | Needs tier-2 confirmation of Lindt cocoa supply | KnowTheChain, BHRRC, Walk Free |
| Starbucks | Needs 1 more tier-3 source or 1 more tier-2 source | ILO, BHRRC case tracker, KnowTheChain |
| Tetley | Needs 1 more tier-3 source or 1 more tier-2 source | BHRRC, ILO, Oxfam, Ethical Tea Partnership |
| Lavazza | Needs at least 1 tier-2 source | Reporter Brasil follow-up, ILO, BHRRC, KnowTheChain |
| Chicken of the Sea | Needs 1 more tier-3 source or 1 more tier-2 source | ILO Fishing report, Environmental Justice Foundation |
| Del Monte | Needs 1 more independent tier-2 source | BHRRC, Oxfam, Amnesty International |
| Danone | Needs 1 more independent tier-2 source | KnowTheChain, Oxfam Behind the Brands (post-2013 editions) |

---

## Files created / modified

| Action | File |
|--------|------|
| Created | `src/types/brandFlag.ts` |
| Created | `src/data/brandFlags.v2.ts` |
| Created | `docs/data-audit.md` |
| Created | `docs/migration-report.md` |
| NOT modified | `src/data/brandFlags.ts` (original preserved) |

**Next step:** Step 4 — build the runtime filter service at `src/services/brandFlags/index.ts` and update the three call sites.
