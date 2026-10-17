# Design Studio v2 — audyt złożoności i uproszczony katalog

Data: 2026-10-13. Branch: `refactor/v2-parity-first`.

## Fakty, a nie liczba komponentów

Z 41 scenariuszy w Chromium wyodrębniono 1764 **wystąpienia**, a nie 1764 osobne komponenty. Ten sam przycisk czy tytuł powtarza się w stanach i widokach.

- 782 nazwy instancji, 240 nazw receptur.
- 716 wystąpień tekstu, 309 kontenerów, 261 przycisków, 222 ikon, 168 obrazów.
- 304 wystąpienia mają anonimową recepturę `text`; 75 obrazów z jednego widoku ma anonimową recepturę `image`.
- 81 receptur ma jedno wystąpienie, 128 występuje tylko w jednym widoku.
- Poprzedni katalog: 534 pozycje na podstawie odmiennych kształtów DOM.
- Katalog po grupowaniu zarejestrowanych receptur: 437 pozycji, w tym **60 współdzielonych** w co najmniej dwóch widokach.

## Zasady

Domyślnie Studio prezentuje *Wspólne klocki*, a opcja *Wszystkie szczegóły* umożliwia kontrolę każdego technicznego elementu bez jego usuwania z aplikacji.

Jedno `button-back` grupuje 21 wystąpień (wcześniej trzy warianty sygnatur). Edycja wspólna trafia do `elementStyles.button-back`; lokalna pozostaje w `elementOverrides.<view>.<id>`. Elementy o różnych zadaniach nie są łączone tylko dlatego, że podobnie wyglądają.

Dzieci elementów katalogu są teraz indeksowane według rodzica, zamiast przy każdym elemencie ponownie przeszukiwać całą listę.

## Granice potwierdzenia

- 331 testów kodowych przeszło po pierwszej zmianie biblioteki.
- Weryfikacja wyniku w Chrome i na urządzeniu z Safari pozostaje obowiązkowa przed merge.
- 40 widoków nadal używa starszego adaptera renderera; uproszczenie biblioteki nie oznacza ich refaktoryzacji.
- Celem dalszej pracy jest ograniczanie potrzebnych **decyzji i pojęć**, a nie ukrywanie lub usuwanie poprawnie działających części interfejsu.
