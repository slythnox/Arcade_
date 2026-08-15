/**
 * Centralized tuning parameters for Diamond Run.
 */

export const TILE_SIZE = 16; // Logical tile size in pixels
export const LOGICAL_WIDTH = 320; // 20 tiles wide viewport
export const LOGICAL_HEIGHT = 180; // 11.25 tiles high viewport

export const PLAYER_WIDTH = 12;
export const PLAYER_HEIGHT = 15;

// Physics tuning
export const PLAYER_ACCEL = 720;
export const PLAYER_MAX_SPEED = 110;
export const PLAYER_FRICTION = 0.82;
export const ICE_FRICTION = 0.96;
export const MUD_FRICTION = 0.55;

export const JUMP_FORCE = 260;
export const GRAVITY = 740;
export const MAX_FALL_SPEED = 320;
export const COYOTE_TIME_MAX = 0.12; // 120ms
export const JUMP_BUFFER_MAX = 0.12; // 120ms
export const INVULNERABILITY_MAX = 1.2; // 1.2s

// Scoring constants
export const DIAMOND_SCORE = 100;
export const GEM_RARE_SCORE = 500;
export const GEM_SECRET_SCORE = 1000;
export const TIME_BONUS_PER_SEC = 20;

// Palettes per world
export const WORLD_PALETTES: Record<number, { bg: string; wall: string; accent: string; hud: string }> = {
  1: { bg: "#0d1b1e", wall: "#C8A46A", accent: "#4DE8E8", hud: "#FFD84D" }, // Ancient Ruins
  2: { bg: "#091c10", wall: "#2D6A4F", accent: "#63E66D", hud: "#FFD84D" }, // Jungle Temple
  3: { bg: "#0b192c", wall: "#48CAE4", accent: "#00F0FF", hud: "#E0F2FE" }, // Frozen Caverns
  4: { bg: "#210909", wall: "#D90429", accent: "#FF5C8A", hud: "#FFD84D" }, // Volcanic Fortress
  5: { bg: "#190028", wall: "#8338EC", accent: "#A879FF", hud: "#FFD84D" }, // Lost Sanctuary
};
