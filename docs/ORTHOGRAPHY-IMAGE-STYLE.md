# Ortografia — styl ilustracji i promptowanie assetów

> **Status:** source of truth dla generowania nowych ilustracji słów w module Ortografia.
>
> **Cel:** utrzymać spójny wygląd, czytelność edukacyjną i techniczne wymagania assetów niezależnie od tego, czy obrazy generuje ChatGPT, Codex czy inny pipeline.
>
> Dokument podsumowuje kierunek wizualny i reguły wypracowane podczas seryjnego generowania ilustracji do słów ortograficznych.

---

## 1. Najważniejsza zasada

Każde słowo dostaje **jedną osobną ilustrację**, która ma być gotowym assetem gry.

Ilustracja ma:
- działać bez podpisu,
- pomagać dziecku skojarzyć obraz ze słowem,
- być atrakcyjna emocjonalnie,
- zachowywać wspólny świat wizualny,
- dobrze wyglądać po przycięciu przez ruchomą organiczną bańkę w UI,
- zachować **20% bezpiecznego marginesu z każdej strony**; cały motyw i sens akcji mieszczą się w środkowych **60% szerokości × 60% wysokości** kadru.

To nie są plansze edukacyjne, infografiki ani kolaże.

---

## 2. Format techniczny

### Obowiązkowe
- **proporcje 1:1**,
- preferowany plik źródłowy: **1254 × 1254 px** lub większy kwadrat,
- jedna scena na jeden plik,
- pełne tło do wszystkich krawędzi,
- bez ramek,
- bez przezroczystego marginesu,
- bez napisów, liter, numerów i etykiet,
- bez logo, watermarków i elementów UI.

### Kadrowanie pod ruchomą bańkę — obowiązkowe 20% marginesu
Gra przycina obraz **ruchomą organiczną maską („bańką”)**. Poszczególne brzegi ilustracji mogą być zakrywane w różnych fazach animacji; samo wycentrowanie twarzy lub tułowia nie wystarcza.

**Twarda reguła: 20% od każdego z czterech boków jest marginesem bezpieczeństwa.** Cały główny motyw i wszystkie elementy niezbędne do rozpoznania słowa muszą mieścić się w **środkowym prostokącie 60% szerokości × 60% wysokości**:
- poziomo: **x = 20–80% szerokości**;
- pionowo: **y = 20–80% wysokości**;
- dla **1254 × 1254 px**: margines ok. **251 px z każdej strony**, strefa bezpieczna **x ≈ 251–1003 px, y ≈ 251–1003 px**.

W strefie muszą znaleźć się **całe sylwetki**, w tym głowa, rogi, uszy, ogon, nogi, dłonie i kopyta, oraz istotne rekwizyty, gesty i kierunek akcji. Żaden z nich nie może być ucięty przez granicę bezpiecznego obszaru. **Obraz musi zachować czytelne znaczenie także wtedy, gdy cała zewnętrzna strefa 20% zostanie zakryta przez bańkę.**

Wewnętrzna strefa 60% × 60% jest **strefą treści, a nie strefą jedynie środka obiektu**. Zewnętrzne pasy 20% powinny mieć pełne, naturalne tło sceniczne (trawa, niebo, krajobraz, rozmyte otoczenie) aż do samej krawędzi — bez pustych obramowań, przezroczystości i sztucznego paddingu.

**Przykład: „kozioł”.** Całe zwierzę, **razem z rogami i kopytami**, powinno być wewnątrz środkowych 60% kadru. Góry, niebo, skały i łąka mogą dochodzić do brzegów. Poprzednia ilustracja kozła, której sylwetka wychodzi poza ten obszar, **nie spełnia wymagań**.

W razie naruszenia nie poprawiaj słabej kompozycji cropem: **wygeneruj ilustrację od nowa z dalszą kamerą / mniejszą skalą motywu**. W QA sprawdzaj również działanie ruchomej maski w różnych fazach animacji.
---

## 3. Docelowy styl wizualny

Kierunek:

**ciepła, wysokiej jakości ilustracja 3D typu storybook / cinematic family animation**, bez kopiowania stylu konkretnego studia, filmu lub artysty.

Cechy:
- miękkie, przyjazne, lekko zaokrąglone formy,
- bogate, ale nie przeładowane detale,
- duże i czytelne emocje,
- naturalne materiały i tekstury,
- głębia ostrości,
- delikatny bokeh,
- miękkie światło kontrowe,
- ciepłe promienie słońca,
- plastyczne, przyjemne twarze,
- atrakcyjny dla dzieci, ale nie infantylny wygląd,
- ilustracyjność wyraźniejsza niż fotorealizm.

