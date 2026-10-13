# Flagi — Scenic Preview v2

Gałąź: `feature/flags-scenic-preview-v1`. Wariant odrębny od produkcji i Design Studio. Bez scalenia do `main`.

## Uruchomienie

- `flagi/scenic-preview.html?country=by` — pełna rozgrywka, wszystkie europejskie państwa z istniejącej bazy.
- `?country=by&state=correct&freeze=1` — poprawna odpowiedź bez automatycznego przejścia, do oceny wizualnej.
- `?country=by&state=wrong&freeze=1` — błędna odpowiedź, mapa i suwak.
- `adventure-preview.html?screen=flag-scenic` — dotychczasowy selektor telefonu.
- `node tools/flags-scenic-qa.mjs` — pełna weryfikacja w Chromium i WebKit. Wymaga Playwright 1.56.1 oraz obu silników. Workflow `.github/workflows/flags-scenic-preview.yml` uruchamia ją na izolowanej gałęzi i zapisuje obrazy z raportem w `docs/flags-adventure/qa-scenic/`.

## Odpowiedzialności i konfiguracja

| Plik | Odpowiedzialność |
| --- | --- |
| `scenic-preview.mjs` | stan gry, HUD, punktacja, suwak i preładowanie następnej flagi |
| `scenic-europe.mjs` | wspólny WebP, wyróżnienie SVG, kadrowanie i etykiety sąsiadów |
| `scenic-paper.mjs` | trzy zagięcia zawierające fragmenty przygotowanego atlasu |
| `scenic-sand.mjs` | próbkowanie liter i jeden Canvas: spadanie, odbicie, osiadanie, formowanie nowych liter |
| `scenic-timeline.mjs` | pauza oraz anulowanie wszystkich oczekiwań i animacji po restarcie |
| `scenic-config.mjs` | jedyne źródło czasów i liczby ziaren |
| `scenic-preview.css` | jeden zestaw reguł układu i stanów, bez wcześniejszych sprzecznych nadpisań |

Czas otwarcia: 1050 ms; zamknięcia: 760 ms; piasku: 1550 ms; zapamiętania: pełne 3900 ms **po** przygotowaniu i całkowitym otwarciu mapy. Ziarna: 15 na niepustą literę, maksymalny DPR Canvas: 2. Pętla Canvas istnieje tylko w czasie przejścia. Końcowy atlas nie ma działających animacji.

Prawidłowa odpowiedź przechodzi automatycznie. Błędna czeka na pełne przeciągnięcie suwaka; Enter, Spacja, ArrowRight i End zapewniają dostęp klawiaturą. Pauza zachowuje pozostały czas prezentacji i zatrzymuje Web Animations oraz Canvas. Restart rozstrzyga odrzucone obietnice, usuwa piasek, resetuje przeciąganie i stan pauzy. Kolejna flaga jest przygotowywana przed zamknięciem mapy. Odpowiedzi pozostają zablokowane do zakończenia obu efektów.

## Scena i geometria

Nowa **jedna** ilustracja `assets/flags/adventure/scenic-scene-v3.webp` zawiera chłopca, pieska i cały krajobraz. Tymczasowy pies SVG i wycinek chłopca z obcej sceny zostały usunięte. Rozdzielczość 1170 × 2532, WebP około 349 KiB. Nie wygenerowano żadnych flag ani obrazów osobnych państw.

Ilustrację przygotowano narzędziem ImageGen z załączonego mockupu oraz istniejącego krajobrazu. Brief: zachować ciepły cinematic 3D storybook, jezioro, góry, zamek i wspólne oświetlenie; usunąć telefon i całe UI; osadzić obie postacie wyłącznie w dolnej ćwiartce; zachować wolny obszar dla HUD, flagi i odpowiedzi. Druga iteracja zmniejszyła postacie do około 65% pierwotnej wielkości i obniżyła ich głowy poniżej 75% wysokości.

Jedyna mapa geograficzna: `assets/maps/europe-scenic.webp` (1360 × 1000), wygenerowana ze źródła `assets/maps/europe.svg` w tym samym układzie 680 × 500. Dzięki wspólnemu źródłu kształt i granice wyróżnienia zgadzają się z rastrem. Po załadowaniu WebP pozostaje tylko wybrane państwo i jego obrys. Etykiety są osobną lekką warstwą HTML; nie ma animacji innych krajów ani całego atlasu.

Kadrowanie liczy rzeczywistą widoczną część **sąsiada**, a nie jej procent całego okna. Minimalna szerokość okna wynosi 120 jednostek źródłowych; dla dużych państw powiększa się, aby zachować kształt i otoczenie. Cel: około 6–10 sąsiadów; w gęstym obszarze i na niskim ekranie dopuszczalnych jest 11. Etykiety nie nakładają się i nie uciekają poza krawędzie.

