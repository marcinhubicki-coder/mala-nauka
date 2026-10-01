# Ortografia — kontrakt danych słów, ilustracji i statystyk

> **Status:** źródło prawdy dla dodawania nowych słów do modułu ortografii.
>
> Ten dokument opisuje cały pipeline: rekord słowa → zasada `learning` → ilustracja → mapowanie sceny → PWA/offline → dane zapisywane do statystyk. Nowe paczki słów powinny przechodzić przez cały ten proces, a nie tylko zostać dopisane do JSON.

## 1. Pliki źródłowe

Najważniejsze miejsca:

- `data/words-01.json` … `data/words-08.json` — baza słów;
- `game.mjs` — walidacja podstawowego rekordu i zapis prób;
- `spelling/learning.mjs` — kontrakt danych edukacyjnych;
- `spelling/scenes.mjs` — mapowanie słowo → ilustracja;
- `assets/scenes/` — finalne assety obrazkowe;
- `assets/scenes/generated-batch-vNN.json` — manifest wygenerowanych obrazów i promptów;
- `assets/scenes/uploaded-batch-vNN.json` — manifest ręcznie dodanych obrazów;
- `sw.js` — cache PWA/offline;
- `tests/word-learning.test.mjs` — test spójności bazy i `learning`;
- `progress.mjs` i `player-service.mjs` — zapis wyników per profil.

Pliki `words-XX.json` są shardami technicznymi, a nie identyfikatorami kategorii. Nowe słowa najlepiej dopisywać obok podobnej kategorii ortograficznej. Nie ma limitu 50 rekordów na plik.

Jeśli kiedyś powstanie `words-09.json`, trzeba równocześnie zmienić loader w `app.js`, testy, które obecnie wczytują 8 plików, oraz listę cache w `sw.js`. Dlatego przy zwykłych paczkach lepiej dopisywać rekordy do istniejących shardów.

---

## 2. Kanoniczny rekord słowa

Nowe słowo ma mieć pełny rekord w tym formacie:

```json
{
  "word": "marzenie",
  "masked": "ma_enie",
  "category": "rz/ż",
  "options": ["rz", "ż"],
  "answer": "rz",
  "difficulty": 2,
  "tags": [],
  "learning": {
    "type": "memory",
    "title": "Rodzina wyrazów z „rz”",
    "explanation": "Marzenie, marzyć i marzyciel zapisujemy przez rz. Zapamiętaj wspólny zapis w tej rodzinie i skojarz go z obrazkiem.",
    "examples": [],
    "relatedWords": ["marzyć", "marzyciel", "marzycielka", "marzycielski", "marzeniowy"],
    "forms": ["marząc", "marzenia", "marzeniu", "marzeniach"],
    "sources": [
      {
        "label": "WSJP PAN: marzenie",
        "url": "https://wsjp.pl/haslo/podglad/20483/marzenie"
      }
    ]
  }
}
```

### Pola podstawowe

| Pole | Zasada |
| --- | --- |
| `word` | Kanoniczna poprawna forma. Musi być unikalna w całej bazie. Jest obecnie stabilnym kluczem słowa także dla statystyk. |
| `masked` | Dokładnie jedna luka `_`. Po zastąpieniu jej wartością `answer` musi powstać dokładnie `word`. |
| `category` | Jedna z kategorii: `u/ó`, `rz/ż`, `ch/h`, `ć/ci`, `ś/si`, `ź/zi`, `ń/ni`, `dź/dzi`. |
| `options` | Dokładnie dwie różne odpowiedzi, zgodne z elementami `category`. |
| `answer` | Jedna z wartości `options`; po wstawieniu w lukę odtwarza `word`. |
| `difficulty` | Tylko `1` lub `2`. |
| `tags` | Lista dodatkowych pul. Dla nowych rekordów zapisujemy ją jawnie, nawet jeśli jest pusta. Obecnie funkcjonalnie używany jest tag `dyktando`. |
| `learning` | Obowiązkowy projektowo dla każdego nowego słowa. Popup „Zasada” korzysta bezpośrednio z tego obiektu. |

Kod walidujący dopuszcza brak `learning` dla zgodności wstecznej, ale **w aktualnej bazie wszystkie słowa mają `learning` i nowych rekordów bez niego nie dodajemy**.

### Stabilność `word`

`validateWords()` wymusza unikalność pola `word`, a zapis próby przechowuje właśnie `word`. Dlatego:

