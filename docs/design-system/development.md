# Zapis i rozwój

## Mapa plików

| Ścieżka | Odpowiedzialność |
| --- | --- |
| `design-system/config.json` | Tokeny, fonty, palety, wyjątki, rewizja |
| `design-system/rules.json` | 41 wspólnych zasad, powiązania 455 słów, dodatkowe relacje i grupy liter |
| `design-system/registry.json` | Urządzenie, komponenty, widoki, stany i przepływy |
| `design-system/model.mjs`, `validation.mjs` | Kontrakt i walidacja współdzielone przez panel/runtime/zapis |
| `design-system/studio.mjs` | Sesja edycji, szkic, historia, Git i wspólna nawigacja |
| `design-system/studio-preview.mjs`, `studio-preview.css` | Wybór widoku/elementu, porównanie, instancje, stany i warstwy |
| `design-system/studio-content.mjs`, `studio-content.css` | Wizualna baza słów, zasad, grafik i powiązań |
| `design-system/studio-motion.mjs`, `studio-motion.css` | Dwa prawdziwe ekrany, Play, Loop i przerwa |
| `design-system/merge-model.mjs`, `studio-review.mjs` | Trzystronne scalenie i karty konfliktów bez ścieżek kodu |
| `design-system/bridge.mjs` | Zmiany w iframe, wybór elementu, pomiar, komunikacja same-origin |
| `design-system/scenarios.mjs` | Deterministyczne sesje do podglądu prawdziwych gier |
| `design-system/git-client.mjs` | Atomowy zapis Git i kontrola konfliktów |
| `design-system/draft-store.mjs` | Binaria szkicu i paczki słów w IndexedDB |
| `shared/design-runtime.mjs` | Wczytanie kontraktu, fonty, CSS variables, rozpoznanie widoku |
| `shared/rules-library.mjs` | Walidacja, relacje i propagacja świadomie edytowanej wspólnej treści |
| `shared/screen-motion.mjs` | Wspólne przejścia, reduced-motion i anulowanie pętli podglądu |
| `shared/components.css` | Wspólna geometria i warianty |
| `shared/asset-loader.mjs` | Jedna baza, aliasy, URL-e, preload, podmiana dynamicznych obrazków |
| `shared/jelly-v4.mjs` | Zachowanie jelly i czasy pobierane z tokenów |
| `spelling/continue-drag.mjs` | Dostępny klawiaturą slider dalszej gry; korzysta ze wspólnej deformacji Jelly oraz własnych czasów błędu i wyniku |
| `tools/catalog-assets.mjs` | SHA-256, przypisania ilustracji, deduplikacja |
| `tools/audit-design.mjs` | Rozmiary kodu, fonty, źródła haseł, historia porządków |
| `tools/build-design.mjs` | Kontrakt centralny, bundling CSS, URL-e, SW |
| `tools/install-consumer.mjs` | Podłączenie istniejącego brancha |

## Zapis

Połączenie odczytuje HEAD, aktualną konfigurację, rejestr grafik i bibliotekę zasad. Szkic scala niezależne zmiany; konflikt tego samego tokenu/hasła jest widoczny. Przed zapisem HEAD jest sprawdzany ponownie. Jeden tree i jeden commit zawierają komplet zmiany. Aktualizacja ref używa `force:false`: równoległy commit blokuje zapis zamiast nadpisywać cudzą pracę.

Po konflikcie: **Wersje i szkice → Wczytaj i scal z GitHub**. Szkic pozostaje lokalnie. Jeśli obie strony zmieniły to samo hasło lub token, wybierz na kartach swoją wersję albo wersję GitHub przed ponownym zapisem. Pakiety słów są scalane według hasła, a nie nadpisywane zbiorczo.

Token nie jest zapisywany w storage, JSON-ach, commitach ani eksporcie. Ogranicz go do repozytorium Małej Nauki. Panel nie ma uprawnień do publikowania na `main`: klient wskazuje na stałe `design/system-v1`.

## Polecenia

