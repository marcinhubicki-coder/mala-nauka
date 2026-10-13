# Wzorce produkcyjne Ortografii i Home — 13 października 2026

Użytkownik udostępnił pięć pełnoekranowych zrzutów **946 × 2048 px** (iPhone 13 Pro, zgodne proporcje z 390 × 844 CSS px) oraz jeden wykadrowany screenshot Studio V1 **1008 × 958 px**.

| Zrzut przesłany w rozmowie | Widok | Charakterystyczne elementy |
| --- | --- | --- |
| `IMG_2946.png` | Home | Scena chłopca odkrywcy, karta statystyk, kafle 3+2, właściwe odstępy |
| `IMG_2947.png` | Ortografia — ustawienia | Niebo, chłopiec/abc w misji, trzy sekcje Jelly, zwierzęta i pink CTA |
| `IMG_2949.png` | Ortografia — gest przy końcu | Strach na wróble, slider przesunięty prawie do prawej krawędzi (ten sam stan po błędzie) |
| `IMG_2948.png` | Ortografia — gest w połowie | Slider mniej więcej pośrodku, brak przeskoków sceny podczas gestu |
| `IMG_2950.png` | Ortografia — wynik | Królik, chmurki, nagłówek, 5/9 i 56%, karty, trzy błędy, przyciski |
| `image(20261013-071221).png` | Wynik ze Studio V1 (kadr) | **Perłowa, okrągła bańka punktów** w prawej górnej części tła; liczba i napis PKT |

Pliki graficzne są źródłowymi załącznikami rozmowy, nie zostały wrzucone jako binary do repo. Nie należy próbować wyrównać kadru Studio V1 przez rozciąganie go do pełnego ekranu.

## Pierwsza poprawka

**Korekta po uruchomieniu testu Chromium:** produkcyjny ekran wyników celowo używa scalonej grafiki `result-background-v6.webp` z `pwa-viewport.css`. Dawne klasy `result-scenery`, `result-hero` i `result-meadow` były ukryte; pierwsza próba dodania ich do DOM stworzyła zbędną drugą scenografię. Duplikat został usunięty, a właściwe tło pozostawione jako jedno źródło prawdy. Test sprawdza teraz plik renderowany jako tło oraz jego osiągalność. Bańka punktów zachowuje kształt perłowego koła i rzeczywistą wartość `scoreResult(result)`.

## Kryteria ukończenia

1. Wierna geometria i wygląd wobec screenshotów, w tym safe areas telefonu i fonty.
2. Poprawne stany gry i wyników, z punktami w widocznej bańce, bez utraty animacji.
3. Edycja w Design Studio oraz rezultat w PWA muszą pochodzić z tego samego modelu.
4. Przywrócone ilustracje nie mogą zwiększać kosztu archiwum scen — są częścią małego zestawu UI.
5. Test E2E i fizyczny iPhone/Safari przed promocją na `main`.

## Pomiary układu Home ze screenshotu IMG_2946.png
Pełny screenshot ma 946 × 2048 px. Kolorowe wnętrza kafli zaczynają się w przybliżeniu:
- górny rząd: różowy (37,1389), niebieski (334,1386), żółty (628,1386);
- dolny rząd: zielony (37,1671), fioletowy (482,1671).

Aktualny model `HOME_TILES`, przeliczony na canvas 390 × 844, przewiduje początek górnego rzędu y≈1377 px i dolnego y≈1664 px. Różnice w obrębie 7–12 px mogą pochodzić z paddingu podkładów SVG i zaokrągleń. **Nie przestawiać całych rzędów na podstawie niezweryfikowanego podglądu**: najpierw overlay i stan faktyczny CSS.

## Weryfikacja przycisku i zbiorczy import wzorców
Na zatwierdzonym ekranie wyników akcja jest nazwana „Moja kolekcja”, a nie „Moje wyniki”. W V2 otwiera teraz bezpośrednio kolekcję słów poprzez istniejący ekran postępów, bez tworzenia nowego widoku; powrót do wyniku jest zachowany.
W Design Studio można wczytać jednocześnie pięć pełnych PNG `IMG_2946–2950`. IMG_2948 i IMG_2949 są dwoma wzorcami **tego samego** stanu `spelling-wrong`, w różnych fazach gestu; wybiera się je selektorem „Stan slidera”. Nie są wzorcami `spelling-initial`. Szósty, wykadrowany obraz z V1 jest referencją detalu bańki punktów i nie może być nakładany na cały ekran.

## Precyzyjne rozróżnienie dwóch zrzutów gry (13.10.2026)
Oba screenshoty `IMG_2948.png` i `IMG_2949.png` pokazują już **błędną odpowiedź „strach”**, z wyświetloną poprawną formą oraz sliderem podczas gestu. Pierwszy jest mniej więcej w połowie, drugi prawie na końcu. Nie ma wśród pięciu zrzutów produkcyjnych wzorca *przed udzieleniem odpowiedzi*. UI podpowiedzi widoczne przed odpowiedzią pozostaje niezmienione; nie wolno przerabiać go na slider na podstawie tych dwóch przykładów.

Testy generują zrzuty `spelling-initial` i `spelling-wrong`, ale nie raportują bezpośredniej „zgodności pikselowej” bez porównania identycznego słowa, tego samego stanu i pozycji uchwytu. Overlay dostępny pod `spelling-wrong` może przełączać oba momenty gestu.

## Odtwarzanie rzeczywistej pozycji suwaka w Studio
Po wybraniu widoku błędnej odpowiedzi Studio ma dwa warianty: `IMG_2948` (uchwyt 50%) i `IMG_2949` (uchwyt 90%). Zmiana wariantu powoduje ponowne wczytanie wyłącznie tego iframe z parametrem testowym `sliderProgress`. Przeglądarka **nie symuluje pozycji przez zmiany CSS**: scenariusz testowy wywołuje `continueDrag.setProgress` z produkcyjnego kontrolera gestów. Parametr jest ignorowany w zwykłym PWA bez `studio=1`. Nie przyspiesza rundy i nie omija walidacji rzeczywistego gestu użytkownika.

## Utrwalony gradient slidera
Gest wykonywany klawiaturą i odtwarzany w Studio dotąd nie odsłaniał wypełnienia, bo CSS uzależniał jego widoczność od `.is-dragging` pochodzącego z dotyku/myszy. Wypełnienie jest teraz widoczne również przy `aria-valuenow` większym od zera; blisko końca znika tekst instrukcji, żeby nie nachodził na uchwyt. Studio odtwarza 50% i 99% bez zakończenia rundy.
