import { GameDefinition } from "../types";
import { LaserGridGame } from "../laserGrid/LaserGridGame";

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
    summary: "2D discrete ray marching with 45-degree specular reflection transformations.",
    concepts: [
      { name: "Slash Mirror Matrix", description: "(dx, dy) \\to (-dy, -dx)." },
      { name: "Backslash Mirror Matrix", description: "(dx, dy) \\to (dy, dx)." },
    ],
  },
  createGame: () => new LaserGridGame(),
};
