# Malowany atlas — analiza i próbka v37

Zakres tej iteracji: poprawka języka po ukończeniu slidera, analiza architektury i jedna regionalna próbka do oceny stylu. Nie rozpoczęto generowania całego świata ani wymiany atlasu w grze. Główna gra zachowuje mapę v36 do akceptacji następnego rozwiązania.

## Wniosek

Wrócić do stylu ręcznie malowanej Europy v27: duże czytelne łańcuchy górskie, starannie malowane grupy drzew, głęboka akwarelowa woda, ciepłe przejścia terenu. V36 z powtarzanym stemplem gór jest odrzuconym kierunkiem stylistycznym. Zachować zasadę wspólnych współrzędnych granic i podkładu, ale połączyć ją z ciągłą ilustracją, nie powtarzaną fakturą.

Potrzebne są dwie siatki. Siatka autorska dzieli kontynenty na duże, zachodzące na siebie regiony do malowania i korekt. Siatka odtwarzania dzieli ukończony, zarejestrowany obraz na małe kafle 512×512 px w kilku rozdzielczościach. Gry nie należy uzależniać od ładowania i rozpakowania obrazu całego kontynentu.

## Geografia przed malowaniem

Wspólny układ EPSG:3857, z rozwinięciem długości geograficznej przy południku 180°. Wybrzeża, granice, kamera oraz kafle używają tej samej transformacji. Północ ma duże odkształcenie tej projekcji; nie wymuszać kadru kraju w środku, gdy powoduje to zbyt szerokie oddalenie. Dla regionów polarnych potrzebny jest osobny zakres/projekcja, jeśli wejdą do przyszłej gry.

