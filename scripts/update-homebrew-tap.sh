#!/usr/bin/env bash
# Writes Casks/digital-andon.rb in the Homebrew tap for the release just published.
# Required: VERSION (v0.2.0), REPOSITORY (org/digital-andon), HOMEBREW_TAP (org/homebrew-tap), GH_TOKEN with push access.
set -euo pipefail

MARKETING_VERSION="${VERSION#v}"
SHA256="$(cut -d' ' -f1 app/build/Digital-Andon.dmg.sha256)"
TAP_DIR="$(mktemp -d)"

git clone --depth 1 "https://x-access-token:${GH_TOKEN}@github.com/${HOMEBREW_TAP}.git" "$TAP_DIR"
mkdir -p "$TAP_DIR/Casks"
sed -e "s|{{VERSION}}|$MARKETING_VERSION|g" -e "s|{{SHA256}}|$SHA256|g" -e "s|{{REPOSITORY}}|$REPOSITORY|g" \
  homebrew/digital-andon.rb.template > "$TAP_DIR/Casks/digital-andon.rb"

cd "$TAP_DIR"
git config user.name "andon-release"
git config user.email "andon-release@users.noreply.github.com"
# The cask was called "andon" before the app was renamed Digital Andon.
git rm -q --ignore-unmatch Casks/andon.rb
git add Casks/digital-andon.rb
git -c commit.gpgsign=false commit -m "digital-andon $MARKETING_VERSION"
git push origin HEAD
