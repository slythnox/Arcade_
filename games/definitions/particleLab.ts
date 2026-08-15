import type { GameDefinition } from "../types";
export const particleLabDefinition: GameDefinition = {
  id: "particle-lab",
  slug: "particle-lab",
  name: "Particle Lab",
  platform: "arcade",
  genre: "physics",
  era: "1990s",
  year: 1994,
  tags: ["Particles", "Gravity Well", "Physics Sandbox", "Simulation"],
  tagline: "Manipulate gravitational attractor/repulsor wells in a dynamic particle field.",
  description:
    "Control particle emitters and polarity force wells to sculpt kinetic orbital particle swarms.",
  difficulty: "easy",
  players: "single",
  category: "arcade",
  subcategory: "physics",
  estimatedPlayTime: "5-15 min",
  thumbnail: {
    src: "/assets/thumbnails/particle-lab.png",
    alt: "Particle Lab Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Move Gravity Well Position" },
      { key: "SPACE", description: "Invert Polarity (Attract / Repel)" },
      { key: "ENTER / Z", description: "Emit Kinetic Particle Burst" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap and drag to position gravity well, tap invert button to change polarity.",
  },
  seo: {
    title: "Particle Lab — N-Body Kinetic Particle Physics Sandbox",
    description: "Interactive particle dynamics simulator with gravitational vector fields.",
    keywords: ["particle lab", "physics sandbox", "gravity well", "particle simulator"],
  },
  math: {
    title: "N-Body Inverse-Square Vector Fields",
    summary: "\\vec{F} = \\frac{Q_1 Q_2}{r^2} \\hat{r}, \\text{Integrated across continuous particle swarms}.",
    concepts: [
      { name: "Polarity Vector", description: "\\vec{a} = \\pm \\frac{K}{|\\vec{r}|^2} \\hat{r}." },
      { name: "Boundary Reflection", description: "v_x' = -e \\cdot v_x, v_y' = -e \\cdot v_y." },
    ],
  },
  createGame: async () => {
    const { ParticleLabGame } = await import("../particleLab/ParticleLabGame");
    return new ParticleLabGame();
  },
};
