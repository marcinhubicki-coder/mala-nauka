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
