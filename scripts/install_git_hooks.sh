#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOK_SOURCE="$ROOT_DIR/scripts/git_post_update.sh"

log() {
  printf '[hooks] %s\n' "$*"
}

install_hook() {
  local repo_dir="$1"
  local git_dir
  local hook_name

  git_dir="$(git -C "$repo_dir" rev-parse --git-dir)"
  mkdir -p "$git_dir/hooks"

  for hook_name in post-merge post-rewrite; do
    cat > "$git_dir/hooks/$hook_name" <<EOF
#!/usr/bin/env bash
set -euo pipefail
"$HOOK_SOURCE"
EOF
    chmod +x "$git_dir/hooks/$hook_name"
    log "Hook $hook_name instalado en $repo_dir"
  done
}

install_hook "$ROOT_DIR"
