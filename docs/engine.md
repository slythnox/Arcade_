# Engine Runtime Internals

This document provides a comprehensive technical walkthrough of the custom **ARCADE_ 2D Game Engine** (`engine/`), detailing its subsystems, deterministic simulation loop, rendering pipeline, input normalization, audio synthesis, and particle physics.

---

## 1. Subsystem Architecture

The engine is comprised of distinct, decoupled subsystems coordinated by `GameEngine.ts`:

```text
                                  ┌───────────────────┐
                                  │    GameEngine     │
                                  └─────────┬─────────┘
          ┌─────────────────┬───────────────┼───────────────┬─────────────────┐
          ▼                 ▼               ▼               ▼                 ▼
   ┌─────────────┐   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   ┌─────────────┐
   │  GameLoop   │   │ GameSession │ │InputManager │ │PixelRenderer│   │AudioManager │
   │ (60Hz Loop) │   │ (Lifecycle) │ │(Key/Touch)  │ │(Canvas 2D)  │   │(Web Audio)  │
   └─────────────┘   └─────────────┘ └─────────────┘ └─────────────┘   └─────────────┘
```

---

## 2. Deterministic Fixed-Timestep Game Loop (`engine/GameLoop.ts`)

### The Variable Refresh Rate Problem
Modern displays operate at 60Hz, 120Hz, 144Hz, 165Hz, or 240Hz. Relying on the raw `deltaTime` between `requestAnimationFrame` callbacks causes severe defects:
- Physics behave differently on different monitors (e.g. higher jumps on 144Hz).
- Floating-point discrepancies accumulate, destroying game reproducibility.

### The Accumulator Pattern Solution
ARCADE_ implements a fixed-timestep accumulator pattern:

$$\Delta t_{\text{sim}} = \frac{1}{60} \approx 0.016667\text{ s}$$

Elapsed wall-clock time is added to an internal accumulator. The simulation advances in exact discrete slices of `FIXED_DT`:

```typescript
// engine/GameLoop.ts
private tick = (): void => {
  if (!this.isRunning) return;

  const now = performance.now();
  let frameDelta = (now - this.lastTime) / 1000; // in seconds
  this.lastTime = now;

  // 1. Delta Clamping (Spiral of Death Prevention)
  if (frameDelta > MAX_FRAME_DELTA) {
    frameDelta = MAX_FRAME_DELTA; // Clamped to 0.25s (15 ticks max)
  }

  // 2. Fixed Timestep Simulation
  if (!this.isPaused) {
    this.accumulator += frameDelta;

    while (this.accumulator >= FIXED_DT) {
      this.onUpdate(FIXED_DT);
      this.accumulator -= FIXED_DT;
    }
  }

  // 3. Render Pass
  this.onRender();

  // 4. FPS Measurement (1-second sliding window)
  this.frameCounter++;
  if (now - this.fpsTimer >= 1000) {
    this.currentFPS = Math.round((this.frameCounter * 1000) / (now - this.fpsTimer));
    this.frameCounter = 0;
    this.fpsTimer = now;
    if (this.onFPS) this.onFPS(this.currentFPS);
  }

  this.rafId = requestAnimationFrame(this.tick);
};
```

### Delta Clamping & Spiral of Death
When a user switches browser tabs, the browser throttles `requestAnimationFrame`. When the tab is refocused 10 seconds later, `frameDelta` would be 10.0 seconds. Without clamping, the `while` loop would attempt to execute 600 simulation steps in a single frame, locking the main thread.

ARCADE_ sets `MAX_FRAME_DELTA = 0.25` (`core/constants/timing.ts`), bounding backlog processing to a maximum of 15 ticks per frame.

---

## 3. Session & Lifecycle Management (`engine/GameSession.ts`)

`GameSession` manages score tracking, difficulty levels, game status, and input logging for replay verification:

```typescript
export class GameSession {
  public readonly gameId: string;
  public seed: number;
  public status: GameStatus = "idle";
  public score: number = 0;
  public level: number = 1;
  public lines: number = 0;
  public lives: number = 3;
  public elapsedTime: number = 0;
  public tickCount: number = 0;
  public frameCount: number = 0;
  public replayInputs: ReplayFrame[] = [];
  
  // Pub/sub listener pattern for React HUD updates
  public subscribe(listener: SessionStateListener): () => void;
}
```

### Input Logging & Replays
Every user input event is timestamped by discrete simulation tick count (`this.tickCount`):

```typescript
export interface ReplayFrame {
  tick: number;
  action: string;
  isPressed: boolean;
}
```
Because the engine loop and PRNG are deterministic, storing the initial seed and the array of `ReplayFrame` objects enables 100% faithful playback of any gameplay session.

---

## 4. Dependency Injection Context (`engine/GameContext.ts`)

Games do not interact with global singletons or the browser DOM directly. When a game is loaded, the engine provides an injected `GameContext`:

