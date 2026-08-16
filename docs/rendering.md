# Rendering Pipeline & Canvas 2D Architecture

This document describes the rendering architecture, coordinate quantization, integer snapping, CRT post-processing, and pixel-art optimization techniques in **ARCADE_** (`engine/rendering/`).

---

## 1. Canvas 2D vs WebGL Trade-off

When architecting ARCADE_, the team evaluated Canvas 2D versus WebGL/WebGPU:

| Dimension | HTML5 Canvas 2D | WebGL / WebGPU |
|---|---|---|
| **Payload Size** | Built into every browser (0 KB extra overhead) | Requires shader pipelines, buffers, and matrices |
| **Pixel Art Snapping** | Native coordinate snapping via `Math.floor()` | Requires texture filtering tweaks (`gl.NEAREST`) |
| **Development Velocity** | Direct immediate-mode drawing API | High boilerplate for simple 2D primitives |
| **Platform Compatibility** | 100% support across mobile and legacy browsers | Varies by hardware drivers and WebGL context limits |

**Decision:** HTML5 Canvas 2D provides the optimal balance of zero runtime payload, predictable performance, and authentic retro pixel rendering.

---

## 2. The `Renderer` Interface (`engine/rendering/Renderer.ts`)

Cartridges interact with rendering via a standardized interface:

```typescript
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
```

---

## 3. Pixel Quantization & Sub-Pixel Blurring

### The Sub-Pixel Problem
When coordinates with fractional components (e.g. $x = 10.45$) are rendered on a standard HTML5 Canvas, the browser's anti-aliasing engine interpolates between adjacent physical pixels, creating a blurry, fuzzy edge that ruins retro pixel art.

### The Solution: Quantization Grid (`engine/rendering/PixelRenderer.ts`)
`PixelRenderer` quantizes all drawing coordinates to discrete integer grid multiples:

$$x_{\text{pixel}} = \left\lfloor \frac{x}{\text{pixelSize}} \right\rfloor \times \text{pixelSize}$$

```typescript
export class PixelRenderer extends CanvasRenderer {
  private pixelSize: number = 2;

  public quantize(val: number): number {
    return Math.floor(val / this.pixelSize) * this.pixelSize;
  }

  public override drawRect(x: number, y: number, width: number, height: number, color: string, fill = true): void {
    const qx = this.quantize(x);
    const qy = this.quantize(y);
    const qw = Math.max(this.pixelSize, this.quantize(width));
    const qh = Math.max(this.pixelSize, this.quantize(height));
    super.drawRect(qx, qy, qw, qh, color, fill);
  }
}
```

### Image Smoothing Suppression
During canvas initialization, image smoothing is explicitly disabled:
```typescript
this.ctx.imageSmoothingEnabled = false;
```

---

## 4. Bevel Lighting for 3D Retro Bricks

To emulate 1980s arcade bricks (e.g. *Breakout*, *Tetris*), `PixelRenderer.drawPixelRect()` adds illuminated highlight bevels on the top/left borders and shadow bevels on the bottom/right borders:

```typescript
public drawPixelRect(
  x: number, y: number, width: number, height: number,
  baseColor: string, highlightColor?: string, shadowColor?: string
): void {
  const qx = this.quantize(x);
  const qy = this.quantize(y);
  const qw = Math.max(this.pixelSize, this.quantize(width));
  const qh = Math.max(this.pixelSize, this.quantize(height));
  const border = Math.max(1, this.pixelSize);

  // 1. Base Tile Body
  this.drawRect(qx, qy, qw, qh, baseColor, true);

  // 2. Top & Left Highlight Bevel
  if (highlightColor) {
    this.drawRect(qx, qy, qw, border, highlightColor, true);
    this.drawRect(qx, qy, border, qh, highlightColor, true);
  }

  // 3. Bottom & Right Shadow Bevel
  if (shadowColor) {
    this.drawRect(qx, qy + qh - border, qw, border, shadowColor, true);
    this.drawRect(qx + qw - border, qy, border, qh, shadowColor, true);
  }
}
```

---

## 5. CRT Post-Processing & Scanlines

The retro visual atmosphere is enhanced via CSS overlay shaders mounted inside `components/game/CRTOverlay.tsx`:
- **Scanlines:** Repeating horizontal linear gradient lines at 4px pitch.
- **Phosphor Vignette:** Radial dark vignette gradient darkening corners.
- **CRT Barrel Distortion:** Subtle curved border shadows to simulate curved cathode-ray tube glass.
- **User Toggle:** Can be toggled on/off via the in-game Settings panel (`crtEnabled: boolean`).

---

## 6. Rendering Performance Rules

1. **Never allocate objects in `render()`:** Avoid `new Vector2()` or `{ x, y }` literals inside frame drawing code.
2. **Minimize Context State Switches:** Group draw calls sharing the same `fillStyle` or `strokeStyle` together.
3. **Use Integer Coordinates:** Non-integer values force unnecessary CPU rasterization work.
