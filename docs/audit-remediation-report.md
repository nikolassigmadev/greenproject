# Audit remediation — completion report

Branch: `audit/remediation` (16 commits, off `main`)
Date: 2026-08-15
Test suite: 279 passing (was 238), 0 failing
Verdict-audit battery: 0 errors, 211 warnings (was 303)

One commit per numbered item, as requested. The git history is the primary
record; this document explains the reasoning that doesn't fit in commit
messages, and — more importantly — records the things that turned out to be
different from what the audit brief assumed.

---

## What the audit brief got wrong (read this part)

Three findings changed the shape of the work. All three made the project look
worse before they made it better, which is the point.

### 1. The DOL sourcing problem was bigger than four flags

The brief said four tier-1 sources point at the same US DOL general list.

Reality: **15 flags** cite a DOL commodity listing, and **zero** rest on one
alone. The first draft of the new Methodology copy asserted "four of our flags
rest on the DOL list" — that sentence was wrong by an order of magnitude, on
the one page in the app whose entire purpose is being checkable. It was caught
by querying the data instead of trusting the brief.

The published counts are now computed from `brandFlagsV2` at render time, so
they cannot go stale or be wrong again.

### 2. Six homepage citations were in the *verified* dataset, not just `laborCheck.ts`

The brief listed `danwatch.dk/en/`, `hrw.org/`, `fairlabor.org/` and `ran.org/`
— all in `laborCheck.ts`.

The audit script found those four, plus **`business-humanrights.org`** — the
bare front page — used as a single shared source object across **six flags in
`brandFlags.v2.ts`**, the dataset presented to users as tier-sourced and
verified. Each of those six now links its own company dossier (all verified
HTTP 200).

One citation could not be fixed and had to be reattributed rather than
repaired: the Coca-Cola Colombia allegation was credited to Human Rights Watch,
and **no such HRW report could be found**. The underlying events are real and
well documented (the SINALTRAINAL litigation), so the claim survives — but it
now cites a source that actually covers it, rather than an attribution the
project could not stand behind.

### 3. The two labour datasets weren't just "able to" contradict each other — they did, at scale

The brief noted the datasets *can* contradict, citing the warning comment at
the top of `laborCheck.ts`.

Measured: **22 of 33 verified labour flags** matched no scoring regex. A Tyson,
Cargill, Chiquita, Dole or Bumble Bee product rendered a **critical child-labour
banner at the top of the page above a verdict computed as though its labour
record were clean**. Two statements, same app, same screen, same moment,
disagreeing — and nothing in the codebase noticed except a comment asking
whoever edits the file to be careful.

Fixing it removed **92 cross-dataset contradictions** from the verdict-audit
battery (303 warnings → 211, still 0 errors).

### 4. One premise in item 7 was inaccurate

Item 7 said the unweighted verdict is "already computed inside `getVerdict()`
before `personalizedScore()` applies weights". It isn't — `getVerdict()` applies
priority weights inline throughout; there is no unweighted intermediate value to
carry through.

The *intent* was implemented instead: `verdict_base` is the verdict recomputed
at `DEFAULT_PRIORITIES` (all-Medium). Comparing it to `verdict` is what makes
"personalisation changes behaviour" testable, which is what item 7 was for.

---

## P0 — Security

### 1. Hardcoded admin password hash (`5cb0699`)

`server.js` fell back to a bcrypt hash committed to this public repo whenever
`ADMIN_PASSWORD_HASH` was unset — an offline-crackable password for any
deployment that forgot the env var.

- Fallback deleted. `ADMIN_PASSWORD_HASH` or nothing.
- `requireAdmin()` and `/api/admin/login` now return **503** when unset, so the
  admin surface fails **closed** rather than accepting a known password.
- Startup logs a loud warning instead of a quiet `Admin Configured: No`.
- Verified both directions: 503 with no hash configured; correct password → 200
  + token, wrong password → 401, with a hash configured.

**Git history audit** (the brief asked for this):

