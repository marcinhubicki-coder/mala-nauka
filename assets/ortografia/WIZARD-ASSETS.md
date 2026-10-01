# Spelling mission setup assets

The original setup mockup is the visual reference. The UI is rendered in HTML and CSS; words, selections and buttons are live controls. The existing shared Jelly V4 source and animation preset are unchanged.

- `wizard-sky-retina-v1.webp`: full-bleed 1170 × 2529 background, 3× the iPhone 13 Pro CSS width. No system bar, text or controls are baked into it.
- `wizard-mission-retina-v1.webp`: transparent 1200 × 404 mission banner. The character, cream banner and abc icon are artwork; the two mission lines are HTML.

The assets were prepared with the built-in imagegen tool using the supplied “Kolorowa misja ortograficzna dla dzieci.png” as the edit target, then encoded as WebP for delivery. The unmodified generated PNGs were retained outside the repository.

## Background prompt

Use case: precise-object-edit. Edit target: supplied spelling setup mockup. Asset type: full bleed portrait app background, no UI. Remove EVERY UI element, button, text, status bar, white card, mission banner, boy, abc badge and controls. Reconstruct ONLY the exact background landscape behind them: brilliant cyan blue sky with soft white fluffy rounded clouds, upper 65% mostly sky, distant green hills/trees around bottom third, bright lime lush grassy meadow, large leaves and white daisies along bottom corners. Keep the original color palette, original 3D children's animation render style, original cloud lighting, original depth of field and original framing. The center must be uninterrupted clear blue sky where a UI will overlay; no new characters, no text, no panels, no logos, no frame. Render as a tall 9:19.5 high-resolution portrait asset for a retina iPhone.

## Mission banner prompt

Use case: precise-object-edit. Edit target: the mission banner at top of supplied spelling setup mockup. Asset type: isolated wide banner art to be overlaid behind HTML live text. Precisely recreate/extract ONLY that pale warm cream cloud banner, the pink glossy tilted abc badge with yellow star and yellow rays at LEFT, and the smiling explorer boy holding pencil at RIGHT with his tan hat extending ABOVE the banner top. Keep the exact character, pose, 3D render, composition and colors in reference. Banner aspect ratio 3.85:1, full asset bounding box ratio about 3:1 to include hat extension. Leave the MIDDLE EMPTY cream for HTML copy. REMOVE 'Twoja mała misja' and 'Złap właściwą literę.' text entirely. Keep 'abc' on icon. No blue sky around the banner; all space outside the rounded cream banner/character/star must be genuinely transparent. No other UI, no buttons, no status bar. High resolution, sharp retina quality, original proportions: abc occupies left23%, text negative space middle42%, explorer right35%.
