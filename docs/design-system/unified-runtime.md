# Jeden wygląd: Studio → testy → produkcja

Od tej zmiany zapis Studio zawiera aktywne ustawienia wyglądu. Nie ma drugiego, ukrytego kontraktu wyglądu w `project.designDraft`. Stare szkice są odczytywane przy migracji, a kolejny zapis przenosi je do wspólnej konfiguracji.

## Praca i publikacja

1. Komponenty, Animacje oraz Efekty korzystają z `design-system/config.json` i prawdziwych rendererów gry.
2. Zmiany pozostają lokalnym szkicem do użycia „Zapisz na GitHub”. Ten zapis aktualizuje `design/system-v1` i jego Preview. Nie publikuje automatycznie na `main`.
3. „Test PWA” korzysta z całego drzewa źródłowego tego commita Studio. Eksport nie podmienia silnika bańki, nie nakłada osobnego CSS i nie wybiera alternatywnego pliku konfiguracji.
4. Po testach można promować zapisany commit do produkcji. Geometria, widoczność, kolejność oraz animacje są częścią tego samego kontraktu.
5. Gdy użytkownik prosi agenta o eksport do PWA, należy użyć kontraktu i źródeł Studio oraz `optimizedTestConfig`; nie dopisywać efektów wyłącznie na gałęzi testowej.

`elementOrder[view][parent]` przechowuje identyfikatory rodzeństwa. Przeciąganie zapisuje kolejność. Tło nie jest przeciągane, elementy nie zmieniają rodziców. Przy odrzuceniu zmiany wraca pierwotna kolejność DOM. Ukrycie zachowuje miejsce (`hidden`), usunięcie z układu zwalnia miejsce (`removed`).

## Animacje i panel

Animacje mają cztery działy: Globalne, Animacje w grze, Animowane elementy, Przejścia ekranów. Dział elementów używa tego samego wyboru widoku, drzewa i podglądu co Komponenty. Grupa „Animacja tego elementu” udostępnia unoszenie, puls, kołysanie i wejście, wraz z czasem i siłą; dziedziczenie globalne/lokalne działa jak przy pozostałych właściwościach.

Przycisk odrzucenia szkicu w górnym pasku przywraca zapisane ustawienia, grafiki, zasady i kolejkę. Cofnij może odzyskać odrzucone zmiany. Koło zębate ustawia szerokość inspektora, zwartość oraz widoczne działy. `studioPreferences` trafia na GitHub razem z konfiguracją. Nie zmienia widoczności warstw gry.

## Loader i litery

Loader ma pięć kulek, dwa pełne obroty (1500 ms), rozchodzenie się form i odsłonięcie rzeczywistego ekranu. Czeka na widoczne grafiki/fonty z limitem czasu. W podglądach Studio jest pomijany; reduced-motion skraca sekwencję. Dotyczy wejścia do aplikacji i pełnych przejść między stronami trybów. Zwykłe przejścia wewnątrz widoku zachowują ustawienia par ekranów.

Kolory pobrano z `assets/brand/player-logo-3d.webp`: niebieski #0490fb (522,259), różowy #fc237a (756,268), żółty #ffbd1e (665,276), zielony #57bf45 (811,284), pomarańczowy #fe7b06 (931,249). To asset używany przy wyborze/tworzeniu gracza. Loader nie zawiera dodatkowego logo.

Hasło jest jednorazowo rasteryzowane w aktywnym foncie do mapy punktów. Punkty są grupowane w maks. 32 małe warstwy WebKit / 64 pozostałych silników. Grupy rozpadają się i składają przez krótkie transformacje WAAPI; brak fizyki i renderowania canvas w każdej klatce, brak reakcji na pointer. Czytelny tekst i jego etykieta pozostają źródłem treści. Czas, zasięg i liczba grup są edytowalne. Poprawna odpowiedź wywołuje rozpad; zmiana pytania tworzy mapę nowego hasła. Po błędzie poprawna pisownia pozostaje do przeczytania, a przejście następuje po sliderze.

## Weryfikacja 2026-10-07

- 158 testów automatycznych; build wszystkich stron.
- Dwa przeloty interfejsu: rzeczywisty ekran Efektów, suwaki, działy animacji, preferencje i odrzucenie szkicu.
- WebKit/iPhone 13: 22 s pełnej kompozycji, initial/correct/wrong/pause/resume/combo/nowe hasło; 56–61 callbacków rAF/s, najdłuższa przerwa 72 ms, brak zatrzymania i błędów JS. Tymczasowe cząsteczki znikają po animacji.
- Chromium w emulacji telefonu miał około 19 callbacków/s bez zatrzymania; nie traktujemy tego jako dowodu 60 FPS na wszystkich urządzeniach.
- Fizyczny iPhone: nie był dostępny do tej weryfikacji. Pomiar temperatury i końcowa kontrola PWA na urządzeniu pozostają przed produkcją.

Pełna diagnostyka i granice testu: `docs/ANIMATION-WEBKIT-GUIDE.md`. Źródła inspiracji: `docs/EFFECTS-INSPIRATION.md`. Nie skopiowano zewnętrznego kodu Lottie/CodePen; loader i mapy liter mają niezależną implementację.
