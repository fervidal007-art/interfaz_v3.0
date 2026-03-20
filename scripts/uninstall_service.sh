#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_NAME="${SERVICE_NAME:-robomesha.service}"
SERVICE_PATH="/etc/systemd/system/$SERVICE_NAME"

log() {
  printf '[uninstall] %s\n' "$*"
}

if [[ "$EUID" -ne 0 ]]; then
  printf 'Este script debe correrse con sudo.\n' >&2
  exit 1
fi

if systemctl list-unit-files | grep -Fq "$SERVICE_NAME"; then
  if systemctl is-active --quiet "$SERVICE_NAME"; then
    log "Deteniendo $SERVICE_NAME"
    systemctl stop "$SERVICE_NAME"
  fi

  if systemctl is-enabled --quiet "$SERVICE_NAME"; then
    log "Deshabilitando $SERVICE_NAME"
    systemctl disable "$SERVICE_NAME"
  fi
fi

if [[ -f "$SERVICE_PATH" ]]; then
  log "Eliminando unidad $SERVICE_PATH"
  rm -f "$SERVICE_PATH"
  systemctl daemon-reload
fi

for hook_name in post-merge post-rewrite; do
  hook_path="$ROOT_DIR/.git/hooks/$hook_name"
  if [[ -f "$hook_path" ]] && grep -Fq "git_post_update.sh" "$hook_path"; then
    log "Eliminando hook $hook_name"
    rm -f "$hook_path"
  fi
done

log "Desinstalacion completa"
