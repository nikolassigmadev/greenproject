#!/usr/bin/env python3
"""
Convert data/reference/*.csv into bundled TypeScript modules.

Run fetch_reference_data.sh first. Both outputs are GENERATED -- do not
hand-edit them; change this script and re-run.

    python3 scripts/supplychain/build_reference_modules.py

Why bundled at all: INVARIANTS 4 requires the resolver to be pure and
synchronous, and the app to work fully offline on a shop floor. A lookup that
needs a network round trip satisfies neither.

Why the compact tuple format: FSIS is 7,237 establishments. Emitted as objects
with quoted keys that is ~900 KB of source; as positional tuples with
coordinates rounded to 3 decimals (~110 m, far finer than a map pin needs) it
is roughly a third of that. The lookup Map is built once, lazily, on first use.
"""

from __future__ import annotations

import csv
import datetime as _dt
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
REF = os.path.join(ROOT, "data", "reference")
OUT = os.path.join(ROOT, "src", "data", "supplyChain")

BUILT = _dt.date.today().isoformat()


def q(s):
    """Quote a string for TS source."""
    return "'" + (s or "").replace("\\", "\\\\").replace("'", "\\'").strip() + "'"


def rnd(s, nd=3):
    try:
        return round(float(s), nd)
    except (TypeError, ValueError):
        return None


def split_est_numbers(raw):
    """
    'G1126A+V1126A' -> ['G1126A', 'V1126A'].

    One physical facility can hold several grant numbers (meat, poultry, egg),
    and the pack prints ONE of them inside the inspection mark. Indexing only
    the compound string would fail every real lookup.
    """
    out = []
    for part in (raw or "").replace(",", "+").split("+"):
        p = part.strip().upper()
        if p:
            out.append(p)
    return out


