# Flagi v2 — przejście flaga → mapa kontynentu

Branch: `feature/flags-game-v2`. Wymagane etapy: pytanie, poprawna odpowiedź, błędna odpowiedź.
Nie wprowadzać do `main` ani Design Studio przed akceptacją.

## Kompozycja i mechanika

Pytanie: dotychczasowa pofalowana flaga WebP na maszcie, wewnątrz istniejącej karty. Bez ujawniania kraju/stolicy.

Po odpowiedzi: flaga (ten sam obraz WebP, bez nowego renderer'a i pliku) przemieszcza się transformacją do prawego górnego rogu i skaluje do 42%, z korektą przesunięcia na podstawie rzeczywistych wymiarów (obsługa Nepalu, kwadratowych flag, różnych viewportów). Maszt znika w 250 ms. Tło nieba zanika. W tej samej karcie pojawia się mapa kontynentu z istniejącego lokalnego SVG (6 map, bez osobnych bitmap dla państw), mocniejszy obrys wskazanego kraju, zielony/czerwony akcent, kompas i dolny pasek z nazwą kraju i stolicą.

Efekt „rozpuszczania”: osobny, jednorazowy, deterministyczny zestaw 11 miękkich plam gradientowych z różnymi opóźnieniami. Poruszają się wyłącznie przez opacity/transform; **bez** animowanych filtrów SVG i per-frame Canvas. Losowość oparta na kodzie kraju, aby wynik był powtarzalny. Zależny od płynności iPhone'a, nie jest fizyczną symulacją płynu.

Mapy: po `mount` istniejącej `MalaNaukaContinentMap` funkcja `focusContinentMap` jednorazowo przelicza `viewBox` z kontrolą granic (zoom 1.28) i wstawia dodatkową kopię zaznaczonego obrysu wyłącznie w roli efektu halo. Dane państw i geografii nie ulegają zmianie. Mikropaństwa mają fallback z map-microstates.js.

Przejścia: lot flagi 620 ms, odsłonięcie kontynentu ok. 600 ms, zwolnienie blokady prezentacji do 760 ms. `prefers-reduced-motion` skraca wszystkie przejścia do stanu końcowego. Przy braku mapy dostępny pozostaje opis kraju/stolicy; obraz flagi WebP nadal ma Canvas fallback.

## Różnice feedback

- Poprawna: złote błyski, zielony obrys karty i mocne wyróżnienie poprawnego kraju.
- Niepoprawna: delikatna czerwona poświata karty, zielony kraj poprawnej odpowiedzi, zachowanie czerwonego pola źle wskazanej odpowiedzi.
- Po obu odpowiedziach: identyczne wymiary i hitboxy pól odpowiedzi i karty. `Dalej` oraz zatrzymanie czasu pozostają pod kontrolą istniejącego silnika `Session`.

## Iteracje QA

1. Kompozycja i statyczne zdjęcia 8 scen: Polska — 3 stany, Nepal, Szwajcaria, Republika Środkowoafrykańska oraz widoki 390 × 700 i 430 × 932.
2. Wzmocniony obrys kraju z oddzielnym SVG halo, większy zoom, różne kolory odpowiedzi.
3. Po porównaniu klatek wczesnej/środkowej/końcowej wzmocniona animacja lotu flagi i przełożone nad curtain gradientowe krople, by nie znikały podczas fade-out tła.

Zrzuty i automatycznie obliczone prostokąty dostępne w `docs/flags-adventure/qa-reveal-v2/`. QA skrypt `tools/flags-reveal-qa.mjs`, testy `tests/flags-reveal-v2.test.mjs`, workflow `.github/workflows/flags-reveal-qa.yml`.

Trzeba zweryfikować fizycznego iPhone'a 13 Pro: 60 fps podczas jednorazowego reveal, Safari PWA, `prefers-reduced-motion`, działa offline. Desktopowe screenshoty Chromium **nie są pomiarem iOS FPS**.
