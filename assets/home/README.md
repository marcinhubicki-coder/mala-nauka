# Home artwork and editable controls

`home-retina.webp` supplies the approved explorer scene, its static headline,
logo and settings illustration. The SVG mask removes the entire raster stats
and modes region. No mode button, stats icon or mode label uses the atlas.

`shared/home-atoms.mjs` supplies vector surfaces, background decorations,
badge surfaces, UK flag, globe, book, target with arrow, gold star and chevron.
`home-screen.mjs` composes those atoms with real buttons and live text.
`home-screen.css` owns layout, gradients, shadows and text rhythm. Tile palette
variables are set per mode; every editable layer has a stable `data-ds-key`.
The stats card has two intentional CSS plates, without a raster card beneath.

The canvas uses the reference 853 × 1844 coordinates. Content excludes the
operating system status bar and home indicator, and scales uniformly after
safe-area insets. Self-hosted Dosis provides Polish UI text. The nickname has
extra glyph space so descenders in j/y remain visible when truncation is needed.
The exact font of the illustration's custom lettering has not been identified.

The shared vector module is included in `tools/build-design.mjs` centralFiles,
so consumer builds fetch it together with the canonical home renderer.
The current `studio/pwa-test` is a full local build, not a consumer: its
`home-screen.mjs`, `home-screen.css` and `shared/home-atoms.mjs` must be synced
directly, then rebuilt. The 2026-10-10 Test PWA commit does that explicitly.

2026-10-10 validation: canonical build and 231 existing tests passed after
vector and style revisions. Browser comparison was blocked: local preview failed
with a container proc-mount error, and authenticated Vercel preview access was
rejected by automatic approval review. Do not treat this as a verified 1:1
browser match or a physical iPhone test.
