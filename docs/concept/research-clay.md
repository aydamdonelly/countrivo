# Clay asset pipeline brief for the Countrivo redesign

Everything here was checked against the generator source (`/Users/adamkahirov/Desktop/code/clay_image_generation/clay.mjs`, `server.mjs`, `cutout.swift`, `specs/handy.json`), the eight `cv-*` icons, the one finished animation (`out/handy`), and test encodes I made in the scratchpad. I did not call the Clay MCP tools (Vertex auth fails with 401) and did not touch the Countrivo repo.

## 1. What the pipeline is

- **Model:** Vertex AI `gemini-3.1-flash-image` through the `generateContent` endpoint, with `responseModalities: IMAGE`, `aspectRatio 1:1` and `imageSize 1K`. The output is always a **square, 1024 px PNG**. The MCP tools offer no other aspect ratio or size.
- **Auth:** the pipeline runs `gcloud auth print-access-token` with your user login (not ADC). The project and region come from `.env`, and the region defaults to `global`. The MCP server **caches the token for 45 minutes**. So after fixing the 401 with `gcloud auth login`, **restart the MCP server**, or the stale cached token may keep failing.
- **Retries:** on 429/500/502/503/504 it tries 3 times, waiting 15 s and then 30 s. Any other error stops the run, and so does a response with no image (a safety block shows up as its `finishReason`).
- **Cutout:** `cutout.swift` uses the macOS Vision `VNGenerateForegroundInstanceMaskRequest` (the same as "Copy Subject" in Photos), which needs macOS 14 or later. It is compiled on first use. The cutout **removes the contact shadow**.
- **Files per icon** (`out/icons/<name>.*`):
  - `.raw.png`: what the model returned
  - `.white.png`: normalized to 1024², padded with white
  - `.png`: the transparent cutout
  - `.prompt.txt`
- **Caching:** an icon reruns and overwrites when given the same name. An animation **reuses existing `state-*.png` files**, so a new attempt needs a new name, or you delete the state files. The `fizz-*-b` files show the habit of naming retries `-b`.
- **CLI:**
  - `node clay.mjs icon "<object>" --name x --extra "..."`
  - `node clay.mjs anim specs/x.json`
  - The CLI spec also takes `fps` and `hold`. The MCP tool fixes these at 12 and 2.

## 2. Prompt scaffold, verbatim

**Icon / first state of an animation** (`scaffold(object, extra)`):

```
Plasticine claymation icon, Aardman / stop-motion toy style: ${object}.
Lumpy matte clay with visible thumbprints, soft wobbly hand-made edges,
soft diffused studio light, gentle soft shadow. Pure white background #FFFFFF,
centered, generous empty space. No text, no logos.${extra ? ' ' + extra : ''}
```

**Every later animation state** is an *edit of the first state's image*, which is sent as an inline reference:

```
This is a photo of a plasticine claymation object. Keep the exact same object, shape, size, position,
camera angle, framing, clay colours, lighting, shadow and pure white background #FFFFFF.
Change only this: ${change}. Keep the lumpy matte clay look with visible thumbprints. No text, no logos.
```

Only `object` (English) and `extra` vary. Common values for `extra` are "No text. No numbers.", "No symbols.", "No people." and "No symbols on the flag."

## 3. Colour rules

The tool's own schema says, in German: name colours explicitly; **white, light grey and dark grey as the base; green only for winners and money; red only for errors.**

