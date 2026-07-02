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
}

function layers(sky: number, mid: number, ground: number): ParallaxLayer[] {
  return [
    { id: "sky", scrollFactor: 0.0, color: sky, path: "", usePlaceholder: true },
    { id: "mid", scrollFactor: 0.35, color: mid, path: "", usePlaceholder: true },
    { id: "ground", scrollFactor: 1.0, color: ground, path: "", usePlaceholder: true },
  ];
}

export const BIOMES = {
  hero: {
    palette: { bg: 0x0a0a12, ink: 0xf5f5f7, accent: 0x00e5ff, ground: 0x1b1b2a },
    layers: layers(0x0a0a12, 0x141426, 0x1b1b2a),
  },
  hub: {
    palette: { bg: 0x101018, ink: 0xf5f5f7, accent: 0x8b9dff, ground: 0x20203a },
    layers: layers(0x101018, 0x181830, 0x20203a),
  },
  // twilight-tech: near-black, orange-red accent, calm cosmic
  orbit: {
    palette: { bg: 0x0b0806, ink: 0xf5efe9, accent: 0xff4500, ground: 0x1a120c },
    layers: layers(0x0b0806, 0x160f0a, 0x1a120c),
  },
  // warm dusk, soft blue accent, place-based
  "memory-bank": {
    palette: { bg: 0x1a1220, ink: 0xf3ecf2, accent: 0x7fb2ff, ground: 0x2a2036 },
    layers: layers(0x1a1220, 0x241830, 0x2a2036),
  },
  // open, structured, calm green, safe pathways
  "nav-aid": {
    palette: { bg: 0x0c1410, ink: 0xeaf5ee, accent: 0x39d98a, ground: 0x16281f },
    layers: layers(0x0c1410, 0x112018, 0x16281f),
  },
  // near-black with Racing Red (highlight page, not a level, but palette lives here)
  pitwall: {
    palette: { bg: 0x0a0a0a, ink: 0xf7f3ec, accent: 0xe10600, ground: 0x1a1a1a },
    layers: layers(0x0a0a0a, 0x141414, 0x1a1a1a),
  },
} satisfies Record<string, BiomeDef>;

export type BiomeKey = keyof typeof BIOMES;
