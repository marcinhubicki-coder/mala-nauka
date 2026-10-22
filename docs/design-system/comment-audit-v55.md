# Audyt uwag — v55, 21.10.2026

Zakres: uwagi od żywej mapy / efektów kart po najnowszy kierunek księgi. Nowe pomysły nie anulują wcześniejszych. Chronione: stała geometria mapy, pozycja postaci na najdalszym kroku, jedna aktywna poświata pola, przebieg gwiazdki → powrót jasności → teleport, wspólny renderer PWA/Studio, szkic użytkownika.

## Wykryte rozbieżności

| Uwaga | Stan zastany | Działanie v55 / dowód końcowy |
|---|---|---|
| Efekty elektrycznych ramek i iskrzenie | Istniały w kodzie, ale warstwa `overflow:hidden` przycinała cząstki; obrys był bardzo słaby | Oddzielny obrys SVG i emitery na obwodzie, mocniejsze ustawienia, bezpośredni wybór 8 efektów na rzeczywistej karcie. Zweryfikowane na rzeczywistych kartach w Chromium i WebKit: `magic-final`, `workbench-final` |
| „Zobacz działanie” tylko w Studio | Renderowanie już warunkowe `admin`; obsługa akcji nie miała osobnej bramki | Jawna bramka administracyjna także w obsłudze akcji; test realnego PWA bez tej opcji |
| Postać nad dymkiem na początku, później z boku / wychylona | Warianty boczne jedynie wyrównywały postać nad dymkiem | Rzeczywista kompozycja boczna z ogonkiem na boku; 5 wejść i 2 płcie objęte scenariuszem `guide-last`; 14 NPC w `cast-final` |
| Puchar stoi na podium | Pozycja względem całej grafiki, nieuwzględniona powierzchnia | Wspólny punkt styku, cień kontaktowy; wszystkie 10 etapów oraz starsza galeria objęte `parts-final` |
| Światło przy ulepszeniu, bez skoku na pętli | Skończone promienie, geometryczne, bez pyłu | Rozproszone promienie i drobinki kurzu; skończona animacja bez zapętlenia |
| Księga bez scrolla, krok = strona | Wszystkie fragmenty w jednym obszarze przewijanym | Zastąpienie pojedynczą stroną i numerowaną nawigacją |
| Prawdziwe inicjały, ornamenty i miniatury | Papier oraz CSS inicjału i linii | Oryginalne generowane atlasy dla 7 światów; każda grafika osadzona w bibliotece |
| Rozpad tekstu razem z ilustracją | Cząstki próbkowały tylko tekst | Próbkowanie kolorów i położenia ilustracji; jedna ograniczona warstwa canvas |

## Uwagi wcześniejsze — wymagają zachowania / regresji

- Żywa mapa: osobna globalna poświata, lokalny blask łańcuchów, odkrycie 80% / 55% / 30% w promieniu dwóch pól, łagodny powrót; do 7 łańcuchów startujących nierównocześnie, rozłączne rezerwacje pól. W v54 są mechanizmy i testy; zachowane, sprawdzone testy geometrii / rezerwacji i tester Studio. Pomiar płynności na fizycznym iPhonie pozostaje do wykonania.
- Mapa nie zmienia geometrii wskutek wzrostu kafla. Kafel od dołu, odstęp jak po bokach, frosting, zadanie w osobnym kaflu, tytuł kroku w jednej linii. W v54 wdrożone; chronione.
- Postać ponad zaznaczeniem, jedna aktywna poświata: złota na bieżącym polu, srebrna przy powtórce, numerki w izometrii. W v54 wdrożone; chronione.
- Portal Światów: oszczędny kafel, stale animowany przycisk, odrębny artefakt świata z 3 częściami, Duch Portalu; 300 cząstek w kolorach postaci. W v54 wdrożone; chronione.
- Przygaszanie miękkie; dialog → gwiazdki w jednym przygaszeniu; teleport pola już na jasnej mapie. W v54 wdrożone; regresja sekwencji.
- 2 NPC na świat, po pierwszym kamieniu oraz przed portalem; biblioteka i tester. W v54 14 postaci; 14 ilustracji z przezroczystością, artefakty 7 światów i rzeczywisty dialog po kroku 8 przeszły `cast-final` w dwóch silnikach.
- Iskierka D z księgą i Iskier; postać z płci awatara. W v54 wdrożone. Combo → wybór naładowanej mocy → zadanie jest próbką w Studio; automatyczne przerwanie realnej rundy pozostaje do kierunku po ocenie próbki, nie przedstawiać jako ukończonego przepływu gracza.
- Gwiazdy: 3 od 60%, 5 od 81%, lot do karty, medal za kroki na 5 gwiazdek, najlepszy wynik powtórki. W v54 wdrożone.
- Piąta gwiazdka na okładce / dodatkowa historia za 5 gwiazdek była propozycją „warte rozpatrzenia”, nie decyzją. Nie uzależniać podstawowej fabuły od perfekcyjnych odpowiedzi.
- Rozwój nagrody: skrzynia wyłącznie przy odkryciu, ulepszenie istniejącej grafiki, wspólna siatka i nakładki. W v54 wdrożone. Nowa korekta dotyczy kompozycji podium i światła, nie zmiany korpusu co poziom.
- Studio: przyjazny tester rzeczywistych stanów, osobny panel mgły, brak poziomego scrolla całego okna; przesunięcia jako szkic z cofnij / zatwierdź / odrzuć. W v54 wdrożone; `workbench-final`: 4 szerokości desktopu w dwóch silnikach bez przewijania całego dokumentu; osobne panele testera i mgły.

