# Studio: klocki, stany i architektura — weryfikacja

Wdrożenie z 9 października 2026, oparte na `design/system-v1`, z kopią wykonawczą na `studio/pwa-test`. Produkcyjne `main` nie jest zmieniane. Zapisana konfiguracja rewizji 26 pozostaje bez zmian; nowe możliwości mają bezpieczne wartości domyślne i zapisują się dopiero po edycji w Studio.

## 1. Biblioteka klocków

| Wymaganie | Implementacja | Sprawdzenie |
| --- | --- | --- |
| Żywe próbki | Jelly używa rzeczywistego silnika przeciągania; slider akcji prawdziwego uchwytu; postęp rzeczywistej animacji końca | Chrome i WebKit: kliknięcie, drag, 100%, restart |
| Liczba opcji i przykłady | 2–4 opcje; zakres, pula, czas, liczba słów i język; maksimum z danych gry | 4 opcje i zmiana wyboru sprawdzone w przeglądarce |
| Kolor domyślny i rodziny | Paleta niebieska + pięć trybów; globalne parametry z nadpisaniem rodziny | Wszystkie palety; edycja niebieskiej palety i zapis szkicu |
| Domyślna wartość suwaka | Wartość, znacznik na torze i Przywróć; rodzina może wrócić do globalnego przepisu | Zmiana wysokości jelly 54 → 61 → 54 px |
| Atomy tekstu | Lista używanych fontów, rozmiar, grubość, interlinia, odstępy; aktywacja globalnego przepisu | Zmiana fontu tytułu i rzeczywisty styl próbki |
| Cienie i efekty | Cień, przezroczystość i stos efektów powierzchni są dostępne w grupach | Walidacja wartości i renderowanie wspólną fabryką |
| Odstępy | Padding, gap, margines, każdy bok osobno; przełącznik wizualizacji | Kontrakt CSS + kontrola próbki |
| Slider akcji | Osobne zastosowania Po błędzie / Nowa runda; drag, symulacja procentów i stan ukończony | Przeciągnięcie do 100% oraz ręczny stan 100% |
| Postęp | Regulacja procentów, animacja zakończenia i tekstu; kolor pełnego paska; rodziny | Symulacja do 100% z odtworzeniem zakończenia |
| Stany klocków | Nieaktywny, aktywny, wejście, wyjście, czas i zasięg; osobny przepis aktywnej etykiety jelly | Test kaskady + zaznaczanie próbki |

Próbki zmieniają konfigurację wspólnego runtime; nie są osobną, odłączoną makietą. Grupowanie ustawień nie zamyka innych grup po zmianie wartości.

## 2. Struktura i komponenty

| Wymaganie | Implementacja | Sprawdzenie |
| --- | --- | --- |
| Atom → grupa → układ | Kafel jest atomem obiektu. Grupy wymieniają tor, wypełnienie, uchwyt, etykiety, tekst i ikony; układ Ortografii opisuje trzy grupy ustawień | Kontrola opisów i wspólnych identyfikatorów przepisów |
| Rodziny i użycia | Biblioteka pokazuje użycia z rejestru ekranów; rodziny nadpisują globalne tokens/styles | Test zapisu i dziedziczenia |
| Edycja aktualnego stanu | PIN / bez PIN i zakres ustawień mają `elementStates`; zapis lokalny trafia w widoczny stan | PIN 440 px i bez PIN 240 px nie nadpisują siebie |
| Wysokość automatyczna | Domyślnie brak wymuszonej wysokości; 0 w edytorze oznacza auto | CSS i przejście wracające do wysokości wyznaczonej przez zawartość |
| Płynna zmiana stanu | Zmiana wysokości PIN używa skończonego przejścia CSS; wejście/wyjście paneli ma osobne parametry | WebKit: wysokość pośrednia między 440 a 240 px, potem końcowa |
| Aktywny wybór | Przepis `jelly-option` rozróżnia zaznaczenie, również w Matematyce | Test klasyfikacji i kaskady stanów |
| Widoczność i kolejność | Zachowane dotychczasowe edycje i szkice; nowe dane rodzin i stanów wchodzą do kopii testowej | Test round-trip i ochrony widoczności przy publikacji |

## 3. Flow i nawigacja

Mapa jest pozioma, przesuwana pustym obszarem, z widokiem uproszczonym/szczegółowym. Karta pokazuje części, stany, przyciski, połączenia i efekty; szczegóły są rozwijane. Tworzenie profilu i rozpoczęcie rundy zachowują wymaganą walidację, zamiast być dowolnym skokiem do ekranu.

