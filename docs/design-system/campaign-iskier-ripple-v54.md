# Kampania v54 — przewodnicy, dymki i wyraźniejsza rzeka

Zakres: lokalna gałąź `work/campaign-iskier-ripple-v54`, oparta na v53.
53 kontrakty widoków (w tym osobny Portal Światów). Bez publikacji zewnętrznej.

## Realizacja uwag

- [x] Wybrany wariant D z księgą jest Iskierką; nowy Iskier zachowuje materiały,
  paletę, skrzydła i księgę, ma własną twarz i sylwetkę. Dobór według awatara.
- [x] Cała postać nad powitaniem. Dialogi kroków mogą wejść z lewej, prawej albo
  z wychyleniem. Klasyczny graficzny dymek ma widoczny ogonek do postaci.
  Treść, przycisk i grafika pozostają osobnymi częściami wspólnego renderera.
- [x] Imię i znane formy gramatyczne przewodnika zgadzają się w dialogu i księdze.
- [x] 14 NPC: dwie postacie w każdym świecie. Spotkania po krokach 8 i 13
  są częścią rzeczywistej kampanii i księgi. Biblioteka pozwala wywołać każde
  spotkanie osobno, bez przechodzenia rozgrywek.
- [x] Próbka combo: jeden wspólny cień, wybór spośród trzech posiadanych mocy,
  rezerwacja jednego ładunku, następne przykładowe zadanie, rzeczywista premia
  i grafika mocy, gratulacje, powrót na mapę. Używa `reserveChosenPower` oraz
  `answerReward`. Nie zmienia profilu dziecka. Obecne moce działają na jedną
  odpowiedź; nie dodano nieuzgodnionej ekonomii wieloturowej.
- [x] Rzeka: domyślnie 80% odkrycia w rdzeniu, 55% w pierwszym pierścieniu,
  30% w drugim. Osobny suwak brzegu. Usunięto nadmierne krycie tymczasowego
  kalejdoskopu, które ukrywało efekt mimo dużej wartości suwaka. Rdzeń i dwa
  pierścienie falują sekwencyjnie i powoli wracają. Stan odkryć nie zmienia się.
- [x] Zachowano dwupolowy odstęp między rdzeniami oraz limit 384 fragmentów
  razem z halo. Oddzielna warstwa światła działa niezależnie.
- [x] Dokładnie jedno aktywne pole: złote przy najdalszym kroku albo srebrne
  przy powtórce. Mocniejsza promienność. Zmiana zaznaczenia wysyła 150 drobin
  po spokojniejszym łuku. Postać pozostaje na najdalszym kroku i nad efektem.
- [x] Portal: przerwanie zmianą kroku usuwa canvas, stan podróży i stare zadania
  animacji; można od razu spróbować ponownie. Zabezpieczenie generacji sceny
  uniemożliwia starej animacji nadpisanie nowego położenia lub przezroczystości.
- [x] Kosmiczny przycisk „Następny świat” wyraźnie przewodzi nad powtórką.
  Ma własne światło, drobiny i spokojny ruch, bez animacji wyzwalanej hover.
- [x] Tester ma wybór wejścia postaci, NPC, gratulacje i cały przepływ combo.
  Używa tego samego dokumentu i renderera co PWA.

## Koszt i weryfikacja

Ruch ma twarde limity: maksymalnie 384 fragmenty rzeki, 150 drobin zaznaczenia,
300 drobin portalu; drobiny mają skończony czas życia i sprzątają canvas.
Pauza widoczności oraz reduced-motion pozostają aktywne. Obraz mapy, główna
mgła i nawigacja nie zmieniają geometrii podczas efektów.

Dowody w `.design-qa/v54/`. Pomiary rAF na Macu nie są pomiarem GPU telefonu.
`xctrace list devices` pokazał fizyczny iPhone jako offline. Procent GPU,
energia i dłuższa sesja fizycznego iPhone 13 Pro nie zostały zmierzone.
Szczegóły pomiarów przeglądarkowych i ograniczenia są w raporcie wydajności.

