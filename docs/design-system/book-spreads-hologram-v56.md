# Księga i świetlne karty — v56

Zakres: uwagi z 21.10.2026 po v55. Dwie strony w poziomie, do czterech kolumn,
połowa szerokości inicjału jako wcięcie, zaplanowany holograficzny upgrade,
wspólna oprawa kart według wskazanego wzoru elektrycznej ramki.

## Księga

- Pion: jedna kartka. Poziom: zawsze dwie powierzchnie papieru z grzbietem.
- Szerokość co najmniej 1400 px w poziomie: dwie kolumny na każdej kartce.
- Odkryte strony są parowane, strzałki zmieniają rozkładówki. Numerowana nawigacja
  otwiera rozkładówkę zawierającą wybraną stronę. Przy obrocie zachowany jest fragment.
- Ostatnia nieparzysta strona dostaje kartkę dekoracyjną; nie pokazuje przyszłej fabuły.
- Ilustracje przepływają z tekstem. Inicjał i pierwsze zdanie stanowią jeden blok,
  aby grafika litery nie przeskakiwała sama do następnej kolumny.
- Zwykły akapit ma wcięcie równe 50% szerokości inicjału. Przy zdobionym początku
  ten sam odstęp znajduje się przed samą literą; nie dublujemy go przed resztą słowa.
- SVG wycinające atlas mają unikatowe identyfikatory masek również przy dwóch stronach.
- Strony zachowują osobne, edytowalne grupy w tym samym kontrakcie Studio/PWA.

## Holograficzne ulepszenie

- Kuźnia: karta unosi się, przechyla, ładuje blask, pokazuje nowy poziom i wraca.
- Medal / trofeum / Puchar wiedzy: ta sama prezentacja przy ulepszeniu w oknie nagrody,
  z zachowaniem istniejącego korpusu oraz nakładki nowej części.
- Sekwencja jest jednorazowa, niezależna od kursora. Warstwa hologramu i transformacje
  znikają po powrocie. Reduced motion wykonuje zmianę bez ruchu 3D.
- Kryteria, koszty, zapis i poziomy nagród nie zostały zmienione.

## Oprawa ośmiu efektów

- Wspólne: ciągły świetlisty kontur, jasny rdzeń, miękka wielowarstwowa poświata
  wewnątrz i poza kartą. Bez przesuwanych, okresowo urywanych kresek.
- Gotowy, w pełni naładowany kafel otrzymuje ciemniejsze ciepłe podłoże,
  pojawiające się miękko po zakończeniu licznika. Jasny tekst i ikony pozostają czytelne.
- Elektryczny: ciepła barwa, silniejsze nieregularne odkształcenia i drobne wyładowania.
- Iskry, bąbelki, świetliki, romby, fale, wiatr, zorza zachowują kolory, emitery
  i własną amplitudę; korzystają z tej samej świetlnej głębi.
- Jedna pętla dla kart danego widoku, około 30 odmalowań/s, do 900 punktów konturu,
  DPR do 1,5, do miliona pikseli na kartę. Geometria liczona przy zmianie rozmiaru.
- Niegotowe, wyłączone i znajdujące się poza widokiem karty nie odmalowują konturu.
  Ukrycie karty przeglądarki również zatrzymuje odmalowywanie.
  Przy reduced motion zostaje spokojny obrys. Brak stałej animacji filtrów całego UI.
- Zmiany rozmiaru kolejkowane poza fazą ResizeObserver, aby WebKit nie wpadał
  w ponowne przeliczanie układu w trakcie tej samej dostawy obserwatora.

## Ograniczona kontrola lokalna

Na prośbę użytkownika bez pełnej regresji 53 ekranów ani wieluset stron.
Zaliczony krótki scenariusz Chromium / WebKit, bez błędów wykonania: 390×844, 1024×768, 1600×900, obrót,
przełączanie rozkładówek, wcięcia i brak przelewania, osiem ramek,
ulepszenie mocy i pucharu oraz reduced motion. Raport `.design-qa/v56/report.json`.
Inwentarz odświeżony dla księgi; pozostałe widoki zachowują zweryfikowane dane v55.
Końcowy kontrast ciemniejszej karty sprawdzony wizualnie w otwartej przeglądarce.
Test urządzenia fizycznego i długotrwałe obciążenie GPU nie zostały wykonane.
Bez push / Vercel / publikacji biblioteki.

Inspiracje: [holograficzna karta](https://codefronts.com/components/css-3d-tilt-hover-cards/glassmorphism-3d-parallax-team-card/),
[elektryczna ramka](https://codepen.io/BalintFerenczy/pen/KwdoyEN).
