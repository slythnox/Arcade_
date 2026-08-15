# Engine Internals

## The Fixed Timestep

A common mistake in browser games is tying game physics to `requestAnimationFrame`. If a monitor is 144Hz, the game runs twice as fast. ARCADE_ prevents this using an accumulator loop decoupling render framerate from the physics timestep.

### The Accumulator Pattern

```typescript
// From GameLoop.ts
if (!this.isPaused) {
  this.accumulator += frameDelta;

  while (this.accumulator >= FIXED_DT) {
    this.onUpdate(FIXED_DT);
    this.accumulator -= FIXED_DT;
  }
}
```
*Why it matters:* Deterministic physics. If you jump for 2 seconds, you travel the exact same distance regardless of monitor refresh rate.

## Delta Clamping (The Spiral of Death)

When users switch browser tabs, `requestAnimationFrame` pauses. When they return, `frameDelta` could be 30 seconds. Without clamping, the `while` loop would run thousands of times, freezing the tab (the spiral of death).

```typescript
if (frameDelta > MAX_FRAME_DELTA) {
  frameDelta = MAX_FRAME_DELTA;
}
```

## Audio Synthesis

We rely purely on the Web Audio API. 
- **No external files:** Zero HTTP requests for assets.
- **Oscillators:** Games request square, sine, sawtooth, or triangle waves.
- **ADSR Envelopes:** Attack, Decay, Sustain, Release curves dynamically shape the oscillator volume to simulate strikes, thuds, and lasers.

## Input Normalization

Keyboards, gamepads, and touch screens are all abstracted.
Games only ever see a `GameAction` (e.g., `GameAction.UP`).

*Why?* The game shouldn't care if the user pressed `W`, the `Up Arrow`, or pushed an analog stick forward. The `InputManager` maps all these to the exact same enum.

## PixelRenderer

The renderer wraps standard Canvas methods but enforces sub-pixel safety.

*Integer Coordinates:* Drawing to `x=10.5` on a Canvas causes anti-aliasing blur. The `PixelRenderer` uses `Math.floor()` internally to ensure crisp retro boundaries.
*`drawPixelBlock`*: A specialized method for scaling retro-styled blocks uniformly across the entire grid surface.

## GameContext Injection

Games do not use `window` or global singletons. 
```typescript
init(ctx: GameContext): void;
```
Everything a game needs (Random numbers, Audio triggers, Input states) is provided through `GameContext`. This dependency injection makes games completely isolated and trivially testable.
