# Approved home artwork

The visual source is the approved `Kolorowa przygoda nauki dla dzieci.png`
(853 × 1844). ImageGen removed only the greeting, two numeric scores and
the latest-round caption so real player data can be rendered over the art.
The original logo, explorer, illustrations, static lettering and game tiles
are retained. The operating-system status bar and home indicator in the
reference are excluded by the SVG viewBox; they are never drawn by the app.

`home-retina.webp` is a 1440 × 3113 WebP export, approximately 537 KiB.
This is a high-quality resampled export of the supplied artwork, not a
new native-resolution illustration. Resampling does not add source detail.
The shared atlas is downloaded and decoded once. The clickable tiles use
SVG windows into the same art, real buttons and the existing module router.
They keep the original `abc`, `1+2`, flag, globe, book and custom lettering.

`home-screen.mjs` holds coordinates in the reference's 853 × 1844 space.
`home-screen.css` scales that space uniformly to fit the available viewport
after iOS safe areas, without stretching or clipping the drawing. The live
greeting and numeric stats use the self-hosted variable Dosis font (OFL).
Static custom lettering stays in the artwork, rather than approximating it
with a different system font.

Development verification covers 390 × 844, 393 × 852, 402 × 874, 430 × 932,
440 × 956 and a 390 × 664 browser viewport at device pixel ratio 3. These
are browser emulations, not a claim of testing on physical iPhones.
