import type { GameDefinition } from "../types";
export const shadowRunnerDefinition: GameDefinition = {
  id: "shadow-runner",
  slug: "shadow-runner",
  name: "Shadow Runner",
  platform: "arcade",
  genre: "action",
  era: "1990s",
  year: 1998,
  tags: ["Stealth", "Tactical Infiltration", "Metal Gear", "Action"],
  tagline: "Sneak through enemy military compounds using crate cover, distractions, and CQC takedowns.",
  description:
    "Tactical top-down stealth infiltration operative. Take cover behind cargo crates, sneak past guard vision cones, perform silent takedowns, and breach secure bunker terminals.",
  difficulty: "hard",
  players: "single",
  category: "arcade",
  subcategory: "platformer",
  estimatedPlayTime: "4-10 min",
  thumbnail: {
    src: "/assets/thumbnails/shadow-runner.png",
    alt: "Shadow Runner Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "WASD / Arrow Keys", description: "Stealth Operative Movement (Sneak Forward)" },
      { key: "SPACE / Left-Click", description: "CQC Silent Takedown / Wall Knock Distraction" },
      { key: "SHIFT", description: "Hold to Crouch / Silent Sneak" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart Mission" },
    ],
    touch: "Touch to sneak, tap near guard from behind for CQC takedown.",
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
  createGame: async () => {
    const { ShadowRunnerGame } = await import("../shadowRunner/ShadowRunnerGame");
    return new ShadowRunnerGame();
  },
};
