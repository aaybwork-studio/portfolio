// Content barrel — the ONLY import surface for project copy. Pages and the game
// both read from here. Case-study text lives exclusively in the four data files.

import { orbit } from "./orbit";
import { memoryBank } from "./memory-bank";
import { navAid } from "./nav-aid";
import { pitwall } from "./pitwall";
import type { Project, CheckpointProject, HighlightProject } from "./types";

export type { Project, CheckpointProject, HighlightProject, Checkpoint, HighlightBlock, BiomeKey } from "./types";
export { isCheckpointProject } from "./types";

/** All projects in hub/nav display order. */
export const projects: Project[] = [orbit, memoryBank, navAid, pitwall];

/** The three walkable checkpoint tours (excludes PitWall highlight). */
export const checkpointProjects: CheckpointProject[] = [orbit, memoryBank, navAid];

/** PitWall highlight (flat page only). */
export const pitwallProject: HighlightProject = pitwall;

/** Lookup by slug. Returns undefined for unknown slugs. */
export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export { orbit, memoryBank, navAid, pitwall };
