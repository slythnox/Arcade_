import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";

export interface KartPalette {
  cap: string;
  capDark: string;
  capHighlight: string;
  shirt: string;
  shirtShadow: string;
  overalls: string;
  overallsShadow: string;
  hair: string;
  kartBody: string;
  kartBodyDark: string;
  kartTrim: string;
  exhaust: string;
}

export const KART_PALETTES: Record<string, KartPalette> = {
  red: {
    cap: "#EF4444",
    capDark: "#991B1B",
    capHighlight: "#FCA5A5",
    shirt: "#DC2626",
    shirtShadow: "#7F1D1D",
    overalls: "#2563EB",
    overallsShadow: "#1E3A8A",
    hair: "#451A03",
    kartBody: "#DC2626",
    kartBodyDark: "#7F1D1D",
    kartTrim: "#FFFFFF",
    exhaust: "#E2E8F0",
  },
  green: {
    cap: "#22C55E",
    capDark: "#166534",
    capHighlight: "#86EFAC",
    shirt: "#16A34A",
    shirtShadow: "#14532D",
    overalls: "#1D4ED8",
    overallsShadow: "#1E3A8A",
    hair: "#451A03",
    kartBody: "#16A34A",
    kartBodyDark: "#14532D",
    kartTrim: "#FFFFFF",
    exhaust: "#E2E8F0",
  },
  blue: {
    cap: "#00F0FF",
    capDark: "#0369A1",
    capHighlight: "#BAE6FD",
    shirt: "#0284C7",
    shirtShadow: "#075985",
    overalls: "#F8FAFC",
    overallsShadow: "#94A3B8",
    hair: "#1E293B",
    kartBody: "#0284C7",
    kartBodyDark: "#075985",
    kartTrim: "#FACC15",
    exhaust: "#E2E8F0",
  },
  yellow: {
    cap: "#FACC15",
    capDark: "#A16207",
    capHighlight: "#FEF08A",
    shirt: "#EAB308",
    shirtShadow: "#854D0E",
    overalls: "#7E22CE",
    overallsShadow: "#581C87",
    hair: "#451A03",
    kartBody: "#EAB308",
    kartBodyDark: "#854D0E",
    kartTrim: "#A855F7",
    exhaust: "#E2E8F0",
  },
};

/**
 * Draws the high-detail Rear-View Pixel Kart matching the reference image.
 */
