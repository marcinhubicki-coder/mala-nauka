# Księga — jedna prawa strona, v59

22.10.2026. Najnowsza decyzja użytkownika zastępuje układ rozkładówki v56: na razie księga ma **jeden pionowy wariant i jedną kolumnę** na telefonie, iPadzie i desktopie.

Nowa oprawa to wygenerowana prawa strona otwartej książki, z fragmentem lewej kartki i zgięciem z lewej oraz warstwami papieru z prawej. Ilustracje, ornamenty rozdziałów i inicjały nadal są osobnymi elementami. Górna i dolna część oprawy zachowują proporcje przy zmianie wysokości kartki.

Cztery osobne przyciski znajdują się w medalionach dolnego ornamentu: spis treści, poprzednia strona, następna strona, najnowsza strona. Podstawowy obszar dotyku ma 44 px wysokości. Spis treści wymazuje wcześniejszą zawartość i pojawia się w tym samym polu strony. Wszystkie 15 kroków mieści się w jednym widoku; treści nieodkrytych kroków są ukryte. Przedmiot rozdziału jest dostępny ze spisu treści.

Nowa treść jest ukryta przed zamianą DOM i przez cały czas dekodowania grafik. Wiersze wyłaniają się przez maskę mierzoną na oryginalnym węźle tekstowym. Tekst nie jest rozcinany na spany i nie zmienia kształtowania glifów na końcu animacji. Maska obejmuje boczne wypusty pisma. Pierwszy akapit pozostaje bez wcięcia, inicjał zajmuje dwa wiersze; kolejne akapity mają wcięcie połowy jego szerokości. Przy przerwaniu wejścia zachowywana jest aktualna widoczność tekstu przed rozpoczęciem wyjścia.

Bez zmiany liczby 53 widoków. Zaktualizowane rodzicielstwo przycisków i inwentarz księgi po rzeczywistym teście widoku na telefonie i desktopie. Pozostałe wpisy inwentarza pochodzą z poprzedniego zweryfikowanego zapisu; nie uruchamiano ponownie całej macierzy ekranów.

Generacja i eksport: `outputs/v59/generation.json`, `outputs/v59/page-asset.json`, `outputs/v59/library/`. Nowy asset jest dostępny lokalnie. Publikacja binariów w bibliotece zewnętrznej pozostaje oddzielnym etapem wydania.
