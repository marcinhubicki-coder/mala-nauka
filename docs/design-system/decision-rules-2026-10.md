# Mała Nauka / Design Studio — reguły decyzji projektowych

**Wersja:** 2026-10-17 · **Zakres retrospekcji:** 03–17.10.2026 · **Status:** reguły robocze do stosowania przy każdej kolejnej zmianie V2.
**Pochodzenie:** uwagi, akceptacje i żądania korekt użytkownika z rozmów projektu Homework, skonfrontowane z aktualnymi dokumentami V2. To dokument interpretujący intencję projektową, a nie kopia tokenów ani alternatywna konfiguracja.

**Źródła techniczne:** [zasady i tokeny](principles.md), [Atomic Design](../V2-ATOMS-AND-TYPOGRAPHY.md), [kontrakty 41 widoków](../V2-ALL-VIEW-CONTRACTS.md), [akceptacja wizualna](../V2-VISUAL-ACCEPTANCE.md), [wspólny runtime](unified-runtime.md), [biblioteka assetów](../V2-CANONICAL-IMAGE-INDEX.md), [styl ilustracji Ortografii](../ORTHOGRAPHY-IMAGE-STYLE.md). W razie konfliktu danych źródłem jest produkcyjny kontrakt/asset, nie opis w tym pliku.

## 1. Jak rozstrzygać decyzje

### Kolejność priorytetów
1. **Zakres zlecenia i ostatnia wyraźna korekta użytkownika.** „Zmień tylko tło”, „resztę zostaw”, „bez budynków”, „kompas zostaje” są ograniczeniami, nie sugestiami. Późniejsza korekta konkretnego ekranu ma pierwszeństwo przed starszą propozycją.
2. **Zatwierdzony wzorzec i semantyka.** Jeśli jest mockup/screenshot produkcyjny, odtwarzaj jego kompozycję, nie projektuj ponownie według własnego gustu. Nie zamieniaj wzorca fragmentu na referencję całego ekranu.
3. **Zachowanie i funkcjonalność.** Interakcja, stany, treść i czytelność muszą działać na prawdziwym urządzeniu.
4. **Jedna architektura i edytowalność.** To samo zachowanie i wygląd w Studio i w PWA, bez lokalnych „plastrów” i dodatkowych duplikatów.
5. **Płynność i wydajność.** Optymalizuj implementację, nie psując zaakceptowanej estetyki. Jeśli budżet urządzenia zmusza do kompromisu, pokaż różnicę zamiast milcząco upraszczać.

Te pięć wymagań jest **koniunkcją bramek jakości**, a nie pięcioma wymiennymi priorytetami. Ładny mockup nie usprawiedliwia niedziałającej gry, a przechodzące testy nie usprawiedliwiają złego wyglądu.

### Status każdej reguły
- **D — decyzja wprost:** użytkownik powiedział „ma być”, „tylko”, „bez”, zatwierdził konkretny wariant lub poprawkę.
- **W — wywnioskowana preferencja:** powtarzająca się cecha poprawek; stosuj jako domyślny kierunek, ale nie twierdź, że użytkownik zatwierdził konkretny nowy ekran.
- **P — propozycja:** inspiracja, hipoteza albo technika do sprawdzenia; nie wdrażaj jako bezwarunkowo zaakceptowanej specyfikacji.

Nie interpretuj „ok, kontynuuj” jako akceptacji każdego piksela, każdego wdrożenia Vercela czy pominiętego testu.

## 2. Sposób myślenia o projekcie

