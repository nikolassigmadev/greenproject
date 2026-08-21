Barcode-resolvable origin-provenance index for food products, with a stated
evidence tier on every individual claim.

**523,825 products** — every product in Open Food Facts carrying at least one
origin-bearing field. Products with nothing are absent, which is the finding
rather than a gap: 88.8% of the corpus discloses no origin at all.

| Market | Rows |
|---|---:|
| EU | 444,097 |
| Other | 69,866 |
| US | 9,519 |
| Indonesia | 343 |

## Measured coverage (4,685,177 products, 2026-08-21)

| Market | `origins_tags` | Regulated labels | Combined | No origin field |
|---|---:|---:|---:|---:|
| EU | 4.96% | 5.09% | **9.17%** | 83.93% |
| US | 0.64% | 0.22% | **0.85%** | **98.83%** |
| Indonesia | 3.19% | 0.21% | **3.31%** | 95.50% |
| World | 3.90% | 3.23% | **6.58%** | 88.82% |

Reading the regulated on-pack labels nearly doubles EU coverage. "Made in
France" alone appears on 49,978 products — more than any single value of the
origins field — because it is a mark a manufacturer must print, rather than
optional volunteer data entry.

## Schema

`code` (barcode, primary key) · `market` · `brand` · `best_tier` ·
`commodities` · `claims` (JSON) · `n_claims`

Each claim carries its rung, tier, confidence, raw value and a plain-English
basis string. Full schema, rung definitions and methodology in
[`data/README.md`](https://github.com/nikolassigmadev/greenproject/blob/main/data/README.md).

## Licence

Derived from **Open Food Facts**, licensed under the **Open Database Licence
(ODbL) v1.0**. ODbL is share-alike, so this derived database is published under
ODbL v1.0 and must carry Open Food Facts attribution. If you redistribute it, or
anything derived from it, you must do the same.

## What is deliberately not in here

- Origin derived from a barcode prefix. GS1 states plainly that the prefix
  identifies the issuing GS1 member organisation, **not** the country of origin.
  This is the mechanism behind recurring viral boycott hoaxes.
- `countries_tags` treated as origin. It records where a product is **sold**.
- Manufacturing places treated as ingredient origin. Canned tuna with a French
  health mark was *canned* in France; the tuna came from an ocean.
- Country centroids filling empty origins, or model-guessed origins of any kind.