```sh
npm run build       # gotowy dist + wygenerowany service worker
npm test            # build oraz testy mechaniki, bazy i design systemu
npm run audit       # aktualny raport kodu i fontów
npm run assets:audit
npm run design:check
```

`node tools/catalog-assets.mjs --deduplicate` usuwa wyłącznie identyczne pliki; wykonuj na branchu kanonicznym. Deduplikacja zachowuje aliasy i ręczne przypisania. Build konsumenta pobiera aktualne wspólne moduły; nie wymaga bibliotek npm.

## Nowy komponent lub widok

1. Dodaj grupę/parametr do kontraktu i walidacji. Wymiary wyrażaj w jednostkach bazowych 390 pt.
2. Zastosuj token w `shared/components.css` lub zachowaniu komponentu. Nie zostawiaj suwaka bez związanej wartości.
3. Zarejestruj selector, role fontów oraz użycia widoku w `registry.json`.
4. Dodaj prawdziwy fixture ze stanem początkowym/poprawnym/błędnym. Podgląd nie zapisuje wyników ani profili.
5. Zweryfikuj komponent we wszystkich powiązanych widokach, również po scaleniu fontu.
6. Udokumentuj wariant, warunek i przyczynę wyjątku. Zmiana schematu wymaga wersjonowania oraz aktualizacji konsumentów.

Zmiana palety nie obejmuje automatycznie wszystkich kolorów w zatwierdzonych ilustracjach. Zmiana całego wizualnego języka wymaga osobnego przeglądu.

## Porządkowanie dużych modułów

Nieaktywne wersje oraz duplikaty zostały usunięte. Aktywne warstwy matematyki (plansza, wyjaśnienia, stabilizacja, timer) zachowano, bo tworzą działającą mechanikę. `audit.json` pokazuje największe pliki i deklaracje fontów. Monolityczny renderer gry nie został zastąpiony nowym frameworkiem; wyodrębniono wspólny kontrakt, assety, fixture i narzędzia.

Następne zmiany powinny trafiać do właściciela komponentu. Nowe tunery korzystają z panelu; nie mnożymy osobnych kopii assetów i wersji CSS.

## Kontrakt dla mockupów

Prompt lub brief ma wskazać: urządzenie 390 × 844 / Retina 3×, identyfikator widoku, tryb/paletę, stan odpowiedzi, rodzinę komponentu oraz rewizję `config.json`. Użyj geometrii ortografii i cienia toru z angielskiego. Zachowaj role fontów i bazową skalę odstępów. Nowy element musi wskazać komponent, wariant albo proponowane rozszerzenie kontraktu.

## Relacje treści i bezpieczna migracja

`rules.json` grupuje istniejące dane według kategorii, rodzaju i nazwy zasady. Wielkość liter w nazwie CH/Ch nie tworzy drugiej zasady. `edited:false` zachowuje wcześniejsze wyjaśnienia; pierwsza świadoma edycja zasady uaktywnia jedną wspólną treść. Przykłady, formy, powiązane słowa i źródła pozostają w oryginalnej bazie. Studio nie tworzy nowych nadpisań wyjaśnienia pojedynczego słowa. Starsze szkice edycji paczek są zachowane i nadal chronione podczas scalania.

Relacje zasad używają stałych ID. Wykryte rodziny liter mogą być wielokrotne, lecz jedna główna kategoria nadal wskazuje ćwiczoną odpowiedź. Dodatkowe powiązania nie zmieniają maski, opcji ani odpowiedzi.

Scalenie ilustracji przekierowuje przypisania i dotychczasowe aliasy bez kasowania binariów. Aktywny katalog ukrywa grafiki przekierowane. Wszystkie elementy konfiguracji, katalog, zasady i uploady trafiają do jednego commitu; tymczasowa widoczność, Play/Loop i przerwa nie trafiają do kontraktu.

Nowe zależności runtime muszą trafić do `centralFiles` w buildzie i do skryptów builda wszystkich konsumentów. Sam ponowny build ze starszym skryptem nie pobierze nowego modułu. Biblioteka zasad oraz konfiguracja są pobierane z centralnego źródła także podczas uruchamiania gry; service worker używa strategii network-first z kopią offline.
