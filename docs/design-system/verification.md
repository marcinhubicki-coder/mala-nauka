# Weryfikacja

Końcowy przegląd wykonano 4 października 2026 dla implementacji `003a135c04089bcb0f906430903afef1881f2f39`. `npm test` zbudował 15 stron i zakończył się wynikiem **57 / 57**. Zmiany powstały w trzech rundach, z kontrolą rzeczywistych ekranów w przeglądarce po każdej rundzie.

## Trzy rundy

| Runda | Scenariusz użytkownika | Potwierdzenie |
| --- | --- | --- |
| 1 · Elementy i widoki | „Chcę zmienić jelly i zobaczyć skutki w innych ekranach” | Wybór po widoku i elemencie, podświetlenie rzeczywistego kontrolera, Kategorie jako żywy stan, suwaki i dwa nieskalowane ekrany |
| 2 · Wspólna treść i grafiki | „Chcę poprawić jedną zasadę oraz sprawdzić współdzieloną ilustrację” | Zmiana zasady widoczna przy wózku i stole; scalenie dwóch ilustracji obejmuje wszystkie pięć użyć; Cofnij przywraca bazę |
| 3 · Warstwy i ruch | „Chcę zobaczyć układ bez elementu oraz spokojnie obejrzeć przejście” | Ukrycie zachowuje 54 px; usunięcie daje 0 px i reflow; pojedyncze odtwarzanie kończy się; pętla przechodzi w obu kierunkach i zatrzymuje się |

## Wyniki

| Kontrola | Wynik |
| --- | --- |
| Build kanoniczny | 918 plików, 15 stron, 678 kanonicznych assetów |
| Testy Node | **57 / 57**: gry, profile, reguły, baza, komponenty, konflikt i zapis Git, porównanie oraz animacje |
| Baza słów | **455 / 455** ilustracji rozwiązuje się do istniejącego pliku; 41 wspólnych zasad; 51 współdzielonych grafik |
| Dawne duplikaty | Wszystkie 28 aliasów wskazuje istniejący plik |
| Wybór po widoku | Ortografia pokazuje pięć występujących rodzin; „Pokaż pozostałe” dodaje siedem wyłączonych rodzin |
| Wybór i nazwa | Przełącznik jelly pozostaje wybrany po wczytaniu; zmiana nazwy aktualizuje pastylkę, inspektor i listę instancji; Cofnij odtwarza nazwę |
| Stan Kategorie | Po zmianie wysokości i przywróceniu wartości nadal zaznaczony; rozwinięte grupy pozostają w ekranie |
| Suwak i zapisany punkt | 54 → 62 daje rzeczywistą wysokość 62 px; znacznik i podpis nadal wskazują zapisane 54 px; przywrócenie wraca do 54 |
| Porównanie | Dwa iframe mają 390 × 844, `transform: none` i tę samą współrzędną Y w szerokim układzie |
| Dopasowanie telefonu | W przeglądarce wykryto kolizję: obliczone 0,517 było zasłonięte starą skalą 0,699. Poprawka używa osobnej zmiennej i przechodzi build oraz 57 testów; ponowne sprawdzenie wizualne tej ostatniej poprawki zablokowała kontrola dostępu |
| Wspólna zasada | Jedna świadoma edycja zasady „Ó wymienia się na o” obejmuje 27 słów; sprawdzono wózek i stół; indywidualne przykłady zachowane |
| Trwałość zasad | Próbna treść przetrwała odświeżenie; „Wersje i szkice” pokazuje zmianę po polsku; odrzucenie odtwarza bazę |
| Wspólna grafika | Królik/puchaty/śmiech oraz burza/grzmot po scaleniu wskazują jeden aktywny asset; Cofnij przywraca przypisania |
| Analiza wielu grup | „chrzanić” wykrywa ch/h, rz/ż, ń/ni i ć/ci; nie dodaje słowa do bazy ani nie zmienia odpowiedzi w grze |
| Warstwy | Ukrycie zachowuje pozycję i wysokość; usunięcie zwalnia miejsce; przywrócenie odtwarza element |
| Animacje | Start → Ortografia: Play zakończony, Loop z przerwą 500 ms zmienia oba ekrany, Stop przywraca przycisk Play |
| Pomoc | Scenariusz zasad otwiera bazę zasad; scenariusz porównania wybiera Ortografię i Angielski |
| Konflikty | Scalenie niezależnych zmian i wybór każdej sprzecznej wartości objęte testami, w tym nazwy plików z kropkami i usunięcie obiektu |
| Git | Kontrolowany transport potwierdza jeden atomowy commit konfiguracji, zasad, grafik i uploadu; wcześniejszy i późniejszy równoległy commit blokują nadpisanie |
| 6 konsumentów | Aktualny build zawiera wszystkie nowe moduły i kontrakty; każdy build poprawny, bez lokalnych assetów i paczek słów; Vercel **READY** |

