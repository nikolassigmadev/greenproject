# Flag status reconciliation (Step 0)

**Measured 2026-08-18 against `src/data/brandFlags.v2.ts`.** The dataset is the
source of truth; the docs were treated as stale until proven otherwise, and they
were stale.

## Result

| Check | Count |
| --- | --- |
| Total flags | 35 |
| Status `verified` | **35** |
| Status `pending_review` | **0** |
| Fails `meetsSourcingBar()` | **0** |
| Has an empty source URL | **0** |
| **`verified` but below the bar (would ship unsourced)** | **0** |

Sources: 88 total — 36 tier-1, 31 tier-2, 21 tier-3.

The last row was the urgent one. A flag marked `verified` that does not clear
`meetsSourcingBar()` would be an unsourced claim shipping to users about a named
company. There are none.

## What this means for the SEC EDGAR brief

**Steps 1–3 are unnecessary and were not built.**

That brief was scoped to find one additional qualifying source for each of nine
flags stuck in `pending_review`. There are no such flags. Every flag already
clears the bar — 36 tier-1 sources across 35 flags, and a tier-1 source clears
it alone.

Building the EDGAR search would have produced candidate sources for flags that
do not need them. The brief anticipated this exact outcome and asked to be told
in ten minutes rather than at the end of the day.

## Why the docs disagreed

`docs/phase-1-completion-report.md` (2026-04-29) listed nine `pending_review`
flags with empty source URLs. That was true when written. Phase 2 populated the
URLs and resolved the statuses on 2026-05-05, and the report was never updated.

That stale document has now been reported back as a critical finding **three
separate times** — twice as "the single biggest launch risk you have". It has
since been deleted from the working tree (it survives in git history). This file
and [`source-link-check.md`](source-link-check.md) replace it: the measurement
rather than the assertion.

## Reproducing

The Step 0 script was a throwaway and has been deleted. To re-measure, the
checks are: count by `status`; any flag where `status !== 'verified'`; any flag
where `meetsSourcingBar()` is false; any source with `url === ''`; and the
intersection of `verified` with below-the-bar.

Two standing harnesses already cover adjacent ground:

- [`source-link-check.md`](source-link-check.md) — are the URLs live
- `src/test/flagStaleness.test.ts` — has anything gone stale or been resolved
  (fails the build; next review due in 71 days)

## What is actually open on sourcing

Not "find more sources". The real gaps, in order:

1. **Six URLs cannot be checked automatically** (dol.gov ×2, NYT ×2, OECD Watch,
   Washington Post) — 403 or timeout to bot traffic. They back forced- and
   child-labour findings against named companies and need one human browser
   pass. See `source-link-check.md`.
2. **`companyResponse` is empty on all 35 flags.** The field exists; no entries.
   This is the strongest available legal position and the cheapest to improve.
3. **Boycott data is not tiered.** `boycottBrands.ts` fires on ~17% of scanned
   products and is campaign-sourced, presented at the same visual weight as
   court records.
