# Biblioteka grafik V2 — zapis i publikacja

Stan na 15.10.2026: **rzeczywisty upload → biblioteka → indeks → PWA przeszedł na opublikowanym Preview**. Poniżej są identyfikatory i zakres dowodów; test izolowany pozostaje osobną regresją.

## Zastana architektura

Punktem odniesienia jest `4e1ecf0`, a aktualna gałąź `refactor/v2-parity-first` zawiera dodatkowo commity `d507d63`–`78cacb4` z pierwszym zapisem do biblioteki. Ich trzy ostatnie wdrożenia Vercel kończą się błędem: publiczne żądanie `https://mala-nauka-assets.vercel.app/asset-catalog.json` otrzymuje **302 do logowania Vercela**, a build próbował interpretować HTML jako JSON.

`assets/library-v1` jest oddzielną gałęzią zasobów w tym samym repozytorium, nie osobnym repozytorium. Zastany alias biblioteki wskazywał chronione wdrożenie Preview projektu PWA z commita `e9e4f8f7a1140cce3b347e7778c490ed929afa21`. Obecnie należy do osobnego projektu biblioteki i automatycznie śledzi jego środowisko Production.

Audyt przez podłączony GitHub: wszystkie **667** rekordów z katalogów scen, grafik zarządzanych i flag mają zgodne bajty w bibliotece: 373 sceny, 35 grafik zarządzanych, 259 plików flag (w tym 256 SVG/WebP i 3 pliki tekstowe/licencyjne). Brak brakujących ścieżek i rozbieżnych SHA-256/Git blob SHA. Cały istniejący release biblioteki zawiera 783 pliki, 124 552 268 bajtów.

## Nowy przepływ

1. Studio dekoduje obraz, odczytuje wymiary i SHA-256 oraz sprawdza istniejące rekordy. Ten sam hash wykorzystuje istniejący plik, również po przerwanym wcześniejszym zapisie.
2. Cała paczka jest walidowana przed wysłaniem pierwszego obiektu. Nowe bajty trafiają wyłącznie do `assets/library-v1/assets/managed/<sha256>.<format>`.
3. **Ten sam commit biblioteki** dodaje plik i aktualizuje źródłowy `asset-catalog.json`, zachowując wymiary. Nie nadpisuje istniejącej ścieżki o innym Git blob SHA. Konflikt fast-forward powoduje ponowny odczyt drzewa i indeksu; maksymalnie trzy próby, bez wymuszania historii.
4. Asset-only build ponownie oblicza SHA-256 i rozmiar z rzeczywistych bajtów, sprawdza zgodność indeksu, zachowuje wymiary i publikuje wyłącznie `assets/` oraz publiczny `asset-catalog.json`. Nie publikuje kodu Studio/PWA.
5. Studio czeka na publiczny indeks, a następnie pobiera obraz przez publiczny URL i sprawdza jego **faktyczny rozmiar oraz SHA-256**. Wpis JSON bez dostępnego obrazu nie wystarcza. Błąd lub timeout zachowuje szkic i blokuje commit aplikacji.
6. Po ponownym sprawdzeniu głowy V2 osobny commit aplikacji zapisuje wygląd, zasady, batchy i przypisania słów. **Żadna ścieżka binarna `assets/*` nie wchodzi do tego commita.**
7. PWA odczytuje przypisanie z manifestu treści i pobiera obraz przez rewrite do biblioteki. Hosted build sprawdza zgodność scen, grafik zarządzanych i flag z publicznym indeksem i nie dołącza ich do paczki aplikacji. Lokalne testy zachowują historyczne pliki, a `node tools/serve-preview.mjs 8765` przekazuje brakujące ilustracje do tej samej biblioteki, bez kopiowania ich do źródeł ani lokalnej paczki aplikacji. Kontrola wydania sprawdza hash i bajty brakującego lokalnie obrazu w publicznej bibliotece.

`design-system/assets.json` na V2 pozostaje manifestem przypisań treści. `asset-catalog.json` w bibliotece jest rejestrem bajtów. Są to dwa różne kontrakty; nie powstaje drugi magazyn obrazów.

## Zachowane funkcje Studio i PWA

Upload pojedynczy i grupowy, szkic IndexedDB, cofanie, batchy, zamiana zdjęcia, wybór istniejącej ilustracji i wiele słów korzystających z tego samego pliku pozostają w istniejącym interfejsie. Odświeżenie GitHuba scala również obrazy obecne wyłącznie w bibliotece, bez pobierania wszystkich plików. Nowe rekordy zachowują wymiary potrzebne do akceptacji batchy.

Adres źródła treści jest oddzielony od adresu obrazów. Po zapisie Studio usuwa lokalne adresy `blob:` i korzysta z opublikowanej biblioteki, także gdy treść jest przypięta do commita aplikacji bez tego obrazu. Obrazy zarządzane mają ten sam trwały, ograniczony cache offline co sceny. Flagi zachowują oddzielny cache oraz kontrolę zgodności zamrożonych źródeł.

