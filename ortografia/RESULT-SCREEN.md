# Ekran końca rundy

Wzór: zatwierdzony „Pastel Bunny Learning App Screen(1).png”. Ekran obejmuje ukończone i przerwane rundy. Nie zmienia zasad sesji ani zapisu postępów.

- Jeden ekran bez przewijania strony; ilustracja dochodzi pod pasek systemowy.
- Baza: iPhone 13 Pro, 390 × 844 CSS; skalowanie według dostępnej szerokości i wysokości.
- Królik i dolna łąka mają natywnie 1586 × 992 oraz 1706 × 922 px, wystarczająco dla @3x także przy szerokości 430–440 CSS.
- WebP 96 do wyświetlania; bezstratny PNG królika jako zapasowy format. Żadnych filtrów rozmycia ani dodatkowego panelu pod całą treścią.
- Zaokrąglony Nunito w wagach 600–950 na ekranie wyniku, z polskimi znakami; DynaPuff pozostaje fontem rozgrywki.
- Liczba poprawnych odpowiedzi, procent, pastylka trybu i pasek postępu nad dwoma kaflami.
- Zielone „Utrwalone”, różowe „Do powtórki”. Kliknięcie kafla pokazuje odpowiednią listę. Kafel „Opanowane” pozostaje ukryty.
- Poprawny zapis jest wyróżniony zielenią również na liście powtórek. Nagłówek: „Tu były małe potknięcia”, opis: „Zapamiętaj poprawną formę.”
- Trzy pełne wiersze; dalsze słowa przewijają się wewnątrz listy. Przyciski pozostają na ekranie.
- Okrągły X, żółte kreski, perłowe bańki i delikatnie migające gwiazdki; prefers-reduced-motion zatrzymuje animacje.
- Nowe moduły, fonty i obrazy w cache PWA. Kolejna runda używa rzeczywistej konfiguracji ostatniej sesji.

`result-preview.html` pokazuje wspólny renderer wewnątrz widoków 390×844, 393×852, 402×874, 430×932 i Safari 390×700. Przykładowe wyniki nie są zapisywane do historii. Scenariusze: przerwana, ukończona, wszystko poprawnie, długa lista powtórek, dyktando i brak odpowiedzi.

Ilustracje odtworzono w imagegen z zatwierdzonego mockupu: sama ilustracja góry z tym samym radosnym białym królikiem, zamkiem, stokrotkami i bańkami; osobno pas dolnej łąki bez tekstu i interfejsu. Elementy interfejsu pozostają prawdziwym HTML, CSS i SVG.

Viewport verification keeps three complete rows visible at 390 × 700 through 430 × 932, including simulated iPhone safe areas. Preview selectors redraw the shared renderer without navigating the iframe.

## Podbranch zasad i poprawek v5

Główny adres tego podbrancha otwiera od razu próbny wynik 2/7. Przykład używa prawdziwych rekordów z bazy i nie trafia do historii. Przycisk następnej rundy uruchamia grę, a kończąca ją sesja używa tego samego ekranu wyników. `result-preview-frame.html` uruchamia tę samą aplikację; ramka dodaje wyłącznie symulowane obszary bezpieczne i pasek systemowy na potrzeby podglądu.

Górna ilustracja dochodzi do y=0. Zarówno główny plik HTML, jak i strona modułu mają `apple-mobile-web-app-status-bar-style=black-translucent` i `viewport-fit=cover`. Tło dokumentu powtarza tę samą ilustrację pod paskiem iOS. Sprawdzenie samego natywnego paska wymaga otwarcia z ekranu początkowego iPhone'a; desktopowy podgląd sprawdza układ i konfigurację, bez emulowania systemowego paska iOS.

Usunięte są dwie obcięte bańki w ilustracji, pozostałe bańki i królik zachowują swój wygląd. Obraz v5 do wyświetlania: `assets/ortografia/result-hero-retina-v5.webp` (1586 × 992, WebP 96); oryginalny PNG v4 pozostaje zapasowym formatem dla przeglądarek bez WebP. Wbudowane imagegen, edycja `precise-object-edit`: usunąć wyłącznie bańki przecinające lewy i prawy brzeg; zachować królika, górne pełne bańki, zamek, motyla, stokrotki i pastelowe oświetlenie. Maska góry jest falistą krzywą SVG, bez szerokiego białego rozmycia; dolna łąka zachowuje naturalne proporcje. Animowane bańki są ograniczone do wnętrza ekranu. Promienie przy tytule są osobnymi ścieżkami SVG z okrągłymi końcami.

Miniatury są kwadratami 44 × 44 jednostki z `object-fit:contain`. Każdy wiersz ma przycisk „Zasada” z oczkiem. Pop-up używa istniejącego `createBubble()` z rozgrywki i dokładnie tej samej sceny co miniatura, poprawnej odpowiedzi oraz danych słowa. Native `dialog` obsługuje fokus, Escape i zamknięcie; po zamknięciu fokus wraca do przycisku. Kolekcja przechowuje wynik, otwartą listę i jej pozycję przewijania, a X odtwarza ten stan.

Opcjonalny obiekt `learning` w bazie słów:

```json
{
  "type": "memory",
  "title": "Rodzina wyrazów z „rz”",
  "explanation": "Krótka podpowiedź dopasowana do słowa.",
  "examples": [],
  "relatedWords": ["marzyć", "marzyciel", "marzeniowy"],
  "forms": ["marząc", "marzenia", "marzeniach"],
  "sources": [{"label": "WSJP PAN: marzenie", "url": "https://wsjp.pl/haslo/podglad/20483/marzenie"}]
}
```

`type`: `exchange` — Pisownia wymienna, `pattern` — Reguła, `exception` — Wyjątek, `memory` — Zapamiętaj. Przykłady wymiany mają `from`, `to`, `change`. `relatedWords` to wyrazy pokrewne, a `forms` to formy wyrazów z tej rodziny (np. „marząc” jest formą „marzyć”, a „marzeniach” — „marzenie”). Pole jest walidowane i kopiowane do zapisanej próby odpowiedzi, aby wynik zachował podpowiedź z chwili gry. Stare rekordy bez pola są nadal poprawne; pokazują wyłącznie poprawny zapis i ogólną podpowiedź.

Pięć opracowanych słów: marzenie, łóżko, możliwość, skuwka, krzyżówka. Źródła: WSJP PAN oraz materiały ZPE o ó/u i rz/ż (linki w danych). „Marzeniowy” potwierdza także leksykon morfologiczny ENIAM/IPI PAN: https://git.nlp.ipipan.waw.pl/wojciech.jaworski/ENIAM/blob/be209dd2fec745551fe35c203be9fc7358779298/morphology/plWordnet/morf_rel_148_lu.tab. Baza pozostałych słów oczekuje późniejszego opracowania.

Testy: `node --test tests/word-learning.test.mjs` sprawdzają zgodność ze starą bazą, walidację metadanych, zachowanie niezależnego opisu w prawdziwej sesji i wyniki przykładowych scenariuszy.