- po opublikowaniu słowa nie zmieniamy arbitralnie jego pisowni ani wielkości liter;
- poprawka kanonicznej formy istniejącego słowa wymaga potraktowania tego jako migracji danych statystycznych;
- nie dodajemy dwóch rekordów z tym samym `word` dla dwóch różnych luk — aktualny model tego nie obsługuje;
- nie dokładamy osobnego `wordId` tylko nowym rekordom. Jeśli kiedyś przejdziemy na osobne ID, migracja powinna objąć całą bazę naraz.

---

## 3. Kategorie i trudność

Aktualne kategorie pochodzą z `CATEGORIES` w `game.mjs`:

```text
u/ó
rz/ż
ch/h
ć/ci
ś/si
ź/zi
ń/ni
dź/dzi
```

`difficulty` nie oznacza poziomu opanowania przez konkretne dziecko. To cecha pytania:

- **1** — częstsze, prostsze, bardziej oczywiste lub podstawowe słowo;
- **2** — mniej oczywiste, rzadsze, trudniejsze do zapamiętania albo wymagające mniej bezpośredniej reguły.

System adaptacyjny/statystyczny może później łączyć tę wartość z historią odpowiedzi, ale nie należy zmieniać `difficulty` tylko dlatego, że konkretne dziecko popełnia błąd.

Globalnie każda kategoria musi nadal zawierać co najmniej jedno słowo poziomu 1 i 2.

---

## 4. Tag `dyktando`

Tag działa funkcjonalnie: `createSource()` wybiera do trybu Dyktando **wszystkie** słowa z:

```json
"tags": ["dyktando"]
```

Aktualnie takich rekordów jest **dokładnie 80**, a liczba pytań w Dyktandzie jest ustawiana na długość tej puli.

Dlatego:

- **nie dodawaj automatycznie tagu `dyktando` do nowych słów**;
- nowy rekord dostaje domyślnie `"tags": []`;
- jeśli użytkownik wyraźnie prosi o zmianę zestawu Dyktanda, utrzymaj docelową liczbę 80 przez świadomą wymianę słów albo osobno zmień mechanikę limitu;
- po każdej zmianie tagów policz pulę ponownie.

To zabezpiecza tryb 80 pytań przed przypadkowym wzrostem do 81, 90 itd.

---

## 5. Obiekt `learning`

Dozwolone typy są zdefiniowane w `spelling/learning.mjs`:

| `type` | Etykieta UI | Kiedy używać |
| --- | --- | --- |
| `exchange` | Pisownia wymienna | Istnieje prawdziwa, czytelna wymiana ortograficzna, np. `łóżko → łoże`, `ucho → uszy`. |
| `pattern` | Reguła | Słowo wynika z konkretnej reguły, np. `rz` po spółgłosce, `-ówka`, zapis zmiękczenia przed samogłoską. |
| `exception` | Wyjątek | Słowo jest znanym wyjątkiem od konkretnej reguły, np. `skuwka`. |
| `memory` | Zapamiętaj | Brak prostej bezpiecznej reguły/wymiany; lepiej zapamiętać zapis i rodzinę wyrazów niż tworzyć sztuczne wyjaśnienie. |

### Kontrakt `learning`

```json
{
  "type": "exchange",
  "title": "Ó wymienia się na o",
  "explanation": "Łóżko zapisujemy przez ó. Pomaga w tym pokrewne słowo łoże: ó wymienia się na o.",
  "examples": [
    {
      "from": "łóżko",
      "to": "łoże",
      "change": "ó ↔ o"
    }
  ],
  "relatedWords": ["łoże", "łóżeczko", "łóżkowy"],
  "forms": ["łóżka", "łóżku", "łóżkiem"],
  "sources": [
    {
      "label": "SJP PWN: łóżko",
      "url": "https://sjp.pwn.pl/szukaj/%C5%82%C3%B3%C5%BCko.html"
    }
  ]
}
```

Walidator wymaga:

- `type` — jeden z czterech typów;
- `title` — niepusty tekst, maks. 120 znaków;
- `explanation` — niepusty tekst, maks. 600 znaków;
- `examples` — tablica maks. 12 elementów;
- każde `example`: `from`, `to`, `change`;
- `relatedWords` — unikalne teksty, maks. 24;
- `forms` — unikalne teksty, maks. 24;
- `sources` — maks. 6 źródeł;
- każdy URL musi być `https://`.

