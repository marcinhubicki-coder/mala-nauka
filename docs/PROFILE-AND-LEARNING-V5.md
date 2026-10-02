# Profile and learning UI v5

## Behavior
- Polish glyphs: profile display headings use existing DynaPuff; profile body uses full Nunito. Both cmap tables contain ĄĆĘŁŃÓŚŹŻąćęłńóśźż. Fredoka did not.
- Nicknames require three to eight NFC-normalized characters; existing saved profiles are not truncated. Validation uses a Polish inline message; native browser validity popovers are suppressed.
- Keyboard resizing uses VisualViewport height and offset. Only form content scrolls. Input does not auto-open the keyboard.
- The original four avatars remain; e–l add eight portraits.
- Explicit pinEnabled=false persists on the profile. Existing hashed PINs remain protected. Changing protection requires an active session for that profile. Progress stays in the existing per-player store.
- Starting spelling uses the existing 1.5 s outgoing/incoming blur. Session is paused through the transition; no round time is spent on it.
- Wrong-answer continuation and repeat-round controls require full handle movement; taps cannot activate them. Partial gestures recoil. Completion stays visible briefly.
- Count status is ascending current/total. Count options change only the start CTA (10: Krótka misja!, 20: Zaczynamy misję!, 40: Dłuższa misja!, 80: Wielka wyprawa!). The grey count-mode note stays constant.
- Rules default to explanations, grouped by the existing learning title/type/category. Illustrations are noninteractive, at most ten per rule; selectable words remain a second view.
- Learning philosophy and durable mastery calculations remain from docs/LEARNING-SYSTEM.md.

## Artwork
Built-in image generation, inspected and optimized to WebP without changing original four avatars.
- assets/brand/player-avatars-extra-v1.webp: ONE transparent 4x2 sprite atlas, eight friendly smiling 3D children with pastel circular badges. Blonde bob/lilac; black-haired boy/aqua; dark-skinned girl with puffy buns/peach; brown-haired boy with blue glasses/mint; dark-haired girl with bangs/sky; dark-skinned curly-haired boy/yellow; auburn braided girl/green; freckled blonde boy/violet. Existing avatar atlas was the style reference. No text or overlapping badges. SVG sprite viewports account for the generated atlas's margins.
- assets/ortografia/game-meadow-animals-v3.webp: edit of game-meadow-v1.webp. Preserve upper quiet sky, castle, meadow, stream and daisies; add a small white rabbit looking toward viewer, a walking side-profile hedgehog and a grazing fawn within the lower meadow; final edit shrinks and moves the animals into the bottom strip so controls cover less of them. Match sunlight and children's storybook style. No UI or text.

