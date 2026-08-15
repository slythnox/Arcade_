import { GameDefinition } from "../types";
import { SandWorldGame } from "../sandWorld/SandWorldGame";

export const sandWorldDefinition: GameDefinition = {
  id: "sandWorld",
  slug: "sand-world",
  name: "Sand World",
  platform: "arcade",
  genre: "physics",
  era: "2000s",
  year: 2005,
  tags: ["simulation", "sandbox", "physics"],
  description: "Falling sand pixel simulation with different materials.",
  tagline: "Watch the world fall into place.",
  difficulty: "easy",
  players: "single",
  estimatedPlayTime: "Infinite",
  thumbnail: { src: "/assets/games/sandworld/thumbnail.png", alt: "Sand World" },
  controls: {
    keyboard: [
      { key: "Arrows", description: "Move Cursor" },
      { key: "Z / Action 1", description: "Place Material" },
      { key: "X / Action 2", description: "Cycle Material (Sand/Water/Stone/Erase)" }
    ]
  },
  seo: {
    title: "Sand World - Particle Simulation Game",
    description: "Relaxing falling sand game with cellular automata physics."
  },
  math: {
    title: "Cellular Automata & Physics",
    summary: "Simulates complex natural phenomena using simple local rules.",
    concepts: [
      { name: "Cellular automata", description: "Grid-based discrete simulation." },
      { name: "Gravity simulation", description: "Downward propagation of state." },
      { name: "Fluid dynamics", description: "Approximation of liquid flow and dispersion." }
    ]
  },
  createGame: () => new SandWorldGame()
};
