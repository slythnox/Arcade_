import { GameDefinition } from "../types";
import { ConnectFourGame } from "../connectFour/ConnectFourGame";

export const connectFourDefinition: GameDefinition = {
  id: "connect-four",
  slug: "connect-four",
  name: "Connect Four",
  platform: "arcade",
  genre: "strategy",
  era: "1970s",
  year: 1974,
  tags: ["Connect Four", "Minimax", "Game Tree", "Board", "Strategy"],
  tagline: "Drop checkers into 7 vertical columns to connect four tokens in a row.",
  description:
    "Play the classic vertical drop connection board game against an intelligent Minimax adversarial search AI opponent.",
  difficulty: "medium",
  players: "1-2 players",
  estimatedPlayTime: "3-8 min",
  thumbnail: {
    src: "/assets/thumbnails/connect-four.png",
    alt: "Connect Four Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "← → / A D", description: "Select Drop Column" },
      { key: "SPACE / ↓", description: "Drop Checker" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap any column slot to drop piece.",
  },
  seo: {
    title: "Connect Four — Classic Minimax AI Strategy Game",
    description: "Play Connect Four board game with game tree search and heuristic evaluation.",
    keywords: ["connect four", "board game", "minimax ai", "strategy game"],
  },
  math: {
    title: "Adversarial Game Tree Search & Minimax Evaluation",
    summary: "V(s) = \\max_{a} \\min_{b} \\text{Eval}(\\text{result}(s, a, b)), \\text{Bitboard 4-in-a-row pattern detection}.",
    concepts: [
      { name: "Directional 4-Ray Check", description: "\\text{Vector scanning along } (1,0), (0,1), (1,1), (1,-1)." },
    ],
  },
  createGame: () => new ConnectFourGame(),
};
