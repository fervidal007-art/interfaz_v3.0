#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_NAME="robomesha.service"

if [[ -f "/etc/systemd/system/$SERVICE_NAME" ]]; then
  printf '[git-hook] Ejecutando instalacion completa tras actualizar el repo\n'
  sudo "$ROOT_DIR/scripts/install_service.sh"
else
  printf '[git-hook] No existe %s; omitiendo instalacion automatica\n' "$SERVICE_NAME"
  printf '[git-hook] Para preparar esta maquina corre: sudo ./scripts/install_service.sh\n'
fi
