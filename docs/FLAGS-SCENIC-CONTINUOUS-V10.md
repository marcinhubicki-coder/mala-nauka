# Flagi scenic — ciągły pergamin i atramentowy atlas, 15.10.2026

Zakres: wyłącznie `feature/flags-scenic-preview-v1`. Kontynuacja istniejącego preview, bez zmian `main`, Ortografii, Design Studio i produkcyjnych Flag.

## Kolejność

1. Pytanie: zwinięty pergamin składa się z tej samej górnej i dolnej części co atlas. Kompas jest osobnym rastrem 58 × 58 CSS px. Tabliczka zadania po prawej przechodzi linami przez pasek czasu. Punkty są ukryte.
2. Odpowiedź: dół z górami i drzewami pozostaje w miejscu. Cztery sekcje rozkładają się kolejno w 880 ms. Górna krawędź i kompas przesuwają się w górę. Ruch kompasu kompensuje perspektywę, zachowując jego wymiary. Papier nie zawiera mapy ani pinezek.
3. Rysowanie: dopiero po otwarciu i przygotowaniu geografii zaczyna się 2100 ms ujawniania atlasu. Pierwszy przebieg ujawnia ciemny rysunek, drugi podbarwienia, trzeci dopełnia detale. Nieregularna maska przestrzenna odsłania piksele; nie animujemy opacity całego obrazu.
4. 1500 drobin ciemnobrązowego atramentu przybywa od krawędzi do ciemnych miejsc docelowego obrazu, z rozrzutem, tłumionym ruchem i różnymi opóźnieniami. Odbicie od wewnętrznego obszaru ogranicza ruch. Przezroczystość drobin rośnie i maleje w locie.
5. Gotowy atlas pozostaje na tym samym Canvasie. Nie zastępuje go DOM, drugi obraz ani zrzut karty. Utrwalanie trwa pełne 3900 ms po zakończeniu rysowania. Błąd czeka na produkcyjny suwak.
6. Przejście: rysunek rozpuszcza się przez 1050 ms na nieruchomym papierze. Dopiero pusty papier składa się w 860 ms. Jednocześnie istniejąca animacja piasku zmienia cztery nazwy. Następna flaga jest zdekodowana przed odsłonięciem. Odpowiedzi odblokowują się po obu animacjach.

## Odpowiedzialności

- `scenic-paper.mjs`: wspólna geometria czterech zagięć, górny i dolny brzeg, ruch kompasu oraz światło zależne od kąta. Stałe powierzchnie materiału; brak snapshotów atlasu.
- `scenic-ink.mjs`: przygotowanie docelowego obrazu, maska trzech przebiegów, 1500 drobin, rysowanie i rozpuszczanie. Jeden widoczny Canvas, niewidoczne bufory przygotowania.
- `scenic-europe.mjs`: istniejąca geometria i rozsądne kadrowanie, jeden raster Europy i jeden wyróżniony kraj z obrysem.
- `build-scenic-europe.mjs`: wspólny WebP 2040 × 1500 z kanonicznego `europe.svg` (680 × 500). Granice nie są generowane przez AI. Odcienie, ryty morza, włókna, delikatne plamy i nazwy są wypalone do wspólnego rastra. Brak osobnych map państw.
- `scenic-preview.mjs`: istniejący `Session`, kolejność etapów, poprawna/błędna odpowiedź, suwak, preload, pauza/restart.
- `scenic-sand.mjs`: istniejący Canvas piasku liter, również dla dwóch linii.
- `scenic-timeline.mjs`: wspólne pauzowanie i anulowanie rAF/WAAPI. Żaden rAF efektów nie pracuje w stanie utrwalania.
- `scenic-config.mjs`: jedyne źródło czasów i liczby drobin.

`prefers-reduced-motion` pomija ruch i drobiny. Restart anuluje zegary i animacje, czyści docelowy obraz i bufory. Błędy ładowania zachowują pergamin zastępczy, geometrię wektorową lub komunikat o braku mapy. Opóźnienie pobierania nie skraca czasu zapamiętywania.

## Nowe rastry — built-in image_gen

Obydwa powstały na podstawie `scroll-reference.png`, kadru z dostarczonego mockupu. Wynik zachowano w PNG, przycięto do granic alpha i przekonwertowano do WebP; nie malowano ani nie zastępowano grafiki wektorami.

### `assets/flags/adventure/scenic-paper-v10.webp`

Źródło: `generated_images/exec-9faf9f71-4428-481c-b9fd-65a384867b23.png`.

Dokładny prompt:

