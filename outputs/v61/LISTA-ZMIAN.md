# v61 — homescreen, podsumowania i księga

## Wdrożone

- [x] Wspólna geometria obu homescreenów: niezmienione logo i ustawienia, zgodne dolne krawędzie i symetryczny odstęp głównego kafla do ustawień oraz Jelly. Miękki cień krajobrazu.
- [x] Mniejszy kapitan, włosy na wysokości środka ustawień; napis wyżej na niebie. Warstwa postaci pozwala wystawać skrzydłom, czułkom i ubraniu poza kartę.
- [x] Oddzielny rząd: pastylka „Twoje iskry” z graficzną gwiazdką, fireflies i animowanym całkowitym licznikiem oraz „Zdobądź moc” z pierścieniem rzeczywistej gotowości kuźni.
- [x] Nagrody, księga i zagadka portalu mają oddzielne okrągłe podkłady. Puchar korzysta z biblioteki nagród.
- [x] Nazwa krainy na wewnętrznym kaflu kontynuacji; bez numeru kroku.
- [x] Swobodny: większe odstępy między trybami, niższy panel statystyk, niższy hero bez kolizji napisów, usunięty dodatkowy przycisk kampanii.
- [x] Wspólne podsumowanie pięciu trybów: w kampanii jedna akcja powrotu na mapę; w swobodnym kolejna runda. Usunięte podwójne przyciski i powtórzone informacje o iskrach, a w kampanii także sekcja nowych kart.
- [x] Księga: animacja oryginalnych zakresów tekstu zamiast masek liter. Ogonki i kaligraficzne zakończenia nie są przycinane przez animację. ToC bez filtrów blur.
- [x] ToC: tylko odkryte wpisy, subtelne wielokropki dalszej opowieści. Ornamentowy przycisk „Zaginiony [przedmiot]”, osobna nazwa krainy pod numerem rozdziału między zdobieniami.
- [x] Księga i mapa gracza pokazują odkryte światy + jeden kolejny; wyśrodkowany rząd. Tester administratora zachowuje pełną nawigację.
- [x] Kontrakty PWA i Design Studio współdzielą nowe grupy i akcje. Starsze lokalne szkice zachowują czytelną geometrię wycofanego CTA.

## Weryfikacja

- 511 testów jednostkowych: zaliczone.
- 18 kontroli kontraktów zmienionych widoków: iPhone 390×844 i desktop 1440×900; bez błędów.
- Chromium i WebKit: wspólny nagłówek, działające Jelly (kliknięcie, klawiatura, przeciąganie), pięć skrótów i powrót do homescreenu, brak przelewania.
- Chromium i WebKit: księga, dwa wiersze inicjału, spis tylko zdobytych treści, poprzedni/następny/najnowszy, brak odsłoniętego tekstu podczas dekodowania grafik, reduced motion. Telefon, iPad pion/poziom, desktop.
- Pięć rendererów podsumowania × dwa konteksty: właściwa akcja, brak podwójnego naliczania iskier i brak nowych kart w kampanii.
- Osobna biblioteka: 80 nowych niezmiennych plików, 24,49 MB, hashe i rozmiary sprawdzone przed publikacją. Grafiki pobierane na żądanie; nie są dołączone do commitu aplikacji.

Fizyczny iPhone/Safari PWA: do sprawdzenia przez użytkownika na opublikowanym Preview. Pełna matryca 54 widoków nie była ponownie uruchamiana; zaktualizowano i sprawdzono zmienione widoki.
