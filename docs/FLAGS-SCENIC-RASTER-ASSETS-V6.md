# Scenic — materiały rastrowe v6

Użyto wbudowanego narzędzia `image_gen` i skillu imagegen. Referencje to fragmenty mockupu użytkownika. Pliki wynikowe mają przezroczystość; po generowaniu wykonano tylko skalowanie i zapis WebP do repo. Nie generowano flag ani geografii. Dane i granice mapy pochodzą z istniejącego SVG Natural Earth, a raster papieru dostarcza wyłącznie materiału.

| Plik w `assets/flags/adventure/` | Funkcja | Rozmiar |
| --- | --- | --- |
| `scenic-question-paper-v6.webp` | Pergamin i mosiężny kompas jako jedna ilustracja | 126 818 B |
| `scenic-answer-paper-v6.webp` | Kafelek bez ikon i liter | 32 846 B |
| `scenic-atlas-paper-v6.webp` | Materiał rozkładanego atlasu | 192 550 B |
| `scenic-task-sign-v6.webp` | Tabliczka zadania z drewnem i linami | 45 844 B |

## Prompt — pergamin z kompasem

Use case: precise-object-edit. Asset type: reusable raster UI parchment banner for a children's adventure flag quiz. Edit target: the supplied cropped mockup, preserve its premium cinematic storybook materials, brass compass, warm paper, rounded irregular torn edges, copper corner tacks, faint mountains/trees/trail/X drawings. Remove ONLY the dark blue Polish question lettering and remove every background pixel of landscape outside the parchment and compass, replacing the outside with true transparent alpha. Keep the compass beautifully dimensional with textured brass rim, glass reflections, cardinal dial and needle, exactly the existing shape and top-left overlap. Keep the entire compass and loop uncut. The parchment must have a spacious clean pale central area for live HTML text. Single horizontal banner occupying the image, about 3.5:1 including compass, no new UI, no text or numbers, no frames, no drop shadow rectangle, no solid background. Pixel-faithful extraction, do not redesign or recompose the illustration.

## Prompt — kafelek

Use case: precise-object-edit. Asset type: blank raster answer tile for the same children's flag quiz. Preserve exactly the supplied cream parchment rounded tile: soft pearl white dimensional rim, subtle golden bottom bevel, warm smooth pale center, delicate topographical contour lines confined to the corners, rounded wide rectangle with about 3.1:1 ratio. Remove the Polish word and the mountain icon, leaving generous completely clean center. Remove all surrounding scenic landscape, replace outside with genuine transparent alpha. Retain natural soft contact shadow tight below the tile, without a rectangular backdrop. Premium cinematic storybook 3D material, no symbols/icons/letters/numbers, no new decoration. Single tile at large resolution, fitted tightly to the canvas, preserve original proportions.

## Prompt — papier atlasu

Use case: style-transfer. Asset type: blank foldable atlas parchment frame for the same adventure game. The supplied raster banner is a material/style reference only. Create one portrait-ish rectangular parchment sheet, aspect ratio 1.2:1, pale creamy old paper with subtly irregular softly rounded/torn edges, small copper tacks at the four corners, richly textured gold-brown worn border and soft transmitted sunlight. Spacious completely blank clean central 85% area for live map and text. Keep visual material identical to reference: premium warm cinematic storybook 3D, fine paper fibres, softly curled uneven edges, restrained patina. Very faint tiny decorative mountain/trail motifs only on outer corners, no compass or objects, no maps, no geographic outlines, no text, no letters, no symbols in center. Seen straight front-on, absolutely flat interior for mapping, natural top-left light and subtle lower-right edge shadow. Single sheet tightly framed, genuine transparent alpha all outside edges, no solid backdrop, no white margin, no poster mockup, no perspective skew.

## Prompt — tabliczka zadania

Use case: precise-object-edit. Asset type: reusable raster task-counter sign for the existing children's adventure game. Extract the hanging wooden plaque and two short rope loops from this reference, with real transparent alpha all outside it. Remove ONLY the dark blue text, leave the plank's face clean for live text. Preserve warm natural honey wood grain, subtly carved edges, small bronze corner screws, two real hemp ropes from its two upper holes, cinematic warm sunlight from top left. Rotate the plank to a horizontal, front-facing orientation for dynamic CSS positioning; keep its width:height about 2.6:1, excluding short ropes above. Tight framing with ropes fully included. No landscape, no flagpole or golden ball, no extra objects, no text/letters/numbers, no flat illustration or icon. Premium dimensional storybook quality faithful to the supplied materials.
