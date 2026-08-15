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
  tagline: "Jump back and forth between vertical walls while climbing an endless vertical shaft.",
  description:
    "Ascend an endless vertical shaft by wall jumping between opposing surfaces while dodging hazardous wall spikes.",
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
      { key: "SPACE / ↑", description: "Execute Wall Jump" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap anywhere on screen to execute wall jump.",
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