Nie używać w promptach nazw konkretnych studiów, marek, filmów ani żyjących artystów jako referencji stylu.

### Bezpieczne sformułowanie stylu
Używaj np.:

> high-end cinematic 3D storybook illustration for children, warm family-animation aesthetic, expressive rounded characters, natural textures, soft depth of field, polished educational picture

---

## 4. Świat przedstawiony

Domyślnie preferowane są sceny **na zewnątrz**, ponieważ najlepiej pasują do wypracowanego klimatu.

Dobre lokacje:
- ogród,
- park,
- wiejska droga,
- kamienna uliczka,
- rynek małego miasteczka,
- pole,
- sad,
- łąka,
- las,
- góry,
- strumień,
- jezioro,
- plaża,
- boisko,
- podwórko,
- taras,
- plac budowy, jeśli wynika ze słowa.

Powtarzający się klimat:
- złota godzina,
- ciepłe popołudnie,
- kwiaty i zieleń,
- kamienne domy,
- łagodne pagórki,
- przyjazna, bajkowa codzienność.

Scena we wnętrzu jest w porządku, jeżeli słowo tego wymaga, np.:
- kuchnia dla „cukier”,
- klasa / gabinet naukowy dla „mózg”,
- sypialnia dla „łóżko”,
- warsztat dla „dźwignia”.

**Semantyka słowa ma pierwszeństwo przed wymuszaniem pleneru.**

---

## 5. Światło i kolor

Preferowany look:
- warm golden-hour lighting,
- miękkie złote światło,
- światło boczne lub od tyłu,
- subtelny rim light na włosach i sylwetce,
- przyjemne, nasycone kolory,
- pastelowe rozjaśnienia,
- naturalne zielenie, błękity i ciepłe czerwienie / pomarańcze,
- bez agresywnego neonu,
- bez ponurego gradingu, chyba że znaczenie słowa wymaga chwilowego kontrastu.

Nawet scena typu „groźny”, „ciemno”, „pożar” czy „burza” powinna pozostać **bezpieczna i edukacyjna dla dziecka**, a nie horrorowa.

---

## 6. Kompozycja

### Zasada główna
Obraz musi być czytelny w około sekundę.

Preferowane:
- jeden główny motyw,
- bohater lub obiekt na pierwszym planie,
- tło wspierające znaczenie,
- prosta linia akcji,
- wyraźny punkt skupienia wzroku,
- umiarkowana liczba rekwizytów,
- **cały główny motyw w centralnych 60% × 60%**, zewnętrzne 20% przy każdym boku tylko dla drugoplanowego tła.

### Liczba postaci
Najczęściej:
- 1 postać,
- 1 postać + zwierzę,
- 2 postacie w relacji.

Większa grupa tylko wtedy, gdy sama jest znaczeniem słowa:
- tłum,
- chór,
- urodziny,
- rodziców,
- każdy,
- hymn.

Nie dodawać ludzi wyłącznie po to, żeby „coś się działo”.

---

## 7. Różnorodność postaci

To jest wymaganie **na poziomie całej paczki**, nie pojedynczego obrazka.

Nie wolno generować dziesięciu wariantów tego samego dziecka.

Różnicować:
- wiek: małe dziecko, starsze dziecko, nastolatek, dorosły, senior,
- płeć postaci,
- kolor włosów: blond, brązowe, rude, czarne, siwe,
- długość włosów: bardzo krótkie, średnie, długie,
- strukturę: proste, falowane, kręcone,
- fryzury: warkocze, kucyk, kok, rozpuszczone, krótka fryzura,
- zarost u dorosłych mężczyzn,
- ubranie: codzienne, sportowe, ogrodniczki, sukienka, sweter, kurtka, strój roboczy, turystyczny itd.

### Praktyczna reguła batcha
Przed wygenerowaniem 8–10 grafik zaplanuj różnorodność całej paczki.

Nie powtarzaj tego samego archetypu twarzy, włosów i stroju w kolejnych obrazach.

Jeżeli poprzednia scena miała rudowłose dziecko w ogrodniczkach, następna nie powinna być jego kosmetycznym wariantem.

---

## 8. Dobór sceny do znaczenia słowa

Najpierw ustal **jedną czytelną scenę**, dopiero potem pisz prompt.

### Rzeczowniki
Pokazuj rzecz bezpośrednio i atrakcyjnie.

