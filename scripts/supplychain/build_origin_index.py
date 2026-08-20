#!/usr/bin/env python3
"""
Precompute the barcode -> origin-provenance index.

Runtime resolution is a solved problem if you stop solving it at runtime:
precompute offline, then do a single keyed read. That is also the only shape
that satisfies BOTH hard constraints at once --

  C1  resolveSupplyChain() stays pure and synchronous
  C2  the app works fully offline

-- because the expensive join happens here, ahead of time, and the runtime is
one primary-key lookup that a caller can make (or skip) without the resolver
ever learning what a network is.

Every claim carries its own evidence tier. Nothing in this file may invent an
origin: a product with no origin-bearing field comes out with best_tier
'unknown' and an empty claims array, which is a correct and useful answer.

Usage:
    python3 build_origin_index.py --local food.parquet --out origin_index
    python3 build_origin_index.py --out origin_index          # stream from HF

Emits origin_index.parquet, origin_index.csv and origin_index_stats.json.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import json
import os
import sys

import duckdb

HF_URL = "hf://datasets/openfoodfacts/product-database/food.parquet"

# Kept in step with LABEL_ORIGIN in src/services/supplyChain/resolve.ts. If you
# add a label there and not here, the index and the shipped resolver disagree
# about the same product, which is worse than either being wrong alone.
LABEL_ORIGIN = {
    "en:pdo":                              ("declared", 0.95, None),
    "en:protected-designation-of-origin":  ("declared", 0.95, None),
    "en:pgi":                              ("declared", 0.85, None),
    "en:protected-geographical-indication":("declared", 0.85, None),
    "en:made-in-france":      ("declared", 0.70, "FR"),
    "en:made-in-italy":       ("declared", 0.70, "IT"),
    "en:made-in-germany":     ("declared", 0.70, "DE"),
    "en:made-in-spain":       ("declared", 0.70, "ES"),
    "en:made-in-belgium":     ("declared", 0.70, "BE"),
    "en:made-in-switzerland": ("declared", 0.70, "CH"),
    "en:eu-agriculture":        ("declared", 0.50, None),
    "en:non-eu-agriculture":    ("declared", 0.50, None),
    "en:eu-non-eu-agriculture": ("declared", 0.30, None),
}

# Commodities the app tracks, detected from categories/ingredients so the row
# can be joined to the DOL TVPRA commodity-risk list at runtime.
COMMODITY_CATEGORIES = {
    "cocoa":    ["en:chocolates", "en:cocoa-and-its-products"],
    "coffee":   ["en:coffees"],
    "palm-oil": ["en:palm-oils"],
    "sugar":    ["en:sugars"],
    "seafood":  ["en:seafood", "en:fishes"],
    "soy":      ["en:soy-sauces", "en:soybean-oils"],
}

REQUIRED = ["code", "origins_tags", "labels_tags", "countries_tags",
            "brands", "categories_tags", "emb_codes", "manufacturing_places"]


def sql_list(vals):
    return "[" + ", ".join("'" + v.replace("'", "''") + "'" for v in vals) + "]"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--local", help="path to a downloaded food.parquet")
    ap.add_argument("--out", default="origin_index", help="output basename")
    ap.add_argument("--limit", type=int, help="cap rows (for a smoke test)")
    args = ap.parse_args()

    source = args.local if args.local else HF_URL
    con = duckdb.connect()
    if not args.local:
        con.execute("INSTALL httpfs; LOAD httpfs;")

    # Verify EVERY column before counting anything. A query against a column
    # that does not exist returns a zero indistinguishable from real zero
    # coverage, and that has already cost this project once --
    # first_packaging_code_geo does not exist in the Parquet export at all, and
    # ecoscore_data was renamed environmental_score_data.
    schema = {r[0]: r[1] for r in
              con.execute(f"DESCRIBE SELECT * FROM '{source}' LIMIT 0").fetchall()}
    missing = [c for c in REQUIRED if c not in schema]
    if missing:
        print("FATAL: required columns absent from this dump: %s" % ", ".join(missing),
              file=sys.stderr)
        print("Present columns: %d. Do NOT treat this as zero coverage."
              % len(schema), file=sys.stderr)
        return 2
    print("[index] all %d required columns verified present" % len(REQUIRED),
          file=sys.stderr)

    limit = f"LIMIT {args.limit}" if args.limit else ""

    # Market is where the product is SOLD (countries_tags). That is the correct
    # use of the field here -- it scopes the index by market. It is NEVER used
    # as an origin; conflating the two is the commonest misreading of this data.
    q = f"""
    WITH src AS (
      SELECT
        code,
        coalesce(origins_tags, []) AS origins_tags,
        coalesce(labels_tags, [])  AS labels_tags,
        coalesce(countries_tags, []) AS countries_tags,
        brands,
        coalesce(categories_tags, []) AS categories_tags,
        emb_codes,
        manufacturing_places
      FROM '{source}'
      WHERE code IS NOT NULL AND code <> ''
      {limit}
    )
    SELECT
      code,
      list_filter(origins_tags, x -> x IS NOT NULL) AS origins_tags,
      list_intersect(labels_tags, {sql_list(list(LABEL_ORIGIN))}) AS origin_labels,
      countries_tags,
      brands,
      categories_tags,
      emb_codes,
      manufacturing_places
    FROM src
    WHERE len(origins_tags) > 0
       OR len(list_intersect(labels_tags, {sql_list(list(LABEL_ORIGIN))})) > 0
       OR (emb_codes IS NOT NULL AND trim(emb_codes) <> '')
       OR (manufacturing_places IS NOT NULL AND trim(manufacturing_places) <> '')
    """

    print("[index] scanning %s ..." % source, file=sys.stderr)
    rows = con.execute(q).fetchall()
    print("[index] %d products carry at least one origin-bearing field" % len(rows),
          file=sys.stderr)

    EU = {"en:austria","en:belgium","en:bulgaria","en:croatia","en:cyprus",
          "en:czech-republic","en:denmark","en:estonia","en:finland","en:france",
          "en:germany","en:greece","en:hungary","en:ireland","en:italy","en:latvia",
          "en:lithuania","en:luxembourg","en:malta","en:netherlands","en:poland",
          "en:portugal","en:romania","en:slovakia","en:slovenia","en:spain","en:sweden"}

    out = []
    stats = {"total": 0, "by_tier": {}, "by_market": {}, "with_percentages": 0}

    for (code, origins_tags, origin_labels, countries_tags, brands,
         categories_tags, emb_codes, manufacturing_places) in rows:
        claims = []

        # Rung A1 -- the canonical origins field. Strongest database evidence.
        for tag in (origins_tags or []):
            claims.append({
                "rung": "A1", "tier": "declared", "confidence": 0.9,
                "value": tag,
                "basis": "Open Food Facts records a declared origin of '%s'."
                         % tag.split(":", 1)[-1].replace("-", " "),
            })

        # Rung A2 -- regulated on-pack labels.
        for tag in (origin_labels or []):
            tier, conf, iso2 = LABEL_ORIGIN[tag]
            claims.append({
                "rung": "A2", "tier": tier, "confidence": conf,
                "value": tag, "iso2": iso2,
                "basis": "The pack carries the regulated label '%s'."
                         % tag.split(":", 1)[-1].replace("-", " "),
            })

        # Rung A3 -- PROCESSING. A different claim, and labelled as one: this is
        # where the product was made or packed, not where anything was grown.
        if manufacturing_places and str(manufacturing_places).strip():
            claims.append({
                "rung": "A3", "tier": "declared", "confidence": 0.75,
                "value": str(manufacturing_places).strip(), "kind": "processing",
                "basis": "Processed or packed in '%s'. This is a manufacturing "
                         "location, not an ingredient origin."
                         % str(manufacturing_places).strip(),
            })
        if emb_codes and str(emb_codes).strip():
            claims.append({
                "rung": "A3", "tier": "declared", "confidence": 0.6,
                "value": str(emb_codes).strip(), "kind": "processing",
                "basis": "Carries packager code '%s'." % str(emb_codes).strip(),
            })

        if not claims:
            continue

        tiers = [c["tier"] for c in claims]
        best = "declared" if "declared" in tiers else (
               "inferred" if "inferred" in tiers else "unknown")

        cset = set(countries_tags or [])
        if cset & EU:
            market = "EU"
        elif "en:united-states" in cset:
            market = "US"
        elif "en:indonesia" in cset:
            market = "ID"
        else:
            market = "OTHER"

        commodities = []
        cats = set(categories_tags or [])
        for commodity, keys in COMMODITY_CATEGORIES.items():
            if cats & set(keys):
                commodities.append(commodity)

        out.append({
            "code": str(code),
            "market": market,
            "brand": (brands or "").split(",")[0].strip() or None,
            "best_tier": best,
            "commodities": ",".join(commodities) or None,
            "claims": json.dumps(claims, ensure_ascii=False),
            "n_claims": len(claims),
        })
        stats["total"] += 1
        stats["by_tier"][best] = stats["by_tier"].get(best, 0) + 1
        stats["by_market"][market] = stats["by_market"].get(market, 0) + 1

    print("[index] %d rows built" % len(out), file=sys.stderr)

    con.execute("CREATE TABLE idx (code TEXT, market TEXT, brand TEXT, "
                "best_tier TEXT, commodities TEXT, claims TEXT, n_claims INT)")
    if out:
        con.executemany(
            "INSERT INTO idx VALUES (?,?,?,?,?,?,?)",
            [(r["code"], r["market"], r["brand"], r["best_tier"],
              r["commodities"], r["claims"], r["n_claims"]) for r in out])

    con.execute(f"COPY idx TO '{args.out}.parquet' (FORMAT PARQUET, COMPRESSION ZSTD)")
    con.execute(f"COPY idx TO '{args.out}.csv' (HEADER, DELIMITER ',')")

    stats["built_at"] = _dt.datetime.now(_dt.timezone.utc).isoformat()
    stats["source"] = source
    stats["columns_verified"] = REQUIRED
    stats["note"] = ("Derived from Open Food Facts (ODbL). Redistribution of this "
                     "index carries the ODbL share-alike obligation and must "
                     "attribute Open Food Facts.")
    with open(f"{args.out}_stats.json", "w", encoding="utf-8") as fh:
        json.dump(stats, fh, indent=2)

    print("[index] wrote %s.parquet, %s.csv, %s_stats.json"
          % (args.out, args.out, args.out), file=sys.stderr)
    print("[index] tiers: %s" % stats["by_tier"], file=sys.stderr)
    print("[index] markets: %s" % stats["by_market"], file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
