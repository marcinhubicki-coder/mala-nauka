# Atlas scenic v28

Zmiany według pięciu ekranów referencyjnych z 17 października 2026:

- Usunięty sztuczny pasek telefonu. Nagłówek uwzględnia systemowy safe area; scena dochodzi do górnej krawędzi.
- Drewniana tabliczka ma pełne pętle sznurka obejmujące pasek postępu.
- Lokalny EB Garamond z polskimi znakami (45 KB, SIL OFL). Nazwa kraju najpierw zmniejsza się w stałych stopniach, potem dzieli na dwa wiersze. Stolica ma stałą pozycję; flaga zachowuje proporcje i wysokość namalowanego nagłówka.
- Większy obszar mapy, poszarpana maska oraz multiply z papierem. Widok kontynentu wypełnia obszar bez zmiany proporcji; zbliżenie jest wyśrodkowane na głównym obrysie kraju.
- Jeden symbol budynku dla stolicy na papierze i na mapie (biały w brązowym kółku). Brązowe aktywne przełączniki. Nazwy rzeczywistych sąsiadów otrzymują pierwszeństwo; odnośnik jest potrzebny dopiero, kiedy etykieta nie mieści się na swoim kraju.
- Wyższe, równe pergaminy odpowiedzi, znak × przy błędzie, włosy na dolnej krawędzi guzika.
- Pergaminy sąsiadów na telefonie: liczba, kolejność zgodna z ruchem wskazówek zegara od północy, przyciski włączające granice. Kolejne wiersze są krótsze i przylegają do pierwszego.
- Suwak na drewniano-pergaminowym torze z okrągłą maską kompasu bez zawieszki.

## Rejestracja Hiszpanii

Źródłowa ilustracja miała odchylenie wybrzeża względem dokładnej geometrii Natural Earth. Granica pozostaje niezmieniona. Lokalna siatka UV dopasowuje materiał ilustracji do 107 punktów wybrzeża; 40 zewnętrznych kotwic stabilizuje otoczenie. Ta sama przygotowana bitmapa jest używana w obu widokach. Plik źródłowy zachowuje 3658 × 2688 px.

Kalibracja: `node tools/calibrate-scenic-iberia.mjs` (narzędzie autorskie wymaga sharp). Wynik: `assets/maps/europe-iberia-registration-v28.json`. Test przeglądarkowy porównuje odległość rzeczywiście narysowanego wybrzeża od punktów geograficznych przed i po dopasowaniu, a także rozdzielczość.

## Materiały i font

Font: [oficjalne źródło Google Fonts](https://github.com/google/fonts/tree/main/ofl/ebgaramond). Licencja znajduje się przy pliku fontu. Sprawdzono komplet `ąćęłńóśźżĄĆĘŁŃÓŚŹŻ`. Font jest lokalny, więc wygląd nie zależy od systemowej Georgii.

Pergaminy odpowiedzi, sąsiadów i tor suwaka są natywnymi SVG, dzięki czemu ich krawędzie pozostają ostre. Okrąg kompasu jest maską istniejącej grafiki.

Nowa tabliczka: `assets/flags/adventure/scenic-task-sign-v28.webp`, 810 px szerokości, przezroczystość. Wygenerowano wbudowanym narzędziem imagegen, z istniejącą tabliczką v6 jako odniesieniem. Bez zewnętrznego API.

Prompt tabliczki:

> Use case: precise-object-edit. Asset type: transparent cutout wooden task sign for a whimsical illustrated atlas game. Edit target: the supplied empty honey-gold wooden sign. Preserve its wood grain, warm palette, two plank construction, little corner nails, broad empty center, and approximately 3:1 board proportions. Replace the abruptly cut-off rope pieces at the top with two COMPLETE natural twisted hemp rope hanging loops. Each rope loops over an invisible horizontal narrow rod, curves fully over the top with a small rounded arch, passes down in front and behind, and ties through the existing left/right holes in the board. Both rounded tops must be entirely visible with transparent margin above; no clipping. Rope arches only about 12 percent of board height above the wood, subtle realistic golden fibers, natural rounded cord rather than metal hooks. Board and both complete ropes isolated on a genuinely transparent background. NO text, NO letters, NO rod, NO progress bar, NO extra objects. Keep the board horizontal and easy to read; high detail hand-painted warm storybook game art.

## Weryfikacja

`node --test tests/scenic-atlas-labels.test.mjs`: geometria, etykiety, centrowanie wszystkich krajów i kolejność sąsiadów Polski.

`node tools/flags-scenic-qa-parallel.mjs`: Chromium i WebKit, telefony 390 × 700 / 390 × 844 / 430 × 932, safe area, wszystkie 45 europejskich nazw i kamer, obie skale mapy, pergaminy sąsiadów, kalibracja wybrzeża, animacje, pauza, restart, suwak, kolejne pytania oraz brakujące zasoby.

Lokalnie: 82/82 scenariusze pełnej rozgrywki w obu silnikach, następnie 6/6 dodatkowych kontroli końcowej wersji (opóźniony SVG, kalibracja Hiszpanii, mobilne pergaminy i kamery). Test danych i układu etykiet: 5/5. Pomiar wybrzeża w Chromium: średni błąd zmniejszony z 2,075 do 0,511 jednostki atlasu. Ostateczny pełny przebieg CI obejmuje 43 scenariusze na silnik.
