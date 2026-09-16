# Flagi

Moduł flag korzysta ze wspólnej powłoki Małej Nauki.

Dane znajdują się w `data/flags.mjs`. Każdy rekord państwa ma pola:
- `id` — stabilny identyfikator ISO 3166-1 alpha-2,
- `country` — polska nazwa państwa,
- `countryEn` — angielska nazwa państwa używana po przełączeniu języka,
- `continent` — identyfikator kategorii kontynentu,
- `flagSvg` — ścieżka do lokalnego pliku SVG,
- `capital` — stolica zachowana pod przyszłe tryby nauki,
- `difficulty` — właściwy poziom konkretnej flagi (1 łatwa, 2 średnia, 3 trudna).

Kategorie: wszystkie, Europa, Azja, Afryka, Ameryka Północna, Ameryka Południowa i Oceania.

Przełącznik języka nazw krajów jest dostępny w module flag (PL / EN) i zapamiętuje wybór na urządzeniu. Zmienia nazwy na przyciskach odpowiedzi oraz nazwę kraju w feedbacku, bez zmiany mechaniki punktów.

Poziom w konfiguratorze flag jest poziomem startowym, a nie filtrem całej rundy. Interfejs używa suwaka Łatwe — Średnie — Trudne. Silnik obserwuje ostatnie odpowiedzi (poprawność i czas odpowiedzi) i stopniowo zwiększa udział trudniejszych flag. Nie losuje flag poniżej wybranego poziomu startowego. Przy starcie od trudnych używana jest wyłącznie pula trudna; jeśli wybrana kategoria nie ma rekordów na danym poziomie, mechanizm wybiera najbliższą dostępną pulę zamiast przerywać rundę.

Dla startu łatwego pierwsze trzy pytania są łatwe. Przy co najmniej 80% poprawnych i średnim czasie do 5,2 s pojawia się domieszka średnich; dalsze progi zwiększają udział średnich i następnie trudnych. Start średni działa podobnie, ale nigdy nie wraca do łatwych. Poziom widoczny przy pytaniu odpowiada trudności wylosowanej flagi, nie poziomowi startowemu.

Po błędnej odpowiedzi dla państwa europejskiego poprawna nazwa pojawia się najpierw przy fladze, a następnie flaga zmniejsza się i przesuwa do prawego górnego rogu kafla. W jej dotychczasowym miejscu pojawia się mapa Europy z podświetlonym krajem. Mapa ma osobne regiony z `data-country`, dzięki czemu może być później użyta w interaktywnym trybie wskazywania państwa.

Flagi i mapa są lokalnymi assetami, dzięki czemu mogą działać offline w PWA.