1. **D / kompozycja zachowana:** poprawka ma być lokalna. Nie zmieniaj przy okazji kadru, fontu, koloru, animacji czy hierarchii niezwiązanej z poleceniem. Przed zmianą zapisz elementy **chronione przed regresją**.
2. **D / pixel-perfect:** produkcyjne zrzuty i zaakceptowane mockupy są punktem odniesienia. Zmiany porównuj nakładką, geometrią i stanem, a nie z pamięci. Preferowana baza to iPhone 13 Pro pionowo, logiczne 390 × 844, safe area i Retina 3×. Podgląd desktopowy nie dowodzi poprawnego iOS PWA.
3. **D / funkcjonalna prostota:** jeden atom ma jedną odpowiedzialność. Strzałka w kółku to jeden wariant atomu „powrót”, nie kilka niezgodnych przepisów. Dwa sąsiadujące przyciski podsumowania pozostają dwiema osobnymi akcjami; ich wspólne położenie nie uzasadnia nowej grupy funkcjonalnej.
4. **D / pięć poziomów Atomic Design:** atom → grupa/molekuła → rodzina/organizm → szablon → widok. Grupuj według funkcji i semantyki, a nie przypadkowego kontenera DOM. Kafel gry jest grupą z samodzielnie edytowalnymi tekstami, ikonami, podkładem i dekoracją.
5. **D / projekt edytowalny:** tekst, ikony, kształty, cienie, odstępy, gradienty i stany mają być niezależnymi właściwościami atomów, chyba że dany zaakceptowany obraz jest celowo jedną sceniczną ilustracją. Nie rasteryzuj całego interfejsu dla szybkiego uzyskania podobnego wyglądu.
6. **D / warianty zamiast wyjątków:** preferuj komponent → stan/wariant → lokalne nadpisanie. Zakres „wspólny / tylko ten widok” oraz pochodzenie wartości mają być widoczne. Nie mnoż plików CSS vNN, rodzin, kopii komponentów ani ukrytych nadpisań.

## 3. Kontrakt Design Studio ↔ PWA

- **D:** Studio jest silnikiem wspólnego projektu, nie dekoracyjnym edytorem obok gry. Rzeczywiste renderery i 41 jawnych kontraktów widoków służą obu środowiskom. Spis/inwentarz Studio jest pochodny, a nie drugim źródłem prawdy. Bez heurystycznego odtwarzania znaczenia z DOM i jednorazowych łatek.
- **D:** ten sam stan, ta sama typografia, wymiary, assety, widoczność, kolejność, zachowania i animacje muszą przejść od edycji przez Test PWA do przeglądarki telefonu. Sam poprawny Preview Studio nie zamyka zadania.
- **D:** „hidden” ukrywa element z zachowaniem miejsca; „removed” usuwa element z układu. Eksport respektuje wybrany stan; brak renderowania w Studio nie może ujawniać elementu w PWA.
- **D:** renderowanie i akcje muszą pozostawać aktywne po przejściu Start → Gra. Ekran przycięty albo przyciski reagujące tylko w edytorze są blockerem, nawet przy zielonym buildzie.
- **D:** globalna zmiana pokazuje wszystkie dotknięte użycia, a lokalna nie wpływa na inne moduły. Zmiana ID, porządku listy czy instancji nie może przenosić stylu na inny rekord.
- **D:** wydania rozdzielają lokalny szkic → zapis GitHub → niezmienny Preview/commit SHA → Test PWA → ewentualna produkcja. Nie publikuj automatycznie na main; nie mów „wdrożone”, dopóki nie wiadomo, co i pod jakim URL/commitem naprawdę działa.

## 4. Użyteczność Studio dla osoby średnio zaawansowanej