## Weryfikacja wykonana

- 413 testów automatycznych przechodzi.
- Test przeglądarkowy `tools/qa-library-browser.mjs` przechodzi: upload PNG przez interfejs, odzyskanie bajtów po przeładowaniu z IndexedDB, atomowy zapis pliku i indeksu, commit aplikacji bez obrazu, odczyt po zmianie źródła treści, rzeczywiste zdekodowanie 128 × 128 px w bańce Ortografii oraz odczyt offline przez Service Worker. **API GitHuba i wywołanie wdrożenia są w tym teście izolowanym fixture.**
- Dotychczasowa regresja Ortografii przechodzi: 8 etapów, 29 bloków ustawień, brak błędów JS i nieudanych lokalnych żądań.
- Regresja Studio przechodzi: import pięciu referencji, wyrównanie, trwałość po przeładowaniu i brak błędów JS.
- Nowy builder sprawdzony na rzeczywistych 783 plikach zamrożonej gałęzi, bez publikowania: zgodne hashe i rozmiary; katalog wyjściowy zawiera tylko assety i indeks.

Uruchomienie: `npm test`, a po instalacji Playwright/Chromium `node tools/qa-library-browser.mjs`. Ten test uruchamia własne serwery lokalne i nie wymaga tokenu GitHuba.

## Hosting i rzeczywisty E2E

Projekt Vercel `mala-nauka-library` (`prj_cmBnutecSKqwRk0dy7gBdJiAGwLg`) działa w istniejącym zespole na planie **Hobby**. Nie włączono płatnego planu ani dodatków. Production śledzi wyłącznie `assets/library-v1`; Preview jest wyłączone, a warunek pomijania buildów to `test "$VERCEL_GIT_COMMIT_REF" != "assets/library-v1"`. Build: `node tools/build-asset-library.mjs`, katalog `dist`.

`mala-nauka-assets.vercel.app` jest domeną **Production** nowego projektu (`gitBranch: null`), nie przypiętym ręcznie Preview. Pierwsza publikacja z `e9e4f8f` zwróciła anonimowe HTTP 200, JSON i CORS `*`. Rzeczywisty zapis Studio utworzył `deaaed3eb576ce39e8f82376437492adba39cfa7`; GitHub sam uruchomił deployment `dpl_aUeEMAuZrW1pK1dMSb8KyJmKLVzW`, a ten sam publiczny adres przesunął się do indeksu 784 plików. Ochrony Preview projektu aplikacji nie zmieniono.

Test korzystał z lokalnie skompilowanego interfejsu Studio PR #19 oraz prawdziwych usług GitHub/Vercel. Transport autoryzacji GitHuba był przekazany do podłączonego konektora; nie używano PAT użytkownika ani atrap danych/repozytorium/CDN. Konektor zwraca zdekodowane pliki JSON, więc adapter testowy odtwarzał kopertę Contents API. Normalny interfejs Studio nadal obsługuje istniejący token GitHuba.

- Plik testowy: PNG 128 × 128, 4336 bajtów, `assets/managed/e586c23cf8916af5b4bd0024f64b1a97383363b2b8538f8341ae8fd9d7cb7684.png`. Nazwa jest zgodna z SHA-256 rzeczywistych bajtów CDN.
- Commit biblioteki `deaaed3e` dodał obraz i źródłowy indeks razem. Pierwsza próba testowego adaptera błędnie zinterpretowała tekstowe potwierdzenie konektora po udanym zapisie. Wznowienie odnalazło ten sam plik w bibliotece i **nie utworzyło kolejnego blobu ani commita biblioteki**.
- Commit przypisania `92ecb9d12f8f61042dd6e913a0961cacea206820` zmienił tylko `design-system/assets.json`, `config.json`, `rules.json`. Obrazu nie ma w drzewie aplikacji.
- Rzeczywisty deploy wykrył stary test wymagający lokalnego pliku źródłowego. Poprawka zastąpiła ten warunek sprawdzeniem indeksu i bajtów CDN; 413/413 testów przeszło również z nowym obrazem istniejącym wyłącznie w bibliotece.
- Gotowy Preview `1919638fc87bd862db26f008339ddbc1d978d47a`, deployment `dpl_2apPkZP7NaG1LMA8t7hZPy5k6hGK`: `https://mala-nauka-e3db230qq-nzckzxw2x6-4792s-projects.vercel.app/ortografia/?studio=1&mode=spelling&screen=game&state=initial&word=%C5%BCaba`. Przeglądarka pokazała nowy obraz w bańce gry, `data-image-state=ready`, a SVG `image` wskazywał ścieżkę `/assets/managed/e586c23c…png` na domenie PWA, obsługiwaną przez rewrite biblioteki.
- PR #20 z builderem i źródłowym indeksem został scalony jako `724a4546a1f90f19b421f34d0f42abb8a7c41256`; zachowuje wszystkie 784 pliki i 66 znanych wymiarów.

