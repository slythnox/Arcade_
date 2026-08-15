# ADR-003: HTML5 Canvas 2D Over DOM/SVG/WebGL

## Status
Accepted

## Context
Rendering 2D games in the browser can be achieved via DOM manipulation (React/Divs), SVG, pure Canvas 2D, or WebGL. 

## Decision
We chose the pure HTML5 Canvas 2D API for all rendering.

## Consequences
- **Retro Aesthetic:** Canvas 2D makes pixel-perfect rendering and block-snapping (integer coordinates) trivial, ensuring the 8-bit/16-bit retro aesthetic remains authentic.
- **Batch Draw Calls:** Updating thousands of particles via Canvas is drastically faster than attempting to reconcile thousands of DOM node updates via React.
- **Complexity Tradeoff:** While WebGL offers superior performance for complex scenes, the overhead of writing custom shaders and managing GL contexts was deemed overkill for 2D logic puzzles and arcade classics. Canvas 2D hits the sweet spot of performance and maintainability.