## Grafiki

Lokalna biblioteka: `design-system/assets.json`, rewizja 40. Iskierka i Iskier
768×768, odpowiednio 116 328 B / 122 112 B; Mira 512×768, 87 354 B.
Prawdziwa alfa, WebP, niezmienne hashe. Oryginały i prompty zachowane w
`outputs/v54/` katalogu zadania. Binariów nie dodajemy do commitów aplikacji.
Przed zewnętrznym wydaniem potrzebna jest osobna publikacja biblioteki.

## Dopisane korekty w trakcie pracy

- [x] Przygaszenie jest łagodne i kończy się **przed** przeskokiem do nowego
  pola. Postać oraz dymek wchodzą po przygaszeniu. Dialog i gwiazdki nadal
  współdzielą jeden cień, bez dodatkowego mignięcia między nimi.
- [x] Numery dostępnych pól są małe, przygaszone, położone w izometrii;
  zaznaczenie ma inny kolor. Numery przyszłych pól pozostają pod mgłą.
- [x] Kafel ma frosting `rgba(255,255,255,.67)`, blur 11.8px, jasny obrys
  i cień. Zadanie z uruchomieniem ma własny wewnętrzny kafel.
- [x] Większa księga na okrągłym graficznym medalionie w prawym górnym rogu.
  Pięć tłoczeń na gwiazdki jest widoczne także przed pierwszą próbą
  (ta nowsza uwaga zastępuje wcześniejsze ukrywanie pustego rzędu).
  Gwiazdki po rundzie lądują w tych samych miejscach.
- [x] Teleport pola: zwinięcie obwódki do punktu → skok po łuku → rozciągnięcie
  po wylądowaniu → uformowanie obwódki na docelowej płycie i odsłonięcie postaci.
  Mapa pozostaje nieruchoma. Nowe grupy kafla są jawne w kontraktach Studio.

## Porównanie wydajności przed / po uproszczeniu warstw

Przy zachowanej sile rzeki każde szkiełko ma teraz jedną gotową teksturę,
ponieważ stała mgła już dostarcza stan początkowy. Nie potrzeba drugiej
poruszającej się kopii tego samego fragmentu.

12 s na scenariusz, osobno Chromium i WebKit na Macu, 390×844 / DPR 3:

| Pomiar | Przed | Po |
| --- | ---: | ---: |
| Chromium, maksymalny wariant, rAF/s | 43.53 | 60.06 |
| Chromium, domyślny wariant, główny wątek | 29.44% | 22.46% |
| Chromium, maksymalny wariant, główny wątek | 44.90% | 35.96% |
| WebKit, domyślny wariant, rAF/s | 59.71 | 59.94 |
| WebKit, maksymalny wariant, rAF/s | 59.81 | 59.95 |

Nie są to procenty GPU ani wynik fizycznego iPhone. Losowe ścieżki dają
nieco inną liczbę fragmentów między próbami. Wszędzie stała geometria,
bez przerw ponad 100 ms w tych pomiarach. Pamięć widocznych canvasów po
optymalizacji: maks. około 8.5–9.3 MiB, bez kopii roboczych, zdjęć, pamięci
silnika i kopii kompozytora; to dolna część kosztu, a nie pełny RAM/GPU.
Raporty: `.design-qa/v54/performance-before/` i `performance-after/`.


## Studio i podglądy kart

- Zwarte stanowisko pracy: stała wysokość desktopu, bez poziomego przewijania
  dokumentu przy 1024, 1366, 1440 i 1920 px. Narzędzia są grupowane w zwijane
  sekcje, których stan i przewinięcie są zachowywane.
- Podgląd telefonu ma nadal 390 × 844 wewnątrz iframe. Dopasowywana jest tylko
  zewnętrzna ramka, bez pomniejszania mapy wewnątrz telefonu.
