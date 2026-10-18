# Scenic v34 — wysokość zainstalowanej PWA

Podgląd flag korzysta teraz z tego samego `pwa-viewport.js`, który obsługuje ortografię. Na iPhonie uruchomionym z ikony wysokość sceny pochodzi z fizycznego ekranu (`screen.height` w pionie), zamiast polegać wyłącznie na jednostkach `vh`/`lvh`. Zdarzenia wznowienia i zmiany obszaru widocznego ponownie przeliczają tę wartość.

Podobnie jak w `spelling-art.css`, ilustracja jest w zainstalowanej aplikacji osobnym, nieruchomym obrazem bezpośrednio w `body`. Pokrywa pełną wysokość niezależnie od kontenera gry. Bezpieczne obszary ograniczają położenie kontrolek, a nie zdjęcie. Powiększenie pozostaje jednakowe w obu osiach (1.12), razem z dotychczasowym obliczaniem zaczepienia dużej flagi do masztu. Zwykły podgląd przeglądarkowy nadal skaluje scenę 390×844 proporcjonalnie.

Nie zmieniono ilustracji 852×1846. Powiększanie jej rozdzielczości nie naprawia różnicy między wysokością ekranu a wysokością zgłaszaną dla dokumentu.

## Sprawdzenie

- Chromium i WebKit: 4/4 scenariusze w `tools/flags-scenic-layout-qa.mjs`. Dotychczasowe kontrole obejmują pięć rozmiarów okna, marginesy, niezmienny kadr mapy, kliknięcie ostatniego sąsiada, język i przeciągnięcie suwaka.
- Nowy test PWA utrzymuje fizyczny ekran 390×844 i zmienia wysokość obszaru przeglądarki między 797, 844 i 810 px. Dokument, scena i obraz nadal mają 844 px, a położenie mapy, odpowiedzi i suwaka pozostaje identyczne. Jest to imitacja krótszego obszaru w dwóch silnikach desktopowych, nie test natywnego systemu.
- Osobno uruchomiono rzeczywistą instalację z ekranu początkowego w Apple iOS Simulator: iPhone 13 Pro, iOS 27.0, build 24A434. Sprawdzono pytanie i błędną odpowiedź dla Francji z rozwiniętą mapą. Zdjęcie dochodzi do dolnej krawędzi. `screen.height`, dokument i scena mają 844 px; `documentElement.clientHeight` i 100svh zgłaszają 797 px. Bezpieczne obszary wynoszą 47/34 px.
- Raporty są w `qa-pwa-v34/browser-report.json` i `qa-pwa-v34/native-metrics.json`. Zrzuty z natywnego symulatora zapisano lokalnie podczas kontroli. Nie sprawdzono tej wersji na fizycznym iPhonie użytkownika. Świeża instalacja w symulatorze również przed tą poprawką nie odtwarzała zielonego pasa z jego telefonu; test krótszego obszaru pokrywa wykrytą różnicę, a wynik fizycznego urządzenia wymaga sprawdzenia nowego podglądu.

## Górny efekt systemowy

W natywnym iOS 27 rozmycie pod paskiem stanu nadal występuje. Nie jest filtrem CSS tej sceny. Próby z dodatkowym elementem przy górnej krawędzi, przycinaniem koloru do tekstu i zmianą warstw zdjęcia nie usunęły go w sprawdzonym środowisku. Żadna z tych eksperymentalnych nakładek nie jest publikowana.

Ortografia używa takiego samego `black-translucent` i `viewport-fit=cover`. Jej warstwa zdjęcia i pomiar wysokości zostały wykorzystane powyżej; nie znaleziono w niej osobnego przełącznika wyłączającego efekt systemowy.

Kontekst platformy: [zgłoszenie WebKit 317153](https://bugs.webkit.org/show_bug.cgi?id=317153) opisuje zależność geometrii od wersji systemu i momentu instalacji ikony. Nie stanowi dowodu, że to dokładnie przyczyna widoku na fizycznym telefonie użytkownika. [Próby obejścia rozmycia przez autora PWA](https://tips.ojapp.app/en/ios-27-pwa-top-blur-workaround-2/) są eksperymentalne; nie potwierdziły się w tym teście natywnym.
