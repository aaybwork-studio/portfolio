// Zone 2 — generic checkpoint level, reused per project. Receives { slug }.
// Free-pilot vehicle experience: the player flies a project-themed vehicle
// (no gravity, no ground, no fail states) through open 2D space, visiting
// floating checkpoints in any order. The guide (Aayush) flies ahead to the
// next un-opened checkpoint and waits there.

import Phaser from "phaser";
import { WORLD, SCENES, EVENTS } from "../config/world";
import { BIOMES } from "../config/biomes";
import type { BiomeDef } from "../config/biomes";
import { Vehicle } from "../entities/Vehicle";
import { KuraNPC } from "../entities/KuraNPC";
import { ContentPanel } from "../ui/ContentPanel";
import { WorldOverlay, makePrompt } from "../ui/WorldOverlay";
import { EventBus } from "../EventBus";
import { getProject, isCheckpointProject } from "../../content";
import type { CheckpointProject } from "../../content";
import { createBackground } from "../systems/Background";
import type { Background } from "../systems/Background";

const firstSentence = (s: string) => (s.match(/^.*?[.!?](\s|$)/)?.[0] ?? s).trim();

interface CheckpointMarker {
  x: number;
  y: number;
  title: string;
  body: string;
  marker: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
  opened: boolean;
  secret: boolean;
}

interface LevelInitData {
  slug: string;
}

/** How close (px) to the left edge counts as "at the edge" for the back-nav trigger. */
const LEFT_EDGE_TRIGGER = 40;
/** How close (px) to the left edge shows the "← Hub" hint. */
const LEFT_EDGE_HINT_RADIUS = 160;

/** Camera zoom for the free-pilot view — tuned so the vehicle/checkpoints
 * read clearly instead of looking tiny in a too-wide-open world. */
const CAMERA_ZOOM = 1.6;

/** Vertical play area is ~1.6x WORLD.height, spread around vertical center. */
const PLAY_AREA_HEIGHT_MULT = 1.6;

export class LevelScene extends Phaser.Scene {
  private vehicle!: Vehicle;
  private aayush!: KuraNPC;
  private contentPanel!: ContentPanel;
  private checkpoints: CheckpointMarker[] = [];
  private exitMarker!: Phaser.GameObjects.Arc;
  private exitX = 0;
  private exitY = 0;
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
    // Reset all per-instance state explicitly — LevelScene is reused for
    // every project slug, and Phaser scenes are NOT re-constructed between
    // `scene.start()` calls, so anything left over from a previous project
    // (checkpoints, guide index, prompt refs) must be cleared here. This is
    // half of the cross-project speech-bug fix; the other half is the
    // shutdown teardown below.
    this.checkpoints = [];
    this.guideIndex = -1;
    this.promptCp = null;
    this.leftHintShown = false;
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
    const h = Math.round(WORLD.height * PLAY_AREA_HEIGHT_MULT);

    this.cameras.main.setBackgroundColor(biome.palette.bg);
    this.bg = createBackground(this, project.biome, { sceneWidth: w });
    this.createGroundStrip(biome, w, h);

    this.contentPanel = new ContentPanel(document.body);

    // Open 2D space: no platforms, no ground collision. Checkpoints float at
    // spread-out (x, y) positions across the level area.
    const positions = buildCheckpointPositions(project.checkpoints.length, w, h);

    project.checkpoints.forEach((cp, i) => {
      const pos = positions[i];
      const marker = this.add.circle(pos.x, pos.y, 22, biome.palette.accent, 0.9);
      marker.setStrokeStyle(3, biome.palette.accent, 1);

      const label = this.add
        .text(pos.x, pos.y - 40, cp.title, {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#f5f5f7",
          align: "center",
          wordWrap: { width: 140 },
        })
        .setOrigin(0.5);

      this.checkpoints.push({
        x: pos.x,
        y: pos.y,
        title: cp.title,
        body: cp.body,
        marker,
        label,
        opened: false,
        secret: pos.secret,
      });
    });

