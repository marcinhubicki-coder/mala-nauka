# Audyt użyteczności Design Studio — cztery rundy

Data: 9 października 2026. Baza: design/system-v1, commit 736dc80d79076fe9a2b63e883d8f4cb175a7bd8f.

## Wniosek i zakres dowodów

Studio daje dużą kontrolę, ale wymaga znajomości architektury. Główne problemy: 16 równorzędnych działów, kilka znaczeń „podglądu”, niejasna granica prototypu i produkcyjnego komponentu, trzy poziomy biblioteki zamiast pełnego modelu Atomic Design. Możliwość wykonania zadania nie dowodzi jego odkrywalności.

Przeprowadzono cztery iteracje analizy kodu, zmian i testów automatycznych. Nie są to cztery badania z uczestnikami ani cztery pełne przebiegi w przeglądarce. Chroniony Preview Vercela pokazał logowanie; automatyczna kontrola odrzuciła narzędzie tworzące tymczasowy link dostępu. Lokalny podgląd w zdalnej przeglądarce był niedostępny (ERR_BLOCKED_BY_CLIENT). Nie potwierdzono wizualnego układu, odsłuchu, czasu wykonania zadań ani FPS na fizycznym iPhonie. Zmiany wymagają takiej weryfikacji przed scaleniem.

Metoda: inspekcja renderowania, zdarzeń, dziedziczenia, stanu szkicu i testów; ocena ekspercka dla osoby średnio zaawansowanej. Priorytety oznaczają konsekwencje przewidywane z kodu, bez fikcyjnych wskaźników sukcesu użytkowników.

## Scenariusze i kryteria akceptacji

| Zadanie | Typowa ścieżka | Kryterium | Wynik obecnej weryfikacji |
|---|---|---|---|
| Poprawić przycisk tylko na ekranie PIN | Start → Edytuj ekran → profil/PIN → element → wyjątek widoku | Inne ekrany zachowują styl; użytkownik widzi zakres | Kontrakt dziedziczenia ma testy; dodano opis zakresu. Interakcja do wykonania w Preview |
| Zmienić wspólny komponent | Biblioteka i próbki → przepis → powiązane użycia | Jasne odróżnienie przepisu od próbki | Opisy wdrożone; regresje przepisów przechodzą |
| Znaleźć dźwięki bez znajomości Sound Lab | Szukaj „dzwiek” → Dźwięki | Wynik także bez polskich znaków | Test wyszukiwania przechodzi |
| Zmienić font | Szukaj „font” → Typografia → rola → kilka ekranów | Użytkownik zna globalny zasięg | Test odnajdywania i opis zakresu |
| Dodać 10 haseł z ilustracjami | Kolejka nowych słów → wybór → ilustracje → akceptacja | Nowe i opublikowane hasła rozróżnione; jedna ilustracja na słowo | Istniejące regresje batchy przechodzą; upload w UI do wykonania |
| Poprawić regułę istniejącego słowa | Słowa, grafiki i zasady → reguła | Jedno źródło treści, widoczne powiązania | Przegląd modelu i istniejące testy |
| Porównać poprawną i błędną odpowiedź | Edytuj ekran / Efekty odpowiedzi → stan | Ten sam renderer i czytelny wybór stanu | Kontrakty przechodzą; wizualna zgodność do sprawdzenia |
| Obejrzeć ukończoną kolekcję i wrócić do panelu | Test PWA → Ukończona kolekcja → inny dział → Test PWA | Wariant nie wraca do rundy mieszanej | Usunięto kolizję identyfikatorów; nowy test przechodzi |
| Przygotować PWA na telefon | Zapis → Test PWA → build → status → link | Link i status zostają po ponownym wejściu | Nowy test zachowania stanu przechodzi; rzeczywisty deploy do wykonania |
| Cofnąć zmianę / odzyskać szkic | Szkic i historia → Cofnij / odzyskaj | Zachowanie assetów, reguł i ustawień | Istniejące regresje przechodzą |
| Schować zbędny dział i użyć telefonu | Dostosuj panel → menu mobilne | Ukryty dział znika również na telefonie | Kod klonuje grupy i stan hidden; interakcja do wykonania |
| Przestawić suwak i zamknąć kartę | Dowolny edytor → suwak → ukrycie strony | Bieżący szkic zapisany; nie 100 serializacji dla 100 zdarzeń | Test sterowanego harmonogramu: 100 żądań → 1 zapis; flush zapisuje najnowszy stan |
| Rozwinąć ustawienia i zmienić wartość | Inspektor → grupa → zmiana | Grupa pozostaje rozwinięta po ponownym renderowaniu | Wspólny mechanizm zachowania stanu; wizualna regresja do wykonania |
| Przejść z części do całego ekranu | Pomoc → Atomic Design → poziom → Zobacz użycie | Wszystkie 5 poziomów i każdy ekran powiązany z szablonem | Nowy test mapy przechodzi |

## Inwentaryzacja sekcji i paneli

