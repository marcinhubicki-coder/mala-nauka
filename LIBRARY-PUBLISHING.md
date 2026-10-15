# Publikowanie biblioteki grafik

Ten branch jest jedynym miejscem zapisu nowych plików ilustracji. Studio V2 dopisuje `assets/managed/<sha256>.<format>` i `asset-catalog.json` w jednym commicie. Nie nadpisuje istniejących bajtów. Indeks zawiera hash, rozmiar i dostępne wymiary; build sprawdza je na rzeczywistych plikach. Wynik zawiera tylko `assets/` i publiczny `asset-catalog.json`, z SHA bieżącego wydania.

Stan 15.10.2026: pełny przepływ online sprawdzony. Rzeczywisty upload w Studio utworzył commit biblioteki `deaaed3eb576ce39e8f82376437492adba39cfa7`; Vercel automatycznie opublikował 784 pliki. Wznowienie użyło istniejącego obrazu bez kolejnego blobu. Commit V2 `92ecb9d12f8f61042dd6e913a0961cacea206820` zawierał tylko metadane. PNG 128 × 128 (4336 B, SHA-256 `e586c23cf8916af5b4bd0024f64b1a97383363b2b8538f8341ae8fd9d7cb7684`) został widocznie wyrenderowany w opublikowanym PWA, a następnie na docelowym `mala-nauka-v2.vercel.app` po scaleniu PR #19 jako `e47b313a0dc505b215d6802228192065e2d619e8`.

Studio testowano jako lokalnie skompilowany interfejs PR #19 z transportem autoryzacji przez podłączony GitHub. Operacje Git, buildy, indeks, bajty CDN i końcowe PWA były rzeczywiste. Test izolowany pozostaje osobną regresją. Szczegółowe dowody i granice testu: `docs/V2-CANONICAL-IMAGE-INDEX.md` na gałęzi `refactor/v2-parity-first`.

Hosting: projekt `mala-nauka-library` (`prj_cmBnutecSKqwRk0dy7gBdJiAGwLg`) w istniejącym zespole na planie Hobby, bez płatnych dodatków. Production śledzi `assets/library-v1`, Preview wyłączone, warunek ignorowania pozostałych buildów: `test "$VERCEL_GIT_COMMIT_REF" != "assets/library-v1"`. Publiczna domena Production `mala-nauka-assets.vercel.app` automatycznie podąża za nowym wydaniem; `gitBranch: null`. Ochrona podglądów aplikacji pozostała aktywna.

Aktualizacja buildera i indeksu: PR #20, merge `724a4546a1f90f19b421f34d0f42abb8a7c41256`. Anonimowy HTTP 200, JSON, CORS `*`, wszystkie 784 pliki i 66 znanych wymiarów oraz hash/rozmiar testowego obrazu sprawdzono po tym wdrożeniu. Nowe pliki są przechowywane wyłącznie tutaj; aplikacja zapisuje przypisania i pobiera obrazy przez rewrite. Tymczasowe przypisanie obrazu diagnostycznego zostaje przywrócone po weryfikacji; sam niezmienny obraz pozostaje w bibliotece jako dowód testu.

Rollback: zachowaj stare wdrożenie `dpl_3mPkuPijAuZfxT2MaQZzgqnh24mo`. Przed cofnięciem domeny cofnij przypisania nowych obrazów niedostępnych w starym wydaniu. Zachowuj niezmienne ścieżki i wszystkie istniejące obrazy; nie wymuszaj aktualizacji historii Git.
