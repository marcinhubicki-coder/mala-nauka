# Architektura i biblioteka klocków — zestawienie zmian

Zakres: edycja architektury, scenariusze profili, wspólna struktura Buildera i Komponentów oraz zwarty panel ustawień. Gałęzie: `design/system-v1` i `studio/pwa-test`. Zapisane ustawienia użytkownika: rewizja 26, bez zmian w `config.json`.

## 1. Architektura i połączenia

| Wymaganie | Implementacja | Sprawdzenie |
|---|---|---|
| Edytowanie celu przycisków | Selektory celów zapisują wspólną konfigurację nawigacji, używaną w grze | Testy rozwiązywania tras i zapisu szkicu |
| Wszystkie scenariusze graczy | Brak profili, 1, 2, 3 graczy; nowy profil; PIN, bez PIN-u, odblokowanie | Testy definicji scenariuszy i tras; budowanie |
| Zmiana stanu w podglądzie | Wybrany scenariusz otwiera ten sam ekran w Komponentach | Kontrola kodu parametrów podglądu |
| Nazwane kolumny | Logowanie, Ekran startowy, Opcje rozgrywki, Początek gry, Koniec gry, Statystyki | Kontrola szablonu i budowanie |
| Połączenia na mapie | Wybrana karta pokazuje linie do swoich aktualnych celów | Kontrola generowania linii |
| Przywróć tylko po zmianie | Przycisk pojawia się przy celu innym niż domyślny | Kontrola warunku renderowania |
| Linki do części i ich wnętrza | Zagnieżdżone drzewo otwiera rzeczywisty element lub jego przepis | Test hierarchii i selektorów |
| Ochrona PIN-u i walidacja imienia | Przejście do gry następuje dopiero po sprawdzeniu kodu albo zapisaniu nowego profilu | Testy niedozwolonych skrótów; kontrola wykonania tras po walidacji |

## 2. Wybór gracza

| Wymaganie | Implementacja | Sprawdzenie |
|---|---|---|
| Pozostałe karty szarzeją | Po wyborze karta pozostaje aktywna, inne mają ustawianą przezroczystość i odbarwienie | Kontrola CSS i logiki wyboru |
| Płynne przejście | Automatyczne przejście z ustawianym opóźnieniem i czasem pojawiania ekranu | Test zakresów parametrów i ich zapisu |
| Gracz z PIN-em | Najpierw ekran odblokowania, potem cel z architektury | Test tras; kontrola kodu |
| Zmiana wyboru podczas oczekiwania | Nowszy wybór unieważnia wcześniejsze oczekujące przejście | Kontrola licznika wyborów i blokady równoległego wejścia |
| Podgląd profili bez zapisu prawdziwych danych | Tworzenie, edycja, PIN i usuwanie w Studio używają profili przykładowych | Kontrola odseparowania operacji zapisu; testowe odblokowanie 1234 |

## 3. Atomy, grupy i rodziny

| Wymaganie | Implementacja | Sprawdzenie |
|---|---|---|
| Jedna lista części | `shared/structure-model.mjs` jest wspólnym źródłem dla mapy, biblioteki i inspektora | Testy spójności i unikalności identyfikatorów |
| Początkowe ekrany w bibliotece | Logo, ilustracja pierwszego gracza, avatar, imię, opisy, karta profilu, PIN, cyfry, klawiatura i przyciski | Test kompletności części początkowych |
| Dziedziczenie PIN-u | PIN dziedziczy jelly, opcja PIN opcję jelly, klawisz PIN przepis przycisku | Test kolejności dziedziczenia |
| Hierarchia w Komponentach | Rodzina (widok), grupy nadrzędne i atom mają osobne linki | Test stosu zaznaczenia |
| Wyjątki lokalne | Przepis globalny → wariant → ustawienia instancji → widoczny stan | Testy wartości i pierwszeństwa selektorów CSS |
| Rodziny oznaczają widoki | Lista całych widoków jest oddzielona od palet pięciu trybów | Test katalogu widoków |
| Wykrywanie dalszych części | Odczytany DOM uzupełnia bibliotekę także o nowe i ukryte elementy | Test nieznanej grupy i ukrytego zdjęcia |
| Zdjęcia osobno od tła | Grafiki i fragmenty ilustracji mają osobny rodzaj, przepis oraz kadr | Test klasyfikacji zdjęcia w hierarchii; kontrola selektorów |
| Atomy treści | Wszystkie osiem dotychczasowych ról jest we wspólnym katalogu | Test kompletności ról; bez zmiany schematu zapisanych przepisów |

Katalog zawiera definicje części oraz deklarowane rodziny od razu. Szczegółowe gałęzie kolejnych widoków są uzupełniane z ich rzeczywistego DOM podczas otwierania podglądu. Nie uruchamiamy w tle wszystkich ekranów gry jednocześnie.

## 4. Podglądy i ustawienia

| Wymaganie | Implementacja | Sprawdzenie |
|---|---|---|
| Żywe dodatkowe części | Izolowany podgląd jest rzeczywistym ekranem gry, z tym samym szkicem | Kontrola komunikacji iframe i budowanie |
| Numer + tekst | Przykład zawiera widoczne kółko z cyfrą i etykietę | Kontrola szablonu |
| Pełna szerokość / pary kontrolek | Usunięte ograniczenia szerokości; dwie kolumny przy dostatecznym miejscu | Kontrola CSS |
| Jednolite, niższe grupy | Zwarte nagłówki, obrys, pogrupowane kontrolki | Kontrola CSS |
| Kolor tła i tekstu | Oddzielna rozwijana grupa w obu edytorach | Kontrola szablonów |
| Wejście i wyjście | Dodany jednorazowy fade; osobny czas przejścia i opcjonalna droga | Test walidacji stylów; kontrola jednorazowego wykonania |
| Wygodne suwaki | Zmiana w izolowanym podglądzie przesyła szkic bez przeładowania ekranu | Kontrola aktualizacji podglądu |
| Ograniczenie zbędnej pracy | Cache katalogu i klasyfikacji węzłów; jeden dodatkowy podgląd naraz | Kontrola kodu |

## Weryfikacja

- Dwa przebiegi kontroli kodu i poprawek.
- 191 testów, wszystkie przechodzą.
- Poprawne budowanie Studio i przygotowanie wspólnego kodu dla testowego PWA.
- Zachowany plik ustawień rewizji 26: SHA-256 `292b1f444158c15c7937ad89292854e791edd4150a5cad097afa3f63336d96f0`.
- Zgodnie z poleceniem użytkownika bez ręcznego przeglądu przeglądarki i bez pomiarów na telefonie. Wiersze z kontrolą szablonu/CSS oznaczają sprawdzenie kodu, nie potwierdzenie wyglądu na urządzeniu.
