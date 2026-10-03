# Flags / spelling shared setup controls — 2026-10-03

The latest requested target supersedes the previous flags screenshot: use the
orthography button skin and composition, retain the mountain background and
green accent, and move icon-free PL/EN to the right of section 1, “Co ćwiczymy?”.

Both production and preview entry points load `shared/wizard-controls.css` last.
Jelly V4 owns selection motion and its delayed white-ink handoff. PL/EN uses the
same motion engine and native radio semantics, with persisted language choice.

## Iteration evidence

1. Shared skin, layout and inline language toggle. Live render revealed legacy
   flags tuning still enforced 56 px rails and gray idle ink.
2. Rails matched to 54 px, idle ink to #515c98, active ink to #fff. Wrapped the
   longer mission hint to avoid collision with the explorer. Browser test found
   native keyboard radio activation was being cancelled by the delegated click.
3. Preserve native input clicks and update language on change. ArrowRight selects
   EN and ArrowLeft selects PL; checked state, indicator and white ink agree.

## Measured at 390 × 844, safe insets 47 / 34

| Element | Flags | Orthography |
| --- | --- | --- |
| Setup card | x14 y222, 362 × 355 | x14 y222, 362 × 355 |
| First rail | x34 y276, 322 × 54 | x34 y276, 322 × 54 |
| Mini toggle | 122 × 31, right edge x356 | 122 × 31, right edge x356 |
| Start button | x14 y630, 362 × 71 | x14 y630, 362 × 71 |
| Active ink | rgb(255,255,255) | rgb(255,255,255) |
| Idle ink | rgb(81,92,152) | rgb(81,92,152) |

Closed wizard: client/scroll width 390/390 and height 844/844. No language icons.
Expanded continents: panel height 114; duration, note and CTA move below it,
without overlap; scroll height 863 makes the lower safe area reachable.
Safari-height 390 × 700: client/scroll width 390/390 and height 700/700.

Verified PL/EN click and keyboard selection, selection persistence after reload,
continent open/close, duration change and CTA update. Starting EN flags produces
English answers (observed Liechtenstein, Portugal, Lithuania, San Marino). No
test result was saved. No app-source console error was observed; Chrome extension
metadata errors are unrelated to the application.

`node --test tests/*.test.mjs`: 35 passing, 0 failing. Added shared-skin and
language-placement regression checks; offline precache validation passes.

Verified functional build: 9a7928c1e6e3f73444aa8eb75f9d760ad1e3fcd7.
Preview: https://mala-nauka-jq6b3o7ua-nzckzxw2x6-4792s-projects.vercel.app/adventure-preview.html?screen=flags

Screenshots are in `docs/qa/flags-setup/`: `browser-shared-controls-final.jpg`,
`iphone-13-pro-shared-controls-final.jpg`, `orthography-shared-controls.jpg`.
These are real browser renders in a 390 × 844 iframe with explicit safe insets,
not native iPhone Safari or hardware-DPR-3 captures. Exact native iOS rendering
has not been claimed or verified.
