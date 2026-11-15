#!/usr/bin/env bash
# Builds a signed, notarised Digital-Andon.dmg and a Sparkle appcast in app/build/.
# Runs in the release workflow; also works locally on a Mac with the same environment variables set.
#
# Required: VERSION (e.g. v0.2.0), APPLE_TEAM_ID, NOTARY_KEY_ID, NOTARY_ISSUER_ID,
#           NOTARY_KEY_P8_BASE64 (or NOTARY_KEY_PATH), SPARKLE_PRIVATE_KEY, RELEASE_DOWNLOAD_PREFIX
# The Developer ID Application certificate must already be in a keychain.
set -euo pipefail

: "${VERSION:?Set VERSION, e.g. v0.2.0}"
: "${APPLE_TEAM_ID:?Set APPLE_TEAM_ID}"
: "${NOTARY_KEY_ID:?Set NOTARY_KEY_ID}"
: "${NOTARY_ISSUER_ID:?Set NOTARY_ISSUER_ID}"
: "${SPARKLE_PRIVATE_KEY:?Set SPARKLE_PRIVATE_KEY}"
: "${RELEASE_DOWNLOAD_PREFIX:?Set RELEASE_DOWNLOAD_PREFIX, e.g. https://github.com/org/digital-andon/releases/download/v0.2.0/}"

MARKETING_VERSION="${VERSION#v}"
# Sparkle compares build numbers, so derive a rising one from the version: 1.2.3 → 10203.
BUILD_NUMBER="${BUILD_NUMBER:-$(awk -F. '{ print $1 * 10000 + $2 * 100 + $3 }' <<< "$MARKETING_VERSION")}"
APP_DIR="$(cd "$(dirname "$0")/../app" && pwd)"
BUILD_DIR="$APP_DIR/build"
DERIVED_DATA="$BUILD_DIR/DerivedData"

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/dmg-staging" "$BUILD_DIR/appcast-input"
cd "$APP_DIR"

if [[ -z "${NOTARY_KEY_PATH:-}" ]]; then
  NOTARY_KEY_PATH="$BUILD_DIR/notary-key.p8"
  echo "$NOTARY_KEY_P8_BASE64" | base64 --decode > "$NOTARY_KEY_PATH"
fi

echo "==> Generating the Xcode project"
xcodegen generate

echo "==> Archiving $MARKETING_VERSION ($BUILD_NUMBER)"
xcodebuild -project Andon.xcodeproj -scheme Andon -configuration Release \
  -derivedDataPath "$DERIVED_DATA" -archivePath "$BUILD_DIR/Andon.xcarchive" \
  DEVELOPMENT_TEAM="$APPLE_TEAM_ID" MARKETING_VERSION="$MARKETING_VERSION" CURRENT_PROJECT_VERSION="$BUILD_NUMBER" \
  -quiet archive

cat > "$BUILD_DIR/ExportOptions.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key><string>developer-id</string>
  <key>signingStyle</key><string>manual</string>
  <key>signingCertificate</key><string>Developer ID Application</string>
  <key>teamID</key><string>$APPLE_TEAM_ID</string>
</dict>
</plist>
PLIST

echo "==> Exporting with Developer ID signing"
xcodebuild -exportArchive -archivePath "$BUILD_DIR/Andon.xcarchive" \
  -exportOptionsPlist "$BUILD_DIR/ExportOptions.plist" -exportPath "$BUILD_DIR/export" -quiet

echo "==> Building the disk image"
cp -R "$BUILD_DIR/export/Digital Andon.app" "$BUILD_DIR/dmg-staging/"
ln -s /Applications "$BUILD_DIR/dmg-staging/Applications"
hdiutil create -volname "Digital Andon" -srcfolder "$BUILD_DIR/dmg-staging" -ov -format UDZO "$BUILD_DIR/Digital-Andon.dmg"
codesign --force --timestamp --sign "Developer ID Application" "$BUILD_DIR/Digital-Andon.dmg"

echo "==> Notarising (this usually takes a few minutes)"
xcrun notarytool submit "$BUILD_DIR/Digital-Andon.dmg" \
  --key "$NOTARY_KEY_PATH" --key-id "$NOTARY_KEY_ID" --issuer "$NOTARY_ISSUER_ID" --wait
xcrun stapler staple "$BUILD_DIR/Digital-Andon.dmg"
spctl --assess --type open --context context:primary-signature --verbose "$BUILD_DIR/Digital-Andon.dmg"

echo "==> Writing the Sparkle appcast"
GENERATE_APPCAST="$(find "$DERIVED_DATA/SourcePackages/artifacts" -type f -name generate_appcast -path '*bin*' | head -1)"
cp "$BUILD_DIR/Digital-Andon.dmg" "$BUILD_DIR/appcast-input/"
echo "$SPARKLE_PRIVATE_KEY" | "$GENERATE_APPCAST" --ed-key-file - \
  --download-url-prefix "$RELEASE_DOWNLOAD_PREFIX" -o "$BUILD_DIR/appcast.xml" "$BUILD_DIR/appcast-input"

shasum -a 256 "$BUILD_DIR/Digital-Andon.dmg" | tee "$BUILD_DIR/Digital-Andon.dmg.sha256"
echo "==> Done: $BUILD_DIR/Digital-Andon.dmg and $BUILD_DIR/appcast.xml"
