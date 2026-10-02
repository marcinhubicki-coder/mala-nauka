# Retina flag performance loop — 2026-10-02

Target: iPhone 13 Pro, 390 × 844 CSS pixels, 3× cloth raster. Preview branch only.

Implementation: `c941ebc10436f3c840982b3624de6bc319af43ca`.

## Changes

- 1536 triangles instead of 2560 (40% fewer clipped draw calls). The geometric regression test bounds the midpoint deviation below one physical Retina pixel.
- Shared Float32 lighting field for all country SVGs of the same raster size. Cotton texture, folds, seams and grain are computed once, not per country.
- Cooperative task batches yield during lighting, colouring and mesh preparation, including next-question prewarming.
- One shared size-key function for prewarming and visible copies; one validated source per cached surface. No redundant full-canvas GPU readback when showing an already validated surface.
- Complete camera transition: 520 ms instead of 1050 ms. Map reveal uses opacity/transform and a static feathered mask instead of animating clip-path over vector geography.
- Pole, cloth, mountains and clouds remain in the same camera. No independent pole translation or cloth animation.
- Text fitting skips repeated identical work. Country/capital reveal completes before the four-second confirmation interval begins.
- More detailed common parchment artwork, larger compass, quieter geographic overlay, and a wider mountain vignette.
- New CSS/module/asset URLs and offline cache version v145. No changes to unrelated home artwork.

## Automated checks

`node --test tests/flag-cloth.test.mjs tests/flag-feedback.test.mjs tests/pwa-release.test.mjs tests/adventure-interactions.test.mjs`: 17 passing tests.

The initial Chrome baseline reused the existing cloth after an answer (`clothCache=hit`, 552 × 477 pixels). Its main opportunities were the next-country lighting/mesh computation, synchronous canvas readback, and the 1050/1100 ms scene/mask transitions — not a blanket failure of the existing cache.

Physical iOS Safari performance and literal pixel-perfect equivalence must not be inferred from desktop Chrome checks. No backend PNG pipeline is introduced: address the existing computation and scheduling first.
