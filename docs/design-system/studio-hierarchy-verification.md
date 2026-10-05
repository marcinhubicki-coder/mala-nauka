# Weryfikacja porządkowania Studio · 5 października 2026

## Trzy iteracje implementacji

1. Kategorie widoków, rzeczywista hierarchia, lokalny inspektor, safe area, oddzielny PIN i zegar gry oraz animacje po połączeniach.
2. Lab spoczynkowej bańki, kształty, nakładające się i wygasające impulsy, rozszerzanie suwaków i bezpieczne limity.
3. Izolowane rodziny globalne, prostszy projekt i historia, biblioteka szkiców, kolejność i widoczność warstw, lokalne kolory i podgląd Studio w telefonie.

Dodatkowa kontrola bazy po równoległym czyszczeniu grafik wykryła cztery słowa bez ilustracji. Są blokowane przy wczytywaniu słów do gry; cała baza pozostaje dostępna do uzupełnienia. Testy sprawdzają dostępność ilustracji osobno dla słów gotowych do gry.

## Faktycznie wykonane scenariusze w przeglądarce

- Start: wybór strzałki, zamiana na serce, lokalny kolor i skopiowanie rzeczywistego elementu do buildera.
- PIN: otwarcie osobnego widoku, wybór przełącznika i przejście do Bez PIN-u. Klawiatura przestaje być oferowana w bieżącym widoku.
- Bańka: trójkąt, skórka Ocean, wpisanie tempa 9 i rozszerzenie zakresu suwaka do 11; nakładanie odpowiedzi i combo.

Scenariusze wykonano na pierwszej i drugiej zapisanej iteracji. Późniejsze poprawki dostępne są w trzeciej iteracji. Ich pełna kontrola wizualna desktopu i telefonu pozostaje do wykonania: chroniony preview wymaga ponownego uwierzytelnienia. Automatyczna kontrola uprawnień odmówiła utworzenia tymczasowego linku omijającego logowanie bez określonego odbiorcy i zakresu. Lokalny podgląd był niedostępny z przeglądarki testowej; następnie środowisko wykonawcze utraciło połączenie.

Nie traktujemy trzech iteracji implementacji jako trzech ukończonych przelotów wizualnych. Poprzednie obrazy w dokumentacji dotyczą wcześniejszej wersji.

## Sprawdzenia automatyczne

W lokalnym środowisku uzyskano przejście 108 testów po poprawce kwalifikowania słów z ilustracją. Po ostatnich zmianach rodzin wykonano dziewięć testów hierarchii. Sześć adapterów konsumentów przeszło build z lokalnego wspólnego źródła; każdy raportował zero kopii assetów.

Po utracie połączenia końcowe zmiany odtworzono względem zapisanego commitu. Sprawdzono składnię zmienianych modułów oraz działanie priorytetu lokalnego, dynamicznej rodziny i filtracji rzeczywistej bazy: 455 rekordów, 451 gotowych, 4 oczekujące. Końcowy build Vercel wykonuje pełny zestaw testów; jego wynik należy odczytać z wdrożenia.

Nie wykonano pomiaru na fizycznym iPhone 13 Pro, Safari ani sprzętowego zużycia energii. Nie testowano zapisu przez osobisty token użytkownika. Produkcyjny main nie jest celem tego wydania.
