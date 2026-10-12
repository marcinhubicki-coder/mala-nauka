# Rewizja 30 — wspólne klocki i działająca PWA

Przed publikacją wykonano trzy kontrole po kolejnych poprawkach: reguł i zależności w kodzie, rzeczywistej edycji w WebKit oraz pełnych przepływów pięciu trybów.

## Skład i edycja

- Home ma sześć slotów. Rodzina powitania obejmuje ilustrację, teksty i nakładające się postępy. Rodzina pięciu przygód ma granice dokładnie pięciu kafli.
- Matematyka ma wspólny nagłówek z powrotem; usunięto drugi, nieczytelny tytuł i nadmiar przestrzeni nad polami.
- Biblioteka używa tych samych rendererów powitania, obu statystyk i kafli co gra. „Dziś rozwiązane” pokazuje liczbę rozwiązanych zadań, a ostatni wynik — punkty i opis ostatniej rundy.
- Logo jest przezroczystym PNG. Usunięto jego wycinek z plakatu i nieużywany zestaw stylów Home v2, który nadpisywał nagłówek oraz zmniejszał podkład wyników do połowy szerokości.
- Treść pytania ortografii jest jednym tekstowym atomem słowa z luką. Usunięto dwa zbędne kontenery tego samego tekstu. Ilustracja w bańce jest osobną częścią. Wnętrze słowa nie tworzy przypadkowych grup w inspektorze.
- Wariant i stan są wybierane tylko przy co najmniej dwóch możliwościach. Przycisk ustawień ma domyślny stan i wektorową ikonę. Sam rodzaj „button” nie generuje już niezaimplementowanych stanów.
- Zaznaczanie dekoracji uwzględnia widoczność CSS; `aria-hidden` i `inert` nie oznaczają niewidocznego obiektu.
- Kontrolki rozmiaru i animacji mieszczą się w inspektorze przy szerokości okna 1440 i 1024 px. Zmiana wspólnej skali rodziny aktualizuje ekran oraz bibliotekę.

## Dźwięk i runda

Jeden kontekst audio pozostaje w dokumencie PWA podczas zmiany przygody. Dokumenty pięciu trybów korzystają z niego, a muzyka pozostaje aktywna w ustawieniach, ładowaniu, grze i pauzie. Siedem stref ma osobne melodie i miksy, z płynnym przenikaniem. Wyniki i kolekcja używają wspólnego, osobnego motywu. Dźwięk uruchamia pierwsza rzeczywista interakcja; jego wyłączenie pozostaje w ustawieniach.

Sound Lab zawiera siedem stref i trzy autorskie zestawy: Mała Nauka, Japoński ogród i Pradawny las. Warstwy natury mają różne sygnały, a krótkie dźwięki łagodniejszy atak i drewniane, sprężyste motywy. Ustawienia stref są niezależne. Opis testu przeglądarki rozwija się w prawo i ma wysokość przycisku.

Matematyka ponownie uruchamia rundę po ustawieniach. Blur pozostaje przy wejściu do gry i podsumowaniu. Ręczne zakończenie udostępnia „Zakończ i zobacz podsumowanie”. Powroty do Home korzystają z przejścia Kolory → Biały blob → Wejście; dźwięk animacji jest odtwarzany.

## Dowody

- Audyt, build i 262/262 testów Node.
- `tools/verify-atomic-editor.mjs`: granice kafli, pełny podkład wyników, brak kolizji nagłówka, przezroczystość PNG, wybieranie ustawień, kontrolki w panelu, propagacja wspólnej skali i tekstowe pytanie w rzeczywistym ekranie oraz bibliotece.
- `tools/verify-screen-readiness.mjs`: ustawienia wszystkich pięciu trybów; start, odpowiedź, zakończenie, podsumowanie, kolekcja i powrót do Home w każdym trybie. Jeden właściciel audio, brak dodatkowych kontekstów w dokumentach gier, niezerowe bufory muzyki i blobów. Brak błędów JavaScript oraz brakujących żądań zasobów.
- Sound Lab w WebKit: niezależne zapisy i reset stref, trzy zestawy Jelly, prawidłowe wymiary testu przeglądarki, zakończony ton testowy.

