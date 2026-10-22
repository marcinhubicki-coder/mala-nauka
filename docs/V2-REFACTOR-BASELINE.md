# Design Studio v2 — wzorzec produkcyjny i migracja bez regresji
Data: 2026-10-13 · źródło projektu: `design/system-v1` @ `6291ed3` · branch pilota: `refactor/v2-parity-first`

## Cel i granica odpowiedzialności

Design Studio **edytuje model aplikacji i jej komponenty**; PWA renderuje wydanie z tego samego modelu, bez uruchamiania inspektora i bez rozpoznawania swojej własnej struktury DOM. Jeden wspólny renderer/wzorzec zachowania, dwa środowiska: edytor oraz lekkie wydanie użytkownika. Nie tworzyć alternatywnych mockupów jako oddzielnej implementacji funkcji.

## Źródła referencyjne — przesłane screeny użytkownika

1. **REF-HOME-PROD-01**: pełny ekran główny, zrzut **710 × 1536**, iPhone, 13.10.2026 ok. 00:21. Status bar iOS nie jest elementem interfejsu gry. Utrzymać: logo w lewym górnym rogu, przycisk ustawień, duży hero (postać odkrywcy, mapa, zwierzę, globus, pejzaż), tekst „Hej odkrywco!”, wyróżniony tytuł „sprawdź swoje postępy.”, opis „świetnie Ci idzie, co dalej?”, karta postępów nakładająca się na hero z tarczą/gwiazdą/chevronem, nagłówek „Wybierz swoją przygodę” i **5 kafli w układzie 3 + 2** (Ortografia, Matematyka, Angielski / Flagi, Czytanie). Zachować przyjazne przejścia, głębię, obrysy, kolory i czytelność; bez niepotrzebnego przewijania na ekranie głównym.
2. **REF-SPELLING-SETTINGS-PROD-01**: górny wycinek ustawień Ortografii **1170 × 953**, ok. 00:29. Zrzut jest **kadrem**, nie całym ekranem — NIE służy do dokładnego porównania wysokości całej strony. Utrzymać: niebieskie niebo i chmury, białą zaokrągloną strzałkę wstecz, wyrazisty nagłówek, kremowy kafel z ikoną abc po lewej, chłopcem wykraczającym ponad prawy brzeg, tekst „Twoja mała misja” i „Złap właściwą literę.”; duży biały panel ustawień z numeracją w kółkach, nagłówek „Co ćwiczymy?” i trzy czytelne opcje Jelly.
3. **REF-BUG-SPELLING-START-01**: wcześniejszy zrzut Test PWA pokazywał ucięte ustawienia podczas przejścia do gry; nie jest wzorcem docelowym. Zgłoszone później brak reakcji przycisków, blokada dotyku i spowolnienie wymagają testu na rzeczywistym iPhonie.

Oryginalne obrazy referencyjne znajdują się w konwersacji projektu Homework z 13.10.2026. Ten dokument **nie udaje**, że binarne pliki zrzutów zostały zapisane w repozytorium. Przed automatycznym pixel-diff należy przenieść je do repozytorium i wyrównać rozmiary/skalowanie (status bar oraz kadr).

## Ustalona przyczyna rozbieżności

W produkcyjnym `main` ekran główny używa `assets/home/home-retina.webp` jako pełnej grafiki/atlasu (canvas 853 × 1844) oraz nakłada aktywne, dostępne przyciski i dynamiczne wartości. W v2 `home-screen.mjs` odtwarza scenę z osobnych SVG, obrazów i elementów tekstowych. To **zmiana implementacji, nie refaktoryzacja bez zmiany wyglądu**. Nie akceptować nowej interpretacji grafiki przed porównaniem z REF-HOME-PROD-01. Atlas produkcyjny może pozostać punktem odniesienia podczas wydzielania poszczególnych elementów, ale nie powinien na stałe ukrywać niewidocznych/nieedytowalnych kontrolek.

W `design-system/config.json` v2 zapisano nadpisanie „Twoja mała misja” → „Twoja spokojna przygoda”. W bieżącym pilocie przywrócono tekst do wersji referencyjnej **tylko w aktywnych ustawieniach projektu**; historycznych snapshotów wydań nie zmieniano.

## Kontrakt architektury v2

