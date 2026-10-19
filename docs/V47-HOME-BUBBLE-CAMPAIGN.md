# v47 — homepage i pola kampanii

Zakres: lokalna korekta na gałęzi `work/home-bubble-v47`. Bez publikacji.

## Wprowadzone poprawki

- Przywrócono wcześniejsze proporcje ilustracji, statystyk i pięciu kafli na Home. Kapelusz wystaje ponad górną krawędź ilustracji.
- CTA kampanii zajmuje około 41% szerokości rodziny powitalnej. Jest po lewej, pod tekstem, przed statystykami. Pulsuje w całości; ma perłową oprawę, refleks i dziesięć wewnętrznych drobinek. Reduced motion wyłącza ruch.
- PWA, edytor i próbka w bibliotece korzystają z tego samego renderera CTA i modelu geometrii.
- Kampania korzysta ze wspólnego przycisku Wróć z ikoną SVG, bez zależności od kształtu glifu fontu.
- Osobno skalibrowano wszystkie siedem ilustracji: po 16 czworokątów, w tym podstawa portalu. Cztery narożniki opisują wewnętrzną krawędź rzeczywistego kafla w oryginalnym obrazie 1080 × 1350.
- Podświetlenie i obszar kliknięcia mają ten sam czteropunktowy obrys. Pozycja postaci pochodzi ze środka tego obrysu. Współrzędne są względne, więc ilustracja i obrys skalują się razem.
- Zaznaczenie, odnośnik i postać są na jednej płaszczyźnie: odnośnik pod polem, postać nad obydwoma. Teleport nadal może przejść przed postacią.
- Zachowano świadome ręczne przesunięcia trasy. Zmiany rozmieszczenia nadal wymagają zatwierdzenia i mają Cofnij / Ponów / Odrzuć.
- Nie zmieniano zasad, kryteriów, profili ani szkicu użytkownika w Safari. Nie dodano ani nie opublikowano grafik.

## Sprawdzenie lokalne

- Build i 475 testów jednostkowych: poprawne.
- Chromium oraz WebKit: CTA przy kilku rozmiarach okna, największa faza pulsu poniżej 45% szerokości, odstępy, reduced motion, przejście Home ↔ Kampania.
- Chromium oraz WebKit: przesunięcie przycisku, Cofnij, Ponów, zatwierdzenie, globalne Cofnij; strzałka pozostaje wyśrodkowana 24 × 24 w przycisku 44 × 44 i prowadzi na Home.
- Chromium oraz WebKit: tymczasowe rozmieszczenie pól, odrzucenie, wybór poprzedniego kroku, teleport, szybka zmiana kroku i awatar testowy.
- Czteropunktowe obrysy porównano wizualnie z wszystkimi siedmioma ilustracjami. Test danych sprawdza wypukłość, zakres współrzędnych i wspólny środek pola oraz postaci.
- Kontrakty Home i Kampanii w skompilowanym PWA: telefon i desktop, cztery przypadki bez błędów.

Artefakty: `.design-qa/v47/` i katalog zadania `outputs/v47/`.
Fizyczny iPhone / zainstalowana PWA iOS nie były sprawdzane w tej iteracji.
