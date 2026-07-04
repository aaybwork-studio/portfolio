# Asset Credits / Licensing Record

## Art direction change (2026-07-04)

The previous **Warped City** cyberpunk pixel-art set (by Luis Zuno / ansimuz,
CC0) has been **retired and fully deleted**. Art direction changed to
**strict NES 8-bit retro** (Mario / Super Mario Bros.-era look: tiny limited
palette, chunky low-res pixels, ~16px character grid). Warped City's 71x67
detailed sprites and 4-layer neon cyberpunk parallax no longer matched the
target aesthetic, which calls for authentic 8-bit-console pixel density —
not "pixel art" in the looser, more detailed 16-bit sense.

All Warped City files (`character_warped_strip.png`, `warped_city_tileset.png`,
`layer0_sky_far.png`, `layer1_sky_moon.png`, `layer2_skyline_mid.png`,
`layer3_buildings_near.png`) and their previews have been deleted from
`public/assets/`. `src/game/config/sprites.ts` and
`src/game/config/biomes.ts` have been updated to point at the new files
below (frame sizes, animation frame ranges, and the ground-tile index were
all re-derived for the new assets — see those files' inline comments).

Three separate CC0 OpenGameArt.org packs were used, chosen individually per
deliverable since no single strict-NES pack covered character + tiles +
background at the same quality bar. All three share the same design
philosophy (16px-grid, limited palette, hard pixel edges, no anti-aliasing)
so they read as cohesive despite being multi-source.

## Search process / license verification

Searched OpenGameArt.org and itch.io for "NES", "8-bit", "CC0 platformer",
"NES tileset", "NES character sprite". Rejected candidates:

- `opengameart.org/content/an-8-bit-beat-em-up-character-sprite-sheet`
  ("An 8-bit beat-em-up character sprite sheet", author devurandom, CC0
  confirmed) — only a single 240x240 animated GIF (karate/punch loop), not a
  sliced idle/walk/jump frame set suitable for this engine's spritesheet
  contract. Rejected for practicality, not license.
- `opengameart.org/content/sky-clouds` ("Sky Clouds" by ExileGL, CC0
  confirmed on page) — downloaded and inspected (`sky.png`, 2284x1224). It's
  a soft-gradient/blurred glow image, not authentic hard-edged NES pixel
  art. Rejected on style grounds.
- itch.io's `tag-8-bit`/`tag-nes` free listing was surveyed but OpenGameArt
  yielded better-verified, explicitly-licensed matches faster.

Each pack used below was fetched directly and its license field on the page
was parsed/quoted before download — all three show `License(s): CC0` in the
page's own license-taxonomy field.

## 1. Character — `public/assets/character/`

- **Pack name:** "RPG Character 'Knight' (NES)"
- **Author:** Chasersgaming
- **Source URL:** https://opengameart.org/content/rpg-character-knight-nes
- **License:** **CC0** — page's License(s) field reads exactly `CC0`.
- **Files used:** downloaded `NES Knight Free Version.zip` (linked from the
  same page) for its pre-sliced per-direction animation strips:
  - `Idle PNG/NES PNG Knight_Idle_EAST_strip4.png` (64x24, 4 frames)
  - `Run PNG/NES PNG Knight_Run_EAST_strip4.png` (64x24, 4 frames)
  - `Jump PNG/NES PNG Knight_Jump_EAST.png` (16x24, 1 frame)
  - `Hit PNG/NES PNG Knight_Hit_EAST.png` (16x24, 1 frame, reused as the
    "fall" pose — the pack has no separate airborne-descent frame)

  These were cropped to individual 16x24 frames and concatenated
  left-to-right into one strip with a Python/PIL script (simple horizontal
  paste, no resizing/repadding — source frames were already uniform).

| File | Description |
|---|---|
| `character_nes_knight_strip.png` | Composited horizontal strip, EAST-facing knight, 16x24 px per frame, 160x24 px total (10 frames). |

**Frame data:** frame size **16 x 24 px**. Sheet is **160 x 24 px** (10
frames, 16px pitch, single row).

| Frame range | Anim | Frame count | Source |
|---|---|---|---|
| 0–3 | `idle` | 4 | `Idle PNG/.../Knight_Idle_EAST_strip4.png` |
| 4–7 | `run` | 4 | `Run PNG/.../Knight_Run_EAST_strip4.png` |
| 8 | `jump` | 1 | `Jump PNG/.../Knight_Jump_EAST.png` |
| 9 | `fall` | 1 | `Hit PNG/.../Knight_Hit_EAST.png` (reused pose) |

`src/game/config/sprites.ts` was updated: `frameWidth: 16`, `frameHeight: 24`,
`path: "assets/character/character_nes_knight_strip.png"`, and
`CHARACTER_ANIMS` frame ranges updated to match the table above.

Preview: `public/assets/_previews/character_sheet_preview_4x.png` (4x
nearest-neighbor upscale).

## 2. Tiles — `public/assets/tiles/`

- **Pack name:** "Simple NES-like Platformer Tiles"
- **Author:** surt
- **Source URL:** https://opengameart.org/content/simple-nes-like-platformer-tiles
- **License:** **CC0** — page's License(s) field reads exactly `CC0`.
- **Direct download used:** https://opengameart.org/sites/default/files/nestle.png
  (shipped at 2048x2048, a clean nearest-neighbor 4x upscale of a native
  16px-tile-grid sheet — confirmed by sampling 4x4 pixel blocks, 93.75% were
  perfectly uniform, consistent with a lossless 4x export). Downscaled back
  to native resolution with `Image.resize(..., Image.NEAREST)` to get an
  authentic 512x512, 16px-tile sheet (no quality loss, since the 4x version
  had no anti-aliasing to lose).

| File | Description |
|---|---|
| `nes_platformer_tileset.png` | Full tileset, downscaled to native 16x16-tile resolution, 512x512 px (32 columns x 32 rows). |

- **Tile size: 16 x 16 px.**
- **Ground tile identified:** column 21, row 5 (0-based) — a fully opaque
  brown/cream checkered dirt block matching the pack's own mockup image
  (`nestle_mockup.png`, viewed for visual confirmation: same tile appears as
  the solid-ground fill under floating platforms and the main ground strip).
  Phaser spritesheet frame index (32 columns/row, row-major) =
  `5 * 32 + 21 = 181`.

`src/game/config/biomes.ts`'s `orbit.groundTileset` was updated to
`{ path: "assets/tiles/nes_platformer_tileset.png", tileSize: 16, groundIndex: 181 }`.

Preview: `public/assets/_previews/tileset_preview_2x.png` (2x nearest-neighbor
upscale of the full 512x512 atlas).

## 3. Backgrounds — `public/assets/backgrounds/`

- **Pack name:** "Generic Platformer Tileset (16x16) + Background"
- **Author:** etqws3
- **Source URL:** https://opengameart.org/content/generic-platformer-tileset-16x16-background
- **License:** **CC0** — page's License(s) field reads exactly `CC0`.
- **Files used** (DB32-palette, flat/limited-color, hard-pixel-edge — no
  anti-aliasing, consistent with strict NES look):
  - `2015-02-26 [DB32](Generic Platformer)(Clouds).png` → `nes_sky_clouds.png`
  - `2015-02-26 [DB32](Generic Platformer)(Mountains).png` → `nes_mountains_mid.png`

| Layer | File | Dimensions | Tiles horizontally? | Palette / tintability |
|---|---|---|---|---|
| Sky (far) | `nes_sky_clouds.png` | 256 x 144 | Yes — measured 100% left/right column pixel match | Flat single cyan-blue fill + white pixel clouds only (2-3 colors total). Very tintable: recoloring the base cyan via CSS/canvas hue-shift or multiply-tint cleanly maps to any biome accent without touching the white cloud highlights. |
| Mountains (mid) | `nes_mountains_mid.png` | 256 x 144 | Mostly — measured ~96.4% left/right column pixel match (minor seam, same as source pack's own tileable design) | Grey/purple silhouette mountains over a near-black base — already low-saturation and neutral, tints well as a multiply/overlay layer without a strong competing hue. |

Both were verified by tiling 2x horizontally in a throwaway test image and
visually confirming the repeat reads cleanly (sky: seamless; mountains:
negligible seam matching the pack's own intended tiling behavior).

Currently wired into `orbit` biome's `layers` (sky at `scrollFactor: 0.0`,
mountains at `scrollFactor: 0.35`) in `src/game/config/biomes.ts`. Other
biomes (`hero`, `hub`, `memory-bank`, `nav-aid`, `pitwall`) remain in
placeholder (solid-color) mode per the existing biome-swap contract — these
two layers are neutral/flat enough to reuse for other biomes later by
re-tinting, without needing new art.

## Previews — `public/assets/_previews/`

| File | Shows |
|---|---|
| `character_sheet_preview_4x.png` | Full 10-frame character strip, 4x scaled |
| `tileset_preview_2x.png` | Full 512x512 tileset atlas, 2x scaled |
| `background_sky_preview_3x.png` | Sky/clouds layer, 3x scaled |
| `background_mountains_preview_3x.png` | Mountains mid layer, 3x scaled |

These preview files are for human/reviewer inspection only and are not
required at runtime — safe to delete if disk space matters, the engine
reads the per-layer / per-sheet files listed above.
