# English setup: London scene and iPhone 13 Pro visual loop

Reference: user-supplied `B7C8CEFD-6899-4C5C-8A55-CC4EF2649287.jpeg`, 711 × 1536.
Implementation branch: `design/english-v0.1`.
Verified implementation commit: `c282f1713510de98df4f82361ea3adbe2fffe555`.

## Changes and iterations

1. Replace the damaged 12 KB backdrop containing large cyan placeholders with one continuous London scene. Use a separate English mission banner featuring the Union Jack rather than the spelling pencil/abc banner. Add static foreground lamp and tower contours using the same scene pixels and viewport coordinates.
2. Measure the reference layout at 390 × 844 CSS pixels. Move controls 1 px up and 1 px left and reduce the excessive cyan outer shadows.
3. Verify interaction in the deployed preview. Fix English's label clicks being retargeted to the Jelly buffer by pointer capture: opt into capture only after crossing the drag threshold. Other modules retain their previous capture behavior.

## Measured final layout

| Element | Left | Top | Width | Height |
| --- | ---: | ---: | ---: | ---: |
| Mission banner | 20 | 113 | 350 | 90 |
| Setup card | 20 | 227 | 350 | 341 |
| Scope controls | 39 | 278 | 312 | 55 |
| Form controls | 39 | 385 | 312 | 55 |
| Duration controls | 39 | 492 | 312 | 55 |
| Start button | 20 | 618 | 350 | 56 |

Safe insets simulated at 47 px top and 34 px bottom. At 390 × 700, the start button bottom is 557.98 px, with no horizontal or vertical overflow. The foreground has two static layers, `pointer-events: none`, and no filter or animation. The WebP backdrop is 338,210 bytes and the alpha mission banner 77,702 bytes. All three scene paints reference one cached image resource.

## Verification

- Deployed preview in cloud Chrome, an actual 390 × 844 iframe; repeated screenshot comparisons against the reference.
- Category tap opens the editor; checking Kolory and saving preserves both Liczby and Kolory.
- Changing to 2 min updates the start label; starting opens the English spelling game with a 2:00 timer.
- Returning to the preview, 3 min and 390 × 844 restores the target setup layout.
- No missing image assets; the lamp and tower render above the card and do not intercept controls.
- `node --check` for the changed modules, `git diff --check`, and four existing Jelly/PWA checks pass.
- Service worker v128 precaches the new graphics and module version.

Screenshot: `qa/english-settings-iphone13pro.jpg`.

## Verification boundary

The image is a reconstruction of the supplied scene, not a pixel-identical copy of every original texture or character detail. Layout geometry is measured, but a whole-screen pixel equality score is not claimed. This session does not include a physical iPhone or Safari/WebKit PWA run; touch hardware performance and iOS status-bar rendering remain unverified. Local browser installation and agent-browser daemon were blocked by the execution environment, so deployed cloud-browser QA was used.

## Asset generation specification

Built-in ImageGen edit mode was used for both assets. Final project paths:

- `assets/angielski/wizard-london-retina-v2.webp`: continuous portrait London scene, removed all UI, preserved reference placement of the lamp at the far left, Big Ben at the far right, bridge/bus and corgi below the CTA. No collage, no flat cyan rectangular fills, no text. Converted to 1170 × 2532 WebP, quality 88.
- `assets/angielski/wizard-mission-retina-v2.webp`: edit the existing spelling mission banner using the English screenshot as the appearance reference; replace abc with Union Jack and pencil with a small Union Jack flag; preserve boy, hat, yellow hoodie, green backpack, stars and cream banner; blank central area; transparent outside the art. Converted to 1200 × 404 alpha WebP, quality 90.

Keep scene and foreground in one shared coordinate system. Do not repeat the previous approach of drawing large blank rectangles over scenery or merging separately framed London images.

## Boy and lamp follow-up · 2026-10-03

Verified code commit: `a029b4318e4b6d62afcccfcb8af591ff55681ba2`.
Reference: `BD61AC07-75D8-4DE8-833A-BC916EF45068.jpeg` (711 × 1536).

1. Reconstruct the reference boy as a separate transparent WebP (360 × 345, 47,816 bytes). Render at 119 × 115 CSS px, x=251, y=88, with its bottom aligned to the banner at y=203. The hat protrudes above the banner. Retain the left flag from the existing art and exclude the previous boy.
2. Replace the coarse lamp polygon with a reproducible SVG silhouette traced from the same backdrop pixels. `tools/build-english-lamp-mask.py` retains 16,171 lamp pixels, excludes all classified blue sky pixels, preserves small openings and glass highlights, and writes 22 contours. Both standard and WebKit mask declarations use the same full-viewport coordinates as the scene.
3. The first deployed zoom check exposed a three-value CSS inset that also clipped the left flag. Iteration two adds an explicit zero left inset and widens the right exclusion to remove every part of the previous boy. Repeat the 3× detail check and full 390 × 844 check after deployment.

Results: all mission images load; no viewport overflow (scroll height 844); boy and foreground have `pointer-events: none`; 2 min tap updates the checked radio and start label, then 3 min restores the reference state. Four existing Jelly/PWA checks and `git diff --check` pass. Service worker v130 precaches the boy and SVG mask. Inspected lamp edges at 3× have no cyan polygon wedge over the card. The previously documented physical iPhone/Safari verification boundary still applies; the boy is a reconstruction, not an exact extraction of the original artwork.

Proof: `qa/english-boy-lamp-final.jpg` and `qa/english-boy-lamp-detail.jpg`.
Detail comparison page: `qa/english-art-detail.html`.
