import { GameDefinition } from "../types";
export const chessMiniDefinition: GameDefinition = {
  id: "chess-mini",
  slug: "chess-mini",
  name: "Chess Mini",
  platform: "arcade",
  genre: "strategy",
  era: "1970s",
  year: 1970,
  tags: ["Gardner Chess", "Mini Chess", "Board Game", "AI", "Strategy"],
  tagline: "High-intensity 5x6 compact chess variant with fast tactical clashes.",
  description:
    "Play Gardner's 5x6 compact mini chess variant with full piece dynamics, legal move generation, and tactical AI search.",
  difficulty: "hard",
  players: "1-2 players",
  category: "arcade",
  subcategory: "strategy",
  estimatedPlayTime: "5-15 min",
  thumbnail: {
    src: "/assets/thumbnails/chess-mini.png",
    alt: "Chess Mini Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Navigate 5x6 Board Squares" },
      { key: "SPACE / ENTER", description: "Select & Move Chess Piece" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap piece to view highlighted legal moves, tap destination to execute.",
  },
  seo: {
    title: "Chess Mini — 5x6 Compact Gardner Chess Variant",
    description: "5x6 mini chess game featuring piece movement validation and AI search.",
    keywords: ["chess mini", "gardner chess", "mini chess", "chess variant", "board strategy"],
  },
  math: {
    title: "Finite Piece Ray Generation & Material Valuation",
    summary: "\\text{Eval}(s) = \\sum_{p \\in \\text{White}} V(p) - \\sum_{p \\in \\text{Black}} V(p) + \\text{Mobility}(s).",
    concepts: [
      { name: "Shannon Evaluation Function", description: "V = [100, 300, 320, 500, 900, 10000] \\text{ for } [P, N, B, R, Q, K]." },
    ],
  },
  createGame: async () => {
    const { ChessMiniGame } = await import("../chessMini/ChessMiniGame");
    return new ChessMiniGame();
  },
};
