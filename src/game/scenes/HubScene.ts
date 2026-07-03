// Zone 1 — hub. Aayush NPC with dialog + résumé grant, portals to each
// project level plus a PitWall highlight portal.

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

const KURA_DIALOG = [
  "Hey, I'm Aayush. Interaction and UX designer.",
  "Everything past here is something I built. Walk through whichever one you like.",
  "Here, take my resume. You'll want it.",
];

interface Portal {
  x: number;
  target: NavTarget;
  label: string;
  color: number;
  rect: Phaser.GameObjects.Rectangle;
}

export class HubScene extends Phaser.Scene {
  private player!: Player;
  private aayush!: KuraNPC;
  private dialogBox!: DialogBox;
  private contentPanel!: ContentPanel;
  private portals: Portal[] = [];
  private hasTalkedToAayush = false;
  private domRoot!: HTMLElement;
  private prompt!: HTMLElement;
  private promptUnsub: (() => void) | null = null;
  private promptTarget: { x: number; y: number } | null = null;

  constructor() {
    super(SCENES.hub);
  }

  create(): void {
    const biome = BIOMES.hub;
    const w = WORLD.hubWidth;
    const h = WORLD.height;

    this.cameras.main.setBackgroundColor(biome.palette.bg);

    for (const layer of biome.layers) {
      const rect = this.add.rectangle(0, 0, w, h, layer.color);
      rect.setOrigin(0, 0);
      rect.setScrollFactor(layer.scrollFactor);
      if (layer.id === "ground") {
        rect.setPosition(0, h - WORLD.groundHeight);
        rect.setSize(w, WORLD.groundHeight);
      }
    }

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

    // Player spawn.
    this.player = new Player(this, 60, groundY - 40);
    this.physics.add.collider(this.player.gameObject, ground);

    // Portals: three project levels + pitwall, spaced across remaining hub width.
    const portalDefs: { target: NavTarget; label: string }[] = [
      ...checkpointProjects.map((p) => ({ target: p.slug as NavTarget, label: p.title })),
      { target: "pitwall", label: pitwallProject.title },
    ];

    const startX = w * 0.42;
    const spacing = (w * 0.92 - startX) / Math.max(1, portalDefs.length - 1);

    portalDefs.forEach((def, i) => {
      const biomeKey = def.target === "pitwall" ? "pitwall" : def.target;
      const accent = BIOMES[biomeKey as keyof typeof BIOMES].palette.accent;
      const x = startX + spacing * i;
      const rect = this.add.rectangle(x, groundY - 50, 40, 100, accent, 0.85);
      rect.setStrokeStyle(2, accent);
      this.physics.add.existing(rect, true);

      this.add
        .text(x, groundY - 108, def.label, {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#f5f5f7",
        })
        .setOrigin(0.5);

      this.portals.push({ x, target: def.target, label: def.label, color: accent, rect });
    });

    this.cameras.main.setBounds(0, 0, w, h);
    this.physics.world.setBounds(0, 0, w, h);
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
    // Aayush NPC interaction.
    const distToAayush = Math.abs(this.player.x - this.aayush.x);
    if (distToAayush <= WORLD.interactRadius && !this.hasTalkedToAayush) {
      this.hasTalkedToAayush = true;
      this.dialogBox.show(KURA_DIALOG, () => {
        EventBus.emit(EVENTS.resumeCollected);
      });
      return;
    }

    // Portal interaction.
    for (const portal of this.portals) {
      const dist = Math.abs(this.player.x - portal.x);
      if (dist <= WORLD.interactRadius) {
        this.activatePortal(portal);
        return;
      }
    }
  }

  private activatePortal(portal: Portal): void {
    if (portal.target === "pitwall") {
      this.contentPanel.showBlocks(
        pitwallProject.title,
        pitwallProject.blocks.map((b) => ({ heading: b.heading, body: b.body })),
      );
      return;
    }
    this.scene.start(SCENES.level, { slug: portal.target });
  }

  update(): void {
    this.player.update();
    this.updateInteractPrompt();
  }

  private updateInteractPrompt(): void {
    const candidates: { x: number; y: number }[] = [
      { x: this.aayush.x, y: this.aayush.y },
      ...this.portals.map((p) => ({ x: p.x, y: p.rect.y })),
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
