# Komponenty: od kontenera do detalu

W sekcji **Komponenty** sposób pracy, kategorie oraz ekran i stan są zwartymi, niebieskimi kontrolkami z ikonami. Tryb gry zachowuje animację jelly z gry. Nazwa trybu nie powtarza się w stanach. Opis ikony pojawia się po sekundzie najechania; natywne grupy radio nadal działają z klawiaturą. Wyszukiwarka stoi w tym samym rzędzie i ma tę samą wysokość.

## Schodzenie po gałęziach

Zamiast płaskiej listy wszystkich atomów widzisz dzieci otwartego kontenera. Pierwsze kliknięcie wiersza tylko zaznacza rodzica. Drugie kliknięcie tego samego wiersza otwiera jego dzieci. Ścieżka nad nimi pokazuje wszystkich rodziców i pozwala wrócić na dowolny poziom. Wybór bezpośrednio na podglądzie działa tak samo: kolejne kliknięcia schodzą od zewnętrznej grupy do elementu szczegółowego.

Przykład ortografii:

**Cały ekran → Ustawienia trybu → Konfiguracja i start → Kafel ustawień → Grupa 3 · Ustal misję → Czas rundy → 3 min → tekst opcji.**

Hierarchia wynika z rzeczywistych rodziców renderowanego ekranu. Panel warstw pokazuje kolejność od góry do dołu, z pełnoekranowym tłem na spodzie. Oko przełącza widoczność, strzałki i przeciąganie zmieniają kolejność, a Spacer dodaje kontrolowany odstęp. Te zmiany układu są próbą w podglądzie; po wysłaniu elementu do Buildera kolejność i Spacer wchodzą do eksportowanego przepisu.

## Wybór i podgląd

Wybranie opcji czasu ustawia odpowiedni stan suwaka. Jeżeli trwa dyktando lub wybrana jest liczba słów, podgląd przełącza się na czas. W angielskim zamyka edytor kategorii, który zasłaniał czas. Kategorie i dyktanda otwierają właściwe panele. Chwilowo ukryci rodzice wracają przy wyborze dziecka. Otwarte sekcje, przewinięcie i wskazanie konkretnego elementu są synchronizowane z podglądem. Nie są zapisywane jako zmiana konfiguracji gry.

Dzieci z zamkniętych paneli są oferowane tylko wtedy, gdy Studio zna warunek ich odsłonięcia. Inne niewystępujące elementy nie są prezentowane jako dostępne. Wybór sprawdza widoczność, otwarte popupy oraz trafienie w element w podglądzie. Jeżeli renderowany stan nie pozwala go odsłonić, Studio zgłasza brak dostępności zamiast potwierdzać niewidoczny wybór. Nowy warunkowy panel wymaga dodania jawnego warunku odsłaniania w `bridge.mjs`.

## Wspólne i lokalne

**Kafel misji z ilustracją** i **Kafel ustawień** mają osobne wspólne przepisy. Ustawienie „W każdym widoku z tym elementem” edytuje rodzinę. Ilustracja, nagłówek, opis i ikony są oddzielnymi dziećmi. W trybie „Tylko ten widok” mają własne wyjątki. Lokalny tekst edytuje wyłącznie pojedynczy węzeł tekstowy, zachowując dzieci i obsługę przycisków. Przycisk przywracania usuwa wyjątek, a lokalny tekst ma pierwszeństwo przed tekstem zdefiniowanym dla ekranu.

Identyfikator tekstu nie zależy od tego, czy znajduje się na nim aktywny wskaźnik jelly. Dzięki temu przeniesienie zaznaczenia nie przenosi lokalnych ustawień na inny napis.

## Weryfikacja 5 października 2026

Przeprowadzono trzy przeloty w lokalnym Chrome na prawdziwych rendererach:

1. Pełna gałąź do 3 min, powrót od dzieci do rodziców, wyszukiwanie i odsłanianie czasu z trybu Słowa. Poprawiono szerokość etykiet oraz przeniesiono gałęzie obok podglądu, aby powiększyć telefon.
2. Ustawienia pięciu trybów, wyjście z dyktanda, stabilność identyfikatorów po zmianie opcji, lokalny tekst i przywracanie, popup pauzy i jego dzieci. Poprawiono odsłanianie czasu spod edytora kategorii angielskiego oraz obrys elementu w natywnym popupie.
3. Telefon 390 × 844 i 360 × 800, panele Wybór/Podgląd/Ustawienia, brak poziomego przepełnienia dokumentu. Poprawiono odsłanianie aktywnej opcji po zmianie szerokości. Osobno sprawdzono wspólny kafel, lokalną grafikę oraz odsłonięcie ukrytego rodzica.

Końcowa kontrola: **120 testów, 120 zaliczonych**, build kanoniczny poprawny, brak błędów aplikacji w przeglądzie pięciu trybów i telefonu. Testy modelu obejmują pełną ścieżkę, kolejność tła, bezpieczne zakończenie błędnej hierarchii oraz izolację lokalnego tekstu. Próby edycji odbyły się w odrębnych sesjach przeglądarki i nie zmieniły zapisanego `config.json`.

Weryfikacja dotyczy Chrome i symulowanych rozmiarów ekranu. Nie zastępuje próby na fizycznym iPhonie ani Safari. Produkcyjny `main` nie jest celem tych zmian.
