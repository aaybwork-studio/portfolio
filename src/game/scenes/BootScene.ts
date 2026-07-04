// Boot scene: preloads real sprite sheets (for any SPRITES entry with
// usePlaceholder=false) and registers their animations, namespaced by key
// (e.g. "player-idle", "aayush-run"). Entries still in placeholder mode are
// skipped here; their entities draw rectangles at runtime instead.

import Phaser from "phaser";
import { SCENES } from "../config/world";
import { SPRITES } from "../config/sprites";
import { BIOMES } from "../config/biomes";

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

    // Real parallax background layers, deduped by path (layer id doubles as
    // the stable texture key). Placeholder layers stay as colored rects.
    const loadedPaths = new Set<string>();
    let tilesetLoaded = false;
    for (const biome of Object.values(BIOMES)) {
      for (const layer of biome.layers) {
        if (layer.usePlaceholder || !layer.path) continue;
        if (loadedPaths.has(layer.path)) continue;
        loadedPaths.add(layer.path);
        this.load.image(layer.id, layer.path);
      }
      if (biome.groundTileset && !tilesetLoaded) {
        tilesetLoaded = true;
        this.load.spritesheet("warped-tiles", biome.groundTileset.path, {
          frameWidth: biome.groundTileset.tileSize,
          frameHeight: biome.groundTileset.tileSize,
        });
      }
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

    this.scene.start(SCENES.title);
  }
}
