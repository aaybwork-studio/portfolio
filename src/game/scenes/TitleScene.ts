// Title/start screen. Replaces the walkable Hero zone as the entry point.
// Static backdrop (reuses createBackground's hero biome), a DOM overlay with
// the hero text + PLAY button, and a handful of placeholder "floating"
// project-icon squares. Play -> HubScene.

import Phaser from "phaser";
import { SCENES, EVENTS } from "../config/world";
import { EventBus } from "../EventBus";
import { createBackground } from "../systems/Background";
import type { Background } from "../systems/Background";
import { WORLD } from "../config/world";
import { BIOMES } from "../config/biomes";

export class TitleScene extends Phaser.Scene {
  private bg!: Background;
  private domRoot!: HTMLDivElement;
  private keyHandler?: (ev: KeyboardEvent) => void;

  constructor() {
    super(SCENES.title);
  }

  create(): void {
    const biome = BIOMES.hero;
    this.cameras.main.setBackgroundColor(biome.palette.bg);

    // Static backdrop — hero biome art/placeholder, no scroll/parallax needed
    // since there's no camera movement on this screen, but createBackground
    // still gives us the right art-vs-placeholder handling for free.
    this.bg = createBackground(this, "hero", { sceneWidth: WORLD.heroWidth });

    this.mountOverlay();

    const goToHub = () => this.scene.start(SCENES.hub);
    this.keyHandler = (ev: KeyboardEvent) => {
      if (ev.code === "Enter" || ev.code === "Space" || ev.code === "KeyE") {
        ev.preventDefault();
        goToHub();
      }
    };
    window.addEventListener("keydown", this.keyHandler);

    this.events.once("shutdown", () => this.cleanup());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanup());

    EventBus.emit(EVENTS.zoneChanged, { zone: "Title" });
  }

  update(): void {
    this.bg.update(this.cameras.main);
  }

  private mountOverlay(): void {
    const parent = document.getElementById("game-root")?.parentElement ?? document.body;

    const root = document.createElement("div");
    root.className = "title-overlay";
    root.style.cssText = `
      position: absolute;
      inset: 0;
      z-index: 30;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      pointer-events: none;
      padding: 24px;
      font-family: var(--font-mono, monospace);
    `;

    const name = document.createElement("h1");
    name.textContent = "Aayush Bhandari";
    name.style.cssText = `
      margin: 0 0 10px;
      font-family: var(--font-display, monospace);
      font-size: clamp(1.2rem, 4vw, 2rem);
      font-weight: 400;
      color: var(--ink, #f5f5f7);
      letter-spacing: 0.02em;
    `;

    const role = document.createElement("div");
    role.textContent = "Interaction & UX Designer";
    role.style.cssText = `
      font-size: clamp(0.85rem, 2vw, 1.05rem);
      color: var(--accent, #00e5ff);
      margin-bottom: 8px;
    `;

    const tagline = document.createElement("div");
    tagline.textContent = "I make simple, clear, immersive digital experiences.";
    tagline.style.cssText = `
      font-size: 0.8rem;
      color: var(--ink-dim, #a6a6b3);
      max-width: 480px;
      margin-bottom: 28px;
    `;

    const playBtn = document.createElement("button");
    playBtn.textContent = "PLAY";
    playBtn.setAttribute("aria-label", "Play — enter the hub");
    playBtn.style.cssText = `
      pointer-events: auto;
      cursor: pointer;
      padding: 12px 32px;
      font-family: var(--font-mono, monospace);
      font-size: 0.95rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--bg, #0a0a12);
      background: var(--accent, #00e5ff);
      border: none;
      border-radius: var(--radius, 10px);
      box-shadow: 0 0 18px var(--accent, #00e5ff);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    `;
    playBtn.addEventListener("mouseenter", () => {
      playBtn.style.transform = "scale(1.05)";
    });
    playBtn.addEventListener("mouseleave", () => {
      playBtn.style.transform = "scale(1)";
    });
    playBtn.addEventListener("click", () => this.scene.start(SCENES.hub));

    const hint = document.createElement("div");
    hint.textContent = "Press Enter / Space / E to play";
    hint.style.cssText = `
      margin-top: 14px;
      font-size: 0.68rem;
      color: var(--ink-dim, #a6a6b3);
      letter-spacing: 0.04em;
    `;

    root.appendChild(name);
    root.appendChild(role);
    root.appendChild(tagline);
    root.appendChild(playBtn);
    root.appendChild(hint);

    // Placeholder "floating" project-icon squares. TODO: swap each square for
    // a proper 8-bit icon per project — Orbit = space motif, Memory Bank =
    // locket/pin, Nav-Aid = navigation waypoint/compass, PitWall = F1
    // tires/cars. Positions/colors are placeholders only.
    const floaters: { top: string; left: string; color: string; delay: string }[] = [
      { top: "16%", left: "12%", color: BIOMES.orbit.palette.accent.toString(16), delay: "0s" },
      { top: "24%", left: "82%", color: BIOMES.hub.palette.accent.toString(16), delay: "0.6s" },
      { top: "70%", left: "18%", color: "ffb400", delay: "1.1s" },
      { top: "68%", left: "80%", color: BIOMES.pitwall.palette.accent.toString(16), delay: "1.6s" },
    ];

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    for (const f of floaters) {
      const el = document.createElement("div");
      el.className = "title-floater";
      el.style.cssText = `
        position: absolute;
        top: ${f.top};
        left: ${f.left};
        width: 20px;
        height: 20px;
        background: #${f.color.padStart(6, "0")};
        border: 2px solid rgba(245,245,247,0.6);
        image-rendering: pixelated;
        ${reduceMotion ? "" : `animation: title-drift 4.5s ease-in-out ${f.delay} infinite;`}
      `;
      root.appendChild(el);
    }

    if (!reduceMotion && !document.getElementById("title-drift-keyframes")) {
      const style = document.createElement("style");
      style.id = "title-drift-keyframes";
      style.textContent = `
        @keyframes title-drift {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
      `;
      document.head.appendChild(style);
    }

    parent.appendChild(root);
    this.domRoot = root;
  }

  private cleanup(): void {
    if (this.keyHandler) {
      window.removeEventListener("keydown", this.keyHandler);
      this.keyHandler = undefined;
    }
    this.domRoot?.remove();
  }
}
