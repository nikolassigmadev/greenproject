#!/usr/bin/env bash
# Publish the origin index as a GitHub release.
#
# One-time:  gh auth login          (interactive — needs a browser)
# Then:      bash docs/outbox/publish-release.sh
#
# The artifact is gitignored (9.5 MB binary), so it is attached to the release
# rather than committed. Rebuild it with:
#   python3 scripts/supplychain/build_origin_index.py --local food.parquet --out origin_index
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."

TAG="origin-index-$(date +%Y-%m-%d)"
ART="data/origin_index.parquet"

[ -f "$ART" ] || { echo "Missing $ART — rebuild it first (see header)."; exit 1; }

gh release create "$TAG" "$ART" \
  --repo nikolassigmadev/greenproject \
  --title "Origin provenance index — $(date +%Y-%m-%d)" \
  --notes-file docs/outbox/RELEASE_NOTES.md

echo
echo "Published: https://github.com/nikolassigmadev/greenproject/releases/tag/$TAG"
