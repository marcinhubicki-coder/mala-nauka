# Architektura Małej Nauki

## Założenie

Jedno repozytorium i jeden projekt Vercela. `main` jest wspólną aplikacją PWA, a pięć modułów ma własne katalogi i może być rozwijane na osobnych branchach preview.

## Moduły

- `ortografia/`
- `matematyka/`
- `angielski/`
- `flagi/`
- `czytanie/`

## Wspólna warstwa

`shared/` oraz pliki w root odpowiadają za elementy wspólne: PWA/offline, safe-area iPhone, ustawienia, nawigację, postępy, bazową typografię i wspólne komponenty.

## Workflow

Każdy moduł może mieć własny branch, np. `work/matematyka-v0.1` lub `work/ortografia-v0.3`. Vercel wystawia preview brancha, a gotowa zmiana trafia do `main`. Nie tworzymy osobnego projektu Vercela dla każdego modułu.

## Migracja

Stare repo `appka-policyjna-baza` pozostaje backupem do czasu pełnego przepięcia Vercela. Nie usuwamy z niego kodu Małej Nauki przed potwierdzeniem działania nowego repo.
