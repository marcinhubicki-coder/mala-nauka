# Dźwięki i Sound Lab v2

## Wspólne źródło

Sound Lab, Komponenty i PWA używają tego samego silnika (`shared/sound-library.mjs`, `shared/sound-runtime.mjs`) i `config.sound`. Suwaki zapisują szkic po puszczeniu. **Zapisz miks do gry** przekazuje pełny kontrakt podglądowi, **Zapisz i testuj w grze** otwiera prawdziwy ekran jednego z pięciu trybów. **Zapisz na GitHub** zachowuje miks dla kolejnego wydania. Lokalne wyciszenie gracza ma pierwszeństwo.

## Brzmienie i pętle

12 krótkich reakcji: tap, jelly, odpowiedź, potknięcie, podpowiedź, dalej, combo/gwiazdka, trofeum, start, koniec, postęp, bańka. Pogodne drewniane tony, neutralne potknięcie, krótka zachęta.

10 kanałów: deszcz, strumień, wiatr, liście, ptaki, fale, świerszcze, ciepła otulina, melodia zabawy, ciepłe akordy. Wesoła nauka, Skupienie, Leśna przygoda, Deszcz, Morze, Ogród, Kosmos i Cisza. Suwak długości podkładu: 24–180 s, domyślnie 72 s. Muzyka zaokrągla czas do pełnej frazy 16 uderzeń (domyślnie ok. 69 s); natura ma niezależne, niepokrywające się okresy ok. 60–113 s i nierówne zdarzenia. Kolejne frazy melodyczne mają wariacje i pauzy, zamiast powtarzać kilka tych samych sekund. Sygnały szumowe łączymy przez overlap-add bez wygaszania całego podkładu do ciszy. Muzyka ma wspólne tempo i pentatoniczne frazy. Efekty i melodia nie mają ostrych transjentów. To synteza, nie nagrania przyrodnicze.

Ustawienia: energia, tempo 60–120 BPM, zmienność natury, ciepło filtra, głośność całości/efektów/tła/logo, wyciszenie tła pod odpowiedzią, tryb spokojny. Zera wyłączają kanały. Eksport WAV zawiera pełną pętlę, ZIP także zapis ustawień.

## Mapa i mikser krótkich dźwięków

Mapa ma kolumny logowania, startu, ustawień trybów, gry, zakończenia i statystyk, z połączeniami zgodnymi z architekturą. Przypisania powstają z semantycznych działań kodu (`shared/sound-map.mjs`), bez konieczności odwiedzania ekranów w podglądzie. Kliknięcia przycisków, linków, etykiet PIN/jelly, przełączników, pól i formularzy korzystają z tych samych kluczy co mapa. Suwak akcji gra po ukończeniu ruchu, nie przy nieudanej próbie przesunięcia. Dźwięk kliknięcia i późniejszego `change` nie jest dublowany.

Przy działaniu można wybrać jedno z 12 brzmień lub ciszę, głośność 0–150%, odsłuch i mikser. Zakres: tylko wybrany ekran lub wspólne przypisanie tego działania. Wyjątek lokalny ma pierwszeństwo. Wszystkie cyfry PIN, odpowiedzi czy avatary danego ekranu dzielą dźwięk roli; nowe kontrolki dostają edytowalne przypisanie „Pozostałe”. Dobra odpowiedź, błąd i pauza dzielą mapę gry; statystyki zachowują własne podwidoki. Przywróć jest widoczne tylko po nadpisaniu.

Każde brzmienie ma cztery warstwy (drewno, dzwonek, sprężynka, powietrze), głośność, długość 50–250%, wysokość ±12 półtonów i początek 1–80 ms. Suwaki pokazują stan domyślny i przywracanie. Miks wpływa na każde jego użycie w grze oraz WAV. Zapis i test przenoszą mapę, brzmienia i tło; szkice projektu i migawki wydania także zawierają `sound`. Przywrócenie podkładu zachowuje mapę i miksy krótkich dźwięków. Stare szkice bez nowych pól nadal działają.

## Gra i animacje

Kliknięcia/jelly, odpowiedzi, podpowiedzi, kolejne zadanie, start i koniec rundy są podłączone do wspólnego runtime. Ortografia/angielski/czytanie/flagi używają głównego runtime; osobna Matematyka tego samego silnika. Co trzecie combo wywołuje małą gwiazdkę. Tło gra w rozgrywce, zatrzymuje się przy pauzie lub dialogu i po wyjściu. Krótki sygnał odpowiedzi nie jest obcinany przy zmianie widoku.

Logo: pięć nut na obrót, rozlanie kolorów, narastający biały blob i wesołe odsłonięcie. Czas audio jest obliczany z rzeczywistych ustawień animacji, również przy pauzie, wznowieniu i zmianie długości. Lab logo i Sound Lab mają ręczny odsłuch. Pierwszy start PWA może wymagać dotknięcia **Włącz dźwięk** — przeglądarka blokuje audio bez gestu. Przesuwanie osi czasu nie gra dźwięku.

## Wydajność i sprawdzenie

Dłuższe podkłady generuje Worker, poza wątkiem interfejsu. Próbki są buforowane, głośności wygładzane, tylko aktywne kanały mają źródła. Brak audio w każdej klatce animacji. Maksymalnie osiem krótkich głosów naraz. Tło i źródła zatrzymywane przy ukryciu/zamknięciu strony, filtr i kompresor łagodzą sumę kanałów. Poziom urządzenia nadal zależy od jego ustawień. Pierwszy sygnał czeka na uruchomienie audio po kliknięciu. Przerwany kontekst jest wznawiany, zamknięty odtwarzany od nowa; powrót z historii przeglądarki przywraca widoczność kontrolera. Błąd lub brak odpowiedzi Workera przełącza bieżący podkład na renderowanie lokalne zamiast pozostawiać ciszę.

Testy: ciągłość i energia łączenia pętli, finitość sygnałów, zgodność WAV/ZIP, zapis całego miksu, stare szkice, pauza/wyciszenie, ponowne użycie buforów, limit głosów, anulowanie startu, timingi logo, zmienność natury i energii. Budowanie całej aplikacji. Krótki lokalny test sygnału w Chrome i WebKit potwierdził niezerowy sygnał za filtrem i kompresorem; test przycisków Sound Lab i odpowiedzi w podglądzie również potwierdził sygnał na wyjściu. Nie jest to potwierdzenie odsłuchu na urządzeniu użytkownika. Dodatkowe testy obejmują pierwsze kliknięcie podczas resume, interrupted/closed, awarię Workera i wyciszenie w trakcie uruchamiania.


## Sprawdzenie ciszy

Przycisk **Sprawdź dźwięk** gra znany ton z domyślną głośnością, niezależnie od zer w mikserze. Nie zapisuje ani nie zmienia ustawień. Komunikaty odsłuchu są także na górze Sound Lab. Biblioteka podaje nazwę odtwarzanego efektu; zerowa głośność efektów lub całego miksu jest opisana jako wyciszenie. Błąd uruchomienia podaje rzeczywisty komunikat zamiast sugerować, że tło gra. Gdy ton testowy generuje sygnał, ale nadal go nie słychać, trzeba odróżnić wyciszenie karty/strony lub wyjścia urządzenia od ustawień miksu.
