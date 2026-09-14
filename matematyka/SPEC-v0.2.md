# Tabliczka mnożenia — Matematyka v0.2

## Pytania mnożenia

Każde pytanie z tabliczki mnożenia pokazuje **6 możliwych wyników**. Odpowiedzi są zawsze ułożone **rosnąco: od lewej do prawej, a potem w kolejnym rzędzie**. Układ odpowiedzi to **2 kolumny × 3 rzędy**.

Po poprawnej odpowiedzi następne zadanie pojawia się automatycznie — bez przycisku „Dalej”.

## Stała plansza mnożenia

Wyjaśnienie błędnej odpowiedzi zawsze używa tej samej planszy **10 × 10**. Plansza nie zmienia wymiarów między zadaniami.

Dla działania `a × b`:

- pierwsza liczba `a` oznacza liczbę rzędów,
- druga liczba `b` oznacza liczbę kolumn,
- obszar `a × b` jest delikatnie podświetlony,
- pozostałe pola pełnej planszy 10 × 10 są widoczne, ale lekko wyszarzone,
- etykiety rzędów i kolumn zawsze pokazują zakres 1–10.

Przykład: `3 × 5` oznacza 3 pierwsze rzędy i 5 pierwszych kolumn. `5 × 3` pokazuje 5 rzędów i 3 kolumny, co pozwala wizualnie tłumaczyć przemienność mnożenia bez zmiany geometrii ekranu.

## Błędna odpowiedź i wejście explainera

Po błędnej odpowiedzi aplikacja najpierw pokazuje pod działaniem komunikat w rodzaju:

`Wynik tego działania to nie 24.`

Wybrana błędna odpowiedź jest widoczna w komunikacie. Po krótkiej pauzie kafel explainera płynnie się rozwija, a jego zawartość pojawia się etapami. Zmiana ma wyglądać jak spokojne wyjaśnienie, nie jak nagłe przełączenie ekranu.

## Kolejne dodawanie

Po prawej stronie planszy znajdują się kolejne kroki dodawania, np. dla `10 × 10`:

- `10`
- `10 + 10 = 20`
- …
- `90 + 10 = 100`

Kolumna działań jest możliwie wąska; aktywne podświetlenie obejmuje tylko sam zapis działania, a nie szeroki pusty pasek.

## Interakcja, numerowanie i animacja

Dotknięcie, wskazanie lub fokus danego kroku podświetla wszystkie pola odpowiadające temu wynikowi. Podświetlone kwadraty są jednocześnie numerowane kolejno od `1` do aktualnego wyniku.

Przykład dla `3 × 5`:

- aktywacja `5` numeruje pola 1–5,
- aktywacja `5 + 5 = 10` numeruje pola 1–10,
- aktywacja `10 + 5 = 15` numeruje pola 1–15.

Aktywowane pola i ich cyfry pojawiają się krótką animacją kaskadową. `prefers-reduced-motion` nadal jest respektowane.

## Co po błędzie

Przyciski znajdują się **pod kaflem explainera jako osobny moduł** z wyraźnym odstępem.

- **Spróbuj ponownie** — wraca do tego samego działania i ponownie wybiera wynik; to akcja sugerowana i ma mocniejszy wizualny priorytet.
- **Dalej** — przechodzi od razu do nowego działania; to spokojniejsza akcja drugorzędna.

## Pozostałe zasady

- nagłówek modułu brzmi `Tabliczka mnożenia`,
- plansza ma mieścić się na ekranie telefonu bez poziomego przewijania,
- pola są kwadratowe i wykorzystują możliwie dużo dostępnego miejsca,
- geometria planszy 10 × 10 pozostaje stała dla całej tabliczki mnożenia do 100,
- interakcja tap/hover/focus pozostaje,
- po poprawnej odpowiedzi nadal nie ma przycisku „Dalej” — następne zadanie pojawia się automatycznie,
- `prefers-reduced-motion` nadal jest respektowane.
