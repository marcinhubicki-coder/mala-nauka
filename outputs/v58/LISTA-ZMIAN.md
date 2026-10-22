# v58 — dialogi przy krawędzi i otwieranie kart nagród

Zmiany lokalne, 22.10.2026. Branch: `work/dialog-card-interactions-v58`.

## Dymki i postacie

- Dymek wykorzystuje szerokość ramy mapy, z równymi bocznymi marginesami. Nie dziedziczy już ogólnego ograniczenia okien do 360 px.
- Układ reaguje na szerokość samej mapy. Szerokie okno przeglądarki nie wypycha tekstu i postaci poza węższą ramę kampanii.
- Wychylająca się postać ma swoją krawędź około 16 px od boku ramy. Na telefonie jest nad dymkiem; przy rzeczywiście szerokiej mapie może być obok.
- Za postacią jest miękki cień jej sylwetki, a przy jej zasłoniętym boku — delikatna, cieniowana krawędź. Pełne pozy pozostają w całości widoczne.
- Pozostają spokojne pulsowanie, iskry, dialogi wieloosobowe i wariant ograniczonego ruchu.

## Karty, ulepszenia i hologram

Przyczyną blokowania kolejnych kart było przenoszenie otwartego dialogu do innego rodzica po odbiorze nagrody. Przeglądarka pozostawiała `open`, ale usuwała dialog z warstwy modalnej. Blokada kolejnego otwarcia traktowała go nadal jako aktywne okno.

- Odświeża się tylko kolekcja pod spodem. Otwarty dialog pozostaje przy tym samym rodzicu i zachowuje tryb modalny.
- Obsługa otwierania potrafi usunąć pozostawione przez poprzednią wersję, niemodalne okno i otworzyć właściwą kartę.
- Karta 1:1 w Labie efektów jest interaktywna. Porównanie A–F pozostaje demonstracją efektów.
- Ulepszenie medalu nadal używa istniejącego przedmiotu, przechylenia i hologramu. Skrzynia służy pierwszemu odkryciu.
- Moc pokazuje prawidłowy nowy poziom już w trakcie holograficznego ładowania.

## Weryfikacja

Test celowany w Chromium i WebKit: odkrycie medalu, ponowne otwarcie, ulepszenie brąz → srebro, przechylenie/hologram/powrót, otwarcie zablokowanej nagrody oraz odzyskanie starego niemodalnego okna. Interaktywna karta mocy 1:1 przeszła ten sam test w obu silnikach. Bez błędów skryptu.

Po ostatniej korekcie CSS osobno sprawdzone szerokości i zrzuty dymku w telefonie i desktopie w obu silnikach. Tekst mieści się w ramie mapy. Zrzuty: `.design-qa/v58/`. Wyniki: `report.json` oraz `layout-report.json`. Celowany skrypt: `tools/qa-dialog-modal-v58.mjs`.

Build lokalny i kontrola 53 kontraktów widoków. W istniejącym Safari sprawdzono otwarcie karty bez odbierania nagrody; przywrócono książkę na ostatnim odkrytym fragmencie. Własne testy nagród korzystały z danych przykładowych w izolowanych przeglądarkach. Postęp profilu i istniejąca jedna zmiana w szkicu Studio nie zostały zmienione.

Nie testowano na fizycznym iPhonie ani nie wykonywano pomiaru jego GPU. Nie publikowano na Vercel, nie wysyłano commita i nie zmieniano danych zewnętrznych.