- **Źródło prawdy:** jawna definicja komponentu: niezmienny `id`, semantyczny typ, rodzic/slot, dzieci, dozwolone właściwości, stany, zdarzenia i powiązania danych. Wspólne tokeny motywu i jawne wyjątki widoków. Tekst może być dynamiczny, ID nie.
- **Atom:** pojedyncza odpowiedzialność. Przykład: `BackButton` (koło + strzałka + stan); jego docelowe działanie wynika z konfiguracji nawigacji, nie z powielonego wariantu kodu.
- **Grupa:** samodzielna, powtarzalna funkcja. Wspólny kontener służący wyłącznie do ułożenia dwóch niezależnych przycisków NIE jest nowym komponentem funkcjonalnym.
- **Rodzina/ekran:** skład z jawnych slotów. Design Studio używa tych samych definicji i rendererów, które potem trafiają do PWA. Inspector nie może tworzyć własnej alternatywnej prawdy z heurystyk DOM.
- **Budowanie wydania:** sprawdza schemat, zależności i możliwości edycji, rozwiązuje dziedziczenie i generuje minimalny manifest/runtime/zasoby. Do PWA **nie trafiają** katalog klocków, skaner DOM, most edytora, katalog testowych screenów ani obsługa drag-and-drop edytora.
- **Przejścia:** jeden właściciel, jawne stany `settings → transitioning → playing → results`; blokada `inert` zawsze ma symetryczne zwolnienie (także błąd, timeout, anulowanie, background/foreground).
- **Jakość:** brak stylów `!important` i inline override jako zastępstwa modelu, brak lokalnych łatek przyciskiem zamiast poprawki wspólnego komponentu. Istniejące zatwierdzone animacje/wygląd nie mogą przypadkiem zmienić się podczas refaktoryzacji.

## Kolejność prac — małe odwracalne pionowe wycinki

| Faza | Zakres | Warunek akceptacji |
| --- | --- | --- |
| P0 (ten commit) | Wzorzec i odniesienie produkcyjne, przywrócenie tekstu misji, kontrolki regresji | Udokumentowane dwa screeny; żadna zmiana w produkcji |
| P1 | Home: jawne definicje bloków + renderer tego samego widoku + edycja Studio | 5 kafli i interakcje; wygląd/pozycje zgodne z referencją |
| P2 | Ortografia: ustawienia (Jelly, nawigacja, misja) | Płynne przejście do gry, żadnych martwych elementów |
| P3 | Ortografia: gra i wynik, jeden koordynator przejść | Odpowiedzi, błąd, pauza, slider, koniec, nowa runda |
| P4 | Kompilator i lightweight runtime; usunięcie introspekcji DOM z wydania | Edycja w Studio i wynikowe PWA korzystają z tego samego modelu; zmierzona poprawa |
| P5 | Reużycie kontraktu w Matematyce, Angielskim, Flagach, Czytaniu, profilach | Bez drugich implementacji; testy wszystkich stanów |

## Scenariusze bramki jakości (iPhone docelowy)

1. Nowy gracz/wybór profilu → Home; przejście na tryb gry; powrót; bez przewijania głównego ekranu.
2. Ortografia: ustawienia → zaznaczenie kategorii, poziomu i czasu/słów → Start → pierwsze pytanie.
3. Prawidłowa i nieprawidłowa odpowiedź, dalej po błędzie, pauza/wznowienie, wyjście; druga runda bez odświeżenia strony.
4. Wielokrotne przełączanie ekranów, szybkie kliknięcia, minimalizacja i powrót z Safari/PWA — brak trwale zablokowanego `inert`.
5. Dźwięk działa poza Studio; odpowiedzi bez znacznego opóźnienia. Pomiary wydajności, CLS i screenshot-diff trzeba wykonać na urządzeniu. Zielony build Vercela NIE zastępuje testu urządzenia.
6. Edycja wspólnego przycisku w Studio zmienia wszystkie wystąpienia; wyjątek jednego widoku nie duplikuje atomu ani nawigacji.

Prace odbywają się na `refactor/v2-parity-first`; nie dopisywać zmian bezpośrednio do `main`, `design/system-v1` ani `studio/pwa-test`. Jeśli Codex dalej pracuje na v2, najpierw porównać jego nowe commity i selektywnie przenieść potwierdzone zmiany.

**Definicja sukcesu:** wygląd nie gorszy niż produkcyjny, każda edycja ma jedno źródło, mniejszy runtime, działające scenariusze na iPhonie. Ani liczba komponentów, ani liczba testów nie są celem samym w sobie.

## Etap P4 — lżejszy cache offline (2026-10-13)

W poprzedniej wersji instalacja Service Workera pobierała praktycznie **cały katalog 743 assetów (~117 MB)** po 12 równoległych plików, zanim kończyła aktywację. Dla urządzenia mobilnego nie jest to dobre zachowanie domyślne.

Nowe wydanie ładuje **niewielki zestaw startowy** (logo, Home, profile, grafiki kreatorów, tło gry Ortografia i fonty). Pozostałe ilustracje zapisują się automatycznie w cache dopiero po faktycznym użyciu. Instalacja nie pobiera masowo fotografii ortograficznych ani nieużywanych wariantów graficznych.

Gwarancja offline na tym etapie: kod i zasoby wspólne oraz pobrane wcześniej ilustracje. **Nie należy nazywać tego pełnym pakietem offline wszystkich ilustracji.** Pełny pakiet powinien być funkcją *świadomego pobrania* z informacją o rozmiarze, anulowaniem i postępem. Nie dodawać ukrytego pobierania całych 117 MB.

Budowanie wypisuje `offlineBootstrapBytes` i `offlineDeferredBytes`; CI pilnuje budżetu startowego poniżej 6 MB. Konieczny jest pomiar na fizycznym iPhonie przed publikacją produkcyjną.