| Check | Result |
|---|---|
| `.env*` ever committed | No — only `.env.example` |
| Secrets in `HEAD` | None |
| OpenAI keys in history | **One**: `sk-proj-LrgcNhnJhU8T…`, in `ADVANCED_OCR_DOCUMENTATION.md` |
| Is that the current key? | **No** — current key differs, so it was rotated |
| `DATABASE_URL` in history | Never committed |
| `OPENAI_API_KEY` in client bundle | No — not `VITE_`-prefixed, so Vite never inlines it; `dist/` scan clean |

**Still outstanding, and only you can do these:**
- Rotate the **admin password** — the old hash is in git history and is
  trivially crackable offline.
- Confirm the old OpenAI key `sk-proj-LrgcNhnJhU8T…` is actually **revoked** in
  the OpenAI dashboard. A new key existing does not prove the old one is dead.

---

## Telemetry batch — items 3–7 (`a416db3`)

Delivered as one coherent diff across `scanLogger.ts`, `scanStore.js`, the SQL
blob, `DecisionBar.tsx`, `OpenFoodFactsDetail.tsx` and `swaps/index.ts`, as
advised. Six columns in a single `ADD COLUMN IF NOT EXISTS` batch, so one deploy
converges old and new databases.

| Column | What it does |
|---|---|
| `scan_event_id` | UUID minted when the product page opens, stamped on **both** the exposure row and the buy/skip row. Exposure→conversion is now an exact join, not a time-window guess. Partial index. |
| `swap_gap_reason` | `assessUnmetDemand()` now walks the candidate funnel stage by stage and names the one that emptied: `no_candidate_in_catalog` / `wrong_concern` / `failed_clean` / `not_sold_here` |
| `swap_shown` / `swap_clicked` | Availability, rendering and tapping as three separate stages |
| `dwell_ms` | Page open → decision press, clamped at 10 min |
| `verdict_base` | The same verdict at neutral priorities |

**Design decision worth flagging:** `swap_clicked` as a decision-row-only boolean
would have read **~0 exactly when the recommendation worked** — tapping a swap
navigates away, so the decision row for that product never arrives. It needed an
explicit `source='swap_click'` row, whitelisted server-side and excluded from the
SQLite most-scanned counter so it can't double-count.

**Known bias, documented in the code rather than papered over:** `dwell_ms`
starts when product data resolves, which is *before* the one-time legal-consent
gate is dismissed. A user's very first scan includes however long they spent
reading that screen. One inflated row per device — exclude first-per-user rows
if you ever quote a median.

**Caught by running it:** a backtick inside a SQL comment (`` `verdict` ``)
terminated the JS template literal and crashed the server on boot. Found by
smoke-testing rather than by reading the diff.

---

## Correctness fixes — items 8–11

### 8. JPEG validation (`71d0e75`)
`imageData()` checked only length, which accepts any base64-ish blob of roughly
the right size — a text file, a JSON payload, someone else's binary — into a
column the admin view renders. Now: whitespace stripped, base64 alphabet
enforced (`Buffer.from` silently drops characters it dislikes), and the JPEG
magic bytes `FF D8 FF` required. Only the first 4 base64 chars are decoded, so
it stays O(1) on a multi-megabyte string. Confirmed every client capture path
encodes `image/jpeg`, so nothing legitimate is rejected.

### 9. DB CHECK constraints (`ce67a38`)
Nine constraints on `ai_scans` and `community_flags`. Two deliberate choices:

- **`NOT VALID`** — enforced on every INSERT/UPDATE from now on, but existing
  rows aren't re-scanned. `scanStore.js` runs this blob on **every server start**
  and swallows init failures as a warning, so a constraint that legacy data
  violated would silently take scan logging down at boot.
- **Checked against `pg_constraint`** rather than `ADD CONSTRAINT IF NOT EXISTS`,
  which Postgres doesn't have.

