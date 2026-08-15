# ADR-002: Fixed-Timestep Loop

## Status
Accepted

## Context
Browser refresh rates are highly variable (60Hz, 120Hz, 144Hz, 240Hz+). Relying directly on `requestAnimationFrame` for physics calculations breaks deterministic behavior, making games play differently based on the user's monitor.

## Decision
We adopted the accumulator pattern for a fixed-timestep game loop. The simulation step (`FIXED_DT`) is decoupled from the render rate.

## Consequences
- **Determinism:** Physics calculations always produce the exact same results over time. Replays and AI behavior are perfectly reproducible.
- **The Spiral of Death:** If a user tabs away, the delta time can grow massively. To prevent the loop from hanging the browser trying to simulate thousands of frames upon return, we introduced delta clamping in `GameLoop.ts`.
- **Interpolation:** Rendering state happens between ticks, meaning we occasionally must rely on spatial interpolation for perfectly smooth visuals on high-refresh monitors.
