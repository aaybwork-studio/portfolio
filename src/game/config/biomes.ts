// Biome swap contract. Every background-rendering piece of code reads palette +
// parallax layers from here and NEVER hardcodes a path. Placeholder mode draws
// solid/gradient rectangles per layer. Real art later = fill `path`, flip
// usePlaceholder to false per layer.

export interface ParallaxLayer {
  /** Layer id, back-to-front: "sky" | "mid" | "ground" etc. */
  id: string;
  /** Scroll factor relative to camera: 0 = fixed, 1 = moves with world. */
  scrollFactor: number;
  /** Fill color in placeholder mode. */
  color: number;
  /** Image path (public/). Only read when usePlaceholder is false. */
  path: string;
  usePlaceholder: boolean;
  /** Optional multiply tint applied to the real TileSprite (not the
   * placeholder rect) — recolors shared NES art per biome mood. */
  tint?: number;
}

export interface BiomePalette {
  /** Scene background (behind everything). */
  bg: number;
  /** Primary ink / text-on-dark. */
  ink: number;
  /** Accent used for portals, highlights, checkpoint markers. */
  accent: number;
  /** Ground / platform fill. */
  ground: number;
}

export interface BiomeDef {
  palette: BiomePalette;
  layers: ParallaxLayer[];
  /** Optional tiled ground art. When present, LevelScene renders a tiled
   * visual strip (sourced from this tileset frame) on top of the existing,
   * unchanged collision rect. Absent = keep the plain colored ground rect. */
  groundTileset?: { path: string; tileSize: number; groundIndex: number };
}

// NOTE: the placeholder-rect `layers()` builder that used to live here has
// been retired now that every biome renders real NES art (see nesLayers()
// below). The placeholder rendering path itself is untouched in
// Background.ts — a biome can still opt back into it per-layer by setting
// usePlaceholder: true.

const NES_TILESET = {
  path: "assets/tiles/nes_platformer_tileset.png",
  tileSize: 16,
  groundIndex: 5 * 32 + 21, // row 5, col 21 in the 32-col/16px-tile grid → verified solid checkered ground tile
};

/** Shared NES sky/mountain parallax layers, retinted per biome. Ids are
 * shared across biomes ("nes_sky"/"nes_mtn") so BootScene's dedup-by-path
 * loads each source image exactly once; the tint differentiates biomes at
 * render time. */
function nesLayers(bgColor: number, groundColor: number, skyTint: number, mtnTint: number): ParallaxLayer[] {
  return [
    {
      id: "nes_sky",
      scrollFactor: 0.0,
      color: bgColor,
      path: "assets/backgrounds/nes_sky_clouds.png",
      usePlaceholder: false,
      tint: skyTint,
    },
    {
      id: "nes_mtn",
      scrollFactor: 0.35,
      color: groundColor,
      path: "assets/backgrounds/nes_mountains_mid.png",
      usePlaceholder: false,
      tint: mtnTint,
    },
  ];
}

export const BIOMES = {
  // dark intro, cyan accent
  hero: {
    palette: { bg: 0x0a0a12, ink: 0xf5f5f7, accent: 0x00e5ff, ground: 0x1b1b2a },
    layers: nesLayers(0x0a0a12, 0x1b1b2a, 0x3a5a8a, 0x22344f),
    groundTileset: NES_TILESET,
  },
  // indigo home base
  hub: {
    palette: { bg: 0x101018, ink: 0xf5f5f7, accent: 0x8b9dff, ground: 0x20203a },
    layers: nesLayers(0x101018, 0x20203a, 0x5a5a86, 0x2c2c4a),
    groundTileset: NES_TILESET,
  },
  // twilight-tech: near-black, orange-red accent, calm cosmic
  orbit: {
    palette: { bg: 0x0b0806, ink: 0xf5efe9, accent: 0xff4500, ground: 0x1a120c },
    layers: nesLayers(0x0b0806, 0x1a120c, 0x7a3a1a, 0x3a2212),
    groundTileset: NES_TILESET,
  },
  // warm dusk, soft blue accent, place-based
  "memory-bank": {
    palette: { bg: 0x1a1220, ink: 0xf3ecf2, accent: 0x7fb2ff, ground: 0x2a2036 },
    layers: nesLayers(0x1a1220, 0x2a2036, 0x6a6ab0, 0x40385f),
    groundTileset: NES_TILESET,
  },
  // open, structured, calm green, safe pathways
  "nav-aid": {
    palette: { bg: 0x0c1410, ink: 0xeaf5ee, accent: 0x39d98a, ground: 0x16281f },
    layers: nesLayers(0x0c1410, 0x16281f, 0x4a9a6a, 0x244a34),
    groundTileset: NES_TILESET,
  },
  // near-black with Racing Red (highlight page, not a level, but palette lives here)
  pitwall: {
    palette: { bg: 0x0a0a0a, ink: 0xf7f3ec, accent: 0xe10600, ground: 0x1a1a1a },
    layers: nesLayers(0x0a0a0a, 0x1a1a1a, 0x7a2020, 0x361414),
    groundTileset: NES_TILESET,
  },
} satisfies Record<string, BiomeDef> as Record<"hero" | "hub" | "orbit" | "memory-bank" | "nav-aid" | "pitwall", BiomeDef>;

export type BiomeKey = keyof typeof BIOMES;
