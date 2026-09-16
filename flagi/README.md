# Flagi

Moduł flag korzysta ze wspólnej powłoki Małej Nauki.

Dane znajdują się w `data/flags.mjs`. Każdy rekord państwa ma pola:
- `id` — stabilny identyfikator ISO 3166-1 alpha-2,
- `country` — polska nazwa państwa,
- `continent` — identyfikator kategorii kontynentu,
- `flagSvg` — ścieżka do lokalnego pliku SVG,
- `capital` — stolica zachowana pod przyszłe tryby nauki,
- `difficulty` — poziom używany przez obecną mechanikę gry.

Kategorie: wszystkie, Europa, Azja, Afryka, Ameryka Północna, Ameryka Południowa i Oceania.
Flagi są lokalnymi assetami, dzięki czemu mogą działać offline w PWA.
