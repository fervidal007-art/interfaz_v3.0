#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

printf '[git-hook] Ejecutando refresh de runtime tras actualizar el repo\n'
"$ROOT_DIR/scripts/update_runtime.sh"
