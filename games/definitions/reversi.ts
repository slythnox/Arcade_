import { GameDefinition } from "../types";
import { ReversiGame } from "../reversi/ReversiGame";

export const reversiDefinition: GameDefinition = {
  id: "reversi",
  slug: "reversi",
  name: "Reversi",
  platform: "arcade",
  genre: "strategy",
  era: "1980s",
  year: 1980,
  tags: ["Othello", "Reversi", "Board Game", "Heuristic AI", "Strategy"],
  tagline: "Flank and capture opposing discs in all 8 directions across an 8x8 board.",
  description:
    "Play classic Othello / Reversi board strategy with 8-directional ray scanning and corner-weight positional AI.",
  difficulty: "hard",
  players: "1-2 players",
  estimatedPlayTime: "5-15 min",
  thumbnail: {
    src: "/assets/thumbnails/reversi.png",
    alt: "Reversi Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Navigate 8x8 Board Cursor" },
      { key: "SPACE / ENTER", description: "Place Flanking Disc" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap any valid illuminated square to place disc.",
  },
  seo: {
    title: "Reversi — Classic Othello 8-Way Flank Board Strategy",
    description: "Play classic Reversi / Othello with directional ray capture and AI evaluation.",
    keywords: ["reversi", "othello", "board strategy", "flank capture"],
  },
  math: {
    title: "Directional Ray Traversal & Mobility Matrix",
    summary: "\\Delta\\vec{r} \\in \\{-1,0,1\\}^2 \\setminus \\{(0,0)\\}, \\quad \\text{Score} = \\sum W_{i,j} \\cdot M_{i,j}.",
    concepts: [
      { name: "Positional Weighting Matrix", description: "\\text{Corner squares } W_{(0,0)} = 100 \\text{ versus adjacent hazard squares } W_{(0,1)} = -20." },
    ],
  },
  createGame: () => new ReversiGame(),
};
