#!/usr/bin/env python3
"""
Measure REAL origin-disclosure coverage in Open Food Facts, per market.

Why this script exists
----------------------
Every design decision in the origin-tracing work depends on knowing how many
products actually declare an origin, split by market. Estimates are not good
enough: the whole feature's credibility rests on the difference between "we
measured 3.1%" and "we think it's about 3-5%".

The trap this script is built around
------------------------------------
Two columns the original spec depended on DO NOT EXIST in the Parquet export:

  * `first_packaging_code_geo` — packaging-code coordinates. Parquet has no
    geo/lat/lon column at all. It exists only in the MongoDB/JSONL dumps.
  * `ecoscore_data` — renamed to `environmental_score_data`, and stored as a
    JSON string (VARCHAR), not a struct.

A query selecting a column that does not exist either errors out or, worse,
gets "helpfully" coalesced to nothing by a later refactor — and returns a zero
that is indistinguishable from real zero coverage. That has already cost this
project once.

So: EVERY column is verified to exist BEFORE it is counted, and a missing
column is reported as ABSENT, never as 0. Do not "simplify" this away.

Usage
-----
    pip install duckdb
    python3 measure_coverage.py --out coverage.csv
    python3 measure_coverage.py --local food.parquet --out coverage.csv

Streaming from Hugging Face reads only the ~12 needed columns rather than the
full dump, but still takes 5-15 minutes. Download food.parquet once and use
--local to iterate faster.
"""

from __future__ import annotations

import argparse
import csv
import datetime as _dt
import json
import sys

import duckdb

HF_URL = "hf://datasets/openfoodfacts/product-database/food.parquet"

# Columns this script reads. Each is verified to exist before any count runs.
REQUIRED_COLUMNS = [
    "code",
    "countries_tags",
    "origins",
    "origins_tags",
    "labels_tags",
    "emb_codes",
    "emb_codes_tags",
    "manufacturing_places",
    "manufacturing_places_tags",
    "categories_tags",
    "brands",
    "environmental_score_data",
]

# Columns the ORIGINAL spec assumed. Probed explicitly so the report can state
# that they are gone rather than silently returning nothing.
KNOWN_ABSENT_SUSPECTS = [
    "first_packaging_code_geo",
    "ecoscore_data",
    "geo",
    "lat",
    "lon",
]

# --- Markets -----------------------------------------------------------------
# `countries_tags` records where a product is SOLD. That is the correct use of
# it here: we are asking "of products on sale in market X, how many disclose an
# origin?". It is NOT used as origin anywhere in this script or in the app --
# conflating the two is the single most common misreading of this dataset.

EU_COUNTRY_TAGS = [
    "en:austria", "en:belgium", "en:bulgaria", "en:croatia", "en:cyprus",
    "en:czech-republic", "en:denmark", "en:estonia", "en:finland", "en:france",
    "en:germany", "en:greece", "en:hungary", "en:ireland", "en:italy",
    "en:latvia", "en:lithuania", "en:luxembourg", "en:malta", "en:netherlands",
    "en:poland", "en:portugal", "en:romania", "en:slovakia", "en:slovenia",
    "en:spain", "en:sweden",
]

MARKETS = {
    "EU": EU_COUNTRY_TAGS,
    "US": ["en:united-states"],
    "ID": ["en:indonesia"],
    "WORLD": None,  # no filter
}

# --- Rung A2: origin-bearing labels -----------------------------------------
# Kept in step with LABEL_ORIGIN in src/services/supplyChain/resolve.ts. If you
# add a label there, add it here, or the measured coverage stops describing the
# code that ships.

LABEL_ORIGIN_TAGS = [
    "en:pdo", "en:protected-designation-of-origin",
    "en:pgi", "en:protected-geographical-indication",
    "en:made-in-france", "en:made-in-italy", "en:made-in-germany",
    "en:made-in-spain", "en:made-in-belgium", "en:made-in-switzerland",
    "en:eu-agriculture", "en:non-eu-agriculture", "en:eu-non-eu-agriculture",
]


def sql_list(values: list[str]) -> str:
    """Render a Python list as a SQL list literal, single-quotes escaped."""
    inner = ", ".join("'" + v.replace("'", "''") + "'" for v in values)
    return "[" + inner + "]"


