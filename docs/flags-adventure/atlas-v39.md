# Flagi — pełny atlas v39

Preview na gałęzi `feature/flags-scenic-preview-v1`. Wersja obejmuje 195 państw dostępnych w grze. W konfiguratorze tryb „Flagi” uruchamia nową scenę; pozostałe rodzaje ćwiczeń zachowują dotychczasowy widok.

## Ilustracja i zgodność

Zachowany plik Europy HD v27 oraz 22 nowe regiony malowane w tym samym stylu. 51 nakładających się fragmentów domalowuje detal dla zbliżeń. To rekonstrukcje ImageGen z osobnymi przewodnikami geografii, a nie samo powiększenie małego obrazu. Naprawiono też sztuczny szew północnej Afryki. Prompty i identyfikatory wyników są w `atlas-v39-prompts.json`.

Natural Earth dostarcza granice, linie brzegowe, jeziora, rzeki i położenie pasm górskich. HYP_LR kieruje typem terenu. Przewodniki wysokości korzystają z Mapzen Terrarium: <3000m — niższe brązowe/zielone pasma;3000–6000m — częściowo śnieżne;6000–9000m — wysokie śnieżne masywy. Lodowce polarne mają osobne znaczenie. Jest to ilustracja edukacyjna; drobne szczyty i roślinność są artystyczną interpretacją.

Po ograniczonej korekcie położenia tekstur finalny ląd jest przycięty do unii dokładnie tych samych ścieżek krajów, które rysuje gra, z odjęciem jezior. Ten sam początek, skala i projekcja dotyczą każdego poziomu rozdzielczości. Poziomy są zmniejszeniami jednej scalonej mapy 14336×9216. Rysunek i obrys nie używają osobnych transformacji podczas zoomu. Granice wewnętrzne rysuje gra, a nie generator. Raport korekt: `atlas-v39-registration.json`.

Rosja ma zbliżenie części europejskiej i oddalenie obejmujące Europę oraz Azję. Widok jest opisany w interfejsie. Długości geograficzne wokół linii zmiany daty są zawijane; nie ma pustej prawej krawędzi dla Fidżi czy wschodniej Rosji. Małe archipelagi skupiają się na grupie wysp przy stolicy.

## Ładowanie i pamięć

481 fragmentów WebP po 512px z 2px zakładki,5 poziomów rozdzielczości. Wszystkie poziomy całego świata razem:19 930 596B (około19,9MB). To zasób całego atlasu; pojedyncza runda nie pobiera całości. Fragmenty samego oceanu są pomijane, wodę tworzy jedna mała, powtarzalna tekstura. Wielki plik autorski nigdy nie trafia do telefonu.

Limit atlasu:24MiB rozkodowanych bitmap oraz8MiB skompresowanego cache. Rezerwacja pamięci przed dekodowaniem i LRU z `ImageBitmap.close()`. Zbliżenie zachowuje docelowy detal, pod nim jest kompletny lżejszy widok kontynentu, opcjonalnie poziom pośredni. Wszystkie potrzebne fragmenty są gotowe przed animacją; jej klatki nie pobierają ani nie dekodują obrazów. Nieudane pobranie HD może użyć niższego poziomu. Brak wymaganych materiałów początkowych utrzymuje zasłonę z możliwością ponowienia.

Pierwsza scena, fonty z polskimi znakami, materiały UI, flaga oraz oba kadry mapy są przygotowane przed odsłonięciem. Wejście z konfiguratora korzysta z dotychczasowego przejścia z blurem. Zegar startuje po jego zakończeniu. Kolejna flaga jest przygotowywana w tle; przy adaptacyjnym wyborze rezerwowane jest dokładnie następne pytanie prawdziwej sesji. Przejście czeka na materiały. Zachowane są ustawienia trudności, punkty, pauza i zapis wyniku. Zakończenie scenicznej rundy pokazuje obiecane podsumowanie. Liczba pergaminów sąsiadów jest mierzona przed pokazaniem pytania, więc długie listy (np. DR Konga i Chiny) mają zarezerwowane miejsce nad suwakiem.

## Krótka weryfikacja

`node tools/flags-world-v39-check.mjs`:195 krajów,239 unikalnych geometrii, komplet stolic, kadr zachowujący proporcje i granice kontynentu, obecność plików i rozmiary z indeksu. Wszystkie 195 planów zachowują docelowy poziom zbliżenia. Największy plan 24 215 904B mieści się w25 165 824B. Sześć dotychczasowych testów etykiet i kamer przechodzi.

WebKit390×844/DPR2: Polska, Japonia, Brazylia, DR Konga, Fidżi, Rosja, Arabia Saudyjska i Sri Lanka. Dla tych widoków nie ma dodatkowych pobrań podczas przełączania zbliżenia/oddalenia i nie wystąpiło obniżenie jakości. Sprawdzono opóźniony wymagany fragment, poprawną odpowiedź, następne pytanie, punktację, pauzę, wznowienie i wynik z konfiguratora oraz angielskie „Great!” slidera. Szczegóły: `atlas-v39-qa.json`.

Dodatkowy obraz z Safari w natywnym symulatorze iPhone13Pro/iOS27 potwierdza działanie strony w Safari. Nie jest to potwierdzenie na fizycznym telefonie ani pełny test zainstalowanej PWA. Obszar instalowanej PWA nadal wymaga oceny na urządzeniu użytkownika.

## Źródła i odtwarzanie

Natural Earth: public domain, https://www.naturalearthdata.com/about/terms-of-use/ . Dane krajów50m i wysp10m oraz pliki źródłowe z https://github.com/nvkelso/natural-earth-vector . Mapzen elevation tiles: https://registry.opendata.aws/terrain-tiles/ . GeoNames dla pięciu zweryfikowanych punktów stolic: https://www.geonames.org/ , CC BY4.0. Aktualna stolica Gwinei Równikowej jest uwzględniona na podstawie dekretu z2 stycznia2026 (adres w pliku źródłowym atlasu). SHA wejść i gotowej geometrii: `assets/maps/atlas-world-v39-source.json`.

`tools/prepare-scenic-world-v39.mjs` tworzy geometrię i angielskie nazwy stolic z danych wejściowych. `tools/build-scenic-world-tiles-v39.mjs` buduje fragmenty z gotowego autorskiego `master-land.png`, metadanych `hd-jobs.json` i malowanej tekstury wody; wymaga Sharp. Pełne obrazy robocze i DEM pozostają poza repozytorium aplikacji.
