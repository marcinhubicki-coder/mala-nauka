# Animacje na iOS/WebKit — post-mortem i zasady bezpieczeństwa

**Projekt:** Mała Nauka  
**Incydent:** 2026-10-06 → 2026-10-07  
**Zakres:** iPhone / Safari / PWA / WebKit, głównie Ortografia i efekty pełnoekranowe  
**Status:** źródło prawdy dla przyszłych zmian animacji

## TL;DR

Najpoważniejszy problem nie był zwykłym spadkiem FPS. Animacja działała przez chwilę, po czym **zatrzymywała się całkowicie**. Dotknięcie ekranu potrafiło ją na moment „obudzić”.

Najważniejsza reguła:

> Na iOS najpierw preferujemy transform i opacity gotowych warstw HTML/CSS. Cięższe techniki nie są zakazane, ale każdą trzeba testować w pełnym ekranie Małej Nauki, a nie tylko w izolowanym demo.

## 1. Ważna adnotacja: dema źródłowe działały płynnie

Podczas przeglądania inspiracji z CodePen / Speckyboy / LottieFiles wszystkie oglądane pojedyncze dema działały płynnie na fizycznym telefonie.

To oznacza, że nie należy upraszczać wniosków do stwierdzeń typu:

- „SVG zacina iPhone”;
- „WebGL jest za ciężki”;
- „duże gradienty zawsze są złe”;
- „clip-path nie działa na Safari”.

Problem pojawia się **w kontekście całej aplikacji**: jednocześnie mogą działać bańka, tło, overlay, animacja odpowiedzi, transition, filtry, kilka gradientów, logika gry, Service Worker i warstwy PWA. Efekt, który samodzielnie działa idealnie, może przeciążyć WebKit po dodaniu do już aktywnej kompozycji.

Z tego powodu źródłowe dema traktujemy jako referencję wizualną i dowód, że dany pomysł jest możliwy — ale nie jako gwarancję, że identyczna implementacja będzie bezpieczna po osadzeniu w grze.

## 2. Jak wyglądał błąd

- animacja startowała poprawnie;
- po krótkim czasie obraz stawał;
- nie wyglądało to jak „haczenie” ani 20–30 FPS;
- dotknięcie ekranu potrafiło chwilowo przywrócić ruch;
- obniżanie FPS nie rozwiązywało problemu;
- zamiana requestAnimationFrame na timer nie rozwiązywała problemu wizualnego.

Kluczowe rozróżnienie: **„utyka” ≠ „ma za mało FPS”.**

## 3. Co potwierdziły testy

W automatycznej przeglądarce WebKit z profilem iPhone 13:

- prosta animacja kontrolna utrzymywała około 60–62 FPS;
- stary ekran Ortografii ze starą bańką SVG potrafił spaść do 0–2 callbacków requestAnimationFrame na sekundę;
- setInterval nadal wykonywał logikę i potrafił zmieniać dane ścieżki SVG;
- dokument nie był ukryty;
- aplikacja nie była w stanie pauzy;
- JavaScript nie zgłaszał błędu.

Wniosek: logika aplikacji żyła, ale WebKit przestawał regularnie odświeżać / malować klatki.

## 4. Pierwotny winowajca: dynamiczna bańka SVG w pełnej kompozycji

Stary renderer bańki:

- zmieniał atrybut d dużej ścieżki SVG w czasie animacji;
- miał wiele powiązanych warstw konturu;
- nakładał dodatkowe efekty wizualne;
- działał jednocześnie z resztą ekranu gry.

Testy A/B pokazały:

- ukrycie lub usunięcie ciężkiej warstwy SVG przywracało płynność;
- wyłączenie części filtrów / mieszania warstw pomagało;
- zastąpienie bańki rendererem HTML/CSS usunęło zatrzymywanie.

Nowy renderer HTML/CSS przeszedł długie testy WebKit także dla correct, wrong, pause, resume i interakcji po odpowiedzi.

### Decyzja architektoniczna

Nie wracamy do dynamicznego SVG jako głównego renderera dużej, stale deformowanej bańki bez nowego proof-of-concept i testu WebKit.

