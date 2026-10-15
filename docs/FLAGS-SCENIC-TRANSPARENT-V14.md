# Scenic v14 — prześwitujący atlas i jedna scena

Kontynuacja istniejącej gałęzi `feature/flags-scenic-preview-v1`. Produkcyjne Flagi, Ortografia, Design Studio i main pozostają poza zakresem.

## Zmiany

- Krajobraz, chłopiec, pies, skalna półka i drewniany maszt są jednym WebP. Nie ma osobnych kamieni, cienia pod masztem ani doklejanej tyczki. Nakładana jest wyłącznie istniejąca flaga. Kotwiczenie tkaniny ma jedno źródło w `SCENIC.mast`; uwzględnia obszar bezpieczny PWA. Nakładka włosów korzysta z tego samego obrazu i tej samej skali.
- Nowy materiał papieru mieści kompletną górską winietę w dolnym, nieruchomym brzegu. Cztery zagięcia, górna część i osobny kompas pozostają tymi samymi obiektami podczas całej sekwencji.
- Wspólny raster Europy nie ma podkładu morza. Rozcieńczone pigmenty, drobne kreskowanie i rzeczywiste puste piksele tworzą suchy druk na papierze. Wszystkie państwa i podpisy są w jednym WebP, granice nadal pochodzą z kanonicznego SVG 680 × 500. Nie wygenerowano geografii AI.
- Mapa zajmuje niemal całą kartę. Nagłówek ma niewielkie kremowe podłoże, nazwę kraju, ikonę miasta, nazwę stolicy i lekko przekrzywioną flagę. Usunięto widoczne komunikaty „Świetnie” i „Zapamiętaj” z wnętrza atlasu; komunikat dla czytnika ekranu pozostał.
- Nie ma latających kropek, maski radialnej ani rozmytych brzegów mapy. Trzy skorelowane, nieregularne przebiegi odsłaniają kreski i pigment, zachowując przezroczystość docelowego rastra. Zanik kończy się przed pierwszym zagięciem. Gotowy obraz nie jest podmieniany na DOM.
- Piasek liter, produkcyjny suwak, Session, pełny czas utrwalania po przygotowaniu mapy, pauza, restart, preload i reduced motion pozostają we wspólnej osi animacji.

## Grafika — skill imagegen / wbudowany image_gen

Po generowaniu wykonano wyłącznie konwersję PNG → WebP. Oryginały pozostają w `generated_images` poza repozytorium.

### Jedna scena

Referencja: `assets/flags/adventure/scenic-mockup-v5.webp`.
Pierwszy wynik: `exec-4ca7633f-5d97-4ffb-895c-cdcbff2f8eb5.png`. Odrzucony układ masztu — finial wchodził w obszar HUD.

Prompt:

> Edit this existing portrait storybook game background, preserving its exact composition, beautiful cinematic 3D illustrated style, boy and spaniel characters, faces, lighting, camera, lake, castle, mountain vista and greenery. Deliver a single coherent full portrait background, no UI or text. Add one naturally weathered polished honey-brown wooden flag mast integrated into the scene: its center at 24 percent of image width, round golden wooden finial at 20.5 percent of image height, vertical shaft running down to 46 percent of image height where it is firmly rooted among the EXISTING sunlit rocky terrace at the left. The rocks holding the pole must be a natural continuous part of the existing foreground ledge, physically grounded, with matching shadows, color and perspective; no pasted separate rocks floating in front of lake. Mast diameter about 1.5 percent of image width, subtly tapered, realistic wood grain, warm sunlit right edge, shaded left edge. NO FLAG, no fabric on mast, leave empty air to right of pole for game flag. Keep the lower boy and dog and foreground scene in precisely their existing locations. Keep upper HUD area uncluttered sky. Unified high quality lighting and scene depth throughout. Single continuous illustration, not a collage. Preserve portrait aspect ratio.

Korekta pierwszego wyniku, docelowy PNG: `exec-2845c6fd-4bcc-42e1-b1d8-6e7ae49a1c1f.png`.
Docelowy plik: `assets/flags/adventure/scenic-scene-v14.webp`, 852 × 1846, jakość 92, 412444 B.

