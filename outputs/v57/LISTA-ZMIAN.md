# v57 — ramki, dialogi i skład księgi

Lokalna propozycja do oceny, 21.10.2026. Branch: `work/card-border-directions-v57`.

## Podglądy

- [Ramki A–F i suwaki](http://127.0.0.1:8874/design-system/?adventureTab=effects#adventure)
- [Tester dialogów i biblioteka postaci](http://127.0.0.1:8874/design-system/?adventureTab=cast#adventure)
- [Księga](http://127.0.0.1:8874/?studio=1&screen=campaign-book&viewId=campaign-book)
- [Lokalne PWA](http://127.0.0.1:8874/)

## Ramki do wyboru

| Wariant | Charakter |
| --- | --- |
| A · Złota nić | Cienki złoty kontur i wędrujące refleksy |
| B · Żywe wyładowanie | Najbliżej elektrycznej referencji: nieregularny, gorący kontur |
| C · Opalowe szkło | Perłowy brzeg, turkus i róż |
| D · Gwiezdny pył | Złote komety i odrywające się świetliki |
| E · Kryształowa energia | Chłodne, ostre fasety i lawendowa energia |
| F · Płynna zorza | Trzy płynące pasma koloru |

- Usunięto ciemne wypełnienie i rozjaśnianie napisów z v56. Efekt zajmuje wyłącznie ramkę i jej otoczenie.
- Ruch, rozbłyski i drobinki działają w rzeczywistym rendererze gry. Podglądy nie są statycznymi makietami.
- Wybór A–F, porównanie obok siebie i powiększenie karty 1:1.
- Osiem szerokich suwaków: światło 0–5×, poświata 0–64 px, rdzeń 0,4–8 px, odkształcenie 0–4×, tempo 0,1–4×, drobinki 0–96, ich zasięg 0,25–3× i wielkość 0,3–3×.
- Każdy wariant ma osobne tymczasowe ustawienia. Reset dotyczy tylko wybranego wariantu. Można skopiować parametry.
- Dopiero **Zastosuj w grze** dodaje wybrany przepis do szkicu. **Zapisz lokalnie** przenosi szkic do lokalnego PWA. Samo poruszanie suwakami nie zmienia zapisanego projektu.
- Jedna pętla rysowania na laboratorium, około 30 odświeżeń/s, ograniczona rozdzielczość płótna; pauza poza widokiem, przy ukrytej karcie i dla reduced motion. Nie wykonywano pomiaru GPU fizycznego iPhone'a.

## Dialogi i grafiki

- Wygenerowano 16 osobnych ilustracji wychylania: Iskierka, Iskier i 14 NPC. Przy wejściu z boku używana jest nowa poza; przy opcji **Cała postać** pozostaje pełna sylwetka.
- Prawe wejście kieruje bohatera do środka. Usunięto dodatkowy obrót starej stojącej sylwetki dla nowych póz. Na telefonie ukryta krawędź pozy dochodzi do brzegu ekranu.
- Każdy NPC ma trzy odrębne spotkania w swoim świecie: łącznie 42. Dla pierwszej postaci są to kroki 4, 8 i 11, dla drugiej 7, 13 i 14.
- Spotkania zawierają wypowiedź NPC i odpowiedź przewodnika. Wspólne przyciemnienie pozostaje pomiędzy wypowiedziami; rozmiar dymka zmienia się płynnie.
- Rozmowy trafiają do odkrytych stron księgi. Nie odkrywają przyszłych wpisów. Ręcznie nadpisana treść kroku ma pierwszeństwo.
- Zakładka **Dialogi i postacie** ma wybór świata, przewodnika, wejścia, siatkę 15 kroków z oznaczeniem NPC, odtwarzanie sceny, poprzednią/następną scenę oraz szybkie powitanie, portal i combo.
- Biblioteka wszystkich NPC przełącza także właściwy świat. Kliknięcie pola mapy odświeża wybrany krok testera.

Grafiki: wbudowane narzędzie **image_gen**, z istniejącymi postaciami jako wzorcem tożsamości. [Pełny zestaw promptów i źródeł](pose-generation.json). Oryginały i eksporty WebP: `outputs/v57/library/`. Końcowe pliki są zapisane także w lokalnej bibliotece `assets/managed/`; [manifest](../../shared/campaign-peek-assets.mjs) zawiera ich wymiary i skróty. Szesnaście eksportów zajmuje 1 651 694 B. Pliki binarne nie wchodzą do commita aplikacji.

## Księga

- Pierwszy akapit bez wcięcia. Ozdobny inicjał ma wysokość dwóch wierszy; trzeci zaczyna się od lewego marginesu.
- Kolejne akapity mają wcięcie połowy szerokości inicjału. Krótkie polskie przyimki i spójniki pozostają przy kolejnym słowie. Zachowano kontrolę wdów i sierot.
- Usunięto blokowanie całego pierwszego zdania przy inicjale, które psuło opływanie i skład.
- Wyjście strony: tekst i ilustracje rozpadają się w drobinki, wiatr unosi je w jednym kierunku, zmniejsza i rozmywa.
- Wejście: ponownie spokojne wyłanianie tekstu wierszami. Usunięto składanie nowej strony z cząsteczek.
- Pozostają dwie strony w poziomie i cztery kolumny przy odpowiedniej szerokości.
- [Referencja zasad składu wskazana przez użytkownika](https://www.smartly-designed.pl/profesjonalny-sklad-ksiazki/).

## Sprawdzenie

- 9 testów dotyczących ustawień efektów, spotkań i odkrywania opowieści przeszło; po ostatniej zmianie priorytetu ręcznej treści powtórzono 5 testów opowieści.
- Ograniczony test przeglądarkowy: sześć różnych animowanych ramek, szerokie suwaki bez zmiany szkicu, reduced motion, dialog Mira → Iskier, pełna sylwetka, prawa poza, dwuwierszowy inicjał, rozdmuchiwanie strony i dwie strony w poziomie. Poprawki po wykrytych błędach sprawdzano w tym samym zakresie; bez pełnej regresji aplikacji.
- 16/16 plików biblioteki zweryfikowano przez lokalne HTTP: status, WebP, liczba bajtów i SHA-256.
- Build lokalny przechodzi. Rejestr i kontrakty mają po 53 widoki. Podglądy sprawdzono też w przeglądarce aplikacji.
- Źródła generowania wyłączono z paczki PWA, aby nie wysyłać jej wielkich plików roboczych.

Nie publikowano zmian ani grafik na Vercelu/GitHubie. Nowe grafiki mają zweryfikowany przepływ lokalny; publikacja biblioteki i test fizycznego telefonu pozostają osobnymi etapami.
