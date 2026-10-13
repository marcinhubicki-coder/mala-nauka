# Mała Nauka — oddzielenie scen od buildów V2

Przy około 119 MB obrazów, 401 plików w `assets/scenes/` zajmuje 93,4 MB. Sceny są rzadko aktualizowane, dlatego nie powinny być kopiowane do każdego nowego podglądu Design Studio.

## Zasada działania
- Oddzielne wydanie `assets/library-v1`, adres `https://mala-nauka-assets.vercel.app/`, zawiera zamrożony katalog `assets/`.
- Build `refactor/v2-parity-first` nie kopiuje katalogu `assets/scenes/`; Vercel obsługuje dotychczasowe ścieżki `/assets/scenes/...` przez rewrites do wydania assetowego. Kod aplikacji, ścieżki w JSON i układ PWA pozostają bez zmian.
- Niewielkie grafiki UI, SVG, fonty, avatary oraz `assets/managed/` nadal trafiają do aktualnych wydań. To świadomy etap pierwszy — uwolnienie 93 MB przy minimalnym ryzyku dla Studio.
- Podstawowe dane i wcześniej pobrane obrazy pozostają w cache Service Workera. Offline *nowych, nigdy niepobranych* ilustracji wymaga późniejszego świadomego pobrania.
- Nie zmieniać produkcyjnego `main` ani wersji V1. Test porównawczy w Chromium i na fizycznym Safari/iPhone jest warunkiem akceptacji.

## Publikacja nowej ilustracji sceny
1. Dodać plik i wpis w katalogu `design-system/assets.json` na branch V2. Nie publikować samego wpisu, zanim plik nie będzie dostępny na serwerze obrazów.
2. Zsynchronizować tylko zatwierdzone sceny do `assets/library-v1`, uruchomić **jeden** deployment assetowy, sprawdzić URL i nagłówki.
3. Dopiero potem opublikować zmianę modelu V2. W przyszłości przenieść obie czynności do zautomatyzowanego, weryfikowanego pipeline'u z manifestem wersji i rollbackiem.

## Kontrola 
- `mala-nauka-assets.vercel.app/assets/scenes/<plik>` odpowiada kodem 200.
- `mala-nauka-v2.vercel.app/assets/scenes/<plik>` odpowiada kodem 200 przez proxy.
- Wydanie V2 nie zawiera fizycznego katalogu `dist/assets/scenes/`.
- Nie ma nowych błędów obrazów w Home i 10-słownej rundzie Ortografii.
- `mala-nauka-v2.vercel.app/design-system/` zapisuje tylko na `refactor/v2-parity-first`, nigdy na `design/system-v1`.
- Zmiany wyglądu można sprawdzić w bezpośrednim preview V2. Produkcja pozostaje nienaruszona.

Ta migracja dotyczy **rozmiaru nowego deploymentu**, nie natychmiastowego usunięcia historycznej zajętości storage na koncie Vercel.
