import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";

/**
 * Pixel-Perfect recreation of the user's uploaded Quad-Rotor Drone image.
 * Color Palette:
 *  - Dark Outline: #2E293A
 *  - Outer Teal Duct Rim: #5D8A90 / #7EA5A9 (highlight) / #3D636A (shadow)
 *  - Duct Interior / Fan Blades: #EAE3D9 / #D5C5B1
 *  - Center Bone/Beige Fuselage: #D5C5B1 / #E8DEC0 (top) / #BAA898 (shadow)
 *  - Front Red Visor: #D84654 / #F48B96
 *  - Sensor Lenses: #FFFFFF
 *  - Bottom Camera Pod: #5D8A90 / #D84654
 */

export function drawPixelDrone(
  pr: PixelRenderer,
  cx: number,
  cy: number,
  angle: number,
  scale: number = 1.0,
  animTime: number = 0,
  isPlayer: boolean = false
): void {
  pr.save();
  pr.translate(cx, cy);
  pr.rotate(angle);
  pr.scale(scale, scale);

  const bladeSpin = (animTime * 40) % (Math.PI * 2);

  // Exact colors from image (or player variant)
  const OUTLINE = "#2E293A";
  const TEAL_LIGHT = isPlayer ? "#38BDF8" : "#7EA5A9";
  const TEAL_BASE = isPlayer ? "#0284C7" : "#5D8A90";
  const TEAL_DARK = isPlayer ? "#0369A1" : "#3D636A";
  const BODY_BASE = isPlayer ? "#F8FAFC" : "#D5C5B1";
  const BODY_LIGHT = isPlayer ? "#FFFFFF" : "#E8DEC0";
  const BODY_DARK = isPlayer ? "#CBD5E1" : "#BAA898";
  const VISOR_RED = isPlayer ? "#00F0FF" : "#D84654";
  const SENSOR_DOT = isPlayer ? "#FFFFFF" : "#FFFFFF";

  // 1. Connecting Strut Arms (Diagonal struts from body to the 4 rings)
  // Top-left strut
  pr.drawRect(-12, -10, 8, 5, OUTLINE, true);
  pr.drawRect(-11, -9, 6, 3, BODY_DARK, true);

  // Top-right strut
  pr.drawRect(4, -10, 8, 5, OUTLINE, true);
  pr.drawRect(5, -9, 6, 3, BODY_DARK, true);

  // Bottom-left strut
  pr.drawRect(-12, 5, 8, 5, OUTLINE, true);
  pr.drawRect(-11, 6, 6, 3, BODY_DARK, true);

  // Bottom-right strut
  pr.drawRect(4, 5, 8, 5, OUTLINE, true);
  pr.drawRect(5, 6, 6, 3, BODY_DARK, true);

  // 2. The 4 Ducted Rotor Rings (Top-Left, Top-Right, Bottom-Left, Bottom-Right)
  const ringCenters = [
    { x: -14, y: -12 }, // Top Left
    { x: 14, y: -12 },  // Top Right
    { x: -14, y: 12 },  // Bottom Left
    { x: 14, y: 12 },   // Bottom Right
  ];

  for (const rc of ringCenters) {
    // Outer Dark Pixel Outline Ring (Diameter ~18px)
    pr.drawCircle(rc.x, rc.y, 9.5, OUTLINE, true);

    // Teal Outer Ducted Fan Casing
    pr.drawCircle(rc.x, rc.y, 8.5, TEAL_BASE, true);
    // Upper Highlight Arc
    pr.drawCircle(rc.x, rc.y - 1, 7.5, TEAL_LIGHT, true);
    // Inner Shadow
    pr.drawCircle(rc.x, rc.y, 6.5, TEAL_DARK, true);

    // Fan Duct Hollow Center (Cream interior)
    pr.drawCircle(rc.x, rc.y, 5.5, BODY_BASE, true);
    pr.drawCircle(rc.x, rc.y, 4.5, "#EAE3D9", true);

    // Spinning Rotor Blades
    pr.save();
    pr.translate(rc.x, rc.y);
    pr.rotate(bladeSpin);
    // Dual Cross Blades matching pixel art
    pr.drawLine(-4, 0, 4, 0, BODY_DARK, 2);
    pr.drawLine(0, -4, 0, 4, BODY_DARK, 2);
    pr.drawLine(-4, 0, 4, 0, "#FFFFFF", 1);
    pr.drawLine(0, -4, 0, 4, "#FFFFFF", 1);
    pr.drawCircle(0, 0, 1.5, OUTLINE, true);
    pr.restore();
  }

  // 3. Central Bone/Beige Fuselage Body (Exact silhouette matching image)
  // Main Body Outer Silhouette
  pr.drawRect(-9, -8, 18, 20, OUTLINE, true);

  // Body Base Fill
  pr.drawRect(-8, -7, 16, 18, BODY_BASE, true);
  // Upper Curved Highlight
  pr.drawRect(-6, -7, 12, 10, BODY_LIGHT, true);
  // Left/Right Side Shading
  pr.drawRect(-8, -7, 2, 18, BODY_DARK, true);
  pr.drawRect(6, -7, 2, 18, BODY_DARK, true);

  // Top Collar Indent
  pr.drawRect(-4, -9, 8, 3, OUTLINE, true);
  pr.drawRect(-3, -8, 6, 2, TEAL_DARK, true);

  // 4. Front Red Sensor Visor (Near bottom of chassis)
  pr.drawRect(-8, 5, 16, 6, OUTLINE, true);
  pr.drawRect(-7, 6, 14, 4, VISOR_RED, true);
  // Top Visor Highlight Line
  pr.drawRect(-7, 6, 14, 1, isPlayer ? "#FFFFFF" : "#F48B96", true);
  // Dual White Sensor Eyes
  pr.drawRect(-4, 7, 2, 2, SENSOR_DOT, true);
  pr.drawRect(2, 7, 2, 2, SENSOR_DOT, true);

  // 5. Bottom Gimbal Camera Probe Pod
  pr.drawRect(-3, 11, 6, 5, OUTLINE, true);
  pr.drawRect(-2, 12, 4, 3, TEAL_BASE, true);
  pr.drawRect(-1, 13, 2, 1, VISOR_RED, true);

  pr.restore();
}
