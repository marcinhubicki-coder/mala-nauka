# Podgląd aplikacji: iPhone i Desktop

Górny pasek Studio zawiera wybór „Podgląd aplikacji”: iPhone 390 × 844 albo Desktop 1440 × 900. To rzeczywisty rozmiar iframe, więc działają reguły responsywne aplikacji. Powiększenie „Dopasuj ekran” skaluje gotowy podgląd; nie zmienia jego wewnętrznego viewportu. Dostępna jest również dotychczasowa skala 100%.

Wybór dotyczy edytora ekranów, podglądów animacji i bańki oraz panelu Test PWA. Przełączenie zachowuje obiekt projektu, aktualny ekran i wariant stanu, ustawienia narzędzi i niezapisany szkic. Konfiguracja wyglądu pozostaje wspólna. To przełącznik docelowego podglądu aplikacji; responsywny układ samego panelu Studio nadal wynika z rozmiaru okna.

Preferencja urządzenia jest przechowywana lokalnie, poza `config.json` i kolejką zmian. Zmiana urządzenia sama nie oznacza szkicu ani nie wymaga zapisu GitHub. Oba podglądy korzystają z tej samej biblioteki ilustracji i przypisań.

Zrzuty referencyjne iPhone pozostają w IndexedDB. Na Desktopie nakładka jest wyłączona, bo ma inny rozmiar; powrót do iPhone przywraca porównanie. Wersja testowa PR używa oznaczenia i celu zapisu z `deployment.studioBranch`, zamiast mylić nazwę gałęzi poprawki z wersją Studio.

Weryfikacja: `node tools/qa-device-switch-browser.mjs http://127.0.0.1:8765` sprawdza rzeczywiste rozmiary iframe, zachowanie edytowanej wartości/ekranu/stanu i licznika szkicu, zapamiętanie preferencji po przeładowaniu, Test PWA i dopasowanie Desktopu do wąskiego okna hosta. Regresja referencji sprawdza zachowanie zrzutów po przełączeniu Desktop → iPhone. Test przeglądarkowy nie zastępuje testu fizycznego iPhone’a/Safari.
