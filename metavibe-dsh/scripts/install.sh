#!/usr/bin/env bash
# Install metavibe-dsh into a DSH profile as an EXPLICIT profile-layer plugin.
#
# The package declares `dsh.bundle` (package.json -> dsh.bundle.patch), so
# `dsh plugin add` installs it AND automatically appends it to the profile's
# `dsh.profile.bundles` layer list. The plugin then loads with the profile
# and its three read-only tools are available in every session — no manual
# patch editing, no agent preset to pick.
#
# Usage:
#   ./scripts/install.sh                # install into the default 'web' profile
#   ./scripts/install.sh --profile tui  # a different profile
#   ./scripts/install.sh --skip-install # only verify the installed state
#
# After installing, RESTART `dsh web`.
set -euo pipefail

PROFILE="web"
SKIP_INSTALL=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile) PROFILE="${2:?--profile requires a name}"; shift 2 ;;
    --skip-install) SKIP_INSTALL=1; shift ;;
    -h|--help) sed -n '2,15p' "$0"; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
PROFILE_DIR="$DSH_HOME/profiles/$PROFILE"
[[ -d "$PROFILE_DIR" ]] || { echo "error: profile directory not found: $PROFILE_DIR" >&2; exit 1; }

# ── 1. install / update the package (reconcile adds it to bundles) ─────────
install_pkg() {
  if command -v dsh >/dev/null 2>&1; then
    echo "→ dsh plugin --profile $PROFILE add metavibe-dsh"
    dsh plugin --profile "$PROFILE" add metavibe-dsh
  else
    echo "→ pnpm --dir $PROFILE_DIR add metavibe-dsh"
    pnpm --dir "$PROFILE_DIR" add metavibe-dsh
  fi
}

if [[ "$SKIP_INSTALL" -eq 0 ]]; then
  install_pkg
fi
[[ -f "$PROFILE_DIR/node_modules/metavibe-dsh/package.json" ]] \
  || { echo "error: metavibe-dsh is not installed in profile '$PROFILE' (run without --skip-install)" >&2; exit 1; }

# ── 2. ensure the bundle layer is registered (old versions may need update) ─
bundled() {
  python3 - "$PROFILE_DIR/package.json" <<'PYEOF'
import json, sys
m = json.load(open(sys.argv[1]))
print('yes' if 'metavibe-dsh' in m.get('dsh', {}).get('profile', {}).get('bundles', []) else 'no')
PYEOF
}
if [[ "$(bundled)" != "yes" ]]; then
  echo "→ metavibe-dsh not in dsh.profile.bundles yet — running update to activate its dsh.bundle"
  dsh plugin --profile "$PROFILE" update metavibe-dsh 2>/dev/null || true
  [[ "$(bundled)" == "yes" ]] || { echo "error: metavibe-dsh still not a bundle layer; run 'dsh plugin --profile $PROFILE update metavibe-dsh'" >&2; exit 1; }
fi

# ── 3. verify ──────────────────────────────────────────────────────────────
VERSION="$(python3 -c "import json;print(json.load(open('$PROFILE_DIR/node_modules/metavibe-dsh/package.json'))['version'])")"

cat <<EOF

✔ metavibe-dsh@$VERSION installed into profile '$PROFILE' as an explicit
   profile-layer plugin (listed in dsh.profile.bundles).
Next steps:
  1. RESTART the dsh server (e.g. 'dsh web') so the bundle layer loads.
  2. metavibe_hub_list / metavibe_catalog_tree / metavibe_catalog_inspect are
     available in EVERY session — no preset to pick.
EOF