Also added **`scripts/verify-schema.mjs`** (`npm run db:verify`): applies the real
blob to a throwaway in-process Postgres (pglite), twice, and asserts every
constraint actually rejects what it claims to. *A constraint that exists but
bites nothing is worse than none — it reads as a guarantee and provides
nothing.* This is what caught the backtick bug.

### 10. JSONL → Postgres reconciliation (`0548129`)
`scripts/reconcile-community-flags.mjs`. Replays through
`insertCommunityFlag()` — now the same function the live request path calls, so
the replay can't drift from the real insert.

Reports drift **in both directions**, plus status drift: a flag approved while
the database was down stays `pending_review` in Postgres forever, because
`ON CONFLICT DO NOTHING` cannot update by definition. `--fix-status` pushes the
JSONL decision across. **Report-only by default** — `DATABASE_URL` usually points
at production, so the safe thing has to be what you get by accident.

Verified end-to-end against a local Postgres: insert, re-run idempotency,
status-drift detection and correction.

### 11. Script rename (`d120506`)
`pull-scans.sh` → `pull-sqlite-counts.sh`. It reads the lightweight popularity
counter, not the rich log. Header and the `/api/admin/scans` docstring now say
which store they read and point at the other one.

---

## New surfaces — items 12–16

### 12. Scan-logging opt-out UI (`df695c2`)
`logScan()` had gated every write on `goodscan-scan-logging-optout` since it was
written, but nothing in the app ever set it. *A privacy control only reachable by
editing localStorage in devtools is not a privacy control.*

Preferences card with a real toggle, plus a specific list of what leaves the
device — written from the actual `ScanLogInput` fields, not a reassuring summary.
It names the photo and the AI reading, because those are the parts a user would
most want to know about and a vague disclosure would omit.

Also surfaces the **anonymous device ID** with a copy button — the only handle a
user has on their own rows, which is what makes the deletion endpoint usable by
an actual person.

Verified in-browser: toggle persists, copy reflects state, and `logScan()` makes
**zero** network requests while opted out (one after opting back in).

### 13. Erasure endpoint (`fb78dd0`)
There was no admin HTTP route onto Postgres at all, so "delete my data" meant
opening the Supabase console and hand-writing a DELETE.

`DELETE /api/admin/scans/:anonId` erases from **both** stores — the rich Postgres
log and the SQLite counter, which also carries `anon_id`. Deleting one and not
the other would report an erasure over a database still holding the rows. `GET`
on the same path previews the count first.

- Behind `authLimiter` as well as `requireAdmin` — the only admin route that
  destroys data.
- **Refuses with 503** if Postgres is unreachable rather than deleting only the
  SQLite half and reporting success.
- Hard delete, no tombstone. Logs the erasure for auditability.
- Added `idx_scans_anon_id` — SQLite had no index on the column erasure keys on.

The Privacy page now tells users the switch and the deletion route exist. *A
deletion route nobody is told about is not a deletion route.*

Verified: 3 rows seeded and erased from both stores, a second device's rows
untouched, 401 without a token, audit line written.

### 14. Skip micro-prompt (`1c71551`)
Pressing Skip is a stated intention, not an outcome — so a shopper who skips in
the app and buys the product anyway was indistinguishable from one who walked
away.

One question after ~1 in 5 skips, three options → `swap_taken`:
`alternative` / `nothing` / `bought_anyway`.

- **"Bought it anyway" is the point of the design.** A prompt with no way to say
  "your advice didn't change what I did" only ever collects agreement.
- Sampled, because asking every time trains people to dismiss it. The roll
  happens once in `decide()`, never during render.
- Asked whether or not we had a swap to offer — when we had nothing, "did you
  find one yourself?" is exactly the ground truth the unmet-demand map lacks.
- Takes over the bar rather than stacking on it: two tap targets at the bottom of
  the screen is how a mis-tap becomes an answer.
- Written as its own `source='swap_outcome'` row carrying the same
  `scan_event_id`, so the log stays append-only.

Verified in-browser on a live product: prompt appears, outcome row carries
`swapTaken` **plus the same `scan_event_id` as the decision row**.

