#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"
STATE_DIR="$ROOT_DIR/.runtime-state"
VENV_DIR="$ROOT_DIR/.venv-robomesha"

mkdir -p "$STATE_DIR"

log() {
  printf '[update] %s\n' "$*"
}

sha256_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

needs_refresh() {
  local manifest="$1"
  local state_file="$2"
  local current_hash

  current_hash="$(sha256_file "$manifest")"
  if [[ ! -f "$state_file" ]] || [[ "$current_hash" != "$(cat "$state_file")" ]]; then
    printf '%s' "$current_hash" > "$state_file"
    return 0
  fi

  return 1
}

ensure_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "Falta el comando requerido: $1"
    exit 1
  fi
}

python_module_missing() {
  local module_name="$1"
  "$VENV_DIR/bin/python" -c "import $module_name" >/dev/null 2>&1
}

ensure_cmd python3
ensure_cmd pnpm

FRONTEND_MANIFEST="$FRONTEND_DIR/package.json"
FRONTEND_LOCKFILE="$FRONTEND_DIR/pnpm-lock.yaml"
BACKEND_REQUIREMENTS="$BACKEND_DIR/requirements.txt"

frontend_install_needed=0
backend_install_needed=0

if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  frontend_install_needed=1
fi

if [[ ! -d "$VENV_DIR" ]]; then
  backend_install_needed=1
fi

if [[ -x "$VENV_DIR/bin/python" ]]; then
  if ! python_module_missing uvicorn || ! python_module_missing fastapi; then
    backend_install_needed=1
  fi
fi

if needs_refresh "$FRONTEND_MANIFEST" "$STATE_DIR/frontend-package.sha256"; then
  frontend_install_needed=1
fi

if [[ -f "$FRONTEND_LOCKFILE" ]] && needs_refresh "$FRONTEND_LOCKFILE" "$STATE_DIR/frontend-lock.sha256"; then
  frontend_install_needed=1
fi

if needs_refresh "$BACKEND_REQUIREMENTS" "$STATE_DIR/backend-requirements.sha256"; then
  backend_install_needed=1
fi

if (( frontend_install_needed )); then
  log "Instalando dependencias del frontend"
  pnpm --dir "$FRONTEND_DIR" install --frozen-lockfile
else
  log "Frontend sin cambios de dependencias"
fi

if (( backend_install_needed )); then
  log "Preparando entorno de Python"
  python3 -m venv "$VENV_DIR"
  "$VENV_DIR/bin/pip" install --upgrade pip
  "$VENV_DIR/bin/pip" install -r "$BACKEND_REQUIREMENTS"
else
  log "Backend sin cambios de dependencias"
fi

log "Construyendo frontend en modo build"
pnpm --dir "$FRONTEND_DIR" build

log "Runtime listo"
