# Kampania, nagrody i spójność v42 — lista odbioru

Baza: lokalna v41, 5fbae2c. Branch: work/campaign-studio-v42.
Korekty użytkownika zapisano przed migracją w outputs/v42/user-map-calibration-v41.json.
Chronione: istniejące profile i postępy, historia wyników, biblioteka grafik,
stan UI słów, aktualne kafle Home, rozgrywka i jej źródła.

## Wspólna geometria i zapis
- [x] Wyjście, pauza i zegar na wspólnych wysokościach z Ortografią; slider wyżej.
- [x] Wspólne, jawne ustawienia położenia dla krajów i trybów; zapis lokalny Studio.
- [x] Zoom telefonu wyłączony w PWA; zdjęcia zachowują proporcje.
- [x] Przeciąganie elementu i narożnik skalowania w Studio, opcjonalna siatka,
      responsywne wartości oraz undo/redo i zakres wspólny/lokalny.

## Mapy
- [x] Zachować ręczne zmiany PL/FR/BY/DK/NL jako nową bazę, wyczyścić znaczniki edycji.
- [x] Wyciągnąć wnioski: szerszy kadr kraju, ciaśniejszy kontynent, miejsca na sąsiadów.
- [x] Identyczny kadr i bazowe pozycje etykiet w trzech trybach, bez ujawniania odpowiedzi.
- [x] Zakres wspólny / wyjątek wariantu dla etykiet; wyraźna nazwa aktualnego kraju.
- [x] Zmiana kraju przez działające przyciski aktualizuje listę i cel zapisu.
- [x] Delikatna czerwień: brakuje etykiet sąsiadów; zieleń: ręczne nadpisanie ma priorytet.

## Model postępów i nagród
- [x] Wspólne kryteria dla pięciu trybów, odkrycie/utrwalenie/opanowanie, migracja danych.
- [x] Główny Puchar wiedzy per tryb: pierwszy element Umiem + dziewięć etapów do pełnego zasobu.
- [x] Medale: odkrycie, brąz/srebro/złoto; trofea: L0–L4, wymagania łączone i trwały wybór.
- [x] Karty równej wysokości: grafika, tytuł 2 linie, opis 2 linie, postęp.
- [x] Gotowe karty: zielony gradient i spokojny przepływ światła.
- [x] Dialog jak karta słowa: oddzielne wymagania, paski, checkmarki, slider dopiero po spełnieniu.
- [x] Skrzynia: dwa podbicia, otwarte wieko, wyłonienie nagrody, cząstki i spokojny połysk.
- [x] Pięć odmiennych zamkniętych i otwartych skrzyń, bez duplikatów w widocznym zestawie.
- [x] 6–8 mocy × 3 poziomy, rzeczywiste efekty i premie; portfel bez części dziesiętnych.
- [x] Bilans: jedno naliczanie, brak podwójnych wypłat, koszty/tempo i podgląd w Studio.

## Kampania
- [x] CTA Home + osobna mapa kampanii; wolne ćwiczenia pozostają dostępne.
- [x] Pięć światów: miasto, dżungla, podziemia, wróżki, kosmos; ścieżki i portal.
- [x] Rozgrywka przypisana do punktu: tryb, pula, trudność, liczba/czas, wymagania i iskry.
- [x] Progresywnie rosnące pule, matematyka od dodawania do 10, potem 20/100 i dalej.
- [x] Trwały postęp profilu, odblokowania, pionek, kamienie milowe, nagrody i przejścia.
- [x] Weryfikacja pokrycia materiału i końca kampanii; brak nadmiaru trofeów.
- [x] Edytor Studio: światy, kroki, kamienie milowe, wymagania, bilans, drag na mapie,
      podgląd animacji i symulacja profilu bez modyfikowania danych dziecka.

## Kolekcja i responsywność
- [x] Zasady/słowa pokazują tylko odkryte; separator i liczba pozostałych.
- [x] Angielski: fiszki; Flagi: atlas/karty krajów; Matematyka: krótkie strategie;
      Czytanie/pamięć: przydatne wskazówki, bez sztucznego mnożenia kolekcji.
- [x] Tło każdego trybu w Moich wynikach, miękkie przejście obrazu w gradient,
      płynna zmiana między trybami; brak kolizji pochylonego tekstu.
- [x] Rozgrywka: stabilna kompozycja; wyniki, kuźnia i Studio: elastyczny desktop/tablet.

## Odbiór
- [x] Walidacja danych i rzeczywiste kontrakty nowych widoków, odświeżony cache i build.
- [x] Zapis lokalny → ponowne wczytanie → działające PWA; rozdzielenie trybów map.
- [x] Profil → kampania → runda → postęp/nagroda; trwałość i idempotencja.
- [x] Gest slidera i animacja skrzyni, wybór ulepszenia, aktywacja mocy, reduced motion.
- [x] Screenshoty telefon/desktop, brak błędów i regresji; jawne granice emulacji.