| Scenariusz | Rezultat |
| --- | --- |
| Edycja połączenia i reset | Szkic zapamiętuje cel; Przywróć usuwa nadpisanie |
| Wykonanie zmienionego celu | Zmieniony Powrót z wyniku Ortografii prowadzi do strony startowej w rzeczywistym PWA |
| Wyjście z aktywnej gry | Potwierdzenie → ustawienia danego trybu; zapis zakończonej wcześniej rundy |
| Wyjście z ustawień trybu | Strona startowa |
| Wybrany gracz | Kolejne uruchomienie wraca na start; zmianę gracza otwiera się przez ustawienia |
| Koniec rundy w pięciu trybach | Ten sam renderer i mechanika wyników, kolory i ilustracja trybu, Nowa runda, Moje wyniki, Powrót do ustawień |
| Moje wyniki | Kontekst powrotu zachowany dla strony startowej lub konkretnej rundy |
| Nowa runda | Uruchamia silnik odpowiedniego trybu; nie wyświetla samej makiety |

Test mobilnego WebKit wykonał pełną sekwencję **start → potwierdzone wyjście → kolejny start → naturalny koniec → Moje wyniki → powrót do wyniku → nowa runda**, osobno dla Ortografii, Angielskiego, Flag, Czytania i Matematyki. Przyspieszono wyłącznie zegar rundy, bez zmiany zegara animacji. Naprawiono podwójne uruchamianie zegara Matematyki.

## 4. Ładowanie i mobile

| Wymaganie | Rezultat |
| --- | --- |
| Grafiki gotowe przed odkrywaniem | Oczekiwanie na renderer zdjęcia, fonty, obrazki i tła CSS oraz decode |
| Pierwsze uruchomienie | Pełna animacja pięciu kolorów tylko przed pierwszym wyborem gracza |
| Kolejne widoki | Brak powtarzania pełnej kolorowej sekwencji |
| Oczekiwanie ponad 250 ms | Neutralny obrót → biały blob → odsłonięcie przygotowanego ekranu |
| Opóźnione assety | Sztuczne opóźnienie 1200 ms potwierdziło neutralny loader i gotowy ekran |
| Wykrywanie telefonu | Mobile UA i dotykowy iPad; Studio nie ma blokady orientacji |
| Tryb poziomy telefonu | Komunikat, nieaktywne UI, pauza logiki; Ortografia i Matematyka sprawdzone |
| Zaznaczanie tekstu | Zablokowane w grze; pola edycji zachowują normalną obsługę |
| Grafiki mobile | Używane istniejące zoptymalizowane assety; brak nowej, odrębnej biblioteki rozdzielczości |

Nie przebudowano responsywności wszystkich ekranów — zgodnie z zakresem mobile first i zapowiedzią osobnej pracy nad Responsive Design.

## 5. Spójność, regresje i wydajność

- **185/185 testów** przechodzi, bez pominiętych i błędnych.
- Dwa pełne przeloty Studio: **Chrome i WebKit**; po poprawkach dodatkowa kontrola WebKit na zbudowanym `dist`, bez błędów JavaScript.
- Test bańki porównuje parametry ruchu, przejścia zdjęć i konturu z produkcyjnym punktem odniesienia. Długie słowa mieszczą się bez przesuwania odpowiedzi; boczne odległości liter od luki są sprawdzone.
- Zapisana konfiguracja rewizji 26 ma niezmieniony SHA-256: `292b1f444158c15c7937ad89292854e791edd4150a5cad097afa3f63336d96f0`.
- Pełna scena Ortografii z bańką, literami i bokeh: **4155 klatek rAF**, mediana odstępu **17 ms**, P95 **19 ms**, maksimum **45 ms**; około 68 s obserwacji, dwie odpowiedzi i pauza/wznowienie. Timer i odmalowanie canvas nadal działały; bez zatrzymania renderowania.
- Na końcu testu: **1 SVG, 1 canvas, 642 cząstki**, w limicie 1200; nie narastają setki węzłów ani dodatkowe płótna.
- WebKit nie udostępniał tu pomiaru Long Tasks. Brak wpisów nie jest dowodem braku długich zadań.
- Build kopiuje centralne moduły do wszystkich konsumentów. Test PWA jest zbudowany z tego samego drzewa źródeł i konfiguracji Studio, z raportem źródłowego commitu. Produkcyjne `main` nie jest promowane w tym wdrożeniu.

Skrypty do odtworzenia: `tools/verify-building-blocks.mjs`, `tools/verify-screen-readiness.mjs`, `tools/verify-production-bubble.mjs`, `tools/verify-spelling-effects.mjs`, `node --test tests/*.test.mjs`.

## Ograniczenia i dalsza kontrola

1. Fizyczny iPhone, dłuższa sesja oraz temperatura urządzenia pozostają do sprawdzenia. Emulacja WebKit nie zastępuje tego testu przed produkcją.
2. Automat sprawdza reprezentatywne ścieżki, nie każdą kombinację wszystkich suwaków i stosów efektów.
3. Rejestr zawiera istniejące braki czterech ilustracji słów: wieża, dach, chata, chrzan. Nie są wynikiem tej przebudowy.
4. Rozbudowę Flow o całkowicie nową architekturę i nowe grupy należy wykonywać przez te same kontrakty części, stanów i nawigacji, zamiast dokładać odłączone demonstracje.
