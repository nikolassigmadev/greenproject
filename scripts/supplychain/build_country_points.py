#!/usr/bin/env python3
"""
Generate src/data/supplyChain/countryPoints.ts from Natural Earth admin-0.

Why this is generated and not hand-written
------------------------------------------
INVARIANTS §6: "Never invent coordinates ... No 'representative' lat/lon guessed
from a country name." A table of country coordinates typed from memory is
exactly that, even when the numbers happen to be close. So every coordinate here
is COMPUTED from public-domain geometry (Natural Earth 1:110m admin-0, the same
source already cited as NATURAL_EARTH in src/data/supplyChain/sources.ts), and
this script is committed so anyone can rebuild the table and diff it.

What the point actually is
--------------------------
A country-level claim ("Product of Mexico") deserves a country-level marker, and
nothing finer. So the point is a visual centre of the country's largest landmass:

  1. take the largest polygon by area,
  2. compute its centroid,
  3. if that centroid falls OUTSIDE the polygon -- which happens for crescent and
     archipelago shapes like Indonesia, Croatia or Norway, where a naive centroid
     lands in the sea -- replace it with a pole-of-inaccessibility approximation
     (the interior point furthest from any edge), found by grid refinement.

Step 3 matters: a pin in the Java Sea labelled "Indonesia" reads as a claim
about a place rather than a country, and it is the kind of small wrongness this
project cannot afford.

These are NOT production centroids. Cocoa grows in south-west Cote d'Ivoire, not
at the country's centre -- that distinction is why ORIGIN_POINTS exists
separately and stays hand-curated with a cited production region. Use this table
only for country-granularity claims: "Made in France", "Product of Mexico".

Usage
-----
    curl -sSL -o ne110.geojson \\
      https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson
    python3 build_country_points.py ne110.geojson \\
      --out ../../src/data/supplyChain/countryPoints.ts
"""

from __future__ import annotations

import argparse
import json
import sys

SOURCE_LABEL = "Natural Earth 1:110m admin-0 countries (public domain)"
SOURCE_URL = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/"
    "master/geojson/ne_110m_admin_0_countries.geojson"
)


def ring_area(ring: list[list[float]]) -> float:
    """Signed planar area. Only used to rank polygons by size, so degrees are fine."""
    a = 0.0
    for i in range(len(ring) - 1):
        x1, y1 = ring[i][0], ring[i][1]
        x2, y2 = ring[i + 1][0], ring[i + 1][1]
        a += x1 * y2 - x2 * y1
    return a / 2.0


def ring_centroid(ring: list[list[float]]) -> tuple[float, float]:
    a = ring_area(ring)
    if abs(a) < 1e-12:
        xs = [p[0] for p in ring]
        ys = [p[1] for p in ring]
        return sum(xs) / len(xs), sum(ys) / len(ys)
    cx = cy = 0.0
    for i in range(len(ring) - 1):
        x1, y1 = ring[i][0], ring[i][1]
        x2, y2 = ring[i + 1][0], ring[i + 1][1]
        f = x1 * y2 - x2 * y1
        cx += (x1 + x2) * f
        cy += (y1 + y2) * f
    return cx / (6 * a), cy / (6 * a)


def point_in_ring(x: float, y: float, ring: list[list[float]]) -> bool:
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if (yi > y) != (yj > y):
            xint = (xj - xi) * (y - yi) / (yj - yi) + xi
            if x < xint:
                inside = not inside
        j = i
    return inside


