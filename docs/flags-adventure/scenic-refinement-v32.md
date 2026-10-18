# Scenic v32 — wspólne napisy i proporcje przeglądarki

Nazwy państw używają linii bazowej odniesionej do „Polska”, zamiast przesuwać się zależnie od ogonków aktualnego słowa. Rozmiar bazowy pozostaje30px; długie nazwy nadal zmniejszają się i w razie potrzeby mieszczą w dwóch wierszach. Stolice mają wspólną, nieruchomą linię bazową. Miejsce na dolne części liter jest rezerwowane dla całego fontu, także przy nazwach bez ogonków. Symbol stolicy nadal kończy się na linii bazowej i ma wysokość wielkiej litery.

Nagłówek i flaga otrzymały symetryczne48px marginesu od boków pergaminu. To dwukrotność optycznego24px marginesu mapy:12px położenia jej kontenera i około12px poszarpanego brzegu ilustracji. Góra nagłówka znajduje się22px od papieru, o10px niżej niż w v31. Flaga pozostaje proporcjonalna i wyrównana do prawej strony nagłówka.

## Stała scena w przeglądarce

Zwykły podgląd ładuje grę w ramce390×844 i skaluje całość jednym współczynnikiem, aby zmieściła się w oknie. Maksymalna szerokość wynosi480px. Zmiana wysokości okna zmienia wielkość całego obrazu, zachowując proporcje, położenie elementów, kadr mapy i aktualną rundę. Nie uruchamia gry ponownie.

`scenic-shell.mjs` rozpoznaje zainstalowaną PWA i wtedy uruchamia grę bez dodatkowej ramki. Pozostają pełna wysokość dokumentu oraz bezpieczne obszary z v31. `view=game` jest wewnętrznym adresem zawartości ramki; istniejący zestaw testów używa go do niezależnego sprawdzania renderera przy różnych wymiarach. Nowy `tools/flags-scenic-layout-qa.mjs` sprawdza rzeczywisty adres wejściowy wraz ze skalowaniem i interakcją przez ramkę.

Zdjęcie krajobrazu jest osobnym obrazem z `object-fit:cover` i jednakowym powiększeniem1.12 w obu osiach. Zastępuje rozciąganie tła do100% szerokości i112% wysokości. Punkt zaczepienia dużej flagi oblicza się z tych samych wymiarów źródła i współczynnika powiększenia, dzięki czemu pozostaje przy namalowanym maszcie. Chłopiec i małe flagi zachowują swoje proporcje.

## Weryfikacja

- Wszystkie45 krajów Europy: dopasowanie nazwy, maksymalnie dwa wiersze, co najmniej6px odstępu od stolicy, wspólna linia bazowa nazw w rozmiarze bazowym i stała linia bazowa stolic.
- Pytanie, Polska przy dwóch wysokościach, Bośnia i Hercegowina, Watykan, Wielka Brytania oraz Francja i Rosja z odstępami PWA47/34px — Chromium i WebKit.
- Rzeczywisty podgląd przeglądarkowy po odsłonięciu Francji:1280×600,960×734,520×1000,1440×1200,390×700. Wewnętrzna geometria i kadr mapy pozostają identyczne. Wszystko mieści się w oknie. Przełącznik języka i przeciągnięcie kompasu działają po skalowaniu.
- Nowy test przeglądarkowy jest częścią kontroli na gałęzi podglądu. Zrzuty i raport powstają w `docs/flags-adventure/qa-layout-v32/`.

Próba pełnego przebiegu ujawniła odstępy przy wyższych wielkich literach stolic; poprawiono referencję linii bazowej. Późniejszy równoległy przebieg przerwały ograniczenia pamięci komputera i timeout uruchamiania WebKit. Końcowe kontrole wykonano kolejno. Wyniku przerwanego pełnego przebiegu nie należy przedstawiać jako100/100.

Końcowy zakres:20/20 kontroli wizualnych w obu silnikach (dziewięć scenariuszy renderera i jeden scenariusz zmiany rozmiaru w każdym silniku) oraz6/6 testów geometrii. Przegląd napisów obejmuje wszystkie45 krajów w każdym silniku. W WebKit pierwszy końcowy przebieg miał wynik8/9: zatrzymał się przy przewijaniu przed kliknięciem odpowiedzi dla San Marino. Sam test typografii korzysta teraz z gotowego publicznego stanu błędnej odpowiedzi, zamiast wielokrotnie sprawdzać ruch wskaźnika; pozostałe scenariusze nadal klikają rzeczywiste przyciski. Powtórzenie całego przeglądu45 nazw przeszło1/1.

Natywna instalacja na symulatorze iPhone13Pro/iOS27 była sprawdzona dla v31: tło wypełniało ekran także po wznowieniu. Ten wynik nie zastępuje natywnego testu nowych zmian v32 ani testu na fizycznym iPhonie. Górne rozmycie systemowe nie jest przedmiotem tej poprawki.
