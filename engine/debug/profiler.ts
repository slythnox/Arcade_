/** Per-frame timing sample. */
export interface FrameProfile {
  updateMs: number;
  renderMs: number;
  totalMs: number;
  fps: number;
  entityCount: number;
}

/**
 * Lightweight performance profiler.
 * Tracks update/render durations and computes rolling FPS.
 * Zero overhead when disabled.
 *
 * Usage:
 *   profiler.beginUpdate();
 *   game.update(dt);
 *   profiler.endUpdate();
 *   profiler.beginRender();
 *   game.render();
 *   profiler.endRender();
 */
export class Profiler {
  private enabled: boolean;
  private updateStart = 0;
  private renderStart = 0;

  private lastUpdateMs = 0;
  private lastRenderMs = 0;

  private frameCount = 0;
  private fpsTimer = 0;
  private currentFps = 60;

  private readonly history: FrameProfile[] = [];
  private readonly historyLimit: number;

  constructor(enabled = false, historyLimit = 120) {
    this.enabled = enabled;
    this.historyLimit = historyLimit;
  }

  public enable(): void { this.enabled = true; }
  public disable(): void { this.enabled = false; }
  public isEnabled(): boolean { return this.enabled; }

  public beginUpdate(): void {
    if (!this.enabled) return;
    this.updateStart = performance.now();
  }

  public endUpdate(): void {
    if (!this.enabled) return;
    this.lastUpdateMs = performance.now() - this.updateStart;
  }

  public beginRender(): void {
    if (!this.enabled) return;
    this.renderStart = performance.now();
  }

  public endRender(entityCount = 0): void {
    if (!this.enabled) return;
    this.lastRenderMs = performance.now() - this.renderStart;
    this.frameCount++;

    const now = performance.now();
    if (now - this.fpsTimer >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.fpsTimer));
      this.frameCount = 0;
      this.fpsTimer = now;
    }

    const profile: FrameProfile = {
      updateMs: this.lastUpdateMs,
      renderMs: this.lastRenderMs,
      totalMs: this.lastUpdateMs + this.lastRenderMs,
      fps: this.currentFps,
      entityCount,
    };

    this.history.push(profile);
    if (this.history.length > this.historyLimit) {
      this.history.shift();
    }
  }

  public getLastFrame(): FrameProfile | null {
    return this.history[this.history.length - 1] ?? null;
  }

  public getAverageUpdateMs(): number {
    if (this.history.length === 0) return 0;
    return this.history.reduce((sum, f) => sum + f.updateMs, 0) / this.history.length;
  }

  public getAverageRenderMs(): number {
    if (this.history.length === 0) return 0;
    return this.history.reduce((sum, f) => sum + f.renderMs, 0) / this.history.length;
  }

  public getCurrentFps(): number {
    return this.currentFps;
  }

  public getHistory(): readonly FrameProfile[] {
    return this.history;
  }

  public reset(): void {
    this.history.length = 0;
    this.frameCount = 0;
    this.fpsTimer = 0;
  }
}

/** Singleton profiler. Disabled by default. Enable via dev tools or debug flag. */
export const profiler = new Profiler(false);
