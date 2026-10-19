# Integracja lokalna v41 — zakres i lista odbioru

Baza Studio: 595bfd8, 45 widoków. Gra źródłowa: fc4ae34 (atlas v39 / scena v40).
Gałąź lokalna: work/scenic-studio-v41. Bez publikacji i bez zmiany main.
Chronione: nowe kafle i odstępy Home, układ i punktacja wyników V2, Ortografia,
kuźnia, trofea, biblioteka assetów i wszystkie istniejące kontrakty.

## Geometria i tekst
- [x] Jasny pas +5 px od góry; flaga +10 px w dół, we wszystkich logicznych wariantach.
- [x] Kompas pergaminu +10% względem środka i 5 px w lewo.
- [x] Zamknięte pytanie Flag +4 px w dół.
- [x] Loader „Trwa ładowanie...” w jednym wierszu.
- [x] Państwa: pytanie u góry, pod nim stolica/ikona we wspólnym małym rozmiarze.
- [x] 10 px przerwy pytanie–stolica i 10 px poniżej najniższego piksela stolicy.
- [x] Mapa i narzędzia w Państwach/Stolicach wracają do dolnego marginesu Flag.

## Choreografia
- [x] Poprawna Państwa/Stolice: wyczyść mapę, zwiń, pokaż flagę i poprawną odpowiedź.
- [x] Następne po poprawnej: wyczyść niewidoczną mapę; litery i rozwijanie równocześnie.
- [x] Błędna Stolice: zachowaj mapę, odsłoń tylko flagę, stolicę i ikonę.
- [x] Slider po błędnej Stolice: wymień mapę/teksty bez składania pergaminu.
- [x] Nowe zasoby gotowe pod blurem; zegar zatrzymany podczas prezentacji.

## Wspólny runtime i Studio
- [x] Ten sam renderer, Session, jawne atomy/grupy i kontrakty w PWA oraz Studio.
- [x] Wyjście/pauza i rozmiar zegara z Ortografii; pod zegarem tryb/stan zatrzymania.
- [x] Domyślnie zadania, przełącznik Zadania/Czas i właściwe kończenie rundy.
- [x] Wyniki: punktacja i layout V2; tylko tło z niebem/balonem/górami z gałęzi Flag.
- [x] Home: zdjęcie przycięte niezależnie od wystającej sylwetki, nowe kafle zachowane.

## Map Validator
- [x] Zakładka Studio, kontynenty/kraje po lewej, urządzenie i podgląd pośrodku.
- [x] Near/full, +/−, reset i Zapisz; oznaczenie nadpisanego kraju.
- [x] Zapis współdzielony przez trzy tryby oraz lokalne PWA.
- [x] Ukryty domyślnie panel statystyk: obszar, kafle, MB, etykiety/flagi.
- [x] Przeliczanie etykiet, jawna widoczność i przeciąganie etykiety razem z flagą.
- [x] Walidacja konfiguracji, trwałość, eksport i ochrona przed wyciekiem odpowiedzi.

## Kontrola końcowa
- [x] Test kontraktów i pełny build; lokalne testy logiki oraz gestów.
- [x] WebKit: wszystkie trzy tryby, błąd/poprawna/slider/następne/pauza/koniec.
- [x] Studio → edycja → zapis → PWA, zmiana urządzenia i przeładowanie.
- [x] Porównanie Home i gry na 390×844 oraz regresja aktualnych widoków V2.
- [x] Podsumowanie sprawdzeń i lokalne linki; fizyczny iPhone odróżniony od emulacji.

## Wynik sprawdzeń lokalnych — 19.10.2026

- `npm test`: 448/448, pełny build i walidacja konfiguracji/kontraktów.
- Rzeczywiste renderery 45 widoków × iPhone 390×844 i desktop 1440×900:
  90/90 kontroli; odświeżono pochodny cache edytora z zamontowanych kontraktów.
- WebKit: trzy tryby, poprawna → flaga → automatyczne następne zadanie;
  błędna Stolice zachowuje dokładnie piksele geografii, również po oddaleniu;
  slider nie składa pergaminu Stolic. Zwykły ruch: 455 próbek, wspólne
  rozpoczęcie liter i otwierania. Sąsiedzi zaczynają przy postępie tuszu 0,679.
- Prawdziwy formularz PWA: Zadania/Czas, domyślne 10 zadań, pauza/wznowienie,
  10 poprawnych odpowiedzi i podsumowanie V2. Punktacja/progres to istniejąca
  Session i istniejący zapis wyników V2.
- Map Validator: powiększenie, oba widoki, urządzenia, panel statystyk,
  ręczne przywrócenie etykiety/flagi, drag, zapis, ponowne wczytanie, reset.
  Kalibrację odczytują Flagi, Państwa i Stolice. Przed odpowiedzią ustawienie
  widoczności nie ujawnia nazwy odgadywanego kraju ani odgadywanej stolicy.
- Studio: wybieranie wariantów gry, selekcja atomu tekstu malowanego na canvas,
  zmiana jego stylu rzeczywiście odmalowuje aktywny nagłówek. Ukrycie/usunięcie
  atomów napisów usuwa także tusz, zachowując niezależną flagę.
- Home: zachowano nowe kafle; maska zaokrąglonego zdjęcia jest niezależna od
  obrysu wystającego kapelusza. Zdjęcie ma proporcjonalny kadr `cover`.
- Tryb standalone w WebKit: wysokość 844 px, zdjęcie pozostaje częścią wspólnej
  rodziny/kontraktu; dodatkowy natywny podkład wypełnia obszary systemowe.
  To emulacja, nie potwierdzenie na fizycznym iPhonie ani pomiar iOS 27.

## Lokalny podgląd

Design Studio: http://127.0.0.1:8872/design-system/#maps
PWA: http://127.0.0.1:8872/
Ustawienia geografii: http://127.0.0.1:8872/flagi/preview-frame.html

Uruchomienie z katalogu tego checkoutu:

```sh
node tools/build-design.mjs
MN_SCENIC_ASSETS=/Users/marcin/Documents/Codex/2026-10-16/moze/work/mala-nauka node tools/serve-preview.mjs 8872
```

Powtarzalny odbiór przeglądarkowy:

```sh
node tools/verify-scenic-studio.mjs http://127.0.0.1:8872
```

Zapis map działa wyłącznie przez lokalny serwer; zapisuje `mapOverrides`
w źródłowym i zbudowanym config.json. Port 8872 musi być wolny przy ponownym
uruchomieniu. Narzędzie odbioru przywraca wcześniejszą kalibrację testowanego kraju.

Gotowe grafiki sceny i atlas z gałęzi Flag są lokalnie odczytywane przez
`MN_SCENIC_ASSETS`, bez kopiowania binariów do commitu aplikacji. Pozostałe
zasoby pochodzą z istniejącej biblioteki V2. Ten krok nie publikuje biblioteki,
Preview ani produkcji. Przed przyszłym zdalnym wydaniem nowe ścieżki sceny/atlasu
muszą przejść publikację w kanonicznej bibliotece assetów i kontrolę HTTP.

Raporty i screenshoty: `.design-qa/` oraz `../../outputs/v41/`.