export function drawRearViewKart(
  pr: PixelRenderer,
  x: number,
  y: number,
  scale: number,
  steerLean: number,
  palette: KartPalette,
  isDrifting: boolean = false,
  driftTier: number = 0,
  isBoosting: boolean = false,
  animTime: number = 0
): void {
  pr.save();
  pr.translate(x, y);
  pr.scale(scale, scale);

  const bounce = Math.sin(animTime * 24) * (isBoosting ? 2.5 : 1.2);
  const roll = steerLean * 0.12;
  pr.rotate(roll);

  // 1. Rear Tires (Wide Racing Slicks with Tread & Silver Rims)
  // Left Tire
  pr.drawRect(-36, -2 + bounce, 14, 24, "#090D16", true);
  pr.drawRect(-34, 0 + bounce, 10, 20, "#1E293B", true);
  pr.drawRect(-31, 5 + bounce, 4, 10, "#64748B", true);
  pr.drawRect(-30, 8 + bounce, 2, 4, "#FACC15", true); // Gold Nut

  // Right Tire
  pr.drawRect(22, -2 + bounce, 14, 24, "#090D16", true);
  pr.drawRect(24, 0 + bounce, 10, 20, "#1E293B", true);
  pr.drawRect(27, 5 + bounce, 4, 10, "#64748B", true);
  pr.drawRect(28, 8 + bounce, 2, 4, "#FACC15", true);

  // 2. Wide Kart Rear Chassis & Bumper
  pr.drawRect(-26, 4 + bounce, 52, 16, palette.kartBodyDark, true);
  pr.drawRect(-24, 2 + bounce, 48, 14, palette.kartBody, true);
  pr.drawRect(-24, 2 + bounce, 48, 3, palette.capHighlight, true); // Top Highlight Glint

  // Metal Engine Block & Exhaust Manifold
  pr.drawRect(-18, 6 + bounce, 36, 12, "#334155", true);
  pr.drawRect(-16, 8 + bounce, 32, 8, "#0F172A", true);
  // Radiator cooling ribs
  for (let rx = -14; rx <= 14; rx += 4) {
    pr.drawRect(rx, 9 + bounce, 2, 6, "#64748B", true);
  }

  // Twin Chrome Exhaust Pipes
  pr.drawRect(-20, 14 + bounce, 6, 8, "#E2E8F0", true);
  pr.drawRect(-19, 18 + bounce, 4, 4, "#0F172A", true);
  pr.drawRect(14, 14 + bounce, 6, 8, "#E2E8F0", true);
  pr.drawRect(15, 18 + bounce, 4, 4, "#0F172A", true);

  // Exhaust Sputter Flames when accelerating/boosting
  if (isBoosting || Math.random() < 0.25) {
    const flameH = isBoosting ? 14 + Math.random() * 8 : 6 + Math.random() * 4;
    pr.drawCircle(-17, 22 + bounce + flameH / 2, flameH / 3, isBoosting ? "#00F0FF" : "#F97316", true);
    pr.drawCircle(-17, 20 + bounce, 2, "#FFFFFF", true);
    pr.drawCircle(17, 22 + bounce + flameH / 2, flameH / 3, isBoosting ? "#00F0FF" : "#F97316", true);
    pr.drawCircle(17, 20 + bounce, 2, "#FFFFFF", true);
  }

  // 3. Driver Back View (Red shirt, blue overalls with brass buttons)
  const headX = steerLean * 4;

  // Shoulders & Shirt
  pr.drawRect(-16 + headX, -20 + bounce, 32, 20, palette.shirtShadow, true);
  pr.drawRect(-14 + headX, -22 + bounce, 28, 18, palette.shirt, true);
  pr.drawRect(-14 + headX, -22 + bounce, 28, 3, palette.capHighlight, true);

  // Blue Overalls Straps
  pr.drawRect(-11 + headX, -16 + bounce, 7, 20, palette.overallsShadow, true);
  pr.drawRect(-10 + headX, -17 + bounce, 6, 19, palette.overalls, true);
  pr.drawRect(4 + headX, -16 + bounce, 7, 20, palette.overallsShadow, true);
  pr.drawRect(4 + headX, -17 + bounce, 6, 19, palette.overalls, true);

  // Brass Buckles
  pr.drawCircle(-7 + headX, -5 + bounce, 2.5, "#FACC15", true);
  pr.drawCircle(-7 + headX, -5 + bounce, 1, "#FFFFFF", true);
  pr.drawCircle(7 + headX, -5 + bounce, 2.5, "#FACC15", true);
  pr.drawCircle(7 + headX, -5 + bounce, 1, "#FFFFFF", true);

  // 4. Driver Head & Red Cap with 3D Visor
  // Hair
  pr.drawRect(-12 + headX, -32 + bounce, 24, 12, palette.hair, true);
  pr.drawCircle(-10 + headX, -26 + bounce, 3, palette.hair, true);
  pr.drawCircle(10 + headX, -26 + bounce, 3, palette.hair, true);

  // Cap Dome & Shading
  pr.drawCircle(0 + headX, -36 + bounce, 14, palette.capDark, true);
  pr.drawCircle(0 + headX, -38 + bounce, 13, palette.cap, true);
  pr.drawCircle(-4 + headX, -41 + bounce, 6, palette.capHighlight, true); // Glint

  // Curved Cap Brim Visor
  pr.drawRect(-14 + headX, -33 + bounce, 28, 5, palette.capDark, true);
  pr.drawRect(-12 + headX, -34 + bounce, 24, 4, palette.cap, true);

  // 5. Drift Sparks on Rear Tires
  if (isDrifting && driftTier > 0) {
    const sparkCol = driftTier === 1 ? "#00F0FF" : driftTier === 2 ? "#F97316" : "#C084FC";
    for (let i = 0; i < 3; i++) {
      const sx1 = -38 + (Math.random() - 0.5) * 12;
      const sy1 = 12 + Math.random() * 8;
      pr.drawCircle(sx1, sy1, 2 + Math.random() * 3, sparkCol, true);

      const sx2 = 38 + (Math.random() - 0.5) * 12;
      const sy2 = 12 + Math.random() * 8;
      pr.drawCircle(sx2, sy2, 2 + Math.random() * 3, sparkCol, true);
    }
  }

  pr.restore();
}
