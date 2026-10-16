# Ortografia v2 — jeden silnik, współdzielone klocki i ekranowe stany

**Roboczy branch:** `refactor/v2-parity-first`. Produkcyjne `main` nie jest scalane ani automatycznie wdrażane. Projekt testowany przy rozmiarze 390 × 844 CSS px, DPR 3.

## Deklaratywne kontrakty

| Widok/stany | Rodzina i liczba wystąpień klocków | Renderowanie |
|---|---|---|
| Ortografia — kreator | 29 identyfikowanych elementów | Po zbudowaniu Jelly `hydrateViewContract(root,'spelling-settings')`, bez zastępowania formularza |
| Gra: start/poprawna/błędna/hint/pauza | Jedna rodzina 17 elementów | `compileViewMarkup('spelling-initial',...)` montuje jedną scenę na sesję |
| Wyniki oraz zasada | Jedna rodzina 18 elementów | `compileViewMarkup('spelling-results',...)`, treści liczbowe i listy są danymi, nie nowymi atomami |
| Podpowiedź | 5 komponentów podrzędnych | `hydrateSpellingOverlay(...,'hint')` |
| Pauza/wyjście | 5 komponentów podrzędnych | `hydrateSpellingOverlay(...,'pause',{variant})` |
| Zasada pisowni | 10 komponentów podrzędnych | `hydrateSpellingOverlay(...,'rule')` |

Każdy kontrakt ma jednoznaczny ID, recepturę, rodzica i typ. Nieznane ID, duplikaty, niepoprawny rodzic oraz niedozwolona akcja nie przechodzą walidacji. Rodziny podrzędne są jawnie dozwolone przy kompilacji kontraktu rodzica i walidowane oddzielnie: żadne „ignoruj błędy” ani automatyczna klasyfikacja DOM.

## Spójność, zachowanie i wydajność

- Stany poprawna/błędna nie montują nowej gry. Zmieniają właściwe karty, odpowiedzi, obrazek, animację słowa i komunikat.
- Podpowiedź/pauza/zamknięcie okna pozostawiają scenę rozgrywki po spodem. Reset animacji i obrazków istnieje wyłącznie przy zmianie sesji/ekranu.
- Zapisane wcześniej komponenty Jelly zachowują te same referencje DOM po wyborze kategorii, poziomu i długości rundy. Ekran ma 29 nazwanych komponentów z jednego źródła.
- Wynik ma **niezależne** `spelling-result-repeat` (slider nowej rundy) i `spelling-result-history` (przycisk historii). Nie dzielą identyfikatora ani rodzica; ich dwa zachowania nie są powiązane.
- Podsumowanie zachowuje dwa osobne panele szczegółów i przyciski Utrwalone / Do powtórki, a zasada pisowni ma własne okno.
- Kontrakty są indeksowane jeden raz (`VIEW_INDEX`) i wykorzystywane podczas renderowania. Nie ma ponownego wielokrotnego skanowania struktury DOM przy każdej odpowiedzi.
- Niskopoziomowe operacje 3D, bańka, przejścia tekstu i slider są nadal dedykowanymi implementacjami animacji, nie częściami skanera lub tekstowych szablonów. **Nie wolno tworzyć wielu kopii ich kodu dla każdego stanu.**

## Regresja i akceptacja

Polecenia lokalne:
```sh
npm test
npm install --no-save --ignore-scripts playwright
npx playwright install --with-deps chromium
python3 -m http.server 8765 --directory dist
node tools/qa-orthography-browser.mjs http://127.0.0.1:8765
node tools/qa-orthography-complete-browser.mjs http://127.0.0.1:8765
```

Pierwszy test sprawdza przejście od kreatora do gry, poprawny i błędny stan odpowiedzi, pauzę/wyjście, wynik, przyciski wyników, okna zasad i osiem widoków Studio. Drugi test gra **10 słów**, korzysta z klawiaturowej obsługi slidera po błędzie i kończy rundę naturalnie, bez przycisku wyjścia. Dodatkowo powinna przejść pełna regresja profili, nawigacji, typografii i pozostałych 41 scenariuszy.

Źródła testów: `.github/workflows/orthography-qa.yml` i `.github/workflows/avatar-qa.yml`. Repo jest publikowane przez Vercel wyłącznie jako gałąź testowa, gdy limit deploymentów pozwala.

## Nieobjęte automatyczną akceptacją