def build_fsis():
    path = os.path.join(REF, "fsis_mpi_directory.csv")
    if not os.path.exists(path):
        print("  SKIP fsis: %s not found (run fetch_reference_data.sh)" % path,
              file=sys.stderr)
        return
    rows = list(csv.DictReader(open(path, encoding="utf-8-sig")))

    seen = {}
    dropped_no_geo = 0
    for r in rows:
        lat, lon = rnd(r.get("latitude")), rnd(r.get("longitude"))
        if lat is None or lon is None:
            dropped_no_geo += 1
            continue
        name = (r.get("establishment_name") or "").strip()
        city = (r.get("city") or "").strip()
        state = (r.get("state") or "").strip()
        for est in split_est_numbers(r.get("establishment_number")):
            # First writer wins: the directory is keyed by establishment and a
            # duplicate number means the same facility, not a second one.
            seen.setdefault(est, (name, city, state, lon, lat))

    # Emit as ONE delimited blob rather than an object literal.
    #
    # Per-row TS syntax ("  'M123': ['Name','City','ST',-94.1,36.2],") costs
    # ~20 bytes of quotes, brackets and commas on top of the data itself. Across
    # 13k rows that is a quarter of a megabyte of punctuation. A tab-delimited
    # blob parsed once, lazily, on first lookup is a third of the size and
    # measurably faster to parse than a huge object literal.
    blob_rows = []
    for est in sorted(seen):
        name, city, state, lon, lat = seen[est]
        # Strip the delimiters out of free-text fields rather than escaping them.
        clean = lambda v: str(v).replace("\t", " ").replace("\n", " ").replace("\\", "")
        blob_rows.append("\t".join(
            [est, clean(name), clean(city), clean(state), str(lon), str(lat)]))
    blob = "\n".join(blob_rows)
    # A backtick or ${ in a facility name would break out of the template
    # literal. Neither should appear, but "should" is not a guarantee when the
    # input is 7,000 rows of free text.
    blob = blob.replace("`", "'").replace("${", "$ {")

    lines = [
        "// USDA FSIS establishments -- GENERATED, do not hand-edit.",
        "//",
        "// Rebuild:  bash scripts/supplychain/fetch_reference_data.sh",
        "//           python3 scripts/supplychain/build_reference_modules.py",
        "//",
        "// Source: USDA FSIS Meat, Poultry and Egg Product Inspection Directory.",
        "// A work of the US Government -- public domain (CC0), no licence friction.",
        "// Built %s from %d directory rows." % (BUILT, len(rows)),
        "//",
        "// WHY THIS IS THE US PRIZE: it is keyed on the establishment number",
        "// printed INSIDE THE USDA INSPECTION MARK on the pack. That is a real,",
        "// non-fuzzy, package-readable join -- not a fuzzy brand match -- and every",
        "// row carries the facility's actual coordinates.",
        "//",
        "// WHAT IT PROVES, AND WHAT IT DOES NOT: this is where the product was",
        "// PROCESSED, slaughtered or packed. It is NOT where the animal was raised",
        "// or the ingredients grown. Canned tuna with a French health mark was",
        "// canned in France; the tuna came from an ocean. Copy built on this table",
        "// must say 'processed here', never 'from here'.",
        "//",
        "// Coordinates are rounded to 3 decimals (~110 m) -- far finer than a map",
        "// pin needs, and a fraction of the bundle size of full precision.",
        "//",
        "// One facility can hold several grant numbers (meat, poultry, egg) and the",
        "// pack prints only ONE of them, so compound entries like 'G1126A+V1126A'",
        "// are indexed under each number separately: %d numbers from %d rows." % (len(seen), len(rows)),
        "",
        "export interface FsisEstablishment {",
        "  establishmentNumber: string;",
        "  name: string;",
        "  city: string;",
        "  state: string;",
        "  lon: number;",
        "  lat: number;",
        "}",
        "",
        "export const FSIS_SOURCE = {",
        "  label: 'USDA FSIS — Meat, Poultry and Egg Product Inspection Directory (public domain)',",
        "  url: 'https://www.fsis.usda.gov/inspection/establishments/meat-poultry-and-egg-product-inspection-directory',",
        "} as const;",
        "",
        "/** How many establishment numbers are bundled. Used by the data tests. */",
        "export const FSIS_COUNT = %d;" % len(seen),
        "",
        "/** est<TAB>name<TAB>city<TAB>state<TAB>lon<TAB>lat, one per line. */",
        "const BLOB = `\\",
        blob,
        "`;",
        "",
        "let INDEX: Map<string, FsisEstablishment> | null = null;",
        "",
        "/** Parse the blob once, on first lookup. */",
        "function index(): Map<string, FsisEstablishment> {",
        "  if (INDEX) return INDEX;",
        "  const m = new Map<string, FsisEstablishment>();",
        "  for (const line of BLOB.split('\\n')) {",
        "    if (!line) continue;",
        "    const [est, name, city, state, lon, lat] = line.split('\\t');",
        "    m.set(est, {",
        "      establishmentNumber: est,",
        "      name, city, state,",
        "      lon: Number(lon), lat: Number(lat),",
        "    });",
        "  }",
        "  INDEX = m;",
        "  return m;",
        "}",
        "",
        "/**",
        " * Resolve an establishment number read off the USDA inspection mark.",
        " *",
        " * Accepts the forms that actually appear on packs: 'EST. 12345', 'P-12345',",
        " * 'M12345', 'EST 34D'. Returns null rather than guessing -- an unmatched",
        " * number is a number we cannot place, not an invitation to approximate.",
        " */",
        "export function lookupFsisEstablishment(",
        "  raw: string | null | undefined,",
        "): FsisEstablishment | null {",
        "  if (!raw) return null;",
        "  const cleaned = raw",
        "    .toUpperCase()",
        "    .replace(/EST(ABLISHMENT)?\\.?\\s*/g, '')",
        "    .replace(/[\\s-]/g, '')",
        "    .trim();",
        "  if (!cleaned) return null;",
        "  const m = index();",
        "  const direct = m.get(cleaned);",
        "  if (direct) return direct;",
        "  // A bare number on the pack may be recorded with its activity prefix.",
        "  if (/^[0-9]+[A-Z]*$/.test(cleaned)) {",
        "    for (const prefix of ['M', 'P', 'V', 'G']) {",
        "      const hit = m.get(prefix + cleaned);",
        "      if (hit) return hit;",
        "    }",
        "  }",
        "  return null;",
        "}",
        "",
    ]
    dest = os.path.join(OUT, "fsisEstablishments.ts")
    open(dest, "w", encoding="utf-8").write("\n".join(lines))
    print("  fsisEstablishments.ts  %d numbers (%d rows, %d without geo)"
          % (len(seen), len(rows), dropped_no_geo), file=sys.stderr)


