# System nauki i progresji — Mała Nauka

> **Status:** dokument decyzyjny / source of truth dla mechaniki nauki, progresji, informacji zwrotnej i danych o postępie.
>
> **Cel:** dać Codexowi i kolejnym implementacjom jasny punkt odniesienia, żeby UI i logika nie dryfowały w stronę klasycznego score/XP kosztem realnej nauki.
>
> Ten dokument opisuje ustalenia produktowe i architektoniczne przyjęte przed etapem szczegółowych mockupów.

---

## 1. Główna filozofia

**Mała Nauka nie ma nagradzać czasu spędzonego w aplikacji ani liczby kliknięć. Ma pomagać dziecku realnie zapamiętywać materiał.**

Najważniejszą jednostką postępu nie jest:
- liczba rozegranych rund,
- rekord,
- XP,
- czas odpowiedzi,
- streak,
- miejsce w rankingu.

Najważniejszą jednostką jest:

> **element wiedzy lub umiejętność, którą dziecko potrafi poprawnie przywołać z pamięci po czasie.**

Przykłady:
- ortografia: słowo / zasada ortograficzna,
- angielski: słowo lub zwrot,
- flagi: państwo / flaga / stolica,
- matematyka: konkretna umiejętność,
- czytanie: kompetencja związana z czytaniem i rozumieniem.

Gamifikacja jest **warstwą informacji zwrotnej nad procesem uczenia**, a nie osobną grą, którą da się „wygrać”.

---

## 2. Co aplikacja ma wzmacniać

Kolejność priorytetów:

1. **Aktywne przypominanie sobie odpowiedzi** — użytkownik próbuje wydobyć odpowiedź z pamięci.
2. **Powtórki rozłożone w czasie** — sukces nie jest przyznawany wyłącznie za serię poprawnych odpowiedzi w jednej sesji.
3. **Informacja zwrotna** — po pomyłce aplikacja pokazuje poprawną formę i pomaga zrozumieć błąd.
4. **Świadomość własnego postępu** — dziecko wie, co już umie, czego się uczy i do czego warto wrócić.
5. **Autonomia i poczucie kompetencji** — dziecko ma odczuwać „uczę się”, a nie „jestem oceniane”.

### Ważny mind shift

Pomyłka nie ma oznaczać:

> „nie mam 100%, zawaliłem”.

Tylko:

> „o, tutaj jeszcze mi się myli; widzę poprawną odpowiedź i wiem, do czego wrócić”.

Błąd jest **sygnałem do nauki**, nie karą.

---

## 3. Trzy warstwy informacji o postępie

Nie należy wrzucać wszystkiego do jednego score.

### A. Runda
Opisuje tylko to, co wydarzyło się teraz:
- liczba odpowiedzi,
- poprawne / wymagające powrotu,
- skuteczność sesji,
- ewentualna seria poprawnych odpowiedzi.

To **nie jest jeszcze mastery**.

### B. Nauka
Najważniejsza warstwa:
- które elementy są ćwiczone,
- które są utrwalane,
- które zostały opanowane,
- które wymagają odświeżenia.

### C. Regularność
Może istnieć pomocniczo, ale nie powinna dominować:
- liczba dni nauki w tygodniu,
- powroty do materiału,
- rytm ćwiczeń.

Regularność nie powinna mieć mechaniki „utracisz wszystko, jeśli dziś nie wejdziesz”.

---

## 4. Model progresji widoczny dla dziecka

Interfejs ma być prostszy niż logika pod spodem.

Preferowany język:

**Ćwiczę → Utrwalam → Umiem**

Dodatkowo element wcześniej opanowany może otrzymać stan:

**Warto odświeżyć / do powtórki**

Nie należy odbierać dziecku zdobytego osiągnięcia po jednej późniejszej pomyłce.

### Interpretacja

- **Ćwiczę** — element jest poznany, ale historia odpowiedzi jest jeszcze zbyt krótka lub niestabilna.
- **Utrwalam** — pojawiają się poprawne przypomnienia rozłożone w czasie.
- **Umiem** — aplikacja ma wystarczające dowody, że element został zapamiętany.
- **Do powtórki / odświeżenia** — wcześniej znany element zaczął sprawiać trudność; wraca częściej do ćwiczeń.

---

## 5. Mastery: logika ma być konfigurowalna

Dokładne progi **nie są częścią kontraktu UI** i powinny być łatwe do zmiany.

Przykładowa robocza heurystyka:
- poprawne przypomnienie w co najmniej 3–4 oddzielnych ekspozycjach,
- odpowiedzi rozłożone na co najmniej kilka dni,
- przynajmniej jedna poprawna odpowiedź po dłuższej przerwie,
- brak dominującego wzorca ostatnich błędów.