Prompt korekty:

> Make just one precise edit to this portrait background: shorten the wooden mast dramatically at its TOP, keeping its base in exactly the same rocky position and x coordinate. The round finial must now be at y=20.5 percent of total image height, about twice as far down as it currently is (currently y=10 percent). The shaft then extends from that finial down to its unchanged base at y=47 percent. Remove all old mast pixels above y=20 percent and fill those with perfectly matching sky/clouds/trees. Keep entire rest of image unchanged, including the boy and spaniel, mountain, castle, rocks, greenery, water. Mast center x=27.2 percent stays unchanged; diameter and finial design unchanged. Absolutely no flag or fabric. Exact same portrait composition and style. The top of the new round ball must be about one fifth of image height from upper image edge, not one tenth. This change is necessary to leave space for game HUD in upper sky.

Po obejrzeniu faktycznego wyniku położenie tkaniny dopasowano do namalowanego masztu, a nie do żądanych współrzędnych promptu.

### Papier

Referencja: `assets/flags/adventure/scenic-paper-v10.webp`.
Wynik: `exec-ea7759dc-4d5f-4529-96ad-c75e9b554606.png`.
Docelowy plik: `assets/flags/adventure/scenic-paper-v14.webp`, 1324 × 1188, RGBA, jakość 94, 274542 B.

Prompt:

> Edit this parchment material for an animated expanding atlas. Preserve the exact parchment outline, near-square proportions, warm creamy paper, irregular delicate burnt edges and softly aged texture, on true transparent background. Critical change: remove ALL the existing large mountain and forest engravings from the lower quarter and the small upper right mountains. Restore blank matching cream paper in those areas. Instead draw a very delicate tiny sepia alpine engraving strip (mountains and two tiny fir trees) ONLY within the bottommost 7 percent of paper height, as a low long horizontal vignette along lower edge, with all peaks and all trees fully contained in that bottommost 7 percent. The remaining top 93 percent is uninterrupted softly aged blank parchment, no drawings or lines. The ornament must be much smaller than original and have no tall peaks or trees protruding upward. Keep it low contrast. No compass, pins, text, map, border frame, UI, holes or extra objects. This is one unfolded sheet; do not draw folds across it. Genuine alpha outside paper.

## Weryfikacja

Pierwsza runda (`dfa8411`, workflow 38750499060): 52/56. Obejrzano pytanie, obie odpowiedzi, trzy fazy otwierania/składania, cztery przebiegi rysowania oraz małe/duże ekrany i długie nazwy. Wykryto za szeroki kadr Polski (12 sąsiadów), zbyt regularne prześwity i wyścig początkowego ustawiania pergaminu. Korekta ustawia geometrię przed odblokowaniem gry, zmienia szum na nieregularny oraz zmniejsza dolny limit kadrowania dużego kraju przy zachowaniu minimum dla mikropaństw.

Dalsza kontrola surowej klatki Wielkiej Brytanii ujawniła zasłoniętą Szkocję mimo zaliczenia testu podpisu. Kadr uwzględnia teraz rzeczywisty obszar nagłówka i pozostawia cały poligon poniżej niego; test sprawdza tę relację. Gęste Bałkany mogą pokazać do 12 państw przy minimalnym kadrze 160, aby nie wyolbrzymiać małych państw; pozostałe testowane kadry mają limit 11. Pozycje i skala kafelków nie zmieniają się między odpowiedziami. Dla krajów przy północnej i południowej krawędzi kadr może obejmować przezroczysty obszar poza rastrem. Bardzo duży kraj dostaje szeroki kadr, zamiast sztucznego powiększenia; obie warstwy nadal korzystają z tych samych współrzędnych. Dodatkowe próbki obejmują Finlandię, Norwegię i Rosję.

Druga runda (`901d135`, workflow 38779249565): **56/56** w Chromium i WebKit. Klatki potwierdzają poprawny pierwszy kadr pytania oraz brak regularnej siatki prześwitów. Pomiar pojedynczego malowania Canvas pozostaje pomiarem runnera, nie telefonu.

