# Mała Nauka — Matematyka v0.2

## Stała plansza mnożenia

Wyjaśnienie błędnej odpowiedzi w mnożeniu zawsze używa tej samej planszy **10 × 10**. Plansza nie zmienia wymiarów między zadaniami.

Dla działania `a × b`:

- pierwsza liczba `a` oznacza liczbę rzędów,
- druga liczba `b` oznacza liczbę kolumn,
- obszar `a × b` jest delikatnie podświetlony,
- pozostałe pola pełnej planszy 10 × 10 są widoczne, ale lekko wyszarzone,
- etykiety rzędów i kolumn zawsze pokazują zakres 1–10.

Przykład: `3 × 5` oznacza 3 pierwsze rzędy i 5 pierwszych kolumn. `5 × 3` pokazuje 5 rzędów i 3 kolumny, co pozwala później wizualnie tłumaczyć przemienność mnożenia bez zmiany geometrii ekranu.

## Kolejne dodawanie

Po prawej stronie planszy znajdują się kolejne kroki dodawania, np. dla `10 × 10`:

- `10`
- `10 + 10 = 20`
- …
- `90 + 10 = 100`

Kolumna działań ma stałą szerokość dobraną tak, aby najdłuższy zapis mieścił się bez przebudowy layoutu. Dla zadań z mniejszą liczbą rzędów niewykorzystane wiersze pozostają puste, dzięki czemu geometria całego explainera jest stała.

## Interakcja i numerowanie pól

Dotknięcie lub wskazanie danego kroku podświetla wszystkie pola odpowiadające temu wynikowi. Podświetlone kwadraty są jednocześnie numerowane kolejno od `1` do aktualnego wyniku.

Przykład dla `3 × 5`:

- aktywacja `5` numeruje pola 1–5,
- aktywacja `5 + 5 = 10` numeruje pola 1–10,
- aktywacja `10 + 5 = 15` numeruje pola 1–15.

Numeracja ma pomóc młodszemu dziecku zobaczyć, że wynik mnożenia odpowiada dosłownej liczbie pól w zaznaczonym obszarze. Numery są pomocnicze i pojawiają się dopiero podczas aktywacji kroku, żeby podstawowa plansza pozostała spokojna wizualnie.

## Pozostałe zasady

- plansza ma mieścić się na ekranie telefonu,
- pola są kwadratowe,
- interakcja tap/hover/focus z poprzedniej wersji pozostaje,
- po poprawnej odpowiedzi nadal nie ma przycisku „Dalej” — następne zadanie pojawia się automatycznie,
- `prefers-reduced-motion` nadal jest respektowane.
