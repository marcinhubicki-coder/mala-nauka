# Studio V2 — wszystkie 41 widoków

Zakres: `refactor/v2-parity-first`, bez promocji do `main` ani zmian w V1.

## Wspólne źródło

Rejestr ma 41 widoków i dokładnie 41 jawnych kontraktów. Dotychczasowe 14 kontraktów pozostaje zachowane, 23 widoki mają źródłowe wiązania rendererów, a cztery dodatkowe podsumowania używają wspólnej rodziny wyniku z identyfikatorami trybu.

| Rodzina | Widoki |
| --- | --- |
| Profile i start | `players-empty`, `players`, `player-create`, `player-pin`, `player-unlock`, `home`, `settings` |
| Ortografia | `spelling-settings`, `spelling-initial`, `spelling-correct`, `spelling-wrong`, `spelling-results`, `spelling-rule`, `spelling-hint`, `spelling-pause` |
| Angielski | `english-settings`, `english-initial`, `english-correct`, `english-wrong`, `english-results` |
| Flagi | `flags-settings`, `flags-initial`, `flags-correct`, `flags-wrong`, `flags-results` |
| Czytanie | `reading-settings`, `reading-initial`, `reading-correct`, `reading-wrong`, `reading-results` |
| Matematyka | `math-settings`, `math-initial`, `math-correct`, `math-wrong`, `math-results` |
| Postępy | `progress`, `collection`, `trophies`, `categories`, `rules`, `sessions` |

`shared/view-contracts.mjs` i `shared/view-bindings.mjs` określają ID, przepis, typ, rodzica, poziom i akcję. `shared/view-contract-mount.mjs` sprawdza rzeczywiste renderery przed opublikowaniem ich metadanych. Brak komponentu, duplikat lub niedozwolona akcja powoduje błąd; żaden z 41 widoków nie przechodzi wtedy na klasyfikator DOM.

Powtarzane rekordy mają klucze domenowe: gracz, słowo, kategoria, osiągnięcie, sesja lub wartość odpowiedzi. Kodowanie UTF-8 klucza daje stałe ID niezależne od pozycji rekordu i geometrii. Wnętrze dynamicznego tekstu oraz dekoracje pozostają częścią zadeklarowanych atomów i grup.

## Edytor i PWA

Oba środowiska stosują `applyCompiledView` i tę samą konfigurację. Obejmuje to dziedziczenie przepisów, wyjątki widoku, stany, treści, grafiki, kadrowanie, animacje, widoczność i kolejność. Odrzucenie zmiany przywraca porządek renderera. Jawne aliasy zachowują wcześniejsze strojenie napisów podsumowania.

Spis `design-system/view-inventory-snapshots.mjs` jest pochodnym cache zweryfikowanych przykładów: 41 widoków, 1399 części oraz korzeń każdego ekranu. Nie rozstrzyga tożsamości komponentów w PWA. Build sprawdza pokrycie rejestru, odcisk kontraktów i przynależność każdego ID. Po zmianie kontraktu uruchom test przeglądarkowy i `node tools/snapshot-view-contracts.mjs`.

Edytor czeka na zakończenie odtwarzania przykładowego stanu. Dokument nadrzędny utrzymujący dźwięk deleguje kontrakt gry do jej rzeczywistej ramki. Wybrany stan oraz szkic są zachowane po przełączeniu iPhone ↔ Desktop.

Nowe buildy konsumentów domyślnie rozwiązują centralną gałąź V2 do pełnego SHA. Już wydane buildy pozostają przypięte do swojej wersji. Biblioteka zdjęć i flag nadal publikuje pliki oraz indeks oddzielnie od metadanych aplikacji.

## Bramki weryfikacji

- Testy Node: wszystkie 41 kontraktów, zapis konfiguracji → eksport PWA, stabilne klucze, odrzucanie niepełnego kontraktu i dziedziczenie wspólnych przepisów.
- `qa-all-view-contracts-browser.mjs`: 82 przypadki, iPhone 390 × 844 i desktop 1440 × 900; prawdziwe renderery, wyłączony most edytora, kompletne drzewa i rzeczywista zmiana wyglądu przycisku. PWA nie pobiera klasyfikatora ani spisu przykładów Studio.
- `qa-view-variants-browser.mjs`: 1–3 graczy, pamięć, frazy i zdania w trzech stanach, różne wyniki oraz przywracanie kolejności i widoczności.
- `verify-screen-readiness.mjs`: pięć rzeczywistych przepływów PWA w Chromium i WebKit: ustawienia → odpowiedź → wynik → kolekcja → wynik → Home. Sprawdza też jednego właściciela dźwięku i brak błędów wykonania.
- Regresje Studio: edycja, trwały szkic, wzorce, przełącznik urządzeń i Test PWA. Ortografia: naturalna dziesięciowyrazowa runda, kolekcja, powrót i ponowna runda.
- `qa-library-browser.mjs`: izolowany upload → biblioteka → indeks → metadane aplikacji → obraz w PWA → offline. To test z kontrolowanym API GitHub; nie zastępuje wcześniej przeprowadzonej publikacji na żywo.

Testy rozmiaru telefonu i WebKit nie są testem fizycznego iPhone’a. Zakończenie migracji kontraktów nie oznacza promocji V2 do produkcyjnego `main`.
