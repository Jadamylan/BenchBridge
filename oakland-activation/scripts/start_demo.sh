#!/usr/bin/env bash
# One command for the hackathon demo.
# API  http://127.0.0.1:8000
# App  http://127.0.0.1:3010/demo
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
pip install -q -r requirements.txt
python scripts/build_data.py

export DEMO_MODE=true
export WORKFORCE_SOURCE_MODE=DEMO

if curl -sf "http://127.0.0.1:8000/api/health" >/dev/null 2>&1; then
  echo "API already listening on 8000"
else
  uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 > /tmp/benchbridge-api.log 2>&1 &
  echo $! > /tmp/benchbridge-api.pid
  echo "API starting on 8000 (log /tmp/benchbridge-api.log)"
fi

cd "$ROOT/frontend"
if [[ ! -d node_modules ]]; then
  npm install
fi
if curl -sf "http://127.0.0.1:3010" >/dev/null 2>&1; then
  echo "App already listening on 3010"
else
  npx next dev --port 3010 > /tmp/benchbridge-web.log 2>&1 &
  echo $! > /tmp/benchbridge-web.pid
  echo "App starting on 3010 (log /tmp/benchbridge-web.log)"
fi

for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
  api="$(curl -sf -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/api/health || true)"
  web="$(curl -sf -o /dev/null -w "%{http_code}" http://127.0.0.1:3010 || true)"
  if [[ "$api" == "200" && "$web" == "200" ]]; then
    echo "API = http://127.0.0.1:8000"
    echo "App = http://127.0.0.1:3010/demo"
    exit 0
  fi
  sleep 1
done
echo "Demo servers did not become ready. See /tmp/benchbridge-api.log and /tmp/benchbridge-web.log" >&2
exit 1