Przykład roboczy dla słowa:
- dzień 1: poprawnie,
- dzień 2–3: poprawnie,
- dzień 7+: poprawnie,
- wtedy kandydat do „Umiem”.

**To jest parametr, nie dogmat.** Silnik progresji powinien pozwalać zmienić:
- liczbę wymaganych poprawnych odpowiedzi,
- minimalny odstęp,
- okno czasowe,
- wagę ostatniej odpowiedzi,
- wpływ błędu,
- częstotliwość powtórek.

UI nie może zależeć od konkretnych wartości tych progów.

---

## 6. Kolekcja jako główny mechanizm gamifikacji

Podstawowy kierunek:

> **kolekcjonujesz rzeczy, których naprawdę się nauczyłeś.**

To ma zastąpić klasyczny XP.

Dla ortografii i języków naturalną formą jest galeria elementów:
- miniatura ilustracji,
- poprawny zapis,
- status,
- możliwość wejścia w szczegóły.

Przykład:

**królik**  
status: **Umiem**

Nieopanowane elementy mogą być widoczne jako:
- ćwiczone,
- przygaszone,
- jeszcze nieodkryte,

ale system nie powinien karać dziecka za ich brak.

### Dlaczego kolekcja jest ważna

Liczba typu:

> **38 / 150 słów opanowanych**

ma realne znaczenie edukacyjne.

Liczba typu:

> **12 450 XP**

nie mówi, czego dziecko się nauczyło.

---

## 7. Osiągnięcia

Osiągnięcia mają być **rzadkie i znaczące**.

Nie przyznawać ich za:
- samo uruchomienie aplikacji,
- farmienie rund,
- liczbę kliknięć,
- długi czas spędzony w aplikacji.

Dobre osiągnięcia:
- pierwsze 10 realnie opanowanych elementów,
- opanowanie całej kategorii,
- powrót do trudnych elementów i późniejsze ich opanowanie,
- utrzymanie wiedzy po dłuższym czasie,
- ukończenie sensownego etapu kompetencji.

Osiągnięcie ma być **dowodem wiedzy**, nie walutą.

Preferowane są wizualne trofea / obiekty kolekcjonerskie zamiast ściany generycznych badge’y.

---

## 8. Combo, multiplier i tempo

### Combo
Może istnieć jako chwilowe, lekkie wyróżnienie:
- 3 z rzędu,
- 5 z rzędu,
- bezbłędna runda.

Nie powinno:
- mnożyć głównej wartości edukacyjnej,
- powodować dużej straty po jednym błędzie,
- zachęcać do wybierania łatwiejszych zadań.

### Multiplier
Nie powinien być główną mechaniką.

### Czas
**Nie premiujemy szybkości odpowiedzi.**

Szybkość może być w przyszłości sygnałem diagnostycznym, ale nie źródłem punktów.

Komunikat ma brzmieć:

> „spróbuj sobie przypomnieć”

a nie:

> „odpowiedz jak najszybciej”.

---

## 9. Streaki i regularność

Streak może wspierać nawyk, ale nie może być mechaniką kary.

Preferowane:
- „uczyłeś się 4 z ostatnich 7 dni”,
- łagodny rytm tygodniowy,
- brak utraty całego dorobku przez jeden dzień przerwy.

Unikać:
- „27 dni — jeśli dziś nie wejdziesz, tracisz serię”,
- presji i FOMO.

---

## 10. Rankingi

Domyślnie **brak rankingów między dziećmi**.

Powód:
- przenoszą motywację z nauki na porównanie społeczne,
- mogą zniechęcać wolniejszych użytkowników,
- skłaniają do optymalizacji pod wynik zamiast wiedzy.

---

## 11. Ekran końca rundy — zasady produktowe

Każde zakończenie rundy, również wcześniejsze, powinno dawać feedback.

Ekran nie powinien zaczynać od:
- rekordu,
- procentu jako oceny,
- „przegrałeś” / „błąd”.

Powinien odpowiadać na:
- co dziś poszło dobrze,
- co się utrwaliło,
- co warto jeszcze powtórzyć,
- czy coś nowego zostało opanowane.

### Priorytet informacji

1. jedna główna celebracja,
2. konkret sesji,
3. elementy do powtórki z poprawną odpowiedzią,
4. ogólny progres,
5. CTA do kolejnej rundy / kolekcji.

### Błędy
W sekcji „do powtórki” zawsze pokazywać:
- poprawną formę,
- najlepiej powiązaną ilustrację,
- krótki, nieoceniający komunikat.

Przykładowy ton:
- „Tu warto jeszcze wrócić.”
- „Zapamiętaj poprawną formę.”
- „Super, że już wiemy, co jeszcze się miesza.”

