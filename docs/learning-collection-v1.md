# Nauka, kolekcja i nagrody V2

Wspólny kontrakt `shared/progression.mjs` i jego ustawienia `config.progression` obsługują PWA oraz kalkulator Studio „Punkty i wyniki”. Historyczny kontrakt punktów pozostaje przy starych wynikach. Nowe rundy zapisują własną wersję zasad i iskry.

## Trzy niezależne miary

- Odkrycie następuje przy pokazaniu opublikowanego, zilustrowanego słowa w rzeczywistej grze, także przed błędną odpowiedzią.
- Gwiazdki: 5 poprawnych prób na brąz, 15 łącznie na srebro, 30 na złoto. Pomoc nie wyklucza gwiazdki.
- „Umiem”: każdy dopuszczony cel pisowni słowa, samodzielnie w trzech różnych dniach obejmujących co najmniej siedem dni kalendarzowych. Późniejszy błąd zwiększa priorytet powtórki i zachowuje osiągnięcie. Dawne zdobyte „Umiem” pozostają trwałe.

Odpowiedzi, odkrycia i portfel są zapisywane podczas rundy. Potwierdzenia odpowiedzi mają identyfikator rundy oraz numer pytania. Ponowne rozliczenie rundy nie przyznaje drugiej nagrody ani drugiej powtórki. Historia 50 rund nie ogranicza trwałego zapisu nauki.

Pierwsza przygoda to 10 losowych słów bez stopera. Następne rundy mają 10/20/40/80 słów lub wybrany czas. Dobór słów uwzględnia błędy, nowe słowa, terminy powtórki, nieukończone gwiazdki i rotację celów pisowni.

## Iskry i moce

Combo: 3/6/10 samodzielnych poprawnych odpowiedzi daje ×1,25 / ×1,5 / ×2. Pomoc zatrzymuje wzrost serii, błąd ją zeruje; tarcza może ochronić serię, lecz nie zmienia poprawności. Nowa runda zaczyna combo od zera.

Miernik przechodzi między rundami. Ładuje go każda rozstrzygnięta próba; poprawność i combo zwiększają ładowanie. Premia mocy nie ładuje samej siebie. Wylosowana moc pozostaje zarezerwowana po odświeżeniu. Pierwsze wykucie daje jedno pełne ładowanie. Składniki osiągnięć pozostają trwałe, a koszt w iskrach jest odejmowany raz. Ułamki iskier są przechowywane w milionowych częściach i nie znikają po krótkiej rundzie.

Tempo referencyjne zadań/min: ortografia 8, matematyka 12, angielski 8, flagi 16, czytanie 6. To parametry początkowe do kalibracji na rozgrywkach dzieci. Symulacja w Studio korzysta z tego samego silnika; nie jest pomiarem rzeczywistych zachowań. Czekanie, pauza i animacje nie naliczają iskier.

## Reguły i nagrody

Reguły są kartami otwierającymi okno z dotychczasową ilustracją, treścią i przykładami. Nieodkryte przykłady są wyszarzone; oglądanie ich nie odkrywa kart słów. Trzy odkryte przykłady zbierają regułę, a przy mniejszej grupie potrzebne są wszystkie. Komplet daje jednorazowo 5 iskier.

Medale mają pięć wzorów i trzy kolory. Wymagają pełnej bezbłędnej rundy bez pomocy i pominięć. Rundy czasowe wymagają również minimalnej liczby zadań właściwej dla trybu. Osiągnięcia 7 dni liczą aktywne dni łącznie, bez zerowania serii. Wszystkie zdobyte nagrody są trwałe.

Puchar wiedzy: L0 za pierwsze 5 „Umiem”, brąz za 25, srebro za 100, złoto za 500; pośrednie 50 i 250 również mają trwałe osiągnięcia. Podstawę wybiera się raz, a trzy kolejne wybory A/B wyłącznie dopisują elementy. Nie można zmienić wcześniejszej ścieżki. Alternatywne wyglądy i sekrety nie są wymagane do 100%.

## Grafika i jedna biblioteka

Wygenerowano wbudowanym imagegen pięć atlasów pucharów oraz jeden atlas medali. Każdy ma 15 wycinków; razem 75 pucharów i 15 medali. Układ pięć kolumn × trzy wiersze, komórka 400 × 400, przezroczyste tło. Puchary mają maksymalnie 200 px wysokości w interfejsie, również w powiększeniu. Oryginały, końcowe atlasy i prompty zachowano obok repozytorium w `learning-game-art/`.

