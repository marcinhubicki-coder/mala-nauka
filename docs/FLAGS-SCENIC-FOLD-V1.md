# Flagi — osobny wariant pejzażowy i pergamin 3D (v1)

Gałąź: `feature/flags-scenic-preview-v1`. Nie scalać do `main` ani Design Studio przed akceptacją.

## Test / wejście

- `flagi/scenic-preview.html?country=by` — prawdziwa rozgrywka w Europie
- `flagi/scenic-preview.html?country=by&state=correct&freeze=1` — poprawna odpowiedź, mapa i stolica
- `flagi/scenic-preview.html?country=by&state=wrong&freeze=1` — błędna odpowiedź i suwak
- `adventure-preview.html?screen=flag-scenic` — istniejący selektor telefonu; nowe trzy pozycje
- `docs/flags-adventure/qa-scenic/` — sześć zrzutów i pięć klatek przejściowych z Chromium

## Założenie efektu

Inspiracje: FreeFrontend — *3D Folding Paper Receipt Card*, *Treasure Map*, *Cards with Parallax Tilt Effect* (2026-10-13).

Po wyborze odpowiedzi drewniano-pergaminowe pytanie staje się osią rozkładanej karty. Trzy liście papieru wychodzą z dolnej krawędzi i obracają się w przestrzeni po osi X z niewielkim przeregulowaniem. Arkusz odsłania mapę równocześnie z otwieraniem; pozycja i rozmiary odpowiedzi pozostają stałe. W stanie stabilnym dekoracyjne liście nie są renderowane ani animowane.

Mapa Europy jest **jednym** WebP `assets/maps/europe-scenic.webp` (1360 × 1000), deterministycznie wygenerowanym ze źródłowej geometrii Natural Earth przez `tools/build-scenic-europe.mjs`. Dokładnie ten sam układ 680 × 500 jest użyty do wyróżnienia kraju z SVG `assets/maps/europe.svg`. Przy wyświetleniu usuwa się pozostałe ścieżki państw z DOM, pozostawiając z SVG tylko wyróżniony kształt i obrys / glow. Kadrowanie preferuje 6–11 **rzeczywiście widocznych** sąsiadów, a nie krajów dotykających jedynie krawędzi viewportu. Dostępny fallback mapy SVG, gdy WebP się nie wczyta.

Odpowiedź prawidłowa: mapa i stolica zostają widoczne przez dodatkowe 3,9 s; następne pytanie uruchamia się automatycznie. Odpowiedź błędna: brak automatycznego przejścia, obowiązuje suwak. W obu przypadkach pergamin zwija się od góry, odsłaniając następny, preładowany WebP flagi. Każda litera odpowiedzi rozpada się na 15 ziaren ciemnego piasku malowanych w jednym Canvas; ziarnka lądują na linii bazowej pola odpowiedzi, po czym pojawiają się nowe litery. Dla `prefers-reduced-motion` animacje 3D i piasku są pomijane. Pauza zatrzymuje również automatyczne przejście.

Subtelny parallax kart na desktopie: ruch 2° maksymalnie, tylko przy wskaźniku `hover: hover`, aktualizacje współdzielone w `requestAnimationFrame`, bez żyroskopu i bez aktywnej pętli na telefonie.

## Kontrola jakości

`.github/workflows/flags-scenic-preview.yml` automatycznie generuje atlas i screenshoty, przeprowadza test Białorusi (pytanie/poprawna/błędna), Polski na 390 × 700, Szwajcarii na 430 × 932 i przejścia po suwaku do zadania 2. W ostatniej serii 6/6 scen nie zgłaszało błędów JS ani poziomego overflow, a stany mapy miały jeden aktywny kształt SVG, raster `ready`, zgodny podpis państwa. Osobne klatki `unroll-a-first`, `unroll-b-crease`, `unroll-c-flat` i `rollup-in-flight` potwierdziły przebieg zagięć i rozsypywania liter.

Niepotwierdzone: fizyczny iPhone 13 Pro, Safari iOS PWA, FPS 60 oraz zachowanie połączenia offline. Obecna grafika chłopca i pieska wykorzystuje istniejące assety / tymczasowy element SVG i **wymaga jeszcze dopasowania wizualnego** do mockupu. To wariant eksperymentalny, nie publikacja produkcyjna.
