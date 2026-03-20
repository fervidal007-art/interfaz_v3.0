#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_TEMPLATE="$ROOT_DIR/systemd/robomesha.service"
TARGET_SERVICE="/etc/systemd/system/robomesha.service"
TARGET_USER="${SUDO_USER:-}"

if [[ "$EUID" -ne 0 ]]; then
  printf 'Este script debe correrse con sudo.\n' >&2
  exit 1
fi

if [[ -z "$TARGET_USER" ]]; then
  printf 'No pude detectar el usuario que debe ejecutar el servicio. Corre este script con sudo desde tu usuario normal.\n' >&2
  exit 1
fi

TARGET_GROUP="$(id -gn "$TARGET_USER")"

sed \
  -e "s|__ROOT_DIR__|$ROOT_DIR|g" \
  -e "s|__SERVICE_USER__|$TARGET_USER|g" \
  -e "s|__SERVICE_GROUP__|$TARGET_GROUP|g" \
  "$SERVICE_TEMPLATE" > "$TARGET_SERVICE"
chmod 644 "$TARGET_SERVICE"

systemctl daemon-reload
systemctl enable robomesha.service

sudo -u "$TARGET_USER" "$ROOT_DIR/scripts/install_git_hooks.sh"

printf 'Servicio instalado. Para arrancarlo ahora usa:\n'
printf '  sudo systemctl start robomesha.service\n'
printf 'Para revisar logs:\n'
printf '  journalctl -u robomesha.service -f\n'
