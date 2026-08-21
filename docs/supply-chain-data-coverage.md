# Supply-chain origin coverage — measured

Every number here is traceable to a column that was **confirmed to exist first**.
That is not a stylistic preference. Two columns the original design depended on
do not exist in the Open Food Facts Parquet export at all, and a query against a
missing column returns a zero indistinguishable from real zero coverage — a
mistake that has already cost this project once.

---

## 1. Column verification (measured 2026-08-20)

Corpus: `openfoodfacts/product-database`, `food.parquet` on Hugging Face,
**7,781,363,645 bytes**, **111 columns**.

> Note: `docs/SUPPLY_CHAIN_INVARIANTS.md` recorded 266 columns on 2026-08-17.
> The export now has 111. The dump's shape changes; re-verify, never assume.

### Present — every rung below is built on these

| Column | Type |
|---|---|
| `code` | VARCHAR |
| `countries_tags` | VARCHAR[] |
| `origins` | VARCHAR |
| `origins_tags` | VARCHAR[] |
| `labels_tags` | VARCHAR[] |
| `emb_codes` | VARCHAR |
| `emb_codes_tags` | VARCHAR[] |
| `manufacturing_places` | VARCHAR |
| `manufacturing_places_tags` | VARCHAR[] |
| `categories_tags` | VARCHAR[] |
| `brands` | VARCHAR |
| `environmental_score_data` | VARCHAR (JSON text, **not** a struct) |

### Absent — confirmed, not assumed

| Column the spec assumed | Status |
|---|---|
| `first_packaging_code_geo` | **ABSENT** |
| `ecoscore_data` | **ABSENT** — renamed `environmental_score_data` |
| `geo` | **ABSENT** |
| `lat` | **ABSENT** |
| `lon` | **ABSENT** |

There is **no geo/lat/lon column of any kind** in the Parquet export. Packaging-code
coordinates exist only in the MongoDB/JSONL dumps. So Tier-A *processing* nodes
must come from `emb_codes_tags`, `manufacturing_places_tags`, or the bundled FSIS
directory — or the node stays `unknown`.

---

## 2. Resolver coverage, EU — before and after rung A2

Measured **2026-08-20** by running the **shipped resolver** over live products.
Both figures come from a single run of one build: A2 nodes are identifiable by
their `origin:label:` id prefix, so "A1 only" is derived rather than measured
from a separate, possibly-different build.

Source: **Search-a-licious** (`search.openfoodfacts.org`). The legacy
`/api/v2/search` endpoint returned **503 for every request** throughout; barcode
lookup on the same host was fine, so it was the search index rather than us.

Sample: **2,100 products** across FR, IT, DE, ES, BE, NL, PL.

| Measure | Products | Share |
|---|---:|---:|
| Free-text `origins` present | 0 | **0.0%** |
| `origins_tags` present | 436 | **20.8%** |
| **BEFORE** — rung A1 only | 456 | **21.7%** |
| **AFTER** — rung A1 + A2 | 575 | **27.4%** |
| Covered **only** because of A2 | 119 | **+5.7 pp** |

Reproduce:

```sh
SUPPLY_CHAIN_COVERAGE=1 npx vitest run src/test/supplyChainCoverage.test.ts -t "measures EU coverage"
```

### The finding that mattered most

Rung A1 has been named "OFF `origins_tags`" since the first plan, and the
resolver was reading the free-text `origins` string **only**. `origins_tags` was
neither requested from the API nor read anywhere.

In this sample the free-text field was populated on **0 of 2,100 products** and
the canonical tags on 436. Open Food Facts normalises contributor input into
`origins_tags` and frequently leaves the free text empty — so those products
scored zero origin coverage with the answer sitting one field away.

Fixed in `origin: 3b`. Almost all of the 21.7% "before" figure above is
attributable to that fix, not to pre-existing behaviour.

> Caveat, stated rather than buried: the 0.0% free-text figure is partly an
> artefact of Search-a-licious not indexing `origins`. It is **not** proof that
> the field is empty across the corpus. §3 gives the corpus-wide rate for both
> fields, which is the number to cite for the population.

---

## 3. Corpus-wide coverage

<!-- PENDING: filled from scripts/supplychain/measure_coverage.py against the
     local 7.78 GB parquet. Streaming the file over HTTP proved unusable at
     ~0.8 MB/s, so the run is done against a local copy. -->

---

## 4. What the ceiling actually is

Roughly **3–5%** of food products declare an ingredient origin, and the declared
ones skew heavily French. For the US market it is closer to **0.1%**.

This ceiling is not a scraping problem and cannot be raised by engineering.
Manufacturers largely do not publish this data and largely are not required to.
Cocoa from thousands of smallholders is bulked at the co-op, mixed at the port
and blended at the processor — lot identity is destroyed by the physical supply
chain long before it reaches a barcode.

So the rungs below A1 are not attempts to work around that with inference. They
are attempts to find claims that are **already true and already published**, in
places the database does not look:

| Rung | Where the claim lives | Why it is denser than `origins` |
|---|---|---|
| A2 | `labels_tags` | A regulated mark a manufacturer MUST print, vs. optional volunteer data entry |
| A4 | The packaging itself | Origin is legally mandated on-pack far more often than it is recorded anywhere |

Honey is the instructive exception: since **14 June 2026**, Dir. (EU) 2024/1438
has required every jar to list each origin country in descending order **with its
percentage**. Where the law forces disclosure onto the pack, real traceability
follows. Where it does not, no amount of engineering substitutes for it.
