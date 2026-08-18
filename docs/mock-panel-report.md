# Mock panel report

**Generated 2026-08-17 from `src/test/mockPanel.test.ts`.**

> ## Read this first
>
> **The people in this report do not exist.** Every price, every buy/skip, every
> dwell time and every intent was invented by the generator in that file.
>
> **Real:** the 147 products (live Open Food Facts records), their
> origins, commodities and TVPRA flags — all computed by the production
> resolver. And the SQL: `mock.ai_scans` is a structural copy of
> `public.ai_scans`, so every query below is the real query with one word
> changed.
>
> **Invented:** all 60 users and all 1476 decisions.
>
> So every behavioural number here is a **readback of the generative model**, not
> a finding. Where the report says price sensitivity does something, that is
> `pSkip` in the generator saying it. The purpose is to show the *shape* of the
> output and prove the pipeline runs end to end — not to learn anything about
> shoppers.

## Panel

| Metric | Value |
| --- | --- |
| Scans | 1476 |
| Users (synthetic) | 60 |
| Shopping trips | 202 |
| Distinct real products | 147 |
| Research-consented users | 49 / 60 |
| Rows below 0.7 match confidence | 87 |
| Scans per trip | 7.3 (of which 1.5 skipped) |

## 1. Rejection by verdict

| verdict | scans | skip % |
| --- | --- | --- |
| AVOID | 380 | 47.1 |
| CAUTION | 156 | 26.3 |
| CONSIDER | 409 | 13.9 |
| UNKNOWN | 531 | 5.5 |

## 2. The denominator — why `intent_before` matters

| intent | scans | skip % |
| --- | --- | --- |
| ABOUT_TO_BUY | 1029 | 23.7 |
| RESEARCHING | 150 | 14.0 |
| BROWSING | 297 | 13.8 |

Restricted to shoppers who said they were **about to buy**: 1029 scans,
23.7% did not buy. That is the only defensible form of an
impact claim, and it is unavailable without this column — a browser who doesn't
buy was never a conversion.

## 3. Price elasticity of ethics

Switch rate against how much more the alternative cost.

| bucket | from % | to % | n | switched % |
| --- | --- | --- | --- | --- |
| 0 | -25.0 | -20.5 | 13 | 23.1 |
| 1 | -19.6 | -10.4 | 23 | 13.0 |
| 2 | -10.0 | 0.0 | 54 | 33.3 |
| 3 | 0.4 | 10.0 | 60 | 21.7 |
| 4 | 10.0 | 19.9 | 70 | 18.6 |
| 5 | 20.4 | 29.6 | 55 | 23.6 |
| 6 | 31.4 | 39.4 | 31 | 22.6 |
| 7 | 40.4 | 49.3 | 18 | 11.1 |
| 8 | 50.0 | 56.7 | 5 | 0.0 |
| 9 | 63.8 | 76.5 | 2 | 0.0 |

**This curve is the single most saleable output the schema can produce, and it
cannot be reconstructed retroactively** — a scan logged without `price_observed`
is gone as evidence forever. Here its shape is dictated by `priceSensitivity`
in the generator.

## 4. By retailer

k-anonymity floor applied (≥5 distinct users per row).

| retailer | scans | skip % |
| --- | --- | --- |
| Alfamart | 60 | 30.0 |
| Hypermart | 58 | 29.3 |
| Whole Foods | 156 | 23.1 |
| Aldi | 188 | 22.9 |
| Trader Joe’s | 50 | 22.0 |
| Tesco | 164 | 21.3 |
| Target | 142 | 20.4 |
| Co-op | 126 | 19.8 |

## 5. Attribution to a specific flag

| flag id | scans | skip % |
| --- | --- | --- |
| tvpra:palm-oil:Indonesia (Sumatra) | 35 | 57.1 |
| tvpra:palm-oil:Malaysia (Sabah) | 154 | 50.0 |
| tvpra:cocoa:West Africa | 56 | 48.2 |
| tvpra:palm-oil:Indonesia (Sulawesi) | 106 | 48.1 |
| tvpra:cocoa:Ghana | 275 | 46.5 |
| tvpra:cocoa:Côte d'Ivoire | 275 | 46.5 |
| tvpra:coffee:Brazil (Minas Gerais) | 45 | 44.4 |
| tvpra:coffee:Vietnam (Central Highlands) | 41 | 41.5 |

This is what `flag_ids` buys over `primary_concern`: "the DOL cocoa listing
drove N rejections" instead of "something about labour did".

## 6. Which evidence people open

| section opened | n | skip % | avg dwell ms |
| --- | --- | --- | --- |
| materials | 334 | 27.8 | 12829 |
| ingredients | 395 | 27.1 | 12918 |
| labour | 392 | 25.3 | 12526 |
| swaps | 381 | 25.2 | 12643 |
| origin | 407 | 22.9 | 12310 |
| species | 360 | 22.8 | 12109 |
| carbon | 357 | 22.4 | 11925 |

The question the Methodology page raises and cannot currently answer. On real
data this would show whether labour, carbon or animal welfare actually changes a
decision.

## What to distrust in the tables above

Two things are worth pointing at, because they are exactly the mistakes this
output invites on real data too.

**Small cells.** Several rows above rest on a handful of scans — the far ends of
the elasticity curve, and the top row of the flag table. A 60.9% skip rate on 23
scans is not a higher number than 47% on 132; it is the same number with more
noise. Any real version of this report needs a minimum-n rule alongside the
k-anonymity floor, and they are not the same rule: one protects the reader from
nonsense, the other protects the user from identification.

**Section 6 is a null result, and correctly so.** Every section lands between 21%
and 27% with near-identical dwell times. That is not a finding that all evidence
types work equally — it is the generator opening sections at random,
independently of the decision. The query is doing its job and reporting no
signal, because there is no signal to find. On real data this table is the
interesting one; here it is a control that confirms the pipeline does not invent
structure that was never put in.

## What this exercise actually established

1. The schema round-trips: 1476 rows with every research field populated.
2. All six analyses run as plain SQL — no post-processing.
3. `session_id` makes per-trip metrics possible (7.3 scans/trip).
4. The consent JOIN and the k-anonymity floor both work in practice.

## What it did NOT establish

Anything whatsoever about how people shop.

To get real numbers you need the capture UI listed in
[research-schema.md](research-schema.md) — above all `price_observed` and
`intent_before`, which are the two that cannot be backfilled.
