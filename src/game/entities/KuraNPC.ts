// Aayush — the findable NPC / level guide. Placeholder rectangle from
// SPRITES.aayush, with a floating name label. Static until talked to; in
// levels he walks ahead to the next checkpoint via walkTo().

import Phaser from "phaser";
import { SPRITES } from "../config/sprites";

export class KuraNPC {
  readonly scene: Phaser.Scene;
  readonly gameObject: Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
  private label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    const def = SPRITES.aayush;

    const rect = scene.add.rectangle(x, y, def.displayWidth, def.displayHeight, def.placeholderColor);
    scene.physics.add.existing(rect, true); // static body by default
    this.gameObject = rect as Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };

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

  /** Tween-walk horizontally to x, calling onArrive when done. */
  walkTo(x: number, onArrive?: () => void): void {
    const distance = Math.abs(x - this.gameObject.x);
    const speed = 120; // px/sec, guide pace
    const duration = Math.max(200, (distance / speed) * 1000);

    this.scene.tweens.add({
      targets: [this.gameObject, this.label],
      x,
      duration,
      ease: "Linear",
      onComplete: () => onArrive?.(),
    });
  }

  destroy(): void {
    this.gameObject.destroy();
    this.label.destroy();
  }
}
