# Daily completion color

Final Figma designs: [phone](https://www.figma.com/design/ZKNzvFolKFKjU2EVzWpCBY?node-id=150-2), [desktop](https://www.figma.com/design/ZKNzvFolKFKjU2EVzWpCBY?node-id=150-85), [material palettes](https://www.figma.com/design/ZKNzvFolKFKjU2EVzWpCBY?node-id=148-3).

Completed daily games use six static, genuinely multicolored clay bitmap assets. Each icon has separately colored object parts, preserving the recognizable game motif, handmade texture, camera angle and transparent background. These are new image variants, not a uniform tint or SVG material filter. The original monochrome assets remain available; all unplayed, in-progress and practice game-card frames use grayscale. Other clay artwork retains its original appearance.

| Daily game | Completed asset |
| --- | --- |
| Country Draft | `public/clay/cl-01/coins-color.webp` |
| GeoWordle | `public/clay/cl-02/pressed-color.webp` |
| Blind Pick | `public/clay/cl-07/flip-color.webp` |
| Pinpoint | `public/clay/cl-03/deep-color.webp` |
| Higher or Lower | `public/clay/cl-04/level-color.webp` |
| Stat Guesser | `public/clay/cl-06/slide-color.webp` |

Each asset has 480, 256 and 128 px transparent WebP exports; the smaller filenames end in `-color.256.webp` and `-color.128.webp`. Exactly six built-in ImageGen calls were used once during production, one per icon. No external API generation workflow was used. The application serves local static files through the existing responsive image component; it does not generate images at runtime. PNG originals, exact prompts, source references, hashes and export provenance are stored in `docs/concept/daily-clay-icons-v2/`.

Home and the games index receive today's edition-scoped completion state on the server. Practice results do not unlock daily color; another date or edition starts monochrome. Completing a daily invalidates both overview routes. Color supplements the existing visible score and check mark, so it is not the only completion signal.

The server selects the completed image URL in the first HTML. There is no mount gate or client-side recoloring. Regression coverage checks daily/practice mode, date and edition boundaries, initial HTML and hydration, responsive image URLs, decoded alpha and visible color in Chromium and WebKit. Current test reports and screenshots live under `.check-render/daily-clay/`; their counts may change as layout guards evolve.

## Superseded v1

The earlier [Figma proof](https://www.figma.com/design/ZKNzvFolKFKjU2EVzWpCBY?node-id=139-252) and its browser-rendered previews document a rejected SVG tint experiment. That version used no ImageGen calls, but it is not the final implementation. Its retained artifacts are historical evidence only; the six generated bitmap variants above replace it.
