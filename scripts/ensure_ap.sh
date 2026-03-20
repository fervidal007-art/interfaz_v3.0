#!/usr/bin/env bash

set -euo pipefail

AP_NAME="${AP_NAME:-ROBOMESHA}"
AP_IFACE="${AP_IFACE:-wlan0}"
AP_SSID="${AP_SSID:-ROBOMESHA}"
AP_PASSWORD="${AP_PASSWORD:-123456789}"

log() {
  printf '[ap] %s\n' "$*"
}

ensure_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "Falta el comando requerido: $1"
    exit 1
  fi
}

ensure_cmd nmcli

if ! nmcli -t -f NAME connection show | grep -Fxq "$AP_NAME"; then
  log "Creando perfil del access point $AP_NAME"
  nmcli con add \
    type wifi \
    ifname "$AP_IFACE" \
    con-name "$AP_NAME" \
    autoconnect yes \
    ssid "$AP_SSID" \
    802-11-wireless.mode ap \
    802-11-wireless.band bg \
    ipv4.method shared \
    wifi-sec.key-mgmt wpa-psk \
    wifi-sec.psk "$AP_PASSWORD"
fi

log "Levantando access point $AP_NAME"
nmcli con up "$AP_NAME"

if nmcli -t -f NAME connection show --active | grep -Fxq "$AP_NAME"; then
  log "Access point activo"
else
  log "No se pudo validar que el access point quedara activo"
  exit 1
fi
