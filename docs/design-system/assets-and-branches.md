# Assety i branche

## Jedna baza

Kanonicznym źródłem jest `design/system-v1`:

- `assets/`: pliki ilustracji, teł, ikon i fontów;
- `data/words-01.json` … `words-08.json`: **455 haseł** i ich treści;
- `design-system/assets.json`: **678 unikalnych plików**, hashe, aliasy i jedno przypisanie ilustracji na hasło.
- `design-system/rules.json`: **41 wspólnych zasad**, przypisania zasad do słów oraz wykryte grupy liter.

Konsumenci pobierają ten kontrakt podczas builda i korzystają z centralnych URL-i `raw.githubusercontent.com`. Fonty, CSS, HTML, dynamicznie tworzone obrazki i sceny przechodzą przez ten sam resolver. Zmieniona ilustracja jednego hasła nie zmienia innych haseł współdzielących wcześniejszy obrazek.

Konfiguracja, rejestr, wspólne zasady i paczki słów są odczytywane również przy uruchomieniu online. Ich cache działa network-first z fallbackiem offline. Dzięki temu commit tokenów, przejść, przypisań ilustracji lub wspólnej treści zasady dociera do konsumenta bez kopiowania folderów. Zmiana kodu komponentu wymaga nowego builda konsumenta; build pobiera aktualne wspólne moduły i wszystkie ich zależności.

Nie publikujemy kopii `assets/` ani paczek słów w `dist/` konsumenta. Błąd pobrania kontraktu zatrzymuje build. Niedozwolony jest cichy powrót do starego lokalnego folderu.

## Porządki

28 identycznych plików scalono po SHA-256: oszczędność **7 473 392 B**. Alias stary→kanoniczny zachowuje działanie dawnych adresów. Ponowny audyt zachowuje aliasy oraz ręczne przypisania; nie odtwarza usuniętych kopii.

16 nieodwoływanych wersji CSS/JS usunięto: **74 986 B**. Lista usunięć znajduje się w `audit.json`. Aktywne warstwy CSS pozostają czytelne w źródle; build spłaszcza importy i usuwa identyczne reguły, zachowując ostatnią w kaskadzie. Historyczne wersje pozostają dostępne w Git.

Nowy upload ma adres `assets/managed/<SHA-256>.<format>`. Identyczny hash ponownie wykorzystuje istniejący plik. Limit to 12 MB. Miniatury są ładowane leniwie, po 24 hasła na stronę. Rejestr pokazuje rozmiar i odwołania.

**Grafiki → Współdzielone** pokazuje 51 ilustracji przypisanych do kilku słów. Kliknięcie ilustracji pokazuje wszystkie powiązane słowa. Scalenie wybranych ilustracji pozwala wybrać jedną docelową grafikę i przejrzeć listę słów przed zmianą. Przypisania i dawne aliasy wskazują wtedy jeden aktywny asset; oryginalne pliki pozostają w rejestrze dla innych użyć i możliwości powrotu. To scalenie przypisań różnych obrazków, a nie automatyczne uznanie ich za identyczne pliki.

**Zasady** mają jedną edytowaną treść. Początkowa migracja zachowuje obecne wyjaśnienia słów. Świadomy zapis wspólnej zasady uruchamia jej treść dla wszystkich słów, w których jest zasadą ćwiczoną. Indywidualne przykłady, formy i źródła pozostają zachowane; Studio nie oferuje osobnego nadpisania wyjaśnienia pojedynczego słowa. Dodatkowe powiązania z innymi grupami nie zmieniają litery sprawdzanej w grze.

Nie usuwamy pliku wyłącznie na podstawie braku statycznego odwołania: część scen i atlasów jest wybierana dynamicznie. Nowa baza jest zachowana; scalono rzeczywiste duplikaty i nieaktywne pliki kodu.

## Podłączenie brancha

Dla osobnego checkoutu brancha roboczego:

```sh
node /ścieżka/do/design-system/tools/install-consumer.mjs /ścieżka/do/brancha
cd /ścieżka/do/brancha
npm run build
```

Integrator dodaje build, konfigurację Vercel i `consumer.json`, usuwa lokalny folder assetów oraz osiem paczek słów. Wynik musi mieć `sourceAssetCopies: 0`. Odpal przed usunięciem kontrolę, czy wszystkie jego ilustracje są już w bazie; sześć podłączonych branchy przeszło porównanie zawartości plików z bazą kanoniczną.

`design-system/branches.json` określa podłączone branche robocze. Historyczne wydania, tymczasowe próby i dawne tunery są migawkami w Git; nie są źródłami dla nowych prac. Nowy branch startuje z systemu lub przechodzi przez integrator.

Produkcja `main` jest oddzielona od wdrożenia narzędzia. Jej integracja wymaga przeglądu zmian; nie została automatycznie opublikowana. Po integracji produkcja użyje tej samej bazy. Zachowane migawki Git nie są dodatkowymi bazami wykorzystywanymi przez bieżące aplikacje.

## Offline

SW przechowuje jeden zestaw zasobów na urządzeniu, usuwa poprzednie cache przy aktywacji nowej wersji i korzysta z centralnego źródła. Offline używa ostatniej poprawnie pobranej wersji. Pierwsze kompletne pobranie dużej bazy ilustracji wymaga internetu. Cache na urządzeniu jest konieczny dla PWA; nie jest drugim folderem źródłowym w repozytorium.
