import type { CheckpointProject } from "./types";

export const navAid: CheckpointProject = {
  slug: "nav-aid",
  title: "Nav-Aid",
  type: "Personal Project",
  tagline:
    "A self-driving wheelchair attachment designed to enable safer, more independent movement through assisted autonomy.",
  oneLiner:
    "An assistive system that combines self-driving navigation with user-controlled autonomy, so people with mobility impairments move independently without giving up control.",
  biome: "nav-aid",
  checkpoints: [
    {
      title: "What is Nav-Aid",
      body: "A self-driving wheelchair attachment for safer, independent movement via assisted autonomy; adds guidance to an existing chair rather than replacing it.",
    },
    {
      title: "The problem",
      body: "Mobility-impaired users depend on manual control or external help; constant physical effort and environmental awareness make independent movement difficult, unsafe, exhausting in complex spaces.",
    },
    {
      title: "Solution",
      body: "Assisted navigation, obstacle detection, user-controlled autonomy; intelligent path guidance and real-time awareness with manual override always available; balances independence, safety, trust.",
    },
    {
      title: "The system",
      body: "A \"Wheelchair Connect\" companion app plus on-chair display: saved destinations (Home, Work, Public Park), indoor room-level navigation (Bedroom, Bathroom, Kitchen, Main Door), live map view, always-present Emergency Stop.",
    },
    {
      title: "Outcome",
      body: "For the user: safer, confident, independent mobility with less strain and cognitive load; for the product: a reliable system adapting to real environments, supporting intent, prioritizing safety without removing control.",
    },
  ],
};
