# Ekran końca rundy

Wzór: zatwierdzony „Pastel Bunny Learning App Screen(1).png”. Ekran obejmuje ukończone i przerwane rundy. Nie zmienia zasad sesji ani zapisu postępów.

- Jeden ekran bez przewijania strony; ilustracja dochodzi pod pasek systemowy.
- Baza: iPhone 13 Pro, 390 × 844 CSS; skalowanie według dostępnej szerokości i wysokości.
- Królik i dolna łąka mają natywnie 1586 × 992 oraz 1706 × 922 px, wystarczająco dla @3x także przy szerokości 430–440 CSS.
- WebP 96 do wyświetlania; bezstratny PNG królika jako zapasowy format. Żadnych filtrów rozmycia ani dodatkowego panelu pod całą treścią.
- Zaokrąglony Nunito w wagach 600–950 na ekranie wyniku, z polskimi znakami; DynaPuff pozostaje fontem rozgrywki.
- Liczba poprawnych odpowiedzi, procent, pastylka trybu i pasek postępu nad dwoma kaflami.
- Zielone „Utrwalone”, różowe „Do powtórki”. Kliknięcie kafla pokazuje odpowiednią listę. Kafel „Opanowane” pozostaje ukryty.
- Poprawny zapis jest wyróżniony zielenią również na liście powtórek. Nagłówek: „Tu były małe potknięcia”, opis: „Zapamiętaj poprawną formę.”
- Trzy pełne wiersze; dalsze słowa przewijają się wewnątrz listy. Przyciski pozostają na ekranie.
- Okrągły X, żółte kreski, perłowe bańki i delikatnie migające gwiazdki; prefers-reduced-motion zatrzymuje animacje.
- Nowe moduły, fonty i obrazy w cache PWA. Kolejna runda używa rzeczywistej konfiguracji ostatniej sesji.

`result-preview.html` pokazuje wspólny renderer wewnątrz widoków 390×844, 393×852, 402×874, 430×932 i Safari 390×700. Przykładowe wyniki nie są zapisywane do historii. Scenariusze: przerwana, ukończona, wszystko poprawnie, długa lista powtórek, dyktando i brak odpowiedzi.

Ilustracje odtworzono w imagegen z zatwierdzonego mockupu: sama ilustracja góry z tym samym radosnym białym królikiem, zamkiem, stokrotkami i bańkami; osobno pas dolnej łąki bez tekstu i interfejsu. Elementy interfejsu pozostają prawdziwym HTML, CSS i SVG.
