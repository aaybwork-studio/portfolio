import type { CheckpointProject } from "./types";

export const memoryBank: CheckpointProject = {
  slug: "memory-bank",
  title: "Memory Bank",
  type: "Personal Project",
  tagline:
    "A digital journal that connects personal memories to real-world places for deeper reflection.",
  oneLiner:
    "A mobile journaling app that preserves not just photos but the emotions, notes, and meaning behind each memory, resurfacing them when you return to the place they happened.",
  biome: "memory-bank",
  checkpoints: [
    {
      title: "What is Memory Bank",
      body: "Connects memories to the places they happened; attach reflections and emotional tags; revisiting a location resurfaces the memory.",
    },
    {
      title: "The problem",
      body: "Capture, save, scroll, forget; photography made capture easy and meaning hard; no space for context or emotional state; tools serve storage, not reflection.",
    },
    {
      title: "Research and insights",
      body: "Built for travelers, families, reflective users; 5 interviews + 12-person survey (Indian college students); 74% say location triggers stronger recall than scrolling, 70% rarely revisit old photos, 68% never add notes, 81% prefer private memory-keeping. Persona: Krish, 21, Noida.",
    },
    {
      title: "Solution",
      body: "Capture, notes and tags, revisit; minimal interactions, contextual prompts, privacy controls; usability testing with 5 students led to a unified Edit Mode and removal of an over-complex \"Then vs Now\" feature.",
    },
    {
      title: "Outcome",
      body: "Targets: ≥70% of memories include notes, ≥3 revisits per user per month, ≤30s average time-to-find, ≥90% task completion, ≥85% positive response to private-by-default mode.",
    },
  ],
};
