#!/usr/bin/env python3
"""
How much location data does Open Food Facts actually have?

This is the number that decides the shape of the supply-chain map. If declared
origin data is thin, Tier A is a badge on a handful of products and Tier B
(statistical inference) carries the whole feature — and the UI for "mostly
declared" is a different product from the UI for "mostly inferred". Better to
know that before falling in love with a design.

Research only. NOT part of the app bundle — excluded from tsconfig and vitest.

    pip install duckdb
    python3 scripts/research/off-coverage/coverage.py --limit 200000
    python3 scripts/research/off-coverage/coverage.py --full        # all ~4M

Reads the Hugging Face Parquet dump over HTTP. Parquet is columnar, so DuckDB
only fetches the columns named below rather than all 7.77 GB — but it is still a
lot of range requests, so --limit is the default for iteration.

TWO TRAPS, both already hit while writing this:

  1. `ecoscore_data` no longer exists; it is `environmental_score_data`, and it
     is a JSON string rather than a struct. A query against the old name returns
     nothing, which looks exactly like "this field has no coverage".
  2. `first_packaging_code_geo` is not in this dump at all — no geo/lat/lon
     column exists. It is in the MongoDB/JSONL export only.

So every column is verified to exist before it is counted, and anything missing
is reported as ABSENT rather than silently counted as zero. A zero from a typo
and a zero from reality are the same number and completely different findings.
"""

import argparse
import json
import os
import sys
from pathlib import Path

try:
    import duckdb
except ImportError:
    sys.exit("duckdb is required:  pip install duckdb")

URL = "https://huggingface.co/datasets/openfoodfacts/product-database/resolve/main/food.parquet"

# The 21 markets the app actually offers (src/utils/userRegion.ts COUNTRIES).
MARKETS = {
    "US": "united-states", "GB": "united-kingdom", "CA": "canada", "AU": "australia",
    "IE": "ireland", "NZ": "new-zealand", "FR": "france", "DE": "germany",
    "ES": "spain", "IT": "italy", "NL": "netherlands", "BE": "belgium",
    "CH": "switzerland", "AT": "austria", "PT": "portugal", "SE": "sweden",
    "NO": "norway", "DK": "denmark", "FI": "finland", "PL": "poland",
    "ID": "indonesia",
}

# name -> SQL expression that is TRUE when the field carries real information.
# Written against columns confirmed present; see verify_columns().
FIELDS = {
    "origins_tags": "len(origins_tags) > 0",
    "origins_text": "origins IS NOT NULL AND origins <> ''",
    "emb_codes_tags": "len(emb_codes_tags) > 0",
    "manufacturing_places_tags": "len(manufacturing_places_tags) > 0",
    "cities_tags": "len(cities_tags) > 0",
    "countries_tags": "len(countries_tags) > 0",
    "categories_tags": "len(categories_tags) > 0",
    "labels_tags": "len(labels_tags) > 0",
    # PDO/PGI/AOP/AOC are legally guaranteed geographic origin — Tier A gold.
    "labels_pdo_pgi": (
        "len(list_filter(labels_tags, x -> x LIKE '%pdo%' OR x LIKE '%pgi%' "
        "OR x LIKE '%aop%' OR x LIKE '%aoc%' OR x LIKE '%protected-designation%' "
        "OR x LIKE '%protected-geographical%')) > 0"
    ),
    "ingredients_n": "ingredients_n IS NOT NULL AND ingredients_n > 0",
    # The critical one. environmental_score_data is JSON; aggregated_origins
    # defaults to en:unknown, which OFF stores and penalises. Counting those as
    # coverage would overstate the whole project.
    "env_score_data_present": "environmental_score_data IS NOT NULL AND environmental_score_data <> ''",
    "agg_origins_any": (
        "environmental_score_data IS NOT NULL AND "
        "environmental_score_data LIKE '%aggregated_origins%'"
    ),
    "agg_origins_known": (
        "environmental_score_data IS NOT NULL AND "
        "environmental_score_data LIKE '%aggregated_origins%' AND "
        "NOT regexp_matches(environmental_score_data, "
        "'\"aggregated_origins\":\\[\\{[^}]*\"origin\":\"en:unknown\"[^}]*\\}\\]')"
    ),
}

# Fields the spec assumed exist. Verified, and reported honestly if absent.
EXPECTED_BUT_CHECK = ["first_packaging_code_geo", "ecoscore_data"]


def connect():
    con = duckdb.connect()
    con.execute("INSTALL httpfs; LOAD httpfs;")
    con.execute("SET enable_progress_bar = false;")
    return con


