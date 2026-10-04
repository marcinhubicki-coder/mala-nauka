# Weryfikacja

Aktualny przegląd wykonano 4 października 2026 dla interfejsu telefonu `b098d1ef686b0723b94d2d77d92d6ae5e107d7cb`. `npm test` zbudował 15 stron i zakończył się wynikiem **57 / 57**. Build zawiera 922 pliki i 678 kanonicznych assetów. Poniżej są trzy iteracje mobilne oraz wyniki wcześniejszej weryfikacji całego systemu.

## Trzy iteracje telefonu

| Iteracja | Co wykryto i poprawiono | Sprawdzenie w przeglądarce |
| --- | --- | --- |
| 1 · Nawigacja | Boczny pasek i równoczesne kolumny ściskały ekran; dodano menu sekcji oraz Wybór / Podgląd / Ustawienia | Menu pokazuje pełne nazwy dziewięciu sekcji. Przełączanie paneli zachowuje wybór i szkic. Pierwszy test wykrył jeszcze galerię o zerowej wysokości i ukryty status szkicu |
| 2 · Edycja dotykiem | Poprawiono wysokość galerii i status; dodano − / +, duże suwaki, pola oraz okna bazy | 54 → 55 px; podpis i znacznik nadal pokazują zapisane 54. Cofnij wraca do 54. Słowo brzuch i wspólna zasada mieszczą się w oknie z przewijaniem, bez poziomego przepełnienia |
| 3 · Porównanie i ruch | Dodano przewijanie ekranów palcem; zmniejszono obszar animacji; ukryte podglądy pozostają wyrenderowane i nie przechwytują fokusu | Dwa iframe mają nadal 390 × 844; ramki dopasowują się do telefonu. Przy 360 px ręczne przyciski kończą się na Y 708, nad paskiem na Y 720. Pętla 500 ms przechodzi do Ortografii i zatrzymuje się po wejściu w Ustawienia. Ukryty podgląd zachowuje instancję 322 × 55, a po cofnięciu 322 × 54 oraz aktywne Kategorie |

Sprawdzono viewporty **360 × 800**, **390 × 844** i **430 × 932**. W komponentach, bazie grafik, typografii i relacjach szerokość całej strony nie przekracza szerokości ekranu. Pola typografii mają 16 px i 44 px wysokości; wybór grafiki ma obszar dotyku 44 px. Asset loader otwiera się bez poziomego przepełnienia. Duże tabele przewijają się we własnym panelu.

Poziome przewinięcie po nagłówku przesunęło galerię o 378 px do drugiego ekranu; **Edytuj ten ekran** otworzyło ustawienia `english-settings`. Kontrola desktopu potwierdziła ukrycie mobilnego paska oraz dwa telefony na tej samej wysokości, z `transform: none` i iframe 390 × 844. Zmiany interfejsu są w oddzielnym CSS i adapterze; bazowe pliki edytora, konfiguracji, zasad, assetów i gier pozostają takie jak przed pracami mobilnymi.

Do powtórzenia prób służy `/design-system/phone-preview.html`: osadza rzeczywiste Studio w wybranym viewportcie telefonu. Zwykły `/design-system/` sam dobiera układ. Ten test potwierdza układ CSS i interakcje w Chrome; nie zastępuje próby klawiatury, safe area i Safari na fizycznym iPhonie.

Zrzuty końcowego interfejsu: [podgląd](studio-mobile-preview-20261004.jpg) i [ustawienia](studio-mobile-settings-20261004.jpg). Próbne wymiary cofnięto; żadne treści zasad ani przypisania grafik nie zostały zmienione w bazie Git.

## Wcześniejsza weryfikacja pełnego systemu

Poniższe trzy rundy dotyczą implementacji systemu sprzed dostosowania telefonu (`003a135c04089bcb0f906430903afef1881f2f39`).

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
| Dopasowanie telefonu | W przeglądarce wykryto kolizję: obliczone 0,517 było zasłonięte starą skalą 0,699. Poprawka używa osobnej zmiennej. Aktualny przegląd mobilny potwierdza dopasowanie całej ramki do dostępnej wysokości |
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

Wcześniejszy przegląd interakcji obejmował wdrożenie `0bd11b8`; zrzut `studio-visual-20261004.jpg` pokazuje tę wersję. Początkowo ponowny przegląd korekty `003a135` zablokowała kontrola dostępu Vercel. Po zgodzie użytkownika utworzono tymczasowe linki podglądu i wykonano powyższe próby mobilne oraz kontrolę desktopu. Ochrona projektu pozostała włączona.

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

## Rozgrywka i efekty — 4 października 2026

1. **Dane i mechanika:** sprawdzono 455 unikalnych słów, 162 wielokategoryjne, brak duplikatów i brakujących przypisań grafiki. Test przechodzi każdą kategorię oraz pulę mieszaną do wyczerpania, bez ponownego użycia słowa. „Brzuch” ma trzy prawidłowe luki i jeden adres ilustracji. Zgodne duplikaty są scalane, sprzeczne poziomy odrzucane. Dodatkowa reguła grupy jest propagowana z jednej treści.
2. **Desktop i edycja:** rzeczywisty podgląd wykazał konflikt rozpoznawania sekcji edytora przejść i efektów. Poprawiono zakres obu kontrolerów. Sprawdzono zmianę czasu 850 → 1200 ms, aktualizację budżetu, znaczniki zapisanej wartości, combo z przycięciem do 36 drobinek, pętlę i zatrzymanie. Krótkie próbki wydajności rozbudowano o zbieranie klatek w pętli, zamiast zgadywać wynik. Przeliczenie próbnej rundy 80 − 15 − 10 + 4 = 59 punktów i pusta runda = 0 zostały potwierdzone w UI.
3. **Telefon i relacje:** sprawdzono edytor w ramce 390 × 844 oraz 360 × 800. Brak przewijania strony na boki, przyciski +/− mają 44 × 44 px. Zmiana Gwiazdy 1050 → 1100 ms aktualizuje szkic i budżet; Cofnij przywraca zapis. Przejście z podglądu do ustawień zatrzymuje animację. Uproszczono ustawienia błędu, dodano komunikat ładowania, automatyczne otwarcie podglądu po wyborze zestawu i kontrolę rozbieżnych progów combo. Ustawienia bańki objęły również ekrany zasad.

To próby w Chrome, w tym prawdziwe wąskie ramki CSS, a nie pomiar fizycznego iPhone’a lub Safari. Miernik nie deklaruje poboru mocy w watach ani rzeczywistego czasu GPU. Ograniczony ruch jest obsługiwany w kodzie; fizyczna zmiana ustawienia iOS wymaga próby na urządzeniu.
