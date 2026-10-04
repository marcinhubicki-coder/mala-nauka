# Pule słów, efekty i naliczanie wyników

Studio: sekcje **Baza słów i grafik → Pule i kontrola**, **Efekty i bańka**, **Naliczanie wyników**. Wszystkie zmiany korzystają z dotychczasowego szkicu, Cofnij/Ponów, przeglądu konfliktów i atomowego zapisu na `design/system-v1`.

## Jedno słowo, wiele pul

Audyt obecnej bazy: **455 rekordów, 455 unikalnych słów, 0 duplikatów, 162 słowa z kilkoma kategoriami, 0 brakujących przypisań grafiki**. Przynależność do kategorii nie tworzy nowego rekordu ani kopii pliku.

| Pula | Dawne przypisania główne | Automatyczna pula | Podstawowe | Trudne |
|---|---:|---:|---:|---:|
| u/ó | 184 | 235 | 146 | 89 |
| rz/ż | 130 | 152 | 78 | 74 |
| ch/h | 91 | 102 | 48 | 54 |
| ć/ci | 10 | 53 | 29 | 24 |
| ś/si | 10 | 20 | 9 | 11 |
| ź/zi | 10 | 15 | 10 | 5 |
| ń/ni | 10 | 41 | 9 | 32 |
| dź/dzi | 10 | 17 | 6 | 11 |

Wiersze nakładają się, więc ich suma nie jest liczbą unikalnych słów. Filtr poziomu i wyszukiwarka pokazują rzeczywistą pulę. Kliknij kategorię, potem słowo, żeby zobaczyć miniaturę, powiązania i otworzyć wariant pytania w prawdziwym ekranie gry.

| Słowo | Wybrana pula | Pytanie | Odpowiedź |
|---|---|---|---|
| brzuch | rz/ż | b_uch | rz |
| brzuch | u/ó | brz_ch | u |
| brzuch | ch/h | brzu_ | ch |

Wszystkie warianty korzystają z **tego samego przypisania `assets.words.brzuch`**. Pytanie ma dokładnie jedną lukę. Wybranie trzech kategorii daje jedną pozycję „brzuch” w talii, nie trzy. Jeżeli słowo ma kilka wystąpień danej grupy, zachowujemy zatwierdzoną główną lukę; dla dodatkowej grupy wybieramy jedną pozycję.

W rundzie nie powtarzamy słowa — także po błędzie, użyciu podpowiedzi lub zmianie kategorii pytania. Tasowanie bez zwracania działa w rundach na czas, na liczbę słów i dyktandach. Po wyczerpaniu puli gra kończy rundę. Limit liczby pytań jest ograniczony do dostępnych unikalnych słów; etykieta wyniku zachowuje rzeczywisty limit. Kolejna runda może ponownie ćwiczyć te słowa.

Treść zatwierdzonej głównej reguły pozostaje przy głównym pytaniu. Dodatkowe pytania korzystają z ogólnej, wspólnej zasady swojej grupy — nie przypisujemy automatycznie reguły o wymianie liter, która nie została sprawdzona dla tego słowa. Osiem takich zasad jest edytowanych raz i propagowanych do powiązanych słów. Analiza grup rozpoznaje zapis liter, nie zastępuje weryfikacji językowej konkretnej reguły.

Przyszłe importy scalają zgodne rekordy według tożsamości słowa. Sprzeczne poziomy lub pisownia blokują import zamiast rozstrzygać konflikt przypadkowo. `npm run audit` odtwarza raport `design-system/word-audit.json`; testy sprawdzają wszystkie wygenerowane luki i rzeczywiste pule gry.

## Poziomy i przyszłe pomyłki

Najpierw podstawowe słowa z u/ó, rz/ż i ch/h, następnie istniejące grupy zmiękczeń i trudniejsze słowa. Zachowujemy osiem obecnych kategorii i dwa obecne poziomy. Przypisanie słowa do kilku kategorii nie podnosi automatycznie jego trudności.

„Przód” już jest w bazie, teraz także w u/ó. „Portfel” jest poprawnym zapisem; „portwel” i „potfel” pokazują dwa różne rodzaje pomyłek. To dobry materiał na przyszły tryb **pełnego zapisu**, z wyborem między dwiema formami słowa. Obecna zmiana nie dodaje tych nowych pytań, kategorii f/w ani wielu luk w jednym słowie. Dzięki temu nie rozbudowujemy nawigacji o kategorię dla każdej pomyłki.

## Budowanie efektu

1. Otwórz **Efekty i bańka** i wybierz sytuację: poprawna, niepoprawna lub combo.
2. Przy poprawnej odpowiedzi wybierz jeden z dziesięciu zestawów: Iskry, Gwiazdy, Konfetti, Aureola, Komety, Płatki, Orbity, Fontanna, Diamenty lub Kręgi. Możesz zmienić nazwę, kształt, kolor, liczbę drobinek, czas, zasięg i powiększenie bańki.
3. Wybierz **Odtwórz**. **Pętla** dodaje ustawianą przerwę. **Przejdź przez 10 efektów** jest skończonym przeglądem biblioteki.
4. Rozwiń **Combo i budżet**: ustaw próg serii, wzmocnienie i limit drobinek. Losowanie w grze uwzględnia aktywne zestawy i unika tego samego efektu bezpośrednio po sobie. Bez losowania używa pierwszego aktywnego zestawu.
5. Rozwiń **Bańka i zmiana obrazka**: kontrolujesz tempo, falowanie, orbitę, czas przejścia, rozmycie i drobinki przejścia. Zmiana obrazka przełącza rzeczywiste przypisania słów „brzuch” i „przód”. Ustawienia bańki obowiązują także w ekranach zasad i podpowiedzi.
6. Przy błędzie edytujesz jego własny czas, drgnięcie i kolor. Poprawny zapis i suwak dalszej gry nadal działają.
7. Cofnij lub Przywróć wraca do zapisanych wartości. Zmiany wymagające publikacji sprawdzisz w **Wersje i szkice**, potem zapiszesz na GitHub.

