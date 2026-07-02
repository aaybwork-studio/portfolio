// Persistent DOM HUD overlay. Résumé button, teleport nav, read-mode menu,
// control hint, and zone label. Talks to scenes exclusively through EventBus.

import { EventBus } from "../EventBus";
import { EVENTS } from "../config/world";
import type { NavTarget } from "../config/world";

const NAV_BUTTONS: { label: string; target: NavTarget }[] = [
  { label: "Hero", target: "hero" },
  { label: "Hub", target: "hub" },
  { label: "Orbit", target: "orbit" },
  { label: "Memory Bank", target: "memory-bank" },
  { label: "Nav-Aid", target: "nav-aid" },
  { label: "PitWall", target: "pitwall" },
];

const READ_MODE_LINKS: { label: string; href: string }[] = [
  { label: "Orbit", href: "/work/orbit" },
  { label: "Memory Bank", href: "/work/memory-bank" },
  { label: "Nav-Aid", href: "/work/nav-aid" },
  { label: "PitWall", href: "/work/pitwall" },
];

export class HUD {
  private root: HTMLElement;
  private container: HTMLDivElement;
  private resumeLink: HTMLAnchorElement;
  private hintEl: HTMLDivElement;
  private zoneEl: HTMLDivElement;
  private hintTimeout: ReturnType<typeof setTimeout> | null = null;
  private unsubscribers: (() => void)[] = [];

  constructor(root: HTMLElement) {
    this.root = root;
    this.injectStyles();

    this.container = document.createElement("div");
    this.container.className = "hud-overlay";
    this.container.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 40;
      font-family: var(--font-mono, monospace);
      color: var(--ink, #f5f5f7);
    `;

    // Top bar: zone label + résumé button
    const topBar = document.createElement("div");
    topBar.style.cssText = `
      position: absolute;
      top: 12px;
      left: 12px;
      right: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    `;

    this.zoneEl = document.createElement("div");
    this.zoneEl.className = "hud-zone";
    this.zoneEl.textContent = "";
    this.zoneEl.style.cssText = `
      pointer-events: none;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--ink-dim, #a6a6b3);
      background: rgba(10,10,18,0.6);
      padding: 6px 10px;
      border-radius: var(--radius, 10px);
    `;
    topBar.appendChild(this.zoneEl);

    this.resumeLink = document.createElement("a");
    this.resumeLink.href = "/resume";
    this.resumeLink.textContent = "Résumé";
    this.resumeLink.className = "hud-resume";
    this.resumeLink.style.cssText = `
      pointer-events: auto;
      display: inline-block;
      padding: 8px 14px;
      border: 1px solid var(--line, #2a2a3a);
      border-radius: var(--radius, 10px);
      background: var(--bg-elev, #14141f);
      color: var(--ink, #f5f5f7);
      text-decoration: none;
      font-size: 0.78rem;
      letter-spacing: 0.04em;
      transition: box-shadow 0.3s ease, border-color 0.3s ease;
    `;
    topBar.appendChild(this.resumeLink);
    this.container.appendChild(topBar);

    // Bottom bar: teleport nav + read-mode menu
    const bottomBar = document.createElement("div");
    bottomBar.style.cssText = `
      position: absolute;
      bottom: 12px;
      left: 12px;
      right: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
      flex-wrap: wrap;
    `;

    const navWrap = document.createElement("div");
    navWrap.style.cssText = `
      pointer-events: auto;
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      background: rgba(10,10,18,0.6);
      padding: 6px;
      border-radius: var(--radius, 10px);
    `;
    for (const { label, target } of NAV_BUTTONS) {
      const btn = document.createElement("button");
      btn.textContent = label;
      btn.style.cssText = `
        pointer-events: auto;
        cursor: pointer;
        padding: 6px 10px;
        font-family: var(--font-mono, monospace);
        font-size: 0.68rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        border: 1px solid var(--line, #2a2a3a);
        border-radius: 6px;
        background: var(--bg-elev, #14141f);
        color: var(--ink, #f5f5f7);
      `;
      btn.addEventListener("click", () => {
        EventBus.emit(EVENTS.navTo, { target });
      });
      navWrap.appendChild(btn);
    }
    bottomBar.appendChild(navWrap);

    const readWrap = document.createElement("div");
    readWrap.style.cssText = `
      pointer-events: auto;
      display: flex;
      gap: 10px;
      align-items: center;
      background: rgba(10,10,18,0.6);
      padding: 6px 10px;
      border-radius: var(--radius, 10px);
    `;
    const readLabel = document.createElement("span");
    readLabel.textContent = "Read:";
    readLabel.style.cssText = `font-size: 0.68rem; color: var(--ink-dim, #a6a6b3);`;
    readWrap.appendChild(readLabel);
    for (const { label, href } of READ_MODE_LINKS) {
      const a = document.createElement("a");
      a.href = href;
      a.textContent = label;
      a.style.cssText = `
        font-size: 0.68rem;
        color: var(--accent, #00e5ff);
        text-decoration: none;
      `;
      readWrap.appendChild(a);
    }
    bottomBar.appendChild(readWrap);

    this.container.appendChild(bottomBar);

    // Control hint, centered
    this.hintEl = document.createElement("div");
    this.hintEl.className = "hud-hint";
    this.hintEl.textContent = "Move ← → / A D · Jump W / Space · Interact E";
    this.hintEl.style.cssText = `
      position: absolute;
      bottom: 64px;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: none;
      font-size: 0.72rem;
      letter-spacing: 0.04em;
      color: var(--ink, #f5f5f7);
      background: rgba(10,10,18,0.7);
      padding: 8px 14px;
      border-radius: var(--radius, 10px);
      opacity: 0;
      transition: opacity 0.6s ease;
    `;
    this.container.appendChild(this.hintEl);

    this.root.appendChild(this.container);

    this.unsubscribers.push(
      EventBus.on(EVENTS.resumeCollected, () => this.lightResumeButton()),
      EventBus.on(EVENTS.showHint, () => this.showHint()),
      EventBus.on(EVENTS.zoneChanged, (payload) => this.onZoneChanged(payload)),
    );
  }

  private injectStyles(): void {
    if (document.getElementById("hud-overlay-styles")) return;
    const style = document.createElement("style");
    style.id = "hud-overlay-styles";
    style.textContent = `
      .hud-resume.hud-resume--lit {
        border-color: var(--accent, #00e5ff);
        box-shadow: 0 0 12px var(--accent, #00e5ff);
      }
    `;
    document.head.appendChild(style);
  }

  private lightResumeButton(): void {
    this.resumeLink.classList.add("hud-resume--lit");
  }

  private showHint(): void {
    this.hintEl.style.opacity = "1";
    if (this.hintTimeout) clearTimeout(this.hintTimeout);
    this.hintTimeout = setTimeout(() => {
      this.hintEl.style.opacity = "0";
    }, 4000);
  }

  private onZoneChanged(payload: unknown): void {
    const zone = (payload as { zone?: string } | undefined)?.zone;
    this.zoneEl.textContent = zone ?? "";
  }

  /** Call to fade out the hint immediately (e.g. on first player move). */
  fadeHint(): void {
    this.hintEl.style.opacity = "0";
  }

  destroy(): void {
    this.unsubscribers.forEach((fn) => fn());
    if (this.hintTimeout) clearTimeout(this.hintTimeout);
    this.container.remove();
  }
}
