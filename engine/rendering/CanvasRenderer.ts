import { Renderer, TextRenderOptions } from "./Renderer";

/**
 * Standard HTML5 Canvas 2D Renderer implementation.
 */
export class CanvasRenderer implements Renderer {
  protected ctx: CanvasRenderingContext2D;
  protected width: number;
  protected height: number;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.ctx.imageSmoothingEnabled = false;
  }

  public setDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }

  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  public clear(color: string = "#050705"): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  public drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    fill: boolean = true
  ): void {
    if (fill) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y, width, height);
    } else {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x, y, width, height);
    }
  }

  public drawCircle(
    x: number,
    y: number,
    radius: number,
    color: string,
    fill: boolean = true
  ): void {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    if (fill) {
      this.ctx.fillStyle = color;
      this.ctx.fill();
    } else {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
  }

  public drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    lineWidth: number = 1
  ): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.stroke();
  }

  public drawText(text: string, x: number, y: number, options: TextRenderOptions = {}): void {
    const {
      color = "#E5E7E5",
      size = 14,
      font = '"Courier New", Courier, monospace',
      align = "left",
      baseline = "alphabetic",
      shadowColor,
      shadowBlur,
    } = options;

    this.ctx.save();
    this.ctx.font = `${size}px ${font}`;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;
    this.ctx.fillStyle = color;

    if (shadowColor && shadowBlur) {
      this.ctx.shadowColor = shadowColor;
      this.ctx.shadowBlur = shadowBlur;
    }

    this.ctx.fillText(text, x, y);
    this.ctx.restore();
  }

  public drawGrid(
    cols: number,
    rows: number,
    cellSize: number,
    color: string,
    originX: number = 0,
    originY: number = 0
  ): void {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1;

    for (let c = 0; c <= cols; c++) {
      const x = originX + c * cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(x, originY);
      this.ctx.lineTo(x, originY + rows * cellSize);
      this.ctx.stroke();
    }

    for (let r = 0; r <= rows; r++) {
      const y = originY + r * cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(originX, y);
      this.ctx.lineTo(originX + cols * cellSize, y);
      this.ctx.stroke();
    }
  }

  public save(): void {
    this.ctx.save();
  }

  public restore(): void {
    this.ctx.restore();
  }

  public translate(x: number, y: number): void {
    this.ctx.translate(x, y);
  }

  public scale(sx: number, sy: number): void {
    this.ctx.scale(sx, sy);
  }

  public rotate(radians: number): void {
    this.ctx.rotate(radians);
  }
}
