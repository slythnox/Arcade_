import type { GameDefinition } from "../../games/types";

export const raySectorDefinition: GameDefinition = {
  id: "ray-sector",
  slug: "ray-sector",
  name: "Ray Sector",
  platform: "arcade",
  genre: "shooter",
  era: "1990s",
  year: 1992,
  tags: ["FPS", "Raycaster", "Retro 3D", "Shooter", "DDA", "Labyrinth"],
  description:
    "An endless loop 1990s 2.5D raycasting shooter. Navigate continuous interconnected neon corridors with constant hostile opponent spawning, tactical cross-corridor pursuit, and first-person pixel weapon combat.",
  tagline: "Endless 2.5D raycaster with constant opponent spawning & pixel weapon combat.",
  difficulty: "hard",
  players: "single",
  category: "arcade",
  subcategory: "shooter",
  estimatedPlayTime: "10-20 min",
  thumbnail: { src: "/games/raySector/thumb.png", alt: "Ray Sector" },
  controls: {
    keyboard: [
      { key: "UP / W", description: "Move Forward" },
      { key: "DOWN / S", description: "Move Backward" },
      { key: "LEFT / A", description: "Turn Left" },
      { key: "RIGHT / D", description: "Turn Right" },
      { key: "SPACE / Z", description: "Fire Plasma Cannon" },
      { key: "P", description: "Pause" },
      { key: "R", description: "Restart Mission" },
    ],
    touch: "Use left directional dial to navigate and turn, tap right A button to fire plasma rounds.",
    gamepad: "Left stick or D-pad to move and turn, A button to fire."
  },
  seo: {
    title: "Ray Sector — 2.5D Raycasting Retro FPS",
    description: "Play Ray Sector, a high-performance 1990s pseudo-3D raycasting shooter built from scratch in TypeScript.",
    keywords: ["ray sector", "raycasting game", "retro fps", "wolfenstein 3d", "canvas raycaster", "dda algorithm"]
  },
  math: {
    title: "Digital Differential Analysis (DDA) Raycasting",
    summary: "\\text{Ray distance } d = \\min(t_x, t_y) \\cdot \\cos(\\theta - \\theta_{\\text{camera}}).",
    concepts: [
      { name: "DDA Grid Traversal", description: "Step-by-step orthogonal grid line intersection without floating point ray marching." },
      { name: "Fish-Eye Correction", description: "Perpendicular distance projection multiplying ray length by cosine of view angle offset." }
    ]
  },
  createGame: async () => {
    const { RaySectorGame } = await import("../raySector/RaySectorGame");
    return new RaySectorGame();
  }
};