- Na szerokim ekranie tester i mgła są osobnymi panelami. W węższym oknie
  przełącznik pokazuje wybrany panel. Rozmieszczenie pól nadal wymaga sesji
  roboczej, zatwierdzenia lub odrzucenia, z cofaniem i ponawianiem.
- Kuźnia, medale i Puchar wiedzy mają rzeczywistą wybraną kartę, stan wymagań,
  poziom, ponowne wejście liczników i faktyczny odbiór / ulepszenie w symulacji.
  Wszystkie osiem mocy można obejrzeć oddzielnie. Profil dziecka nie jest zapisywany.
- Regulacja efektu zmienia istniejącą warstwę. Nie przebudowuje karty i nie
  restartuje animacji przy każdym ruchu suwaka. Pętle mają zgodne końce,
  a efekt elektryczny nie używa skokowej interpolacji. Poza ekranem, po ukryciu
  karty lub przy reduced-motion efekty pozostają wstrzymane.

## Księga i opowieść

- Czytelny kaligraficzny Charm 400/700 z pełnymi polskimi znakami. W buildzie
  usunięto błąd odrzucający ten font; QA sprawdza rzeczywiście załadowane kroje,
  a nie samo `document.fonts.check`, które potrafi zaakceptować fallback.
- Nowy pergamin, złoto-turkusowy ornament, inicjał i zdobienia rozdziału.
  Przewijanie pozostaje dostępne. Poprzedni/następny fragment, spis i rozdziały
  uruchamiają skończony efekt rozproszenia atramentu i budowania tekstu.
  Maksymalnie 420 drobin na jednym canvasie; pauza po ukryciu i pełne sprzątanie.
- Nowy fragment nadal odsłania się linijka po linijce. Szybkie zmiany fragmentów
  anulują wcześniejszą choreografię i zachowują bieżącą przezroczystość, bez błysku.
- Każdy świat ma własny przedmiot z trzema częściami zdobywanymi przy 5/10/15:

| Świat | Przedmiot | Prowadzi do |
| --- | --- | --- |
| Port | Klucz zielonego szlaku | Dżungla |
| Dżungla | Latarnia kryształów | Podziemia |
| Podziemia | Kwiat księżyca | Kraina świetlików |
| Świetliki | Gwiezdne astrolabium | Kosmos |
| Kosmos | Lira wiatrów | Niebiosa |
| Niebiosa | Muszla przypływów | Podwodne królestwo |
| Podwodne królestwo | Serce siedmiu światów | Zakończenie księgi |

- Ostatnia brama otwiera zakończenie; nie dodaje ósmego świata ani nowej waluty.
  Księga pokazuje tylko zdobyte fragmenty i spotkania.

## Modułowe nagrody

12 osobno wygenerowanych części WebP z alfą, łącznie 586 958 B: korpus i wstążka
medalu, korpus pucharu oraz dziewięć ozdób. Oryginały i dokładne prompty znajdują
się w katalogu zadania `outputs/v54/rewards` i `reward-prompty.json`.

Każdy złożony medal i puchar ma **to samo płótno 512 × 512**, oś x=256 i podstawę
y=460. Różne proporcje plików części nie zmieniają tych kotwic. Medal używa tego
samego korpusu i wstążki dla brązu, srebra i złota; zmienia się materiał. Nie ma
wycinania komórek dawnego atlasu ani cyjanowego paska przy srebrze.

Puchar wiedzy ma korpus i dziewięć dodawanych kolejno ozdób. Wybór ustala kolejność,
a wszystkie dziesięć etapów prowadzą do tego samego pełnego zestawu. Trofea
zachowują cztery poziomy i wcześniejsze wybory, ale budują się z tych samych części.
Nowy renderer jest też używany przez starsze galerie. Korpus i zdobyte ozdoby są
ponownie używane w DOM; podczas ulepszenia poruszają się wyłącznie nowe części.
Nie ma skrzyni, zmiany skali korpusu ani zmiany kadru. Po odebraniu nagrody miejsce
suwaka i komunikatu pozostaje zarezerwowane, więc okno nie przeskakuje.

