// Vehicle swap contract — one piloted vehicle per project level. Mirrors the
// sprites.ts seam: code reads size/placeholder from here and never hardcodes a
// path. Drop art into public/assets/vehicles/, fill `path`, flip usePlaceholder
// to false. Placeholder = a colored rounded rect in the biome accent.

export interface VehicleDef {
  /** Texture key + identity. */
  key: string;
  /** When true, draw a placeholder rect instead of loading `path`. */
  usePlaceholder: boolean;
  /** Sprite path under public/. Single frame unless `frames` > 1. */
  path: string;
  /** Source frame size (for a strip). Single sprite = full image size. */
  frameWidth: number;
  frameHeight: number;
  /** Frame count if `path` is a horizontal strip; 1 = single sprite. */
  frames: number;
  /** On-screen size. */
  displayWidth: number;
  displayHeight: number;
  /** Placeholder fill (biome accent). */
  placeholderColor: number;
  /** Optional tint applied to the real sprite. */
  tint?: number;
  /** Human label, e.g. "Rocket". Shown in hub board prompt. */
  label: string;
}

// Keyed by project slug. Free-pilot: the vehicle IS the player entity in a level.
export const VEHICLES = {
  orbit: {
    key: "veh-rocket",
    usePlaceholder: true,
    path: "assets/vehicles/rocket.png",
    frameWidth: 32,
    frameHeight: 48,
    frames: 1,
    displayWidth: 40,
    displayHeight: 60,
    placeholderColor: 0xff4500,
    label: "Rocket",
  },
  "memory-bank": {
    key: "veh-boat",
    usePlaceholder: true,
    path: "assets/vehicles/boat.png",
    frameWidth: 48,
    frameHeight: 32,
    frames: 1,
    displayWidth: 64,
    displayHeight: 44,
    placeholderColor: 0x7fb2ff,
    label: "Boat",
  },
  "nav-aid": {
    key: "veh-pod",
    usePlaceholder: true,
    path: "assets/vehicles/pod.png",
    frameWidth: 40,
    frameHeight: 32,
    frames: 1,
    displayWidth: 56,
    displayHeight: 44,
    placeholderColor: 0x39d98a,
    label: "Pod",
  },
  pitwall: {
    key: "veh-car",
    usePlaceholder: true,
    path: "assets/vehicles/car.png",
    frameWidth: 48,
    frameHeight: 28,
    frames: 1,
    displayWidth: 64,
    displayHeight: 38,
    placeholderColor: 0xe10600,
    label: "F1 Car",
  },
} satisfies Record<string, VehicleDef>;

export type VehicleSlug = keyof typeof VEHICLES;

export function getVehicle(slug: string): VehicleDef | undefined {
  return (VEHICLES as Record<string, VehicleDef>)[slug];
}
