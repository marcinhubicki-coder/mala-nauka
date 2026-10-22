# v48 — ładowanie flag i matematyka kampanii

## Przyczyny

- Biblioteka CDN nie zawierała 698 plików sceny Flagi: materiałów, gotowych flag, fontów i kafelkowego atlasu z geometrią. Lokalny serwer pobierał je z historycznego checkoutu przez `MN_SCENIC_ASSETS`, co maskowało brak na Vercelu.
- Kampania Matematyki uruchamiała ogólny renderer w `app.js`, zamiast aktualnego modułu `matematyka/`. Trzy widoki kampanii w Studio używały tego samego starego renderera.

## Poprawka

- Zewnętrzna biblioteka zawiera pełny zestaw; 701 zależności sceny mają wersjonowane ścieżki, rozmiary i sumy SHA-256 w `design-system/scenic-assets.json`. Hosted build wymaga ich zgodności z publicznym indeksem. Binarne grafiki pozostają wyłącznie na `assets/library-v1`.
- Kampania uruchamia aktualną Matematykę przez wspólny host trybów. Zachowuje zakres działań, trudność, limit czasu/zadań, zaliczenie i powrót na mapę. Runda zadań wymaga pełnej liczby pytań; ponowna próba tego samego pytania nie zwiększa licznika.
- Studio i PWA współdzielą aktualny kontrakt matematyki. Przywrócono też przycisk pauzy, który starszy skrypt zastępował dodatkowym zegarem.
- Błąd ładowania flag jest widoczny także przy wejściu z kampanii, a oczekiwanie na scenę ma limit.

## Weryfikacja

- 478 testów logiki i kontraktów.
- Chromium i WebKit, 390 × 844: wejście z mapy do Matematyki, pauza/wznowienie, sześć odpowiedzi, dodawanie do 10, pełne 10 zadań, zapis wyniku, zaliczenie i powrót na mapę; następnie start Flag, błędna odpowiedź, mapa i oddalenie atlasu.
- Pięć zmienionych/powiązanych kontraktów na telefonie i desktopie; pochodny indeks nadal obejmuje 50 widoków.
- Publiczny CDN: pobrano i sprawdzono bajty i sumy SHA-256 wszystkich 701 zależności sceny (40 016 521 B).
- Build z zewnętrzną biblioteką, bez lokalnych kopii scen i atlasu.

Powtarzalny test rozgrywki: `node tools/qa-campaign-games-browser.mjs http://127.0.0.1:8874`.
Test WebKit jest lokalnym testem silnika, nie fizycznego iPhone'a.
