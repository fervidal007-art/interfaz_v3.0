#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"
STATE_DIR="$ROOT_DIR/.runtime-state"
VENV_DIR="$ROOT_DIR/.venv-robomesha"
SERVICE_TEMPLATE="$ROOT_DIR/systemd/robomesha.service"
TARGET_SERVICE="/etc/systemd/system/robomesha.service"
SERVICE_NAME="robomesha.service"
TARGET_USER="${SUDO_USER:-}"
HEALTH_URL="http://127.0.0.1:8000/health"
PNPM_VERSION="${PNPM_VERSION:-9.15.9}"

if [[ "$EUID" -ne 0 ]]; then
  printf 'Este script debe correrse con sudo.\n' >&2
  exit 1
fi

if [[ -z "$TARGET_USER" ]]; then
  printf 'No pude detectar el usuario que debe ejecutar el servicio. Corre este script con sudo desde tu usuario normal.\n' >&2
  exit 1
fi

TARGET_GROUP="$(id -gn "$TARGET_USER")"

log() {
  printf '[install] %s\n' "$*"
}

ensure_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Falta el comando requerido: %s\n' "$1" >&2
    exit 1
  fi
}

run_as_target_user() {
  sudo -H -u "$TARGET_USER" env "PATH=$PATH" "$@"
}

chown_if_exists() {
  local target_path="$1"
  if [[ -e "$target_path" ]]; then
    chown -R "$TARGET_USER:$TARGET_GROUP" "$target_path"
  fi
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

python_module_available() {
  local module_name="$1"
  run_as_target_user "$VENV_DIR/bin/python" -c "import $module_name" >/dev/null 2>&1
}

pnpm_frontend() {
  run_as_target_user corepack pnpm@"$PNPM_VERSION" --dir "$FRONTEND_DIR" "$@"
}

install_runtime() {
  local frontend_manifest="$FRONTEND_DIR/package.json"
  local frontend_lockfile="$FRONTEND_DIR/pnpm-lock.yaml"
  local backend_requirements="$BACKEND_DIR/requirements.txt"
  local frontend_install_needed=0
  local backend_install_needed=0

  mkdir -p "$STATE_DIR"
  chown -R "$TARGET_USER:$TARGET_GROUP" "$STATE_DIR"

  if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
    frontend_install_needed=1
  fi

  if [[ ! -d "$VENV_DIR" ]]; then
    backend_install_needed=1
  fi

  if [[ -x "$VENV_DIR/bin/python" ]]; then
    if ! python_module_available uvicorn || ! python_module_available fastapi; then
      backend_install_needed=1
    fi
  fi

  if needs_refresh "$frontend_manifest" "$STATE_DIR/frontend-package.sha256"; then
    frontend_install_needed=1
  fi

  if [[ -f "$frontend_lockfile" ]] && needs_refresh "$frontend_lockfile" "$STATE_DIR/frontend-lock.sha256"; then
    frontend_install_needed=1
  fi

  if needs_refresh "$backend_requirements" "$STATE_DIR/backend-requirements.sha256"; then
    backend_install_needed=1
  fi

  chown -R "$TARGET_USER:$TARGET_GROUP" "$STATE_DIR"

  if (( frontend_install_needed )); then
    log "Instalando dependencias del frontend"
    pnpm_frontend install --frozen-lockfile
  else
    log "Frontend sin cambios de dependencias"
  fi

  if (( backend_install_needed )); then
    log "Preparando entorno de Python"
    run_as_target_user python3 -m venv "$VENV_DIR"
    run_as_target_user "$VENV_DIR/bin/pip" install --upgrade pip
    run_as_target_user "$VENV_DIR/bin/pip" install -r "$backend_requirements"
  else
    log "Backend sin cambios de dependencias"
  fi

  log "Construyendo frontend en modo build"
  pnpm_frontend build

  chown_if_exists "$VENV_DIR"
  chown_if_exists "$STATE_DIR"
  chown_if_exists "$FRONTEND_DIR/dist"
  chown_if_exists "$FRONTEND_DIR/node_modules"
}

wait_for_health() {
  local attempt
  for attempt in {1..20}; do
    if curl --silent --show-error --fail "$HEALTH_URL" >/dev/null; then
      return 0
    fi
    sleep 1
  done
  return 1
}

ensure_cmd curl
ensure_cmd corepack
ensure_cmd python3
ensure_cmd sudo
ensure_cmd systemctl

log "Ajustando permisos para $TARGET_USER"
mkdir -p \
  "$ROOT_DIR/.runtime-state" \
  "$ROOT_DIR/frontend/dist" \
  "$ROOT_DIR/frontend/node_modules" \
  "$ROOT_DIR/secuencias"
chown -R "$TARGET_USER:$TARGET_GROUP" "$ROOT_DIR"
chown_if_exists "$ROOT_DIR/.venv-robomesha"
chown_if_exists "$ROOT_DIR/.runtime-state"
chown_if_exists "$ROOT_DIR/frontend/dist"
chown_if_exists "$ROOT_DIR/frontend/node_modules"
chown_if_exists "$ROOT_DIR/secuencias"
chmod +x "$ROOT_DIR"/scripts/*.sh

log "Actualizando runtime y generando build"
install_runtime

log "Instalando hooks de git"
run_as_target_user "$ROOT_DIR/scripts/install_git_hooks.sh"

log "Instalando unidad systemd"
sed \
  -e "s|__ROOT_DIR__|$ROOT_DIR|g" \
  -e "s|__SERVICE_USER__|$TARGET_USER|g" \
  -e "s|__SERVICE_GROUP__|$TARGET_GROUP|g" \
  "$SERVICE_TEMPLATE" > "$TARGET_SERVICE"
chmod 644 "$TARGET_SERVICE"

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"

log "Arrancando servicio"
systemctl restart "$SERVICE_NAME"

if ! systemctl is-active --quiet "$SERVICE_NAME"; then
  printf 'El servicio no quedo activo.\n' >&2
  systemctl status --no-pager "$SERVICE_NAME" || true
  exit 1
fi

if ! wait_for_health; then
  printf 'El servicio arranco pero no respondio healthcheck en %s.\n' "$HEALTH_URL" >&2
  systemctl status --no-pager "$SERVICE_NAME" || true
  exit 1
fi

printf 'Bootstrap completo.\n'
printf 'Servicio activo y habilitado: %s\n' "$SERVICE_NAME"
printf 'Healthcheck OK: %s\n' "$HEALTH_URL"
printf 'Logs:\n'
printf '  journalctl -u %s -f\n' "$SERVICE_NAME"
