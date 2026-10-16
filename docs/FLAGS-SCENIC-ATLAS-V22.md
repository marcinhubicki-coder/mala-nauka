# Scenic atlas v22

Isolated continuation on `feature/flags-scenic-preview-v1`. No production or main changes.

## Reference and final behavior

References: attached `Polish Geography Quiz: Europe and Neighbours.png`, `image(20261016-003331).png`, and existing Library asset `europa-atlas-polska.png` (15 October). The attached desktop component was not present in this branch; its exact existing SVG geography/camera implementation is retained, rather than rebuilding the game. The artwork is a common continental raster with the selected canonical country path above it. No generated country maps.

- Typography uses only 36 / 34 / 30 CSS px. Poland 36, Switzerland 34, Liechtenstein / Bosnia and Herzegovina / North Macedonia 30 with two explicit lines. The title slot is always 76 px, and the geographic viewport has a constant inset independent of the title. No fit-to-width shrinking. Liechtenstein uses a visual line break after `Liechten`; accessible name remains unchanged.
- Paper remains the same four-fold material and separate compass throughout opening/closing. Map ink finishes erasing before folding. Existing answer sand, Session, slider, preload and pause/restart remain.
- New common watercolor terrain material; smaller trees, luminous meadow washes, rocky accents. Canonical Natural Earth geometry defines every country/coastline. These are illustrative terrain decorations, not physical topography data.
- Fine cream borders and a dark green multiply highlight preserve the underlying terrain. The common WebP is 2040 × 1500. No map per country.
- New genuine alpha brush-edge mask, optimized to 768 × 512 / about 25 KB. No blurred rectangular paper backing. First generated mask was rejected because it had a transparent hole in its center; second was inspected and converted preserving alpha.
- Mobile keeps only globe/zoom buttons in a small translucent pill. No neighbor chips, legend or source paragraph in the mobile card. The existing landscape, mast, boy and dog remain one coherent scene.
- Both camera modes reuse the exact same Canvas, raster, mask and path; 520 ms interpolated camera, no DOM/image swap. The geometry surface is reused, not allocated every frame. The camera stops if erasing/restarting cancels it. Full Europe and near view share a fixed heading.
- Country labels use constant CSS-size Canvas text with collision/edge limits. Names crossing the selected country are omitted. This avoids baking tiny/oversized text into zoomed artwork. Mobile shows at most six nearby labels, not a separate list of every neighbor.
- Source and explanations appear in a desktop side panel. Geometry is Natural Earth 1:110m public domain, not Eurostat/GISCO from the separate screenshot. Existing microstate markers remain where the source lacks polygons.

## Inspected iterations

1. Compared both attachments and inspected the existing v14 WebKit frames. Existing beige speckled atlas was visually too plain.
2. Generated terrain and alpha material with built-in imagegen. First mask rejected, second accepted. Initial rendered card exposed too much heading whitespace, oversized trees at near zoom and hair over answer text; proportions and text spacing corrected.
3. Inspected Poland near/full Europe, Switzerland, Liechtenstein, Bosnia, Macedonia and a low display. Kept fixed typography and camera viewport, reduced label clutter and retained actual terrain detail inside the highlighted country.

4. Camera frame review exposed labels whose anchors were limited to the initial near crop. Anchors now cover the complete canonical countries; a regression assertion requires full Europe to include western country labels. Labels also avoid the control pill.

5. Exhaustive reduced-motion layout inspection covered all 45 European records. Only Luxembourg overflowed the default 34 px tier; it now has an explicit 30 px single-line entry. This exhaustive title/constant-viewport check is part of the full Chromium/WebKit suite.

## Assets / generation

`assets/maps/europe-terrain-v22.webp` — built-in imagegen, source `exec-280e1ab4-fef4-45d4-b198-3ebb64b630fa.png`. Prompt: ONE flat top-down warm yellow-green watercolor meadow material for a children's atlas, tiny evergreen/broadleaf clusters, low rolling hills and a discontinuous ivory/ochre rocky belt in the lower quarter; calm middle for labels; rag paper grain, translucent blooms and drybrush. No recognizable continent/country, coastline, boundaries, words, UI or sea. Style reference: existing `europa-atlas-polska.png` and supplied mobile mockup. Geography supplied only by existing code.

`assets/maps/europe-edge-v22.webp` — built-in imagegen, accepted source `exec-a708c7b1-2917-4212-b114-9cc808c45510.png`. Prompt: single solid opaque white filled paint swatch on genuine transparent background, landscape rectangle nearly fills canvas, entire interior opaque, ragged dry watercolor edge only in outer 4%, no frame/hollow center/dark region/shadow/gradient/text. Converted to white RGB plus generated alpha, resized to 768 × 512 and compressed losslessly. Rejected first output: `exec-97a0edd8-9632-4b49-b546-8471861689a1.png`.

`assets/maps/europe-scenic.webp` — deterministic shared build from canonical SVG plus this material, not AI geography. Sea is a baked aqua pigment wash and wave marks. Fine borders share the exact runtime path coordinates. Country labels are painted by the camera for readability.

## Verification

- Layout iteration: 21/21 Chromium scenarios passed before final label/camera/mask cleanup.
- Full final Chromium/WebKit suite, actual animation frames and publication recorded after this commit.
- Local constrained Chromium is an npm-packaged headless binary; CI uses pinned Playwright 1.64.1 Chromium/WebKit. No local browser binaries or node_modules are committed.
- Physical iPhone 13 Pro Safari/PWA FPS, thermal behavior and memory pressure remain device verification; Linux WebKit is not physical iOS Safari.
- Protected Vercel previews may require owner login. No deployment protection is disabled or bypassed by these changes.