Przykłady:
- **dźwig** — żółty dźwig podnoszący ładunek na budowie,
- **źródło** — czysta woda wypływająca między kamieniami w górach,
- **cukier** — dziecko wsypujące cukier do ciasta,
- **ślad** — widoczne odciski stóp / łap na ścieżce,
- **żrebak** — młody koń obok klaczy.

### Czasowniki
Najważniejsza jest akcja.

Przykłady:
- **tańczyć** — dynamiczny taniec na placu,
- **szukać** — dziecko wyraźnie czegoś wypatruje,
- **pilnujesz** — bohater pilnuje konkretnej rzeczy / zwierzęcia,
- **wsuwać** — książka wsuwana między inne książki.

### Przymiotniki i przysłówki
Pokaż cechę lub sytuację, która ją jednoznacznie komunikuje.

Przykłady:
- **krótki** — obiekt wyraźnie krótki,
- **ciepło** — ogrzewanie dłoni przy bezpiecznym ogniu,
- **ciemno** — łagodna nocna scena z lampką / latarnią,
- **groźny** — groźna pogoda lub bezpiecznie obserwowana sytuacja, bez przemocy.

### Słowa abstrakcyjne / relacyjne
Buduj prostą scenę narracyjną.

Przykłady:
- **który** — wybór jednej rzeczy spośród kilku,
- **mój / twój / swój** — czytelna relacja własności lub przekazania przedmiotu,
- **sposób** — dziecko znajduje metodę rozwiązania zadania,
- **harmonia** — kilka osób grających razem,
- **humor** — naturalna scena wspólnego śmiechu.

Jeżeli słowo ma kilka znaczeń, wybierz to:
1. najbardziej rozpoznawalne dla dziecka,
2. najłatwiejsze do pokazania bez tekstu,
3. najmniej mylące.

---

## 9. Edukacyjna czytelność ponad widowiskowość

Najważniejsze pytanie:

> Czy dziecko po zobaczeniu ilustracji ma szansę odgadnąć / zapamiętać właściwe słowo?

Nie wybieraj efektownej sceny, jeśli semantycznie pasuje słabo.

### Zły przykład
Dla „obrót” sam tramwaj jadący ulicą.

### Lepszy przykład
Wirujący bączek, piruet lub wyraźny ruch obrotowy.

### Zły przykład
Dla „krótko” dowolna osoba biegnąca.

### Lepszy przykład
Bardzo krótka czynność pokazana stoperem lub czytelnym kontekstem czasu.

---

## 10. Emocje

Postacie mają być:
- ciepłe,
- sympatyczne,
- żywe,
- ekspresyjne.

Nie każda postać musi szeroko się uśmiechać.

Dopuszczalne emocje zależne od słowa:
- zaciekawienie,
- skupienie,
- zachwyt,
- zdziwienie,
- lekki smutek,
- troska,
- wysiłek,
- ostrożność.

Unikaj generycznego „wszyscy się śmieją” tam, gdzie nie pomaga znaczeniu.

---

## 11. Czego bezwzględnie unikać

Nie generować:
- tekstu,
- liter,
- cyferek jako podpisów,
- plansz,
- kart edukacyjnych,
- layoutów z wieloma panelami,
- kolaży,
- ramek,
- badge’y,
- interfejsu,
- watermarków,
- pustego jednolitego tła,
- znaczących elementów motywu lub akcji poza bezpieczną strefą **x/y = 20–80%**,
- postaci uciętej w sposób psujący sens,
- przypadkowych dodatkowych palców / kończyn,
- zwierząt o błędnej liczbie nóg,
- zduplikowanych osób w tle,
- elementów wizualnie konkurujących z głównym motywem.

Nie prosić o styl konkretnego artysty / studia / filmu.

---

## 12. Bazowy prompt

Prompt najlepiej pisać po angielsku, nawet jeżeli słowo jest polskie.

### Template

