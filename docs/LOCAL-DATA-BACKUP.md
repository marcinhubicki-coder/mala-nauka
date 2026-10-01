# Local profile backup

Settings → **Kopia danych** exports a local JSON file and imports it on any Mała Nauka origin/device. There is no backend upload. The exported file contains all saved profiles, their avatars and salted PIN hashes, per-profile history/best/today/learning ledger, the current guest's progress when present, global settings and mode/wizard selections. PINs are never exported as plain digits. Images remain in the app's existing asset library.

Format: `format: "mala-nauka-backup"`, `version: 1`, ISO `createdAt`, `players: [{profile, progress}]`, `guestProgress`, `preferences: {settings, configs, spellingWizard}`. The profile includes stable `id`, `nickname`, `avatarId`, `pinEnabled`, `pinSalt`, `pinHash`, `createdAt`, `updatedAt`. New profiles use the eight-letter cap; legacy longer nicknames can be restored unchanged.

The file is limited to 5 MB. The reader validates the entire file, format/version, IDs, duplicates, avatars, dates and PIN metadata before any write. Progress/settings pass through the existing normalizers, preserving the durable mastery ledger independently of the 50-round history limit.

The import preview lists profile names and numbers of new/updated profiles and stored rounds. Matching IDs are restored exactly from the backup; unrelated existing profiles stay. Re-importing a file never creates duplicates. IndexedDB commits profiles/progress/migration metadata in one transaction; the localStorage fallback writes one document. Preference writes roll back if the profile transaction fails. Imported profiles are locked and the player chooser is shown, so PIN protection remains effective. Existing fallback PIN hashes continue to work on devices with Web Crypto.

Tests: `node --test tests/*.test.mjs`. Backup coverage checks portable protected/open profiles, preserved learning, same-ID restoration, malformed/oversized/future files, duplicate IDs, quota failure and legacy hash compatibility. UI checks cover download, file selection/preview/confirmation and rules jelly click/drag.
