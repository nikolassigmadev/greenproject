# Data licences

Every external dataset this app bundles or derives from, and what we owe for it.
Resolved **before** the data is embedded, because a licence problem found after
it is wired through twelve files is a rewrite rather than a decision.

---

## Open Food Facts — ODbL 1.0

**Product data.** Already used throughout the app; the supply-chain map adds
*derived* tables on top, which is the part that needs care.

- **Attribution** — required, and already present in
  `src/services/supermarket/index.ts` (`OFF_ATTRIBUTION`) and rendered in
  `RetailerDisclaimer`. The map UI must carry it too.
- **Share-alike applies to derived databases.** Our precomputed origin tables
  (`ingredientCommodity.json`, `originsGlobal.json`, `originsByMarket.json`) are
  built by aggregating OFF ingredient and category data, so they are arguably a
  Derived Database under ODbL §4.4 and would have to be offered under ODbL.
  That is not a problem — it just has to be *stated*, not discovered later.
- Individual product *facts* are not themselves copyrightable; the database
  right is what ODbL protects.

**Practical rule:** any JSON artifact in `src/data/supplyChain/` that was
computed from OFF carries a `source` and `licence` field naming ODbL, and the
repo states that those artifacts are available under ODbL.

---

## FAOSTAT — CC BY 4.0 ✅ (checked 2026-08-17)

**Bilateral trade matrix + production data**, used for Tier-B inferred origins.

The plan flagged this as a possible blocker, since FAO has historically used
CC BY-NC-SA 3.0 IGO in places. **Checked the current terms directly** at
`fao.org/contact-us/terms/db-terms-of-use`:

> "Unless specified otherwise in their metadata or webpage, all datasets
> disseminated through FAO corporate statistical databases … are licensed under
> the **Creative Commons Attribution-4.0 International licence (CC BY 4.0)**."

So: **not NC. Commercial use and redistribution are permitted with attribution.**
The blocker the plan worried about does not apply.

### One caveat worth reading before launch

FAO's supplementary terms add:

> "Datasets shall not be used for or in conjunction with the promotion of a
> commercial enterprise and/or its product(s) or service(s)."

The ordinary reading is that this forbids using FAO data *as an endorsement* —
implying FAO backs GoodScan, or using FAO branding in marketing — not that it
forbids using the data inside a product. We rely on the data to compute an
inference and we cite it as a source; we must never present it as FAO endorsing
GoodScan or any verdict.

**Concrete rules that follow:**
- Cite as "FAOSTAT, [dataset], [year]" with a link. Never "FAO-verified",
  "FAO-approved", or an FAO logo.
- Keep FAO attribution inside the data citation, out of marketing copy.
- Per-dataset metadata can override the default licence, so record the licence
  of each specific file we ingest at ingestion time rather than assuming CC BY 4.0
  across the board.
- If GoodScan takes on advertising or a paid tier, get this clause read by
  someone qualified. It is not a blocker today; it is a thing to re-check.

---

## US DOL TVPRA — public domain

**List of Goods Produced by Child Labor or Forced Labor.** Already cited in
`src/data/brandFlags.v2.ts` (`DOL_TVPRA_COCOA`, `DOL_TVPRA_PALM_OIL`, etc.).

US Government work, no copyright. This is also the best join key in the whole
feature: it is a commodity × country table of forced and child labour, which is
what makes the map *mean* something rather than just being geography.

Note the existing constraint from `docs/audit-remediation-report.md`: TVPRA is a
**commodity-level** source. It establishes that cocoa from Côte d'Ivoire involves
child labour; it says nothing about which company bought that cocoa. Flags built
on it are `claimType: 'supply_chain_inference'`, and the same discipline applies
to the map.

---

## Natural Earth / world-atlas TopoJSON — public domain

**Country outlines** for the globe. Natural Earth is explicitly public domain.

**Vendored 2026-08-20** into `public/vendor/`. The bug was broader than recorded
here: `public/sourcing-map.html` pulled THREE things from jsdelivr — d3,
topojson-client and the world-atlas TopoJSON — so vendoring the base map alone
would have fixed nothing. All three are now served from the app's own origin,
verified in the browser.

Also used to generate `src/data/supplyChain/countryPoints.ts`: 175 country
points COMPUTED from the 1:110m admin-0 geometry rather than typed from memory,
which INVARIANTS §6 forbids. Rebuild with
`scripts/supplychain/build_country_points.py`.

