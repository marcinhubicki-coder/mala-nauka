# Ilustrowana kuźnia i galeria nagród

„Moje wyniki” korzysta z rzeczywistych osiągnięć zapisanych w profilu. Statyczne puchary kategorii z dawnego podglądu zostały usunięte z renderera. Przełącznik rozdziela medale za zadania od dużych pucharów. Nieodkryta nagroda ma zamknięty prezent zamiast docelowej ilustracji.

Puchar wiedzy zachowuje zapisane podstawy i ścieżki. Pierwszy wybór następuje za 5 słów „Umiem”; etapy brązowy, srebrny i złoty wymagają 25, 100 i 500 słów. Progi 50 i 250 pozostają kamieniami milowymi. Pięć prezentów kryje podstawy, a dwa kolejne — ozdoby danego etapu. Wygląd jest odsłaniany po trwałym zapisie i animacji bańki. Anulowanie oraz błąd zapisu zachowują poprzedni wygląd. Preferencja ograniczonego ruchu skraca odsłonięcie.

Duże puchary obejmują także całą odkrytą kolekcję i ukończenie pakietu. Pierwszy agreguje istniejące, trwałe osiągnięcia odkrycia wszystkich kategorii; drugi korzysta z istniejącego `complete-base-v1`. Nie wprowadzają nowej waluty ani dodatkowych punktów. Krótsze cele są medalami. Podgląd obejmuje zdobyte nagrody, najbliższe wyzwania medalowe i puchary przy co najmniej 75% postępu; pierwszy puchar wiedzy jest zawsze widoczny jako początkowy cel. Dalsze nagrody nie zdradzają wyglądu.

Wybrany puchar stoi na ilustrowanym podium. Pasek pod nim przewija się poziomo i podmienia nagrodę na podium. Maksymalna wielkość sprite'a to 200 px, także podczas animacji. Warianty kolorystyczne kontrolek pochodzą z bieżącego trybu gry.

## Biblioteka i Design System

Cztery ilustracje ImageGen — kuźnia, podium, zamknięty prezent i atlas czterech mocy — są opublikowane atomowo z indeksem na gałęzi `assets/library-v1`, commit `f2f539e382fe4024b2d9218ee8f5f3d6dcf13242`. Aplikacja zawiera wyłącznie metadane w `shared/gallery-assets.mjs`. Łączny transfer nowych obrazów: 803 334 B. Przezroczystość jest zachowana. Obrazy są ładowane przy użyciu danego widoku; lista startowa PWA nadal ma 28 grafik i 2 731 076 B.

Wszystkie elementy galerii, przełączniki, obrazy i okna wyboru mają jawne wiązania w Design Systemie. Zachowano 45 widoków i wspólny renderer PWA/Studio. Widoki `trophy-base` i `trophy-evolution` pokazują prawdziwe okna prezentów. „Punkty i wyniki” opisuje podział nagród i etapy odsłaniania.

## Weryfikacja

- 439 testów jednostkowych.
- 90 kontroli kontraktów: 45 widoków na iPhonie i desktopie, w tym rzeczywista zmiana stylu przez Design System.
- Test przełączania urządzenia: zachowanie widoku, stanu i szkicu.
- Test galerii na obu urządzeniach: błąd zapisu, anulowanie, brak podglądu ozdób, zapis przed odsłonięciem, animacja, przełączanie podium i widok medali.
- Pełny Test PWA: tutorial, kuźnia, trwały puchar, reguły, wszystkie pięć gier i ponowne uruchomienie offline.
- Publiczny indeks oraz bajty i SHA-256 wszystkich czterech nowych plików sprawdzone w bibliotece. Kompilacja Vercel usuwa wszystkie pliki graficzne z pakietu aplikacji.