| Dawna sekcja / główne podobszary | Ocena i ograniczenie | Zmiana / dalsza praca |
|---|---|---|
| Projekt i wydanie: plan, ekrany/flow, teksty, nagrody, test/dane, wersje | Zbyt ciężki punkt wejścia dla osoby poprawiającej istniejący ekran. Zapis projektu, pilot i publikacja main to różne działania | Nowy Start; „Projekt i publikacja” w grupie Test i zapis. Nie usuwać możliwości planowania |
| Komponenty: wybór trybu/widoku/stanu, drzewo, inspektor, zakres, porównanie | Najważniejsze narzędzie ukryte za ogólną nazwą. Różnica wspólnego przepisu i wyjątku istotniejsza od parametrów | „Edytuj ekran”, stały opis zakresu. Następny krok: podgląd listy skutków przed zmianą globalną |
| Builder: przepisy, próbny element, próbny widok, warstwy, lokalne cofanie | Próbka i przepis mają odmienne skutki oraz osobne historie cofania | „Biblioteka i próbki”, jawny komunikat o prototypie. Docelowo oddzielna nawigacja wewnętrzna dla edycji wspólnej i prototypowania |
| Testy PWA: build, sprawdzenie wdrożenia, scenariusze, ramka | Warianty wyników miały kolizje ID; aktywna próbka nie była zaznaczona przy wejściu; gotowy link znikał z renderowania | Naprawione ID, zaznaczenie, tytuł ramki, otwarta właściwa grupa, status i link. Zwykłe PWA oznaczone jako używające lokalnych danych |
| Kolory i odstępy: tokeny, palety trybów | Globalna zmiana wymaga kontroli kilku ekranów | Grupa Styl i informacja o zasięgu. Docelowo próbka porównawcza przy tokenie |
| Typografia: role, próbki, zamiana fontu | Można pomylić rolę fontu z lokalnym tekstem | Grupa Styl, opis różnicy, wyszukiwanie po „font” |
| Baza słów i grafik: słowa, przypisania, reguły, inwentaryzacja | Nazwa nie ujawniała reguł. Baza i kolejka to etapy tej samej pracy, nie duplikaty do usunięcia | „Słowa, grafiki i zasady” obok „Kolejka nowych słów” w Treściach |
| Nowe słowa: wybór, ilustracje/poziomy, akceptacja, historia | Termin „batchy” wymaga nauki. Zatwierdzenie listy i publikacja nie są tym samym | Nazwa zadaniowa i opis procesu; historia nadal zwijana |
| Animacje: przejścia, ruch elementów, globalny klimat | Pokrywanie się wejść do tych samych ustawień zwiększa koszt odnalezienia | „Ruch i przejścia”, wyraźne skierowanie ruchu elementu do edytora. Nie kopiowano parametrów |
| Efekty i bańka: poprawna/błędna reakcja, klimat, combo, fizyka, pomiary | Dużo parametrów; udany pojedynczy efekt nie dowodzi płynności serii | „Efekty odpowiedzi”, opis testu serii i utrzymanie zwijania. Docelowo presety podstawowe oraz „Zaawansowane” |
| Dźwięki: transport, miks, brzmienia, mapa zdarzeń, odsłuch | Sam odsłuch nie potwierdza działania w zewnętrznym PWA ani na iOS | „Dźwięki”, jawny następny krok do testu PWA. Odsłuch i iOS nadal do weryfikacji |
| Naliczanie wyników: zasady, przykład rundy, składniki | Symulacja i historyczny wynik mają inny kontekst | „Punkty i wyniki”; informacja o zasadach nowych rund |
| Widoki i relacje: mapa, przejścia, zagnieżdżone części | Dubluje kontekst edytora, ale daje wartościowy obraz zależności | „Mapa ekranów” obok edytora. Pozostawić wspólny model danych; docelowo otwieranie mapy także w kontekście wybranego elementu |
| Porządek w kodzie: źródła, duże pliki, reguły | Informacja techniczna nie powinna konkurować z edycją; rozmiar pliku nie jest FPS | „Stan techniczny” w Pomocy; opis ograniczeń pomiaru |
| Dokumentacja: instrukcje, zasady, integracja | Instrukcje nie zastępują odkrywalności; część starszych nazw pozostała w długich opisach | Pomoc i mapa Atomic Design. Docelowo generować nazwy instrukcji z jednego rejestru sekcji |
| Wersje i szkice: zmiany, import/eksport, odzyskiwanie, Git | Szkic lokalny, commit i wdrożenie wymagają odrębnego języka | „Szkic i historia”, przewodnik czterech etapów na Starcie |
| Menu mobilne, toolbar, pomoc, personalizacja, dialog telefonu | Płaskie menu i ukrywanie tylko desktopowe; toolbar ma dużo konkurujących akcji | Grupy i hidden na telefonie, dostępny focus, mniej treści w stopce. Docelowo podstawowe akcje oraz menu pozostałych |
| Zwijane grupy ustawień | Ponowne renderowanie może utrudniać kontynuację w tym samym miejscu | Wspólny stan rozwinięcia w obrębie karty i sekcji. Trwałe preferencje otwarcia nie są publikowane do projektu |

