#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_NAME="robomesha.service"

printf '[git-hook] Ejecutando refresh de runtime tras actualizar el repo\n'
"$ROOT_DIR/scripts/update_runtime.sh"

if [[ -f "/etc/systemd/system/$SERVICE_NAME" ]]; then
  printf '[git-hook] Reiniciando %s para aplicar cambios\n' "$SERVICE_NAME"
  sudo systemctl restart "$SERVICE_NAME"
fi
