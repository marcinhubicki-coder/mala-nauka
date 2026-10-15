# Mała Nauka — spójność indeksów ilustracji V2

## Stan po migracji (13.10.2026)

- `design-system/assets.json` w gałęzi V2 to nadal **aktywny rejestr** plików i przypisań słów; nie jest to jeszcze osobna, w pełni zapisywalna biblioteka.
- `assets/library-v1` jest zamrożonym archiwum scen. Vercel obsługuje `/assets/scenes/` przez przekierowanie do wydania assetowego.
- Nowe ilustracje z Design Studio są obecnie dodawane do `assets/managed/<SHA-256>.<format>` w repo/branchu V2. Tego nie należy przedstawiać jako docelowej centralizacji.
- Podczas bieżącego audytu: 755 kanonicznych rekordów, 28 aliasów, 506 przypisań słów, 373 sceny. Wszystkie sceny mają ścieżkę w archiwum; katalog nie zawiera powtórzonych hashy.

## Etap 1 — kontrola bez ryzyka dla szkicu (wdrożony)

W panelu **Słowa, grafiki i wspólne zasady** przycisk **Sprawdź indeks online** odczytuje na nowo mały katalog JSON z gałęzi V2 i archiwum. Pokazuje liczbę rekordów, rewizje, rozbieżności i informację o potrzebie scalenia. Nie pobiera 120 MB obrazów ani nie modyfikuje lokalnego szkicu. Rejestr nie akceptuje dwóch kanonicznych wpisów o tym samym SHA-256: dawne ścieżki mogą istnieć jedynie jako aliasy. Istniejący import w Studio wciąż odwołuje się do identyfikatora SHA pliku.

## Etap 2 — jeden zapisujący katalog (do wdrożenia)

Docelowy indeks powinien mieć *jeden* adres dla czytania (np. `/library/current.json`), atomowo publikowaną rewizję i mapę `sha256 → ścieżka obrazu / rozmiar / wymiary / status`. Binaria powinny mieć niezmienne adresy oparte o SHA; przypisania słów mogą pozostać w samym Studio/warstwie treści, lecz ich ścieżki muszą istnieć w indeksie.

Kolejność zapisu:
1. Studio wczytuje i porównuje **bieżący indeks** przed zatwierdzeniem paczki; istniejący SHA oznacza ponowne wykorzystanie bez uploadu.
2. Dla nowego SHA publikuje **sam plik** do biblioteki, weryfikuje HTTP 200/rozmiar/hash i dopiero wtedy atomowo aktualizuje indeks (konflikt wersji → ponowny odczyt i scalenie).
3. Nowa wersja indeksu jest widoczna dla PWA i Studio. PWA pobiera JSON z rewalidacją, ale pliki obrazów dociąga na żądanie i buforuje niezależnie od wersji UI.
4. Każdy obraz przechowywany tylko raz; edycje UI tworzą commit kodu/modelu bez kopiowania plików. Panel Studio może dalej obsługiwać batche, wybór istniejących miniatur, zamianę ilustracji i relacje wiele słów → jedna ilustracja.

Nie przełączać zapisów na nową bibliotekę, dopóki nie mamy działającej autoryzowanej publikacji, walidacji, migracji wszystkich istniejących plików oraz zweryfikowanego rollbacku. Do czasu zakończenia etapu 2 źródło zapisu pozostaje V2, a archiwum scen jest tylko do odczytu.

## Wdrożenie zapisu do zewnętrznej biblioteki (etap 2)

Design Studio zapisuje binaria na `assets/library-v1` jako `assets/managed/<sha256>.<ext>` **przed** commitem przypisań V2. Najpierw porównuje drzewo gałęzi z nazwami plików; istniejącego SHA nie wysyła ponownie. Sprawdza hash bytes lokalnie. Po wysłaniu binariów czeka, aż `https://mala-nauka-assets.vercel.app/asset-catalog.json` pokaże konkretny SHA-256 i rozmiar. Dopiero wtedy tworzy commit na `refactor/v2-parity-first` zawierający indeks słów, ale bez binariów. Jeśli hosting nie jest jeszcze gotowy, szkic pozostaje bez zmian i można ponowić publikację: plik w archiwum nie powstaje drugi raz.

PWA V2 rozwiązuje `/assets/managed/*` przez Vercel rewrite na bibliotekę. Build Vercel odrzuca publikację, gdy choć jedna zarządzana ilustracja z aktywnego katalogu nie zgadza się z rzeczywistym indeksem CDN. Lokalne CI nadal ma fizyczne pliki do testów offline; historycznych kopii na gałęzi V2 nie usuwamy przed pełnym audytem. Każdy commit UI pomija grafiki archiwalne.

Design Studio odczytuje ten sam mały `asset-catalog.json` bez pobierania zdjęć. Przypisania słów pozostają w `design-system/assets.json` na V2, więc nie tracimy istniejących funkcji edycji. Docelowe uproszczenie przypisań w jednym indeksie jest oddzielną migracją danych i wymaga testów kompatybilności.
