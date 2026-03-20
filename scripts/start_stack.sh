#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
VENV_DIR="$ROOT_DIR/.venv-robomesha"

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"
SKIP_UPDATE="${SKIP_UPDATE:-0}"
SKIP_AP="${SKIP_AP:-0}"

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

if [[ "$SKIP_AP" != "1" ]]; then
  "$ROOT_DIR/scripts/ensure_ap.sh"
fi

if [[ "$SKIP_UPDATE" != "1" ]]; then
  "$ROOT_DIR/scripts/update_runtime.sh"
fi

if [[ ! -x "$VENV_DIR/bin/python" ]]; then
  log "No existe el entorno virtual en $VENV_DIR. Ejecuta scripts/update_runtime.sh"
  exit 1
fi

log "Levantando backend y frontend build en http://$HOST:$PORT"
"$VENV_DIR/bin/python" -m uvicorn main:app \
  --host "$HOST" \
  --port "$PORT" \
  --app-dir "$BACKEND_DIR" &
SERVER_PID=$!

wait "$SERVER_PID"
