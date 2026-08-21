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

## 3. Corpus-wide coverage (measured 2026-08-21)

Full corpus, **4,685,177 food products**, measured locally against
`food.parquet` (7,785,838,824 bytes).

Reproduce:

```sh
python3 scripts/supplychain/measure_coverage.py --local food.parquet --out coverage.csv
```

| Market | Products | A1 `origins_tags` | A2 labels | **A1 ∪ A2** | A3 processing | No origin field at all |
|---|---:|---:|---:|---:|---:|---:|
| **EU** | 2,764,227 | 4.96% | 5.09% | **9.17%** | 10.05% | 83.93% |
| **US** | 954,378 | 0.64% | 0.22% | **0.85%** | 0.57% | **98.83%** |
| **Indonesia** | 8,645 | 3.19% | 0.21% | **3.31%** | 2.36% | 95.50% |
| **World** | 4,685,177 | 3.90% | 3.23% | **6.58%** | 6.87% | 88.82% |

### Three things this settles

**A2 nearly doubles EU coverage.** 4.96% → 9.17% is a **+4.21 pp** absolute gain
and an **+85% relative** one, from a field the repo was not reading at all. The
brief called A2 "the quiet win"; it is the single largest coverage gain available
from data already in the database.

**"Made in France" really does beat the origins field.** 49,978 products carry
`en:made-in-france` — more than any single value of `origins`. The reason is
structural, not accidental: a made-in mark is a regulated mark a manufacturer
must print, while `origins` is optional volunteer data entry.

**The US is the case that no database fixes.** 98.83% of US products carry no
origin-bearing field of any kind, and rung A2 adds 0.22%. Nothing in Open Food
Facts will move this. It is the entire argument for rung A4: origin is
*legally mandated on the pack* under 19 U.S.C. §1304 for imported articles, so
the answer is printed on the packet and simply absent from the database.

### Per-label counts (world)

| Label | Products |
|---|---:|
| `en:made-in-france` | 49,978 |
| `en:eu-agriculture` | 37,285 |
| `en:non-eu-agriculture` | 33,783 |
| `en:eu-non-eu-agriculture` | 29,987 |
| `en:made-in-italy` | 18,124 |
| `en:pdo` | 16,243 |
| `en:made-in-germany` | 12,787 |
| `en:pgi` | 12,362 |
| `en:made-in-belgium` | 5,054 |
| `en:made-in-spain` | 4,994 |
| `en:protected-designation-of-origin` | **0** |
| `en:protected-geographical-indication` | **0** |
| `en:made-in-switzerland` | **0** |

The three zeros are worth stating rather than quietly deleting. Open Food Facts
canonicalises the protected designations to `en:pdo` / `en:pgi`, so the
long-form spellings never appear, and no product currently carries
`en:made-in-switzerland`. They stay in `LABEL_ORIGIN` because matching a tag
that does not exist costs nothing and the canonical form can change — but they
contribute **zero** coverage today, and any estimate that counted them would be
counting the same products twice.

---

## 3b. The published index

523,833 products carry at least one origin-bearing field and are therefore in
the index. Everything else is **absent** — which is the finding, not a gap.

| | Rows |
|---|---:|
| Total | 523,833 |
| EU | 444,105 |
| Other | 69,866 |
| US | 9,519 |
| Indonesia | 343 |

Artifacts: `origin_index.parquet` (13 MB), `origin_index.csv` (179 MB),
`docs/origin_index_stats.json`.

Every row is tier `declared`. That is not a flattering accident: the index only
carries rungs A1–A3, all of which are fields on the product itself, and the
statistical rung that would produce `inferred` (B2, trade flows) is blocked on
the Trase licence. See `docs/DATA_LICENCES.md`.

---

## 3c. Endpoint latency — measured, and the 50 ms target

`GET /api/origin/:barcode` was specified to respond in under 50 ms. Measured
2026-08-21 against the live table (523,825 rows):

| Layer | Median |
|---|---:|
| Postgres execution (`EXPLAIN ANALYZE`) | **0.089 ms** |
| Postgres planning | 0.088 ms |
| `SELECT 1` — pure network round trip | **124.6 ms** |
| Full indexed lookup, client to client | 122.8 ms |
| HTTP handler overhead | ~2.7 ms |

The plan is `Index Scan using origin_index_pkey`, 4 shared buffer hits — a
primary-key lookup, which is what keeps it flat as the table grows.

**So the query meets the target by a factor of ~500, and the endpoint does not
meet it from here.** The entire gap is geography: this database lives in
`ap-northeast-1` (Tokyo), and a round trip from the development machine costs
~124 ms whatever the query does — `SELECT 1` costs the same as the real lookup,
to within noise.

That is worth stating plainly rather than reporting a passing number from a
local Postgres and moving on:

- The **database** side of the 50 ms budget is met with enormous margin, and
  verified independently against a real Postgres in
  `scripts/supplychain/verify_origin_endpoint.mjs` (p50 0.265 ms, p99 0.599 ms
  on a 50k-row table).
- Whether the **endpoint** meets it in production depends on where the API
  server runs relative to `ap-northeast-1`. Co-located, it will; from another
  continent, no endpoint backed by this database can, regardless of tuning.
- This affects every DB-backed route, not just this one.

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
