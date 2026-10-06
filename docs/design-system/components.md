# Komponenty, widoki i zachowania

Katalog obejmuje **12 rodzin komponentów** oraz **40 widoków i stanów**. Każdy podgląd korzysta z istniejącego renderera, rzeczywistej Session i jawnego fixture. Nie jest osobną makietą gry.

## Katalog

| Komponent | Tokeny | Warianty | Stany |
| --- | --- | --- | --- |
| Płótno i odstępy | `layout` | domyślny | default |
| Kafel ustawień | `card` | domyślny | default |
| Przełącznik jelly | `jelly` | pełny: ustawienia; mały: czas/słowa i PL/EN | idle, selected, dragging, disabled |
| Mały toggle | `toggle` | domyślny | default |
| Przycisk główny | `button` | jelly CTA; kontynuacja profilu; wyniki | idle, pressed, disabled |
| Odpowiedź | `answer` | pełny: litery ortografii; kompaktowy: słowa, kraje i liczby | initial, correct, wrong, disabled |
| Fiszka | `flashcard` | płaska: angielski i czytanie; wzbogacona: ortografia i flagi | prompt, reveal, feedback |
| Przeciągnij dalej | `slider` | następne pytanie; następna runda | idle, dragging, spring-back, complete |
| Popup / zasada | `popup` | podpowiedź; pauza; zasada; ustawienia pomocnicze | closed, open, scrolling |
| Postęp i licznik | `progress` | zegar rundy; podsumowanie | running, paused, finished |
| Profil i avatar | `profile` | wybór; tworzenie; PIN | empty, selected, locked, unlocked |
| Puchar | `trophy` | domyślny | default |

## Warunki

### Płótno i odstępy

- Wspólny token; zmiana obejmuje wskazane użycia.

### Kafel ustawień

- Wspólny token; zmiana obejmuje wskazane użycia.

### Przełącznik jelly

- Kliknięcie, drag i klawiatura wybierają dokładnie jedną opcję.
- Natywny click obsługuje tap; drag tłumi późniejszy click.

### Mały toggle

- Wspólny token; zmiana obejmuje wskazane użycia.

### Przycisk główny

- CTA ustawień wymaga poprawnej konfiguracji.
- Tworzenie gracza wymaga prawidłowej nazwy; PIN czterech cyfr, jeśli jest włączony.

### Odpowiedź

- Wybór dostępny dopiero po prezentacji pytania.
- Po odpowiedzi przyciski są zablokowane; poprawne oznaczenie nie jest stanem hover.

### Fiszka

- Pytanie i odpowiedź mają wspólną tożsamość.
- Płaska fiszka pozostaje czytelna dla dłuższej treści; wzbogacona dodaje ilustrację.

### Przeciągnij dalej

- Start gestu z uchwytu; klik toru nie kończy kroku.
- Próg ukończenia i minimalny ruch 24 px; klawiatura: strzałki oraz Home. Enter i Space nie kończą gestu.
- W grze widoczny po błędzie; na wynikach uruchamia następną rundę.
- Uchwyt korzysta z tego samego modelu deformacji co przełącznik jelly: podczas ruchu rozciąga się, ściska i lekko przechyla, a po puszczeniu wygasa przez odrzut i krótkie odbicie.
- Geometria i skórka pozostają własnością suwaka. `sliderWrong` zachowuje iskrę, a `sliderResult` komunikat ukończenia; oba dziedziczą `jelly.squish`, `jelly.tilt`, `jelly.inertia` i `jelly.bounce`.
- Ograniczenie ruchu pozostawia samo przesunięcie uchwytu bez deformacji i sprężynowania.

### Popup / zasada

- Podpowiedź jest dostępna przed odpowiedzią.
- Pauza zatrzymuje czas; wznowienie przywraca wcześniejszy stan.
- Zasada dotyczy wybranego hasła i własnej ilustracji.

### Postęp i licznik

- Błąd zatrzymuje czas.
- Flagi wstrzymują zegar na czas prezentacji kraju i stolicy.

### Profil i avatar

- PIN określa warunek wejścia do profilu.
- Studio używa wyłącznie fikcyjnych profili i nie zapisuje wyników.

### Puchar

- Wspólny token; zmiana obejmuje wskazane użycia.

## Widoki