SVG nadal jest akceptowalne dla:

- statycznych ikon;
- logo;
- małych assetów;
- prostych animacji;
- pojedynczych efektów, które przejdą test w pełnej kompozycji ekranu.

## 5. Drugie ryzyko: kilka dużych poruszających się gradientów

Przy globalnych efektach combo udało się ponownie wywołać problemy, gdy równocześnie przesuwały się i skalowały trzy bardzo duże gradientowe plamy.

Gdy ruch dużych płaszczyzn został zatrzymany, WebKit wracał do płynności.

Bezpieczniejszy wzorzec na Safari:

- duże gradienty statyczne lub prepainted;
- przenikanie przez opacity;
- ruch przez transform pozostawić mniejszym elementom;
- nie przesuwać wielu pełnoekranowych, półprzezroczystych warstw naraz.

## 6. Trzecie ryzyko: duże maski i clip-path

Loader startowy pokazał, że równoczesne animowanie kilku bardzo dużych okrągłych wycięć może chwilowo obniżyć liczbę klatek.

Pomogło:

- ograniczenie promienia do najmniejszej wartości nadal pokrywającej ekran;
- rozłożenie etapów w czasie;
- osobne testy WebKit dla samej maski i reszty efektu.

## 7. Wzorce wysokiego ryzyka

Nie są zakazane, ale wymagają benchmarku w pełnym ekranie:

- duży SVG z dynamicznym path d;
- feTurbulence / feDisplacementMap;
- animowane filtry SVG;
- duże filter: blur lub backdrop-filter;
- kilka dużych blendowanych gradientów;
- WebGL / GLSL w ekranie, który już ma inne cięższe efekty;
- canvas renderowany bez przerwy;
- setki cząsteczek z fizyką;
- duże animowane clip-path / maski;
- modyfikowanie width/height/top/left/border-radius co klatkę;
- pętla JS zapisująca do DOM przy każdym requestAnimationFrame.

## 8. Wzorce preferowane

1. CSS transform.
2. CSS opacity.
3. Web Animations API na transform / opacity.
4. Statyczne gradienty CSS.
5. Przenikanie kilku wcześniej wyrenderowanych warstw.
6. Mała liczba prostych elementów DOM.
7. Jednorazowe przygotowanie danych, a potem krótka animacja compositor-only.

Przykłady z obecnej implementacji:

- bańka: HTML/CSS;
- metaliczne obrzeże: statyczny conic-gradient;
- ciekła powierzchnia: lekkie highlighty CSS;
- słowo-cząsteczki: jednorazowe próbkowanie tekstu + krótki WAAPI;
- combo: tylko jeden globalny efekt naraz;
- loader: małe kulki + ograniczona geometria maski.

## 9. Aktualne budżety

### Słowo z cząsteczek

- WebKit / iPhone: maks. 32 grupy punktów;
- pozostałe: maks. 64 grupy;
- bez stałej pętli fizyki.

### Żar / iskry combo

- maks. 8 iskier w lekkim wariancie.

### Globalne combo

- tylko jeden efekt globalny naraz;
- poprzedni efekt jest sprzątany przed uruchomieniem następnego;
- efekt ma skończony czas życia;
- prefers-reduced-motion wyłącza cięższy ruch.

## 10. Jak diagnozować ponowne „utknięcie”

Nie zaczynać od 60 → 30 → 15 FPS.

Mierzyć niezależnie:

- requestAnimationFrame;
- timer JS;
- postęp CSS animations;
- document.hidden;
- stan pauzy aplikacji;
- aktywne warstwy efektu;
- pageerror i console.error.

Jeżeli timer działa, ale rAF / obraz staje, najpierw szukać problemu renderowania / compositora / paint.

## 11. Procedura izolacji A/B

Wyłączamy po kolei:

1. cały nowy efekt;
2. SVG;
3. filtry SVG;
4. CSS filters / backdrop;
5. duże gradienty;
6. particles;
7. ambient;
8. maski / clip-path;
9. animacje CSS;
10. dopiero potem logikę JS.

Nie robimy serii losowych zmian bez pomiaru.

