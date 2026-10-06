# Nowe słowa, przepisy atomów i builder

Panel na `design/system-v1`: **Nowe słowa · batchy**, **Builder i przepisy**, **Efekty i bańka**. Zmiany zapisujesz dotychczasowym przyciskiem **Zapisz na GitHub**. Wszystkie widoki gry korzystają ze wspólnej bazy i przypisania ilustracji; nie tworzysz kopii grafiki dla każdej kategorii.

## Minimum 100 słów w kategorii

Przygotowano **247 propozycji w 13 batchach**. Dziewięć haseł usunięto, ponieważ przeciwna odpowiedź tworzyłaby poprawną formę lub poprawne słowo; w kolejnych hasłach wyłączono tylko niejednoznaczną kategorię. Są propozycjami do Twojej oceny, nie zatwierdzonym materiałem. Każde hasło przechodzi kontrolę struktury, powtórzeń i zapisu ćwiczonych grup liter przed umieszczeniem w kolejce. Ta analiza nie zastępuje oceny językowej, przydatności słowa dla dziecka ani zgodności zdjęcia. Początkowa trudność jest sugestią; możesz zmienić ją osobno dla każdej kategorii.

| Kategoria | Opublikowane w grze | Nowe zaznaczone propozycje | Plan po przyjęciu wszystkich |
| --- | ---: | ---: | ---: |
| u/ó | 235 | 39 | 274 |
| rz/ż | 152 | 16 | 168 |
| ch/h | 102 | 11 | 113 |
| ć/ci | 52 | 73 | 125 |
| ś/si | 20 | 88 | 108 |
| ź/zi | 15 | 96 | 111 |
| ń/ni | 37 | 66 | 103 |
| dź/dzi | 17 | 89 | 106 |

W grze nadal jest **455 unikalnych słów**. Minimum 100 dla każdej kategorii będzie osiągnięte po Twoim przyjęciu wystarczającej liczby propozycji, uzupełnieniu zdjęć i zapisaniu commitu. Bufor ponad 100 pozwala odrzucić część propozycji. Liczniki przeliczają się po odznaczeniu hasła. Jeśli odłożysz za dużo słów z danej grupy, panel pokaże, ile jeszcze brakuje.

Kategorie mogą się nakładać, ale nie każda wykryta para liter musi być ćwiczona. „Brzuch” to jedno hasło i jedna ilustracja: zwiększa pule u/ó, rz/ż i ch/h po jednym. Przy hasłach niejednoznacznych wyłącz kategorię, jeżeli druga odpowiedź tworzy poprawną odmianę lub inne poprawne słowo — np. „grzebień” zostaje w rz/ż, ale nie w ń/ni, bo „grzebieni” jest poprawne. Dla każdej włączonej kategorii gra pokazuje tylko jedną lukę. Nie powtarza hasła w tej samej rundzie.

## Przyjmij batch w trzech krokach

1. **Lista.** Wszystkie słowa są zaznaczone. Odznacz hasła, które w ogóle się nie nadają. Przy każdym słowie możesz też wyłączyć pojedynczą kategorię, gdy alternatywny zapis jest poprawną formą lub innym poprawnym słowem. Musi zostać co najmniej jedna kategoria; w przeciwnym razie odznacz całe hasło. Możesz wcześniej zmienić sugerowane poziomy. Nic jeszcze nie trafia do gry.
2. **Ilustracje i poziomy.** Wgraj zdjęcie przy haśle lub wybierz istniejącą ilustrację ze wspólnej bazy. Ten sam plik może obsługiwać kilka słów — karta pokaże ich liczbę. Zdjęcie słowa powinno być kwadratowe; kontrola dopuszcza odchylenie proporcji do 4%. Wybór z bazy sprawdza rzeczywiste wymiary pliku, także dla starszych ilustracji bez zapisanych wymiarów.
3. **Końcowa akceptacja batcha.** Gdy wszystkie zaznaczone słowa mają poprawne przypisania, zdjęcia i poziomy, wybierz **Sprawdź i zaakceptuj batch**. Zobaczysz całą grupę z miniaturami. **Akceptuj cały batch** dodaje ją do szkicu. Dopiero **Zapisz na GitHub** publikuje ją w grze.

Możesz wrócić do listy przed końcową akceptacją. Po akceptacji wybierz **Odłożone słowa → nowy batch**, aby ponownie ocenić pominięte hasła. Zaakceptowane słowa pozostają w poprzedniej grupie. Przeniesienie nie tworzy duplikatów.

**Wgraj grafiki grupą** dopasowuje pliki do zaznaczonych słów po nazwie: `śnieg.jpg` lub `snieg.jpg`. Nazwa musi być jednoznaczna. Przy niejednoznacznym dopasowaniu użyj polskich znaków. Obsługiwane: JPG, PNG, WebP, AVIF; do 12 MB na plik, 48 plików i 64 MB na grupę. Niepasujące pliki i błędne proporcje otrzymują opis błędu. Pliki są sprawdzane kolejno, a identyczne zawartości otrzymują jedno kanoniczne przypisanie. **Eksportuj listę** pobiera zaznaczone hasła jako plik tekstowy, co ułatwia nazwanie ilustracji.

Nowy batch dodasz przez **Dodaj batch**: jedno słowo na wiersz, do 60 słów. Duplikaty bazy i kolejki są odrzucane przed dodaniem. System wykrywa możliwe kategorie z pisowni, a podczas przeglądu możesz wyłączyć te, które dawałyby językowo poprawny „błędny” wariant.

## Zbuduj element na sucho

W **Builder i przepisy → Buduj element** wybierz kafel, fiszkę, popup, przycisk, ikonę z numerem albo jelly, potem **Nowy element**. Drzewo pokazuje płótno, podkład, sekcje i atomy. Wybierasz warstwę w drzewie albo przez kliknięcie podglądu.

