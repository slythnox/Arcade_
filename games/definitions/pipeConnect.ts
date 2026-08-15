import type { GameDefinition } from "../types";
export const pipeConnectDefinition: GameDefinition = {
  id: "pipe-connect",
  slug: "pipe-connect",
  name: "Pipe Connect",
  platform: "arcade",
  genre: "puzzle",
  era: "1980s",
  year: 1989,
  tags: ["Pipe Mania", "Graph Connectivity", "Flow", "Puzzle"],
  tagline: "Rotate pipe segments to establish a continuous leak-free hydraulic connection.",
  description:
    "Connect the water source to the destination drain by rotating modular pipe fittings in a 2D network.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "puzzle",
  estimatedPlayTime: "3-8 min",
  thumbnail: {
    src: "/assets/thumbnails/pipe-connect.png",
    alt: "Pipe Connect Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Select Pipe Segment" },
      { key: "SPACE / Z", description: "Rotate Selected Fitting" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap any pipe to rotate by 90 degrees.",
  },
  seo: {
    title: "Pipe Connect — Hydraulic Graph Connectivity Puzzle",
    description: "Modular pipe routing puzzle game featuring graph flow algorithms.",
    keywords: ["pipe mania", "pipe connect", "graph puzzle", "flow network"],
  },
  math: {
    title: "Graph Connectivity & Flow Reachability",
    summary: "Bidirectional interface matching: E(u, v) \\iff \\text{open}(u, d) \\land \\text{open}(v, d_{\\text{opposite}}).",
    concepts: [
      { name: "Interface Matching", description: "\\text{Neighbor connectivity requires symmetric port alignment}." },
      { name: "Reachability BFS", description: "\\text{Queue-based path verification from } S \\to T." },
    ],
  },
  createGame: async () => {
    const { PipeConnectGame } = await import("../pipeConnect/PipeConnectGame");
    return new PipeConnectGame();
  },
};
