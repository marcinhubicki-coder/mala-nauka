# Praca wizualna w Design Studio

Aktualna instrukcja hierarchii, wyjątków i buildera: [Studio krok po kroku](studio-hierarchy-guide.md).

Panel służy do edycji wspólnych elementów aplikacji. Zmieniasz szkic i oglądasz skutki na rzeczywistych ekranach. Dopiero **Zapisz na GitHub** udostępnia zmianę innym branchom.

Na telefonie używaj dolnych przycisków **Wybór / Podgląd / Ustawienia** oraz menu **☰**. Suwaki mają przyciski **− / +**, a zapis pozostaje u góry. [Instrukcja mobilna](mobile-guide.md) opisuje ten układ.

## Chcę poprawić konkretny ekran

1. Otwórz **Komponenty → Według widoku** i wybierz ikonę ekranu oraz stanu.
2. Pierwsze kliknięcie elementu zaznacza go. Drugie otwiera jego dzieci. Ścieżka rodziców pozostaje widoczna nad listą.
3. Ikona przerwanego prostokąta włącza obrys. Czarna strzałka pozwala wskazać element bezpośrednio na ekranie.
4. Wybierz konkretną instancję lub **kontener wyżej**. Opcje w **Sprawdź stan w podglądzie** działają na przykładzie — np. Kategorie odsłaniają wybór grup słów.
5. Zmieniaj suwaki. Pomarańczowy znacznik i **Ostatnio zapisano** pokazują wartość zapisanej wersji. **Przywróć** cofa pojedynczą wartość; **Cofnij / Ponów** są zawsze w górnym pasku.
6. **Gdzie zastosować zmianę?** wybiera wszystkie użycia albo wyjątek dla jednego ekranu.

Obrys i wybieranie kliknięciem są niezależne. Gdy chcesz normalnie klikać w grę, wyłącz wybieranie kliknięciem; obrys może pozostać widoczny.

## Chcę zobaczyć wpływ w kilku miejscach

**Według elementu → Porównaj użycia** pokazuje listę powiązanych ekranów. Zaznacz te, które chcesz oglądać. **Ustawienia gier** wybiera zestaw powiązanych ustawień. Strzałka na krawędzi prawego panelu chowa lub przywraca ustawienia.

W porównaniu każdy ekran ma viewport **390 × 844**. **Dopasuj ekran** skaluje ramki według dostępnej wysokości, a szerokość pozostaje poziomym paskiem ekranów. Tryb 100% pokazuje naturalny rozmiar. Kliknięcie nagłówka telefonu wybiera aktywny ekran, istotny przy zmianie tylko tego widoku. Zmiana wspólna aktualizuje wszystkie otwarte podglądy, zachowując stan przykładu.

**Zmień nazwę elementu** zmienia etykietę używaną w studio. Relacje i działanie są zachowane.

## Chcę uporządkować lub schować element

Użyj kafelków w **Zawartości** po lewej stronie. Pierwsze kliknięcie zaznacza i rozwija jedno pokolenie, drugie otwiera tę gałąź.

| Opcja | Wynik |
| --- | --- |
| Oko | Pierwsze kliknięcie ukrywa i zachowuje miejsce, drugie usuwa miejsce, trzecie pokazuje element |
| Przeciąganie kafelka | Zmienia kolejność rodzeństwa; tło pełnoekranowe pozostaje na spodzie |
| Odstęp | Ustawia w pikselach odstęp między dziećmi otwartego kontenera |

Widoczność i kolejność są próbą w podglądzie. Odstęp jest lokalną regułą wyglądu kontenera i zapisuje się w szkicu. **Zresetuj stan podglądu** przywraca początkowy stan przykładowej gry i widoczność.

## Chcę zmienić zasadę dla grupy słów

**Baza słów i grafik → Zasady** pokazuje wspólne treści, liczbę powiązań i miniatury słów. Możesz szukać po nazwie i filtrować grupy liter.

1. Otwórz zasadę i sprawdź powiązane słowa.
2. Zmień nazwę lub wspólną treść; zapisz do szkicu.
3. Otwórz dwa powiązane słowa i sprawdź wynik. Przykłady, formy i źródła poszczególnych słów pozostają zachowane.
4. Zapisz commit, aby używały tego pozostałe branche.