### Zasady jakości

1. **Nie wymyślaj reguły.** Jeśli związek jest wątpliwy, użyj `memory`.
2. `exchange` stosuj tylko wtedy, gdy para rzeczywiście pomaga uzasadnić pisownię badanego znaku.
3. `relatedWords` to rodzina/wyrazy blisko związane znaczeniowo i słowotwórczo, a nie losowe słowa z tą samą literą.
4. `forms` to rzeczywiste odmiany/formy wyrazu. Zostaw `[]` tylko dla wyrazów faktycznie nieodmiennych.
5. Dla każdego nowego słowa preferuj:
   - co najmniej jedno źródło słownikowe: SJP PWN lub WSJP PAN;
   - źródło reguły, np. ZPE, jeśli `type` to `pattern`, `exchange` lub `exception`.
6. Tekst ma być krótki i zrozumiały dla dziecka. Popup nie jest artykułem językoznawczym.

---

## 6. Ilustracja słowa

### Gdzie trafia plik

Finalne ilustracje są lokalne:

```text
assets/scenes/<slug>.webp
```

Dla nowych generowanych grafik preferujemy WebP. Nie trzeba przepisywać istniejących JPG/AVIF.

Slug:

- małe litery;
- bez polskich znaków;
- bez spacji;
- stabilny i czytelny;
- przykłady: `źródło → zrodlo.webp`, `dźwignia → dzwignia.webp`, `żarówka → zarowka.webp`.

### Mapowanie

Dla nowych słów preferowany jest `WORD_SCENES` w `spelling/scenes.mjs`:

```js
['marzenie', {
  key: 'marzenie',
  asset: 'marzenie.webp',
  layouts: ['bubble']
}],
```

`sceneFor(masked, word)` najpierw sprawdza `WORD_SCENES`, dopiero potem starsze mapowanie `SCENES` po `masked`.

**Nowych słów nie dodajemy do legacy `SCENES`, jeśli nie ma konkretnego powodu.** Mapowanie po pełnym `word` jest jednoznaczniejsze i bezpieczniejsze.

### Styl generowania

Nowe ilustracje mają być zgodne z zaakceptowaną biblioteką ortografii:

- kwadrat, źródło wysokiej jakości; obecne referencyjne generacje używają ok. **1254×1254 px**;
- ciepły, dopracowany **storybook / 3D animated-film look**;
- miękkie, przyjazne kształty, naturalne tekstury, subtelne pastelowe akcenty;
- dobre światło, głębia, szczegółowość wystarczająca dla Retina;
- jeden natychmiast rozpoznawalny temat odpowiadający znaczeniu słowa;
- najważniejszy obiekt i twarze mieszczą się bezpiecznie w centralnych ok. **65–70% kadru**;
- dużo marginesu scenicznego, ponieważ obraz jest maskowany organiczną bańką;
- tło dochodzi do wszystkich krawędzi;
- **zero tekstu, liter, cyfr, napisów, plansz, UI, ramek, baniek, logotypów i watermarków**;
- nie kodujemy odpowiedzi ortograficznej w samym obrazie — grafika ilustruje znaczenie, nie podpowiada literą;
- anatomia i geometria przedmiotów muszą być spójne;
- klimat bezpieczny i przyjazny dzieciom;
- tam, gdzie pasuje, preferujemy sceny zewnętrzne i miejskie/naturalne zamiast ciągłych wnętrz;
- różnicujemy bohaterów: dzieci i dorośli, chłopcy i dziewczynki, włosy, ubrania, wiek, otoczenie;
- unikamy powtarzania tej samej postaci i tej samej kompozycji w kolejnych słowach;
- domyślnie **jedna unikalna ilustracja na nowe słowo**. Reuse jest dozwolony tylko świadomie dla bardzo bliskich form/pojęć, gdy ta sama scena rzeczywiście pomaga w nauce.

Najlepszymi technicznymi referencjami promptów są najnowsze manifesty `assets/scenes/generated-batch-vNN.json`.

### Wzorzec promptu

