# Start kampanii — próbka świata 1

22.10.2026 · lokalna gałąź `work/story-home-v60`. Rejestr i kontrakty: 54 widoki.

## Zakres i chronione elementy

Nowy `home-story` jest ekranem powracającego gracza. Próbka pokazuje Port odkrywców po siedmiu krokach. Pierwsze uruchomienie zachowuje dotychczasowy ekran powitalny do osobnego opracowania. Logo i ustawienia używają wspólnej geometrii z dotychczasowego `home`; przełączanie nie wymienia ich węzłów ani nie zmienia położenia.

Na dole obu ekranów jest Jelly „Fabularny / Swobodny”. Treść wychodzi i wchodzi przez blur, a Jelly zachowuje swój ruch, fokus i gest. Wspólny runtime pomija dodatkowe przejście całego ekranu pomiędzy tymi dwoma widokami. Stare tryby, wyniki i CTA kampanii pozostają dostępne w widoku swobodnym. Grafiki obu wariantów są dekodowane przed wejściem treści, łącznie z warstwami ikony nagród. Jego treść poniżej chronionej nawigacji jest jednolicie zmniejszona, z zachowaniem proporcji, aby zrobić miejsce przełącznikowi.

## Dane i nawigacja

- Powracający profil z rozpoczętą kampanią domyślnie otrzymuje widok fabularny. Wybór trybu pozostaje w sesji; nie zmienia postępu.
- Gospodarzem jest ostatni **nowo odkryty** NPC bieżącego świata. Powtórki i późniejszy dialog z wcześniejszym NPC tego nie cofają. W porcie Mira pojawia się po kroku 4, Bor po kroku 7. Przed pierwszym NPC zastępuje ich przewodnik odpowiedni dla awatara.
- Nowy pejzaż portu jest osobnym obrazem. NPC pozostaje osobną warstwą, wystaje ponad kadr i kończy się przy matowym panelu, w okolicy pasa. Dalsze światy korzystają na razie z istniejących ilustracji; siedem nowych pejzaży nie jest częścią tej próbki.
- Panel ma saldo całych iskier i cztery graficzne akcje: kuźnia, puchary i medale, księga, przedmiot. Kuźnia i nagrody otwarte stąd wracają bezpośrednio do tego ekranu; wcześniejsze wejścia z wyników zachowują swoją nawigację.
- Księga otwiera najnowszy wpis. Przedmiot otwiera w niej od razu stronę gadżetu bieżącego świata. Powrót z obu prowadzi do ekranu fabularnego.
- Wewnętrzny kafel zawiera następny krok i „Kontynuuj kampanię”, prowadzące na mapę. Po ukończeniu świata, przed pożegnaniem/portalem, ekran pozostaje w tym świecie.

## Grafika i zasoby

Pejzaż wygenerowany narzędziem `image_gen.imagegen`, wyeksportowany do WebP 1024 × 1536, 414 606 B. Metadane: `shared/story-home-assets.mjs` oraz lokalny indeks `design-system/assets.json`. Oryginał, eksport i opis znajdują się w `outputs/v60/library/`; prompt w `outputs/v60/generation.json`. Bajty ilustracji i zrzuty QA pozostają poza commitem aplikacji. Publikacja w zewnętrznej bibliotece oraz Vercel nie zostały wykonane.

Matowe szkło używa przyciętej, rozmytej kopii tego samego pejzażu: obraz jest dekodowany wspólnie, a położenie aktualizowane tylko przy zmianie rozmiaru. Dzięki temu WebKit i Chromium pokazują ten sam efekt bez pełnoekranowego przechwytywania tła.

## Poza zakresem

Osobny ekran pierwszego uruchomienia, siedem dopasowanych pejzaży oraz układanka przedmiotu 15 + 5 części z blokadą portalu pozostają kolejnym etapem. Obecne trzy części przedmiotu i zasady przejścia kampanii nie są zmienione przez tę próbkę.

## Sprawdzenie

`tools/qa-story-home.mjs` sprawdza wybór NPC, całe iskry, brak mutacji postępu, realne skróty i powroty, stabilne logo/ustawienia/Jelly oraz stronę przedmiotu. Testy przeglądarkowe i zrzuty telefoniczne: Chromium i WebKit 390 × 844. Kontrakty dwóch ekranów: 390 × 844 i 1440 × 900. Pozostałe 52 wpisy inwentarza są przeniesione z poprzedniego sprawdzonego cache; nie wykonano ponownie pełnej macierzy widoków. Fizyczny Safari PWA na telefonie nie był sprawdzany.
