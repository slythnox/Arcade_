import { GameDefinition } from "../types";
export const checkersDefinition: GameDefinition = {
  id: "checkers",
  slug: "checkers",
  name: "Checkers",
  platform: "arcade",
  genre: "strategy",
  era: "1970s",
  year: 1978,
  tags: ["Checkers", "Draughts", "Board Game", "Minimax", "Strategy"],
  tagline: "Capture opposing checkers across an 8x8 draughts board to promote king crowns.",
  description:
    "Play classic 8x8 American Checkers with diagonal moves, jumping captures, king crowning, and adversarial AI.",
  difficulty: "medium",
  players: "1-2 players",
  category: "arcade",
  subcategory: "strategy",
  estimatedPlayTime: "5-15 min",
  thumbnail: {
    src: "/assets/thumbnails/checkers.png",
    alt: "Checkers Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Select Board Square" },
      { key: "SPACE / ENTER", description: "Pick & Move Draught Piece" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap piece then destination square to move or capture.",
  },
  seo: {
    title: "Checkers — Classic 8x8 Draughts Board Strategy",
    description: "8x8 checkers game featuring jump captures, king promotion, and AI opponent.",
    keywords: ["checkers", "draughts", "board game", "strategy game", "minimax ai"],
  },
  math: {
    title: "Diagonal Lattice Moves & Parity Transitions",
    summary: "r + c \\equiv 1 \\pmod 2, \\quad \\vec{v}_{\\text{jump}} = 2 \\vec{d}_{\\text{step}}.",
    concepts: [
      { name: "King Crown Promotion", description: "\\text{Piece reaching enemy back rank } (r = 0 \\lor r = 7) \\text{ gains bidirectional movement}." },
    ],
  },
  createGame: async () => {
    const { CheckersGame } = await import("../checkers/CheckersGame");
    return new CheckersGame();
  },
};
