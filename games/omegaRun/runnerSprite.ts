import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";

/**
 * Draws the athletic runner character seen from behind (POV from behind),
 * matching the user's reference image:
 * - Short brown hair with neck shading
 * - Bright orange athletic sports t-shirt with back muscle shading & light blue sleeve trim
 * - Navy blue gym shorts with white side stripes
 * - Muscular legs in running sprint motion
 * - High white athletic socks
 * - Red/orange running sneakers with white soles
 */
export function drawRunnerBehindSprite(
  pr: PixelRenderer,
  cx: number,
  cy: number,
  scale: number = 1.0,
  animTime: number = 0,
  isJumping: boolean = false,
  isSliding: boolean = false
): void {
  pr.save();
  pr.translate(cx, cy);
  pr.scale(scale, scale);

  if (isSliding) {
    drawSlidingPose(pr);
    pr.restore();
    return;
  }

  if (isJumping) {
    drawJumpingPose(pr, animTime);
    pr.restore();
    return;
  }

  // Running Stride Cycle (-1 to 1)
  const runFreq = 14;
  const phase = Math.sin(animTime * runFreq);
  const cosPhase = Math.cos(animTime * runFreq);
  const bob = Math.abs(Math.sin(animTime * runFreq)) * 4;

  const ty = -62 + bob; // Torso Y

  // 1. Head & Hair (from behind)
  // Short Brown Hair
  pr.drawRect(-9, ty - 22, 18, 16, "#78350F", true);
  pr.drawRect(-11, ty - 20, 22, 12, "#9A3412", true);
  pr.drawRect(-6, ty - 24, 12, 6, "#B45309", true); // Crown highlight
  pr.drawRect(-8, ty - 12, 16, 6, "#451A03", true);  // Nape shadow

  // Muscular Neck
  pr.drawRect(-5, ty - 8, 10, 10, "#FDBA74", true);
  pr.drawRect(-3, ty - 8, 6, 8, "#FED7AA", true);

  // 2. Orange Athletic Sports T-Shirt (Muscular Back from Behind)
  // Main Shirt Body
  pr.drawRect(-15, ty, 30, 26, "#EA580C", true);
  pr.drawRect(-17, ty + 2, 4, 22, "#C2410C", true); // Left shadow
  pr.drawRect(13, ty + 2, 4, 22, "#C2410C", true);  // Right shadow
  pr.drawRect(-10, ty + 2, 20, 18, "#F97316", true); // Center highlight
  pr.drawRect(-6, ty + 4, 12, 12, "#FB923C", true);  // Upper back highlight

  // Spine & Shoulder Blade Creases
  pr.drawRect(-1, ty + 4, 2, 18, "#C2410C", true); // Spine seam
  pr.drawRect(-9, ty + 6, 4, 8, "#C2410C", true);  // Left blade
  pr.drawRect(5, ty + 6, 4, 8, "#C2410C", true);   // Right blade

  // Light Blue Sleeve Trim / Cuffs
  pr.drawRect(-18, ty + 2, 4, 8, "#93C5FD", true);
  pr.drawRect(14, ty + 2, 4, 8, "#93C5FD", true);

  // 3. Athletic Bare Arms Swinging (Opposite to Leg Stride)
  const armSwing = phase * 10;
  // Left Arm (Swings Up/Down)
  pr.drawRect(-23, ty + 4 - armSwing, 6, 14, "#FDBA74", true);
  pr.drawRect(-26, ty + 12 - armSwing * 1.3, 8, 8, "#FED7AA", true); // Fist

  // Right Arm (Swings Counter)
  pr.drawRect(17, ty + 4 + armSwing, 6, 14, "#FDBA74", true);
  pr.drawRect(18, ty + 12 + armSwing * 1.3, 8, 8, "#FED7AA", true); // Fist

  // 4. Navy Blue Athletic Shorts with White Side Stripes
  const py = ty + 24;
  pr.drawRect(-16, py, 32, 18, "#1E293B", true);
  pr.drawRect(-14, py + 2, 28, 14, "#334155", true);
  // White Side Stripes (from image)
  pr.drawRect(-16, py + 2, 2, 14, "#FFFFFF", true);
  pr.drawRect(14, py + 2, 2, 14, "#FFFFFF", true);
  // Center Crotch Inset
  pr.drawRect(-2, py + 10, 4, 8, "#0F172A", true);

  // 5. Running Legs, White Socks & Red Sneakers in Full Sprint
  const legShift = phase * 14;
  const legLiftL = Math.max(0, -cosPhase * 12);
  const legLiftR = Math.max(0, cosPhase * 12);

  // Left Leg (Behind / Sprinting)
  pr.drawRect(-15 - legShift * 0.4, py + 16 - legLiftL, 9, 14, "#FDBA74", true); // Thigh/Calf
  // White Athletic Sock
  pr.drawRect(-15 - legShift * 0.4, py + 28 - legLiftL, 9, 6, "#FFFFFF", true);
  pr.drawRect(-15 - legShift * 0.4, py + 30 - legLiftL, 9, 2, "#94A3B8", true);
  // Red/Orange Running Sneaker with White Sole
  pr.drawRect(-17 - legShift * 0.5, py + 34 - legLiftL, 12, 6, "#DC2626", true);
  pr.drawRect(-17 - legShift * 0.5, py + 38 - legLiftL, 13, 3, "#FFFFFF", true); // White Sole

  // Right Leg (Behind / Sprinting)
  pr.drawRect(6 + legShift * 0.4, py + 16 - legLiftR, 9, 14, "#FDBA74", true); // Thigh/Calf
  // White Athletic Sock
  pr.drawRect(6 + legShift * 0.4, py + 28 - legLiftR, 9, 6, "#FFFFFF", true);
  pr.drawRect(6 + legShift * 0.4, py + 30 - legLiftR, 9, 2, "#94A3B8", true);
  // Red/Orange Running Sneaker with White Sole
  pr.drawRect(5 + legShift * 0.5, py + 34 - legLiftR, 12, 6, "#DC2626", true);
  pr.drawRect(5 + legShift * 0.5, py + 38 - legLiftR, 13, 3, "#FFFFFF", true); // White Sole

  pr.restore();
}

