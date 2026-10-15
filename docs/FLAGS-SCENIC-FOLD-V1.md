> Aktualizacja 15.10.2026: bieżący wariant ma jedną scenę z masztem i kamieniami, ciągły pergamin oraz prześwitujący atlas bez drobin i rozmytego tła. Opis, prompty i wyniki: [TRANSPARENT-V14](FLAGS-SCENIC-TRANSPARENT-V14.md). Poprzednia animacja: [CONTINUOUS-V10](FLAGS-SCENIC-CONTINUOUS-V10.md). Poniżej zapis wersji z 13.10.2026.

# Flagi — scenic preview: jedna scena i materiały rastrowe, 13.10.2026

Zmiany pozostają na `feature/flags-scenic-preview-v1`. Nie zmieniono kodu produkcyjnej Ortografii, Design Studio, produkcyjnych Flag ani main.

## Układ i assety

Dwa dostarczone mockupy są wzorcami: duża flaga/chłopiec/pies w pytaniu, duży nagłówek kraju ze stolicą i flagą nad mapą po odpowiedzi. Krajobraz, chłopiec, piesek i geometria czterech odpowiedzi są identyczne przed odpowiedzią, podczas rozwijania i po przejściu. Usunięto podmianę całej sceny po kliknięciu. Atlas rozwija się nad flagą; po rozłożeniu maszt jest ukryty, podczas zwijania odsłaniana jest następna flaga. Kafelki we wszystkich stanach mają neutralną fakturę bez ikon. Suwak jest poniżej twarzy postaci.

- `scenic-mockup-v5.webp`: pejzaż opracowany z pierwszego mockupu, z ciągłą półką skalną połączoną z lewym zboczem.
- `scenic-foreground-v4.webp`: pełny przezroczysty kadr z chłopcem i psem. Ten sam układ współrzędnych co tło, wspólne skalowanie. Włosy zachodzą na dolną krawędź kafelka; warstwa nie przyjmuje zdarzeń dotyku.
- `scenic-pole-v4.webp`: drewniany maszt ze złotym zakończeniem. Nie używa dekoracji wektorowego masztu z produkcyjnego komponentu.
- `scenic-rock-base-v5.webp`: kamienie i roślinność zakrywające stopę masztu; cień styku łączy maszt z podłożem. Skalna półka w tle łączy ten punkt z resztą krajobrazu.
- `scenic-question-paper-v6.webp`: rastrowy pergamin razem z przestrzennym mosiężnym kompasem, opracowany z mockupu; zastępuje wektorowy kompas i tło SVG.
- `scenic-answer-paper-v6.webp`: jasny kafelek z naturalnym obrzeżem i delikatnymi konturami; bez ikon i tekstu.
- `scenic-atlas-paper-v6.webp`: papier atlasu z nieregularną krawędzią i miedzianymi pinezkami.
- `scenic-task-sign-v6.webp`: drewno, śruby i prawdziwa faktura lin tabliczki zadania.

Scena `scenic-atlas-scene-v4.webp` pozostaje historycznym assetem, ale nie jest używana ani wczytywana przez preview. Drugi mockup służy układowi i typografii atlasu; najnowsza uwaga użytkownika wymaga zachowania pierwszego krajobrazu po kliknięciu. Pełne prompty i pliki: [RASTER-ASSETS-V6](FLAGS-SCENIC-RASTER-ASSETS-V6.md).

Wszystkie flagi pochodzą z istniejącej biblioteki WebP. Nie wygenerowano ilustracji nowych krajów ani map osobnych państw.

## Mechanika zgodna z Ortografią

Preview importuje istniejący `Session` z `game.mjs` i `createContinueDrag` z `spelling/continue-drag.mjs`. Pliki tych modułów nie zostały zmienione.

Suwak zaczyna gest wyłącznie na uchwycie, wymaga co najmniej 96% drogi i 24 px ruchu, odrzucony/niepełny gest wraca na początek. Kliknięcie toru oraz Enter/Spacja nie przechodzą dalej. Strzałki przesuwają po 10%. Pauza i restart zerują gest. Czas jest zatrzymany w prezentacji i przejściach. Po dobrej odpowiedzi następuje pełne 3900 ms utrwalania po przygotowaniu i rozłożeniu mapy, następnie automatyczne przejście. Błąd czeka na suwak.

