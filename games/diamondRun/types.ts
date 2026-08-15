import type { GridCoord } from "../../core/types/geometry";
import type { GameAction } from "../../core/types/game";

export type DiamondRunGameState =
  | "BOOT"
  | "MENU"
  | "WORLD_SELECT"
  | "LEVEL_SELECT"
  | "PLAYING"
  | "PAUSED"
  | "DEAD"
  | "LEVEL_COMPLETE"
  | "GAME_COMPLETE";

export enum TileType {
  EMPTY = 0,
  SOLID = 1,
  PLATFORM = 2,
  LADDER = 3,
  SPIKE = 4,
  WATER = 5,
  LAVA = 6,
  ICE = 7,
  SAND = 8,
  MUD = 9,
  BREAKABLE = 10,
  PUSHABLE = 11,
  PRESSURE_PLATE = 12,
  SWITCH = 13,
  DOOR = 14,
  KEY_BRONZE_GATE = 15,
  KEY_SILVER_GATE = 16,
  KEY_GOLD_GATE = 17,
  CHECKPOINT = 18,
  EXIT = 19,
  DIAMOND = 20,
  GEM_RARE = 21,
  GEM_SECRET = 22,
  BOULDER = 23,
  MOVING_PLATFORM = 24,
  BOUNCE_PAD = 25,
  KEY_BRONZE = 26,
  KEY_SILVER = 27,
  KEY_GOLD = 28,
  SECRET_WALL = 29,
  FIRE_TRAP = 30,
  FALLING_ICICLE = 31,
  COLLAPSING_FLOOR = 32,
}

export interface PlayerState {
  x: number; // world x in pixels
  y: number; // world y in pixels
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  isClimbing: boolean;
  isSliding: boolean;
  facing: "left" | "right";
  coyoteTimer: number;
  jumpBufferTimer: number;
  invulnerabilityTimer: number;
  isDead: boolean;
}

export interface EntityState {
  id: string;
  type: "boulder" | "pushable_crate" | "moving_platform" | "fire_trap" | "icicle" | "collapsing_tile";
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  active: boolean;
  state?: number; // state timer or toggle state
  linkedId?: string;
  triggerKey?: string;
}

export interface LevelData {
  id: string;
  world: number;
  levelIndex: number; // 1 to 25
  title: string;
  width: number; // grid columns
  height: number; // grid rows
  tiles: number[][]; // 2D grid [row][col]
  spawn: GridCoord;
  exit: GridCoord;
  diamondsTotal: number;
  secretsTotal: number;
  targetTime: number; // in seconds
  entities?: Partial<EntityState>[];
}

export interface LevelProgress {
  unlocked: boolean;
  completed: boolean;
  perfect: boolean;
  diamondsCollected: number;
  diamondsTotal: number;
  secretsFound: number;
  secretsTotal: number;
  bestScore: number;
  bestTime: number; // in seconds
}

export interface WorldProgress {
  worldId: number;
  name: string;
  unlocked: boolean;
  completed: boolean;
  levels: LevelProgress[];
}
