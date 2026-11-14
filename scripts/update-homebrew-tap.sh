#!/usr/bin/env bash
# Writes Casks/andon.rb in the Homebrew tap for the release just published.
# Required: VERSION (v0.2.0), REPOSITORY (org/digital-andon), HOMEBREW_TAP (org/homebrew-tap), GH_TOKEN with push access.
set -euo pipefail

MARKETING_VERSION="${VERSION#v}"
SHA256="$(cut -d' ' -f1 app/build/Andon.dmg.sha256)"
TAP_DIR="$(mktemp -d)"

git clone --depth 1 "https://x-access-token:${GH_TOKEN}@github.com/${HOMEBREW_TAP}.git" "$TAP_DIR"
mkdir -p "$TAP_DIR/Casks"
sed -e "s|{{VERSION}}|$MARKETING_VERSION|g" -e "s|{{SHA256}}|$SHA256|g" -e "s|{{REPOSITORY}}|$REPOSITORY|g" \
  homebrew/andon.rb.template > "$TAP_DIR/Casks/andon.rb"

cd "$TAP_DIR"
git config user.name "andon-release"
git config user.email "andon-release@users.noreply.github.com"
git add Casks/andon.rb
git commit -m "andon $MARKETING_VERSION"
git push origin HEAD
