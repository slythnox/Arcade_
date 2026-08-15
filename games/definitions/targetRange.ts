import { GameDefinition } from "../types";
import { TargetRangeGame } from "../targetRange/TargetRangeGame";

export const targetRangeDefinition: GameDefinition = {
  id: "target-range",
  slug: "target-range",
  name: "Target Range",
  platform: "arcade",
  genre: "shooter",
  era: "1980s",
  year: 1984,
  tags: ["Flick Test", "Accuracy", "Reaction", "Target"],
  tagline: "Test aim flick precision and reaction latency on concentric bullseye targets.",
  description:
    "Hit rapid emerging concentric bullseye targets with precision radius scoring within a 45-second round.",
  difficulty: "medium",
  players: "single",
  estimatedPlayTime: "1-3 min",
  thumbnail: {
    src: "/assets/thumbnails/target-range.png",
    alt: "Target Range Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Maneuver Aim Crosshair" },
      { key: "SPACE", description: "Fire Precision Shot" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap directly on bullseye targets to strike.",
  },
  seo: {
    title: "Target Range — FPS Flick Accuracy & Reaction Trial",
    description: "Concentric bullseye reflex target shooter with accuracy analytics.",
    keywords: ["target range", "aim trainer", "flick test", "accuracy reaction"],
  },
  math: {
    title: "Concentric Ring Distance Accuracy Scoring",
    summary: "S = 100 + 400 \\times \\left(1 - \\frac{\\|\\vec{p}_{\\text{shot}} - \\vec{p}_{\\text{center}}\\|}{R}\\right).",
    concepts: [
      { name: "Continuous Accuracy Formula", description: "\\text{Score scales linearly with proximity to center bullseye}." },
    ],
  },
  createGame: () => new TargetRangeGame(),
};
