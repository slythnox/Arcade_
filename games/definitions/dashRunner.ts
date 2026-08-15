import { GameDefinition } from "../types";
import { DashRunnerGame } from "../dashRunner/DashRunnerGame";

export const dashRunnerDefinition: GameDefinition = {
  id: "dash-runner",
  slug: "dash-runner",
  name: "Dash Runner",
  platform: "arcade",
  genre: "platformer",
  era: "2000s",
  year: 2009,
  tags: ["Canabalt", "Rooftop Runner", "Double Jump", "Action"],
  tagline: "Sprint across collapsing rooftop building horizons with double jump reflexes.",
  description:
    "Endless procedural rooftop runner featuring double jump impulses and increasing scroll speeds.",
  difficulty: "hard",
  players: "single",
  estimatedPlayTime: "3-6 min",
  thumbnail: {
    src: "/assets/thumbnails/dash-runner.png",
    alt: "Dash Runner Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "SPACE", description: "Jump / Air Double Jump" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap anywhere on screen to execute single and double jumps.",
  },
  seo: {
    title: "Dash Runner — Procedural Rooftop Parkour Runner",
    description: "High-speed endless rooftop runner inspired by Canabalt with double-jump mechanics.",
    keywords: ["dash runner", "canabalt", "rooftop runner", "double jump"],
  },
  math: {
    title: "Procedural Gap Generation & Multi-Jump State Machine",
    summary: "\\text{Rooftop interval } [x_k, x_k + w_k] \\text{ with gap constraints } g_k \\le \\frac{v_x^2}{2g}.",
    concepts: [
      { name: "Double Jump Reset", description: "\\text{Air jump counter resets strictly upon ground contact}." },
    ],
  },
  createGame: () => new DashRunnerGame(),
};
