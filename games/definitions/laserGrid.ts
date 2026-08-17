import type { GameDefinition } from "../types";
export const laserGridDefinition: GameDefinition = {
  id: "laser-grid",
  slug: "laser-grid",
  name: "Laser Grid",
  platform: "arcade",
  genre: "puzzle",
  era: "1980s",
  year: 1986,
  tags: ["Optics", "Laser", "Reflection", "Puzzle"],
  tagline: "Rotate mirrors to redirect optical laser beams toward target crystals.",
  description:
    "Solve spatial optics puzzles by rotating 45-degree angle mirrors to route photonic laser beams to target sensors.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "classics",
  estimatedPlayTime: "5-10 min",
  thumbnail: {
    src: "/assets/thumbnails/laser-grid.png",
    alt: "Laser Grid Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Move Mirror Cursor" },
      { key: "SPACE / Z", description: "Rotate Selected Mirror" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap any mirror to rotate its reflection angle.",
  },
  seo: {
    title: "Laser Grid — Optical Laser Reflection Puzzle",
    description: "Optical physics puzzle game redirecting lasers with mirror reflection vectors.",
    keywords: ["laser grid", "optics puzzle", "ray reflection", "mirror game"],
  },
  math: {
    title: "Optical Ray Tracing & Specular Inversion",
    summary: "2D discrete ray marching with 45-degree specular reflection transformations, chromatic filtration, and prism beam splitting.",
    concepts: [
      { name: "Slash Mirror Matrix", description: "(dx, dy) \\to (-dy, -dx)" },
      { name: "Backslash Mirror Matrix", description: "(dx, dy) \\to (dy, dx)" },
      { name: "Prism Beam Splitting", description: "Incoming (dx, dy) splits into dual orthogonal rays (-dy, dx) and (dy, -dx)" },
      { name: "Quantum Portal Translation", description: "Laser beam coordinates map seamlessly from Portal Alpha to Portal Beta" },
    ],
  },
  createGame: async () => {
    const { LaserGridGame } = await import("../laserGrid/LaserGridGame");
    return new LaserGridGame();
  },
};
