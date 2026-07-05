#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
COOKIE_JAR=$(mktemp)
TODAY=$(date +%Y-%m-%d)

function show {
  local label="$1"
  echo ""
  echo "==> $label"
  shift
  "$@" | head -n 10
}

show "Health check" curl -s "$BASE_URL/health"

show "Login" curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -c "$COOKIE_JAR" \
  -d '{"name":"admin","password":"admin123"}'

echo ""
echo "==> Logout (optional, then re-login)"
curl -s -X POST "$BASE_URL/api/auth/logout" \
  -b "$COOKIE_JAR" -c "$COOKIE_JAR"

curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -c "$COOKIE_JAR" \
  -d '{"name":"admin","password":"admin123"}' > /dev/null

show "List tortillerias (check initial_stock=50)" curl -s "$BASE_URL/api/tortillerias" -b "$COOKIE_JAR"

TORT_ID=$(curl -s "$BASE_URL/api/tortillerias" -b "$COOKIE_JAR" | jq -r '.data[0].id')
echo "Main tortilleria id: $TORT_ID"

show "Create secondary tortilleria" curl -s -X POST "$BASE_URL/api/tortillerias" \
  -H "Content-Type: application/json" -b "$COOKIE_JAR" \
  -d "{\"name\":\"Sucursal Norte\",\"is_main\":false,\"main_tortilleria_id\":\"$TORT_ID\"}"

show "Create movimiento llegada" curl -s -X POST "$BASE_URL/api/movements" \
  -H "Content-Type: application/json" -b "$COOKIE_JAR" \
  -d "{\"day\":\"$TODAY\",\"type\":\"llegada\",\"sacks\":20,\"tortilleria_id\":\"$TORT_ID\"}"

show "Create movimiento uso" curl -s -X POST "$BASE_URL/api/movements" \
  -H "Content-Type: application/json" -b "$COOKIE_JAR" \
  -d "{\"day\":\"$TODAY\",\"type\":\"uso\",\"sacks\":15,\"tortilleria_id\":\"$TORT_ID\"}"

show "List movements" curl -s "$BASE_URL/api/movements?tortilleria_id=$TORT_ID" -b "$COOKIE_JAR"

show "Today's summary (inicio=50, llegadas=20, usos=15, quedo=55)" curl -s "$BASE_URL/api/movements/today?tortilleria_id=$TORT_ID" -b "$COOKIE_JAR"

show "Range summary" curl -s "$BASE_URL/api/movements/summary?from=$TODAY&to=$TODAY&tortilleria_id=$TORT_ID" -b "$COOKIE_JAR"

rm -f "$COOKIE_JAR"

echo ""
echo "==> Smoke tests complete"
