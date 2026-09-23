# Ortografia — płynna scena, poprawka v22

## Aktualizacja v26 — dziesięć nowych ilustracji

Przed każdą kolejną paczką uruchom `node scripts/report_spelling_coverage.mjs`. Raport korzysta z rzeczywistych przypisań gry, nie z historycznych plansz w `temp/`. Aktualna lista to `ortografia/missing-scenes.json`; wybieraj kolejne słowa z tablicy `missing`. Po integracji odśwież raport i sprawdź go przez `node scripts/report_spelling_coverage.mjs --check`. Samo przypisanie obrazu nie jest oceną jakości jego dopasowania semantycznego.

Dodano osobne ilustracje do słów: **żubr, żyrafa, żuk, żmija, żuraw, żagiel, nożyczki, łyżwy, huśtawka, helikopter**. Żuraw przedstawia ptaka, żmija ma charakterystyczny zygzak, a łyżwy widoczne płozy. Każda scena powstała osobno we wbudowanym generatorze obrazów, bez napisów, interfejsu i narysowanej maski. Pełne prompty i przypisania znajdują się w `assets/scenes/generated-batch-v26.json`; grafiki runtime w `assets/scenes/*.webp` (1080 × 1080 px, jakość 80).

Aktualnie **183 z 404 słów** ma przypisaną ilustrację (**77 różnych scen**); 221 słów pozostaje bez obrazu. Nowe sceny uwzględniono w cache PWA v26 i walidatorze. Nie zmieniano geometrii ani animacji gry.

Podgląd tylko tej paczki: `/ortografia/?assets=1&scene=zubr,zyrafa,zuk,zmija,zuraw,zagiel,nozyczki,lyzwy,hustawka,helikopter`.

## Aktualizacja v25 — pełna paczka użytkownika

Wczytano 36 PNG 1254 × 1254 px. Trzydzieści nowych scen wyeksportowano do WebP 1080 × 1080, jakość 80, bez rozciągania. Sześć scen (sól, kółko, muszla, kura, pudełko, budzik) było już w grze — pozostawiono istniejące pliki bez dublowania. Nie generowano dodatkowych ilustracji.

Dokładny wykaz źródło → plik → słowa znajduje się w `assets/scenes/uploaded-batch-v25.json`. Nowe sceny obsługują 39 słów; tam, gdzie obraz jest jednoznaczny, wykorzystano go również dla bliskiego znaczenia, np. dół/dziura, rzut/rzucić, wrócić/powrót. W grze jest teraz **173 z 404 słów z ilustracjami i 67 różnych scen**. Pozostałe 231 słów nadal nie ma przypisania; nie wypełniamy ich przypadkowymi obrazami.

Nowe sceny dodano do cache PWA v25. Walidator sprawdza dekodowanie wszystkich obrazów, przypisania całej paczki i dostępność offline. Podgląd wszystkich ilustrowanych słów: `/ortografia/?assets=1`, pojedynczego nowego obrazu: `/ortografia/?word=trzmiel`. Starsze sekcje poniżej opisują stan historyczny.

Aktualny widok działa na branchu `design/spelling-bubble-v0.4`. Podgląd: `/ortografia/?assets=1&scene=bunny`; wybierz czas i rozpocznij rundę. Bez `scene` losują się ilustracje. `?assets=0` udostępnia również słowa bez ilustracji, a `?word=dźwig&assets=0` pozwala obejrzeć konkretny zapis.

## Co zostaje na ekranie

Tło, nagłówek, ramka bańki i dwa przyciski powstają raz na rundę. `app.js` przekazuje stan sesji bezpośrednio do `createSpellingArt()`; moduł nie odtwarza sceny przez obserwowanie i przerabianie DOM. Zmieniają się wyłącznie zdjęcie, litery słowa, litery odpowiedzi i informacja zwrotna.

- `spelling/bubble.mjs` — proceduralna bańka SVG. Jeden płynny kontur Béziera steruje klipem ilustracji, tęczową błoną i refleksami. Losowe fazy i powolne fale o różnych częstotliwościach nie restartują się przy pytaniach. Ilustracja nie jest deformowana. Obwód jest ostry również przy DPR 3.
- `spelling/word-reveal.mjs` — okrągła bańka w miejscu luki, drobne iskry, odsłonięcie jednej lub kilku liter i miękkie zanikanie/pojawianie się atramentu.
- `spelling/art.mjs` — trwały układ, przejścia, podpowiedź i dopasowanie długich słów.
- `spelling-art.css` — jedyna warstwa stylów rozgrywki. Bez kolejnych arkuszy z nadpisaniami `!important`.