Podczas przeglądu przeglądarka ujawniła i pozwoliła poprawić automatyczną zmianę początkowego zaznaczenia, rozpoznawanie gotowości ekranu startowego, wywołanie domyślnego timera oraz kolizję skali z dawnym CSS. W końcowym podglądzie odtwarzanie i zatrzymanie pętli nie zgłosiły błędu aplikacji. Testy z przeglądarki zmieniały wyłącznie lokalne szkice: próbne nazwy, wysokości, treści zasad i scalenie ilustracji nie zostały zapisane w bazie Git.

Przegląd interakcji obejmuje wdrożenie `0bd11b8`. Zrzut `studio-visual-20261004.jpg` pokazuje tę wersję przed ostatnią korektą dopasowania. Wdrożenie `003a135` ma stan **READY**. Automatyczna kontrola odrzuciła nowy anonimowy link jako rozszerzenie dostępu i przejście przeglądarki do logowania Vercel jako dostęp do osobnego prywatnego źródła. Ochrona wdrożenia pozostała włączona; nie wykonywano obejścia tych blokad.

Wcześniejszy przegląd podstawowego systemu potwierdził ekrany pięciu gier (ustawienia, początek, poprawną i błędną odpowiedź, koniec), wybór i tworzenie gracza, PIN, home, popup zasady, podpowiedź, pauzę, slider po błędzie, puchary i historię. Potwierdził również upload PNG 1200 × 1200 oraz odtworzenie miniatury i pliku z IndexedDB po odświeżeniu.

## Zakres potwierdzenia

Realne commity implementacji zapisano na GitHub i uruchomiły buildy. Nie wykonano zapisu z interfejsu Studio z osobistym tokenem użytkownika ani rzeczywistego konfliktu dwóch osób w przeglądarce. Ścieżka zapisu i rozstrzygania konfliktu ma testy kontrolowanego transportu. Token trzeba podłączyć we własnej przeglądarce; Studio przechowuje go tylko w pamięci karty.

Sześć konsumentów zbudowano z centralnym kontraktem `842107198767b5c96ce298f41e65c6bc3ad92799`. Późniejsze poprawki dotyczą interfejsu Studio i jego zegara podglądu; nie zmieniają przejść aplikacji konsumenta. Kolejny build pobiera aktualne moduły. Zmiana zapisanych tokenów, reguł, animacji lub przypisań grafik jest pobierana online z jednego centralnego źródła.

Symulator renderuje rzeczywistą aplikację w 390 × 844. DPR 3 określa cel graficzny, nie sprzętowy DPR przeglądarki desktopowej. Test Safari i instalowanej PWA na fizycznym iPhonie pozostaje osobną kontrolą.

## Kontrola na urządzeniu

1. Otwórz ustawienia czterech trybów i sprawdź tap, drag oraz klawiaturę przełączników.
2. W każdej grze wybierz poprawną i błędną odpowiedź; sprawdź pauzę zegara i dalszy krok.
3. Otwórz zasadę, podpowiedź i puchary; sprawdź przewijanie i powrót fokusu.
4. Wgraj ilustrację 1:1, odśwież szkic, połącz GitHub i zapisz jeden commit.
5. W innym podłączonym branchu online sprawdź tę samą bazę, nowy token i treść wspólnej zasady.
6. Po pełnym pobraniu uruchom instalowaną PWA offline.

Nie wykonano merge do `main` ani publikacji produkcyjnej.
