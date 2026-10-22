# Kampania i efekty kart — v50, lokalnie

Baza: v49 (`9c6c8d8`), branch `work/campaign-effects-v50`. Bez publikacji,
zmian main, profilu gracza i balansu iskier. Wzorcem są inspiracje wskazane
przez użytkownika: [siatka, poświaty i przycisk](https://freefrontend.com/css-glow-effects/).
Implementacja jest własna; nie wprowadzono bibliotek ani zewnętrznych skryptów.

## Zakres i elementy chronione

- Siatka, mgła i układanka obejmują cały ekran kampanii, pod nawigacją.
  Zachowane są współrzędne mapy, cztery narożniki pól, postać ponad zaznaczeniem,
  odkryty teren, kolejność kroków, zapis postępu oraz teleport.
- Ruch obejmuje maksymalnie 12 nieodkrytych fragmentów. Łańcuch przechodzi tylko
  przez wspólną krawędź. Pozostaje pod nim nieodkryty obraz — impuls nie odsłania
  mapy. Główny canvas jest nieruchomy poza odkrywaniem i zmianą rozmiaru.
- Komputer: światło pod kursorem. Dotyk: autonomiczne impulsy. Oba urządzenia:
  sporadyczne krótkie łańcuchy. Ruch wyłącza reduced-motion, ukrycie dokumentu,
  opuszczenie sceny i trwający teleport. Po powrocie wznawia się.
- Przycisk kampanii zachowuje położenie, treść, szerokość do 45% oraz odstępy.
  Dodano małą tęczową aurę i deformację całej bańki. Nie ma nowego hover ani ikony.
- Gotowe karty kuźni i nagród mają osiem lekkich wariantów: iskry, bąbelki,
  świetliki, elektryczne obrzeże, romby, fale, wiatr i zorzę. Domyślnie cztery
  pierwsze przypisano poziomom 1–4. Maksymalnie 12 drobinek na kartę;
  niewidoczne, niegotowe i wyłączone karty nie animują dekoracji.
- Wspólne paski i liczby wypełniają się z opóźnieniem 280 ms między wymaganiami
  (zakres ustawień 250–300 ms). Wartości pozostają całkowite, delikatnie się
  powiększają. Odhaczenie pojawia się po zakończeniu zliczania.
- Usunięto tekstowe romby wokół pucharu. Zapis wyborów, dziesięć etapów i atlas
  pucharów pozostają. Nie dodano stałego pulsowania samej grafiki pucharu.
- Ulepszenie istniejącej nagrody ma skończone przygaszenie sceny ilustracji
  i pięć smug z opóźnieniem 150 ms. Skrzynia pozostaje tylko dla odkrycia.

## Studio i ten sam runtime w grze

`Mapa kampanii i animacje → Mgła i odkrywanie → Żywa mapa`: przełączniki,
częstotliwość, długość, liczba pól, siła ruchu i światła oraz „Uruchom impuls
teraz”. Zmiana suwakiem odświeża podgląd na żywo.

`Kampania i nagrody → Lab efektów`: rzeczywiste komponenty sekcji, szerokość
390 px, wybór kuźni/medalu/trofeum/pucharu, poziomu i stanu, przycisk powtórki
liczników. Przyciski i slider używają prawdziwych przepisów na symulowanym
profilu, bez zapisu profilu dziecka. Oddzielna podpisana próbka pokazuje
przesunięcie trzech pasków w czasie (np. 5/6, 7/10, 2/3).

Ustawienia zapisują się jako `adventure.discovery` i `adventure.rewardEffects`
przez standardowe Cofnij/Ponów/Zapisz lokalnie. Renderery gry czytają ten sam
model. Nie trzeba kopiować ustawień między trybami.

Nowy miernik kuźni jest częścią wspólnego kontraktu i dziedziczy istniejący
atom `meter-power-charge`. Wciąż jest 50 widoków. Zaktualizowano sprawdzony
inwentarz edytora oraz eksport plików współdzielonych.

## Sprawdzenie i granice dowodów

- 481 testów Node; 100 sprawdzeń kontraktów (50 ekranów × telefon/desktop).
- Chromium i WebKit: uruchomienie impulsu, odkrywanie, teleport, wznowienie,
  rzeczywiste karty, gotowość, kolejne liczby, upgrade i usunięcie warstw.
- Testy domyślnego i ograniczonego ruchu. Osobny scenariusz dotykowy sprawdza
  samoczynne światło bez hover. Kontrola Home ↔ Kampania oraz cofania układu.
- Pomiary rAF i liczby odmalowań to dowód z automatycznych silników na Macu,
  nie pomiar fizycznego iPhone’a ani zużycia baterii.
- Raporty: `.design-qa/v50/`. Zrzuty i linki do oceny: `outputs/v50/` w katalogu
  zadania. Vercel pozostaje na v48, dopóki nie zostanie zlecona publikacja.
