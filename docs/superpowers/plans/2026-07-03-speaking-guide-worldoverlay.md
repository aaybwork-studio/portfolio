# Speaking Guide + WorldOverlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make Aayush speak at each checkpoint in project levels via crisp comic speech bubbles, and give every interactable a crisp floating "E" prompt — all as DOM elements tracked over the Phaser canvas.

**Architecture:** A `WorldOverlay` singleton owns a DOM layer sized to the game canvas. Callers register elements pinned to world (x,y); each frame the overlay projects world→screen using the active camera's `worldView` and the canvas display rect, positioning elements. Speech bubbles and E-prompts are built on it. Fixes canvas low-res text (now browser-rendered) and enables real bubbles. This is spec Phase 3.

**Tech Stack:** Phaser 3, TypeScript (strict, verbatimModuleSyntax), DOM overlays, Astro. Verification is `tsc --noEmit` + live browser (preview tools), not unit tests — this codebase has no test runner and the behavior is visual.

---

## File structure

- Create `src/game/ui/WorldOverlay.ts` — DOM tracking layer + factory for bubbles/prompts. Singleton.
- Modify `src/game/index.ts` — construct WorldOverlay with the game + canvas parent; expose current camera each scene.
- Modify `src/game/scenes/LevelScene.ts` — guide speaks intro line at each checkpoint; E-prompt on checkpoints; wire overlay camera.
- Modify `src/game/scenes/HubScene.ts` — E-prompts on NPC + portals via overlay (reuse); keep existing dialog.
- Modify `src/game/entities/KuraNPC.ts` — add `say(line)` helper that shows a bubble anchored above him.
- Reuse existing `src/game/config/world.ts` (EVENTS, WORLD.interactRadius) and `EventBus.ts`.

---

### Task 1: WorldOverlay singleton

**Files:**
- Create: `src/game/ui/WorldOverlay.ts`

- [ ] **Step 1: Implement WorldOverlay**

```ts
import Phaser from "phaser";

type WorldPos = { x: number; y: number };

interface Tracked {
  el: HTMLElement;
  getWorld: () => WorldPos;
  offsetY: number; // px above the anchor, in screen space
}

/**
 * DOM layer over the Phaser canvas. Elements are pinned to world coordinates and
 * repositioned every frame from the active camera's worldView + the canvas display
 * rect (which already accounts for Phaser Scale.FIT scaling and centering).
 */
class WorldOverlayImpl {
  private root: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private camera: Phaser.Cameras.Scene2D.Camera | null = null;
  private tracked = new Set<Tracked>();

  /** Call once after the game boots. parent is the element containing the canvas. */
  attach(parent: HTMLElement, canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const root = document.createElement("div");
    root.className = "world-overlay";
    Object.assign(root.style, {
      position: "absolute",
      inset: "0",
      pointerEvents: "none",
      overflow: "hidden",
      zIndex: "5",
    } as CSSStyleDeclaration);
    parent.style.position = parent.style.position || "relative";
    parent.appendChild(root);
    this.root = root;
    this.injectStyles();
  }

  /** The active scene sets its camera each create(). */
  setCamera(cam: Phaser.Cameras.Scene2D.Camera) {
    this.camera = cam;
  }

  /** Register a DOM element pinned above a world position. Returns an unregister fn. */
  track(el: HTMLElement, getWorld: () => WorldPos, offsetY = 0): () => void {
    if (this.root && el.parentElement !== this.root) this.root.appendChild(el);
    const t: Tracked = { el, getWorld, offsetY };
    this.tracked.add(t);
    return () => {
      this.tracked.delete(t);
      el.remove();
    };
  }

  /** Remove all tracked elements (call on scene shutdown). */
  clear() {
    this.tracked.forEach((t) => t.el.remove());
    this.tracked.clear();
  }

  /** Called each frame; projects world→screen and positions elements. */
  update() {
    if (!this.camera || !this.canvas || !this.root) return;
    const view = this.camera.worldView; // world rect currently visible
    const rect = this.canvas.getBoundingClientRect();
    const parentRect = this.root.getBoundingClientRect();
    const scaleX = rect.width / view.width;
    const scaleY = rect.height / view.height;
    const offX = rect.left - parentRect.left;
    const offY = rect.top - parentRect.top;
    this.tracked.forEach((t) => {
      const w = t.getWorld();
      const sx = offX + (w.x - view.x) * scaleX;
      const sy = offY + (w.y - view.y) * scaleY - t.offsetY;
      t.el.style.transform = `translate(-50%, -100%) translate(${sx}px, ${sy}px)`;
    });
  }

  private injectStyles() {
    if (document.getElementById("world-overlay-styles")) return;
    const s = document.createElement("style");
    s.id = "world-overlay-styles";
    s.textContent = `
      .world-overlay .wo-el { position:absolute; top:0; left:0; will-change:transform; }
      .wo-bubble {
        max-width: 240px; padding: 10px 14px; border-radius: 14px;
        background: color-mix(in srgb, var(--bg-elev) 92%, transparent);
        color: var(--ink); border: 1px solid var(--line);
        box-shadow: 0 8px 30px rgba(0,0,0,.45);
        font-family: var(--font-body); font-size: 14px; line-height: 1.45;
        backdrop-filter: blur(6px);
      }
      .wo-bubble::after {
        content:""; position:absolute; left:50%; bottom:-8px; transform:translateX(-50%);
        border:8px solid transparent; border-top-color: var(--line);
      }
      .wo-bubble .wo-name { font-family:var(--font-mono); font-size:11px; letter-spacing:.08em;
        text-transform:uppercase; color:var(--accent); display:block; margin-bottom:4px; }
      .wo-bubble .wo-more { font-family:var(--font-mono); font-size:10px; color:var(--ink-dim);
        margin-top:6px; opacity:.8; }
      .wo-prompt {
        width:26px; height:26px; display:grid; place-items:center;
        font-family:var(--font-mono); font-size:13px; font-weight:600; color:var(--bg);
        background: var(--accent); border-radius:7px;
        box-shadow:0 0 0 3px color-mix(in srgb, var(--accent) 30%, transparent);
        animation: wo-bob 1.4s ease-in-out infinite;
      }
      @keyframes wo-bob { 0%,100%{ margin-top:0 } 50%{ margin-top:-5px } }
      @media (prefers-reduced-motion: reduce) {
        .wo-prompt { animation: none; }
      }
    `;
    document.head.appendChild(s);
  }
}

export const WorldOverlay = new WorldOverlayImpl();

/** Create a floating "E" prompt element (caller tracks it). */
export function makePrompt(key = "E"): HTMLElement {
  const el = document.createElement("div");
  el.className = "wo-el wo-prompt";
  el.textContent = key;
  return el;
}

/** Create a speech bubble element with optional speaker name + "press E" hint. */
export function makeBubble(text: string, name?: string, more?: string): HTMLElement {
  const el = document.createElement("div");
  el.className = "wo-el wo-bubble";
  if (name) {
    const n = document.createElement("span");
    n.className = "wo-name";
    n.textContent = name;
    el.appendChild(n);
  }
  const body = document.createElement("span");
  body.className = "wo-body";
  el.appendChild(body);
  if (more) {
    const m = document.createElement("span");
    m.className = "wo-more";
    m.textContent = more;
    el.appendChild(m);
  }
  // typewriter (respects reduced-motion)
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    body.textContent = text;
  } else {
    let i = 0;
    const tick = () => {
      body.textContent = text.slice(0, i++);
      if (i <= text.length) setTimeout(tick, 18);
    };
    tick();
  }
  return el;
}
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/kura/portfolio-game && npx tsc --noEmit`
Expected: no errors from WorldOverlay.ts (LevelScene/index may error until later tasks — note but continue).

