# Pełny ekran kampanii i prostsze Studio v46

Baza: `bb10534`. Lokalna gałąź: `work/campaign-viewport-v46`.
Zakres: naprawa pomniejszonej kampanii, wejście do kampanii w edytorze,
uporządkowanie narzędzi i osobny panel odkrywania mapy.

## Wymagania i wykonanie

- [x] Kampania wypełnia widok urządzenia w Edytuj ekran, po wejściu przyciskiem
  ze strony głównej oraz w obu zakładkach narzędzia kampanii. Kontener ekranu
  jest chroniony przed przypadkowym skalowaniem/przesunięciem; mapa i jej
  elementy pozostają edytowalne.
- [x] Zapisana geometria pomniejszająca sam ekran kampanii jest usuwana przy
  odczycie szkicu i w runtime PWA. Oryginalne ustawienia konfiguracji trafiają
  do lokalnej kopii `.campaign-viewport-backup`. Pozostałe edycje szkicu,
  rozmieszczenie pól, kryteria, grafiki i profile są zachowane.
- [x] Rozmiar wewnętrznego widoku iframe jest ustalany z jego rzeczywistej
  wysokości. Zmiana szerokości panelu skaluje całą ramkę proporcjonalnie,
  bez dodatkowego pomniejszenia zawartości w jej środku.
- [x] W Edytuj ekran jest wybór ekranu po nazwie i bezpośredni przycisk
  Kampania. Wskazywanie oraz przesuwanie to dwie widoczne opcje; pozostałe
  narzędzia, dawna nawigacja kategoriami i porównanie wzorca są zwijane.
  Wyszukiwanie elementów jest przy hierarchii.
- [x] Przejście Home → Kampania aktualizuje wybrany ekran, jego hierarchię
  i inspektor. Asynchroniczne zakończenie montowania mapy uruchamia kontrakt
  i powiadamia Studio, zamiast pozostawiać wybór ekranu Home.
- [x] Osobny panel Mgła i odkrywanie jest na prawo od testera. Udostępnia
  niezależne włączniki, kształt, gęstość, obrót, siłę mgły, zasięg i pola do
  przodu; czasy animacji są w rozwijanej sekcji. Suwaki reagują podczas
  przeciągania, bez oczekiwania na puszczenie. Jeden gest daje jedną zmianę Undo.
- [x] Podgląd siatki fragmentów jest opcją samego testera, nie ustawieniem gry.
  Na wąskich ekranach oba panele przechodzą pod pełny podgląd.
- [x] Odwiedzone otoczenie, teren z tyłu i poznane boki są odsłaniane szerzej
  i monotonicznie. Daleka droga przed postacią pozostaje zakryta. Cofnięcie
  testera pozwala obejrzeć wcześniejszy stan; pole 14 nadal odsłania całą mapę.

## Weryfikacja

- 474/474 testy modelu i kontraktów.
- 50 widoków × iPhone/desktop: 100/100 kontroli kontraktu.
- Chromium i WebKit: wejście bezpośrednie, Home CTA, wybór nazwany, stary
  szkic z width/height/scale/offset, odzyskanie pełnych 390 × 844, kopia starej
  konfiguracji i zachowanie niezwiązanej edycji, panel mgły na prawo od testera,
  natychmiastowa zmiana siatki na input i zmiana szerokości okna.
- Chromium i WebKit: gesty, sesyjne Cofnij/Ponów/Odrzuć, blokada zapisu,
  akceptacja i globalne Cofnij, tymczasowa edycja trasy, wybór dowolnego pola,
  przerwanie teleportu nowym wyborem i awatar testowy.
- Rzeczywiste PWA: profil gościa → Home CTA → kampania, pełne 390 × 844,
  bez błędów JavaScript.
- Przełączanie iPhone/Desktop, zachowanie szkicu po przeładowaniu, Test PWA
  i małe okno hosta: bez błędów JavaScript.
- Po odblokowaniu Maca sprawdzono rzeczywisty szkic w natywnym Safari.
  Zawierał szerokość kontenera kampanii 0,42663 i przesunięcie pionowe 0,31556.
  Eksport przed/po potwierdził usunięcie wyłącznie tej geometrii: wszystkie
  106 kroków, 7 światów i 16 przepisów zachowano identycznie. Pozostały cztery
  zmiany szkicu; nie zapisano ich do projektu ani nie opublikowano.
- Dodatkowo poprawiono odświeżanie kampanii po nadejściu szkicu do edytora.
  Pierwszy krok zmieniony na matematykę jest taki sam w edytorze, po przejściu
  Home → Kampania oraz w testerze. Kontrola Chromium/WebKit: 12 scenariuszy,
  bez błędów JavaScript. Native Safari potwierdziło pełny ekran i panel mgły.
- Nie wykonywano sprawdzenia na fizycznym iPhonie w tym przebiegu.

Nie dodawano grafik i nie publikowano zmian na GitHub/Vercel.

Studio: http://127.0.0.1:8872/design-system/?v=46#campaign-lab
Edytor: http://127.0.0.1:8872/design-system/?v=46#components
PWA: http://127.0.0.1:8872/?v=46

Powtarzalny test przeglądarek: `tools/qa-campaign-viewport-browser.mjs`.
Dowody lokalne: `.design-qa/v46/`; kopie w katalogu zadania `outputs/v46/`.
