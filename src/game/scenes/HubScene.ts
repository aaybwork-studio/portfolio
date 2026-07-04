// Zone 1 — hub. Aayush NPC with dialog + résumé grant, boardable themed
// vehicles (parked) that launch into each project level plus a PitWall
// highlight vehicle.

import Phaser from "phaser";
import { WORLD, SCENES, EVENTS } from "../config/world";
import type { NavTarget } from "../config/world";
import { BIOMES } from "../config/biomes";
import { Player } from "../entities/Player";
import { KuraNPC } from "../entities/KuraNPC";
import { DialogBox } from "../ui/DialogBox";
import { ContentPanel } from "../ui/ContentPanel";
import { WorldOverlay, makePrompt } from "../ui/WorldOverlay";
import { EventBus } from "../EventBus";
import { checkpointProjects, pitwallProject } from "../../content";
import { createBackground } from "../systems/Background";
import type { Background } from "../systems/Background";
import { getVehicle } from "../config/vehicles";

const KURA_DIALOG = [
  "Hey, I'm Aayush. Interaction and UX designer.",
  "Everything past here is something I built. Walk through whichever one you like.",
  "Here, take my resume. You'll want it.",
];

type VehicleGameObject = Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;

interface HubVehicle {
  x: number;
  y: number;
  target: NavTarget;
  label: string;
  color: number;
  obj: VehicleGameObject;
}

export class HubScene extends Phaser.Scene {
  private player!: Player;
  private aayush!: KuraNPC;
  private dialogBox!: DialogBox;
  private contentPanel!: ContentPanel;
  private vehicles: HubVehicle[] = [];
  private hasTalkedToAayush = false;
  private domRoot!: HTMLElement;
  private prompt!: HTMLElement;
  private promptUnsub: (() => void) | null = null;
  private promptTarget: { x: number; y: number } | null = null;
  private bg!: Background;
  /** Guards against an instant bounce back to Title on arrival — only armed
   * once the player has moved away from the left edge at least once. */
  private leftReturnArmed = false;
  /** True while the board+launch sequence is playing — blocks re-trigger and input. */
  private launching = false;

  constructor() {
    super(SCENES.hub);
  }

