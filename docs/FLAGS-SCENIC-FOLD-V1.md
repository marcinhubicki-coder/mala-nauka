# Flagi — scenic preview po uwagach do mockupu, 13.10.2026

Zmiany pozostają na `feature/flags-scenic-preview-v1`. Nie zmieniono kodu produkcyjnej Ortografii, Design Studio, produkcyjnych Flag ani main.

## Układ i assety

Dwa dostarczone mockupy są wzorcami: duża flaga/chłopiec/pies w pytaniu, duży nagłówek kraju ze stolicą i flagą nad mapą po odpowiedzi. Widoki poprawnej i błędnej odpowiedzi mają ten sam układ. Stan błędny nie dokłada ikon na odpowiedziach; również dekoracyjne obrazki kafelków zastępuje neutralna faktura.

- `scenic-mockup-v5.webp`: pejzaż opracowany z pierwszego mockupu, z ciągłą półką skalną połączoną z lewym zboczem.
- `scenic-foreground-v4.webp`: pełny przezroczysty kadr z chłopcem i psem. Ten sam układ współrzędnych co tło, wspólne skalowanie. Włosy zachodzą na dolną krawędź kafelka; warstwa nie przyjmuje zdarzeń dotyku.
- `scenic-pole-v4.webp`: drewniany maszt ze złotym zakończeniem. Nie używa dekoracji wektorowego masztu z produkcyjnego komponentu.
- `scenic-rock-base-v5.webp`: kamienie i roślinność zakrywające stopę masztu; cień styku łączy maszt z podłożem. Skalna półka w tle łączy ten punkt z resztą krajobrazu.
- `scenic-atlas-scene-v4.webp`: scena z zamkiem, balonem i stołem, opracowana z drugiego mockupu.

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

Trzy powierzchnie niosą raster rzeczywiście przygotowanego atlasu: mapa, wyróżnienie, etykiety, nazwa, stolica i flaga. Zagięcia otwierają się kolejno z osobnym easingiem każdego etapu. Ciepły refleks z góry/lewej i cień zależą od fazy obrotu. Ruch używa transformacji i opacity trzech niewielkich warstw światła/cienia. Sam papier jest nieprzezroczysty podczas obracania — poprzedni półprzezroczysty efekt ujawnił się dopiero w oglądanych klatkach i został usunięty.

Maska miękkich brzegów mapy jest taka sama w przygotowanym obrazie zagięć i w końcowym atlasie. Koniec animacji nie przełącza ostrego prostokąta na miękką mapę. Przygotowanie z poprzedniej sesji nie może nadpisać obrazu po restarcie.

## Dwie linie i piasek

Wysokie kafelki zachowują czytelny rozmiar liter. Długie nazwy zawijają się w dwóch liniach, bez dawnego zmniejszania fontu do 13 px. Próbki ziaren są pobierane z rzeczywistych pozycji każdej litery. Każda linia ma własną linię bazową i kopczyk. Podczas tworzenia następnej nazwy część ziaren może poruszać się w górę, część w dół. Jeden Canvas pracuje tylko podczas przejścia. Małe górne refleksy i dolne cienie ziaren odpowiadają światłu sceny.

## Geografia

Jeden WebP Europy i SVG wybranego kraju nadal mają wspólne źródło Natural Earth w układzie 680 × 500. Kadr ma proporcje rzeczywistego pola mapy; nie rozciąga geografii na niskim ekranie. Zmniejszony minimalny margines kraju zapobiega pokazaniu 12–14 sąsiadów Polski przy szerokim polu. Minimalna szerokość okna nadal wynosi 120 jednostek, żeby nie powiększać mikropaństw. Natural Earth 1:110m nie zawiera dokładnych granic części mikropaństw; istniejące znaczniki położenia są zachowane.

## Iteracje

1. Nowy układ i assety, wspólna mechanika: workflow 38405784595, kod `99340cc8f05ef1ceb29604312d1074e3109a1e92`, 40/40 Chromium/WebKit. Obejrzano trzy stany, Polskę z drugiego mockupu, długą nazwę, klatki pergaminu i piasku, działający preview. Widzoczne problemy: wiszący maszt, zbyt wczesne wyprostowanie zagięć i różnica maski mapy.
2. Skałki, połączony teren, etapowy easing, miękkie brzegi, neutralne kafelki po odpowiedzi: workflow 38408029588, kod `e3c7c7aa6f1f157d429c442a91f2ab712220105a`, 32/40. Wszystkie scenariusze mechaniki przeszły; osiem asercji ujawniło zbyt szerokie otoczenie Polski po zachowaniu prawdziwych proporcji mapy. Oglądanie klatek ujawniło półprzezroczysty papier — testy mechaniki tego nie wykrywały.
3. Nieprzezroczyste zagięcia, właściwy margines kraju, ochrona przed późnym przygotowaniem starej mapy: workflow 38410440971, kod `998cc993b6d246bc727f91e9c8bf7b59da83a91d`. Wynik: 40/40, 20/20 Chromium i 20/20 WebKit, bez błędów JS. Obejrzano początek/środek/koniec otwierania i zwijania oraz fazy piasku. Papier nie przepuszcza już flagi. W oglądanym zrzucie niskiego ekranu pozostał obcięty nagłówek Bośni — automatyczne testy rozgrywki go wcześniej nie wykrywały.

