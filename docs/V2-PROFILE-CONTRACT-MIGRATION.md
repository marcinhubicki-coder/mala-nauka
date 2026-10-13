# Design Studio v2 — migracja profilu i redukcja pracy DOM

Stan: 13.10.2026, branch `refactor/v2-parity-first`; `main` nietknięty.

## Wdrożone

### Nowy gracz — jawny renderer v2

`shared/view-contracts.mjs` opisuje ekran `player-create` jako **25 bloków**: nawigacja, karta, podgląd avatara, teksty, input nicku, grupa 12 wyborów avatarów i akcja zatwierdzenia. Kompilacja `compileViewMarkup('player-create', markup)` nadaje identyfikatory wszystkim elementom i sprawdza ich kompletność. Nie analizujemy powtarzalnych struktur HTML przy każdym renderowaniu.

Dwa odrębne zachowania:
- Nowy gracz: back → `players`, kompilowany kontrakt v2.
- Edycja istniejącego profilu: back → `settings`, stary renderer zachowany do osobnej migracji.

Komponent `profileAvatar` ma opcjonalne atrybuty kontraktu, bez tworzenia drugiej implementacji avatara.

### Zachowanie tożsamości komponentu

Poprzedni handler `choose-avatar` robił `preview.innerHTML = avatarMarkup(...)`. Wystarczyła jedna zmiana avatara, by z kontraktu 25 elementów pozostały 24. Silnik v2 wykrył ten błąd w teście przeglądarkowym. Teraz `updateProfileAvatar` zmienia wyłącznie `src` obrazu oraz `data-avatar` w **tym samym elemencie DOM**; id i receptura pozostają na miejscu.

### PIN — zachowanie istniejącej klawiatury

Poprzedni handler po każdej cyfrze odtwarzał całą `.pin-fields`, w tym 12 klawiszy i cztery wskaźniki. `syncPinEntry()` aktualizuje tylko wypełnione kropki, informację dostępności i `disabled` przycisku zatwierdzenia. Klawiatura, jej focus i tożsamość DOM pozostają niezmienione. Pełny `renderPinFields` jest zachowany do zmiany trybu PIN/bez PIN-u, gdzie struktura rzeczywiście się różni.

**Ważne:** ekran PIN nie jest jeszcze w całości deklaratywnym kontraktem. Ta iteracja stabilizuje jego stan, przed następną migracją rodziny i wariantów.

## Kryteria akceptacji

- `tests/v2-player-create-contract.test.mjs`: struktura, unikalne akcje 12 przycisków, walidacja kompilatora, niezmienność edycji istniejącego profilu.
- `tools/qa-avatars-browser.mjs`: 12 avatarów o identycznej wielkości; jeden żywy DOM avataru przy kolejnych wyborach; nowy kontrakt 25/25; PIN + cofanie + ponowne wpisanie cyfr bez ponownego tworzenia klawiszy; zapis i edycja.
- `tools/qa-no-pin-browser.mjs`: tworzenie bez PIN-u, zapis, wejście do Home i spójność avatara w ustawieniach.
- `.github/workflows/avatar-qa.yml`: cały zestaw Node oraz QA na realnym Chromium. Po zmianie uruchamia też `tools/qa-typography-browser.mjs` i `tools/qa-all-views-browser.mjs`, żeby sprawdzić poprzednie etapy.
- Fizyczny iPhone/Safari i screenshot diff do produkcji **nie są jeszcze potwierdzone**.

Nie scalać z produkcyjnym `main` bez zatwierdzenia i kontroli mobilnej.