> Use case: precise-object-edit. Asset type: premium children's adventure game parchment UI material. Reference image: use its warm golden vellum, richly tactile curled edge, soft sunlight and faint sepia mountain/tree engraving as style reference. Create ONE fully opened near-square parchment sheet, frontal orthographic view, aspect about 1.1 wide to 1 tall. Real transparent background outside the paper. Remove compass, all pins, nails, ropes, all text, X marks and trails. Thin organically uneven warm ochre edges, creamy luminous blank interior, very subtle paper fibres and folds, no hard rectangular frame. Bottom 12% has delicate faded sepia engraved mountains and pine trees in bottom left, subtle hills in bottom right; middle 80% empty pale cream for accurate map art added by code. Upper edge softly curved, faint tiny mountain engraving in top right only. Edge-to-edge wide paper body occupies image, 2% transparent padding. Flat even top-down material lighting warm upper left; finely painted realistic storybook 3D material, matching reference. No shadows or scenery outside object. No letters, no countries, no compass, no tacks, no props.

### `assets/flags/adventure/scenic-compass-v10.webp`

Źródło: `generated_images/exec-4f2817df-7fe4-4cff-b7ae-6b5a491f08b9.png`.

Dokładny prompt:

> Use case: background-extraction. Asset type: standalone transparent compass for premium storybook adventure game. Extract and faithfully recreate ONLY the beautiful antique brass pocket compass at upper left of reference, perfectly frontal view, round ivory dial with a dark brown compass rose and red needle, thick burnished golden brass rim and small loop on top, realistic softly lit 3D material with warm upper-left sunlight. Entire object within frame including loop. Transparent background, square image, compass fills 90% width and height. No paper, no terrain, no wood, no rectangular background, no pins, no new props. Accurate circular object, premium fine detail, no text needed except four very tiny direction markings. Must look like the same compass but completely independent cutout asset.

## Weryfikacja

QA utrwala otwieranie/zamykanie na 6%, 47%, 92%, trzy przebiegi atramentu na 12%, 43%, 73%, 97%, rozpuszczanie i cztery fazy piasku. Klatki są zatrzymywane na rzeczywistej osi animacji, nie przez przypadkowe opóźnienia screenshotów. Sprawdzana jest kolejność: pusty papier → rysowanie → pełna prezentacja → rozpuszczenie → składanie.

Wyniki i obejrzane poprawki są dopisywane po kolejnych iteracjach. Fizyczny iPhone 13 Pro pozostaje potrzebny do oceny FPS, temperatury, pamięci Safari/PWA i gestów przy dynamicznych paskach przeglądarki; emulacja WebKit tego nie zastępuje.

### `assets/maps/europe-pigment-v11.webp`

Źródło: `generated_images/exec-cb99ffdf-dffd-46d7-a44a-4ac9e9c46469.png`. To materiał malarski, bez geografii. Przycięcie do rzeczywistych granic następuje w builderze; nazwy i obrysy pochodzą z danych.

Dokładny prompt (built-in image_gen):

> Use case: stylized-concept. Asset type: tileable raster MATERIAL for an antique atlas, not a map. Create a richly tactile but subtle flat sheet of warm vellum stained with hand-painted diluted earth pigments. No geography, no country shapes, no borders, no labels, no symbols, no objects. Premium old storybook cartographer aesthetic: layered very faded honey ochre and umber watercolour washes, tiny patches of muted sage pigment, irregular soft dry-brush edges dissolving into cream, fine pigment granulation and visible delicate paper fibres, sparse faded fine crosshatching as pure surface texture. Entire square frame is the material, perfectly front-on even warm light. Restrained contrast, 80% creamy parchment with diffuse natural color variations, no concentrated central spot, no framed border, no shadow, no grunge black holes, no dark scratch stripes. Seamless all-over detail suitable to clip inside exact geographic paths later by code. This is only a material sample, depict no actual place or topographic information.

Iteracja 1, commit `25161cffdc883c65f1c5cafce288055f31065da6`, workflow `38737040980`: 46/52. Rozgrywka i oba efekty przeszły w Chromium/WebKit; naprawy po obejrzeniu klatek: szew u góry papieru, ostre brzegi mapy, za szeroki kadr Polski, za mało miejsca na stolicę przy długiej nazwie w WebKit. Kolejna wersja poprawia te miejsca, utrzymuje rozmiar kompasu w perspektywie i dodaje subtelny pigment malarski do wspólnego rastra.

Iteracja 2, commit `f48b3ea20b106b2144ef913f22c71b972a50a1ff`, workflow `38738728630`: **52/52**, Chromium i WebKit, bez błędów JS/renderera. Obejrzano wszystkie stany, klatki zagięć, rysowania i rozpuszczania oraz kadry niskiego/dużego ekranu i mikropaństw. Naprawione szwy papieru i ostre brzegi mapy, Polska ma 9–10 sąsiadów. Stolice długich nazw mieszczą się w WebKit.

Przegląd klatek mimo zielonych testów ujawnił zasłanianie części kompasu przez górną krawędź w połowie zagięcia. Iteracja 3 przenosi kompas całkowicie poza kontekst 3D papieru (nadal śledzi jego rzutowaną pozycję), poprawia etykiety przy granicach kadru, dodaje delikatny akwarelowy gradient wybranego kraju i statyczny miękki obrys. Dodatkowe scenariusze sprawdzają pauzę i restart w trakcie rysowania/rozpuszczania oraz identyczność geometrii z kanonicznym SVG. Pomiar czasu malowania Canvas jest dostępny wyłącznie w QA i nie mierzy FPS fizycznego iPhone’a.

