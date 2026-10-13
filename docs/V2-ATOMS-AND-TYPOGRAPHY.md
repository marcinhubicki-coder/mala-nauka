# Mała Nauka — Design System v2: atomy, grupy, rodziny

Data: 13.10.2026. Status: migracja etapowa, bez zmian w produkcyjnym `main`.

## 1. Jedna funkcja = jeden atom

Bazowy słownik jest w `shared/atom-vocabulary.mjs`. Zawiera **13 rodzajów atomów**: tekst, ikona, obraz, przycisk, input, opcja wyboru, przełącznik, suwak, pasek postępu, zegar, etykieta, powierzchnia i klawisz PIN.

To **rodzaje / odpowiedzialności**, a nie 13 widocznych elementów UI. Receptura `button-back` jest jednym wariantem przycisku z konkretną rolą, a nie nową klasą atomu. Kolor, rozmiar, animacja, stan, ikona, treść i tryb gry są właściwościami istniejącego elementu.

Grupa ma jedną logiczną funkcję (np. karta gracza, segment opcji, kafel przygody, nagłówek misji). Rodzina składa się z grup w konkretny ekran lub większą sekcję (np. Home). Dwa niezależne przyciski ułożone obok siebie nie tworzą nowej grupy funkcjonalnej.

Obecny audyt pokazuje ok. **60 współdzielonych klocków** (atomów, grup i rodzin) widocznych w uproszczonej bibliotece. Pełne inwentarze pozostają dostępne w trybie „Wszystkie szczegóły”. Nie należy mylić tego z **1764 wystąpieniami** elementów we wszystkich 41 wyrenderowanych stanach.

## 2. Typografia

Źródło prawdy: `shared/type-system.mjs`. **Jeden atom `Text`** ma dziesięć styli wizualnych: H1, H2, H3, H4, H5, H6, H7, H8, H9 i Body. H7–H9 to nazwy stylów, nie HTML `<h7>` itd.; dostępna semantyka nagłówków w HTML kończy się na h6. W razie potrzeby tekst H7–H9 może nadal być semantycznym nagłówkiem niższego poziomu albo etykietą w odpowiedniej strukturze HTML, zależnie od funkcji.

Każdy styl definiuje centralnie:
- `size` — rozmiar pisma;
- `weight` — grubość;
- `lineHeight` — interlinia;
- `tracking` — odstępy między literami;
- `fontRole` — jedna z rodzin: body, ui, display, flag.

Projekt nie otrzymał nowych 10 osobnych fontów. Istniejące cztery rodziny fontów są wielokrotnie wykorzystywane.

Skalę edytuje się w panelu **Fonty** Design Studio lub przez ten sam silnik poleceń:

```bash
npm run studio:engine -- inspect-type --style h2
npm run studio:engine -- set-type --style h2 --property size --value 40
npm run studio:engine -- set-type --style h2 --property size --value 40 --apply
```

Styl konkretnego tekstu (po uprzednim znalezieniu rzeczywistego ID):

```bash
npm run studio:engine -- search --query "Sprawdź swoje postępy"
npm run studio:engine -- set --view home --id home-headline --property typeStyle --value h2
```

Polecenia bez `--apply` nie zapisują zmian. W transakcyjnych pakietach można używać `{"type":"typography","style":"h2","property":"size","value":40}` wraz z operacjami typu `style` dla konkretnego elementu.

## 3. Bramka zgodności (ważniejsze od liczby testów)

**Wersja produkcyjna jest wizualnym wzorcem.** Skala została dołączona w trybie opt-in: bez przypisania `typeStyle` zachowujemy dotychczasowe fonty i wielkości. Nie wolno masowo przypisywać H1–H9 na podstawie nazw znaczników bez testu wizualnego i sprawdzenia miejsca w hierarchii.

Każdy etap musi przejść:
1. Wspólny model: walidacja stylów, możliwości typograficznych i kontraktów komponentów.
2. Jedna zmiana w Studio lub CLI wpływa na te same instancje w PWA; lokalny wyjątek nie narusza innych.
3. Testy dotychczasowych scenariuszy i Vercel build.
4. Porównanie wizualne Home i Ortografii do zaakceptowanych zrzutów produkcyjnych, w szczególności na iPhonie.
5. Cofnięcie do poprzedniego punktu kontrolnego i ograniczenie nadmiarowych kosztów przed następnym etapem.

Pełne kontrakty rendererów nadal trzeba rozszerzać na pozostałe 40 widoków; obecny skompresowany inwentarz nie jest ich zamiennikiem.
