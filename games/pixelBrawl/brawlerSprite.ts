import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";

export interface BrawlerPalette {
  giMain: string;       // Primary gi color (e.g. #DC2626 crimson / #2563EB royal blue)
  giShadow: string;     // Gi shadow tone (#991B1B / #1D4ED8)
  giHighlight: string;  // Gi highlight (#EF4444 / #3B82F6)
  hairMain: string;     // Hair color (#FACC15 blond / #1E293B black)
  hairShadow: string;   // Hair shadow (#CA8A04 / #0F172A)
  hairHighlight: string;// Hair highlight (#FEF08A / #334155)
  skinMain: string;     // Skin tone (#FED7AA)
  skinShadow: string;   // Skin shadow (#FDBA74)
  skinHighlight: string;// Skin highlight (#FFF7ED)
  gloveMain: string;    // Sparring gloves (#F59E0B / #DC2626)
  gloveShadow: string;  // Glove shadow (#D97706 / #991B1B)
  beltColor: string;    // Karate belt (#1E293B black)
  eyeColor: string;     // Eye iris (#38BDF8 cyan)
}

export const KEN_PALETTE: BrawlerPalette = {
  giMain: "#DC2626",
  giShadow: "#991B1B",
  giHighlight: "#F87171",
  hairMain: "#FACC15",
  hairShadow: "#CA8A04",
  hairHighlight: "#FEF08A",
  skinMain: "#FED7AA",
  skinShadow: "#FDBA74",
  skinHighlight: "#FFF7ED",
  gloveMain: "#EAB308",
  gloveShadow: "#CA8A04",
  beltColor: "#1E293B",
  eyeColor: "#38BDF8",
};

export const RYU_PALETTE: BrawlerPalette = {
  giMain: "#1E293B",
  giShadow: "#0F172A",
  giHighlight: "#334155",
  hairMain: "#334155",
  hairShadow: "#0F172A",
  hairHighlight: "#64748B",
  skinMain: "#FED7AA",
  skinShadow: "#FDBA74",
  skinHighlight: "#FFF7ED",
  gloveMain: "#DC2626",
  gloveShadow: "#991B1B",
  beltColor: "#F59E0B",
  eyeColor: "#93C5FD",
};

export type BrawlerAnimState =
  | "idle"
  | "walking"
  | "crouching"
  | "jumping"
  | "light_punch"
  | "heavy_punch"
  | "light_kick"
  | "heavy_kick"
  | "special"
  | "blocking"
  | "hitstun"
  | "knockdown";

/**
 * Draws the detailed Street Fighter Alpha / III pixel-art brawler sprite.
 */
export function drawBrawlerSprite(
  pr: PixelRenderer,
  x: number,
  y: number,
  state: BrawlerAnimState,
  frame: number,
  facing: 1 | -1,
  palette: BrawlerPalette
): void {
  pr.save();
  pr.translate(x, y);
  pr.scale(facing, 1);

  // Animation cycle calculations
  const idleBob = Math.sin(frame * 0.15) * 2;
  const walkBob = Math.sin(frame * 0.3) * 3;
  const walkLegCycle = Math.sin(frame * 0.3);

  switch (state) {
    case "idle":
      drawIdleStance(pr, idleBob, palette);
      break;
    case "walking":
      drawWalkStance(pr, walkBob, walkLegCycle, palette);
      break;
    case "crouching":
      drawCrouchStance(pr, palette);
      break;
    case "jumping":
      drawJumpStance(pr, frame, palette);
      break;
    case "light_punch":
      drawJabPunch(pr, frame, palette);
      break;
    case "heavy_punch":
      drawDragonUppercut(pr, frame, palette);
      break;
    case "light_kick":
      drawLowKick(pr, frame, palette);
      break;
    case "heavy_kick":
      drawRoundhouseKick(pr, frame, palette);
      break;
    case "special":
      drawHadoukenPose(pr, frame, palette);
      break;
    case "blocking":
      drawGuardStance(pr, palette);
      break;
    case "hitstun":
      drawHitStun(pr, frame, palette);
      break;
    case "knockdown":
      drawKnockdown(pr, frame, palette);
      break;
  }

  pr.restore();
}

/**
 * Common Head & Spiky Hair Renderer
 */
