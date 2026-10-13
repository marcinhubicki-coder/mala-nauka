# V2 — zrzuty kontrolne z GitHub Actions

Zatwierdzone zrzuty z produkcji z 13.10.2026 są wzorcem. Test Chromium uruchamia aktualny renderer, przechodzi prawdziwą ścieżkę Home → Ortografia → wynik, a także otwiera deklaratywne warianty w Design Studio.

Workflow `Orthography v2 end-to-end` zapisuje w artefakcie `v2-orthography-visual-<SHA>` krótkotrwały zestaw screenshotów:
- `home.png` – aktualny Home do `IMG_2946.png`;
- `spelling-settings-live.png` – ustawienia do `IMG_2947.png`;
- `spelling-game-live.png` i `spelling-initial.png` – scena przed odpowiedzią do `IMG_2949.png`;
- `spelling-wrong.png` – stan po błędzie do `IMG_2948.png`;
- `spelling-correct.png` – stan po poprawnej odpowiedzi;
- `spelling-results-live.png` i `spelling-results.png` – ekran zakończenia do `IMG_2950.png`;
- `manifest.json` – SHA, nazwy referencji, viewport.

Renderowanie zachowuje artboard 390 × 844 CSS px, DPR 3 i `prefers-reduced-motion`, dlatego klatki są deterministyczniejsze niż przechwytywane podczas animacji. Zrzuty wynikowe **nie są jeszcze automatycznie uznawane za zgodne z referencją** – należy je skontrolować nałożeniem wzorca w Design Studio V2. To jest mechanizm raportowania, nie fałszywy test pixel-perfect.

Pliki są artefaktem CI przechowywanym przez **7 dni**; nie trafiają do `dist/`, katalogu `assets/`, commita, ani Vercel. Nie używamy ich jako statycznych ilustracji aplikacji.

Po sprawdzeniu różnic w Studio korygujemy jeden kontrakt UI i powtarzamy test, bez budowania zbędnych deploymentów. Publikacja V2 na Vercel dopiero po przejściu regresji i po odzyskaniu dostępności wdrożeń.
