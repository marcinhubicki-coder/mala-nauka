# Flags: outer scene and prepared cloth, 2026-10-02

Branch: `design/profile-and-learning-v5`. UI commit: `98576709a62094c3239e9a99a35b730078344491`.

## Four visual loops

1. `585ec955`: shared finished cloth cache; next question reserved during feedback, both question and reveal sizes prepared; continuous portrait landscape, parchment answers, vector header controls and decorations.
2. `f0c80094`: move header controls inward, widen progress line, quieter answer type, thicker parchment edge, compass corner.
3. `e6f628ee`: final prompt/answer sizes, vector compass with no spoken decorative glyph, same answer ordering as the reference in the explicitly labelled material fixture. Capital questions also keep four seconds.
4. `98576709`: encouragement font/width matches reference; soft light under green marks preserves contrast against foliage.

Screenshots are actual deployed browser captures at 390 × 844 CSS pixels with simulated 47/34 px safe areas. Original photograph has a different aspect ratio; the left panel of `reference-comparison.jpg` is normalized for visual comparison. This is a close visual interpretation, not a claim of identical raster pixels or physical iOS validation.

## Loading and confirmation

The same source SVG and shared light texture generate a reusable static cloth surface. Eight finished Retina canvases are retained; concurrent requests share pending work. Cached surfaces are copied synchronously before a frame paints. DOM mast, finial and cloud composition reuse the same component. No per-country rendered bitmap is stored.

`Session.prepareNext()` reserves one generated question during flag feedback without advancing the question index. `next()` consumes it once. Current/reveal and next/reveal cloth sizes warm in the background. Correct country and capital remain visible for four seconds; round time is paused during confirmation. “Dalej” permits an earlier continuation. Wrong-answer review remains explicit. Other modes retain existing feedback timing.

Browser verified a real randomly generated Ukraine → Czechia round: both reveal and next country reported `clothCache=hit`, `clothReady=true`. Poland reveal captured in loop 3 repeats that result and displays Warszawa. Before answer country/capital detail is absent. Card and answer geometry is unchanged before/after feedback: card (24,183,342,275), answers (18/201,506/592,171,76), scroll height 844. Long Central African Republic name fits the fixed name slot. Square source shape remains intact.

Validation: 28 Node tests passed, including reserved-question consumption, confirmation without time loss, pause/resume, and capital confirmation; offline precache resolves. Browser logs had no application errors (extension-only errors excluded).

## New shared art

Built-in imagegen mode. Saved asset: `assets/flags/adventure/game-scene-v2.webp`, 853 × 1844, converted from the whole generated PNG to WebP quality 94. Cloth rendering itself uses at least DPR 3. Code-native textures: `assets/flags/adventure/answer-paper-v2.svg`, `assets/flags/adventure/answer-compass-v1.svg`.

Final prompt:

> Use case: illustration-story. Asset type: full-screen portrait background for children's geography adventure, tall aspect ratio 390:844, high resolution retina. Reference image is composition and style guide. Generate ONLY the landscape background behind the interface, reconstructing it where UI obscures it. Remove ALL text, controls, progress bars, parchment UI cards, flags, flag poles, answer buttons and labels. Match reference closely: leafy branch large in upper left corner; fluffy white clouds and bright blue sky in top quarter; ONE small coral/cream striped balloon near x75% y8%; soft painterly blue-gray alpine mountains beneath; warm sunlit forest valley and sandy path filling middle, lush foliage around left/right edges. NO water/lake, buildings, castles or identifiable national landmarks. Bottom 15% has close-up wooden explorer table: leather journal cropped lower left, open decorative neutral map center, large beautifully detailed brass compass cropped bottom right. Foliage wraps lower sides. Center middle is softly defocused and calm beige/green forest/path so UI sits legibly on it; no large unbroken blue band in middle. Rich soft tactile 3D storybook illustration, polished whimsical warmth, matching sample's lighting and perspective. No frame, no lettering, no symbols resembling UI, no flag, no parchment card. Full bleed portrait.
