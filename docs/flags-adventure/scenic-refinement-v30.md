# Scenic v30 — PWA i czytelność mapy

Ekran gry używa wysokości obszaru układu i `100lvh` w trybie zainstalowanej aplikacji. Sama scena wypełnia ekran, a obszary bezpieczne odsuwają jedynie kontrolki. Usunięto zależność pełnego tła od samego `100dvh`, niebieski kolor pod tłem oraz cienie czasu i podpisu. Osobny manifest ma stały identyfikator podglądu i adres startowy.

Chłopiec jest zakotwiczony do dolnej krawędzi ekranu i schodzi 12 px poza nią. Jego wysokość wynika z pozycji odpowiedzi: najwyższe włosy mogą zachodzić na nie przez 10 px. Pytanie jest centrowane w faktycznie złożonej kartce. Odpowiedzi są nieco niżej; nazwy dwuwierszowe i znak błędu mają większe marginesy.

Kolor odpowiedzi używa tej samej dziewięcioczęściowej maski co pergamin. Sekcja sąsiadów kończy się na prawej krawędzi odpowiedzi; odstęp nad nią i między jej paskami jest taki sam jak odstęp między guzikami. Aktywny sąsiad dostaje jasną krawędź pastylki i jasny obrys kraju na mapie.

Mapa ma taki sam niewielki margines u góry i u dołu. Pod nazwą, stolicą i flagą pozostaje wyłącznie wyblakła warstwa pigmentu o kryciu 22%; pozostała mapa przechodzi trzy przebiegi rysowania. Etykiety mapy omijają nagłówek. Nagłówek jest rysowany na osobnej powierzchni z pełnym kryciem. Położenie tekstu wynika z rzeczywistych metryk tuszu: dół nazwy kraju jest wyrównany do jej pola, a góra stolicy do osobnego, stałego pola. Ogonki nie wchodzą na stolicę. Przegląd Europy wybiera kadr najbliższy środkowi aktualnego kraju w granicach źródłowej mapy.

Przełącznik PL/EN mieści się w 33 px kompasie bez zawieszki i jest przesunięty nieco w prawo. Zmienia nazwy państw, stolic, sąsiadów i główne teksty interfejsu, zachowując zadanie, widok oraz zaznaczenia sąsiadów. Zmienione moduły mają wspólną wersję adresów, aby wcześniejszy service worker nie mieszał ich ze starszym kodem.

## Ograniczenie iOS 27

Górny blur warstwy systemowej nie jest filtrem CSS tej strony. Problem pełnego ekranu zainstalowanych aplikacji iOS 27 jest ponownie otwarty w [WebKit 301994](https://bugs.webkit.org/show_bug.cgi?id=301994). Nie deklarujemy usunięcia warstwy systemowej ani weryfikacji na fizycznym iPhonie. Testy obejmują Chromium i WebKit, rozmiar 390 × 844, obszary bezpieczne 47/34 px, wypełnienie wysokości, pergamin, metryki liter, język i przebieg rozgrywki. Zasady oddzielania tła od bezpiecznego obszaru kontrolek opisuje [WebKit](https://webkit.org/blog/7929/designing-websites-for-iphone-x/).

Do instalacji PWA należy używać stałego aliasu gałęzi. Adres konkretnego wdrożenia Vercel pozostaje przypisany do jego wersji i nie otrzymuje kolejnych zmian.