- [ ] **Step 3: Commit**

```bash
git add src/game/ui/WorldOverlay.ts
git commit -m "feat(game): add WorldOverlay DOM layer + bubble/prompt factories"
```

---

### Task 2: Boot the overlay + per-frame update

**Files:**
- Modify: `src/game/index.ts`

- [ ] **Step 1:** In `mountGame`, after `new Phaser.Game(...)`, attach the overlay and drive its update from the game step.

Add near the top: `import { WorldOverlay } from "./ui/WorldOverlay";`

After the game is created (call the game variable `game`), add:

```ts
game.events.once(Phaser.Core.Events.READY, () => {
  const parent = document.getElementById(parentId) ?? document.body;
  const canvas = game.canvas as HTMLCanvasElement;
  WorldOverlay.attach(parent, canvas);
});
// Drive overlay every rendered frame (post-render so camera is settled).
game.events.on(Phaser.Core.Events.POST_RENDER, () => WorldOverlay.update());
```

- [ ] **Step 2: Typecheck** — `npx tsc --noEmit` (WorldOverlay errors gone; LevelScene still pending).
- [ ] **Step 3: Commit**

```bash
git add src/game/index.ts
git commit -m "feat(game): attach WorldOverlay to game + update each frame"
```

---

### Task 3: KuraNPC.say() bubble helper

**Files:**
- Modify: `src/game/entities/KuraNPC.ts`

- [ ] **Step 1:** Add a `say` method using the overlay. Add imports:

```ts
import { WorldOverlay, makeBubble } from "../ui/WorldOverlay";
```

