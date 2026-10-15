# Publikowanie biblioteki grafik

Ten branch jest jedynym miejscem zapisu nowych plików ilustracji. Studio V2 dopisuje `assets/managed/<sha256>.<format>` i `asset-catalog.json` w jednym commicie. Nie nadpisuje istniejących bajtów. Indeks zawiera hash, rozmiar i dostępne wymiary; build sprawdza je na rzeczywistych plikach. Wynik zawiera tylko `assets/` i publiczny `asset-catalog.json`, z SHA bieżącego wydania.

Weryfikacja przygotowania: builder uruchomiono na wszystkich 783 plikach wydania e9e4f8f (124 552 268 B), z poprawną zgodnością hashy i rozmiarów. Nie dodano ani nie skopiowano obrazów w tym PR.

STATUS: pełny E2E online pozostaje otwarty. `mala-nauka-assets.vercel.app` wskazuje chroniony podgląd projektu PWA i anonimowo przekierowuje do logowania. Utworzenie dedykowanego projektu `mala-nauka-library` i podłączenie adresu czeka na zgodę użytkownika. Dotychczasowy projekt i alias nie zostały zmienione. Ochrony aplikacji nie należy wyłączać w celu uruchomienia testów.

Przed uruchomieniem zapisów skonfiguruj automatyczne wydawanie tej gałęzi na publiczny adres biblioteki. Sprawdź anonimowy HTTP 200 dla JSON i obrazów, Content-Type, CORS, źródłowy SHA indeksu oraz automatyczne przejście adresu na nowe wydanie po pushu. Dopiero wtedy wykonaj rzeczywisty upload ze Studio V2, sprawdź nowy blob i indeks tutaj, brak pliku w commicie aplikacji oraz widoczny obraz w gotowym PWA. Testy izolowane nie zastępują tej bramki.

Rollback: zachowaj stare wdrożenie `dpl_3mPkuPijAuZfxT2MaQZzgqnh24mo`. Przed cofnięciem aliasu cofnij przypisania nowych obrazów niedostępnych w starym wydaniu. Zachowuj niezmienne ścieżki i wszystkie istniejące obrazy; nie wymuszaj aktualizacji historii Git.