- **D:** nie wystarczy, że funkcja „gdzieś istnieje”. Ma dać się łatwo **odkryć**, zrozumieć zakres skutków i bezpiecznie cofnąć. Układ menu wynika z zadania użytkownika, nie z implementacji.
- **D:** podstawowy przepływ: wybierz ekran → stan → element → zakres (wspólny/lokalny) → popraw → porównaj → zapisz → przetestuj. Powiązane narzędzia trzymaj w jednym kontekście. Unikaj 16 równorzędnych kategorii i duplikacji wejść.
- **D:** drzewo odpowiada realnej semantycznej hierarchii, ma jednoznaczne zaznaczenie, breadcrumbs i nawigację do wystąpień. Nie nazywaj całego ekranu „atomem”. Ukryte elementy nie powinny udawać edytowalnych.
- **D:** inspektor i biblioteka powinny rozróżniać **próbkę**, **wspólny przepis**, **stan** i **konkretną instancję**; identyfikatory muszą być stabilne. Zachowuj kontekst otwartych sekcji, przewinięcia i aktywnego scenariusza.
- **D:** ustawienia i menu są zwarte, logicznie grupowane, bez niepotrzebnych podkontenerów, powtórzeń opcji, pustych kontrolek i długich akordeonów. Ekspert może mieć tryb szczegółowy, początkujący jasną ścieżkę.
- **D:** każdą istotną nową funkcję oceniaj scenariuszem użytkownika średnio zaawansowanego. Zapisz: czy znalazł funkcję bez podpowiedzi, zrozumiał co zmienia, poprawnie cofnął i uzyskał ten sam wynik na telefonie. Symulacja ekspercka nie zastępuje rzeczywistych testów z uczestnikami.

## 5. Język wizualny i ilustracje

- **D:** świat Małej Nauki: pogodny, przygodowy, dziecięcy i dopracowany, z ciepłą ilustracją 3D storybook, naturalną materią, spójnym kierunkiem światła i głębią ostrości. „Playful” nie oznacza większej liczby ozdobników. Unikaj plastikowych przypadkowych dekoracji, wizualnego chaosu i sztucznego składania kilku scen o różnym DOF.
- **D:** zaakceptowany ekran/postać/logo zachowuje proporcje i kompozycję; zmianę wybranego elementu przeprowadzaj bez niezamówionego redesignu pozostałych.
- **D:** Ortografia: **1 słowo = 1 osobny, kwadratowy obraz**, preferowane 1254 × 1254, maks. ok. 350 KB, preferowany JPG; jedna ciągła scena do krawędzi, bez napisów/ramek/UI/kolaży; kluczowy motyw w centralnych ~70%. Semantyka ważniejsza niż widowiskowość. Stosuj dokładne wyjątki briefu (np. „jezioro”: bez ludzi, „dowiezie”: wyraźna scena dostawy).
- **D:** zanim wygenerujesz/zaproponujesz nowe grafiki, porównaj bazę assetów i zaakceptowany styl. Nie duplikuj słów ani tych samych obrazów, nie wymyślaj nowych przy już zatwierdzonych.
- **W:** preferowane są eleganckie tłoczenia, materiały, wypukłości i delikatny połysk zamiast agresywnego jednego koloru na literach/dekoracjach. Przykład: trofea/karty zasad — litery rzeźbione w materiale, nie jaskrawoczerwony napis.
- **D:** długie nazwy krajów przewiduj w geometrii: rezerwa wysokości na 2 wiersze, kontrolowane rozmiary i łamanie, bez przesuwania mapy między pytaniami. Nie zmniejszaj dowolnie fontów tylko po to, by „weszły”.
- **D:** avatar ma pozostać kołem i mieć jednolite proporcje/wycięcie w każdej fazie, bez elips i skoków promienia. Kolor avatara może sterować akcentem PIN/CTA; zachowuj spójny ruch i kontrast.

## 6. Flagi / Atlas — decyzje szczególne (13–16.10)

**D — geografia i grafika:**
- Jedno spójne ilustracyjne tło kontynentu (raster/WebP) + nakładka wektorowa krajów/granic i wyróżnień; nie buduj przypadkowej mozaiki map. Sąsiedzi są kontekstem nauki, nie tylko dekoracją.
- Widok „Cała Europa” i „Sąsiedzi” korzystają z **tej samej mapy**; drugi jest prawdziwym zoomem/maską wycinającą z podpisami, a nie osobną niezgodną ilustracją. Zoom pokazuje kraj i sensowny kontekst najbliższych sąsiadów. Dla mikropaństw nie forsuj groteskowej skali.
- Wersja atlasowa: papier/pergamin, subtelna wyblakła brązowa mapa, prostsze podpisy i czytelne warstwy. Zachowaj kompas; na ostatniej iteracji odrzucono zbędne budynki, kropki, rozmyte tła i gwałtowne odcięcia.
- Skład i pozycje nakładek muszą uwzględniać czas, flagę, podpis kraju i stolicę (prosta ikonka + nazwa). Narzędzia mapy mniejsze, stonowane, ewentualnie półprzezroczyste, z ikonami o pełnym kontraście. Nie przesuwaj bez uzasadnienia całej kartki.

