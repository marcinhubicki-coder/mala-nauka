# Źródła inspiracji — efekty i animacje Małej Nauki

Cel: jedno miejsce z linkami, nazwami i planowanym zastosowaniem efektów.

> Materiały poniżej są referencjami wizualnymi. Przed bezpośrednim użyciem zewnętrznego kodu / Lottie / assetu należy sprawdzić licencję. Preferowany sposób: niezależnie odtworzyć ideę i zastosować zasady z docs/ANIMATION-WEBKIT-GUIDE.md.

## Ważna adnotacja wydajnościowa

Wszystkie oglądane pojedyncze dema inspiracyjne działały płynnie na fizycznym telefonie. To dobra wiadomość: same pomysły i technologie nie są automatycznie „za ciężkie”.

Po osadzeniu w Małej Nauce efekt działa jednak razem z bańką, tłem, UI, innymi animacjami i PWA, dlatego każda adaptacja musi przejść osobny test w pełnej kompozycji.

## 1. Loader / start aplikacji

### LottieFiles — Featured Free Animations
https://lottiefiles.com/featured-free-animations

Kierunek:
- małe kolorowe kulki / formy;
- loader ma zająć czas realnego przygotowania aplikacji;
- bez obowiązkowego logo w środku.

Adaptacja Małej Nauki:
- 5 kolorowych kulek;
- 3 pełne obroty;
- pęcznienie;
- tęczowy rozbłysk;
- rosnące białe koło;
- po 0,6 s otwarcie środka koła i odsłonięcie pierwszego ekranu.

### Page Transition Effects / Morphing SVG
https://speckyboy.com/page-transition-effects/

Bezpośrednie referencje:
- Morphing SVG / Page Transition Loader — https://codepen.io/ARS/pen/wavXgQ
- Page Transition with Loader — https://codepen.io/johnheiner/pen/JdRybK

Bierzemy: kinowe przejście od loadera do treści, ruch od środka, odsłonięcie gotowego ekranu.

## 2. Gesty / onboarding

### Hand Gesture Animation
https://lottiefiles.com/animation/hand-gesture-animation_11755739

Możliwe użycie:
- pierwszy slider w Ortografii;
- swipe / drag;
- tutorial gestów.

## 3. Bokeh / atmosfera

### Bokeh effect (CSS) — Mamboleoo
https://codepen.io/Mamboleoo/pen/BxMQYQ

Możliwe użycie:
- globalne tło;
- sukces;
- combo;
- ambient.

Adaptacja iOS: duże plamy raczej statyczne / przenikające; małe elementy mogą się poruszać.

## 4. Combo — watercolor / fale / noise

Artykuł: https://speckyboy.com/css-javascript-snippets-noise-effects/

### Tri-Wave Animation — Chris Gannon
https://codepen.io/chrisgannon/pen/zYNRdWX

Użycie: globalne trzy fale jako nagroda za combo zamiast confetti.

### Dynamic Watercolor Effect
https://codepen.io/shshaw/pen/zPxMgd

Użycie: akwarelowe rozlanie koloru przy dobrej serii.

### Art of Noise #8 — Tibix
https://codepen.io/Tibixx/pen/bZLGbo

Użycie: abstrakcyjne kolorowe masy / heatmapa.

## 5. Combo — ogień

Artykuł: https://speckyboy.com/flame-effects-code-snippets/

### Fun Flames

Użycie: trzy rytmiczne, kolorowe języki ognia / hot streak.

### It’s Bubbly — CSS-only Fire
https://codepen.io/yamanda/pen/RpNMaY/

Użycie: organiczny, płynny płomień.

### Time Stands Still

Użycie: spokojny żar i kilka iskier. Nie kopiujemy setek cząsteczek.

Budżet Małej Nauki: maks. 8 lekkich iskier.

## 6. Matematyka — neon

Artykuł: https://speckyboy.com/neon-effects-web-design/

### Hot Ones neon sign — Aaron Minnamon
https://codepen.io/iamminn/pen/rGwqxe

Użycie:
- neonowy akcent Matematyki;
- zapalanie cyfr / wyniku;
- krótki feedback.

### Neon Grid Loaders — Mai El-Awini
https://codepen.io/maicodes/pen/RPeMYj

Użycie:
- loader Matematyki;
- krótka animacja cyfr;
- przejście między etapami.

## 7. Bańka — metaliczne obrzeże

Artykuł: https://speckyboy.com/metallic-effects-css-javascript/

### Metallic Badges with Angular Pseudo-Gradients — Ellesa Sabasaje
https://codepen.io/emsky/pen/xOyYad

Użycie:
- srebrne obrzeże;
- złote obrzeże;
- holograficzne / iridescent.

Preferowana technika: statyczny conic-gradient.

## 8. Bańka — płynna powierzchnia

Artykuł: https://speckyboy.com/creating-liquid-effects-on-the-web/

Najciekawsze kierunki:
- The Blob Comes Alive;
- Sorry, I Prefer a Shiny Blob;
- Wiggly, Jiggly Button;
- Juice Me Up;
- Morphing Liquid Rainbow Experience.

Adaptacja Małej Nauki:
- ripple / fale;
- silk / jedwabiste refleksy;
- jelly / galaretka;
- potencjalnie liquid rainbow.

Najpierw próbujemy lekkiej imitacji CSS; WebGL / GLSL tylko po osobnym benchmarku.

## 9. Ortografia — hasło z cząsteczek

Artykuł: https://speckyboy.com/repelling-effect-in-web-design/

### Interactive Particle Logo — Tamino Martinius
https://codepen.io/TaminoMartinius/pen/AobWbm

Źródłowy pomysł:
- litery zbudowane z punktów;
- repel od kursora / dotyku.

Adaptacja:
- krótka animacja przy zmianie hasła;
- prawdziwy tekst pozostaje czytelny;
- efekt nie opóźnia nowego pytania;
- dotknięcie może subtelnie odpychać punkty.

Budżet:
- WebKit / iPhone: maks. 32 punkty;
- pozostałe: maks. 64;
- bez ciągłej pętli fizyki.

## 10. Szablon wpisu dla nowej inspiracji

Przy każdym nowym efekcie dopisać:

1. nazwę;
2. URL;
3. autora, jeśli znany;
4. planowane miejsce w aplikacji;
5. element wizualny, który chcemy odtworzyć;
6. czego technicznie nie kopiujemy;
7. limit cząsteczek / warstw;
8. wynik testu WebKit;
9. status: pomysł / prototyp / test / produkcja.

## 11. Powiązana dokumentacja

- docs/ANIMATION-WEBKIT-GUIDE.md
- dokumentacja Design Studio
- testy efektów w tests/