# Efekty ekranów i elementów

Animacje → Globalne wybiera dowolny widok z rejestru: start, użytkownicy, postępy, każdy tryb i jego stan. Podgląd używa prawdziwej aplikacji. Efekt zapisuje się osobno dla widoku w `screenEffects[viewId]`; wybór jednego ekranu nie zmienia pozostałych.

Komponenty → wybrany element → Efekt powierzchni korzysta z tych samych ustawień. Efekty są częścią `elementStyles[recipe]` lub `elementOverrides[viewId][elementId]`, więc dziedziczą ten sam zakres globalny / lokalny co geometria. Dostępne: ziarno, cząsteczki, neonowa siatka, płynny blask, bokeh i bąble; intensywność, liczba, tempo, rozmiar, miękkość, kolor oraz uruchomienie stałe / po tap / po odpowiedzi. Efekt cząsteczek na tekście próbkuje bieżący font i tworzy grupy punktów; podczas wyzwalanego rozpadu treść zachowuje znaczenie i dostępność. W Ortografii istnieje również osobna sekwencja składania następnego hasła.

Dekoracje mają `data-mn-decoration`, `aria-hidden` i `pointer-events:none`. Nie trafiają do hierarchii zaznaczania, nie zmieniają rozmiaru ani kolejności obiektów. Maksymalnie 32 elementy na dekorację i 16 aktywnych dekoracji komponentów; dla całego ekranu jest jedna nakładka. Ruch jest realizowany przez transformacje i opacity, faktura oraz cienie są stałe. Animacje pauzują w tle, w pauzie gry i dla ukrytych obiektów. Redukcja ruchu wyłącza ruch. Obserwatory i krótkie wybuchy są sprzątane przy zmianie efektu.

Górne ⚙ → Widoczne ustawienia prawego panelu ukrywa grupy geometrii, animacji, efektów, treści, kolorów, grafik, przycinania i wspólnego przepisu. Zapis `studioPreferences.hiddenInspectorGroups` jest częścią Git i szkicu. Ukrycie kontrolki nie wyłącza efektu; do tego służy „Bez efektu”.

## Bańka i domyślna poprawna odpowiedź

Przywrócono bazowe parametry `origin/main:spelling/bubble.mjs`: speed 4.7, amplitude 3.25, orbit 1.35, duration 1.20 s, blur 5.3, sparks 18 oraz pierwotne tuning/effects/chaos. Domyślny wygląd to klasyczna bańka SVG bez dodanej refrakcji, bloom i nowych optycznych tekstur. Nieaktywny filtr refrakcji jest odłączony od zdjęcia, zamiast przeliczać feTurbulence przy zerowej deformacji. Silnik kompozytowy pozostaje dostępny w Labie. Transformacje figur to osobny przełącznik `bubble.transforms`; zapisane kształty i parametry reakcji są zachowane, a przy wyłączeniu nie zmieniają konturu.

Domyślna poprawna odpowiedź używa istniejącego produkcyjnego `spelling/fireworks.mjs` (30 kolorowych gwiazdek/drobinek, skończony wybuch 1100 ms). `correctStyle:production` i aktywny tylko preset confetti. Własna biblioteka i globalne combo są opcjonalne. Efekty tła nie są domyślnie dokładane do klasycznej bańki.

## Inspiracje

Autorskie, ograniczone implementacje inspirowane wskazanymi przykładami:
- https://codepen.io/TaminoMartinius/pen/AobWbm — Interactive Particle Logo.
- https://codepen.io/maicodes/pen/RPeMYj — Neon Grid Loaders.
- https://speckyboy.com/css-border-effects/#Bordering_on_Groovy — płynny blask.
- https://codepen.io/andyfitz/pen/RJwqbZ — Bokehlicious.
- https://codepen.io/Mamboleoo/pen/BxMQYQ — Bokeh.

