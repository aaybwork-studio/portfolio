// Boot scene: in placeholder mode there's nothing to preload (entities draw
// their own rectangles at runtime), so this just hands off to HeroScene.
// If a sprite ever flips usePlaceholder=false, texture/anim setup goes here.

import Phaser from "phaser";
import { SCENES } from "../config/world";

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  create(): void {
    // Placeholder-only mode: no textures to generate, no anims to register.
    // (SPRITES.player / SPRITES.aayush both have usePlaceholder = true.)
    this.scene.start(SCENES.hero);
  }
}
