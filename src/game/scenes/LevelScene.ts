// Zone 2 — generic checkpoint level, reused per project. Receives { slug }.
// No fail states: movement + interaction only.

import Phaser from "phaser";
import { WORLD, SCENES, EVENTS } from "../config/world";
import { BIOMES } from "../config/biomes";
import { Player } from "../entities/Player";
import { KuraNPC } from "../entities/KuraNPC";
import { ContentPanel } from "../ui/ContentPanel";
import { WorldOverlay, makePrompt } from "../ui/WorldOverlay";
import { EventBus } from "../EventBus";
import { getProject, isCheckpointProject } from "../../content";
import type { CheckpointProject } from "../../content";

const firstSentence = (s: string) => (s.match(/^.*?[.!?](\s|$)/)?.[0] ?? s).trim();

interface CheckpointMarker {
  x: number;
  y: number;
  title: string;
  body: string;
  rect: Phaser.GameObjects.Rectangle;
  opened: boolean;
}

interface LevelInitData {
  slug: string;
}

export class LevelScene extends Phaser.Scene {
  private player!: Player;
  private aayush!: KuraNPC;
  private contentPanel!: ContentPanel;
  private checkpoints: CheckpointMarker[] = [];
  private exitPortal!: Phaser.GameObjects.Rectangle;
  private exitX = 0;
  private project?: CheckpointProject;
  private guideIndex = 0;
  private prompt!: HTMLElement;
  private promptUnsub: (() => void) | null = null;
  private promptCp: CheckpointMarker | null = null;

  constructor() {
    super(SCENES.level);
  }

  init(data: LevelInitData): void {
    const project = getProject(data.slug);
    this.project = project && isCheckpointProject(project) ? project : undefined;
  }

  create(): void {
    const project = this.project;
    if (!project) {
      // Unknown/invalid slug: bounce back to hub rather than crash.
      this.scene.start(SCENES.hub);
      return;
    }

    const biome = BIOMES[project.biome];
    const w = WORLD.levelWidth;
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

    this.contentPanel = new ContentPanel(document.body);

    const groundY = h - WORLD.groundHeight;

    // Checkpoints, evenly spaced.
    const count = project.checkpoints.length;
    const margin = 160;
    const usableWidth = w - margin * 2 - 120; // leave room before exit portal
    const spacing = count > 1 ? usableWidth / (count - 1) : 0;

    project.checkpoints.forEach((cp, i) => {
      const x = margin + spacing * i;
      const rect = this.add.rectangle(x, groundY - 40, 16, 80, biome.palette.accent);
      rect.setStrokeStyle(2, biome.palette.accent);
      this.physics.add.existing(rect, true);

      this.add
        .text(x, groundY - 92, cp.title, {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#f5f5f7",
          align: "center",
          wordWrap: { width: 140 },
        })
        .setOrigin(0.5);

      this.checkpoints.push({ x, y: groundY - 40, title: cp.title, body: cp.body, rect, opened: false });
    });

    // Exit portal at far right.
    this.exitX = w - 80;
    this.exitPortal = this.add.rectangle(this.exitX, groundY - 50, 44, 100, biome.palette.ink, 0.85);
    this.exitPortal.setStrokeStyle(2, biome.palette.ink);
    this.physics.add.existing(this.exitPortal, true);
    this.add
      .text(this.exitX, groundY - 108, "Exit", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#f5f5f7",
      })
      .setOrigin(0.5);

    // Player + guide.
    this.player = new Player(this, 60, groundY - 40);
    this.physics.add.collider(this.player.gameObject, ground);

    this.aayush = new KuraNPC(this, this.checkpoints[0]?.x ?? 200, groundY - 24);
    this.guideIndex = 0;

    this.cameras.main.setBounds(0, 0, w, h);
    this.physics.world.setBounds(0, 0, w, h);
    this.cameras.main.startFollow(this.player.gameObject, true, 0.1, 0.1);

    WorldOverlay.setCamera(this.cameras.main);
    this.prompt = makePrompt("E");
    this.events.once("shutdown", () => {
      this.promptUnsub?.();
      this.promptUnsub = null;
      WorldOverlay.clear();
    });

    this.input.keyboard?.on("keydown-E", () => this.handleInteract());

    EventBus.emit(EVENTS.zoneChanged, { zone: project.title });
  }

  private handleInteract(): void {
    if (!this.project) return;

    for (const cp of this.checkpoints) {
      const dist = Math.abs(this.player.x - cp.x);
      if (dist <= WORLD.interactRadius) {
        this.contentPanel.show({ title: cp.title, body: cp.body });
        if (!cp.opened) {
          cp.opened = true;
          this.advanceGuide();
        }
        return;
      }
    }

    const distToExit = Math.abs(this.player.x - this.exitX);
    if (distToExit <= WORLD.interactRadius) {
      this.scene.start(SCENES.hub);
    }
  }

  private advanceGuide(): void {
    this.guideIndex += 1;
    const next = this.checkpoints[this.guideIndex] ?? { x: this.exitX };
    this.aayush.walkTo(next.x);
  }

  update(): void {
    this.player.update();
    this.updateCheckpointPrompt();
  }

  private updateCheckpointPrompt(): void {
    let nearest: CheckpointMarker | null = null;
    let nearestDist = Infinity;
    for (const cp of this.checkpoints) {
      const dist = Math.abs(this.player.x - cp.x);
      if (dist <= WORLD.interactRadius && dist < nearestDist) {
        nearest = cp;
        nearestDist = dist;
      }
    }

    if (nearest) {
      if (nearest !== this.promptCp) {
        this.promptUnsub?.();
        this.promptCp = nearest;
        this.promptUnsub = WorldOverlay.track(this.prompt, () => ({ x: this.promptCp!.x, y: this.promptCp!.y }), 44);
        this.aayush.say(firstSentence(nearest.body), "Aayush");
      }
    } else if (this.promptCp) {
      this.promptUnsub?.();
      this.promptUnsub = null;
      this.promptCp = null;
      this.aayush.clearSay();
    }
  }
}
