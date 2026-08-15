import { FIXED_DT, MAX_FRAME_DELTA, DEFAULT_FPS_SAMPLE_RATE } from "../core/constants/timing";

export type UpdateCallback = (dt: number) => void;
export type RenderCallback = () => void;
export type FPSCallback = (fps: number) => void;

/**
 * High-precision deterministic fixed-timestep game loop.
 * Decouples physics and game simulation ticks from screen refresh rate (60Hz to 240Hz+).
 */
export class GameLoop {
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private rafId: number | null = null;
  private lastTime: number = 0;
  private accumulator: number = 0;

  private onUpdate: UpdateCallback;
  private onRender: RenderCallback;
  private onFPS?: FPSCallback;

  private frameCounter: number = 0;
  private fpsTimer: number = 0;
  private currentFPS: number = 60;

  constructor(
    onUpdate: UpdateCallback,
    onRender: RenderCallback,
    onFPS?: FPSCallback
  ) {
    this.onUpdate = onUpdate;
    this.onRender = onRender;
    this.onFPS = onFPS;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.accumulator = 0;
    this.lastTime = performance.now();
    this.frameCounter = 0;
    this.fpsTimer = performance.now();

    this.tick();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.accumulator = 0;
  }

  public getFPS(): number {
    return this.currentFPS;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  private tick = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    let frameDelta = (now - this.lastTime) / 1000; // in seconds
    this.lastTime = now;

    // Clamp frame delta to avoid spiral-of-death on background tab switch
    if (frameDelta > MAX_FRAME_DELTA) {
      frameDelta = MAX_FRAME_DELTA;
    }

    if (!this.isPaused) {
      this.accumulator += frameDelta;

      // Fixed timestep simulation steps
      while (this.accumulator >= FIXED_DT) {
        this.onUpdate(FIXED_DT);
        this.accumulator -= FIXED_DT;
      }
    }

    // Render frame
    this.onRender();

    // FPS calculations
    this.frameCounter++;
    if (now - this.fpsTimer >= 1000) {
      this.currentFPS = Math.round((this.frameCounter * 1000) / (now - this.fpsTimer));
      this.frameCounter = 0;
      this.fpsTimer = now;
      if (this.onFPS) {
        this.onFPS(this.currentFPS);
      }
    }

    this.rafId = requestAnimationFrame(this.tick);
  };
}