Tester ma opcjonalną siatkę wyrównania. Nowa grafika jest propozycją wizualną do
oceny użytkownika; nie jest oznaczona jako zaakceptowany kierunek całej kolekcji.

## Bieżące dowody lokalne

- 509 testów jednostkowych; pełne 53 kontrakty × dwa rozmiary = 106 kontroli.
- Księga w Chromium i WebKit: realna PWA, gotowe fonty, siedem zdobytych fragmentów,
  line reveal, szybkie przerywanie przejść, spis, powrót z niezmienionym postępem,
  desktop, reduced-motion i edytor Studio.
- `workbench/report.json`: cztery szerokości desktopu, tester/mgła, osiem mocy,
  gotowa i niegotowa karta, odkrycie kontra upgrade, zachowanie DOM przy regulacji,
  zgodne końce pętli i reduced-motion, w obu silnikach.
- `cast/report.json`: 14 portretów, siedem przedmiotów i epilog; faktyczny krok 8
  wywołuje Mirę, potem gwiazdki i przejście. Treść trafia do księgi.
- `reward-parts/report.json`: geometria trzech medali i dziesięciu etapów pucharu,
  ta sama instancja korpusu przed/po ulepszeniu, jedna nowa ozdoba, brak skrzyni,
  12 plików WebP sprawdzonych przez HTTP, wspólny renderer starszych galerii.

Pełna lista korekt i rozdzielenie propozycji od gotowych funkcji: katalog zadania
`outputs/v54/LISTA-ZMIAN.md`. Publikacja biblioteki i zewnętrzny Preview pozostają
osobnym etapem. Fizyczny iPhone jest offline; emulacja WebKit nie zastępuje urządzenia.


## Ostatni przebieg kontroli

- `contracts-final/verified.json`: 106/106, bez błędów. Aktualny fingerprint
  `08658b77`, 53 widoki i 2624 elementy w pochodnym inwentarzu edytora.
- `rewards-pwa/report.json`: cztery pełne przypadki, Chromium/WebKit × telefon/
  desktop. Prawdziwy profil gościa → Moje wyniki → posiadany brąz → srebro,
  bez skrzyni. Kontrakt okna zawiera nagrodę, a zapis trafia do profilu i karty.
- `reward-gallery/report.json`: anulowanie i błąd zapisu nie przyznają nagrody;
  poprawny zapis przyznaje brąz i srebro dokładnie raz; osiem kart kuźni.
- `assets-final.json`: 39 nowych lokalnych assetów (37 grafik i dwa fonty),
  3 275 704 B. Hashe, rozmiary oraz wymiary zgodne z katalogiem. Każda część
  nagrody ma prawdziwą alfę. Ozdoby pucharu to 586 958 B z tej sumy.

Końcowe 8 s na scenariusz na Macu (390 × 844, DPR 3, bez równoległego QA):

| Silnik | Wariant | rAF/s | Najdłuższa przerwa | Główny wątek Chromium |
| --- | --- | ---: | ---: | ---: |
| Chromium | Domyślny | 60.07 | 18.7 ms | 23.58% |
| Chromium | Maksymalny | 60.00 | 34.6 ms | 42.37% |
| WebKit | Domyślny | 59.81 | 41 ms | — |
| WebKit | Maksymalny | 60.06 | 32 ms | — |

We wszystkich czterech próbach brak zmiany geometrii i przerw ponad 100 ms.
Losowe trasy zmieniają koszt między próbami; wynik nie jest gwarancją stałego FPS.
Widoczne bitmapy canvasów zajęły maks. około 8.4–9.1 MiB. Nie obejmuje to zdjęć,
tekstur roboczych i pamięci kompozytora. Procent głównego wątku nie jest użyciem GPU.

Dwa kroje księgi (łącznie 35 956 B) są w starterze offline. Starter ma 30 plików, 2 767 032 B; ilustracje nagród pozostają na żądanie. Nieudane pobranie fontu kończy się czytelnym fallbackiem zamiast zatrzymania montowania księgi.
