# v49 lokalnie — przywrócenie układu Flag

Status: lokalna gałąź `work/flags-layout-v49`, bez publikacji i bez zmian na `main`.
Bazą kompletnej aplikacji jest V2 v48 (`0b69900408d38fe827c340cdfe2f8f81ed7e0fa7`).
Potwierdzono ją także przez metadane aktualnego wdrożenia Vercel. Zachowany renderer
sprzed integracji: lokalna gałąź `feature/flags-scenic-preview-v1`, `dde79fc`.
Nie trzeba ponownie przenosić projektu ani tworzyć kolejnych kopii aplikacji.

## Źródło regresji i naprawa

Wspólny `game-chrome.css` narzucał scenie także położenie paska postępu i suwaka.
Dla 390 × 844 bez insetów pasek był o 15,34 px wyżej, a suwak o 69,17 px wyżej
niż w referencji. Renderer rezerwuje miejsce na sąsiadów względem suwaka, co
przesuwało odpowiedzi o 26,19 px oraz zmieniało wysokość mapy. Dodatkowe
przesunięcie chłopca o -66 px zmieniało jego relację do odpowiedzi i suwaka.

- Wspólny styl obsługuje nagłówek: wyjście, pauzę, zegar i opis. Scena ponownie
  samodzielnie wyznacza pozostałą geometrię. Safe areas są częścią jej własnego
  przepisu. Zachowano zamówione wcześniej poprawki kompasu/pytania i funkcje Studio.
- Pozycje pergaminu, odpowiedzi, sąsiadów, suwaka i chłopca pokrywają się z referencją.
  Zapisane ustawienia `mapDefaults` i `mapOverrides` pozostały bez zmian: mapa
  geograficzna i ręcznie ustawione etykiety mogą przez to różnić się od starego
  renderera; nakładka służy ocenie układu, nie cofaniu tych ustawień.
- Usunięto 166 przesłoniętych deklaracji CSS, połączono rozproszone przepisy każdego
  elementu i usunięto lokalne kopie wyglądu wspólnego nagłówka. Własności Safari
  zachowano. Porównanie 18 kombinacji wariantu, stanu i wysokości dało zero
  zmienionych pikseli poniżej nagłówka podczas samego porządkowania CSS.
- Zmiana rozmiaru okna przerysowuje otwartą mapę w nowej rozdzielczości. Zachowuje
  zasięg kamery i wybranych sąsiadów. Przeliczanie geometrii czeka do końca zgięcia
  papieru i przekazania liter, zamiast zmieniać pozycje w środku animacji.
- Wspólna geometria Studio przy częściowym wycofaniu skalowania przywraca rozmiar
  renderera. Usunięcie szerokości/aspektu nie pozostawia już dawnych wartości.
- Matematyka miała inne boczne paddingi nagłówka i wyrównanie zegara do prawej.
  Sam nagłówek wyrównano do pozostałych czterech trybów; plansza pozostaje bez zmian.

## Weryfikacja

- 478 testów logiki i kontraktów oraz lokalny build; nadal 50 widoków i kontraktów.
- 16 kontroli kontraktów w widokach telefonu i desktopu, obejmujących wszystkie
  pięć trybów oraz trzy stany Flag.
- Chromium i WebKit: wszystkie trzy warianty Flag, rzeczywiste animacje,
  błędna odpowiedź, stabilne pozycje, zoom, sąsiad, zmiana wysokości, zachowanie
  zaznaczenia, suwak, kolejne zadanie, poprawna odpowiedź.
- Osobno w obu silnikach potwierdzono automatyczne przejście po poprawnej odpowiedzi
  we Flagach, Państwach i Stolicach.
- Nagłówki pięciu rzeczywistych rendererów, 390 × 844 z insetami 47/34:
  wyjście `(20; 51,84)`, pauza `(324; 51,84)`, oba 46 × 46;
  środek zegara x=195, górna krawędź y=54,84.
- Gotowy lokalny build: pełny krok Matematyki kampanii, zapis i powrót na mapę;
  następnie Flagi i odsłonięcie atlasu, w Chromium i WebKit.
- Zrzuty referencji, aktualnego widoku i nakładka 50% są w lokalnych `outputs/v49`.

Powtarzalne testy:
`tools/qa-scenic-layout-browser.mjs`, `tools/qa-game-header-browser.mjs`,
`tools/qa-campaign-games-browser.mjs`.

Nie wykonywano tego przebiegu na fizycznym iPhonie. WebKit nie stanowi takiego dowodu.
Nie publikowano v49; na Vercelu pozostaje v48.