## Jak używać lokalnej wersji

- **Zapisz lokalnie** zapisuje konfigurację, kryteria, przypisania grafik i edytowane
  paczki słów na dysku oraz w lokalnym buildzie. Zapis na GitHub jest osobną akcją.
  Szkic w pamięci przeglądarki sam w sobie nie zmienia plików PWA.
- **Wspólny zakres** w Edycji ekranów zmienia wszystkie użycia tego samego klocka,
  również dla innych krajów. Wyjątek widoku dotyczy danego ekranu/stanu, a nie kraju.
- **Map Validator** zapisuje kraj wskazany nad podglądem. Zbliżenia są wspólne dla
  Flag, Państw i Stolic. Etykiety domyślnie też; „Wyjątek: ten tryb” rozdziela je.
  Aktywne sterowanie grą aktualizuje kraj w panelu i blokuje zapis do czasu jego
  wczytania. Zieleń oznacza nadpisanie, delikatna czerwień brak nazwy lub flagi sąsiada.
- Pięć korekt użytkownika (PL/FR/BY/DK/NL) to nowa baza. Przycisk „Domyślne” wraca
  do tej bazy, nie do wcześniejszego automatycznego kadru. Początkowo nie ma oznaczeń
  ręcznej edycji. Wzorzec: szerszy kadr kraju (0,8), ciaśniejszy kontynent (1,57),
  z zachowaniem dokładnych pięciu korekt. Automatyczne etykiety omijają ręczne kotwice.
- W **Kampania i nagrody** można edytować przepisy medali i trofeów, wymagania na
  każdym poziomie, tryb i kategorię wymagania, koszty/premie/składniki mocy, światy,
  kamienie milowe, kolejność i ustawienia kroków. Symulacja używa oddzielnego profilu.
  Przeciągnięcie kamienia przesuwa także przypisane do niego kroki.
- **Przesuwaj i skaluj** w Edycji ekranów dodaje uchwyt narożny. Pozycje i szerokość
  zapisują się względem rodzica, wysokość wynika z proporcji i zawartości. Zachowane
  są zakres wspólny/lokalny oraz undo/redo. Siatka jest wyłącznie pomocą edytora.

## Przyjęty model gry i balansu

Kampania: 5 światów, 15 kamieni milowych, 75 kroków i co najmniej 195 rund przy
pełnym, poprawnym przejściu obecnych pul. Pokrycie: Ortografia 510 słów, Angielski
500 słów, Flagi 195 państw, Czytanie 166 tekstów, Matematyka 12 umiejętności.
Matematyka idzie od dodawania do 10 i 20, przez odejmowanie, setki i mnożenie,
po działania do 1000. Pamięć pozostaje ćwiczeniem z rosnącą długością sekwencji;
nie tworzy sztucznie nieskończonej kolekcji. Kampania nie ogranicza wolnych ćwiczeń.

Krok zachowuje samodzielnie rozpoznane elementy puli. Następny odblokowuje się po
poznaniu całej puli i osiągnięciu celu poprawności w ukończonej rundzie (domyślnie
70%). Matematyka wymaga ukończenia rundy; jej umiejętności reprezentują zakresy,
a nie listę wszystkich możliwych działań. Nagrody świata: 20/30/40/50/60 iskier,
jednorazowo. Jeden Puchar pięciu światów zastępuje pięć osobnych trofeów krain.

Główny Puchar wiedzy: pierwszy element za pierwsze „Umiem”, potem 9 progów co 1/9
pełnego materiału. Dziewięć różnych ozdób można odkrywać w różnej kolejności; finał
jest wspólny. Dla Ortografii zachowany jest dotychczasowy rejestr opanowania.
Pozostałe tryby: 5 samodzielnych odpowiedzi, przynajmniej 3 dni i odstęp 7 dni.
Gwiazdki: progi 5/15/30. Trofeum: L0–L4; medal: nieodkryty/brąz/srebro/złoto.

Moce: 8 × 3 poziomy. Koszty poziomów ×1/1,6/2,5; premia ×1/1,35/1,75,
z limitem 80%; składniki ×1/2/3. Premie zwiększają iskry, nie zastępują poprawnej
odpowiedzi. Wewnętrzny portfel zachowuje precyzję milionowych części; UI pokazuje
wyłącznie liczby całkowite. Istniejące identyfikatory wypłat, reguły combo i ochrony
przed ponownym naliczeniem zostały zachowane. Dawna podstawa Pucharu wiedzy migruje
bez ponownego odbierania; dawne trofea i osiągnięcia pozostają w danych profilu.

## Grafiki i zakres lokalny