Testy WebKit obejmowały mobilny viewport i gesty dotykowe. Nie zastępują odsłuchu na fizycznym iPhonie ani testu aktualizacji wcześniej zainstalowanej PWA z jej starym cache. Nie deklarujemy zgodności wszystkich ekranów 1:1 z mockupem na podstawie samych testów kontraktów.

## Przegląd ekran po ekranie

Układ dokumentu i przewijanie nie tworzą klocków w bibliotece. Powrót jest jednym atomem: koło i wspólna strzałka. Dwie dolne akcje wyniku są niezależne. Pola ustawień i opcje Jelly mają wspólne przepisy. Biblioteka ukrywa nieużywane przepisy; tokeny zgodności dawnych konfiguracji mogą pozostać w kontrakcie. Długie listy kolekcji mają granice wynikające z rzeczywistej liczby słów.

| Widok | Kontrola struktury i powrotów |
|---|---|
| Wybór gracza | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów |
| Pierwszy gracz | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów |
| Nowy gracz | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów; wspólny powrót |
| PIN gracza | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów; wspólny powrót |
| Odblokowanie gracza · PIN | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów; wspólny powrót |
| Ekran startowy | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów |
| Ustawienia aplikacji | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów; wspólny powrót |
| Ortografia · ustawienia | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów; wspólny powrót |
| Ortografia · gra | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów |
| Ortografia · poprawna odpowiedź | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów |
| Ortografia · błędna odpowiedź | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów |
| Ortografia · koniec rundy | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów; wspólny powrót |
| Angielski · ustawienia | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów; wspólny powrót |
| Angielski · gra | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów |
| Angielski · poprawna odpowiedź | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów |
| Angielski · błędna odpowiedź | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów |
| Angielski · koniec rundy | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów; wspólny powrót |
| Flagi · ustawienia | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów; wspólny powrót |
| Flagi · gra | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów |
| Flagi · poprawna odpowiedź | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów |
| Flagi · błędna odpowiedź | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów |
| Flagi · koniec rundy | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów; wspólny powrót |
| Czytanie · ustawienia | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów; wspólny powrót |
| Czytanie · gra | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów |
| Czytanie · poprawna odpowiedź | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów |
| Czytanie · błędna odpowiedź | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów |
| Czytanie · koniec rundy | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów; wspólny powrót |
| Matematyka · ustawienia | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów; wspólny powrót |
| Matematyka · gra | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów |
| Matematyka · poprawna odpowiedź | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów |
| Matematyka · błędna odpowiedź | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów |
| Matematyka · koniec rundy | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów; wspólny powrót |
| Ortografia · zasada | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów; wspólny powrót |
| Ortografia · podpowiedź | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów |
| Ortografia · pauza | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów |
| Moje wyniki | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów; wspólny powrót |
| Moja kolekcja słów | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów; wspólny powrót |
| Moje puchary | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów; wspólny powrót |
| Kategorie do poćwiczenia | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów; wspólny powrót |
| Wyjaśnienia i zasady | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów; wspólny powrót |
| Historia rund | Poprawna hierarchia; brak osieroconych/wycofanych kontenerów; wspólny powrót |

Szczegóły sprawdza `tools/verify-view-structure.mjs`: 41 rzeczywiście wyrenderowanych widoków, ich rodzice, samodzielne akcje podsumowania oraz wymiary i ścieżka SVG powrotu. `tools/verify-atomic-editor.mjs` sprawdza też tożsamość tekstowego przepisu pytania, jego dostępność dla inspektora i współdziałanie wspólnej skali z biblioteką.
