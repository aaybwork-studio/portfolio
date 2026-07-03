// Aayush — the findable NPC / level guide. Renders the real animated sprite
// (tinted) when SPRITES.aayush has usePlaceholder=false; falls back to a
// colored rectangle otherwise. Floating name label, static until talked to;
// in levels he walks ahead to the next checkpoint via walkTo().

import Phaser from "phaser";
import { SPRITES } from "../config/sprites";
import { WorldOverlay, makeBubble } from "../ui/WorldOverlay";

type NPCGameObject = (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite) & {
  body: Phaser.Physics.Arcade.Body;
};

export class KuraNPC {
  readonly scene: Phaser.Scene;
  readonly gameObject: NPCGameObject;
  private readonly isPlaceholder: boolean;
  private label: Phaser.GameObjects.Text;
  private bubbleUnsub?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    const def = SPRITES.aayush;
    this.isPlaceholder = def.usePlaceholder;

    if (def.usePlaceholder) {
      const rect = scene.add.rectangle(x, y, def.displayWidth, def.displayHeight, def.placeholderColor);
      scene.physics.add.existing(rect, true); // static body by default
      this.gameObject = rect as NPCGameObject;
    } else {
      const sprite = scene.add.sprite(x, y, def.key);
      sprite.setDisplaySize(def.displayWidth, def.displayHeight);
      if (def.tint !== undefined) {
        sprite.setTint(def.tint);
      }
      scene.physics.add.existing(sprite, true); // static body by default
      this.gameObject = sprite as NPCGameObject;
      sprite.anims.play(`${def.key}-idle`, true);
    }

    this.label = scene.add.text(x, y - def.displayHeight, "Aayush", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#ffd166",
    });
    this.label.setOrigin(0.5, 1);
  }

  get x(): number {
    return this.gameObject.x;
  }

  get y(): number {
    return this.gameObject.y;
  }

  get displayHeight(): number {
    return this.gameObject.displayHeight;
  }

  /** Show a speech bubble above Aayush. `more` = hint line, e.g. "Press E to read more". */
  say(text: string, name = "Aayush", more?: string) {
    this.clearSay();
    const el = makeBubble(text, name, more);
    const offset = (this.displayHeight ?? 48) * 0.7;
    this.bubbleUnsub = WorldOverlay.track(el, () => ({ x: this.x, y: this.y }), offset);
  }

  clearSay() {
    this.bubbleUnsub?.();
    this.bubbleUnsub = undefined;
  }

  /** Tween-walk horizontally to x, calling onArrive when done. */
  walkTo(x: number, onArrive?: () => void): void {
    const def = SPRITES.aayush;
    const distance = Math.abs(x - this.gameObject.x);
    const speed = 120; // px/sec, guide pace
    const duration = Math.max(200, (distance / speed) * 1000);

    if (!this.isPlaceholder) {
      const sprite = this.gameObject as Phaser.GameObjects.Sprite;
      sprite.setFlipX(x < this.gameObject.x);
      sprite.anims.play(`${def.key}-run`, true);
    }

    this.scene.tweens.add({
      targets: [this.gameObject, this.label],
      x,
      duration,
      ease: "Linear",
      onComplete: () => {
        if (!this.isPlaceholder) {
          const sprite = this.gameObject as Phaser.GameObjects.Sprite;
          sprite.anims.play(`${def.key}-idle`, true);
        }
        onArrive?.();
      },
    });
  }

  destroy(): void {
    this.clearSay();
    this.gameObject.destroy();
    this.label.destroy();
  }
}
