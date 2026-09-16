# Flagi

Moduł flag korzysta ze wspólnej powłoki Małej Nauki.

Dane znajdują się w `data/flags.mjs`. Każdy rekord państwa ma pola:
- `id` — stabilny identyfikator ISO 3166-1 alpha-2,
- `country` — polska nazwa państwa,
- `countryEn` — angielska nazwa państwa używana po przełączeniu języka,
- `continent` — identyfikator kategorii kontynentu,
- `flagSvg` — ścieżka do lokalnego pliku SVG,
- `capital` — stolica zachowana pod przyszłe tryby nauki,
- `difficulty` — poziom używany przez obecną mechanikę gry.

Kategorie: wszystkie, Europa, Azja, Afryka, Ameryka Północna, Ameryka Południowa i Oceania.

Przełącznik języka nazw krajów jest dostępny w module flag (PL / EN) i zapamiętuje wybór na urządzeniu. Zmienia nazwy na przyciskach odpowiedzi oraz nazwę kraju w feedbacku, bez zmiany mechaniki punktów.

Po błędnej odpowiedzi dla państwa europejskiego poprawna nazwa pojawia się najpierw przy fladze, a następnie flaga zmniejsza się i przesuwa do prawego górnego rogu kafla. W jej dotychczasowym miejscu pojawia się mapa Europy z podświetlonym krajem. Mapa ma osobne regiony z `data-country`, dzięki czemu może być później użyta w interaktywnym trybie wskazywania państwa.

Flagi i mapa są lokalnymi assetami, dzięki czemu mogą działać offline w PWA.
