# Flagi

Moduł flag korzysta ze wspólnej powłoki Małej Nauki.

## Baza państw

Baza obejmuje 195 państw: 193 państwa członkowskie ONZ oraz dwa państwa-obserwatorów ONZ — Stolicę Apostolską / Watykan i Palestynę. Dane są rozdzielone na pliki kontynentów w `data/flags/`, a `data/flags.mjs` składa je w jedną kolekcję.

Każdy rekord państwa ma pola:
- `id` — stabilny identyfikator ISO 3166-1 alpha-2,
- `country` — polska nazwa państwa,
- `countryEn` — angielska nazwa państwa używana po przełączeniu języka,
- `capital` — stolica zachowana pod przyszłe tryby nauki,
- `continent` — identyfikator kategorii kontynentu,
- `flagSvg` — adres SVG flagi,
- `distanceKm` — przybliżona odległość geograficzna od Polski,
- `distanceRank` — miejsce państwa w kolejności od najbliższego do najdalszego,
- `difficulty` — globalny poziom wynikający z tej kolejności.

Punktem odniesienia jest na razie na sztywno Polska. Odległość jest szacowana jako najmniejsza odległość między terytorium Polski i terytorium danego państwa; dla bardzo małych państw lub brakujących geometrii używany jest reprezentatywny punkt państwa. Państwa graniczące z Polską mają odległość 0 km.

Globalna lista 195 państw jest dzielona według odległości na trzy równe pule po 65 państw: łatwe, średnie i trudne. Dzięki temu poziom nadal wynika z geografii, ale każda faza ma wystarczająco dużą pulę pytań.

## Konfigurator i progresja

Domyślna kategoria to `Wszystkie`. W tym trybie pole poziomu jest całkowicie ukryte i każda runda zawsze startuje na poziomie łatwym. Gra przechodzi tylko w górę: łatwe → średnie → trudne.

Przejście z łatwych na średnie wymaga co najmniej 5 odpowiedzi z bieżącego poziomu, minimum 80% poprawności i średniego czasu odpowiedzi nie większego niż 5,2 s. Przejście ze średnich na trudne wymaga co najmniej 6 odpowiedzi, minimum 85% poprawności i średniego czasu nie większego niż 4,5 s. Po awansie gra nie cofa poziomu w tej rundzie.

Po wybraniu konkretnego kontynentu suwak `Łatwe — Średnie — Trudne` pojawia się ponownie. Wtedy poziomy są liczone względnie w obrębie wybranego kontynentu: państwa są sortowane według odległości od Polski i dzielone na trzy możliwie równe grupy. Suwak wskazuje poziom startowy, a podczas rundy nadal możliwy jest awans na kolejne poziomy.

## Flagi, język i mapy

SVG flag pochodzą z `flag-icons` v7.5.0. Wszystkie 195 plików znajduje się lokalnie w `assets/flags/svg/` i jest pre-cache'owane przez service worker. Flagi nie wymagają połączenia z CDN. Licencja MIT znajduje się obok plików SVG.

Przełącznik języka nazw krajów jest dostępny w module flag (PL / EN) i zapamiętuje wybór na urządzeniu. Zmienia nazwy na przyciskach odpowiedzi oraz nazwę kraju w feedbacku bez zmiany mechaniki punktów.

Po błędnej odpowiedzi karta zachowuje wymiary. Nazwa kraju, stolica i miniatura flagi zajmują stałe miejsca u góry, a poniżej pojawia się mapa właściwego kontynentu z podświetlonym państwem. Ten sam renderer obsługuje Europę, Azję, Afrykę, Amerykę Północną, Amerykę Południową i Oceanię. Odpowiedzi zachowują swoje pozycje i wielkość przez cały przebieg pytania.

Mapy kontynentów są lokalnymi SVG w `assets/maps/`, z osobnym elementem `data-country` dla każdego państwa. Są wygenerowane z danych Natural Earth i pre-cache'owane przez service worker, więc feedback mapowy nie zależy od zewnętrznego requestu w momencie odpowiedzi. Informacja o źródle znajduje się w `assets/maps/NATURAL-EARTH-SOURCE.txt`.

## Oprawa przygody

Aktualny widok korzysta z lokalnych SVG wszystkich 195 flag, wspólnej animowanej
flagi na maszcie, papierowych kafli i map wewnątrz stałej karty. Szczegóły,
proporcje Retina, kontrakt danych i zasady dodawania assetów:
[`docs/FLAGS-ADVENTURE-V1.md`](../docs/FLAGS-ADVENTURE-V1.md).