function drawBrawlerHead(
  pr: PixelRenderer,
  headX: number,
  headY: number,
  palette: BrawlerPalette,
  turnAngle: number = 0
): void {
  // 1. Spiky Voluminous Hair Back & Top
  pr.drawRect(headX - 14, headY - 26, 26, 16, palette.hairMain, true);
  pr.drawRect(headX - 16, headY - 24, 6, 18, palette.hairShadow, true); // Flowing back hair
  pr.drawRect(headX - 18, headY - 18, 4, 16, palette.hairShadow, true); // Tail spikes
  pr.drawRect(headX - 10, headY - 28, 18, 6, palette.hairHighlight, true); // Top spike highlights
  pr.drawRect(headX + 4, headY - 24, 8, 8, palette.hairHighlight, true);

  // 2. Muscular Neck
  pr.drawRect(headX - 6, headY - 4, 12, 10, palette.skinShadow, true);
  pr.drawRect(headX - 2, headY - 4, 8, 8, palette.skinMain, true);

  // 3. Face & Jaw
  pr.drawRect(headX - 8, headY - 14, 18, 14, palette.skinMain, true);
  pr.drawRect(headX + 2, headY - 14, 8, 12, palette.skinHighlight, true);
  pr.drawRect(headX + 4, headY - 4, 6, 4, palette.skinShadow, true); // Chiseled Jawline

  // 4. Forehead Bangs & Sideburns
  pr.drawRect(headX - 10, headY - 20, 16, 6, palette.hairMain, true);
  pr.drawRect(headX + 2, headY - 18, 6, 8, palette.hairMain, true); // Front bangs spike
  pr.drawRect(headX + 4, headY - 14, 4, 6, palette.hairHighlight, true);

  // 5. Eyebrow, Cyan Eye & Nose
  pr.drawRect(headX + 2, headY - 13, 6, 2, palette.hairShadow, true); // Determined Brow
  pr.drawRect(headX + 4, headY - 10, 3, 3, palette.eyeColor, true);   // Eye Iris
  pr.drawRect(headX + 5, headY - 10, 1, 3, "#000000", true);          // Pupil
  pr.drawRect(headX + 8, headY - 8, 3, 3, palette.skinShadow, true);  // Nose
  pr.drawRect(headX + 4, headY - 3, 5, 2, palette.skinShadow, true);  // Mouth
}

/**
 * 1. Idle Stance: Classic Ken/Ryu bounce stance with fist guard
 */
function drawIdleStance(pr: PixelRenderer, bob: number, palette: BrawlerPalette): void {
  const hy = -76 + bob;
  const ty = -54 + bob;

  // Head & Flowing Blond Hair
  drawBrawlerHead(pr, -2, hy, palette);

  // Muscular Torso & Red Sleeveless Gi Top
  pr.drawRect(-14, ty, 28, 26, palette.giMain, true);
  pr.drawRect(-16, ty + 2, 6, 22, palette.giShadow, true);
  pr.drawRect(-4, ty + 2, 16, 18, palette.giHighlight, true);

  // Exposed Muscular Chest & Collarbones (V-neck opening)
  pr.drawRect(-2, ty + 2, 10, 14, palette.skinMain, true);
  pr.drawRect(0, ty + 2, 6, 8, palette.skinHighlight, true);
  pr.drawRect(2, ty + 8, 6, 6, palette.skinShadow, true); // Pectoral definition

  // Black Knot Belt (Obi) with Hanging Ends
  pr.drawRect(-15, ty + 24, 30, 6, palette.beltColor, true);
  pr.drawRect(-2, ty + 28, 5, 14, palette.beltColor, true); // Hanging knot left
  pr.drawRect(3, ty + 28, 5, 18, palette.beltColor, true);  // Hanging knot right

  // Rear Guard Arm (Left Arm with Yellow Sparring Glove)
  pr.drawRect(-20, ty + 4, 8, 12, palette.skinShadow, true); // Shoulder
  pr.drawRect(-22, ty + 14, 8, 12, palette.skinMain, true);   // Forearm
  pr.drawRect(-24, ty + 22, 10, 10, palette.gloveMain, true); // Sparring Glove
  pr.drawRect(-24, ty + 22, 10, 3, palette.gloveShadow, true);// Glove Strap

  // Forward Guard Arm (Right Arm cocked forward in combat stance)
  pr.drawRect(6, ty + 4, 10, 12, palette.skinMain, true);    // Muscular Bicep
  pr.drawRect(10, ty + 4, 6, 10, palette.skinHighlight, true);
  pr.drawRect(12, ty + 12, 12, 8, palette.skinMain, true);   // Forearm
  pr.drawRect(18, ty + 8, 10, 12, palette.gloveMain, true);  // Front Fist
  pr.drawRect(20, ty + 10, 6, 8, palette.gloveShadow, true);

  // Baggy Karate Gi Pants (Crimson Red with ragged torn cuffs)
  const py = ty + 28;
  // Left Leg (Rear)
  pr.drawRect(-18, py, 14, 26, palette.giShadow, true);
  pr.drawRect(-20, py + 22, 16, 6, palette.giMain, true); // Ragged cuff

  // Right Leg (Forward)
  pr.drawRect(0, py, 16, 26, palette.giMain, true);
  pr.drawRect(4, py + 2, 10, 20, palette.giHighlight, true);
  pr.drawRect(-2, py + 22, 18, 6, palette.giShadow, true); // Ragged cuff

  // Bare Feet (Planted wide in fighting stance)
  // Rear Foot
  pr.drawRect(-24, 0 - 6, 16, 6, palette.skinShadow, true);
  pr.drawRect(-26, 0 - 4, 6, 4, palette.skinMain, true); // Heel/Toes
  // Front Foot
  pr.drawRect(4, 0 - 6, 18, 6, palette.skinMain, true);
  pr.drawRect(12, 0 - 6, 10, 6, palette.skinHighlight, true);
  pr.drawRect(16, 0 - 4, 6, 4, palette.skinShadow, true); // Defined toes
}

