import type { GameDefinition } from "../types";

export const timeLoopDefinition: GameDefinition = {
  id: "timeLoop",
  slug: "time-loop",
  name: "Circuit Lab",
  platform: "arcade",
  genre: "puzzle",
  era: "2000s",
  year: 2026,
  tags: ["Electronics", "Wiring", "Circuit", "Breadboard", "Educational", "Simulation"],
  tagline: "Learn electronics across 10 progressive wiring lessons by connecting components with insulated wires.",
  description:
    "Master electronics through 10 hands-on wiring lessons! Drag insulated wires between component pins (Batteries, Resistors, LEDs, Diodes, Relays, Capacitors, and 555 Timers) to complete functional circuits without causing a short-circuit explosion.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "puzzle",
  estimatedPlayTime: "15-30 min",
  thumbnail: { src: "/games/timeLoop/thumb.png", alt: "Circuit Lab" },
  controls: {
    keyboard: [
      { key: "Mouse Drag / Touch", description: "Drag Wires Between Component Pins" },
      { key: "SPACE / ENTER", description: "Test Circuit / Next Lesson" },
      { key: "R", description: "Reset Level Wires" },
    ],
    touch: "Drag from one terminal pin to another to lay wires, tap TEST CIRCUIT to power on.",
  },
  seo: {
    title: "Circuit Lab — Interactive Electronics & Wiring Simulation Game",
    description: "Learn circuit design, resistor laws, diodes, and 555 timers in this hands-on wiring game.",
    keywords: ["circuit game", "wiring game", "electronics lab", "breadboard simulator", "learn electronics"],
  },
  math: {
    title: "Kirchhoff's Circuit Laws & Directed Graph Topology",
    summary: "\\sum_{k=1}^n I_k = 0, \\quad \\sum_{k=1}^m V_k = 0, \\quad V = I \\cdot R.",
    concepts: [
      { name: "Kirchhoff's Current & Voltage Laws", description: "\\text{Conservation of electrical charge and energy in closed circuit loops}." },
      { name: "Adjacency Matrix Graph Traversal", description: "\\text{Graph reachability algorithm evaluating node connectivity and short-circuit faults}." },
    ],
  },
  createGame: async () => {
    const { TimeLoopGame } = await import("../timeLoop/TimeLoopGame");
    return new TimeLoopGame();
  },
};
