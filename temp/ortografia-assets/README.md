# Ortografia — temp assets

Katalog przejściowy do przeglądu brakujących grafik. Siedem gotowych ilustracji z `generated-map.json` jest od v24 podłączonych do gry: miód, sól, kółko, kura, budzik, muszla i pudełko. Kopie runtime znajdują się w `assets/scenes/`, przypisania w `spelling/scenes.mjs`, a pliki są uwzględnione w cache PWA.

Poniższe liczby oraz `manifest.json`, `missing-assets.csv` i plansze SVG są **historycznym wykazem braków sprzed integracji**, nie aktualnym rejestrem gry. Obecnie 134 słowa mają ilustrację, 270 pozostaje bez niej. Same kafelki/symbole na planszach nie są docelowymi ilustracjami.

- baza słów: 404
- słowa z już istniejącym assetem: 127
- słowa bez assetu: 277
- warianty: po **1 kandydacie** na brakujące słowo (bez alternatyw)

## Braki wg kategorii

- u/ó: 77
- rz/ż: 101
- ch/h: 63
- ć/ci: 6
- ś/si: 8
- ź/zi: 5
- ń/ni: 8
- dź/dzi: 9

## Pliki

- `manifest.json` — dokładne przypisanie słowo → plansza / pozycja / symbol
- `missing-assets.csv` — ta sama lista w formie tabeli
- `sheets/*.svg` — plansze przeglądowe kandydatów, po jednym kafelku na brakujące słowo

Pozostałe propozycje są odseparowane od katalogu produkcyjnego. Po przygotowaniu kolejnych docelowych ilustracji trzeba przenieść je do `assets/scenes/`, dodać mapowanie w kodzie oraz cache PWA i uruchomić walidator. Sam commit plików do `temp/` nie udostępnia ich w grze.