/**
 * 2. Walking Stance: Dynamic stride with sliding footwork
 */
function drawWalkStance(pr: PixelRenderer, bob: number, legPhase: number, palette: BrawlerPalette): void {
  const hy = -76 + bob;
  const ty = -54 + bob;

  drawBrawlerHead(pr, 0, hy, palette);

  // Torso angled in stride
  pr.drawRect(-12, ty, 26, 26, palette.giMain, true);
  pr.drawRect(-14, ty + 2, 6, 22, palette.giShadow, true);
  pr.drawRect(-2, ty + 2, 10, 14, palette.skinMain, true);

  // Black Belt
  pr.drawRect(-13, ty + 24, 28, 6, palette.beltColor, true);
  pr.drawRect(2 + legPhase * 4, ty + 28, 5, 14, palette.beltColor, true);

  // Arms swaying with stride
  const armSwing = legPhase * 10;
  pr.drawRect(-18 - armSwing, ty + 8, 8, 14, palette.skinShadow, true);
  pr.drawRect(-20 - armSwing, ty + 18, 10, 10, palette.gloveMain, true);

  pr.drawRect(10 + armSwing, ty + 8, 8, 14, palette.skinMain, true);
  pr.drawRect(14 + armSwing, ty + 14, 10, 10, palette.gloveMain, true);

  // Striding Legs
  const legShift = legPhase * 12;
  const py = ty + 28;
  pr.drawRect(-16 - legShift, py, 14, 24, palette.giShadow, true);
  pr.drawRect(0 + legShift, py, 14, 24, palette.giMain, true);

  // Feet
  pr.drawRect(-20 - legShift, 0 - 6, 16, 6, palette.skinShadow, true);
  pr.drawRect(2 + legShift, 0 - 6, 16, 6, palette.skinMain, true);
}

/**
 * 3. Crouching Stance: Ducking low with defensive guard
 */
function drawCrouchStance(pr: PixelRenderer, palette: BrawlerPalette): void {
  const hy = -52;
  const ty = -36;

  drawBrawlerHead(pr, 2, hy, palette);

  // Compact Torso
  pr.drawRect(-12, ty, 26, 20, palette.giMain, true);
  pr.drawRect(-2, ty + 2, 8, 10, palette.skinMain, true);

  // Belt
  pr.drawRect(-14, ty + 18, 28, 6, palette.beltColor, true);

  // Guard Arms Held Tight
  pr.drawRect(8, ty + 2, 12, 8, palette.skinMain, true);
  pr.drawRect(14, ty - 2, 10, 12, palette.gloveMain, true);

  // Bent Crouched Knees & Baggy Pants
  pr.drawRect(-18, ty + 20, 36, 14, palette.giMain, true);
  pr.drawRect(-16, ty + 22, 14, 12, palette.giShadow, true);

  // Feet Flat on Floor
  pr.drawRect(-22, 0 - 6, 18, 6, palette.skinShadow, true);
  pr.drawRect(6, 0 - 6, 18, 6, palette.skinMain, true);
}