/**
 * Jumping Hurdle Pose
 */
function drawJumpingPose(pr: PixelRenderer, animTime: number): void {
  const ty = -74;

  // Head
  pr.drawRect(-9, ty - 22, 18, 16, "#78350F", true);
  pr.drawRect(-11, ty - 20, 22, 12, "#9A3412", true);
  pr.drawRect(-5, ty - 8, 10, 10, "#FDBA74", true);

  // Orange Shirt
  pr.drawRect(-15, ty, 30, 26, "#EA580C", true);
  pr.drawRect(-10, ty + 2, 20, 18, "#F97316", true);

  // Arms Raised for Balance
  pr.drawRect(-26, ty - 8, 8, 18, "#FDBA74", true);
  pr.drawRect(-28, ty - 16, 8, 8, "#FED7AA", true);
  pr.drawRect(18, ty - 8, 8, 18, "#FDBA74", true);
  pr.drawRect(20, ty - 16, 8, 8, "#FED7AA", true);

  // Shorts
  pr.drawRect(-16, ty + 24, 32, 16, "#1E293B", true);
  pr.drawRect(-16, ty + 26, 2, 12, "#FFFFFF", true);
  pr.drawRect(14, ty + 26, 2, 12, "#FFFFFF", true);

  // Tucked Jumping Legs (High Clearance)
  pr.drawRect(-18, ty + 38, 12, 10, "#FDBA74", true);
  pr.drawRect(6, ty + 34, 14, 10, "#FDBA74", true);

  // White Socks & Red Shoes Tucked Up
  pr.drawRect(-20, ty + 46, 12, 4, "#FFFFFF", true);
  pr.drawRect(-22, ty + 49, 14, 6, "#DC2626", true);
  pr.drawRect(-22, ty + 53, 14, 2, "#FFFFFF", true);

  pr.drawRect(16, ty + 42, 12, 4, "#FFFFFF", true);
  pr.drawRect(16, ty + 45, 14, 6, "#DC2626", true);
  pr.drawRect(16, ty + 49, 14, 2, "#FFFFFF", true);
}

/**
 * Sliding Tackle Pose (Low Clearance)
 */
function drawSlidingPose(pr: PixelRenderer): void {
  const ty = -32;

  // Head Ducked Low
  pr.drawRect(-8, ty - 16, 16, 14, "#78350F", true);
  pr.drawRect(-4, ty - 4, 8, 8, "#FDBA74", true);

  // Torso Leaning Forward Flat
  pr.drawRect(-16, ty, 32, 18, "#EA580C", true);
  pr.drawRect(-12, ty + 2, 24, 12, "#F97316", true);

  // Arms Bracing Near Ground
  pr.drawRect(-24, ty + 6, 8, 12, "#FDBA74", true);
  pr.drawRect(16, ty + 6, 8, 12, "#FDBA74", true);

  // Shorts Angled
  pr.drawRect(-14, ty + 16, 28, 12, "#1E293B", true);
  pr.drawRect(-14, ty + 18, 2, 8, "#FFFFFF", true);

  // Extended Sliding Leg
  pr.drawRect(10, ty + 18, 24, 8, "#FDBA74", true);
  pr.drawRect(30, ty + 18, 8, 6, "#FFFFFF", true);
  pr.drawRect(36, ty + 16, 12, 8, "#DC2626", true);
  pr.drawRect(36, ty + 22, 12, 2, "#FFFFFF", true);

  // Folded Knee Leg
  pr.drawRect(-18, ty + 20, 16, 8, "#FDBA74", true);
  pr.drawRect(-22, ty + 22, 8, 6, "#DC2626", true);
}