Trzecia runda (`84e0ed893afe533a954abca54a09d21ea0382317`, workflow 38780419573): **55/56**. Klatki Wielkiej Brytanii potwierdziły widoczność całej Szkocji; porównanie końca składania przeszło w obu silnikach. W scenariuszu kilku kolejnych pytań wystąpiła awaria renderera WebKit bez wyjątku aplikacji. Nie uznano jej za zaliczenie i nie dodano automatycznego retry maskującego wynik.

Czwarta runda (`641cef4417847f80238300892cc22334cda37ed3`, workflow 38782072889): znosi granicę rastra jako ograniczenie pustej przestrzeni nad krajami północnymi. Zwalnia jawnie duże bufory Canvas po przejściu, po przygotowaniu mapy i przy anulowaniu. Usuwa też dekodowanie tymczasowego SVG na obraz: Path2D rysuje bezpośrednio ten sam kanoniczny path/circle w tym samym viewBox. To ogranicza pracę dekodera i przechowywane powierzchnie; dokładna przyczyna poprzedniej awarii renderera nie została potwierdzona. Próba kolejnych pytań została wydłużona z trzech do pięciu przejść i sprawdza zwolnienie nieaktywnych buforów. Dodane kadry północy i szerokiej Rosji zwiększają zestaw do 62 scenariuszy. Wynik **61/62**: wszystkie kadry geograficzne i pięć kolejnych przejść przeszły, ale renderer WebKit uległ awarii przy przechwytywaniu klatek atramentu. Obejrzano Finlandię, Norwegię i Rosję; pełne poligony są widoczne poniżej podpisu. Szeroki kadr Rosji przedstawia część ujętą w źródłowej mapie Europy, nie całą Rosję.

Piąta runda (`f7ef8100ea6375be9821dc852c9ef1a1470c1aed`, workflow 38783773314) zmienia wyłącznie izolację testów: każdy scenariusz WebKit uruchamia świeży proces przeglądarki. Nie dodaje retry, nie ignoruje awarii i nie osłabia asercji. Test pięciu kolejnych przejść nadal utrzymuje jedną stronę i jedną grę przez całą próbę. Rozdziela to zasoby GPU przechowywane między niezależnymi kontekstami testowymi. Przyczyna awarii nie jest potwierdzona; nowa izolacja weryfikuje hipotezę o kumulowaniu zasobów runnera. Kod gry i raster są identyczne z `641cef4`. Wynik ponownie **61/62**; izolacja procesów nie usunęła awarii przy kilku kolejnych przejściach. Hipoteza o samej kumulacji zasobów między scenariuszami nie została potwierdzona.

Próba celowana (`dd3c4e1`, workflow 38785328615) oddzieliła płaski Canvas od kontekstu 3D papieru. Perspektywa znajduje się tylko w materiale pergaminu, przy zachowaniu tej samej geometrii. Na poprzednim silniku próba przerwała się przy pierwszym składaniu z pauzą. To nie był wynik odbiorowy; na czas diagnozy workflow wybierał tylko ten scenariusz.

Po porównaniu z oficjalnymi zgłoszeniami silnika przypięto narzędzie testowe Playwright **1.64.1** zamiast **1.56.1**. Bez kolejnych zmian gry identyczna próba (`c6ae23d`, workflow 38785872726) przeszła **dziesięć kolejnych przejść** z pauzą/wznowieniem, bez awarii. Nie potwierdza to dokładnej przyczyny wcześniejszych awarii, ale wykazuje różnicę między wersjami środowiska testowego. Nie zmieniano oczekiwań ani nie stosowano retry.

