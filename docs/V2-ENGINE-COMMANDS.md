# Design Studio v2 — silnik edycji komponentów (pilot)
Data: 2026-10-13 · `refactor/v2-parity-first`

Na tym etapie jedynym kanonicznym miejscem edycji parametrów jest konfiguracja `design-system/config.json` oraz jawne kontrakty w `shared/view-contracts.mjs` i `shared/spelling-settings-contract.mjs`.

Silnik CLI i biblioteka Studio korzystają z tej samej ścieżki zapisu: `elementStyles` (wspólne bloki), `familyStyles` (wariant trybu) i `elementOverrides` (jedno wystąpienie). Inspektor Studio identyfikuje komponenty stałym `data-ds-block` / `data-ds-element`; PWA używa tych samych wartości. Nie dopisywać lokalnych poprawek CSS podczas typowych zmian stylu.

## Polecenia

```bash
npm run studio:engine -- check
npm run studio:engine -- inspect --view home --id home-mode-spelling
npm run studio:engine -- set --view home --id home-mode-spelling --scope shared --property radius --value 28
npm run studio:engine -- set --view home --id home-mode-spelling --scope view --property radius --value 20 --apply
npm run studio:engine -- set --view home --id home-spelling-name --scope theme --property textColor --value '#ff2277' --apply
npm run studio:engine -- set --view spelling-settings --id spelling-level-jelly --property radius --value 26 --apply
```

Bez `--apply` polecenie **nie zmienia plików**. Z `--apply` aktualizuje config po walidacji, następnie trzeba uruchomić `npm test`, sprawdzić Test PWA i porównać ze wzorcem. Można skorzystać z `--reset`, aby usunąć nadpisanie.

**Ograniczenie świadome:** pilot obsługuje jawnie przeniesione komponenty Home i ustawienia Ortografii. Inne widoki muszą zostać zmigrowane do kontraktu przed edycją CLI — nie wolno zgadywać selektora ani dopisywać niejawnego wariantu.
