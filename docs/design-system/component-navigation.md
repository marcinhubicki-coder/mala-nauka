# Komponenty: od kontenera do detalu

W sekcji **Komponenty** kolejność kontrolek to: sposób pracy, kategoria, tryb gry, ekran i stan, narzędzia, wyszukiwarka. Wszystkie korzystają z niebieskiego Jelly V4 i mają wysokość 44 px. Mieszczą się w jednym wierszu, gdy pozwala na to szerokość, a potem zawijają całymi grupami. Pastylki elementów mają własny pełny rząd pod kontrolkami, zawijają się bez poziomego przewijania i nie zwężają drzewa. Nazwa trybu nie powtarza się w stanach. Opis ikony pojawia się po sekundzie najechania; natywne grupy radio nadal działają z klawiaturą.

Prawy inspektor pozostaje w swojej kolumnie od górnej do dolnej krawędzi obszaru roboczego. Hierarchia ma jeden pionowy obszar przewijania, a inspektor drugi. Drzewo nie tworzy zagnieżdżonych scrollbarów. Przy węższym ekranie główne menu zwija się do ikon, aby nie ściskać drzewa i podglądu. Uchwyt na granicy panelu chowa i przywraca inspektor bez zmiany kolejności elementów siatki.

## Schodzenie po gałęziach

Zamiast płaskiej listy wszystkich atomów widzisz dzieci otwartego kontenera. Pierwsze kliknięcie wiersza zaznacza rodzica i rozwija pod nim jeden poziom dzieci. Drugie kliknięcie tego samego wiersza ustawia go jako korzeń bieżącej gałęzi. Inne rozwinięcie automatycznie się zwija. Ścieżka nad drzewem pokazuje wszystkich rodziców i pozwala wrócić na dowolny poziom.

Oko oraz uchwyt przeciągania są częścią każdego kafelka w **Zawartości**. Oko przechodzi kolejno przez widoczność, ukrycie z zachowaniem miejsca i usunięcie z układu. Widoczność zapisuje się jako lokalna właściwość elementu i po zapisie działa również w PWA; ukryty element pozostaje dostępny w drzewie, aby można go było ponownie włączyć. Kafelek można przeciągnąć przed inne rodzeństwo; nie ma osobnych strzałek ani drugiej listy warstw. Pole **Odstęp** przy tytule gałęzi pokazuje `gap` bieżącego kontenera i zapisuje go w pikselach. Dzięki temu odległość jest regułą rodzica, a nie dodatkowym obiektem Spacer.

Wybór bezpośrednio na podglądzie respektuje bieżący poziom. Kliknięcie wewnątrz zaznaczonego kontenera schodzi o jedno pokolenie. Kliknięcie rodzeństwa wybiera je na tym samym poziomie. Kliknięcie poza bieżącą gałęzią najpierw wraca o jednego rodzica, więc podgląd nie wyrzuca od razu na początek ekranu.

Przykład ortografii:

**Cały ekran → Ustawienia trybu → Konfiguracja i start → Kafel ustawień → Grupa 3 · Ustal misję → Czas rundy → 3 min → tekst opcji.**

Hierarchia wynika z rzeczywistych rodziców renderowanego ekranu. **Zawartość** pokazuje kolejność od góry do dołu, z pełnoekranowym tłem na spodzie. Widoczność i **Odstęp** trafiają do szkicu. Przeciąganie pozwala sprawdzić kolejność na działającym widoku.

## Wybór i podgląd

Wybranie opcji czasu ustawia odpowiedni stan suwaka. Jeżeli trwa dyktando lub wybrana jest liczba słów, podgląd przełącza się na czas. W angielskim zamyka edytor kategorii, który zasłaniał czas. Kategorie i dyktanda otwierają właściwe panele. Chwilowo ukryci rodzice wracają przy wyborze dziecka. Otwarte sekcje, przewinięcie i wskazanie konkretnego elementu są synchronizowane z podglądem. Nie są zapisywane jako zmiana konfiguracji gry.

Dzieci z zamkniętych paneli są oferowane tylko wtedy, gdy Studio zna warunek ich odsłonięcia. Inne niewystępujące elementy nie są prezentowane jako dostępne. Wybór sprawdza widoczność, otwarte popupy oraz trafienie w element w podglądzie. Jeżeli renderowany stan nie pozwala go odsłonić, Studio zgłasza brak dostępności zamiast potwierdzać niewidoczny wybór. Nowy warunkowy panel wymaga dodania jawnego warunku odsłaniania w `bridge.mjs`.

## Wspólne i lokalne

**Kafel misji z ilustracją** i **Kafel ustawień** mają osobne wspólne przepisy. Ustawienie „W każdym widoku z tym elementem” edytuje rodzinę. Ilustracja, nagłówek, opis i ikony są oddzielnymi dziećmi. W trybie „Tylko ten widok” mają własne wyjątki. Lokalny tekst edytuje wyłącznie pojedynczy węzeł tekstowy, zachowując dzieci i obsługę przycisków. Przycisk przywracania usuwa wyjątek, a lokalny tekst ma pierwszeństwo przed tekstem zdefiniowanym dla ekranu.

Identyfikator tekstu nie zależy od tego, czy znajduje się na nim aktywny wskaźnik jelly. Dzięki temu przeniesienie zaznaczenia nie przenosi lokalnych ustawień na inny napis.

## Weryfikacja 6 października 2026

Przeprowadzono trzy przeloty w lokalnym Chrome na prawdziwych rendererach:

1. Pełna gałąź do 3 min, powrót od dzieci do rodziców, wyszukiwanie i odsłanianie czasu z trybu Słowa. Poprawiono szerokość etykiet oraz przeniesiono gałęzie obok podglądu, aby powiększyć telefon.
2. Ustawienia pięciu trybów, wyjście z dyktanda, stabilność identyfikatorów po zmianie opcji, lokalny tekst i przywracanie, popup pauzy i jego dzieci. Poprawiono odsłanianie czasu spod edytora kategorii angielskiego oraz obrys elementu w natywnym popupie.
3. Telefon 390 × 844 i 360 × 800, panele Wybór/Podgląd/Ustawienia, brak poziomego przepełnienia dokumentu. Poprawiono odsłanianie aktywnej opcji po zmianie szerokości. Osobno sprawdzono wspólny kafel, lokalną grafikę oraz odsłonięcie ukrytego rodzica.

Końcowa kontrola układu została powtórzona w Chrome przy 1450 × 1000 oraz 1024 × 900. Inspektor pozostał w prawej kolumnie, wszystkie grupy wyboru miały wysokość 44 px, a `Ekran i stan` zachował szerokość wynikającą z ikon. Kontrola regresji pilnuje stałej kolumny inspektora, absolutnego położenia uchwytu, jednego drzewa oraz poziomego paska rodzin. Pełny pakiet ma **128 testów i 128 zaliczonych**.

Weryfikacja dotyczy Chrome i symulowanych rozmiarów ekranu. Nie zastępuje próby na fizycznym iPhonie ani Safari. Produkcyjny `main` nie jest celem tych zmian.
