# Produkcyjna bańka, czytelne litery i miękki blur — 2026-10-07

## Wspólny podgląd

Wariant `classic` ponownie używa **silnika produkcyjnego z `main`**: tych samych fal membrany, sprężystości, losowych narożników, orbity, perłowej oprawy, satelitów, drobinek i dwóch slotów zdjęcia. Nie jest to nieruchomy SVG przesuwany przez rodzica. Nie ma cyklu wielokątów ani deformacji fotografii. Fabryka jest wspólna dla gry, Komponentów, Efektów i dialogów słów.

Bazowe parametry produkcji: tempo 4.7, falowanie 3.25, orbita 1.35; zdjęcie przenika przez 1200 ms, z blurem 5.3 px, zoomem 12%, obrotem 4°, zmianą barwy 180° i 18 iskrami. Pozostałe ustawienia membrany, optyki oraz 32 wewnętrznych drobinek pochodzą bezpośrednio z silnika produkcyjnego. Parametry są dostępne w Labie. Przejście nadal czeka na dekodowanie zdjęcia i sprząta animacje po zakończeniu.

Wzrost po poprawnej odpowiedzi (`correctGrowth`, czas `correctGrowthDuration`) jest opcjonalną, skończoną animacją całej bańki. `comboWave` zwiększa oryginalne falowanie membrany, a `comboDuration` steruje jego wygasaniem. Domyślne wartości obu efektów wynoszą zero, więc bazowy wygląd zachowuje produkcyjną mechanikę. Pauza zatrzymuje membranę i przejście zdjęcia.

Eksport PWA nie zamienia już wspólnego konturu `<use>` na jedenaście stale przepisywanych ścieżek. Usunięcie nieaktywnych filtrów jest wspólną regułą źródła; aktywne przejście produkcyjne zachowuje blur i barwę. Eksport nie zmienia ustawień renderera.

## Litery

- `clipToFont`: dokładna maska / bez maski. Dotyczy cząstek po ułożeniu; swobodny dryf pozostaje poza obrysem.
- `contourDeparture`: 0–3 px odejścia punktów docelowych od natywnego obrysu. Przy włączonej masce odlot jest przycinany, bez maski jest widoczny.
- `settleFill`: przy wartości 1 końcowy tekst jest rysowany przez natywny renderer fontu, bez rozciągania bitmapy. Pozostałe wartości mieszają cząstki i natywny tekst. Maska cząstek jest rasteryzowana w skali 2×.
- `bubbleGap`: jednakowy odstęp w px od **widocznej krawędzi tuszu** do luki, po obu stronach. Uwzględnia boczne marginesy glifów i końcowy tracking.
- Tracking ma ten sam model w natywnych literach i canvas (`font-kerning:none`). Ruch rodziców jest uwzględniany w mapowaniu cząstek.
- Długie hasło zmniejsza font i tracking razem. Stałe wiersze siatki nie rozszerzają się. Pomiar odbywa się w przestrzeni układu, niezależnie od chwilowego pulsu rodzica; przejście szerokości luki nie zaburza dopasowania.

Odsłonięcie odpowiedzi nadal zmienia wyłącznie środek. Boczne pule zachowują swoje cząstki i fazę. Całe słowo rozpada się dopiero przy następnym pytaniu.

## Blur / bokeh

Bokeh korzysta z maks. sześciu wcześniej narysowanych sprite’ów 192 × 192. Profil gaussowski daje rozmyte plamy bez twardych krawędzi. Rozmycie 0–64 px jest wypalane przy konfiguracji; ruch nie animuje filtrów.

Nowe ustawienia: `effectBackdropColor`, `effectBackdropOpacity`, `effectBounce` (miękkość zmiany kierunku), `effectWave` (delikatne rozciąganie plamy). Pozostają wielkość, różne rozmiary, zasięg i tempo pływania, dwa kolory, gradient i przenikanie kolorów. Efekt można umieścić pod treścią albo nad wszystkim; nie przechwytuje kliknięć. Krycie tła 0 zachowuje ilustrację gry; wartość 1 daje własne tło pod światłami. Preset bokeh startuje od miękkiego różu i lawendy.

## Weryfikacja

`verify-production-bubble.mjs` importuje rzeczywisty plik `origin/main:spelling/bubble.mjs` i porównuje kontur oraz wszystkie pięć zestawów parametrów przy identycznym ziarnie. Testuje także długie hasła, równe odstępy od luki i stałą pozycję odpowiedzi.

`verify-particle-tuning.mjs` sprawdza suwaki, maskę, native fill, kolor i zachowanie bocznych cząstek. `verify-spelling-effects.mjs` przechodzi przez Efekty → Komponenty → zbudowane PWA, odpowiedzi, przejścia zdjęć, bokeh, pauzę i powrót. Mierzy rAF, timer i odmalowania canvas przez ponad minutę. Wynik automatycznych silników nie jest pomiarem temperatury ani wydajności fizycznego telefonu.
