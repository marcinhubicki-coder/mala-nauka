# Wspólna baza i zamrożone Preview

- `data/words-*.json` zawiera słowa. Gra i Studio czytają te same pliki.
- `design-system/assets.json` jest jedynym źródłem przypisań słowo → grafika i aliasów.
- `assets/...` przechowuje pliki. `spelling/scenes.mjs` tylko odczytuje manifest, bez alternatywnych przypisań.

## Odświeżanie Studio

„Baza słów i grafik → Odśwież bazę z GitHub” oraz „Wersje i szkice → Wczytaj i scal z GitHub” pobierają aktualny `design/system-v1`. Najpierw odczytywany jest SHA, następnie wszystkie pliki i katalog z tego SHA. Lokalny szkic jest scalany trójstronnie; konflikty wymagają wyboru wersji. Błąd pobierania nie podmienia działającej bazy.

Nowe obrazy znalezione w drzewie GitHub pojawiają się w bibliotece jako nieprzypisane. Ich SHA-256 wyliczany jest z zawartości. Indeks zostaje częścią szkicu i trafia do manifestu przy zapisie. Nazwa pliku nie dopisuje automatycznie słowa ani przypisania. Grafiki, słowa i reguły w podglądach osadzonych są aktualizowane razem. Grafiki pobierane są z odczytanego SHA, a nie z poprzedniego wdrożenia Studio.

Dla publicznego repo odświeżenie działa bez tokenu; zapis nadal wymaga połączenia GitHub. Limity GitHub i błędy sieci są pokazywane w Studio. Można połączyć GitHub, aby korzystać z uwierzytelnionych odczytów.

Po dodaniu plików poza Studio uruchom `npm run assets:audit` i zapisz zmieniony manifest. Narzędzie indeksuje pliki i zachowuje istniejące przypisania, także ich celowe usunięcia. Dziesięć ilustracji z ostatniej paczki jest już w indeksie; słowa tej paczki nie są jeszcze rekordami w bazie gry.

## Preview

Link PWA oraz udostępniana próba projektu korzystają z adresu wdrożenia odnalezionego dla konkretnego SHA. Studio sprawdza SHA wpisu wdrożenia w GitHub oraz wybiera unikalny adres Vercel; odrzuca aliasy branchy. Działa to także dla Preview chronionego logowaniem Vercel. Nie tworzy pozornego zamrożenia przez parametr `?preview=SHA` na zmiennym adresie Studio.

Build `design/system-v1` oraz `main` zawiera własne pliki z budowanego commita. Build konsumenta innego brancha rozwiązuje źródło centralne do SHA raz podczas budowania; słowa, grafiki i konfiguracja korzystają później wyłącznie z tego SHA. `DS_SOURCE_SHA` lub `DS_SOURCE_URL` mogą wskazywać wyłącznie pełny commit; zmienny URL brancha jest odrzucany. Odświeżenie Studio nie zmienia już opublikowanego wdrożenia gry.

## Weryfikacja

Testy automatyczne obejmują brak ręcznych przypisań, nowe pliki, scalanie, spójny SHA wszystkich odczytów i odrzucenie Preview innego commita. Test Chrome obejmuje odświeżenie z lokalnym szkicem, obraz z nowego SHA, ponowne otwarcie Studio oraz awarię GitHub bez utraty danych.