Bajty nowych ilustracji są wyłącznie na gałęzi `assets/library-v1`, commit `3cdbcbf9d798e395056f518559a5f6ee92ca8833`. Aplikacja przechowuje indeks i adresy oparte na SHA-256. Sprawdzono opublikowany indeks wszystkich 743 grafik oraz bajty sześciu nowych atlasów (3 745 228 B).

Hosted build V2 nie zawiera plików graficznych w paczce aplikacji. Każde `/assets/...` korzysta z istniejącej biblioteki `mala-nauka-assets.vercel.app`. PWA pobiera podczas instalacji tylko jawny zestaw startowy. Atlasy nagród, ilustracje słów i flagi trafiają do ograniczonego cache przy pierwszym użyciu. Lokalny build do testów bez mechanizmu przekierowań może zachowywać kopie robocze.

## Profile demonstracyjne

Checkbox w „Punkty i wyniki” jest domyślnie wyłączony. Włączenie opcji oraz zbudowanie gałęzi `studio/pwa-test` dodaje znacznik kompilacji, który uruchamia osobną bazę `malaNauka.demo.v1` i osobne klucze sesji. Sam parametr URL ani ustawienie zapisane w zwykłym PWA nie uruchamiają profili demonstracyjnych.

Nowy: pusty profil przed tutorialem. Odkrywca: około 25% odkrytych słów, 8 „Umiem”, osiągnięcie i 2 moce. Mistrz: około 90% odkrytych słów, większość opanowanych, zaawansowane nagrody i oczekujący wybór ozdoby. Wszystkie trzy profile mają wyłączony PIN. Ponowne uruchomienie zachowuje zmiany testerów i nie nadpisuje istniejących profili.

## Rewizja treści

Biblioteka ma obecnie 55 pozycji, w tym ogólne pomoce pamięciowe, oraz powiązania wszystkich 510 słów. Zmieniono 66 rekordów wymagających korekty lub uzupełnienia. Rozdzielono „i” jako samogłoskę i znak zmiękczenia od „i” będącego wyłącznie znakiem zmiękczenia przed inną samogłoską. Poprawiono rodzinę nóżka–noga, sokół–sokoła, cicho–cisza, zakończenie Kraków, skuwkę/wsuwkę/zasuwkę, przykłady śnieg–śnieżny i zakres końcówki -arz. W „zmarznąć” nie pytamy o r+z jak o dwuznak rz; ćwiczenie dotyczy końcowego ć.

Podstawa normatywna: [Rada Języka Polskiego — zasady obowiązujące od 2026](https://rjp.pan.pl/zasady-pisowni-i-interpunkcji-polskiej-2/). Objaśnienie funkcji „i”: [ZPE — Wśród liter, głosek i sylab](https://zpe.gov.pl/a/wsrod-liter-glosek-i-sylab/D1411aqT6). Pomoce pamięciowe nie udają reguł wyjaśniających każdą pisownię. Indywidualne przykłady i źródła słów pozostają przy rekordach.

## Weryfikacja

Weryfikacja lokalna z 16.10.2026:

- 436/436 testów automatycznych; audyt projektu bez błędów.
- 45 natywnych kontraktów × iPhone i desktop: 90/90 kontroli, edycja rzeczywistego stylu każdego widoku, brak błędów JS.
- `qa-learning-e2e.mjs`: 14/14 etapów w odizolowanej Test PWA z rzeczywistą publiczną biblioteką: pełny tutorial, odkrycie przy błędzie, pomoc bez „Umiem”, brak podwójnych nagród, powrót wynik–kuźnia, wykucie i koszt, rezerwacja mocy przed odpowiedzią i po przeładowaniu, trwała ewolucja pucharu, karta reguły bez odkrywania słów, odpowiedzi i wynik w pięciu trybach oraz ponowny start offline z pobraną ilustracją.
- Regresja uploadu Studio z jawnie izolowanym API GitHub: szkic IndexedDB, atomowy plik i indeks biblioteki, aplikacja bez obrazu, dekodowanie 128 × 128 i cache offline. Wcześniejszy rzeczywisty upload przez GitHub/Vercel ma osobne dowody w `V2-CANONICAL-IMAGE-INDEX.md`.
- Regresja przełączania iPhone/Desktop: ten sam widok, stan, szkic oraz Test PWA; brak błędów JS.
- Hosted build: zero plików graficznych, 28 obrazów startowych (2 731 076 B). Atlasy i bank słów/flag nie są pobierane podczas instalacji. Cache z poprzedniej wersji jest zachowany.

Dowody przeglądarkowe i raporty pozostają w lokalnym `.design-qa/`; nie trafiają do paczki gry. Weryfikacja opublikowanego wydania jest odnotowywana osobno po wdrożeniu.
