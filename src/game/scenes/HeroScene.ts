// Zone 0 — single screen hero/landing. Parallax biome layers, floating name
// text, ground platform, player spawn. Walking to the right edge -> HubScene.

import Phaser from "phaser";
import { WORLD, SCENES, EVENTS } from "../config/world";
import { BIOMES } from "../config/biomes";
import { Player } from "../entities/Player";
import { EventBus } from "../EventBus";
import { createBackground } from "../systems/Background";
import type { Background } from "../systems/Background";

export class HeroScene extends Phaser.Scene {
  private player!: Player;
  private ground!: Phaser.GameObjects.Rectangle;
  private bg!: Background;

  constructor() {
    super(SCENES.hero);
  }

  create(): void {
    const biome = BIOMES.hero;
    const w = WORLD.heroWidth;
    const h = WORLD.height;

    this.cameras.main.setBackgroundColor(biome.palette.bg);

    // Parallax layers back-to-front (real art where the biome has it,
    // colored-rect fallback otherwise — see systems/Background.ts).
    this.bg = createBackground(this, "hero", { sceneWidth: w, placeholderWidthMultiplier: 1.5 });

    // Physical ground platform (static body) matching the visual ground band.
    this.ground = this.add.rectangle(0, h - WORLD.groundHeight, w, WORLD.groundHeight, biome.palette.ground);
    this.ground.setOrigin(0, 0);
    this.physics.add.existing(this.ground, true);

    // Floating hero text.
    const centerX = w / 2;
    this.add
      .text(centerX, h * 0.28, "Aayush Bhandari", {
        fontFamily: "monospace",
        fontSize: "28px",
        color: "#f5f5f7",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.add
      .text(centerX, h * 0.28 + 40, "Interaction & UX Designer", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#00e5ff",
      })
      .setOrigin(0.5);
    this.add
      .text(centerX, h * 0.28 + 70, "I make simple, clear, immersive digital experiences.", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#a6a6b3",
      })
      .setOrigin(0.5);

    // Player spawn.
    this.player = new Player(this, 80, h - WORLD.groundHeight - 40);
    this.physics.add.collider(this.player.gameObject, this.ground);
    this.player.setOnFirstMove(() => {
      // HUD fades its own hint on a timer; nothing else required here.
    });

    this.cameras.main.setBounds(0, 0, w, h);
    this.physics.world.setBounds(0, 0, w, h);
    this.cameras.main.startFollow(this.player.gameObject, true, 0.1, 0.1);

    EventBus.emit(EVENTS.zoneChanged, { zone: "Hero" });
    EventBus.emit(EVENTS.showHint);
  }

  update(): void {
    this.player.update();
    this.bg.update(this.cameras.main);

    if (this.player.x > WORLD.heroWidth - 20) {
      this.scene.start(SCENES.hub);
    }
  }
}