### 15. Miss-corpus clustering (`6e1a99f`)
`scripts/miss-corpus.mjs`. Clusters `resolved = false` rows by cleaned scan text
+ brand token (case-folded, punctuation and pack sizes stripped, so
"Indomie Mi Goreng 85g" and "indomie mi goreng" are one gap) and ranks by
**hits × distinct users**.

That ordering is the whole point: one person rescanning the same failing jar
twenty times is a bug report; something twenty different people hit once is a
coverage gap. Verified against seeded data — a 9-hit single-device retry ranks
*below* a 7-hit gap that four separate devices hit.

### 16. Image retention (`9bf3d00`)
`scripts/prune-scan-images.mjs`. Clears `image` where `resolved = true` and older
than the window (default 30 days). Unresolved rows keep their photos — that's
where they earn their keep. The row is never deleted, only the image.

**Dry run by default.** Prints eligible count, decoded size and the five oldest
rows in scope first. The dry run and the update share **one** `WHERE` clause, so
the preview can't drift from what actually runs. Batched.

Verified: 3 old resolved cleared, 2 old **unresolved kept** (including a
120-day-old one), 2 recent kept, all 7 rows intact.

---

## P1 — Claim integrity

### 2. `claimType` (`23b309a`)

`BrandFlagV2.claimType`: `'direct'` when a source names the company, vs
`'supply_chain_inference'` when the source documents the commodity/region and the
company is linked because it buys from there. Set on all 35 flags: **20 direct,
15 inference**.

`FlagSource.commodityLevel` marks documents that name no company at all. It lives
on the *source* because it's a property of the document; whether a company is
named is *per-flag* (one lawsuit names six defendants and not a seventh), which is
why `claimType` sits on the flag.

**Borderline cases were resolved toward inference** — the weaker claim. Where a
report's subject is a region or sector and the company appears as a buyer
(Amnesty on Wilmar, HRW on Ecuadorian plantations, Oxfam scorecards), that's an
inference even though the company is named in the text.

UI: dashed border, different icon, and **the caveat printed before the summary**.
A qualifier under the accusation is one most people never read. Commodity-level
sources are also marked individually in the source list, since a flag can mix one
document that names the company with three that don't.

Tests enforce the **invariant**, not the label: a flag whose sources are all
commodity-level cannot be `direct`, regardless of tier. Tier-1 sourcing makes the
commodity finding well-evidenced; it does not upgrade the claim.

### 3. Source audit (`0dc232b`)