- Zmieniaj szerokość, wysokość, padding i odstępy. Wymiar 0 oznacza automatyczne dopasowanie do treści. Znacznik na suwaku pokazuje zapisaną wartość.
- Dodawaj warstwy do kontenera, usuwaj je, przesuwaj strzałkami albo przeciągaj. Upuszczenie na kontener przenosi warstwę do jego dzieci. Spacer jest osobną warstwą i może być przesuwany jak każdy element.
- Przełącz tryb, aby porównać palety ortografii, angielskiego, flag, czytania i matematyki.
- Przełącz stan: przed wyborem, poprawny, błędny, wyłączony. To próba wyglądu; nie zapisuje odpowiedzi gracza.
- **Ukryta · zachowaj miejsce** wyłącza rysowanie warstwy, zachowując jej miejsce. **Ukryta · przesuń elementy** usuwa ją z układu próbki.
- **Cofnij w próbce** i **Ponów** dotyczą lokalnej konstrukcji. Górny **Cofnij** dotyczy wspólnego szkicu systemu.
- Nadaj nazwę i wybierz **Zapisz próbkę w bibliotece**. Zapisana konstrukcja trafi do commitu z konfiguracją i będzie dostępna jako punkt startowy. Nie zastępuje automatycznie działającego widoku gry.

Próbka i szkic przetrwają odświeżenie w tej samej przeglądarce. Na telefonie używasz przełączników **Warstwy / Podgląd / Ustawienia**. Podgląd zachowuje płótno 390 px i dopasowuje się do miejsca. Formularze mają dotykowe przyciski oraz pomocnicze − / + przy liczbach.

## Globalne przepisy rodzin i atomów

W zakładce **Globalne przepisy** najpierw wybierasz rodzinę: jelly, guziki, kafle, odpowiedzi, slidery akcji, postęp albo przełączniki. Jej suwaki edytują te same tokeny, których używają prawdziwe komponenty. Hierarchia ma kolejność: rodzina → wariant komponentu → widok → pojedynczy element. Przycisk obok próbki otwiera rodzinę w Komponentach.

Niżej są atomy treści: tytuł ekranu, podtytuł, nagłówek sekcji, numer + tekst, wyróżnik, podpowiedź, nagłówek popupu i etykieta przycisku. Przepis atomu określa rozmiar i grubość pisma, interlinię, odstępy, padding oraz rolę fontu.

Początkowo obowiązują dotychczasowe style komponentów. Suwaki pokazują próbkę lokalną. **Zastosuj globalny przepis** włącza go w rzeczywistych ekranach. Obok są rodzice atomu i linki do ich widoków — otwórz ekran i sprawdź konkretną kompozycję. Nie każdy stan rodzica zawiera każdy atom. **Przywróć styl komponentów** wyłącza dany przepis; **Cofnij** przywraca poprzednią konfigurację.

Włączony przepis ma pierwszeństwo dla typografii atomu. Podkłady, kolory stanów i mechanika interakcji nadal wynikają z komponentów. Sześć branchy konsumentów pobiera moduł przepisów ze wspólnego źródła.

## Kolory miernika

Miernik pokazuje tylko dostępne pomiary. Waty, procent CPU/GPU i fizyczne zużycie RAM telefonu nie są dostępne w tym narzędziu i nie mają pól w interfejsie. **Przygotowanie efektu · JS** to czas utworzenia efektu, a **Pamięć JS** dotyczy całej karty i pojawia się tylko w przeglądarkach udostępniających te dane.

| Pomiar | Zielony | Żółty | Czerwony |
| --- | --- | --- | --- |
| Płynność | ≥55 FPS i p95 ≤20 ms | ≥30 FPS i p95 ≤50 ms, gdy nie spełnia zielonego | poniżej progu żółtego |
| Przygotowanie efektu · JS | ≤8 ms | >8 i ≤16,7 ms | >16,7 ms |
| Sterta JS względem limitu przeglądarki | <50% | 50–75% | >75% |

Są to **orientacyjne budżety narzędzia**, nie uniwersalne limity procesora ani telefonu. Cel podglądu to stabilne 60 FPS; iPhone 13 Pro może odświeżać ekran szybciej. Ogólny status przyjmuje najgorszy z dostępnych pomiarów. Bez wystarczającej próbki klatek sam niski czas przygotowania nie daje zielonego statusu całości. Pamięć bez informacji o limicie ma neutralny status.

Rozwiń **Jak czytać kolory i ograniczać obciążenie?**. Odtwarzaj w aktywnej karcie; pętla zbiera dłuższą próbkę. Po zmianie ustawień rozpocznij nową próbę. Karta w tle lub zdalny podgląd mogą zmienić wynik. Desktopowy wynik nie zastępuje testu na telefonie.

**Bańka i zmiana obrazka → Przeliczanie kształtu bańki:** 24 Hz to domyślna częstotliwość aktualizacji geometrii; 15 Hz jest próbą oszczędnego wariantu; 30 Hz daje częstsze aktualizacje. Nie ogranicza to klatek animacji drobinek. Porównaj oba warianty: mniejsza liczba obliczeń nie gwarantuje identycznej percepcji ani określonej oszczędności baterii. Przy cięższym efekcie ogranicz też drobinki, rozmycie i długość efektu.

Podstawa zaleceń: [web.dev — koszt animacji](https://web.dev/articles/animations-overview), [MDN — płynność animacji](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Animation_performance_and_frame_rate). Transformacje i przezroczystość są preferowane nad animowaniem układu; czas klatki dla 60 FPS wynosi ok. 16,7 ms. Kolory powyżej są lokalnym kontraktem tego narzędzia.
