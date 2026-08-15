import { Rectangle } from "../../core/types/geometry";

export interface Brick extends Rectangle {
  color: string;
  glow: string;
  points: number;
  destroyed: boolean;
}

export const BRICK_TIERS = [
  { color: "#FF3366", points: 80, glow: "#FFE4E6" }, // Neon Pink / Red
  { color: "#FF7A00", points: 60, glow: "#FFEDD5" }, // Neon Orange
  { color: "#FFD84D", points: 40, glow: "#FEF9C3" }, // Neon Yellow
  { color: "#00FF66", points: 30, glow: "#DCFCE7" }, // Neon Lime Green
  { color: "#00F0FF", points: 20, glow: "#E0F2FE" }, // Neon Cyan
  { color: "#A879FF", points: 10, glow: "#F3E8FF" }, // Neon Violet
];

export function generateBreakoutLevel(
  level: number = 1,
  courtWidth: number = 520,
  startX: number = 40,
  startY: number = 50
): Brick[] {
  const bricks: Brick[] = [];
  const cols = 16;
  const padding = 3;
  const brickWidth = Math.floor((courtWidth - (cols + 1) * padding) / cols); // ~29-30px
  const brickHeight = 12; // compact height for dense blocks

  const maxRows = Math.min(12, 6 + Math.floor(level / 2));

  for (let r = 0; r < maxRows; r++) {
    const tier = BRICK_TIERS[r % BRICK_TIERS.length];

    for (let c = 0; c < cols; c++) {
      let placeBrick = true;

      // Dynamic patterns based on level
      if (level % 5 === 2) {
        // Checkerboard Pattern
        if ((r + c) % 2 === 1) placeBrick = false;
      } else if (level % 5 === 3) {
        // Pyramid Crest
        const distFromCenter = Math.abs(c - (cols - 1) / 2);
        if (r < distFromCenter - 2) placeBrick = false;
      } else if (level % 5 === 4) {
        // Space Invader / Fortress Windows
        if (r >= 2 && r <= 4 && (c === 4 || c === 5 || c === 10 || c === 11)) placeBrick = false;
        if (r === 6 && (c < 3 || c > 12)) placeBrick = false;
      } else if (level % 5 === 0) {
        // Dual Pillars / Split Wall
        if (c >= 6 && c <= 9 && r >= 2) placeBrick = false;
      }

      if (placeBrick) {
        bricks.push({
          x: startX + c * (brickWidth + padding),
          y: startY + r * (brickHeight + padding),
          width: brickWidth,
          height: brickHeight,
          color: tier.color,
          glow: tier.glow,
          points: tier.points,
          destroyed: false,
        });
      }
    }
  }

  return bricks;
}
