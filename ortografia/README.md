# Ortografia — płynna scena, poprawka v22

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