```typescript
export interface GameContext {
  session: GameSession;
  input: InputManager;
  renderer: Renderer;
  audio: AudioManager;
  random: RandomSource;
}
```

This architecture guarantees:
- **Testability:** Cartridges can be tested headlessly in Node.js by passing mock contexts.
- **Portability:** The rendering backend can be changed without modifying cartridge gameplay code.
- **Determinism:** All random numbers originate from the cartridge's injected `random` instance.

---

## 5. Input Normalization (`engine/input/InputManager.ts`)

`InputManager` abstracts raw DOM `KeyboardEvent` codes into standardized `GameAction` identifiers:

```typescript
export type GameAction =
  | "MOVE_LEFT"
  | "MOVE_RIGHT"
  | "MOVE_UP"
  | "MOVE_DOWN"
  | "ROTATE"
  | "ACTION_PRIMARY"
  | "ACTION_SECONDARY"
  | "PAUSE"
  | "RESTART"
  | "CONFIRM"
  | "BACK";
```

### Default Keybindings:
- **Directions:** `ArrowLeft`/`KeyA`, `ArrowRight`/`KeyD`, `ArrowUp`/`KeyW`, `ArrowDown`/`KeyS`
- **Primary Actions:** `Space`, `KeyX`
- **Rotation:** `KeyZ`, `ArrowUp`, `KeyW`
- **Secondary Actions:** `KeyC`, `ShiftLeft`, `ShiftRight`
- **System Controls:** `KeyP` (Pause), `KeyR` (Restart), `Escape` (Back), `Enter` (Confirm)

### Scroll Suppression:
The manager automatically suppresses default browser scrolling (`e.preventDefault()`) on arrow keys and spacebar when focused on the canvas.

---

## 6. Rendering Pipeline (`engine/rendering/`)

ARCADE_ provides a two-tiered rendering system:

### 1. `CanvasRenderer.ts`
Wraps the raw HTML5 Canvas 2D context, providing drawing primitives (`drawRect`, `drawCircle`, `drawLine`, `drawText`, `drawGrid`) while enforcing `ctx.imageSmoothingEnabled = false` for sharp edges.

### 2. `PixelRenderer.ts`
Extends `CanvasRenderer` with coordinate quantization:

$$x_{\text{quantized}} = \lfloor \frac{x}{\text{pixelSize}} \rfloor \cdot \text{pixelSize}$$

```typescript
export class PixelRenderer extends CanvasRenderer {
  private pixelSize: number;

  public quantize(val: number): number {
    return Math.floor(val / this.pixelSize) * this.pixelSize;
  }

  public override drawRect(
    x: number, y: number, width: number, height: number, color: string, fill: boolean = true
  ): void {
    const qx = this.quantize(x);
    const qy = this.quantize(y);
    const qw = Math.max(this.pixelSize, this.quantize(width));
    const qh = Math.max(this.pixelSize, this.quantize(height));
    super.drawRect(qx, qy, qw, qh, color, fill);
  }

  public drawPixelRect(
    x: number, y: number, width: number, height: number,
    baseColor: string, highlightColor?: string, shadowColor?: string
  ): void {
    // Renders bevel-lit retro bricks with authentic highlight/shadow borders
  }
}
```

---

## 7. Procedural Audio Synthesizer (`engine/audio/AudioManager.ts`)

ARCADE_ creates all sounds programmatically via the **Web Audio API**:

```typescript
export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.7;

  public playTone(
    frequency: number,
    type: OscillatorType,
    durationMs: number,
    gainLevel: number = 0.3,
    frequencySlideTo?: number
  ): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Optional pitch sweep
    if (frequencySlideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(1, frequencySlideTo),
        ctx.currentTime + durationMs / 1000
      );
    }

    // ADSR Envelope
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(gainLevel, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000 + 0.05);
  }
}
```

### Built-in Presets:
- `playMove()`: 220Hz Square Wave (40ms)
- `playRotate()`: 330Hz $\to$ 440Hz Triangle Wave Slide (60ms)
- `playDrop()`: 150Hz $\to$ 80Hz Square Wave (80ms)
- `playCoin()`: Arpeggiated dual square tones (987Hz $\to$ 1318Hz)
- `playLineClear()`: 4-note chord progression (C5, E5, G5, C6)
- `playExplosion()`: 180Hz $\to$ 30Hz Sawtooth rumble with rapid decay
- `playGameOver()`: Descending minor arpeggio (440Hz, 415Hz, 392Hz, 349Hz)

---

## 8. Universal Particle System (`engine/particles/ParticleSystem.ts`)

The particle engine renders bursts of sparks, thruster trails, and floating score popups without external sprites:
- **Burst Emission:** Radial velocity distribution with random angular jitter.
- **Alpha Fading:** Linear alpha interpolation based on remaining lifetime: $\alpha = \max(0, \frac{\text{life}}{\text{maxLife}})$.
- **Floating Text:** Ascending score popups ($+100$, $+500$, $COMBO!$) rendered via `renderer.drawText()`.
