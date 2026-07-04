// Player entity. Renders the real animated sprite when SPRITES.player has
// usePlaceholder=false; falls back to a colored rectangle otherwise. Moves
// with arcade physics per WORLD tunables in both modes.

import Phaser from "phaser";
import { WORLD } from "../config/world";
import { SPRITES } from "../config/sprites";

type PlayerGameObject = (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite) & {
  body: Phaser.Physics.Arcade.Body;
};

export class Player {
  readonly scene: Phaser.Scene;
  readonly gameObject: PlayerGameObject;
  private readonly isPlaceholder: boolean;
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
    this.isPlaceholder = def.usePlaceholder;

    if (def.usePlaceholder) {
      const rect = scene.add.rectangle(x, y, def.displayWidth, def.displayHeight, def.placeholderColor);
      scene.physics.add.existing(rect);
      this.gameObject = rect as PlayerGameObject;
      this.gameObject.body.setCollideWorldBounds(false);
      this.gameObject.body.setSize(def.displayWidth, def.displayHeight);
    } else {
      const sprite = scene.add.sprite(x, y, def.key);
      sprite.setDisplaySize(def.displayWidth, def.displayHeight);
      scene.physics.add.existing(sprite);
      this.gameObject = sprite as PlayerGameObject;
      this.gameObject.body.setCollideWorldBounds(false);

      // setSize/setOffset are in the sprite's SOURCE-FRAME space, so size the
      // body from frameWidth/frameHeight (not display size). A tight body
      // anchored to the character's feet.
      const bodyWidth = def.frameWidth * 0.6;
      const bodyHeight = def.frameHeight * 0.9;
      this.gameObject.body.setSize(bodyWidth, bodyHeight);
      this.gameObject.body.setOffset(
        (def.frameWidth - bodyWidth) / 2,
        def.frameHeight - bodyHeight,
      );

      sprite.anims.play(`${def.key}-idle`, true);
    }

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
    const moving = left || right;

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

    if (!this.isPlaceholder) {
      const sprite = this.gameObject as Phaser.GameObjects.Sprite;
      const def = SPRITES.player;

      if (left) {
        sprite.setFlipX(true);
      } else if (right) {
        sprite.setFlipX(false);
      }

      let animKey: string;
      if (!onFloor) {
        animKey = body.velocity.y < 0 ? `${def.key}-jump` : `${def.key}-fall`;
      } else if (moving) {
        animKey = `${def.key}-run`;
      } else {
        animKey = `${def.key}-idle`;
      }
      sprite.anims.play(animKey, true);
    }
  }
}