Nie:
- „3 błędy” jako główna etykieta,
- czerwone piętnowanie błędnej odpowiedzi bez kontekstu.

---

## 12. Kolory i semantyka feedbacku

Kolor ma wspierać znaczenie:

- **zielony / zielonkawy** — poprawne, utrwalone, opanowane,
- **ciepły żółty / bursztynowy** — w trakcie ćwiczenia,
- **róż / czerwień** — wyłącznie jako delikatny sygnał „wróć do tego”, nie kara.

W sekcjach pokazujących poprawioną odpowiedź **poprawna forma powinna być pozytywna wizualnie**, nawet jeśli pojawiła się po błędzie.

---

## 13. Dashboard rodzica

Panel rodzica jest osobną, spokojną warstwą.

Nie ma być narzędziem kontroli dziecka.

### Domyślny rytm
- zbiorcze podsumowanie tygodniowe,
- ewentualnie ważne milestone’y,
- brak notyfikacji po każdej rundzie.

### Główne informacje
- czego dziecko się nauczyło,
- co obecnie utrwala,
- do czego warto wrócić,
- jakie elementy poprawiły się względem wcześniejszych prób,
- co można wykorzystać jako punkt zaczepienia do rozmowy.

Przykład:

> W tym tygodniu opanowano 8 nowych słów.  
> Najlepiej utrwaliły się: królik, chmura, żółw.  
> Do dalszych powtórek wrócą: wróbel, rzeka.

### Wartość dla rodzica
Rodzic ma móc zapytać:
- „Pamiętasz ten obrazek?”
- „Jakie słowo było z nim związane?”
- „Co było trudne?”

Aplikacja ma wspierać rozmowę i przypominanie także poza ekranem.

### Statystyki głębokie
Mogą być dostępne poziom niżej:
- historia powtórek,
- daty,
- typy błędów,
- stabilność pamięci,
- kategorie.

Nie powinny dominować głównego dashboardu.

---

## 14. Język dziecka i język rodzica

To samo zdarzenie może być opisane inaczej.

### Dziecko
> „Nowe słowo w kolekcji!”

### Rodzic
> „Słowo uznane za opanowane po kilku poprawnych powtórkach rozłożonych w czasie.”

UI dziecka:
- prosty,
- emocjonalny,
- pozytywny.

UI rodzica:
- konkretny,
- syntetyczny,
- bardziej analityczny.

---

## 15. Wspólny model danych

Obecny model typu tylko:

```
correct
wrong
duration
mode
date
```

jest niewystarczający do prawdziwego systemu mastery.

Potrzebujemy zapisu **na poziomie pojedynczej próby / elementu**.

### Minimalny event próby

```js
{
  id: "attempt-id",
  at: "ISO-8601",
  mode: "spelling",
  itemId: "word:burza",
  skillId: "spelling:rz-z",
  correct: false,
  answer: "ż",
  expected: "rz",
  hintUsed: false,
  explanationUsed: false,
  sessionId: "session-id"
}
```

Pola specyficzne dla modułu mogą rozszerzać event, ale wspólna warstwa nie powinna wymagać znajomości szczegółów każdego trybu.

---

## 16. Model agregatu elementu

Silnik progresji powinien wyliczać agregat niezależnie od UI:

```js
{
  itemId: "word:burza",
  state: "learning", // learning | consolidating | mastered | review
  firstSeenAt: "...",
  lastSeenAt: "...",
  lastCorrectAt: "...",
  attempts: 7,
  correct: 5,
  incorrect: 2,
  correctOnDistinctDays: 3,
  recentTrend: "improving",
  nextReviewAt: "..."
}
```

Nazwy techniczne mogą się zmienić. Istotny jest podział odpowiedzialności:

**raw attempts → mastery engine → UI state**

---

## 17. Rozdzielenie warstw

### A. Gameplay
Generuje pytania i zapisuje próby.

### B. Progress storage
Przechowuje historię prób i sesji.

### C. Mastery engine
Interpretuje dane:
- learning,
- consolidating,
- mastered,
- review.

### D. Presentation
Pokazuje dziecku:
- Ćwiczę,
- Utrwalam,
- Umiem,
- Powtórka.

### E. Parent insights
Tworzy:
- podsumowania,
- trendy,
- sugestie do rozmowy,
- statystyki szczegółowe.

Dzięki temu zmiana algorytmu mastery nie wymaga przebudowy ekranów.

---

## 18. Generalizacja na moduły

Wspólna architektura nie oznacza identycznych dashboardów.

### Ortografia
Jednostka:
- słowo,
- reguła / kategoria ortograficzna.

