# v59 — oprawa i nawigacja księgi

Lokalny podgląd, 22.10.2026. Branch: `work/book-page-v59`.

- Usunięte widoczne wstawienie nowej treści przed dekodowaniem grafik i właściwym wejściem. Strona jest najpierw przygotowywana w ukryciu.
- Wyłanianie wierszy pozostawia tekst w oryginalnym węźle. Nie ma ponownego składania pisma z osobnych spanów na końcu, które powodowało spóźnione wypusty liter. Maska ma miejsce na boczne ogonki. Przerywanie wejścia zachowuje bieżący stan przed wyjściem.
- Nowa oprawa prawej strony otwartej księgi: zgięcie i fragment lewej kartki, krawędzie kartek po prawej, pergamin i złoto-turkusowe zdobienia.
- Jeden pionowy wariant, jedna kolumna. Dotychczasowe dwie strony w poziomie zostały wyłączone zgodnie z nową decyzją.
- Cztery przyciski osadzone w dolnym ornamencie: spis, wstecz, dalej, najnowszy wpis. Symbole są ostre i osobno klikalne; nie są napisami wypalonymi w obrazie.
- Spis treści wypełnia to samo pole strony po wymazaniu wcześniejszej treści. Wszystkie 15 kroków mieści się bez przewijania. Nieodkryte kroki nie ujawniają historii. Początek i przedmiot rozdziału są także dostępne ze spisu.
- Zachowane inicjały na dwa wiersze, treści siedmiu światów, ilustracje, dostęp tylko do odkrytej fabuły, powrót do kampanii oraz obsługa ograniczonego ruchu.
- Zaktualizowana hierarchia księgi i jej zapis w inwentarzu Design Studio. Nadal 53 widoki.

## Grafika

Wbudowane narzędzie **image_gen**, nowa oryginalna grafika inspirowana opisem otwartej księgi i istniejącym ornamentem aplikacji. Fotografia Depositphotos została obejrzana jako referencja konstrukcji książki; nie jest assetem aplikacji.

[Prompt i pochodzenie](generation.json), [metadane eksportu](page-asset.json). Źródło: `library/book-right-page-source.png`. Eksport: `library/book-right-page.webp`, 1024 × 1536, 540 106 B. Lokalna biblioteka: `assets/managed/a615382cc07f36b33e5983de77d8ebbe43b671327e2ed7814e82851e160bb018.webp`. Jeden plik źródłowy jest używany przez trzy fragmenty oprawy; dolne medaliony zachowują proporcje. Binaria pozostają poza commitem kodu.

## Sprawdzone

13 celowanych testów modelu księgi i kontraktów — bez błędów. Rzeczywisty kontrakt księgi na 390 × 844 oraz 1440 × 900 — 65 elementów, bez błędów. Uaktualniono ten wpis inwentarza, pozostałe 52 zachowano z wcześniej zweryfikowanego zapisu.

W Chromium i WebKit: nowa grafika przez HTTP, cztery dolne akcje, pełny spis 15 kroków, blokady przyszłych fragmentów, niewidoczna treść podczas przygotowywania, brak dzielenia tekstu, inicjał na dwa wiersze, jedna kolumna i brak przelewania na iPhonie 390 × 844, iPadzie 768 × 1024 i 1024 × 768 oraz desktopie 1440 × 900. Sprawdzony także ograniczony ruch. Krótki dodatkowy test WebKit potwierdził zachowanie bieżącej widoczności wierszy przy przerwaniu ich wejścia i czyste zakończenie kolejnego przejścia.

Zrzuty i wyniki: `.design-qa/v59/`. Test celowany: `tools/qa-book-page-v59.mjs`. Starszy skrypt księgi dopasowany do nowego układu; nie wykonywano jego całej historycznej macierzy ponownie.

Nie zmieniano rzeczywistego postępu ani szkicu użytkownika. Bez publikacji na Vercel i bez wysyłania zmian do repozytorium zewnętrznego. Fizyczny iPhone i biblioteka CDN nie były weryfikowane w tym etapie.