## Validation
node --test tests/*.test.mjs. New coverage checks Polish minimum length, persisted avatar/PIN choices, protected/unprotected switching, session-scoped PIN updates, and bounded source-based rules/examples. Browser verification is recorded with final preview; physical iOS keyboard remains a hardware check.

## Follow-up polish v6
- Avatar previews set width, height and flex-basis to 80 px. Extra portrait viewports are square and preserve aspect ratio, rather than mapping a 320 × 344 crop into a square.
- PIN mode reuses createJellyV4 unchanged: blue mode colors, 440 ms delayed incoming ink and the same spring geometry. The mode DOM survives selection and digit entry; only PIN fields update. The card is top-anchored to keep the toggle stationary.
- PIN help: “PIN służy do przełączania profili.” The reminder about disabling it later remains below.
- Nick limit calculation: DynaPuff 700's widest letter is lowercase m, 0.934 em. At the 390 px target, the roster's text column is approximately 190 px. Eight letters at 25 px occupy 186.8 px before the negative 0.4 px tracking (about 184 px); nine require about 207 px and do not fit. PIN name has 218 px at 28 px type; eight occupy about 206 px with tracking. Shorter names retain larger type. New profiles are limited to 8; service rejects longer names instead of silently truncating.
- Drag pearls translate without scale or rotation, including their return spring. Answer buttons and start-CTA copy no longer squeeze. Segment Jelly geometry is intentionally unchanged.
- Correct praise has a local static white glow, white text outline and three rounded golden strokes on either side, matched to the Strażak reference. No added ongoing animation.
- Repeat CTA keeps the mockup's pink gradient, thin double white edge, small sparkles and soft glow; its round iridescent handle shows an arrow and a completed state.

### Settings meadow asset
assets/ortografia/wizard-meadow-animals-v2.webp replaces the settings sky background. The game uses its original game-meadow-v1.webp; animals belong only in settings. Built-in imagegen edited wizard-sky-retina-v1.webp: preserve the upper sky, clouds, trees, hills and leaves; add three small warm storybook 3D animals only in the bottom meadow — a cream rabbit looking at the viewer at x25%, walking hedgehog at x51%, grazing fawn at x77%, feet around94%, behind the foreground flowers, no UI or text. Output: generated_images/exec-bb57a1e9-148d-4fcd-80a2-7631c0c74501.png. Inspected and converted as a whole to WebP quality92, no manual raster editing.

### Verification
The existing service/round/drag/mastery/offline suites also verify the accepted 8-character boundary and rejection of 9. Browser QA: the maximum-width nickname in PIN measures 206.03 × 30.80 px inside a 218 px allowance; avatar 80 × 80 px; extra portrait viewport 320 × 320 with xMidYMid slice. PIN click and drag switch correctly; all four count CTA captions change while the note stays identical. A wrong-answer tap and partial drag stay on the question; full drag advances. Settings animals and repeat CTA are visually checked at 390 × 844. Praise must explicitly use flex-direction:row: generic feedback defaults to column, which otherwise stacks the rays and clips the footer. Its last grid row is 35 px with safe-bottom space.

The settings background is anchored center bottom, so Safari's shorter viewport crops sky rather than the animals' feet. The iPhone 390 × 844 and Pro Max 430 × 932 layouts retain the same proportions.

## Progress dashboard — reference layout v10
- Target: iPhone 13 Pro, 390 × 844 CSS px, 47 px top / 34 px bottom safe areas. Hero height is 286 px plus the top safe area; illustrated links are 142 px high. All dimensions share `--progress-u`.
- The hero is anchored 20 px below the bottom edge, lowering the girl and book. The active tab remains in front of her hair. A feathered transition blends the flowers into the page; a separate soft white haze backs the tilted copy.
- Collection and category artwork is anchored at the top, retaining the original empty sky / yellow header area instead of cropping it off. A short colored gradient protects the labels. Image placement, tile height and trophy size can be tuned in the single dashboard stylesheet.
- Dashboard headings use Nunito 800 (hero 850); supporting copy uses 500–550. The Polish cmap remains complete. Metric checks reserve room for the two-line card headings and the rules title before the arrow.
- All dashboard arrows use the same SVG chevron, centered with grid/flex rather than a text baseline. Trophy arrow positions derive from the trophy size; the rules arrow derives from the card center. The learning counter uses an orange vector gear.
- The rules panel is lower and 95 px high. Its whole bulb and book stack are visible; the reusable SVG backing adds pastel clouds, stars, leaves and a flower. Muted labels have darker colors for contrast on the pale backgrounds.
- Cache v132 includes the decorative SVG and new stylesheet/module versions. Static syntax and whitespace checks only; preview/browser testing intentionally omitted at the user's request.


## Progress reference validation — 2026-10-02
- The latest phone capture showed a uniform 47 px downward offset. The standalone preview now carries the same Apple full-screen and black-translucent status-bar metadata as the main app. Desktop preview simulates the 47 / 34 px safe areas; its OS chrome is confined to the wrapper iframe.
- The 390 × 844 reference anchors are: tabs 88, stats 327.5, illustrated links 402.5, achievements 553, rules 731.2 px. Loop 1 matched these within 1 px, with client and scroll heights both 844 px. Carousel clicks retained all section and arrow positions.
- Loop 2 fills the status-bar artwork edge, indents the tilted headline's second line, brings the link artwork upward within its fixed containers, enlarges trophy labels and replaces the rules stack with artwork having a natural wide aspect ratio.
- Built-in image generation supplied `assets/progress/hero-v2.webp`, `mode-icons-v2.webp`, and `rules-books-v3.webp`. Hero prompt: preserve the supplied fairy-tale meadow, sky, castle, girl, rabbit and book composition, remove UI and text, provide room for the tilted copy. Icons prompt: transparent 3-by-2 atlas with pink abc, blue 1+2, plain UK flag, globe and open purple book. Rules prompt: wide transparent storybook stack of three colorful books, large glowing yellow bulb, green leaves, purple flowers and golden stars, matching the reference. Whole generated images were converted to WebP quality 94; no manual raster composition.
- Validation uses screenshots and DOM measurements in the 390 × 844 browser frame. Native iOS status-bar behavior still needs the user's physical-device review. Game mechanics and stored learning data are unchanged.
