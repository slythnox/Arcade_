import { GameDefinition } from "../types";
import { CellColonyGame } from "../cellColony/CellColonyGame";

export const cellColonyDefinition: GameDefinition = {
  id: "cell-colony",
  slug: "cell-colony",
  name: "Cell Colony",
  platform: "arcade",
  genre: "experimental",
  era: "1970s",
  year: 1970,
  tags: ["Game of Life", "Cellular Automata", "Conway", "Simulation", "Experimental"],
  tagline: "Manipulate evolving biological micro-colonies running Conway's Game of Life rules.",
  description:
    "Design and simulate living cellular populations using John Conway's mathematical B3/S23 cellular automata rules.",
  difficulty: "easy",
  players: "single",
  estimatedPlayTime: "5-20 min",
  thumbnail: {
    src: "/assets/thumbnails/cell-colony.png",
    alt: "Cell Colony Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Navigate Cellular Matrix" },
      { key: "SPACE", description: "Toggle Cell State (Birth / Death)" },
      { key: "ENTER / Z", description: "Play / Pause Automata Evolution" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Generate Random Population" },
    ],
    touch: "Tap any cell to seed or extinguish life.",
  },
  seo: {
    title: "Cell Colony — Conway's Game of Life Cellular Automata",
    description: "Conway's Game of Life cellular automata simulator with glider and oscillator patterns.",
    keywords: ["conways game of life", "cellular automata", "life simulator", "boids", "simulation"],
  },
  math: {
    title: "Conway's B3/S23 Automata Transition Function",
    summary: "S_{t+1}(r,c) = \\begin{cases} 1 & \\text{if } N=3 \\lor (S_t=1 \\land N=2) \\\\ 0 & \\text{otherwise} \\end{cases}, \\quad N = \\sum_{d \\in M_8} S_t(r+d_r, c+d_c).",
    concepts: [
      { name: "Turing Completeness", description: "\\text{Universal computation emergent from 2-state Moore neighborhood rules}." },
    ],
  },
  createGame: () => new CellColonyGame(),
};
