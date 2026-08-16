import type { Renderer } from "./Renderer";
import type { PixelRenderer } from "./PixelRenderer";

/**
 * Draws the high-detail futuristic fighter spaceship from the reference sprite.
 * @param renderer Renderer or PixelRenderer instance
 * @param cx Center X coordinate
 * @param cy Center Y coordinate
 * @param size Width/Height bounding box size (default 36)
 * @param angleRad Rotation angle in radians (0 = pointing UP)
 * @param primaryColor Main energy conduit color (default #00F0FF)
 */
export function drawSpaceshipSprite(
  renderer: Renderer,
  cx: number,
  cy: number,
  size: number = 36,
  angleRad: number = 0,
  primaryColor: string = "#00F0FF"
): void {
  const pr = renderer as PixelRenderer;

  pr.save();
  pr.translate(cx, cy);
  if (angleRad !== 0) {
    pr.rotate(angleRad);
  }

  const s = size / 36; // Scale relative to base 36x36 pixel grid

  // 1. Rear Plasma Thruster Flame (Green/Cyan Exhaust)
  pr.drawRect(-5 * s, 14 * s, 10 * s, 4 * s, "#22C55E", true);
  pr.drawRect(-3 * s, 16 * s, 6 * s, 4 * s, primaryColor, true);

  // 2. Swept Delta Wings (Dark Slate & White Armor Plates)
  // Left Wing Body
  pr.drawRect(-16 * s, 4 * s, 8 * s, 12 * s, "#334155", true);
  pr.drawRect(-18 * s, 8 * s, 6 * s, 8 * s, "#E2E8F0", true);
  // Left Wing Radiator Grilles
  pr.drawRect(-14 * s, 6 * s, 2 * s, 8 * s, primaryColor, true);
  pr.drawRect(-11 * s, 7 * s, 2 * s, 6 * s, primaryColor, true);

  // Right Wing Body
  pr.drawRect(8 * s, 4 * s, 8 * s, 12 * s, "#334155", true);
  pr.drawRect(12 * s, 8 * s, 6 * s, 8 * s, "#E2E8F0", true);
  // Right Wing Radiator Grilles
  pr.drawRect(12 * s, 6 * s, 2 * s, 8 * s, primaryColor, true);
  pr.drawRect(9 * s, 7 * s, 2 * s, 6 * s, primaryColor, true);

  // 3. Wing Chevron Accents (White Specular Plates)
  pr.drawRect(-10 * s, 10 * s, 4 * s, 4 * s, "#FFFFFF", true);
  pr.drawRect(6 * s, 10 * s, 4 * s, 4 * s, "#FFFFFF", true);

  // 4. Twin Upper Nacelles / Conduits (Left & Right)
  // Left Nacelle
  pr.drawRect(-10 * s, -12 * s, 4 * s, 14 * s, "#E2E8F0", true);
  pr.drawRect(-9 * s, -14 * s, 3 * s, 4 * s, "#0284C7", true); // Blue cap
  pr.drawRect(-9 * s, -8 * s, 2 * s, 6 * s, primaryColor, true);

  // Right Nacelle
  pr.drawRect(6 * s, -12 * s, 4 * s, 14 * s, "#E2E8F0", true);
  pr.drawRect(6 * s, -14 * s, 3 * s, 4 * s, "#0284C7", true); // Blue cap
  pr.drawRect(7 * s, -8 * s, 2 * s, 6 * s, primaryColor, true);

  // 5. Central Main Fuselage
  pr.drawRect(-6 * s, -8 * s, 12 * s, 22 * s, "#CBD5E1", true);
  pr.drawRect(-4 * s, -12 * s, 8 * s, 8 * s, "#F8FAFC", true);
  pr.drawRect(-2 * s, -16 * s, 4 * s, 6 * s, "#FFFFFF", true); // Nose tip

  // 6. Glowing Blue Crystalline Cockpit Canopy
  pr.drawRect(-3 * s, -10 * s, 6 * s, 10 * s, primaryColor, true);
  pr.drawRect(-2 * s, -8 * s, 4 * s, 6 * s, "#BAE6FD", true);
  pr.drawRect(-1 * s, -7 * s, 2 * s, 3 * s, "#FFFFFF", true); // Glass glint

  // 7. Central Power Core Conduit
  pr.drawRect(-2 * s, 2 * s, 4 * s, 8 * s, "#0284C7", true);
  pr.drawRect(-1 * s, 4 * s, 2 * s, 5 * s, primaryColor, true);

  pr.restore();
}
