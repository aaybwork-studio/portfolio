// Per-slug non-linear level layouts. Each layout describes a handful of
// static platforms (simple colored rects for now — real tiles later) and the
// {x, y} position of each checkpoint, spaced non-uniformly across
// WORLD.levelWidth with some elevation variety. LevelScene builds static
// physics bodies from PLATFORMS and places checkpoint markers at the given
// positions; the guide (Aayush) always paths along the ground at a
// checkpoint's x, so elevated checkpoints are reached by the player jumping.
//
// No fail states: the ground band spans the full level width in LevelScene,
// so missing a platform just means landing back on the ground — never a pit.

export interface PlatformLayout {
  /** Center x, in world space. */
  x: number;
  /** Center y, in world space (smaller y = higher up). */
  y: number;
  /** Total width of the platform. */
  width: number;
}

export interface CheckpointPosition {
  x: number;
  y: number;
}

export interface LevelLayout {
  platforms: PlatformLayout[];
  checkpoints: CheckpointPosition[];
}

const PLATFORM_HEIGHT = 20;
const PLATFORM_THICKNESS = 20;

/** Ground-level y for a checkpoint, given the scene's groundY (top of ground band). */
export function checkpointGroundY(groundY: number): number {
  return groundY - 40;
}

/** Default layout used when a slug has no bespoke entry below. Four
 * checkpoints, gentle verticality, non-uniform spacing. Positions are
 * expressed relative to groundY (top of the ground band) via y-offsets
 * baked in at call time by LevelScene (see buildLayout). */
function defaultLayout(groundY: number): LevelLayout {
  return {
    platforms: [
      { x: 520, y: groundY - 120, width: 220 },
      { x: 1180, y: groundY - 90, width: 180 },
      { x: 1850, y: groundY - 150, width: 200 },
    ],
    checkpoints: [
      { x: 260, y: groundY - 40 }, // ground
      { x: 520, y: groundY - 120 - PLATFORM_HEIGHT }, // on first platform
      { x: 1180, y: groundY - 90 - PLATFORM_HEIGHT }, // on second platform
      { x: 1850, y: groundY - 150 - PLATFORM_HEIGHT }, // on third platform
      { x: 2260, y: groundY - 40 }, // back on ground, near exit
    ],
  };
}

function orbitLayout(groundY: number): LevelLayout {
  return {
    platforms: [
      { x: 420, y: groundY - 100, width: 200 },
      { x: 980, y: groundY - 170, width: 160 },
      { x: 1500, y: groundY - 110, width: 220 },
      { x: 2020, y: groundY - 160, width: 180 },
    ],
    checkpoints: [
      { x: 220, y: groundY - 40 },
      { x: 420, y: groundY - 100 - PLATFORM_HEIGHT },
      { x: 980, y: groundY - 170 - PLATFORM_HEIGHT },
      { x: 1500, y: groundY - 110 - PLATFORM_HEIGHT },
      { x: 2020, y: groundY - 160 - PLATFORM_HEIGHT },
    ],
  };
}

function memoryBankLayout(groundY: number): LevelLayout {
  return {
    platforms: [
      { x: 360, y: groundY - 90, width: 180 },
      { x: 900, y: groundY - 140, width: 200 },
      { x: 1650, y: groundY - 100, width: 220 },
    ],
    checkpoints: [
      { x: 200, y: groundY - 40 },
      { x: 360, y: groundY - 90 - PLATFORM_HEIGHT },
      { x: 900, y: groundY - 140 - PLATFORM_HEIGHT },
      { x: 1650, y: groundY - 100 - PLATFORM_HEIGHT },
      { x: 2300, y: groundY - 40 },
    ],
  };
}

function navAidLayout(groundY: number): LevelLayout {
  return {
    platforms: [
      { x: 480, y: groundY - 130, width: 200 },
      { x: 1100, y: groundY - 90, width: 240 },
      { x: 1700, y: groundY - 160, width: 180 },
      { x: 2150, y: groundY - 100, width: 160 },
    ],
    checkpoints: [
      { x: 240, y: groundY - 40 },
      { x: 480, y: groundY - 130 - PLATFORM_HEIGHT },
      { x: 1100, y: groundY - 90 - PLATFORM_HEIGHT },
      { x: 1700, y: groundY - 160 - PLATFORM_HEIGHT },
      { x: 2150, y: groundY - 100 - PLATFORM_HEIGHT },
    ],
  };
}

const LAYOUTS_BY_SLUG: Record<string, (groundY: number) => LevelLayout> = {
  orbit: orbitLayout,
  "memory-bank": memoryBankLayout,
  "nav-aid": navAidLayout,
};

/** Resolve the layout for a given slug + groundY, falling back to the default
 * layout when the slug has no bespoke entry. */
export function getLevelLayout(slug: string, groundY: number): LevelLayout {
  const fn = LAYOUTS_BY_SLUG[slug] ?? defaultLayout;
  return fn(groundY);
}

export const PLATFORM_VISUAL = {
  height: PLATFORM_THICKNESS,
  color: 0x3a3a4a,
  strokeColor: 0x55556a,
} as const;
