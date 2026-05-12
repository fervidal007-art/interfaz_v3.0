#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
VENV_DIR="$ROOT_DIR/.venv-robomesha"

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"

log() {
  printf '[stack] %s\n' "$*"
}

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    log "Deteniendo backend"
    kill "$SERVER_PID"
    wait "$SERVER_PID" || true
  fi
}

trap cleanup EXIT INT TERM

if [[ ! -x "$VENV_DIR/bin/python" ]]; then
  log "No existe el entorno virtual en $VENV_DIR. Ejecuta sudo ./scripts/install_service.sh"
  exit 1
fi

if [[ ! -f "$ROOT_DIR/frontend/dist/index.html" ]]; then
  log "No existe el build del frontend. Ejecuta sudo ./scripts/install_service.sh"
  exit 1
fi

log "Levantando backend y frontend build en http://$HOST:$PORT"
"$VENV_DIR/bin/python" -m uvicorn main:app \
  --host "$HOST" \
  --port "$PORT" \
  --app-dir "$BACKEND_DIR" &
SERVER_PID=$!

wait "$SERVER_PID"