Po scaleniu PR #19 jako `e47b313a0dc505b215d6802228192065e2d619e8` docelowe wdrożenie V2 `dpl_ov74iQcTGGKfrhZsMibnJWWgFYNp` osiągnęło READY. Pod stałym adresem `https://mala-nauka-v2.vercel.app/` przeglądarka ponownie pokazała testową ilustrację w grze, stan `ready` i ścieżkę biblioteki w elemencie SVG. Dodatkowe regresje po dołączeniu rzeczywistego uploadu: 8 etapów/29 bloków Ortografii, ukończona runda 10 słów, 5 importów referencji Studio, brak błędów JS i nieudanych żądań lokalnych. GitHub CI dla `1919638` zakończyło Orthography E2E i Avatar regression sukcesem.

Po zapisaniu dowodów przywrócono przypisanie „żaba” do `assets/scenes/zaba.avif` i zwiększono rewizję manifestu. Obraz diagnostyczny pozostaje niezmiennym, nieprzypisanym zasobem biblioteki; nie zmienia treści lekcji. Nie usunięto żadnych plików.

Dowód lokalny: `.design-qa/live/live-image-in-deployed-pwa.png`, `.design-qa/live/live-image-in-canonical-v2.png`, `.design-qa/live/library-domain-settings.png` i ślad rzeczywistych operacji konektora. Zrzuty nie są częścią paczki PWA.

## Wycofanie

Błąd publikacji biblioteki nie zmienia przypisań aplikacji; należy naprawić hosting i ponowić zapis. Już zapisany plik jest wykorzystywany ponownie. Cofnięcie przypisania słowa do poprzedniej ścieżki nie usuwa pliku z biblioteki. Nie usuwać ani nie nadpisywać ścieżek opartych o hash. Przed przełączeniem aliasu zachować identyfikator starego deploymentu `dpl_3mPkuPijAuZfxT2MaQZzgqnh24mo`; ewentualne cofnięcie aliasu wymaga najpierw cofnięcia przypisań nowych obrazów, których stary release nie zawiera.


## Lokalna kampania v53 — księga i Iskierka (21.10.2026)

Rewizja lokalnego `design-system/assets.json`: 35. Nowe grafiki z rzeczywistą
alfą, 512 × 512: `campaign-storybook-v53` (64 308 B) i
`campaign-iskierka-v53` (62 268 B). Niezmienne metadane są w
`shared/campaign-book-asset.mjs` i `shared/campaign-narrator-asset.mjs`.
Zostały sprawdzone przez bibliotekę lokalną, indeks, HTTP i rzeczywiste PWA
w Chromium/WebKit. Bajty są ignorowane w repozytorium aplikacji, zachowane
w lokalnym `assets/managed/` oraz `outputs/v53/` katalogu zadania.
Nie publikowano tych grafik do zewnętrznej biblioteki. Przed przyszłym
wdrożeniem potrzebują zwykłego uploadu biblioteki i kontroli hashy.

## Lokalna kampania v54 — wybrany przewodnik z księgą i Mira

Rewizja 37: `campaign-iskierka-book-v54`, `campaign-iskier-book-v54`,
`campaign-mira-v54`. Metadane: `shared/campaign-narrator-asset.mjs`.
Kompresja WebP z zachowaniem prawdziwej alfy. Wybrana Iskierka to zaakceptowany
wariant D; Iskier i Mira są nowymi propozycjami w tej samej rodzinie stylu.
Bajty pozostają lokalne, ignorowane w repozytorium aplikacji.
[Zakres i weryfikacja v54](design-system/campaign-iskier-ripple-v54.md).


## Kampania v54 — biblioteka opowieści i części nagród

Rewizja katalogu **40**. `shared/campaign-cast-assets.mjs` przechowuje metadane
13 nowych portretów NPC (Mira jest w `campaign-narrator-asset.mjs`), sześciu
nowych przedmiotów świata, pergaminu i dwóch krojów Charm WOFF2. Łącznie kampania
ma 14 NPC i siedem różnych przedmiotów; istniejący klucz jest przedmiotem portu.
Font ma licencję SIL OFL w `assets/fonts/Charm-OFL.txt`.

`shared/reward-parts-assets.mjs`: 12 pojedynczych grafik z alfą, 586 958 B.
Korpus medalu, wstążka, korpus pucharu i dziewięć ozdób. Renderer
`shared/reward-art.mjs` nakłada je na wspólne 512 × 512 z podstawą y=460.
Brąz/srebro/złoto mają identyczną geometrię, bez wycinania atlasu. Starsze galerie
używają tego samego renderera. Ulepszenie dodaje oddzielną animowalną warstwę.

Oryginały i prompty: katalog zadania `outputs/v54/library`, `outputs/v54/rewards`,
`npc-prompty.json`, `artifact-prompty.json`, `reward-prompty.json`.
Weryfikacja lokalna obejmuje indeks → HTTP → PWA. Bajty nie są częścią commitów
aplikacji; publikacja do zewnętrznego magazynu nie została wykonana.
