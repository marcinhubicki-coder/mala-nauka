# Mała Nauka – Sound Lab v1

## Cel

Spokojna, opcjonalna oprawa audio sprzyjająca zadaniom edukacyjnym, bez ostrych alarmów i bodźców rozpraszających. Nie zakładamy, że szum lub muzyka poprawiają koncentrację każdego dziecka. Cisza jest zawsze pełnoprawnym wyborem.

## Miejsce

Design Studio → **Dźwięki i Sound Lab** w lewym menu; skrót: `/design-system/?lab=sound`.

## Biblioteka

12 krótkich efektów: `tap`, `toggle`, `correct`, `incorrect`, `hint`, `next`, `star`, `trophy`, `roundStart`, `roundEnd`, `progress`, `bubble`.

10 warstw: `rain`, `stream`, `wind`, `leaves`, `birds`, `waves`, `crickets`, `warmNoise`, `chimes`, `pad`.

7 presetów: Skupienie, Spokojny las, Deszcz za oknem, Nad morzem, Wieczorny ogród, Miękki kosmos, Cisza. Mikser reguluje 10 poziomów od 0 do 100 i pozwala słuchać na żywo. Wszystkie próbki powstają proceduralnie; nie pobieramy nagrań myNoise ani cudzych utworów. Referencja interakcyjna: https://mynoise.net/NoiseMachines/paulNagleSequenceGenerator.php.

## Obsługa i ergonomia

- Brak autoplay: `AudioContext` powstaje dopiero po dotknięciu przycisku.
- Pierwsze uruchomienie na iOS wymaga gestu użytkownika; po przejściu na inny dział tło milknie.
- Każdy kanał obsługuje skróty klawiaturowe dla natywnych suwaków i daje się regulować w czasie odsłuchu.
- Tryb spokojny jest włączony, głośności startowe ograniczone, dźwięki gry i tło domyślnie **wyłączone**.
- W szkicu Design Studio ustawienia zapisują się jako `config.sound` i przechodzą przez walidację kontraktu.
- Eksport: 12 WAV efektów + sześć 6-sekundowych podglądów ambientu w ZIP (PCM 16-bit, mono, 16 kHz). Dostępny również eksport bieżącego miksu.
- Krótkie pliki WAV nie są jeszcze automatycznie wywoływane przez przyciski we wszystkich pięciu grach. To niezależna biblioteka + edytor kontraktu; przypięcie zdarzeń wymaga osobnej integracji per tryb i walidacji UX/iOS.

## Rekomendowane przypisania w grach

`tap` → wybór kafla; `toggle` → jelly; `correct` → poprawna odpowiedź; `incorrect` → łagodne potknięcie; `hint` → podpowiedź; `next` → przesunięcie do kolejnego hasła; `progress` → postęp; `star`/`trophy` → nagroda; `roundStart`/`roundEnd` → początek/koniec rundy; `bubble` → bańka ortografii.

## Wydajność

Biblioteka używa `AudioBuffer` i `GainNode`, nie bibliotek czy dużych plików muzycznych. Żaden kanał nie gra w tle po opuszczeniu panelu. Przy integracji PWA nie generuj dźwięków w `requestAnimationFrame` ani w każdej iteracji animacji.
