# Supply-chain map — invariants

These rules apply to **every** change in this feature. They exist because the
failure mode here is specific and severe: a map that draws a confident line from
Côte d'Ivoire to a factory to a Denpasar supermarket, for a product where Open
Food Facts says nothing about origin, is a fabrication engine wearing a
cartography costume.

GoodScan's only real asset is that its verdicts are defensible — a tiered
sourcing bar, `status: 'verified'` on brand flags, `lastVerified` dates,
citations on every claim, and an audit harness that fails the build when the app
contradicts itself. One pretty map that invents provenance undoes all of it the
first time a journalist or a brand's lawyer follows a line.

---

## 1. Three provenance tiers

Every node and every edge carries its tier, a numeric `confidence`, a
plain-English `basis` string, and a `sources` array shaped like
`MapCompany['sources']` so the existing citation renderer works unchanged.

| Tier | Meaning | Render |
|---|---|---|
| `declared` | This product or brand actually says so | Solid arc, full colour, cited |
| `inferred` | Not declared; this is where this commodity, sold in this market, statistically comes from | Dashed arc, muted, labelled with its probability |
| `unknown` | No basis at all | **No arc.** A grey "not disclosed" node |

## 2. `declared` has a hard evidentiary bar

A node may only be `declared` when it comes from a field on the product itself,
or from a citable entry in one of our own verified datasets
(`chocolateDirectory.ts`, `verdictMapCompanies.ts`, `brandFlags.v2.ts`).

**Never** from a statistical model. FAOSTAT can never produce a `declared` node,
no matter how high the share.

## 3. Unknown renders as a node, never a line

"Nestlé does not disclose where the palm oil in this product was grown" is a
stronger ethical statement than a made-up arc, and it is the one that matches
this app's voice. **Opacity is the finding.** Tier C is a feature.

This is also what lets every product have a map: "we don't know, and here's who
could tell us but won't" is a valid map.

## 4. The resolver is pure and synchronous

`resolveSupplyChain(product, region)` — no `fetch`, no `Date.now()`, no
`Math.random()`. Same contract as `personalizedScore.ts`, for the same reason:
it must be auditable by a harness that runs it thousands of times.

All reference data is bundled. The app must work fully offline — it is a
Capacitor app used on shop floors with bad signal.

## 5. No runtime CDN dependency

Known bug to fix, not to copy: `public/sourcing-map.html` loads `world-atlas`
from jsdelivr, so **the globe is blank offline today**. Vendor the TopoJSON.

## 6. Never invent coordinates, trade shares, or origin countries

If a number is not in a bundled dataset traceable to a cited source, the answer
is `unknown`. This includes:

- No "representative" coordinates guessed from a country name
- No trade share rounded from memory
- No origin country inferred from a brand's nationality

## 7. Inferred copy must state the inference and its basis

> ✅ "Likely origin — Indonesia imports 41% of its cocoa from Côte d'Ivoire (FAOSTAT 2023)"
> ❌ "Sourced from Côte d'Ivoire"

An inferred line is a statistical statement about **commodity flows**, not an
accusation about a **company**. That distinction has to be unmissable in the
copy, because we are drawing lines from named brands to countries on a
forced-labour list.

## 8. The map may never contradict the verdict

The risk implied by the map and the direction of `getVerdict()` must agree. A
product the map paints as high-risk must not read BUY. This mirrors the
self-consistency rule `verdictPageAudit.test.ts` already enforces, and it is the
rule that keeps the feature trustworthy as both sides evolve.

---

## Data reality check (measured 2026-08-17, before any feature code)

Two findings from probing the Hugging Face Parquet dump
(`openfoodfacts/product-database`, `food.parquet`, 7.77 GB, 266 columns) that
change the shape of the plan. Both were assumptions in the original spec:

**`first_packaging_code_geo` does not exist in this dump.** There is no `geo`,
`lat` or `lon` column at all. The spec called this "your single highest-value
field — real coordinates, not a guess"; it is only in the MongoDB/JSONL export,
not the Parquet one. So Tier-A *processing* nodes must come from
`emb_codes_tags` (geocodable separately, offline, from a bundled EMB table) or
`manufacturing_places_tags` (free text), or the node is `unknown`.

**`ecoscore_data` has been renamed `environmental_score_data`** and is stored as
a JSON `BYTE_ARRAY`, not a struct. The `aggregated_origins` array the spec
depends on has to be JSON-extracted rather than read as a column. Any script
written against the old name silently returns nothing — which would look exactly
like "no coverage".

The consequence: **do not treat a zero from a mis-named column as a real zero.**
Every coverage number in `docs/supply-chain-data-coverage.md` must be traceable
to a column that was confirmed to exist first.

---

## Scope limits

- **No shipping routes.** We have no route data. A great-circle arc is a visual
  connector, not a claimed path — the legend must say so.
- **No distribution centres.** Three nodes: origin(s) → processing → you.
- **Max 5 origin arcs.** Rank ingredients by `percent_estimate` × ethical
  salience; the rest become "+ N other ingredients, origins not disclosed".
- **Brand HQ is not a factory.** When the processing node falls back to
  `verdictMapCompanies.ts`, the basis string must say "company headquarters, not
  necessarily the factory". That is a different claim.

## Licensing obligations

Resolve before data is embedded anywhere — see `docs/DATA_LICENCES.md`:

- **Open Food Facts is ODbL.** Share-alike applies to *derived databases*. Our
  precomputed origin tables are arguably one. Attribution goes in the map UI.
- **FAOSTAT licence must be verified, not assumed.** It has historically been
  CC BY-NC-SA 3.0 IGO in places and CC BY 4.0 in others. An NC clause is a
  blocker if GoodScan ever monetises — stop and flag it rather than proceed.