## Cztery iteracje

1. **Odnajdywanie**: 16 działów bez grup → Start z sześcioma zadaniami, siedem grup, wyszukiwanie po nazwie/opisie, adres sekcji w hashu. Testy istniejącego UI: 5/5.
2. **Zakres i Atomic Design**: opisy skutków narzędzi i granicy przepisu/próbki; mapa atomów, molekuł, organizmów, szablonów, stron z odnośnikami do użyć. Test scenariusza „PIN” wykazał brak słowa w indeksie wyszukiwarki — poprawiono opis. Kontrole modelu i UI: 14/14 po poprawce.
3. **Spójność stanu**: naprawiono ID scenariuszy wyników, aktywny wybór, tytuł ramki i pamięć linku/statusu Test PWA; menu mobilne zachowuje grupy i ukryte działy. Zestaw regresji na tym etapie: 234/234.
4. **Koszt edycji i regresje**: zapis szkicu grupowany co 180 ms bez odkładania bez końca; flush przy pagehide/visibilitychange; przebudowa stylów preferencji tylko po zmianie preferencji; bez ponownego ładowania aktywnej sekcji po kliknięciu jej w desktopowym menu; zapamiętywanie zwijania. Końcowe `npm run design:check`: audyt, build, 236/236 testów. `git diff --check` bez błędów.

Wydajność: udowodniono ograniczenie liczby wywołań serializacji w testowym harmonogramie, nie procentową poprawę FPS. Nadal synchroniczne pozostają aplikowanie stylów, różnicowanie konfiguracji i wysyłanie danych do rendererów. Ich koszt wymaga profilu przeglądarki.

## Atomic Design: wdrożenie i granice

Źródło: https://atomicdesign.bradfrost.com/chapter-2/

Pięć poziomów to współpracujący model części i całości, nie liniowy kreator. Dodany adapter klasyfikuje skład zadeklarowanych części i dostępnych inwentarzy, zachowując istniejące identyfikatory oraz zapisane nadpisania. Prosta grupa elementów jest molekułą; grupa zawierająca kolejne grupy — organizmem. Jest to jawna reguła strukturalna, a nie uniwersalna definicja semantyczna. Części o starym poziomie „atom”, które mają dzieci, otrzymują informację o historycznej klasyfikacji.

Szablony są aktualnie grupowaniem widoków po trybie i ekranie. Nie dodano niezależnego modelu produkcyjnych slotów szablonu ani pełnej migracji trójpoziomowej biblioteki. Mapa obejmuje pięć poziomów; architektura wykonawcza nadal ma te ograniczenia. Pełne wdrożenie wymaga szablonów z nazwanymi slotami, jednoznacznych kontraktów molekuł/organizmów, danych stron w fixture'ach i migracji zachowującej istniejące przepisy. Nie należy deklarować ukończenia tego procesu na podstawie nowych nazw.

Źródło UI: https://www.figma.com/resource-library/ui-design-principles/

Zastosowano hierarchię (grupy i zadania), stopniowe ujawnianie (zwijanie), spójność (rejestr sekcji), kontrast i dostępność (focus i tekstowe nazwy), bliskość (powiązane narzędzia) oraz wyrównanie (wspólna siatka kart). Wizualnego kontrastu wszystkich ekranów nie zmierzono.

## Kolejny etap: walidacja z użytkownikami

Po umożliwieniu dostępu do Preview wykonać wszystkie scenariusze w tabeli na desktopie oraz menu/edycję/PWA na iPhonie 13 Pro. Użyć dwóch osób średnio zaawansowanych, które nie budowały Studio. Dla każdego zadania zanotować: ukończenie bez podpowiedzi, czas, błędne przejścia, cofnięcia oraz zdolność wyjaśnienia zakresu zmiany przed zapisem. Zmierzyć bazę i wersję poprawioną na tych samych zadaniach, zmieniając kolejność między osobami.

Priorytet P1: jednoznaczne statusy szkic/commit/deploy, pokazanie konkretnych użyć przed zmianą globalną, pełna migracja szablonów, sprawdzenie audio i serii efektów na iOS. P2: uproszczenie toolbara, kontekstowa mapa zamiast dodatkowej ścieżki, prosty/zaawansowany panel efektów. Decyzje o usunięciu modułów dopiero po dowodach z użycia — obecne duplikacje są głównie duplikacją wejść, nie danych.

## Dodatkowa kontrola Preview PR

Pierwszy build PR na Vercelu wykonał 236 testów; 235 przeszło. Starszy test offline-precache traktował zewnętrzny URL assetu konsumenckiego jak ścieżkę na dysku (dist/https://raw.githubusercontent.com/…). Naprawa rozróżnia lokalne pliki od zasobów przypiętych do źródłowego SHA. Lokalne pliki nadal muszą istnieć; zewnętrzne muszą należeć do dokładnego źródła buildu i jego katalogu assetów lub paczek słów. To weryfikacja manifestu, nie dostępności HTTP każdego assetu.
