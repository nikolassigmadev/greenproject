# GoodScan origin-provenance index

A barcode-resolvable index of **where food products say they come from**, with a
stated evidence tier on every individual claim.

Nobody has assembled this before, and the reason is not that it is hard — it is
that the sources sit scattered across a dozen incompatible portals, in a dozen
formats, under a dozen licences. This joins them into one table you can query by
the number printed on a packet.

---

## Licence — read this first

This index is a **derived database** of [Open Food Facts][off], which is
published under the **Open Database Licence (ODbL) v1.0**.

ODbL is **share-alike**. That means:

- This index is published under **ODbL v1.0**, the same licence.
- **Open Food Facts must be attributed** wherever it or anything derived from it
  is shown, including in the app UI.
- If you redistribute this index, or a database derived from it, you must do so
  under ODbL and carry the attribution forward.

Sugar mill locations come from the **Sugar Collaboration Group / Proforest
Universal Mill List**, © 2025, licensed **CC BY-SA 4.0** — also share-alike, also
attribution-required.

USDA FSIS establishment data is a work of the US Government and is in the
**public domain**; attribution is a courtesy rather than a condition.

We treat publishing as an obligation rather than an inconvenience. The share-alike
clause is the reason this file exists, and the resulting open dataset is the most
useful thing this project produces for anyone other than its own users.

[off]: https://world.openfoodfacts.org/data

---

## What a row means

One row per barcode, for every product carrying at least one origin-bearing
field. Products with nothing are **absent** — that is not a gap in the index, it
is the finding, and it is the majority of the corpus.

| Column | Type | Meaning |
|---|---|---|
| `code` | TEXT | Barcode. Primary key. |
| `market` | TEXT | `EU` / `US` / `ID` / `OTHER` — where the product is **sold**. |
| `brand` | TEXT | First listed brand, or null. |
| `best_tier` | TEXT | Strongest tier across the row's claims. |
| `commodities` | TEXT | Comma-separated tracked commodities, for the TVPRA join. |
| `claims` | JSONB | Every individual claim. See below. |
| `n_claims` | INT | Number of claims. |
| `built_at` | TIMESTAMPTZ | When this row was built. |

`market` is derived from `countries_tags`, which records where a product is
**sold**. It is *never* used as an origin. Treating it as one is the single most
common misreading of the Open Food Facts dataset.

### A claim

```json
{
  "rung":       "A1",
  "tier":       "declared",
  "confidence": 0.9,
  "value":      "en:france",
  "iso2":       "FR",
  "kind":       "processing",
  "basis":      "Open Food Facts records a declared origin of 'france'."
}
```

`basis` is plain English and is shown to the user verbatim. `kind: "processing"`
marks a claim about where a product was **made or packed** — a different claim
from where its ingredients were grown, and never rendered as an origin.

### Evidence tiers

| Tier | Meaning | Rendered as |
|---|---|---|
| `declared` | The product or brand actually says so | Solid arc, cited |
| `inferred` | Not declared; a statistical statement about commodity flows | Dashed arc, labelled with its probability |
| `unknown` | No basis at all | **A node, never a line** |

`unknown` is a correct answer, not a failure. "Nestlé does not disclose where the
palm oil in this product was grown" is a stronger and more useful statement than
a fabricated arc.

### Rungs

| Rung | Source | Claim it supports |
|---|---|---|
| A1 | OFF `origins_tags` | "An origin is declared on the record" |
| A2 | OFF `labels_tags` — PDO/PGI, Made-in-X, EU/non-EU Agriculture | "A regulated on-pack mark states this" |
| A3 | OFF `emb_codes`, `manufacturing_places` | "**Processed** here — a different claim" |
| A4 | OCR of the packaging itself | "The pack says 'Product of Mexico'" |
| B1 | Brand → documented company sourcing | "This company is documented sourcing here" |
| C | Nothing | "Not disclosed. Here is who could disclose it." |

Rung A4 is not in the published index: it is read per-scan from a photograph, so
it belongs to a session rather than to a barcode.

---

## The measured ceiling

Roughly **3–5%** of food products declare an ingredient origin, and the declared
ones skew heavily French. For the US market it is closer to 0.1%.

This ceiling is not a scraping problem and cannot be raised by engineering.
Manufacturers largely do not publish this data and are largely not required to.
Cocoa from thousands of smallholders is bulked at the co-op, mixed at the port
and blended at the processor — lot identity is destroyed by the physical supply
chain long before it reaches a barcode.

So the goal is **not** to trace every product to a farm. That is not achievable
by anyone, including the brands. The goal is to say something **true** about
every product, and be explicit about how strong the evidence is.

Honey is the instructive exception. Since 14 June 2026, Directive (EU) 2024/1438
has required every jar to list each origin country in descending order **with its
percentage**. Where the law forces disclosure onto the pack, real traceability
follows. Where it does not, no amount of engineering substitutes for it.

---

## Rebuilding

```sh
python3 scripts/supplychain/build_origin_index.py --local food.parquet --out origin_index
```

Emits `origin_index.parquet`, `origin_index.csv`, `origin_index_stats.json`.
Open Food Facts refreshes its Parquet export twice a day; rebuild nightly.

The build **verifies every column exists before counting anything**. Two columns
the original design assumed do not exist in the Parquet export at all:

- `first_packaging_code_geo` — no geo/lat/lon column exists; it is MongoDB/JSONL only
- `ecoscore_data` — renamed `environmental_score_data`, and stored as JSON text

A query against a missing column returns a zero indistinguishable from real zero
coverage. Do not treat one as the other.

---

## What is deliberately NOT in here

| Not included | Why |
|---|---|
| Origin derived from a barcode prefix | GS1 states plainly that the prefix identifies the **issuing GS1 Member Organisation**, not the country of origin. This is the mechanism behind recurring viral boycott hoaxes. |
| `countries_tags` used as origin | It records where a product is **sold**. |
| `manufacturing_places` as ingredient origin | Canned tuna with a French health mark was *canned* in France. The tuna came from an ocean. |
| Country centroids filling empty origins | An empty map that is true beats a full map that is invented. |
| LLM-guessed origins | A model must never fill this field. |
| Global Fishing Watch | CC BY-NC — non-commercial only. |
| Palm-oil Universal Mill List | No stated licence; terms requested and not yet received. |
| Trase trade-flow data | Requires written permission for commercial use; requested, not yet received. |
