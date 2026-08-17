import type { GameDefinition } from "../types";

export const infiniteForestDefinition: GameDefinition = {
  id: "infiniteForest",
  slug: "infinite-forest",
  name: "Tractor Mulcher",
  platform: "arcade",
  genre: "action",
  era: "2000s",
  year: 2026,
  tags: ["Tractor", "Mulcher", "Deforestation", "Lumberjack", "Christmas", "Destruction", "Action"],
  tagline: "Drive a heavy green & yellow tractor equipped with a high-speed wood grinder to mulch Christmas trees.",
  description:
    "High-speed winter deforestation action! Drive a heavy-duty green & yellow tractor, using a front industrial circular wood grinder to mulch Christmas trees down to stumps.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "platformer",
  estimatedPlayTime: "5-15 min",
  thumbnail: { src: "/games/infiniteForest/thumb.png", alt: "Tractor Mulcher" },
  controls: {
    keyboard: [
      { key: "E / Action", description: "Upgrade Grinder (Bigger Size & Denser Teeth)" },
      { key: "RIGHT / D (Hold)", description: "Drive Forward / Accelerate" },
      { key: "LEFT / A (Hold)", description: "Brake / Reverse" },
      { key: "UP / SPACE / W", description: "Tractor Jump" },
      { key: "R", description: "Restart Run" },
    ],
    touch: "Tap right side to drive forward, tap E button to upgrade grinder, tap left to reverse.",
  },
  seo: {
    title: "Tractor Mulcher — Heavy Logging Tractor Christmas Tree Shredder",
    description: "Drive an industrial wood grinder tractor and mulch Christmas trees across infinite snowy mountains.",
    keywords: ["tractor mulcher", "tractor game", "logging tractor", "christmas tree destruction", "deforestation game", "pixel tractor"],
  },
  math: {
    title: "Procedural Terrain & Elastic Splinter Kinematics",
    summary: "y_{\\text{ground}}(x) = h_0 + \\sum_{i=1}^k A_i \\cdot \\text{Noise}(f_i x).",
    concepts: [
      { name: "Continuous Noise Heightmap", description: "\\text{Multi-octave value noise terrain generation}." },
      { name: "Debris Ballistics", description: "\\text{2D projectile trajectories with parabolic gravity and angular rotation}." },
    ],
  },
  createGame: async () => {
    const { InfiniteForestGame } = await import("../infiniteForest/InfiniteForestGame");
    return new InfiniteForestGame();
  },
};
