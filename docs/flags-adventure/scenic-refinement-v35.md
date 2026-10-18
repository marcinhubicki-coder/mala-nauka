# Scenic v35 — większa mapa i przejścia do oceny

Rozwinięty pergamin zaczyna się wyżej: górna krawędź kompasu jest 12 px pod paskiem czasu. Papier może lekko nachodzić na tabliczkę zadania. Przełącznik języka podniesiono i wyrównano optycznie. Dolny suwak przesunięto w stronę dolnego bezpiecznego obszaru, aby kompas zasłaniał co najwyżej skraj brody chłopca. Na ekranie 390×844 z odstępami 47/34 px wysokość pergaminu wzrosła z około 297 do 327 px.

Nazwy i pytanie używają kroju Merienda z polskimi znakami, dostarczanego lokalnie na licencji OFL. Źródło: [Google Fonts](https://github.com/google/fonts/tree/main/ofl/merienda); licencja jest w `assets/fonts/Merienda-OFL.txt`. Bazowa nazwa ma 28 px, stolica 16 px. Długie nazwy nadal zmniejszają się lub zajmują dwa wiersze. Wspólna pozycja stolicy jest bliżej krótkich dolnych zakończeń liter. Nagłówek i symbol mnożą kolor przez pergamin; flaga ma osobną warstwę, cień i dolną krawędź wyrównaną do dolnego śladu tekstu stolicy. Jej białe pola zachowują kolor materiału.

Jaśniejszy obszar pod nagłówkiem jest niższy. Kadr bliski mieści kraj w części mapy poniżej tego obszaru, zachowując proporcje ilustracji. Etykiety krajów są ograniczone do czytelnych powierzchni: wymagają wystarczającej szerokości, wysokości oraz udziału w widocznym obszarze. Ich środek pozostaje w danym kraju. Małe państwa nadal są w pełnej liście sąsiadów; nie dostają wymuszonych, większych od nich podpisów na mapie.

Zwinięty pergamin pytania ma dodatkowe 20 px wysokości. Padding wzrósł o 15 px u góry i 5 px na dole. W całej scenie wyłączono zaznaczanie tekstu, obwódki fokusu, systemowe podświetlenie dotyku i przesuwanie przycisku odpowiedzi podczas naciskania. Wybrane granice oraz poprawna i błędna odpowiedź nadal mają znaczące wyróżnienie.

Paski sąsiadów wjeżdżają przez 480 ms, z opóźnieniami 0/85/170 ms. Suwak wjeżdża od dołu i miękko kończy ruch razem z ostatnim paskiem. Po ukończeniu gestu czeka 300 ms, następnie przyspiesza w dół przez 420 ms; paski jednocześnie wyjeżdżają w odwrotnej kolejności. Ograniczenie ruchu w ustawieniach systemu nadal pomija te animacje.

Piasek opada pionowo w miejscu każdej litery i tworzy lokalne kopczyki. Ruch w poziomie zaczyna się dopiero przy formowaniu nowych słów. Dopasowanie ziaren według pozycji oraz kolejności odpowiedzi według długości nazw ogranicza zbędne rozciąganie i krzyżowanie torów.

Poprawna odpowiedź znów automatycznie przechodzi dalej po czasie na zapamiętanie. Dawny parametr `freeze=1` zatrzymuje taki przebieg tylko razem z jawnym `qa=1`; zwykły link podglądu nie blokuje już gry.

## Zakres sprawdzenia przed akceptacją

Zgodnie z prośbą wykonano krótki przebieg w Chromium: pytanie, błędna odpowiedź dla Niemiec, opóźnienia i kierunek animacji pasków, wjazd suwaka, uruchomienie następnej rundy suwakiem, kopczyki liter oraz poprawna odpowiedź dla Polski z automatycznym przejściem mimo starego `freeze=1`. Zapisano lokalne zrzuty. Raport jest w `qa-preview-v35/smoke.json`; końcowy odstęp nagłówka sprawdzono po drobnej korekcie. Sprawdzono również składnię modułów.

Nie wykonywano pełnego przeglądu wszystkich krajów, drugiego silnika ani natywnej instalacji v35 w iOS Simulator. Pełna wcześniejsza bateria zawiera asercje starego kadru i odstępów, które wymagają dostosowania do zaakceptowanego wariantu. Ciężkie przebiegi GitHub Actions uruchamiają się teraz ręcznie przez `workflow_dispatch`; zwykła publikacja podglądu zachowuje szybkie sprawdzenie składni i geometrii. Pełny przegląd zostaje po akceptacji wizualnej. Poprawka pełnej wysokości PWA z v34 pozostaje aktywna; efekt rozmycia obszaru systemowego iOS nie został zmieniony.
