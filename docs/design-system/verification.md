# Weryfikacja

Ostatnia kontrola z 4 października 2026 obejmuje pule ortografii, efekty odpowiedzi i naliczanie punktów: **65 / 65 testów** oraz sześć aktualizacji konsumentów. Wyniki są na końcu dokumentu. Poniższy przegląd interfejsu telefonu `b098d1ef686b0723b94d2d77d92d6ae5e107d7cb` dotyczy wcześniejszego etapu: 57 / 57 testów, 15 stron, 922 pliki i 678 kanonicznych assetów.

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

Na wcześniejszym etapie sześć konsumentów zbudowano z centralnym kontraktem `842107198767b5c96ce298f41e65c6bc3ad92799`. Aktualizacja rozgrywki opisana niżej pobiera również kanoniczne moduły pul, efektów i punktów. Zmiana zapisanych tokenów, reguł, animacji lub przypisań grafik jest pobierana online z jednego centralnego źródła.

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

`npm run design:check` przechodzi: **65 / 65**, aktualny audyt i build. Końcowy ekran gry potwierdza wariant „brzu_” → „brzuch” po wybraniu „ch”. Osobny panel błędnej odpowiedzi pokazuje tylko właściwe ustawienia reakcji. Krok suwaka czasu błędu zmniejszono do 10 ms, żeby jego pozycja dokładnie odpowiadała zapisanym 440 ms.

### Aktualizacja sześciu konsumentów

Każdy build pobrał kontrakt z `13269e22f8c92e350dbd9007d155671ff96d4bca`, bez lokalnego folderu `assets/` i bez paczek słów. Próba starszych branchy wykryła brak `mastery.mjs`, `scroll-edges.mjs` i `dictation.mjs`: listę centralnych zależności uzupełniono. Build sprawdza teraz importy względne i zatrzymuje publikację, jeśli brakuje modułu. Wszystkie sześć buildów i wdrożeń Vercel ma wynik **READY**.

| Branch | Commit adaptera |
| --- | --- |
| czytanie-v1 | `ffd54027d1170f7e81508b4faa5e271f008f840d` |
| design/english-v0.1 | `e847583a97a806fd68b1c283a65163178951a8ab` |
| design/flags-v0.1 | `95656d44824ac510516b123dbeb888f824e26358` |
| design/profile-and-learning-v5 | `08b61d963d53d9d5762274984f94203b6ef91bd2` |
| design/spelling-v0.3-preview | `789d454b4961f54d8ad77c0f0d54994f1e8b8d08` |
| matematyka-v1 | `5933943ab45ae6e0517e37b3b5bf250d98f72a20` |

Są to próby buildów i kompletności importów. Nie wykonano pełnego przeglądu każdego historycznego interfejsu konsumenta. Produkcyjny `main` pozostał bez zmian.

Próba pełnej ścieżki w końcowym podglądzie: gość → Kategorie / Trudne / ź/zi / Słowa. Wybrane 20 słów jest ograniczone do rzeczywistych 5 w puli; komunikat zapowiada zakończenie bez powtórek. Kolejno: później, źrebak, zielony, spóźniony, źrenica. Wynik końcowy to 5/5, 100% i 5 punktów. Szczegóły potwierdzają wyczerpanie puli. Studio w tej samej karcie wczytuje wszystkie pięć odpowiedzi i zachowuje 5 punktów naliczonych w chwili gry.

Mobilny wybór Gwiazd otwiera Podgląd automatycznie. Przegląd 10 efektów kończy się na Kręgach i zbiera 15 interwałów klatek; pomiar zdalnej karty pokazuje zaniżoną płynność, więc nie traktujemy go jako wyniku sprzętu iPhone. Interfejs wyjaśnia wpływ tła i zdalnego podglądu. Przejście do Ustawień zatrzymuje ruch; strona ma szerokość 390 px i przyciski 44 × 44 px.