## Wskazane wzorce animacji

Lista wejściowa użytkownika:

- https://freefrontend.com/css-3d-transforms/#2026-06-18-3d-folding-paper-receipt-card-l
- https://freefrontend.com/css-3d-transforms/#2025-12-08-treasure-map-l
- https://freefrontend.com/css-3d-transforms/#2025-10-24-cards-with-parallax-tilt-effect-l

## Papier i światło

Trzy powierzchnie niosą raster rzeczywiście przygotowanego atlasu: mapa, wyróżnienie, etykiety, nazwa, stolica i flaga. Zagięcia otwierają się kolejno. Górna krawędź każdego panelu jest osią następnego: pozycje w przestrzeni 3D wynikają z długości papieru i kątów zagięć, więc panel nie przesuwa się niezależnie przez scenę. Przeliczone raz klatki Web Animations zachowują wspólne osie, także po pauzie. Cienie i refleksy zależą od kąta. Ciepły refleks z góry/lewej i cień zależą od fazy obrotu. Ruch używa transformacji i opacity trzech niewielkich warstw światła/cienia. Sam papier jest nieprzezroczysty podczas obracania — poprzedni półprzezroczysty efekt ujawnił się dopiero w oglądanych klatkach i został usunięty.

Maska miękkich brzegów mapy jest taka sama w przygotowanym obrazie zagięć i w końcowym atlasie. Koniec animacji nie przełącza ostrego prostokąta na miękką mapę. Przygotowanie z poprzedniej sesji nie może nadpisać obrazu po restarcie.

## Dwie linie i piasek

Wysokie kafelki zachowują czytelny rozmiar liter. Długie nazwy zawijają się w dwóch liniach, bez dawnego zmniejszania fontu do 13 px. Próbki ziaren są pobierane z rzeczywistych pozycji każdej litery. Każda linia ma własną linię bazową i kopczyk. Podczas tworzenia następnej nazwy część ziaren może poruszać się w górę, część w dół. Jeden Canvas pracuje tylko podczas przejścia. Małe górne refleksy i dolne cienie ziaren odpowiadają światłu sceny.

## Geografia

Jeden WebP Europy i SVG wybranego kraju nadal mają wspólne źródło Natural Earth w układzie 680 × 500. Kadr ma proporcje rzeczywistego pola mapy; nie rozciąga geografii na niskim ekranie. Minimalna szerokość okna wynosi 160 jednostek, a kraj ma margines. Oprócz zoomu wybierana jest niewielka korekta położenia kamery, z ochroną całej geometrii kraju. Pozwala to pokazać 6–10 sąsiadów bez nadmiernego powiększania kraju lub mikropaństwa. Fragmenty dużych krajów mogą mieć etykietę w rzeczywiście widocznej części ich geometrii. Materiał papieru, miękkie granice i cienie są wypalone w jednym WebP; granice nadal pochodzą z tego samego SVG. Nie animuje się filtrów dużej mapy. Natural Earth 1:110m nie zawiera dokładnych granic części mikropaństw; istniejące znaczniki położenia są zachowane.

## Iteracje

1. Nowy układ i assety, wspólna mechanika: workflow 38405784595, kod `99340cc8f05ef1ceb29604312d1074e3109a1e92`, 40/40 Chromium/WebKit. Obejrzano trzy stany, Polskę z drugiego mockupu, długą nazwę, klatki pergaminu i piasku, działający preview. Widzoczne problemy: wiszący maszt, zbyt wczesne wyprostowanie zagięć i różnica maski mapy.
2. Skałki, połączony teren, etapowy easing, miękkie brzegi, neutralne kafelki po odpowiedzi: workflow 38408029588, kod `e3c7c7aa6f1f157d429c442a91f2ab712220105a`, 32/40. Wszystkie scenariusze mechaniki przeszły; osiem asercji ujawniło zbyt szerokie otoczenie Polski po zachowaniu prawdziwych proporcji mapy. Oglądanie klatek ujawniło półprzezroczysty papier — testy mechaniki tego nie wykrywały.
3. Nieprzezroczyste zagięcia, właściwy margines kraju, ochrona przed późnym przygotowaniem starej mapy: workflow 38410440971, kod `998cc993b6d246bc727f91e9c8bf7b59da83a91d`. Wynik: 40/40, 20/20 Chromium i 20/20 WebKit, bez błędów JS. Obejrzano początek/środek/koniec otwierania i zwijania oraz fazy piasku. Papier nie przepuszcza już flagi. W oglądanym zrzucie niskiego ekranu pozostał obcięty nagłówek Bośni — automatyczne testy rozgrywki go wcześniej nie wykrywały.

