// World tunables + shared layout constants. Physics feel, canvas size, and the
// keys the game emits/consumes. Scenes read from here so movement stays uniform.

export const WORLD = {
  /** Logical canvas size. Phaser scales to fit the container. */
  width: 960,
  height: 540,

  /** Player physics (arcade). No fail states — jump exists only for feel. */
  gravityY: 1400,
  moveSpeed: 240,
  jumpVelocity: 560,

  /** Ground band height from the bottom of each scene. */
  groundHeight: 72,

  /** How close (px) the player must be to interact with an NPC/checkpoint/portal. */
  interactRadius: 64,

  /** Zone/level widths (world scroll length). Hero is one screen; levels scroll. */
  heroWidth: 960,
  hubWidth: 1920,
  levelWidth: 2600,
} as const;

/** Scene registry keys — the string ids passed to scene.start(). */
export const SCENES = {
  boot: "BootScene",
  title: "TitleScene",
  hero: "HeroScene",
  hub: "HubScene",
  level: "LevelScene",
} as const;

/**
 * EventBus channel names. DOM HUD <-> Phaser scene bridge. Keep string literals
 * here so both sides agree. See src/game/EventBus.ts.
 */
export const EVENTS = {
  /** DOM -> game: teleport to a zone. payload: { target: "hero"|"hub"|slug } */
  navTo: "nav:to",
  /** game -> DOM: player collected the resume. payload: none */
  resumeCollected: "hud:resume-collected",
  /** game -> DOM: request the control-hint overlay to (re)show. */
  showHint: "hud:show-hint",
  /** game -> DOM: which zone is active now. payload: { zone: string } */
  zoneChanged: "hud:zone-changed",
} as const;

export type NavTarget = "hero" | "hub" | "orbit" | "memory-bank" | "nav-aid" | "pitwall";
