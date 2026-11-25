# Pulso Android → LifeOS

## Implemented

- Redesigned Today view with dated weight, steps, explicit strength yes/no, optional sleep/quality/energy/mood, priorities and weekly steps. Missing values stay null. Existing snapshots remain intact.
- Phone pairing, device revocation and authenticated daily reads; phone statistics are kept outside the personal snapshot to avoid cross-device overwrite conflicts.
- A random 256-bit device secret is shown once and only its SHA-256 hash is stored on the server. Android encrypts the secret with Android Keystore. It can only submit phone statistics, never read the personal account. All HTTP API responses use `Cache-Control: no-store`; the service worker excludes `/api/`.
- Daily usage payloads: total time in apps (not total screen time), app IDs/names/durations, sessions, hourly durations, notification counts only when coverage is available. No messages, notification text or session timeline are sent.
- Idempotent daily ingestion: newer snapshots replace older ones; complete days cannot be downgraded to partial. Days are never added across devices. The web uses the most recently observed device record for a day.
- Android: optional account pairing dialog, manual sync, foreground sync throttled to approximately 15 minutes, background sync in the existing approximate 6-hour archive job. Initial backfill sends the retained local history in batches of up to 31 days. Android may delay background jobs.

## Activation blockers observed 2026-11-25

1. Supabase LifeOS `gohbsqarzjdwunkcrjew` is INACTIVE. Restore was rejected because the account already has two active free projects. No other project was paused/deleted and no plan was upgraded. The owner needs to choose capacity or a plan; then restore this project and apply `supabase/migrations/0002_phone_usage.sql`. It has not been applied remotely.
2. The supplied `Pulso-codigo-y-guia.zip` includes source but no original APK signing key. Use the original keystore to produce an in-place Android 0.3 update (`ar.pulso`, versionCode 3). A new signing key cannot update 0.2. Do not uninstall 0.2: its local-only history would be lost. `build.sh` intentionally refuses to generate a replacement key.
3. End-to-end phone/account testing requires the restored database, migration and correctly signed update installed on the phone. These checks cannot be claimed from source checks alone.

## Android build

JDK 17, Android SDK platform 35 / build tools 35.0.0. Set `ANDROID_SDK_ROOT`, `PULSO_KEYSTORE` (original key), and `PULSO_KEYSTORE_PASSWORD`, then `bash build.sh`. No signing secrets belong in Git. CI uses `PULSO_UNSIGNED_ONLY=1` to validate Java, resources and dex compilation without an installable signed release.

## Verification

- `npm run build`
- `node --experimental-strip-types --test tests/phone-usage.test.ts`
- `node tests/phone-database.mjs` (uses the transient PGlite installation path described in that test; production migrations need real Supabase)
- Android CI: full SDK compilation plus existing SessionsTest / PeriodsTest.