4. Dopasowanie tytułu atlasu na podstawie rzeczywistej szerokości, wcześniejsze przełączenie dwuliniowego nagłówka i nowe sprawdzenie granic nazwy/stolicy: kod `78b9c208e7dd42d2ce04746c2bd68ab20e4abc00`. Wynik: 39/40. Wszystkie nowe sprawdzenia nagłówków przeszły. WebKit raz zakończył oczekiwanie po pauzie timeoutem; nie udało się pobrać stanu ani screenshotu tego okna, nie zgłoszono błędu JS. Uruchomiono powtórny job i dodano rejestrowanie awarii renderera do kolejnego przebiegu.

5. Dopasowanie nagłówka według szerokości i wysokości, test Wielkiej Brytanii/Macedonii oraz dwuliniowej odpowiedzi w stanie pytania; kod `422213fc6439425de39828fb4e5b7c3339403e11`. Workflow [38413930908](https://github.com/marcinhubicki-coder/mala-nauka/actions/runs/38413930908): **46/46, 23/23 Chromium i 23/23 WebKit, zero błędów JavaScript i zero zarejestrowanych awarii renderera**. Obejrzano końcowe trzy stany, długie i dwuwyrazowe nagłówki, dwie linie odpowiedzi także pod włosami, otwieranie/zwijanie oraz piasek w obu silnikach. Poprzedni jednorazowy timeout po pauzie nie powtórzył się. Testy obejmują poprawną odpowiedź/auto, błąd/suwak/niepełny gest/klik toru, pauzę/zachowanie czasu/wznowienie, trzy kolejne pytania, restart na granicach, reduced motion/klawiaturę, awarie obrazów/SVG, opóźnione ładowanie, safe-area i niski/większy ekran.

## Materiał do oceny

- [Trzy stany gry](flags-adventure/qa-scenic/scenic-stany.jpg).
- [Początek, środek i koniec otwierania oraz zwijania](flags-adventure/qa-scenic/scenic-pergamin-klatki.jpg).
- [Rozsypanie, kopczyki, formowanie i nowe pytanie](flags-adventure/qa-scenic/scenic-piasek-klatki.jpg).
- [Dwie linie odpowiedzi i piasku](flags-adventure/qa-scenic/scenic-dwie-linie.jpg).
- [Porównanie z dwoma dostarczonymi wzorcami](flags-adventure/qa-scenic/scenic-porownanie-mockup.jpg); wzorce mają inne proporcje, więc plansza porównawcza dopasowuje je do formatu testowego.
- [Pełny raport 46/46](flags-adventure/qa-scenic/report.json).

## Publikacja i granice weryfikacji

Aktualny interaktywny podgląd: https://mala-nauka-5p43d457f-nzckzxw2x6-4792s-projects.vercel.app/flagi/scenic-preview.html?country=by

Deployment `dpl_Bxe2gxoN3BppfEEubssK5jqiXMw4`, **READY**, źródło `git`, target preview, gałąź `feature/flags-scenic-preview-v1`. Commit opublikowanego i przebadanego kodu: `422213fc6439425de39828fb4e5b7c3339403e11`. Końcowy raport i surowe zrzuty zapisał CI w commicie `2cc8ceef7db22d3e6d94e5f2350c00debf8a22e5`; nie zmienia on kodu gry.

Wdrożony kontroler gry oraz moduł pergaminu zwracają HTTP 200 i są identyczne bajtowo z lokalnym kodem końcowego przebiegu QA. Otworzono też ten deployment w przeglądarce i sprawdzono rzeczywisty ekran pytania. Wcześniejszą opublikowaną iterację sprawdzono interaktywnie przez błąd i pełny suwak do nowej flagi.

W trakcie pracy Vercel odrzucał część commitów limitem `Deployment rate limited — retry in 24 hours`. Mimo tego zwykła integracja Git opublikowała powyższy commit kodu. Nie zmieniano planu, zabezpieczeń, produkcyjnych aliasów ani main i nie używano produkcyjnego deploymentu jako obejścia. Commit z samym raportem QA może nie mieć własnego deploymentu; dowodem aktualności UI jest weryfikacja kodu na wskazanym, niezmiennym URL.

Pozostaje fizyczny test iPhone 13 Pro: FPS/temperatura, pamięć, gest dotykowy i Safari/PWA przy prawdziwych safe-area. WebKit na runnerze i zrzuty nie zastępują takiego pomiaru. Zrekonstruowane assety i adaptacja do różnych proporcji ekranu nie są deklarowane jako pikselowo identyczna kopia bitmap mockupów.
