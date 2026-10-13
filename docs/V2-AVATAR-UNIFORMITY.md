# v2 — jednolite avatary graczy

**Branch:** `refactor/v2-parity-first` · **nie dotyka produkcyjnego `main`**.

## Błąd źródłowy

Poprzedni renderer mieszał siatkę 2×2 (pierwsze cztery avatary), siatkę 4×2 (pozostałe osiem), tło CSS i nałożony SVG. Występowały odmienne kadry, rozciąganie i niestabilna średnica widocznego koła. Po pierwszej próbie eksportu znaleziono dodatkowy błąd: URL zapisany w zmiennej CSS był rozwiązywany względem katalogu arkusza stylów (`/styles/assets/...`), więc grafiki mogły się nie wczytywać.

## Rozwiązanie

- **12 niezależnych plików** `assets/brand/avatars/{a..l}.webp`, każdy **384 × 384 px**, WebP z alfą, około 21–25 KB.
- Generator `tools/normalize-avatars.py` zachowuje zatwierdzone rysunki z oryginalnych dwóch arkuszy. Operuje jedynie kadrowaniem, skalowaniem z zachowaniem proporcji i centrowaniem. Nie zmienia cech postaci.
- Jeden renderer `profileAvatar()` w `shared/profile-parts.mjs`; używa obrazu `<img>` z atrybutami `width=384`, `height=384`. Wbudowany SVG i CSS sprite są usunięte.
- Ścieżki do obrazów są **root-relative**, aby działały również w podglądzie Design Studio pod `/design-system/`. Można podać własny `assetURL`, np. dla CDN.
- `.player-avatar-art` i `.player-avatar-image` mają `aspect-ratio:1/1` i okrągłą maskę. Poszczególne konteksty (kafel gracza, podgląd profilu, picker, PIN, ustawienia) mogą mieć **różne rozmiary funkcjonalne**, ale w danym kontekście każdy avatar ma tę samą średnicę bez deformacji.
- Wszystkie nowe pliki są w `design-system/assets.json` i w małym zestawie offline; wycofano wymuszone ładowanie dwóch dużych arkuszy w trakcie instalacji PWA.

**Uwaga:** nieregularny, półprzezroczysty zewnętrzny brzeg oryginalnych ilustracji ma w niektórych plikach do około 3% różnicy w *nieprzezroczystej* szerokości. Zewnętrzny kontener jest idealnym kołem, a obrazy nie są rozciągane. Nie wyrównujemy tej resztki przez deformowanie twarzy.

## Kontrola regresji

`tests/v2-avatar-consistency.test.mjs` pilnuje kompletu 12 plików, rozmiaru, typu WebP, poprawności ścieżek w rendererze, okrągłej maski, usunięcia atlasów z CSS i cache offline.

`tools/qa-avatars-browser.mjs` przechodzi całą drogę w Chromium (390 × 844 / DPR 3): wybór każdego z 12 avatarów, podgląd, przejście na PIN, zapis profilu, ustawienia i edycja avatara. Test wykrywa brakujące obrazki, błędy JS, różnicę szerokości i wysokości, zmianę średnicy w jednym kontekście.

Wykonano ręczną kontrolę przeglądarkową przed zamknięciem sesji: **12/12 obrazków wczytuje się jako 384 × 384**, picker **62,5 × 62,5 CSS px**, podgląd i ekran PIN **96 × 96 CSS px**, zmiana a–l nie zmienia wielkości podglądu, brak błędów JS. Pełnego nowego skryptu end-to-end obejmującego także *zapis i ponowną edycję* nie uruchomiono, ponieważ Vercel Sandbox zablokował nowe sesje po przekroczeniu limitu snapshotów Hobby. Do jego wykonania wymagane jest dostępne środowisko przeglądarkowe.

**Nie uznawać jeszcze za przeprowadzony** fizycznego testu iPhone/Safari ani pełnego end-to-end przez edycję. Produkcji nie publikować automatycznie.