`scripts/verify-sources.ts` walks all **119 citations** across three datasets,
flags bare domains and section indexes (`/en/`, `/news/` — they change weekly and
won't hold the cited claim next year), checks liveness, writes a CSV.

Found and fixed **11**, including the six in the verified dataset described
above. `docs/source-audit.csv` is the full report.

Remaining non-200s are **403 bot-blocking** (NYT, OECD Watch — fine in a browser)
and one temporary 5xx. The script now says so rather than inviting a bulk
replacement of working links. One genuinely dead link (Thai Union removed the
post) now cites its Internet Archive snapshot, so the document a reader is asked
to check still exists.

**CI**: runs with `--offline`. The homepage check is deterministic and must never
regress; liveness depends on other people's servers and would flake the build for
reasons that aren't ours.

### 4. Dataset reconciliation (`87642c2`)

`brandFlags.v2` is now the single source of truth.
`findLaborAllegations()` tries the hand-written records first — those ten
companies keep their richer prose and their existing verdicts unchanged — then
falls through to the verified flag set, keyed off **exactly the same alias match
that put the banner on screen**.

Also memoised `getVerifiedFlagsForBrand` and hoisted the `isLive` filter: the
fallback put a full dataset scan with per-flag alias regexes on the verdict path,
and the audit battery went from passing to **timing out** the moment it landed.

`labourDatasetReconciliation.test.ts` fails if a verified labour flag ever stops
reaching the score again — including via its aliases, since users scan "KitKat",
not "Nestlé S.A.".

---

## P2 — Honest AI disclosure (`bf6158c`)

### 5. Visual separation

The AI verdict rendered in the same visual language as tier-1-sourced flags,
including a green `ShieldCheck` "high confidence" pill. **That pill was the
model's opinion of itself, styled identically to the badge used for a US
Department of Labor finding.** The more confidently the model asserted something,
the more verified it looked.

- New `AiEstimateBanner`, deliberately **not** built from the same primitives as
  `LaborFlagBanner` — sharing a component is how the two drift back into looking
  alike. Dashed, uncoloured, no badge chip.
- Shown **above** the result. A disclosure under the answer is one most people
  scroll past.
- The confidence self-report is still shown, described as what it is. The model's
  own disclaimer is surfaced instead of dropped.

### 6. Methodology disclosure

New section 05, "Where AI Is Used": which model (GPT-4o-mini), what it produces,
that **none of it is cited**, and a side-by-side of how to tell the two apart on
screen. Plus the coverage limitation stated plainly — 35 verified brands, and for
most products you scan what you're reading is an estimate, not a sourced finding.

Also new section 04, "What a Flag Actually Claims", documenting the
direct/inference distinction with counts derived from the data.

---

## Not done

Four items remain. None were started, so there's no half-finished state.

| Item | Why |
|---|---|
| **P3-7** PWA shareability | The core of it — install on a real Android and iOS device, test `AddToHomeScreen` on a phone that isn't yours — is physical-device work I can't do. The code parts (Onboarding audit, a visible feedback route on every screen) are still open. |
| **P3-8** Behaviour-change measurement + admin view | The **data layer is now done** — `swapTracking.ts` plus `scan_event_id`, `swap_shown/clicked`, `swap_taken` and the opt-in from item 12. What's missing is the admin view showing users / scans / swaps / swap rate. |
| **P4-9** Indonesian coverage | A day of data-sourcing work: `INDONESIA` region, 20–30 Balinese products under the existing tier system, Bahasa strings. `scripts/miss-corpus.mjs` (item 15) is the right way to pick which products — run it once you have real scans rather than guessing the list. |
| **Item 17** Split `server.js` | Explicitly flagged in the brief as "not while other work is in flight". Sixteen commits of other work were in flight. It's now ~2,290 lines. |

### One thing I noticed and did not change

In `SwapSuggestions.tsx`, tapping a secondary alternative that has a barcode
navigates to it **without** calling `recordSwap()` — only the explicit "Switch"
CTA counts as an accepted swap. That may well be deliberate, but it means the
impact number undercounts.

I added click *telemetry* to both paths (so `swap_clicked` is accurate) but did
**not** change what counts as an accepted swap, because silently inflating an
impact metric is exactly the kind of thing this audit exists to prevent. Your
call.

---

## Verification summary

Nothing in this branch was marked done on the strength of reading the diff.

| Item | How it was verified |
|---|---|
| P0 admin | Live server, both directions (503 unset / 200 + 401 with hash) |
| Telemetry | Live server; 4 POSTs; SQLite skip confirmed for `swap_click` |
| Schema + constraints | Real Postgres (pglite), applied twice, 18 enforcement cases |
| Reconciliation script | Local Postgres: insert, idempotency, status drift, correction |
| Retention job | Seeded 7 rows across 3 categories; verified exactly the right 3 cleared |
| Miss corpus | Seeded corpus; confirmed hits×users beats raw frequency |
| Opt-out UI | Browser; 0 network requests while opted out |
| Erasure | Both stores; other device untouched; 401 unauthenticated |
| Skip prompt | Browser, live product; join key matched across rows |
| Claim types | 12 tests incl. the commodity-level invariant |
| Source audit | 119 citations, live HTTP; every replacement URL checked before use |
| Dataset reconciliation | 3,600-verdict battery: 303 → 211 warnings |
| AI disclosure | Browser, mocked model response; 5 component tests |
