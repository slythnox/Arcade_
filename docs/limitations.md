# Known Technical Limitations & Design Boundaries

This document provides an honest, transparent overview of the technical constraints, architectural boundaries, and known limitations of the **ARCADE_** platform.

---

## 1. Client-Side State & Storage Trust Model

- **No Server Authority:** High scores and player progress reside entirely in the user's browser `localStorage`.
- **Cheat Vulnerability:** Because game simulation runs on the client in JavaScript, malicious users can open browser DevTools, inspect memory, or modify `localStorage` values directly.
- **No Global Leaderboards:** ARCADE_ does not currently host an authenticated backend leaderboard database.

---

## 2. Canvas 2D Accessibility (a11y) Constraints

- **Black-Box Framebuffer:** Assistive technologies (screen readers like NVDA, VoiceOver, JAWS) cannot inspect canvas-drawn shapes, text, or sprites.
- **Mitigation:** While navigational UI, search bars, and metadata are fully accessible semantic HTML, real-time in-canvas gameplay relies primarily on visual rendering and procedural audio cues.

---

## 3. Browser Audio & Autoplay Policies

- **User Gesture Requirement:** Web Audio contexts cannot emit sound until the user performs an initial physical gesture (click, tap, keypress).
- **Tab Throttling:** When a browser tab is placed in the background, browser engines throttle audio synthesis timers and suspend requestAnimationFrame callbacks.

---

## 4. Single-Threaded Simulation Performance

- **Main Thread Execution:** The 60Hz physics accumulator runs on the browser's main JavaScript thread. Heavy background computations (e.g. searching massive game trees or simulating $> 5,000$ physics bodies) can cause frame jitter if not properly optimized or pooled.
- **Garbage Collection Spikes:** Failure to use `ObjectPool<T>` in hot loops can cause noticeable micro-stutter when the browser's garbage collector sweeps heap allocations.

---

## 5. WebGL Shaders & 3D Acceleration

- **Canvas 2D Only:** ARCADE_ does not implement custom GLSL vertex/fragment shaders. Post-processing effects (such as CRT scanlines and vignettes) are achieved via hardware-accelerated CSS filters rather than WebGL render passes.
