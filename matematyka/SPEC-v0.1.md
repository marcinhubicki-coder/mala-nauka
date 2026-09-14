# Mała Nauka — Matematyka v0.1

## Cel paczki

Pierwsza mała paczka do review. Ma ustalić fundament UX matematyki, rozdzielenie kategorii oraz zachowanie po dobrej i błędnej odpowiedzi. Nie próbujemy jeszcze implementować całego programu nauki.

## Zakres v0.1

### Kategorie

Ekran Matematyki pokazuje cztery wyraźnie rozdzielone kategorie:

- Dodawanie `+`
- Odejmowanie `−`
- Mnożenie `×`
- Dzielenie `÷`

W v0.1 interaktywny jest tryb Mnożenie. Pozostałe kategorie są już obecne w strukturze, ale nie rozwijamy jeszcze ich logiki. Dzięki temu najpierw oceniamy nawigację, proporcje i stany jednego kompletnego typu zadania.

## Mnożenie — podstawowy flow

1. Użytkownik wybiera Mnożenie.
2. Pojawia się jedno duże działanie, np. `5 × 7`.
3. Poniżej dostępne są odpowiedzi.
4. Po wyborze odpowiedzi aplikacja przechodzi do jednego z dwóch stanów: poprawna lub błędna.

### Poprawna odpowiedź

- natychmiastowy, spokojny feedback wizualny,
- krótki czas na zauważenie poprawnego wyniku,
- automatyczne przejście do kolejnego pytania,
- **brak przycisku „Dalej”**,
- przycisk „Dalej” nie jest ukrywany CSS-em ani renderowany chwilowo — nie istnieje w tym stanie DOM,
- przestrzeń pozostaje czysta i stabilna podczas przejścia.

### Błędna odpowiedź

Po błędnej odpowiedzi odpowiedzi znikają, a ich miejsce zajmuje wizualne wyjaśnienie. Użytkownik może eksplorować kolejne etapy powtarzanego dodawania i wrócić do próby.

## Wizualne wyjaśnienie mnożenia

Dla działania `5 × 7` interpretujemy zapis konsekwentnie jako **5 rzędów po 7 elementów**.

Wizualizacja zawiera:

- numerowane rzędy i kolumny,
- małe prostokąty mieszczące się możliwie na jednym ekranie,
- lekki highlight pierwszego rzędu i pierwszej kolumny,
- po prawej kolejne działania, np. `7`, `7 + 7 = 14`, `14 + 7 = 21`,
- tap/hover na działaniu podświetla wszystkie rzędy biorące udział w danym wyniku,
- przycisk `Spróbuj ponownie` wraca do odpowiedzi.

Celem nie jest ręczne liczenie dużych kafli, tylko szybkie wizualne zrozumienie, że mnożenie jest powtarzanym dodawaniem.

## Zakres liczb v0.1

Do review używamy czynników od 2 do 10. Układ ma zachować czytelność również dla siatki 10 × 10.

## Poza zakresem v0.1

- pełna logika dodawania,
- pełna logika odejmowania,
- pełna logika dzielenia,
- poziomy trudności,
- statystyki i adaptacyjny dobór zadań,
- zadania tekstowe,
- rozbudowane ustawienia.
