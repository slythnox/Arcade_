import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";

/**
 * Procedural Pixel-Art Tile & Sprite Engine for Diamond Rush.
 * Faithfully replicates the iconic Gameloft Angkor Wat / Inca temple art style:
 * - Carved Mayan/Inca stone masonry
 * - Ancient Meditating Buddha Statue Altar with candles
 * - Lush green jungle vine wall backdrops & foliage bushes
 * - Huge brilliant purple cut amethyst diamonds
 * - Carved Stone Face Boulders (Rock Heads)
 * - Golden & Red lacquered Treasure Chests
 * - Detailed Adventurer Explorer character with fedora & blue shirt
 */

/**
 * 1. Carved Ancient Temple Stone Masonry Wall
 */
export function drawTempleWallTile(
  pr: PixelRenderer,
  x: number,
  y: number,
  size: number = 16,
  world: number = 1
): void {
  // Base sandstone / temple masonry
  const stoneBase = world === 2 ? "#3D5A40" : world === 3 ? "#3A6073" : world === 4 ? "#5C2C29" : "#8C7B5D";
  const stoneLight = world === 2 ? "#588157" : world === 3 ? "#5C9EAD" : world === 4 ? "#8B433E" : "#B8A88A";
  const stoneDark = world === 2 ? "#283618" : world === 3 ? "#1F3540" : world === 4 ? "#3A1B19" : "#5A4E3A";
  const mossGreen = "#4D7C0F";

  pr.drawRect(x, y, size, size, stoneBase, true);

  // Top and Left beveled highlights
  pr.drawRect(x, y, size, 2, stoneLight, true);
  pr.drawRect(x, y, 2, size, stoneLight, true);

  // Bottom and Right chisel shadows
  pr.drawRect(x, y + size - 2, size, 2, stoneDark, true);
  pr.drawRect(x + size - 2, y, 2, size, stoneDark, true);

  // Carved Brick Mortar Grooves
  pr.drawRect(x + 2, y + Math.floor(size / 2), size - 4, 1, stoneDark, true);
  pr.drawRect(x + Math.floor(size / 2), y + 2, 1, Math.floor(size / 2) - 2, stoneDark, true);

  // Moss spots
  if ((x + y) % 3 === 0) {
    pr.drawRect(x + 2, y + size - 4, 3, 2, mossGreen, true);
  }
}

/**
 * 2. Dense Green Jungle Vine Wall Backdrop
 */
export function drawJungleVineBackdrop(
  pr: PixelRenderer,
  x: number,
  y: number,
  size: number = 16
): void {
  // Dark temple moss mortar background
  pr.drawRect(x, y, size, size, "#0F291E", true);

  // Entangled twisting vines
  pr.drawRect(x + 2, y, 3, size, "#047857", true);
  pr.drawRect(x + size - 5, y, 3, size, "#065F46", true);
  pr.drawRect(x, y + 4, size, 2, "#10B981", true);
  pr.drawRect(x, y + size - 6, size, 2, "#047857", true);

  // Leaf sprouts
  pr.drawRect(x + 5, y + 2, 3, 3, "#34D399", true);
  pr.drawRect(x + size - 7, y + 8, 3, 3, "#10B981", true);
}

/**
 * 3. Lush Green Foliage Bush (Clearable / Cuttable)
 */
export function drawJungleBush(
  pr: PixelRenderer,
  x: number,
  y: number,
  size: number = 16
): void {
  // Multi-layered lush leaves
  pr.drawCircle(x + size / 2, y + size / 2, size / 2 - 1, "#047857", true);
  pr.drawCircle(x + size / 2, y + size / 2, size / 2 - 3, "#10B981", true);
  pr.drawCircle(x + size / 2 - 2, y + size / 2 - 2, size / 3 - 1, "#34D399", true);
  pr.drawCircle(x + size / 2 + 2, y + size / 2 + 1, size / 4, "#6EE7B7", true);
  // Leaf vein accents
  pr.drawLine(x + 3, y + size / 2, x + size - 3, y + size / 2, "#064E3B", 1);
  pr.drawLine(x + size / 2, y + 3, x + size / 2, y + size - 3, "#064E3B", 1);
}

/**
 * 4. Huge Brilliant Purple Cut Amethyst Diamond (from screenshot)
 */
