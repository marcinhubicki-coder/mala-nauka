# Profile and learning UI v5

## Behavior
- Polish glyphs: profile display headings use existing DynaPuff; profile body uses full Nunito. Both cmap tables contain ĄĆĘŁŃÓŚŹŻąćęłńóśźż. Fredoka did not.
- Nicknames require three characters. Validation uses a Polish inline message; native browser validity popovers are suppressed.
- Keyboard resizing uses VisualViewport height and offset. Only form content scrolls. Input does not auto-open the keyboard.
- The original four avatars remain; e–l add eight portraits.
- Explicit pinEnabled=false persists on the profile. Existing hashed PINs remain protected. Changing protection requires an active session for that profile. Progress stays in the existing per-player store.
- Starting spelling uses the existing 1.5 s outgoing/incoming blur. Session is paused through the transition; no round time is spent on it.
- Wrong-answer continuation and repeat-round controls require full handle movement; taps cannot activate them. Partial gestures recoil. Completion stays visible briefly.
- Count status is ascending current/total. Count options have individual supportive messages.
- Rules default to explanations, grouped by the existing learning title/type/category. Illustrations are noninteractive, at most ten per rule; selectable words remain a second view.
- Learning philosophy and durable mastery calculations remain from docs/LEARNING-SYSTEM.md.

## Artwork
Built-in image generation, inspected and optimized to WebP without changing original four avatars.
- assets/brand/player-avatars-extra-v1.webp: ONE transparent 4x2 sprite atlas, eight friendly smiling 3D children with pastel circular badges. Blonde bob/lilac; black-haired boy/aqua; dark-skinned girl with puffy buns/peach; brown-haired boy with blue glasses/mint; dark-haired girl with bangs/sky; dark-skinned curly-haired boy/yellow; auburn braided girl/green; freckled blonde boy/violet. Existing avatar atlas was the style reference. No text or overlapping badges. SVG sprite viewports account for the generated atlas's margins.
- assets/ortografia/game-meadow-animals-v3.webp: edit of game-meadow-v1.webp. Preserve upper quiet sky, castle, meadow, stream and daisies; add a small white rabbit looking toward viewer, a walking side-profile hedgehog and a grazing fawn within the lower meadow; final edit shrinks and moves the animals into the bottom strip so controls cover less of them. Match sunlight and children's storybook style. No UI or text.

## Validation
node --test tests/*.test.mjs. New coverage checks Polish minimum length, persisted avatar/PIN choices, protected/unprotected switching, session-scoped PIN updates, and bounded source-based rules/examples. Browser verification is recorded with final preview; physical iOS keyboard remains a hardware check.
