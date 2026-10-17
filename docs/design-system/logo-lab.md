# Lab logo i przejście do prawdziwego ekranu

Animacje → Animowane elementy otwiera Lab logo. Bezpośredni link: `/design-system/?lab=logo`.

Pięć płaskich kształtów używa kolorów pobranych z `assets/brand/player-logo-3d.webp`. Dwa obroty po 2000 ms zmieniają koła w miękkie kwadraty i romby. Potem pięć organicznych sektorów po 72° rozrasta się poza krawędzie ekranu. Nachodzenie domyślnie wynosi 10%; ziarno zapewnia powtarzalny układ, a nieregularność zmienia boczne fale. Wypełnienie kończy się bez białych prześwitów. Biały blob rośnie od środka, faluje i po pokryciu 52% powierzchni ekranu uruchamia radialne odsłanianie prawdziwego widoku. Próg powierzchni uwzględnia proporcje ekranu.

Lab ma odtwarzanie, pauzę, pętlę, suwak klatki, skróty do faz i wybór rzeczywistego ekranu. Każdy parametr oraz pięć kolorów zapisują się w `config.logoTransition`, przez standardowy zapis szkicu na GitHub. Ten sam `shared/logo-transition.mjs` wykonuje animację w PWA i w Labie. Ruch używa sześciu ścieżek SVG w granicach viewportu, maksymalnie 30 aktualizacji na sekundę, bez filtrów SVG i dodatkowej biblioteki. Zatrzymuje się w tle i usuwa nakładkę po zakończeniu; reduced motion pomija animację.

Inspiracje wizualne (autorska implementacja geometrii, bez kopiowania animacji):
- https://codepen.io/sandstedt/pen/vKWzWE — Splish-Splash / organiczne wypełnienie.
- Referencje użytkownika: koła → miękkie kwadraty → romby.

Weryfikacja: dwa przebiegi w Chromium/WebKit, zatrzymanie wszystkich faz, rzeczywisty ekran pod nakładką, 159 testów kontraktu i regresji. Test fizycznego iPhone pozostaje osobnym krokiem przed produkcją.
