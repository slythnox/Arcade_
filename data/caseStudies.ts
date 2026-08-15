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
];

export function getAllCaseStudies(): CaseStudy[] {
  return CASE_STUDIES;
}

export function getCaseStudyBySlug(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((cs) => cs.slug === slug);
}