Weryfikacja: dwa przebiegi interakcji Studio (bokeh startu, osobny neon Matematyki, efekt kontenera, ukrywanie geometrii, odświeżenie i zachowanie szkicu), 162 testy. Klasyczna bańka w pełnym WebKit przez ~22 s: initial/correct/wrong/pause/resume/combo/next, 57–61 klatek/s, maksimum odstępu 55 ms, bez błędów i bez zatrzymania renderowania. To pomiar na komputerze; temperatura i finalna płynność na fizycznym iPhonie wymagają osobnej próby.

## Fragmenty liter i stos efektów (7 października 2026)

Słowo ma osobne pule lewej strony, odpowiedzi i prawej strony. Domyślnie litera to 20 fragmentów rastrowanych z bieżącego fontu i koloru, a nie kropki nałożone na tekst. Fragmenty pozostają widoczne nad zdjęciem (`z-index:1100`, poza kontenerem zdjęcia); oryginalny tekst pozostaje dla dostępności. Przy zmianie hasła pula jest przeliczana oddzielnie po obu stronach. Najbliższy fragment można ponownie wykorzystać do 120 px; reszta gaśnie albo powstaje lokalnie. Całość ma limit 576 węzłów i cache 80 map. Kwadraciki są fragmentami glifu, więc zachowują czytelność także przy małej liczbie.

Suwaki: części na literę (12–48), czas składania, czas dryfu, lokalny zasięg, losowość torów, wypełnienie fragmentów (5 = pełny rozmiar wycinka), drżenie i aberracja chromatyczna (maski glifu, bez prostokątnych cieni). Poprawna odpowiedź powstaje z punktów na obwodzie luki. Dopiero po jej złożeniu zwalniamy blokadę prezentacji następnego pytania. Rozpad/składanie to skończone WAAPI; delikatne drżenie to CSS. Pauza, zmiana preferencji ruchu i reset przywracają tekst/sprzątają warstwę.

`surfaceEffects` jest uporządkowaną listą maksymalnie czterech efektów: na ekranie lub we wspólnym/lokalnym przepisie komponentu. Pusta lista wyłącza stare pojedyncze ustawienie `effect`; stare szkice bez listy nadal działają. Każdy efekt ma własny typ, warstwę `background`/`foreground`, wyzwalacz oraz parametry. Mocne presety dotyczą nowego wyboru; istniejące parametry użytkownika pozostają zachowane. Bokeh zaczyna od 180 px, intensywności .8 i 10 obiektów; dostępne 2–360 px, blur do 32 px, pływanie do 200 px, różne rozmiary i odcienie. Kolory HSL są obliczane raz w JS dla zgodności z WebKit. Tło jest ujemną warstwą we własnym kontekście aplikacji, ponad podkładem i pod treścią; nakładka jest nad grą i nie przechwytuje dotyku. Zmiana ustawienia efektu nie przeładowuje sceny.

SVG używa tej samej dynamicznej ścieżki dla zdjęcia i obrzeża. Kompozytowy renderer animuje 48-punktowy kontur `clip-path` dla całej powłoki ze zdjęciem, zarówno w cyklu, jak w reakcjach. Przełącznik transformacji uruchamia cykl, jeśli dotąd wybrana była neutralna bańka. Wyłączenie zachowuje ustawienia, ale przywraca neutralny kontur.

Dwa przeglądy Chromium i WebKit: bokeh pod treścią + ziarno nad nią, dwa efekty komponentu, zapis i reload, `ma` = 40 / `enie` = 80 fragmentów, odpowiedź `rz` = 40 dodatkowych, kolejny wyraz `b_uch` = 20 / 60, transformacje zdjęcia w obu silnikach, brak błędów. Profil iPhone w desktopowym WebKit: pełna kompozycja klasycznego SVG + cykl + duży bokeh + fragmenty + konfetti, poprawna/błąd/pauza/wznowienie/zmiana zdjęcia; końcowa próba z aberracją około 47–61 FPS (przeważnie 55–61), najdłuższa przerwa 123 ms podczas zmiany sceny. Fizyczny iPhone i temperatura wymagają osobnej próby. Kosztowny własny filtr refrakcji trzeba mierzyć osobno od klasycznej bańki.
