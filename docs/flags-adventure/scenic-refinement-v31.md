# Scenic v31 — odstępy i wysokość dokumentu PWA

Zrzut z fizycznego iPhone’a ujawnił dwa błędy v30: papier zaczynał się pod przełącznikiem języka, a trzeci rząd ośmiu sąsiadów Francji nachodził na suwak. Zielony pas pod ilustracją nadal występował. Wcześniejszy test wysokości samego panelu nie potwierdzał poprawnego działania zainstalowanej aplikacji.

## Układ

Góra rozwiniętego pergaminu znajduje się co najmniej 6 px poniżej dolnej krawędzi przełącznika języka i tabliczki zadania. Dół pergaminu pozostaje 10 px nad odpowiedziami; złożona kartka ma tę samą dolną krawędź. Nazwa, stolica, flaga i wyblakła warstwa mapy zachowują poprzedni sposób rysowania.

Przed pokazaniem pytania układ rezerwuje miejsce na trzy paski sąsiadów o wysokości co najmniej 33 px, odstępy po 6 px oraz kompas wystający ponad suwak. Po odsłonięciu mapy odpowiedzi pozostają w swoim miejscu. Dwurzędowe listy zachowują większe marginesy pionowe. Wszystkie paski kończą się przy prawej krawędzi odpowiedzi. Dla najdłuższych list pierwszy pasek może wykorzystać szerokość odpowiedzi, ponieważ znajduje się nad twarzą chłopca; kolejne pozostają węższe. Kraje nadal występują w kolejności kierunków świata.

## Wysokość PWA

Elementy `html` i `body` mają teraz własną wysokość w jednostkach obszaru widoku (`100vh`, następnie `100dvh`), zamiast dziedziczyć ją przez `height:100%`. W trybie standalone/fullscreen cały dokument i scena korzystają z `100lvh`. Obszary bezpieczne ograniczają kontrolki, a scena i chłopiec dochodzą do krawędzi dokumentu.

To poprawka konkretnego błędu w źródłach, a nie potwierdzenie usunięcia pasa na fizycznym iPhonie. Podobna kombinacja `black-translucent`, `viewport-fit=cover` i procentowej wysokości korzenia została opisana i poprawiona w [OpenChamber #2287](https://github.com/openchamber/openchamber/issues/2287) oraz [PR #3593](https://github.com/openchamber/openchamber/pull/3593). Zastosowanie tego rozpoznania tutaj jest wnioskiem na podstawie źródeł i zrzutu użytkownika.

[WebKit #317153](https://www2.webkit.org/show_bug.cgi?id=317153) opisuje także odrębne problemy natywnego obszaru aplikacji w iOS 27; zgłoszenie zamknięto po beta 4. Nie zastępuje to pomiaru na konkretnym urządzeniu. Nie zalecamy ponownej instalacji ikony jako sprawdzonej naprawy.

## Weryfikacja

Testy lokalne używają Chromium i WebKit. Nowe scenariusze sprawdzają Francję (8 sąsiadów), Niemcy (9) i Rosję (11), języki PL/EN, ekran 390 × 700, 390 × 844 z odstępami bezpiecznymi 47/34 px oraz zmianę wysokości do 797 px. Sprawdzają wysokość korzenia, dokumentu i sceny, odstępy papieru, brak kolizji listy z suwakiem, dostępność ostatniego przycisku oraz stałą pozycję odpowiedzi. Dotychczasowy przegląd 45 państw dodatkowo kontroluje listy sąsiadów względem suwaka i twarzy chłopca.

Tryb standalone w testach oznacza jawne włączenie odpowiedniej gałęzi CSS. Nie emuluje instalacji PWA, systemowego paska iOS ani natywnego błędu wysokości. Na komputerze nie ma Xcode ani symulatora iOS; testu fizycznego iPhone’a nie wykonano. Zrzuty z przeglądarek stanowią dowód układu w wymienionych warunkach, nie dowód naprawy natywnej warstwy systemowej.

Wynik końcowy: 100/100 różnych scenariuszy w obu silnikach, bez błędów JavaScript, oraz 6/6 testów geometrii atlasu. Pierwszy pełny przebieg miał wynik 96/100: wykrył dopasowanie flagi przed przeliczeniem kartki oraz cztery rzędy sąsiadów Rosji przy większej czcionce. Poprawiono kolejność dopasowania flagi i szerokości mierzone po włączeniu zwartego wariantu listy. Ukierunkowane powtórzenie 8/8 scenariuszy obejmuje wszystkie cztery wcześniejsze błędy i pytania kontrolne. Raport końcowy zachowuje pierwotne błędy oraz pochodzenie powtórzeń; nie przedstawia pierwszego przebiegu jako bezbłędnego. Raport i obrazy zapisuje `tools/flags-scenic-qa-parallel.mjs`.
