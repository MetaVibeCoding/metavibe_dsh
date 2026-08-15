#!/usr/bin/env bash
# Install metavibe-dsh into a DSH profile and mount it into an agent preset.
#
# Best-practice flow (follows the DSH composition rules):
#   1. install the npm package into the profile's node_modules
#   2. mount the read-only metavibe_* tools into an agent preset:
#        - an existing USER-owned preset (--preset <id>), or
#        - a NEW preset copied from a shipped base (--base, default: standard)
#   The shipped agent-presets directory is NEVER written to; a new preset is
#   copied into $DSH_HOME/.agent-presets and its metadata rewritten the same
#   way the host copy() API does (keep description, drop roster name/order).
#
# Usage:
#   ./scripts/install.sh                                # web profile + new "metavibe" preset (base: standard)
#   ./scripts/install.sh --profile tui                  # install into the tui profile
#   ./scripts/install.sh --preset pulsar-tqr            # mount into an existing USER preset
#   ./scripts/install.sh --preset mv-cordis --base cordis --name "Cordis + MetaVibe"
#   ./scripts/install.sh --skip-install --preset x      # only mount/verify (package already installed)
#
# After installing, RESTART `dsh web` so the new package resolves, then pick
# the preset in the GUI session picker.
set -euo pipefail

PROFILE="web"
PRESET_ID=""
BASE_ID="standard"
PRESET_NAME=""
SKIP_INSTALL=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile) PROFILE="${2:?--profile requires a name}"; shift 2 ;;
    --preset) PRESET_ID="${2:?--preset requires an id}"; shift 2 ;;
    --base) BASE_ID="${2:?--base requires an id}"; shift 2 ;;
    --name) PRESET_NAME="${2:?--name requires text}"; shift 2 ;;
    --skip-install) SKIP_INSTALL=1; shift ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
PROFILE_DIR="$DSH_HOME/profiles/$PROFILE"
USER_PRESETS="$DSH_HOME/.agent-presets"
[[ -n "$PRESET_ID" ]] || PRESET_ID="metavibe"
[[ "$PRESET_ID" =~ ^[a-z0-9][a-z0-9-]*$ ]] || { echo "error: invalid preset id '$PRESET_ID' (use [a-z0-9][a-z0-9-]*)" >&2; exit 2; }

if [[ ! -d "$PROFILE_DIR" ]]; then
  echo "error: profile directory not found: $PROFILE_DIR" >&2
  echo "hint: start the profile once (e.g. 'dsh --profile $PROFILE') so it initializes." >&2
  exit 1
fi

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

# ── 2. resolve the target preset ────────────────────────────────────────────
USER_TARGET="$USER_PRESETS/$PRESET_ID"
SHIPPED_PRESETS="${SHIPPED_PRESETS:-}"
if [[ -z "$SHIPPED_PRESETS" && -n "$(command -v dsh || true)" ]]; then
  # the shipped preset set sits beside the dsh CLI's node_modules
  SHIPPED_PRESETS="$(dirname "$(dirname "$(command -v dsh)")")/@deepseek-ai/dsh/config/agent-presets"
fi

if [[ -d "$USER_TARGET" ]]; then
  MODE="mount-existing"
  echo "→ mounting into existing user preset '$PRESET_ID' ($USER_TARGET)"
elif [[ -n "$SHIPPED_PRESETS" && -d "$SHIPPED_PRESETS/$PRESET_ID" ]]; then
  echo "error: '$PRESET_ID' is a SHIPPED preset — editing it is forbidden." >&2
  echo "hint: create a user copy instead: --preset <new-id> --base $PRESET_ID" >&2
  exit 1
else
  MODE="create"
  mkdir -p "$USER_PRESETS"
  BASE_SRC=""
  if [[ -n "$SHIPPED_PRESETS" && -d "$SHIPPED_PRESETS/$BASE_ID" ]]; then
    BASE_SRC="$SHIPPED_PRESETS/$BASE_ID"
  elif [[ -d "$USER_PRESETS/$BASE_ID" ]]; then
    BASE_SRC="$USER_PRESETS/$BASE_ID"
  else
    echo "error: base preset '$BASE_ID' not found (shipped or user)" >&2
    exit 1
  fi
  echo "→ creating user preset '$PRESET_ID' from base '$BASE_ID'"
  cp -R "$BASE_SRC" "$USER_TARGET"
  # rewrite preset.yml like the host copy() API: keep description, set name,
  # drop the roster `order` and any other roster-only fields
  python3 - "$USER_TARGET/preset.yml" "${PRESET_NAME:-MetaVibe}" <<'PYEOF'
import pathlib, re, sys
path, name = sys.argv[1], sys.argv[2]
src = pathlib.Path(path).read_text(encoding="utf-8")
desc = ""
m = re.search(r"(?m)^description:\s*(.+?)\s*$", src)
if m:
    desc = m.group(1).strip()
pathlib.Path(path).write_text(
    f"name: {name}\ndescription: {desc}\n", encoding="utf-8"
)
PYEOF
fi

# ── 3. mount the metavibe row (idempotent) ─────────────────────────────────
CFG="$USER_TARGET/agent.cordis.yml"
[[ -f "$CFG" ]] || { echo "error: $CFG not found in preset '$PRESET_ID'" >&2; exit 1; }
if grep -qF 'name: metavibe-dsh' "$CFG"; then
  echo "→ metavibe-dsh row already present in '$PRESET_ID' (idempotent, nothing to do)"
else
  cat >> "$CFG" <<'EOF'

# ── metavibe ────────────────────────────────────────────────────────────────

# MetaVibe: read-only architecture advisor (golden architecture map +
# best-practices catalog). Publishes no service and consumes only the `tools`
# registry, so it sits loose in this preset — no isolate realm needed.
- id: tool-metavibe
  name: metavibe-dsh
EOF
  echo "→ appended metavibe-dsh row to $CFG"
fi

# ── 4. verify ──────────────────────────────────────────────────────────────
COUNT="$(grep -cF 'name: metavibe-dsh' "$CFG")"
[[ "$COUNT" -eq 1 ]] || { echo "error: expected exactly one metavibe-dsh row, found $COUNT" >&2; exit 1; }
VERSION="$(python3 -c "import json;print(json.load(open('$PROFILE_DIR/node_modules/metavibe-dsh/package.json'))['version'])")"

cat <<EOF

✔ installed metavibe-dsh@$VERSION into profile '$PROFILE' and mounted it in preset '$PRESET_ID'.
Next steps:
  1. RESTART the dsh server (e.g. 'dsh web') so the newly installed package resolves.
  2. In the GUI session picker, select the "$( [[ "$MODE" == "create" ]] && echo "${PRESET_NAME:-MetaVibe}" || echo "$PRESET_ID" )" preset.
  3. In that session, metavibe_hub_list / metavibe_catalog_tree / metavibe_catalog_inspect are available.
EOF