  create(): void {
    const biome = BIOMES.hub;
    const w = WORLD.hubWidth;
    const h = WORLD.height;

    this.cameras.main.setBackgroundColor(biome.palette.bg);

    this.bg = createBackground(this, "hub", { sceneWidth: w });

    const ground = this.add.rectangle(0, h - WORLD.groundHeight, w, WORLD.groundHeight, biome.palette.ground);
    ground.setOrigin(0, 0);
    this.physics.add.existing(ground, true);

    // DOM overlays (dialog + content panel) mounted into the game container.
    this.domRoot = document.body;
    this.dialogBox = new DialogBox(this.domRoot);
    this.contentPanel = new ContentPanel(this.domRoot);

    // Aayush NPC, mid-hub.
    const groundY = h - WORLD.groundHeight;
    this.aayush = new KuraNPC(this, w * 0.22, groundY - 24);

    // Player spawn — offset well past the left-edge-return threshold so
    // arriving from Title doesn't immediately trigger the return trip.
    this.player = new Player(this, 120, groundY - 40);
    this.physics.add.collider(this.player.gameObject, ground);
    this.leftReturnArmed = false;

    // Parked vehicles: three project levels + pitwall, spaced across remaining
    // hub width. Each is boardable — E launches into that project's level.
    const vehicleDefs: { target: NavTarget; label: string }[] = [
      ...checkpointProjects.map((p) => ({ target: p.slug as NavTarget, label: p.title })),
      { target: "pitwall", label: pitwallProject.title },
    ];

    const startX = w * 0.42;
    const spacing = (w * 0.92 - startX) / Math.max(1, vehicleDefs.length - 1);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    vehicleDefs.forEach((def, i) => {
      const biomeKey = def.target === "pitwall" ? "pitwall" : def.target;
      const accent = BIOMES[biomeKey as keyof typeof BIOMES].palette.accent;
      const x = startX + spacing * i;
      const vehicleDef = getVehicle(def.target);

      let obj: VehicleGameObject;
      const vy = groundY - 50;
      if (vehicleDef && !vehicleDef.usePlaceholder) {
        const sprite = this.add.sprite(x, vy, vehicleDef.key);
        sprite.setDisplaySize(vehicleDef.displayWidth, vehicleDef.displayHeight);
        if (vehicleDef.tint !== undefined) sprite.setTint(vehicleDef.tint);
        obj = sprite;
      } else {
        const w2 = vehicleDef?.displayWidth ?? 56;
        const h2 = vehicleDef?.displayHeight ?? 44;
        const color = vehicleDef?.placeholderColor ?? accent;
        const rect = this.add.rectangle(x, vy, w2, h2, color, 0.9);
        rect.setStrokeStyle(2, accent);
        obj = rect;
      }

      this.add
        .text(x, vy - (obj.displayHeight / 2 + 14), vehicleDef?.label ?? def.label, {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#f5f5f7",
        })
        .setOrigin(0.5);

      if (!reduceMotion) {
        this.tweens.add({
          targets: obj,
          y: vy - 6,
          duration: 1400 + i * 120,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      }

      this.vehicles.push({ x, y: vy, target: def.target, label: vehicleDef?.label ?? def.label, color: accent, obj });
    });

    this.cameras.main.setBounds(0, 0, w, h);
    this.physics.world.setBounds(0, 0, w, h);
    this.cameras.main.setZoom(1.6);
    this.cameras.main.startFollow(this.player.gameObject, true, 0.1, 0.1);

    this.input.keyboard?.on("keydown-E", () => this.handleInteract());

    WorldOverlay.setCamera(this.cameras.main);
    this.prompt = makePrompt("E");
    this.events.once("shutdown", () => {
      this.promptUnsub?.();
      this.promptUnsub = null;
      WorldOverlay.clear();
    });

    EventBus.emit(EVENTS.zoneChanged, { zone: "Hub" });
  }

  private handleInteract(): void {
    if (this.launching) return;

    // Aayush NPC interaction.
    const distToAayush = Math.abs(this.player.x - this.aayush.x);
    if (distToAayush <= WORLD.interactRadius && !this.hasTalkedToAayush) {
      this.hasTalkedToAayush = true;
      this.dialogBox.show(KURA_DIALOG, () => {
        EventBus.emit(EVENTS.resumeCollected);
      });
      return;
    }

    // Vehicle interaction — board + launch.
    for (const vehicle of this.vehicles) {
      const dist = Math.abs(this.player.x - vehicle.x);
      if (dist <= WORLD.interactRadius) {
        this.boardVehicle(vehicle);
        return;
      }
    }
  }

  private boardVehicle(vehicle: HubVehicle): void {
    if (vehicle.target === "pitwall") {
      // Pitwall is a highlight — board the car but route to its content panel,
      // matching the previous pitwall-portal behavior exactly.
      this.contentPanel.showBlocks(
        pitwallProject.title,
        pitwallProject.blocks.map((b) => ({ heading: b.heading, body: b.body })),
      );
      return;
    }
    this.launchVehicle(vehicle);
  }

  /** Board + short launch animation, then transition to the project level. */
  private launchVehicle(vehicle: HubVehicle): void {
    if (this.launching) return;
    this.launching = true;

    this.promptUnsub?.();
    this.promptUnsub = null;
    this.promptTarget = null;

    // Attach the player onto the vehicle.
    const body = this.player.gameObject.body;
    body.setVelocity(0, 0);
    body.setAllowGravity(false);
    this.player.gameObject.setPosition(vehicle.x, vehicle.y);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduceMotion ? 1 : 700;

    // Themed launch direction: rocket goes up-and-out, everything else
    // speeds off sideways (in the direction the player is facing/moved).
    const goesUp = vehicle.target === "orbit";
    const dx = goesUp ? 0 : 400;
    const dy = goesUp ? -420 : -20;

    this.cameras.main.pan(vehicle.x + dx * 0.3, vehicle.y, duration, "Sine.easeIn");

    this.tweens.add({
      targets: [vehicle.obj, this.player.gameObject],
      x: `+=${dx}`,
      y: `+=${dy}`,
      scale: goesUp ? 0.4 : 0.8,
      alpha: 0.85,
      duration,
      ease: "Cubic.easeIn",
      onComplete: () => {
        this.scene.start(SCENES.level, { slug: vehicle.target });
      },
    });
  }

  update(): void {
    if (this.launching) return;
    this.player.update();
    this.bg.update(this.cameras.main);
    this.updateInteractPrompt();
    this.updateLeftEdgeReturn();
  }

  private updateLeftEdgeReturn(): void {
    const LEFT_EDGE_THRESHOLD = 40;

    // Arm the return only once the player has moved right, clear of the
    // threshold — prevents an instant bounce back to Title on arrival.
    if (!this.leftReturnArmed && this.player.x >= LEFT_EDGE_THRESHOLD + 20) {
      this.leftReturnArmed = true;
    }

    if (this.leftReturnArmed && this.player.x < LEFT_EDGE_THRESHOLD) {
      const body = this.player.gameObject.body;
      if (body.velocity.x < 0) {
        this.scene.start(SCENES.title);
      }
    }
  }

  private updateInteractPrompt(): void {
    const candidates: { x: number; y: number }[] = [
      { x: this.aayush.x, y: this.aayush.y },
      ...this.vehicles.map((v) => ({ x: v.x, y: v.y })),
    ];

    let nearest: { x: number; y: number } | null = null;
    let nearestDist = Infinity;
    for (const c of candidates) {
      const dist = Math.abs(this.player.x - c.x);
      if (dist <= WORLD.interactRadius && dist < nearestDist) {
        nearest = c;
        nearestDist = dist;
      }
    }

    if (nearest) {
      if (nearest !== this.promptTarget) {
        this.promptUnsub?.();
        this.promptTarget = nearest;
        this.promptUnsub = WorldOverlay.track(this.prompt, () => this.promptTarget!, 44);
      }
    } else if (this.promptTarget) {
      this.promptUnsub?.();
      this.promptUnsub = null;
      this.promptTarget = null;
    }
  }
}
