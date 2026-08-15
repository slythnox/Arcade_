import { GameDefinition } from "../types";
import { ShadowRunnerGame } from "../shadowRunner/ShadowRunnerGame";

export const shadowRunnerDefinition: GameDefinition = {
  id: "shadow-runner",
  slug: "shadow-runner",
  name: "Shadow Runner",
  platform: "arcade",
  genre: "action",
  era: "1990s",
  year: 1994,
  tags: ["Ghost Replay", "Time Trial", "Time Attack", "Action"],
  tagline: "Race against your own recorded deterministic ghost replay in high-speed time trials.",
  description:
    "Record and replay your own best time trial runs as a transparent ghost racer to shave milliseconds off your lap records.",
  difficulty: "hard",
  players: "single",
  estimatedPlayTime: "3-8 min",
  thumbnail: {
    src: "/assets/thumbnails/shadow-runner.png",
    alt: "Shadow Runner Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Steer Racer Across Circuit" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Touch to steer racer across track checkpoints.",
  },
  seo: {
    title: "Shadow Runner — Deterministic Ghost Replay Time Attack",
    description: "Time attack circuit racer with deterministic ghost recording and replay.",
    keywords: ["shadow runner", "ghost racer", "time attack", "replay system"],
  },
  math: {
    title: "Deterministic Kinematic State Serialization",
    summary: "\\vec{p}_{\\text{ghost}}(t) = \\text{lerp}(\\vec{p}_k, \\vec{p}_{k+1}, \\alpha), \\quad \\alpha = \\frac{t - t_k}{t_{k+1} - t_k}.",
    concepts: [
      { name: "Time Trial State Serialization", description: "\\text{Deterministic frame recording array } [\\vec{p}_0, \\dots, \\vec{p}_N]." },
    ],
  },
  createGame: () => new ShadowRunnerGame(),
};
