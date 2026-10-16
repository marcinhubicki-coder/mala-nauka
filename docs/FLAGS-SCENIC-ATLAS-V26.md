# Illustrated atlas v27

Continuation of the full request recovered from “Link do podglądu”, including
the later requirement for neighbour flags, small-country leaders and a capital
pin. Isolated to `feature/flags-scenic-preview-v1`; no production/main changes.

## Result

- One continuous runtime Europe bitmap, `europe-painted-v27.webp`, 3658 × 2688
  pixels, 96% WebP quality (about 4.2 MiB). It combines nine overlapping imagegen
  detail reconstructions of the original 1463 × 1075 illustration. This is not
  described as a single native 4K generation. Overview and near view share the
  same file; no runtime country or tile images are needed. The original v26
  bitmap remains as an authoring reference.
- The continental art replaces the repeated material. There are small forests,
  mountain ranges, flowing sea washes and sailing boats, with no buildings.
  Geographic authoring guidance uses Natural Earth's physiographic regions.
- More detailed Natural Earth 1:50m country geometry replaces the old 1:110m
  crop in this scenic variant only. The shared maps used elsewhere are unchanged.
  The extent includes surrounding Asian and African land, so Eurasia continues
  naturally through the eastern edge instead of ending at an artificial coast.
- All political boundaries and selected-country shading remain runtime vector
  overlays. AI artwork does not supply game boundaries or capital positions.
- Names and existing SVG flags are laid out together, with constant readable text
  sizes and collision avoidance. True land neighbours take priority. Small or
  displaced labels connect to their geographic anchor through leader lines.
  Switzerland's square flag retains its aspect ratio.
- A capital pin uses Natural Earth's populated-place coordinate, not the centre
  of the country polygon. All 45 playable European countries have capital data.
- Overview labels favour European countries; camera movement and label/flag
  transitions interpolate without swapping the underlying map surface.
- The full neighbour list appears only in the desktop side panel. Mobile keeps
  on-map labels and the two small globe/zoom controls.
- The incorrect-answer slider now uses parchment, warm gold edges, chevrons and
  the existing illustrated compass as its draggable handle. The original drag
  completion, partial reset, pause, keyboard and round transitions remain.
- Both the viewport and atlas source edges have chipped watercolor alpha on
  all four sides, including when the entire source rectangle is visible. The
  geographic canvas multiplies into the parchment. A separate heading canvas
  follows the same ink mask so white flag fields retain their proper colour.
- Larger 44/38/32 px title tiers (30 px for the long Bosnian name) and a 22 px capital make fuller use of the
  heading space. The sharp SVG flag keeps its true aspect ratio, a slight −2°
  rotation, delicate shadow and sheen. Country labels have lighter warm halos.
  The capital name avoids the pin itself.
- Existing three-pass ink reveal/erase, four-leaf paper material, fixed two-line
  title slot and answer sand transition remain.

## Source and reproduction

`tools/prepare-scenic-atlas.mjs` prepares the authoring guide, SVG, compact
metadata and provenance from three public-domain Natural Earth inputs. Pass the
directory containing their downloaded GeoJSONs as its only argument. Inputs and
guide are authoring files, not runtime dependencies. Source URLs and SHA-256s
are saved in `assets/maps/europe-atlas-v26-source.json`.

