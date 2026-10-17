# Jedno Studio: kod gry i poprawki audytu

Stały adres: https://mala-nauka-pwa-git-design-system-v1-nzckzxw2x6-4792s-projects.vercel.app/design-system/

Adresy z losowym identyfikatorem są podglądami konkretnych wdrożeń. Nie stanowią
kanału aktualizacji. Wspólnym źródłem gry i Studio pozostaje `design/system-v1`.
Połączono audyt `d3ddfea` (cztery rundy, dokument z 2026-10-09) z kodem Home
`8ca5ef2`, zachowując jego wektory, warstwy, font i kontrakty atomów.

## Zmiany

- Mapa ekranów i mapa dźwięków korzystają z jednej listy faktycznych przejść.
  Ustawienia mają „Zaczynamy!” → gra. Pojedynczy cel w rejestrze nie jest już
  błędnie iterowany po znakach. Nazwy widoków używają „gra”; stabilne ID
  `*-initial` i zapisane wyjątki pozostają kompatybilne.
- Każde połączenie ma własny identyfikator, obszar wyboru i grot. Wspólny router
  prowadzi linie prostokątną siatką przez przerwy między kaflami, zaokrągla rogi
  i nie stosuje awaryjnego rysowania przez obiekt. Wybrana linia otwiera grupę,
  przewija ustawienie i daje focus bez otwierania listy. Klawiatura: Enter/Spacja.
- Nazwa części otwiera bibliotekę, strzałka otwiera część w edytorze ekranu.
  Pojedynczy domyślny scenariusz nie tworzy zbędnej grupy. Logowanie i Home mają
  własne ikony zamiast ikony ortografii.
- Wspólne panele mają jednolite wypełnienie, promień i padding. Dymki trafiają
  do osobnej, nieruchomej warstwy ponad panelami; usunięto podwójne native title.
  Działy animacji używają Jelly; próbka małego przełącznika pokazuje Czas/Słowa.
- Blur korzysta z kontraktu końca rundy: 28 px i domyślnie po 1500 ms dla
  przejścia gra → wynik. Podgląd pokazuje stary i nowy ekran. Dawne `slide`
  pozostaje zgodne w danych, ale w edytorze zastępuje je łagodne pojawienie.
- Wyjście „Kolory → Biały blob → Wejście” korzysta ze wspólnego silnika loadera,
  zaczyna się po fazie obrotów i ma stały przepis. Jest osobnym przykładem
  w Animowanych elementach. W PWA przejście ma migawkę DOM starego ekranu;
  chroni dotknięcia i przywraca je również po anulowaniu. Ograniczanie ruchu
  omija animacje. Specjalne przejście końca ortografii zachowuje własny silnik.
- Przywracanie loadera, przejść, ruchu kontrolek, przepisu oraz miksu ma oddzielną
  stopkę z wyjaśnieniem źródła wartości. W Sound Lab test dźwięku rozwija opis
  i odwraca kolory podczas odtwarzania; zakończenie tonu przywraca przycisk.
  „Zakończ test” usuwa iframe z zadaniami oraz zatrzymuje odsłuch, bez zmiany miksu.
- Studio pokazuje stały link i identyfikator wspólnego buildu. Audyt techniczny
  odczytuje bieżący commit zamiast starego, zakodowanego na stałe identyfikatora.

## Sprawdzenie

Audyt kodu i build wykonano lokalnie. Zestaw regresji zawiera 243 testy, w tym
siedem połączeń Home, trasy omijające kafle w obu kierunkach, kierunkowe groty,
wybór linii bez aktywacji dropdownu, wspólne przejścia, blur, wyłączenie ruchu,
zamknięcie testu audio i koniec tonu testowego. Render kodu to nie odsłuch na iOS.

Pełną weryfikację wizualną i odsłuch w przeglądarce blokuje logowanie Vercel
w przeglądarce testowej. Nie deklarujemy sprawdzenia pixel perfect ani fizycznego
iPhone’a. Po zalogowaniu sprawdzić desktop, 390 × 844 oraz 360 px: wybór wszystkich
linii Home, focus dropdownu, obie mapy, dymki nad panelami, blur, wyjście blob,
Zakończ test i stan przycisku tonu. Dane testowe nie wymagają zapisu do GitHub.
