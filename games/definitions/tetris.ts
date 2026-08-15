import type { GameDefinition } from "../types";
export const tetrisDefinition: GameDefinition = {
  id: "tetris",
  slug: "tetris",
  name: "Tetris",
  platform: "gameboy",
  genre: "puzzle",
  era: "1980s",
  year: 1989,
  tags: ["grid", "strategy", "classic", "high-score", "matrix"],
  tagline: "The legendary falling block puzzle with Super Rotation System.",
  description:
    "Arrange falling geometric tetrominoes to clear horizontal lines in a 10x20 discrete matrix. Features the authentic Super Rotation System (SRS) with wall kicks, ghost piece projection, and combo scoring.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "classics",
  estimatedPlayTime: "5–15 min",
  thumbnail: {
    src: "/games/tetris/thumb.png",
    alt: "Tetris Cartridge",
  },
  controls: {
    keyboard: [
      { key: "← / → / A / D", description: "Move Piece Left / Right" },
      { key: "↑ / W / Z", description: "Rotate Clockwise (SRS)" },
      { key: "↓ / S", description: "Soft Drop" },
      { key: "SPACE / X", description: "Hard Drop" },
      { key: "SHIFT / C", description: "Hold Piece" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "On-screen D-Pad + Rotate / Drop / Hold buttons",
    gamepad: "D-Pad Left/Right, A to Rotate, Down to Drop, B to Hold",
  },
  seo: {
    title: "Play Tetris Online — Authentic 1989 Retro Puzzle",
    description:
      "Play classic Tetris free in browser with deterministic matrix simulation, SRS wall kicks, ghost piece, and high score tracking.",
    keywords: ["tetris", "retro tetris online", "gameboy tetris", "srs tetris", "matrix rotation"],
  },
  math: {
    title: "Mathematics & Mechanics of Tetris",
    summary:
      "Tetris relies on discrete matrix transformations, 2D discrete coordinate systems, collision boundaries, and gravity acceleration curves.",
    concepts: [
      {
        name: "Discrete Matrix Rotations",
        description:
          "Tetrominoes are represented as NxN binary matrices. Clockwise rotation is computed via matrix transposition followed by horizontal reflection: R(i, j) = M(N - 1 - j, i).",
        formula: "R_{CW}(M)_{i,j} = M_{N-1-j, i}",
      },
      {
        name: "Super Rotation System (SRS) Wall Kicks",
        description:
          "When a rotation causes a collision with walls or locked blocks, the engine tests a 5-vector kick offset sequence (dx, dy) to reposition the piece into valid empty space.",
      },
      {
        name: "Exponential Gravity Curve",
        description:
          "Fall delay decreases per level according to an exponential decay formula, speeding up piece drop rate as the player progresses.",
        formula: "G(level) = (0.8 - (level - 1) \\times 0.007)^{level - 1}",
      },
    ],
  },
  createGame: async () => {
    const { TetrisGame } = await import("../tetris/TetrisGame");
    return new TetrisGame();
  },
};
