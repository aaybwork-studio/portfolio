// Title/start screen. Replaces the walkable Hero zone as the entry point.
// Static backdrop (reuses createBackground's hero biome) plus a minimal DOM
// overlay: name, subtle role/tagline, PLAY button, and a low-opacity hint.
// Play -> HubScene.

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
      gap: 0;
    `;

    const name = document.createElement("h1");
    name.textContent = "Aayush Bhandari";
    name.style.cssText = `
      margin: 0 0 14px;
      font-family: var(--font-display, monospace);
      font-size: clamp(1.8rem, 6vw, 3.2rem);
      font-weight: 400;
      color: var(--ink, #f5f5f7);
      letter-spacing: 0.02em;
    `;

    const role = document.createElement("div");
    role.textContent = "Interaction & UX Designer";
    role.style.cssText = `
      font-size: 0.85rem;
      color: var(--ink-dim, #a6a6b3);
      opacity: 0.7;
      margin-bottom: 6px;
    `;

    const tagline = document.createElement("div");
    tagline.textContent = "I make simple, clear, immersive digital experiences.";
    tagline.style.cssText = `
      font-size: 0.75rem;
      color: var(--ink-dim, #a6a6b3);
      opacity: 0.6;
      max-width: 420px;
      margin-bottom: 36px;
    `;

    const playBtn = document.createElement("button");
    playBtn.textContent = "PLAY";
    playBtn.setAttribute("aria-label", "Play — enter the hub");
    playBtn.style.cssText = `
      pointer-events: auto;
      cursor: pointer;
      padding: 14px 40px;
      font-family: var(--font-mono, monospace);
      font-size: 1rem;
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
    hint.textContent = "Press Enter to enter the game";
    hint.style.cssText = `
      margin-top: 18px;
      font-family: var(--font-mono, monospace);
      font-size: 0.68rem;
      color: var(--ink-dim, #a6a6b3);
      letter-spacing: 0.04em;
      opacity: 0.5;
    `;

    root.appendChild(name);
    root.appendChild(role);
    root.appendChild(tagline);
    root.appendChild(playBtn);
    root.appendChild(hint);

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
