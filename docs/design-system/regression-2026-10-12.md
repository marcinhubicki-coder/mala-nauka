# Regresja Safari i startu rundy — 12 października 2026

Pierwsza wersja pełniejszego Atomic Design (076d11c) wprowadziła pętlę mutacji klasy ilustracji misji. `normalizeMission` dodawał już istniejącą klasę, a obserwator ponownie uruchamiał normalizację. Poprawka nie zapisuje niezmienionej klasy, ignoruje niezmienione wartości atrybutów i grupuje adnotowanie raz na klatkę.

Start Ortografii czekał na prezentację, która wstrzymywała animacje, gdy sesja była w stanie `paused`. Teraz podczas wejścia zatrzymujemy zegar poprzez `presentationHeld`, pozwalając animacjom zakończyć się. Fallback blur nie wstrzymuje już wszystkich animacji dokumentu.

Przejście Kolory → Biały blob → Wejście miało pusty adapter audio. Odtwarzacz przejścia ponownie odpowiada za własną ścieżkę dźwiękową. Wspólny arkusz ilustracji misji jest importowany przez kontrakt komponentów, również na stronach poszczególnych trybów.

Weryfikacja: 253/253 testów Node. Lokalny build uruchomiony w WebKit 26.5: otwarcie Edytuj ekran, pięć ekranów ustawień, hierarchia z elementami i ilustracja o szerokości 350 px; w PWA start, ręczne zakończenie, podsumowanie i powrót dla Ortografii, Angielskiego, Flag i Czytania. Brak błędów JavaScript w tych przepływach. WebKit w kontenerze nie potwierdza odsłuchu na fizycznym iPhonie ani działania zainstalowanej PWA ze starym cache. Matematyka w tym przebiegu była sprawdzona jako ekran ustawień Studio; jej osobny przepływ rundy wymaga osobnej kontroli.

Zmiany miksera stref i zestawów są osobnym, następnym etapem; ta naprawa ich nie udaje.
