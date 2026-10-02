# Flagi — oprawa przygody v1

Branch: `design/profile-and-learning-v5`. Mechanika `Session`, losowanie,
czasy, punkty, indeksy odpowiedzi i trzy warianty pytań pozostają takie same.

## Warstwa widoku

`flagi/adventure-game.mjs` dekoruje DOM wyrenderowany przez wspólną powłokę.
`data-country-id` i `data-flag-variant` na karcie stanowią kontrakt z silnikiem.
Przed odpowiedzią tryb Flagi pokazuje wyłącznie flagę; nazwa i stolica są
ujawniane po odpowiedzi. Nie dodawać nazwy kraju do opisu flagi przed odpowiedzią.

`flagi/adventure.css` utrzymuje te same siedem wierszy gry w czasie pytania,
poprawnej odpowiedzi i pomyłki. Mapa zastępuje wnętrze karty. Nigdy nie zmieniać
wysokości karty ani siatki odpowiedzi w zależności od stanu lub długości nazwy.
Po pomyłce czas nadal czeka na istniejący przycisk Dalej.

W ustawieniach pozostaje Jelly V4, trzy rodzaje rozgrywki, wybór świata lub
kontynentów i dotychczasowe czasy. PL/EN znajduje się pod przyciskiem startu,
poza ilustracją chłopca. W czasie gry okrągły przełącznik jest w środkowej kolumnie.

Jelly V4 zatwierdza dotkniętą etykietę przy `pointerup`, ponieważ przechwycenie
wskaźnika przenosi natywny `click` na bufor. Dotknięcie wybiera opcję raz,
przeciąganie zachowuje swój algorytm, a anulowanie gestu pozostawia poprzedni
wybór. Regresję obejmuje `tests/jelly-ink.test.mjs`.

## Flaga na maszcie

`flag-on-pole.mjs`: jedno wejściowe `record.flagSvg`, 16 pasów próbkujących to
samo SVG. CSS dodaje sinusoidalne przesunięcie pionowe, delikatne scaleY/rotateY
oraz wspólne światło soft-light. Parametry są wspólne dla wszystkich państw;
nie eksportować osobnego renderu rasterowego dla każdego kraju.

- Szwajcaria i Watykan: proporcje 1:1 i źródło flag-icons 1x1.
- Nepal: pojedynczy obraz z zachowaniem przezroczystości i kształtu proporców.
- Pozostałe: przypięte źródło flag-icons 4x3.
- Wyciszenie animacji: prefers-reduced-motion oraz pauza rozgrywki.
- Flaga na pytaniu wyrasta z neutralnych chmur. Nie dodawać do niej zabytków,
  zamków, architektury ani krajobrazów sugerujących konkretne państwo.

Wszystkie 195 SVG są lokalnie w `assets/flags/svg`, z licencją MIT flag-icons
v7.5.0 (commit `7aa5b2bdddd570ece62c812c0cb588ccdc099e2e`). Nie zależą od CDN.

## Mapy

Istniejący `europe-map.js` obsługuje sześć lokalnych SVG kontynentów.
`data-country` pozostaje identyfikatorem geometrii; aktualny kraj podświetla
`.is-highlighted`. Papier i ocean są dekoracją CSS, nie częścią danych geografii.
Renderer nie zmienia map źródłowych, granic ani API przyszłych interakcji.

## Nazwy i Retina

`text-fit.mjs` mierzy szerokość glifów, wybiera największy pasujący rozmiar i
najlepszy podział na maksymalnie dwa wiersze. Awaryjnie stosuje scaleX zamiast
ucinania tekstu. Wymiary kontenera pozostają stałe. Ponowne obliczenie następuje
po wczytaniu fontów, zmianie języka i zmianie wymiarów okna.

Dopasowanie uwzględnia szerokość i wysokość. Tytuł mapy ma stałe 48 px,
stolica jeden wiersz, a nazwy odpowiedzi nie mogą przekroczyć wysokości kafla.
Przełączenie PL/EN dopasowuje tekst synchronicznie przed odmalowaniem ekranu.

Docelowy viewport iPhone 13 Pro: 390 × 844 CSS px, DPR 3, czyli 1170 × 2532.
Uwzględniamy górne i dolne safe area. Flagi, mapy, chmury, papier i niebo są SVG.
Dolny krajobraz ma 1254 × 1254 px; wyświetlany przy szerokości 390 daje ponad
3 px źródłowe na CSS px. Górę pełnego ekranu wypełnia osobna scena 1254 × 1254 px i skalowalne niebo SVG,
a CSS wygasza połączenie obu warstw. Nie rozciągać małej grafiki portretowej
na cały ekran Retina. Ilustracja misji ma 2172 × 724 px.

## Assety i prompty

Wygenerowane przez wbudowany Imagegen, sprawdzone i przekonwertowane w całości
do WebP quality 94, bez ręcznego rysowania ani retuszu rasterowego.

| Asset | Prompt / kierunek | Wymiary |
|---|---|---|
| `assets/flags/adventure/mission-v1.webp` | Transparent horizontal 3D storybook hero. Smiling curly-haired boy explorer with hat and map at far right, glossy globe/stars left, empty centre for HTML. No text, PL/EN button, badge or UI. | 2172 × 724 |
| `assets/flags/adventure/sky-retina-v1.webp` | Square premium storybook mountain valley, detailed cumulus clouds, quiet turquoise sky, leaves framing top corners, small coral balloon upper right. Calm central area, no UI, country cues, buildings or text. | 1254 × 1254 |
| `assets/flags/adventure/landscape-retina-v1.webp` | Square sunny 3D storybook explorer landscape. Quiet blue sky above softly blurred mountains, forest and distant lake. Explorer table at bottom with illustrated map without text, journal left, compass right. No countries, buildings, monuments, characters or UI. | 1254 × 1254 |
| `assets/progress/rules-books-v2.webp` | Transparent glossy magenta/pink/blue stack of books, glowing golden lightbulb, stars and purple/green leaves. No labels, alphabet tiles, frame or UI. | 1254 × 1254 |

## Podgląd i weryfikacja

`adventure-preview.html` pozwala przełączać rozmiar telefonu i ekran:
ustawienia Flag, flagę na maszcie, mapę po pomyłce, długą nazwę oraz postępy.
`flagi/preview-frame.html` korzysta z prawdziwego renderera i Session;
`preview-fixture.mjs` jest ładowany tylko z tej jawnej strony podglądu.
Przykładowe postępy nigdy nie trafiają do konta dziecka.

Podczas zmiany sprawdzić: trzy warianty gry, obydwa języki, przyciski poprawny/
błędny, niezmienne prostokąty odpowiedzi, wszystkie sześć map, Nepal, kwadratowe
flagi, długie nazwy PL/EN, fonty z polskimi znakami, pauzę i komplet offline.
