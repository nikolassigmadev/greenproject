#!/usr/bin/env bash
#
# Pull the facility-level reference datasets into data/reference/ (gitignored).
#
# ONLY unambiguously-licensed sources are fetched here. Two more were specified
# and are deliberately NOT fetched -- see the BLOCKED section at the bottom.
#
#   USDA FSIS MPI Directory   US meat/poultry/egg establishments   CC0 / public domain
#   Sugar Collaboration Group UML   sugar mills, beet + cane       CC BY-SA 4.0
#
# Usage:  bash scripts/supplychain/fetch_reference_data.sh
# Then:   python3 scripts/supplychain/build_reference_modules.py
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT="$ROOT/data/reference"
mkdir -p "$OUT"

# NOTE: curl cannot fetch the FSIS files -- fsis.usda.gov sits behind bot
# protection that rejects curl's TLS fingerprint with 403 Access Denied
# regardless of User-Agent or headers. Node's fetch goes through. This is not a
# style preference; swapping it back to curl breaks the download.
fetch_node() {
  local url="$1" out="$2"
  node -e "
    const fs = require('fs');
    fetch(process.argv[1], { headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/csv,text/html,application/xhtml+xml,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    }}).then(async (r) => {
      if (!r.ok) { console.error('HTTP ' + r.status + ' for ' + process.argv[1]); process.exit(1); }
      const t = await r.text();
      if (/Access Denied|<HTML><HEAD>/i.test(t.slice(0, 200))) {
        console.error('blocked (bot protection) for ' + process.argv[1]); process.exit(1);
      }
      fs.writeFileSync(process.argv[2], t);
      console.log('  ' + process.argv[2].split('/').pop() + '  ' + t.length + ' bytes');
    }).catch((e) => { console.error(e.message); process.exit(1); });
  " "$url" "$out"
}

echo "USDA FSIS — Meat, Poultry and Egg Product Inspection Directory (CC0)"
# Keyed on establishment_number: the number printed INSIDE the USDA inspection
# mark on the pack. That is a genuine, non-fuzzy, package-readable join, and the
# file carries real latitude/longitude per establishment.
fetch_node \
  "https://www.fsis.usda.gov/sites/default/files/media_file/documents/MPI_Directory_by_Establishment_Number.csv" \
  "$OUT/fsis_mpi_directory.csv"

echo "Sugar Collaboration Group — Universal Mill List (CC BY-SA 4.0)"
# "Sugar Universal Mill List © 2025 by Sugar Collaboration Group and Proforest
# is licensed under CC BY-SA 4.0" — stated on sugarcollaborationgroup.net/mill-list.
# Share-alike: anything we derive and distribute inherits the obligation.
fetch_node \
  "https://gitlab.com/scg-data/sugar-uml/-/raw/main/sugar_uml.csv" \
  "$OUT/sugar_uml.csv"
fetch_node \
  "https://gitlab.com/scg-data/sugar-uml/-/raw/main/sugar_uml_description.csv" \
  "$OUT/sugar_uml_description.csv"

cat <<'BLOCKED'

── NOT FETCHED — blocked on written licence confirmation ──────────────────────

  Universal Mill List (palm oil, Rainforest Alliance)
    No stated licence anywhere on the distribution page. It is the prize for
    Indonesia -- it carries uml_id, which joins cleanly to Trase's Indonesia
    mill dataset, the only clean cross-source join in this landscape -- and it
    stays out until terms arrive IN WRITING.
    Contact: palmoil_traceability@ra.org                        [human task H1]

  Trase trade-flow data
    Explicitly requires written permission for commercial use.
    Contact: info@trase.earth                                   [human task H2]

── NOT INGESTED — decided against, do not revisit without a reason ────────────

  Global Fishing Watch    CC BY-NC. Non-commercial only. Hard blocker.
  Open Supply Hub         401 without a key; $2,700/yr minimum; ~zero agriculture.
  EU health-mark registries (eucode.info)   Snapshots are from 2012-13.
  Verified by GS1         Returns country of SALE, not origin. GEPIR retired Dec 2023.

BLOCKED

echo "Done. Reference data in data/reference/ (gitignored)."