def build_sugar():
    path = os.path.join(REF, "sugar_uml.csv")
    if not os.path.exists(path):
        print("  SKIP sugar: %s not found" % path, file=sys.stderr)
        return
    rows = list(csv.DictReader(open(path, encoding="utf-8-sig")))

    out = []
    for r in rows:
        lat, lon = rnd(r.get("Latitude")), rnd(r.get("Longitude"))
        if lat is None or lon is None:
            continue
        uml = (r.get("UML ID") or "").strip()
        if not uml:
            continue
        name = (r.get("First Aggregator Name") or r.get("Group Name") or "").strip()
        out.append((uml, name, (r.get("Country") or "").strip(),
                    (r.get("Country Code") or "").strip(), lon, lat,
                    (r.get("Beet") or "").strip().lower() == "yes",
                    (r.get("Cane") or "").strip().lower() == "yes"))

    lines = [
        "// Sugar mills (Universal Mill List) -- GENERATED, do not hand-edit.",
        "//",
        "// Rebuild:  bash scripts/supplychain/fetch_reference_data.sh",
        "//           python3 scripts/supplychain/build_reference_modules.py",
        "//",
        "// Source: Sugar Collaboration Group / Proforest, Universal Mill List.",
        "// Built %s from %d rows." % (BUILT, len(rows)),
        "//",
        "// LICENCE -- CC BY-SA 4.0. Stated verbatim on the distribution page:",
        "//   'Sugar Universal Mill List (c) 2025 by Sugar Collaboration Group and",
        "//    Proforest is licensed under CC BY-SA 4.0'",
        "// SHARE-ALIKE: attribution is required wherever this is shown, and anything",
        "// we derive FROM it and then distribute inherits the same obligation. That",
        "// is a real constraint on the published origin index, not a footnote.",
        "//",
        "// These are MILLS -- the first aggregation point, where cane or beet from",
        "// many farms is crushed together. Lot identity is destroyed here, which is",
        "// exactly why mill-level is the finest honest granularity for sugar.",
        "",
        "/** [umlId, name, country, iso3, lon, lat, beet, cane] */",
        "export type SugarMillRow = readonly [string, string, string, string, number, number, boolean, boolean];",
        "",
        "export const SUGAR_UML_SOURCE = {",
        "  label: 'Sugar Collaboration Group / Proforest — Universal Mill List (CC BY-SA 4.0)',",
        "  url: 'https://www.sugarcollaborationgroup.net/mill-list',",
        "} as const;",
        "",
        "export const SUGAR_MILLS: readonly SugarMillRow[] = [",
    ]
    for uml, name, country, iso3, lon, lat, beet, cane in out:
        lines.append("  [%s, %s, %s, %s, %s, %s, %s, %s]," % (
            q(uml), q(name), q(country), q(iso3), lon, lat,
            "true" if beet else "false", "true" if cane else "false"))
    lines += [
        "];",
        "",
        "/** How many mills are bundled. Used by the data-coverage tests. */",
        "export const SUGAR_MILL_COUNT = %d;" % len(out),
        "",
        "/** Mills in one country, by ISO 3166-1 alpha-3. Never guesses. */",
        "export function sugarMillsByIso3(iso3: string | null | undefined): SugarMillRow[] {",
        "  if (!iso3) return [];",
        "  const key = iso3.trim().toUpperCase();",
        "  return SUGAR_MILLS.filter((m) => m[3].toUpperCase() === key);",
        "}",
        "",
    ]
    dest = os.path.join(OUT, "sugarMills.ts")
    open(dest, "w", encoding="utf-8").write("\n".join(lines))
    print("  sugarMills.ts  %d mills" % len(out), file=sys.stderr)


if __name__ == "__main__":
    print("Building bundled reference modules...", file=sys.stderr)
    build_fsis()
    build_sugar()
    print("Done.", file=sys.stderr)