/**
 * 4. Jumping Stance: Aerial tuck with fighting kick angle
 */
function drawJumpStance(pr: PixelRenderer, frame: number, palette: BrawlerPalette): void {
  const hy = -84;
  const ty = -62;

  drawBrawlerHead(pr, 4, hy, palette);

  // Torso
  pr.drawRect(-12, ty, 26, 24, palette.giMain, true);
  pr.drawRect(-2, ty + 2, 10, 12, palette.skinMain, true);
  pr.drawRect(-14, ty + 22, 28, 6, palette.beltColor, true);

  // Arms angled upward in jump
  pr.drawRect(-18, ty - 8, 8, 16, palette.skinShadow, true);
  pr.drawRect(-20, ty - 16, 10, 10, palette.gloveMain, true);

  pr.drawRect(10, ty - 6, 8, 16, palette.skinMain, true);
  pr.drawRect(14, ty - 14, 10, 10, palette.gloveMain, true);

  // Tucked Jumping Legs (High Flying Stance)
  pr.drawRect(-16, ty + 24, 14, 18, palette.giShadow, true);
  pr.drawRect(4, ty + 24, 18, 14, palette.giMain, true); // Extended front knee

  pr.drawRect(-18, ty + 40, 14, 6, palette.skinShadow, true);
  pr.drawRect(16, ty + 34, 14, 6, palette.skinMain, true);
}

/**
 * 5. Jab / Light Punch: Snapping straight punch with extended glove
 */
function drawJabPunch(pr: PixelRenderer, frame: number, palette: BrawlerPalette): void {
  const hy = -76;
  const ty = -54;

  drawBrawlerHead(pr, 2, hy, palette);

  // Torso Lunging Forward
  pr.drawRect(-10, ty, 28, 26, palette.giMain, true);
  pr.drawRect(0, ty + 2, 12, 12, palette.skinMain, true);
  pr.drawRect(-12, ty + 24, 30, 6, palette.beltColor, true);

  // Rear Arm Held Tight at Chest
  pr.drawRect(-18, ty + 8, 10, 10, palette.skinShadow, true);
  pr.drawRect(-16, ty + 12, 10, 10, palette.gloveMain, true);

  // Fully Extended Straight Punch!
  const ext = Math.min(38, frame * 14);
  pr.drawRect(12, ty + 6, ext, 10, palette.skinMain, true);        // Muscular Arm
  pr.drawRect(12 + ext, ty + 4, 14, 14, palette.gloveMain, true);   // Glove Fist
  pr.drawRect(12 + ext, ty + 6, 14, 4, palette.gloveShadow, true); // Glove detail

  // Forward Lunge Stance
  const py = ty + 28;
  pr.drawRect(-18, py, 14, 26, palette.giShadow, true);
  pr.drawRect(4, py, 18, 26, palette.giMain, true);

  pr.drawRect(-24, 0 - 6, 16, 6, palette.skinShadow, true);
  pr.drawRect(12, 0 - 6, 20, 6, palette.skinMain, true);
}

/**
 * 6. Heavy Punch / Dragon Uppercut (Shoryuken!): Rising flaming uppercut
 */
function drawDragonUppercut(pr: PixelRenderer, frame: number, palette: BrawlerPalette): void {
  const hy = -88;
  const ty = -64;

  drawBrawlerHead(pr, -4, hy, palette);

  // Arched Torso in Uppercut Motion
  pr.drawRect(-12, ty, 26, 28, palette.giMain, true);
  pr.drawRect(-4, ty + 2, 12, 14, palette.skinMain, true);
  pr.drawRect(-14, ty + 26, 28, 6, palette.beltColor, true);

  // Rear Hand Swung Down
  pr.drawRect(-20, ty + 14, 8, 14, palette.skinShadow, true);
  pr.drawRect(-22, ty + 24, 10, 10, palette.gloveMain, true);

  // Rising Skyward Fist!
  pr.drawRect(4, ty - 18, 12, 24, palette.skinMain, true);       // Extended Upward Arm
  pr.drawRect(4, ty - 32, 14, 16, palette.gloveMain, true);      // Rising Fist

  // Fiery Dragon Aura & Flame Particles around fist!
  pr.drawCircle(11, ty - 32, 16, "rgba(245, 158, 11, 0.4)", true);
  pr.drawCircle(11, ty - 32, 10, "#F59E0B", true);
  pr.drawCircle(11, ty - 32, 5, "#FEF08A", true);

  // Deep Knee Drive / Launching Pose
  const py = ty + 30;
  pr.drawRect(-16, py, 14, 24, palette.giShadow, true);
  pr.drawRect(2, py - 6, 16, 28, palette.giMain, true); // High Driving Knee

  pr.drawRect(-20, 0 - 6, 16, 6, palette.skinShadow, true);
  pr.drawRect(6, py + 22, 14, 6, palette.skinMain, true);
}

