// DOM overlay content panel. show({title, body}) for a single checkpoint, or
// showBlocks({title, blocks}) for a PitWall-style multi-section highlight.
// Dismissible via E or a close button.

export interface ContentPanelItem {
  title: string;
  body: string;
}

export interface ContentPanelBlock {
  heading: string;
  body: string;
}

export class ContentPanel {
  private root: HTMLElement;
  private overlay: HTMLDivElement;
  private panel: HTMLDivElement;
  private titleEl: HTMLHeadingElement;
  private bodyEl: HTMLDivElement;
  private closeBtn: HTMLButtonElement;
  private visible = false;
  private onCloseCb: (() => void) | null = null;
  private keyHandler = (e: KeyboardEvent) => {
    if (!this.visible) return;
    if (e.key === "e" || e.key === "E" || e.key === "Escape") {
      e.preventDefault();
      this.hide();
    }
  };

  constructor(root: HTMLElement) {
    this.root = root;

    this.overlay = document.createElement("div");
    this.overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.55);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 60;
      pointer-events: auto;
    `;
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.hide();
    });

    this.panel = document.createElement("div");
    this.panel.style.cssText = `
      width: min(560px, 90vw);
      max-height: 72vh;
      overflow-y: auto;
      background: var(--bg-elev, #14141f);
      border: 1px solid var(--line, #2a2a3a);
      border-radius: var(--radius, 10px);
      padding: 28px 32px;
      color: var(--ink, #f5f5f7);
      font-family: var(--font-body, sans-serif);
      box-shadow: 0 16px 48px rgba(0,0,0,0.6);
      position: relative;
    `;

    this.closeBtn = document.createElement("button");
    this.closeBtn.textContent = "×";
    this.closeBtn.setAttribute("aria-label", "Close");
    this.closeBtn.style.cssText = `
      position: absolute;
      top: 12px;
      right: 12px;
      background: none;
      border: none;
      color: var(--ink-dim, #a6a6b3);
      font-size: 1.4rem;
      cursor: pointer;
      line-height: 1;
    `;
    this.closeBtn.addEventListener("click", () => this.hide());
    this.panel.appendChild(this.closeBtn);

    this.titleEl = document.createElement("h2");
    this.titleEl.style.cssText = `
      font-family: var(--font-display, sans-serif);
      font-size: clamp(1rem, 2.4vw, 1.4rem);
      margin: 0 0 16px 0;
      color: var(--accent, #00e5ff);
    `;
    this.panel.appendChild(this.titleEl);

    this.bodyEl = document.createElement("div");
    this.bodyEl.style.cssText = `
      font-size: 0.95rem;
      line-height: 1.6;
    `;
    this.panel.appendChild(this.bodyEl);

    const hint = document.createElement("div");
    hint.textContent = "Press E or Esc to close";
    hint.style.cssText = `
      margin-top: 20px;
      font-family: var(--font-mono, monospace);
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--ink-dim, #a6a6b3);
    `;
    this.panel.appendChild(hint);

    this.overlay.appendChild(this.panel);
    this.root.appendChild(this.overlay);
    window.addEventListener("keydown", this.keyHandler);
  }

  /** Show a single checkpoint's title + body. `onClose` fires once, the next
   * time the panel is dismissed (E/Esc/close button/click-away). */
  show(item: ContentPanelItem, onClose?: () => void): void {
    this.titleEl.textContent = item.title;
    this.bodyEl.innerHTML = "";
    const p = document.createElement("p");
    p.textContent = item.body;
    p.style.margin = "0";
    this.bodyEl.appendChild(p);
    this.onCloseCb = onClose ?? null;
    this.open();
  }

  /** Show a highlight project's title + a list of heading/body blocks (e.g. PitWall). */
  showBlocks(title: string, blocks: ContentPanelBlock[]): void {
    this.titleEl.textContent = title;
    this.bodyEl.innerHTML = "";
    for (const block of blocks) {
      const section = document.createElement("section");
      section.style.marginBottom = "18px";

      const h = document.createElement("h3");
      h.textContent = block.heading;
      h.style.cssText = `
        font-family: var(--font-mono, monospace);
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--ink-dim, #a6a6b3);
        margin: 0 0 6px 0;
      `;
      section.appendChild(h);

      const p = document.createElement("p");
      p.textContent = block.body;
      p.style.margin = "0";
      section.appendChild(p);

      this.bodyEl.appendChild(section);
    }
    this.open();
  }

  private open(): void {
    this.visible = true;
    this.overlay.style.display = "flex";
  }

  hide(): void {
    if (!this.visible) return;
    this.visible = false;
    this.overlay.style.display = "none";
    const cb = this.onCloseCb;
    this.onCloseCb = null;
    cb?.();
  }

  destroy(): void {
    window.removeEventListener("keydown", this.keyHandler);
    this.overlay.remove();
  }
}
