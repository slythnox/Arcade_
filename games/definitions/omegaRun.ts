import type { GameDefinition } from "../types";
export const omegaRunDefinition: GameDefinition = {
  id: "omegaRun",
  slug: "omega-run",
  name: "Omega Run",
  platform: "arcade",
  genre: "platformer",
  era: "2000s",
  year: 2024,
  tags: ["Endless Runner", "Roguelite", "Reflex", "Procedural", "Obstacle Course"],
  tagline: "High-speed endless cyber-runner with procedurally generated hazard gates.",
  description:
    "Navigate an endless neon corridor at blistering speeds. Jump over low energy barriers, slide beneath crushing overhead pistons, and switch lanes dynamically as speed accelerates exponentially.",
  difficulty: "hard",
  players: "single",
  category: "arcade",
  subcategory: "platformer",
  estimatedPlayTime: "3-15 min",
  thumbnail: { src: "/games/omegaRun/thumb.png", alt: "Omega Run" },
  controls: {
    keyboard: [
      { key: "UP / W / SPACE", description: "Jump Over Barrier" },
      { key: "DOWN / S", description: "Slide Under Piston" },
      { key: "LEFT / A", description: "Dodge Left Lane" },
      { key: "RIGHT / D", description: "Dodge Right Lane" },
      { key: "R", description: "Quick Restart" },
    ],
    touch: "Use left dial or swipes to switch lanes, tap right A button to jump, tap B to slide.",
    gamepad: "D-pad to switch lanes, A to jump, B to slide."
  },
  seo: {
    title: "Omega Run — Procedural Endless Cyber Runner",
    description: "Sprint through an infinite procedurally generated neon obstacle corridor with exponential speed scaling.",
    keywords: ["omega run", "endless runner", "cyberpunk runner", "procedural obstacle course", "pixel runner"]
  },
  math: {
    title: "Exponential Speed Scaling & Spatial Hazard Density",
    summary: "v(t) = v_0 \\cdot (1 + k_{\\text{acc}} t)^{0.65}, \\quad \\text{Gap}(v) \\ge \\frac{v^2}{2a_{\\text{jump}}} + d_{\\text{safety}}.",
    concepts: [
      { name: "Guaranteed Solvability", description: "Procedural obstacle spacing dynamically adapts to maximum jump arc width." },
      { name: "AABB Box Collision", description: "High-speed bounding box intersection checks prevent quantum tunneling through barriers." }
    ]
  },
  createGame: async () => {
    const { OmegaRunGame } = await import("../omegaRun/OmegaRunGame");
    return new OmegaRunGame();
  },
};
