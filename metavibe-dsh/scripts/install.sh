#!/usr/bin/env bash
# Install metavibe-dsh into a DSH profile as a PROFILE-LEVEL PLUGIN.
#
# Best-practice flow (plugin, not preset):
#   1. install the npm package into the profile's node_modules
#   2. insert the metavibe row into the profile's cordis.patch.yml via an
#      `- insert:` entry, so the plugin loads with the profile and its three
#      read-only tools are available in EVERY session — no agent preset to
#      pick, nothing to mount per preset.
#
# Usage:
#   ./scripts/install.sh                # install into the default 'web' profile
#   ./scripts/install.sh --profile tui  # install into a different profile
#   ./scripts/install.sh --skip-install # only (re)ensure the patch row
#
# After installing, RESTART `dsh web`; metavibe_* tools appear in all sessions.
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
PATCH="$PROFILE_DIR/cordis.patch.yml"

[[ -d "$PROFILE_DIR" ]] || { echo "error: profile directory not found: $PROFILE_DIR" >&2; exit 1; }
[[ -f "$PATCH" ]] || { echo "error: $PATCH not found (is this a dsh profile?)" >&2; exit 1; }

# ── 1. install the package into the profile ─────────────────────────────────
if [[ "$SKIP_INSTALL" -eq 0 ]]; then
  if command -v dsh >/dev/null 2>&1; then
    echo "→ dsh plugin --profile $PROFILE add metavibe-dsh"
    dsh plugin --profile "$PROFILE" add metavibe-dsh
  else
    echo "→ pnpm --dir $PROFILE_DIR add metavibe-dsh"
    pnpm --dir "$PROFILE_DIR" add metavibe-dsh
  fi
else
  echo "→ skipping package install (--skip-install)"
fi
[[ -f "$PROFILE_DIR/node_modules/metavibe-dsh/package.json" ]] \
  || { echo "error: metavibe-dsh is not installed in profile '$PROFILE' (run without --skip-install)" >&2; exit 1; }

# ── 2. insert (or keep) the profile-level plugin row ────────────────────────
INSERT_BLOCK='# metavibe-dsh loaded as a profile-level plugin (not an agent preset):
# its read-only tools are available in every session.
- insert:
    - id: tool-metavibe
      name: metavibe-dsh'

if grep -qF 'name: metavibe-dsh' "$PATCH"; then
  echo "→ metavibe-dsh row already present in $PATCH (idempotent, nothing to do)"
else
  # a fresh profile patch is `[]`; replace it with the insert entry
  if grep -qE '^\[[[:space:]]*\]$' "$PATCH"; then
    printf '%s\n' "$INSERT_BLOCK" > "$PATCH"
  else
    printf '\n%s\n' "$INSERT_BLOCK" >> "$PATCH"
  fi
  echo "→ inserted metavibe-dsh row into $PATCH"
fi

# ── 3. verify ──────────────────────────────────────────────────────────────
COUNT="$(grep -cF 'name: metavibe-dsh' "$PATCH")"
[[ "$COUNT" -eq 1 ]] || { echo "error: expected exactly one metavibe-dsh row, found $COUNT" >&2; exit 1; }
VERSION="$(python3 -c "import json;print(json.load(open('$PROFILE_DIR/node_modules/metavibe-dsh/package.json'))['version'])")"

cat <<EOF

✔ metavibe-dsh@$VERSION installed into profile '$PROFILE' as a profile-level plugin.
Next steps:
  1. RESTART the dsh server (e.g. 'dsh web') so the plugin layer loads.
  2. metavibe_hub_list / metavibe_catalog_tree / metavibe_catalog_inspect are
     available in EVERY session — no preset to pick.
EOF
