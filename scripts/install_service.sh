#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_TEMPLATE="$ROOT_DIR/systemd/robomesha.service"
TARGET_SERVICE="/etc/systemd/system/robomesha.service"
SERVICE_NAME="robomesha.service"
TARGET_USER="${SUDO_USER:-}"
HEALTH_URL="http://127.0.0.1:8000/health"

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

chown_if_exists() {
  local target_path="$1"
  if [[ -e "$target_path" ]]; then
    chown -R "$TARGET_USER:$TARGET_GROUP" "$target_path"
  fi
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
sudo -H -u "$TARGET_USER" env "PATH=$PATH" "$ROOT_DIR/scripts/update_runtime.sh"

log "Instalando hooks de git"
sudo -H -u "$TARGET_USER" env "PATH=$PATH" "$ROOT_DIR/scripts/install_git_hooks.sh"

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
