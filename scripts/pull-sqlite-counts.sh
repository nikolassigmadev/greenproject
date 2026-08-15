#!/usr/bin/env bash
# pull-sqlite-counts.sh
# Downloads the most-scanned-products COUNTER from goodscan.shop to ~/Downloads.
#
# This reads the lightweight SQLite tally (data/scans.db) — one aggregated row
# per product, with a scan count. It is NOT the rich log: verdicts, decisions,
# priorities, swap signals, dwell and the scanned photos all live in Postgres
# (ai_scans) and none of them appear here.
#
# The old name (pull-scans.sh) invited exactly that confusion, which is how
# someone eventually answers a question about user behaviour with a popularity
# counter. For the rich log, query ai_scans directly — see db/schema.sql.
#
# Usage:  ./scripts/pull-sqlite-counts.sh
# Search:          Q="coffee" ./scripts/pull-sqlite-counts.sh
# More rows:       LIMIT=2000 ./scripts/pull-sqlite-counts.sh
# Override server: BACKEND=http://localhost:3001 ./scripts/pull-sqlite-counts.sh

set -e

BACKEND="${BACKEND:-https://goodscan.shop}"
LIMIT="${LIMIT:-1000}"
Q="${Q:-}"
OUT="$HOME/Downloads/goodscan-scans-$(date +%Y-%m-%d).json"

printf "admin password: "
stty -echo
IFS= read -r PASSWORD
stty echo
printf "\n"

if [ -z "$PASSWORD" ]; then
  echo "No password entered." >&2
  exit 1
fi

# JSON-escape password (backslash + quote)
ESC_PW=$(printf '%s' "$PASSWORD" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')

# 1. Login -> grab session token
LOGIN_RESPONSE=$(curl -sS -X POST "$BACKEND/api/admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"$ESC_PW\"}")

TOKEN=$(printf '%s' "$LOGIN_RESPONSE" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

if [ -z "$TOKEN" ]; then
  echo "Login failed. Server said: $LOGIN_RESPONSE" >&2
  exit 1
fi

# 2. Download the scan report (URL-encode the query crudely; spaces -> %20)
QENC=$(printf '%s' "$Q" | sed 's/ /%20/g')
HTTP_CODE=$(curl -sS -w "%{http_code}" \
  "$BACKEND/api/admin/scans?limit=$LIMIT&q=$QENC" \
  -H "X-Admin-Token: $TOKEN" \
  -o "$OUT")

if [ "$HTTP_CODE" != "200" ]; then
  echo "Download failed (HTTP $HTTP_CODE)." >&2
  rm -f "$OUT"
  exit 1
fi

# 3. Logout (best-effort)
curl -sS -X POST "$BACKEND/api/admin/logout" \
  -H "X-Admin-Token: $TOKEN" > /dev/null 2>&1 || true

# 4. Pretty-print + summarise with jq if available.
if command -v jq >/dev/null 2>&1; then
  TMP="$OUT.tmp"
  if jq . "$OUT" > "$TMP" 2>/dev/null; then mv "$TMP" "$OUT"; else rm -f "$TMP"; fi
  SUCCESS=$(jq -r '.success // false' "$OUT" 2>/dev/null || echo false)
  TOTAL=$(jq -r '.totalScans // 0' "$OUT" 2>/dev/null || echo 0)
  UNIQUE=$(jq -r '.uniqueProducts // 0' "$OUT" 2>/dev/null || echo 0)
else
  SUCCESS="?"; TOTAL="?"; UNIQUE="?"
fi

echo ""
if [ "$SUCCESS" = "false" ]; then
  echo "Server returned an error. Raw payload:"
  cat "$OUT"; echo ""
  exit 1
fi
echo "Saved scan report — $TOTAL total scans across $UNIQUE unique products."
echo "  $OUT"

if command -v jq >/dev/null 2>&1 && [ "$TOTAL" != "0" ] && [ "$TOTAL" != "?" ]; then
  echo ""
  echo "Top products:"
  jq -r '.products[:25][] | "  \(.count)×  \(.name)\(if .brand then "  — \(.brand)" else "" end)"' "$OUT"
fi
