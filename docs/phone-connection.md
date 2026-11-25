# Pulso Android → LifeOS

## Implemented

- Redesigned Today view with dated weight, steps, explicit strength yes/no, optional sleep/quality/energy/mood, priorities and weekly steps. Missing values stay null. Existing snapshots remain intact.
- Phone pairing, device revocation and authenticated daily reads; phone statistics are kept outside the personal snapshot to avoid cross-device overwrite conflicts.
- A random 256-bit device secret is shown once and only its SHA-256 hash is stored on the server. Android encrypts the secret with Android Keystore. It can only submit phone statistics, never read the personal account. All HTTP API responses use `Cache-Control: no-store`; the service worker excludes `/api/`.
- Daily usage payloads: total time in apps (not total screen time), app IDs/names/durations, sessions, hourly durations, notification counts only when coverage is available. No messages, notification text or session timeline are sent.
- Idempotent daily ingestion: newer snapshots replace older ones; complete days cannot be downgraded to partial. Days are never added across devices. The web uses the most recently observed device record for a day.
- Android: optional account pairing dialog, manual sync, foreground sync throttled to approximately 15 minutes, background sync in the existing approximate 6-hour archive job. Initial backfill sends the retained local history in batches of up to 31 days. Android may delay background jobs.

## Activation status 2026-11-25

- The owner chose the active Traka project `svcapoxxegsubakgnvyq`. The original LifeOS remains paused. `personal_members`, `personal_snapshots`, `personal_phone_devices`, and `personal_phone_usage_daily` are separate from Traka records. Only the existing owner's account is admitted; RLS isolates records. Production/preview configuration uses the active project.
- Authentication uses the existing Traka email/password account. Google is not enabled on that project. The production return URL is allowed without replacing Traka's existing URLs.
- Original Pulso is still installed and its signing key is unavailable. `build-connector.sh` creates **ar.pulso.connector**, a separate app named **Pulso Conector**. It never updates or removes `ar.pulso`. Sign the connector only with its own persistent release key.
- Connector reads the UsageStats events that Android still retains (the current reader probes eight days), then archives and synchronizes future daily summaries. It cannot read the original app's private database. Older original-app history remains there. Notification coverage begins only when its separate permission is enabled; no historical notifications are invented.
- Phone end-to-end verification requires installing the signed connector on the user's phone, granting Usage Access, generating a web pairing code and syncing. Database isolation/token/revocation checks are verified independently.

## Android build

JDK 17, Android SDK platform 35 / build tools 35.0.0. Set `ANDROID_SDK_ROOT`, `PULSO_KEYSTORE` (original key), and `PULSO_KEYSTORE_PASSWORD`, then `bash build.sh`. No signing secrets belong in Git. CI uses `PULSO_UNSIGNED_ONLY=1` to validate Java, resources and dex compilation without an installable signed release.

## Verification

- `npm run build`
- `node --experimental-strip-types --test tests/phone-usage.test.ts`
- `PGLITE_MODULE=/path/to/transient/@electric-sql/pglite/dist/index.js node tests/phone-database.mjs` (production migrations still need real Supabase)
- Browser QA: desktop, 390px phone and 768px tablet; optional partial registration saved and persisted after reload.
- Android CI: full SDK compilation plus existing SessionsTest / PeriodsTest.

## Token endpoint security

`personal_ingest_phone_usage` intentionally accepts an anonymous API call authenticated by an unpredictable, hashed device token; it writes only daily phone statistics belonging to that linked owner and never returns private snapshot data. `search_path` is empty and PUBLIC execution is revoked. The security advisor warning for anonymous SECURITY DEFINER execution is expected for this scoped ingestion endpoint. Other project advisories are pre-existing and are not changed here.

## Connector release 1.0

Package: `ar.pulso.connector`, versionCode 1; Android 8+ (min API 26). Signed APK SHA-256: `9787d4b9f4d0adb291a83eb80d000593bc235dbb618c5985a0b3f1566dee5785`. Signing certificate SHA-256: `9a5728d8d04d7f37b7719d5c7156a73b5b36083ba0fad98f9fbcab2a2040ced8`. Installable APK is served at `/downloads/Pulso-Conector-1.0.apk`. Private signing backup is retained outside the repository; future connector updates must use the same certificate.
