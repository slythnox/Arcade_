# ADR-001: Custom Game Engine Over Third-Party Framework

## Status
Accepted

## Context
When architecting ARCADE_, we needed to decide whether to use a well-established game engine framework (e.g., Phaser, PixiJS, Unity WebGL) or build a custom engine targeting HTML5 Canvas 2D. 

## Decision
We elected to build a completely custom, dependency-free game engine for ARCADE_ utilizing pure TypeScript and HTML5 Canvas 2D.

## Consequences
- **Payload Size:** By avoiding engines like Unity or Phaser, the baseline JavaScript payload was reduced by several megabytes, resulting in near-instant load times.
- **Transparent Execution:** We maintain 100% control over the game loop, making it trivial to pause, rewind, or dynamically alter state.
- **Licensing:** No third-party engine licenses or splash screens to negotiate.
- **Trade-off:** We had to implement standard features (collisions, math, loops) from scratch.
