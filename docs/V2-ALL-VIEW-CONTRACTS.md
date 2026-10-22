> Aktualizacja v60, 22.10.2026: **54 widoki**. `home-story` to ekran kampanii
> dla powracającego gracza; `home` zachowuje grę swobodną. Wspólny przełącznik
> Jelly i nawigacja pozostają zamontowane podczas zmiany treści.
> [Ekran kampanii v60](design-system/story-home-v60.md).

> Aktualizacja v59, 22.10.2026: nadal **53 widoki**. Księga ma jeden pionowy
> wariant z jedną kolumną, dolnym ornamentem nawigacji i pełnostronicowym spisem
> 15 kroków. To zastępuje rozkładówkę v56. [Oprawa księgi v59](design-system/book-page-v59.md).

> Aktualizacja v56, 21.10.2026: nadal **53 widoki**. Księga paruje odkryte
> strony w poziomie; każda kartka zachowuje osobne grupy i atomy.
> [Rozkładówka i hologram](design-system/book-spreads-hologram-v56.md).

> Aktualizacja v54, 21.10.2026: **53 widoki**. `campaign-portal` to oszczędny
> Portal Światów, z kluczem i pojedynczym wejściem. Kafel zadania, medalion
> księgi i części klucza mają jawne grupy w kontraktach.
> [Zakres v54](design-system/campaign-iskier-ripple-v54.md).

> Aktualizacja v53, 21.10.2026: **52 widoki**. `campaign-book` i `campaign-story`
> używają rzeczywistej księgi oraz dialogu Iskierki z PWA, z jawnymi częściami
> i akcjami w edytorze. [Zakres i weryfikacja v53](design-system/campaign-river-book-v53.md).

> Aktualizacja v50, 21.10.2026: nadal 50 widoków. Miernik kuźni korzysta z
> jawnego atomu `meter-power-charge`; inwentarz odświeżony z 100 sprawdzeń.
> [Żywa mapa i Lab efektów](design-system/campaign-effects-v50.md).

> Aktualizacja v44, 19.10.2026: nadal 50 widoków. Kampania ma interaktywne pola,
> powtórki, odkrywanie układanki i osobne laboratorium mapy w Studio.
> Szczegóły i testy: [interaktywna kampania v44](design-system/interactive-campaign-v44.md).

> Aktualizacja v43, 19.10.2026: nadal 50 widoków i wspólnych kontraktów.
> Kampania ma siedem krain izometrycznych, 105 kroków i trzy postacie;
> kuźnia oraz odkrywanie/ulepszanie nagród korzystają ze wspólnego renderera.
> Zakres i weryfikacja: [kampania izometryczna v43](design-system/isometric-campaign-v43.md).

> Aktualizacja v42, 19.10.2026: rejestr ma 50 widoków. Zachowano 45 wcześniejszych
> kontraktów; dodano `campaign`, `reward-details` i `campaign-math-initial/correct/wrong`.
> Kuźnia obejmuje 8 mocy, a kolekcje innych trybów pokazują odkryte karty. Szczegóły
> i dowody: [kampania i nagrody v42](design-system/campaign-rewards-v42.md).

# Studio V2 — kontrakty widoków

Poniższy opis 45 widoków jest zapisem stanu 17.10.2026. Bieżąca liczba: 53.

Zakres: `refactor/v2-parity-first`, bez promocji do `main` ani zmian w V1.

## Wspólne źródło

Aktualny `design-system/registry.json` na gałęzi `refactor/v2-parity-first` ma **45 widoków**. Liczba kontraktów musi być równa liczbie wpisów rejestru; źródłem prawdy pozostają pliki wykonywalne, a nie historyczna liczba w dokumentacji. Bazowe 41 widoków zostało rozszerzone o cztery nowe: `forge`, `rule-details`, `trophy-base`, `trophy-evolution`. Historyczny opis początkowych 14 kontraktów, 23 wiązań rendererów i czterech podsumowań dotyczył wcześniejszego etapu migracji.

| Rodzina | Widoki |
| --- | --- |
| Profile i start | `players-empty`, `players`, `player-create`, `player-pin`, `player-unlock`, `home`, `settings` |
| Ortografia | `spelling-settings`, `spelling-initial`, `spelling-correct`, `spelling-wrong`, `spelling-results`, `spelling-rule`, `spelling-hint`, `spelling-pause` |
| Angielski | `english-settings`, `english-initial`, `english-correct`, `english-wrong`, `english-results` |
| Flagi | `flags-settings`, `flags-initial`, `flags-correct`, `flags-wrong`, `flags-results` |
| Czytanie | `reading-settings`, `reading-initial`, `reading-correct`, `reading-wrong`, `reading-results` |
| Matematyka | `math-settings`, `math-initial`, `math-correct`, `math-wrong`, `math-results` |
| Postępy | `progress`, `collection`, `trophies`, `categories`, `rules`, `sessions` |
| Kolekcja i nagrody — nowe widoki | `forge`, `rule-details`, `trophy-base`, `trophy-evolution` |

