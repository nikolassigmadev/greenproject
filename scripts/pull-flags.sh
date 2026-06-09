#!/usr/bin/env bash
# pull-flags.sh
# Downloads community-flag submissions (user-suggested brand flags) from
# goodscan.shop to ~/Downloads.
# Usage:  ./scripts/pull-flags.sh
# Filter by status:    STATUS=pending_review ./scripts/pull-flags.sh
#                      STATUS=approved        ./scripts/pull-flags.sh
#                      STATUS=rejected        ./scripts/pull-flags.sh
# Override server:     BACKEND=http://localhost:3001 ./scripts/pull-flags.sh

set -e

BACKEND="${BACKEND:-https://goodscan.shop}"
STATUS="${STATUS:-pending_review}"
OUT="$HOME/Downloads/community-flags-${STATUS}-$(date +%Y-%m-%d).json"

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

# 2. Download the flag submissions
HTTP_CODE=$(curl -sS -w "%{http_code}" \
  "$BACKEND/api/admin/community-flags?status=$STATUS" \
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

# 4. Pretty-print in place if jq is available — much nicer to read.
if command -v jq >/dev/null 2>&1; then
  TMP="$OUT.tmp"
  if jq . "$OUT" > "$TMP" 2>/dev/null; then
    mv "$TMP" "$OUT"
  else
    rm -f "$TMP"
  fi
fi

# Count submissions in the response.
if command -v jq >/dev/null 2>&1; then
  COUNT=$(jq 'length' "$OUT" 2>/dev/null || echo "?")
else
  # crude fallback: count "\"id\"" occurrences
  COUNT=$(grep -o '"id"' "$OUT" | wc -l | tr -d ' ')
fi
SIZE=$(wc -c < "$OUT" | tr -d ' ')

echo ""
if [ "$COUNT" = "0" ]; then
  echo "Downloaded — no $STATUS submissions yet."
else
  echo "Downloaded $COUNT $STATUS submission(s) ($SIZE bytes)."
fi
echo "  $OUT"

# Quick preview of the brand names if jq is around.
if command -v jq >/dev/null 2>&1 && [ "$COUNT" != "0" ] && [ "$COUNT" != "?" ]; then
  echo ""
  echo "Brands submitted:"
  jq -r '.[] | "  - \(.submission.brandName)  (\(.submission.category), \(.submission.severity))  [\(if .meetsSourcingBar then "✓ meets bar" else "✗ below bar" end)]"' "$OUT"
fi