```text
Use case: illustration-story.

Create ONE square, high-definition 1254x1254 illustration for a Polish children's spelling game.

WORD: “[POLISH WORD]”.

NO text anywhere in the image. No letters, captions, labels, logo, watermark, border, UI, educational board or collage.

STYLE:
High-end cinematic 3D storybook illustration for children, warm family-animation aesthetic, expressive rounded characters, natural detailed materials, polished soft rendering, gentle cinematic depth of field, warm golden-hour light, pastel highlights, subtle rim light, inviting and emotionally readable.

SCENE:
[ONE concise, concrete scene that makes the word understandable without text.]

CHARACTER / SUBJECT:
[age, hairstyle, clothing, props; deliberately different from recent images if a human is present.]

COMPOSITION:
MANDATORY SAFE AREA for a moving organic bubble mask: place the ENTIRE main subject, all limbs (including horns, ears, tails, hands, feet) and ALL semantically essential actions and props completely within the central 60% of BOTH dimensions: x=20–80% and y=20–80%. Reserve 20% on EACH of the four edges for nonessential, continuous natural scenic background rendered all the way to the borders (no empty padding). Frame the camera far enough back that no meaningful element can be clipped at any point in the bubble animation. One clear visual focus.

MOOD:
Friendly, curious, warm and suitable for children. Emotion should support the word, not distract from it.

QUALITY:
Anatomically coherent people and animals, natural hands, consistent perspective, clean silhouettes, rich but controlled detail.

Do not imitate any named artist, studio, movie or copyrighted character.
```

---

## 13. Krótszy prompt do seryjnej generacji

Gdy styl jest już ustabilizowany w danej sesji:

```text
ONE square 1254x1254 children's spelling-game illustration for the Polish word “[WORD]”.

Warm cinematic 3D storybook look, expressive friendly characters, detailed natural textures, golden light, soft depth of field, full scenic background.

Scene: [SCENE].

MANDATORY: Keep the ENTIRE semantic subject, limbs, props and action within x=20–80% and y=20–80% (central 60% × 60%). Outer 20% on EACH edge must contain only nonessential continuous scenic background, safe for a moving organic bubble mask.

No text, no letters, no border, no UI, no logo, no watermark, no collage.

Use a visibly different character age / hairstyle / hair color / outfit from the previous images where appropriate.
```

---

## 14. Promptowanie batcha 10 słów

Przed wywołaniem generatora:

1. zapisz listę 10 słów,
2. dla każdego ustal jednozdaniową scenę,
3. usuń sceny zbyt podobne,
4. zaplanuj różnorodność postaci,
5. rozłóż lokacje,
6. dopiero potem generuj.

### Zalecana różnorodność paczki
Nie jest to sztywny quota, ale dobra kontrola jakości:
- część scen z dziećmi,
- część z dorosłymi / seniorami,
- część bez ludzi,
- co najmniej kilka plenerów,
- różne fryzury i stroje,
- różne pory / typy światła, ale z zachowaniem wspólnego ciepłego looku,
- różne typy aktywności.

**Semantyka zawsze wygrywa z checklistą różnorodności.**

---

## 15. Nazewnictwo plików

Obecna konwencja w repo:

```text
assets/scenes/<slug>.jpg
```

Slug:
- małe litery,
- bez polskich znaków,
- bez spacji,
- możliwie bez znaków specjalnych.

Przykłady:
- `źródło` → `zrodlo.jpg`
- `dźwig` → `dzwig.jpg`
- `dźwignia` → `dzwignia.jpg`
- `łóżko` → `lozko.jpg`
- `żółtko` → `zoltko.jpg`
- `mężczyzna` → `mezczyzna.jpg`

Nie zmieniaj istniejącego assetu bez wyraźnej potrzeby.

---

## 16. Podpięcie w aplikacji

Manualne sceny są mapowane w:

```text
spelling/scenes.mjs
```

W `WORD_SCENES` obowiązuje wzór:

```js
['źródło', { key:'zrodlo', asset:'zrodlo.jpg', layouts:['bubble'] }],
```

Asset fizyczny:

```text
assets/scenes/zrodlo.jpg
```

Loader / pipeline może automatyzować część tego procesu, ale finalny stan musi zachować ten kontrakt.

---

## 17. Optymalizacja pliku

Priorytet:
1. jakość obrazu w Retina,
2. poprawne 1:1,
3. dopiero potem rozmiar pliku.

Nie należy agresywnie kompresować źródła, jeśli powoduje:
- banding gradientów,
- utratę detali włosów,
- artefakty na twarzach,
- zniszczenie światła,
- brzydkie krawędzie na tle.

Jeżeli pipeline konwertuje do JPG/WebP, sprawdź wynik wizualnie na ekranie telefonu.

---

## 18. QA przed dodaniem assetu

Każdy obraz powinien przejść poniższe pytania:

### Znaczenie
- Czy bez podpisu wiadomo, z czym kojarzy się słowo?
- Czy scena nie sugeruje mocniej innego słowa?
- Czy wybrano najbardziej dziecięce i czytelne znaczenie?

