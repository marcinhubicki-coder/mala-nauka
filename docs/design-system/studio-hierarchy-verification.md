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

Po utracie połączenia końcowe zmiany odtworzono względem zapisanego commitu. Sprawdzono składnię zmienianych modułów oraz działanie priorytetu lokalnego, dynamicznej rodziny i filtracji rzeczywistej bazy: 455 rekordów, 451 gotowych, 4 oczekujące. Końcowy build Vercel dla commitu **d99f0d180fadc6b8fc1d4b5ab241ffd6f839b286** zakończył się wynikiem **109 testów, 109 zaliczonych, 0 błędów**. Deployment **dpl_CfpJo6kR8BwUe1GMFsT7uDeMEx4q** ma status READY. Ten sam proces wdrażania sprawdza testy przy następnych zapisach na branch.

Nie wykonano pomiaru na fizycznym iPhone 13 Pro, Safari ani sprzętowego zużycia energii. Nie testowano zapisu przez osobisty token użytkownika. Produkcyjny main nie jest celem tego wydania.

## Wdrożone adaptery konsumentów

Każdy poniższy deployment zakończył build ze wspólnym źródłem `design/system-v1` i raportem `sourceAssetCopies: 0`. Zmianą na consumerze jest wyłącznie adapter buildu; jego własny renderer i inne równoległe zmiany zostały zachowane.

| Branch | Commit adaptera | Status | Hash buildu |
| --- | --- | --- | --- |
| czytanie-v1 | 51ffe689ffa5e11df61e7c97df10b4890b0e298b | READY | a50eb4fd45ba |
| design/english-v0.1 | 4be200751323349f7f2b5f82810ba473d67a4d5e | READY | f542d00efdc0 |
| design/flags-v0.1 | 46de63c6c46299d6e554ceb819d6196d943909d3 | READY | 161ab5f1d325 |
| design/profile-and-learning-v5 | 9bd4f89ed318987bee5905e1ff4715611ebc524e | READY | 2f019f498fd2 |
| design/spelling-v0.3-preview | 03a4874b94d34d5d6a68a20cbfa33a4ecde835ac | READY | f4d42694cb2e |
| matematyka-v1 | d6ea7f88ab7d513572618ac986f8363e875f6d33 | READY | 6b937c72941c |

Przed zakończeniem main nadal wskazuje `f16b7770c6473f692284ecd44f3a282bfa5d3829`. Nie wykonano merge do produkcji.