- [Country geometry](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson)
- [Capital points](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_populated_places_simple.geojson)
- [Physiographic regions](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_geography_regions_polys.geojson)
- [Natural Earth public-domain terms](https://www.naturalearthdata.com/about/terms-of-use/)

Projection: equirectangular, longitude −28…66°, latitude 74…30°, 680 × 500
registered coordinates. Exact SVG path data is reused by the Canvas renderer.
Country neighbour relationships come from shared source boundary segments.

## Built-in imagegen prompt

Edit target/reference 1: `europe-geography-guide-v26.png`, the exact projected
country/coastline guide generated from the sources above. Style reference 2:
the user-supplied `image-2.png` mobile mockup. Built-in imagegen was used; no
external image API or user API key was used. Original generated file:
`exec-eab59019-6c76-4e69-b62e-2a6774606878.png`.

> Create ONE final production raster for the children's geography game Mała
> Nauka: a breathtaking hand-painted storybook watercolor atlas of Europe,
> matching the warmth, tiny illustrated mountains, tiny forests, sea washes and
> little sailing boats of reference image 2. Image 1 is the STRICT GEOGRAPHIC
> REGISTRATION GUIDE and edit target; preserve its complete 680:500 coordinate
> framing, all coastlines and island positions exactly. Image 2 is STYLE
> REFERENCE ONLY: extract the art style of its map, never its UI, paper, text,
> flags or characters. Output a flat top-down landscape map image at the largest
> available high resolution in the exact same aspect ratio and extent as image
> 1, so country SVG outlines can later be overlaid accurately. Paint the entire
> land and sea as one beautiful high-detail continuous illustration. Soft
> turquoise/celadon watercolor seas, rich tiny ragged coastline pigment,
> luminous pale olive meadows, gentle ochre foothills, small groups of lovingly
> painted conifers and rounded broadleaf trees, warm ivory rocky snow-tipped
> mountains. The brown bands on image 1 are positional guidance for the Alps,
> Pyrenees, Carpathians, Dinaric/Balkan ranges, Caucasus and Urals; remove all
> flat colored guide bands and paint convincing tiny mountain ranges in their
> places. Mountains run mostly along western Norway, with the rest of Sweden
> and Finland largely rolling forests, NOT mountains everywhere. Apennines
> down Italy; warm dry hills in Iberia and Mediterranean, a broad flatter green
> plain across northern France, Germany, Poland, Belarus and Ukraine, boreal
> forests across Scandinavia and northern Russia, warmer steppe to the
> southeast. Tree and mountain symbols must be small relative to the continent,
> with crisp handcrafted detail when zoomed. Two or three small cream-sailed
> wooden boats in open Atlantic/Mediterranean water, sea ripples and at most
> two tiny gulls offshore; no buildings or people. CRITICAL: the Russia/Asia land
> continues naturally right to the right canvas edge as on image 1, with NO
> diagonal cut, artificial coast, gap, detached Eurasia island or hard color
> seam. Every land edge must preserve the guide, including Black Sea, Caspian,
> Baltic, Mediterranean, Greece, Scandinavian peninsula and Iceland. No text,
> no country names, no flags, no political border lines (runtime adds them), no
> compass, no parchment, no frame, no vignette, no decorative UI. Maintain a
> uniform painted surface; no repeating tile texture, no low-detail blurry
> patches. Avoid saturating grass lime-green or the ocean neon cyan.
> Atmospheric and playful children's illustrated world atlas, premium
> picture-book finish.

## Verification

- Three source/label tests validate all 45 playable European capital points,
  reciprocal land boundaries, crowded callouts and the irregular paint edge.
- Browser QA checks all 45 title layouts and near/overview labels against the
  actual alpha mask. Labels and leaders avoid other names. Required neighbours
  are solved together, with short leaders preferred over remote callouts.
- Poland's seven land neighbours have readable labels and flags; Liechtenstein
  has a flag and leader in the Swiss view. The full list is desktop-only.
- End-to-end scenarios cover paper, ink and sand frames, pause/restart, five
  consecutive questions, partial/complete slider gestures, keyboard controls,
  reduced motion and image, mask and geometry fallbacks.
- Actual mobile, overview and desktop renders were inspected. Physical iPhone
  Safari/PWA performance is not inferred from desktop WebKit.

The owner explicitly approved publishing this code, generated illustration and
project documentation to the public preview branch and creating a Vercel preview.
Final browser reports and deployment identity are saved with the handoff outputs.

## High-resolution reconstruction

The first attempt to request a larger full image still returned 1463 × 1075.
Nine overlapping 585 × 430 reference crops were therefore reconstructed by the
built-in imagegen tool at 1463 × 1075 each, preserving their normalized layout.
`tools/assemble-scenic-atlas-hd.mjs` joins those authoring files into a single
registered 3658 × 2688 atlas. The final full image and central-Europe detail were
visually checked for seams. `assets/maps/europe-painted-v27-source.json` records
the exact tile prompt, crop positions, generated filenames and SHA-256 hashes.
The authoring tiles are outside runtime; only the completed WebP is loaded.

The late v27 visual changes follow the owner's request for all-sided irregular
edges, multiply compositing, larger heading/capital, straighter main flag and
more zoom detail. Main/production stays untouched.

The Linux WebKit run exposed wider system-serif metrics for Liechtenstein and
Hercegowina. Liechtenstein keeps two explicit lines at 32 px; the Bosnian title
uses a fixed 30 px tier. Other enlarged headings remain unchanged.

Heading layout chooses once among the fixed 44/38/32/30 px tiers using the actual
platform font's DOM and Canvas widths. This handles Linux serif fallbacks without
a per-frame scaling loop. Canvas tracking matches the measured DOM title. The
map viewport and two-line slot remain fixed.

Fold-frame QA freezes the existing presentation timeline synchronously when the
fold class appears, then seeks real Web Animations frames. This removes remote
capture latency from the ordering assertion while retaining the requirement
that ink cannot start before the entire paper unfolding finishes.
