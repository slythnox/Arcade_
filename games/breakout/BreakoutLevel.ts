import type { Rectangle } from "../../core/types/geometry";

export interface Brick extends Rectangle {
  color: string;
  glow: string;
  points: number;
  destroyed: boolean;
  isStone?: boolean;
  hitsRequired?: number;
  hitsRemaining?: number;
}

export const BRICK_TIERS = [
  { color: "#FF3366", points: 250, glow: "#FFE4E6" }, // Deepest Top Tier (Highest reward)
  { color: "#FF7A00", points: 180, glow: "#FFEDD5" }, // Tier 2
  { color: "#FFD84D", points: 120, glow: "#FEF9C3" }, // Tier 3
  { color: "#00FF66", points: 80, glow: "#DCFCE7" },  // Tier 4
  { color: "#00F0FF", points: 50, glow: "#E0F2FE" },  // Tier 5
  { color: "#A879FF", points: 30, glow: "#F3E8FF" },  // Base Tier
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
  const brickWidth = Math.floor((courtWidth - (cols + 1) * padding) / cols);
  const brickHeight = 12;

  const maxRows = Math.min(10, 6 + Math.floor((level - 1) / 2));

  for (let r = 0; r < maxRows; r++) {
    // Reverse tier index so top row (r=0) is the highest reward tier
    const tierIdx = Math.min(r, BRICK_TIERS.length - 1);
    const tier = BRICK_TIERS[tierIdx];

    for (let c = 0; c < cols; c++) {
      let placeBrick = true;
      let isStone = false;
      let hits = 1;

      // Add unbreakable stone obstacle blocks starting on level 2
      if (level >= 2) {
        if (level === 2 && r === 3 && (c === 4 || c === 5 || c === 10 || c === 11)) {
          isStone = true;
        } else if (level === 3 && r === 2 && (c === 2 || c === 7 || c === 8 || c === 13)) {
          isStone = true;
        } else if (level >= 4 && (r === 3 || r === 4) && (c === 0 || c === 15 || c === 7 || c === 8)) {
          isStone = true;
        }
      }

      // Dynamic brick layouts
      if (level % 5 === 2) {
        if ((r + c) % 2 === 1 && !isStone) placeBrick = false;
      } else if (level % 5 === 3) {
        const dist = Math.abs(c - (cols - 1) / 2);
        if (r < dist - 2 && !isStone) placeBrick = false;
      } else if (level % 5 === 4) {
        if (r >= 2 && r <= 4 && (c === 3 || c === 12) && !isStone) placeBrick = false;
      }

      // Armored 2-hit bricks in middle rows on higher levels
      if (level >= 3 && !isStone && r === 1) {
        hits = 2;
      }

      if (placeBrick) {
        // Deep row multiplier: rows higher up (smaller r) get higher points
        const depthMultiplier = Math.max(1, 5 - r);
        bricks.push({
          x: startX + c * (brickWidth + padding),
          y: startY + r * (brickHeight + padding),
          width: brickWidth,
          height: brickHeight,
          color: isStone ? "#64748B" : tier.color,
          glow: isStone ? "#94A3B8" : tier.glow,
          points: isStone ? 0 : tier.points * depthMultiplier,
          destroyed: false,
          isStone,
          hitsRequired: hits,
          hitsRemaining: hits,
        });
      }
    }
  }

  return bricks;
}
