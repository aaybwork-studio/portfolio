// Boot scene: preloads real sprite sheets (for any SPRITES entry with
// usePlaceholder=false) and registers their animations, namespaced by key
// (e.g. "player-idle", "aayush-run"). Entries still in placeholder mode are
// skipped here; their entities draw rectangles at runtime instead.

import Phaser from "phaser";
import { SCENES } from "../config/world";
import { SPRITES } from "../config/sprites";

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  preload(): void {
    for (const def of Object.values(SPRITES)) {
      if (def.usePlaceholder) continue;
      this.load.spritesheet(def.key, def.path, {
        frameWidth: def.frameWidth,
        frameHeight: def.frameHeight,
      });
    }
  }

  create(): void {
    for (const def of Object.values(SPRITES)) {
      if (def.usePlaceholder) continue;
      for (const a of def.anims) {
        const animKey = `${def.key}-${a.key}`;
        if (this.anims.exists(animKey)) continue;
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(def.key, { start: a.frames[0], end: a.frames[1] }),
          frameRate: a.frameRate,
          repeat: a.repeat,
        });
      }
    }

    this.scene.start(SCENES.hero);
  }
}