Natural Earth dostarcza granice i orientacyjne obszary pasm, a [cross-blended hypsometric tints](https://www.naturalearthdata.com/downloads/10m-raster-data/10m-cross-blend-hypso/) wskazuje także charakter środowiska. Same wysokości nie wystarczą do odróżnienia zielonej niziny od nisko położonej pustyni. Źródło wysokości: [Mapzen Terrain Tiles](https://registry.opendata.aws/terrain-tiles/), [format Terrarium](https://github.com/tilezen/joerd/blob/master/docs/formats.md). Są to dane autorskie do wzorców; telefon nie pobiera DEM ani dużego rastra środowiska.

Trzy klasy ilustracyjne w pasmach górskich: poniżej 3000 m mniejsze ziemiste grzbiety, 3000–6000 m większe skały z częściowym śniegiem, 6000–9000 m wysokie masywy z wyraźnym śniegiem. Nie oznaczać całego wysokiego płaskowyżu jako gęstego pasma szczytów. Zachować klimat regionu; śnieg według umowy graficznej użytkownika, nie jako model aktualnego sezonu.

ImageGen odtwarza malarstwo według wzorca, lecz sam prompt nie gwarantuje dokładnych wybrzeży. Pierwszy szkic przesunął Morze Kaspijskie i dodał błędny ląd; nie został zakwalifikowany jako mapa. Przed przyjęciem obrazu trzeba sprawdzić zgodność wybrzeży i pasm z maskami oraz poprawić rejestrację, maskę lub sam obraz. Nie wolno utożsamiać wspólnej transformacji przy zoomie z potwierdzeniem geograficznej poprawności wygenerowanego malarstwa.

## Przygotowanie obrazów i krawędzi

1. Przygotować geograficzny wzorzec regionu wraz z buforem do sąsiednich regionów. Istniejącą Europę zachować jako wzorzec stylu i materiał do rejestracji.
2. Wygenerować spójne malarstwo, następnie sprawdzić maski wybrzeży, środowiska i przebieg pasm. Sąsiedni region powstaje z widocznym zakładem poprzedniego; nie generować niezależnie stykających się brzegów.
3. Po rejestracji połączyć regiony poza aplikacją. Zakłady należy dopracować, a nie wyłącznie rozmyć dwa różne szczyty, co stworzyłoby duchy. W razie potrzeby wykonać lokalną korektę łączenia w ImageGen.
4. Z jednej zaakceptowanej ilustracji przygotować wszystkie poziomy rozdzielczości przez zmniejszenie. Dzięki temu góry nie zmieniają położenia ani wyglądu podczas oddalania.
5. Podzielić poziomy na kafle 512 px z 2-pikselowym zakładem technicznym. Granic państw nie malować w bitmapie: renderować je osobno, z tych samych danych co wyróżnienia.

## Ładowanie i płynność

Przy wyborze kraju obliczyć kadr bliski, docelowy kadr regionu oraz kafle potrzebne na drodze animacji. Wczytać i rozkodować je wcześniej, z ograniczoną równoległością. Podczas animacji rysować już gotowe bitmapy; nigdy dekodować wielkiej mapy na żądanie pierwszej klatki. Przy słabszej sieci zachować gotowy niższy poziom, zamiast pokazywać pustkę.

Dobierać poziom do liczby pikseli ekranu i DPR ograniczonego do 2. Oddalenie używa mniejszych kafli, nie zbioru wszystkich szczegółów kraju. Jednostką pobrania i dekodowania jest cały mały kafel — nie da się obiecać pobierania dokładnie pojedynczych widocznych pikseli z WebP. W pamięci zostają widoczne kafle, mały bufor oraz chwilowo poprzedni poziom; reszta trafia poza cache LRU, a ImageBitmap jest zamykany. Cache sieciowy przeglądarki może nadal zachować skompresowane pliki.

Docelowy budżet rozkodowanych kafli: 16–24 MiB, z rezerwacją przed dekodowaniem i obniżeniem poziomu, jeśli plan przekroczy budżet. Osobno liczyć płótna i bufory animacji. Próbka ma cache LRU 16 MiB; końcowy raport podaje faktyczne użycie tego niewielkiego regionu. Nie jest to jeszcze dowód całkowitego zużycia pamięci PWA ani stabilności wszystkich krajów na urządzeniu.

Kadr daleki ma pokazywać znaczną część bieżącego kontynentu, zwykle około 65–85% jego głównego obszaru; zakres jest polityką do strojenia, nie sztywnym zoomem świata. Przesunąć kotwicę przy krawędzi i ograniczyć oddalenie, zamiast ładować pełne sąsiednie kontynenty. Pobierać tylko obszar przecinający kamerę, także gdy leży przy granicy dwóch kontynentów.

Dla Rosji proponowane są regionalne widoki części europejskiej i azjatyckiej. Oddalenie pozostaje w bieżącym regionie. Opcjonalny widok całego kraju korzysta wyłącznie z najniższego poziomu i nie wymusza pobrania szczegółowych map Europy, Azji i Afryki. Regiony przy południku 180° wymagają ciągłej, rozwiniętej osi długości geograficznej.

## Zakres próbki i kryteria przed pełną produkcją

Próbka obejmuje 22,5–90°E oraz około 21,94–55,78°N: wschodnie Morze Śródziemne, Egipt, Arabię, Kaukaz, Iran i Himalaje. Użyto 24 kafli DEM z poziomu 5 tylko podczas przygotowania wzorca. Próbka ma pokazać stylistykę, pustynne obszary, odmienne pasma, brak szwu technicznego oraz wspólny ruch granic i obrazu. Nie jest atlasem wszystkich kontynentów.

Przed pełnym wdrożeniem: zaakceptować próbkę stylu, potwierdzić geograficzną rejestrację ilustracji, następnie krótki test skrajnych kadrów Norwegii, Islandii, Rosji i państwa przy 180°, granic przy zmianie LOD, pamięci i klatek na iPhonie. Pełną generację kontynentów uruchomić dopiero po ocenie tej próbki przez użytkownika.

Przygotowany obraz ma 1536×1024 px. Dołożono osobno wygenerowaną korektę obszaru Morza Kaspijskiego na pozycji x=384, y=0, 512×768 px z zakładem 65 px. Nie zastosowano deformującego obraz eksperymentu TPS. Z połączonego malarstwa przygotowano 3 poziomy i 9 kafli z 2-pikselowym zapasem. Przeglądarka nie wczytuje źródłowego obrazu całego regionu. Wybrzeża po lokalnej korekcie są bliższe wzorcowi, lecz nie są jeszcze zaakceptowane jako dokładnie zarejestrowane z granicami. Również położenie i klasy pasm w malarstwie wymagają kontroli przed pełną produkcją. Wspólny ruch granic podczas zoomu jest odrębną, działającą własnością renderera.

Krótka kontrola WebKit przy viewport 1100×1100 i DPR 2: 7 pobranych kafli, 6 742 144 bajtów rozkodowanych bitmap (około 6,4 MiB), brak kolejnych pobrań przy powtórzeniu widoku i brak błędów JS. Podczas jednego przejścia zebrano 47 odstępów między klatkami; 95. percentyl wyniósł 17 ms. To lokalny pomiar headless na komputerze, nie dowód stałych 60 kl./s na iPhonie ani dla wszystkich przyszłych krajów. Raport: `qa-preview-v37/sample-qa.json`. Osobno wykonano ukończenie slidera dla obu języków: `Great!` / `Świetnie!`; raport `qa-preview-v37/language.json`. Nie wykonywano pełnej baterii testów.

## Źródła i autorstwo

Natural Earth: public domain. Mapzen Terrain Tiles: SRTM/GMTED2010 courtesy of the U.S. Geological Survey; global ETOPO1 terrain data U.S. National Oceanic and Atmospheric Administration; Europe terrain data produced using Copernicus data and information funded by the European Union — EU-DEM layers. Pełne zasady źródeł: [attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md). Materiał malarski powstał we wbudowanym ImageGen. Prompty: [scenic-assets-v37.json](scenic-assets-v37.json). Wynik malowania w workspace: `outputs/v37/painted-region-sample.png`; grywalna próbka: `flagi/atlas-sample-v37.html`; kafle: `assets/maps/atlas-sample-v37/`. Wzorce i odrzucone eksperymenty pozostają w lokalnym katalogu roboczym, poza ładowaniem aplikacji.
