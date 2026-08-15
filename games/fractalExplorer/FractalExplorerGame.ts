import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { GameAction } from "../../core/types/game";

export class FractalExplorerGame implements GameInstance {
  private ctx!: GameContext;
  private centerX: number = -0.5;
  private centerY: number = 0;
  private zoom: number = 1;
  private maxIter: number = 64;
  private isDirty: boolean = true;
  private imageData: ImageData | null = null;
  private canvasCtx: CanvasRenderingContext2D | null = null;
  
  init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  reset(): void {
    this.centerX = -0.5;
    this.centerY = 0;
    this.zoom = 1;
    this.isDirty = true;
  }

  update(deltaTime: number): void {
    // No continuous physics to update
  }

  handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed) return;
    
    const panStep = 0.1 / this.zoom;
    
    switch (action) {
      case "MOVE_UP":
        this.centerY -= panStep;
        this.isDirty = true;
        break;
      case "MOVE_DOWN":
        this.centerY += panStep;
        this.isDirty = true;
        break;
      case "MOVE_LEFT":
        this.centerX -= panStep;
        this.isDirty = true;
        break;
      case "MOVE_RIGHT":
        this.centerX += panStep;
        this.isDirty = true;
        break;
      case "ACTION_PRIMARY": // Z = Zoom In
        this.zoom *= 1.5;
        this.isDirty = true;
        break;
      case "ACTION_SECONDARY": // X = Zoom Out
        this.zoom /= 1.5;
        this.isDirty = true;
        break;
      case "RESTART":
        this.reset();
        break;
    }
  }

  private renderFractal(width: number, height: number): void {
    if (!this.imageData || this.imageData.width !== width || this.imageData.height !== height) {
      this.imageData = new ImageData(width, height);
    }
    
    const data = this.imageData.data;
    const w = width;
    const h = height;
    
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        // Map pixel to complex plane
        const x0 = (px - w / 2) * (4 / w) / this.zoom + this.centerX;
        const y0 = (py - h / 2) * (4 / h) / this.zoom + this.centerY; // 4/h to maintain square aspect ratio roughly
        
        let x = 0;
        let y = 0;
        let iter = 0;
        
        while (x * x + y * y <= 4 && iter < this.maxIter) {
          const xTemp = x * x - y * y + x0;
          y = 2 * x * y + y0;
          x = xTemp;
          iter++;
        }
        
        const idx = (py * w + px) * 4;
        if (iter === this.maxIter) {
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = 255;
        } else {
          // HSL to RGB approx for hue = iter / maxIter * 360
          const hue = iter / this.maxIter;
          const { r, g, b } = this.hslToRgb(hue, 1, 0.5);
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }
    }
  }

  private hslToRgb(h: number, s: number, l: number) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }

  render(renderer: Renderer): void {
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // Try to get actual canvas context for fast pixel drawing
    if (!this.canvasCtx) {
      this.canvasCtx = (renderer as any).ctx || null;
    }

    if (this.isDirty) {
      // For performance, render at lower resolution if needed, but we do full for now.
      const renderW = Math.min(w, 400); // cap to 400 width for speed
      const renderH = Math.min(h, 400); 
      this.renderFractal(renderW, renderH);
      this.isDirty = false;
    }

    renderer.clear("#000");

    if (this.canvasCtx && this.imageData) {
      // Put image data in top left, then scale up if needed (this overwrites scale, but fine for basic)
      // For a proper scalable approach we should use putImageData or drawImage on a temp canvas.
      // We will just putImageData directly.
      this.canvasCtx.putImageData(this.imageData, 0, 0);
    } else {
      // Slow fallback path
      renderer.drawText("Canvas context not accessible for fast render", 10, 50, { color: "#fff" });
    }

    renderer.drawText(`Zoom: ${this.zoom.toFixed(2)}x`, 10, 20, { color: "#fff" });
  }

  pause(): void {}
  resume(): void {}
  destroy(): void {}
  getScore(): number { return 0; }
  getLevel(): number { return 1; }
}
