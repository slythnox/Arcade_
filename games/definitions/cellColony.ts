import type { GameDefinition } from "../types";

export const cellColonyDefinition: GameDefinition = {
  id: "cell-colony",
  slug: "cell-colony",
  name: "Cell Colony",
  platform: "arcade",
  genre: "strategy",
  era: "2000s",
  year: 2005,
  tags: ["Cell Colony", "Strategy", "Microbial Conquest", "RTS", "Biology"],
  tagline: "Command your cyan bio-colony and eradicate hostile parasitic viruses across the Petri dish.",
  description:
    "Tactical microbial real-time strategy game. Dispatch living spore swarms to conquer neutral nutrient nodes and defeat enemy virus colonies.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "strategy",
  estimatedPlayTime: "5-15 min",
  thumbnail: {
    src: "/assets/thumbnails/cell-colony.png",
    alt: "Cell Colony Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Direct Mouse / Touch Click", description: "Select Your Blue Node $\\to$ Click Target to Send Spores" },
      { key: "SPACE", description: "Next Stage" },
      { key: "R", description: "Restart Level" },
    ],
    touch: "Tap your blue colony node, then tap any destination node to send spore swarms.",
  },
  seo: {
    title: "Cell Colony — Microbial Biosphere Conquest RTS",
    description: "Command living cellular colonies and eradicate hostile viruses in this tactical microbiology strategy game.",
    keywords: ["cell colony", "microbial rts", "petri dish battle", "biology strategy", "spore conquest"],
  },
  math: {
    title: "Population Dynamics & Vector Swarm Colonization",
    summary: "\\frac{dN}{dt} = r N \\left(1 - \\frac{N}{K}\\right) - \\Phi_{\\text{spores}}.",
    concepts: [
      { name: "Logistic Growth", description: "\\text{Colony populations regenerate towards maximum carrying capacity } K." },
      { name: "Vector Swarm Dispatch", description: "\\text{Spore trajectories calculated using normalized 2D velocity vectors}." },
    ],
  },
  createGame: async () => {
    const { CellColonyGame } = await import("../cellColony/CellColonyGame");
    return new CellColonyGame();
  },
};
