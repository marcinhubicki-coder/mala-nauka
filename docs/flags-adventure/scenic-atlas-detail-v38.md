# Atlas v38 — detal, kompresja i budżet świata

Zaakceptowany kierunek malarski z v37 zostaje zachowany. Ta iteracja sprawdza rekonstrukcję fragmentów przy zbliżeniu oraz realne rozmiary po kompresji. Nie oznacza ukończenia wszystkich kontynentów ani zakończenia kontroli geografii.

## Rozdzielczość świata a widok kraju

5000×3000 px jest sensownym rozmiarem mapy bazowej do oddalenia. Nie wystarczy jako jedyne źródło obrazu dla bliskiego kadru małego kraju. Przy szerokości świata 5000 px i jednolitej skali długości geograficznej, główne terytorium Szwajcarii ma około 62 px szerokości, Polski 139 px, Litwy 80 px, Francji 179 px. To wyliczenie z granic Natural Earth 1:50m, nie pomiar każdego docelowego kadru gry. Wyświetlenie kraju na kilkuset pikselach wymagałoby znacznego powiększenia tych niewielkich fragmentów.

Przyjęta metoda: bazowy świat około 5k×3k, a nad nim rzadsza warstwa szczegółów dla regionów i małych krajów. Kafle HD powstają przez ponowne odtworzenie istniejącego malarstwa w większej natywnej rozdzielczości, z zakładem. Nie wystarczy podzielić małego obrazu i powiększyć go filtrem. Wiele rozdzielczości dziedziczy tę samą geografię i jest zmniejszanych z jednego zaakceptowanego mastera regionu.

Przy 1000 px i 500 KB na kafel rachunek 15 kafli = 7,5 MB jest poprawny dla pojedynczego poziomu. Trzeba dodatkowo uwzględnić mniejsze poziomy oddalenia, zakłady i lokalne HD; część tego odzyskujemy, pomijając kafle z samym oceanem i używając kompresji dopasowanej do treści. Dla pełnego atlasu około 8 MB pozostaje celem do zmierzenia, a nie potwierdzonym rozmiarem. Sam rozmiar plików nie wyznacza RAM: obraz 5000×3000 RGBA to około 60 MB rozkodowanych pikseli. Runtime pozostaje kafelkowy i nie otwiera całego takiego obrazu.

## Wykonana próba

Z malarstwa v37 wycięto dwa fragmenty 512×512 px: x=768,y=512 oraz x=1024,y=512. Mają 256 px zakładu. Wbudowany ImageGen odtworzył je oddzielnie do 1254×1254 px. Przygotowano nowe drobne detale skał, śniegu, drzew i ziemi, zachowując kompozycję regionu jako wzorzec. Nie zmieniono danych granic.

Obrazy sprowadzono do wspólnej skali 2× i połączono w fragment 1536×1024 px. Łączenie szuka ciągłej linii najmniejszej różnicy w zakładzie i miesza tylko pas o szerokości 12 px. Zewnętrzny brzeg fragmentu przechodzi przez pas 36 px do istniejącej ilustracji. Pozwala to ograniczyć podwójne przezroczyste szczyty, które dawałoby mieszanie całego zakładu. Jakość połączenia sprawdzono wizualnie.

Master regionu ma teraz 3072×2048 px; nowy natywny detal obejmuje jego dolną prawą część, reszta zachowuje wcześniejszy poziom szczegółowości. Wszystkie poziomy LOD pochodzą z tego samego scalonego mastera. Najwyższy poziom jest częściowy i obejmuje tylko region z nowym detalem. Dla obszarów bez niego renderer wybiera niższy poziom.

Próbka `flagi/atlas-detail-v38.html` pokazuje Himalaje i dolinę Indusu. Powstało 15 kafli w czterech poziomach. Łączny rozmiar WebP to 1 204 876 bajtów; sześć kafli najwyższego poziomu zajmuje 518 630 bajtów. To dane tej próbki, nie całego świata.

## Zmierzona kompresja

| Obraz | Ustawienie jakości WebP | Bajty |
|---|---:|---:|
| Kafel detalu 1000×1000 | 60 | 232 190 |
| Kafel detalu 1000×1000 | 72 | 266 960 |
| Kafel detalu 1000×1000 | 80 | 322 594 |
| Kafel detalu 1000×1000 | 88 | 434 104 |
| Wcześniejsza Europa 3658×2688 | 72 | 1 485 708 |
| Wcześniejsza Europa 3658×2688 | 80 | 1 888 234 |

Wartości dotyczą konkretnych obrazów. Las, pustynia, góry i woda mają różną podatność na kompresję. Kafle runtime używają jakości 78 dla mniejszych poziomów i 82 dla nowego detalu. [WebP](https://developers.google.com/speed/webp/docs/compression) pozwala dopasować stratną kompresję do obrazu; ustawienie jakości nie jest obietnicą identycznego rozmiaru pliku.

## Ładowanie i zgodność

Najwyższe kafle pobierają się dopiero, gdy wymaga ich skala i kadr. Kamera obrazu i granic pozostaje wspólna. Częściowa warstwa HD ma gotowy podkład z niższego poziomu, a brak pojedynczego kafla szczegółowego nie blokuje animacji i nie odsłania pustki. Niepotrzebne bitmapy są zamykane w cache LRU. Pełny budżet pamięci PWA obejmuje też płótna, inne grafiki i dane; licznik próbki dotyczy wyłącznie kafli mapy.

Geograficzna kontrola wybrzeży, rzek i pasm pozostaje odrębnym etapem. Sam ImageGen może przesunąć element ilustracji mimo wzorca. Docelowe kontynenty wymagają masek i kontroli względem danych, przy zachowaniu ustalonych trzech klas gór oraz środowiska pustyń/lasów. Wspólny master i kamera zapobiegają zmianie położenia warstw podczas zoomu, ale nie dowodzą, że namalowane wybrzeże jest już prawidłowo zarejestrowane.

## Materiały

Wbudowany ImageGen; [zestaw promptów i ścieżki](scenic-assets-v38.json). Źródła i składanie: lokalny katalog `outputs/v38/`. Runtime: `assets/maps/atlas-detail-v38/`. Wzorzec bazowy i źródła geografii opisano w [analizie v37](scenic-atlas-plan-v37.md).

## Krótkie sprawdzenie

Headless WebKit z viewport 390×844 i DPR 2: początkowo pobrano 3 obrazy niższych poziomów; po pokazaniu Himalajów i Indusu użyto łącznie 15 kafli, w tym właściwego detalu. Zajęły 14 692 720 bajtów rozkodowanych bitmap, poniżej 16 MiB cache. Ponowne przybliżenie nie spowodowało kolejnych pobrań. Kadr zachował proporcje 3:2. Oddzielnie zablokowano wszystkie kafle HD: widok zakończył zmianę kadru, korzystając z mniejszego obrazu, bez błędów JS. Raporty w `qa-preview-v38/`. Nie uruchamiano pełnej baterii ani pomiaru na fizycznym iPhonie.