Tekst pozostaje zwykłym fontem: dwie części słowa i osobny bąbel luki. Zmiana zadania używa lekkiego przejścia całych bloków (140/180 ms), a obrazy przenikają się przez 520 ms. W tym czasie odpowiedzi są zablokowane, a zegar czeka. Pauza zatrzymuje przejście i falowanie. Ukrycie karty zatrzymuje animację; `prefers-reduced-motion` wyłącza ruch i dekoracyjne przejścia.

## Grafiki i rozmiary

| Element | Plik | Rozmiar | Waga |
| --- | --- | --- | --- |
| Stałe tło z załącznika | `assets/ortografia/lake-background.webp` | 711 × 1536 | 35,9 kB |
| Królik | `assets/scenes/bunny.webp` | 1080 × 1080 | 136,3 kB |
| Róża | `assets/scenes/rose.webp` | 1080 × 1080 | 121,3 kB |
| Góry | `assets/scenes/mountains.webp` | 1080 × 1080 | 188,4 kB |
| Polski font DynaPuff 700 | `assets/fonts/dynapuff-polish-700.woff` | wektorowy | 26,7 kB |

Ilustracje 1080 px wyeksportowano z istniejących oryginałów 1254 px, bez generowania nowych obrazów. Nadają się do powierzchni 360 CSS px przy DPR 3. Tło zachowuje rozdzielczość dostarczonego pliku — nie dodawano pozornych szczegółów przez sztuczne powiększenie. Używa proporcjonalnego `object-fit: cover`; na innych proporcjach ekranu delikatnie kadruje boki. Dla przyszłego tła 3× na iPhone 13 Pro przygotuj 1170 × 2532 px (albo większe przy tym samym kadrze). DynaPuff zawiera polskie znaki, działa offline i jest dołączony z licencją OFL.

## Jak dodać następny obraz

1. Przygotuj kwadratową ilustrację **1080 × 1080 px** (źródło minimum 1080 px). Główny obiekt trzymaj w środkowych 70–75% kadru. Pełne tło aż do krawędzi; bez wrysowanych liter, baniek, przycisków i ramki.
2. Zapisz WebP w `assets/scenes/`. Dla zdjęć/ilustracji punktem wyjścia jest jakość 80–85; praktyczny cel to 80–180 kB na obraz.
3. Dopisz przypisanie w `spelling/scenes.mjs`, np. `['_aba', { key: 'frog', asset: 'frog.webp' }]`. Klucz musi dokładnie odpowiadać polu `masked` z bazy słów. Jeden obraz można przypisać kilku słowom.
4. `alignment: 'xMidYMid slice'` określa proporcjonalne kadrowanie w SVG; dostępne są również ustawienia `xMin`/`xMax` i `YMin`/`YMax`. Nie używaj `preserveAspectRatio="none"`.
5. `spelling/preview.mjs` automatycznie uwzględnia pozycje mające `asset` w podglądzie „tylko z ilustracją”. Brak obrazka albo błąd dekodowania daje przezroczystą bańkę; nie pojawia się ikona uszkodzonego pliku.

Nie dodawaj pełnej planszy dla każdego słowa. Tło, font, bańki i efekty są wspólne. Obecny niewielki zestaw ilustracji jest w cache startowym `sw.js`; przy dużej bazie nowe ilustracje mogą trafiać do cache dopiero po pierwszym użyciu. Po zmianie istniejącego pliku zwiększ wersję cache.

## Weryfikacja

Celowane sprawdzenie obejmuje układ przy szerokościach telefonu 320–430 px, krótszy viewport Safari, poprawną i błędną odpowiedź, stałość węzłów/pozycji przycisków, pauzę podczas przejścia, zatrzymanie czasu przy podpowiedzi, tryb ograniczonego ruchu i ponowny start offline. To emulacja przeglądarkowa; końcowy odbiór płynności odbywa się na rzeczywistym iPhonie.

