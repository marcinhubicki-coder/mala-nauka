# Kampania v52 — żywy kalejdoskop i stały kadr

Praca lokalna 21.10.2026, branch `work/campaign-flow-v52`, baza v51
`6157dfce4294a003373dbceab195edafcb4078e5`. Bez publikacji na Vercelu.
Wspólny renderer PWA, podglądu ekranów i testera kampanii. Chronione:
Home/CTA, Flagi, nagłówki gier, grafiki światów i obrys rzeczywistych kafli.

## Dwie warstwy światła i niezależne łańcuchy

- Wędrujące światło obejmuje cały ekran, również górę. Oświetla rzeczywiste
  wielokąty siatki. Na desktopie pierwszy blask reaguje na mysz; na telefonie
  wszystkie poruszają się samodzielnie. Własne włączanie, siła, tempo i liczba.
- Ruchome fragmenty mają osobną poświatę. Wyłączenie jednej warstwy nie wyłącza
  drugiej. Łańcuchy startują losowo i osobno, bez wspólnego rytmu.
- Domyślnie do 7 jednoczesnych łańcuchów przy pierwszym kroku. Maksimum w Studio:
  12. Limit maleje według powierzchni pozostałego nieodkrytego terenu względem
  pierwszego kroku, nie według liczby różnej wielkości szkiełek.
- Łańcuch przechodzi tylko przez wspólne krawędzie nieodkrytych części. Gdy
  dochodzi do ślepego końca, może rozgałęzić się od wcześniejszej części.
  Łańcuchy nie zajmują tego samego fragmentu jednocześnie.
- Każdy ruch na chwilę przybliża fragment do prawidłowej fotografii, domyślnie
  o 50% pozostałego odkrycia, po czym wraca do kalejdoskopu. Wykorzystuje ten sam
  obrót i mgłę co prawdziwe odkrycie. Jest to efekt tymczasowy: nie zmienia
  wyniku, zapisanej mapy ani widoczności dalszej ścieżki.
- Studio ma osobny suwak chwilowego odkrycia 0–100%, przekształcenie do 300%,
  oba światła do 400%, czas ruchu do 16 s, rozrzut startów do 6 s i do 24 części
  na łańcuch. Przycisk uruchomienia pozwala sprawdzić efekt bez czekania.
- Łączny budżet: 192 ruchome fragmenty; przy dużej liczbie łańcuchów automatycznie
  zmniejsza się ich długość. Światło całej mapy ma do 6 plam, maksymalnie 25
  odmalowań/s i do 72 rozświetlanych wielokątów w klatce.
- Dwie małe tekstury fragmentu są przygotowane przed animacją. Poświata jest
  wypalona w tych teksturach. Nie ma dodatkowego blendowania ani animowanej
  maski CSS dla każdego szkiełka; obrót i przenikanie korzystają z transformacji
  i opacity. Główny canvas mgły nie jest przemalowywany przez łańcuchy.
- Ukryta karta, ekran poza widokiem i reduced-motion zatrzymują ruch; poznany
  teren nie uczestniczy w łańcuchach. Globalne światło może omiatać całą mapę.

## Stały obraz i płynna karta

- Kamera zależy od rozmiaru ekranu i świata, nie od wysokości karty z opisem.
  Gwiazdki, inny krok i dłuższa treść nie przesuwają ani nie skalują fotografii.
- Mgła jest dopasowana we współrzędnych układu. Nie mierzy animowanych prostokątów
  ekranu, co usuwa drobne przeskoki całej warstwy.
- Ten sam świat zachowuje mapę, nawigację i obrazki ikon w DOM. Zmiana świata
  zachowuje załadowane obrazki przycisków nawigacji, zamiast je montować od nowa.
- Karta ma stałą dolną krawędź. Jej wysokość płynnie się zmienia, a zawartość
  wchodzi od góry z opóźnieniami 65 ms. Zmiana podczas animacji zaczyna od
  aktualnej wysokości. W reduced-motion przechodzi od razu do końcowego stanu.
- Nowa pozycja w testerze anuluje poprzednią prezentację gwiazdek i teleport.
  Starsze zakończenie animacji nie może nadpisać nowej pozycji pionka. Karta
  zarządza własną animacją obecności, bez drugiego efektu z ogólnego runtime.

## Przegląd lokalny

Raporty: `.design-qa/v52/`, kopie wybranych dowodów w `outputs/v52/` zadania.
Test efektu: `tools/qa-campaign-flow-browser.mjs`. Sprawdza oba niezależne
światła, chwilowe odkrycie, do 7 łańcuchów, górne limity, stałą mapę/mgłę,
rosnącą kartę, przerwanie animacji i reduced-motion w Chromium i WebKit.

Wynik: 490 testów Node, 100 sprawdzeń kontraktów; dwa przeglądy efektów w
Chromium i WebKit, normalny oraz ograniczony ruch. Po usunięciu kosztownych
masek pomiar przy maksymalnych ustawieniach: 91 klatek / 1,5 s w obu silnikach
na tym Macu (nie jest to pomiar fizycznego iPhone’a).

Dodatkowo: prawdziwa runda matematyki 6/10 → zapis 3 gwiazdek → podsumowanie →
kampania, powtórki, portal z 300 próbkowanymi świetlikami i biblioteka CDN.
Kontrakty obejmują 50 widoków na iPhonie 390 × 844 oraz desktopie.

Wynik lokalnej emulacji WebKit nie potwierdza zachowania ani zużycia baterii
na fizycznym iPhonie. Aktualny Vercel pozostaje bez zmian.

## Kolejny etap wskazany przez użytkownika — jeszcze niewdrożony

- Przycisk następnego świata dominujący nad powtórką, inspirowany
  [Cosmic 3D Galaxy](https://freefrontend.com/css-animations/#2026-02-28-cosmic-3d-galaxy-button-l).
- Karta informacji z frost glass według [css.glass](https://css.glass) i zrzutu
  użytkownika: biel `rgba(255,255,255,.67)`, promień 16 px, cień
  `0 4px 30px rgba(0,0,0,.1)`, blur 11,8 px (również prefiks WebKit),
  obrys `1px solid rgba(255,255,255,.81)`.

Tych dwóch zmian nie wprowadzamy w v52 zgodnie z „Do tych poprawek później
przejdziemy”.
