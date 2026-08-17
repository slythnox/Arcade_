import type { GameDefinition } from "../types";
export const wallRunnerDefinition: GameDefinition = {
  id: "wall-runner",
  slug: "wall-runner",
  name: "Wall Runner",
  platform: "arcade",
  genre: "platformer",
  era: "2000s",
  year: 2008,
  tags: ["Wall Jump", "Ninja", "Runner", "Platformer", "Action"],
  tagline: "Wall jump across high-tech cliffs to dodge and katana-slash hostile attack spaceships.",
  description:
    "Ascend an endless cyber canyon by wall jumping between vertical surfaces while dodging laser salvos and air-slashing enemy fighter spaceships.",
  difficulty: "hard",
  players: "single",
  category: "arcade",
  subcategory: "platformer",
  estimatedPlayTime: "3-6 min",
  thumbnail: {
    src: "/assets/thumbnails/wall-runner.png",
    alt: "Wall Runner Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "A / ←", description: "Jump / Dash to Left Wall" },
      { key: "D / →", description: "Jump / Dash to Right Wall" },
      { key: "SPACE / Left-Click", description: "Katana Slash Attack (Destroy Ships & Lasers)" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart Run" },
    ],
    touch: "Tap left/right side to wall jump, tap center to Katana slash.",
  },
  seo: {
    title: "Wall Runner — Ninja Wall Jump Vertical Shaft Ascender",
    description: "Vertical ninja wall jumping reflex game dodging obstacle spikes.",
    keywords: ["wall runner", "wall jump", "ninja runner", "vertical reflex"],
  },
  math: {
    title: "Normal Velocity Inversion & State Transition",
    summary: "v_x' = -v_x \\cdot \\text{sgn}(x - x_{\\text{mid}}), \\text{Discrete binary wall latching state transitions}.",
    concepts: [
      { name: "Horizontal Impulse", description: "\\Delta v_x = \\mp v_{\\text{jump}}." },
    ],
  },
  createGame: async () => {
    const { WallRunnerGame } = await import("../wallRunner/WallRunnerGame");
    return new WallRunnerGame();
  },
};
