/**
 * ARCADE_ Debug Overlay
 * Activated via ?debug=1 URL param.
 * Shows only measurable runtime metrics without faking numbers.
 * @module
 */

export interface OverlayMetrics {
  fps: number;
  updateMs: number;
  renderMs: number;
  score: number;
  level: number;
  gameName: string;
}

/**
 * Draws a debug overlay on the canvas showing live performance metrics.
 * Uses only Canvas2D APIs — no Performance API hacks, no faked heap numbers.
 */
export class MemoryOverlay {
  private visible: boolean;
  private metrics: OverlayMetrics;

  constructor() {
    this.visible = typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("debug") === "1";
    this.metrics = { fps: 0, updateMs: 0, renderMs: 0, score: 0, level: 1, gameName: "" };
  }

  public update(metrics: Partial<OverlayMetrics>): void {
    Object.assign(this.metrics, metrics);
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    const lines = [
      "ARCADE_ DEBUG",
      `FPS        ${this.metrics.fps.toFixed(0)}`,
      `Update     ${this.metrics.updateMs.toFixed(1)} ms`,
      `Render     ${this.metrics.renderMs.toFixed(1)} ms`,
      `Score      ${this.metrics.score}`,
      `Level      ${this.metrics.level}`,
      `Game       ${this.metrics.gameName.substring(0, 14)}`,
    ];

    const pad = 8;
    const lineH = 16;
    const w = 160;
    const h = pad * 2 + lineH * lines.length;
    const x = ctx.canvas.width - w - 8;
    const y = 8;

    ctx.save();
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = "#050d1a";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#a879ff";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    ctx.globalAlpha = 1;

    ctx.font = '700 10px "Courier New", monospace';
    lines.forEach((line, i) => {
      ctx.fillStyle = i === 0 ? "#a879ff" : "#c8d4f0";
      ctx.fillText(line, x + pad, y + pad + lineH * (i + 0.8));
    });

    ctx.restore();
  }

  public get isVisible(): boolean {
    return this.visible;
  }
}