**D — trzy stany i przejścia:**
- **Pytanie:** flaga i odpowiedzi czytelne; nie podsuwaj poprawnej odpowiedzi przed wyborem.
- **Poprawna:** czytelne potwierdzenie, przejście automatyczne po sekwencji; bez wymuszania „Dalej”.
- **Błędna:** błędny wybór czerwony, prawidłowy zielony, czas na zrozumienie mapy i stolicy, dopiero potem prawie pełne przeciągnięcie suwaka jak w Ortografii.
- Rozkładanie/składanie kartki i odkrywanie mapy mają ciągłą choreografię. Podczas przejścia przygotuj następne flagi/assets wcześniej; nie dopuszczaj do skoków, nieoczekiwanego pojawiania czy odwróconych warstw. Efekty „papier → mapa → podpis” nie mogą zastąpić czytelnej odpowiedzi.
- Rozpad liter/odpowiedzi na „piasek”, papier 3D i wieloprzebiegowe rysowanie mapy były wskazanymi kierunkami eksperymentu; **dokładna realizacja pozostaje do oceny płynności i wizualnej akceptacji**, nie jest automatycznie zatwierdzona tylko dlatego, że powstał prototyp.

## 7. Motion, audio i wydajność

- **D:** animacja wspiera znaczenie i ciągłość sceny. Start i koniec animacji muszą zachować tożsamość obiektu, warstwę, kierunek i timing; unikaj teleportacji, migotania, przypadkowego opacity i przerw w harmonogramie klatek.
- **D:** sprawdź osobno spadek FPS, zatrzymywanie animacji i błędy harmonogramu WebKit. „Dotyk ożywia animację” to nie tylko „za wiele efektów”. Nie redukuj wizualizacji w ciemno.
- **D:** limity efektów combo, bańka/jelly, tekstowe cząstki i neony są opcjonalnymi wariantami; efekty mogą się zmieniać naprzemiennie zamiast działać wszystkie jednocześnie. Zadbaj o prostszy tryb/reduced-motion i rozliczalny koszt CPU/GPU.
- **D:** stan kliknięcia, poprawna/błędna odpowiedź, slider, jelly i przejścia są współdzielonymi kontraktami; zmiana właściwości musi dać ten sam wynik w Studio i Test PWA.
- **D:** dźwięki są przyjazne nauce, nieinwazyjne i możliwe do miksowania w Sound Lab (także ambienty/natura); odsłuch w Studio nie dowodzi audio w opublikowanej PWA ani na iOS z polityką odblokowania audio. Testuj realny przepływ.

## 8. Biblioteka obrazów i powtarzalność

- **D:** jeden kanoniczny katalog bajtów i jego indeks/hashy; Studio odczytuje aktualny stan przed dodaniem assetu. Nie polegaj na lokalnej pamięci listy słów. Deduplikacja po zawartości oraz czytelne powiązanie asset ↔ słowo.
- **D:** zapis Studio ma przejść **plik → zewnętrzna biblioteka → poprawny indeks → dostępny publicznie obraz → manifest PWA → widoczna ilustracja**. Metadane bez osiągalnego assetu to błąd, nie sukces. Nie dodawaj nowego binary do commitów kodu V2.
- **D:** zachowaj dotychczasowe narzędzia Studio (upload, batch, cofanie, wybór i zamianę). Zmieniaj pod spodem sposób zapisu, nie interfejs bez zlecenia. Konflikt zapisu nie może usuwać szkicu.

## 9. Bramka ukończenia zmiany