Biblioteka ma **49 zasad i 455 przypisań** (41 dotychczasowych i 8 ogólnych dla dodatkowych pul). Dotychczasowe wyjaśnienia pozostają zachowane do świadomej edycji wspólnej zasady. W studio nie edytujesz osobnego wyjaśnienia pojedynczego słowa.

Słowo może mieć wiele wykrytych grup liter i dodatkowych powiązań z zasadami. Konkretna odpowiedź ćwiczona w grze nadal ma jedną zasadę główną. **Powiąż z kolejną zasadą** dodaje relację, a nie osobną treść.

Analiza „chrzanić” pokazuje **ch/h, rz/ż, ń/ni oraz ć/ci**. Wykrywanie liter nie dowodzi, że słowo podlega konkretnej regule. Sprawdzenie dowolnego słowa nie dodaje go automatycznie do gry.

## Chcę uporządkować grafiki

**Słowa** pokazują miniatury, grupy liter i współdzielenie obrazka. Otwórz słowo, żeby zobaczyć wszystkie użycia jego grafiki. **Wybierz z bazy** otwiera wizualny wybór obrazków; można szukać po słowach używających danej grafiki.

**Grafiki** pokazują liczbę przypisanych słów i filtr **Używane przez kilka słów**. Zaznacz co najmniej dwie grafiki, wybierz **Scal wybrane grafiki**, obejrzyj słowa objęte zmianą i wskaż obrazek docelowy. Wszystkie powiązania przejdą do jednego obrazka. Starsze pliki pozostają dostępne; ich aliasy prowadzą do wybranego obrazka. Cofnij przywraca poprzednie przypisania.

Scalaj grafiki tylko wtedy, gdy wybrany obrazek pasuje do wszystkich pokazanych słów. Samo wybranie nowego obrazka dla jednego słowa nie zmienia ilustracji innych słów.

Upload obsługuje PNG, JPG, WebP i AVIF do 12 MB. Ilustracja słowa ma proporcję 1:1. Szkic pliku przetrwa odświeżenie w tej samej przeglądarce.

## Chcę obejrzeć animację

**Animacje → Guziki i slidery** pokazuje prawdziwe ekrany gry dla Jelly, błędnej odpowiedzi i wyniku rundy. **Odtwórz przykład** uruchamia zachowanie, a **Porównaj z zapisanym** zestawia zapisany i roboczy wariant. Presety zmieniają charakter ruchu bez zmiany rozmiaru ani koloru. Zwijane grupy rozdzielają bryłę Jelly, światło, tekst, oba slidery, pasek postępu i animowane liczby.

Oba slidery używają tej samej deformacji co Jelly w Komponentach. Uchwyt rozciąga się podczas przeciągania, miękko wraca po przerwanym geście i osiada po ukończeniu. Zachowuje przy tym własną skórkę: slider po błędzie ma iskrę, a slider nowej rundy komunikat końcowy. Systemowe ograniczanie ruchu wyłącza deformację i sprężynowanie.

**Animacje → Przejścia między ekranami** pozwala wybrać rzeczywiste połączenie dwóch ekranów, styl przejścia, czas, odległość przesunięcia i tempo. **Odtwórz przejście** pokazuje zmianę. **Pętla** powtarza przejścia w obu kierunkach, a **Przerwa między ekranami** daje czas na ich obejrzenie. **Zatrzymaj** i wyjście z zakładki kończą pętlę. Styl, czas, odległość i tempo są zapisane osobno dla połączenia; powrót może dziedziczyć lub mieć własne ustawienia.

## Chcę zapisać bez zgubienia zmian

Szkic jest zapisywany w tej przeglądarce. **Wersje i szkice** pokazują zmiany z nazwami elementów, grafik i zasad. Możesz odrzucić cały szkic; tę czynność można cofnąć.

GitHub wymaga jednorazowego połączenia tokenem ograniczonym do repozytorium z uprawnieniem `Contents: Read and write`. Token pozostaje w pamięci karty. Przed zapisem zobaczysz zakres zmiany i opis commitu.

Jeśli ktoś zmienił to samo ustawienie, wybierz **Wczytaj i scal z GitHub**. Karty konfliktów pokazują **Twoją wersję** i **Zapisaną na GitHub**. Wybierz dla każdej różnicy; niezależne zmiany połączą się automatycznie. Anulowanie zachowuje szkic. Równoległy commit blokuje nadpisanie brancha.

Przycisk **?** w górnym pasku otwiera szybkie wejścia do powyższych scenariuszy.
