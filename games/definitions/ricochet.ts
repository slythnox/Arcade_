import type { GameDefinition } from "../types";
export const ricochetDefinition: GameDefinition = {
  id: "ricochet",
  slug: "ricochet",
  name: "Ricochet",
  platform: "arcade",
  genre: "physics",
  era: "1980s",
  year: 1989,
  tags: ["Ricochet", "Ray Reflection", "Trick Shot", "Physics"],
  tagline: "Fire limited trick-shots that bounce off obstacles to strike target sensors.",
  description:
    "Calculate specular boundary reflections and angle lines to eliminate all target nodes with a single bouncing bullet.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "physics",
  estimatedPlayTime: "3-8 min",
  thumbnail: {
    src: "/assets/thumbnails/ricochet.png",
    alt: "Ricochet Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "↑ ↓ / W S", description: "Aim Trajectory Angle" },
      { key: "SPACE", description: "Fire Ricochet Round" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Drag to aim target vector, release to fire.",
  },
  seo: {
    title: "Ricochet — Specular Vector Reflection Target Shooter",
    description: "Ray reflection puzzle shooter with elastic normal collision vectors.",
    keywords: ["ricochet", "ray reflection", "trick shot", "physics puzzle"],
  },
  math: {
    title: "Specular Ray Reflection & Surface Normals",
    summary: "\\vec{v}' = \\vec{v} - 2(\\vec{v} \\cdot \\hat{n}) \\hat{n}, \\text{Law of specular reflection}.",
    concepts: [
      { name: "Normal Reflection Matrix", description: "R = I - 2 \\hat{n} \\hat{n}^T." },
    ],
  },
  createGame: async () => {
    const { RicochetGame } = await import("../ricochet/RicochetGame");
    return new RicochetGame();
  },
};