export function drawPurpleAmethystDiamond(
  pr: PixelRenderer,
  x: number,
  y: number,
  size: number = 16,
  pulse: number = 0
): void {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = (size / 2 - 1) + Math.sin(pulse) * 0.6;

  // Faceted Amethyst Diamond Jewel
  pr.drawCircle(cx, cy, r, "#7E22CE", true);           // Base deep violet
  pr.drawCircle(cx, cy, r - 1.5, "#9333EA", true);     // Mid purple
  pr.drawCircle(cx - 1, cy - 1, r - 3, "#C084FC", true);// Facet shine
  pr.drawCircle(cx - 2, cy - 2, r - 4.5, "#E879F9", true);

  // Geometric Diamond Highlight Glint
  pr.drawRect(cx - 3, cy - 3, 3, 3, "#FFFFFF", true);
  pr.drawRect(cx + 1, cy + 1, 2, 2, "#FEF08A", true);

  // Diamond Facet Cut Lines
  pr.drawLine(cx - r + 2, cy, cx + r - 2, cy, "rgba(255, 255, 255, 0.4)", 1);
  pr.drawLine(cx, cy - r + 2, cx, cy + r - 2, "rgba(255, 255, 255, 0.4)", 1);
}

/**
 * 5. Carved Inca/Mayan Stone Face Boulder (Rock Head)
 */
export function drawCarvedFaceBoulder(
  pr: PixelRenderer,
  x: number,
  y: number,
  size: number = 16,
  angle: number = 0
): void {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size / 2 - 1;

  pr.save();
  pr.translate(cx, cy);
  if (angle !== 0) pr.rotate(angle);

  // Round Stone Boulder Sphere
  pr.drawCircle(0, 0, r, "#78716C", true);
  pr.drawCircle(0, 0, r - 1.5, "#A8A29E", true);
  pr.drawCircle(-1.5, -1.5, r - 3, "#D6D3D1", true);

  // Carved Mayan Face Features (from screenshot)
  // Eyes
  pr.drawRect(-4, -3, 2, 2, "#44403C", true);
  pr.drawRect(2, -3, 2, 2, "#44403C", true);
  // Brow ridge
  pr.drawLine(-5, -4, 4, -4, "#57534E", 1);
  // Broad Nose
  pr.drawRect(-1, -2, 2, 4, "#57534E", true);
  // Chiseled Mouth / Lips
  pr.drawRect(-3, 3, 6, 2, "#44403C", true);
  pr.drawRect(-2, 3, 4, 1, "#78716C", true);

  pr.restore();
}

/**
 * 6. Golden & Red Lacquered Treasure Chest (from screenshot)
 */
export function drawTreasureChest(
  pr: PixelRenderer,
  x: number,
  y: number,
  size: number = 16
): void {
  // Red lacquered chest box
  pr.drawRect(x + 1, y + 2, size - 2, size - 4, "#DC2626", true);
  pr.drawRect(x + 2, y + 3, size - 4, size - 6, "#EF4444", true);

  // Gold Trim Borders
  pr.drawRect(x + 1, y + 2, size - 2, 2, "#F59E0B", true);
  pr.drawRect(x + 1, y + size - 4, size - 2, 2, "#F59E0B", true);
  pr.drawRect(x + 1, y + 2, 2, size - 4, "#F59E0B", true);
  pr.drawRect(x + size - 3, y + 2, 2, size - 4, "#F59E0B", true);

  // Central Gold Circular Keyhole Lock
  pr.drawCircle(x + size / 2, y + size / 2, 3, "#FDE047", true);
  pr.drawCircle(x + size / 2, y + size / 2, 1.5, "#78350F", true);
}

/**
 * 7. Meditating Ancient Buddha / Inca Deity Altar (Top Temple Feature)
 */