## 12. Minimalny test przed wdrożeniem

### Test kontrolny

Prosta animacja w tej samej sesji WebKit musi być płynna.

### Test 10–30 sekund

Zbieramy co 0,5–1 s:

- rAF count;
- stan animacji;
- document.hidden;
- liczbę aktywnych warstw;
- błędy JS.

### Test stanów gry

- initial;
- correct;
- wrong;
- pause;
- resume;
- następne pytanie;
- touch / drag, jeśli efekt jest interaktywny.

### Test fizycznego urządzenia

Playwright WebKit jest regresją techniczną, ale ostateczny test wykonujemy na fizycznym iPhonie.

## 13. Cache i Service Worker

Cache potrafi fałszować testy:

- dla studio/pwa-test preferujemy świeże JS/CSS/JSON;
- przy krytycznym porównaniu używamy immutable Preview URL;
- w izolacji Playwright warto blokować Service Worker;
- na iPhonie stara ikona PWA może nadal mieć poprzedni kod.

Zielony build nie jest dowodem płynności animacji.

## 14. Loader i preload

Loader:

- osłania realne przygotowanie pierwszego ekranu;
- może mieć świadomie zaprojektowaną sekwencję startową;
- nie może blokować aplikacji w nieskończoność;
- podczas niego można dogrzewać assety kolejnych ekranów;
- respektuje prefers-reduced-motion.

## 15. Checklista przed Preview / produkcją

- [ ] Czy efekt jest testowany w pełnym ekranie Małej Nauki, nie tylko samodzielnie?
- [ ] Czy główny ruch opiera się na transform / opacity?
- [ ] Czy liczba cząsteczek ma twardy limit?
- [ ] Czy efekt sprząta DOM i animacje po zakończeniu?
- [ ] Czy tylko jeden cięższy efekt globalny działa naraz?
- [ ] Czy działa reduced-motion?
- [ ] Czy WebKit przeszedł 10–30 s bez zatrzymania?
- [ ] Czy sprawdzono correct / wrong / pause / resume?
- [ ] Czy test nie korzysta ze starego Service Workera?
- [ ] Czy fizyczny iPhone potwierdził brak „utknięcia”?

## 16. Najważniejsze pliki

- spelling/bubble-html.mjs
- spelling/bubble-html.css
- spelling/art.mjs
- spelling/response-effects.mjs
- spelling/combo-global.mjs
- spelling/combo-global.css
- spelling/word-particles.mjs
- spelling/word-particles.css
- boot-ui.mjs
- boot-loader.css
- boot-overlay.css
- design-system/pwa-test-build.mjs
- design-system/pwa-runtime-config.json
- tests/

## 17. Reguła końcowa

Jeżeli efekt jest spektakularny, ale w pełnej kompozycji Safari zaczyna zatrzymywać klatki, najpierw odtwarzamy wygląd lżejszą techniką.

**Płynność i brak zatrzymań > wierność techniczna wobec inspiracji.**

Inspiracja opisuje wygląd i zachowanie. Nie zobowiązuje nas do używania tej samej technologii.
## Aktualizacja 2026-10-07

Efekty scalono do źródeł Design Studio. Lab używa prawdziwego ekranu gry. Mapa liter jest rasteryzowana jednorazowo, a wiele drobnych punktów porusza się w ograniczonej liczbie grup WAAPI. Wyniki drugiej próby i ograniczenia: [weryfikacja wspólnego runtime](design-system/unified-runtime.md).

### Aktualizacja mechaniki liter 2026-10-07

Starszy budżet 32/64 grup wyżej dotyczy poprzedniej nakładki. Obecna mechanika używa fragmentów rasteryzowanych glifów (domyślnie 20 na literę, limit 576 węzłów łącznie), trzech lokalnych pul i skończonych animacji WAAPI. Szczegóły kontraktu, pomiarów i parametrów: [efekty ekranów i elementów](design-system/surface-effects.md#fragmenty-liter-i-stos-efektów-7-października-2026). Nie włączaj pełnej refrakcji zdjęcia bez osobnego porównania A/B w kompletnej scenie.
