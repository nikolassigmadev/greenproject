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

Being vendored into the repo as part of Session 5 — today `public/sourcing-map.html`
loads it from jsdelivr at runtime, which means **the globe is blank offline**, and
this is a Capacitor app used in shops with poor signal.

---

## UN Comtrade — not used

Considered as the FAOSTAT fallback. Not needed now that FAOSTAT is confirmed
CC BY 4.0. If it is ever revisited, check its redistribution terms first: the
free tier restricts bulk republication, which is exactly what a bundled
precomputed table would be.

---

## Checklist for adding a dataset

1. Find the licence *before* writing the ingest script.
2. Record it here, with the date checked and a quote.
3. Put `source`, `year` and `licence` on every generated artifact.
4. If it is share-alike, say what that obliges us to publish.
5. If anything reads as non-commercial or no-derivatives, stop and flag it —
   do not proceed and plan to resolve it later.