/**
 * 7. Low Kick / Light Kick: Fast snapping front kick
 */
function drawLowKick(pr: PixelRenderer, frame: number, palette: BrawlerPalette): void {
  const hy = -74;
  const ty = -52;

  drawBrawlerHead(pr, -2, hy, palette);

  // Torso
  pr.drawRect(-12, ty, 26, 26, palette.giMain, true);
  pr.drawRect(-2, ty + 2, 10, 12, palette.skinMain, true);
  pr.drawRect(-14, ty + 24, 28, 6, palette.beltColor, true);

  // Guard Arms
  pr.drawRect(6, ty + 4, 10, 10, palette.skinMain, true);
  pr.drawRect(12, ty + 6, 10, 10, palette.gloveMain, true);

  // Planted Rear Leg
  pr.drawRect(-16, ty + 28, 14, 24, palette.giShadow, true);
  pr.drawRect(-20, 0 - 6, 16, 6, palette.skinShadow, true);

  // Extended Snapping Shin Kick!
  const kickExt = Math.min(36, frame * 12);
  pr.drawRect(0, ty + 30, kickExt, 12, palette.giMain, true);      // Kicking Leg
  pr.drawRect(kickExt, ty + 32, 16, 8, palette.skinMain, true);     // Foot/Toes
}

/**
 * 8. High Roundhouse Kick (Tatsumaki / Hurricane Kick): Full extension flying kick
 */
function drawRoundhouseKick(pr: PixelRenderer, frame: number, palette: BrawlerPalette): void {
  const hy = -76;
  const ty = -54;

  drawBrawlerHead(pr, -8, hy, palette);

  // Torso Angled Sideways in Kick
  pr.drawRect(-16, ty, 26, 26, palette.giMain, true);
  pr.drawRect(-6, ty + 2, 10, 12, palette.skinMain, true);
  pr.drawRect(-18, ty + 24, 28, 6, palette.beltColor, true);

  // Guard Arms Counter-Balancing
  pr.drawRect(-24, ty + 4, 10, 10, palette.skinShadow, true);
  pr.drawRect(-26, ty + 10, 10, 10, palette.gloveMain, true);

  // Planted Leg
  pr.drawRect(-18, ty + 28, 14, 26, palette.giShadow, true);
  pr.drawRect(-24, 0 - 6, 16, 6, palette.skinShadow, true);

  // High Roundhouse Kick Extended at Head Height!
  const kExt = Math.min(46, frame * 14);
  pr.drawRect(0, ty + 4, kExt, 14, palette.giMain, true);
  pr.drawRect(kExt, ty + 2, 18, 12, palette.skinMain, true); // Extended Bare Foot
  pr.drawRect(kExt + 10, ty + 4, 8, 8, palette.skinHighlight, true);

  // Speed Motion Arc Trail Lines
  pr.drawLine(kExt - 10, ty + 20, kExt + 16, ty, "rgba(255, 255, 255, 0.6)", 2);
  pr.drawLine(kExt - 14, ty + 26, kExt + 12, ty + 6, "rgba(245, 158, 11, 0.4)", 2);
}

/**
 * 9. Special Move: Hadouken / Plasma Energy Blast Pose
 */
