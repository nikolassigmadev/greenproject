#!/usr/bin/env bash
# pull-logs.sh
# Downloads the permanent OpenAI call log from goodscan.shop to ~/Downloads.
# Usage:  ./scripts/pull-logs.sh
# Override server with: BACKEND=http://localhost:3001 ./scripts/pull-logs.sh

set -e

BACKEND="${BACKEND:-https://goodscan.shop}"
OUT="$HOME/Downloads/openai-logs-$(date +%Y-%m-%d).jsonl"

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

# 2. Download the log file
HTTP_CODE=$(curl -sS -w "%{http_code}" "$BACKEND/api/admin/openai-logs" \
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

LINES=$(wc -l < "$OUT" | tr -d ' ')
SIZE=$(wc -c < "$OUT" | tr -d ' ')

echo ""
if [ "$LINES" = "0" ]; then
  echo "Downloaded — file is empty (no OpenAI calls logged yet)."
else
  echo "Downloaded $LINES log entries ($SIZE bytes)."
fi
echo "  $OUT"
