# Flag answer reveal — 2026-10-02

Validated in Chrome with a 390 × 844 iPhone 13 Pro frame, safe top 47 / bottom 34. Cloth renders at 3× CSS resolution. Physical iPhone/Safari performance is still for device review.

## Visual loops

1. `4834596`: centered cloth before answering; a growing circular mask exposes vector geography and country/capital while the same flag rig scales to 81% and translates right. Pin replaces all country-specific landmark artwork. Answer paper has four reusable ornament variants. Added a subtle 4.6 s cloth breeze from the source SVG, using cached frames.
2. `d314890`: retained mountain/cloud vignette behind the flag, feathered parchment into it, enlarged the visible map edge, moved the compass clear of the country highlight. Country titles use the same fitting rule for both answer results. Stale breeze playback is removed when a canvas is resized.

The first and second loop before/after screenshots are included without image editing. The context screenshot shows the actual preview wrapper and selected iPhone size.

## Confirmed behavior

- Initial question contains neither country title, capital nor revealed map.
- Correct and wrong answers reveal their country and capital, with only a location pin.
- Mask/flag transition finishes after 1.15 s; the reading window then lasts 4 s. The round clock remains stopped throughout. Wrong feedback waits for Continue.
- Next question is reserved once; cloth and its breeze frames plus continent source begin preparing during feedback. Real round: Russia → Hungary automatically and Hungary → Lithuania through Continue, all using `clothCache=hit`.
- All four answer hitboxes stay at x18/201, y506/592, 171 × 76. Hero remains x24, y183, 342 × 275. No vertical overflow at 844 px.
- Poland changes from identity transform to matrix(0.81,0,0,0.81,97.28,7.11). The cloth source and physical canvas size are reused through the transition.
- Nepal transparency and Swiss square proportions remain intact during flutter. All sampled breeze meshes retain positive orientation and a pinned hoist.
- Central African Republic fits in Polish and English; the title scroll width equals its 149 px slot, and answer labels fit their 141 px slots.
- Reduced motion uses still cloth and immediate reveal. Pause stops playback.

## Checks

`node --test tests/flag-feedback.test.mjs tests/flag-cloth.test.mjs`: 8 passed, including a timing regression covering the full reading window after reveal and pause/resume.
`git diff --check`: passed.

UI preview deployment: `mala-nauka-e0jp0u6gl-nzckzxw2x6-4792s-projects.vercel.app`, screen `flag-question`, country `pl`. The fixture intentionally freezes its clock so reviewers can inspect the result; choose “Flagi · ustawienia i gra” for a running round.
