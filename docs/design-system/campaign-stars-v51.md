# Kampania — gwiazdki, portal i żywa mapa, v51 lokalnie

Baza: v50 (`d3ca9dd`), branch `work/campaign-stars-v51`. Wspólny kod PWA i
Design Studio, bez publikacji na Vercelu. Chronione: CTA Home, nagłówki gier,
Flagi v49, cztery narożniki pól, portretowy kadr i zapis dotychczasowej kampanii.

## Gwiazdki i zapis

- Progi gwiazdek: 20 / 40 / 60 / 70 / 81%. Trzy gwiazdki, czyli 60%,
  pozwalają ukończyć pełną rundę i przejść na kolejne pole. Pięć gwiazdek:
  81–100%. Niepełna lub przerwana runda nie przyznaje oceny.
- Pięć wytłoczeń pojawia się po pierwszej zakończonej próbie. Nowy krok nie
  rezerwuje miejsca na pusty pasek. Powtórka pokazuje najlepszą zapisaną ocenę;
  słabsza próba jej nie obniża i nie przesuwa pionka.
- Wynik i oczekująca prezentacja zapisują się razem z rundą. Powrót z
  podsumowania: przygaszenie → rosnące gwiazdki z promieniami → przelot po łuku
  do karty → teleport. Przeloty zachodzą na siebie. Odebrana prezentacja jest
  usuwana; ten sam wynik nie przyznaje nagrody drugi raz.
- Medal „Szlak pięciu gwiazd” liczy różne kroki z najlepszą oceną 5/5,
  niezależnie od trybu: brąz 5, srebro 15, złoto 30 kroków. Wymagania są edytowalne
  w przepisach nagród. Dotychczasowym ukończeniom nie dopisujemy zmyślonych ocen.
- Karta eksponuje cel i krótką historię. Przygotowano 105 krótkich fragmentów
  opowieści. W Studio można nadpisać historię pojedynczego pola.
- Tylne ujęcie postaci obraca się do następnego ruchu; osobno ustalamy kierunek
  przed odejściem i po dotarciu. Lustro działa na wewnętrznej warstwie ilustracji.

## Portal między światami

- Postać rozpada się na 300 świetlików. Kolory i punkty źródłowe pochodzą z
  nieprzezroczystych pikseli rzeczywistego obrazka bohatera, nie z gotowej palety.
- Losowe krzywe przenoszą drobinki do portalu. Następuje duże, skończone
  przejście galaktyczne z rozmyciem. Następna mapa jest zdekodowana przed zmianą.
- W nowym świecie świetliki nadlatują z obu boków, składają bohatera na pierwszym
  polu i zanikają równocześnie z ujawnieniem pełnej grafiki.
- Jeden canvas, 300 punktów, maksymalnie 30 odmalowań na sekundę i DPR 1,5.
  Odczyt próbek jest buforowany osobno dla grafiki chłopca i dziewczynki. Nie ma
  300 węzłów DOM ani stałej pętli po zakończeniu. Ukryta karta zatrzymuje czas.
- Zwykły teleport między polami pozostaje krótszą animacją pierścienia.
  Reduced-motion zachowuje zmianę świata, wynik i postać bez lotu drobinek.

## Żywa mapa — drugi przegląd

- Pierwszy impuls po około 2 sekundach; kolejne domyślnie co około 8,5 sekundy.
  Domyślnie do 10 sąsiednich części, twardy limit 12. Początek impulsu trafia
  w środkowy widoczny obszar, zamiast chować się pod nawigacją.
- Wyraźniejszy obrót przestrzenny (około 77° przy sile 55%), kołysanie i
  mocniejsze światło. Sąsiednie elementy startują z opóźnieniem 180 ms.
  Jeśli trwa impuls światła, łańcuch czeka zamiast przepadać do kolejnego cyklu.
- Pod animowaną częścią pozostaje nieodkryta tekstura. Ruch nie zmienia stanu
  odkrycia, nie odsłania dalszej ścieżki i nie dotyka poznanego terenu.
- Rozmycie przygotowuje się raz przez pomniejszenie i ponowne powiększenie
  obrazu. Jest wspólne dla Chromium i WebKit, który ignorował filtr canvas blur.
  Główny obraz nie jest odmalowywany podczas ruchu małych fragmentów.
- Układ mapy obliczamy przed dekodowaniem warstwy efektów. Zmiana wysokości
  okna i wysokości karty zachowuje proporcje, zgodność pól i miejsce dla pionka.

## Tester

`Design Studio → Mapa kampanii i animacje`:

- „Wynik rundy” i „Przyznaj gwiazdki i przejdź” uruchamiają ten sam model oraz
  animację co prawdziwy powrót z podsumowania. Wcześniejsze pole testuje powtórkę.
- „Portal do nowego świata · 300 świetlików” uruchamia pełne przejście.
- „Żywa mapa” kontroluje częstotliwość, czas, liczbę pól, siłę i światło.
  „Uruchom impuls teraz” pozwala sprawdzić efekt bez czekania.
- Panel odświeża wybrane pole i postęp po zakończeniu animacji. Symulacja nie
  zapisuje profilu dziecka. Ustawienia projektu nadal korzystają z Cofnij /
  Ponów / Zapisz lokalnie. Nie zmieniono sposobu akceptacji geometrii.

## Dowody i ograniczenia

- 488 testów Node; 100 sprawdzeń kontraktów (50 widoków × iPhone/desktop).
- Przegląd 1: rzeczywista runda matematyki 6/10, zapis 3 gwiazdek, powrót z
  podsumowania do nadrzędnej PWA, powtórka, lepszy i słabszy wynik, kierunek,
  duży portal oraz sprzątanie warstw. Chromium i WebKit, normalny i ograniczony
  ruch. Również rzeczywiste pobieranie postaci z biblioteki CDN i odczyt kolorów.
- Przegląd 2: trzy kształty siatki, samoczynny pierwszy impuls, widoczny obrót,
  pełna wysokość maski, budżet fragmentów, brak ruchu odkrytego terenu, nieruchoma
  główna tekstura; kontrola krótszego okna 375 × 667 i bazowego 390 × 844.
- Zachowane efekty kart i kuźni przeszły osobny scenariusz regresji v50.
- Raporty: `.design-qa/v51/` i `.design-qa/v50/report.json`; wybrane zrzuty oraz
  kopie raportów są w katalogu zadania `outputs/v51/`.
- Testy WebKit na Macu i automatyczna emulacja telefonu nie są sprawdzeniem na
  fizycznym iPhonie. Nie stwierdzamy na tej podstawie zużycia baterii ani braku
  wszystkich możliwych błędów urządzeń. Vercel nadal ma zaakceptowane wcześniej v48.
