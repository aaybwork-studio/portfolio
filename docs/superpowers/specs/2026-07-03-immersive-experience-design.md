# Spec — Immersive Experience Pass

Date: 2026-07-03
Status: Approved-pending-review
Project: Aayush Bhandari portfolio platformer (`/Users/kura/portfolio-game`)

## Goal

Turn the working placeholder-shape skeleton into an immersive, art-driven, Hollow-Knight-flavored experience — for both the playable game and the read-mode pages — without breaking the "one content model, three presentations" architecture or the SEO guarantee.

## Locked decisions

- **Art is now IN.** Placeholder rectangles replaced with real art via the existing `sprites.ts` / `biomes.ts` config seam (`usePlaceholder` → false, fill `path`, drop files in `public/assets/`). No game logic references image paths directly.
- **Character sprites** (player + Aayush): free **CC0 animated sprite** (walk / idle / jump frames). Aayush = recolor/variant of the same or a second CC0 sprite.
- **Environments / parallax / props / tiles**: **CC0 free packs** (Kenney / OpenGameArt), one cohesive art system tinted per biome. (Gemini image-gen ruled out — free-tier quota is 0; billing declined.)
- **Art direction**: the *experience* of a crafted immersive platformer (like Hollow Knight) — NOT its grim visual vibe. Portfolio-appropriate: clean, cohesive, atmospheric, approachable. One cohesive CC0 art system **tinted per biome** to hit each theme's palette (from `biomes.ts`) + themed accent props, rather than 6 bespoke background sets.
- **Inventory persistence**: `localStorage` allowed (relaxes brief's "no browser storage"; still no backend/DB). Gifts + resume-collected persist across visits.
- **Motion**: atmospheric/weighty, tasteful — not arcade-gaudy. Respect `prefers-reduced-motion` (disable non-essential motion, keep functional transitions instant).
- **No fail states** anywhere (unchanged). Platforming is for exploration/mood; nothing kills the player.
- Licensing: CC0 / public-domain / self-generated only.

## Art pipeline

1. **Validate generation first (execution step 0).** Generate one test biome background via `nano-banana-pro`. If unavailable/poor, fall back to CC0 web packs (Kenney, OpenGameArt) for environments too. Do not build features assuming gen works until confirmed.
2. **Per biome** (hero, hub, orbit, memory-bank, nav-aid, pitwall): generate layered parallax art — far sky/space, mid scenery, near foreground occluder — sized for the parallax layers in `biomes.ts`. Moody, per-palette.
3. **Themed portal props** (PNG w/ transparency): Orbit = rocket; Memory Bank = place-pin/locket; Nav-Aid = wayfinding beacon; PitWall = F1 pit-lane light gantry. Each idles + plays an entry animation.
4. **Character**: CC0 spritesheet(s) → `public/assets/`, wired through `sprites.ts` (frame size, anim ranges, usePlaceholder=false). Register anims in BootScene when usePlaceholder is false (code path already stubbed).
5. **Ground / platform tiles**: CC0 tileset or generated, per biome tint.
6. Keep every asset behind the config seam. `usePlaceholder` stays supported so a missing asset degrades to a rectangle, never a crash.

## New game systems (each a focused module, reused across scenes)

- **`WorldOverlay`** (`src/game/ui/WorldOverlay.ts`) — DOM layer over the canvas. Registers DOM elements pinned to world coordinates; on each frame, projects world→screen via the active camera and positions them. Powers: speech bubbles, floating E-prompts, entity name labels. **Fixes low-res text** (browser-rendered, not canvas) and enables **comic speech bubbles**.
- **`SpeechBubble`** (via WorldOverlay) — comic bubble with tail anchored to a speaker (Aayush/player), typewriter reveal, advance/close on E or click. Replaces the bottom DialogBox for in-world dialogue. (A bottom panel may remain for long-form ContentPanel body text.)
- **`TransitionManager`** (`src/game/systems/TransitionManager.ts`) — themed scene transitions. Default: fade/iris. Portal-specific: rocket-launch (Orbit), etc. Fades HUD zone-label in sync. Reduced-motion → instant cut.
- **`Atmosphere`** (`src/game/systems/Atmosphere.ts`) — per-biome mood: drifting particles/spores, fog gradient, vignette, soft accent glow/light shafts, parallax depth. Reads biome palette. Reduced-motion → static, no drift.
- **`juice.ts`** (`src/game/systems/juice.ts`) — squash/stretch, land-impact camera shake, dust bursts, weighty momentum helpers, reusable eases. All motion routed through here so reduced-motion is a single switch.
- **`Interactable`** (`src/game/systems/Interactable.ts`) — mixin/component: proximity detection (WORLD.interactRadius), glow + pulse when in range, floating E-prompt (via WorldOverlay), onInteract callback. Applied uniformly to NPC, checkpoints, portals.
- **`Inventory`** (`src/game/systems/Inventory.ts`) — session state + `localStorage` sync. Items: `resume` (always present), `orbit-gift`, `memory-bank-gift`, `nav-aid-gift`, `pitwall-gift`. API: `has(id)`, `grant(id)`, `all()`, `onChange(cb)`. Emits via EventBus so HUD/inventory UI update.
- **`InventoryPanel`** (`src/game/ui/InventoryPanel.ts`) — DOM overlay, opened by `I`/`Tab` key + a HUD button. Grid of owned items; click resume → `/resume`; click gift → detail card (themed micro-copy). Add-item burst animation.

## Feature specs

### Guide narration in levels
Aayush walks ahead to each checkpoint AND speaks a short intro line (speech bubble) as the player arrives. The checkpoint's full `body` opens in the ContentPanel on E. Intro line = first sentence of the checkpoint body (derived, no new copy written). Guide advances to next checkpoint after the player opens the current one.

### Themed portals (hub)
Replace plain gate rects with the themed props above. Each: idle animation (rocket exhaust flicker, beacon pulse, gantry lights), Interactable affordance, and on-entry a themed TransitionManager sequence into the level. PitWall portal opens the highlight ContentPanel (blocks) or routes to `/work/pitwall`.

### Back-navigation
Left edge of a **level** → return to hub (mirror of right-edge exit). Left edge of the **hub** → return to hero. Add left-boundary trigger zones symmetric to existing right-edge ones. A subtle "← back" WorldOverlay hint near left edges.

### Level redesign (non-linear / immersive)
LevelScene lays out checkpoints across a hand-authored-feeling space, not a flat line: multiple platform elevations, foreground occluders, deep parallax background art, ambient props + light shafts per biome. Checkpoints placed in distinct "places." Optional gentle vertical exploration (jump-up ledges) with no death. Layout data lives in a per-biome layout config so LevelScene stays generic.

### Inventory + gifts
Completing a project's **full** checkpoint journey (all checkpoints opened) grants that project's themed gift → Inventory (with burst + toast). Resume is a permanent inventory item. Persist via localStorage. A one-click resume affordance remains reachable for hiring managers (HUD keeps a resume shortcut that also lives in inventory).
Gift names/themes: Orbit = "Orb fragment"; Memory Bank = "locket / place-pin"; Nav-Aid = "wayfinder badge"; PitWall = die-cast **collectible** (never "object").

### Micro-animations (everywhere)
HUD button hover/press, portal idles, item pickups, panel slide/fade, checkpoint-complete state change, resume-collected glow, inventory-add burst, read-page scroll-reveal + hover. All through `juice.ts` / CSS, gated by reduced-motion.

### HUD refresh
Crisp key-prompt chips replacing the current faded control-hint. Active-zone highlight. Inventory button. Résumé shortcut. Zone label with transition fade.

## Read-mode pages (make them look real)
- Extend design-system CSS: type scale, spacing, motion vars, reusable components.
- `/work/*`: each page themed to its biome palette, big header (tagline/oneLiner), sticky checkpoint index rail, scroll-reveal sections, stat callouts, prev/next project nav, "▶ play this level" back-to-game CTA. Copy still pulled only from content data. **SEO guarantee preserved** — all copy stays server-rendered in HTML.
- `/resume`: redesigned sections, contact chips, work cards → case studies, print styles.

## Constraints preserved
- One content model, three presentations. No case-study copy written outside `src/content/*.ts`.
- SEO: `/work/*` and `/resume` copy present in built HTML (re-verify after redesign).
- Config seam: no image path in game logic; `usePlaceholder` degrade-safe.
- Static Astro output, deploy on Vercel.

## Non-goals (this pass)
- Sound/music.
- Mobile vertical-scroll layout (separate future pass).
- Real backend/DB.
- Fonts remain current placeholders (not this pass, per user).

## Risks / open
- Gemini gen availability/quality in this environment — mitigated by CC0 fallback (execution step 0).
- Asset weight — keep backgrounds compressed; Phaser homepage bundle already ~348KB gz, watch total page weight.
- Character sprite licensing — verify CC0 before use, record source in `public/assets/CREDITS.md`.

## Suggested phase decomposition (for writing-plans)
1. Art pipeline validation + asset generation/sourcing (backgrounds, character, tiles, portal props) + CREDITS.
2. Config wiring (`sprites.ts`/`biomes.ts` real paths) + BootScene anim registration + degrade-safe loading.
3. `WorldOverlay` + `SpeechBubble` + crisp prompts/labels (fixes low-res + speech bubbles).
4. `Atmosphere` + `juice.ts` + camera feel + character micro-animations.
5. Themed portals + `TransitionManager` + back-navigation.
6. Level redesign (non-linear layout configs).
7. `Inventory` + `InventoryPanel` + gifts + HUD refresh + localStorage.
8. Read-page redesign + micro-interactions + SEO re-verify.

---

## 2026-07-04 Revision — 8-bit retro pivot

Supersedes the "pixel-art indie / Warped City" art direction. The Warped City (Ansimuz) assets are **retired**.

### Art direction (new)
- **Strict NES 8-bit** — tiny limited palette, chunky 8×16px tiles, Mario/SMB-era sprites. CC0 NES-style packs.
- **Retro everywhere** — the game AND the read pages (`/work/*`, `/resume`) get the 8-bit treatment (pixel display font, retro UI chrome). Constraint: keep case-study **body copy legible** (readable body size/contrast) and SEO copy server-rendered — retro styling must not harm readability or crawlability.
- Re-source: character (Mario-like CC0), tiles, and per-biome backgrounds in NES style. Config seam unchanged (drop files, flip paths).

### World flow (new)
- **TitleScene (start screen)** is the landing. Big hero text (name / role / tagline) + retro background art + **floating per-project 8-bit icons**. A **PLAY** control. On Play → spawn directly in **HubScene**. The old walkable Hero zone is **removed** (Title replaces it).
- **Floating title icons** (8-bit): Orbit = space stuff (planets/stars/rocket/satellite, not just an orb); Memory Bank = locket / place-pin; Nav-Aid = navigation waypoint/compass + route-path (NOT a wheelchair); PitWall = F1 tires + cars.

### Back-navigation (new, concrete)
- **Level**: walking to the **left edge** returns to Hub (mirrors the right-edge exit portal) — you can always back out by walking left.
- **Hub**: walking to the far **left edge** returns to the **Title** screen.

### Guide flow in levels (refined)
- Aayush **leads**: walks to the next checkpoint and **waits** there. Player walks over and **interacts** (E → panel). On panel close, Aayush advances to the **next** checkpoint; player follows. He **shows the way** around the map (a light trail/arrow toward his target is welcome).
- Levels are **non-linear** — varied platform elevations, small exploration, checkpoints not on a straight line. Still **fun + simple**, **no fail states** (nothing kills the player).

---

## 2026-07-04 Revision 2 — vehicle-piloted levels

Supersedes on-foot platforming in levels (platform layouts/reachability retired). The knight now only walks in the **Hub**; each **level** is piloted in a themed vehicle.

### Level mechanic: free-pilot vehicle
- In a level the player controls a **themed vehicle in free 2D movement** (arrows/WASD move in all directions, **no gravity**) across a level space larger than the screen. Reach **floating checkpoints** to open their panels.
- Level design: **simple + retro aesthetic** with **hidden secret areas** off the main path (optional secret checkpoint/collectible). No obstacle gauntlets, **no fail states**.
- Aayush **leads**: flies/moves ahead to the next checkpoint and waits (guide arrow points to him). 2D-distance interaction (must reach the checkpoint).
- Per-level vehicle: **Orbit = rocket**, **Memory Bank = boat/ferry**, **Nav-Aid = self-driving pod**, **PitWall = F1 car**. (Uniform free-2D-move mechanic; the sprite sells the theme.)

### Hub: vehicles, not doors
- The 4 portals become **parked themed vehicles** (rocket, boat, pod, F1 car). Walk up as the knight, press **E** to **board** → a short **launch animation** (rocket lifts off / F1 speeds off / boat sails / pod drives out of frame) → transition into that level (now piloting the vehicle).
- Leaving a level returns to the Hub.

### Landing page: clean + simple
- Big **PLAY** button + one **low-opacity line** "Press Enter to enter the game." Remove the floating-element clutter and the HUD overlap on the title. Keep it minimal.

### Speech bug
- Each level must show **only its own project's** checkpoint text. Clear WorldOverlay bubbles / guide state on scene shutdown so no stale/cross-project speech leaks between levels.

### Art needed
- Vehicle sprites (rocket, boat, pod, F1 car). Backgrounds for **all** biomes (hub + 4 levels + landing), NES 8-bit CC0, **tinted per biome** to theme colors. Hub art. Landing art (minimal).

