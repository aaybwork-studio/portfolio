// Single source of truth for all project content.
// One content model, three presentations: in-game checkpoints, /work/<slug> flat
// pages (SEO), and (later) mobile vertical scroll. Copy lives ONLY in the *.ts
// data files that satisfy these types — never inline in a scene or a page.

/** Biome keys map 1:1 to entries in src/game/config/biomes.ts. */
export type BiomeKey = "hero" | "hub" | "orbit" | "memory-bank" | "nav-aid" | "pitwall";

/** A single guided stop in a checkpoint-tour project. */
export interface Checkpoint {
  /** Panel heading shown in-game and as a section heading on the flat page. */
  title: string;
  /** Body copy. May contain multiple sentences; rendered as-is. */
  body: string;
  /**
   * Optional art hook for the checkpoint marker. Never a raw image path used by
   * game logic — placeholder art is driven by biomes.ts. Present so a later art
   * pass has a per-checkpoint seam. Leave undefined for placeholder rendering.
   */
  assetPath?: string;
}

/** A section in a highlight page (no tour, no checkpoints). */
export interface HighlightBlock {
  heading: string;
  body: string;
}

/** Projects that render as a walkable checkpoint tour (Orbit, Memory Bank, Nav-Aid). */
export interface CheckpointProject {
  slug: "orbit" | "memory-bank" | "nav-aid";
  title: string;
  type: string;
  tagline: string;
  oneLiner: string;
  biome: Exclude<BiomeKey, "hero" | "hub" | "pitwall">;
  checkpoints: Checkpoint[];
}

/** Highlight-only project (PitWall). Rendered flat, never as a level. */
export interface HighlightProject {
  slug: "pitwall";
  title: string;
  type: string;
  tagline: string;
  oneLiner: string;
  biome: "pitwall";
  blocks: HighlightBlock[];
}

export type Project = CheckpointProject | HighlightProject;

/** Narrow a project to the checkpoint-tour shape. */
export function isCheckpointProject(p: Project): p is CheckpointProject {
  return "checkpoints" in p;
}