def verify_columns(con: duckdb.DuckDBPyConnection, source: str) -> dict[str, str]:
    """
    Read the real schema BEFORE counting anything.

    Returns {column_name: duckdb_type}. Anything not in this dict does not
    exist, and every count that would have touched it must report ABSENT.
    """
    rows = con.execute(f"DESCRIBE SELECT * FROM '{source}' LIMIT 0").fetchall()
    return {r[0]: r[1] for r in rows}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--local", help="Path to a downloaded food.parquet")
    ap.add_argument("--out", default="coverage.csv", help="CSV output path")
    ap.add_argument("--md", help="Optional markdown output path")
    args = ap.parse_args()

    source = args.local if args.local else HF_URL

    con = duckdb.connect()
    if not args.local:
        con.execute("INSTALL httpfs; LOAD httpfs;")

    print(f"[coverage] source: {source}", file=sys.stderr)
    print("[coverage] verifying columns exist before counting anything...", file=sys.stderr)

    schema = verify_columns(con, source)

    present: list[str] = []
    absent: list[str] = []
    for c in REQUIRED_COLUMNS:
        (present if c in schema else absent).append(c)

    for c in REQUIRED_COLUMNS:
        state = f"PRESENT  {schema[c]}" if c in schema else "ABSENT"
        print(f"           {c:30s} {state}", file=sys.stderr)

    print("[coverage] columns the original spec assumed:", file=sys.stderr)
    suspect_state = {}
    for c in KNOWN_ABSENT_SUSPECTS:
        ok = c in schema
        suspect_state[c] = schema[c] if ok else "ABSENT"
        print(f"           {c:30s} {'PRESENT  ' + schema[c] if ok else 'ABSENT'}",
              file=sys.stderr)

    if "code" not in schema or "countries_tags" not in schema:
        print("[coverage] FATAL: `code` or `countries_tags` missing — cannot measure.",
              file=sys.stderr)
        return 2

    # One pass, not one per market. Each market becomes a FILTER clause, so a
    # remote 7.7 GB Parquet is scanned once rather than seventeen times.
    def market_pred(tags: list[str] | None) -> str:
        if tags is None:
            return "TRUE"
        return (f"countries_tags IS NOT NULL AND "
                f"len(list_intersect(countries_tags, {sql_list(tags)})) > 0")

    RUNGS = {
        "a1_origins_tags": ("origins_tags IS NOT NULL AND len(origins_tags) > 0",
                            ["origins_tags"]),
        "a1_origins_text": ("origins IS NOT NULL AND trim(origins) <> ''", ["origins"]),
        "a2_labels": (
            "labels_tags IS NOT NULL AND "
            f"len(list_intersect(labels_tags, {sql_list(LABEL_ORIGIN_TAGS)})) > 0",
            ["labels_tags"]),
        "a1_or_a2": (
            "(origins_tags IS NOT NULL AND len(origins_tags) > 0) OR "
            "(labels_tags IS NOT NULL AND "
            f"len(list_intersect(labels_tags, {sql_list(LABEL_ORIGIN_TAGS)})) > 0)",
            ["origins_tags", "labels_tags"]),
        "a3_emb_codes": ("emb_codes IS NOT NULL AND trim(emb_codes) <> ''",
                         ["emb_codes"]),
        "a3_manufacturing_places": (
            "manufacturing_places IS NOT NULL AND trim(manufacturing_places) <> ''",
            ["manufacturing_places"]),
        "a3_any": (
            "(emb_codes IS NOT NULL AND trim(emb_codes) <> '') OR "
            "(manufacturing_places IS NOT NULL AND trim(manufacturing_places) <> '')",
            ["emb_codes", "manufacturing_places"]),
        # Rung A4's ceiling cannot be measured from a database -- it is what is
        # PRINTED on the pack. What IS measurable is the population OCR must
        # serve: products with no database-side origin at all.
        "no_db_origin_at_all": (
            "(origins_tags IS NULL OR len(origins_tags) = 0) AND "
            "(labels_tags IS NULL OR "
            f"len(list_intersect(labels_tags, {sql_list(LABEL_ORIGIN_TAGS)})) = 0) AND "
            "(emb_codes IS NULL OR trim(emb_codes) = '') AND "
            "(manufacturing_places IS NULL OR trim(manufacturing_places) = '')",
            ["origins_tags", "labels_tags", "emb_codes", "manufacturing_places"]),
        "honey_products": (
            "categories_tags IS NOT NULL AND list_contains(categories_tags, 'en:honeys')",
            ["categories_tags"]),
        "env_missing_key_data": (
            "environmental_score_data IS NOT NULL AND "
            "environmental_score_data LIKE '%missing_key_data%'",
            ["environmental_score_data"]),
    }

    selects, colnames = [], []
    for market, tags in MARKETS.items():
        mp = market_pred(tags)
        selects.append(f"count(*) FILTER (WHERE {mp})")
        colnames.append((market, "total"))
        for rung_name, (expr, needs) in RUNGS.items():
            if any(c not in schema for c in needs):
                # Column absent -> NULL -> reported as ABSENT, never as 0.
                selects.append("CAST(NULL AS BIGINT)")
            else:
                selects.append(f"count(*) FILTER (WHERE ({mp}) AND ({expr}))")
            colnames.append((market, rung_name))

    print("[coverage] counting all markets in a single pass...", file=sys.stderr)
    q = "SELECT " + ",\n           ".join(selects) + f"\n      FROM '{source}'"
    row = con.execute(q).fetchone()

    per_market: dict[str, dict] = {m: {"market": m} for m in MARKETS}
    for (market, field), value in zip(colnames, row):
        per_market[market][field] = value
    results = [per_market[m] for m in MARKETS]

    for rec in results:
        tot = rec["total"] or 0

        def pct(v, _tot=None):
            t = tot if _tot is None else _tot
            if v is None:
                return "ABSENT"
            return f"{(v / t * 100):.2f}%" if t else "n/a"

        print(
            f"           {rec['market']:6s} total={tot:>9,}  "
            f"A1={pct(rec['a1_origins_tags'])}  A2={pct(rec['a2_labels'])}  "
            f"A1|A2={pct(rec['a1_or_a2'])}  A3={pct(rec['a3_any'])}  "
            f"none={pct(rec['no_db_origin_at_all'])}",
            file=sys.stderr,
        )

    # --- per-label breakdown ------------------------------------------------
    # Also one pass: 13 FILTER clauses over a single scan.
    label_rows = []
    if "labels_tags" in schema:
        print("[coverage] per-label counts (world), single pass...", file=sys.stderr)
        lsel = ", ".join(
            f"count(*) FILTER (WHERE labels_tags IS NOT NULL AND "
            f"list_contains(labels_tags, {chr(39)}{t}{chr(39)}))"
            for t in LABEL_ORIGIN_TAGS
        )
        lrow = con.execute(f"SELECT {lsel} FROM '{source}'").fetchone()
        for tag, n in zip(LABEL_ORIGIN_TAGS, lrow):
            label_rows.append({"label": tag, "products": n})
            print(f"           {tag:38s} {n:>9,}", file=sys.stderr)

    # --- write outputs -------------------------------------------------------
    measured_on = _dt.date.today().isoformat()

    with open(args.out, "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["# measured_on", measured_on])
        w.writerow(["# source", source])
        w.writerow(["# columns_present", ";".join(present)])
        w.writerow(["# columns_absent", ";".join(absent) or "(none)"])
        for c, v in suspect_state.items():
            w.writerow([f"# spec_assumed:{c}", v])
        w.writerow([])
        if results:
            w.writerow(list(results[0].keys()))
            for r in results:
                w.writerow(["ABSENT" if v is None else v for v in r.values()])
        if label_rows:
            w.writerow([])
            w.writerow(["label", "products"])
            for r in label_rows:
                w.writerow([r["label"], r["products"]])
    print(f"[coverage] wrote {args.out}", file=sys.stderr)

    sidecar = args.out.rsplit(".", 1)[0] + "_meta.json"
    with open(sidecar, "w", encoding="utf-8") as fh:
        json.dump(
            {
                "measured_on": measured_on,
                "source": source,
                "n_columns_in_dump": len(schema),
                "columns_present": present,
                "columns_absent": absent,
                "spec_assumed_columns": suspect_state,
                "markets": results,
                "labels": label_rows,
            },
            fh,
            indent=2,
        )
    print(f"[coverage] wrote {sidecar}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
