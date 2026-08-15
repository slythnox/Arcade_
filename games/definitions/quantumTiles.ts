import { GameDefinition } from "../types";
import { QuantumTilesGame } from "../quantumTiles/QuantumTilesGame";

export const quantumTilesDefinition: GameDefinition = {
  id: "quantumTiles",
  slug: "quantum-tiles",
  name: "Quantum Tiles",
  platform: "arcade",
  genre: "experimental",
  era: "2000s",
  year: 2022,
  tags: ["wfc", "puzzle", "math"],
  tagline: "Wave Function Collapse simplified.",
  description: "Tiles have adjacency constraints. Watch entropy collapse as the grid resolves.",
  difficulty: "easy",
  players: "single",
  estimatedPlayTime: "Infinite",
  thumbnail: { src: "/games/quantumTiles/thumb.png", alt: "Quantum Tiles" },
  controls: {
    keyboard: [
      { key: "Any", description: "Observe" }
    ]
  },
  seo: {
    title: "Quantum Tiles WFC",
    description: "Wave Function Collapse visualization.",
    keywords: ["wfc", "wave function collapse", "procedural"]
  },
  math: {
    title: "Wave Function Collapse",
    summary: "Constraint propagation, entropy minimization.",
    concepts: [
      { name: "Entropy", description: "Choosing the state with the fewest possibilities" }
    ]
  },
  createGame: () => new QuantumTilesGame(),
};
