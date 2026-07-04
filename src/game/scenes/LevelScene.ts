// Zone 2 — generic checkpoint level, reused per project. Receives { slug }.
// No fail states: movement + interaction only. Ground spans the full level
// width so a fall is always safe — there are no pits.

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
import { createBackground } from "../systems/Background";
import type { Background } from "../systems/Background";
import { getLevelLayout, PLATFORM_VISUAL } from "../config/levelLayouts";
import type { CheckpointPosition } from "../config/levelLayouts";

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

/** How close (px) to the left edge counts as "at the edge" for the back-nav trigger. */
const LEFT_EDGE_TRIGGER = 40;
/** How close (px) to the left edge shows the "← Hub" hint. */
const LEFT_EDGE_HINT_RADIUS = 160;

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
  private bg!: Background;

  // Guide "follow me" arrow, pointing toward Aayush's current target.
  private guideArrow!: HTMLElement;
  private guideArrowUnsub: (() => void) | null = null;

  // Left-edge "back to hub" hint.
  private leftHint!: HTMLElement;
  private leftHintUnsub: (() => void) | null = null;
  private leftHintShown = false;

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

    this.bg = createBackground(this, project.biome, { sceneWidth: w });

    const groundY = h - WORLD.groundHeight;

    // Collision body unchanged — plain rect matching the ground band. Spans
    // the full level width: falling is always safe, there is no pit.
    const ground = this.add.rectangle(0, groundY, w, WORLD.groundHeight, biome.palette.ground);
    ground.setOrigin(0, 0);
    this.physics.add.existing(ground, true);
    // Visual ground: colored rect for placeholder biomes (kept as-is), or a
    // tiled strip of the biome's ground tileset frame layered on top when
    // present. Physics body above stays authoritative either way.
    if (!biome.groundTileset) {
      ground.setFillStyle(biome.palette.ground);
    } else {
      ground.setVisible(false);
      const { tileSize, groundIndex } = biome.groundTileset;
      const groundSprite = this.add.tileSprite(
        0,
        groundY,
        w,
        WORLD.groundHeight,
        "warped-tiles",
        groundIndex,
      );
      groundSprite.setOrigin(0, 0);
      groundSprite.setTileScale(WORLD.groundHeight / tileSize, WORLD.groundHeight / tileSize);
      groundSprite.setDepth(-500);
    }

    this.contentPanel = new ContentPanel(document.body);

    // Non-linear layout: static platforms (simple colored rects, real tiles
    // later) + per-checkpoint {x,y} positions, some elevated.
    const layout = getLevelLayout(project.slug, groundY);
    const platformGroup = this.physics.add.staticGroup();
    for (const p of layout.platforms) {
      const platRect = this.add.rectangle(p.x, p.y, p.width, PLATFORM_VISUAL.height, PLATFORM_VISUAL.color);
      platRect.setStrokeStyle(2, PLATFORM_VISUAL.strokeColor);
      platformGroup.add(platRect);
      // staticGroup().add() doesn't refresh the body from the rect's current
      // size/position automatically for plain GameObjects — do it explicitly.
      const body = platRect.body as Phaser.Physics.Arcade.StaticBody;
      body.setSize(p.width, PLATFORM_VISUAL.height);
      body.updateFromGameObject();
    }

    // Checkpoint positions come from the layout, cycling if the project has
    // more/fewer checkpoints than the layout provides.
    const positions: CheckpointPosition[] = layout.checkpoints;

    project.checkpoints.forEach((cp, i) => {
      const pos = positions[i % positions.length];
      const rect = this.add.rectangle(pos.x, pos.y, 16, 80, biome.palette.accent);
      rect.setStrokeStyle(2, biome.palette.accent);
      // Checkpoint markers sit on top of the ground/platform surface — anchor
      // the rect's bottom to pos.y (which is the surface y).
      rect.setOrigin(0.5, 1);
      this.physics.add.existing(rect, true);

      this.add
        .text(pos.x, pos.y - 92, cp.title, {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#f5f5f7",
          align: "center",
          wordWrap: { width: 140 },
        })
        .setOrigin(0.5);

      this.checkpoints.push({ x: pos.x, y: pos.y, title: cp.title, body: cp.body, rect, opened: false });
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
    this.physics.add.collider(this.player.gameObject, platformGroup);

    // Guide leads: Aayush walks to checkpoint 0's base x (ground level) and
    // waits there, speaking his intro line. Guide pathing stays horizontal —
    // he never leaves the ground, even for elevated checkpoints.
    this.aayush = new KuraNPC(this, 60, groundY - 24);
    this.guideIndex = -1;

    this.cameras.main.setBounds(0, 0, w, h);
    this.physics.world.setBounds(0, 0, w, h);
    this.cameras.main.startFollow(this.player.gameObject, true, 0.1, 0.1);

    WorldOverlay.setCamera(this.cameras.main);
    this.prompt = makePrompt("E");
    this.guideArrow = makePrompt("➜");
    this.leftHint = makeLeftHubHint();
    this.events.once("shutdown", () => {
      this.promptUnsub?.();
      this.promptUnsub = null;
      this.guideArrowUnsub?.();
      this.guideArrowUnsub = null;
      this.leftHintUnsub?.();
      this.leftHintUnsub = null;
      WorldOverlay.clear();
    });

    this.input.keyboard?.on("keydown-E", () => this.handleInteract());

    EventBus.emit(EVENTS.zoneChanged, { zone: project.title });

    // Kick off the guide: lead to the first unopened checkpoint.
    this.leadGuideToNext();
  }

  private handleInteract(): void {
    if (!this.project) return;

    for (const cp of this.checkpoints) {
      const dist = Math.abs(this.player.x - cp.x);
      if (dist <= WORLD.interactRadius) {
        this.contentPanel.show({ title: cp.title, body: cp.body }, () => {
          if (!cp.opened) {
            cp.opened = true;
            this.leadGuideToNext();
          }
        });
        return;
      }
    }

    const distToExit = Math.abs(this.player.x - this.exitX);
    if (distToExit <= WORLD.interactRadius) {
      this.scene.start(SCENES.hub);
    }
  }

  /** Advance the guide to the nearest un-opened checkpoint (robust to
   * out-of-order interaction), or to the exit once everything is read. */
  private leadGuideToNext(): void {
    const target = this.nearestUnopenedCheckpoint();

    if (!target) {
      // Every checkpoint read — walk to the exit and emphasize it.
      this.guideIndex = this.checkpoints.length;
      this.aayush.walkTo(this.exitX, () => {
        this.aayush.say("That's everything — head out whenever.", "Aayush");
      });
      this.updateGuideArrowTarget(this.exitX);
      return;
    }

    this.guideIndex = this.checkpoints.indexOf(target);
    this.aayush.walkTo(target.x, () => {
      this.aayush.say(firstSentence(target.body), "Aayush");
    });
    this.updateGuideArrowTarget(target.x);
  }

  /** Nearest (by guide's current x) checkpoint that hasn't been opened yet. */
  private nearestUnopenedCheckpoint(): CheckpointMarker | null {
    const unopened = this.checkpoints.filter((cp) => !cp.opened);
    if (unopened.length === 0) return null;
    const from = this.aayush.x;
    return unopened.reduce((best, cp) =>
      Math.abs(cp.x - from) < Math.abs(best.x - from) ? cp : best,
    );
  }

  /** Point the "follow me" arrow at the guide's current target x. */
  private updateGuideArrowTarget(targetX: number): void {
    this.guideArrowUnsub?.();
    this.guideArrowUnsub = WorldOverlay.track(this.guideArrow, () => ({ x: targetX, y: this.aayush.y }), 60);
  }

  update(): void {
    this.player.update();
    this.bg.update(this.cameras.main);
    this.updateCheckpointPrompt();
    this.updateLeftEdge();
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
      }
    } else if (this.promptCp) {
      this.promptUnsub?.();
      this.promptUnsub = null;
      this.promptCp = null;
    }
  }

  /** Walking LEFT past the edge always returns to hub, mirroring the exit
   * portal on the right. Shows a "← Hub" hint when close, hides otherwise. */
  private updateLeftEdge(): void {
    const nearEdge = this.player.x <= LEFT_EDGE_HINT_RADIUS;

    if (nearEdge && !this.leftHintShown) {
      this.leftHintShown = true;
      this.leftHintUnsub = WorldOverlay.track(this.leftHint, () => ({ x: 20, y: WORLD.height - WORLD.groundHeight - 40 }), 20);
    } else if (!nearEdge && this.leftHintShown) {
      this.leftHintShown = false;
      this.leftHintUnsub?.();
      this.leftHintUnsub = null;
    }

    if (this.player.x < LEFT_EDGE_TRIGGER) {
      this.scene.start(SCENES.hub);
    }
  }
}

/** Small DOM hint element for the left-edge back-to-hub affordance. */
function makeLeftHubHint(): HTMLElement {
  const el = document.createElement("div");
  el.className = "wo-el wo-bubble";
  el.style.padding = "6px 10px";
  el.style.fontSize = "12px";
  el.textContent = "← Hub";
  return el;
}
