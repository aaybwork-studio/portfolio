// Shared parallax background helper. One entry point (`createBackground`)
// used by HeroScene, HubScene, and LevelScene so every biome renders the
// same way: real art (TileSprite, infinite horizontal parallax) when the
// biome's layers point at loaded textures, otherwise the original colored
// rectangle fallback — pixel-identical to the pre-parallax behavior.

import type Phaser from "phaser";
import { WORLD } from "../config/world";
import type { BiomeKey, ParallaxLayer } from "../config/biomes";
import { BIOMES } from "../config/biomes";

interface RealLayer {
  sprite: Phaser.GameObjects.TileSprite;
  scrollFactor: number;
}

export interface Background {
  /** Real TileSprite layers with their parallax scroll factors, for callers
   * that need direct access (rare — update() covers the common case). */
  layers: RealLayer[];
  /** Call every frame with the active camera to drive parallax scroll. */
  update(camera: Phaser.Cameras.Scene2D.Camera): void;
}

/** Depth band for background art — below entities/UI, above the scene's own
 * background color fill. */
const BG_DEPTH = -1000;

/** Roughly how tall (px) the skyline/buildings art should render at, before
 * we pin its bottom to the ground line. Keeps them from stretching to fill
 * the whole screen (which reads as "floating"/squished) while still being
 * clearly visible above the ground band. */
const FOREGROUND_ART_HEIGHT = 220;

export interface CreateBackgroundOptions {
  /** Scene world width (WORLD.heroWidth / hubWidth / levelWidth). Placeholder
   * rects are sized off this to match pre-existing per-scene behavior. */
  sceneWidth: number;
  /** Extra width multiplier applied to placeholder rects only, replicating
   * HeroScene's original `w * 1.5` safety margin for its non-zero
   * scrollFactor layers. Defaults to 1 (HubScene/LevelScene behavior). */
  placeholderWidthMultiplier?: number;
}

export function createBackground(
  scene: Phaser.Scene,
  biomeKey: BiomeKey,
  options: CreateBackgroundOptions,
): Background {
  const biome = BIOMES[biomeKey];
  const w = WORLD.width;
  const h = WORLD.height;
  const groundY = h - WORLD.groundHeight;
  const placeholderWidth = options.sceneWidth * (options.placeholderWidthMultiplier ?? 1);

  const realLayers: RealLayer[] = [];

  for (const layer of biome.layers) {
    if (!layer.usePlaceholder && layer.path && scene.textures.exists(layer.id)) {
      realLayers.push(createRealLayer(scene, layer, w, h, groundY));
    } else {
      createPlaceholderLayer(scene, layer, placeholderWidth, h, groundY);
    }
  }

  return {
    layers: realLayers,
    update(camera: Phaser.Cameras.Scene2D.Camera): void {
      for (const { sprite, scrollFactor } of realLayers) {
        sprite.tilePositionX = camera.scrollX * scrollFactor;
      }
    },
  };
}

function createRealLayer(
  scene: Phaser.Scene,
  layer: ParallaxLayer,
  w: number,
  h: number,
  groundY: number,
): RealLayer {
  const src = scene.textures.get(layer.id).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const srcHeight = src.height;

  // Sky layers (id starts with "layer0"/"layer1"): stretch to fill the full
  // viewport height, anchored top-left, scroll-locked to the camera.
  const isSky = layer.id.includes("sky");

  let displayHeight: number;
  let y: number;
  if (isSky) {
    displayHeight = h;
    y = 0;
  } else {
    // Skyline / near-buildings: keep art at a fixed, un-squished height and
    // bottom-align it to the ground line so it reads as sitting on the
    // ground rather than floating or being stretched to fill the screen.
    displayHeight = Math.min(FOREGROUND_ART_HEIGHT, h);
    y = groundY - displayHeight;
  }

  const tileScale = displayHeight / srcHeight;

  const sprite = scene.add.tileSprite(0, y, w, displayHeight, layer.id);
  sprite.setOrigin(0, 0);
  sprite.setScrollFactor(0);
  sprite.setDepth(BG_DEPTH);
  sprite.setTileScale(tileScale, tileScale);

  return { sprite, scrollFactor: layer.scrollFactor };
}

function createPlaceholderLayer(
  scene: Phaser.Scene,
  layer: ParallaxLayer,
  w: number,
  h: number,
  groundY: number,
): void {
  // Exact replica of the original inline rectangle drawing found in
  // HeroScene/HubScene/LevelScene before this helper existed.
  const rect = scene.add.rectangle(0, 0, w, h, layer.color);
  rect.setOrigin(0, 0);
  rect.setScrollFactor(layer.scrollFactor);
  if (layer.id === "ground") {
    rect.setPosition(0, groundY);
    rect.setSize(w, WORLD.groundHeight);
  }
}