export function drawBuddhaAltar(
  pr: PixelRenderer,
  x: number,
  y: number,
  width: number = 48,
  height: number = 32
): void {
  const cx = x + width / 2;

  // Stone Pedestal
  pr.drawRect(x, y + height - 8, width, 8, "#78716C", true);
  pr.drawRect(x + 2, y + height - 8, width - 4, 2, "#A8A29E", true);

  // Golden Robe Meditating Buddha Body
  pr.drawRect(cx - 10, y + 10, 20, 14, "#F59E0B", true);
  pr.drawRect(cx - 8, y + 12, 16, 10, "#FDE047", true);
  // Folded legs
  pr.drawRect(cx - 14, y + 18, 28, 6, "#D97706", true);

  // Stone Head with Topknot
  pr.drawCircle(cx, y + 6, 6, "#A8A29E", true);
  pr.drawCircle(cx, y + 1, 2.5, "#78716C", true); // Topknot
  pr.drawRect(cx - 3, y + 5, 2, 1, "#44403C", true); // Closed serene eyes
  pr.drawRect(cx + 1, y + 5, 2, 1, "#44403C", true);

  // Lit Ritual Candles / Torches on sides
  // Left Candle
  pr.drawRect(x + 4, y + 10, 2, 14, "#F5F5F4", true);
  pr.drawCircle(x + 5, y + 8, 2.5, "#EF4444", true);
  pr.drawCircle(x + 5, y + 8, 1, "#FEF08A", true);

  // Right Candle
  pr.drawRect(x + width - 6, y + 10, 2, 14, "#F5F5F4", true);
  pr.drawCircle(x + width - 5, y + 8, 2.5, "#EF4444", true);
  pr.drawCircle(x + width - 5, y + 8, 1, "#FEF08A", true);
}

/**
 * 8. Diamond Rush Adventurer Explorer Character Sprite (from screenshot)
 */
export function drawDiamondRushExplorer(
  pr: PixelRenderer,
  x: number,
  y: number,
  width: number = 14,
  height: number = 18,
  facing: "left" | "right" = "right",
  animFrame: number = 0,
  isWalking: boolean = false,
  isClimbing: boolean = false,
  isPushing: boolean = false
): void {
  pr.save();
  pr.translate(x + width / 2, y + height);
  if (facing === "left") pr.scale(-1, 1);

  const bob = isWalking ? Math.abs(Math.sin(animFrame * 12)) * 1.5 : 0;
  const legPhase = isWalking ? Math.sin(animFrame * 12) : 0;

  const ty = -height + bob; // Torso Y

  // 1. Khaki Safari Fedora Hat
  pr.drawRect(-7, ty - 5, 14, 3, "#A8A29E", true);  // Hat brim
  pr.drawRect(-5, ty - 9, 10, 4, "#D6D3D1", true);  // Crown
  pr.drawRect(-5, ty - 6, 10, 1, "#78716C", true);  // Hat band

  // 2. Head & Blond / Brown Spiky Hair Fringe
  pr.drawRect(-4, ty - 2, 8, 6, "#FED7AA", true);   // Face
  pr.drawRect(-5, ty - 3, 4, 3, "#FDE047", true);   // Hair bangs
  pr.drawRect(1, ty - 2, 2, 2, "#2563EB", true);    // Blue Eye

  // 3. Blue Explorer Adventurer Shirt (from screenshot)
  pr.drawRect(-5, ty + 4, 10, 8, "#2563EB", true);
  pr.drawRect(-4, ty + 5, 8, 6, "#38BDF8", true);   // Shirt highlight
  pr.drawRect(-2, ty + 4, 4, 3, "#FED7AA", true);   // Collar / chest

  // 4. Arms (Swinging or Pushing)
  if (isPushing) {
    pr.drawRect(4, ty + 4, 6, 3, "#FED7AA", true);  // Pushing arms forward
    pr.drawRect(8, ty + 3, 3, 4, "#B45309", true);  // Leather glove
  } else {
    const armSwing = legPhase * 3;
    pr.drawRect(-7, ty + 5 - armSwing, 3, 5, "#2563EB", true);
    pr.drawRect(-8, ty + 9 - armSwing, 3, 3, "#FED7AA", true); // Left hand
    pr.drawRect(4, ty + 5 + armSwing, 3, 5, "#2563EB", true);
    pr.drawRect(5, ty + 9 + armSwing, 3, 3, "#FED7AA", true);  // Right hand
  }

  // 5. Khaki Trousers & Brown Boots
  const py = ty + 11;
  pr.drawRect(-5, py, 10, 3, "#78350F", true);      // Leather belt

  const legShift = legPhase * 3;
  // Left Leg
  pr.drawRect(-5 - legShift, py + 3, 4, 4, "#B8A88A", true);
  pr.drawRect(-6 - legShift, py + 6, 5, 3, "#78350F", true); // Boot

  // Right Leg
  pr.drawRect(1 + legShift, py + 3, 4, 4, "#B8A88A", true);
  pr.drawRect(0 + legShift, py + 6, 5, 3, "#78350F", true);  // Boot

  pr.restore();
}
