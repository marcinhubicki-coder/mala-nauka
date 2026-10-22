# v65 — wyrównanie kampanii, księgi i ekranu startowego

Zmiany lokalne, gałąź `work/campaign-spacing-v65`. Wspólne renderery dla Design Studio i PWA.

## Kampania

- [x] KROK ma podstawę bliżej dolnej krawędzi górnego występu; odległość do podtytułu jest mniejsza.
- [x] Numer, podtytuł, historia i szczegóły zadania mają wspólną lewą oś, 23 px od krawędzi kafla.
- [x] „Czytaj ze zrozumieniem” mieści się w jednym wierszu i w obrębie schodka o szerokości 45% kafla.
- [x] Ikony księgi i oceny zmniejszone z 80 do 68 px; w niskich oknach do 62 px.
- [x] Historia ma miejsce na trzy linie, font 15 px przy 390 × 844, interlinia 23 px.
- [x] Usunięta informacja „Możliwy medal”.
- [x] Zmiana kroku przejmuje aktualnie widoczną wysokość, również podczas przerwanej animacji. Obrys i zdekodowane tło kafla zachowują swoje elementy. Kolejne treści wchodzą z opóźnieniem.
- [x] Mapa i dolna krawędź kafla nie zmieniają położenia podczas rozwijania.

## Księga

- [x] Usunięte boczne i dolne odsunięcie księgi od ekranu telefonu. Przyciski pozostają ponad obszarem gestu systemowego.
- [x] Kolumna wycentrowana względem ornamentów papieru i czterech pól nawigacji; czerwony przycisk leży na tej samej osi.
- [x] Wycentrowane podkreślenie, skrócone do 85% szerokości.
- [x] Komunikat o nieodkrytych fragmentach jest niżej i ma większy odstęp od kreski; kreska ma 85% szerokości.
- [x] Czerwony przycisk ma uporządkowaną przestrzeń poniżej, do nawigacji.
- [x] Spis mieści 15 wpisów bez przewijania; rzędy dopasowują się do dostępnej wysokości.
- [x] Nawigacja nie uruchamia zmiany strony podczas przygotowywania pierwszego wejścia księgi — zabezpieczenie przed kolizją animacji i pustą kartką.

## Ekran startowy

- [x] Dolny kafel ma równe optyczne odstępy po bokach i pod przyciskiem, z uwzględnieniem jego wypukłego cienia.
- [x] Kowadło obniżone o 3 px, pierścień i podpis zachowują pozycję.
- [x] Licznik większy o 10%, rośnie w górę; podpisy zostają na tej samej wysokości.
- [x] Gwiazda większa o 5%, pulsowanie silniejsze o 30% względem środka (amplituda 4% → 5,2%).

## Weryfikacja

- Lokalny build: poprawny.
- Chromium i WebKit, 390 × 844: geometria, widoczność spisu, 15 wpisów, wspólne osie, rozmiary, odstępy i przerwana animacja — poprawne.
- Kampania: 3 linie opisu; ikony 68 px; brak informacji o medalu.
- Księga: krawędzie 0–390 px, dół 844 px (WebKit zaokrągla o 0,016 px), pełna widoczność treści.
- Padding pod przyciskiem startowym i po obu jego bokach: 11,125 px optycznie w obu silnikach.
- Kontrakty widoków home-story, campaign, campaign-book, campaign-portal: 8 kontroli iPhone/desktop bez błędów; 54 widoki pozostają w rejestrze.
- Ręcznie obejrzane lokalne Studio i księga w przeglądarce. Istniejąca 1 zmiana szkicu Studio zachowana, bez zapisywania/odrzucania.
- Nie sprawdzano na fizycznym iPhonie. Nie publikowano na Vercel.

## Podglądy

- [Design Studio](http://127.0.0.1:8874/design-system/#campaign-lab)
- [PWA](http://127.0.0.1:8874/)
- [Ekran startowy](http://127.0.0.1:8874/?studio=1&screen=home&state=story&viewId=home-story&homeCompleted=0)
- [Księga](http://127.0.0.1:8874/?studio=1&screen=campaign-book&viewId=campaign-book)

Dowody pomiarów: `checks.json`, `motion-chromium.json`, `motion-webkit.json`. Zrzuty w tym folderze pozostają lokalne i nie trafiają do commita.
