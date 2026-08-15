import { CanvasRenderer } from "./CanvasRenderer";

/**
 * PixelRenderer with coordinate grid quantization and vintage retro pixel effects.
 */
export class PixelRenderer extends CanvasRenderer {
  private pixelSize: number;

  constructor(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    pixelSize: number = 2
  ) {
    super(ctx, width, height);
    this.pixelSize = pixelSize;
  }

  public setPixelSize(size: number): void {
    this.pixelSize = Math.max(1, size);
  }

  public getPixelSize(): number {
    return this.pixelSize;
  }

  /**
   * Snaps a coordinate value to discrete pixel quantization grid:
   * x = floor(x / pixelSize) * pixelSize
   */
  public quantize(val: number): number {
    return Math.floor(val / this.pixelSize) * this.pixelSize;
  }

  public override drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    fill: boolean = true
  ): void {
    const qx = this.quantize(x);
    const qy = this.quantize(y);
    const qw = Math.max(this.pixelSize, this.quantize(width));
    const qh = Math.max(this.pixelSize, this.quantize(height));
    super.drawRect(qx, qy, qw, qh, color, fill);
  }

  /**
   * Draws a pixelated retro block with highlight/shadow beveling.
   */
  public drawPixelBlock(
    x: number,
    y: number,
    size: number,
    baseColor: string,
    highlightColor?: string,
    shadowColor?: string
  ): void {
    this.drawPixelRect(x, y, size, size, baseColor, highlightColor, shadowColor);
  }

  /**
   * Draws a pixelated rectangular block with highlight and shadow beveling.
   */
  public drawPixelRect(
    x: number,
    y: number,
    width: number,
    height: number,
    baseColor: string,
    highlightColor?: string,
    shadowColor?: string
  ): void {
    const qx = this.quantize(x);
    const qy = this.quantize(y);
    const qw = Math.max(this.pixelSize, this.quantize(width));
    const qh = Math.max(this.pixelSize, this.quantize(height));
    const border = Math.max(1, this.pixelSize);

    // Base body
    this.drawRect(qx, qy, qw, qh, baseColor, true);

    if (highlightColor) {
      // Top and left highlight bevel
      this.drawRect(qx, qy, qw, border, highlightColor, true);
      this.drawRect(qx, qy, border, qh, highlightColor, true);
    }

    if (shadowColor) {
      // Bottom and right shadow bevel
      this.drawRect(qx, qy + qh - border, qw, border, shadowColor, true);
      this.drawRect(qx + qw - border, qy, border, qh, shadowColor, true);
    }
  }
}
