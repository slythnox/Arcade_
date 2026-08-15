import { GameDefinition } from "../types";
import { ResourceMinerGame } from "../resourceMiner/ResourceMinerGame";

export const resourceMinerDefinition: GameDefinition = {
  id: "resource-miner",
  slug: "resource-miner",
  name: "Resource Miner",
  platform: "arcade",
  genre: "strategy",
  era: "2000s",
  year: 2013,
  tags: ["Factory Simulation", "Production Chain", "Automation", "Strategy"],
  tagline: "Construct automated production chains to extract ores, smelt plates, and fabricate microcircuits.",
  description:
    "Build an automated industrial grid network optimizing resource extraction, smelting, and circuit assembly chains.",
  difficulty: "medium",
  players: "single",
  estimatedPlayTime: "5-15 min",
  thumbnail: {
    src: "/assets/thumbnails/resource-miner.png",
    alt: "Resource Miner Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Select Factory Grid Sector" },
      { key: "SPACE / ENTER", description: "Construct Production Facility" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap grid cell to construct extraction or manufacturing facility.",
  },
  seo: {
    title: "Resource Miner — Automated Production Chain Strategy Simulation",
    description: "Factory automation and resource routing strategy game.",
    keywords: ["resource miner", "factorio", "production chain", "factory simulation", "automation"],
  },
  math: {
    title: "Directed Acyclic Graphs (DAG) & Throughput Balancing",
    summary: "R_{\\text{out}} = \\min(R_{\\text{in}}, C_{\\text{max}}), \\text{Production chain balance over discrete simulation ticks}.",
    concepts: [
      { name: "Production Graph Conservation", description: "\\sum \\text{Inputs} = \\sum \\text{Outputs} + \\text{Accumulation}." },
    ],
  },
  createGame: () => new ResourceMinerGame(),
};
