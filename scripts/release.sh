#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────
# Bookmark Dashboard - Release Zip Generator
# ─────────────────────────────────────────────
# Usage:
#   ./scripts/release.sh              # uses version from manifest.json
#   ./scripts/release.sh 1.2.0        # override version
#   ./scripts/release.sh --no-key     # skip PEM key bundling
#
# PEM key:
#   The script looks for config/credentials/key.pem
#   If found, it temporarily copies it as key.pem into the zip, then removes it.
#   This ensures the extension ID stays consistent across Chrome Web Store updates.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$PROJECT_DIR/dist"
PEM_DIR="$PROJECT_DIR/config/credentials"
PEM_FILE="$PEM_DIR/key.pem"
KEY_FILE="$PROJECT_DIR/key.pem"

NO_KEY=false
VERSION=""

# Parse arguments
for arg in "$@"; do
  case "$arg" in
    --no-key) NO_KEY=true ;;
    *)        VERSION="$arg" ;;
  esac
done

# Read version from manifest.json if not provided
if [[ -z "$VERSION" ]]; then
  VERSION=$(grep -o '"version": *"[^"]*"' "$PROJECT_DIR/manifest.json" | head -1 | sed 's/"version": *"//;s/"//')
fi

if [[ -z "$VERSION" ]]; then
  echo "Error: Could not determine version."
  exit 1
fi

ZIP_NAME="bookmark-dashboard-v${VERSION}.zip"

echo "──────────────────────────────────────"
echo "  Bookmark Dashboard - Release Builder"
echo "──────────────────────────────────────"
echo "  Version:  $VERSION"
echo "  Output:   dist/$ZIP_NAME"

# Handle PEM key
HAS_KEY=false
if [[ "$NO_KEY" == false ]] && [[ -f "$PEM_FILE" ]]; then
  cp "$PEM_FILE" "$KEY_FILE"
  HAS_KEY=true
  echo "  PEM key:  Bundled from config/credentials/"
elif [[ "$NO_KEY" == false ]]; then
  echo "  PEM key:  Not found at config/credentials/key.pem (skipped)"
fi
echo ""

# Cleanup function to always remove key.pem
cleanup() {
  if [[ -f "$KEY_FILE" ]]; then
    rm -f "$KEY_FILE"
  fi
}
trap cleanup EXIT

# Create dist directory
mkdir -p "$DIST_DIR"

# Remove old zip if it exists
rm -f "$DIST_DIR/$ZIP_NAME"

# Build the zip from the project root
cd "$PROJECT_DIR"

ZIP_CONTENTS=(
  manifest.json
  src/
  css/
  js/
  icons/icon16.png
  icons/icon48.png
  icons/icon128.png
)

if [[ "$HAS_KEY" == true ]]; then
  ZIP_CONTENTS+=(key.pem)
fi

zip -r "$DIST_DIR/$ZIP_NAME" \
  "${ZIP_CONTENTS[@]}" \
  -x "*.DS_Store" \
  -x "*__MACOSX*"

# Show results
ZIP_SIZE=$(du -h "$DIST_DIR/$ZIP_NAME" | cut -f1 | xargs)
FILE_COUNT=$(zipinfo -1 "$DIST_DIR/$ZIP_NAME" | wc -l | xargs)

echo ""
echo "  Done!"
echo "  File:   dist/$ZIP_NAME"
echo "  Size:   $ZIP_SIZE"
echo "  Files:  $FILE_COUNT"
if [[ "$HAS_KEY" == true ]]; then
  echo "  Key:    Included (key.pem)"
fi
echo ""
echo "  Next steps:"
echo "    1. Test: chrome://extensions → Load unpacked"
echo "    2. Upload: https://chrome.google.com/webstore/developer/dashboard"
echo "──────────────────────────────────────"
