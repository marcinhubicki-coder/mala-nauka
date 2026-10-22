# v63 — większe ikony kampanii i wspólny panel iskier

22.10.2026 · lokalnie · `work/home-campaign-polish-v63`.

## Kampania

- Dwie główne ikony mają teraz po 80 × 80 px na iPhonie 390 × 844; nagłówek zadania i historia tworzą obszar czterech równych wierszy po 20 px. Pierwsza historia faktycznie składa się w trzy wiersze pod nagłówkiem.
- Nad ikonami, pod nimi do kafla uruchomienia i z prawej zachowano po 12 px. Dłuższy opis nadal jest ograniczony do trzech wierszy; pełny fragment pozostaje w księdze.
- „Krok 1” ma większy font 13 px. Wszystkie zagięcia scalonego obrysu mają rzeczywisty promień 24 px, zamiast rozciąganych proporcjonalnie łuków.
- Obserwator rozmiaru dopasowuje obrys przy rozwijaniu wysokości, korzystając z wymiarów dostarczonych przez ResizeObserver. Kamera mapy nie zmienia pozycji. Dolny kafel ma ok. 227 px zamiast poprzednich 208 px.
- Końcowy stan z trzema skrótami pozostaje zwartym wyjątkiem; księga i ocena wzrosły z 48 do 64 px. Portal zachowuje osobny oszczędny układ.

## Ekran fabularny

- Iskry i Uwolnij Moc są w jednej wspólnej, zaokrąglonej pastylce/powierzchni, z dyskretnym rozdzieleniem obu funkcji.
- „Twoje Iskry Mocy” znajduje się pod licznikiem, wewnątrz wspólnej powierzchni. Zachowane są duże cyfry, przeliczanie, puls iskry i świetliki.
- Kuźnia ma nową ilustrację kowadła z tryskającą energią. Pierścień i ilustracja mają wspólny środek; pierścień korzysta z pięciu kolorów, ładuje się według rzeczywistej gotowości mocy i spokojnie rozbłyskuje po napełnieniu.
- Kufer z istniejącej biblioteki zastępuje puchar w Nagrodach.
- Nagrody, Księga i Zagadka są szerszymi, zaokrąglonymi kaflami, ze znacznie mniejszymi przerwami i podpisami w środku. Wspólna skala i promienie pasują do większego panelu.
- Grafika i podpis każdego skrótu są osobnymi elementami wspólnego kontraktu Studio/PWA. Przycisk zachowuje jedną akcję. Logo, ustawienia, pejzaż, postać i przełącznik trybu nie zmieniają geometrii.

## Grafika

Natywne `image_gen.imagegen`; dokładny prompt: `outputs/v63/generation.json`. Master: `outputs/v63/library/forge-anvil-master.png`. WebP z alfą 512 × 512, 74 914 B: `assets/managed/0fe94aad44bdaa0a2c3d98132e44bb0169334a948c4494d08ea8acb9a9411c04.webp`. Jest w lokalnym indeksie i jest odczytywany przez PWA. Bajty pozostają poza commitem aplikacji; grafika nie jest jeszcze opublikowana w zewnętrznej bibliotece.

## Sprawdzenie

- 8 kontroli zmienionych widoków: iPhone i desktop, kontrakty i edytowalność; 54 widoki, odświeżono tylko cztery inwentarze.
- 10 istniejących testów kontraktów — zaliczone.
- Chromium i WebKit, lokalny build: wspólny panel, podpis pod licznikiem, podpisy wewnątrz kafli, nowe grafiki, środek pierścienia, rzeczywiste wejścia do kuźni i nagród oraz powroty.
- Zmierzone cztery równe wiersze, równe 12 px odstępów, łuki 24 px przed i po zmianie wysokości; mapa pozostaje nieruchoma. Brak błędów konsoli i przelewania ekranu.
- Zrzuty: `outputs/v63/home-webkit.png`, `outputs/v63/campaign-webkit.png` i odpowiedniki Chromium. Wyniki: `outputs/v63/checks.json`; kontrakty: `.design-qa/v63/contracts/verified.json`.
- Build lokalny gotowy. Fizyczny iPhone nie był dostępny do weryfikacji. Nie wykonano push, publikacji biblioteki ani wdrożenia Vercel; szkic użytkownika w Studio pozostaje nietknięty.

Podgląd: http://127.0.0.1:8874/?studio=1&screen=home&state=story&viewId=home-story&homeCompleted=0

Studio: http://127.0.0.1:8874/design-system/#campaign-lab
