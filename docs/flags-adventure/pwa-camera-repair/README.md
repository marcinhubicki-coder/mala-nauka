# PWA rendering repair and whole-scene camera — 2026-10-02

UI commit: `980df860cf79a04ad0d391d191764ef7e93c9a5a`.

## Report and diagnostic limits

The supplied iPhone PWA screenshot had black paper fills and a visible empty pole. Chrome did not reproduce those WebKit symptoms and its app console was clean. The WebKit SVG fragment/base issues https://bugs.webkit.org/show_bug.cgi?id=189499 and https://bugs.webkit.org/show_bug.cgi?id=196950 describe a matching class of black-fill failure. They are supporting compatibility evidence, not a proven diagnosis of this particular Safari build. A blank decoder can be reproduced in the regression test.

## Repairs

- New paper decorations contain only explicit colors and path ornaments, without fragment-addressed SVG gradients/patterns. CSS supplies the paper gradient and a solid fallback. New filenames avoid serving old SVGs through an already-installed worker's canonical asset cache.
- The source flag SVG is normalized to explicit width/height derived from its own viewBox, decoded before use, and still supports internal paths/clips and source alpha. All 195 country inputs pass normalization checks.
- Decoded material and the visible canvas copy are checked for real pixels. An empty render keeps the source image visible and logs a structured warning instead of hiding the image behind a blank canvas.
- Removed flutter frames and the playback RAF loop. At most three prepared surfaces and six decoded image promises are retained. Discarded and temporary canvases are explicitly released.
- The sky, mountains, clouds, pole and flag are children of one `.flag-camera`. Only the camera scales/translates on an answer; `.flag-rig` keeps `transform: none` in both states. The pole does not move relative to its landscape. The country/capital and vector map are revealed separately.
- SW cache v144; adapter v14, camera component v10, renderer v7, CSS v15-pwa-camera. The updated offline manifest contains every new asset.

## Two visual validation passes

Chrome, 390 × 844 frame, safe top 47 / bottom 34, cloth 552 × 477 pixels (3× CSS size):

1. Initial and correct-answer Poland scenes. The cloth is visible, remains still and is reused with `clothCache: hit` after answering. Camera changes identity → matrix(0.81,0,0,0.81,97.28,7.11); rig stays untransformed. Sky is inside the camera, so it shares the motion. Hero remains x24,y183,342×275; answer tiles remain x18/201,y506/592,171×76.
2. Germany, transparent Nepal, square Switzerland, long Central African Republic after a wrong answer, then a fresh load of Poland before/after answering. All canvases are ready; no application render warnings/errors appeared. Long title width and scroll width both 149 px; no vertical overflow. All screenshots are direct browser captures without image editing.

The 1.15 s reveal still finishes before the full 4 s reading window. Wrong feedback waits for Continue. The preview fixture freezes its clock; the wizard screen uses a real round.

## Checks

- `node --test tests/flag-cloth.test.mjs tests/flag-feedback.test.mjs`: 9 passed, including blank-decoder fallback and reveal/reading/pause timing.
- `node --test tests/pwa-release.test.mjs tests/adventure-interactions.test.mjs`: 6 passed, including every offline precache path.
- JS syntax and `git diff --check`: passed.

Physical iPhone Safari/PWA is not available in this browser environment. Device confirmation is still required; these screenshots validate the iPhone geometry and app flow in Chrome, not a physical iOS run.
