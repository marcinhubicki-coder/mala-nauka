# Mała Nauka · Design System v1

Panel: `/design-system/` na branchu **design/system-v1**. To wspólny kontrakt wyglądu, komponentów i ilustracji oraz narzędzie do jego edycji.

## Zacznij od panelu

1. **Komponenty**: wybierz tryb oraz widok/stan. Telefon ma rzeczywisty viewport **390 × 844 pt**. Zaznacz „Wskaż komponent”, aby kliknąć element gry i zobaczyć pomiar.
2. Zmieniaj wysokość, szerokość, padding, gap, promień, cień i animację suwakiem lub liczbą. Podgląd korzysta z rzeczywistych rendererów gry.
3. Zakres **Wszędzie** zmienia wspólny komponent. Zakres **Tylko ten widok** zapisuje jawny wyjątek. Powiązane widoki są dostępne w inspektorze.
4. **Typografia** pokazuje rodziny, role, powiązane widoki i deklaracje CSS. „Scal / zamień” przenosi role na wybraną rodzinę.
5. **Assety i słowa**: szukaj hasła, obejrzyj miniaturę, zmień ilustrację lub treść zasady. Upload PNG/JPG/WebP/AVIF, do 12 MB, dla ilustracji słowa proporcja 1:1.
6. **Połącz GitHub**: fine-grained token dla tego repozytorium, `Contents: Read and write`. Token istnieje wyłącznie w pamięci bieżącej karty.
7. **Zapisz na GitHub**: przejrzyj zmianę i podaj opis. Jeden commit obejmuje tokeny, przypisania, nowe pliki oraz edytowane paczki słów. Vercel buduje nowy preview.

Szkic tokenów jest zapisywany w przeglądarce. Binaria uploadów i edytowane paczki przechowuje IndexedDB. Szkic nie jest wspólną wersją dla innych branchy; udostępnia go dopiero commit. Wersje pozwalają cofnąć zmianę, importować/eksportować JSON, przywrócić wcześniejszy szkic i otworzyć historię Git.

## Dokumenty

| Dokument | Zakres |
| --- | --- |
| [Zasady i tokeny](principles.md) | Wzorzec ortografii, cień z angielskiego, geometria, warianty, Retina |
| [Komponenty i widoki](components.md) | Katalog, stany, warunki, relacje, fonty |
| [Assety i branche](assets-and-branches.md) | Jedna baza, deduplikacja, konsumenci, caching |
| [Zapis i rozwój](development.md) | Git, konflikty, pliki, build, porządkowanie, zasady mockupów |
| [Weryfikacja](verification.md) | Testy, przegląd wizualny, granice symulacji |

Źródłami prawdy są `config.json`, `registry.json` i `assets.json`. Dokumentacja wyjaśnia kontrakt; nie tworzy drugiej kopii jego wartości.