## Naprawa plików i Safari (20.09.2026)

Osiem AVIF-ów w poprzednim commicie nie przechodziło pełnego dekodowania: grzyb, jeż, książka, samochód, schody, skóra, stół i żółty. Pliki istniały pod właściwymi nazwami, więc sam HTTP 200 nie wykrywał błędu. Odtworzono je jako WebP 1080 × 1080 z zachowanych PNG, bez generowania nowych ilustracji. Ubranie korzysta teraz ze sceny z płaszczem przeciwdeszczowym, zamiast ze skórzaną torbą.

Przed dodaniem obrazów uruchom `python scripts/validate_spelling_assets.py` (Pillow 11.3+). Test dekoduje pełne dane wszystkich przypisanych grafik i działa również w GitHub Actions. Przy przesyłaniu plików sprawdzaj SHA blobów; nie kopiuj uciętego wyjścia base64. Przypisania po `masked` i po pełnym słowie są obsługiwane także w filtrze ilustracji.

Zdjęcia są natywnymi elementami SVG `image`, bez `foreignObject`. Falowanie działa do 30 klatek/s, tempo 1,8 zamiast 1,28. Tło jest stałą warstwą poza kontenerem gry, obejmuje duży viewport i safe areas; kolory strony i theme-color są przywracane po rundzie. PWA korzysta z `black-translucent`; istniejący skrót może wymagać ponownego dodania po zmianie metadanych. Sam interfejs Safari nadal jest kontrolowany przez iOS — rzeczywisty wygląd przezroczystych pasków trzeba odebrać na telefonie.

## Gotowe ilustracje dołączone w v23

Dodano sześć pominiętych scen ze wcześniej przygotowanych oryginałów. Wszystkie mają 1080 × 1080 px i pełne dekodowanie po eksporcie do WebP.

| Plik | Słowa korzystające ze sceny |
| --- | --- |
| `sokol.webp` | sokół — nowy rekord słowa; poprawione wcześniejsze przypisanie do jaskółki |
| `huragan.webp` | huragan — nowy rekord słowa; poprawione wcześniejsze przypisanie do nieba |
| `drzewo.webp` | drzewo, zielony, korzeń |
| `zima.webp` | zima, śnieg |
| `ogorek.webp` | ogórek — nowy rekord słowa |
| `wiewiorka.webp` | wiewiórka — nowy rekord słowa |

Razem 923 588 bajtów nowych obrazów. Baza ma 404 słowa, z czego 127 ma przypisanie do ilustracji (30 różnych plików; część przypisań jest kontekstowa). 277 słów nadal nie ma obrazu: potrzebują kolejnego etapu przygotowania grafik, a nie przypadkowego przypisania istniejącej sceny. Nie generowano nowych obrazów.

Podgląd tylko tej paczki: `/ortografia/?assets=1&scene=sokol,huragan,drzewo,zima,ogorek,wiewiorka`. Parametr `scene` przyjmuje pojedynczy klucz lub listę oddzieloną przecinkami.

## Integracja paczki narracyjnej w v24

Siedem gotowych WebP z `temp/ortografia-assets/generated/` skopiowano bez rekompresji do `assets/scenes/` i przypisano po pełnym słowie: miód → `miod.webp`, sól → `sol.webp`, kółko → `kolko.webp`, kura → `kura.webp`, budzik → `budzik.webp`, muszla → `muszla.webp`, pudełko → `pudelko.webp`. Wszystkie mają 1080 × 1080 px; razem 798 872 bajty. Nie generowano nowych grafik ani nie zmieniano wyglądu bańki.

Aktualnie 134 z 404 słów mają przypisanie (37 różnych obrazów); 270 nadal wymaga ilustracji. Historyczne plansze SVG w `temp/` to propozycje, a nie gotowe obrazy do gry. Zaktualizowano wersje modułów i cache PWA; nowe pliki są dostępne offline po instalacji cache. Walidator sprawdza też przypisania paczki do istniejących słów, zgodność plików z oryginałami i obecność w cache.

Podgląd nowej paczki: `/ortografia/?assets=1&scene=miod,sol,kolko,kura,budzik,muszla,pudelko`. Można też wybrać pojedyncze słowo, np. `/ortografia/?word=miód`.
