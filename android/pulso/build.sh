#!/usr/bin/env bash
# Requirements: JDK 17; Android SDK platform 35 and build-tools 35.0.0.
set -euo pipefail
cd "$(dirname "$0")"
: "${ANDROID_SDK_ROOT:?Set ANDROID_SDK_ROOT to the Android SDK path}"
BT="$ANDROID_SDK_ROOT/build-tools/35.0.0"
JAR="$ANDROID_SDK_ROOT/platforms/android-35/android.jar"
if [[ ! -f "$JAR" ]]; then JAR="$ANDROID_SDK_ROOT/platforms/android-35/android-35/android.jar"; fi
OUT="$PWD/build"
mkdir -p "$OUT/compiled" "$OUT/generated" "$OUT/classes" "$OUT/dex"
"$BT/aapt2" compile --dir app/src/main/res -o "$OUT/resources.zip"
"$BT/aapt2" link -o "$OUT/base.apk" -I "$JAR" --manifest app/src/main/AndroidManifest.xml --java "$OUT/generated" -A app/src/main/assets "$OUT/resources.zip"
find app/src/main/java "$OUT/generated" -name '*.java' > "$OUT/sources.txt"
javac -encoding UTF-8 -source 8 -target 8 -bootclasspath "$JAR:$BT/core-lambda-stubs.jar" -d "$OUT/classes" @"$OUT/sources.txt"
jar cf "$OUT/classes.jar" -C "$OUT/classes" .
"$BT/d8" --lib "$JAR" --min-api 26 --output "$OUT/dex" "$OUT/classes.jar"
cp "$OUT/base.apk" "$OUT/unsigned.apk"
(cd "$OUT/dex" && zip -q "$OUT/unsigned.apk" classes*.dex)
"$BT/zipalign" -f 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"
# CI validates compilation without signing or producing an installable update.
if [[ "${PULSO_UNSIGNED_ONLY:-0}" == "1" ]]; then echo "Android compilation verified; signing skipped."; exit 0; fi
# Preserve the existing installed app and its local history. Never generate a new key here.
: "${PULSO_KEYSTORE:?Set PULSO_KEYSTORE to the original Pulso signing key. A different key cannot update the installed app.}"
: "${PULSO_KEYSTORE_PASSWORD:?Set PULSO_KEYSTORE_PASSWORD}"
KEY="$PULSO_KEYSTORE"
[[ -f "$KEY" ]] || { echo "Original signing key not found" >&2; exit 1; }
"$BT/apksigner" sign --ks "$KEY" --ks-pass env:PULSO_KEYSTORE_PASSWORD --key-pass env:PULSO_KEYSTORE_PASSWORD --out "$OUT/Pulso-0.3.apk" "$OUT/aligned.apk"
"$BT/apksigner" verify --verbose "$OUT/Pulso-0.3.apk"
printf '\nAPK: %s\n' "$OUT/Pulso-0.3.apk"
