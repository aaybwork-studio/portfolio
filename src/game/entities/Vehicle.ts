// Vehicle entity — the player IS the vehicle in a level (no knight on foot).
// Free 2D flight: no gravity, velocity set directly from input on both axes,
// with drag so it glides and eases to a stop. Built from config/vehicles.ts:
// a real sprite when usePlaceholder=false, else a rounded placeholder rect.

import Phaser from "phaser";
import { WORLD } from "../config/world";
import type { VehicleDef } from "../config/vehicles";
import { getVehicle } from "../config/vehicles";

type VehicleGameObject = (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite) & {
  body: Phaser.Physics.Arcade.Body;
};

/** Free-flight tunables. Slightly faster than the on-foot walk speed, with
 * drag so releasing input glides to a smooth stop rather than snapping. */
const VEHICLE_SPEED = WORLD.moveSpeed * 1.35;
const VEHICLE_DRAG = 900;
const VEHICLE_MAX_VELOCITY = VEHICLE_SPEED * 1.15;

/** Fallback def used only if a slug has no vehicle configured (shouldn't
 * happen for real checkpoint projects, but keeps this entity crash-proof). */
const FALLBACK_DEF: VehicleDef = {
  key: "veh-fallback",
  usePlaceholder: true,
  path: "",
  frameWidth: 40,
  frameHeight: 32,
  frames: 1,
  displayWidth: 48,
  displayHeight: 36,
  placeholderColor: 0x8b9dff,
  label: "Craft",
};

export class Vehicle {
  readonly scene: Phaser.Scene;
  readonly gameObject: VehicleGameObject;
  private readonly isPlaceholder: boolean;
  private readonly def: VehicleDef;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;
  private keyW: Phaser.Input.Keyboard.Key;
  private keyS: Phaser.Input.Keyboard.Key;
  private hasMoved = false;
  private onFirstMove?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number, projectSlug: string) {
    this.scene = scene;
    const def = getVehicle(projectSlug) ?? FALLBACK_DEF;
    this.def = def;
    this.isPlaceholder = def.usePlaceholder;

    if (def.usePlaceholder) {
      const rect = scene.add.rectangle(x, y, def.displayWidth, def.displayHeight, def.placeholderColor);
      // Rounded-rect look via stroke; Phaser rectangles don't support radius
      // directly, so a slightly inset stroke reads as a "capsule" craft.
      rect.setStrokeStyle(2, 0xffffff, 0.25);
      scene.physics.add.existing(rect);
      this.gameObject = rect as VehicleGameObject;
    } else {
      const sprite = scene.add.sprite(x, y, def.key);
      sprite.setDisplaySize(def.displayWidth, def.displayHeight);
      if (def.tint !== undefined) {
        sprite.setTint(def.tint);
      }
      scene.physics.add.existing(sprite);
      this.gameObject = sprite as VehicleGameObject;
    }

    const body = this.gameObject.body;
    body.setAllowGravity(false);
    body.setCollideWorldBounds(true);
    body.setDrag(VEHICLE_DRAG, VEHICLE_DRAG);
    body.setMaxVelocity(VEHICLE_MAX_VELOCITY, VEHICLE_MAX_VELOCITY);
    body.setSize(def.displayWidth, def.displayHeight);

    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard plugin not available");
    }
    this.cursors = keyboard.createCursorKeys();
    this.keyA = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyS = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
  }

  /** Register a one-shot callback fired the first time the vehicle moves. */
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
    const up = this.cursors.up?.isDown || this.keyW.isDown;
    const down = this.cursors.down?.isDown || this.keyS.isDown;
    const moving = left || right || up || down;

    let vx = 0;
    let vy = 0;
    if (left) vx -= VEHICLE_SPEED;
    if (right) vx += VEHICLE_SPEED;
    if (up) vy -= VEHICLE_SPEED;
    if (down) vy += VEHICLE_SPEED;

    // Normalize diagonal movement so it isn't faster than axis-aligned travel.
    if (vx !== 0 && vy !== 0) {
      const scale = Math.SQRT1_2;
      vx *= scale;
      vy *= scale;
    }

    body.setAccelerationX(0);
    body.setAccelerationY(0);
    if (vx !== 0 || vy !== 0) {
      body.setVelocity(vx, vy);
      if (!this.hasMoved) {
        this.hasMoved = true;
        this.onFirstMove?.();
      }
    }
    // else: leave existing velocity to decay via drag — no hard stop.

    if (!this.isPlaceholder) {
      const sprite = this.gameObject as Phaser.GameObjects.Sprite;
      if (left) {
        sprite.setFlipX(true);
      } else if (right) {
        sprite.setFlipX(false);
      }
      if (moving && def_hasRunAnim(this.def, sprite)) {
        sprite.anims.play(`${this.def.key}-run`, true);
      } else if (def_hasIdleAnim(this.def, sprite)) {
        sprite.anims.play(`${this.def.key}-idle`, true);
      }
    }
  }
}

/** Guard anim playback against vehicle sprites that never had run/idle anims
 * generated (many are single-frame stills) — avoids a Phaser console warning. */
function def_hasRunAnim(def: VehicleDef, sprite: Phaser.GameObjects.Sprite): boolean {
  return sprite.anims.animationManager.exists(`${def.key}-run`);
}
function def_hasIdleAnim(def: VehicleDef, sprite: Phaser.GameObjects.Sprite): boolean {
  return sprite.anims.animationManager.exists(`${def.key}-idle`);
}
