// Placeholder-rendered player entity. Draws a colored rectangle sized from
// SPRITES.player and moves it with arcade physics per WORLD tunables.

import Phaser from "phaser";
import { WORLD } from "../config/world";
import { SPRITES } from "../config/sprites";

export class Player {
  readonly scene: Phaser.Scene;
  readonly gameObject: Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;
  private keyW: Phaser.Input.Keyboard.Key;
  private keySpace: Phaser.Input.Keyboard.Key;
  private hasMoved = false;
  private onFirstMove?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    const def = SPRITES.player;

    const rect = scene.add.rectangle(x, y, def.displayWidth, def.displayHeight, def.placeholderColor);
    scene.physics.add.existing(rect);
    this.gameObject = rect as Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
    this.gameObject.body.setCollideWorldBounds(false);
    this.gameObject.body.setSize(def.displayWidth, def.displayHeight);

    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard plugin not available");
    }
    this.cursors = keyboard.createCursorKeys();
    this.keyA = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keySpace = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  /** Register a one-shot callback fired the first time the player moves horizontally. */
  setOnFirstMove(cb: () => void): void {
    this.onFirstMove = cb;
  }

  get x(): number {
    return this.gameObject.x;
  }

  get y(): number {
    return this.gameObject.y;
  }

  update(): void {
    const body = this.gameObject.body;
    const left = this.cursors.left?.isDown || this.keyA.isDown;
    const right = this.cursors.right?.isDown || this.keyD.isDown;
    const jumpPressed = this.cursors.up?.isDown || this.keyW.isDown || this.keySpace.isDown;

    if (left) {
      body.setVelocityX(-WORLD.moveSpeed);
      if (!this.hasMoved) {
        this.hasMoved = true;
        this.onFirstMove?.();
      }
    } else if (right) {
      body.setVelocityX(WORLD.moveSpeed);
      if (!this.hasMoved) {
        this.hasMoved = true;
        this.onFirstMove?.();
      }
    } else {
      body.setVelocityX(0);
    }

    const onFloor = body.blocked.down || body.touching.down;
    if (jumpPressed && onFloor) {
      body.setVelocityY(-WORLD.jumpVelocity);
    }
  }
}
