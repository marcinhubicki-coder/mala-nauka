# Scenic geography variants v40

The configured Flags, Countries and Capitals variants now share the scenic
frame, registered world atlas, answer buttons, feedback ribbons and Session.

| Variant | Before answering | Correct answer |
| --- | --- | --- |
| Flags | Large flag, question on the folded sheet, country choices | Open the map and reveal country, capital, flag and neighbours; advance automatically |
| Capitals | Open map, country heading, highlighted country and unnamed capital marker; capital choices | Reveal the capital and full country information; advance automatically |
| Countries | Open map, highlighted country and capital heading; country choices | Erase map ink, fold the sheet, reveal the large flag and country name; advance automatically |

Every wrong answer reveals full map information, neighbours and the same manual
continue slider. Questions on the two map variants occupy the bottom parchment
band. Their selected-country/capital labels and heading flag are suppressed as
needed at both zoom levels and after switching PL/EN. Hidden measurement markup
is excluded from the accessibility tree; the map has a question-specific label.

`scenic-modes.mjs` maps displayed labels to the existing country identities used
by Session. Capitals display localized city names while submitting the original
country key. Countries submit country IDs. This retains adaptive question
selection, scoring, category history, pause and prepared-next behavior. Restored
wizard choices are explicitly synchronized into the application configuration.
Segmented controls capture the pointer only after a drag threshold, preserving
the native label click for ordinary mode-selection taps.

The entry blur waits for the decoded scene, fonts, flag and rendered question
map. Next-round asset preparation retains the v39 atlas cache and clock hold.
Only a correctly answered Countries question can expose the large flag in these
map variants; transitions to the next question cannot flash its answer flag.

Validation: eight focused Node tests pass (six existing atlas checks and two
Session/presentation regression checks). Headless WebKit at 390×844, DPR2 checked
all three configured variants through wrong answer, slider, correct answer,
automatic next question, scoring, pause and summary. Both new question variants
were checked at near/continent zoom and after switching to English. Countries'
reverse fold was also checked with normal motion. No browser page errors.
These checks do not constitute physical iPhone or installed-PWA verification.

Preview entry: `/flagi/preview-frame.html?scenic=1&v=40.1`.
Isolated question examples:
`/flagi/scenic-preview.html?country=pl&mode=capitals&v=40` and
`/flagi/scenic-preview.html?country=pl&mode=countries&v=40`.