| ID | Widok | Tryb | Komponenty | Fonty / role |
| --- | --- | --- | --- | --- |
| `players` | Wybór gracza | spelling | profile, button, popup | body, ui, display |
| `players-empty` | Pierwszy gracz | spelling | profile, button | body, ui, display |
| `player-create` | Nowy gracz | spelling | profile, button | body, ui, display |
| `player-pin` | PIN gracza | spelling | profile, toggle, button | body, ui, display |
| `home` | Ekran startowy | spelling | layout, card, button, profile | body, ui, display |
| `settings` | Ustawienia aplikacji | spelling | card, button, popup | body, display |
| `spelling-settings` | Ortografia · ustawienia | spelling | layout, card, jelly, toggle, button | body, ui, display |
| `spelling-initial` | Ortografia · przed odpowiedzią | spelling | flashcard, answer, progress, slider, popup | body, display |
| `spelling-correct` | Ortografia · poprawna odpowiedź | spelling | flashcard, answer, progress, slider, popup | body, display |
| `spelling-wrong` | Ortografia · błędna odpowiedź | spelling | flashcard, answer, progress, slider, popup | body, display |
| `spelling-results` | Ortografia · koniec rundy | spelling | card, button, progress, popup, slider | body, display |
| `english-settings` | Angielski · ustawienia | english | layout, card, jelly, button | body, ui, display |
| `english-initial` | Angielski · przed odpowiedzią | english | flashcard, answer, progress, button, popup | body |
| `english-correct` | Angielski · poprawna odpowiedź | english | flashcard, answer, progress, button, popup | body |
| `english-wrong` | Angielski · błędna odpowiedź | english | flashcard, answer, progress, button, popup | body |
| `english-results` | Angielski · koniec rundy | english | card, button | body |
| `flags-settings` | Flagi · ustawienia | flags | layout, card, jelly, toggle, button | body, ui, display |
| `flags-initial` | Flagi · przed odpowiedzią | flags | flashcard, answer, progress, button, popup | body, flag |
| `flags-correct` | Flagi · poprawna odpowiedź | flags | flashcard, answer, progress, button, popup | body, flag |
| `flags-wrong` | Flagi · błędna odpowiedź | flags | flashcard, answer, progress, button, popup | body, flag |
| `flags-results` | Flagi · koniec rundy | flags | card, button | body, flag |
| `reading-settings` | Czytanie · ustawienia | reading | layout, card, jelly, button | body, ui, display |
| `reading-initial` | Czytanie · przed odpowiedzią | reading | flashcard, answer, progress, button, popup | body |
| `reading-correct` | Czytanie · poprawna odpowiedź | reading | flashcard, answer, progress, button, popup | body |
| `reading-wrong` | Czytanie · błędna odpowiedź | reading | flashcard, answer, progress, button, popup | body |
| `reading-results` | Czytanie · koniec rundy | reading | card, button | body |
| `math-settings` | Matematyka · ustawienia | math | layout, card, button | body, ui, display |
| `math-initial` | Matematyka · przed odpowiedzią | math | answer, flashcard, progress | body |
| `math-correct` | Matematyka · poprawna odpowiedź | math | answer, flashcard, progress | body |
| `math-wrong` | Matematyka · błędna odpowiedź | math | answer, flashcard, progress | body |
| `math-results` | Matematyka · koniec rundy | math | card, button | body |
| `spelling-rule` | Ortografia · zasada | spelling | popup, card, button | body, display |
| `spelling-hint` | Ortografia · podpowiedź | spelling | popup, flashcard | body, display |
| `spelling-pause` | Ortografia · pauza | spelling | popup, button | body, display |
| `progress` | Moje wyniki | spelling | card, trophy | body, display |
| `collection` | Moja kolekcja słów | spelling | card, popup, jelly | body, display |
| `trophies` | Moje puchary | spelling | card, trophy | body, display |
| `categories` | Kategorie do poćwiczenia | spelling | card | body, display |
| `rules` | Wyjaśnienia i zasady | spelling | card, popup, jelly | body, display |
| `sessions` | Historia rund | spelling | card | body, display |

## Relacje

| Z | Akcja | Warunek | Do |
| --- | --- | --- | --- |
| players | Wybierz profil | Profil z PIN-em / bez PIN-u | player-pin, home |
| home | Wybierz przygodę | Jeden z pięciu trybów | spelling-settings, english-settings, flags-settings, reading-settings, math-settings |
| *-settings | Zaczynamy! | Poprawne ustawienia; przynajmniej jedno zadanie | *-initial |
| *-initial | Wybierz odpowiedź | Odpowiedź zgodna / niezgodna z pytaniem | *-correct, *-wrong |
| *-correct | Dalej | Automatycznie; flagi po prezentacji | *-initial |
| *-wrong | Poznaj odpowiedź i przejdź dalej | Czas wstrzymany; ortografia: slider / klawiatura | *-initial |
| *-initial | Koniec rundy | Koniec czasu / liczby słów / wyjście | *-results |
| *-results | Sprawdź / powtórz | Zapis w aktywnym profilu | spelling-rule, progress, *-settings |
| progress | Kolekcja / zasady / puchary | Osiągnięcia wynikają z postępów gracza | collection, rules, trophies, categories, sessions |

## Fonty w kodzie

`audit.json → fontUsage` zawiera plik, selector i rolę każdej znalezionej deklaracji CSS. Panel pokazuje użycia według aktualnego przypisania roli. `registry.json → fontRoles` wiąże role z widokami. Po scaleniach te relacje nadal działają; nie są statyczną listą nazw fontów.

Rodziny są przechowywane w czterech plikach WOFF. Nie ma osobnych kopii „ResultBody” i „Flag Body”. Font fallback pozostaje systemowy na czas ładowania.

## Stany podglądu

Czas fixture nie płynie. Ortografia najpierw czeka na prezentację obrazu, potem wprowadza stan poprawny/błędny. Podpowiedź i pauza otwierają rzeczywiste dialogi. Wyniki i puchary używają danych przykładowych. Obsługa profili, PIN-u i zapis postępów są wyłączone w ścieżce fixture.
