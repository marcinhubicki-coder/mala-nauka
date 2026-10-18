# Scenic v36 — spójny atlas i ostatnie poprawki sceny

Pytanie ma większy krój Merienda i jest optycznie podniesione względem widocznego pergaminu. Nakładające się, wygaszone brzegi górnej i dolnej części papieru usuwają poziome odcięcie faktury. Kompas na papierze i przełącznik PL/EN powiększono o 15% względem środka; przełącznik ma skorygowane położenie między paskiem czasu, tabliczką i wycięciem papieru. Pole rozjaśnienia pod nazwą i stolicą wydłużono o 5 px, flagę podniesiono o 8 px. Sąsiedzi mają miedziany obrys z jasnym zewnętrznym brzegiem, odmienny od aktywnego kraju.

## Jedna geometria dla mapy i wyróżnień

Poprzedni obraz Europy zawierał namalowane granice, których zgodność była korygowana lokalnie. W v36 podkład, linie krajów, aktywne wypełnienie i obrys korzystają z identycznych ścieżek Natural Earth 1:50m. Nie ma osobno namalowanych granic, które mogłyby przesunąć się względem wyróżnienia po zmianie kadru. Generator zachowuje pełne ścieżki, zaokrąglone wspólnie do dwóch miejsc w układzie atlasu. Nie wprowadzono zmian granic względem źródła.

Nowy podkład jest rysowany z geometrii i dwóch materiałów: płaskiej akwarelowej ziemi oraz gór z przezroczystym tłem. Góry trafiają do 222 nazwanych obszarów pasm górskich; dodano też rzeki, jeziora i pustynie. Zasięgi gór pochodzą z orientacyjnych regionów fizycznych Natural Earth, nie z modelu wysokości. Sylwetki szczytów, śnieg i drzewa są ilustracją, nie dokładnym pomiarem terenu. Otwarty ocean jest rysowany na cały kadr, a szarpana maska należy do ramki pergaminu. Koniec dawnego prostokątnego obrazu nie odsłania już pustego papieru.

Źródła danych są public domain: [warunki Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/), [regiony fizyczne](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-physical-labels/). Odtwarzalny generator to `tools/prepare-scenic-world.mjs`; oczekuje plików `natural-earth-{countries-50m,places,regions,rivers,lakes}.geojson` w katalogu przekazanym jako pierwszy argument. Hashe wejść i geometrii zapisano w `assets/maps/atlas-world-v36-source.json`. Skompresowany atlas zawiera 242 obiekty krajów i terytoriów; jest pobierany raz, a kolejne kadry używają tej samej geometrii i materiałów.

Kamera zachowuje proporcje. Przy oddalaniu utrzymuje kotwicę kraju, dopóki pozwalają na to granice obszaru; przy krawędzi przesuwa kadr minimalnie, zamiast wymuszać środek i ujawniać brak mapy. Dla Rosji widok bliski pokazuje część europejską, a przycisk globu przechodzi do pełnego widoku Europy i Azji. Długości geograficzne Czukotki są rozwinięte za południk 180°, dlatego kraj nie jest rozrywany na dwie krawędzie mapy. Lista Rosji obejmuje wszystkich 14 sąsiadów lądowych, w tym Chiny, Mongolię i Koreę Północną. Pozostałe kraje w europejskiej grze zachowują regionalną listę sąsiadów; np. Francja nie dostaje tu Brazylii i Surinamu z Gujany Francuskiej.

Wspólny podkład obejmuje Europę, Eurazję, Azję, Afrykę, Amerykę Północną, Amerykę Południową i Oceanię. Osobny `flagi/atlas-preview.html` pozwala obejrzeć te kadry. Kolejka gry pozostaje europejska — inspektor pokazuje przygotowaną podstawę dla kolejnych kontynentów, a nie ukończone nowe tryby gry.

## Budowanie liter

Liczba ziaren wzrosła z 15 do 30 na literę; są rysowane jako koła. Punkty są pobierane z faktycznego kroju, rozmiaru i linii bazowej tekstu. Rozpad pozostaje pionowy do kopczyków poszczególnych liter. Przy formowaniu punkty odsłaniają dokładną maskę fontu, a końcowe zanikanie tej maski jest zsynchronizowane z pojawianiem się zwykłego tekstu. Nie używa się rozmycia. Sąsiedzi i suwak rozpoczynają wjazd po dwóch z trzech przelotów atramentu.

## Krótkie sprawdzenie przed akceptacją

- Składnia wszystkich modułów i kontrola różnic.
- Matematyczne ograniczenie obu kadrów oraz zachowanie proporcji dla Polski, Ukrainy, Norwegii, Szwecji, Finlandii, Islandii i Rosji.
- Chromium: błędna odpowiedź, start sąsiadów przy 67,5% rysowania, 30 okrągłych ziaren na literę, składanie i przekazanie do zwykłego fontu oraz przejście do następnego pytania.
- WebKit: pytanie, regionalny i pełny kadr Rosji, 14 sąsiadów oraz zmiana kontynentów w inspektorze. Po ostatnim poszerzeniu obszaru Eurazji ponowiono tylko kadry Rosji i krótką kontrolę kamery.

Raporty: `qa-preview-v36/final.json`, `motion.json`, `webkit.json`. Zrzuty są w lokalnym katalogu outputs/v36. Nie uruchamiano pełnej baterii wszystkich krajów ani natywnej instalacji v36 w iOS Simulator lub fizycznym iPhonie. WebKit z ustawionym viewportem i symulowanym trybem standalone nie jest testem urządzenia. Poprawka wysokości PWA z v34 pozostaje aktywna; efekt rozmycia systemowego obszaru iOS nie został w tym wydaniu zmieniony. Pełny przegląd wizualny i dostosowanie starej baterii do nowego atlasu pozostają po akceptacji. Ciężki przebieg CI jest nadal uruchamiany wyłącznie ręcznie.

## Nowe materiały graficzne

Użyto wbudowanego narzędzia ImageGen (bez trybu CLI). Wybrane obrazy skopiowano do projektu jako WebP; przezroczystość gór zachowano.

- `assets/maps/atlas-ground-v36.webp` — 1536×1024, płaski akwarelowy materiał ziemi, na podstawie poprzedniej faktury atlasu.
- `assets/maps/atlas-mountain-v36.webp` — 1536×1024, osobny zespół szczytów z kanałem alfa, po dodatkowym usunięciu poświaty.

Końcowy zestaw promptów i źródła plików są w [scenic-assets-v36.json](scenic-assets-v36.json).

