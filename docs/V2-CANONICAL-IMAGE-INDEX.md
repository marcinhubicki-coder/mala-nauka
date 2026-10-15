# Biblioteka grafik V2 — zapis i publikacja

Stan na 15.10.2026: **implementacja przygotowana, pełny E2E na GitHubie/Vercelu pozostaje niezakończony**. Nie traktować przejścia testów izolowanych jako dowodu publikacji online.

## Zastana architektura

Punktem odniesienia jest `4e1ecf0`, a aktualna gałąź `refactor/v2-parity-first` zawiera dodatkowo commity `d507d63`–`78cacb4` z pierwszym zapisem do biblioteki. Ich trzy ostatnie wdrożenia Vercel kończą się błędem: publiczne żądanie `https://mala-nauka-assets.vercel.app/asset-catalog.json` otrzymuje **302 do logowania Vercela**, a build próbował interpretować HTML jako JSON.

`assets/library-v1` jest oddzielną gałęzią zasobów w tym samym repozytorium, nie osobnym repozytorium. Dotychczasowy alias biblioteki wskazuje wdrożenie Preview projektu PWA z commita `e9e4f8f7a1140cce3b347e7778c490ed929afa21`. Samo dopisanie obrazu na gałęzi nie gwarantuje przesunięcia ręcznie przypisanego aliasu. Oba problemy muszą być rozwiązane przed uruchomieniem zapisu online.

Audyt przez podłączony GitHub: wszystkie **667** rekordów z katalogów scen, grafik zarządzanych i flag mają zgodne bajty w bibliotece: 373 sceny, 35 grafik zarządzanych, 259 plików flag (w tym 256 SVG/WebP i 3 pliki tekstowe/licencyjne). Brak brakujących ścieżek i rozbieżnych SHA-256/Git blob SHA. Cały istniejący release biblioteki zawiera 783 pliki, 124 552 268 bajtów.

## Nowy przepływ

1. Studio dekoduje obraz, odczytuje wymiary i SHA-256 oraz sprawdza istniejące rekordy. Ten sam hash wykorzystuje istniejący plik, również po przerwanym wcześniejszym zapisie.
2. Cała paczka jest walidowana przed wysłaniem pierwszego obiektu. Nowe bajty trafiają wyłącznie do `assets/library-v1/assets/managed/<sha256>.<format>`.
3. **Ten sam commit biblioteki** dodaje plik i aktualizuje źródłowy `asset-catalog.json`, zachowując wymiary. Nie nadpisuje istniejącej ścieżki o innym Git blob SHA. Konflikt fast-forward powoduje ponowny odczyt drzewa i indeksu; maksymalnie trzy próby, bez wymuszania historii.
4. Asset-only build ponownie oblicza SHA-256 i rozmiar z rzeczywistych bajtów, sprawdza zgodność indeksu, zachowuje wymiary i publikuje wyłącznie `assets/` oraz publiczny `asset-catalog.json`. Nie publikuje kodu Studio/PWA.
5. Studio czeka na publiczny indeks, a następnie pobiera obraz przez publiczny URL i sprawdza jego **faktyczny rozmiar oraz SHA-256**. Wpis JSON bez dostępnego obrazu nie wystarcza. Błąd lub timeout zachowuje szkic i blokuje commit aplikacji.
6. Po ponownym sprawdzeniu głowy V2 osobny commit aplikacji zapisuje wygląd, zasady, batchy i przypisania słów. **Żadna ścieżka binarna `assets/*` nie wchodzi do tego commita.**
7. PWA odczytuje przypisanie z manifestu treści i pobiera obraz przez rewrite do biblioteki. Hosted build sprawdza zgodność scen, grafik zarządzanych i flag z publicznym indeksem i nie dołącza ich do paczki aplikacji. Lokalne testy zachowują historyczne pliki do testów bez infrastruktury Vercel.

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

## Brakująca bramka online

Proponowana konfiguracja: osobny projekt Vercel `mala-nauka-library`, wyłącznie asset-only build gałęzi `assets/library-v1`, z automatycznym publikowaniem jej zmian. Dopiero po sprawdzeniu anonimowego HTTP 200, JSON, CORS i obrazu można skierować `mala-nauka-assets.vercel.app` do tej biblioteki. Ochrona podglądów aplikacji pozostaje osobną konfiguracją.

Automatyczna kontrola odrzuciła utworzenie projektu jako trwałej konfiguracji o możliwych kosztach buildów. Oczekuje na wyraźną zgodę użytkownika na ten konkretny projekt i podłączenie adresu. Projekt nie został utworzony, alias nie został zmieniony.

Po uzyskaniu zgody trzeba wdrożyć aktualizację buildera i indeksu na gałęzi biblioteki, sprawdzić automatyczne przesunięcie jej publicznego adresu, uruchomić nowe Studio V2 i wykonać **rzeczywisty upload → commit biblioteki → publiczny indeks i bajty → commit przypisania bez obrazu → gotowy Preview PWA → widoczny obraz w grze**. Sprawdzić ponowny upload bez nowego blobu oraz zachowanie szkicu przy błędzie. Zapisać SHA obu commitów, URL wdrożenia, hash pobranego obrazu i dowód renderowania. Bez tych dowodów zadanie pozostaje otwarte.

## Wycofanie

Błąd publikacji biblioteki nie zmienia przypisań aplikacji; należy naprawić hosting i ponowić zapis. Już zapisany plik jest wykorzystywany ponownie. Cofnięcie przypisania słowa do poprzedniej ścieżki nie usuwa pliku z biblioteki. Nie usuwać ani nie nadpisywać ścieżek opartych o hash. Przed przełączeniem aliasu zachować identyfikator starego deploymentu `dpl_3mPkuPijAuZfxT2MaQZzgqnh24mo`; ewentualne cofnięcie aliasu wymaga najpierw cofnięcia przypisań nowych obrazów, których stary release nie zawiera.
