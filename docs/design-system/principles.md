# Zasady i tokeny

## Wzorzec

Ortografia wyznacza skórkę jelly i układ ustawień. Angielski wyznacza subtelny cień **całego toru**, oddzielny od cienia ruchomego jelly. Te reguły są wspólne dla ortografii, angielskiego, flag i czytania. Matematyka zachowuje własny wybór działania i planszę; korzysta ze wspólnych tokenów kontrolek.

Tryb określa paletę i ilustrację. Komponent określa geometrię, typografię i stan. Rozbieżność ekranów wymaga wariantu lub jawnego wyjątku w `overrides`, zamiast kolejnego pliku `*-vNN.css`.

## Urządzenie

- Projekt bazowy: iPhone 13 Pro, pionowo, **390 × 844 pt**.
- Cel Retina: **3×, 1170 × 2532 px**. Wymiary CSS pozostają w punktach/pikselach logicznych.
- Symulowana strefa statusu: 47 pt; dolna strefa: 34 pt.
- Podgląd w panelu skaluje zewnętrzną ramkę do wysokości okna desktopu. Wewnętrzny iframe zawsze ma 390 × 844. Skala ramki nie zmienia layoutu gry.
- Panel jest symulatorem rozmiaru; nie emuluje Safari, sprzętowego DPR ani zachowania instalowanej PWA. Końcowa ocena dotyku i safe-area odbywa się na urządzeniu.

Ilustracja wymaga co najmniej trzykrotności wymiaru, w którym jest wyświetlana. Typowa scena 1024 × 1024 wystarcza dla ilustracji ~320 pt. Część istniejących teł ma niższą rozdzielczość; zachowano zatwierdzone obrazy zamiast sztucznie zmieniać ich wygląd. Fonty i grafika SVG zachowują ostrość niezależnie od skali.

## Grupy tokenów

| Grupa | Własność |
| --- | --- |
| `layout` | Płótno, safe-area, padding boków, nagłówek, misja i odstępy sekcji |
| `card` | Kafel ustawień i powierzchnie wyników: radius, padding i obrys |
| `jelly` | Wysokość toru, inset, radius, tekst, cień całego toru i czasy ruchu/koloru |
| `toggle` | Mały wybór czasu/liczby słów, języka oraz PIN-u |
| `button` | CTA: wysokość, tekst, padding, radius, obrys i podstawa |
| `answer` | Wysokość pełna i kompaktowa, gap, szerokość grupy, tekst, padding |
| `flashcard` | Radius, padding i odstęp fiszki |
| `slider` | Wysokość toru, promień, uchwyt i próg zakończenia |
| `popup` | Radius, padding i limit wysokości dialogu |
| `progress` | Wysokość, radius, czas animacji wyników |
| `profile` | Karta gracza, odstępy, padding, avatar |
| `trophy` | Wymiar pucharu i odstępy kolekcji |
| `space` | Skala 4/8/12/16/24/32; punkty odniesienia oraz wspólne drobne odstępy |
| `color` | Tusz, opisy, powierzchnia, poprawna i błędna odpowiedź |

Skala `space` nie zastępuje wszystkich istniejących odstępów. Konkretny odstęp komponentu edytuje jego token; dzięki temu zmiana ogólnego rytmu nie przesuwa przypadkowo rozbudowanej sceny gry.

Odpowiedzi mają dwa jawne rozmiary: pełny w ortografii, kompaktowy w pozostałych planszach. Ortografia korzysta z większych, krótkich liter; angielski/czytanie/flagi potrzebują miejsca na dłuższe etykiety. Wysokość oraz font obu wariantów są edytowalne w jednym komponencie.

## Kolory i fonty

Każdy tryb ma `accent`, `light`, `middle`, `bottom`, `border`, `lip`, `shine`, `depth`, `activeInk`, `idleInk`. Panel edytuje paletę jelly i CTA. Istniejące wielokolorowe ilustracje oraz specjalne efekty scen nie są jednobarwną skórką i nie podlegają automatycznemu przemalowaniu.

| Rola | Domyślny font | Zastosowanie |
| --- | --- | --- |
| `body` | Nunito / MN Body | Opisy, tekst zasad, pomoc, liczby i profile |
| `ui` | Dosis / MN UI | Jelly, wspólne ustawienia, CTA |
| `display` | DynaPuff / MN Display | Nagłówki i litery ortografii |
| `flag` | Fredoka / MN Flag | Nazwy krajów i typografia przygody flag |

Stare nazwy `ResultBody`, `MN Soft`, `Flag Body`, `ResultDisplay`, `Spelling`, `Home Rounded`, `Flag Display` zastąpiono rolami. Scalenie nie usuwa fontu z historii ani z katalogu: przenosi wszystkie jego aktualne role. Fonty nieużywane przez renderer nie są pobierane tylko dlatego, że mają deklarację `@font-face`.

## Wyjątki

Przykład: `overrides.english-settings.jelly.height = 62`. Ten wyjątek działa wyłącznie przy `data-ds-view="english-settings"`. Klasyfikacja widoku jest współdzielona przez studio i zwykły router. Reguła nie przecieka do innych ekranów.

Nie dodawaj nowego lokalnego wymiaru bez określenia komponentu, wariantu lub identyfikatora wyjątku. Wymiar 390 pt pozostaje punktem odniesienia dla przyszłych breakpointów.
