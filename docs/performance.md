# Performance Guidelines

Achieving buttery smooth 60FPS (or higher) on Canvas 2D requires strict memory and rendering discipline.

## Fixed Timestep & Framerate Independence
Our engine runs on a fixed timestep. This means the physics engine evaluates `update(dt)` in deterministic slices regardless of screen refresh rate. This strictly prevents frame-rate dependent physics bugs (e.g. falling through floors on lag spikes).

## Memory Management

### Object Pooling
Garbage Collection (GC) pauses are the enemy of smooth frame rates. Spawning and deleting thousands of bullets or particles per frame triggers GC spikes.
**Solution:** Use `core/math/pool.ts` `ObjectPool<T>`. Pre-allocate all required entities at game initialization, deactivate them when "destroyed", and recycle them when spawning new ones.

## Rendering Optimization

### Integer Coordinates
Canvas 2D attempts to anti-alias objects drawn at sub-pixel coordinates (e.g. `x = 10.5`). This is computationally expensive and blurs retro graphics.
**Solution:** Always use `Math.floor()` or bitwise operations (`x | 0`) before passing coordinates to the `PixelRenderer`.

### Avoid Per-Frame Allocations
Do not instantiate arrays, objects, or strings inside the `update` or `render` loops. 
*Bad:*
```typescript
render(renderer: Renderer) {
  renderer.drawRect({x: 10, y: 10}, {w: 5, h: 5}); // Creates 2 objects every frame
}
```
*Good:* Reuse cached vectors and configuration objects.

### Context Switches
Changing Canvas context state (`fillStyle`, `globalAlpha`, `lineWidth`) incurs overhead. Batch draw calls of the same color/style together whenever possible.

## Collision Optimization

### Spatial Hashing
Checking collisions between 100 entities via brute force requires `100 * 100 = 10,000` checks per frame ($O(N^2)$).
**Solution:** `core/algorithms/spatialHash.ts`. Divide the game grid into cells. Entities register which cell they occupy. Only test collisions between entities occupying the same or adjacent cells, vastly reducing computation to $O(N)$.

## Profiling Tools
When performance drops, use Chrome DevTools:
1. **Performance Panel:** Record a timeline. Check if bottlenecks are in `update` (CPU bound) or `render` (GPU bound).
2. **Memory Panel:** Take heap snapshots to identify memory leaks or monitor the "sawtooth" pattern indicative of heavy GC usage.
