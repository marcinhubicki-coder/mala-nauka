# Progress artwork, 2026-10-01

The supplied progress dashboard is the visual reference. Text, statistics,
filters, buttons and trophy labels are live HTML, not baked into the images.
The spelling word illustrations continue to use the complete scene registry.

Generated with the image generation tool; art direction used for each asset:

| Asset | Art direction | Stored dimensions |
| --- | --- | --- |
| `hero-v1.webp` | Cheerful curly-haired girl with pink bow and an open purple book, a sleepy rabbit, flowers, blue sky and distant castle. Keep the upper area and right side quiet for live controls and copy. | 1170 × 1073 |
| `collection-v1.webp` | Friendly family gathered around the girl in a bright flower garden, warm expressions, stars, quiet sky above. No lettering or controls. | 640 × 640 |
| `categories-v1.webp` | Glossy pink `rz/ż`, blue `u/ó` and green `ch/h` tiles, books, pencil, lightbulb and flowers; cream background with quiet upper area. | 640 × 640 |
| `trophies-v1.webp` | Three separate trophies in equal square sprite slots: golden `rz/ż` cup, golden cup with blue graduation cap and books, silver locked cup. Transparent background. | 1536 × 512 |

`../ortografia/game-meadow-v1.webp` is a generated backdrop based on the supplied
baking quiz mockup: saturated pastel blue and pink sky, castle, green garden and
daisies, with a quiet centre for the question. It contains no quiz UI or lettering.
Stored dimensions: 853 × 1844.

`../ortografia/happy-star-v1.jpeg` is the supplied smiling star, unchanged
(143 × 150), scaled in CSS for the high-score heading.

`progress-preview-frame.html` uses isolated example data from
`progress-example.mjs` (24 mastered, 8 learning, 5 review). These fixtures are never
written into a player's progress. `index.html` uses the actual player ledger.