## Kryterium ukończenia

Samo istnienie kodu lub zielony test nie oznacza spełnienia uwagi wizualnej. Przejrzano rzeczywiste karty, podium, wejścia dialogów oraz strony księgi w przeglądarce. Zrzuty, scenariusze interakcji i ograniczenia: `outputs/v55/LISTA-ZMIAN.md` w katalogu zadania. Bez publikacji zewnętrznej.

## Dowody lokalne

Raporty w `.design-qa/v55/` (generowane, nie są częścią commita):

- `unit.log`: 511/511 testów.
- `contracts-final/verified.json`: 106/106 widoków urządzeń, 53 kontrakty × telefon/desktop.
- `manuscript-final/report.json`: 858 kontroli stron, 7 światów, telefon 390×844 i 375×667, desktop 1440×900; zero przelewania zawartości, anulowanie szybkiej nawigacji, przebudowa przy resize, 21 atlasów przez HTTP.
- `magic-final/report.json`: 8 rzeczywistych efektów w obu silnikach, widoczny obrys i emitery, maksymalne ustawienia, warunek gotowości, 5 promieni / 32 drobinki, ograniczenie ruchu.
- `rewards-pwa/report.json`: realne PWA gościa, ulepszenie brąz → srebro bez skrzyni, zapis poziomu, brak przycisku administracyjnego w kuźni.
- `book-pwa/report.json`: home → kampania → księga → powrót, zachowany postęp, ten sam renderer Studio, brak fontu nie blokuje strony.
- `parts-final/report.json`: 3 medale, 10 etapów pucharu, te same współrzędne korpusu i nakładek, styk z podium również w starszej galerii.
- `workbench-final/report.json`: ergonomia paneli, scenariusze blokada/częściowy/gotowy/odebrany, odkrycie i ulepszenie, żywe ustawienia efektu bez resetowania animacji.
- `cast-final/report.json`: 14 NPC, 7 artefaktów, epilog, spotkanie → gwiazdy → teleport → zapis dialogu w księdze.
- `consumer-build.json`: starszy lokalny konsument bez trzech nowych modułów pobiera kompletny renderer księgi ze wspólnego źródła. Bez zewnętrznego pobierania.
- `performance/report.json`: 4 pomiary po 8 s, około 60 wywołań animacji/s, zero zmian geometrii mapy; Mac, bez wnioskowania o GPU telefonu.
- `guide-last/report.json`: wejścia nad/z boku/wychylenie, wybór mocy w próbce, jeden cień prezentacji, jasna mapa w każdej fazie teleportu, jeden aktywny kafel, przerwanie i ponowienie portalu, przedmiot Ducha Portalu również przy prawym wejściu.

Grafiki: 21 oryginalnych atlasów WebP, 18 480 180 bajtów łącznie, wpisy w bibliotece i manifest z wymiarami / sumami kontrolnymi. Księga ładuje 3 atlasy bieżącego świata. Binarne pliki są lokalnymi zasobami biblioteki, nie trafiają do commita aplikacji. Publikacja biblioteki zewnętrznej nie została wykonana.

## Co pozostaje do oceny / nie jest deklarowane jako ukończone

- Automatyczny wybór mocy po combo w realnej rundzie: działająca próbka w Studio, oczekuje kierunku po ocenie; nie jest jeszcze automatycznym przerwaniem rozgrywki PWA.
- Piąta gwiazda na okładce i dodatkowa fabuła za perfekcyjny wynik: wcześniejsza opcja do rozważenia, bez zmiany podstawowego dostępu do historii.
- Estetyczna akceptacja nowych iluminacji, mocy obramowań i bocznych dialogów należy do użytkownika.
- WebKit na Macu i rozmiar telefonu nie zastępują fizycznego Safari / GPU iPhone'a 13 Pro.
- Nie zmieniano w tej iteracji układu flag ani wszystkich historycznych trybów; audyt dotyczy najnowszego ciągu uwag kampania / księga / kuźnia / nagrody.

Inspiracje do oryginalnych iluminacji: [Karlsruhe, XV w.](https://commons.wikimedia.org/wiki/File:Handschrift.karlsruhe.blb.jpg), [The Met — inicjał D](https://www.metmuseum.org/art/collection/search/463605), [University of Leeds — iluminowane rękopisy](https://library.leeds.ac.uk/special-collections/collection/830).
