# Asset Credits / Licensing Record

The previous Kenney "New Platformer Pack" assets (flat-vector style) were
**rejected** as too low a quality bar for a portfolio site and have been
**fully removed**. They are replaced with **Warped City** by **Luis Zuno
(ansimuz)** — a cyberpunk/neon pixel-art platformer asset pack, licensed
**CC0** (public domain), sourced via its OpenGameArt.org mirror.

The dark, twilight-tech, orange/red-horizon-glow aesthetic of this pack is a
strong direct match for the site's `orbit` biome palette
(`bg: 0x0b0806`, `accent: 0xff4500` — see `src/game/config/biomes.ts`).

## Search process / alternatives considered

Before settling on Warped City, the following packs were also downloaded and
inspected pixel-for-pixel (not just skimmed):

- **Pixel Frog — "Kings and Pigs"** (https://pixelfrog-assets.itch.io/kings-and-pigs,
  CC0 per the artist's own itch.io page). Genuinely excellent, painterly
  78×58 character (11-frame idle, 8-frame run, 3-frame attack) — arguably
  more charming per-frame than Warped City. **Rejected for this deliverable**
  because the pack ships **no background/parallax layers at all** (only a
  stone-castle interior tileset), so pairing it would mean mixing a
  different artist's backgrounds in and breaking visual cohesion. Kept as a
  strong candidate if a "King" or med-fantasy biome character is wanted
  later — it is fully CC0 and already verified.
- **Ansimuz — "Sunny Land"** (https://ansimuz.itch.io/sunny-land-pixel-game-art,
  public-domain per the pack's own `public-license.txt`). Good 33×32
  character (4-frame idle, 6-frame run, 2-frame jump) and usable `back.png`
  / `middle.png` background layers, but only 2 real depth layers (not 4+),
  and jump/run frame counts are noticeably thinner than Warped City's.
  Rejected in favor of Warped City's richer animation set and true 4-layer
  parallax.
- **"Parallax Backgrounds" by Admurin** (OpenGameArt, CC-BY 4.0, 9 hand-painted
  layers per biome incl. Plains/Caves/SnowyMountains/DeadForest/Dock).
  Beautiful, but a painterly hand-drawn style, not pixel-art — stylistically
  incompatible with a crisp pixel-art character. Rejected on style-cohesion
  grounds, not license.
- Surveyed itch.io's free/CC0/pixel-art/parallax tag listings and several
  named packs (Ninja Adventure, Ansimuz's other Warped/Gothicvania/Quiet
  Hill lines, Foozle, Ansimuz's dedicated Parallax Forest/Mountain Dusk
  packs) via search; none combined (a) a richer animation set, (b) true
  multi-layer parallax, and (c) a matching tileset from one single cohesive
  CC0/CC-BY source better than Warped City.

Warped City won because it is the only pack that delivers all three
deliverables — character, backgrounds, tileset — from one artist, one
palette, one pixel density, at CC0, with the richest animation set found (45
usable frames across 6 named states).

## Source Pack (chosen)

- **Pack name:** Warped City — Cyberpunk Pixel Art Platformer Assets
- **Author:** Luis Zuno (`ansimuz`)
- **Canonical pages:**
  - https://ansimuz.itch.io/warped-city (itch.io original listing)
  - https://opengameart.org/content/warped-city (OpenGameArt mirror — used for download)
- **Direct download used:** https://opengameart.org/sites/default/files/warped_city_files.zip
- **License:** **CC0 1.0 Universal (Public Domain)** — https://creativecommons.org/publicdomain/zero/1.0/
- **Confirmed CC0:** Yes — OpenGameArt.org's submission page for "Warped City"
  lists the license as CC0 with author `ansimuz` (the pack's history shows
  it was CC-BY before the author explicitly relicensed it to CC0).
  Attribution is not legally required; it's provided here anyway as good
  practice, and the game's footer credits the artist.

This single pack was used for all three deliverables (character, tiles,
backgrounds) so the art stays visually cohesive — same artist, same palette,
same pixel density, all extracted from the pack's own `SPRITES/`,
`ENVIRONMENT/` and `demo/assets/` folders (the pack ships a full working
Phaser demo, so these are exactly the files a shipped game would use).

## 1. Character — `public/assets/character/`

| File | Description |
|---|---|
| `character_warped_strip.png` | Custom-composited horizontal strip built by concatenating the pack's own individual per-frame PNGs (already uniform-canvas, no repadding needed) left-to-right in animation order. Same CC0 source frames, just laid out contiguously for easy engine slicing. |

**Frame data:** every frame is **71 × 67 px**. Sheet is **3195 × 67 px** (45
frames total, 71px pitch, single row).

| Frame range | Anim | Frame count | Source files |
|---|---|---|---|
| 0–3 | `idle` | 4 | `SPRITES/player/idle/idle-1..4.png` |
| 4–11 | `run` | 8 | `SPRITES/player/run/run-1..8.png` |
| 12–15 | `jump` (rise) | 4 | `SPRITES/player/jump/jump-1..4.png` |
| 16–22 | `fall` | 7 | `SPRITES/player/back-jump/back-jump-1..7.png` (pack's airborne/descending pose set — used as the fall animation) |
| 23–38 | `walk` (bonus, slower-paced alt to run) | 16 | `SPRITES/player/walk/walk-1..16.png` |
| 39–44 | `climb` (bonus, ladder/wall-climb) | 6 | `SPRITES/player/climb/climb-1..6.png` |

Determined by: (1) each source subfolder's own file naming/numbering
(`idle-1.png`...`idle-4.png` etc — unambiguous), and (2) `sips -g pixelWidth
-g pixelHeight` confirming every one of the 45 source PNGs is exactly 71×67
with no cropping/trim variance, so a fixed-pitch strip could be built with a
simple horizontal paste (verified with a Python/PIL script, no visual
distortion). This is a **richly animated** character: 4-frame idle breathing
loop, 8-frame run cycle, separate rise/fall airborne poses, plus bonus
16-frame walk and 6-frame climb cycles not requested but available for later
use (e.g. ladder sections).

Other poses available in the source pack but not included in the strip
(extractable the same way later): `crouch` (1 frame), `hurt` (1 frame),
`shoot` / `run-shoot` (9 frames, ranged-attack pose) — useful for a
damage/interact state later.

Preview: `public/assets/_previews/character_strip_preview_3x.png` (3x
nearest-neighbor upscale of the full strip for easy visual review).

## 2. Backgrounds — `public/assets/backgrounds/`

Four parallax layers, back-to-front, all extracted from the pack's own
`ENVIRONMENT/background/` source-layer folder (the pre-composited layers used
by the pack's shipped Phaser demo, not a flattened preview image):

| Layer | File | Dimensions | Depth order | Tiles horizontally? |
|---|---|---|---|---|
| 0 (farthest) | `layer0_sky_far.png` | 128 × 240 | Sky — stars + horizon glow, no moon | Yes — seamless repeat, ~88% edge-pixel match measured |
| 1 (far) | `layer1_sky_moon.png` | 128 × 240 | Sky variant with visible moon + stars | Yes — seamless repeat, ~88% edge-pixel match measured |
| 2 (mid) | `layer2_skyline_mid.png` | 144 × 124 | Silhouette skyline band (buildings, antennas) | Mostly — ~77% edge-pixel match; designed as a repeating band, minor seam visible at default alignment |
| 3 (near) | `layer3_buildings_near.png` | 493 × 209 | Foreground neon/detailed building cutouts (individual buildings on transparent background) | No — this is a **prop scatter strip**, not a seamless tile; place/repeat as a group or hand-arrange, standard usage for this kind of foreground decoration layer |

Recommended `scrollFactor` mapping onto `biomes.ts`'s 3-slot `layers()`
helper: use layer 0 or 1 as `sky` (scrollFactor 0.0), layer 2 as `mid`
(scrollFactor ~0.35), layer 3 as an additional near-foreground layer
(scrollFactor ~0.6–0.8, in front of mid, behind gameplay) if a 4th slot is
added to the parallax contract; otherwise layer 3 can be omitted for biomes
that only support 3 slots.

Preview: `public/assets/_previews/background_layers_composite_preview.png` —
a 640×360 assembled composite (sky tiled + mid skyline tiled + near
buildings placed once at bottom-left) showing how the 4 layers read
together. Confirms strong atmospheric depth and a palette that closely
matches the `orbit` biome's near-black background / orange-red horizon
accent already defined in `src/game/config/biomes.ts`.

## 3. Tiles — `public/assets/tiles/`

| File | Description |
|---|---|
| `warped_city_tileset.png` | Full tileset atlas, copied unmodified from `ENVIRONMENT/tileset.png` in the source pack. |

- **Tile size: 16 × 16 px.** Confirmed directly from the pack's own shipped
  Tiled map (`demo/assets/maps/map.json`): `"tilewidth": 16, "tileheight":
  16`, and the tileset declaration `"columns": 24, "imagewidth": 384,
  "imageheight": 256, "tilecount": 384` — i.e. this exact 384×256 PNG on a
  24-column, 16-row grid of 16×16 tiles.
- **Ground tile identified:** by parsing `map.json`'s `"Main Layer"` tile
  data and counting tile-gid frequency, gid **272** is by far the most-used
  non-empty tile (249 placements across the demo map). With `firstgid: 1`
  and 24 columns, gid 272 → 0-based index 271 → column 7, row 11 → pixel
  offset (112, 176) in the sheet. Cropped and visually confirmed: it is a
  cyan-topped dark platform/floor block, i.e. the ground tile.
- Other high-frequency tiles found in the same map (walls/panels/edges, not
  further identified individually): gids 29, 56, 46, 245, 50, 26.

Preview: `public/assets/_previews/tileset_preview_2x.png` (2x
nearest-neighbor upscale of the full atlas).

## Previews — `public/assets/_previews/`

| File | Shows |
|---|---|
| `character_strip_preview_3x.png` | Full 45-frame character strip, 3x scaled, for at-a-glance animation review |
| `background_layers_composite_preview.png` | All 4 background layers assembled into one 640×360 scene |
| `tileset_preview_2x.png` | Full 384×256 tileset atlas, 2x scaled |

These preview files are for human/reviewer inspection only and are not
required at runtime — safe to delete if disk space matters, the engine
reads the per-layer / per-sheet files listed above.