Iteracja 3, commit `a9a9da8a1189c29ed9097594762fd056924f4b87`, workflow `38740369936`: 51/54. Geometria, kompas i klatki wizualne przeszły. Dwa nowe testy błędnie zaliczały krótkie przejście paska zegara do pozostałych animacji po restarcie; sprawdzenie zostało doprecyzowane i dodatkowo sprawdza przezroczystość wszystkich pikseli Canvas. W jednym scenariuszu automatycznego przejścia wystąpiła awaria renderera WebKit, bez wyjątku JS. Nie uznano jej za zaliczenie.

Iteracja 4 usuwa ponowne kodowanie całego WebP do PNG/base64 i osadzanie go wewnątrz SVG przy każdym pytaniu. Wspólny WebP jest rysowany bezpośrednio na Canvas z dokładnie tym samym viewBox; mały przezroczysty SVG zawiera tylko wybrany kraj. Usunięto runtime filtr SVG, statyczny miękki cień powstaje podczas jednego rysowania Canvas. Zmniejsza to liczbę dużych pośrednich obrazów i obciążenie dekodera Safari. Dokładna przyczyna pojedynczej awarii renderera nie została potwierdzona; końcowa runda ponawia cały scenariusz. Pomiar P95 malowania Canvas z poprzedniej rundy: 2,9–6,6 ms na runnerze, nie jest to wynik FPS fizycznego telefonu.

Ręcznie sprawdzono upływ całych 166 sekund w działającym preview: 0:00, wynik i cztery zablokowane odpowiedzi. Po obejrzeniu tego stanu dopasowano również końcowy komunikat do rastrowych kafelków z zaokrągleniem.

## Wynik końcowy, 15.10.2026

- Przetestowany i wdrożony kod: `fb6007dda9bdc9a5fbfcbd126c0a4fa2d8e37f9c`.
- Końcowy workflow: [38742175831](https://github.com/marcinhubicki-coder/mala-nauka/actions/runs/38742175831), **54/54**, Chromium i WebKit, **0 błędów JS/renderera**. Awaria renderera nie powtórzyła się po uproszczeniu kompozycji.
- Commit dowodów QA: `cbe54f39c23ddc2cd955723cafe966f551b679fc`.
- Wspólny raster w działającym preview i w końcowej rundzie ma identyczny Git blob `e46ca9726dd9993a17028b272076fea2594b2703`.
- P95 malowania pojedynczej klatki Canvas w runnerze: **3–4,9 ms**. To pomiar pracy efektu na desktopie, nie wynik FPS telefonu.
- Preview: https://mala-nauka-pi2068fin-nzckzxw2x6-4792s-projects.vercel.app/flagi/scenic-preview.html?country=by — Vercel READY, target preview (`null`), wyłącznie wskazany branch.
- Cztery pliki wdrożenia (`scenic-ink`, `scenic-paper`, kontroler, CSS) pobrano z Vercela: HTTP 200, bajtowo zgodne z lokalnym przetestowanym kodem.
- Ręczna ścieżka w tym deploymentcie: błędna Białoruś → pełny suwak → Polska → poprawna odpowiedź → automatyczna Szwajcaria, zadanie 3, punkt 1. Ręczny test czasu doszedł również do 0:00 i zablokowanych odpowiedzi. Końcowy deployment zakończył następnie sesję na zadaniu 3 z wynikiem 1 pkt; obejrzano i zapisano ten stan.
- Obejrzano końcowe klatki w obu silnikach: kompas jest w całości przed papierem, dolny brzeg jest stały, atlas znika przed zagięciem, nowa flaga i nazwy pojawiają się pod tym samym materiałem. Długie nazwy, niski/duży ekran i obszar bezpieczny PWA mieszczą się w kadrze.

Zestawy do przeglądu: [trzy stany](flags-adventure/qa-scenic-review-v13/trzy-stany.jpg), [pergamin](flags-adventure/qa-scenic-review-v13/pergamin-klatki.jpg), [atrament](flags-adventure/qa-scenic-review-v13/atlas-atrament-klatki.jpg), [piasek](flags-adventure/qa-scenic-review-v13/piasek-klatki.jpg), [geografia i ekrany](flags-adventure/qa-scenic-review-v13/geografia-i-ekrany.jpg), [działający Vercel](flags-adventure/qa-scenic-review-v13/live-preview.jpg).

Ograniczenia: fizyczny iPhone 13 Pro jest potrzebny do oceny płynności przy obciążeniu, temperatury, pamięci Safari/PWA oraz dotyku i dynamicznych pasków Safari. Źródłowe Natural Earth 1:110m nie zawiera poligonów części mikropaństw; zachowano dotychczasowe znaczniki i minimalny kadr 160 jednostek zamiast sztucznego powiększania. Main, produkcyjne Flagi, Ortografia i Design Studio nie zostały zmienione.
