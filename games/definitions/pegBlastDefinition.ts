import type { GameDefinition } from "../types";

export const pegBlastDefinition: GameDefinition = {
  id: "pegBlast",
  slug: "peg-blast",
  name: "Peg Blast",
  platform: "arcade",
  genre: "puzzle",
  era: "2000s",
  year: 2003,
  tags: ["casual", "physics", "bouncing", "pegs"],
  tagline: "Blast the pegs and clear the board!",
  description: "Aim your launcher and fire bouncing balls to clear all the orange targets. Watch out for gravity and use the blue pegs to your advantage. Can you hit the moving bucket for extra balls?",
  difficulty: "easy",
  players: "single",
  category: "arcade",
  subcategory: "casual",
  estimatedPlayTime: "5-10 min",
  thumbnail: {
    src: "/games/pegBlast/thumb.png",
    alt: "Peg Blast Cartridge",
  },
  controls: {
    keyboard: [
      { key: "← / →", description: "Aim Launcher Left / Right" },
      { key: "SPACE", description: "Fire Ball" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
  },
  seo: {
    title: "Play Peg Blast Online - Casual Physics Arcade",
    description: "Clear the orange pegs using physics-based bouncing mechanics. Casual fun inspired by 2000s classics.",
    keywords: ["peg blast", "physics puzzle", "bounce game", "casual arcade"],
  },
  math: {
    title: "Physics of Peg Blast",
    summary: "Simulates elastic collisions and gravity.",
    concepts: [
      {
        name: "Circle Collision",
        description: "Checking distance between centers against sum of radii.",
      },
      {
        name: "Vector Reflection",
        description: "Bouncing velocities using dot products and normals.",
      }
    ],
  },
  createGame: async () => {
    const { PegBlastGame } = await import("../pegBlast/PegBlastGame");
    return new PegBlastGame();
  },
};
