/** ARCADE_ v1.2.2 */
import type { GameDefinition } from "../types";

export const hotlapDefinition: GameDefinition = {
  id: "hotlap",
  slug: "hotlap",
  name: "Hotlap",
  platform: "arcade",
  genre: "racing",
  era: "1990s",
  year: 1994,
  tags: ["Racing", "Formula", "Time Trial", "Physics", "Ghost Replay", "Telemetry", "Vector Kinematics"],
  tagline: "Precision Formula time-trial racing with vector tire kinematics and ghost replays.",
  description:
    "Master 10 distinct circuits against the clock. Features authentic lateral tire grip simulation, oversteer/understeer mechanics, spline checkpoint interpolation, live sector delta telemetry, and real-time ghost playback.",
  difficulty: "hard",
  players: "single",
  category: "arcade",
  subcategory: "racing",
  estimatedPlayTime: "5–20 min",
  thumbnail: {
    src: "/assets/thumbnails/hotlap.png",
    alt: "Hotlap Formula Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "← / → / A / D", description: "Steer Left / Right" },
      { key: "↑ / W / SPACE", description: "Throttle / Accelerate" },
      { key: "↓ / S", description: "Brake / Reverse" },
      { key: "Z / SHIFT", description: "Handbrake / Power-Slide" },
      { key: "ENTER", description: "Cycle Next Circuit (1–10)" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart Lap" },
    ],
    touch: "On-screen steering dial + Accel & Brake pedals",
    gamepad: "Left Analog Stick / D-Pad to Steer, R2 / A to Accelerate, L2 / B to Brake, X for Handbrake",
  },
  seo: {
    title: "Play Hotlap Online — Top-Down Formula Time-Trial Racer",
    description:
      "Play Hotlap free in browser with true 2D vector tire physics, Catmull-Rom spline circuits, real-time ghost replays, and live sector delta telemetry.",
    keywords: ["hotlap", "formula racing game", "top down racer", "time trial racing", "ghost car game", "vector physics racing"],
  },
  math: {
    title: "Mathematics & Mechanics of Hotlap",
    summary:
      "Hotlap models continuous 2D vector kinematics, orthogonal velocity decomposition into longitudinal and lateral frames, Catmull-Rom spline arc-length parametrization, and temporal replay interpolation.",
    concepts: [
      {
        name: "Vector Velocity Decomposition",
        description:
          "The car's velocity \\mathbf{v} is projected into local longitudinal (forward \\hat{\\mathbf{h}}) and lateral (orthogonal \\hat{\\mathbf{n}}) components: v_{\\text{long}} = \\mathbf{v} \\cdot \\hat{\\mathbf{h}}, \\quad v_{\\text{lat}} = \\mathbf{v} \\cdot \\hat{\\mathbf{n}}.",
        formula: "\\mathbf{v} = (\\mathbf{v} \\cdot \\hat{\\mathbf{h}})\\hat{\\mathbf{h}} + (\\mathbf{v} \\cdot \\hat{\\mathbf{n}})\\hat{\\mathbf{n}}",
      },
      {
        name: "Lateral Tire Traction & Slip Angle",
        description:
          "Lateral velocity decays proportionally to surface grip \\mu (Asphalt: 0.94, Kerb: 0.72, Grass: 0.35). When \\|v_{\\text{lat}}\\| exceeds threshold limits, the car slips into an oversteer power-slide, depositing skid marks and tire smoke.",
        formula: "v_{\\text{lat}}' = v_{\\text{lat}}(1 - \\mu \\cdot k \\cdot \\Delta t)",
      },
      {
        name: "Aerodynamic Quadratic Drag",
        description:
          "Air resistance opposing vehicle motion scales with the square of velocity: F_{\\text{drag}} = -c_{\\text{drag}} \\cdot v \\cdot |v|.",
        formula: "F_{\\text{drag}} = -c_{\\text{drag}} v_{\\text{long}} |v_{\\text{long}}|",
      },
      {
        name: "Catmull-Rom Spline Projection",
        description:
          "The track centerline is a closed C^1-continuous Catmull-Rom spline. Car lap progress t \\in [0, 1] is computed by minimizing distance to the continuous curve: t = \\operatorname{argmin}_u \\|\\mathbf{P} - \\mathbf{C}(u)\\|^2.",
        formula: "t = \\operatorname{argmin}_{u \\in [0, 1]} \\|\\mathbf{P} - \\mathbf{C}(u)\\|^2",
      },
    ],
  },
  createGame: async () => {
    const { HotlapGame } = await import("../hotlap/HotlapGame");
    return new HotlapGame();
  },
};
