# Weryfikacja

Wykonano 3–4 października 2026. Pierwszy pełny przegląd: `60509158dcb8dcd798dc9e478cd4cc2cc0e69ff7`. Po przywróceniu środowiska ponownie wykonano build i **44 / 44 testy** dla najnowszej implementacji `cc6e2ef0605fd74e5d0eeceba62575685626c1fd` oraz domknięto poniższe kontrole przeglądarkowe.

## Wyniki

| Kontrola | Wynik |
| --- | --- |
| Build kanoniczny | Poprawny; 678 unikalnych plików, 15 zbudowanych stron |
| Testy Node | **44 / 44**; mechanika gry, profile, backup, reguły, baza, komponenty i Git |
| Baza słów | **455 / 455** mają istniejącą kanoniczną ilustrację |
| Alias starych plików | Wszystkie 28 wskazują istniejący plik |
| Git | Jeden atomowy commit; blokada konfliktu przed zapisem oraz podczas aktualizacji ref |
| Szkic | Walidacja konfiguracji, scalenie niezależnych zmian, ochrona konfliktu hasła |
| 6 konsumentów | Każdy build poprawny; zero lokalnych assetów i paczek słów w dist |
| Wdrożenia | Kanoniczne i wszystkie 6 konsumentów: Vercel **READY** |
| Podgląd desktopowy | Rzeczywisty iframe 390 × 844; cała ramka telefonu mieści się w oknie |
| Suwak jelly | Zmiana 54 → 62 zmieniła zmierzoną wysokość rzeczywistego toru na 62 px |
| 5 trybów | Ustawienia, początek, poprawna i błędna odpowiedź, wyniki: otwarte i sprawdzone |
| Profile i home | Wybór, pusty wybór, tworzenie, PIN, start i ustawienia: otwarte |
| Ortografia | Popup zasady, podpowiedź, pauza oraz slider po błędzie: otwarte |
| Postępy | Dashboard i kolekcja; treść pucharów i przykładowa ukończona runda w historii potwierdzone |
| Upload i reload | PNG 1200 × 1200 dodany do pojedynczego hasła; po reload odtworzono przypisanie, plik i miniaturę o pełnych wymiarach z IndexedDB |
| Końcowe poprawki | Nagłówek postępów mieści się na ekranie; brak desktopowego scrollbara; matematyka ma adnotacje wspólnego systemu oraz stan błędnej odpowiedzi |

Testy zapisu Git używają kontrolowanego transportu bez prawdziwego tokenu użytkownika. Realne commity tego wdrożenia zostały utworzone w GitHub i uruchomiły poprawne buildy. Nie wykonano dodatkowego commitu z poziomu panelu z osobistym tokenem.

## Pozostała weryfikacja

Rozłączenie środowiska przerwało wcześniejszy przegląd. 4 października wznowiono testy i potwierdzono upload → reload oraz końcowe korekty widoków. Próbna ilustracja pozostała wyłącznie w lokalnym szkicu testowej przeglądarki; nie została zapisana w bazie Git. Panel włącza zapis przy niezapisanych zmianach i wymaga połączenia GitHub. Nie przeprowadzono pierwszego zapisu przez interfejs z osobistym tokenem użytkownika; taki token trzeba podłączyć we własnej przeglądarce. Atomowy zapis i oba przypadki konfliktu pozostają objęte testami kontrolowanego transportu.

Galeria, upload z SHA-256, miniatury, trwały szkic IndexedDB i zapis Git są zaimplementowane. Walidacja, aliasy i zapis/konflikty objęto testami. Symulator nie zastępuje testu Safari/PWA na fizycznym iPhonie; DPR 3 określa cel graficzny, nie sprzętowy DPR przeglądarki desktopowej.

## Kolejny test na urządzeniu

1. Otwórz ustawienia czterech trybów, zmień jelly i wróć; sprawdź tap, drag i klawiaturę.
2. W każdej grze wybierz poprawną i błędną odpowiedź; sprawdź pauzę zegara i dalszy krok.
3. Otwórz zasadę, podpowiedź i puchary. Sprawdź przewijanie oraz powrót fokusu.
4. Wgraj ilustrację 1:1 do hasła, odśwież szkic, połącz GitHub i zapisz jeden commit.
5. Otwórz inny podłączony branch online; sprawdź nowy token, przypisanie oraz tę samą bazę.
6. Po pełnym pobraniu uruchom instalowaną PWA offline.

Nie wykonano automatycznego merge do main ani publikacji produkcyjnej.