`shared/view-contracts.mjs` i `shared/view-bindings.mjs` określają ID, przepis, typ, rodzica, poziom i akcję. `shared/view-contract-mount.mjs` sprawdza rzeczywiste renderery przed opublikowaniem ich metadanych. Brak komponentu, duplikat lub niedozwolona akcja powoduje błąd; żaden z aktualnych 45 widoków nie powinien wtedy przechodzić na klasyfikator DOM.

Powtarzane rekordy mają klucze domenowe: gracz, słowo, kategoria, osiągnięcie, sesja lub wartość odpowiedzi. Kodowanie UTF-8 klucza daje stałe ID niezależne od pozycji rekordu i geometrii. Wnętrze dynamicznego tekstu oraz dekoracje pozostają częścią zadeklarowanych atomów i grup.

## Edytor i PWA

Oba środowiska stosują `applyCompiledView` i tę samą konfigurację. Obejmuje to dziedziczenie przepisów, wyjątki widoku, stany, treści, grafiki, kadrowanie, animacje, widoczność i kolejność. Odrzucenie zmiany przywraca porządek renderera. Jawne aliasy zachowują wcześniejsze strojenie napisów podsumowania.

Spis `design-system/view-inventory-snapshots.mjs` jest pochodnym cache zweryfikowanych przykładów. **Historyczny pomiar** obejmował 41 widoków i 1399 części; nie należy utożsamiać go z bieżącym stanem 45 widoków bez nowego pomiaru. Nie rozstrzyga tożsamości komponentów w PWA. Build sprawdza pokrycie rejestru, odcisk kontraktów i przynależność każdego ID. Po zmianie kontraktu uruchom test przeglądarkowy i `node tools/snapshot-view-contracts.mjs`.

Edytor czeka na zakończenie odtwarzania przykładowego stanu. Dokument nadrzędny utrzymujący dźwięk deleguje kontrakt gry do jej rzeczywistej ramki. Wybrany stan oraz szkic są zachowane po przełączeniu iPhone ↔ Desktop.

Nowe buildy konsumentów domyślnie rozwiązują centralną gałąź V2 do pełnego SHA. Już wydane buildy pozostają przypięte do swojej wersji. Biblioteka zdjęć i flag nadal publikuje pliki oraz indeks oddzielnie od metadanych aplikacji.

## Bramki weryfikacji

- Testy Node: wszystkie kontrakty z aktualnego rejestru (45 na 17.10.2026), zapis konfiguracji → eksport PWA, stabilne klucze, odrzucanie niepełnego kontraktu i dziedziczenie wspólnych przepisów.
- `qa-all-view-contracts-browser.mjs`: test ma obejmować wszystkie 45 widoków na iPhonie 390 × 844 i desktopie 1440 × 900 (docelowo 90 kombinacji widok × urządzenie; wynik po aktualizacji wymaga osobnego potwierdzenia); prawdziwe renderery, wyłączony most edytora, kompletne drzewa i rzeczywista zmiana wyglądu przycisku. PWA nie pobiera klasyfikatora ani spisu przykładów Studio.
- `qa-view-variants-browser.mjs`: 1–3 graczy, pamięć, frazy i zdania w trzech stanach, różne wyniki oraz przywracanie kolejności i widoczności.
- `verify-screen-readiness.mjs`: pięć rzeczywistych przepływów PWA w Chromium i WebKit: ustawienia → odpowiedź → wynik → kolekcja → wynik → Home. Sprawdza też jednego właściciela dźwięku i brak błędów wykonania.
- Regresje Studio: edycja, trwały szkic, wzorce, przełącznik urządzeń i Test PWA. Ortografia: naturalna dziesięciowyrazowa runda, kolekcja, powrót i ponowna runda.
- `qa-library-browser.mjs`: izolowany upload → biblioteka → indeks → metadane aplikacji → obraz w PWA → offline. To test z kontrolowanym API GitHub; nie zastępuje wcześniej przeprowadzonej publikacji na żywo.

Testy rozmiaru telefonu i WebKit nie są testem fizycznego iPhone’a. Zakończenie migracji kontraktów nie oznacza promocji V2 do produkcyjnego `main`.


## Zasada aktualności dokumentacji (17.10.2026)

Nowe widoki i ostatnie zaakceptowane zmiany mają pierwszeństwo przed opisami sprzed ich wdrożenia. Zanim Codex rozpocznie pracę, powinien ustalić aktualny commit i porównać listę ID w `design-system/registry.json` z `shared/view-contracts.mjs`. Nie wolno zastępować nowszego rejestru, rendererów ani konfiguracji plikami ze starszej gałęzi dokumentacyjnej. Wdrażanie dokumentacji do V2 oznacza przeniesienie **samych zmian dokumentacyjnych** i weryfikację, że pełne 45 widoków pozostało nienaruszone. Kolejne nowe widoki dopisuj do kontraktów, inwentarza, scenariuszy browser QA i tego spisu, zamiast traktować liczbę 45 jako stałą na zawsze.
