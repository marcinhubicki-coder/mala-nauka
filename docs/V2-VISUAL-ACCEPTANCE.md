# Wzorce produkcyjne Ortografii i Home — 13 października 2026

Użytkownik udostępnił pięć pełnoekranowych zrzutów **946 × 2048 px** (iPhone 13 Pro, zgodne proporcje z 390 × 844 CSS px) oraz jeden wykadrowany screenshot Studio V1 **1008 × 958 px**.

| Zrzut przesłany w rozmowie | Widok | Charakterystyczne elementy |
| --- | --- | --- |
| `IMG_2946.png` | Home | Scena chłopca odkrywcy, karta statystyk, kafle 3+2, właściwe odstępy |
| `IMG_2947.png` | Ortografia — ustawienia | Niebo, chłopiec/abc w misji, trzy sekcje Jelly, zwierzęta i pink CTA |
| `IMG_2949.png` | Ortografia — gra | Strach na wróble w tęczowej ramce, timer, odpowiedzi, dolny slider |
| `IMG_2948.png` | Ortografia — gest | Slider w ruchu; geometria widoku identyczna jak na poprzednim zrzucie |
| `IMG_2950.png` | Ortografia — wynik | Królik, chmurki, nagłówek, 5/9 i 56%, karty, trzy błędy, przyciski |
| `image(20261013-071221).png` | Wynik ze Studio V1 (kadr) | **Perłowa, okrągła bańka punktów** w prawej górnej części tła; liczba i napis PKT |

Pliki graficzne są źródłowymi załącznikami rozmowy, nie zostały wrzucone jako binary do repo. Nie należy próbować wyrównać kadru Studio V1 przez rozciąganie go do pełnego ekranu.

## Pierwsza poprawka

W V2 klasy `result-scenery`, `result-hero`, `result-meadow` były obecne w CSS, ale **nie były renderowane w wyniku**. Wprowadzone DOM `result-scenery` odwołuje się do oryginalnych assetów `result-hero-retina-v5.webp` i `result-meadow-retina-v4.webp`. Bańka punktów ma ponownie proporcje koła. Liczba punktów pozostaje wynikiem `scoreResult(result)` i zachowuje istniejący reel.

## Kryteria ukończenia

1. Wierna geometria i wygląd wobec screenshotów, w tym safe areas telefonu i fonty.
2. Poprawne stany gry i wyników, z punktami w widocznej bańce, bez utraty animacji.
3. Edycja w Design Studio oraz rezultat w PWA muszą pochodzić z tego samego modelu.
4. Przywrócone ilustracje nie mogą zwiększać kosztu archiwum scen — są częścią małego zestawu UI.
5. Test E2E i fizyczny iPhone/Safari przed promocją na `main`.