Końcowy podgląd `82bea29ecfe38368ca35d5a7c8f775543e60488a`: suwak i pole błędu mają tę samą wartość 440 ms; tabela pokazuje nazwy słów, a pusta runda daje 0 punktów i 0%. Po Stop liczba warstw efektu wynosi 0. W telefonie 360 px ustawienie 1050 → 1100 → Cofnij wraca do zapisu; licznik szkicu znika. Panel punktów ma przyklejony skrót wyniku i przewijaną tabelę, bez poziomego przepełnienia całej strony. Obie karty bez błędów aplikacji.

Zrzuty z rzeczywistej przeglądarki: [brzuch i pule](studio-brzuch-20261004.jpg), [edytor combo](studio-effects-20261004.jpg), [telefon 360 px](studio-effects-mobile-20261004.jpg) oraz [rozliczenie zakończonej rundy](studio-scoring-20261004.jpg). Ostatni zrzut przedstawia rundę z podglądu `13269e2`; pozostałe pokazują końcowy interfejs `82bea29`.

## Batchy, atomy i builder — trzy iteracje z 4 października 2026

1. **Lista → grafiki → grupa.** Sprawdzono domyślne zaznaczenie całego batcha, odznaczenie jednego hasła, automatyczne przeliczenie kilku pul, blokadę końcowej akceptacji bez ilustracji, wybór zdjęcia z bazy i cofnięcie przypisania. Globalny przepis tytułu 29 px został zweryfikowany na prawdziwym rendererze ustawień ortografii.
2. **Telefon i zapis szkicu.** Na szerokości 360 px dokument nie miał poziomego przepełnienia. Przejście przez grupową walidację i akceptację trzech słów do szkicu przetrwało odświeżenie. Liczniki słów w grze zachowały opublikowane wartości. Po przelocie dodano ponowną ocenę odłożonych słów, niezależne cofanie próbki, zapisane znaczniki suwaków i atomową aktualizację całego batcha. Dane QA nie zostały wysłane do Git.
3. **Próbka i miernik.** Na 390 i 360 px sprawdzono panele Warstwy / Podgląd / Ustawienia, zmianę paddingu, stan błędnej odpowiedzi i ukrycie podtytułu z zachowaniem miejsca. Dodano automatyczne dopasowanie próbki po zmianie szerokości, rozdzielenie sekcji-kontenera od nagłówka sekcji oraz etykietę jako dziecko przycisku. Próbka efektu zebrała 58 klatek: 60 FPS, p95 16,7 ms, przygotowanie JS 1,2 ms. Pamięć JS dotyczyła karty Chrome, nie fizycznego telefonu.

Zbiorczy formularz został uruchomiony z rzeczywistym plikiem `cisnienie.jpg`: dopasowanie do „ciśnienie”, sprawdzenie wymiarów i ponowne wykorzystanie istniejącego hasha zakończyły się poprawnie. Automatyczne okno wyboru plików w przeglądarce testowej miało duże opóźnienia i raz zrestartowało sesję. Nie jest to pomiar czasu obsługi plików przez aplikację. Odrzucanie niepasujących i niejednoznacznych nazw, poziomów, niekwadratowych obrazów oraz zapis całego batcha w jednym commicie sprawdzają testy modelu i kontrolowanego transportu Git.

Kontrola `npm run design:check`: **81 testów**, audyt i build. Baza gry nadal zawiera 455 unikalnych haseł. Plik kolejki zawiera 256 propozycji w 13 grupach: wszystkie początkowo zaznaczone, bez ilustracji, żadna grupa opublikowana. Plan osiąga minimum 100 w ośmiu kategoriach; wejście do gry wymaga decyzji użytkownika i zdjęć. Generator kolejnych propozycji zachowuje dotychczasowe decyzje, ilustracje i poziomy zamiast zastępować kolejkę.

Testy graniczne odróżniają zielony, żółty, czerwony i neutralny status; brak danych pamięci usuwa kartę pamięci. Krótka próbka klatek nie otrzymuje ogólnego zielonego statusu wyłącznie na podstawie szybkiego przygotowania JS. To weryfikacja przeglądarkowego podglądu i symulacji rozmiaru, bez pomiaru procesora, baterii i fizycznego iPhone’a.
