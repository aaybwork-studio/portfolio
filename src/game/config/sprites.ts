// Sprite swap contract. Every character-rendering piece of code reads from here
// and NEVER hardcodes an image path. Swapping in real art later = drop files in
// public/assets/, fill `path`, flip `usePlaceholder` to false. Nothing else changes.

export interface AnimDef {
  /** Animation key, e.g. "idle", "walk". */
  key: string;
  /** Inclusive frame index range into the sheet. Ignored while usePlaceholder. */
  frames: [start: number, end: number];
  /** Frames per second. */
  frameRate: number;
  /** -1 = loop forever. */
  repeat: number;
}

export interface SpriteDef {
  /** Texture key used by Phaser and by entity code. */
  key: string;
  /** When true, the entity draws a colored rectangle instead of loading `path`. */
  usePlaceholder: boolean;
  /** Spritesheet path under public/. Only read when usePlaceholder is false. */
  path: string;
  /** Source frame size in the sheet. */
  frameWidth: number;
  frameHeight: number;
  /** On-screen size (rect size in placeholder mode, sprite display size otherwise). */
  displayWidth: number;
  displayHeight: number;
  /** Fill color for the placeholder rectangle. */
  placeholderColor: number;
  /** Named animations. In placeholder mode entities may tween the rect instead. */
  anims: AnimDef[];
}

const WALK_ANIMS: AnimDef[] = [
  { key: "idle", frames: [0, 0], frameRate: 1, repeat: -1 },
  { key: "walk", frames: [0, 3], frameRate: 10, repeat: -1 },
];

export const SPRITES = {
  player: {
    key: "player",
    usePlaceholder: true,
    path: "assets/player.png",
    frameWidth: 32,
    frameHeight: 48,
    displayWidth: 32,
    displayHeight: 48,
    placeholderColor: 0x00e5ff, // cyan visitor
    anims: WALK_ANIMS,
  },
  // Aayush — the findable NPC / guide. "Kura" is his handle.
  aayush: {
    key: "aayush",
    usePlaceholder: true,
    path: "assets/aayush.png",
    frameWidth: 32,
    frameHeight: 48,
    displayWidth: 32,
    displayHeight: 48,
    placeholderColor: 0xffd166, // warm amber NPC
    anims: WALK_ANIMS,
  },
} satisfies Record<string, SpriteDef>;

export type SpriteKey = keyof typeof SPRITES;
