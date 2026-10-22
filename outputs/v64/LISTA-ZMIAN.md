# Wersja lokalna v64 — 22.10.2026

Gałąź: `work/campaign-book-cast-v64`. Zakres tej wersji odpowiada ostatniej liście uwag o kampanii, księdze, ekranie startowym, dalszych postaciach i pliku postępu.

## Gotowe do obejrzenia

- [x] Kafel kampanii ma dwa połączone, zaokrąglone schodki. Duży napis **KROK 1–15** wypełnia górny; drugi mieści tytuł zadania w 45% szerokości kafla. Opis fabularny ma miejsce na 3–4 wiersze. Główne narożniki zachowują promień 24 px, mniejsze schodki mają wspólny promień 16 px.
- [x] Portal ma napis **TELEPORT**, osobny tytuł przejścia, przedmiot i wyraźny animowany przycisk wejścia do kolejnego świata.
- [x] Dolna pozycja kafla i kamera mapy pozostają stałe. Powrót z księgi zachowuje pozycję i wielkość mapy.
- [x] Wejście do księgi uruchamia wyłanianie tekstu po zakończeniu przejścia ekranu. Przygotowana strona pozostaje niewidoczna do rozpoczęcia animacji. Zmiana rozmiaru podczas wejścia nie przerywa pisania.
- [x] Napis **Rozdział** i nazwa krainy są o 30 px wyżej, pomiędzy ornamentami papieru. Dodatkowe znaki przy rozdziale zostały usunięte.
- [x] Przycisk zaginionego przedmiotu ma osobną wygenerowaną oprawę: karminowa emalia, złocone średniowieczne ornamenty, jasny środek na nazwę. Pełny spis 15 kroków mieści się na stronie.
- [x] Gwiazda iskier na starcie jest większa o 30%, wyrównana do osi ikony Nagrody i ma miękki świetlisty cień.
- [x] Licznik zachowuje animację przeliczania. Rozmiar cyfr wynika z faktycznej szerokości napisu **Twoje Iskry Mocy**: trzy cyfry zajmują tę samą szerokość. Większe liczby dopasowują się do dostępnego miejsca.
- [x] Postęp kuźni ma grubszy tęczowy łuk 270° z przerwą u dołu, oddzielony od kowadła. Usunięty pionowy rozdzielnik.
- [x] Podpis świata: **Dziś poznajesz …**.
- [x] Wygenerowano i podpięto 12 portretów gospodarzy dla sześciu dalszych światów: Talia, Oru, Brum, Luma, Neri, Tym, Nova, Orbit, Aurel, Celina, Runa i Koral. Nowe ujęcia zachowują tożsamość postaci. Ekrany dialogów nadal korzystają ze swoich dedykowanych póz.

## Import etapów kampanii

Plik: `etapy-kampanii.json` w tym katalogu. Zawiera **19 scenariuszy**, od pierwszego wejścia, przez flagi i spotkania z NPC, po portal oraz finał.

1. W lokalnym PWA otwórz **Ustawienia → Importuj**.
2. Wskaż plik, wybierz etap i potwierdź import.
3. Wybierz profil **Wędrowca**.

Każdy scenariusz używa tego samego identyfikatora profilu demonstracyjnego. Kolejny import zastępuje jego postęp. Potrzebne jest jedno wolne miejsce z trzech dostępnych profili. Import scenariusza zachowuje aktualne ustawienia gry. Zwykłe kopie danych nadal działają tak jak wcześniej.

Scenariusze obejmują także powrót po rundzie z prezentacją gwiazdek, pierwsze flagi, obu NPC każdego dalszego świata, złożony przedmiot i zakończenie opowieści. To dane demonstracyjne, nie zapis rzeczywistych wyników nauki.

## Sprawdzone lokalnie

- Chromium i WebKit, widok 390 × 844: ekran startowy, dwa schodki kafla, wejście do księgi, spis treści i przedmiot, powrót z niezmienioną mapą.
- Rzeczywisty import przez ustawienia, ponowny import do tego samego profilu i uruchomienie flag z kampanii — w obu silnikach.
- Flagi, Państwa, Stolice — w obu silnikach: błędna odpowiedź, mapa, oddalenie, etykiety sąsiadów, zmiana wysokości okna, slider, kolejne zadanie i poprawna odpowiedź. Bez błędów skryptów.
- Pięć zmienionych widoków w kontraktach Studio/PWA na telefonie i desktopie: 10 kontroli, zero błędów. Rejestr nadal zawiera 54 widoki.
- Wszystkie 12 nowych portretów załadowane w rzeczywistym ekranie startowym. Cały spis 15 wpisów mieści się bez scrolla; dodatkowa kontrola księgi na rozmiarze iPada 820 × 1180.
- Pięć istniejących testów kopii danych przeszło. Pakiet 19 scenariuszy przechodzi walidację; błędne i puste dane są odrzucane.
- Kompilacja lokalna i kontrola zmian bez błędów. Raporty: `checks.json`, `checks-full.json`, `final-smoke.json`, `flags-report.json`, `verification.json`.

To sprawdzenie w przeglądarkach lokalnych i emulowanych rozmiarach. Nie obejmuje fizycznego iPhone’a ani pomiaru GPU telefonu.

## Podglądy i grafiki

- PWA: http://127.0.0.1:8874/
- Design Studio: http://127.0.0.1:8874/design-system/#campaign-lab
- Widok startowy: http://127.0.0.1:8874/?studio=1&screen=home&state=story&viewId=home-story&homeCompleted=0
- Portrety: `home-cast-contact.png`; dokładne prompty i oryginały generacji: `generation.json`; metadane: `assets.json`.

13 nowych grafik zajmuje razem 2 409 716 B w WebP, z przezroczystością. Lokalne pliki są zapisane w bibliotece i podpięte do indeksu. Binarne obrazy pozostają poza commitem aplikacji. Ta wersja nie była publikowana na Vercelu. Zastany szkic użytkownika w Design Studio pozostał zachowany.
