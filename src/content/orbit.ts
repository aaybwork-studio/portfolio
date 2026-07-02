import type { CheckpointProject } from "./types";

export const orbit: CheckpointProject = {
  slug: "orbit",
  title: "Orbit",
  type: "Graduation Project — B.Des UX Design, UPES (2025–2026)",
  tagline: "Designing the retrieval layer that file systems never had.",
  oneLiner:
    "Orbit finds your files by what they mean, not what you named them. Local embeddings, vector search, results under 200ms. Nothing leaves your machine.",
  biome: "orbit",
  checkpoints: [
    {
      title: "What is Orbit",
      body: "A semantic retrieval layer for files you already have; finds by meaning not filename, fully on-device, sits on top of existing folders without touching them. Stack: React, FastAPI, ChromaDB, Ollama. Scope: desktop app + mobile companion.",
    },
    {
      title: "The problem",
      body: "We forgot how to find our own files; everywhere, none findable; search breaks the moment you forget what you called something; folder systems hold until the deadline, then don't. The problem is retrieval, not storage.",
    },
    {
      title: "Research",
      body: "10 interviews + 30-respondent survey: 87% struggle to find files daily, 80% have recreated a file they couldn't find, 46% average satisfaction with current search, 4+ storage platforms used per person. Quote: \"I know I have it. I made it last Tuesday. I just can't remember what I called it.\"",
    },
    {
      title: "Solution and flow",
      body: "Four on-device stages: ingest, chunk, embed, retrieve. Three defining decisions: no chat interface (retrieval is a utility, not a conversation), local-first processing (privacy by architecture, not promise), the Orb over icons (a living form that breathes idle, contracts listening, pulses thinking — state felt, not read).",
    },
    {
      title: "Outcome",
      body: "140ms median latency on a MacBook Air M2, 1.2GB index per 10k documents, zero network calls verified by packet capture. A foundation, not a finish line: multimodal indexing, voice-first capture, collaborative spaces, eventual OS-level integration.",
    },
  ],
};
