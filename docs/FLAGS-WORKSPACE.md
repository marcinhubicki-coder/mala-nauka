# Flagi — oddzielne środowisko pracy (v2)

Branch: `feature/flags-game-v2`
Base: `main` (stan produkcyjny zawierający ostatnią scaloną mechanikę Flag).

## Cel
Rozwijamy prawdziwą mechanikę Flag poza Design Studio: pytania, poprawne i błędne odpowiedzi, przejścia kamery / flagi / mapy, ekran końca gry, responsywność i wydajność na iPhone 13 Pro.

## Wejścia do testów
- Gra: `/flagi/`
- Izolowany podgląd: `/adventure-preview.html?screen=flags`
- Pytanie z flagą: `/flagi/preview-frame.html?country=pl`
- Błędna odpowiedź i mapa: `/flagi/preview-frame.html?country=pl&state=wrong`

## Zakres zmian
Pracuj przede wszystkim w `flagi/`, `data/flags.mjs`, `assets/flags/` i testach. Zmiany w `app.js`, ogólnych CSS i komponentach wspólnych wymagają kontroli wpływu na pozostałe moduły.

## Bezpieczny przepływ
1. Każda poprawka Flag idzie na tę gałąź, bez zmian w `main`, `refactor/v2-parity-first` i `design/system-v1`.
2. Testujemy zarówno podgląd stanów, jak i pełną rozgrywkę na iPhone 13 Pro.
3. Przed scaleniem porównujemy z aktualnym `main` oraz nowymi pracami nad Design Studio / v2.
4. Produkcję aktualizujemy dopiero po akceptacji.

Uwaga: Design Studio nie zastępuje silnika gry i nie jest źródłem prawdy dla tych przejść. Ten branch pozostaje osobnym miejscem pracy nad modułem Flagi.

## Wydajność materiału — pilotaż WebP (2026-10-13)

Problem: flagi/flag-cloth.mjs generuje jednorazowo statyczną fakturę z 1536 trójkątów i kolorowaniem każdego piksela. Nawet z cache przygotowanie nowego kraju może zajmować setki milisekund, a wygląd materiału nie zmienia się podczas gry.

Rozwiązanie: tools/build-flag-cloth-assets.mjs używa oryginalnego renderera w bezgłowym Chrome poza telefonem, a następnie eksportuje wynik do WebP z przezroczystością. Pilotaż obejmuje PL, GB, CH, NP, JP, CF. Rozmiar ok. 600 pikseli fizycznych szerokości; maks. 150 KiB / obraz.

flagi/flag-on-pole.mjs preferuje gotowy WebP tylko dla sześciu krajów. Przy poprawnym wczytaniu nie uruchamia kosztownego renderowania Canvas; maszt i tkanina nadal poruszają się razem przez CSS. Przy braku obrazka używa dotychczasowego Canvasa. Pozostałe kraje działają bez zmian.

Uruchamianie lokalnie (Node 22 i Chrome):
  npm install --no-save --no-package-lock playwright
  node tools/build-flag-cloth-assets.mjs
  node tools/sync-flags-offline-cache.mjs
  node --test tests/flags-prebaked.test.mjs

Pełna biblioteka dopiero po walidacji: node tools/build-flag-cloth-assets.mjs --all.

Workflow .github/workflows/flags-assets-pilot.yml generuje pilotaż na izolowanej gałęzi. Nie zmienia main ani Design Studio.

Warunki akceptacji: poprawne krawędzie Nepalu, kwadrat Szwajcarii, detale flag, wszystkie pliki do 150 KiB, brak Canvas przy trafieniu WebP, poprawne przejścia odpowiedzi, offline i pomiary na fizycznym iPhone 13 Pro. Tych testów nie wolno uznać za wykonane, zanim nie zostaną rzeczywiście potwierdzone.