def dist_to_ring(x: float, y: float, ring: list[list[float]]) -> float:
    best = float("inf")
    for i in range(len(ring) - 1):
        x1, y1 = ring[i][0], ring[i][1]
        x2, y2 = ring[i + 1][0], ring[i + 1][1]
        dx, dy = x2 - x1, y2 - y1
        if dx == 0 and dy == 0:
            d = ((x - x1) ** 2 + (y - y1) ** 2) ** 0.5
        else:
            t = max(0.0, min(1.0, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
            px, py = x1 + t * dx, y1 + t * dy
            d = ((x - px) ** 2 + (y - py) ** 2) ** 0.5
        best = min(best, d)
    return best


def pole_of_inaccessibility(ring: list[list[float]], steps: int = 24,
                            refinements: int = 5) -> tuple[float, float]:
    """Interior point furthest from the boundary, by successive grid refinement."""
    xs = [p[0] for p in ring]
    ys = [p[1] for p in ring]
    minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
    best = (0.0, 0.0)
    best_d = -1.0
    for _ in range(refinements):
        for i in range(steps + 1):
            for j in range(steps + 1):
                x = minx + (maxx - minx) * i / steps
                y = miny + (maxy - miny) * j / steps
                if not point_in_ring(x, y, ring):
                    continue
                d = dist_to_ring(x, y, ring)
                if d > best_d:
                    best_d, best = d, (x, y)
        if best_d < 0:
            break
        # Tighten the window around the current best and search again.
        w = (maxx - minx) / steps
        h = (maxy - miny) / steps
        minx, maxx = best[0] - w, best[0] + w
        miny, maxy = best[1] - h, best[1] + h
    return best


def polygons_of(geom: dict) -> list[list[list[float]]]:
    """Return every OUTER ring in the feature."""
    t = geom.get("type")
    coords = geom.get("coordinates") or []
    if t == "Polygon":
        return [coords[0]] if coords else []
    if t == "MultiPolygon":
        return [poly[0] for poly in coords if poly]
    return []


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("geojson", help="ne_110m_admin_0_countries.geojson")
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    data = json.load(open(args.geojson, encoding="utf-8"))
    out: dict[str, dict] = {}

    for feat in data["features"]:
        props = feat["properties"]
        # ISO_A2 is "-99" for a handful of entries (France and Norway among
        # them, because of dependent territories); ISO_A2_EH carries the real
        # code in those cases. Prefer the plain field, fall back to _EH.
        # ISO_A2 is unusable for a handful of entries: "-99" where Natural Earth
        # declines to assign one (France and Norway, because of their dependent
        # territories) and "CN-TW" for Taiwan. ISO_A2_EH carries the real
        # alpha-2 in each of those cases, so fall back whenever ISO_A2 is not
        # exactly two letters -- checking only for "-99" silently dropped TW.
        iso2 = (props.get("ISO_A2") or "").strip()
        if len(iso2) != 2 or not iso2.isalpha():
            iso2 = (props.get("ISO_A2_EH") or "").strip()
        if len(iso2) != 2 or not iso2.isalpha():
            print(f"  skip (no ISO alpha-2): {props.get('NAME')}", file=sys.stderr)
            continue
        name = props.get("NAME") or props.get("ADMIN") or iso2

        rings = polygons_of(feat["geometry"])
        if not rings:
            continue
        largest = max(rings, key=lambda r: abs(ring_area(r)))
        if largest[0] != largest[-1]:
            largest = largest + [largest[0]]

        cx, cy = ring_centroid(largest)
        if not point_in_ring(cx, cy, largest):
            cx, cy = pole_of_inaccessibility(largest)

        out[iso2.upper()] = {
            "name": name,
            "lon": round(cx, 2),
            "lat": round(cy, 2),
        }

    lines = [
        "// Country points — GENERATED, do not hand-edit.",
        "//",
        "// Rebuild:  python3 scripts/supplychain/build_country_points.py \\",
        "//             ne110.geojson --out src/data/supplyChain/countryPoints.ts",
        "//",
        "// Every coordinate here is COMPUTED from public-domain geometry",
        f"// ({SOURCE_LABEL}),",
        "// never typed from memory. INVARIANTS §6 forbids a 'representative' lat/lon",
        "// guessed from a country name, and a hand-written table of country",
        "// coordinates is exactly that even when the numbers land close.",
        "//",
        "// The point is the visual centre of the country's LARGEST landmass: the",
        "// centroid of its biggest polygon, or — where that centroid falls in the sea,",
        "// as it does for Indonesia, Croatia and Norway — the interior point furthest",
        "// from any coastline.",
        "//",
        "// These are COUNTRY points, for country-level claims like \"Product of Mexico\".",
        "// They are NOT production centroids: cocoa grows in south-west Côte d'Ivoire,",
        "// not at the country's centre. That is why ORIGIN_POINTS exists separately and",
        "// stays hand-curated against a cited production region. Never use this table",
        "// to place a crop.",
        "",
        "export interface CountryPoint {",
        "  name: string;",
        "  lon: number;",
        "  lat: number;",
        "}",
        "",
        "/** Source for the coordinates in this file. */",
        "export const COUNTRY_POINTS_SOURCE = {",
        f"  label: '{SOURCE_LABEL}',",
        f"  url: '{SOURCE_URL}',",
        "} as const;",
        "",
        "export const COUNTRY_POINTS: Record<string, CountryPoint> = {",
    ]
    for iso2 in sorted(out):
        r = out[iso2]
        nm = r["name"].replace("\\", "\\\\").replace("'", "\\'")
        lines.append(f"  {iso2}: {{ name: '{nm}', lon: {r['lon']}, lat: {r['lat']} }},")
    lines += [
        "};",
        "",
        "/** Look up a country point by ISO 3166-1 alpha-2. Never guesses. */",
        "export function lookupCountryPoint(iso2: string | null | undefined): CountryPoint | null {",
        "  if (!iso2) return null;",
        "  return COUNTRY_POINTS[iso2.trim().toUpperCase()] ?? null;",
        "}",
        "",
    ]
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))
    print(f"wrote {args.out} with {len(out)} countries", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
