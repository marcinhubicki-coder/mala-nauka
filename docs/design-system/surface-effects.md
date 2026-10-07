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
