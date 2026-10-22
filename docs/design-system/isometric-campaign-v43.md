# Kampania izometryczna v43

Baza: lokalna v42, `7a0dbac`. Gałąź: `work/isometric-campaign-v43`.
Zmiana pozostaje lokalna; kod i binarna biblioteka nie były publikowane.

## Lista zmian

- [x] Ekran gracza: nazwa krainy, siedem ikon, mapa, postać i krótki przycisk rundy.
  Bez planu świata, kryteriów, opisów administracyjnych i przewijania.
- [x] Siedem bogato ilustrowanych map w stałej perspektywie: port, dżungla,
  podziemia, kraina świetlików, kosmos, niebiosa i podwodne królestwo.
- [x] Każdy świat: start, 15 pól i trzy kamienie milowe po krokach 5/10/15.
  Płyty i portal są częścią ilustracji. Przezroczyste obszary interakcji nie
  zastępują ich przyciskami z cyframi. Nad portalem pozostaje zapas kadru.
- [x] Trzy osobne postacie z przezroczystością: chłopiec, dziewczynka, czarny konik.
  Domyślna postać wynika z wyglądu wybranego awatara, bez wnioskowania z imienia.
  Wybór można zmienić przyciskiem postaci; zapis jest osobny dla każdego profilu.
- [x] Teleport: płaski pierścień schodzi nad postacią do podłogi, postać znika,
  pierścień pojawia się na kolejnym polu i unosząc odsłania postać. Stała skala,
  brak przechodzenia pod elementami scenerii; reduced-motion pomija ruch.
- [x] Udana runda przesuwa o jedno pole. Zachowane próg poprawności, czas/liczba
  zadań, zapis postępu i jednorazowe nagrody światów.
- [x] Pierwsza kampania: „Rozpocznij kampanię”; później „Twoja kampania”. Większe
  CTA bez ikony ma organiczną ramkę i przechodzące światło. Obszar kliknięcia
  pozostaje nieruchomy. Pozostałe kafle są mniejsze, tekst i ilustracja wyżej.
- [x] Skrzynia tylko przy odkryciu. Ulepszenie pokazuje przemianę istniejącego
  medalu lub pucharu. Kolejność ozdób Pucharu wiedzy jest trwała; pełny finał
  wygląda jednakowo niezależnie od kolejności wyborów.
- [x] Medale mają ścisły wewnętrzny kadr SVG. Zapobiega to pokazaniu turkusowego
  paska z arkusza srebrnych medali również przy innych proporcjach kontenera.
- [x] W kuźni przywrócono cztery wcześniejsze ilustracje mocy i dodano cztery
  pasujące grafiki. Karty gracza mają krótszy opis i zwijane wymagania.
- [x] Studio zachowuje pełne kryteria, symulację, balans i edycję. Opcja siatki
  pokazuje 15 uchwytów pól. Drag zapisuje współrzędne na siatce, a undo i zapis
  lokalny przywracają dane. Siatka i uchwyty nie trafiają do widoku gracza.

## Postęp i zgodność danych

Plan v2 ma 7 światów, 21 kamieni milowych i 105 kroków. Zachowuje identyfikatory
pierwszych 75 kroków v42 oraz zdobyte nagrody, własne przepisy i postępy profili.
Stary szkic Studio uzupełnia się o nowe światy i grafiki bez utraty edycji.
Ręczne kalibracje map geograficznych i wspólne ustawienia trzech wariantów Flag
pozostają zachowane.

Kampanię można przejść w 105 udanych rundach. Pule obejmują cały dostępny materiał,
ale pojedyncza wyprawa pokazuje tylko wylosowane zadania danej rundy. Pełne „Umiem”
i Puchar wiedzy wymagają ćwiczeń i powrotów w kolejnych dniach. Studio rozróżnia
materiał dostępny w pulach od możliwych odkryć przy pierwszym przejściu.

## Grafiki

Wbudowane imagegen: 7 map, 7 ikon światów, 3 postacie, 4 brakujące ilustracje mocy.
Łącznie 21 nowych WebP, 4 457 148 B. Mapy 1080 × 1350, postacie/moce 512 × 512,
ikony 256 × 256. Przezroczystość jest zachowana. Pliki biblioteki są ignorowane
przez Git; commit aplikacji zawiera ich indeks i sumy SHA-256.

Źródła, końcowe prompty, siatka i kopia biblioteki są w lokalnym katalogu
`/Users/marcin/Documents/Codex/2026-10-16/moze/outputs/v43/`.
Kod korzysta z `shared/isometric-assets.mjs`; każdy nowy plik przeszedł indeks →
lokalne HTTP → dekodowanie w rzeczywistym PWA. Nie wykonywano publikacji CDN.

## Sprawdzenie

- Testy modelu: siedem krain, 105 niepustych pul, ruch po udanej rundzie,
  idempotencja nagród, migracja v42 i wspólny finał ozdabiania Pucharu wiedzy.
- Chromium i WebKit: teleport w dół/w górę; odkrycie medalu w skrzyni,
  potem brąz → srebro → złoto bez ponownego otwierania skrzyń.
- Kampania bez przewijania: 320×568, 390×844, 768×1024, 1024×768, 1440×900.
- Prawdziwe rundy pięciu trybów, zapis postaci, odblokowanie kroku i odczyt
  po przeładowaniu. Testy uruchomiono w izolowanych profilach przeglądarki.
- Studio: przeciągnięcie pola → lokalny plik PWA → undo → zapis; próbne zmiany
  zostały cofnięte. Starszy szkic zachowuje 21 nowych grafik i plan siedmiu światów.
- 50 kontraktów widoków na telefonie i desktopie. Fizycznego iPhone'a ani
  systemowego obszaru iOS 27 w tym przebiegu nie weryfikowano.

Końcowe wyniki lokalne: **463/463 testy**, **100/100 kontraktów** na zbudowanym PWA,
21/21 grafik z poprawnym HTTP, SHA-256 i dekodowaniem. Test pięciu trybów używał
kontrolowanych pul w izolowanym profilu; osobny test przeszedł zwykłą rundę
dziesięciu zadań z pełnej puli Ortografii, zapis, teleport, przeładowanie i
odkrycie medalu bez błędów. Chromium i WebKit sprawdziły oba etapy teleportu
oraz odkrycie i dwa kolejne ulepszenia medalu. Końcowe zrzuty pokazują załadowane
ilustracje, czysty kadr srebra i siatkę Studio.

Artefakty: `.design-qa/v43/` (raporty) oraz `outputs/v43/` katalogu zadania
(zrzuty, prompty i kopia biblioteki). Lokalne adresy: PWA `http://127.0.0.1:8872/`,
Studio `http://127.0.0.1:8872/design-system/#adventure`.
