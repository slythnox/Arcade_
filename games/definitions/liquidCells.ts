import type { GameDefinition } from "../types";
export const liquidCellsDefinition: GameDefinition = {
  id: "liquidCells",
  slug: "liquid-cells",
  name: "Liquid Cells",
  platform: "arcade",
  genre: "experimental",
  era: "2000s",
  year: 2014,
  tags: ["Fluid Dynamics", "Liquid", "Cellular Automata", "Physics Sandbox", "Simulation"],
  tagline: "Cellular automaton lattice fluid dynamics simulation.",
  description:
    "A 2D cellular automaton fluid dynamics simulation. Place containers, release water masses, build barrier channels, and observe emergent hydrostatic pressure equalization, sloshing waves, and laminar cascades.",
  difficulty: "easy",
  players: "single",
  category: "arcade",
  subcategory: "simulation",
  estimatedPlayTime: "5-20 min",
  thumbnail: { src: "/games/liquidCells/thumb.png", alt: "Liquid Cells" },
  controls: {
    keyboard: [
      { key: "ARROWS / WASD", description: "Move Brush Cursor" },
      { key: "SPACE / X", description: "Pour Water Mass" },
      { key: "Z / C", description: "Place Solid Barrier Wall" },
      { key: "E / SHIFT", description: "Eraser Tool" },
      { key: "R", description: "Clear Simulation Grid" },
    ],
    touch: "Tap or drag directly on the canvas to pour fluid masses or place barrier channels.",
    gamepad: "Left stick to move cursor, A button to pour liquid, B button to place walls."
  },
  seo: {
    title: "Liquid Cells — Cellular Automaton Fluid Simulator",
    description: "Interactive real-time 2D fluid simulation running on a discrete cellular automaton lattice.",
    keywords: ["liquid cells", "fluid dynamics", "cellular automaton water", "physics sandbox", "canvas fluid simulation"]
  },
  math: {
    title: "Discrete Cellular Hydrodynamics & Pressure Balance",
    summary: "\\Delta m_{i \\to j} = \\min\\left(m_i, \\max\\left(0, \\frac{m_i + m_j}{2} - m_j\\right)\\right), \\quad m_t(x, y) = m_{t-1} + \\sum_{\\text{in}} \\Delta m - \\sum_{\\text{out}} \\Delta m.",
    concepts: [
      { name: "Downwards Gravity Cascade", description: "Downward fluid mass transport priority into empty underlying cells." },
      { name: "Lateral Pressure Dispersion", description: "Horizontal equalizing mass flux driven by hydrostatic head differentials." }
    ]
  },
  createGame: async () => {
    const { LiquidCellsGame } = await import("../liquidCells/LiquidCellsGame");
    return new LiquidCellsGame();
  },
};
