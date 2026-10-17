# Instrukcje dla agentów: Mała Nauka / Design Studio

Przed każdą zmianą interfejsu, animacji, grafik, stanu gry, Design Studio lub eksportu PWA przeczytaj:
- [Zasady decyzji projektowych użytkownika](docs/design-system/decision-rules-2026-10.md) — priorytety, zaakceptowane i odrzucone kierunki, bramki ukończenia.
- [Zasady i tokeny](docs/design-system/principles.md).
- [41 kontraktów widoków](docs/V2-ALL-VIEW-CONTRACTS.md), [Atomic Design](docs/V2-ATOMS-AND-TYPOGRAPHY.md), [wzorce wizualne](docs/V2-VISUAL-ACCEPTANCE.md).
- Dla obrazów: [styl ilustracji](docs/ORTHOGRAPHY-IMAGE-STYLE.md) i [biblioteka V2](docs/V2-CANONICAL-IMAGE-INDEX.md). Dla animacji: [wspólny runtime](docs/design-system/unified-runtime.md) i [WebKit](docs/ANIMATION-WEBKIT-GUIDE.md).

## Tryb pracy

1. Zdefiniuj **zakres, elementy chronione i wzorzec**. „Zmień tylko X”, „resztę zostaw”, „bez Y” interpretuj dosłownie. Najnowsza konkretna decyzja użytkownika wygrywa ze starszą propozycją.
2. **Nie redesignuj zaakceptowanych widoków.** Odtwarzaj geometrię i stany względem referencji iPhone 13 Pro (390 × 844 logicznych px); porównuj screenshoty, nie pamięć.
3. Modeluj **atom → grupa → rodzina → szablon → widok**. Atom ma pojedynczą odpowiedzialność; dwie niezależne akcje to dwa atomy, nawet jeśli są obok siebie. Nie twórz duplikatów tylko dla lokalnego stylu. Zachowuj edytowalność.
4. Studio i PWA **muszą współdzielić ten sam kontrakt**; nie naprawiaj tylko DOM Preview, osobnego CSS testowego ani jednego wariantu kosztem innych. Zachowaj dziedziczenie, stany, hidden/removed i przypięcie assetów.
5. Odświeżaj kanoniczną bibliotekę grafik przed dodaniem nowych. Publikacja obrazu musi przejść rzeczywisty cykl: biblioteka → indeks → HTTP → PWA. Nie wrzucaj assetów binarnych do commitów aplikacji.
6. Diagnozuj źródło problemów animacji WebKit; optymalizuj bez milczącego usuwania efektów, pamiętaj o reduced-motion. Test lokalny nie jest dowodem działania Safari PWA.
7. Zmiany wdrażaj małymi krokami: regresja / cofnięcie → wierność wizualna → test gestów i logiki → test Studio/PWA/build/assetów/audio → fizyczny telefon, gdy dostępny.
8. Zawsze odróżniaj **zweryfikowane**, **niezweryfikowane** i **proponowane**. Podaj branch/commit/testowy URL, zakres oraz brakujące sprawdzenia. Nie nazywaj zadania ukończonym po samym przejściu testów.
9. **Nie zmieniaj produkcyjnego main i nie publikuj automatycznie.** Wykorzystaj osobny branch i przedstaw wynik do weryfikacji.

Dokumenty te są instrukcją decyzji, **nie** alternatywnym źródłem konfiguracji. Runtime pozostaje oparty na wspólnych danych i kontraktach V2.
