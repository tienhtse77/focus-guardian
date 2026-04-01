#!/usr/bin/env bash
# Dev script: swaps in the dev manifest (with auto-reload service worker),
# runs watch build, and restores the production manifest on exit.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

PROD_MANIFEST="$PROJECT_DIR/public/manifest.json"
DEV_MANIFEST="$PROJECT_DIR/manifest.dev.json"
BACKUP_MANIFEST="$PROJECT_DIR/public/manifest.json.bak"

WATCH_PID=""

# Restore production manifest and kill background watcher on exit
cleanup() {
    if [ -n "$WATCH_PID" ]; then
        kill "$WATCH_PID" 2>/dev/null || true
    fi
    if [ -f "$BACKUP_MANIFEST" ]; then
        cp "$BACKUP_MANIFEST" "$PROD_MANIFEST"
        rm -f "$BACKUP_MANIFEST"
        echo ""
        echo "[dev] Restored production manifest."
    fi
}
trap cleanup EXIT

# Swap in dev manifest
cp "$PROD_MANIFEST" "$BACKUP_MANIFEST"
cp "$DEV_MANIFEST" "$PROD_MANIFEST"
echo "[dev] Using dev manifest (auto-reload enabled)."
echo "[dev] Load extension from: dist/browser/"
echo ""

# Build extras: content script + CSS
# Called after each Angular rebuild to repopulate files that ng build wipes.
build_extras() {
    npx esbuild src/content-script/facebook-interceptor.ts \
        --bundle --outfile=dist/browser/content-script.js --format=iife 2>/dev/null
    cp src/content-script/content-script.css dist/browser/content-script.css 2>/dev/null
    npx @tailwindcss/cli -i src/styles.css -o dist/browser/styles.css \
        --content "src/**/*.{html,ts}" 2>/dev/null
}

# Background loop: watches for main.js changes (signals ng rebuild finished)
# and rebuilds extras each time.
watch_extras() {
    local last_hash=""
    while true; do
        if [ -f "$PROJECT_DIR/dist/browser/main.js" ]; then
            local current_hash
            current_hash=$(stat -c %Y "$PROJECT_DIR/dist/browser/main.js" 2>/dev/null || stat -f %m "$PROJECT_DIR/dist/browser/main.js" 2>/dev/null || echo "")
            if [ -n "$current_hash" ] && [ "$current_hash" != "$last_hash" ]; then
                last_hash="$current_hash"
                cd "$PROJECT_DIR"
                build_extras
                echo "[dev] Content script rebuilt."
            fi
        fi
        sleep 1
    done
}

cd "$PROJECT_DIR"

# Start extras watcher in background
watch_extras &
WATCH_PID=$!

# Run Angular watch build (foreground — Ctrl+C stops everything via trap)
echo "[dev] Starting watch mode..."
npx ng build --watch --configuration development
