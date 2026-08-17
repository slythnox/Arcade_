export interface CaseStudy {
  slug: string;
  number: string;
  title: string;
  subtitle: string;
  readTime: string;
  summary: string;
  topics: string[];
  content: {
    heading: string;
    body: string;
    codeSnippet?: string;
  }[];
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "deterministic-game-engine",
    number: "01",
    title: "Building a Deterministic 60Hz 2D Game Engine from Scratch",
    subtitle: "Why we decoupled physics simulation from browser display refresh rates using a fixed accumulator loop.",
    readTime: "7 min read",
    summary:
      "A deep architectural breakdown of why variable-delta game loops cause physics tunneling across 144Hz and 240Hz monitors, and how an accumulator model guarantees bit-for-bit deterministic simulation.",
    topics: ["Game Loop", "Fixed Timestep", "Deterministic PRNG", "TypeScript"],
    content: [
      {
        heading: "1. The Vulnerability of Variable-Delta Physics",
        body:
          "Traditional web tutorials often pass raw requestAnimationFrame time deltas directly into physics integrations: position += velocity * deltaTime. On 144Hz or 240Hz high-refresh displays, deltaTime drops to ~4ms, causing floating-point integration drift. Worse, when the browser tab throttles in the background, deltaTime spikes past 200ms, causing high-speed projectiles to tunnel entirely through solid boundaries.",
      },
      {
        heading: "2. The Fixed 60Hz Accumulator Pattern",
        body:
          "ARCADE_ decouples rendering from simulation through a fixed accumulator model with a discrete timestep (FIXED_DT = 1/60s ≈ 0.016667s). As real elapsed time elapses, it is stored in an accumulator buffer and consumed in strict, discrete 16.66ms quantum slices. Any remaining fraction is clamped to prevent spiral-of-death stalls.",
        codeSnippet: `const FIXED_DT = 1 / 60; // Exact 60Hz tick
let accumulator = 0;
let lastTime = performance.now();

function frame(now: number) {
  const dt = Math.min((now - lastTime) / 1000, 0.25);
  lastTime = now;
  accumulator += dt;

  while (accumulator >= FIXED_DT) {
    gameInstance.update(FIXED_DT); // Always deterministic
    accumulator -= FIXED_DT;
  }

  gameInstance.render(renderer);
  requestAnimationFrame(frame);
}`,
      },
      {
        heading: "3. Deterministic Pseudo-Random Generation (Mulberry32)",
        body:
          "Deterministic simulation requires reproducible randomness. Standard Math.random() is unseeded and platform-dependent. We implement a Mulberry32 32-bit PRNG that produces the exact same sequence of pseudo-random floats given an initial integer seed, enabling daily challenges, ghost replays, and automated test regression verification.",
        codeSnippet: `export class RandomSource {
  private state: number;
  constructor(seed: number = 1337) { this.state = seed >>> 0; }
  public nextFloat(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}`,
      },
    ],
  },
  {
    slug: "tetris-matrix-rotations",
    number: "02",
    title: "Tetris: SRS Matrix Rotations and 2D Linear Algebra",
    subtitle: "Transforming discrete 2D grid matrices and resolving wall kick offsets.",
    readTime: "8 min read",
    summary:
      "How discrete matrix transposition, coordinate permutations, and prioritized 5-offset kick tables implement the official Super Rotation System.",
    topics: ["Linear Algebra", "Matrix Rotation", "SRS", "Discrete Grids"],
    content: [
      {
        heading: "1. 2D Coordinate Permutation & Matrix Transposition",
        body:
          "In a discrete grid of dimension N x N, rotating a shape 90 degrees clockwise is equivalent to transposing the matrix across its main diagonal followed by reversing each row horizontally. Mathematically, element at row r and column c maps to row c and column (N - 1 - r).",
        codeSnippet: `export function rotateMatrixCW<T>(matrix: T[][]): T[][] {
  const n = matrix.length;
  const result: T[][] = Array.from({ length: n }, () => new Array(n));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      result[c][n - 1 - r] = matrix[r][c];
    }
  }
  return result;
}`,
      },
      {
        heading: "2. The Super Rotation System (SRS) Wall Kick Pipeline",
        body:
          "When a tetromino rotates next to a boundary wall or stacked minos, the naive rotation causes a collision. SRS evaluates an ordered sequence of 5 test translation vectors (dx, dy). If test 1 collides, test 2 is attempted immediately. Only if all 5 offset vectors fail is the rotation rejected, preserving fluent, responsive mechanical handling.",
        codeSnippet: `// Example: Standard J, L, S, T, Z 0->R Kick Table
const KICKS_0_TO_R: [number, number][] = [
  [0, 0],   // Test 1: Basic rotation
  [-1, 0],  // Test 2: Shift 1 unit left
  [-1, 1],  // Test 3: Shift 1 left, 1 up
  [0, -2],  // Test 4: Shift 2 down
  [-1, -2], // Test 5: Shift 1 left, 2 down
];`,
      },
    ],
  },
  {
    slug: "fuzzy-search-ranking",
    number: "03",
    title: "Multi-Criteria Fuzzy Search with Levenshtein Distance",
    subtitle: "Zero-dependency in-memory search with weighted relevance scoring.",
    readTime: "6 min read",
    summary:
      "Engineering a sub-millisecond fuzzy search engine with space-optimized dynamic programming and multi-attribute weight ranking.",
    topics: ["Algorithms", "Levenshtein", "Fuzzy Search", "Information Retrieval"],
    content: [
      {
        heading: "1. Space-Optimized Levenshtein Dynamic Programming",
        body:
          "Calculating the minimum edit distance between a query and a target string typically requires an (M x N) matrix. In an in-memory client search indexing 60+ games, allocating 60 full matrices per keystroke generates garbage collection overhead. We optimize this to use two alternating 1D arrays of size (N + 1), reducing memory complexity from O(M * N) to O(N).",
        codeSnippet: `export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  let prevRow = new Array(b.length + 1);
  let currRow = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prevRow[j] = j;

  for (let i = 1; i <= a.length; i++) {
    currRow[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        currRow[j - 1] + 1,      // Insertion
        prevRow[j] + 1,          // Deletion
        prevRow[j - 1] + cost    // Substitution
      );
    }
    [prevRow, currRow] = [currRow, prevRow];
  }
  return prevRow[b.length];
}`,
      },
      {
        heading: "2. Multi-Criteria Relevance Formula",
        body:
          "To guarantee that exact title matches rank above metadata matches while still allowing fuzzy discovery of tags and mathematical concepts, search relevance is scored using a normalized weighted polynomial:",
        codeSnippet: `Score = 0.40 * S_name + 0.20 * S_platform + 0.15 * S_genre + 0.10 * S_desc + 0.10 * S_tags + 0.05 * S_year;`,
      },
    ],
  },
  {
    slug: "procedural-pixel-vegetation",
    number: "04",
    title: "Procedural Pixel Vegetation and Value Noise",
    subtitle: "Simulating moss, vines, and nature reclamation on HTML5 Canvas.",
    readTime: "7 min read",
    summary:
      "How seeded value noise, discrete pixel quantization, and static canvas caching generate organic pixel wildlife with zero runtime CPU overhead.",
    topics: ["Procedural Generation", "Noise", "Canvas 2D", "Pixel Art"],
    content: [
      {
        heading: "1. Coordinate Quantization & Pixel Snapping",
        body:
          "To ensure procedural vegetation resembles authentic 1990s hardware tiles rather than smooth vector graphics, every vertex is snapped to a discrete pixel grid step: x' = floor(x / pixelSize) * pixelSize. This transforms continuous trigonometric curves into stepped pixel-art outlines.",
        codeSnippet: `function snapPixel(val: number, size: number = 4): number {
  return Math.floor(val / size) * size;
}`,
      },
      {
        heading: "2. Generate Once, Animate Ambient Sway",
        body:
          "Generating hundreds of organic foliage vertices every frame would consume precious draw time. We generate the flora layout once during mount using a deterministic seed, render it to an offscreen cache buffer, and compose it onto the main canvas with subtle harmonic sway offsets.",
      },
    ],
  },
  {
    slug: "electronic-circuit-simulation",
    number: "05",
    title: "Circuit Lab: Real-Time Ohm's Law, RC Charging & NE555 Multivibrators",
    subtitle: "Simulating electrical circuits, component voltage drops, and discrete timing on a virtual breadboard.",
    readTime: "9 min read",
    summary:
      "How we implemented real-time nodal electrical analysis, exponential RC capacitor charging curves, and astable multivibrator oscillation frequencies in Circuit Lab.",
    topics: ["Circuit Simulation", "Ohm's Law", "RC Transients", "555 Timer", "Discrete Math"],
    content: [
      {
        heading: "1. Nodal Analysis & Current Limiting",
        body:
          "When wiring active electronic components (LEDs, buzzers, and ICs) across breadboard tie-points, the engine evaluates the closed-circuit graph path from the 9V rail to ground. For forward-biased LEDs with fixed threshold drop V_f = 2.0V, current is calculated using Ohm's Law:",
        codeSnippet: `// Current calculation through series resistor R
const Vs = 9.0; // 9V rail
const Vf = 2.0; // LED forward voltage
const I = (Vs - Vf) / resistorOhms; // In Amperes

if (I > 0.030) {
  triggerComponentOvercurrentBlowout(); // Blasts if > 30mA
} else if (I > 0.005) {
  ledLuminance = Math.min(1.0, (I - 0.005) / 0.015);
}`,
      },
      {
        heading: "2. RC Time Constant Exponential Charging",
        body:
          "Capacitor charge and discharge follow exponential curves based on the RC time constant tau = R * C. During fixed timestep integration (dt = 1/60s), the instantaneous capacitor voltage is updated via exact closed-form decay:",
        codeSnippet: `// Capacitor voltage integration
const tau = resistorOhms * capacitorFarads;
vc = targetVoltage + (vc - targetVoltage) * Math.exp(-dt / tau);`,
      },
      {
        heading: "3. NE555 Astable Multivibrator Duty Cycles",
        body:
          "The classic NE555 timer IC switches internal flip-flops between 1/3 Vcc and 2/3 Vcc threshold comparator triggers. We model the charging path through (R1 + R2) and the discharge path through R2, producing an exact square wave frequency f = 1.44 / ((R1 + 2*R2) * C) connected directly to the Web Audio synthesizer tone frequency.",
      },
    ],
  },
  {
    slug: "orthographic-tire-kinematics",
    number: "06",
    title: "Hotlap: Orthogonal Vector Tire Kinematics & Catmull-Rom Spline Tracks",
    subtitle: "Decomposing vehicle velocity into longitudinal and lateral grip vectors with power-slide oversteer.",
    readTime: "8 min read",
    summary:
      "The mathematical derivation of 2D tire friction tensors, aerodynamic slipstream drafting, and closed-loop Catmull-Rom spline distance evaluation.",
    topics: ["Kinematics", "Vector Math", "Catmull-Rom Spline", "Friction Tensors"],
    content: [
      {
        heading: "1. Orthogonal Velocity Decomposition",
        body:
          "Rather than treating top-down racing vehicles as single rigid points, the vehicle velocity vector v is projected onto the local heading unit vector h and the lateral normal vector n:",
        codeSnippet: `// Decomposing velocity into forward grip and sideways slip
const forwardSpeed = velocity.dot(heading);
const lateralSlip = velocity.dot(lateralNormal);

// Lateral friction dampening
const gripCoeff = surfaceType === "asphalt" ? 0.92 : 0.65;
const dampedSlip = lateralSlip * Math.max(0, 1 - gripCoeff * frictionDecay * dt);

velocity = heading.scale(forwardSpeed).add(lateralNormal.scale(dampedSlip));`,
      },
      {
        heading: "2. Catmull-Rom Spline Centerline Parametrization",
        body:
          "Circuit tracks are defined using closed cubic Catmull-Rom splines C(u) through control checkpoints. Lap distance and track bounds are calculated by projecting the car's 2D position P onto the closest spline segment using Newton-Raphson distance minimization.",
      },
    ],
  },
  {
    slug: "aerial-fire-suppression-kinematics",
    number: "07",
    title: "Inferno Strike: Aerial Dispersal Kinematics & Cellular Fire Propagation",
    subtitle: "Simulating chemical retardant drop plumes and stochastic ignition barriers across wildland terrain.",
    readTime: "8 min read",
    summary:
      "How forward aircraft groundspeed, drop altitude, and wind vectors calculate ground retardant density swaths that halt non-linear cellular fire spread.",
    topics: ["Fluid Plumes", "Cellular Automata", "Kinematics", "Gaussian Distribution"],
    content: [
      {
        heading: "1. Gaussian Retardant Ground Swath Distribution",
        body:
          "When a firefighting tanker dumps 3,000 gallons of chemical retardant at velocity v_plane and altitude h, the drop plume expands into a 2D Gaussian deposition swath on the ground. Cells receiving density above threshold rho_min receive an impenetrable firebreak barrier.",
        codeSnippet: `// Gaussian deposition density at ground cell (x, y)
function calculateRetardantDeposition(x: number, y: number, dropX: number, dropY: number, sigmaX: number, sigmaY: number): number {
  const dx = (x - dropX) / sigmaX;
  const dy = (y - dropY) / sigmaY;
  return Math.exp(-0.5 * (dx * dx + dy * dy));
}`,
      },
      {
        heading: "2. Stochastic Cellular Automaton Fire Propagation",
        body:
          "Burning forest cells radiate thermal energy to their 8 Moore neighbors. Ignition probability P_ignite is modulated by local fuel moisture, wind vector alignment, and retardant barrier level: P_ignite = P_base * (1 + wind.dot(dir)) * (1 - retardantLevel).",
      },
    ],
  },
  {
    slug: "lattice-cellular-hydrodynamics",
    number: "08",
    title: "Liquid Cells: Discrete Cellular Lattice Hydrodynamics",
    subtitle: "Simulating hydrostatic pressure equalization, sloshing waves, and liquid cascades on discrete grids.",
    readTime: "8 min read",
    summary:
      "A complete discrete approximation of Navier-Stokes fluid mechanics running in real-time on a 2D cellular automaton lattice.",
    topics: ["Fluid Dynamics", "Cellular Automata", "Discrete Math", "Hydrostatics"],
    content: [
      {
        heading: "1. Downward Mass Transport & Lateral Equalization",
        body:
          "Each grid cell holds a continuous mass value m in [0, 1]. In each 60Hz tick, the simulation transfers mass downward into available cells. When blocked by barriers or underlying liquid, excess mass disperses laterally to equalize hydrostatic head pressure:",
        codeSnippet: `// Discrete hydrostatic mass equalization
const deltaMass = Math.min(
  currentMass,
  Math.max(0, (currentMass + neighborMass) / 2 - neighborMass)
);

currentCell.mass -= deltaMass;
neighborCell.mass += deltaMass;`,
      },
      {
        heading: "2. Emergent Sloshing Waves & Free Surface Rendering",
        body:
          "By strictly conserving fluid mass across all local cell flux exchanges, complex emergent behaviors—including sloshing waves, laminar waterfalls, and hydrostatic equilibrium in U-tubes—arise naturally with zero floating-point particle tracking.",
      },
    ],
  },
];

export function getAllCaseStudies(): CaseStudy[] {
  return CASE_STUDIES;
}

export function getCaseStudyBySlug(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((cs) => cs.slug === slug);
}
