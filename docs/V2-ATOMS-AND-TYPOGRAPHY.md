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

## 4. Odkrywanie atomów i kontrola przeglądarkowa

Studio umożliwia wybór bazowego **Typu atomu** w katalogu wspólnych klocków, a następnie wskazanie konkretnej receptury i wystąpienia. Te same rodzaje można znaleźć z terminala:

```bash
npm run studio:engine -- search --query "powrot" --atom button
npm run studio:engine -- list --view spelling-results --atom text
```

Zmiany typograficzne i hierarchii kontrolujemy również za pomocą dwóch powtarzalnych testów przeglądarkowych, niezależnych od zestawu testów Node:

```bash
# Opcjonalna zależność tylko dla testowania — nie trafia do pakietu gry
npm install --no-save playwright
npx playwright install chromium

# W drugim terminalu, po npm test:
cd dist && python3 -m http.server 8765

# Następnie w katalogu repozytorium:
node tools/qa-typography-browser.mjs http://127.0.0.1:8765
node tools/qa-all-views-browser.mjs http://127.0.0.1:8765
```

Pierwszy test weryfikuje zapis H2, aktualizację zmiennej CSS, brak wpływu na inny tekst oraz przełączanie uproszczonego/szczegółowego katalogu. Drugi odwiedza wszystkie 41 prawdziwych scenariuszy, sprawdza obecność komponentów i błędy JavaScriptu. Nie zastępują pomiaru wydajności i testu dotykowego w Safari na iPhonie.

Do kompilowanego motywu dodano około **1,45 KB** nazwanych zmiennych typograficznych. To niewielki narzut; celowo nie dodano drugiego renderera tekstu ani osobnych plików dla H1–H9.
