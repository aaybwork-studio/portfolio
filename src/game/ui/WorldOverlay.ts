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
    } as Partial<CSSStyleDeclaration>);
    if (!parent.style.position) parent.style.position = "relative";
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
    if (view.width === 0 || view.height === 0) return;
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
        margin-top:6px; opacity:.8; display:block; }
      .wo-prompt {
        width:26px; height:26px; display:grid; place-items:center;
        font-family:var(--font-mono); font-size:13px; font-weight:600; color:var(--bg);
        background: var(--accent); border-radius:7px;
        box-shadow:0 0 0 3px color-mix(in srgb, var(--accent) 30%, transparent);
        animation: wo-bob 1.4s ease-in-out infinite;
      }
      @keyframes wo-bob { 0%,100%{ margin-top:0 } 50%{ margin-top:-5px } }
      @media (prefers-reduced-motion: reduce) { .wo-prompt { animation: none; } }
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

/** Create a speech bubble element with optional speaker name + hint line. */
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
