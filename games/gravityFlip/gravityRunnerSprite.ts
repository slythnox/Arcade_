import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";

/**
 * Pixel-exact renderer for the Gravity Runner character matching user's reference image:
 * - Swept-back spiky brown hair with golden blonde top highlight
 * - Fair peach skin with expressive cyan eyes and side blush
 * - Emerald green tunic with bright teal chest plate
 * - Dark brown running boots with animated stride cycle
 */
export function drawGravityRunner(
  renderer: Renderer,
  cx: number,
  cy: number,
  gravityDir: number = 1, // 1 = normal (standing on floor), -1 = inverted (running on ceiling)
  animTime: number = 0,
  isGrounded: boolean = true,
  scale: number = 2.4
): void {
  const pr = renderer as PixelRenderer;
  const ctx2d = (pr as any).getContext?.() as CanvasRenderingContext2D | undefined;

  pr.save();
  pr.translate(cx, cy);

  // Invert vertically when running on ceiling
  if (gravityDir === -1) {
    pr.scale(1, -1);
  }

  // Running bobbing bounce
  const runBob = isGrounded ? Math.abs(Math.sin(animTime * 14)) * 3 : 0;
  pr.translate(0, -runBob);

  const ps = scale; // Pixel unit scale

  // Helper to draw a pixel block relative to center (-9 to +9 x, -12 to +12 y)
  const drawPix = (x: number, y: number, w: number, h: number, color: string) => {
    pr.drawRect((x - 8) * ps, (y - 10) * ps, w * ps, h * ps, color, true);
  };

  // --- 1. SASH / BACK STRAP (Dark Teal / Forest Green) ---
  drawPix(1, 7, 2, 2, "#1B4D3E");
  drawPix(2, 8, 2, 3, "#2E8B57");
  drawPix(3, 10, 2, 2, "#1B4D3E");

  // --- 2. HAIR & HEAD BASE ---
  // Dark Brown Outer Hair / Spikes (Left Windswept Spikes)
  drawPix(0, 2, 3, 2, "#5C241C");
  drawPix(0, 5, 3, 2, "#5C241C");
  drawPix(2, 1, 14, 2, "#5C241C"); // Top crown hair outline
  drawPix(1, 3, 4, 6, "#8B3A2B");  // Back hair body

  // Top Golden Blonde Highlight Band (Reference Image)
  drawPix(4, 2, 11, 3, "#F6D06F");
  drawPix(5, 3, 9, 1, "#FEF08A");  // Inner bright shine

  // Mid Brown Hair Layer & Bangs
  drawPix(3, 4, 3, 3, "#B8662D");
  drawPix(6, 4, 8, 2, "#B8662D");
  drawPix(11, 5, 2, 3, "#B8662D"); // Right forehead bang

  // Right Hair Outline
  drawPix(15, 2, 2, 8, "#5C241C");

  // --- 3. FACE & SKIN ---
  // Fair Peach Skin Base
  drawPix(4, 6, 11, 7, "#FAD2C0");

  // Left Shadow / Blush (Reference Image)
  drawPix(4, 6, 2, 4, "#F3B3A2");
  drawPix(5, 7, 2, 3, "#C0566A"); // Deep blush spot

  // --- 4. EXPRESSIVE CYAN PIXEL EYES ---
  // Left Eye
  drawPix(6, 6, 3, 1, "#1E293B");  // Eyebrow/lash
  drawPix(6, 7, 1, 3, "#1E293B");  // Left pupil border
  drawPix(7, 7, 2, 3, "#00C3E3");  // Cyan iris
  drawPix(7, 7, 1, 2, "#FFFFFF");  // Eye glint

  // Right Eye
  drawPix(13, 6, 3, 1, "#1E293B"); // Eyebrow/lash
  drawPix(13, 7, 1, 3, "#1E293B"); // Pupil border
  drawPix(14, 7, 2, 3, "#00C3E3"); // Cyan iris
  drawPix(14, 7, 1, 2, "#FFFFFF"); // Eye glint

  // Chin / Jawline
  drawPix(14, 11, 2, 2, "#5C241C"); // Mouth/chin notch

  // --- 5. GREEN TUNIC / BODY ---
  // Collar / Dark Neck Border
  drawPix(4, 12, 11, 2, "#2D1212");

  // Dark Forest Green Shirt Outline
  drawPix(4, 13, 10, 6, "#065F46");

  // Bright Emerald/Teal Chest Plate (Reference Image)
  drawPix(6, 14, 6, 4, "#10B981");
  drawPix(7, 15, 4, 2, "#34D399");

  // --- 6. LEGS & BOOTS (ANIMATED STRIDE CYCLE) ---
  const stride = isGrounded ? Math.sin(animTime * 18) * 4 : 2;

  // Left Leg / Boot
  drawPix(5 + stride, 18, 4, 3, "#451A1A");
  drawPix(6 + stride, 20, 3, 2, "#2D1212");

  // Right Leg / Boot
  drawPix(11 - stride, 18, 4, 3, "#451A1A");
  drawPix(12 - stride, 20, 3, 2, "#2D1212");

  pr.restore();
}
