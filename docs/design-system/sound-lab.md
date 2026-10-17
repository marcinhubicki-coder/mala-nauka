# Dźwięki i Sound Lab v3

Studio i PWA korzystają z jednego kontraktu `config.sound` oraz wspólnego renderera próbek. Zapis suwaka obejmuje wybraną strefę. Przycisk „Przywróć ten motyw” resetuje tylko jej zestaw, warstwy i parametry; zachowuje pozostałe strefy, mapę zdarzeń i krótkie efekty.

## Strefy i zestawy

| Strefa | Ekrany korzystające z tego samego motywu |
|---|---|
| Start i gracze | Logowanie, wybór gracza, Home, ustawienia aplikacji |
| Ortografia | Ustawienia, ładowanie, gra, pauza i podpowiedź |
| Matematyka | Ustawienia, ładowanie, gra i wyjaśnienie |
| Angielski | Ustawienia, ładowanie i gra |
| Flagi | Ustawienia, ładowanie i gra |
| Czytanie | Ustawienia, ekspozycja tekstu i gra |
| Wyniki i kolekcja | Podsumowanie rundy, postępy, kolekcja i zasady |

Jelly wybiera jedną z siedmiu stref i jeden z trzech zestawów: Mała Nauka, Japoński ogród, Pradawny las. Każda strefa zachowuje własny zestaw, dziesięć poziomów warstw, głośność, tempo, energię, zmienność i długość pętli. Pięć trybów oraz start i wyniki mają osobne melodie. Zestawy to oryginalna synteza; charakter ogrodu i lasu jest inspirowany wskazanymi soundscape'ami myNoise, bez używania ich nagrań.

Wiatr jest łagodnym, niskim podmuchem; strumień ma dyskretne bąbelki i pluski; liście to oddzielne szelesty; fale mają długi przypływ i odpływ. Ogród dodaje bambusowe stuknięcia i delikatne dzwonki; las różne ptasie sylaby, gałązki i odgłosy skrzydeł. Krótkie efekty używają miękkich drewnianych nut i sprężystych odbić. Zera wyłączają kanały.

## Ciągłość i odblokowanie

PWA zachowuje jeden odtwarzacz w powłoce aplikacji. Dokumenty trybów korzystają z niego przez jawny, wspólnoźródłowy host. Wczytanie albo usunięcie ramki trybu nie zamyka odtwarzacza. Podglądy Studio pozostają niezależne. Kliknięcia, ustawienia, pauza, ładowanie i reakcje na odpowiedź nie zatrzymują tła. Domyślne wyciszenie tła przy efekcie wynosi 0%.

Przy zmianie strefy poprzedni motyw gra do przygotowania całego następnego; następnie oba nakładają się krzywymi sin/cos. Czas przejścia: 800–6000 ms, domyślnie 2600 ms. Powrót w trakcie przygotowania anuluje oczekującą zmianę bez restartowania aktualnej muzyki. Limit buforów: 64 MB / 24 wpisy, maksymalnie osiem krótkich głosów. Dłuższe warstwy generuje Worker.

Dźwięk jest domyślnie włączony; pierwszy rzeczywisty gest odblokowuje AudioContext. Nie ma osobnego przycisku „Włącz dźwięk”. Wyciszenie w ustawieniach gracza i ukrycie aplikacji nadal zatrzymują odtwarzanie. Odtwarzacz wznawia przerwany kontekst po kolejnym geście. Dźwięki kolorów, białego bloba i wejścia są zsynchronizowane z czasem oraz prędkością animacji.

## Mapa, test i eksport

Mapa wiąże semantyczne działania z brzmieniem, głośnością lub ciszą. Miks krótkiego brzmienia obejmuje drewno, dzwonek, sprężynkę, powietrze, długość, ton i miękkość początku. Kliknięcie i późniejsze `change` nie dublują sygnału. Suwak kontynuacji gra po ukończeniu ruchu.

„Sprawdź dźwięk” odtwarza znany ton bez zmiany szkicu. Opis rozwija się w prawo, w wysokości przycisku i granicach karty. Odtwarzający przycisk jest niebieski z białą ikoną. Test przy zadaniach można zakończyć. WAV eksportuje aktywną strefę, ZIP krótkie efekty, siedem skonfigurowanych motywów i ustawienia JSON.

## Weryfikacja rewizji 30

Testy obejmują zapis i zakres stref, rozróżnienie zestawów, sygnały i szwy pętli, przygotowanie przed crossfade, anulowanie szybkiego powrotu, wyciszenie, budżety, WAV/ZIP oraz prędkość animacji. Lokalny WebKit sprawdza Studio i rzeczywiste dokumenty wszystkich pięciu trybów: start, odpowiedź, zakończenie, podsumowanie, kolekcja i powrót do Home. Sprawdza też jedną tożsamość odtwarzacza, brak dodatkowego AudioContext w ramkach, aktywne źródła muzyki i blobów. Uruchomienie: `node tools/verify-screen-readiness.mjs webkit` po buildzie, z zainstalowanym Playwright/WebKit; opcjonalny trzeci argument wskazuje adres testowy. Fizyczny odsłuch na iPhonie oraz instalacja ze starym cache nie są tym testem potwierdzone.
