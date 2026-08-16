/** ARCADE_ v1.2.2 */
import type { CircuitDefinition } from "./types";

export const HOTLAP_CIRCUITS: CircuitDefinition[] = [
  // ── Track 01: Emerald Circuit (Flowing Parkland) ──
  {
    id: "track-01",
    name: "Track 01 — Emerald Circuit",
    subtitle: "Fast flowing parkland sweeps with high-speed apexes",
    lengthMeters: 3820,
    width: 140,
    gravityFactor: 1.0,
    baseGrip: 0.94,
    theme: "emerald",
    colors: {
      asphalt: "#232833",
      asphaltDark: "#1b202a",
      grass: "#163a1e",
      grassDark: "#112c17",
      kerbRed: "#ff3d5a",
      kerbWhite: "#ffffff",
      barrier: "#4b5975",
      line: "#f0f4fc",
      accent: "#4de8e8",
    },
    startPos: { x: 400, y: 1200, angle: 0 },
    points: [
      { x: 400, y: 1200 },
      { x: 1400, y: 1200 }, // Main Straight
      { x: 1900, y: 1100 },
      { x: 2300, y: 700 },  // Turn 1 Sweeper
      { x: 2100, y: 300 },
      { x: 1500, y: 250 },  // Back Straight
      { x: 1000, y: 400 },
      { x: 600, y: 200 },   // S-Chicane
      { x: 300, y: 500 },
      { x: 500, y: 850 },   // Hairpin entry
      { x: 250, y: 1050 },  // Final Turn
    ],
  },

  // ── Track 02: Neon Harbor (Urban Docklands) ──
  {
    id: "track-02",
    name: "Track 02 — Neon Harbor",
    subtitle: "Sharp 90° dockland corners and high-precision braking",
    lengthMeters: 4150,
    width: 130,
    gravityFactor: 1.0,
    baseGrip: 0.92,
    theme: "neon",
    colors: {
      asphalt: "#181d28",
      asphaltDark: "#11151f",
      grass: "#0b172a",
      grassDark: "#08101e",
      kerbRed: "#ff5c8a",
      kerbWhite: "#4de8e8",
      barrier: "#2a3d60",
      line: "#4de8e8",
      accent: "#ff5c8a",
    },
    startPos: { x: 400, y: 1400, angle: 0 },
    points: [
      { x: 400, y: 1400 },
      { x: 1600, y: 1400 }, // Harbor Straight
      { x: 1600, y: 900 },  // 90° Turn 1
      { x: 2100, y: 900 },
      { x: 2100, y: 300 },  // Warehouse 90° Turn 2
      { x: 1200, y: 300 },
      { x: 1200, y: 650 },
      { x: 700, y: 650 },   // Crane Alley
      { x: 700, y: 300 },
      { x: 250, y: 300 },
      { x: 250, y: 1100 },  // Waterway Straight
    ],
  },

  // ── Track 03: Desert Run (Sandstone Sweeper) ──
  {
    id: "track-03",
    name: "Track 03 — Desert Run",
    subtitle: "Long blinding straights with technical sandy hairpins",
    lengthMeters: 4600,
    width: 145,
    gravityFactor: 1.0,
    baseGrip: 0.88,
    theme: "desert",
    colors: {
      asphalt: "#2c2a26",
      asphaltDark: "#22201d",
      grass: "#3e321e", // Desert sand
      grassDark: "#2f2617",
      kerbRed: "#ff9f43",
      kerbWhite: "#ffd84d",
      barrier: "#5c4d36",
      line: "#ffd84d",
      accent: "#ff9f43",
    },
    startPos: { x: 500, y: 1500, angle: 0 },
    points: [
      { x: 500, y: 1500 },
      { x: 2200, y: 1500 }, // Massive Sand Straight
      { x: 2500, y: 1200 },
      { x: 2200, y: 800 },  // Big Dune Turn
      { x: 1600, y: 800 },
      { x: 1400, y: 400 },
      { x: 800, y: 300 },   // Canyon Pass
      { x: 300, y: 700 },   // Sand Hairpin
      { x: 800, y: 1000 },
      { x: 400, y: 1250 },
    ],
  },

  // ── Track 04: Alpine Ring (Mountain Switchbacks) ──
  {
    id: "track-04",
    name: "Track 04 — Alpine Ring",
    subtitle: "Tight mountain chicanes and high-elevation downforce tests",
    lengthMeters: 3900,
    width: 125,
    gravityFactor: 1.05,
    baseGrip: 0.90,
    theme: "alpine",
    colors: {
      asphalt: "#1e2430",
      asphaltDark: "#171c26",
      grass: "#1a2c33", // Cold pine tundra
      grassDark: "#122026",
      kerbRed: "#4da3ff",
      kerbWhite: "#ffffff",
      barrier: "#45617a",
      line: "#ffffff",
      accent: "#4da3ff",
    },
    startPos: { x: 600, y: 1300, angle: 0 },
    points: [
      { x: 600, y: 1300 },
      { x: 1500, y: 1300 },
      { x: 1800, y: 1000 }, // Ascent S-curves
      { x: 1400, y: 800 },
      { x: 1900, y: 550 },
      { x: 1600, y: 250 },  // Alpine Peak
      { x: 1000, y: 200 },
      { x: 700, y: 450 },   // Downhill Snake
      { x: 400, y: 350 },
      { x: 250, y: 750 },   // Valley Hairpin
      { x: 450, y: 1050 },
    ],
  },

  // ── Track 05: Night Circuit (Neon Floodlit Arena) ──
  {
    id: "track-05",
    name: "Track 05 — Night Circuit",
    subtitle: "Pitch-black asphalt illuminated by high-contrast neon borders",
    lengthMeters: 4300,
    width: 135,
    gravityFactor: 1.0,
    baseGrip: 0.95,
    theme: "night",
    colors: {
      asphalt: "#0d1017",
      asphaltDark: "#080a0f",
      grass: "#040609",
      grassDark: "#020305",
      kerbRed: "#ff0077",
      kerbWhite: "#00f0ff",
      barrier: "#1f2a44",
      line: "#00f0ff",
      accent: "#ff0077",
    },
    startPos: { x: 500, y: 1400, angle: 0 },
    points: [
      { x: 500, y: 1400 },
      { x: 1800, y: 1400 },
      { x: 2300, y: 1100 },
      { x: 2000, y: 700 },
      { x: 2400, y: 350 },  // High-voltage corner
      { x: 1700, y: 200 },
      { x: 1200, y: 450 },
      { x: 600, y: 300 },
      { x: 250, y: 650 },   // Laser Hairpin
      { x: 700, y: 950 },
      { x: 300, y: 1200 },
    ],
  },

  // ── Track 06: Jungle Loop (Canopy Technical) ──
  {
    id: "track-06",
    name: "Track 06 — Jungle Loop",
    subtitle: "Narrow technical rainforest switchbacks with zero margin for error",
    lengthMeters: 3650,
    width: 120,
    gravityFactor: 1.0,
    baseGrip: 0.89,
    theme: "jungle",
    colors: {
      asphalt: "#202622",
      asphaltDark: "#181d1a",
      grass: "#0d2b14", // Deep rainforest
      grassDark: "#091f0e",
      kerbRed: "#ff5252",
      kerbWhite: "#a3e635",
      barrier: "#38523c",
      line: "#a3e635",
      accent: "#63e66d",
    },
    startPos: { x: 400, y: 1150, angle: 0 },
    points: [
      { x: 400, y: 1150 },
      { x: 1300, y: 1150 },
      { x: 1650, y: 900 },
      { x: 1400, y: 650 },  // Canopy Chicane
      { x: 1800, y: 400 },
      { x: 1350, y: 200 },
      { x: 900, y: 350 },
      { x: 600, y: 200 },
      { x: 250, y: 450 },   // River Hairpin
      { x: 500, y: 750 },
      { x: 200, y: 950 },
    ],
  },

  // ── Track 07: Industrial GP (Factory Chicane) ──
  {
    id: "track-07",
    name: "Track 07 — Industrial GP",
    subtitle: "Complex factory chicanes, pipe alleys, and 180° hairpins",
    lengthMeters: 4400,
    width: 130,
    gravityFactor: 1.0,
    baseGrip: 0.93,
    theme: "industrial",
    colors: {
      asphalt: "#24252a",
      asphaltDark: "#1b1c20",
      grass: "#1a1b22",
      grassDark: "#131419",
      kerbRed: "#ff9f43",
      kerbWhite: "#ffffff",
      barrier: "#545763",
      line: "#ff9f43",
      accent: "#ffd84d",
    },
    startPos: { x: 500, y: 1350, angle: 0 },
    points: [
      { x: 500, y: 1350 },
      { x: 1700, y: 1350 },
      { x: 2000, y: 1000 },
      { x: 1600, y: 850 },  // Chicane 1
      { x: 1900, y: 600 },  // Chicane 2
      { x: 1500, y: 250 },
      { x: 950, y: 300 },
      { x: 600, y: 550 },   // Pipe Depot Loop
      { x: 250, y: 400 },
      { x: 300, y: 900 },
      { x: 650, y: 1100 },
      { x: 300, y: 1250 },
    ],
  },

  // ── Track 08: Pixel Monza (The Temple of Speed) ──
  {
    id: "track-08",
    name: "Track 08 — Pixel Monza",
    subtitle: "High-speed sweeping curves and legendary flat-out straights",
    lengthMeters: 5200,
    width: 150,
    gravityFactor: 1.0,
    baseGrip: 0.96,
    theme: "monza",
    colors: {
      asphalt: "#262b36",
      asphaltDark: "#1e222b",
      grass: "#1e3822",
      grassDark: "#162b1a",
      kerbRed: "#e63946",
      kerbWhite: "#f1faee",
      barrier: "#457b9d",
      line: "#ffffff",
      accent: "#e63946",
    },
    startPos: { x: 400, y: 1500, angle: 0 },
    points: [
      { x: 400, y: 1500 },
      { x: 2500, y: 1500 }, // Massive Main Straight
      { x: 2900, y: 1200 }, // Curva Grande
      { x: 2700, y: 700 },  // Varianta Chicane
      { x: 2000, y: 600 },
      { x: 1500, y: 300 },  // Lesmo Sweepers
      { x: 800, y: 250 },   // Serraglio
      { x: 300, y: 600 },   // Ascari Chicane
      { x: 500, y: 1100 },  // Parabolica Entry
      { x: 250, y: 1350 },  // Parabolica Apex
    ],
  },

  // ── Track 09: Moonbase Ring (Low-Gravity Lunar Circuit) ──
  {
    id: "track-09",
    name: "Track 09 — Moonbase Ring",
    subtitle: "Low lunar gravity (0.38g), prolonged power-slides, and floaty jumps",
    lengthMeters: 4000,
    width: 140,
    gravityFactor: 0.38,
    baseGrip: 0.76, // Slippery regolith dust
    theme: "moonbase",
    colors: {
      asphalt: "#1f2229",
      asphaltDark: "#17191e",
      grass: "#0b0c10", // Lunar regolith
      grassDark: "#06070a",
      kerbRed: "#a879ff",
      kerbWhite: "#4de8e8",
      barrier: "#3b4252",
      line: "#a879ff",
      accent: "#4de8e8",
    },
    startPos: { x: 500, y: 1300, angle: 0 },
    points: [
      { x: 500, y: 1300 },
      { x: 1600, y: 1300 },
      { x: 2100, y: 950 },
      { x: 1800, y: 550 },
      { x: 2200, y: 250 },  // Crater Rim
      { x: 1400, y: 200 },
      { x: 900, y: 450 },
      { x: 450, y: 250 },   // Zero-G Drop
      { x: 200, y: 650 },
      { x: 600, y: 950 },
      { x: 250, y: 1150 },
    ],
  },

  // ── Track 10: ARCADE_ Grand Prix (The Ultimate Championship Circuit) ──
  {
    id: "track-10",
    name: "Track 10 — ARCADE_ Grand Prix",
    subtitle: "The ultimate 16-turn championship test of throttle, braking, and nerve",
    lengthMeters: 5600,
    width: 140,
    gravityFactor: 1.0,
    baseGrip: 0.94,
    theme: "gp",
    colors: {
      asphalt: "#1b202c",
      asphaltDark: "#131720",
      grass: "#0e2417",
      grassDark: "#091a10",
      kerbRed: "#ffd84d",
      kerbWhite: "#ff5c8a",
      barrier: "#2c3e66",
      line: "#ffffff",
      accent: "#ffd84d",
    },
    startPos: { x: 400, y: 1600, angle: 0 },
    points: [
      { x: 400, y: 1600 },
      { x: 2200, y: 1600 }, // Championship Main Straight
      { x: 2600, y: 1300 }, // Turn 1-2 Senna S
      { x: 2300, y: 1000 },
      { x: 2700, y: 700 },
      { x: 2400, y: 350 },  // Turn 5 Sweeper
      { x: 1800, y: 250 },
      { x: 1400, y: 500 },  // Infield Hairpin
      { x: 1000, y: 200 },
      { x: 600, y: 400 },
      { x: 300, y: 250 },   // Stadium Section
      { x: 200, y: 700 },
      { x: 550, y: 950 },
      { x: 250, y: 1150 },
      { x: 600, y: 1350 },
      { x: 250, y: 1500 },  // Final Sweep
    ],
  },
];
