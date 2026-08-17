import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";

/**
 * Draws the purple dreadnought boss villain ship from the user's reference image.
 * Features:
 * - Dual elongated purple/magenta pincer spires with amber radiator grilles
 * - Central luminous amber oval power core / cockpit
 * - Swept rear armor plating with orange stabilizer trim
 * - Heavy titanium engine thruster assembly
 */
export function drawPurpleBossShip(
  pr: PixelRenderer,
  cx: number,
  cy: number,
  size: number = 88,
  hpPct: number = 1.0,
  animTime: number = 0
): void {
  pr.save();
  pr.translate(cx, cy);

  const s = size / 88; // Base unit scale

  // 1. Central Titanium Engine Thruster Housing
  pr.drawCircle(0, 24 * s, 14 * s, "#1E293B", true);
  pr.drawCircle(0, 24 * s, 10 * s, "#334155", true);
  pr.drawCircle(0, 24 * s, 6 * s, "#0F172A", true);
  pr.drawCircle(0, 24 * s, 3 * s, "#FFFFFF", true);

  // Engine exhaust flames
  const flameH = (8 + Math.sin(animTime * 20) * 4) * s;
  pr.drawRect(-8 * s, 34 * s, 16 * s, flameH, "#F59E0B", true);
  pr.drawRect(-4 * s, 34 * s, 8 * s, flameH * 0.7, "#FEF08A", true);

  // 2. Rear Outer Swept Wings & Stabilizers
  // Left rear stabilizer
  pr.drawRect(-36 * s, 10 * s, 14 * s, 20 * s, "#7E22CE", true);
  pr.drawRect(-42 * s, 18 * s, 10 * s, 12 * s, "#6B21A8", true);
  pr.drawRect(-40 * s, 22 * s, 8 * s, 6 * s, "#F59E0B", true); // Orange wing tip

  // Right rear stabilizer
  pr.drawRect(22 * s, 10 * s, 14 * s, 20 * s, "#7E22CE", true);
  pr.drawRect(32 * s, 18 * s, 10 * s, 12 * s, "#6B21A8", true);
  pr.drawRect(32 * s, 22 * s, 8 * s, 6 * s, "#F59E0B", true);  // Orange wing tip

  // 3. Main Purple / Magenta Fuselage Hull
  pr.drawRect(-26 * s, -10 * s, 52 * s, 36 * s, "#A855F7", true);
  pr.drawRect(-28 * s, 4 * s, 56 * s, 20 * s, "#9333EA", true);
  pr.drawRect(-20 * s, 0 * s, 40 * s, 24 * s, "#C084FC", true); // Highlight hull

  // Side Air Intake Vents
  pr.drawRect(-20 * s, 6 * s, 8 * s, 12 * s, "#3B0764", true);
  pr.drawRect(12 * s, 6 * s, 8 * s, 12 * s, "#3B0764", true);

  // 4. Dual Forward Pincer Spires (Left & Right Spire Prows)
  // Left Spire
  pr.drawRect(-18 * s, -42 * s, 12 * s, 44 * s, "#A855F7", true);
  pr.drawRect(-16 * s, -40 * s, 4 * s, 38 * s, "#C084FC", true);  // Spire bevel
  pr.drawRect(-10 * s, -34 * s, 4 * s, 24 * s, "#F59E0B", true);  // Amber inner radiator
  pr.drawRect(-9 * s, -30 * s, 2 * s, 18 * s, "#FEF08A", true);   // Glowing heat core

  // Right Spire
  pr.drawRect(6 * s, -42 * s, 12 * s, 44 * s, "#A855F7", true);
  pr.drawRect(12 * s, -40 * s, 4 * s, 38 * s, "#C084FC", true);  // Spire bevel
  pr.drawRect(6 * s, -34 * s, 4 * s, 24 * s, "#F59E0B", true);   // Amber inner radiator
  pr.drawRect(7 * s, -30 * s, 2 * s, 18 * s, "#FEF08A", true);   // Glowing heat core

  // 5. Central Amber Oval Cockpit / Core Reactor
  const pulse = Math.sin(animTime * 8) * 1.5 * s;
  pr.drawCircle(0, -4 * s, (10 * s) + pulse, "#D97706", true);
  pr.drawCircle(0, -4 * s, (8 * s) + pulse, "#F59E0B", true);
  pr.drawCircle(0, -4 * s, (5 * s) + pulse, "#FEF08A", true);
  pr.drawCircle(-2 * s, -6 * s, 2 * s, "#FFFFFF", true); // Glint

  // 6. Energy Forcefield Shield (Visible when damaged/shielded)
  if (hpPct > 0.6) {
    pr.drawCircle(0, 0, 48 * s, "rgba(192, 132, 252, 0.2)", false);
  } else if (hpPct > 0.25) {
    pr.drawCircle(0, 0, 48 * s, "rgba(245, 158, 11, 0.25)", false);
  } else {
    // Critical Overheat Red Barrier
    pr.drawCircle(0, 0, 48 * s, "rgba(239, 68, 68, 0.4)", false);
  }

  pr.restore();
}