Podgląd używa tej samej implementacji bańki i efektów odpowiedzi co gra. To uproszczona scena do pracy nad ruchem; pełny ekran gry pozostaje dostępny w Komponentach. Przebieg na osi jest poglądowy, a czas ustala wybrany zestaw. Zestawy mają stabilną tożsamość mimo zmiany nazw.

Na telefonie: **Wybór → Podgląd → Ustawienia**. Wybór zestawu przenosi do podglądu. Przy liczbach masz przyciski +/− i znacznik zapisanej wartości. Opuszczenie podglądu zatrzymuje pętlę. Przejście między panelem i podglądem zachowuje scenę.

## Co rzeczywiście mierzymy

| Wskaźnik | Znaczenie | Ograniczenie |
|---|---|---|
| FPS, 95. percentyl klatki i wolne klatki | Zmierzony rytm `requestAnimationFrame` podczas efektu | Dotyczy aktualnej przeglądarki; zdalny Chrome nie jest fizycznym iPhonem |
| Przygotowanie CPU / JS | Zmierzony czas utworzenia animacji i drobinek | Nie jest procentem użycia całego CPU ani czasem pracy kompozytora |
| Pamięć JS | `usedJSHeapSize`, jeśli udostępnia go przeglądarka | Cała karta; brak osobnego pomiaru VRAM i pamięci samego efektu |
| Budżet drobinek / szacunek GPU | Liczba animowanych elementów po ograniczeniu budżetem | Nie mierzy czasu GPU ani mocy urządzenia |
| Energia i moc w watach | Brak dostępnego wiarygodnego pomiaru | Nie pokazujemy wymyślonych wartości |

Krótkie próbki pokazują liczbę zebranych klatek. Pętla zbiera do 300 odstępów między klatkami, z pominięciem przerw między efektami. Pomiary nie są zapisywane ani wysyłane do usług zewnętrznych. Przy 95. percentylu ponad 20 ms sugerujemy kontrolę, ponad 33 ms oznaczamy próbkę jako ciężką. To obserwacja, nie certyfikat płynności urządzenia.

Efekt jest skończony, zbudowany z transformacji i przezroczystości. Twardy maksymalny limit to 48 drobinek; domyślny 36. Combo i przejścia obrazka respektują budżet. Nowa odpowiedź, pauza, ukrycie karty i wyjście z edytora usuwają poprzedni efekt. Ustawienie ograniczonego ruchu respektujemy automatycznie. Fizyka bańki zachowuje dotychczasowy limit 24 aktualizacji kształtu na sekundę. Rozmycie występuje tylko w istniejącym przejściu obrazu i można ustawić je na 0.

## Naliczanie wyniku

**Naliczanie wyników** ma cztery gotowe scenariusze: bez błędu, z potknięciami, z podpowiedziami i pustą rundę. Można zmienić liczbę odpowiedzi, kolejność i rodzaj rundy. Wynik porównujemy z ostatnio zapisanymi ustawieniami i rozpisujemy każdą odpowiedź. **Wczytaj ostatnią lokalną rundę** odczytuje ostatnią ukończoną ortografię aktywnego gracza na tym urządzeniu, zachowuje jej faktyczną kolejność i podpowiedzi, a także pokazuje punkty z chwili gry. Dane pozostają lokalne; Studio nie zapisuje ich do Git ani do historii gracza. Na telefonie pasek wyniku pozostaje widoczny przy przewijaniu ustawień. Wybór gotowego scenariusza wraca do próbnych danych.

Domyślnie zachowujemy 1 punkt za poprawną odpowiedź, bez kar i bonusu; podpowiedź daje 100% punktów, ale przerywa serię bonusu. Możesz ustawić punkty, karę, procent punktów z podpowiedzią oraz próg i wysokość bonusu. Wynik jest sumą punktów podstawowych, rabatu za podpowiedzi, kar i bonusów, ograniczoną do minimum 0, z zaokrągleniem do dwóch miejsc.

Progi efektu combo i punktowego bonusu są osobne. Przy aktywnym bonusie Studio informuje o ich rozbieżności. Błąd lub podpowiedź zeruje serię, a bonus wpada przy każdym pełnym progu, np. przy 3, 6 i 9 poprawnych bez pomocy.

Zasady są kopiowane na początek rundy i zapisane razem z jej wynikiem. Późniejsze zmiany nie przeliczają historii. Starsze rundy zachowują pierwotne 1 punkt za poprawną. Skuteczność, utrwalone słowa, nauka i rekordy nadal używają rzeczywistej poprawności, nie konfigurowalnej liczby punktów. Runda z limitem słów nie nadpisuje rekordu rundy na czas. Koniec gry zawiera rozwijane **Jak naliczono?**.
