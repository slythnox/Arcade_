import type { LevelData } from "./types";
import { TileType } from "./types";

/**
 * Creates 25 handcrafted level layouts across 5 worlds for Diamond Run.
 * Each map is represented by a grid of numerical tile IDs.
 */

function createEmptyGrid(cols: number, rows: number): number[][] {
  return Array.from({ length: rows }, () => new Array(cols).fill(TileType.EMPTY));
}

function addBorderWalls(grid: number[][]): void {
  const rows = grid.length;
  const cols = grid[0].length;
  for (let r = 0; r < rows; r++) {
    grid[r][0] = TileType.SOLID;
    grid[r][cols - 1] = TileType.SOLID;
  }
  for (let c = 0; c < cols; c++) {
    grid[0][c] = TileType.SOLID;
    grid[rows - 1][c] = TileType.SOLID;
  }
}

export const LEVELS: LevelData[] = [
  // ==========================================
  // WORLD 1 — ANCIENT RUINS (Levels 1–5)
  // ==========================================
  {
    id: "ruins-01",
    world: 1,
    levelIndex: 1,
    title: "First Expedition",
    width: 20,
    height: 12,
    spawn: { col: 2, row: 9 },
    exit: { col: 17, row: 9 },
    diamondsTotal: 8,
    secretsTotal: 1,
    targetTime: 30,
    tiles: (() => {
      const g = createEmptyGrid(20, 12);
      addBorderWalls(g);
      // Floor
      for (let c = 1; c < 19; c++) g[10][c] = TileType.SOLID;
      // Platforms & Diamonds
      for (let c = 5; c <= 8; c++) g[7][c] = TileType.SOLID;
      for (let c = 12; c <= 15; c++) g[7][c] = TileType.SOLID;

      g[9][5] = TileType.DIAMOND;
      g[9][6] = TileType.DIAMOND;
      g[6][6] = TileType.DIAMOND;
      g[6][7] = TileType.DIAMOND;
      g[9][13] = TileType.DIAMOND;
      g[9][14] = TileType.DIAMOND;
      g[6][13] = TileType.DIAMOND;
      g[6][14] = TileType.DIAMOND;

      // Secret area behind breakable wall
      g[10][18] = TileType.SECRET_WALL;
      g[9][18] = TileType.GEM_SECRET;

      g[9][17] = TileType.EXIT;
      return g;
    })(),
  },
  {
    id: "ruins-02",
    world: 1,
    levelIndex: 2,
    title: "Broken Courtyard",
    width: 22,
    height: 12,
    spawn: { col: 2, row: 9 },
    exit: { col: 19, row: 9 },
    diamondsTotal: 10,
    secretsTotal: 1,
    targetTime: 45,
    tiles: (() => {
      const g = createEmptyGrid(22, 12);
      addBorderWalls(g);
      for (let c = 1; c < 21; c++) g[10][c] = TileType.SOLID;

      // Key & Door setup
      g[9][7] = TileType.KEY_BRONZE;
      g[10][13] = TileType.KEY_BRONZE_GATE;
      for (let r = 7; r <= 9; r++) g[r][13] = TileType.SOLID;

      // Spikes pit
      g[10][9] = TileType.SPIKE;
      g[10][10] = TileType.SPIKE;

      // Platforms
      g[7][4] = TileType.SOLID;
      g[7][5] = TileType.SOLID;
      g[7][9] = TileType.PLATFORM;
      g[7][10] = TileType.PLATFORM;

      for (let c = 4; c <= 8; c++) g[6][c] = TileType.DIAMOND;
      for (let c = 14; c <= 18; c++) g[9][c] = TileType.DIAMOND;

      g[9][20] = TileType.EXIT;
      return g;
    })(),
  },
  {
    id: "ruins-03",
    world: 1,
    levelIndex: 3,
    title: "Stone Passage",
    width: 24,
    height: 14,
    spawn: { col: 2, row: 11 },
    exit: { col: 21, row: 3 },
    diamondsTotal: 12,
    secretsTotal: 1,
    targetTime: 50,
    tiles: (() => {
      const g = createEmptyGrid(24, 14);
      addBorderWalls(g);
      for (let c = 1; c < 23; c++) g[12][c] = TileType.SOLID;

      // Ladders to upper tier
      for (let r = 4; r <= 11; r++) g[r][8] = TileType.LADDER;
      for (let c = 1; c <= 12; c++) g[4][c] = TileType.SOLID;
      for (let c = 12; c <= 22; c++) g[4][c] = TileType.SOLID;

      for (let c = 3; c <= 6; c++) g[3][c] = TileType.DIAMOND;
      for (let c = 14; c <= 18; c++) g[3][c] = TileType.DIAMOND;
      for (let c = 10; c <= 13; c++) g[11][c] = TileType.DIAMOND;

      g[11][15] = TileType.PUSHABLE;
      g[11][16] = TileType.PRESSURE_PLATE;

      g[3][21] = TileType.EXIT;
      return g;
    })(),
  },
  {
    id: "ruins-04",
    world: 1,
    levelIndex: 4,
    title: "Locked Chamber",
    width: 24,
    height: 14,
    spawn: { col: 2, row: 11 },
    exit: { col: 21, row: 11 },
    diamondsTotal: 14,
    secretsTotal: 1,
    targetTime: 60,
    tiles: (() => {
      const g = createEmptyGrid(24, 14);
      addBorderWalls(g);
      for (let c = 1; c < 23; c++) g[12][c] = TileType.SOLID;

      g[11][6] = TileType.KEY_SILVER;
      g[11][14] = TileType.KEY_SILVER_GATE;
      for (let r = 5; r <= 11; r++) g[r][14] = TileType.SOLID;

      for (let c = 8; c <= 12; c++) g[8][c] = TileType.PLATFORM;
      for (let c = 8; c <= 12; c++) g[7][c] = TileType.DIAMOND;
      for (let c = 16; c <= 20; c++) g[11][c] = TileType.DIAMOND;

      g[11][21] = TileType.EXIT;
      return g;
    })(),
  },
  {
    id: "ruins-05",
    world: 1,
    levelIndex: 5,
    title: "Ruins Escape",
    width: 26,
    height: 14,
    spawn: { col: 2, row: 11 },
    exit: { col: 23, row: 11 },
    diamondsTotal: 15,
    secretsTotal: 1,
    targetTime: 60,
    tiles: (() => {
      const g = createEmptyGrid(26, 14);
      addBorderWalls(g);
      for (let c = 1; c < 25; c++) g[12][c] = TileType.SOLID;

      g[11][7] = TileType.KEY_GOLD;
      g[11][18] = TileType.KEY_GOLD_GATE;
      for (let r = 4; r <= 11; r++) g[r][18] = TileType.SOLID;

      for (let c = 4; c <= 16; c += 2) g[11][c] = TileType.SPIKE;
      for (let c = 4; c <= 16; c += 2) g[7][c] = TileType.PLATFORM;

      for (let c = 4; c <= 16; c++) g[6][c] = TileType.DIAMOND;
      g[11][21] = TileType.GEM_RARE;

      g[11][23] = TileType.EXIT;
      return g;
    })(),
  },

  // ==========================================
  // WORLD 2 — JUNGLE TEMPLE (Levels 6–10)
  // ==========================================
  {
    id: "jungle-06",
    world: 2,
    levelIndex: 6,
    title: "Jungle Entrance",
    width: 24,
    height: 14,
    spawn: { col: 2, row: 11 },
    exit: { col: 21, row: 11 },
    diamondsTotal: 12,
    secretsTotal: 1,
    targetTime: 50,
    tiles: (() => {
      const g = createEmptyGrid(24, 14);
      addBorderWalls(g);
      for (let c = 1; c < 23; c++) g[12][c] = TileType.SOLID;

      // Water pit
      for (let c = 8; c <= 13; c++) {
        g[12][c] = TileType.WATER;
        g[11][c] = TileType.WATER;
      }
      for (let r = 4; r <= 10; r++) g[r][10] = TileType.LADDER;

      for (let c = 3; c <= 7; c++) g[11][c] = TileType.DIAMOND;
      for (let c = 14; c <= 18; c++) g[11][c] = TileType.DIAMOND;
      g[3][10] = TileType.GEM_RARE;

      g[11][21] = TileType.EXIT;
      return g;
    })(),
  },
  {
    id: "jungle-07",
    world: 2,
    levelIndex: 7,
    title: "Vine Bridge",
    width: 26,
    height: 14,
    spawn: { col: 2, row: 11 },
    exit: { col: 23, row: 11 },
    diamondsTotal: 14,
    secretsTotal: 1,
    targetTime: 55,
    tiles: (() => {
      const g = createEmptyGrid(26, 14);
      addBorderWalls(g);
      for (let c = 1; c < 25; c++) g[12][c] = TileType.SOLID;

      // Mud & Water hazard
      for (let c = 6; c <= 18; c++) g[12][c] = TileType.MUD;
      for (let r = 3; r <= 11; r++) g[r][12] = TileType.LADDER;

      for (let c = 4; c <= 10; c++) g[11][c] = TileType.DIAMOND;
      for (let c = 14; c <= 20; c++) g[11][c] = TileType.DIAMOND;

      g[11][23] = TileType.EXIT;
      return g;
    })(),
  },
  {
    id: "jungle-08",
    world: 2,
    levelIndex: 8,
    title: "Flooded Temple",
    width: 26,
    height: 14,
    spawn: { col: 2, row: 11 },
    exit: { col: 23, row: 11 },
    diamondsTotal: 16,
    secretsTotal: 1,
    targetTime: 60,
    tiles: (() => {
      const g = createEmptyGrid(26, 14);
      addBorderWalls(g);
      for (let c = 1; c < 25; c++) g[12][c] = TileType.SOLID;

      for (let c = 5; c <= 19; c++) {
        g[12][c] = TileType.WATER;
        g[11][c] = TileType.WATER;
        g[10][c] = TileType.WATER;
      }
      for (let r = 4; r <= 9; r++) g[r][12] = TileType.LADDER;

      for (let c = 3; c <= 8; c++) g[9][c] = TileType.DIAMOND;
      for (let c = 15; c <= 20; c++) g[9][c] = TileType.DIAMOND;

      g[11][23] = TileType.EXIT;
      return g;
    })(),
  },
  {
    id: "jungle-09",
    world: 2,
    levelIndex: 9,
    title: "Temple Mechanism",
    width: 26,
    height: 14,
    spawn: { col: 2, row: 11 },
    exit: { col: 23, row: 11 },
    diamondsTotal: 15,
    secretsTotal: 1,
    targetTime: 65,
    tiles: (() => {
      const g = createEmptyGrid(26, 14);
      addBorderWalls(g);
      for (let c = 1; c < 25; c++) g[12][c] = TileType.SOLID;

      g[11][8] = TileType.PUSHABLE;
      g[11][12] = TileType.PRESSURE_PLATE;
      g[11][16] = TileType.KEY_BRONZE_GATE;
      for (let r = 5; r <= 11; r++) g[r][16] = TileType.SOLID;

      for (let c = 3; c <= 15; c++) g[10][c] = TileType.DIAMOND;
      g[11][23] = TileType.EXIT;
      return g;
    })(),
  },
  {
    id: "jungle-10",
    world: 2,
    levelIndex: 10,
    title: "Hidden Garden",
    width: 28,
    height: 14,
    spawn: { col: 2, row: 11 },
    exit: { col: 25, row: 11 },
    diamondsTotal: 18,
    secretsTotal: 1,
    targetTime: 70,
    tiles: (() => {
      const g = createEmptyGrid(28, 14);
      addBorderWalls(g);
      for (let c = 1; c < 27; c++) g[12][c] = TileType.SOLID;

      for (let c = 5; c <= 21; c++) g[11][c] = TileType.DIAMOND;
      g[11][22] = TileType.GEM_RARE;
      g[11][25] = TileType.EXIT;
      return g;
    })(),
  },

  // ==========================================
  // WORLD 3 — FROZEN CAVERNS (Levels 11–15)
  // ==========================================
  {
    id: "frozen-11",
    world: 3,
    levelIndex: 11,
    title: "Frozen Gate",
    width: 24,
    height: 14,
    spawn: { col: 2, row: 11 },
    exit: { col: 21, row: 11 },
    diamondsTotal: 12,
    secretsTotal: 1,
    targetTime: 50,
    tiles: (() => {
      const g = createEmptyGrid(24, 14);
      addBorderWalls(g);
      for (let c = 1; c < 23; c++) g[12][c] = TileType.ICE;

      g[11][6] = TileType.KEY_BRONZE;
      g[11][14] = TileType.KEY_BRONZE_GATE;
      for (let r = 5; r <= 11; r++) g[r][14] = TileType.SOLID;

      for (let c = 3; c <= 12; c++) g[10][c] = TileType.DIAMOND;
      g[11][21] = TileType.EXIT;
      return g;
    })(),
  },
  {
    id: "frozen-12",
    world: 3,
    levelIndex: 12,
    title: "Ice Tunnel",
    width: 26,
    height: 14,
    spawn: { col: 2, row: 11 },
    exit: { col: 23, row: 11 },
    diamondsTotal: 14,
    secretsTotal: 1,
    targetTime: 55,
    tiles: (() => {
      const g = createEmptyGrid(26, 14);
      addBorderWalls(g);
      for (let c = 1; c < 25; c++) g[12][c] = TileType.ICE;

      for (let c = 8; c <= 16; c += 3) g[11][c] = TileType.SPIKE;
      for (let c = 3; c <= 20; c++) g[10][c] = TileType.DIAMOND;

      g[11][23] = TileType.EXIT;
      return g;
    })(),
  },
  {
    id: "frozen-13",
    world: 3,
    levelIndex: 13,
    title: "Crystal Cavern",
    width: 26,
    height: 14,
    spawn: { col: 2, row: 11 },
    exit: { col: 23, row: 11 },
    diamondsTotal: 15,
    secretsTotal: 1,
    targetTime: 60,
    tiles: (() => {
      const g = createEmptyGrid(26, 14);
      addBorderWalls(g);
      for (let c = 1; c < 25; c++) g[12][c] = TileType.ICE;

      for (let c = 6; c <= 18; c += 4) g[1][c] = TileType.FALLING_ICICLE;
      for (let c = 3; c <= 20; c++) g[10][c] = TileType.DIAMOND;

      g[11][23] = TileType.EXIT;
      return g;
    })(),
  },
  {
    id: "frozen-14",
    world: 3,
    levelIndex: 14,
    title: "Sliding Chamber",
    width: 28,
    height: 14,
    spawn: { col: 2, row: 11 },
    exit: { col: 25, row: 11 },
    diamondsTotal: 16,
    secretsTotal: 1,
    targetTime: 65,
    tiles: (() => {
      const g = createEmptyGrid(28, 14);
      addBorderWalls(g);
      for (let c = 1; c < 27; c++) g[12][c] = TileType.ICE;

      g[11][8] = TileType.PUSHABLE;
      g[11][14] = TileType.PRESSURE_PLATE;
      for (let c = 3; c <= 22; c++) g[10][c] = TileType.DIAMOND;

      g[11][25] = TileType.EXIT;
      return g;
    })(),
  },
  {
    id: "frozen-15",
    world: 3,
    levelIndex: 15,
    title: "Frozen Core",
    width: 28,
    height: 14,
    spawn: { col: 2, row: 11 },
    exit: { col: 25, row: 11 },
    diamondsTotal: 18,
    secretsTotal: 1,
    targetTime: 70,
    tiles: (() => {
      const g = createEmptyGrid(28, 14);
      addBorderWalls(g);
      for (let c = 1; c < 27; c++) g[12][c] = TileType.ICE;

      for (let c = 4; c <= 22; c++) g[10][c] = TileType.DIAMOND;
      g[11][22] = TileType.GEM_RARE;

      g[11][25] = TileType.EXIT;
      return g;
    })(),
  },

  // ==========================================
  // WORLD 4 — VOLCANIC FORTRESS (Levels 16–20)
  // ==========================================
  {
    id: "volcano-16",
    world: 4,
    levelIndex: 16,
    title: "Ember Pass",
    width: 26,
    height: 14,
    spawn: { col: 2, row: 11 },
    exit: { col: 23, row: 11 },
    diamondsTotal: 14,
    secretsTotal: 1,
    targetTime: 55,
    tiles: (() => {
      const g = createEmptyGrid(26, 14);
      addBorderWalls(g);
      for (let c = 1; c < 25; c++) g[12][c] = TileType.SOLID;

      for (let c = 8; c <= 16; c++) g[12][c] = TileType.LAVA;
      for (let c = 8; c <= 16; c++) g[11][c] = TileType.COLLAPSING_FLOOR;

      for (let c = 3; c <= 20; c++) g[9][c] = TileType.DIAMOND;
      g[11][23] = TileType.EXIT;
      return g;
    })(),
  },
  {
    id: "volcano-17",
    world: 4,
    levelIndex: 17,
    title: "Lava Bridge",
    width: 26,
    height: 14,
    spawn: { col: 2, row: 11 },
    exit: { col: 23, row: 11 },
    diamondsTotal: 15,
    secretsTotal: 1,
    targetTime: 60,
    tiles: (() => {
      const g = createEmptyGrid(26, 14);
      addBorderWalls(g);
      for (let c = 1; c < 25; c++) g[12][c] = TileType.SOLID;

      for (let c = 6; c <= 18; c++) g[12][c] = TileType.LAVA;
      for (let c = 8; c <= 16; c += 4) g[11][c] = TileType.PLATFORM;

      for (let c = 3; c <= 20; c++) g[9][c] = TileType.DIAMOND;
      g[11][23] = TileType.EXIT;
      return g;
    })(),
  },
  {
    id: "volcano-18",
    world: 4,
    levelIndex: 18,
    title: "Furnace Hall",
    width: 28,
    height: 14,
    spawn: { col: 2, row: 11 },
    exit: { col: 25, row: 11 },
    diamondsTotal: 16,
    secretsTotal: 1,
    targetTime: 65,
    tiles: (() => {
      const g = createEmptyGrid(28, 14);
      addBorderWalls(g);
      for (let c = 1; c < 27; c++) g[12][c] = TileType.SOLID;

      g[11][8] = TileType.KEY_GOLD;
      g[11][18] = TileType.KEY_GOLD_GATE;
      for (let r = 5; r <= 11; r++) g[r][18] = TileType.SOLID;

      for (let c = 4; c <= 22; c++) g[10][c] = TileType.DIAMOND;
      g[11][25] = TileType.EXIT;
      return g;
    })(),
  },
  {
    id: "volcano-19",
    world: 4,
    levelIndex: 19,
    title: "Collapsing Fortress",
    width: 28,
    height: 14,
    spawn: { col: 2, row: 11 },
    exit: { col: 25, row: 11 },
    diamondsTotal: 18,
    secretsTotal: 1,
    targetTime: 70,
    tiles: (() => {
      const g = createEmptyGrid(28, 14);
      addBorderWalls(g);
      for (let c = 1; c < 27; c++) g[12][c] = TileType.SOLID;

      for (let c = 6; c <= 20; c += 2) g[11][c] = TileType.COLLAPSING_FLOOR;
      for (let c = 4; c <= 22; c++) g[9][c] = TileType.DIAMOND;

      g[11][25] = TileType.EXIT;
      return g;
    })(),
  },
  {
    id: "volcano-20",
    world: 4,
    levelIndex: 20,
    title: "Inferno Chamber",
    width: 30,
    height: 14,
    spawn: { col: 2, row: 11 },
    exit: { col: 27, row: 11 },
    diamondsTotal: 20,
    secretsTotal: 1,
    targetTime: 75,
    tiles: (() => {
      const g = createEmptyGrid(30, 14);
      addBorderWalls(g);
      for (let c = 1; c < 29; c++) g[12][c] = TileType.SOLID;

      for (let c = 4; c <= 24; c++) g[10][c] = TileType.DIAMOND;
      g[11][24] = TileType.GEM_RARE;

      g[11][27] = TileType.EXIT;
      return g;
    })(),
  },

  // ==========================================
  // WORLD 5 — LOST SANCTUARY (Levels 21–25)
  // ==========================================
  {
    id: "sanctuary-21",
    world: 5,
    levelIndex: 21,
    title: "Forgotten Gate",
    width: 28,
    height: 14,
    spawn: { col: 2, row: 11 },
    exit: { col: 25, row: 11 },
    diamondsTotal: 16,
    secretsTotal: 1,
    targetTime: 65,
    tiles: (() => {
      const g = createEmptyGrid(28, 14);
      addBorderWalls(g);
      for (let c = 1; c < 27; c++) g[12][c] = TileType.SOLID;

      g[11][8] = TileType.KEY_GOLD;
      g[11][18] = TileType.KEY_GOLD_GATE;
      for (let r = 4; r <= 11; r++) g[r][18] = TileType.SOLID;

      for (let c = 4; c <= 22; c++) g[10][c] = TileType.DIAMOND;
      g[11][25] = TileType.EXIT;
      return g;
    })(),
  },
  {
    id: "sanctuary-22",
    world: 5,
    levelIndex: 22,
    title: "Trial of Stones",
    width: 28,
    height: 14,
    spawn: { col: 2, row: 11 },
    exit: { col: 25, row: 11 },
    diamondsTotal: 18,
    secretsTotal: 1,
    targetTime: 70,
    tiles: (() => {
      const g = createEmptyGrid(28, 14);
      addBorderWalls(g);
      for (let c = 1; c < 27; c++) g[12][c] = TileType.SOLID;

      g[11][8] = TileType.PUSHABLE;
      g[11][14] = TileType.PRESSURE_PLATE;

      for (let c = 4; c <= 22; c++) g[10][c] = TileType.DIAMOND;
      g[11][25] = TileType.EXIT;
      return g;
    })(),
  },
  {
    id: "sanctuary-23",
    world: 5,
    levelIndex: 23,
    title: "Trial of Fire",
    width: 30,
    height: 14,
    spawn: { col: 2, row: 11 },
    exit: { col: 27, row: 11 },
    diamondsTotal: 20,
    secretsTotal: 1,
    targetTime: 75,
    tiles: (() => {
      const g = createEmptyGrid(30, 14);
      addBorderWalls(g);
      for (let c = 1; c < 29; c++) g[12][c] = TileType.SOLID;

      for (let c = 8; c <= 20; c += 4) g[11][c] = TileType.FIRE_TRAP;
      for (let c = 4; c <= 24; c++) g[10][c] = TileType.DIAMOND;

      g[11][27] = TileType.EXIT;
      return g;
    })(),
  },
  {
    id: "sanctuary-24",
    world: 5,
    levelIndex: 24,
    title: "Trial of Ice",
    width: 30,
    height: 14,
    spawn: { col: 2, row: 11 },
    exit: { col: 27, row: 11 },
    diamondsTotal: 20,
    secretsTotal: 1,
    targetTime: 80,
    tiles: (() => {
      const g = createEmptyGrid(30, 14);
      addBorderWalls(g);
      for (let c = 1; c < 29; c++) g[12][c] = TileType.ICE;

      for (let c = 8; c <= 20; c += 3) g[11][c] = TileType.SPIKE;
      for (let c = 4; c <= 25; c++) g[9][c] = TileType.DIAMOND;

      g[11][27] = TileType.EXIT;
      return g;
    })(),
  },
  {
    id: "sanctuary-25",
    world: 5,
    levelIndex: 25,
    title: "Guardian's Vault",
    width: 32,
    height: 14,
    spawn: { col: 2, row: 11 },
    exit: { col: 29, row: 11 },
    diamondsTotal: 25,
    secretsTotal: 1,
    targetTime: 90,
    tiles: (() => {
      const g = createEmptyGrid(32, 14);
      addBorderWalls(g);
      for (let c = 1; c < 31; c++) g[12][c] = TileType.SOLID;

      g[11][10] = TileType.KEY_GOLD;
      g[11][22] = TileType.KEY_GOLD_GATE;
      for (let r = 3; r <= 11; r++) g[r][22] = TileType.SOLID;

      for (let c = 4; c <= 27; c++) g[9][c] = TileType.DIAMOND;
      g[11][26] = TileType.GEM_SECRET;

      g[11][29] = TileType.EXIT;
      return g;
    })(),
  },
];