- Pixel-perfect porównanie renderingu ze starszą, zatwierdzoną wersją produkcyjną na rzeczywistym iPhone/Safari, w szczególności animacji podczas wielokrotnych sesji.
- Testy haptics/audio i pracy offline na prawdziwym urządzeniu.
- Przyszły projekt/wydanie/preview dla wszystkich innych trybów.

To są osobne kontrole jakości, **nie powód do przepisywania działającej logiki na kolejne wyjątki CSS**. Jeżeli któryś krok nie przechodzi testu, przywracamy poprzedni działający kontrakt i naprawiamy powód na poziomie właściciela komponentu.

## Zaakceptowany wynik CI (13.10.2026)

- **377/377 testów Node, 0 błędów**.
- Pełna regresja PWA i wszystkich **41 scenariuszy** w Chromium: avatar, profil, PIN z/bez, typografia, komponenty i Ortografia — **success**: [GitHub Actions #38347168622](https://github.com/marcinhubicki-coder/mala-nauka/actions/runs/38347168622).
- Osiem stanów Ortografii, kontrakty 29/17/18, podpowiedź/pauza/zasada, nawigacja i wyniki — **success**.
- Dodatkowo osobny test zagrał **10/10 słów do naturalnego zakończenia**: 5 poprawnych i 5 błędnych, obsłużył slider po błędzie, uzyskał wynik **5/10 = 50%**, 0 błędów JavaScriptu — [GitHub Actions #38347168628](https://github.com/marcinhubicki-coder/mala-nauka/actions/runs/38347168628).
- Testy poprzednich ekranów przeszły po optymalizacji kontraktów rodzica i dzieci (nadrzędny ekran PIN i wewnętrzne klawisze / Jelly).
- **Ważne:** sukces CI potwierdza renderowanie i interakcje w Chromium, ale nie jest równoznaczny z ręcznym zatwierdzeniem wyglądu ani wydajności PWA na fizycznym iPhone/Safari. Brak nowego zweryfikowanego URL Vercel z tym SHA z powodu wcześniejszego limitu deploy.

## Kontrola końcowa — 13.10.2026

Przed uznaniem migracji Ortografii za ukończoną wykonano dodatkowe testy, wykraczające poza samo załadowanie makiet:

- **Pełna rozgrywka:** ustawienia → dziesięć słów (poprawne i błędne odpowiedzi) → przejścia po błędach za pomocą slidera → naturalny koniec → prawidłowe wyniki.
- **Ponowna rozgrywka:** slider `spelling-result-repeat` został przesunięty za pomocą rzeczywistych zdarzeń klawiatury (nie syntetycznego zdarzenia gry). Pojawił się nowy ekran gry, 17/17 komponentów, dwie interaktywne odpowiedzi.
- **Druga niezależna akcja wyników:** `spelling-result-history` nadal otwiera `history`; nie jest połączona ani w kodzie, ani w kontrakcie ze sliderem.
- **Budżet runtime:** podczas ustawień Ortografii, samej gry i wyświetlania wyników iframe **nie pobiera** `shared/element-system.mjs`. Starszy ekran historii nadal może ładować klasyfikator po kliknięciu „Moje wyniki” — nie jest to regresja Ortografii i będzie migrowany osobno.
- **Regresje:** tryb z PIN-em i bez, 12 avatarów, Studio, typografia oraz wszystkie 41 zarejestrowanych widoków.

**Ostatnie potwierdzone CI:** [Orthography v2 end-to-end #38355111582](https://github.com/marcinhubicki-coder/mala-nauka/actions/runs/38355111582) i [Avatar geometry regression #38355111577](https://github.com/marcinhubicki-coder/mala-nauka/actions/runs/38355111577). Oba zakończone `success`. **377/377 testów Node; 0 błędów JS w E2E.** W jednej z rund kontrolnych odnotowano cztery odpowiedzi poprawne i sześć błędnych, prawidłowy wynik `4/10 = 40%`, następnie uruchomiono następną rundę.

**Status:** migracja i testy automatyczne Ortografii v2 — zakończone. Weryfikacja wizualna na fizycznym iPhonie / Safari, test rzeczywistej płynności, audio/haptics oraz akceptacja wyglądu względem produkcji — nadal osobny, **niezakończony** etap QA. Ostatniego SHA nie należy oznaczać jako wdrożonego na Vercel, dopóki nie zostanie potwierdzony deployment `READY`. `main` pozostaje bez zmian.