Naturalne UI:
- kolekcja słów z ilustracjami,
- grupowanie po zasadach,
- łatwy dostęp do wyjaśnień.

### Angielski
Jednostka:
- słowo / zwrot.

Możliwe niezależne kompetencje:
- rozumiem znaczenie,
- rozpoznaję,
- umiem napisać.

Kolekcja ilustracji ma sens podobnie jak w ortografii.

### Matematyka
Jednostka powinna częściej oznaczać **umiejętność**, nie pojedyncze działanie.

Przykładowa progresja:
- dodawanie,
- odejmowanie,
- mnożenie,
- dzielenie,
- później dalsze działy.

Naturalne jest drzewo / ścieżka kompetencji.

### Flagi
Jednostka:
- państwo.

Możliwe kompetencje:
- flaga → państwo,
- państwo → flaga,
- stolica → państwo.

### Czytanie
Jednostka:
- kompetencja lub typ zadania.

Przykładowe osie:
- słowo,
- fraza,
- zdanie,
- rozumienie,
- pamięć.

---

## 19. Zasada dotycząca „opanowania”

„Umiem” musi coś znaczyć.

Nie wolno oznaczać elementu jako opanowany tylko dlatego, że:
- był raz poprawny,
- dziecko odpowiedziało poprawnie kilka razy pod rząd w tej samej rundzie,
- widziało go przed chwilą.

Opanowanie wymaga **dowodu retencji w czasie**.

To jedna z najważniejszych zasad całego produktu.

---

## 20. Co jest parametrem, a co zasadą

### Zasady stałe
- postęp > score,
- retencja > szybkość,
- poprawna forma > piętnowanie błędu,
- kolekcja wiedzy > XP,
- autonomia > presja,
- brak rankingów domyślnie,
- brak karzących streaków,
- mastery oparte na czasie,
- szczegółowy zapis prób.

### Parametry konfigurowalne
- ile poprawnych odpowiedzi potrzeba,
- ile różnych dni,
- jak długi odstęp,
- jak działa decay,
- kiedy element wraca do powtórki,
- jak często jest powtarzany,
- kiedy przyznajemy konkretne trofeum,
- dokładna treść mikrocopy.

---

## 21. Guardrails dla implementacji

Przy każdej nowej funkcji należy zadać pytania:

1. Czy pomaga dziecku coś zapamiętać?
2. Czy pokazuje realną wiedzę, czy tylko aktywność?
3. Czy błąd daje informację do nauki?
4. Czy mechanika nie zachęca do farmienia?
5. Czy użytkownik nie jest karany za przerwę?
6. Czy wskaźnik można wyjaśnić rodzicowi prostym zdaniem?
7. Czy „Umiem” naprawdę oznacza wiedzę utrzymaną w czasie?
8. Czy dane zapisujemy na poziomie wystarczającym do późniejszej analizy?
9. Czy UI pozostaje proste, mimo że logika pod spodem może być bardziej złożona?

Jeśli odpowiedź na kilka z tych pytań brzmi „nie”, funkcja prawdopodobnie wymaga przeprojektowania.

---

## 22. Kierunek rozwoju

Kolejność implementacji:

1. ujednolicić zapis prób na poziomie elementu,
2. zbudować niezależny mastery engine,
3. podłączyć Ortografię jako pierwszy moduł referencyjny,
4. zbudować kolekcję i dashboard postępu,
5. dodać szczegóły / wyjaśnienia,
6. dopiero potem przenosić model na kolejne moduły,
7. panel rodzica budować na tych samych danych, a nie jako osobny system analityki.

Ortografia powinna być **referencyjną implementacją kontraktu danych i progresji**, ale pozostałe moduły mogą mieć zupełnie inne wizualizacje postępu.

---

## 23. TL;DR dla Codexa

Jeżeli implementujesz progresję w Małej Nauce:

- **nie buduj systemu wokół punktów i rekordów,**
- zapisuj każdą próbę na poziomie konkretnego elementu,
- trzymaj algorytm mastery poza UI,
- „Umiem” przyznawaj dopiero po retencji potwierdzonej w czasie,
- po błędzie pokazuj poprawną odpowiedź i planuj powtórkę,
- nie odbieraj zdobytego sukcesu po pojedynczym późniejszym błędzie,
- kolekcja ma reprezentować wiedzę,
- osiągnięcia mają reprezentować kompetencje,
- czas odpowiedzi nie daje bonusu,
- unikaj rankingów i karzących streaków,
- dashboard rodzica ma tłumaczyć proces nauki, a nie oceniać dziecko.

**Najważniejszy test:** po użyciu aplikacji dziecko powinno myśleć „już umiem więcej”, a nie „zdobyłem więcej punktów”.
