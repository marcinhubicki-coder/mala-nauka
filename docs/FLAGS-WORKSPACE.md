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