Add a field `private bubbleUnsub?: () => void;` and methods (adapt to the class's existing x/y getters — the NPC exposes its sprite position; use it):

```ts
/** Show a speech bubble above Aayush. more = hint line (e.g. "Press E"). */
say(text: string, name = "Aayush", more?: string) {
  this.clearSay();
  const el = makeBubble(text, name, more);
  this.bubbleUnsub = WorldOverlay.track(el, () => ({ x: this.x, y: this.y }), this.displayHeight * 0.6);
}

clearSay() {
  this.bubbleUnsub?.();
  this.bubbleUnsub = undefined;
}
```

If the class lacks public `x`/`y`/`displayHeight`, add getters that read the underlying game object (e.g. `get x() { return this.sprite.x; }`).

- [ ] **Step 2: Typecheck** — `npx tsc --noEmit`. Fix any missing-getter errors in this file.
- [ ] **Step 3: Commit**

```bash
git add src/game/entities/KuraNPC.ts
git commit -m "feat(game): KuraNPC.say() shows a tracked speech bubble"
```

---

### Task 4: Guide narrates each checkpoint in LevelScene

**Files:**
- Modify: `src/game/scenes/LevelScene.ts`

- [ ] **Step 1:** In `create()`, after building the camera, register it: add import `import { WorldOverlay, makePrompt } from "../ui/WorldOverlay";` and call `WorldOverlay.setCamera(this.cameras.main);` and `this.events.once("shutdown", () => WorldOverlay.clear());`.

- [ ] **Step 2:** Derive the guide's intro line per checkpoint = first sentence of `checkpoint.body`. Add a helper at top of file:

```ts
const firstSentence = (s: string) => (s.match(/^.*?[.!?](\s|$)/)?.[0] ?? s).trim();
```

- [ ] **Step 3:** When the player reaches / opens a checkpoint (in the existing proximity/interact logic), before/with opening the ContentPanel, have Aayush speak. Where the code currently does `walkTo` to the next checkpoint, also call:

```ts
this.aayush.say(firstSentence(checkpoint.body), "Aayush", "Press E to read more");
```

And when the player moves away or opens the panel, `this.aayush.clearSay();`.

- [ ] **Step 4:** Add a floating E-prompt on the nearest in-range checkpoint. Track one prompt element, move its anchor to the active checkpoint's world position, show only when within `WORLD.interactRadius`:

```ts
// in create(): const prompt = makePrompt("E"); let promptUnsub: (() => void) | null = null;
// in update(): find nearest checkpoint within interactRadius; if present and not open,
//   if (!promptUnsub) promptUnsub = WorldOverlay.track(prompt, () => ({ x: cp.x, y: cp.y }), 40);
//   else update is automatic via the getWorld closure (recreate closure by re-tracking if cp changed);
// when none in range: promptUnsub?.(); promptUnsub = null;
```

Implement concretely against the scene's existing checkpoint array (each marker already stores its x). Keep one prompt element reused.

- [ ] **Step 5: Typecheck** — `npx tsc --noEmit`. Expected: clean.

- [ ] **Step 6: Browser verify** — dev server running; teleport to Orbit, walk to first checkpoint. Confirm: a speech bubble with Aayush's intro line appears above him (crisp, typewriter), and an "E" prompt floats over the in-range checkpoint. Confirm bubble clears when leaving.

- [ ] **Step 7: Commit**

```bash
git add src/game/scenes/LevelScene.ts
git commit -m "feat(game): Aayush narrates each checkpoint + floating E prompts in levels"
```

---

### Task 5: E-prompts in Hub (reuse), keep dialog

**Files:**
- Modify: `src/game/scenes/HubScene.ts`

- [ ] **Step 1:** Add `WorldOverlay.setCamera(this.cameras.main)` in create() and `this.events.once("shutdown", () => WorldOverlay.clear())`. Import `makePrompt`.
- [ ] **Step 2:** Show a floating E-prompt over Aayush and over each portal when the player is within `WORLD.interactRadius` (same reused-element pattern as Task 4). Existing hub dialog (the 3 lines) stays as-is for now (converted to bubbles in a later phase).
- [ ] **Step 3: Typecheck** — `npx tsc --noEmit` clean.
- [ ] **Step 4: Browser verify** — hub: E-prompt appears over Aayush and portals when near.
- [ ] **Step 5: Commit**

```bash
git add src/game/scenes/HubScene.ts
git commit -m "feat(game): floating E prompts on hub NPC + portals"
```

---

### Task 6: Final verify + push

- [ ] **Step 1:** `cd /Users/kura/portfolio-game && npx astro build` → succeeds.
- [ ] **Step 2:** Browser walk-through: hero → hub (prompts) → each level (Aayush speaks per checkpoint, prompts show, panel opens on E). No console errors.
- [ ] **Step 3:** Push.

```bash
git push origin main
```

---

## Self-review notes

- **Spec coverage:** Implements spec Phase 3 (WorldOverlay + SpeechBubble + crisp prompts + guide narration in levels). Other phases (art, atmosphere, portals, back-nav, inventory, level redesign, read pages) are out of scope for THIS plan and get their own plans.
- **Reduced-motion:** bubble typewriter + prompt bob disabled under `prefers-reduced-motion`.
- **No new copy:** guide line derived from existing `checkpoint.body` (first sentence) — honors "copy only in content files."
- **Types:** `WorldOverlay.track/setCamera/clear/attach/update`, `makeBubble`, `makePrompt`, `KuraNPC.say/clearSay` — names consistent across tasks.
- **Risk:** LevelScene/HubScene internal names (checkpoint array, aayush field, camera) must be read from the actual files before editing — the plan says "adapt to existing" at those points.
