# Design Studio v2 — audyt realnych ekranów (13 października 2026)

W Chromium o rozmiarze okna 390 × 844 otwarto 41 scenariuszy z `design-system/registry.json`. W każdym scenariuszu odczytano rzeczywiście wyrenderowane `data-ds-element`, `data-ds-recipe` i `data-ds-block`. Łącznie zebrano **1764 wystąpienia**. Nie było błędów JavaScript ani powielonych ID w obrębie badanych ekranów.

## Warstwy architektury

- **Pełny kontrakt renderera:** `home` — 1/41 ekranów; wspólny renderer i model danych.
- **Jawne komponenty częściowe:** 24 bloki ustawień ortografii, wraz z częścią starego renderera.
- **Zapisane, audytowane inwentarze DOM:** 41/41; są to migrujące adaptery, nie źródłowa definicja komponentów. Zasilają bibliotekę Studio bez masowego uruchamiania 41 iframe.
- **Silnik CLI:** może edytować element o sprawdzonym `view + id`, a zmiana jest zapisywana w `elementOverrides.<view>.<id>`. W starych widokach faktyczne zastosowanie stylu nadal zależy od adaptera `annotateElements`.

## Zachowanie i koszty

Katalog jest skompresowany do około 16 KB gzip / 21 KB base64 i rozpakowywany tylko w Design Studio albo narzędziu CLI. Gra produkcyjna **nie importuje katalogu**. Nie uruchamia się 41 iframe do samego budowania listy elementów; podgląd danego klocka nadal renderuje prawdziwy ekran.

## Pozostałe warunki ukończenia

Pełna migracja oznacza zastąpienie adaptera jawnie zdefiniowanymi komponentami w pozostałych rendererach, sprawdzenie stanu UI w trakcie animacji, stabilności ID po zmianach treści oraz porównanie wizualne i wydajnościowe na iPhonie. Ten etap nie potwierdza jeszcze tych warunków. Sprawdzić szczególnie wzajemną niezależność przycisków końca gry i semantykę atomu powrotu.
