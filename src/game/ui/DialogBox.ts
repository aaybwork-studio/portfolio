// DOM overlay dialog box. show(lines, onDone) displays one line at a time;
// E or click advances; hides on finish and calls onDone.

export class DialogBox {
  private root: HTMLElement;
  private panel: HTMLDivElement;
  private textEl: HTMLDivElement;
  private hintEl: HTMLDivElement;
  private lines: string[] = [];
  private index = 0;
  private onDone?: () => void;
  private visible = false;
  private keyHandler = (e: KeyboardEvent) => {
    if (!this.visible) return;
    if (e.key === "e" || e.key === "E") {
      e.preventDefault();
      this.advance();
    }
  };

  constructor(root: HTMLElement) {
    this.root = root;

    this.panel = document.createElement("div");
    this.panel.style.cssText = `
      position: fixed;
      left: 50%;
      bottom: 48px;
      transform: translateX(-50%);
      width: min(640px, 88vw);
      background: var(--bg-elev, #14141f);
      border: 1px solid var(--line, #2a2a3a);
      border-radius: var(--radius, 10px);
      padding: 20px 24px;
      color: var(--ink, #f5f5f7);
      font-family: var(--font-body, sans-serif);
      font-size: 1rem;
      line-height: 1.5;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      z-index: 50;
      display: none;
      cursor: pointer;
      pointer-events: auto;
    `;

    this.textEl = document.createElement("div");
    this.panel.appendChild(this.textEl);

    this.hintEl = document.createElement("div");
    this.hintEl.textContent = "Press E or click to continue";
    this.hintEl.style.cssText = `
      margin-top: 10px;
      font-family: var(--font-mono, monospace);
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--accent, #00e5ff);
      opacity: 0.8;
    `;
    this.panel.appendChild(this.hintEl);

    this.panel.addEventListener("click", () => this.advance());

    this.root.appendChild(this.panel);
    window.addEventListener("keydown", this.keyHandler);
  }

  show(lines: string[], onDone?: () => void): void {
    this.lines = lines;
    this.index = 0;
    this.onDone = onDone;
    this.visible = true;
    this.panel.style.display = "block";
    this.render();
  }

  private advance(): void {
    if (!this.visible) return;
    this.index += 1;
    if (this.index >= this.lines.length) {
      this.hide();
      this.onDone?.();
      return;
    }
    this.render();
  }

  private render(): void {
    this.textEl.textContent = this.lines[this.index] ?? "";
  }

  hide(): void {
    this.visible = false;
    this.panel.style.display = "none";
  }

  destroy(): void {
    window.removeEventListener("keydown", this.keyHandler);
    this.panel.remove();
  }
}
