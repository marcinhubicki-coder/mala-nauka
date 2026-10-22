# Bezpieczna edycja i tester kampanii v45

Baza: v44 `0990c22`. Gałąź lokalna: `work/campaign-tester-v45`.
Zakres: transakcje gestów Studio, podgląd i interakcje kampanii, odkrywanie mapy.

## Wymagania i wykonanie

- [x] Sprawdzenie niezamierzonej zmiany: przed pracą Git był czysty, otwarty
  szkic Studio wskazywał „Zapisana wersja”, a zapisany kontrakt nie zawierał
  `responsiveGeometry`. Nie znaleziono zapisanego przesunięcia do cofnięcia.
  Geometria bazowa, istniejące ustawienia, kryteria i profile pozostały zachowane.
- [x] „Przesuwaj i skaluj” rozpoczyna sesję tymczasową. Gesty zmieniają wyłącznie
  podgląd. Cofnij/Ponów działają w sesji; Odrzuć, Escape lub opuszczenie narzędzia
  przywracają zaakceptowany układ. Zatwierdź tworzy pojedynczą zmianę szkicu,
  możliwą do cofnięcia głównym Undo. Przed rozstrzygnięciem sesji zapis jest blokowany.
  Pointer cancel i ruch poniżej 3 px nie zapisują geometrii. Wymiary pozostają
  proporcjami kontenera, nie stałymi pikselami urządzenia.
- [x] Rozmieszczenie pól kampanii ma analogiczną sesję roboczą z osobnym, widocznym
  paskiem akceptacji. Cofanie działa również z klawiatury wewnątrz podglądu.
- [x] W grze pozostają chłopiec i dziewczynka. Płeć awatara wyznacza postać;
  stare preferencje podróżnika w kopiach postępu nie nadpisują awatara. Z kampanii
  usunięto ikonę zmiany profilu oraz wybór podróżnika. Zapisane postępy zachowują
  kompatybilność. Tylne ujęcia 3/4 zwracają się w lewo lub w prawo zgodnie ze szlakiem.
- [x] Usunięto oba odsłonięcia całej drogi: w obliczeniach odkrywania i na canvas.
  Odsłaniane są odwiedzone okolice oraz 0–2 pola naprzód. Odkrywanie, mgła
  i kalejdoskop mają osobne przełączniki. Ostateczne odsłonięcie przy polu 14
  zachowuje poprzednią zasadę odkrycia całej mapy przed portalem.
- [x] Nawigacja testera jest po prawej od podglądu na desktopie. Dostępne są pola
  1–15, portal, poprzedni/następny krok, kamienie, odtwarzanie i zmiana świata.
  Na wąskim ekranie panel układa się pod podglądem.
- [x] Tryb testera pozwala kliknąć dowolne pole i od razu przestawić postać, wraz
  z teleportem i odkrywaniem/zasłanianiem mapy. Najnowsze wskazanie wygrywa także
  podczas animacji. Wyłączenie trybu wraca do zwykłego wybierania odblokowanych
  zadań bez zmieniania najdalszej pozycji. Symulacja nie zapisuje profilu dziecka.
- [x] Podgląd ładuje rzeczywisty dokument PWA w wybranych wymiarach urządzenia;
  CSS panelu administratora nie wpływa na grę. iPhone symuluje obszary 47/34 px,
  desktop ma obszary zerowe. Zapis lokalny nie resetuje sceny do danych fixture.
- [x] Przy wybranych krokach kamieni milowych pojawia się wskazanie możliwego
  medalu/trofeum z aktualnych przepisów. Jest to możliwość, a nie obietnica
  nagrody niezależna od jej kryteriów. Przejście portalem do kolejnego świata
  jest dostępne do sprawdzenia w tym samym podglądzie.

## Weryfikacja lokalna

- 471 testów modelu i kontraktów.
- 50 rzeczywistych widoków × iPhone/desktop: 100 kontroli kontraktu.
- Chromium i WebKit: rzeczywiste gesty drag/resize, sesyjne Undo/Redo/Reject,
  blokada zapisu, akceptacja i główne Undo, tymczasowe przesuwanie pól,
  wybór dowolnego pola, ruch wstecz, przerwanie animacji kolejnym wyborem,
  postać z awatara i wskazanie nagrody.
- Rzeczywisty zapis Studio → pliki źródłowe i zbudowane PWA → Undo → zapis.
  Pełny pierwotny config został odtworzony i porównany, nie tylko ustawienie mgły.
- Podgląd i gra: identyczna geometria sceny, mapy, postaci, nawigacji i karty
  przy 390 × 844 z symulowanymi obszarami PWA. Porównanie centralnego obrazu
  po usunięciu wpływu skalowania ramki: średnia różnica 0,13/255; 0,24% składowych
  pikseli różni się o więcej niż 12. Nie jest to deklaracja identyczności rastera.
- Zwykła runda Ortografii z niezmienionej puli: zapis kroku, widoczny teleport
  po wyniku, odtworzenie postępu i postaci po przeładowaniu.
- Nie wykonano w tym przebiegu testu na fizycznym iPhonie / iOS 27.

Nie generowano nowych grafik: wykorzystano zaakceptowane tylne ujęcia z v44.
Nie wysyłano kodu ani grafik na GitHub lub Vercel.

Studio: http://127.0.0.1:8872/design-system/#campaign-lab
PWA: http://127.0.0.1:8872/
Raporty: `.design-qa/v45/`, kopie wyników w katalogu zadania `outputs/v45/`.
