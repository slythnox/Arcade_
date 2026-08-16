/** ARCADE_ v1.2.2 */
/**
 * Timing constants for the deterministic game loop and runtime.
 */
export const SIMULATION_HZ = 60;
export const FIXED_DT = 1 / SIMULATION_HZ; // ~0.016667 seconds (16.67ms)
export const FIXED_DT_MS = FIXED_DT * 1000;

/**
 * Maximum accumulated frame time delta in seconds.
 * Prevents simulation death spirals if the browser tab freezes or drops frames.
 */
export const MAX_FRAME_DELTA = 0.25; // max 250ms backlog (15 ticks max per frame)

export const DEFAULT_FPS_SAMPLE_RATE = 30; // update FPS display every 30 frames
