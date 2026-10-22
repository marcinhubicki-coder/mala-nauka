# v60 — kampania na ekranie głównym

22.10.2026 · lokalnie · `work/story-home-v60`.

## Gotowa próbka pierwszego świata

- Nowy ekran fabularny: powitanie, pejzaż portu i ostatnio odkryty NPC. Próbka po kroku 7 pokazuje kapitana Bora; wcześniej pojawia się Mira, a przed odkryciem NPC — przewodnik.
- Postać wystaje ponad górną krawędź ilustracji i kończy się przy panelu, w okolicy pasa. Pejzaż biegnie dalej pod panelem i do dolnej krawędzi karty.
- Małe logo i ustawienia zachowują wspólną geometrię z poprzedniego homescreenu.
- Dolny Jelly „Fabularny / Swobodny” z przejściem przez blur. Logo, ustawienia i przełącznik pozostają na miejscu; podmieniana jest tylko treść. Działa kliknięcie, klawiatura i przeciąganie, a zmiana szerokości aktualizuje położenie zaznaczenia.
- W swobodnej grze pozostają pięć trybów, wyniki i dotychczasowy guzik kampanii. Ilustracje zachowują proporcje; treść ma miejsce na dolny przełącznik.
- Matowy panel ze stanem całych iskier i graficznymi skrótami: kuźnia, nagrody, księga, przedmiot. Efekt szkła jest wspólny dla Chromium i WebKit, oparty na dopasowanej, rozmytej kopii raz dekodowanego pejzażu.
- Wewnętrzny kafel z kolejnym krokiem i przyciskiem „Kontynuuj kampanię”, prowadzącym na mapę aktualnego świata.
- Księga otwiera najnowszy wpis; przedmiot otwiera od razu jego stronę w księdze. Skróty wracają do ekranu fabularnego.
- Nowy widok w Studio: **Edytuj ekran → Strona startowa → Start · kampania**. Grupy i atomy są w tym samym kontrakcie co PWA.

## Poprawki wykryte przy składaniu próbki

- Usunięte podwójne wspólne tło podczas przełączania wariantów oraz dodatkowa animacja całego ekranu nakładająca się na lokalny blur.
- Poprawione zwykłe kliknięcie Jelly: przechwycenie wskaźnika zaczyna się dopiero po rozpoznaniu przeciągania.
- Kuźnia i nagrody otwarte z nowego ekranu wracają bezpośrednio do niego; standardowe wejścia zachowują wcześniejszą nawigację.
- Zawężone etykiety w kontrakcie księgi: nagłówek wpisu nie koliduje z podpisami trzech części przedmiotu.
- Grafiki, także warstwy ikony nagród, są dekodowane przed wyłonieniem treści.

## Sprawdzone

- Chromium i WebKit, 390 × 844: brak przepełnienia, równe podpisy ikon, obrazy załadowane; przejście w obie strony, stabilne węzły i pozycje nawigacji, cztery skróty z powrotami, strona przedmiotu oraz wejście na mapę. Zapis: `outputs/v60/smoke.json`.
- Kontrakty `home` i `home-story`, 390 × 844 oraz 1440 × 900: cztery kontrole bez błędów. Pozostałe 52 wpisy cache pochodzą z poprzedniej zweryfikowanej wersji; pełna macierz nie była powtarzana.
- Build lokalnego PWA i Studio. Wizualny podgląd w przeglądarce oraz w Studio.
- Pejzaż w lokalnej bibliotece i indeksie, faktyczny HTTP 200 + `image/webp`, zgodny rozmiar i SHA-256 w źródłach i buildzie. 1024 × 1536, 414 606 B. Prompt: `outputs/v60/generation.json`; metadane: `shared/story-home-assets.mjs` i `design-system/assets.json`.

## Następne etapy

Osobny ekran pierwszego uruchomienia; nowe pejzaże pozostałych światów; układanka przedmiotu 15 + 5 elementów i wynikająca z niej blokada portalu. Obecna mechanika trzech części pozostaje bez zmian. Nie sprawdzono fizycznego iPhone’a. Nic nie zostało wysłane ani wdrożone na Vercel; bajty ilustracji i zrzuty pozostają lokalnie poza commitem aplikacji.

## Podglądy lokalne

- Próbka: http://127.0.0.1:8874/?studio=1&screen=home&state=story&viewId=home-story
- Studio: http://127.0.0.1:8874/design-system/#components
- PWA z rzeczywistym profilem: http://127.0.0.1:8874/
