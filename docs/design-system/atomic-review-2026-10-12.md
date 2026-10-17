# Atomic Design: trzy przebiegi kontroli — 12 października 2026

## Zakres i dowody

Kontrola dotyczy kodu gry, Design Studio i generowanego Test PWA. Przeczytano audyt użyteczności z 9 października i przeanalizowano osiem zrzutów Atomic Design oraz późniejszy zrzut Sound Labu. Produkcyjne przejście do gry i tekst zakończenia rundy porównano z kodem `main`.

Weryfikacja: audyt źródeł, build, 252 testy, kontrola kontraktów renderowania i Git/Vercel. Nie wykonano pomiaru pixel perfect ani odsłuchu na fizycznym iPhonie. Zdalny Preview wymaga logowania, którego użytkownik wcześniej nie dokończył; nie ponawiano odrzuconego dostępu. Lokalny Chromium/WebKit nie jest zainstalowany. Test silnika audio potwierdza zachowanie programu, nie dźwięk z głośnika telefonu.

## Trzy iteracje i redukcja zaległości

1. **Hierarchia i geometria.** Usunięto automatyczny „poster” Małej Nauki z listy przepisów. Przepisy nie powstają już z połączonej treści przypadkowych kontenerów. Ekran startowy ma sześć nazwanych slotów; kafel trybu jest grupą, tarcza i złota gwiazda samodzielnymi atomami. Usunięto dodatkowe tła/bleedy oraz rastrowy guzik ustawień. Próbki korzystają z rendererów gry i tej samej jednostki płótna 853 px.
2. **Stany i dziedziczenie.** Dodano pięć poziomów, konkretne szablony ze slotami i wspólne stany przepisów. Wybór trybu dotyczy grafiki/treści, wybór palety rzeczywistych kontrolek; pozostałe elementy mają „Domyślny”. Znane strojenie instancji przeniesiono do nazwanych przepisów: 56 lokalnych wpisów → 21 → 3. Usunięto pusty styl, nieistniejący spacer i stare korekty skali grafik misji. Zachowano trzy wyjątki: dwie etykiety starego podsumowania z niejednoznacznymi identyfikatorami oraz układ pauzy. Migracja jest idempotentna i zachowuje ich treść.
3. **Uproszczenie i integracja.** Misja ma pięć wariantów, wspólną ramkę i wystaje 33 jednostki ponad podkład. Usunięto stare wstawianie grafik oraz osobny fragment postaci angielskiej. Kolekcja korzysta z tych samych funkcji co gra. Przywrócono produkcyjny blur; dodatkowo znaleziono i poprawiono osobne zakończenie rundy matematyki. Usunięto guzik audio loadera i martwy panel podglądu wyjścia. Skorygowano dziedziczenie trybu każdego klocka, także pięciu kafli na jednym Home. Końcowe kontrole przechodzą: 252/252.

## Wspólny model

- **Atom:** samodzielny tekst, wektor, grafika, prosta kontrolka lub powierzchnia. Ścieżki SVG nie tworzą osobnych „grup”.
- **Grupa / molekuła:** kompozycja wykonująca jedno zadanie, np. kafel trybu z podkładem, dekoracją, ikoną i napisem.
- **Rodzina / organizm:** sekcja z grup, np. powitanie z postępami, pięć przygód lub formularz PIN.
- **Szablon:** uporządkowane, nazwane sloty ekranu. Wymagane sloty Home są sprawdzane przy składaniu.
- **Widok / strona:** szablon wypełniony danymi scenariusza. Używa produkcyjnego renderera w ramce Studio.

Inwentarz edytora może nadal wykrywać kontenery techniczne. Są oznaczone jako wykryte, nie trafiają automatycznie do biblioteki przepisów. To zapobiega tworzeniu kolejnych grup nazwanych całą treścią ekranu.

Domyślny wygląd jest wspólny. `recipeStates` zawiera wspólne różnice między rzeczywistymi stanami. Lokalny wyjątek pozostaje ostatnią warstwą. Tryb wybierany jest z konkretnego elementu, a nie tylko z całego ekranu. Skala obejmuje cały klocek, razem z jego dziećmi, i jest dostępna w obu edytorach. Biblioteka zachowuje trzy niezależne pozycje przewijania przy zmianie zaznaczenia.

## Ekran startowy

