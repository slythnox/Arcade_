import { Rectangle, Circle, Point2D } from "../../core/types/geometry";

/**
 * Common Renderer interface.
 * Decouples game logic from specific Canvas 2D / WebGL / Debug drawing APIs.
 */
export interface Renderer {
  clear(color?: string): void;
  drawRect(x: number, y: number, width: number, height: number, color: string, fill?: boolean): void;
  drawCircle(x: number, y: number, radius: number, color: string, fill?: boolean): void;
  drawLine(x1: number, y1: number, x2: number, y2: number, color: string, lineWidth?: number): void;
  drawText(text: string, x: number, y: number, options?: TextRenderOptions): void;
  drawGrid(cols: number, rows: number, cellSize: number, color: string, originX?: number, originY?: number): void;
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  scale(sx: number, sy: number): void;
  rotate(radians: number): void;
  getWidth(): number;
  getHeight(): number;
}

export interface TextRenderOptions {
  color?: string;
  font?: string;
  size?: number;
  align?: "left" | "center" | "right";
  baseline?: "top" | "middle" | "bottom" | "alphabetic";
  shadowColor?: string;
  shadowBlur?: number;
}