W lokalnej bibliotece jest 5 map krain, 5 skrzyń zamkniętych i 5 pasujących otwartych.
Dodatkowo uzupełniono cztery brakujące ilustracje słów: wieża, dach, chata i chrzan.
Każde słowo ma oddzielny plik 1254 × 1254 WebP poniżej 256 000 B. Wszystkie pliki
mają sumy SHA-256 w indeksie. Materiały przechodzą bibliotekę → indeks → lokalne HTTP
→ rzeczywiste PWA. Binarne pliki assets/managed pozostają poza commitami aplikacji.
Nie publikowano tych grafik ani wersji gry do zewnętrznego CDN/Preview/produkcji.
Przyszłe wydanie wymaga zwykłej publikacji lokalnie przygotowanych plików biblioteki.

Rozgrywka zachowuje stabilny kadr pionowy skalowany proporcjonalnie na desktopie.
Wyniki, kuźnia, kampania i narzędzia Studio korzystają z elastycznego układu tabletu
lub desktopu. Zdjęcia mają zachowane proporcje i miękkie maski. Zoom gestem blokowany
jest wyłącznie w telefonicznym PWA; normalna przeglądarka zachowuje swoje powiększenie.

## Dowody odbioru

- Logika: tests/adventure.test.mjs — kwalifikacja nagród, kategorie, zapis raz,
  poziomy mocy, zachowanie portfela, pokrycie i uruchomienie wszystkich 75 pul.
- 50 realnych kontraktów; 100 sprawdzeń telefon/desktop. Cache pochodzi z tych
  rzeczywistych rendererów, nie z oddzielnych makiet.
- E2E w izolowanej przeglądarce: Home → kampania → 5 trybów → zapis → odblokowanie
  → reload; odebranie medalu sliderem, animacja i ponowny odczyt nagrody z profilu.
  Dla czasu testu użyto jawnych, skróconych pul; pełne pule sprawdza test modelu.
- Studio: przeciągnięcie kamienia → lokalny zapis → odczyt pliku PWA → undo;
  wyjątek etykiety Stolic → zapis → priorytet zieleni; slider → nowy kraj i cel zapisu.
- Edycja ekranów: prawdziwy gest przesunięcia i skalowania narożnikiem, siatka,
  względne dane po zapisie oraz cofnięcie obu zmian.
- Audyt 195 krajów: 88 z co najmniej jedną niewidoczną nazwą lub flagą sąsiada.
  Są wskazane w Validatorze, zamiast pozornie oznaczać wszystkie mapy jako kompletne.
- Zapis Studio może rozwijać stare parametry do nazwanych zachowań. Testy edycji
  parametrów używają wspólnego resolveBehaviorConfig, więc sprawdzają obie postacie.
- Emulacja lokalna nie jest testem fizycznego iPhone'a ani systemowego paska iOS 27.


## Wynik końcowego sprawdzenia lokalnego

19.10.2026: 457/457 testów logiki; kontrakty 50 widoków × telefon/desktop =
100/100 sprawdzeń. Kampania: pięć rzeczywistych rund, utrwalony postęp po
przeładowaniu i odbiór nagrody; bez błędów przeglądarki. Zapis Studio obejmuje
rzeczywiste pliki lokalnego PWA, a testy przywróciły wszystkie próbne zmiany.

Grafiki: 19/19 plików HTTP 200, zgodna wielkość i SHA-256 (łącznie 4 626 212 B).
Cztery uzupełnione ilustracje słów dekodują się w rzeczywistym rendererze PWA
w rozmiarze 1254 × 1254. Audyt bazy: 510 unikalnych słów, brak brakujących grafik.

Raporty robocze: .design-qa/v42-unit.log, v42-compiled-contracts/verified.json,
v42-e2e/report.json, v42-studio/report.json, v42-studio/editor-report.json,
v42-ui/assets-report.json, v42-studio/final-report.json i v42-maps/coverage.json. Zrzuty do odbioru znajdują się
również w outputs/v42 obok kopii pierwotnych pięciu kalibracji użytkownika.

Granice odbioru: testowano lokalny build w Chromium, telefon 390 × 844 i desktop.
Nie potwierdzano systemowego obszaru iOS 27 ani fizycznego Safari. Audyt etykiet
jawnie wskazuje 88 krajów wymagających korekty widoczności przynajmniej jednego
sąsiada — mechanizm oznaczania działa, nie jest to deklaracja ręcznego dopracowania
wszystkich 195 map. Publikacja zewnętrzna nie była częścią tego etapu.


Sprawdzono także pełną animację bez reduced-motion: dwa podbicia skrzyni,
zmianę na otwarte wieko, wyłonienie medalu oraz aktualizację karty za dialogiem.
Trzy poziomy podglądu mocy mają rosnący efekt. Wykucie aktualizuje model i kartę.
Szkic przeglądarki z v41 zachowuje przy zapisie nowe grafiki i kampanię v42.
Wybór ozdób Pucharu wiedzy zachowuje rzeczywistą kolejność i kończy się kompletem
wszystkich dziewięciu ozdób; nie jest tylko dekoracyjnym wyborem w oknie.
