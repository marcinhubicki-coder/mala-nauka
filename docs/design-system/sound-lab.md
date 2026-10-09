# Dźwięki i Sound Lab v2

## Wspólne źródło

Sound Lab, Komponenty i PWA używają tego samego silnika (`shared/sound-library.mjs`, `shared/sound-runtime.mjs`) i `config.sound`. Suwaki zapisują szkic po puszczeniu. **Zapisz miks do gry** przekazuje pełny kontrakt podglądowi, **Zapisz i testuj w grze** otwiera prawdziwy ekran jednego z pięciu trybów. **Zapisz na GitHub** zachowuje miks dla kolejnego wydania. Lokalne wyciszenie gracza ma pierwszeństwo.

## Brzmienie i pętle

12 krótkich reakcji: tap, jelly, odpowiedź, potknięcie, podpowiedź, dalej, combo/gwiazdka, trofeum, start, koniec, postęp, bańka. Pogodne drewniane tony, neutralne potknięcie, krótka zachęta.

10 kanałów: deszcz, strumień, wiatr, liście, ptaki, fale, świerszcze, ciepła otulina, melodia zabawy, ciepłe akordy. Wesoła nauka, Skupienie, Leśna przygoda, Deszcz, Morze, Ogród, Kosmos i Cisza. Natura ma różne okresy 13–37 s i nierówne zdarzenia. Sygnały szumowe łączymy przez overlap-add bez wygaszania całego podkładu do ciszy. Muzyka ma wspólne tempo i pentatoniczne frazy. Efekty i melodia nie mają ostrych transjentów. To synteza, nie nagrania przyrodnicze.

Ustawienia: energia, tempo 60–120 BPM, zmienność natury, ciepło filtra, głośność całości/efektów/tła/logo, wyciszenie tła pod odpowiedzią, tryb spokojny. Zera wyłączają kanały. Eksport WAV zawiera pełną pętlę, ZIP także zapis ustawień.

## Gra i animacje

Kliknięcia/jelly, odpowiedzi, podpowiedzi, kolejne zadanie, start i koniec rundy są podłączone do wspólnego runtime. Ortografia/angielski/czytanie/flagi używają głównego runtime; osobna Matematyka tego samego silnika. Co trzecie combo wywołuje małą gwiazdkę. Tło gra w rozgrywce, zatrzymuje się przy pauzie lub dialogu i po wyjściu. Krótki sygnał odpowiedzi nie jest obcinany przy zmianie widoku.

Logo: pięć nut na obrót, rozlanie kolorów, narastający biały blob i wesołe odsłonięcie. Czas audio jest obliczany z rzeczywistych ustawień animacji, również przy pauzie, wznowieniu i zmianie długości. Lab logo i Sound Lab mają ręczny odsłuch. Pierwszy start PWA może wymagać dotknięcia **Włącz dźwięk** — przeglądarka blokuje audio bez gestu. Przesuwanie osi czasu nie gra dźwięku.

## Wydajność i sprawdzenie

Dłuższe podkłady generuje Worker, poza wątkiem interfejsu. Próbki są buforowane, głośności wygładzane, tylko aktywne kanały mają źródła. Brak audio w każdej klatce animacji. Maksymalnie osiem krótkich głosów naraz. Tło i źródła zatrzymywane przy ukryciu/zamknięciu strony, filtr i kompresor łagodzą sumę kanałów. Poziom urządzenia nadal zależy od jego ustawień.

Testy: ciągłość i energia łączenia pętli, finitość sygnałów, zgodność WAV/ZIP, zapis całego miksu, stare szkice, pauza/wyciszenie, ponowne użycie buforów, limit głosów, anulowanie startu, timingi logo, zmienność natury i energii. Budowanie całej aplikacji. Bez odsłuchu w przeglądarce i na fizycznym iPhonie — zgodnie z obecnym zakresem weryfikacji.