4. Dopasowanie tytułu atlasu na podstawie rzeczywistej szerokości, wcześniejsze przełączenie dwuliniowego nagłówka i nowe sprawdzenie granic nazwy/stolicy: kod `78b9c208e7dd42d2ce04746c2bd68ab20e4abc00`. Wynik: 39/40. Wszystkie nowe sprawdzenia nagłówków przeszły. WebKit raz zakończył oczekiwanie po pauzie timeoutem; nie udało się pobrać stanu ani screenshotu tego okna, nie zgłoszono błędu JS. Uruchomiono powtórny job i dodano rejestrowanie awarii renderera do kolejnego przebiegu.

5. Dopasowanie nagłówka według szerokości i wysokości, test Wielkiej Brytanii/Macedonii oraz dwuliniowej odpowiedzi w stanie pytania; kod `422213fc6439425de39828fb4e5b7c3339403e11`. Workflow [38413930908](https://github.com/marcinhubicki-coder/mala-nauka/actions/runs/38413930908): **46/46, 23/23 Chromium i 23/23 WebKit, zero błędów JavaScript i zero zarejestrowanych awarii renderera**. Obejrzano końcowe trzy stany, długie i dwuwyrazowe nagłówki, dwie linie odpowiedzi także pod włosami, otwieranie/zwijanie oraz piasek w obu silnikach. Poprzedni jednorazowy timeout po pauzie nie powtórzył się. Testy obejmują poprawną odpowiedź/auto, błąd/suwak/niepełny gest/klik toru, pauzę/zachowanie czasu/wznowienie, trzy kolejne pytania, restart na granicach, reduced motion/klawiaturę, awarie obrazów/SVG, opóźnione ładowanie, safe-area i niski/większy ekran.

## Dalsze iteracje po odrzuceniu poprzedniej wersji

1. `d542f0719d343e02a855e4e4c6c7eb0e5242e549`, workflow [38421297470](https://github.com/marcinhubicki-coder/mala-nauka/actions/runs/38421297470): 48/48. Usunięto podmianę tła, wektorowy kompas i niezależne przesuwanie zagięć. Dodano trzy materiały z imagegen oraz test stałości sceny/geometrii kafelków. Obejrzano live preview, rzeczywisty suwak, trzy stany i klatki. Wykryto spłaszczenie kompasu, nagłówek przy brzegu, podwójną stopkę i przerwę przed powrotem pytania.
2. `403d440fc7a3bd4398a4d7bea8eff27a4ee3e40f`, workflow [38423058756](https://github.com/marcinhubicki-coder/mala-nauka/actions/runs/38423058756): 38/48. Naprawiono proporcje materiałów, odstępy atlasu, stopkę i synchronizację pergaminu. Dodano rastrową tabliczkę oraz subtelny materiał mapy. Wszystkie scenariusze mechaniki przeszły; 10 asercji w obu silnikach wykryło zbyt wielu sąsiadów Polski/Liechtensteinu w szerszym kadrze. Nie osłabiono tych asercji.
3. `3871ca44a43cd2fc7d5c29e3a55bf1b11d4a4cb8`, workflow [38424972784](https://github.com/marcinhubicki-coder/mala-nauka/actions/runs/38424972784): 48/48. Korekta pozycji kamery, etykiety w widocznych fragmentach, proporcje dużej flagi i suwak poniżej twarzy. Obejrzano nowe zrzuty i klatki oraz działający Vercel. Wczesne klatki ujawniły zbyt wczesne ukrywanie flagi podczas rozwijania.
4. `0c25a8094a771c176031852950f990b7d9f7dabf`: flaga jest przykrywana stopniowo przez rozwijającą się mapę; znika dopiero po jej rozłożeniu. Dalsza korekta punktów etykiet dużych krajów. Buforowanie i limit czasu ładowania papieru, czytelne tła zastępcze i ochrona przed późnym zakończeniem startu po restarcie. Dodano scenariusz awarii wszystkich nowych materiałów oraz asercje widoczności flagi w otwieraniu/po zakończeniu. Workflow [38426189692](https://github.com/marcinhubicki-coder/mala-nauka/actions/runs/38426189692): **50/50, 25/25 Chromium i 25/25 WebKit, zero błędów JS i awarii renderera**. Obejrzano wszystkie końcowe stany, dwie linie, kadry różnych państw, start/środek/koniec obu kierunków pergaminu, cztery fazy piasku oraz wariant awarii materiałów.

## Materiał do oceny

- [Zrzut działającego Vercela w przeglądarce, 480 × 936](flags-adventure/qa-scenic/scenic-live-vercel.jpg).
- [Atlas w rzeczywistym preview](flags-adventure/qa-scenic/scenic-live-vercel-atlas.jpg).
- [Trzy stany gry](flags-adventure/qa-scenic/scenic-stany.jpg).
- [Początek, środek i koniec otwierania oraz zwijania](flags-adventure/qa-scenic/scenic-pergamin-klatki.jpg).
- [Rozsypanie, kopczyki, formowanie i nowe pytanie](flags-adventure/qa-scenic/scenic-piasek-klatki.jpg).
- [Dwie linie odpowiedzi i piasku](flags-adventure/qa-scenic/scenic-dwie-linie.jpg).
- [Porównanie z dwoma dostarczonymi wzorcami](flags-adventure/qa-scenic/scenic-porownanie-mockup.jpg); wzorce mają inne proporcje, więc plansza porównawcza dopasowuje je do formatu testowego.
- [Pełny raport końcowej rundy](flags-adventure/qa-scenic/report.json).

## Publikacja i granice weryfikacji

Interaktywny podgląd końcowej rundy: https://mala-nauka-7du3pcyvn-nzckzxw2x6-4792s-projects.vercel.app/flagi/scenic-preview.html?country=by

Deployment `dpl_EgPz928jqT8J43UL22zGUGnL2Ghf`, **READY**, target preview (`null` w API), źródło Git, projekt `mala-nauka-pwa` / `prj_XYilLjwfEzvpnPs8sqjhwPc9jQpW`, team `team_AH1pDr3GHKtAmeKiMMZvaSrd`. Wdrożony i przebadany commit kodu: `0c25a8094a771c176031852950f990b7d9f7dabf`, należący do `feature/flags-scenic-preview-v1`. Raport 50/50 i surowe klatki zapisał CI w commicie `c1fd960f7e5cdafefa95af258994c3b4aac1210a`.

Kontroler rozgrywki, moduł pergaminu i moduł geografii zwracają HTTP 200 i są identyczne bajtowo z końcowym lokalnym kodem. Otworzono ten deployment w przeglądarce: sprawdzono pytanie, błąd, pełny suwak do Polski, poprawną odpowiedź i automatyczne przejście do Szwajcarii. Zapisano rzeczywiste zrzuty pytania i atlasu. Testy zapisują klatki w obu silnikach; zrzuty oceniono samodzielnie.

Vercel odrzucił część prób integracji Git komunikatem `Deployment rate limited — retry in 24 hours`. Końcowy preview został przyjęty przez standardowe API Vercela z tego samego commitu i projektu. Nie zmieniono planu, zabezpieczeń, produkcyjnych aliasów ani main. Nie publikowano na produkcji.

Pozostaje fizyczny test iPhone 13 Pro: płynność, temperatura, pamięć, gest dotykowy i Safari/PWA przy prawdziwych safe-area. WebKit na runnerze i zrzuty nie zastępują pomiaru na urządzeniu. Referencje mają inne proporcje niż testowany viewport; gra dostosowuje się do ekranu. Przyjęcie wyglądu przez użytkownika nadal wymaga oceny działającego preview.
