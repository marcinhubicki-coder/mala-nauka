# v62 — ekran fabularny i kafel kampanii

22.10.2026 · lokalnie · branch `work/home-campaign-polish-v62`.

## Zrealizowane uwagi z bieżącej iteracji

- [x] Pastylka iskier zaczyna się w osi lewej krawędzi Nagrody i kończy na prawej krawędzi Księgi. Kuźnia jest w osi Zagadka.
- [x] Podpisy „Twoje Iskry Mocy” i „Uwolnij Moc” są pod grafikami, na wspólnej wysokości.
- [x] Powiększony licznik zachowuje przeliczanie bębenkowe i skaluje font przy dłuższym saldzie. Ikona iskry ma skalę kuźni wraz z pierścieniem.
- [x] Dodatkowe świetliki przy ikonie salda, para iskier i kulka nad otwartą dłonią przewodnika, pyłek na skrzydłach. Osobne kotwice dla Iskierki i Iskiera. Warstwa efektów ma granicę pod przyciskiem ustawień.
- [x] Mniejsze powitanie i zapas dla ośmioliterowego imienia. Efekty nie wymagają pomiarów układu na klatkach animacji.
- [x] Panel szkła nieco wydłużony od dołu, ze spójnymi odstępami. „Odkrywasz Port Odkrywców” nad kontynuacją.
- [x] Ciągły spokojny połysk kontynuacji; bez chevronu i animacji zależnej od hover.
- [x] Wyśrodkowany portal zagadki: tył pierścienia za znakiem zapytania, przód przed nim.
- [x] Nowy wygenerowany medalion z pięcioma zagłębieniami. Każde ma własną pozycję i przyjmuje gwiazdkę po rozgrywce.
- [x] Na mapie księga po lewej, medalion gwiazdek po prawej, bez podpisów. Zagadka jest trzecią akcją dopiero przy ostatnim zadaniu/portalu; na starcie i w księdze pozostaje dostępna wcześniej.
- [x] „Krok 1” w osobnym wierszu podwyższonej zakładki, bez kropki. Zakładka i panel mają jeden ciągły, zaokrąglony obrys.
- [x] Pod zakładką nazwa zadania, np. „POPRAWNA PISOWNIA”; tekst ma miejsce na trzy wiersze obok ikon. Dłuższy fragment nadal można czytać w księdze.
- [x] Zmiany zawartości i wysokości kafla pozostawiają kamerę mapy w tym samym miejscu. Postać pokazuje najdalszy postęp; wybór powtórki jej nie cofa.
- [x] Gwiazdki lecą do nowego medalionu przed teleportem. Powtórka zachowuje najlepszą ocenę. Skrót zagadki działa również w testerze Studio.

## Dodatkowe naprawy ujawnione w podglądzie

1. Usunięty stary styl w CSS księgi, który narzucał szerokość 48 px kolumnie ikon mapy i powodował nakładanie się opisu.
2. Matowe tło nowego kształtu korzysta z przyciętej, rozmytej kopii tego samego pejzażu. WebKit nie rozmywał prawidłowo tła przez maskę SVG; teraz wygląd jest zgodny z Chromium, bez animacji filtra.
3. Przy nawigacji kontrakt wychodzącego widoku jest wycofywany przed zmianą DOM. Zapobiega to chwilowej próbie odczytu pustego, poprzedniego ekranu przez Studio. Rygor walidacji docelowych kontraktów pozostaje zachowany.
4. Księga, medalion, numer kroku, pastylka i elementy kuźni są zadeklarowane we wspólnych kontraktach Studio/PWA. Nadal 54 widoki; odświeżono tylko cztery zmienione inwentarze.

## Sprawdzenie i dowody

- 25 istniejących testów zasad oceny/postępu i kontraktów — zaliczone.
- Cztery zmienione widoki na iPhonie 390 × 844 i desktopie 1440 × 900 — 8 kontroli, bez błędów.
- Chromium oraz WebKit: geometria pastylki/podpisów, imię ośmioliterowe, obie wersje przewodnika, nieprzesuwająca się mapa, widoczne wypełnienia medalionu i otwarcie strony zagadki.
- Rzeczywisty tester Studio w obu silnikach: wynik 60% → 3 gwiazdki → teleport → powrót do ocenionego pola, bez cofania postaci; zagadka przy ostatnim zadaniu.
- Ostatnia kontrola WebKit po naprawie nawigacji: Jelly (kliknięcie, klawiatura, przeciągnięcie), kuźnia/nagrody/księga/zagadka i powroty, kontynuacja kampanii. Bez błędów konsoli.
- Lokalny build gotowy. `outputs/v62/layout-checks.json`, `outputs/v62/smoke.json`, `.design-qa/v62/contracts/verified.json` zawierają wyniki. Zrzuty w `outputs/v62/` są lokalne i pominięte w Git.
- To testy silnika WebKit i emulowanego rozmiaru; fizyczny iPhone nie był sprawdzany w tej iteracji.

## Grafika i lokalne podglądy

Nowy medalion: natywne `image_gen.imagegen`, eksport WebP 512 × 512 z przezroczystością, 94 606 B. SHA-256 `341542f9f32ea4161fdcfbc7056b66e74e933c871bbc6e18786943d37b23e5f9`. Master i eksport w `outputs/v62/library/`. Brief w `outputs/v62/generation.json`. Metadane w indeksie i module `shared/campaign-star-assets.mjs`; bajty nie wchodzą do commita aplikacji. Grafika jest lokalnym kandydatem, jeszcze nie opublikowanym w zewnętrznej bibliotece.

- PWA: http://127.0.0.1:8874/
- Próbka Iskiera: http://127.0.0.1:8874/?studio=1&screen=home&state=story&viewId=home-story&homeCompleted=0
- Próbka Iskierki: powyższy adres z `&homeGuide=girl`.
- Dom kapitana: powyższy adres z `homeCompleted=7` zamiast `0`.
- Studio / rzeczywisty tester: http://127.0.0.1:8874/design-system/#campaign-lab

W tej iteracji nie wykonano push, wdrożenia Vercel, zmiany main ani publikacji biblioteki. Zachowany szkic Studio w przeglądarce nie został zapisany ani odrzucony.