def verify_columns(con):
    """Which columns actually exist? Never count a field we didn't confirm."""
    rows = con.execute(f"SELECT name FROM parquet_schema('{URL}')").fetchall()
    return {r[0] for r in rows}


def source_expr(limit):
    """
    NOTE ON SAMPLING. `LIMIT n` reads the first n rows in FILE order, which is
    not a random sample — Open Food Facts began in France and the head of the
    file is overwhelmingly French. A 50k head sample returned 2,971 French
    products and zero Indonesian ones, which would have made per-market coverage
    meaningless and the Indonesian column look like a data desert.

    So --limit exists only for iterating on the query. Any number that gets
    quoted anywhere must come from --full.
    """
    return f"read_parquet('{URL}')" if limit is None else (
        f"(SELECT * FROM read_parquet('{URL}') LIMIT {limit})"
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=200_000,
                    help="rows to sample (default 200k). Use --full for everything.")
    ap.add_argument("--full", action="store_true", help="scan all ~4M products")
    ap.add_argument("--out", default="docs/supply-chain-data-coverage.md")
    args = ap.parse_args()
    limit = None if args.full else args.limit

    con = connect()
    print(f"reading schema from {URL} …", file=sys.stderr)
    present = verify_columns(con)
    print(f"  {len(present)} columns", file=sys.stderr)

    absent_expected = [c for c in EXPECTED_BUT_CHECK if c not in present]
    for c in absent_expected:
        print(f"  ABSENT (spec assumed it exists): {c}", file=sys.stderr)

    # Only measure fields whose columns we confirmed.
    usable, skipped = {}, []
    for name, expr in FIELDS.items():
        needed = expr.split("(")[0].strip().split()[0].strip("()")
        base = name if name in present else None
        # Map derived names back to their real column.
        for col in ("origins_tags", "origins", "emb_codes_tags", "manufacturing_places_tags",
                    "cities_tags", "countries_tags", "categories_tags", "labels_tags",
                    "ingredients_n", "environmental_score_data"):
            if col in expr:
                base = col
                break
        if base and base in present:
            usable[name] = expr
        else:
            skipped.append((name, base))
    for name, base in skipped:
        print(f"  skipping {name}: column {base!r} not in dump", file=sys.stderr)

    src = source_expr(limit)
    scope = ("all products" if limit is None
             else f"first {limit:,} rows in file order — NOT a random sample")
    print(f"scanning {scope} …", file=sys.stderr)

    # ── Global coverage ──
    sel = ",\n      ".join(
        f"count(*) FILTER (WHERE {e}) AS \"{n}\"" for n, e in usable.items()
    )
    q = f"SELECT count(*) AS total,\n      {sel}\n    FROM {src}"
    row = con.execute(q).fetchone()
    cols = [d[0] for d in con.description]
    overall = dict(zip(cols, row))
    total = overall.pop("total")
    print(f"  {total:,} products scanned", file=sys.stderr)

    # ── Per-market coverage, for the fields that matter to the map ──
    KEY = [k for k in ("origins_tags", "agg_origins_known", "emb_codes_tags",
                       "manufacturing_places_tags", "labels_pdo_pgi") if k in usable]
    per_market = {}
    for code, tag in MARKETS.items():
        sel_m = ",\n      ".join(
            f"count(*) FILTER (WHERE {usable[k]}) AS \"{k}\"" for k in KEY
        )
        qm = (f"SELECT count(*) AS total,\n      {sel_m}\n    FROM {src}\n"
              f"    WHERE len(list_filter(countries_tags, x -> x LIKE '%{tag}%')) > 0")
        r = con.execute(qm).fetchone()
        c = [d[0] for d in con.description]
        d = dict(zip(c, r))
        per_market[code] = d
        print(f"  {code}: {d['total']:,}", file=sys.stderr)

    # ── Top ingredient tags, for the commodity model in Session 2 ──
    top_ingredients = []
    if "ingredients_tags" in present:
        qi = (f"SELECT tag, count(*) AS n FROM ("
              f"  SELECT unnest(ingredients_tags) AS tag FROM {src}"
              f") WHERE tag IS NOT NULL GROUP BY 1 ORDER BY n DESC LIMIT 500")
        top_ingredients = con.execute(qi).fetchall()
        print(f"  {len(top_ingredients)} ingredient tags", file=sys.stderr)

    write_report(args.out, total, overall, per_market, KEY, present,
                 absent_expected, top_ingredients, scope, skipped)
    print(f"\nwrote {args.out}", file=sys.stderr)

    Path("scripts/research/off-coverage/top-ingredients.json").write_text(
        json.dumps([{"tag": t, "count": n} for t, n in top_ingredients], indent=1)
    )