function drawHadoukenPose(pr: PixelRenderer, frame: number, palette: BrawlerPalette): void {
  const hy = -72;
  const ty = -50;

  drawBrawlerHead(pr, 4, hy, palette);

  // Deep Forward Stance Torso
  pr.drawRect(-8, ty, 28, 26, palette.giMain, true);
  pr.drawRect(2, ty + 2, 12, 12, palette.skinMain, true);
  pr.drawRect(-10, ty + 24, 30, 6, palette.beltColor, true);

  // Cupped Forward Thrusting Hands (Hadouken Blast)
  pr.drawRect(12, ty + 4, 20, 10, palette.skinMain, true);
  pr.drawRect(12, ty + 14, 20, 10, palette.skinMain, true);
  pr.drawRect(28, ty + 2, 14, 12, palette.gloveMain, true);
  pr.drawRect(28, ty + 12, 14, 12, palette.gloveMain, true);

  // Glowing Plasma Ball in Palm
  pr.drawCircle(44, ty + 13, 16, "rgba(56, 189, 248, 0.5)", true);
  pr.drawCircle(44, ty + 13, 11, "#38BDF8", true);
  pr.drawCircle(44, ty + 13, 5, "#FFFFFF", true);

  // Deep Stance Legs
  const py = ty + 28;
  pr.drawRect(-20, py, 16, 24, palette.giShadow, true);
  pr.drawRect(4, py, 20, 24, palette.giMain, true);

  pr.drawRect(-26, 0 - 6, 18, 6, palette.skinShadow, true);
  pr.drawRect(14, 0 - 6, 20, 6, palette.skinMain, true);
}

/**
 * 10. Guarding / Blocking Stance
 */
function drawGuardStance(pr: PixelRenderer, palette: BrawlerPalette): void {
  const hy = -74;
  const ty = -52;

  drawBrawlerHead(pr, -4, hy, palette);

  // Torso Turned Side Guard
  pr.drawRect(-14, ty, 26, 26, palette.giMain, true);
  pr.drawRect(-16, ty + 24, 28, 6, palette.beltColor, true);

  // Crossed Arm Guard Barrier
  pr.drawRect(0, ty - 4, 12, 22, palette.skinMain, true);
  pr.drawRect(6, ty - 8, 12, 24, palette.skinMain, true);
  pr.drawRect(2, ty - 12, 14, 14, palette.gloveMain, true);
  pr.drawRect(8, ty - 2, 14, 14, palette.gloveMain, true);

  // Guard Sparks
  pr.drawCircle(18, ty, 6, "rgba(56, 189, 248, 0.4)", true);
  pr.drawCircle(18, ty, 3, "#38BDF8", true);

  // Sturdy Base Legs
  const py = ty + 28;
  pr.drawRect(-18, py, 14, 24, palette.giShadow, true);
  pr.drawRect(0, py, 16, 24, palette.giMain, true);

  pr.drawRect(-24, 0 - 6, 16, 6, palette.skinShadow, true);
  pr.drawRect(4, 0 - 6, 18, 6, palette.skinMain, true);
}

/**
 * 11. Hit Stun / Damage Recoil Stance
 */
function drawHitStun(pr: PixelRenderer, frame: number, palette: BrawlerPalette): void {
  const hy = -76;
  const ty = -54;

  // Head Thrown Back
  drawBrawlerHead(pr, -12, hy - 4, palette);

  // Torso Stumbling Backwards
  pr.drawRect(-18, ty, 26, 26, palette.giMain, true);
  pr.drawRect(-8, ty + 2, 10, 12, palette.skinMain, true);
  pr.drawRect(-20, ty + 24, 28, 6, palette.beltColor, true);

  // Arms Flailing from Impact
  pr.drawRect(-26, ty - 6, 10, 16, palette.skinShadow, true);
  pr.drawRect(-28, ty - 14, 10, 10, palette.gloveMain, true);

  pr.drawRect(2, ty + 8, 12, 12, palette.skinMain, true);
  pr.drawRect(10, ty + 12, 10, 10, palette.gloveMain, true);

  // Stumbling Legs
  const py = ty + 28;
  pr.drawRect(-24, py, 14, 24, palette.giShadow, true);
  pr.drawRect(-6, py, 14, 24, palette.giMain, true);

  pr.drawRect(-28, 0 - 6, 16, 6, palette.skinShadow, true);
  pr.drawRect(-4, 0 - 6, 16, 6, palette.skinMain, true);
}

/**
 * 12. Knockout / Defeat Fall Pose
 */
function drawKnockdown(pr: PixelRenderer, frame: number, palette: BrawlerPalette): void {
  // Lying Flat on Canvas Floor
  pr.drawRect(-36, -14, 72, 14, palette.giMain, true);
  pr.drawRect(-44, -18, 18, 14, palette.hairMain, true); // Hair on floor
  pr.drawRect(-40, -14, 14, 10, palette.skinMain, true); // Face
  pr.drawRect(-20, -18, 10, 8, palette.gloveMain, true); // Arm dropped
  pr.drawRect(18, -14, 18, 12, palette.giShadow, true);
  pr.drawRect(34, -10, 14, 8, palette.skinMain, true);   // Feet
}
