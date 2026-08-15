import { GameDefinition } from "../types";
import { NeonCircuitGame } from "../neonCircuit/NeonCircuitGame";

export const neonCircuitDefinition: GameDefinition = {
  id: "neon-circuit",
  slug: "neon-circuit",
  name: "Neon Circuit",
  platform: "arcade",
  genre: "experimental",
  era: "1980s",
  year: 1985,
  tags: ["Logic Gates", "Boolean Algebra", "Circuit Simulation", "Puzzle", "Experimental"],
  tagline: "Route logic gate networks across breadboard wires to power glowing neon reactors.",
  description:
    "Solve digital electronic puzzles by arranging Boolean logic gates (AND, OR, NOT, XOR) to route power to target neon lamps.",
  difficulty: "medium",
  players: "single",
  estimatedPlayTime: "5-15 min",
  thumbnail: {
    src: "/assets/thumbnails/neon-circuit.png",
    alt: "Neon Circuit Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Select Breadboard Slot" },
      { key: "SPACE / ENTER", description: "Cycle Logic Gate (WIRE, AND, OR, NOT, XOR)" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap any slot to cycle logic gate type.",
  },
  seo: {
    title: "Neon Circuit — Boolean Logic Gate Circuit Simulator",
    description: "Digital logic circuit simulation puzzle featuring AND, OR, NOT, and XOR gates.",
    keywords: ["neon circuit", "boolean logic", "logic gates", "circuit simulation", "puzzle game"],
  },
  math: {
    title: "Boolean Algebra & Propagation Delays",
    summary: "Y = A \\cdot B \\quad (\\text{AND}), \\quad Y = A + B \\quad (\\text{OR}), \\quad Y = A \\oplus B \\quad (\\text{XOR}), \\quad Y = \\overline{A} \\quad (\\text{NOT}).",
    concepts: [
      { name: "Combinational Logic Lattice", description: "\\text{Topologically sorted signal evaluation across 2D breadboard digraph}." },
    ],
  },
  createGame: () => new NeonCircuitGame(),
};