**Przed zmianą:** spisz zakres, wersję/commit, wzorzec ekranu, stan gry, elementy chronione i rzeczywisty błąd. Zadaj sobie „co pozostaje nietknięte?”. Jeśli zadanie dotyczy tylko jednej rzeczy, popraw jedną rzecz.

**Trzy przebiegi kontroli:**
1. **Wierność wizualna:** prawdziwa geometria 390 × 844, fonty polskie, dwa wiersze etykiet, kadr/DOF, stany, safe area, overlay referencji, brak przeskoków.
2. **Zachowanie i edycja:** klik/dotyk/drag, stan poprawny i błędny, selekcja atomu, globalny/lokalny wpływ, undo/redo, hidden/removed, flow i nawigacja bez martwego ekranu.
3. **Integracja i koszt:** test kontraktów, zbudowane PWA z tym samym commitem, działające dźwięki i assety w docelowym URL, brak regresji innych pięciu trybów, płynność na iOS WebKit / fizycznym iPhonie.

Po każdej niedużej zmianie: regresja → w razie niepowodzenia cofnięcie lub naprawa **przed** następnym etapem. 3 przebiegi to minimum projektowej samokontroli, nie obietnica trzech niezależnych testów użytkowników.

**Raport z wykonania:** zawsze podaj *co zmieniono*, *czego nie dotknięto*, *gdzie to działa (branch/commit/URL)*, *jakie testy rzeczywiście wykonano* i *co pozostaje nieweryfikowane*. Test w kodzie, screenshot, Preview, zewnętrzny deploy i fizyczny iPhone to różne dowody. Nie pisz „gotowe” na podstawie samego commita lub zielonego testu.

## 10. Uzasadnienie z obserwacji (źródła decyzji)

| Data / kontekst | Sygnał użytkownika | Wniosek operacyjny |
| --- | --- | --- |
| 05–06.10 / Studio i profile | uproszczenie hierarchii, edytowalność, globalne/lokalne, 3 profile, okrągłe avatary, mobile | jedno znaczenie atomu, lokalny zasięg i wspólna geometria |
| 06–07.10 / efekty PWA | animacje utykają; dotyk je ożywia; różne efekty mają być tanie | diagnozuj WebKit, nie zasłaniaj błędów spadkiem złożoności |
| 09–10.10 / audyt | 16 sekcji, techniczne menu, „możliwe” ≠ „odkrywalne”; mockupy pixel-perfect | projektuj ścieżki zadaniowe i akceptację wizualną |
| 10–13.10 / refaktor V2 | osobne atomy, bez chaotycznych kontenerów, jeden silnik, naprawa Start → Gra | prostota kodu i sprawne zachowanie są równorzędne z UI |
| 13.10 / Flagi i Ortografia | 3 stany, auto-przejście po poprawnej, slider po błędzie; przywrócić wygląd V1/produkcji | rozdziel stany, nie dopisuj nowego redesignu |
| 13–16.10 / mapa i atlas | realistyczny zoom sąsiadów, maska, pergamin, jedna scena; korekty kropki/blur/budynki | nowsze szczegółowe poprawki unieważniają wcześniejsze warianty |
| 15–16.10 / assety | tylko zewnętrzny magazyn, indeks i realna publikacja | testuj pełną drogę danych, nie sam zapis JSON |

## 11. Czego nie wolno automatycznie zakładać

Nie zakładaj, że: każde „kontynuuj” oznacza akceptację; nowe assets trzeba generować; animacja z prototypu działa na telefonie; Studio jest równoznaczne z produkcją; przyjazność dziecku wymaga ozdobników; kilka niezależnych akcji tworzy grupę; dobry wynik testów jest pixel-perfect; nowy dokument sam zmienia zachowanie kodu.

Przy niezgodności między starszą dokumentacją a jednoznaczną późniejszą korektą użytkownika **odnotuj konflikt i zastosuj nowszą korektę tylko we właściwym widoku**. Ten plik nie nadpisuje konfiguracji V2 ani historii, nie uruchamia wdrożeń i nie oznacza kolejnych ekranów za zaakceptowane.
