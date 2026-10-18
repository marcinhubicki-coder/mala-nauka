# Odznaki i wielokrotne przypisania słowa

Zakres: kolekcja Ortografii i współdzielona podpowiedź słowa (kolekcja oraz wyniki rundy). Pozostała geometria, animacja bańki, punktacja, iskry i zapis osiągnięć pozostają bez zmian.

## Prezentacja

- Na zdjęciu: zielona pieczęć Umiem po lewej, graficzna gwiazdka brązowa / srebrna / złota po prawej. Brak zdobyczy zostawia delikatny wytłoczony ślad. Winieta jest wyłącznie od prawego dolnego rogu i tylko przy zdobytej odznace.
- Pod zdjęciem: słowo z zaznaczonymi wszystkimi ćwiczonymi fragmentami i otoczone obwódką kategorie. Znikają osobne wiersze „Umiem” / „Złoto”.
- W popupie: pieczęć po lewej od istniejącej bańki, gwiazdka po prawej, pod nimi tylko liczniki. Niżej wszystkie kategorie i zasady przypisane do słowa, z istniejącej wspólnej biblioteki.

## Jedno słowo, kilka trudności

To nadal jedna karta. Gwiazdki liczą sumę poprawnych odpowiedzi dla słowa: **5 / 15 / 30**, niezależnie od kategorii. Nie mnożymy progu ×2, nie przeliczamy starych osiągnięć i nie zmieniamy punktacji.

Umiem zachowuje istniejący model utrwalania **każdego miejsca pisowni**: trzy różne dni oraz co najmniej siedem dni od pierwszego samodzielnego przypomnienia. Licznik sumuje kroki dla wszystkich miejsc: np. żółw ma dwa miejsca, zatem **0/6 → 6/6**. Ostatni krok danego miejsca pojawia się po spełnieniu również warunku czasu; szybkie powtórki nie pokazują fałszywego ukończenia. Podpowiedź nie daje utrwalenia. Wcześniej zdobyte Umiem jest zachowane na zawsze.

Współdzielony selektor nadal daje pierwszeństwo słabiej utrwalonemu miejscu. Ta zmiana dodaje wyłącznie projekcję istniejących danych do UI (`shared/word-card.mjs`), bez migracji profili ani zmiany selektora.

## Design System

Te same renderery obsługują Studio, kolekcję, wyniki i PWA. `image-word-award` ma stany `empty` / `earned`; liczniki, kategorie i dodatkowe zasady mają jawne receptury. Kontrakt popupu zawiera 16 elementów; rejestr nadal ma 45 widoków. Otwieranie popupu z kolekcji zachowuje jej kontrakt i przy zamykaniu przywraca fokus.

## Grafiki

Cztery osobne, przezroczyste assety powstały w `image_gen.imagegen`: trzy metalowe gwiazdki i zielona pieczęć. Finalne WebP mają 1254 × 1254 px, każdy poniżej 250 KB. Metadane: `shared/word-badge-assets.mjs`, `design-system/assets.json`. Pliki i indeks opublikowano atomowo na `assets/library-v1`, commit `c126d4939685b9c64cae7b58d2898e0614ae6925` (798 plików w bibliotece). Zweryfikowano publiczny indeks, rozmiary oraz SHA-256 pobranych plików. Commit aplikacji zawiera wyłącznie metadane; PWA pobiera grafiki na żądanie.

## Weryfikacja

- `node --test tests/*.test.mjs`: 443 testy.
- `tools/qa-all-view-contracts-browser.mjs`: 45 widoków × iPhone 390/844 i desktop 1440/900, 90 kontroli.
- `tools/qa-word-cards-browser.mjs`: kolekcja → popup → powrót, filtry, jedna karta żółwia, oba fragmenty i kategorie, wszystkie zasady, puste oraz zdobyte odznaki, liczniki 0/6 i 6/6, zachowanie danych i edycja odznaki przez Design System; 320/390/1440 px, surowy renderer oraz zbudowana PWA.
- `tools/qa-learning-e2e.mjs`: izolowana Test PWA, tutorial, zapis i odczyt postępów, pięć trybów, moce, trwałe wybory trofeów i restart offline.

Screenshoty i raporty lokalne: `.design-qa/word-cards/`. Fizyczny iPhone / Safari PWA nie był dostępny; emulacja rozmiaru telefonu tego nie zastępuje. Wydanie do podglądu jest na osobnej gałęzi; produkcyjny main pozostaje za bramką zatwierdzenia z AGENTS.md.
