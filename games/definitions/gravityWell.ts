import { GameDefinition } from "../types";
import { GravityWellGame } from "../gravityWell/GravityWellGame";

export const gravityWellDefinition: GameDefinition = {
  id: "gravity-well",
  slug: "gravity-well",
  name: "Gravity Well",
  platform: "arcade",
  genre: "experimental",
  era: "1990s",
  year: 1996,
  tags: ["Black Hole", "Gravity Well", "N-Body Physics", "Experimental"],
  tagline: "Place and manipulate gravitational singularities to capture comet particles.",
  description:
    "Sculpt chaotic gravitational vector fields by positioning black hole attractor wells to sling drifting comets into orbital traps.",
  difficulty: "medium",
  players: "single",
  estimatedPlayTime: "5-15 min",
  thumbnail: {
    src: "/assets/thumbnails/gravity-well.png",
    alt: "Gravity Well Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Position Reticle" },
      { key: "SPACE", description: "Deploy Gravitational Attractor Well" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap anywhere on screen to spawn gravity attractor.",
  },
  seo: {
    title: "Gravity Well — Multi-Attractor N-Body Gravitational Physics",
    description: "Multi-body gravitational attractor sandbox game trapping chaotic comet particles.",
    keywords: ["gravity well", "black hole game", "n-body physics", "gravitational field"],
  },
  math: {
    title: "Multi-Body Gravitational Superposition",
    summary: "\\vec{a}(\\vec{r}) = -\\sum_{k=1}^M \\frac{G M_k}{\\|\\vec{r} - \\vec{p}_k\\|^3} (\\vec{r} - \\vec{p}_k).",
    concepts: [
      { name: "Orbital Slingshot Conservation", description: "\\text{Angular momentum conservation around composite barycenters}." },
    ],
  },
  createGame: () => new GravityWellGame(),
};
