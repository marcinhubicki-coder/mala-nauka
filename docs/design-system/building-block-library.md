# Biblioteka klocków

Builder i Globalne przepisy pokazują elementy tworzone z kodu. Atomy i grupy nie otwierają już całego ekranu w iframe i nie ukrywają jego pozostałych elementów. Jedynie rodzina pokazuje kompletny, działający ekran aplikacji.

- Atomy tekstu: treść, font, rozmiar i typografia.
- Atomy obiektów: podkłady, przyciski, kontrolki, pole imienia i wskaźniki.
- Atomy grafiki: osobne zdjęcia, avatary, ilustracje i tła.
- Grupy: kompozycje tych atomów, z linkami do składników i użyć.
- Rodziny: całe widoki gry.

Źródła: `shared/structure-model.mjs` definiuje strukturę, `shared/part-recipes.mjs` zawiera wartości z kontraktów CSS i tokenów, a `shared/part-samples.mjs` tworzy nowe drzewa elementów. `shared/profile-parts.mjs` dostarcza te same avatary, przełącznik PIN, kropki i klawiaturę aplikacji oraz bibliotece. Geometrię jelly i jego przeciąganie obsługuje wspólny `createJellyV4`.

PIN / bez PIN-u jest grupą i wariantem jelly. Ustawienia globalnego jelly przechodzą przez dotychczasowy kontrakt dziedziczenia, a ustawienia `control-pin` są jego wyjątkami. Biblioteka pozwala przełączać oba stany, wpisać cztery cyfry, kasować i zatwierdzić próbę. Lista graczy pokazuje 1–3 osoby; wybranie jednej wygasza pozostałe. Pole imienia jest aktywnym polem tekstowym, a wybór avatara reaguje na kliknięcie.

Wysokość grup wynika z zawartości. Wymiar 0 oznacza auto. Przycisk przywracania pojawia się po zmianie wartości; dla globalnego przepisu przywraca wartość domyślną. Rozwinięte sekcje pozostają otwarte podczas edycji.

Sprawdzono budowanie aplikacji, cały zestaw 208 testów i osobne kontrakty składania klocków: dostępność grafik, działanie stanów PIN, kompletność klawiatury, bramkę czterech cyfr, przykłady 1–3 graczy oraz propagację ustawień i wyjątków. Zgodnie z prośbą użytkownika nie wykonywano kontroli w przeglądarce.
