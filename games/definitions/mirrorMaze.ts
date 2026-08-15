import { GameDefinition } from "../types";
import { MirrorMazeGame } from "../mirrorMaze/MirrorMazeGame";

export const mirrorMazeDefinition: GameDefinition = {
  id: "mirrorMaze",
  slug: "mirror-maze",
  name: "Mirror Maze",
  platform: "arcade",
  genre: "puzzle",
  era: "2000s",
  year: 2012,
  tags: ["puzzle", "optics", "logic"],
  description: "Reflect a laser beam using mirrors to hit the target.",
  tagline: "Light the way.",
  difficulty: "medium",
  players: "single",
  estimatedPlayTime: "5-10 mins",
  thumbnail: { src: "/assets/games/mirrormaze/thumbnail.png", alt: "Mirror Maze" },
  controls: {
    keyboard: [
      { key: "Arrows", description: "Move Cursor" },
      { key: "Z", description: "Place / Mirror" },
      { key: "X", description: "Place \\ Mirror" },
      { key: "R", description: "Reset Level" }
    ]
  },
  seo: {
    title: "Mirror Maze - Laser Reflection Puzzle",
    description: "Solve challenging optical puzzles by placing mirrors to direct a laser."
  },
  math: {
    title: "Optics & Ray Casting",
    summary: "Demonstrates basic principles of light reflection.",
    concepts: [
      { name: "Ray casting", description: "Simulating light paths discretely." },
      { name: "Reflection", description: "Angle of incidence equals angle of reflection." }
    ]
  },
  createGame: () => new MirrorMazeGame()
};
