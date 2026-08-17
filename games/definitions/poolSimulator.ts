import type { GameDefinition } from "../types";
export const poolSimulatorDefinition: GameDefinition = {
  id: "poolSimulator",
  slug: "pool-simulator",
  name: "Pool Simulator",
  platform: "arcade",
  genre: "experimental",
  era: "1990s",
  year: 1995,
  tags: ["Billiards", "Pool", "2D Physics", "Elastic Collisions", "Simulation"],
  tagline: "Realistic 2D billiards simulation with phenolic resin ball physics.",
  description:
    "A 2D billiards simulation. Line up cue shots, modulate strike power, pocket solids and stripes, and observe realistic momentum conservation, rotational friction, and cushion restitution.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "simulation",
  estimatedPlayTime: "5-15 min",
  thumbnail: { src: "/games/poolSimulator/thumb.png", alt: "Pool Simulator" },
  controls: {
    keyboard: [
      { key: "LEFT / RIGHT (or A / D)", description: "Rotate Cue Aim Angle" },
      { key: "UP / DOWN (or W / S)", description: "Adjust Cue Strike Power" },
      { key: "SPACE / X", description: "Strike Cue Ball" },
      { key: "R", description: "Rerack Balls / Restart" },
    ],
    touch: "Drag finger or left dial to aim cue stick, use right power slider or buttons to strike cue ball.",
    gamepad: "Left stick to aim cue, Right trigger or A button to strike."
  },
  seo: {
    title: "Pool Simulator — 2D Billiards Physics Simulation",
    description: "Play 2D Billiards with realistic impulse physics, momentum conservation, and pocket detection.",
    keywords: ["pool simulator", "billiards physics", "8-ball simulation", "canvas pool", "elastic collision game"]
  },
  math: {
    title: "2D Rigid-Body Elastic Collisions & Rolling Friction",
    summary: "\\mathbf{v}_1' = \\mathbf{v}_1 - \\frac{2m_2}{m_1+m_2}\\frac{\\langle\\mathbf{v}_1-\\mathbf{v}_2,\\mathbf{x}_1-\\mathbf{x}_2\\rangle}{\\|\\mathbf{x}_1-\\mathbf{x}_2\\|^2}(\\mathbf{x}_1-\\mathbf{x}_2), \\quad \\mathbf{v}(t) = \\mathbf{v}_0 - \\mu g \\hat{\\mathbf{v}} t.",
    concepts: [
      { name: "Conservation of Linear Momentum", description: "Impulse exchange along contact normals during inter-ball elastic impacts." },
      { name: "Cushion Restitution", description: "Specular vector reflection with coefficient of restitution $e \\approx 0.85$ on rubber rails." }
    ]
  },
  createGame: async () => {
    const { PoolSimulatorGame } = await import("../poolSimulator/PoolSimulatorGame");
    return new PoolSimulatorGame();
  },
};