---

## UN Comtrade — not used

Considered as the FAOSTAT fallback. Not needed now that FAOSTAT is confirmed
CC BY 4.0. If it is ever revisited, check its redistribution terms first: the
free tier restricts bulk republication, which is exactly what a bundled
precomputed table would be.

---

## USDA FSIS Meat, Poultry and Egg Product Inspection Directory — public domain ✅ (checked 2026-08-20)

A work of the US Government, so **public domain / CC0**. No licence friction at all.

7,237 establishments, every one with real coordinates, keyed on the
establishment number printed **inside the USDA inspection mark**. That is a
genuine, non-fuzzy, package-readable join.

Bundled as `src/data/supplyChain/fsisEstablishments.ts` (13,290 numbers — one
facility can hold several grants, and the pack prints only one).

> Fetch note: `fsis.usda.gov` sits behind bot protection that rejects curl's TLS
> fingerprint with 403 regardless of headers. Node's `fetch` goes through, which
> is why `scripts/supplychain/fetch_reference_data.sh` uses it.

---

## Sugar Collaboration Group / Proforest Universal Mill List — CC BY-SA 4.0 ✅ (checked 2026-08-20)

Stated verbatim on <https://www.sugarcollaborationgroup.net/mill-list>:

> "Sugar Universal Mill List © 2025 by Sugar Collaboration Group and Proforest
> is licensed under CC BY-SA 4.0"

1,170 mills with coordinates. **Share-alike**, so:

1. Attribution must be VISIBLE wherever mill data is shown — it is in
   `REQUIRED_ATTRIBUTION`, rendered uncollapsed under the map.
2. Anything we derive from it and redistribute inherits the same obligation.

---

## Palm-oil Universal Mill List (Rainforest Alliance) — ⛔ BLOCKED, no stated licence

**Not ingested.** There is no licence statement anywhere on the distribution
page. It is the prize for Indonesia — it carries `uml_id`, which joins cleanly
to Trase's Indonesia mill dataset, the only clean cross-source join in this
landscape — and it stays out until terms arrive **in writing**.

- **Action (human, H1):** email `palmoil_traceability@ra.org` and get terms in writing.
- **Status as of 2026-08-20:** not sent. An agent should not open correspondence
  on the project's behalf; this needs a person.

---

## Trase trade-flow data — ⛔ BLOCKED, commercial use needs written permission

**Not ingested.** Trase explicitly requires written permission for commercial
use. This is what rung B2 (commodity → trade-flow statistics) depends on, so
B2 stays unbuilt until it is resolved.

- **Action (human, H2):** email `info@trase.earth`.
- **Status as of 2026-08-20:** not sent.

---

## Rejected outright — do not revisit without a reason

| Source | Why |
|---|---|
| **Global Fishing Watch** | **CC BY-NC — non-commercial only.** Hard blocker; do not build on it and hope. |
| **Open Supply Hub** | API returns 401 without a key; $2,700/yr minimum; ~zero agriculture coverage. |
| **EU health-mark registries** (`eucode.info`) | Snapshots are from 2012–13. A decade stale. |
| **Verified by GS1** | Returns country of **sale**, not origin. GEPIR retired December 2023. |

---

## Outstanding human decisions

| # | Task | Why it blocks |
|---|---|---|
| H1 | Email `palmoil_traceability@ra.org` — confirm UML licence terms | No stated licence. Blocks Indonesian mill data. |
| H2 | Email `info@trase.earth` — commercial-use permission | Explicitly required. Blocks rung B2. |
| H3 | Verify the FAOSTAT licence properly | Recorded CC BY 4.0 above (checked 2026-08-17), but it has historically been CC BY-NC-SA 3.0 IGO in places. An NC clause blocks B2 if GoodScan ever monetises. |
| H4 | Legal review of ODbL share-alike vs. any commercial plan | Structural. Decide before it is baked in — see `data/README.md`. |

---

## Checklist for adding a dataset

1. Find the licence *before* writing the ingest script.
2. Record it here, with the date checked and a quote.
3. Put `source`, `year` and `licence` on every generated artifact.
4. If it is share-alike, say what that obliges us to publish.
5. If anything reads as non-commercial or no-derivatives, stop and flag it —
   do not proceed and plan to resolve it later.