    // Exit marker at the far-right edge, vertically centered.
    this.exitX = w - 90;
    this.exitY = h / 2;
    this.exitMarker = this.add.circle(this.exitX, this.exitY, 30, biome.palette.ink, 0.85);
    this.exitMarker.setStrokeStyle(3, biome.palette.ink);
    this.add
      .text(this.exitX, this.exitY - 50, "Exit", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#f5f5f7",
      })
      .setOrigin(0.5);

    // Vehicle = the player entity. No gravity, free 2D flight, clamped to
    // level bounds (see world.setBounds below + body.setCollideWorldBounds
    // set inside Vehicle itself).
    this.vehicle = new Vehicle(this, 90, h / 2, project.slug);

    // Guide flies ahead — no ground, no physics body, just a tween in open space.
    this.aayush = new KuraNPC(this, 90, h / 2 - 60);
    this.guideIndex = -1;

    this.cameras.main.setBounds(0, 0, w, h);
    this.physics.world.setBounds(0, 0, w, h);
    this.cameras.main.setZoom(CAMERA_ZOOM);
    this.cameras.main.startFollow(this.vehicle.gameObject, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(160, 120);

    WorldOverlay.setCamera(this.cameras.main);
    this.prompt = makePrompt("E");
    this.guideArrow = makePrompt("➜");
    this.leftHint = makeLeftHubHint();

    // SHUTDOWN TEARDOWN (speech-bug fix, part 2): every DOM/world-overlay
    // element this scene created — prompt, arrow, left hint, and any active
    // Aayush speech bubble — is explicitly torn down here. Without this,
    // WorldOverlay elements (and Aayush's tracked bubble) survive the scene
    // restart and can render stale copy from the previous project on top of
    // the next level. Nothing about checkpoint text is stored statically or
    // globally; it all lives on `this.checkpoints`, rebuilt fresh in init()/
    // create() from THIS project's `project.checkpoints` only.
    this.events.once("shutdown", () => {
      this.promptUnsub?.();
      this.promptUnsub = null;
      this.guideArrowUnsub?.();
      this.guideArrowUnsub = null;
      this.leftHintUnsub?.();
      this.leftHintUnsub = null;
      this.aayush.clearSay();
      this.contentPanel.destroy();
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
      const dist = Math.hypot(this.vehicle.x - cp.x, this.vehicle.y - cp.y);
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

    const distToExit = Math.hypot(this.vehicle.x - this.exitX, this.vehicle.y - this.exitY);
    if (distToExit <= WORLD.interactRadius) {
      this.scene.start(SCENES.hub);
    }
  }

  /** Advance the guide to the nearest un-opened checkpoint (robust to
   * out-of-order interaction), or to the exit once everything is read. */
  private leadGuideToNext(): void {
    const target = this.nearestUnopenedCheckpoint();

    if (!target) {
      // Every checkpoint read — fly to the exit and emphasize it.
      this.guideIndex = this.checkpoints.length;
      this.aayush.flyTo(this.exitX, this.exitY, () => {
        this.aayush.say("That's everything — head out whenever.", "Aayush");
      });
      this.updateGuideArrowTarget(this.exitX, this.exitY);
      return;
    }

    this.guideIndex = this.checkpoints.indexOf(target);
    this.aayush.flyTo(target.x, target.y - 60, () => {
      this.aayush.say(firstSentence(target.body), "Aayush");
    });
    this.updateGuideArrowTarget(target.x, target.y - 60);
  }

  /** Nearest (2D, by guide's current position) checkpoint that hasn't been
   * opened yet. */
  private nearestUnopenedCheckpoint(): CheckpointMarker | null {
    const unopened = this.checkpoints.filter((cp) => !cp.opened);
    if (unopened.length === 0) return null;
    const fromX = this.aayush.x;
    const fromY = this.aayush.y;
    return unopened.reduce((best, cp) =>
      Math.hypot(cp.x - fromX, cp.y - fromY) < Math.hypot(best.x - fromX, best.y - fromY) ? cp : best,
    );
  }

  /** Point the "follow me" arrow at the guide's current target. */
  private updateGuideArrowTarget(targetX: number, targetY: number): void {
    this.guideArrowUnsub?.();
    this.guideArrowUnsub = WorldOverlay.track(this.guideArrow, () => ({ x: targetX, y: targetY }), 60);
  }

  /** Decorative tiled ground strip along the bottom of the level, sourced
   * from the biome's groundTileset (same NES tileset frame as the rest of
   * the biomes). Purely visual — LevelScene is a no-gravity, no-collision
   * free-pilot space, so this never affects movement. Tinted with the
   * biome's mountain/ground tone so the street matches the theme. */
  private createGroundStrip(biome: BiomeDef, w: number, h: number): void {
    if (!biome.groundTileset) return;
    if (!this.textures.exists("warped-tiles")) return;

    const tileSize = biome.groundTileset.tileSize;
    const stripHeight = tileSize * 2;
    const strip = this.add.tileSprite(0, h - stripHeight, w, stripHeight, "warped-tiles", biome.groundTileset.groundIndex);
    strip.setOrigin(0, 0);
    strip.setScrollFactor(1);
    strip.setDepth(-999);

    const mtnTint = biome.layers.find((l) => l.id === "nes_mtn")?.tint;
    if (mtnTint !== undefined) strip.setTint(mtnTint);
  }

  update(): void {
    this.vehicle.update();
    this.bg.update(this.cameras.main);
    this.updateCheckpointPrompt();
    this.updateLeftEdge();
  }

  private updateCheckpointPrompt(): void {
    let nearest: CheckpointMarker | null = null;
    let nearestDist = Infinity;
    for (const cp of this.checkpoints) {
      const dist = Math.hypot(this.vehicle.x - cp.x, this.vehicle.y - cp.y);
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

  /** Flying LEFT past the edge always returns to hub, mirroring the exit
   * marker on the right. Shows a "← Hub" hint when close, hides otherwise. */
  private updateLeftEdge(): void {
    const nearEdge = this.vehicle.x <= LEFT_EDGE_HINT_RADIUS;

    if (nearEdge && !this.leftHintShown) {
      this.leftHintShown = true;
      this.leftHintUnsub = WorldOverlay.track(this.leftHint, () => ({ x: 20, y: this.vehicle.y }), 20);
    } else if (!nearEdge && this.leftHintShown) {
      this.leftHintShown = false;
      this.leftHintUnsub?.();
      this.leftHintUnsub = null;
    }

    if (this.vehicle.x < LEFT_EDGE_TRIGGER) {
      this.scene.start(SCENES.hub);
    }
  }
}

interface CheckpointSpot {
  x: number;
  y: number;
  secret: boolean;
}

/** Non-uniform (x, y) spread for `count` checkpoints across a levelWidth ×
 * playAreaHeight region, plus one bonus off-path "secret" spot tucked into a
 * far corner. Deterministic per count (no randomness) so layouts are stable
 * across reloads, but varied enough in both axes to feel hand-placed rather
 * than a straight line. */
function buildCheckpointPositions(count: number, w: number, h: number): CheckpointSpot[] {
  if (count === 0) return [];

  const marginX = 220;
  const marginY = 100;
  const usableW = w - marginX * 2;
  const usableH = h - marginY * 2;

  // Vertical zig-zag pattern with varying amplitude so checkpoints aren't
  // aligned on a single horizontal line.
  const verticalPattern = [0.5, 0.18, 0.82, 0.35, 0.68, 0.12, 0.9];

  const spots: CheckpointSpot[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const x = marginX + t * usableW;
    const vy = verticalPattern[i % verticalPattern.length];
    const y = marginY + vy * usableH;
    spots.push({ x, y, secret: false });
  }

  // One off-path secret checkpoint: reuse the LAST project checkpoint's
  // content by pushing its marker into a far corner instead of the main
  // path — but since content is 1:1 with checkpoints, we instead nudge the
  // final regular checkpoint into a tucked-away corner position, keeping it
  // "optional bonus" flavored while still just a normal checkpoint panel.
  if (spots.length > 0) {
    const last = spots[spots.length - 1];
    last.x = w - marginX * 0.6;
    last.y = marginY * 0.6;
    last.secret = true;
  }

  return spots;
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