```text
Use case: illustration-story. Create ONE square, high-definition illustration
for a Polish children's spelling game, word <SŁOWO>. NO text anywhere.

Warm, highly polished storybook 3D animated-film look; friendly rounded forms,
natural textures, warm light, pastel highlights, cinematic depth of field.
The subject must be immediately recognizable and fit completely inside the
central 65–70% of the square with generous scenic margins for an organic bubble crop.
Full scenic background to all edges.

Scene: <JEDNOZNACZNY OPIS ZNACZENIA SŁOWA I AKCJI>.

No text, letters, numbers, UI, buttons, cards, soap bubbles, frames, logos or
watermarks. Keep anatomy and object construction coherent. Child-friendly tone.
```

Prompt należy doprecyzować pod znaczenie słowa; nie generujemy serii przez mechaniczne podmienianie jednego rzeczownika w identycznej scenie.

---

## 7. Manifest paczki obrazów

Dla paczki wygenerowanej przez model zapisujemy manifest, np.:

```json
{
  "version": 27,
  "generator": "Built-in image_gen",
  "images": [
    {
      "source": "<id lub nazwa źródła>",
      "asset": "marzenie.webp",
      "words": ["marzenie"],
      "prompt": "<pełny prompt użyty do generacji>",
      "framingRefinement": "<opcjonalnie: korekta kadru>"
    }
  ]
}
```

Plik:

```text
assets/scenes/generated-batch-v27.json
```

Numer `vNN` ma być kolejnym wolnym numerem. Dla uploadów ręcznych używamy analogicznie `uploaded-batch-vNN.json`.

Manifest jest historią pochodzenia assetu. Nie zastępuje mapowania w `spelling/scenes.mjs`.

---

## 8. PWA i offline — obowiązkowy krok

Nowy obraz może działać online i jednocześnie nie działać offline. Dlatego każda paczka musi aktualizować `sw.js`.

Dla każdego nowego assetu dodaj:

```js
"./assets/scenes/marzenie.webp",
```

do `CORE`.

Jeśli dodajesz nowy manifest i ma być dostępny offline, dodaj również jego ścieżkę.

Po zmianie danych/assetów należy także podbić wartość:

```js
const CACHE = 'mala-nauka-...';
```

Jeśli podmieniasz zawartość istniejącego pliku obrazu pod tą samą nazwą, sprawdź także wersję query używaną przez `sceneUrl()` w `spelling/scenes.mjs` i podbij ją, aby Safari/PWA nie trzymało starego obrazu.

---

## 9. Gotowość pod statystyki

### Co jest już zapisywane

Po każdej odpowiedzi ortograficznej `Session.answer()` zapisuje do `attempts` snapshot:

```text
kind
word
masked
answer
selected
correct
category
difficulty
learning
```

Po zakończeniu rundy wynik zawiera m.in.:

```text
id
playerId
mode
config (category, difficulty, duration, dyktando)
correct
wrong
date
early
attempts
```

Dane są zapisywane per profil użytkownika przez `player-service.mjs`.

Dzięki temu obecny model pozwala później liczyć m.in.:

- skuteczność per `word`;
- liczbę prób i błędów per słowo;
- skuteczność per kategoria;
- skuteczność per poziom trudności;
- wyniki dla typów zasad `learning.type`;
- wyniki dla puli `dyktando`;
- ostatnią poprawną/niepoprawną próbę;
- historię konkretnej rundy.

### Ważne ograniczenia aktualnego storage

`progress.history` przechowuje obecnie maksymalnie **50 ostatnich rund**. To wystarcza do bieżącego UI i podstawowych statystyk, ale nie jest jeszcze pełnym długoterminowym magazynem mastery.

Jeżeli później powstanie dashboard rodzica / system `Ćwiczę → Utrwalam → Umiem`, należy dodać agregat per słowo albo dłuższą warstwę historii. **Nie wymaga to zmiany rekordów nowych słów**, o ile zachowamy stabilne `word`, `category`, `difficulty`, `tags` i `learning.type`.

Czas odpowiedzi istnieje w sesji jako `lastResponseMs` / `recentAnswers`, ale obecnie nie jest zapisywany w trwałym `attempts`. Jeśli statystyki mają pokazywać szybkość odpowiedzi, to jest osobna zmiana schematu wyników, a nie pola rekordu słowa.

---

## 10. Procedura: „dodaj X nowych słów”

Gdy polecenie brzmi w rodzaju:

> „Dodaj 30 nowych słów do ortografii, wygeneruj grafiki według wytycznych i dodaj wszystkie wymagane pola.”

należy wykonać **cały** poniższy pipeline:

1. Sprawdź całą bazę i usuń z listy kandydatów duplikaty.
2. Wybierz dokładnie X nowych, sensownych słów.
3. Dla każdego ustal `category`, `masked`, `options`, `answer`, `difficulty`.
4. Ustaw `tags: []`, chyba że użytkownik wyraźnie prosi o konkretny tag.
5. Zbuduj pełny `learning`:
   - wybierz właściwy typ;
   - dodaj zwięzłe wyjaśnienie;
   - dodaj odmiany, jeśli słowo się odmienia;
   - dodaj rodzinę wyrazów, jeśli pomaga;
   - dodaj przykład wymiany tylko wtedy, gdy jest prawdziwy;
   - dodaj źródło słownikowe i — gdy ma zastosowanie — źródło reguły.
6. Dodaj rekord do właściwego `data/words-XX.json`.
7. Wygeneruj unikalną ilustrację w stylu opisanym wyżej.
8. Zapisz finalny asset w `assets/scenes/`.
9. Dodaj wpis do `WORD_SCENES`.
10. Dodaj/uzupełnij manifest `generated-batch-vNN.json`.
11. Dodaj asset do `CORE` w `sw.js` i podbij cache.
12. Jeżeli podmieniono plik pod istniejącą nazwą, podbij też wersję assetów w `sceneUrl()`.
13. Uruchom walidację i testy.
14. Sprawdź PWA/offline i kadrowanie w bańce.
15. Commituj paczkę z komunikatem opisującym liczbę nowych słów.

Nie uznajemy słowa za „dodane”, dopóki rekord, `learning`, ilustracja, mapowanie i offline nie są kompletne.

---

## 11. Checklista walidacyjna paczki

Po dodaniu X słów sprawdź:

- [ ] liczba rekordów wzrosła dokładnie o X;
- [ ] brak duplikatów `word`;
- [ ] każde `masked` ma dokładnie jedną lukę;
- [ ] `masked.replace('_', answer) === word`;
- [ ] każda kategoria jest dozwolona;
- [ ] `options` ma dokładnie dwa unikalne elementy zgodne z kategorią;
- [ ] `difficulty` to 1 albo 2;
- [ ] każde nowe słowo ma pełny `learning`;
- [ ] każdy `learning` przechodzi `validLearning()`;
- [ ] każda forma w `forms` jest poprawna językowo;
- [ ] każde słowo ma źródło słownikowe;
- [ ] reguły nie są naciągane — w razie wątpliwości użyto `memory`;
- [ ] każdy nowy wyraz ma wpis w `WORD_SCENES`;
- [ ] każdy wskazany asset istnieje fizycznie w `assets/scenes/`;
- [ ] główny temat grafiki mieści się bezpiecznie w organicznym cropie;
- [ ] nowe assety są w `sw.js`;
- [ ] wersja cache została podbita;
- [ ] liczba słów `dyktando` nadal wynosi 80, jeśli użytkownik nie zlecił zmiany;
- [ ] `tests/word-learning.test.mjs` przechodzi;
- [ ] moduł uruchamia się bez błędu `Niepełna baza słów` / `Nieprawidłowy rekord słowa`;
- [ ] nowe słowa działają po odłączeniu sieci po poprawnym przygotowaniu PWA.

---

## 12. Minimalny raport po wykonaniu paczki

Po zakończeniu zadania raport powinien podać:

- liczbę dodanych słów;
- zakres/kategorie;
- liczbę wygenerowanych nowych grafik i ewentualnych świadomych reuse;
- liczbę rekordów `learning`;
- status walidacji;
- status PWA/offline;
- informację, czy zmieniono pulę Dyktanda;
- commit SHA i branch.

To pozwala szybko stwierdzić, czy paczka jest kompletna, bez ręcznego przeglądania wszystkich plików.

---

## 13. Zasada nadrzędna

**Baza ortografii nie jest tylko listą pytań.** Jedno słowo jest kompletną jednostką edukacyjną:

```text
poprawna forma
→ luka i warianty odpowiedzi
→ kategoria i trudność
→ zasada / pamięciowe wyjaśnienie
→ odmiany i rodzina słów
→ źródła
→ ilustracja
→ mapowanie
→ cache offline
→ stabilny klucz do statystyk
```

Jeżeli któryś z tych elementów jest pominięty, nowa paczka nie jest jeszcze zakończona.