def pct(n, d):
    return f"{(n / d * 100):.2f}%" if d else "—"


def write_report(out, total, overall, per_market, KEY, present,
                 absent_expected, top_ingredients, scope, skipped):
    L = []
    A = L.append
    A("# Supply-chain data coverage — measured\n")
    A("Generated by `scripts/research/off-coverage/coverage.py` against the Open Food")
    A("Facts Parquet dump on Hugging Face (`openfoodfacts/product-database`,")
    A("`food.parquet`, 7.77 GB, ODbL).\n")
    A(f"**Scope:** {scope} — {total:,} products.\n")
    if "NOT a random sample" in scope:
        A("> ⚠️ **These numbers are not quotable.** A `LIMIT` reads the head of the")
        A("> file, and Open Food Facts began in France, so the head is overwhelmingly")
        A("> French. Per-market figures in particular are meaningless here. Re-run with")
        A("> `--full` before citing anything.\n")
    A("Every figure below comes from a column verified to exist in the dump first.")
    A("A zero from a mis-named column and a zero from reality are the same number and")
    A("completely different findings.\n")

    if absent_expected:
        A("## Fields the plan assumed exist, that don't\n")
        for c in absent_expected:
            A(f"- **`{c}`** — not present in this dump.")
        A("")
        A("`first_packaging_code_geo` was billed as the single highest-value field —")
        A("real factory coordinates rather than a guess. It is in the MongoDB/JSONL")
        A("export, not the Parquet one. There is no `geo`, `lat` or `lon` column here")
        A("at all. Tier-A *processing* nodes must therefore come from `emb_codes_tags`")
        A("(geocodable offline from a bundled EMB table) or `manufacturing_places_tags`")
        A("(free text), or be `unknown`.\n")
        A("`ecoscore_data` was renamed `environmental_score_data` and is stored as a")
        A("JSON string, not a struct — so `aggregated_origins` has to be JSON-extracted.\n")

    if skipped:
        A("### Not measured\n")
        for name, base in skipped:
            A(f"- `{name}` — needs column `{base}`, absent")
        A("")

    A("## Global coverage\n")
    A("| Field | Products | Share |")
    A("|---|---:|---:|")
    for k, v in overall.items():
        A(f"| `{k}` | {v:,} | {pct(v, total)} |")
    A("")

    A("### What these mean\n")
    A("- `origins_tags` / `origins_text` — declared ingredient origin. Often a country,")
    A("  sometimes vague (\"EU\").")
    A("- `agg_origins_any` vs `agg_origins_known` — the gap between the two is the")
    A("  headline number for this project. OFF *defaults* aggregated origins to")
    A("  `en:unknown` and penalises the score for it, so presence of the field means")
    A("  almost nothing; only the known ones are usable provenance.")
    A("- `labels_pdo_pgi` — legally guaranteed geographic origin. Tier A gold, but rare.")
    A("- `emb_codes_tags` — packager code. Geocodable to a real facility.\n")

    A("## Coverage in the 21 markets the app offers\n")
    A("| Market | Products | " + " | ".join(f"`{k}`" for k in KEY) + " |")
    A("|---|---:|" + "---:|" * len(KEY))
    for code, d in sorted(per_market.items(), key=lambda kv: -kv[1]["total"]):
        t = d["total"]
        cells = " | ".join(f"{d[k]:,} ({pct(d[k], t)})" for k in KEY)
        A(f"| {code} | {t:,} | {cells} |")
    A("")

    A("## Kill criterion\n")
    A("The plan's test: *if declared-origin fields cover <5% of products in our")
    A("markets, Tier A is a bonus badge on a handful of products and Tier B carries")
    A("the entire feature.*\n")
    declared_global = overall.get("origins_tags", 0)
    A(f"Global `origins_tags` coverage: **{pct(declared_global, total)}**.")
    A(f"Global usable aggregated origins: **{pct(overall.get('agg_origins_known', 0), total)}**.\n")

    if top_ingredients:
        A("## Top 40 ingredient tags\n")
        A("Full 500 in `scripts/research/off-coverage/top-ingredients.json`, feeding the")
        A("commodity model in Session 2.\n")
        A("| Tag | Occurrences |")
        A("|---|---:|")
        for tag, n in top_ingredients[:40]:
            A(f"| `{tag}` | {n:,} |")
        A("")

    Path(out).write_text("\n".join(L) + "\n")


if __name__ == "__main__":
    os.chdir(Path(__file__).resolve().parents[3])
    main()
