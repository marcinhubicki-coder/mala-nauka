# Baza słów — Angielski

Baza jest podzielona na pliki według kategorii, żeby dało się ją łatwo edytować bez ruszania logiki aplikacji.

Każde słowo zajmuje dokładnie jeden wiersz:

```text
english word|polskie znaczenie|category|difficulty|wrong 1;wrong 2;wrong 3
```

Przykład:

```text
pencil|ołówek|objects|2|pensil;pencill;pencel
```

Pola:
- `english word` — poprawna pisownia po angielsku,
- `polskie znaczenie` — znaczenie wyświetlane w zadaniu,
- `category` — identyfikator kategorii,
- `difficulty` — `1`, `2` albo `3`,
- ostatnie pole — dokładnie trzy błędne odpowiedzi rozdzielone średnikami.

Pliki kategorii są w tym katalogu. `../english.mjs` łączy je automatycznie i sprawdza, czy baza zawiera dokładnie 500 unikalnych słów.
