# Interaktywna mapa kampanii v44

Baza: v43 `5b5175e`. Lokalna gałąź `work/interactive-campaign-v44`.
Zakres: kampania, jej oprawa i wspólny podgląd Studio/PWA. Home, sceny pięciu
gier, ustawienia map geograficznych i zdobyte postępy pozostają zachowane.

## Wykonane wymagania

- [x] Trzy tylne ujęcia postaci, skierowane w głąb mapy. Prawdziwa przezroczystość,
  cień kontaktowy i stała skala na szlaku.
- [x] Osobne sterowanie postacią oraz zmianą profilu. Po wybraniu innego gracza
  kampania otwiera jego własny postęp i zapisaną postać; PIN korzysta z istniejącej
  ścieżki profili.
- [x] Bieżące i wcześniejsze pola są przyciskami. Wybór zmienia opis, odnośnik
  i przycisk rundy. Pionek zachowuje najdalszy postęp. Przyszłe pola są nieaktywne.
- [x] Powtórka naprawdę uruchamia wcześniejszą rundę, bez ponownego odblokowania
  świata i przesuwania postaci. Zwykłe wyniki nauki nadal są zapisywane.
- [x] Mapy mają przedłużenia nad i pod szlakiem. Nawigacja i dolny, częściowo
  przezroczysty kafel mieszczą się w pełnoekranowej scenerii telefonu bez scrolla.
- [x] Teleport wykorzystuje grafikę z alpha: pierścień schodzi, zabiera postać,
  pojawia się na nowym polu i unosząc ją odsłania. Działa po rundzie i między
  światami. Kolejny świat jest dekodowany przed rozpoczęciem odejścia.
- [x] Ruch po powrocie czeka na ukończenie wspólnego przejścia ekranu. Początkowy
  kadr pokazuje stare pole; nie ma błysku postaci na nowym polu przed animacją.
- [x] Nieodkryte światy są zasłonięte mgłą. Teren jest pocięty na obracane fragmenty,
  a ścieżka i otoczenie gracza pozostają czytelne. Każdy krok odkrywa teren; kamienie
  5/10 rozszerzają region, a przy pozycji 14 mapa jest już całkowicie odsłonięta.
- [x] Osobne narzędzie **Mapa kampanii i animacje** w menu Studio. Wybór świata,
  postaci, suwak 0–15, skoki do kamieni, krok wstecz/dalej, odtwarzanie świata,
  powtórzenie odkrywania i test teleportu. Symulacja nie modyfikuje profili dzieci.
- [x] Zapis lokalny ustawień efektu: kształt, gęstość, obrót, mgła, promień,
  wyprzedzenie, czas odkrywania i teleportu. Undo przywraca poprzedni stan.

## Wspólny model

`campaign-scene.mjs` jest rendererem gry i Studio. `campaign-discovery.mjs` zawiera
czyste obliczenia pól i odsłaniania; `campaign-puzzle.mjs` jest ograniczoną warstwą
canvas. Nie zmienia ona geometrii grafiki ani pozycji przycisków. Po odsłonięciu
fragment jest przezroczysty i pokazuje pełną rozdzielczość oryginalnego obrazu.

Domyślnie jest 900 fragmentów diamentowych, 360 trójkątnych lub 180 kwadratowych.
Rysowanie odbywa się do 30 Hz tylko podczas skończonej animacji. Opuszczenie
widoku sprząta kontroler, a reduced-motion pomija przemieszczanie. Nie ma stałej
pętli malowania w ukończonym widoku. Pomiar pojedynczego malowania na tym Macu
wyniósł około 1,5 ms w Chromium i 3 ms w WebKit; nie jest to pomiar telefonu.

Pozycja 0 oznacza wejście i zadanie 1; po zadaniu 15 postać stoi przy portalu.
Pole zadania i najdalszy postęp są niezależne. Dokładniejsza siatka wciąż ma rzut
2:1. Migracja poprawia tylko dawne, nieedytowane współrzędne domyślne; ręcznie
przesunięty szlak zachowuje własne pozycje. Identyfikatory 105 kroków nie zmieniają się.

## Grafiki i lokalna biblioteka

Wbudowane imagegen: 3 postacie, 1 pierścień teleportu i 7 rozszerzeń scenerii.
11 nowych WebP zajmuje 5 014 070 B. Oryginalne centralne ilustracje pozostają
osobną warstwą, więc generacja przedłużeń nie przesuwa pól szlaku.
Pliki binarne są ignorowane przez Git; commit zawiera indeks i SHA-256.
Źródła i prompty: `outputs/v44/generated-sources.json` katalogu zadania.

## Weryfikacja

- 468/468 testów modelu i kontraktów; 100/100 sprawdzeń 50 widoków w zbudowanym PWA.
- Chromium i WebKit: wybór pola i powtórka, zmiana profilu i postaci, cztery rozmiary
  okna, odsłanianie 0/5/10/14, teleport oraz przejście między światami.
- Dwie zwykłe rundy z niezmienionej puli Ortografii: odblokowanie kroku, powtórka,
  zapis po przeładowaniu. Osobny test potwierdza brak warstwy przejścia ekranu
  zasłaniającej teleport po powrocie z wyników.
- Studio: rzeczywisty lokalny zapis parametrów → plik PWA → undo → pełne odtworzenie.
  Test automatycznego odtwarzania do portalu. Każda nowa grafika: HTTP, hash i decode.
- Zrzut całkowicie odkrytej mapy oraz sprawdzenie przezroczystości canvas zapobiegają
  zasłonięciu ilustracji przez techniczne tło efektu.
- Fizycznego iPhone'a i obszaru systemowego iOS 27 w tym przebiegu nie sprawdzano.
  Niczego nie wysłano na GitHub, Vercel ani do zewnętrznej biblioteki.

Podglądy: `http://127.0.0.1:8872/` oraz
`http://127.0.0.1:8872/design-system/#campaign-lab`.
Raporty `.design-qa/v44/`; zrzuty i kopia biblioteki w `outputs/v44/` katalogu zadania.
