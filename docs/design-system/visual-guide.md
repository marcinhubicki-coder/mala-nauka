# Praca wizualna w Design Studio

Panel służy do edycji wspólnych elementów aplikacji. Zmieniasz szkic i oglądasz skutki na rzeczywistych ekranach. Dopiero **Zapisz na GitHub** udostępnia zmianę innym branchom.

## Chcę poprawić konkretny ekran

1. Otwórz **Komponenty → Według widoku** i wybierz ekran oraz stan.
2. Pastylki pokazują elementy obecne w tym ekranie. **Pokaż pozostałe** wyświetla niewystępujące elementy jako nieaktywne.
3. Kliknij pastylkę. **Pokaż wybrany element** włącza obrys na telefonie. **Wybierz kliknięciem** pozwala wskazać element bezpośrednio na ekranie.
4. Wybierz konkretną instancję lub **kontener wyżej**. Opcje w **Sprawdź stan w podglądzie** działają na przykładzie — np. Kategorie odsłaniają wybór grup słów.
5. Zmieniaj suwaki. Pomarańczowy znacznik i **Ostatnio zapisano** pokazują wartość zapisanej wersji. **Przywróć** cofa pojedynczą wartość; **Cofnij / Ponów** są zawsze w górnym pasku.
6. **Gdzie zastosować zmianę?** wybiera wszystkie użycia albo wyjątek dla jednego ekranu.

Obrys i wybieranie kliknięciem są niezależne. Gdy chcesz normalnie klikać w grę, wyłącz wybieranie kliknięciem; obrys może pozostać widoczny.

## Chcę zobaczyć wpływ w kilku miejscach

**Według elementu → Porównaj użycia** pokazuje listę powiązanych ekranów. Zaznacz te, które chcesz oglądać. **Ustawienia gier** wybiera zestaw powiązanych ustawień. **Więcej miejsca na ekrany** chowa ustawienia z boku; **Pokaż ustawienia** przywraca je.

W porównaniu każdy ekran ma viewport **390 × 844** i nie jest skalowany. Dwa mieszczą się obok siebie, jeśli dostępna szerokość pozwala; kolejne przechodzą do następnego rzędu. Porównanie przewijasz. Kliknięcie nagłówka telefonu wybiera aktywny ekran, istotny przy zmianie tylko tego widoku. Zmiana wspólna aktualizuje wszystkie otwarte podglądy, zachowując stan przykładu.

**Zmień nazwę elementu** zmienia etykietę używaną w studio. Relacje i działanie są zachowane.

## Chcę na chwilę schować element

W inspektorze rozwiń **Warstwy i widoczność**.

| Opcja | Wynik |
| --- | --- |
| Widoczny | Przywraca element |
| Ukryj — zachowaj miejsce | Element znika, jego miejsce pozostaje |
| Ukryj — przesuń pozostałe | Element znika razem z miejscem; pozostałe reagują na zmianę układu |
| Wszystkie elementy tej rodziny w ekranie | Działa na całą rodzinę zamiast jednej instancji |
| Pokaż wszystkie warstwy | Przywraca pełny widok |

To ustawienia chwilowe podglądu; nie są zapisywane do wspólnego wyglądu. **Zresetuj stan podglądu** przywraca również początkowy stan przykładowej gry.

## Chcę zmienić zasadę dla grupy słów

**Baza słów i grafik → Zasady** pokazuje wspólne treści, liczbę powiązań i miniatury słów. Możesz szukać po nazwie i filtrować grupy liter.

1. Otwórz zasadę i sprawdź powiązane słowa.
2. Zmień nazwę lub wspólną treść; zapisz do szkicu.
3. Otwórz dwa powiązane słowa i sprawdź wynik. Przykłady, formy i źródła poszczególnych słów pozostają zachowane.
4. Zapisz commit, aby używały tego pozostałe branche.

Biblioteka ma **41 zasad i 455 przypisań**. Dotychczasowe wyjaśnienia pozostają zachowane do świadomej edycji wspólnej zasady. W studio nie edytujesz osobnego wyjaśnienia pojedynczego słowa.

Słowo może mieć wiele wykrytych grup liter i dodatkowych powiązań z zasadami. Konkretna odpowiedź ćwiczona w grze nadal ma jedną zasadę główną. **Powiąż z kolejną zasadą** dodaje relację, a nie osobną treść.

Analiza „chrzanić” pokazuje **ch/h, rz/ż, ń/ni oraz ć/ci**. Wykrywanie liter nie dowodzi, że słowo podlega konkretnej regule. Sprawdzenie dowolnego słowa nie dodaje go automatycznie do gry.

## Chcę uporządkować grafiki

**Słowa** pokazują miniatury, grupy liter i współdzielenie obrazka. Otwórz słowo, żeby zobaczyć wszystkie użycia jego grafiki. **Wybierz z bazy** otwiera wizualny wybór obrazków; można szukać po słowach używających danej grafiki.

**Grafiki** pokazują liczbę przypisanych słów i filtr **Używane przez kilka słów**. Zaznacz co najmniej dwie grafiki, wybierz **Scal wybrane grafiki**, obejrzyj słowa objęte zmianą i wskaż obrazek docelowy. Wszystkie powiązania przejdą do jednego obrazka. Starsze pliki pozostają dostępne; ich aliasy prowadzą do wybranego obrazka. Cofnij przywraca poprzednie przypisania.

Scalaj grafiki tylko wtedy, gdy wybrany obrazek pasuje do wszystkich pokazanych słów. Samo wybranie nowego obrazka dla jednego słowa nie zmienia ilustracji innych słów.

Upload obsługuje PNG, JPG, WebP i AVIF do 12 MB. Ilustracja słowa ma proporcję 1:1. Szkic pliku przetrwa odświeżenie w tej samej przeglądarce.

## Chcę obejrzeć animację

**Animacje** pozwalają wybrać dwa rzeczywiste ekrany, styl przejścia, czas, odległość przesunięcia i tempo. **Odtwórz przejście** pokazuje zmianę. **Pętla** powtarza przejścia w obu kierunkach, a **Przerwa między ekranami** daje czas na ich obejrzenie. **Zatrzymaj** i wyjście z zakładki kończą pętlę.

Styl, czas, odległość i tempo trafiają do wspólnej konfiguracji; pętla, przerwa i wybrana para są ustawieniami podglądu. Systemowe ograniczanie ruchu wyłącza animację także w podglądzie. Animacja przełącznika jelly ma osobne suwaki w Komponentach.

## Chcę zapisać bez zgubienia zmian

Szkic jest zapisywany w tej przeglądarce. **Wersje i szkice** pokazują zmiany z nazwami elementów, grafik i zasad. Możesz odrzucić cały szkic; tę czynność można cofnąć.

GitHub wymaga jednorazowego połączenia tokenem ograniczonym do repozytorium z uprawnieniem `Contents: Read and write`. Token pozostaje w pamięci karty. Przed zapisem zobaczysz zakres zmiany i opis commitu.

Jeśli ktoś zmienił to samo ustawienie, wybierz **Wczytaj i scal z GitHub**. Karty konfliktów pokazują **Twoją wersję** i **Zapisaną na GitHub**. Wybierz dla każdej różnicy; niezależne zmiany połączą się automatycznie. Anulowanie zachowuje szkic. Równoległy commit blokuje nadpisanie brancha.

Przycisk **?** w górnym pasku otwiera szybkie wejścia do powyższych scenariuszy.
