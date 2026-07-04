// Sprite swap contract. Character code reads from here; never hardcodes a path.
export interface AnimDef {
  key: string;
  frames: [start: number, end: number];
  frameRate: number;
  repeat: number; // -1 = loop
}
export interface SpriteDef {
  key: string;
  usePlaceholder: boolean;
  path: string;
  frameWidth: number;
  frameHeight: number;
  displayWidth: number;
  displayHeight: number;
  placeholderColor: number;
  tint?: number; // applied to the real sprite (e.g. to differentiate Aayush)
  anims: AnimDef[];
}

const CHARACTER_ANIMS: AnimDef[] = [
  { key: "idle", frames: [0, 3], frameRate: 6, repeat: -1 },
  { key: "run", frames: [4, 7], frameRate: 12, repeat: -1 },
  { key: "jump", frames: [8, 8], frameRate: 1, repeat: 0 },
  { key: "fall", frames: [9, 9], frameRate: 1, repeat: 0 },
];

export const SPRITES = {
  player: {
    key: "player",
    usePlaceholder: false,
    path: "assets/character/character_nes_knight_strip.png",
    frameWidth: 16,
    frameHeight: 24,
    displayWidth: 32,
    displayHeight: 48,
    placeholderColor: 0x00e5ff,
    anims: CHARACTER_ANIMS,
  },
  aayush: {
    key: "aayush",
    usePlaceholder: false,
    path: "assets/character/character_nes_knight_strip.png",
    frameWidth: 16,
    frameHeight: 24,
    displayWidth: 32,
    displayHeight: 48,
    placeholderColor: 0xffd166,
    tint: 0xffcf6a, // warm tint so Aayush reads distinct from the player
    anims: CHARACTER_ANIMS,
  },
} satisfies Record<string, SpriteDef>;

export type SpriteKey = keyof typeof SPRITES;