### Kadr
- Czy **cała** sylwetka (łącznie z rogami, kończynami, ogonem) i wszystkie istotne przedmioty mieszczą się w **x = 20–80%, y = 20–80%**?
- Czy pasy o szerokości 20% przy **każdym z czterech boków** zawierają tylko nieistotne tło?
- Czy ruchoma maska bańki **we wszystkich fazach animacji** nie odcina znaczenia obrazu?

### Styl
- Czy wygląda jak część tej samej serii?
- Czy światło jest ciepłe i plastyczne?
- Czy nie jest zbyt fotorealistyczne albo zbyt płaskie?

### Różnorodność
- Czy postać nie jest niemal kopią poprzednich?
- Czy batch ma różne fryzury, wiek i stroje?

### Jakość
- Czy dłonie wyglądają poprawnie?
- Czy oczy, kończyny i rekwizyty są spójne?
- Czy zwierzę ma poprawną anatomię?
- Czy nie ma przypadkowego tekstu?
- Czy tło nie ma zduplikowanych postaci / obiektów?

### Technika
- Czy format jest 1:1?
- Czy plik ma właściwy slug?
- Czy mapping w `spelling/scenes.mjs` wskazuje właściwy asset?

---

## 19. Reguła regeneracji

Regeneruj obraz, jeżeli:
- semantyka jest słaba,
- znaczący fragment głównego motywu lub akcji wykracza poza **centralne 60% × 60%** (20% marginesu bezpieczeństwa od każdego boku),
- generacja stworzyła planszę zamiast sceny,
- pojawił się tekst,
- postać jest praktycznie kopią ostatnich bohaterów,
- anatomia jest wyraźnie błędna,
- obraz jest atrakcyjny, ale nie uczy właściwego skojarzenia.

Nie poprawiaj słabego konceptu samym cropem. Najpierw popraw scenę / prompt.

---

## 20. Przykładowe kierunki scen

Dobre, już sprawdzone typy skojarzeń:

| Słowo | Kierunek sceny |
|---|---|
| dziadek | senior i dziecko wspólnie czytający w ogrodzie |
| dźwig | żuraw budowlany podnoszący ładunek |
| dźwignia | dziecko używa drewnianej dźwigni do poruszenia kamienia |
| mózg | dziecko bada kolorowy model mózgu |
| uszy | dzieci nasłuchują ptaków |
| urodziny | ogród, tort, świeczki, przyjaciele |
| ulica | dziecko idzie malowniczą uliczką |
| ucho | dziecko słucha muszli lub przykłada dłoń do ucha |
| źródło | woda wypływa między omszałymi kamieniami |
| cukier | wspólne pieczenie i wsypywanie cukru |
| ślad | tropy na mokrej / leśnej ścieżce |
| ciepło | ogrzewanie dłoni przy bezpiecznym palenisku |
| harmonia | mały zespół grający wspólnie |
| zbiór | koszyk z zebranymi rzeczami |
| obrót | bączek / piruet / jednoznaczny ruch obrotowy |

Tabela jest inspiracją, nie listą sztywnych promptów.

---

## 21. TL;DR dla Codexa

Jeżeli użytkownik prosi o nowe grafiki do Ortografii:

1. **najpierw ustal czytelną scenę dla każdego słowa,**
2. generuj **osobne kwadratowe assety 1:1**,
3. utrzymuj **ciepły cinematic 3D storybook look**,
4. **bez tekstu i bez plansz,**
5. **cały motyw i akcję** trzymaj **w centralnych 60% szerokości i wysokości**; 20% od każdego boku rezerwuj wyłącznie na nieistotne tło dla ruchomej maski,
6. domyślnie preferuj **plener i złote światło**, jeśli znaczenie na to pozwala,
7. dbaj o **różnorodność wieku, fryzur, koloru włosów i ubrań** między kolejnymi obrazami,
8. nie imituj nazwanych artystów, studiów ani filmów,
9. sprawdzaj, czy obraz **realnie komunikuje słowo**,
10. zapisuj asset do `assets/scenes/<slug>.jpg`,
11. podpinaj go przez `WORD_SCENES` w `spelling/scenes.mjs`,
12. przed zakończeniem sprawdź obraz w kontekście cropa bańki i na mobilnym ekranie Retina.

**Najważniejszy test:** ilustracja ma wyglądać pięknie, ale przede wszystkim ma sprawić, że dziecko szybciej połączy obraz z właściwym słowem.