1. Jedno tło.
2. Małe logo z tego samego wycinka co w grze.
3. Przycisk ustawień: podkład i wektor w jednym atomie.
4. Rodzina powitania i postępów: podkład, czysta ilustracja, teksty; dwa podkłady postępów; grupa dzisiejszego wyniku, osobna kreska, grupa ostatniego wyniku i guzik Moje wyniki.
5. Grupa „Wybierz swoją przygodę” i liczba trybów.
6. Rodzina pięciu grup kafli. Gwiazdy ortografii i czytania korzystają z jednej ścieżki, z różnymi wielkościami. Góry mieszczą się w granicach, chmurka pozostaje wektorem.

Ilustracja powitania dochodzi do 1040 jednostek płótna, a podkłady postępów zaczynają się na 954: scena pozostaje pod nimi. Napisy są kodem, fontem UI Dosis, z interlinią i miejscem na dolne części liter.

## Przejścia i dźwięk

| Ścieżka | Domyślne zachowanie |
| --- | --- |
| Ustawienia przygody → gra | Produkcyjny blur wyjścia i wejścia |
| Gra → podsumowanie | Ten sam blur; czas przejścia nie zużywa czasu odpowiedzi |
| Zakończ przed czasem | „Zakończ i zobacz podsumowanie”; wynik zostaje zapisany |
| Ustawienia trybu → start | Kolory → Biały blob → Wejście |
| Start / koniec rundy → Moje wyniki | Kolory → Biały blob → Wejście |
| Moje wyniki → start | Kolory → Biały blob → Wejście |

Blob ma prędkość 0–2×, domyślnie 1×; 0× oznacza zmianę bez animacji. Skrót otwiera ustawienia wspólnej animacji w „Animowanych elementach”, obok „Ekran startowy”. Usunięto zbędne wybory docelowych ekranów w tym miejscu. Osobny dokument matematyki przygotowuje ekran docelowy przed odsłonięciem go blobem.

Audio pozostaje domyślnie aktywne; ustawienia gracza mogą je wyłączyć. Każdy rzeczywisty tap/klik uruchamia odblokowanie synchronicznie, także `touchend`. Kontekst jest przygotowany przed oczekiwaniem na `resume`; API Audio Session, gdy istnieje, dostaje typ `playback`. Ten test nie potwierdza wpływu przełącznika wyciszenia ani konkretnej wersji Safari — potrzebny jest odsłuch na telefonie.

Sound Lab: opis testu rozwija się w prawo od przycisku, w wierszu 48 px, do granicy kafla; przy odtwarzaniu guzik jest niebieski z białą treścią. Duża nutka znajduje się w prawym górnym rogu. Test zadania ma działanie zakończenia, usuwające ramkę i zatrzymujące audio.

## Ponowna kontrola wcześniejszych uwag

| Uwagi | Wynik kontroli |
| --- | --- |
| Przycięte litery, tarcza, gwiazda, nakładanie ilustracji | Nowy skład Home i wspólne wektory; zgodność kontraktu renderowania potwierdzona. Wygląd na telefonie do obejrzenia |
| Każda linia mapy, strzałki i wybór | Wspólny router obu map, osobne trafienia i kierunki. Testy tras omijających kafle oraz przewinięcia/focusu przechodzą |
| Start → gra, etykieta „gra”, ikony Logowania i Home | Zachowane w rejestrze i wspólnym modelu połączeń |
| Padding, zaokrąglenia i sekcja w sekcji | Jedna ramka akordeonu; nagłówek wypełnia ramkę, podgrupy mają prosty wygląd |
| Tooltipy Jelly na wierzchu | Wspólny portal tooltipów, zachowany po porządkowaniu |
| Domyślne scenariusze | Sekcja mapy ukryta przy jednym scenariuszu |
| Atom → biblioteka, strzałka → edytor | Zachowane wspólne działania |
| Przywracanie i opis zakresu | Stopki z separatorem i opisem wersji fabrycznej / zapisanej |
| Przełącznik Czas / Słowa | Próbka ma prawdziwe etykiety dwóch opcji |
| Nawigacja działów animacji Jelly | Zachowana |
| Stały link obejmuje Studio i kod gry | Ta sama gałąź `design/system-v1`, osobno synchronizowany Test PWA. Bez publikacji na `main` |

Nie usuwano zbiorczo historycznych plików grafik ani zapisanych wydań. Metadane archiwalne nie są dowodem użycia w aktualnym DOM. Usunięto wskazane martwe odwołania z bieżących rendererów i stylów; zasoby dynamicznie przypisywane słowom wymagają pełnego katalogu, więc proste wyszukiwanie tekstu nie wystarcza do uznania ich za nieużywane.
