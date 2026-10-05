# Studio: hierarchia, lokalne zmiany i szkice

Otwórz **Komponenty → Według widoku**. Najpierw wybierz kategorię: **Ekran logowania**, **Ekran główny**, **Moje wyniki** lub **Tryb gry**. Dopiero w Trybie gry wybierasz ortografię, angielski, flagi, czytanie albo matematykę. Wybór gracza nie jest stanem ortografii.

## Zmień konkretny element

1. Wybierz ekran. Gałęzie i ich dzieci wynikają z faktycznie otwartego widoku. Po kliknięciu przycisku wewnątrz podglądu Studio rozpoznaje nowy ekran.
2. Włącz **Pokaż wybrany element**, wskaż pastylkę lub użyj wyboru kliknięciem.
3. Zacznij od kontenera i schodź po jego dzieciach. Tło jest pierwszą warstwą w grupie; pozostałe elementy zachowują kolejność ekranu. Pełna ścieżka rodziców pozwala wrócić na dowolny poziom. Wybranie dziecka odsłania wymagany stan. [Aktualna nawigacja komponentów i weryfikacja](component-navigation.md).
4. Zacznij od **Tylko ten widok**. Kolor, rozmiar, ikona i grafika stają się wyjątkiem tego elementu. **Wspólny przepis** zmienia jego rodzinę.
5. Każde pole pokazuje pochodzenie: globalne, lokalne, styl komponentu albo wariant trybu. **Dziedzicz** usuwa wyjątek. Znacznik **Zapisane** pozwala wrócić do wartości sprzed zabawy.

| Ekran | Dostępne grupy i elementy |
| --- | --- |
| Start | Logo, ustawienia, kafel wyników, dwa moduły ikona–wartość–opis, strzałka postępów, tytuł przygód, pięć kafli trybów i ich teksty |
| Nowy gracz | Formularz, podgląd avatara, wybór avatara, imię i przyciski |
| PIN | Kontener profilu, avatar i imię, osobny przełącznik PIN, instrukcja, cztery kropki, klawiatura i pojedyncze klawisze |
| Gra | Zegar, pytanie, odpowiedzi, tekst informacji i kontenery |
| Koniec rundy | Wynik, statystyki, poprawne odpowiedzi i błędy, przyciski, pasek postępu i uchwyt kontynuacji |

**Zegar gry** i **pasek wyniku** są oddzielnymi elementami. Zmiana jednego nie steruje drugim. Uchwyt kontynuacji powiększa się wokół środka i pozostaje w wysokości szyny.

Strzałka do postępów i gwiazdka są ikonami. W ich ustawieniach wybierz inną ikonę i kolor. Grafiki i tła mają wybór assetu, dopasowanie, położenie i skalę. Tekst wbudowany w bitmapę można zmienić przez wymianę grafiki; napisy przeniesione do elementów ekranu edytuje się niezależnie.

## Globalne i lokalne

Wspólny przepis jest przypisany do rodziny elementów, np. odpowiedzi w grze, głównych przycisków, kafli przygody albo klawiszy PIN. Zmiana kafla nie powinna zmieniać wszystkich kontenerów aplikacji.

Ortografia pozostaje wzorcem ustawień i jelly, a wspólny cień pochodzi z angielskiego. Kompaktowe odpowiedzi angielskiego, flag, czytania i matematyki są wariantami trybów. Inspektor pokazuje ich pochodzenie; lokalny wyjątek wybranego ekranu ma pierwszeństwo. PIN ma własny przepis, dzięki czemu porządkowanie małego toggle nie przebudowuje go przypadkiem.

**Zastąp przepis elementu** przejmuje wygląd innego przepisu. Zachowuje funkcję przycisku i połączenia. Nie zmienia automatycznie mechaniki elementu.

## Builder

**Buduj element**: pracujesz na osobnym komponencie, na szarym tle. Kolor przestrzeni można zmienić. **Buduj widok**: pracujesz na ekranie 390 × 844.

W bibliotece są szablony produkcyjne i zapisane szkice. Wybrany element rzeczywistego ekranu można skopiować do buildera wraz z dziećmi.

- Wybierz kontener i dodaj do niego warstwę.
- **Wyżej / Niżej** zmienia kolejność w tym samym kontenerze.
- Checkbox w drzewie ukrywa warstwę z przesunięciem pozostałych. W ustawieniach można zamiast tego zachować jej miejsce.
- Ukryta warstwa pozostaje w drzewie i jest wyszarzona.
- Szerokość, wysokość, padding i odstępy szkicu mają pierwszeństwo przed jego domyślnym przepisem.
- **Skopiuj opis .md** przygotowuje szkielet, hierarchię i instrukcję do mockupu.

Szkic nowego widoku można przenieść do **Projekt i wydanie**, gdzie ustawiasz teksty, funkcje przycisków, stany i flow prototypu. Builder sam nie zastępuje istniejącego ekranu produkcyjnego.

## Flow i animacje

**Widoki i relacje** pokazują ścieżkę od wyboru lub tworzenia gracza przez ustawienia gry, rozgrywkę i wyniki do powrotów. Połączenie ma nazwę przycisku i warunek. Można otworzyć ekran i wskazać źródłowy przycisk.

Lista **Animacje** wynika z rzeczywistych połączeń ekranów. Każda para ma własne ustawienia. Powrót może dziedziczyć ustawienia przejścia w przód albo mieć własne. Stan dobrej lub złej odpowiedzi nie tworzy fikcyjnego przejścia między ekranami.

Połączenia istniejącej gry opisują działającą mechanikę. Przepinanie funkcji w nowych widokach odbywa się w flow prototypu; nie jest automatyczną zmianą kodu istniejącej gry.

## Bańka i efekty

Lab zaczyna się od stanu **Bańka · spoczynek**. Ustaw kształt, skórkę, tempo, falę i ruch, potem dodawaj poprawną odpowiedź, pomyłkę lub combo. Impulsy mogą się nakładać i wygasają niezależnie. Combo może przechodzić między kołem, trójkątem, rombem i wielobokami.

Wpisanie liczby poza bieżącym zakresem rozszerza suwak. Twardy bezpieczny limit pozostaje. Jedna membrana i ograniczona liczba impulsów oraz cząsteczek ograniczają koszt efektu.

Miernik opisuje dostępne dane o klatkach, czas pracy JavaScript i pamięć JS, jeśli przeglądarka ją udostępnia. Kolory są budżetem narzędzia. Studio nie udaje pomiaru watów ani fizycznego obciążenia CPU lub GPU.

## Projekt, telefon i zapis

Projekt zaczyna się od czterech prostych działań. Podstawowe zakładki to **Mój projekt**, **Projektuj** i **Sprawdź i pokaż**. Plan, historia i szczegóły wdrażania są pod nimi.

**Sprawdź Studio na telefonie** otwiera tę samą aplikację w ramce 390 × 844. To podgląd narzędzia, nie gry. Po pracy w ramce użyj **Wróć i wczytaj zmiany**. Na telefonie przełączaj Wybór, Podgląd i Ustawienia.

Zabawy są szkicem przeglądarki. Dopiero świadomy **Zapisz na GitHub** tworzy commit. Trzy iteracje porządkowania nie zapisują eksperymentów użytkownika do konfiguracji ani projektu.

Baza ma 455 słów, z czego 451 ma obecnie przypisaną ilustrację. **Chata, chrzan, dach i wieża** czekają na grafikę po czyszczeniu assetów. Pozostają w Studio; gra pomija je do czasu przypisania ilustracji. Liczniki pokazują osobno zawartość bazy i słowa gotowe do gry.