What I saw in practice:
- **Hex codes are not followed.** The prompt asks for a "Pure white background #FFFFFF", but the white-ground renders came back as **#e8e8e6 to #f7f7f7 with an uneven vignette**. Only the trophy came back as #FFFFFF. Never rely on the model for an exact colour.
- **Greens come out too loud.** "bright green" produced **neon #25bc3e** on the phone's screen. The trophy is a mid green. Both fight Countrivo's palette and the anti-slop rule about saturated accents. Write "muted deep sage-green clay" or "dark bottle-green clay", never "bright".
- **Red conflicts with the site.** Countrivo already uses ember #b8432a for wrong answers. For "error" clay, write "burnt brick-orange clay", so the clay red and the UI accent are one colour family and not two reds.
- **White clay on warm paper (#fbfaf6) works well.** The white and grey clay is slightly warm (around #e1dcd2), so it sits naturally on paper and on the card (#f1f0ea).

## 4. The animation model

- **Input:** `name`, `object` (the first state), `states[]` and `sequence[]`.
  - `states[]`: `{id}` for the first; `{id, change}` for each later one, at least 2 states.
  - `sequence[]`: a list of `[stateId, frames]`, where 12 frames make 1 s.
  - Example from `specs/handy.json`: `[["aus",6],["wach",2],["an",10],["wach",2],["aus",4]]`, which is 24 frames (2.0 s) and a seamless loop because it ends where it starts. Always close a loop on the first state.
- **Each state is one edit of state 1, never of the previous state.** This keeps the framing locked: the phone's three cutouts have identical bounding boxes (406×728 at 312,152). But you cannot chain progressive changes. Describe every state as its full difference from state 1.
- **Each state's image is generated once and reused for all its frames.** The stop-motion feel comes from post-processing jitter:
  - every frame is offset ±4 px in x and y, rotated ±0.006 rad (about 0.34°) and brightness-shifted ±1.5%
  - it is then cropped 1000/1024 (a 2.4% zoom) and scaled back to 1024
  - the jitter changes only every 2nd frame ("on twos")
  - the seed is fixed at 7, so **every animation has the same jitter pattern**
- **Outputs** (`out/<name>/`):

| Output | Spec | Phone loop (24 frames, 2 s) |
|---|---|---|
| `.mov` | ProRes 4444, yuva444p12le, 1024² | 12.1 MB (for editing and Keynote only) |
| `.webm` | VP9, yuva420p with alpha (`alpha_mode=1`), crf 24, 1024² | 132 KB |
| `.apng.png` | animated PNG at 512², loops forever | 1.68 MB (**never ship**) |
| `frames/f000.png`… | 1024² RGBA | ~600 KB each |
| `state-<id>.png` / `.cut.png` | white-ground and cutout per state | |
| `contact.png` | the states side by side | |

- **What is missing:** the pipeline has **no HEVC-with-alpha output, which Safari and iOS need** (see section 7). The local ffmpeg has `hevc_videotoolbox`. I test-encoded one and confirmed it carries an alpha channel through AVFoundation (`ContainsAlphaChannel = 1`).

## 5. Cost and latency

- **Timing:** going by file timestamps, the 8 cv icons were made about 1 minute apart, which includes generation, normalizing and the cutout. The phone's 3 states were generated within one minute. One Swift compile of the cutout happens on the first run.
- **What to plan with:**
  - about 20–60 s per icon
  - about 20–40 s per state for an animation, run one after another, plus a few seconds of ffmpeg
  - add 15–45 s whenever a 429 retry hits
- **Cost:** one model call per icon and one per state. Jitter frames cost nothing. I did not verify the price; I would expect a few US cents per 1K image (check Vertex pricing). So 4 candidates for each of about 60 assets is a few dollars, and budget is not the constraint.
- **Results are not deterministic.** There is no seed, so every rerun differs. For a coherent set, generate 2–4 candidates per object and pick by eye.

## 6. What worked in the 8 existing icons, and what failed

I viewed all eight on paper (#f1f0ea) and on ink (#17181a), plus the raw renders.

| Icon | Reads as | Verdict |
|---|---|---|
| **cv-globe** | white globe, grey continents (Africa and Europe recognisable), dark stand | **Best of the set.** One chunky object with a clear silhouette and correct continents. Good brand hero. |
| **cv-draft** | dark round table, 5 white chairs | Works and is charming, but small in its frame (608×422 px object). The "slightly taller throne" barely shows. |
| **cv-blindpick** | fanned cards, front card with 3 dark bars | Reads well, but **asked for 3 cards and got 4**. The model does not count reliably. |
| **cv-higherlower** | two white blocks, the right one taller | **Broken by the cutout.** The raw image has the dark arrow and a clay base slab; Vision **dropped the arrow and the base**. Now it is just two blocks. |
| **cv-geowordle** | magnifier over a grey map pin | The magnifier is fine, but **the pin reads as a light bulb or balloon**. It needs the classic teardrop with a hole, in a darker grey. |
| **cv-statguesser** | 3 rounded white bars on a grey disc | Clean and readable. |
| **cv-flagquiz** | white flag on a dark pole, grey mound | **Reads as surrender.** A plain white flag means giving up, especially next to "you lost". |
| **cv-trophy** | chunky green cup, dark base | Strong silhouette, and green is used correctly (winner). It is the biggest object in the set (798×728), so it looks larger than the others. |

**What works:**
- one chunky object with a strong silhouette (globe, trophy, cup, bars)
- 2–3 simple parts in contrasting greys (a white body with a dark-grey stand or handle)
- shapes everyone already knows

**What fails:**
- **thin, detached or small parts.** The cutout drops them (the arrow), or the model warps them (the pin).
- exact counts and size differences
- symbolic meaning carried by colour alone (the white flag)
- several separate small objects spread out (the draft's chairs come out small)

**Failure modes to brief into every prompt:**
1. **White flag = surrender.** Give the flag a two-colour clay field, for example a dark-grey and white split, or a light-grey field with a dark-grey band, so it reads as "a flag" and not as giving up.
2. **The cutout loses parts.** Always compare `.png` against `.white.png`. Keep key parts **touching the main mass**: write "an arrow pressed onto the front of the block", not "an arrow between them".
3. **Counts drift.** Write the count as words, keep it ≤ 3, and check every render.
4. **Neon greens.** Never write "bright". Write "muted dark green clay".
5. **Glow does not work in clay.** "Pale green glow" came out as a blurry screen. Describe physical clay changes (colour swap, a piece moved, a bulge, a dent, a tilt), not light effects.
6. **The background is not white.** Grey vignette backgrounds (#e8 to #f7) mean you cannot use `.white.png` with `mix-blend-mode: multiply` unless you first lift the levels so the background becomes 255.
7. **Halo on dark grounds.** At 2× zoom, the white-clay cutouts show a faint 2–4 px light fringe on ink. They are fine on paper and card. For the ink anchor card, erode the alpha by 1 px or decontaminate the edge before export.
8. **Uneven scale and placement.** Object width ranges from 450 to 798 px of 1024. The vertical centre is not consistent either: the trophy sits low, the draft sits at 497 of 1024. **Trim each cutout to its alpha bounding box and re-pad to one optical size** (for example, the object fills 72% of the height, sitting on a shared floor line) before export. Otherwise the strip of today's games looks ragged.
9. **No contact shadow after the cutout,** so objects float. The site bans `box-shadow`, and a CSS `drop-shadow` bloom breaks the anti-slop rule. Instead, bake a tight, warm-tinted contact shadow into the asset as a post step, with a small offset and no all-around bloom. Alternatively, extend the pipeline to keep the real shadow: derive the shadow's alpha from `.white.png` after lifting the levels.
10. **Same jitter everywhere.** Seed 7 gives every animation the same wobble. If two loops play side by side, they twitch in sync. Vary the seed per asset (this needs a 1-line pipeline change).

## 7. Shipping on the web

### Recommended: state stills plus CSS jitter (best for this site)

Each clip is just 2–4 state images plus a mechanical jitter, so **ship the state stills and rebuild the jitter in CSS:**
- Stack the states as `<img>` elements in a fixed square box. **State 1 is the normal, visible image** in the server HTML.
- Animate the others in with `animation-timing-function: steps()` changes of `opacity` or `visibility`.
- Apply a `steps(1)` keyframe jitter to `transform` (translate ±1 px at display size, rotate ±0.3°) and `filter: brightness(…)`. Change it every 2/12 s, which reproduces the 12 fps on-twos feel.

Why this wins:
- **Size:** about 6–10 KB per state at 384–512 px.
- **It works everywhere:** iOS Low Power Mode blocks autoplaying `<video>` and shows a play glyph; images are not affected. VP9-alpha versus HEVC-alpha does not matter.
- **Game events can drive it:** for example, the trophy state switches only on a win, or a seat "plops" when a person is placed.
- **Reduced motion is trivial:** `@media (prefers-reduced-motion: reduce) { animation: none }` leaves state 1 standing.
- **It follows the project rules:** state 1 is the final first-paint image, with no opacity-0 start and no loading state.

### Where real video is needed (complex multi-state clips, hero moments)

- Use `<video muted loop playsinline autoplay preload="none|metadata" poster="state1.webp" width height>` inside an `aspect-ratio: 1` box. The poster is the still, so the first paint is complete and nothing shifts.
- **Two encodes per clip:**
  - HEVC with alpha in mp4 (`-c:v hevc_videotoolbox -alpha_quality 0.75 -tag:v hvc1`, input `format=bgra`) for Safari and iOS
  - VP9 alpha webm for Chrome, Firefox and Android
- **Pick the encode with a small feature check, not by source order.** Chrome on a Mac can claim `hvc1` support and then render the alpha as black. WebKit ignores VP9 alpha. Choose HEVC for WebKit and webm otherwise, and fall back to the still image.
- **Only play what is on screen:** use an IntersectionObserver to play only while in view, pause the peeking next card, and pause on `visibilitychange`. Gate `play()` on `matchMedia('(prefers-reduced-motion: reduce)')`; under reduced motion, never autoplay and show the poster. If `play()` rejects (Low Power Mode), keep the poster.

### Measured sizes (phone loop, 24 frames, 2 s)

| Format | 512 px | 384 px | 256 px |
|---|---|---|---|
| VP9 alpha webm (crf 30) | 37 KB | 26 KB | 18 KB |
| HEVC alpha mp4 | 33 KB | 26 KB | 19 KB |
| Animated WebP (lossy q75) | | 92 KB | |
| APNG | 1.68 MB | 976 KB | 470 KB |

| Still (one frame) | 512 px | 384 px | 256 px |
|---|---|---|---|
| WebP (q80, alpha q90) | 10.6 KB | 7.5 KB | 4.8 KB |
| AVIF (q60) | 7.6 KB | 5.7 KB | 3.4 KB |
| PNG | 149 KB | 85 KB | 41 KB |

The source cutout PNGs are 350–860 KB each and must never be shipped directly.

### Budgets I recommend

- **Display sizes:**
  - hero object on a game card: 160–240 CSS px, so export 512 px (2×)
  - today's-games strip and cabinet seats: 40–64 CSS px, so export 128–160 px
- **Per-asset limits:**
  - hero still ≤ 12 KB (AVIF with a WebP fallback through `<picture>`)
  - strip still ≤ 4 KB
  - video loop ≤ 40 KB per 2 s at 384–512 px
- **Per route:** ≤ 150 KB of clay imagery, and at most **one or two loops running at a time** (the focused card).
- **Loading:** the first card's still loads eagerly with `fetchpriority="high"` (it is the LCP image). Everything below the fold and the peeking card's still use `loading="lazy"`. Videos use `preload="none"` until they intersect.
- **No layout shift:** always set `width` and `height` attributes, or an `aspect-ratio` box. All assets are square with matched padding (failure mode 8), so the slots never resize.
- **Never gate content behind an animation:** text, scores and controls never wait on a clip. A clip is decoration over an already complete still.
- **Accessibility:** decorative clay gets `alt=""` and `aria-hidden`. A clay object that carries meaning, such as the game identity in the strip, gets a short `alt` naming the game.

## 8. Pipeline fixes to make before mass production (small and in the generator repo)

1. Add the HEVC-alpha output to `anim()`.
2. Add per-asset jitter seeds.
3. Add a trim-and-re-pad-to-one-optical-size step, with a shared floor line, for icons and states.
4. Add 1 px alpha erosion or edge decontamination for dark grounds.
5. Optionally keep a real contact shadow, derived from `.white.png` after lifting the levels.
6. Add an export step for WebP/AVIF stills at 128, 256, 384 and 512 px.
7. Add a QA contact sheet that shows each cutout on paper and on ink next to its raw render (this catches dropped parts like the higher-lower arrow).

Files:
- generator: `/Users/adamkahirov/Desktop/code/clay_image_generation/clay.mjs`, `server.mjs`, `cutout.swift`, `specs/handy.json`
- icons: `/Users/adamkahirov/Desktop/code/clay_image_generation/out/icons/cv-*.{png,white.png,raw.png,prompt.txt}`
- animation: `/Users/adamkahirov/Desktop/code/clay_image_generation/out/handy/`
- my contact sheets: `/private/tmp/claude-501/-Users-adamkahirov-Desktop-code-countrivo/93ab78b9-7c64-4192-9c8b-e8cae53271df/scratchpad/cv-sheet-f1f0ea.png` (paper) and `cv-sheet-17181a.png` (ink), same folder
- test encodes: `/private/tmp/claude-501/-Users-adamkahirov-Desktop-code-countrivo/93ab78b9-7c64-4192-9c8b-e8cae53271df/scratchpad/enc/`