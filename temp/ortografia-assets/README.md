# Ortografia — temp assets

Katalog przejściowy do przeglądu brakujących grafik. **Nie jest podłączony do gry** i nie zmienia `spelling/scenes.mjs`.

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

Grafiki są celowo odseparowane od katalogu produkcyjnego. Po akceptacji konkretne kafelki można zastąpić docelowymi ilustracjami i dopiero wtedy przenieść do `assets/scenes/` oraz dodać mapowanie w kodzie.
