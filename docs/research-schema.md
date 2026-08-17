# Research schema — what the new fields are for

**Status: the columns exist and the API accepts them. Most of them are still
empty, because nothing in the app sends a value yet.** That distinction runs
through this whole document, so it's stated once here plainly: a column is a
socket, not data.

---

## The one-line version

The table could already prove **rejection** — people scan a thing and don't buy
it. It could not prove **willingness to pay**, which is the thing anyone
actually pays for. These fields close that gap.

Rejection alone is unsellable because it has no denominator and no price. "40%
skipped this chocolate" is not a finding if you don't know how many were ever
going to buy it, or what it cost.

---

## What each field is for

### The ones that create the headline number

| Field | Why it exists |
| --- | --- |
| `price_observed`, `price_currency` | The shelf price at the moment of decision. **Cannot be reconstructed later** — if it wasn't captured then, that scan is gone as evidence. |
| `swap_price_delta` | How much more (or less) the alternative cost, as a %. With the above, this gives you the *price elasticity of ethics*: the premium at which people stop switching. |
| `intent_before` | `ABOUT_TO_BUY` / `BROWSING` / `RESEARCHING`. The denominator. Turns "40% skipped" into "we flipped 23% of intended purchases" — one is noise, the other is a headline. |
| `session_id` | Groups one shopping trip. Without it, 40 scans in one supermarket and 40 scans across a month are identical to every per-basket metric. |
| `retailer`, `retail_channel` | Country+city is too coarse to act on. A brand can do something about "losing shoppers in Tesco". |
| `swap_shown_id` | *Which* alternative was offered. `swap_shown` is a boolean and can't attribute a switch to a product. |

### The ones that make it trustworthy

| Field | Why it exists |
| --- | --- |
| `match_confidence` | Lets a buyer filter to rows matched correctly. Without it every row looks equally reliable, which means none is. |
| `scan_method`, `match_method` | How the product was found, and how it was matched. Lets you exclude AI-inferred matches from a serious analysis. |
| `flag_ids` | The *specific* flags that fired. `primary_concern` is one coarse bucket; this attributes behaviour to an individual allegation. |
| `sections_opened`, `dwell_ms` | Which evidence people actually opened. Answers whether labour, carbon or animal welfare is what changes a decision — a question the Methodology page raises and can't currently settle. |
| `app_version` | So a behaviour change can be traced to a release rather than to the world. |

### Deliberately NOT added

These were requested but already exist under other names. Adding a synonym
would have split the same measurement across two columns and quietly corrupted
both:

- `swap_clicked` — already present
- `decision_latency_ms` — this is `dwell_ms` ("page open → buy/skip press")
- `detail_dwell_ms` — likewise `dwell_ms`

---

## New tables

**`users`** — one row per person, not per scan. Demographics belong here, not as
more columns on `ai_scans`, or you re-state the same age band on ten thousand
rows.

**`survey_responses`** — the `scan_id` column is the entire point. "Would you
pay more for cage-free?" asked cold gets the usual answer where everyone says
yes. The same question two seconds after someone physically put a caged-egg
product back is a different asset, because the revealed behaviour is sitting in
the next row and can contradict them.

---

## Two things that are enforced, not suggested

**k-anonymity floor.** `unmet_ethical_demand` now ends with
`HAVING count(DISTINCT user_id) >= 5`. A city×category×concern cell built from
one person is that person's shopping habits with a label on it. Enforced in the
view rather than in each query, so nobody downstream can forget.

*Verified:* a cell with 3 distinct users does not appear; at 5 it does.

**Consent must be versioned.** A CHECK constraint means `research_consent =
true` is impossible without `consent_version` and `consent_at`. A bare `true`
is unfalsifiable a year later when the wording has changed.

*Verified:* the database rejects consent without a version.

---

## The blocker before any of this is sellable

`research_consent` defaults to **false** and **nothing sets it yet.**

The current opt-out is a `localStorage` key — client-side, unversioned, opt-out
rather than opt-in, and invisible to the server. A persistent device ID, plus
city, plus timestamps, plus photographs is personal data under GDPR whatever
the "anon" label says. Commercial use needs server-side, versioned, **opt-in**
consent.

This cannot be applied backwards. Rows collected before someone consents were
not consented to. The only honest fix is to ask, and to filter every commercial
query on the answer:

```sql
SELECT ... FROM ai_scans s
JOIN users u ON u.user_id = s.user_id
WHERE u.research_consent IS TRUE;
```

Treat that JOIN as mandatory for anything leaving the building.

---

## What still needs wiring

The API accepts all of these today. Nothing sends them yet. Roughly in order of
effort:

| Field | What it needs | Notes |
| --- | --- | --- |
| `app_version` | Read from `package.json` at build | Trivial. Now `goodscan@1.0.0`. |
| `session_id` | Extend `src/utils/scanSession.ts` | Already tracks per-scan events; needs a trip-level id that resets after ~30 min idle. |
| `retailer`, `retail_channel` | Read `src/utils/selectedRetailer.ts` | The user already picks a shop in the supermarket feature. |
| `scan_method`, `match_method`, `match_confidence` | Emit from the scan pipeline | The matcher already computes confidence internally — it just isn't returned. |
| `flag_ids`, `sections_opened` | Emit from the verdict page | It knows which flags rendered and which sections were expanded. |
| `swap_shown_id`, `swap_price_delta` | Emit from the swap engine | Knows which swap it offered; price delta needs prices. |
| `price_observed` | **New UI** | Someone has to type it. |
| `intent_before` | **New UI** | One tap, and it must be captured *before* the verdict shows, or it just measures the verdict. |

The last two are product decisions, not plumbing. Every tap costs you scans.

---

## Two risks not yet addressed

**`image` should move out of `ai_scans`.** Base64 photos in the primary
analytics table hurt query performance as it grows, scale badly on cost, and
capture faces and store interiors. The fix is object storage plus an
`image_ref` and a TTL. Not done — it's a migration with real risk, and it
deserves its own decision.

**Pick a monetisation path.** These fields hedge across three, and hedging has a
cost:

- **Data licensing** wants price, retailer, panel depth
- **Subscription** wants paywall and feature-gate events — *not added*
- **Affiliate** wants full click-through and conversion on swaps

Naming one lets the schema be cut down to what it actually needs.
