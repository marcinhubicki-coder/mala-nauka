# Kampania v53 — rzeka kalejdoskopu, księga i Iskierka

Praca lokalna 21.10.2026. Branch `work/campaign-river-book-v53`, baza
`c4de38c` (v52). Bez publikacji, push ani zmiany Vercela. Wspólny renderer
PWA, Edytuj ekran i testera kampanii. Chronione: geometria i grafiki map,
obrysy rzeczywistych kafli, Home, Flagi i nagłówki rozgrywek.

## Zbiorcza lista uwag z dzisiejszej rozmowy

- [x] Oddzielne wędrujące światło całego ekranu i światło ruchomych szkiełek.
- [x] Do 7 niezależnych łańcuchów przy pierwszym kroku, losowe starty i limit
  malejący względem nieodkrytej powierzchni. Szerokie zakresy Studio z v52.
- [x] Chwilowe 50% odsłonięcia rzeczywistego obrazu przez łańcuch, bez zapisu
  postępu i bez trwałego odkrywania dalszej ścieżki.
- [x] Rzeka kolejnych pól: ruch przenosi się na dwa sąsiednie pierścienie,
  odpowiednio 42% i 16% siły rdzenia. Powolny, wygaszany powrót do kalejdoskopu.
- [x] Rdzenie nie przecinają się, między ścieżkami co najmniej dwa pola.
  Jeden właściciel poruszającego się fragmentu także przy stykających się falach.
- [x] Budżet 384 ruchomych fragmentów razem z falą. Tekstury przygotowane przed
  ruchem, animowane transformacje i opacity, bez malowania całej mgły co klatkę.
- [x] Stała pozycja i rozmiar mapy. Zachowane obrazy ikon światów podczas teleportu.
- [x] Karta animuje wysokość w górę od stałego dołu; treść wchodzi kolejno,
  włącznie z przyciskiem księgi. Kamera nie zależy od jej wysokości.
- [x] Zewnętrzny dolny odstęp karty = boczny odstęp: 12 px. Safe area przeniesiona
  do jej wewnętrznego paddingu; mapa nie przesunięta.
- [x] Zamiast prowadzącej kreski: złote bańki/świetliki bieżącego pola i srebrne
  przy wybranej powtórce. Pionek ma wyższą warstwę, pozostaje na najdalszym kroku.
- [x] Księga siedmiu świateł: siedem rozdziałów, 105 fragmentów, wspólna fabuła.
  Kamienie milowe domykają wątki odpowiadające ilustracjom światów.
- [x] Przycisk księgi na części fabularnej karty, prawdziwy nowy ekran w Studio.
  Spis, poprzedni/następny, najnowszy fragment, numery kroków i zamknięte rozdziały.
- [x] Ukończony krok dopisuje tekst raz; powtórki nie dublują treści. Nowy tekst
  ujawnia się w zmierzonych liniach z rozmycia, po czym wraca do naturalnego reflow.
- [x] Zwykły krok ma zasięg 1×, kamień milowy 2×. Obie wartości edytowalne.
- [x] Iskierka: osobna ilustracja z alfą, lekki puls, dialog na początku świata,
  po nowo ukończonym kroku i przed portalem. Jedna treść z księgą, wspólna edycja.
- [x] Akceptacja dialogu → gwiazdki → teleport pola. Ta sama warstwa przygaszenia
  trwa przez sekwencję. Dialog nie uruchamia przejścia całego ekranu ani własnego
  dodatkowego blura; przejście świata utrzymuje zakrycie w trakcie ładowania.
- [x] Zapamiętane akceptacje należą do profilu (`campaign.storySeen`), nie konfiguracji.
  Powrót/replay nie wymusza powtarzania przeczytanego komunikatu.
- [x] Tester: powitanie / odkryty fragment / przed portalem, opcja dialogu przed
  przyznaniem gwiazdek. Symulacja nie zapisuje niczego do profilu dziecka.
- [x] Zmiana testowego kroku przerywa poprzedni dialog, gwiazdki i teleport,
  bez późniejszego nadpisania nowej pozycji.
- [x] Naprawiony powrót z księgi po zmianie postępu w testerze. Stały nagłówek
  Studio nie może zasłaniać przycisku, do którego przeglądarka przewinęła iframe.

## Grafiki i biblioteka

Nowe WebP z prawdziwą alfą: księga 512 × 512 / 64 308 B i Iskierka
512 × 512 / 62 268 B. Metadane w `design-system/assets.json` (rewizja 35),
niezmienne odwołania w osobnych modułach assetów, bajty w ignorowanym lokalnym
`assets/managed/`. Obie grafiki sprawdzone po HTTP w rzeczywistym PWA.
Nie publikowano ich do zewnętrznej biblioteki; przed przyszłym wdrożeniem
wymagają jej zwykłego procesu publikacji i kontroli hashy. Bajty nie trafiają
do commitu aplikacji. Źródła i prompty w `outputs/v53/` katalogu zadania.

## Weryfikacja

- Testy logiki: treść, odblokowywanie, brak duplikatów, zapis akceptacji,
  zgodność narratora z księgą, portal dopiero po ukończeniu świata, fala i zasięgi.
- `qa-campaign-book-browser.mjs`: rzeczywiste PWA i Studio, telefon/desktop,
  Chromium/WebKit, najnowszy fragment, nawigacja, zmiana postępu, powrót, reduced-motion.
- `qa-campaign-return-browser.mjs`: prawdziwa runda matematyki 6/10, zapis oceny,
  Iskierka przed gwiazdkami, wspólne przygaszenie, teleport, powtórki i portal.
  Istniejące grafiki portalu pobierane z CDN; nowe, nieopublikowane grafiki lokalnie.
- `qa-campaign-flow-browser.mjs`: dwa pierścienie fali i odstęp, światła,
  maksymalne suwaki/budżet, stała geometria, karta, przerwania i reduced-motion.
- `qa-all-view-contracts-browser.mjs`: 52 rzeczywiste widoki na dwóch rozmiarach.
  Cache edytora powstaje wyłącznie ze zweryfikowanych rendererów.

Dowody w `.design-qa/v53/`, kopie końcowe w `outputs/v53/` katalogu zadania.
Wynik: 498/498 testów Node i 104/104 sprawdzeń kontraktów (52 widoki).
Księga, narrator, portal i powrót z prawdziwej rundy przeszły Chromium/WebKit,
także reduced-motion. Żywa mapa: dwa przebiegi kontroli. W końcowym pomiarze
domyślnym 151 klatek / 2,5 s w obu silnikach; przy górnych limitach
Chrome 73 i WebKit 91 klatek / 1,5 s na tym Macu. To pomiar krótkiej próbki,
nie gwarancja stałego FPS ani pomiar telefonu. Przegląd WebKit
na Macu nie jest testem fizycznego iPhone’a ani pomiarem jego baterii.

## Odłożone zgodnie z prośbą użytkownika

Dominujący kosmiczny przycisk następnego świata oraz nowa karta frost glass
z parametrów css.glass pozostają następnym etapem. Obecny zakres nie wprowadza
tej zmiany stylu ani ponownego redesignu CTA Home.
