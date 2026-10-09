# Bańka, litery i bokeh

W Studio: **Efekty i bańka** lub `/design-system/?lab=effects`.

Ten ekran, Komponenty i PWA używają jednej implementacji i tego samego kontraktu konfiguracji. Przy porównaniu wybierz ten sam stan gry i ten sam szkic. Efekt bokeh ustawiony dla „Przed odpowiedzią” nie staje się automatycznie efektem „Poprawnej odpowiedzi”; każdy widok ma swój zapis w `screenEffects`.

## Bańka i zdjęcie

Domyślnie perłowa, klasyczna oprawa. Deformacja jest opcjonalna: **Deformuj zdjęcie razem z bańką**, potem Siła transformacji. To wspólne rozciąganie/skos zdjęcia, ramki i świateł. Tempo, falowanie i ruch wokół środka działają niezależnie. Nie włączamy cyklu wielokątów.

## Cząsteczki słowa

- Kwadraciki / kuleczki: geometria każdej drobinki.
- Części na literę: gęstość, z limitem 1200 dla całego słowa. Dłuższe słowa mają mniejszą efektywną gęstość na literę.
- Dryf, zasięg i losowość: niezależny ruch obu stron, ograniczony do sąsiedztwa słowa.
- Przyciąganie bańki: lokalny wir pod zdjęciem, aktywny podczas swobodnego dryfu.
- Drżenie: drobny ruch czytelnego, już ułożonego tekstu.
- Gradacja koloru i aberracja: zróżnicowanie ciemnego tekstu, bez zmiany go w biały napis.
- Oddech od bańki: odstęp w px.
- Czas układania i pauza po odkryciu: czas złożenia odpowiedzi oraz dodatkowy czas na odczytanie.

Po odpowiedzi tylko luka pęka i składa się w poprawny fragment. Pozostałe litery nie zaczynają od nowa. Następne pytanie ma osobny etap rozproszenia i ułożenia całego nowego słowa. Zmiana ustawień podczas podglądu może przebudować cząsteczki, żeby natychmiast pokazać nowe parametry.

## Bokeh ekranu

Wybierz **Tło · pod treścią** albo **Nad wszystkim**. Warstwa nie przechwytuje kliknięć. Dostępne są dwa kolory, gradient lub płynna zmiana kolorów, wielkość, miękkość, zasięg pływania, różne rozmiary i tempo. Maksymalnie 6 ruchomych obiektów na efekt. W Komponentach można utrzymywać kilka efektów w stosie; im więcej, tym większy koszt.

Grupy pozostają otwarte podczas edycji. Ukryte dodatkowe efekty nie zostały usunięte z formatu danych. Domyślnie wyłączony jest stary ambient i globalne combo; konfetti jest produkcyjnym efektem poprawnej odpowiedzi.

## Powtarzalny test

Uruchom build, źródła na porcie 4181 oraz `dist` jako root na porcie 4182. W środowisku z Playwright:

```sh
node tools/verify-spelling-effects.mjs webkit
node tools/verify-spelling-effects.mjs chromium
```

Opcjonalnie `PLAYWRIGHT_MODULE`, `CHROME_PATH`, `STUDIO_URL`, `PWA_URL` i `QA_OUTPUT_DIR` wskazują lokalne zależności, adresy i miejsce wyników. Wyniki zawierają liczniki i błędy przeglądarki, nie prywatne profile ani tokeny. Zawsze testuj również prawdziwy telefon przed produkcją; test automatyczny nie mierzy nagrzewania.

## Przywrócona oprawa i czytelność liter (2026-10-07)

**Wersja bańki → Produkcyjna** wybiera oryginalny SVG: wielowarstwowe perłowe obrzeże, połysk zdjęcia i małe bańki. **Lekka** jest oddzielnym wariantem HTML. Wybór jest zapisany w `effects.bubble.renderer`; gra, podpowiedzi, baza słów i oba podglądy respektują go. „Przywróć bańkę produkcyjną” przywraca również parametry jej oprawy, bez resetowania ustawień liter, bokeh czy animacji logo.

W **Perłowej oprawie produkcyjnej** są suwaki cienia, głębi, poświaty, połysku, kolorów i wyrazistości obrzeża oraz małych baniek. Oryginalny kontur jest liczony przy zmianie ustawień. Ruch i opcjonalna wspólna deformacja zdjęcia/ramki są wykonywane przez rodzica na kompozytorze, bez ciągłego przepisywania dużej maski SVG. Nie przywracamy dawnego zapętlonego przeliczania konturu ani animowanych filtrów zdjęcia.

Ustawienia czytelności:

- **Odstęp liter** (`letterSpacing`, −2–12 px) zmienia rzeczywisty układ tekstu i mapę cząstek.
- **Min. odległość cząstek** (`particleSpacing`, 0–6 px) rozsuwa środki docelowych cząstek. Zero pozwala na nakładanie. Większa odległość ogranicza efektywną liczbę części na literę; suwak liczby części jest maksimum.
- **Magnes do środka kreski** (`strokeMagnet`, 0–1) przyciąga do lokalnej osi kreski fontu, zachowując otwory w literach. Nie ściąga całej litery do jednego punktu.
- **Pełny font po złożeniu** (`settleFill`, 0–1) wypełnia dokładną maskę oryginalnego fontu. 1 daje pełne litery nawet przy cząstkach 1 px; 0 pozostawia samą kompozycję cząstek. Domyślnie 0,85. Wypełnienie narasta oddzielnie dla lewej strony, odpowiedzi i prawej strony. Odkrycie odpowiedzi nie resetuje boków.

Ułożone cząstki są przycinane do natywnej maski liter: nie pogrubiają konturu i nie zalewają otworów. Aberracja i nieprzycięty swobodny ruch pozostają w fazie dryfu. Mapa punktów fontu jest stabilna między podglądami; impulsy, dryf i prędkości cząstek pozostają losowe.

Kolory: **Gradacja ciemnego koloru** różnicuje odcienie, **Rozproszenie kolorów** rozdziela fazy kolorystyczne cząstek, **Odejście od koloru fontu** steruje domieszką kolorów, a **Tempo zmiany kolorów** steruje ich płynną zmianą. Odejście 0 zachowuje źródłową barwę z wybraną gradacją; tempo 0 zatrzymuje zmianę w czasie. Pełne wypełnienie pozostaje źródłowym, ciemnym fontem — obniż wypełnienie, aby mocniej pokazać kolory cząstek. Konfetti i bokeh mają własne, niezależne ustawienia.

Kontrola suwaków: `node tools/verify-particle-tuning.mjs webkit` lub `chromium` (te same zmienne środowiska). Sprawdza odstępy liter i cząstek, pełny font przy cząstkach 1 px, zmiany kolorów, oba warianty bańki, oprawę i zachowanie boków przy odkryciu odpowiedzi.