Natural Earth 1:110m nie zawiera granic najdrobniejszych państw. Korzystamy z istniejącego `map-microstates.js`; Liechtenstein i Watykan mają znacznik położenia, a nie sztucznie powiększony obszar. To ograniczenie źródła geografii, zachowane jawnie w raporcie.

## Zagięcia i inspiracje

- https://freefrontend.com/css-3d-transforms/#2026-06-18-3d-folding-paper-receipt-card-l
- https://freefrontend.com/css-3d-transforms/#2025-12-08-treasure-map-l
- https://freefrontend.com/css-3d-transforms/#2025-10-24-cards-with-parallax-tilt-effect-l

Przygotowany atlas jest raz rasteryzowany wraz z wyróżnieniem i podpisami do obrazu używanego na trzech wielokrotnie używanych powierzchniach. Każda pokazuje swoją trzecią część karty. Zagięcia rozkładają się kolejno od dolnej osi; pokazują geografię podczas ruchu, bez pustych osłon oraz skalowania całego arkusza do cienkiego prostokąta. Po rozłożeniu widoczna jest nieruchoma warstwa rzeczywistej mapy. Zamknięcie stosuje odwrotną sekwencję. Oba efekty używają transformacji i opacity przez Web Animations.

Piasek powstaje z próbek rzeczywistych kształtów starych liter, osiada w małych kopczykach na linii tekstu, a potem przemieszcza się do próbek liter nowych odpowiedzi. Ziarna mają zróżnicowane opóźnienia, rozrzut, odbicie i kolor. Losowanie zależy od państwa i numeru przejścia. Nowy tekst pojawia się dopiero w końcowych 9% animacji.

## Przebiegi QA

1. Pierwsza iteracja układu wykryła brak identyfikatora HUD i brak zakończenia inicjalizacji. Poprawiono połączenie HTML/JS oraz zbieranie obsłużonych błędów konsoli.
2. Druga iteracja: 5/10 scenariuszy. Trzy stany Białorusi, niski ekran Polski i przejście animacji działały. Szwajcaria, mikropaństwa, długa nazwa i safe-area ujawniły zbyt szerokie kadry. Obrazy wszystkich tych scen oraz sześć klatek otwierania/piasku zostały rzeczywiście obejrzane. Poprawiono licznik widocznej części sąsiada i minimalny kadr, wzmocniono czytelność pergaminu.
3. Pierwszy pełny przebieg Chromium/WebKit: **33/34**. Wszystkie scenariusze gry przeszły w obu silnikach. Jedyny timeout dotyczył pominięcia krótkiej fazy podczas wolniejszego zapisu screenshotu WebKit. Dodano sterowane zamrożenie czasu wyłącznie dla URL `qa=1`; nie zmienia ono fotografowanego UI.
4. Powtórny pełny przebieg: **33/34**. Końcowa faza piasku WebKit nadal kończyła się między stwierdzeniem progu a osobnym żądaniem zatrzymania. Próg zamrożenia jest teraz uzbrajany przed wznowieniem osi czasu i zatrzymuje ją bezpośrednio w klatce Canvas, niezależnie od opóźnienia screenshotu.
5. Końcowy przebieg po poprawie przechwytywania, ujednoliceniu zielonego fallbacku SVG, izolacji asynchronicznego wyniku mapy i odsunięciu komunikatu od głowy chłopca: wynik w `docs/flags-adventure/qa-scenic/report.json`. Obejmuje poprawną odpowiedź i automatyczne przejście, błędną odpowiedź i suwak, pauzę prezentacji i piasku, trzy kolejne pytania, restarty na granicach stanów, duże nazwy, ograniczony ruch, awarie flagi/WebP/SVG oraz opóźnione wczytanie atlasu. Osobne klatki otwierania i zamykania są ustawiane na rzeczywistej osi Web Animations przy 6%, 47% i 92%; klatki piasku pokazują spadanie, osiadanie, tworzenie liter i końcówkę.

## Publikacja i granice weryfikacji

Vercel 2026-10-13 odrzucił nowy preview: HTTP 402, `api-deployments-free-per-day`, ponad 100 deploymentów dziennie, `retryAfter: 86400`. Nie opublikowano przez `main`, nie zmieniono ochrony deploymentów ani planu. Istniejący link Vercel wskazuje wcześniejszy kod i nie jest potwierdzeniem v2. Wdrożenie aktualnego SHA wymaga odnowienia limitu.

Chromium i desktopowy WebKit nie potwierdzają wydajności GPU telefonu ani zachowania rzeczywistego Safari/PWA. Pozostaje fizyczny test iPhone 13 Pro: płynność, dotyk, bezpieczne obszary, pamięć przy długiej sesji i powrót z tła. Nie deklarujemy zmierzonego 60 FPS ani pełnego trybu offline. Wariant obsługuje awarie pojedynczych grafik, ale nie instaluje oddzielnego service workera.