Źródła diagnostyczne (podobieństwo objawów, nie dowód identycznej przyczyny): [Linux WebKit compositor / Playwright 42637](https://github.com/microsoft/playwright/issues/42637), [oficjalne wydania Playwright](https://github.com/microsoft/playwright/releases), [WebKit 281042 — historyczna presja pamięci przy putImageData](https://bugs.webkit.org/show_bug.cgi?id=281042).

Pełny workflow został przywrócony (`3f3d672c15f38d9be00c7c5ab3e66a49d3c48423`): bez wyboru silnika, filtrowania scenariuszy ani specjalnej liczby rund w CI. Ponownie obejmuje 62 scenariusze. Końcowy workflow [38786525577](https://github.com/marcinhubicki-coder/mala-nauka/actions/runs/38786525577) zakończył się sukcesem: **62/62**, **0 błędów JS/renderera**. Obejrzano świeże klatki trzech stanów, sześć klatek pergaminu, cztery fazy rysowania i zanik, piasek oraz wszystkie kadry geograficzne i rozmiary ekranu. Wynik malowania pojedynczej klatki Canvas P95: **2–8,7 ms na runnerze**, bez wnioskowania o FPS fizycznego telefonu.

Vercel zgłosił READY dla `dpl_3XpQ4hZ1dsuzM5T772e6F2PDRCJT`, target preview, branch zgodny, źródło `84e0ed8`. Próba otwarcia zwykłego adresu w przeglądarce przekierowała do logowania Vercel. Automatyczna kontrola odrzuciła utworzenie tymczasowego linku bez logowania jako rozszerzenie dostępu. Nie zmieniano zabezpieczeń i nie używano innej metody tworzącej taki link. Zrzuty końcowej wersji pochodzą z testów przeglądarkowych tego samego kodu i rastra, a nie z chronionego adresu Vercel.

Ograniczenie: emulacja WebKit nie zastępuje fizycznego iPhone’a 13 Pro przy ocenie temperatury, FPS, pamięci, gestów i dynamicznych pasków Safari/PWA. Geometria Natural Earth 1:110m zachowuje dotychczasowe znaczniki części mikropaństw i rozsądny minimalny kadr.


## Końcowy podgląd i dowody

- Przetestowane źródło: `3f3d672c15f38d9be00c7c5ab3e66a49d3c48423`.
- Commit wygenerowanej mapy i pełnych dowodów QA: `64e58cfbe980e344c288e9af913cd16cd62af9f7`.
- Podgląd: https://mala-nauka-1j6o3xxd0-nzckzxw2x6-4792s-projects.vercel.app/flagi/scenic-preview.html?country=by
- Vercel: `dpl_5LqWTtuMo2uP5gDqkTLKNANC65yK`, READY, preview (`target: null`), wskazany branch i źródło.
- Wspólny raster w źródle deploymentu i w końcowym QA ma ten sam Git blob: `7ad318352dff2b54211833c8bd1dde3d511ace93`. Porównanie źródła z commitem QA nie wykazało różnic w kodzie gry, grafikach, narzędziach ani workflow.
- Otwieranie kończy się na pustym papierze. Zanik mapy kończy się przed składaniem. Dolny ornament jest kompletny także w złożonym stanie, kompas nie zmienia skali, kolejna flaga pojawia się pod tym samym papierem. Wykonano wizualne oględziny tych punktów po końcowym zielonym przebiegu.
- Widoki 390×844, niski 390×700, większy 430×932 i obszar bezpieczny PWA mieszczą UI. Nagłówek nie zasłania wybranego państwa. Własny raster sceny utrzymuje pole, kamienie, chłopca i psa w jednym ujęciu.

Zestawy z jednego końcowego przebiegu: [trzy stany](flags-adventure/qa-scenic-review-v21/trzy-stany.jpg), [pergamin](flags-adventure/qa-scenic-review-v21/pergamin-klatki.jpg), [rysowanie atlasu](flags-adventure/qa-scenic-review-v21/atlas-atrament-klatki.jpg), [piasek](flags-adventure/qa-scenic-review-v21/piasek-klatki.jpg), [geografia i ekrany](flags-adventure/qa-scenic-review-v21/geografia-i-ekrany.jpg). Pochodzenie: [provenance.json](flags-adventure/qa-scenic-review-v21/provenance.json).

Chroniony dostęp Vercel pozostaje osobnym ograniczeniem ręcznej próby na tym hoście. Końcowy podgląd nie jest publicznie odblokowany; nie obchodzono odrzuconej operacji udostępnienia. Fizyczny test iPhone’a 13 Pro nadal jest potrzebny dla FPS, pamięci, gestów i dynamicznych pasków Safari/PWA. Nie scalono do main.
