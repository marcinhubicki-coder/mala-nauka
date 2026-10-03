# Flagi — ekran ustawień, 2026-10-03

Historical reference loop. The later orthography-consistency request and current
verified layout are documented in [FLAGS-SHARED-CONTROLS-QA.md](FLAGS-SHARED-CONTROLS-QA.md).

Branch: `design/profile-and-learning-v5`. Scope: flag setup only; gameplay camera and feedback stay unchanged.

Reference: user-supplied 864 × 1536 mockup, adapted to the full iPhone 13 Pro viewport (390 × 844 CSS pixels). The operating-system status bar and the ChatGPT accessibility overlay are not recreated as app controls.

## Implementation

- One continuous background in `assets/flags/adventure/setup-scene-v1.webp`, generated from the supplied reference with all UI removed. CSS uses one image for the setup view; no blended sky/landscape layers.
- `flagi/setup-retina.css` scopes all new styles to `[data-mode="flags"][data-view="wizard"]`.
- Existing mission artwork, actual radio controls, shared Jelly motion, continent filters, language setting, timer and game submission remain live.
- Rounded Dosis lettering matches the shared setup style; compact labels, white green CTA border, cream mission/note, and PL/EN switch.
- `flagi/adventure-game.mjs` adds a proper SVG back arrow in setup only.
- PWA cache v151 includes the setup stylesheet and new background.

## Five visual loops

1. Continuous scene and complete reference layout.
2. Fix intrinsic hero width that was expanding the grid beyond 390 px; align back arrow.
3. Match shared rounded lettering and investigate continent expansion.
4. Refine compact lettering, weight, explorer height and bottom spacing.
5. Give the open continent panel intrinsic grid height; preserve scroll on short screens.

## Final measured geometry at 390 × 844

| Element | x | y | width | height |
| --- | ---: | ---: | ---: | ---: |
| Mission | 39 | 121 | 312 | 112 |
| Setup card | 39 | 249 | 312 | 375 |
| Note | 39 | 637 | 312 | 36 |
| Start | 39 | 686 | 312 | 61 |
| Language | 113 | 760 | 164 | 48 |

Closed world form: `scrollWidth/clientWidth=390/390`, `scrollHeight/clientHeight=844/844`. Top padding 55 px (47 px safe inset + 8), bottom padding 36 px (34 px safe inset + 2).

Open continent form: card height ~496.8 px; root scroll height 966 px. Panel, timer, note and CTA remain in normal flow without overlapping. Safari-sized 390 × 700 view: setup card 338 px; scroll height 710 px, allowing the remaining language control to be reached.

## Verification

- Cloud Chromium browser, real Vercel preview and 390 × 844 iframe with 47/34 px safe insets.
- Taps on type, scope, duration and PL/EN worked; live state updated and correct note/CTA text appeared.
- Submission started a genuine three-minute Countries round with four flag answers.
- 16 checks passed: `pwa-release`, `jelly-ink`, `flag-cloth`, `flag-feedback`.
- Files: [phone crop](qa/flags-setup/iphone-13-pro-final.jpg), [browser context](qa/flags-setup/browser-final.jpg).

## Limits

This is an inspected browser match, not a claim of zero differing pixels. The reference aspect ratio differs from the phone, and the reconstructed background/mission artwork are not identical pixels to the mockup. Native iOS Safari/PWA, physical touch, and a device-scale-3 screenshot were not available in this environment. The new view deliberately excludes simulated status-bar/battery graphics and the external accessibility widget.
