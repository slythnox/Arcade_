import { GameDefinition } from "../../games/types";

export const raySectorDefinition: GameDefinition = {
  id: "ray-sector",
  slug: "ray-sector",
  name: "Ray Sector",
  platform: "arcade",
  genre: "shooter",
  era: "1990s",
  year: 1992,
  tags: ["fps", "raycaster", "retro", "3d"],
  description: "Wolfenstein-style 2.5D raycaster. Escape the sector.",
  tagline: "First person retro shooter.",
  difficulty: "hard",
  players: "single",
  category: "arcade",
  subcategory: "shooter",
  estimatedPlayTime: "15 min",
  thumbnail: { src: "/placeholder.png", alt: "Ray Sector" },
  controls: {
    keyboard: [
      { key: "W/S", description: "Move Forward/Back" },
      { key: "A/D", description: "Turn Left/Right" },
      { key: "Space", description: "Shoot" }
    ]
  },
  seo: {
    title: "Ray Sector",
    description: "Play Ray Sector, a 1992-style 2.5D raycasting FPS game."
  },
  math: {
    title: "Raycasting",
    summary: "DDA Algorithm for 2.5D pseudo-3D graphics",
    concepts: [
      { name: "DDA", description: "Digital Differential Analysis" }
    ]
  },
  createGame: async () => {
    const { RaySectorGame } = await import("../raySector/RaySectorGame");
    return new RaySectorGame();
  }
};
