#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_TEMPLATE="$ROOT_DIR/systemd/robomesha.service"
TARGET_SERVICE="/etc/systemd/system/robomesha.service"

if [[ "$EUID" -ne 0 ]]; then
  printf 'Este script debe correrse con sudo.\n' >&2
  exit 1
fi

sed "s|__ROOT_DIR__|$ROOT_DIR|g" "$SERVICE_TEMPLATE" > "$TARGET_SERVICE"
chmod 644 "$TARGET_SERVICE"

systemctl daemon-reload
systemctl enable robomesha.service

"$ROOT_DIR/scripts/install_git_hooks.sh"

printf 'Servicio instalado. Para arrancarlo ahora usa:\n'
printf '  sudo systemctl start robomesha.service\n'
printf 'Para revisar logs:\n'
printf '  journalctl -u robomesha.service -f\n'
